import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readImageHeaderSize,
  readImageFileHeaderSize,
  createImagePreviewFromDecodedImage,
  createFastImagePreview,
} from './fastImagePreviewService.js';

// —— 构造各格式头部字节（端口用十六进制字面量，此处用十进制构造，语义等价）——
function pngBytes(w, h, total = 33) {
  const b = new Uint8Array(total);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  b.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8); // IHDR
  b[16] = (w >>> 24) & 0xff;
  b[17] = (w >>> 16) & 0xff;
  b[18] = (w >>> 8) & 0xff;
  b[19] = w & 0xff;
  b[20] = (h >>> 24) & 0xff;
  b[21] = (h >>> 16) & 0xff;
  b[22] = (h >>> 8) & 0xff;
  b[23] = h & 0xff;
  return b;
}
function jpegBytes(segments, total = 40) {
  const b = new Uint8Array(total);
  b[0] = 0xff;
  b[1] = 0xd8;
  let p = 2;
  for (const s of segments) {
    b.set(s, p);
    p += s.length;
  }
  return b;
}
function sofSegment(w, h, marker = 0xc0, segLen = 0x11) {
  return [
    0xff,
    marker,
    (segLen >>> 8) & 0xff,
    segLen & 0xff,
    8,
    (h >>> 8) & 0xff,
    h & 0xff,
    (w >>> 8) & 0xff,
    w & 0xff,
  ];
}
function gifBytes(w, h) {
  const b = new Uint8Array(13);
  b.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0); // GIF89a
  b[6] = w & 0xff;
  b[7] = (w >>> 8) & 0xff;
  b[8] = h & 0xff;
  b[9] = (h >>> 8) & 0xff;
  return b;
}
function webpBytes(fourcc, dims, total = 30) {
  const b = new Uint8Array(total);
  b.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  b.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  b.set(
    fourcc.split('').map((c) => c.charCodeAt(0)),
    12,
  );
  dims.forEach((v, i) => {
    b[24 + i] = v;
  });
  return b;
}

