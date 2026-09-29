import test from 'node:test';
import assert from 'node:assert/strict';
import { getFirstSuccessfulImageRef } from './personReplacementCharacterAppearanceLocalization.js';

const MISSING_MESSAGE = '图像生成结果缺少可用图片';

test('appearanceLocalization: 完全无可取项时抛出统一的缺图错误', () => {
  for (const input of [undefined, null, [], {}, { images: [] }, '', 0, false, NaN]) {
    assert.throws(() => getFirstSuccessfulImageRef(input), { message: MISSING_MESSAGE }, String(input));
  }
});

test('appearanceLocalization: localPath 命中即返回归一化后的字符串', () => {
  assert.equal(getFirstSuccessfulImageRef([{ localPath: ' data/uploads/a.png ' }]), 'data/uploads/a.png');
  assert.equal(getFirstSuccessfulImageRef([{ localPath: 'data\\uploads\\b.png' }]), 'data/uploads/b.png');
  assert.equal(
    getFirstSuccessfulImageRef([{ localPath: '/data/uploads/c.png?t=1#x' }]),
    'data/uploads/c.png',
  );
  assert.equal(typeof getFirstSuccessfulImageRef([{ localPath: 'output/c.mp4' }]), 'string');
});

test('appearanceLocalization: 无 localPath 时按 原始/展示/URL 顺序回退', () => {
  const cases = [
    [{ originalLocalPath: 'data/assets/o.png' }, 'data/assets/o.png'],
    [{ displayLocalPath: 'output/d.png' }, 'output/d.png'],
    [{ imageUrl: 'data/uploads/i.png' }, 'data/uploads/i.png'],
    [{ url: 'output/u.mp4' }, 'output/u.mp4'],
    [{ thumbUrl: 'data/uploads/t.png' }, 'data/uploads/t.png'],
    [{ localPath: 'blob:x', originalLocalPath: 'data/assets/o.png' }, 'data/assets/o.png'],
    [{ url: 'blob:x', displayLocalPath: 'output/d.png' }, 'output/d.png'],
  ];
  for (const [item, expected] of cases) {
    assert.equal(getFirstSuccessfulImageRef([item]), expected, JSON.stringify(item));
  }
});

test('appearanceLocalization: http 来源仅接受本机地址，外链被丢弃', () => {
  assert.equal(
    getFirstSuccessfulImageRef([{ imageUrl: 'http://localhost:5173/output/v.mp4' }]),
    'output/v.mp4',
  );
  assert.equal(
    getFirstSuccessfulImageRef([{ imageUrl: 'http://127.0.0.1:8080/data/uploads/a.png' }]),
    'data/uploads/a.png',
  );
  assert.equal(
    getFirstSuccessfulImageRef([{ imageUrl: 'http://0.0.0.0/data/assets/a.png' }]),
    'data/assets/a.png',
  );
  for (const link of [
    'https://example.com/output/v.mp4',
    'http://cdn.example.com/data/uploads/a.png',
    'https://localhost.evil.com/output/v.mp4',
  ]) {
    assert.throws(() => getFirstSuccessfulImageRef([{ imageUrl: link }]), { message: MISSING_MESSAGE }, link);
  }
});

test('appearanceLocalization: 目录穿越、协议前缀、绝对路径与越界目录一律拒绝', () => {
  for (const path of [
    'data/uploads/../secret.png',
    '../data/uploads/a.png',
    'file:///C:/x.png',
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
    'blob:http://localhost/x',
    'C:/data/uploads/a.png',
    '//data/uploads/a.png',
    '/etc/passwd',
    'other/dir/a.png',
    'temp/a.png',
    '   ',
  ]) {
    assert.throws(
      () => getFirstSuccessfulImageRef([{ localPath: path }]),
      { message: MISSING_MESSAGE },
      path,
    );
    assert.throws(
      () => getFirstSuccessfulImageRef([{ originalLocalPath: path }]),
      { message: MISSING_MESSAGE },
      path,
    );
  }
});

