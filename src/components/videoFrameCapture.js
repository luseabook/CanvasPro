import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { resolveNormalizedMediaCrop } from '../core/math.js';
export function getVideoFrameSource(value) {
  return String(value?.currentSrc || value?.src || value?.getAttribute?.('src') || '').trim();
}
export function isVideoFrameReady(item) {
  return (
    !!getVideoFrameSource(item) &&
    Number(item?.readyState || 0) >= 2 &&
    Number(item?.videoWidth || 0) > 0 &&
    Number(item?.videoHeight || 0) > 0
  );
}
function drawVideoFrameToCanvas(key, index) {
  if (!isVideoFrameReady(key)) throw new Error('video frame is not ready');
  const result = Math.max(1, Math.trunc(Number(key.videoWidth) || 0)),
    data = Math.max(1, Math.trunc(Number(key.videoHeight) || 0)),
    canvas = document.createElement('canvas'),
    width = resolveNormalizedMediaCrop(index, result, data);
  ((canvas.width = width.width), (canvas.height = width.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context is unavailable');
  if (index) ctx.drawImage(key, width.x, width.y, width.width, width.height, 0, 0, width.width, width.height);
  else ctx.drawImage(key, 0, 0, result, data);
  return { canvas: canvas, width: width.width, height: width.height };
}
function dataUrlToBlob(options) {
  const target = String(options || ''),
    enabled = target.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!enabled) throw new Error('invalid data url');
  const type2 = enabled[1] || 'application/octet-stream',
    source = enabled[3] || '',
    list = enabled[2] ? atob(source) : decodeURIComponent(source),
    uint8Array = new Uint8Array(list.length);
  for (let next = 0; next < list.length; next += 1) {
    uint8Array[next] = list.charCodeAt(next);
  }
  return new Blob([uint8Array], { type: type2 });
}
function extFromImageType(current) {
  const list2 = String(current || '').toLowerCase();
  if (list2.includes('jpeg') || list2.includes('jpg')) return 'jpg';
  if (list2.includes('webp')) return 'webp';
  return 'png';
}
function normalizeFrameIndex(entry) {
  const count = Number(entry);
  if (!Number.isFinite(count) || count <= 0) return 1;
  return Math.max(1, Math.round(count));
}
export function resolveVideoFrameCaptureIndex(
  record,
  {
    currentTimeSec: currentTimeSec = 0,
    fallbackDurationSec: fallbackDurationSec = 0,
    fallbackFrameRate: fallbackFrameRate = 0,
  } = {},
) {
  const count2 = Number(record?.videoFps),
    count3 = Number(record?.videoFrameCount),
    count4 = Number(record?.videoDuration),
    count5 = Number.isFinite(count4) && count4 > 0 ? count4 : Number(fallbackDurationSec),
    count6 = Number(fallbackFrameRate),
    count7 =
      Number.isFinite(count2) && count2 > 0
        ? count2
        : Number.isFinite(count3) && count3 > 0 && Number.isFinite(count5) && count5 > 0
          ? count3 / count5
          : Number.isFinite(count6) && count6 > 0
            ? count6
            : 0;
  if (Number.isFinite(count7) && count7 > 0) {
    let frameIndex = Math.floor(Math.max(0, Number(currentTimeSec) || 0) * count7) + 1;
    return (
      Number.isFinite(count3) && count3 > 0
        ? (frameIndex = Math.max(1, Math.min(Math.round(count3), frameIndex)))
        : (frameIndex = Math.max(1, frameIndex)),
      { frameIndex: frameIndex, nextSnapSeq: null, usedSequence: false }
    );
  }
  const frameIndex2 = Math.max(1, Math.floor(Number(record?.snapSeq) || 0) + 1);
  return { frameIndex: frameIndex2, nextSnapSeq: frameIndex2, usedSequence: true };
}
export function buildVideoFrameCaptureNodeName(
  error,
  {
    frameIndex: frameIndex3,
    fallbackName: fallbackName = '',
    formatSourceFrameName: formatSourceFrameName,
  } = {},
) {
  const frameIndex4 = normalizeFrameIndex(frameIndex3),
    payload = String(fallbackName || '').trim(),
    sourceName = String(error?.name || '').trim();
  if (!sourceName) return payload;
  if (typeof formatSourceFrameName === 'function') {
    const handle = String(
      formatSourceFrameName({ sourceName: sourceName, frameIndex: frameIndex4 }) || '',
    ).trim();
    if (handle) return handle;
  }
  return payload || sourceName + '.' + frameIndex4;
}
export function waitForVideoFrame(el, { timeoutMs: timeoutMs = 0x9c4 } = {}) {
  if (isVideoFrameReady(el)) return Promise.resolve(true);
  if (!getVideoFrameSource(el)) return Promise.resolve(false);
  return new Promise((handler) => {
    let state = false;
    const config = ['loadeddata', 'canplay', 'canplaythrough', 'seeked', 'timeupdate'],
      handler2 = (scope) => {
        if (state) return;
        ((state = true), clearTimeout(setTimeout2));
        for (const input of config) {
          el.removeEventListener?.(input, output);
        }
        (el.removeEventListener?.('error', value2),
          el.removeEventListener?.('abort', value2),
          handler(scope === true));
      },
      output = () => {
        if (isVideoFrameReady(el)) handler2(true);
      },
      value2 = () => handler2(false),
      setTimeout2 = setTimeout(() => handler2(isVideoFrameReady(el)), timeoutMs);
    for (const value3 of config) {
      el.addEventListener?.(value3, output);
    }
    (el.addEventListener?.('error', value2), el.addEventListener?.('abort', value2));
    if (Number(el.readyState || 0) < 1)
      try {
        el.load?.();
      } catch {}
  });
}
export function captureVideoFrameDataUrl(value4, { type: type = 'image/png', quality: quality } = {}) {
  const { canvas: canvas2 } = drawVideoFrameToCanvas(value4);
  return canvas2.toDataURL(type, quality);
}
export async function captureVideoFrameBlob(
  value5,
  { type: type = 'image/png', quality: quality2, crop: crop } = {},
) {
  const { canvas: canvas3 } = drawVideoFrameToCanvas(value5, crop);
  if (typeof canvas3.toBlob === 'function') {
    const enabled2 = await new Promise((value6) => {
      canvas3.toBlob(value6, type, quality2);
    });
    if (!enabled2) throw new Error('video frame blob export failed');
    return enabled2;
  }
  return dataUrlToBlob(canvas3.toDataURL(type, quality2));
}
export async function captureVideoFrameSnapshot(
  value7,
  {
    type: type = 'image/png',
    quality: quality3,
    fileNamePrefix: fileNamePrefix = 'video_frame',
    crop: crop2,
  } = {},
) {
  const value8 = Math.max(1, Math.trunc(Number(value7?.videoWidth) || 0)),
    value9 = Math.max(1, Math.trunc(Number(value7?.videoHeight) || 0)),
    ext = extFromImageType(type),
    fileName = fileNamePrefix + '_' + Date.now() + '.' + ext,
    blob = await captureVideoFrameBlob(value7, {
      type: type,
      quality: quality3,
      crop: crop2,
    }),
    width2 = resolveNormalizedMediaCrop(crop2, value8, value9);
  return {
    blob: blob,
    width: width2.width,
    height: width2.height,
    originalWidth: width2.width,
    originalHeight: width2.height,
    type: blob.type || type,
    ext: ext,
    fileName: fileName,
  };
}
export async function captureAnnotatedVideoFrameSnapshot(
  value10,
  box,
  {
    type: type = 'image/png',
    quality: quality4,
    fileNamePrefix: fileNamePrefix = 'video_annotation',
    strokeStyle: strokeStyle = 'CanvasText',
  } = {},
) {
  const { canvas: canvas4, width: width3, height: height } = drawVideoFrameToCanvas(value10),
    ctx2 = canvas4.getContext('2d');
  if (!ctx2) throw new Error('canvas context is unavailable');
  const value11 = Math.max(0, Number(box?.x) || 0),
    value12 = Math.max(0, Number(box?.y) || 0),
    value13 = Math.max(1, Number(box?.width) || 1),
    value14 = Math.max(1, Number(box?.height) || 1);
  (ctx2.save(),
    (ctx2.strokeStyle = strokeStyle),
    (ctx2.lineWidth = Math.max(3, Math.round(Math.min(width3, height) / 180))),
    ctx2.setLineDash([Math.max(6, ctx2.lineWidth * 2.5), Math.max(4, ctx2.lineWidth * 1.5)]),
    ctx2.strokeRect(value11, value12, value13, value14),
    ctx2.restore());
  const blob2 = await new Promise((value15) => canvas4.toBlob(value15, type, quality4));
  if (!blob2) throw new Error('annotated video frame blob export failed');
  const ext2 = extFromImageType(type);
  return {
    blob: blob2,
    width: width3,
    height: height,
    originalWidth: width3,
    originalHeight: height,
    type: blob2.type || type,
    ext: ext2,
    fileName: fileNamePrefix + '_' + Date.now() + '.' + ext2,
  };
}
export async function saveVideoFrameSnapshot(box2, handler3) {
  if (typeof handler3 !== 'function') throw new Error('saveOutputBlob is required');
  if (!box2?.blob) throw new Error('video frame snapshot is required');
  const type3 = String(box2.type || box2.blob.type || 'image/png'),
    ext3 = String(box2.ext || extFromImageType(type3)),
    value16 = String(box2.fileName || 'video_frame_' + Date.now() + '.' + ext3),
    value17 = Math.max(1, Math.trunc(Number(box2.width || box2.originalWidth) || 0)),
    value18 = Math.max(1, Math.trunc(Number(box2.height || box2.originalHeight) || 0)),
    value19 = typeof File === 'function' ? new File([box2.blob], value16, { type: type3 }) : box2.blob,
    fileName2 = await handler3(value19, { ext: ext3 }),
    localPath = pickResultLocalPath(fileName2),
    src = String(fileName2?.url || '').trim() || localPathToUrl(localPath);
  if (!src || !localPath) throw new Error('saved video frame did not return a local image path');
  const originalLocalPath = normalizeLocalPath(fileName2?.originalLocalPath || localPath),
    displayLocalPath = normalizeLocalPath(fileName2?.displayLocalPath),
    thumbLocalPath = normalizeLocalPath(fileName2?.thumbLocalPath);
  return {
    src: src,
    localPath: localPath,
    originalLocalPath: originalLocalPath,
    displayLocalPath: displayLocalPath,
    thumbLocalPath: thumbLocalPath,
    originalWidth: Number(fileName2?.originalWidth || value17) || value17,
    originalHeight: Number(fileName2?.originalHeight || value18) || value18,
    fileName: fileName2?.filename || value16,
  };
}
export function createVideoFrameCapturePreviewUrl(
  enabled3,
  { urlApi: urlApi = globalThis.window?.URL || globalThis.URL } = {},
) {
  if (!enabled3 || typeof urlApi?.createObjectURL !== 'function') return '';
  try {
    return urlApi.createObjectURL(enabled3);
  } catch {
    return '';
  }
}
export function startVideoFrameSnapshotPersistence(snapshot, value20, { onPreview: onPreview } = {}) {
  if (!snapshot?.blob) throw new Error('video frame snapshot is required');
  const previewUrl = createVideoFrameCapturePreviewUrl(snapshot.blob);
  if (typeof onPreview === 'function') onPreview({ previewUrl: previewUrl, snapshot: snapshot });
  const savePromise = Promise.resolve().then(() => saveVideoFrameSnapshot(snapshot, value20));
  return { previewUrl: previewUrl, savePromise: savePromise };
}
export async function saveVideoFrameCapture(
  value21,
  value22,
  { type: type = 'image/png', quality: quality5, fileNamePrefix: fileNamePrefix = 'video_frame' } = {},
) {
  const captureVideoFrameSnapshot2 = await captureVideoFrameSnapshot(value21, {
    type: type,
    quality: quality5,
    fileNamePrefix: fileNamePrefix,
  });
  return saveVideoFrameSnapshot(captureVideoFrameSnapshot2, value22);
}

export const DEFAULT_VIDEO_FRAME_CAPTURE_FPS = 0x18;
