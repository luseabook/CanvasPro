import appStore from '../core/stores/appStore.js';
import { requester } from '../../api/requester.js';
import { t } from '../i18n/index.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { generateId } from '../core/math.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from '../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { getOrderedMediaComposeIds, getSelectedMediaComposeKind } from './mediaComposeSelection.js';
const MEDIA_COMPOSE_CONFIG = Object.freeze({
  video: Object.freeze({
    taskKind: 'videoCompose',
    endpoint: '/api/v2/video/compose',
    textKey: 'video',
    resultIdPrefix: 'source-video-compose',
    sourceFields: Object.freeze(['localPath', 'src', 'videoUrl', 'url', 'resultUrl']),
  }),
  audio: Object.freeze({
    taskKind: 'audioCompose',
    endpoint: '/api/v2/audio/compose',
    textKey: 'audio',
    resultIdPrefix: 'source-audio-compose',
    sourceFields: Object.freeze(['localPath', 'audioUrl', 'src', 'url', 'resultUrl']),
  }),
});
function mediaComposeText(value, item, key = {}) {
  return t('mediaProcessing.compose.' + value.textKey + '.' + item, key);
}
function resolveNodeSrc(index, data) {
  const options = Array.isArray(data?.sourceFields) ? data.sourceFields : [];
  for (const target of options) {
    const url = localPathToUrl(index?.[target]);
    if (url) return url;
  }
  return '';
}
function getResultNodeSize(source, box) {
  if (source === 'audio')
    return { width: Number(box?.width || 0) || 320, height: Number(box?.height || 0) || 140 };
  return getAutoMediaSizeByShortSide(box?.width || 512, box?.height || 288);
}
function buildComposedNodePayload(
  next,
  current,
  { id: id, x: x, y: y, width: width, height: height, localPath: localPath },
) {
  const src2 = localPathToUrl(localPath);
  if (next === 'audio')
    return buildSourceAudioNodePayload({
      id: id,
      type: 'source-audio',
      x: x,
      y: y,
      width: width,
      height: height,
      name: mediaComposeText(current, 'resultName'),
      src: src2,
      audioUrl: src2,
      localPath: localPath,
      needsAutoResize: false,
      fixedSize: true,
    });
  return buildSourceMediaNodePayload({
    id: id,
    type: 'source-video',
    x: x,
    y: y,
    width: width,
    height: height,
    name: mediaComposeText(current, 'resultName'),
    src: src2,
    localPath: localPath,
    needsAutoResize: false,
    fixedSize: true,
  });
}
async function runMediaComposeRequest(kind, srcs2) {
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(
      { kind: kind.taskKind, srcs: srcs2, args: { srcs: srcs2 } },
      { wait: true, timeout: 600000 },
    );
  const response = await requester({
    url: kind.endpoint,
    method: 'POST',
    provider: 'local',
    timeout: 300000,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ srcs: srcs2 }),
    allow404Null: true,
    returnMeta: true,
  });
  if (response?.status === 404 || response?.data == null)
    throw new Error(mediaComposeText(kind, 'missingApi'));
  return response.data || {};
}
async function composeSelectedMedia(list, el, entry) {
  const enabled = MEDIA_COMPOSE_CONFIG[entry];
  if (!enabled) return;
  const record = appStore.getState(),
    payload = record.nodes || {},
    handle = record.selectionMeta || {},
    state = Array.isArray(list) ? list.slice() : [];
  if (getSelectedMediaComposeKind(payload, state) !== entry) {
    window.showToast?.(mediaComposeText(enabled, 'minSelection'), 'info');
    return;
  }
  const list2 = getOrderedMediaComposeIds(payload, state, handle),
    list3 = list2.map((item2) => resolveNodeSrc(payload[item2], enabled)).filter(Boolean);
  if (list3.length < 2) {
    window.showToast?.(mediaComposeText(enabled, 'invalidSource'), 'error');
    return;
  }
  el && ((el.dataset.loading = 'true'), (el.disabled = true));
  window.showToast?.(mediaComposeText(enabled, 'progress'), 'info');
  try {
    const error = await runMediaComposeRequest(enabled, list3),
      localPath2 = pickResultLocalPath(error);
    if (!error.success || !localPath2)
      throw new Error(error.error || error.message || mediaComposeText(enabled, 'fallback'));
    const config = list2[0],
      scope = payload[config],
      { width: width2, height: height2 } = getResultNodeSize(entry, scope),
      x2 = calcSafeSpawnPosNearNode(appStore.getState().nodes, scope, width2, height2),
      id2 = generateId(enabled.resultIdPrefix);
    (appStore.addNode(
      buildComposedNodePayload(entry, enabled, {
        id: id2,
        x: x2.x,
        y: x2.y,
        width: width2,
        height: height2,
        localPath: localPath2,
      }),
    ),
      appStore.setSelectedNodes([id2]),
      commit(),
      window.v2FocusOnNodes?.([...list2, id2]),
      window._triggerLocalCacheSave?.(),
      window.showToast?.(mediaComposeText(enabled, 'success'), 'success'));
  } catch (error2) {
    const message =
      error2 instanceof Error ? error2.message : String(error2 || mediaComposeText(enabled, 'fallback'));
    window.showToast?.(mediaComposeText(enabled, 'failedWithMessage', { message: message }), 'error');
  } finally {
    el && ((el.dataset.loading = 'false'), (el.disabled = false));
  }
}
export async function composeSelectedVideos(input, output) {
  return composeSelectedMedia(input, output, 'video');
}
export async function composeSelectedAudios(value2, value3) {
  return composeSelectedMedia(value2, value3, 'audio');
}

