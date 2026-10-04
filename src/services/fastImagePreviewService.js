const DEFAULT_PREVIEW_MAX_DIMENSION = 0x400,
  DEFAULT_HEADER_BYTES = 0x200 * 0x400,
  JPEG_SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
function positiveInteger(value) {
  const count = Math['round'](Number(value) || 0x0);
  return count > 0x0 ? count : 0x0;
}
function isJpegSofMarker(item) {
  return JPEG_SOF_MARKERS['has'](item);
}
function readJpegSize(list) {
  if (list['length'] < 0x4 || list[0x0] !== 0xff || list[0x1] !== 0xd8) return null;
  let key = 0x2;
  while (key + 0x8 < list['length']) {
    if (list[key] !== 0xff) {
      key += 0x1;
      continue;
    }
    while (key < list['length'] && list[key] === 0xff) key += 0x1;
    const count2 = list[key];
    key += 0x1;
    if (count2 === 0xd8 || count2 === 0xd9) continue;
    if (count2 === 0xda) break;
    if (key + 0x1 >= list['length']) break;
    const count3 = (list[key] << 0x8) | list[key + 0x1];
    if (count3 < 0x2 || key + count3 > list['length']) break;
    if (isJpegSofMarker(count2) && count3 >= 0x7) {
      const height = (list[key + 0x3] << 0x8) | list[key + 0x4],
        width = (list[key + 0x5] << 0x8) | list[key + 0x6];
      return width > 0x0 && height > 0x0 ? { width: width, height: height } : null;
    }
    key += count3;
  }
  return null;
}
function readPngSize(list2) {
  if (
    list2['length'] < 0x18 ||
    list2[0x0] !== 0x89 ||
    list2[0x1] !== 0x50 ||
    list2[0x2] !== 0x4e ||
    list2[0x3] !== 0x47
  )
    return null;
  const dataView = new DataView(list2['buffer'], list2['byteOffset'], list2['byteLength']),
    width2 = dataView['getUint32'](0x10, ![]),
    height2 = dataView['getUint32'](0x14, ![]);
  return width2 > 0x0 && height2 > 0x0 ? { width: width2, height: height2 } : null;
}
function readGifSize(list3) {
  if (list3['length'] < 0xa) return null;
  const index = String['fromCharCode'](...list3['subarray'](0x0, 0x6));
  if (index !== 'GIF87a' && index !== 'GIF89a') return null;
  const width3 = list3[0x6] | (list3[0x7] << 0x8),
    height3 = list3[0x8] | (list3[0x9] << 0x8);
  return width3 > 0x0 && height3 > 0x0 ? { width: width3, height: height3 } : null;
}
function readUint24LittleEndian(result, data) {
  return result[data] | (result[data + 0x1] << 0x8) | (result[data + 0x2] << 0x10);
}
function readWebpSize(list4) {
  if (list4['length'] < 0x1e) return null;
  const options = String['fromCharCode'](...list4['subarray'](0x0, 0x4)),
    target = String['fromCharCode'](...list4['subarray'](0x8, 0xc));
  if (options !== 'RIFF' || target !== 'WEBP') return null;
  const source = String['fromCharCode'](...list4['subarray'](0xc, 0x10));
  if (source === 'VP8X')
    return {
      width: readUint24LittleEndian(list4, 0x18) + 0x1,
      height: readUint24LittleEndian(list4, 0x1b) + 0x1,
    };
  if (source === 'VP8 ' && list4['length'] >= 0x1e) {
    const width4 = (list4[0x1a] | (list4[0x1b] << 0x8)) & 0x3fff,
      height4 = (list4[0x1c] | (list4[0x1d] << 0x8)) & 0x3fff;
    return width4 > 0x0 && height4 > 0x0 ? { width: width4, height: height4 } : null;
  }
  if (source === 'VP8L' && list4['length'] >= 0x19 && list4[0x14] === 0x2f) {
    const width5 = 0x1 + (list4[0x15] | ((list4[0x16] & 0x3f) << 0x8)),
      height5 = 0x1 + ((list4[0x16] >> 0x6) | (list4[0x17] << 0x2) | ((list4[0x18] & 0xf) << 0xa));
    return { width: width5, height: height5 };
  }
  return null;
}
export function readImageHeaderSize(next) {
  const current = next instanceof Uint8Array ? next : new Uint8Array(next || 0x0);
  return readPngSize(current) || readJpegSize(current) || readWebpSize(current) || readGifSize(current);
}
export async function readImageFileHeaderSize(
  list5,
  { maxHeaderBytes: maxHeaderBytes = DEFAULT_HEADER_BYTES } = {},
) {
  if (!list5) return null;
  const entry =
    typeof list5['slice'] === 'function'
      ? list5['slice'](0x0, Math['max'](0x20, positiveInteger(maxHeaderBytes)))
      : list5;
  if (typeof entry?.['arrayBuffer'] !== 'function') return null;
  try {
    return readImageHeaderSize(await entry['arrayBuffer']());
  } catch {
    return null;
  }
}
function getPreviewDimensions(record, payload, handle) {
  const positiveInteger2 = positiveInteger(record),
    positiveInteger3 = positiveInteger(payload),
    positiveInteger4 = positiveInteger(handle) || DEFAULT_PREVIEW_MAX_DIMENSION;
  if (!positiveInteger2 || !positiveInteger3) return null;
  const state = Math['min'](0x1, positiveInteger4 / Math['max'](positiveInteger2, positiveInteger3));
  return {
    width: Math['max'](0x1, Math['round'](positiveInteger2 * state)),
    height: Math['max'](0x1, Math['round'](positiveInteger3 * state)),
  };
}
function createPreviewCanvas(
  enabled,
  {
    sourceWidth: sourceWidth,
    sourceHeight: sourceHeight,
    outputWidth: outputWidth,
    outputHeight: outputHeight,
    documentRef: documentRef = globalThis['document'],
  } = {},
) {
  if (!enabled || typeof documentRef?.['createElement'] !== 'function') return null;
  const image = documentRef['createElement']('canvas');
  ((image['width'] = positiveInteger(outputWidth)), (image['height'] = positiveInteger(outputHeight)));
  if (!image['width'] || !image['height']) return null;
  const ctx = image['getContext']?.('2d', { alpha: !![] });
  if (!ctx?.['drawImage']) return null;
  ctx['drawImage'](enabled, 0x0, 0x0, image['width'], image['height']);
  let thumbnailDataUrl = '';
  try {
    thumbnailDataUrl = String(image['toDataURL']?.('image/webp', 0.72) || '');
  } catch {}
  return {
    image: image,
    width: positiveInteger(sourceWidth),
    height: positiveInteger(sourceHeight),
    thumbnailDataUrl: thumbnailDataUrl,
  };
}
export function createImagePreviewFromDecodedImage(
  box,
  {
    maxDimension: maxDimension = DEFAULT_PREVIEW_MAX_DIMENSION,
    documentRef: documentRef = globalThis['document'],
  } = {},
) {
  const sourceWidth2 = positiveInteger(box?.['naturalWidth'] || box?.['width']),
    sourceHeight2 = positiveInteger(box?.['naturalHeight'] || box?.['height']),
    outputWidth2 = getPreviewDimensions(sourceWidth2, sourceHeight2, maxDimension);
  if (!outputWidth2) return null;
  return createPreviewCanvas(box, {
    sourceWidth: sourceWidth2,
    sourceHeight: sourceHeight2,
    outputWidth: outputWidth2['width'],
    outputHeight: outputWidth2['height'],
    documentRef: documentRef,
  });
}
export async function createFastImagePreview(
  enabled2,
  {
    maxDimension: maxDimension = DEFAULT_PREVIEW_MAX_DIMENSION,
    createImageBitmapImpl: createImageBitmapImpl = globalThis['createImageBitmap'],
    documentRef: documentRef = globalThis['document'],
    readHeaderSizeImpl: readHeaderSizeImpl = readImageFileHeaderSize,
  } = {},
) {
  if (
    !enabled2 ||
    typeof createImageBitmapImpl !== 'function' ||
    typeof documentRef?.['createElement'] !== 'function'
  )
    return null;
  const sourceWidth3 = await readHeaderSizeImpl(enabled2),
    resizeWidth = getPreviewDimensions(sourceWidth3?.['width'], sourceWidth3?.['height'], maxDimension);
  if (!sourceWidth3 || !resizeWidth) return null;
  let box2 = null;
  try {
    return (
      (box2 = await createImageBitmapImpl(enabled2, {
        imageOrientation: 'from-image',
        resizeWidth: resizeWidth['width'],
        resizeHeight: resizeWidth['height'],
        resizeQuality: 'low',
      })),
      createPreviewCanvas(box2, {
        sourceWidth: sourceWidth3['width'],
        sourceHeight: sourceWidth3['height'],
        outputWidth: positiveInteger(box2?.['width']) || resizeWidth['width'],
        outputHeight: positiveInteger(box2?.['height']) || resizeWidth['height'],
        documentRef: documentRef,
      })
    );
  } catch {
    return null;
  } finally {
    box2?.['close']?.();
  }
}
