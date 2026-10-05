const DEFAULT_PREVIEW_MAX_DIMENSION = 1024,
  DEFAULT_HEADER_BYTES = 512 * 1024,
  JPEG_SOF_MARKERS = new Set([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207]);
function positiveInteger(value) {
  const count = Math['round'](Number(value) || 0);
  return count > 0 ? count : 0;
}
function isJpegSofMarker(item) {
  return JPEG_SOF_MARKERS['has'](item);
}
function readJpegSize(list) {
  if (list['length'] < 4 || list[0] !== 0xff || list[1] !== 216) return null;
  let key = 2;
  while (key + 8 < list['length']) {
    if (list[key] !== 0xff) {
      key += 1;
      continue;
    }
    while (key < list['length'] && list[key] === 0xff) key += 1;
    const count2 = list[key];
    key += 1;
    if (count2 === 216 || count2 === 217) continue;
    if (count2 === 218) break;
    if (key + 1 >= list['length']) break;
    const count3 = (list[key] << 8) | list[key + 1];
    if (count3 < 2 || key + count3 > list['length']) break;
    if (isJpegSofMarker(count2) && count3 >= 7) {
      const height = (list[key + 3] << 8) | list[key + 4],
        width = (list[key + 5] << 8) | list[key + 6];
      return width > 0 && height > 0 ? { width: width, height: height } : null;
    }
    key += count3;
  }
  return null;
}
function readPngSize(list2) {
  if (
    list2['length'] < 24 ||
    list2[0] !== 137 ||
    list2[1] !== 80 ||
    list2[2] !== 78 ||
    list2[3] !== 71
  )
    return null;
  const dataView = new DataView(list2['buffer'], list2['byteOffset'], list2['byteLength']),
    width2 = dataView['getUint32'](16, ![]),
    height2 = dataView['getUint32'](20, ![]);
  return width2 > 0 && height2 > 0 ? { width: width2, height: height2 } : null;
}
function readGifSize(list3) {
  if (list3['length'] < 10) return null;
  const index = String['fromCharCode'](...list3['subarray'](0, 6));
  if (index !== 'GIF87a' && index !== 'GIF89a') return null;
  const width3 = list3[6] | (list3[7] << 8),
    height3 = list3[8] | (list3[9] << 8);
  return width3 > 0 && height3 > 0 ? { width: width3, height: height3 } : null;
}
function readUint24LittleEndian(result, data) {
  return result[data] | (result[data + 1] << 8) | (result[data + 2] << 16);
}
function readWebpSize(list4) {
  if (list4['length'] < 30) return null;
  const options = String['fromCharCode'](...list4['subarray'](0, 4)),
    target = String['fromCharCode'](...list4['subarray'](8, 12));
  if (options !== 'RIFF' || target !== 'WEBP') return null;
  const source = String['fromCharCode'](...list4['subarray'](12, 16));
  if (source === 'VP8X')
    return {
      width: readUint24LittleEndian(list4, 24) + 1,
      height: readUint24LittleEndian(list4, 27) + 1,
    };
  if (source === 'VP8 ' && list4['length'] >= 30) {
    const width4 = (list4[26] | (list4[27] << 8)) & 0x3fff,
      height4 = (list4[28] | (list4[29] << 8)) & 0x3fff;
    return width4 > 0 && height4 > 0 ? { width: width4, height: height4 } : null;
  }
  if (source === 'VP8L' && list4['length'] >= 25 && list4[20] === 47) {
    const width5 = 1 + (list4[21] | ((list4[22] & 0x3f) << 8)),
      height5 = 1 + ((list4[22] >> 6) | (list4[23] << 2) | ((list4[24] & 15) << 10));
    return { width: width5, height: height5 };
  }
  return null;
}
export function readImageHeaderSize(next) {
  const current = next instanceof Uint8Array ? next : new Uint8Array(next || 0);
  return readPngSize(current) || readJpegSize(current) || readWebpSize(current) || readGifSize(current);
}
export async function readImageFileHeaderSize(
  list5,
  { maxHeaderBytes: maxHeaderBytes = DEFAULT_HEADER_BYTES } = {},
) {
  if (!list5) return null;
  const entry =
    typeof list5['slice'] === 'function'
      ? list5['slice'](0, Math['max'](32, positiveInteger(maxHeaderBytes)))
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
  const state = Math['min'](1, positiveInteger4 / Math['max'](positiveInteger2, positiveInteger3));
  return {
    width: Math['max'](1, Math['round'](positiveInteger2 * state)),
    height: Math['max'](1, Math['round'](positiveInteger3 * state)),
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
  ctx['drawImage'](enabled, 0, 0, image['width'], image['height']);
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
