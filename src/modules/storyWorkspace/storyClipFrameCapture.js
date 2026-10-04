import { captureVideoFrameSnapshot, waitForVideoFrame } from '../../components/videoFrameCapture.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
const STORY_CLIP_VIDEO_LOCALIZE_MAX_BYTES = 0x200 * 0x400 * 0x400,
  STORY_CLIP_FRAME_READY_TIMEOUT_MS = 0x2710,
  STORY_CLIP_FRAME_SEEK_TIMEOUT_MS = 0x1f40;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function seekVideoToTime(el, item, key = STORY_CLIP_FRAME_SEEK_TIMEOUT_MS) {
  return new Promise((handler) => {
    let index = ![],
      setTimeout2 = null;
    const run = (result) => {
        if (index) return;
        index = !![];
        if (setTimeout2) clearTimeout(setTimeout2);
        (el['removeEventListener']?.('seeked', data),
          el['removeEventListener']?.('error', options),
          el['removeEventListener']?.('abort', options),
          handler(result === !![]));
      },
      data = () => run(!![]),
      options = () => run(![]);
    (el['addEventListener']?.('seeked', data, { once: !![] }),
      el['addEventListener']?.('error', options, { once: !![] }),
      el['addEventListener']?.('abort', options, { once: !![] }),
      (setTimeout2 = setTimeout(
        () => run(!el['seeking'] && Math['abs'](Number(el['currentTime']) - Number(item)) <= 0.05),
        key,
      )));
    try {
      el['currentTime'] = item;
    } catch {
      run(![]);
      return;
    }
    !el['seeking'] &&
      Math['abs'](Number(el['currentTime']) - Number(item)) <= 0.01 &&
      queueMicrotask(() => run(!![]));
  });
}
function resolveCaptureTime(target, source) {
  const next = Math['max'](0x0, Number(source) || 0x0),
    count = Number(target?.['duration']);
  if (!Number['isFinite'](count) || count <= 0x0) return next;
  return Math['min'](next, Math['max'](0x0, count - 0.001));
}
function inferVideoExtension(current, entry = {}) {
  const list = normalizeText(entry['mimeType'] || entry['contentType'])['toLowerCase']();
  if (list['includes']('webm')) return 'webm';
  if (list['includes']('quicktime')) return 'mov';
  if (list['includes']('mp4')) return 'mp4';
  try {
    const uRL = new URL(current, globalThis['location']?.['href'] || 'http://localhost/')['pathname'],
      text = normalizeText(uRL['match'](/\.([a-z0-9]{2,5})$/i)?.[0x1])['toLowerCase']();
    if (['mp4', 'm4v', 'mov', 'webm']['includes'](text)) return text;
  } catch {}
  return 'mp4';
}
function resolveRemoteVideoUrl(response = {}, record = '') {
  return (
    [response['videoUrl'], response['url'], response['displayUrl'], record]
      ['map'](normalizeText)
      ['find']((payload) => /^https?:\/\//i['test'](payload)) || ''
  );
}
function normalizeLocalizedVideoResult(response2 = {}) {
  const localPath = pickResultLocalPath(response2),
    url = localPathToUrl(localPath) || normalizeText(response2['url']);
  if (!localPath || !url) return null;
  return {
    url: url,
    localPath: localPath,
    originalLocalPath: normalizeLocalPath(response2['originalLocalPath'] || localPath),
    displayLocalPath: normalizeLocalPath(response2['displayLocalPath']),
  };
}
export function isStoryClipFrameCanvasSecurityError(error) {
  const text2 = normalizeText(error?.['name'])['toLowerCase'](),
    list2 = normalizeText(error?.['message'])['toLowerCase']();
  return (
    text2 === 'securityerror' ||
    list2['includes']('tainted canvas') ||
    list2['includes']('tainted canvases') ||
    list2['includes']('insecure')
  );
}
export async function captureStoryClipFrameFromSource({
  sourceUrl: sourceUrl2,
  currentTimeSec: currentTimeSec = 0x0,
  documentObject: documentObject = globalThis['document'],
  fileNamePrefix: fileNamePrefix = 'story_clip_frame',
  crop: crop,
} = {}) {
  const text3 = normalizeText(sourceUrl2);
  if (!text3 || !documentObject?.['createElement']) throw new Error('片段视频本地源不可用');
  const el2 = documentObject['createElement']('video');
  ((el2['muted'] = !![]),
    (el2['playsInline'] = !![]),
    (el2['preload'] = 'auto'),
    (el2['style']['position'] = 'fixed'),
    (el2['style']['left'] = '-10000px'),
    (el2['style']['top'] = '-10000px'),
    (el2['style']['width'] = '1px'),
    (el2['style']['height'] = '1px'),
    (el2['style']['opacity'] = '0'),
    documentObject['body']?.['appendChild'](el2));
  try {
    ((el2['src'] = text3), el2['load']?.());
    const waitForVideoFrame2 = await waitForVideoFrame(el2, { timeoutMs: STORY_CLIP_FRAME_READY_TIMEOUT_MS });
    if (!waitForVideoFrame2) throw new Error('片段视频本地画面加载失败');
    const captureTime = resolveCaptureTime(el2, currentTimeSec);
    if (captureTime > 0.001 && Math['abs'](Number(el2['currentTime']) - captureTime) > 0.01) {
      if (!(await seekVideoToTime(el2, captureTime))) throw new Error('片段视频定位当前时间失败');
      if (!(await waitForVideoFrame(el2, { timeoutMs: STORY_CLIP_FRAME_READY_TIMEOUT_MS })))
        throw new Error('片段视频当前画面加载失败');
    }
    return captureVideoFrameSnapshot(el2, {
      type: 'image/png',
      fileNamePrefix: fileNamePrefix,
      crop: crop,
    });
  } finally {
    try {
      (el2['pause']?.(), el2['removeAttribute']?.('src'), el2['load']?.());
    } catch {}
    el2['remove']?.();
  }
}
export async function captureStoryClipFrameSnapshot({
  videoEl: videoEl,
  sourceResult: sourceResult = {},
  sourceUrl: sourceUrl = '',
  currentTimeSec: currentTimeSec = 0x0,
  saveOutputFromUrl: saveOutputFromUrl,
  documentObject: documentObject = globalThis['document'],
  fileNamePrefix: fileNamePrefix = 'story_clip_frame',
} = {}) {
  if (!videoEl) throw new Error('当前片段视频不可用');
  if (!(await waitForVideoFrame(videoEl, { timeoutMs: STORY_CLIP_FRAME_READY_TIMEOUT_MS })))
    throw new Error('视频画面尚未加载完成，请稍后重试');
  try {
    return {
      snapshot: await captureVideoFrameSnapshot(videoEl, {
        type: 'image/png',
        fileNamePrefix: fileNamePrefix,
      }),
      localizedVideo: null,
    };
  } catch (handle) {
    if (!isStoryClipFrameCanvasSecurityError(handle)) throw handle;
    const remoteVideoUrl = resolveRemoteVideoUrl(sourceResult, sourceUrl);
    if (!remoteVideoUrl || typeof saveOutputFromUrl !== 'function') throw handle;
    const sourceUrl3 = normalizeLocalizedVideoResult(
      await saveOutputFromUrl(remoteVideoUrl, {
        ext: inferVideoExtension(remoteVideoUrl, sourceResult),
        maxBytes: STORY_CLIP_VIDEO_LOCALIZE_MAX_BYTES,
        dedupeKey: 'story-clip-video:' + remoteVideoUrl,
      }),
    );
    if (!sourceUrl3) throw new Error('片段视频本地保存失败');
    return {
      snapshot: await captureStoryClipFrameFromSource({
        sourceUrl: sourceUrl3['url'],
        currentTimeSec: currentTimeSec,
        documentObject: documentObject,
        fileNamePrefix: fileNamePrefix,
      }),
      localizedVideo: sourceUrl3,
    };
  }
}
