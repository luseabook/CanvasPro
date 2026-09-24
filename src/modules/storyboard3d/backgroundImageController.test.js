import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES,
  createStoryboard3DBackgroundImageController,
  validateStoryboard3DBackgroundImageFile,
} from './backgroundImageController.js';

function imageFile(overrides = {}) {
  return { name: 'bg.png', type: 'image/png', size: 1024, ...overrides };
}

function stubUrlApi() {
  const created = [];
  const revoked = [];
  let counter = 0;
  return {
    created,
    revoked,
    createObjectURL(file) {
      counter += 1;
      const url = `blob:b89-${counter}:${file?.name ?? ''}`;
      created.push(url);
      return url;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    },
  };
}

test('背景图片控制器：默认体积上限为 64 MiB', () => {
  assert.equal(DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES, 64 * 1024 * 1024);
});

test('背景图片校验：合法文件无错误', () => {
  const result = validateStoryboard3DBackgroundImageFile(imageFile());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('背景图片校验：文件名与类型与空文件分别报错', () => {
  const blank = validateStoryboard3DBackgroundImageFile({ name: '   ', type: '', size: 0 });
  assert.equal(blank.ok, false);
  assert.deepEqual(
    blank.errors.map((entry) => entry.code),
    ['BACKGROUND_FILE_NAME_REQUIRED', 'BACKGROUND_FILE_TYPE_INVALID', 'BACKGROUND_FILE_EMPTY'],
  );
  assert.equal(blank.errors[0].message, '背景图片缺少文件名。');
  assert.equal(blank.errors[1].message, '请选择图片文件。');
  assert.equal(blank.errors[2].message, '背景图片为空。');

  const wrongType = validateStoryboard3DBackgroundImageFile(imageFile({ type: 'text/plain' }));
  assert.deepEqual(
    wrongType.errors.map((entry) => entry.code),
    ['BACKGROUND_FILE_TYPE_INVALID'],
  );
});

test('背景图片校验：超过上限时按 MB 报错且空文件不叠加超限', () => {
  const oversized = validateStoryboard3DBackgroundImageFile(imageFile({ size: 3 * 1024 * 1024 }), {
    maxBytes: 2 * 1024 * 1024,
  });
  assert.equal(oversized.ok, false);
  assert.deepEqual(
    oversized.errors.map((entry) => entry.code),
    ['BACKGROUND_FILE_TOO_LARGE'],
  );
  assert.equal(oversized.errors[0].message, '背景图片不能超过 2 MB。');

  const empty = validateStoryboard3DBackgroundImageFile(imageFile({ size: 0 }), { maxBytes: 0 });
  assert.deepEqual(
    empty.errors.map((entry) => entry.code),
    ['BACKGROUND_FILE_EMPTY'],
  );
});

test('背景图片控制器：加载成功返回快照并可独立读取', () => {
  const urlApi = stubUrlApi();
  const controller = createStoryboard3DBackgroundImageController({ urlApi });
  const snapshot = controller.load(imageFile({ name: 'scene.jpg', type: 'image/jpeg', size: 2048 }));
  assert.deepEqual(snapshot, {
    imageUrl: 'blob:b89-1:scene.jpg',
    fileName: 'scene.jpg',
    mimeType: 'image/jpeg',
    byteLength: 2048,
    sourceKind: 'runtime-object-url',
  });
  assert.deepEqual(urlApi.created, ['blob:b89-1:scene.jpg']);
  assert.deepEqual(urlApi.revoked, []);

  snapshot.fileName = 'tampered';
  assert.equal(controller.getSnapshot().fileName, 'scene.jpg');
  assert.notEqual(controller.getSnapshot(), snapshot);
});

test('背景图片控制器：重新加载释放上一个对象地址，clear 后快照为空', () => {
  const urlApi = stubUrlApi();
  const controller = createStoryboard3DBackgroundImageController({ urlApi });
  controller.load(imageFile({ name: 'a.png' }));
  controller.load(imageFile({ name: 'b.png' }));
  assert.deepEqual(urlApi.revoked, ['blob:b89-1:a.png']);
  assert.equal(controller.getSnapshot().fileName, 'b.png');

  controller.clear();
  assert.deepEqual(urlApi.revoked, ['blob:b89-1:a.png', 'blob:b89-2:b.png']);
  assert.equal(controller.getSnapshot(), null);
});

test('背景图片控制器：校验失败抛出带 code 与 details 的错误', () => {
  const urlApi = stubUrlApi();
  const controller = createStoryboard3DBackgroundImageController({ urlApi, maxBytes: 1024 });
  assert.throws(
    () => controller.load({ name: '', type: '', size: 0 }),
    (error) => {
      assert.equal(error.code, 'BACKGROUND_FILE_NAME_REQUIRED');
      assert.equal(error.message, '背景图片缺少文件名。 请选择图片文件。 背景图片为空。');
      assert.equal(error.details.ok, false);
      assert.equal(error.details.errors.length, 3);
      return true;
    },
  );
  assert.deepEqual(urlApi.created, []);
  assert.equal(controller.getSnapshot(), null);
});

test('背景图片控制器：不支持对象地址时抛出，销毁后拒绝加载', () => {
  const unsupported = createStoryboard3DBackgroundImageController({ urlApi: {} });
  assert.throws(() => unsupported.load(imageFile()), /Browser object URL support is unavailable\./);

  const urlApi = stubUrlApi();
  const controller = createStoryboard3DBackgroundImageController({ urlApi });
  controller.load(imageFile({ name: 'once.png' }));
  controller.dispose();
  assert.deepEqual(urlApi.revoked, ['blob:b89-1:once.png']);
  assert.throws(() => controller.load(imageFile()), /has been disposed\./);
});
