import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import {
  resolveChromeBrowserWorkerProfileDir,
  launchChromeBrowserWorker,
  __chromeBrowserWorkerForTest,
} from './chromeBrowserWorker.js';

const { terminateProcessTree } = __chromeBrowserWorkerForTest;
const PROFILE_OVERRIDE_KEY = 'AIC_CHROME_BROWSER_NODE_PROFILE_DIR';

function createSpy() {
  const calls = [];
  const spy = (...args) => {
    calls.push(args);
  };
  spy.calls = calls;
  return spy;
}

function createSpawnDouble(returnValue) {
  const calls = [];
  const spawnProcess = (command, args, options) => {
    calls.push([command, args, options]);
    return returnValue;
  };
  spawnProcess.calls = calls;
  return spawnProcess;
}

function createFakeChild({ pid = 4242, stdio } = {}) {
  const child = new EventEmitter();
  child.pid = pid;
  if (stdio !== undefined) child.stdio = stdio;
  child.kill = createSpy();
  return child;
}

test('terminateProcessTree ignores a falsy process', () => {
  assert.doesNotThrow(() => terminateProcessTree(null));
  assert.doesNotThrow(() => terminateProcessTree(undefined));
  assert.doesNotThrow(() => terminateProcessTree());
});

test('a win32 child without a positive integer pid falls back to kill', () => {
  for (const child of [
    { kill: createSpy() },
    { pid: 0, kill: createSpy() },
    { pid: -1, kill: createSpy() },
    { pid: '1234', kill: createSpy() },
    { pid: 1234.5, kill: createSpy() },
    { pid: Number.NaN, kill: createSpy() },
  ]) {
    terminateProcessTree(child, 'win32');
    assert.equal(child.kill.calls.length, 1, 'pid=' + String(child.pid));
  }
});

test('a non-win32 child always uses kill and never the taskkill tree form', () => {
  for (const platform of ['linux', 'darwin', 'freebsd']) {
    const child = createFakeChild();
    terminateProcessTree(child, platform);
    assert.equal(child.kill.calls.length, 1, platform);
  }
});

test('a throwing or absent kill is swallowed', () => {
  assert.doesNotThrow(() =>
    terminateProcessTree(
      {
        pid: 0,
        kill() {
          throw new Error('kill exploded');
        },
      },
      'win32',
    ),
  );
  assert.doesNotThrow(() => terminateProcessTree({ pid: 0 }, 'win32'));
});

test('the profile override environment variable wins and is resolved', () => {
  const override = path.join('tmp', 'override-profile');
  assert.equal(
    resolveChromeBrowserWorkerProfileDir({
      mainProfileDir: path.join('tmp', 'main-profile'),
      env: { [PROFILE_OVERRIDE_KEY]: '  ' + override + '  ' },
    }),
    path.resolve(override),
  );
});

test('a blank or absent override derives a sibling profile directory', () => {
  const mainProfileDir = path.join(path.resolve('tmp'), 'main-profile');
  for (const env of [{}, { [PROFILE_OVERRIDE_KEY]: '' }, { [PROFILE_OVERRIDE_KEY]: '   ' }]) {
    assert.equal(
      resolveChromeBrowserWorkerProfileDir({ mainProfileDir: mainProfileDir, env: env }),
      path.join(path.dirname(mainProfileDir), 'chrome-browser-node-profile'),
    );
  }
});

test('a missing main profile directory falls back to the working directory', () => {
  assert.equal(
    resolveChromeBrowserWorkerProfileDir({ env: {} }),
    path.join(path.dirname(path.resolve(process.cwd())), 'chrome-browser-node-profile'),
  );
});

test('a whitespace-only main profile directory is truthy and resolves against the working directory', () => {
  // Ported behavior: String(mainProfileDir || cwd) keeps the spaces, so the derived
  // directory is the working directory itself rather than its parent.
  assert.equal(
    resolveChromeBrowserWorkerProfileDir({ mainProfileDir: '   ', env: {} }),
    path.join(path.resolve(process.cwd()), 'chrome-browser-node-profile'),
  );
});

test('launchChromeBrowserWorker rejects a blank browser executable before touching anything', () => {
  const mkdir = createSpy(),
    spawnProcess = createSpy();
  for (const browserPath of [undefined, '', '   ', null]) {
    assert.throws(
      () => launchChromeBrowserWorker({ browserPath: browserPath, mkdir: mkdir, spawnProcess: spawnProcess }),
      { message: 'Chrome browser worker executable is required' },
    );
  }
  assert.equal(mkdir.calls.length, 0);
  assert.equal(spawnProcess.calls.length, 0);
});