function audioVoiceComposeText(value4, value5 = {}) {
  return t('mediaProcessing.compose.audioVoice.' + value4, value5);
}

export function __buildComposedNodePayloadForTest(value6, value7 = {}) {
  const enabled2 = MEDIA_COMPOSE_CONFIG[value6];
  if (!enabled2) throw new Error('Unsupported media compose kind: ' + (value6 || 'unknown'));
  return buildComposedNodePayload(value6, enabled2, value7);
}

function buildAudioVoiceComposedNodePayload(
  value8,
  { id: id3, x: x3, y: y2, width: width3, height: height3, localPath: localPath3, result: result = {} },
) {
  const url2 = localPathToUrl(localPath3);
  if (value8 === 'audio')
    return buildSourceAudioNodePayload({
      id: id3,
      type: 'source-audio',
      x: x3,
      y: y2,
      width: width3,
      height: height3,
      name: audioVoiceComposeText('audioResultName'),
      src: url2,
      audioUrl: url2,
      localPath: localPath3,
      needsAutoResize: ![],
      fixedSize: !![],
    });
  const value9 = String(result?.['posterLocalPath'] || result?.['thumbLocalPath'] || '')['trim'](),
    value10 = String(result?.['posterUrl'] || result?.['thumbUrl'] || localPathToUrl(value9))['trim']();
  return buildSourceMediaNodePayload({
    id: id3,
    type: 'source-video',
    x: x3,
    y: y2,
    width: width3,
    height: height3,
    name: audioVoiceComposeText('videoResultName'),
    src: url2,
    localPath: localPath3,
    posterLocalPath: value9,
    thumbLocalPath: String(result?.['thumbLocalPath'] || value9)['trim'](),
    posterUrl: value10,
    thumbUrl: String(result?.['thumbUrl'] || value10)['trim'](),
    videoDuration: Number(result?.['videoDuration'] || result?.['duration'] || 0) || 0,
    videoWidth: Number(result?.['videoWidth'] || result?.['width'] || 0) || 0,
    videoHeight: Number(result?.['videoHeight'] || result?.['height'] || 0) || 0,
    videoFps: Number(result?.['videoFps'] || result?.['fps'] || 0) || 0,
    fps: Number(result?.['fps'] || result?.['videoFps'] || 0) || 0,
    needsAutoResize: ![],
    fixedSize: !![],
  });
}

async function composeMediaSourcesNearNode({
  mediaKind: mediaKind = '',
  srcs: srcs = [],
  anchorNode: anchorNode = null,
  triggerEl: triggerEl = null,
} = {}) {
  const enabled3 = MEDIA_COMPOSE_CONFIG[mediaKind];
  if (!enabled3) return null;
  const list4 = (Array['isArray'](srcs) ? srcs : [])
    ['map']((value11) => String(value11 || '')['trim']())
    ['filter'](Boolean);
  if (list4['length'] < 2)
    return (window['showToast']?.(mediaComposeText(enabled3, 'invalidSource'), 'error'), null);
  triggerEl && ((triggerEl['dataset']['loading'] = 'true'), (triggerEl['disabled'] = !![]));
  window['showToast']?.(mediaComposeText(enabled3, 'progress'), 'info');
  try {
    const response2 = await runMediaComposeRequest(enabled3, list4),
      resultLocalPath = pickResultLocalPath(response2);
    if (!response2['success'] || !resultLocalPath)
      throw new Error(response2['error'] || response2['message'] || mediaComposeText(enabled3, 'fallback'));
    const value12 = appStore['getState'](),
      value13 = value12['nodes'] || {},
      { width: width4, height: height4 } = getResultNodeSize(mediaKind, anchorNode),
      box2 = calcSafeSpawnPosNearNode(value13, anchorNode || {}, width4, height4),
      generateId2 = generateId(enabled3['resultIdPrefix']);
    return (
      appStore['addNode'](
        buildComposedNodePayload(mediaKind, enabled3, {
          id: generateId2,
          x: box2['x'],
          y: box2['y'],
          width: width4,
          height: height4,
          localPath: resultLocalPath,
          result: response2,
        }),
      ),
      appStore['setSelectedNodes']([generateId2]),
      commit(),
      window['_triggerLocalCacheSave']?.(),
      window['showToast']?.(mediaComposeText(enabled3, 'success'), 'success'),
      { nodeId: generateId2, localPath: resultLocalPath, data: response2 }
    );
  } catch (value14) {
    const value15 =
      value14 instanceof Error
        ? value14['message']
        : String(value14 || mediaComposeText(enabled3, 'fallback'));
    return (
      window['showToast']?.(mediaComposeText(enabled3, 'failedWithMessage', { message: value15 }), 'error'),
      null
    );
  } finally {
    triggerEl && ((triggerEl['dataset']['loading'] = 'false'), (triggerEl['disabled'] = ![]));
  }
}

