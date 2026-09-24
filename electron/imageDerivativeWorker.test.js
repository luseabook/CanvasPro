import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createImageDerivativeWorker } from './imageDerivativeWorker.js';

function createFakeBrowserWindow(overrides = {}) {
  const instances = [];
  class FakeBrowserWindow {
    constructor(options) {
      this.options = options;
      this.loadedUrls = [];
      this.destroyed = false;
      this.executed = [];
      instances.push(this);
    }
    async loadURL(url) {
      this.loadedUrls.push(url);
      if (overrides.loadUrlThrows) throw new Error('load failed');
    }
    isDestroyed() {
      return overrides.destroyedOnQuery ? true : this.destroyed;
    }
    destroy() {
      this.destroyed = true;
    }
    get webContents() {
      return {
        executeJavaScript: async (code) => {
          this.executed.push(code);
          if (overrides.executeJavaScript) return overrides.executeJavaScript(code, this);
          return {
            originalWidth: 64,
            originalHeight: 32,
            display: Buffer.from('display-bytes').toString('base64'),
            thumb: Buffer.from('thumb-bytes').toString('base64'),
          };
        },
      };
    }
  }
  return { BrowserWindow: FakeBrowserWindow, instances: instances };
}

function createTempImage(name = 'picture.png', contents = 'png-bytes') {
  const filePath = path.join(mkdtempSync(path.join(tmpdir(), 'aic-image-derivative-')), name);
  writeFileSync(filePath, contents);
  return filePath;
}

test('a successful render returns decoded PNG buffers and destroys the window', async () => {
  const { BrowserWindow, instances } = createFakeBrowserWindow(),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow }),
    result = await worker(createTempImage());
  assert.equal(result.originalWidth, 64);
  assert.equal(result.originalHeight, 32);
  assert.ok(Buffer.isBuffer(result.displayPng));
  assert.ok(Buffer.isBuffer(result.thumbPng));
  assert.equal(result.displayPng.toString('utf8'), 'display-bytes');
  assert.equal(result.thumbPng.toString('utf8'), 'thumb-bytes');
  assert.equal(instances.length, 1);
  assert.equal(instances[0].destroyed, true);
  assert.deepEqual(instances[0].options, {
    show: false,
    width: 1,
    height: 1,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
});

test('the worker loads a locked-down data URL and serializes the renderer function', async () => {
  const { BrowserWindow, instances } = createFakeBrowserWindow(),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow }),
    sourcePath = createTempImage('clip.webp', 'webp-bytes');
  await worker(sourcePath);
  const [window] = instances;
  assert.deepEqual(window.loadedUrls, [
    `data:text/html,<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:;">`,
  ]);
  const [code] = window.executed;
  assert.ok(code.startsWith('(async function renderImageDerivativePayload'));
  assert.ok(code.endsWith(')'));
  assert.ok(code.includes('function renderImageDerivativePayload'));
  assert.ok(code.includes('Invalid image dimensions'));
  const dataUrl = 'data:image/webp;base64,' + Buffer.from('webp-bytes').toString('base64');
  assert.ok(code.includes(JSON.stringify(dataUrl)));
});

test('each extension picks its own mime type and unknown ones fall back to png', async () => {
  const { BrowserWindow, instances } = createFakeBrowserWindow(),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow });
  const cases = [
    ['a.svg', 'image/svg+xml'],
    ['a.jpg', 'image/jpeg'],
    ['a.JPEG', 'image/jpeg'],
    ['a.gif', 'image/gif'],
    ['a.avif', 'image/avif'],
    ['a.bmp', 'image/bmp'],
    ['a.png', 'image/png'],
    ['a.tiff', 'image/png'],
  ];
  for (const [name, mime] of cases) {
    await worker(createTempImage(name, 'bytes'));
    const code = instances.at(-1).executed[0];
    const expected = 'data:' + mime + ';base64,' + Buffer.from('bytes').toString('base64');
    assert.ok(code.includes(JSON.stringify(expected)), `${name} should map to ${mime}`);
  }
});

test('a closed window aborts before running any script', async () => {
  const { BrowserWindow } = createFakeBrowserWindow({ destroyedOnQuery: true }),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow });
  await assert.rejects(worker(createTempImage()), /Image derivative worker closed/);
});

test('the timeout rejects and still destroys the window', async () => {
  const { BrowserWindow, instances } = createFakeBrowserWindow({
      executeJavaScript: () => new Promise(() => {}),
    }),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow, timeoutMs: 20 });
  await assert.rejects(worker(createTempImage()), /Image derivative worker timed out/);
  assert.equal(instances[0].destroyed, true);
});

test('a failing render still destroys the window and rethrows', async () => {
  const { BrowserWindow, instances } = createFakeBrowserWindow({ loadUrlThrows: true }),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow });
  await assert.rejects(worker(createTempImage()), /load failed/);
  assert.equal(instances[0].destroyed, true);
});

test('a missing source file rejects and cleans up the window', async () => {
  const { BrowserWindow, instances } = createFakeBrowserWindow(),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow });
  await assert.rejects(worker(path.join(tmpdir(), 'aic-does-not-exist', 'nope.png')));
  assert.equal(instances[0].destroyed, true);
});

test('concurrent renders are serialized through one keyed operation', async () => {
  let active = 0;
  let maxActive = 0;
  const { BrowserWindow, instances } = createFakeBrowserWindow({
      executeJavaScript: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return { originalWidth: 1, originalHeight: 1, display: '', thumb: '' };
      },
    }),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow }),
    sourcePath = createTempImage();
  await Promise.all([worker(sourcePath), worker(sourcePath), worker(sourcePath)]);
  assert.equal(maxActive, 1);
  assert.equal(instances.length, 3);
  assert.ok(instances.every((instance) => instance.destroyed));
});

test('an empty base64 payload decodes to an empty buffer', async () => {
  const { BrowserWindow } = createFakeBrowserWindow({
      executeJavaScript: async () => ({ originalWidth: 2, originalHeight: 2, display: '', thumb: '' }),
    }),
    worker = createImageDerivativeWorker({ BrowserWindow: BrowserWindow }),
    result = await worker(createTempImage());
  assert.equal(result.displayPng.length, 0);
});