test('launchChromeBrowserWorker creates the profile directory and spawns headless chrome', () => {
  const mkdir = createSpy(),
    child = createFakeChild({ stdio: ['ignore', 'ignore', 'ignore', 'PIPE_W', 'PIPE_R'] }),
    spawnProcess = createSpawnDouble(child);
  const profileDir = path.join(path.resolve('tmp'), 'main-profile');
  const worker = launchChromeBrowserWorker({
    browserPath: '  /opt/chrome/chrome  ',
    mainProfileDir: profileDir,
    env: {},
    platform: 'win32',
    mkdir: mkdir,
    spawnProcess: spawnProcess,
    terminateProcess: createSpy(),
  });
  const expectedProfileDir = path.join(path.dirname(profileDir), 'chrome-browser-node-profile');
  assert.deepEqual(mkdir.calls, [[expectedProfileDir, { recursive: true }]]);
  assert.equal(spawnProcess.calls.length, 1);
  const [command, args, options] = spawnProcess.calls[0];
  assert.equal(command, '/opt/chrome/chrome');
  assert.deepEqual(args, [
    '--user-data-dir=' + expectedProfileDir,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    '--remote-debugging-pipe',
    'about:blank',
  ]);
  assert.deepEqual(options, { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true });
  assert.equal(worker.browserPath, '/opt/chrome/chrome');
  assert.equal(worker.profileDir, expectedProfileDir);
  assert.equal(worker.process, child);
  assert.deepEqual(worker.devToolsPipe, { writable: 'PIPE_W', readable: 'PIPE_R' });
});

test('launchChromeBrowserWorker exposes no devToolsPipe without both pipe descriptors', () => {
  for (const stdio of [
    undefined,
    ['ignore', 'ignore', 'ignore'],
    ['ignore', 'ignore', 'ignore', 'PIPE_W'],
    [],
  ]) {
    const child = createFakeChild({ stdio: stdio });
    const worker = launchChromeBrowserWorker({
      browserPath: '/opt/chrome/chrome',
      mainProfileDir: path.resolve('tmp', 'main-profile'),
      env: {},
      mkdir: createSpy(),
      spawnProcess: () => child,
      terminateProcess: createSpy(),
    });
    assert.equal(worker.devToolsPipe, null, JSON.stringify(stdio));
  }
});

test('launchChromeBrowserWorker forwards exit and error events to its callbacks', () => {
  const child = createFakeChild({ stdio: ['ignore', 'ignore', 'ignore', 'W', 'R'] }),
    exits = [],
    errors = [];
  launchChromeBrowserWorker({
    browserPath: '/opt/chrome/chrome',
    mainProfileDir: path.resolve('tmp', 'main-profile'),
    env: {},
    mkdir: createSpy(),
    spawnProcess: () => child,
    terminateProcess: createSpy(),
    onExit: (payload) => exits.push(payload),
    onError: (error) => errors.push(error),
  });
  const crash = new Error('spawn failed');
  child.emit('exit', 3, 'SIGTERM');
  child.emit('error', crash);
  assert.deepEqual(exits, [{ code: 3, signal: 'SIGTERM' }]);
  assert.deepEqual(errors, [crash]);
});

test('a launch without callbacks still tolerates exit and error events', () => {
  const child = createFakeChild({ stdio: ['ignore', 'ignore', 'ignore', 'W', 'R'] });
  launchChromeBrowserWorker({
    browserPath: '/opt/chrome/chrome',
    mainProfileDir: path.resolve('tmp', 'main-profile'),
    env: {},
    mkdir: createSpy(),
    spawnProcess: () => child,
    terminateProcess: createSpy(),
  });
  assert.doesNotThrow(() => child.emit('exit', 0, null));
  assert.doesNotThrow(() => child.emit('error', new Error('ignored')));
});

test('dispose terminates the child once and passes the platform through', () => {
  const terminateProcess = createSpy(),
    child = createFakeChild({ stdio: ['ignore', 'ignore', 'ignore', 'W', 'R'] });
  const worker = launchChromeBrowserWorker({
    browserPath: '/opt/chrome/chrome',
    mainProfileDir: path.resolve('tmp', 'main-profile'),
    env: {},
    platform: 'linux',
    mkdir: createSpy(),
    spawnProcess: () => child,
    terminateProcess: terminateProcess,
  });
  worker.dispose();
  worker.dispose();
  assert.equal(terminateProcess.calls.length, 1);
  assert.deepEqual(terminateProcess.calls[0], [child, 'linux']);
});

test('dispose defaults the platform to the current one', () => {
  const terminateProcess = createSpy(),
    child = createFakeChild({ stdio: ['ignore', 'ignore', 'ignore', 'W', 'R'] });
  const worker = launchChromeBrowserWorker({
    browserPath: '/opt/chrome/chrome',
    mainProfileDir: path.resolve('tmp', 'main-profile'),
    env: {},
    mkdir: createSpy(),
    spawnProcess: () => child,
    terminateProcess: terminateProcess,
  });
  worker.dispose();
  assert.deepEqual(terminateProcess.calls[0], [child, process.platform]);
});

test('the worker profile override reaches the launch flags', () => {
  const override = path.resolve('tmp', 'worker-override');
  const child = createFakeChild({ stdio: ['ignore', 'ignore', 'ignore', 'W', 'R'] }),
    mkdir = createSpy();
  const worker = launchChromeBrowserWorker({
    browserPath: '/opt/chrome/chrome',
    mainProfileDir: path.resolve('tmp', 'main-profile'),
    env: { [PROFILE_OVERRIDE_KEY]: override },
    mkdir: mkdir,
    spawnProcess: (command, args) => {
      assert.equal(args[0], '--user-data-dir=' + override);
      return child;
    },
    terminateProcess: createSpy(),
  });
  assert.deepEqual(mkdir.calls, [[override, { recursive: true }]]);
  assert.equal(worker.profileDir, override);
});