export async function composeAudioSourcesNearNode({
  srcs: srcs = [],
  anchorNode: anchorNode = null,
  triggerEl: triggerEl = null,
} = {}) {
  return composeMediaSourcesNearNode({
    mediaKind: 'audio',
    srcs: srcs,
    anchorNode: anchorNode,
    triggerEl: triggerEl,
  });
}

export async function composeAudioVoiceTimelineNearNode({
  sourceKind: sourceKind = 'video',
  src: src = '',
  clips: clips = [],
  durationSec: durationSec = 0,
  anchorNode: anchorNode = null,
  triggerEl: triggerEl = null,
} = {}) {
  const value16 = sourceKind === 'audio' ? 'audio' : 'video',
    enabled4 = String(src || '')['trim'](),
    value17 = (Array['isArray'](clips) ? clips : [])['filter']((value18) => value18?.['src']);
  if (!enabled4 || value17['length'] <= 0)
    return (window['showToast']?.(audioVoiceComposeText('invalidSource'), 'error'), null);
  if (!canUseElectronMediaTask())
    return (window['showToast']?.(audioVoiceComposeText('missingTask'), 'error'), null);
  triggerEl && ((triggerEl['dataset']['loading'] = 'true'), (triggerEl['disabled'] = !![]));
  window['showToast']?.(
    audioVoiceComposeText(value16 === 'video' ? 'videoProgress' : 'audioProgress'),
    'info',
  );
  try {
    const enqueueElectronMediaTask2 = await enqueueElectronMediaTask(
        {
          kind: 'audioVoiceCompose',
          src: enabled4,
          args: { sourceKind: value16, durationSec: durationSec, clips: value17 },
        },
        { wait: !![], timeout: 600000 },
      ),
      resultLocalPath2 = pickResultLocalPath(enqueueElectronMediaTask2);
    if (!enqueueElectronMediaTask2?.['success'] || !resultLocalPath2)
      throw new Error(
        enqueueElectronMediaTask2?.['error'] ||
          enqueueElectronMediaTask2?.['message'] ||
          audioVoiceComposeText('fallback'),
      );
    const value19 = appStore['getState'](),
      value20 = value19['nodes'] || {},
      { width: width5, height: height5 } = getResultNodeSize(value16, anchorNode),
      box3 = calcSafeSpawnPosNearNode(value20, anchorNode || {}, width5, height5),
      generateId3 = generateId(
        value16 === 'audio' ? 'source-audio-voice-compose' : 'source-video-voice-compose',
      );
    return (
      appStore['addNode'](
        buildAudioVoiceComposedNodePayload(value16, {
          id: generateId3,
          x: box3['x'],
          y: box3['y'],
          width: width5,
          height: height5,
          localPath: resultLocalPath2,
          result: enqueueElectronMediaTask2,
        }),
      ),
      appStore['setSelectedNodes']([generateId3]),
      commit(),
      window['_triggerLocalCacheSave']?.(),
      window['showToast']?.(
        audioVoiceComposeText(value16 === 'video' ? 'videoSuccess' : 'audioSuccess'),
        'success',
      ),
      { nodeId: generateId3, localPath: resultLocalPath2, data: enqueueElectronMediaTask2 }
    );
  } catch (value21) {
    const value22 =
      value21 instanceof Error ? value21['message'] : String(value21 || audioVoiceComposeText('fallback'));
    return (
      window['showToast']?.(audioVoiceComposeText('failedWithMessage', { message: value22 }), 'error'),
      null
    );
  } finally {
    triggerEl && ((triggerEl['dataset']['loading'] = 'false'), (triggerEl['disabled'] = ![]));
  }
}
