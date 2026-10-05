import { extractStoryboardVideoFramesFromServer } from '../../api/storyboardVideoFrameApi.js';
import { waitForVideoFrame } from '../components/videoFrameCapture.js';
import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
const THUMB_METADATA_TIMEOUT_MS = 8000,
  THUMB_SEEK_TIMEOUT_MS = 1600;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function getVideoSource(item) {
  return normalizeText(item?.['getAttribute']?.('src') || item?.['currentSrc'] || item?.['src']);
}
function resolveFrameUrl(response) {
  return (
    normalizeText(response?.['url'] || response?.['localUrl']) ||
    localPathToUrl(response?.['localPath'] || response?.['path'])
  );
}
function setThumbState(key, index) {
  for (const el of Array['isArray'](key) ? key : []) {
    if (el?.['dataset']) el['dataset']['thumbnailState'] = index;
    (el?.['classList']?.['add']('video-timeline-thumbnail'), el?.['setAttribute']?.('aria-busy', 'false'));
  }
}
function setThumbBackground(el2, result, data = '') {
  const text = normalizeText(result);
  if (!el2?.['style'] || !text) return ![];
  const list = [text, normalizeText(data)]
    ['filter'](Boolean)
    ['filter']((options, target, list2) => list2['indexOf'](options) === target);
  return (
    (el2['style']['backgroundImage'] = list['map']((source) => 'url(' + JSON['stringify'](source) + ')')[
      'join'
    ](', ')),
    !![]
  );
}
export function paintVideoTimelineThumbnailUrls(next, current, entry = 'ready') {
  const list3 = Array['isArray'](next) ? next : [],
    list4 = (Array['isArray'](current) ? current : [current])['map'](normalizeText)['filter'](Boolean);
  if (!list3['length'] || !list4['length']) return 0;
  for (let record = 0; record < list3['length']; record += 1) {
    const payload = Math['min'](
      list4['length'] - 1,
      Math['floor'](((record + 0.5) * list4['length']) / list3['length']),
    );
    setThumbBackground(list3[record], list4[payload], list4[0]);
  }
  return (setThumbState(list3, entry), list3['length']);
}
function waitForLoadedMetadata(el3, handle) {
  if (Number(el3?.['readyState'] || 0) >= 1) return Promise['resolve'](!![]);
  return new Promise((handler, handler2) => {
    let state = ![],
      config = null;
    const run = () => {
        (el3['removeEventListener']?.('loadedmetadata', scope),
          el3['removeEventListener']?.('durationchange', scope),
          el3['removeEventListener']?.('error', input),
          el3['removeEventListener']?.('abort', input));
        if (config) globalThis['clearTimeout'](config);
      },
      handler3 = (output) => {
        if (state) return;
        ((state = !![]), run());
        if (output) handler2(output);
        else handler(!![]);
      },
      scope = () => handler3(),
      input = () => handler3(new Error('video thumbnail source failed to load'));
    (el3['addEventListener']?.('loadedmetadata', scope),
      el3['addEventListener']?.('durationchange', scope),
      el3['addEventListener']?.('error', input),
      el3['addEventListener']?.('abort', input),
      (config = globalThis['setTimeout'](
        () => handler3(new Error('video thumbnail metadata timed out')),
        handle,
      )));
  });
}
function seekVideo(el4, value2, value3) {
  const value4 = Math['max'](0, Number(value2) || 0);
  if (
    Math['abs']((Number(el4?.['currentTime']) || 0) - value4) <= 0.02 &&
    Number(el4?.['readyState'] || 0) >= 2 &&
    el4?.['seeking'] !== !![]
  )
    return Promise['resolve'](!![]);
  return new Promise((handler4, handler5) => {
    let value5 = ![],
      value6 = null;
    const run2 = () => {
        (el4['removeEventListener']?.('seeked', value7),
          el4['removeEventListener']?.('timeupdate', value7),
          el4['removeEventListener']?.('error', value8),
          el4['removeEventListener']?.('abort', value8));
        if (value6) globalThis['clearTimeout'](value6);
      },
      handler6 = (value9) => {
        if (value5) return;
        ((value5 = !![]), run2());
        if (value9) handler5(value9);
        else handler4(!![]);
      },
      value7 = () => {
        if (el4?.['seeking'] !== !![]) handler6();
      },
      value8 = () => handler6(new Error('video thumbnail seek failed'));
    (el4['addEventListener']?.('seeked', value7),
      el4['addEventListener']?.('timeupdate', value7),
      el4['addEventListener']?.('error', value8),
      el4['addEventListener']?.('abort', value8),
      (value6 = globalThis['setTimeout'](
        () => handler6(new Error('video thumbnail seek timed out')),
        value3,
      )));
    try {
      el4['currentTime'] = value4;
    } catch (value10) {
      handler6(value10 instanceof Error ? value10 : new Error(String(value10)));
    }
  });
}
export async function extractClientVideoTimelineFrameUrls({
  src: src,
  count: count,
  sampleTimes: sampleTimes,
  isCurrent: isCurrent = () => !![],
  documentRef: documentRef = globalThis['document'],
  attachMediaSource: attachMediaSource = attachMediaElementPlaybackSource,
  waitForFrame: waitForFrame = waitForVideoFrame,
  onDuration: onDuration,
} = {}) {
  const text2 = normalizeText(src),
    list5 = Array['isArray'](sampleTimes) ? sampleTimes['filter'](Number['isFinite']) : null,
    value11 = list5 ? list5['length'] : Math['max'](1, Math['trunc'](Number(count) || 0));
  if (!text2 || !documentRef?.['createElement']) return [];
  const el5 = documentRef['createElement']('video');
  ((el5['muted'] = !![]),
    (el5['playsInline'] = !![]),
    (el5['preload'] = 'auto'),
    (el5['crossOrigin'] = 'anonymous'),
    el5['setAttribute']?.('aria-hidden', 'true'));
  el5['style'] &&
    ((el5['style']['position'] = 'fixed'),
    (el5['style']['left'] = '-10000px'),
    (el5['style']['top'] = '-10000px'),
    (el5['style']['width'] = '1px'),
    (el5['style']['height'] = '1px'),
    (el5['style']['opacity'] = '0'),
    (el5['style']['pointerEvents'] = 'none'));
  documentRef['body']?.['appendChild']?.(el5);
  let box = null;
  try {
    await attachMediaSource(el5, text2, { preload: 'auto' });
    if (!getVideoSource(el5)) throw new Error('video thumbnail source is empty');
    await waitForLoadedMetadata(el5, THUMB_METADATA_TIMEOUT_MS);
    if (!isCurrent()) return [];
    const waitForFrame2 = await waitForFrame(el5, { timeoutMs: 5000 });
    if (!waitForFrame2) throw new Error('video thumbnail frame timed out');
    const count2 = Number(el5['duration']);
    if (!Number['isFinite'](count2) || count2 <= 0)
      throw new Error('video thumbnail duration is unavailable');
    if (!isCurrent()) return [];
    onDuration?.(count2);
    const value12 = Math['max'](1, Number(el5['videoWidth']) || 1),
      value13 = Math['max'](1, Number(el5['videoHeight']) || 1),
      value14 = 44,
      value15 = Math['max'](1, Math['min'](240, Math['round']((value12 / value13) * value14)));
    ((box = documentRef['createElement']('canvas')), (box['width'] = value15), (box['height'] = value14));
    const ctx = box['getContext']?.('2d', { willReadFrequently: ![] });
    if (!ctx) throw new Error('video thumbnail canvas is unavailable');
    const list6 = [];
    for (let value16 = 0; value16 < value11; value16 += 1) {
      if (!isCurrent()) return [];
      const value17 = Math['min'](
        Math['max'](0, count2 - 0.05),
        list5 ? Math['max'](0, list5[value16]) : ((value16 + 0.5) / value11) * count2,
      );
      await seekVideo(el5, value17, THUMB_SEEK_TIMEOUT_MS);
      const waitForFrame3 = await waitForFrame(el5, { timeoutMs: 1800 });
      if (!waitForFrame3) throw new Error('video thumbnail frame timed out after seek');
      (ctx['clearRect'](0, 0, value15, value14), ctx['drawImage'](el5, 0, 0, value15, value14));
      const enabled = box['toDataURL']('image/jpeg', 0.72);
      if (!enabled) throw new Error('video thumbnail export returned no data');
      list6['push'](enabled);
    }
    return list6;
  } finally {
    try {
      (el5['pause']?.(), el5['removeAttribute']?.('src'), el5['load']?.());
    } catch {}
    el5['remove']?.();
    if (box) box['width'] = box['height'] = 0;
  }
}
export async function renderVideoTimelineThumbnails({
  src: src2,
  posterUrl: posterUrl,
  thumbs: thumbs,
  isCurrent: isCurrent = () => !![],
  extractServerFrames: extractServerFrames = extractStoryboardVideoFramesFromServer,
  extractClientFrames: extractClientFrames = extractClientVideoTimelineFrameUrls,
  onDuration: onDuration2,
} = {}) {
  const maxFrames = Array['isArray'](thumbs) ? thumbs : [],
    src3 = normalizeText(src2),
    source2 = normalizeText(posterUrl),
    errors = [];
  if (!maxFrames['length']) return { source: 'empty', errors: errors };
  if (!isCurrent()) return { source: 'cancelled', errors: errors };
  if (source2) paintVideoTimelineThumbnailUrls(maxFrames, [source2], 'poster');
  else setThumbState(maxFrames, 'loading');
  if (!src3)
    return (
      setThumbState(maxFrames, source2 ? 'poster' : 'failed'),
      { source: source2 ? 'poster' : 'empty', errors: errors }
    );
  for (const el6 of maxFrames) el6?.['setAttribute']?.('aria-busy', 'true');
  try {
    const extractServerFrames2 = await extractServerFrames(src3, {
      maxFrames: maxFrames['length'],
      exactCount: !![],
    });
    if (!isCurrent()) return { source: 'cancelled', errors: errors };
    const list7 = (Array['isArray'](extractServerFrames2?.['frames']) ? extractServerFrames2['frames'] : [])
      ['map'](resolveFrameUrl)
      ['filter'](Boolean);
    if (!list7['length']) throw new Error('server returned no video thumbnails');
    const count3 = Number(extractServerFrames2?.['duration']);
    if (Number['isFinite'](count3) && count3 > 0) onDuration2?.(count3);
    return (
      paintVideoTimelineThumbnailUrls(maxFrames, list7, 'server'),
      { source: 'server', errors: errors }
    );
  } catch (value18) {
    errors['push'](value18 instanceof Error ? value18 : new Error(String(value18)));
  }
  if (!isCurrent()) return { source: 'cancelled', errors: errors };
  try {
    const list8 = await extractClientFrames({
      src: src3,
      count: maxFrames['length'],
      isCurrent: isCurrent,
      onDuration: (value19) => {
        if (isCurrent()) onDuration2?.(value19);
      },
    });
    if (!isCurrent()) return { source: 'cancelled', errors: errors };
    if (!Array['isArray'](list8) || !list8['some'](Boolean))
      throw new Error('browser returned no video thumbnails');
    return (
      paintVideoTimelineThumbnailUrls(maxFrames, list8, 'client'),
      { source: 'client', errors: errors }
    );
  } catch (value20) {
    errors['push'](value20 instanceof Error ? value20 : new Error(String(value20)));
  }
  if (!isCurrent()) return { source: 'cancelled', errors: errors };
  return (
    setThumbState(maxFrames, source2 ? 'poster' : 'failed'),
    { source: source2 ? 'poster' : 'empty', errors: errors }
  );
}