test('appearanceLocalization: error 项被跳过，只取第一个成功项', () => {
  assert.throws(() => getFirstSuccessfulImageRef([{ error: 'boom', localPath: 'data/uploads/a.png' }]), {
    message: 'boom',
  });
  assert.equal(
    getFirstSuccessfulImageRef([
      { error: 'e' },
      { imageUrl: 'data/uploads/second.png' },
      { imageUrl: 'data/uploads/third.png' },
    ]),
    'data/uploads/second.png',
  );
  assert.equal(
    getFirstSuccessfulImageRef([{ error: '', localPath: 'data/uploads/a.png' }]),
    'data/uploads/a.png',
  );
  // 原始空白 error 会被 spread 保留、被成功项过滤剔除，但取错误文案时又被 trim 掉
  assert.throws(() => getFirstSuccessfulImageRef([{ error: '   ', localPath: 'data/uploads/b.png' }]), {
    message: MISSING_MESSAGE,
  });
});

test('appearanceLocalization: localSaveError 优先于通用文案且会被 trim', () => {
  assert.throws(
    () => getFirstSuccessfulImageRef([{ localPath: 'javascript:1', localSaveError: ' 保存失败 ' }]),
    { message: '保存失败' },
  );
  assert.throws(() => getFirstSuccessfulImageRef([{ localPath: 'javascript:1', localSaveError: '   ' }]), {
    message: MISSING_MESSAGE,
  });
  assert.throws(() => getFirstSuccessfulImageRef([{ localPath: 'javascript:1', localSaveError: 0 }]), {
    message: MISSING_MESSAGE,
  });
});

test('appearanceLocalization: 顶层 localSaveError 在归一化中被丢弃，回落到通用文案', () => {
  assert.throws(
    () => getFirstSuccessfulImageRef({ outputType: 'image', items: [{}], localSaveError: '顶层保存失败' }),
    { message: MISSING_MESSAGE },
  );
  assert.throws(() => getFirstSuccessfulImageRef({ images: [], localSaveError: '顶层保存失败' }), {
    message: MISSING_MESSAGE,
  });
});

test('appearanceLocalization: 字符串项触发归一化断言（字符串分支不可达）', () => {
  assert.throws(() => getFirstSuccessfulImageRef(['data/uploads/a.png']), {
    message: '[imageGenerationResult] item must be an object',
  });
  assert.throws(() => getFirstSuccessfulImageRef([{ url: 'output/a.mp4' }, 42]), {
    message: '[imageGenerationResult] item must be an object',
  });
});

test('appearanceLocalization: 兼容单对象、images 集合与 localPath 单字段对象', () => {
  assert.equal(
    getFirstSuccessfulImageRef({ imageUrl: 'data/uploads/single.png' }),
    'data/uploads/single.png',
  );
  assert.equal(
    getFirstSuccessfulImageRef({ localPath: 'data/uploads/one-off.png' }),
    'data/uploads/one-off.png',
  );
  assert.equal(getFirstSuccessfulImageRef({ images: [{ url: 'output/legacy.mp4' }] }), 'output/legacy.mp4');
  assert.equal(
    getFirstSuccessfulImageRef({ outputType: 'image', items: [{ url: 'output/typed.mp4' }] }),
    'output/typed.mp4',
  );
  // 集合字段为空数组时先短路，同级 error 不被采用
  assert.throws(() => getFirstSuccessfulImageRef({ images: [], error: '整体失败' }), {
    message: MISSING_MESSAGE,
  });
});

test('appearanceLocalization: 入参不被改动', () => {
  const item = { localPath: 'data/uploads/a.png', imageUrl: 'data/uploads/a.png' };
  const input = [item];
  assert.equal(getFirstSuccessfulImageRef(input), 'data/uploads/a.png');
  assert.deepEqual(input, [{ localPath: 'data/uploads/a.png', imageUrl: 'data/uploads/a.png' }]);
  assert.equal(Object.keys(item).length, 2);
});