test('PNG：读 IHDR 大端宽高', () => {
  assert.deepEqual(readImageHeaderSize(pngBytes(1920, 1080)), { width: 1920, height: 1080 });
});
test('PNG：不足 24 字节 / 魔数不符 / 宽或高为 0 一律 null', () => {
  assert.equal(readImageHeaderSize(pngBytes(10, 10, 23)), null);
  const bad = pngBytes(10, 10);
  bad[1] = 0x51;
  assert.equal(readImageHeaderSize(bad), null);
  assert.equal(readImageHeaderSize(pngBytes(0, 10)), null);
  assert.equal(readImageHeaderSize(pngBytes(10, 0)), null);
});
test('JPEG：FF D8 + SOF0 大端宽高', () => {
  assert.deepEqual(readImageHeaderSize(jpegBytes([sofSegment(800, 600)])), { width: 800, height: 600 });
});
test('JPEG：SOF 白名单外的段被跳过，直到命中 SOF', () => {
  const com = [0xff, 0xfe, 0x00, 0x06, 1, 2, 3, 4];
  assert.deepEqual(readImageHeaderSize(jpegBytes([com, sofSegment(640, 480)])), { width: 640, height: 480 });
});
test('JPEG：D9/SOS 终止、段长越界、宽高为 0 都返回 null', () => {
  assert.equal(readImageHeaderSize(jpegBytes([[0xff, 0xd9]])), null);
  assert.equal(readImageHeaderSize(jpegBytes([[0xff, 0xda, 0x00, 0x04, 0, 0]])), null);
  // 段长声称超出缓冲 ⇒ break（不是继续解析）
  assert.equal(readImageHeaderSize(jpegBytes([sofSegment(10, 10, 0xc0, 0x40)], 40)), null);
  assert.equal(readImageHeaderSize(jpegBytes([sofSegment(0, 10)])), null);
});
test('JPEG：缺少 APPn 之外无 SOF 时 null；无 FF D8 魔数时 null', () => {
  assert.equal(readImageHeaderSize(jpegBytes([[0xff, 0xe0, 0x00, 0x06, 1, 2, 3, 4]], 20)), null);
  const b = jpegBytes([sofSegment(10, 10)]);
  b[1] = 0xd9;
  assert.equal(readImageHeaderSize(b), null);
});
test('GIF：小端宽高，版本必须是 GIF87a/89a', () => {
  assert.deepEqual(readImageHeaderSize(gifBytes(320, 240)), { width: 320, height: 240 });
  const bad = gifBytes(320, 240);
  bad[5] = 0x62; // GIF89b
  assert.equal(readImageHeaderSize(bad), null);
  assert.equal(readImageHeaderSize(gifBytes(0, 240)), null);
});
test('WebP VP8X：24 位小端宽高各 +1', () => {
  assert.deepEqual(readImageHeaderSize(webpBytes('VP8X', [0x2f, 0x01, 0x00, 0x63, 0x00, 0x00])), {
    width: 0x130,
    height: 0x64,
  });
});
test('WebP VP8 （有损）：14 位掩码宽高', () => {
  const b = webpBytes('VP8 ', []);
  b[26] = 0x9d;
  b[27] = 0x01; // (0x19d)&0x3fff = 413
  b[28] = 0x7d;
  b[29] = 0x00; // 125
  assert.deepEqual(readImageHeaderSize(b), { width: 413, height: 125 });
  const zero = webpBytes('VP8 ', []);
  assert.equal(readImageHeaderSize(zero), null);
});
test('WebP VP8L（无损）：签名字节 0x2f 必须存在，宽高 +1', () => {
  const b = webpBytes('VP8L', []);
  b[20] = 0x2f;
  b[21] = 0x63;
  b[22] = 0x00;
  b[23] = 0x00;
  assert.deepEqual(readImageHeaderSize(b), { width: 100, height: 1 });
  const bad = webpBytes('VP8L', []);
  bad[20] = 0x2e;
  assert.equal(readImageHeaderSize(bad), null);
});
test('WebP：RIFF/WEBP 魔数或长度不足一律 null', () => {
  assert.equal(readImageHeaderSize(webpBytes('VP8X', [1, 1, 1, 1, 1, 1], 29)), null);
  const b = webpBytes('VP8X', [1, 1, 1, 1, 1, 1]);
  b[0] = 0x51;
  assert.equal(readImageHeaderSize(b), null);
  const c = webpBytes('VP9 ', [1, 1, 1, 1, 1, 1]);
  assert.equal(readImageHeaderSize(c), null);
});
test('readImageHeaderSize：非 Uint8Array 入参走 new Uint8Array(入参||0)，null/数字不抛错', () => {
  assert.equal(readImageHeaderSize(null), null);
  assert.equal(readImageHeaderSize(0), null);
  assert.equal(readImageHeaderSize(undefined), null);
  assert.deepEqual(readImageHeaderSize(pngBytes(6, 7).buffer), { width: 6, height: 7 });
});

test('readImageFileHeaderSize：假值入参直接 null，不发读取', async () => {
  assert.equal(await readImageFileHeaderSize(null), null);
  assert.equal(await readImageFileHeaderSize(undefined), null);
  assert.equal(await readImageFileHeaderSize(''), null);
});
test('readImageFileHeaderSize：无 slice 且无 arrayBuffer ⇒ null', async () => {
  assert.equal(await readImageFileHeaderSize({}), null);
});
test('readImageFileHeaderSize：默认按 512 KiB 切片，显式过小值被抬到 32', async () => {
  const seen = [];
  const blob = (recorder) => ({
    slice: (a, b) => {
      recorder.push([a, b]);
      return { arrayBuffer: async () => pngBytes(11, 22).buffer };
    },
  });
  assert.deepEqual(await readImageFileHeaderSize(blob(seen)), { width: 11, height: 22 });
  assert.deepEqual(seen[0], [0, 0x200 * 0x400]);
  await readImageFileHeaderSize(blob(seen), { maxHeaderBytes: 1 });
  assert.deepEqual(seen[1], [0, 0x20]);
  await readImageFileHeaderSize(blob(seen), { maxHeaderBytes: '4096' });
  assert.deepEqual(seen[2], [0, 4096]);
});
test('readImageFileHeaderSize：arrayBuffer 抛错被吞成 null', async () => {
  const boom = {
    slice: () => ({
      arrayBuffer: async () => {
        throw new Error('io');
      },
    }),
  };
  assert.equal(await readImageFileHeaderSize(boom), null);
});
test('readImageFileHeaderSize：无 slice 但自带 arrayBuffer 时直接读取', async () => {
  const src = { arrayBuffer: async () => gifBytes(3, 4).buffer };
  assert.deepEqual(await readImageFileHeaderSize(src), { width: 3, height: 4 });
});

