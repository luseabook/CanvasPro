import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createOpenJianyingOperation, findJianyingExecutable } from './jianyingExportAction.js';

test('findJianyingExecutable only resolves on Windows absolute LOCALAPPDATA', async () => {
  assert.equal(await findJianyingExecutable({ platform: 'darwin', localAppData: 'C:\\Users\\a\\AppData\\Local' }), '');
  assert.equal(await findJianyingExecutable({ platform: 'win32', localAppData: 'relative/local' }), '');
  const expected = path.join('C:\\Users\\a\\AppData\\Local', 'JianyingPro', 'Apps', 'JianyingPro.exe');
  assert.equal(
    await findJianyingExecutable({
      platform: 'win32',
      localAppData: 'C:\\Users\\a\\AppData\\Local',
      inspect: async () => ({ isFile: () => true }),
    }),
    expected,
  );
  assert.equal(
    await findJianyingExecutable({
      platform: 'win32',
      localAppData: 'C:\\Users\\a\\AppData\\Local',
      inspect: async () => ({ isFile: () => false }),
    }),
    '',
  );
  assert.equal(
    await findJianyingExecutable({
      platform: 'win32',
      localAppData: 'C:\\Users\\a\\AppData\\Local',
      inspect: async () => {
        throw new Error('ENOENT');
      },
    }),
    '',
  );
});

test('createOpenJianyingOperation reports missing launcher and open failures', async () => {
  const opened = [];
  const missing = createOpenJianyingOperation({
    openPath: async (target) => (opened.push(target), ''),
    findExecutable: async () => '',
  });
  const missingResult = await missing();
  assert.equal(missingResult.success, false);
  assert.match(missingResult.error, /未找到剪映启动程序/);
  assert.deepEqual(opened, []);

  const ok = createOpenJianyingOperation({
    openPath: async (target) => (opened.push(target), ''),
    findExecutable: async () => 'C:\\JianyingPro.exe',
  });
  assert.deepEqual(await ok(), { success: true });
  assert.deepEqual(opened, ['C:\\JianyingPro.exe']);

  // `shell.openPath` resolves with a non-empty string when it fails.
  const failed = createOpenJianyingOperation({
    openPath: async () => 'no handler',
    findExecutable: async () => 'C:\\JianyingPro.exe',
  });
  const failedResult = await failed();
  assert.equal(failedResult.success, false);
  assert.match(failedResult.error, /暂时无法自动打开剪映/);

  const throwing = createOpenJianyingOperation({
    openPath: async () => {
      throw new Error('boom');
    },
    findExecutable: async () => 'C:\\JianyingPro.exe',
  });
  assert.equal((await throwing()).success, false);
});
