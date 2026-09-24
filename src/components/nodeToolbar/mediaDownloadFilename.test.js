import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNodeMediaDownloadFilename } from './mediaDownloadFilename.js';

test('mediaDownloadFilename: 关闭原名下载时以节点名 + 默认扩展名', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({ nodeName: 'My Node', kind: 'image', useOriginalFilename: false }),
    'My Node.png',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({ nodeName: 'My Node', kind: 'video', useOriginalFilename: false }),
      'My Node.mp4',
    ),
    assert.equal(
      resolveNodeMediaDownloadFilename({ nodeName: 'My Node', kind: 'audio', useOriginalFilename: false }),
      'My Node.mp3',
    ));
});

test('mediaDownloadFilename: 未知类型回退 bin', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({ nodeName: 'N', kind: 'document', useOriginalFilename: false }),
    'N.bin',
  ),
    assert.equal(resolveNodeMediaDownloadFilename({ nodeName: 'N', useOriginalFilename: false }), 'N.bin'));
});

test('mediaDownloadFilename: 类型名大小写与空白被归一化', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({ nodeName: 'N', kind: ' IMAGE ', useOriginalFilename: false }),
    'N.png',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({ nodeName: 'N', kind: 'Video', useOriginalFilename: false }),
      'N.mp4',
    ));
});

test('mediaDownloadFilename: 扩展名优先取 fileName 且与目标类型匹配', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      fileName: 'photo.jpeg',
      kind: 'image',
      useOriginalFilename: false,
    }),
    'N.jpeg',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        fileName: 'PHOTO.JPEG',
        kind: 'image',
        useOriginalFilename: false,
      }),
      'N.jpeg',
    ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        fileName: 'a/b/c.webm',
        kind: 'video',
        useOriginalFilename: false,
      }),
      'N.webm',
    ));
});

test('mediaDownloadFilename: 类型不匹配的扩展名被丢弃并回退默认值', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      fileName: 'clip.mkv',
      kind: 'image',
      useOriginalFilename: false,
    }),
    'N.png',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        fileName: 'x.png',
        kind: 'video',
        useOriginalFilename: false,
      }),
      'N.mp4',
    ));
});

test('mediaDownloadFilename: 超过 10 字符的扩展名不识别', () => {
  assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      fileName: 'f.verylongext',
      kind: 'image',
      useOriginalFilename: false,
    }),
    'N.png',
  );
});

test('mediaDownloadFilename: 无 fileName 时从 sources 推断扩展名', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      kind: 'video',
      sources: ['https://cdn/a/b.webm'],
      useOriginalFilename: false,
    }),
    'N.webm',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        kind: 'video',
        sources: ['https://cdn/a/b.mkv', 'https://cdn/a/c.mp4'],
        useOriginalFilename: false,
      }),
      'N.mkv',
    ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        kind: 'audio',
        sources: 'https://cdn/a/x.ogg',
        useOriginalFilename: false,
      }),
      'N.ogg',
    ));
});

test('mediaDownloadFilename: sources 无可识别扩展名时回退默认值', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      kind: 'image',
      sources: ['https://cdn/a/b', 'blob:xyz'],
      useOriginalFilename: false,
    }),
    'N.png',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        kind: 'image',
        sources: [],
        useOriginalFilename: false,
      }),
      'N.png',
    ));
});

test('mediaDownloadFilename: 节点名中的非法字符被替换为下划线', () => {
  assert.equal(
    resolveNodeMediaDownloadFilename({ nodeName: 'a/b:c*d?e', kind: 'image', useOriginalFilename: false }),
    'a_b_c_d_e.png',
  );
});

test('mediaDownloadFilename: 文件名总长被截到 160 字符', () => {
  const long = 'a'.repeat(300),
    name = resolveNodeMediaDownloadFilename({ nodeName: long, kind: 'image', useOriginalFilename: false });
  (assert.equal(name.length, 160), assert.ok(name.endsWith('.png')));
});

test('mediaDownloadFilename: 空节点名下回退 fallbackBase', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: '  ',
      kind: 'image',
      fallbackBase: 'fallback',
      useOriginalFilename: false,
    }),
    'fallback.png',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({ nodeName: '', kind: 'image', useOriginalFilename: false }),
      'image.png',
    ));
});

test('mediaDownloadFilename: 开启原名下载时优先 fileName 基名', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      fileName: 'orig.png',
      kind: 'image',
      useOriginalFilename: true,
    }),
    'orig.png',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        fileName: 'dir/sub/orig.webp',
        kind: 'image',
        useOriginalFilename: true,
      }),
      'orig.webp',
    ));
});

test('mediaDownloadFilename: 开启原名下载且无 fileName 时取 sources 基名', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      kind: 'image',
      sources: ['https://cdn/a/b/c.webp'],
      useOriginalFilename: true,
    }),
    'c.webp',
  ),
    assert.equal(
      resolveNodeMediaDownloadFilename({
        nodeName: 'N',
        kind: 'image',
        sources: ['https://cdn/a/e%20f.png'],
        useOriginalFilename: true,
      }),
      'e f.png',
    ));
});

test('mediaDownloadFilename: 开启原名下载时忽略无可识别扩展名的 source', () => {
  assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      kind: 'image',
      sources: ['https://cdn/a/b', 'https://cdn/a/ok.gif'],
      useOriginalFilename: true,
    }),
    'ok.gif',
  );
});

test('mediaDownloadFilename: 开启原名下载且各来源皆空时回退', () => {
  (assert.equal(
    resolveNodeMediaDownloadFilename({ kind: 'audio', fallbackBase: 'fb', useOriginalFilename: true }),
    'fb.mp3',
  ),
    assert.equal(resolveNodeMediaDownloadFilename({ kind: 'audio', useOriginalFilename: true }), 'audio.mp3'),
    assert.equal(resolveNodeMediaDownloadFilename({ useOriginalFilename: true }), 'media.bin'));
});

test('mediaDownloadFilename: blob/data 前缀不参与基名推断', () => {
  assert.equal(
    resolveNodeMediaDownloadFilename({
      nodeName: 'N',
      kind: 'image',
      sources: ['blob:abc.png'],
      useOriginalFilename: true,
    }),
    'N.png',
  );
});

test('mediaDownloadFilename: useOriginalFilename 默认读本地存储（无存储时为 false）', () => {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage'),
    previous = globalThis.localStorage;
  delete globalThis.localStorage;
  try {
    assert.equal(resolveNodeMediaDownloadFilename({ nodeName: 'N', kind: 'image' }), 'N.png');
  } finally {
    if (had) globalThis.localStorage = previous;
  }
});

test('mediaDownloadFilename: 无参调用安全返回 media.bin', () => {
  assert.equal(resolveNodeMediaDownloadFilename({ useOriginalFilename: false }), 'media.bin');
});