function makeDoc(over = {}) {
  const calls = [];
  const doc = {
    createElement: () => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: (type, attrs) => {
          calls.push(['getContext', type, attrs]);
          if ('getContext' in over ? over.getContext : true) {
            return {
              drawImage: (...a) => {
                calls.push(['drawImage', ...a]);
              },
            };
          }
          return null;
        },
        toDataURL: (...a) => {
          calls.push(['toDataURL', ...a]);
          if ('throwOnToDataURL' in over && over.throwOnToDataURL) throw new Error('tainted');
          return 'data:image/webp;base64,AAA';
        },
      };
      calls.push(['createElement', 'canvas']);
      return canvas;
    },
  };
  return { doc, calls };
}

test('createImagePreviewFromDecodedImage：按 naturalWidth/Height 缩放并回填源尺寸', () => {
  const { doc, calls } = makeDoc();
  const src = { naturalWidth: 4000, naturalHeight: 3000, width: 1, height: 1 };
  const out = createImagePreviewFromDecodedImage(src, {
    maxDimension: 1000,
    documentRef: doc,
  });
  assert.equal(out.width, 4000);
  assert.equal(out.height, 3000);
  assert.equal(out.thumbnailDataUrl, 'data:image/webp;base64,AAA');
  assert.equal(out.image.width, 1000);
  assert.equal(out.image.height, 750);
  assert.deepEqual(calls[1], ['getContext', '2d', { alpha: true }]);
  assert.deepEqual(calls[2], ['drawImage', src, 0, 0, 1000, 750]);
  assert.deepEqual(calls[3], ['toDataURL', 'image/webp', 0.72]);
});
test('createImagePreviewFromDecodedImage：naturalWidth 缺失才回落 width', () => {
  const { doc } = makeDoc();
  const out = createImagePreviewFromDecodedImage({ width: 640, height: 480 }, { documentRef: doc });
  assert.deepEqual({ w: out.image.width, h: out.image.height }, { w: 640, h: 480 });
});
test('createImagePreviewFromDecodedImage：不放大（scale 上限 1），极小尺寸至少留 1 像素', () => {
  const { doc } = makeDoc();
  const small = createImagePreviewFromDecodedImage(
    { width: 4, height: 2 },
    { maxDimension: 4096, documentRef: doc },
  );
  assert.equal(small.image.width, 4);
  assert.equal(small.image.height, 2);
  const tiny = createImagePreviewFromDecodedImage(
    { width: 1, height: 1000 },
    { maxDimension: 1, documentRef: doc },
  );
  assert.equal(tiny.image.width, 1);
  assert.equal(tiny.image.height, 1);
});
test('createImagePreviewFromDecodedImage：尺寸为 0 / 缺 document / 无 createElement ⇒ null', () => {
  const { doc } = makeDoc();
  assert.equal(createImagePreviewFromDecodedImage({ width: 0, height: 10 }, { documentRef: doc }), null);
  assert.equal(createImagePreviewFromDecodedImage({ width: 10, height: 10 }, {}), null);
  assert.equal(createImagePreviewFromDecodedImage({ width: 10, height: 10 }, { documentRef: {} }), null);
});
test('createImagePreviewFromDecodedImage：无 2d 上下文 ⇒ null；toDataURL 抛错 ⇒ 空串但保留 image', () => {
  const noCtx = makeDoc({ getContext: false });
  assert.equal(createImagePreviewFromDecodedImage({ width: 8, height: 8 }, { documentRef: noCtx.doc }), null);
  const tainted = makeDoc({ throwOnToDataURL: true });
  const out = createImagePreviewFromDecodedImage({ width: 8, height: 8 }, { documentRef: tainted.doc });
  assert.equal(out.thumbnailDataUrl, '');
  assert.ok(out.image);
});
test('createPreviewCanvas：画布拒收正尺寸（防御分支）⇒ null —— 公开路径下 getPreviewDimensions 恒 ≥1，只能由宿主吞掉写入触发', () => {
  const swallowingDoc = {
    createElement: () =>
      new Proxy(
        { width: 0, height: 0, getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:,' },
        { set: () => true },
      ),
  };
  assert.equal(
    createImagePreviewFromDecodedImage({ width: 100, height: 100 }, { documentRef: swallowingDoc }),
    null,
  );
});

test('createFastImagePreview：先读头取尺寸，按低质量 resize 解码并转 WebP 缩略', async () => {
  const { doc, calls } = makeDoc();
  let closed = 0;
  const bitmap = { width: 512, height: 256, close: () => closed++ };
  const bitmapArgs = [];
  const out = await createFastImagePreview(
    { name: 'file' },
    {
      maxDimension: 512,
      documentRef: doc,
      readHeaderSizeImpl: async (f) => {
        assert.equal(f.name, 'file');
        return { width: 2000, height: 1000 };
      },
      createImageBitmapImpl: async (f, opts) => {
        bitmapArgs.push(opts);
        return bitmap;
      },
    },
  );
  assert.deepEqual(bitmapArgs[0], {
    imageOrientation: 'from-image',
    resizeWidth: 512,
    resizeHeight: 256,
    resizeQuality: 'low',
  });
  assert.equal(out.width, 2000); // 回填的是**源**尺寸，不是画布尺寸
  assert.equal(out.height, 1000);
  assert.equal(out.image.width, 512);
  assert.equal(out.thumbnailDataUrl, 'data:image/webp;base64,AAA');
  assert.ok(calls.some((c) => c[0] === 'drawImage'));
});
test('createFastImagePreview：读头失败或尺寸非法 ⇒ 不调用解码器', async () => {
  let decoded = 0;
  const opts = (header) => ({
    documentRef: makeDoc().doc,
    readHeaderSizeImpl: async () => header,
    createImageBitmapImpl: async () => {
      decoded++;
      return { width: 1, height: 1, close() {} };
    },
  });
  assert.equal(await createFastImagePreview({}, opts(null)), null);
  assert.equal(await createFastImagePreview({}, opts({ width: 0, height: 10 })), null);
  assert.equal(await createFastImagePreview({}, opts({ width: 10, height: 0 })), null);
  assert.equal(decoded, 0);
});
test('createFastImagePreview：入参/环境守卫 —— 无位图实现、无 document、无元素都返回 null', async () => {
  assert.equal(
    await createFastImagePreview(null, {
      createImageBitmapImpl: async () => ({}),
      documentRef: makeDoc().doc,
    }),
    null,
  );
  assert.equal(await createFastImagePreview({}, { documentRef: makeDoc().doc }), null);
  assert.equal(
    await createFastImagePreview({}, { createImageBitmapImpl: async () => ({}), documentRef: {} }),
    null,
  );
});
test('createFastImagePreview：解码抛错 ⇒ null；无论如何都 close()', async () => {
  let closed = 0;
  const out = await createFastImagePreview(
    {},
    {
      documentRef: makeDoc().doc,
      readHeaderSizeImpl: async () => ({ width: 100, height: 100 }),
      createImageBitmapImpl: async () => {
        throw new Error('decode');
      },
    },
  );
  assert.equal(out, null);
  assert.equal(closed, 0);
  const bitmap = { width: 10, height: 10, close: () => closed++ };
  await createFastImagePreview(
    {},
    {
      documentRef: makeDoc({ getContext: false }).doc,
      readHeaderSizeImpl: async () => ({ width: 100, height: 100 }),
      createImageBitmapImpl: async () => bitmap,
    },
  );
  assert.equal(closed, 1); // 无 2d 上下文 ⇒ 建画布失败返回 null，但 finally 仍 close()
});
test('createFastImagePreview：位图尺寸为 0 时回落用头部算出的目标尺寸', async () => {
  const { doc } = makeDoc();
  const out = await createFastImagePreview(
    {},
    {
      maxDimension: 64,
      documentRef: doc,
      readHeaderSizeImpl: async () => ({ width: 640, height: 320 }),
      createImageBitmapImpl: async () => ({ width: 0, height: 0, close() {} }),
    },
  );
  assert.equal(out.image.width, 64);
  assert.equal(out.image.height, 32);
});
