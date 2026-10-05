import { resolveAudioDownloadTarget } from '../components/nodeToolbar/audioActions/downloadAction.js';
import { showMediaSaveSuccessToast } from '../components/nodeToolbar/mediaDownloadFeedback.js';
import { generateId } from '../core/math.js';
import { pickAudioDurationSec } from '../services/audioMetadataService.js';
import { saveMediaDownload } from '../services/downloadSaveService.js';
import { buildSourceAudioNodePayload, getNodeDefaultSize } from '../services/fileService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { resolveSegmentLocalAudioUrl } from './audioVoicePanelSegmentState.js';
function isConvertedAudioKind(value) {
  return String(value || '')['trim']() === 'converted';
}
function getText(handler, item, key, index) {
  if (typeof handler !== 'function') return index;
  const result = String(handler(item, key) || '')['trim']();
  return result || index;
}
function buildSegmentOutputName({ segment: segment2, kind: kind2, sourceName: sourceName2, text: text }) {
  const isConvertedAudioKind2 = isConvertedAudioKind(kind2),
    text2 = getText(
      text,
      isConvertedAudioKind2 ? 'menu.convertedAudio' : 'menu.sourceAudio',
      {},
      isConvertedAudioKind2 ? 'converted' : 'source',
    );
  return [
    String(sourceName2 || 'audio')['trim']() || 'audio',
    String(segment2?.['id'] || 'segment')['trim']() || 'segment',
    text2,
  ]['join']('-');
}
export function resolveAudioVoiceSegmentOutput(options = {}, data = 'source') {
  const kind3 = isConvertedAudioKind(data),
    localPath = normalizeLocalPath(
      kind3 ? options['convertedAudioLocalPath'] : options['sourceAudioLocalPath'],
    ),
    url = resolveSegmentLocalAudioUrl(
      kind3 ? options['convertedAudioUrl'] : options['sourceAudioUrl'],
      localPath,
    ),
    target = Math['max'](0, (Number(options['endMs'] || 0) - Number(options['startMs'] || 0)) / 1000),
    audioDuration = kind3
      ? pickAudioDurationSec(options['convertedAudioDuration'], options['audioDuration'], target)
      : pickAudioDurationSec(target, options['sourceAudioDuration'], options['audioDuration']);
  return {
    kind: kind3 ? 'converted' : 'source',
    localPath: localPath,
    url: url,
    audioDuration: audioDuration,
  };
}
export async function saveAudioVoiceSegmentDownload({
  segment: segment = {},
  kind: kind = 'source',
  sourceName: sourceName = '',
  text: text3,
  showToast: showToast = globalThis['window']?.['showToast'],
  saveMediaFile: saveMediaFile = saveMediaDownload,
} = {}) {
  const localPath2 = resolveAudioVoiceSegmentOutput(segment, kind),
    name = buildSegmentOutputName({
      segment: segment,
      kind: kind,
      sourceName: sourceName,
      text: text3,
    }),
    url2 = resolveAudioDownloadTarget({
      nodeData: { name: name, localPath: localPath2['localPath'], audioUrl: localPath2['url'] },
    });
  if (!url2)
    return (
      showToast?.(getText(text3, 'toasts.audioMissing', {}, 'Audio is unavailable'), 'warn'),
      { success: ![], canceled: ![], reason: 'missing-audio' }
    );
  try {
    const result2 = await saveMediaFile({
      kind: 'audio',
      localPath: localPath2['localPath'],
      url: url2['url'],
      filename: url2['filename'],
      title: getText(text3, 'menu.download', {}, 'Download'),
    });
    if (result2?.['canceled']) return result2;
    if (result2?.['success'] === ![]) throw new Error(result2['error'] || 'Audio save failed');
    return (
      showMediaSaveSuccessToast({ result: result2, kind: 'audio', showToast: showToast }),
      result2 || { success: !![], canceled: ![] }
    );
  } catch (error) {
    const message = String(error?.['message'] || error || 'Audio save failed');
    return (
      showToast?.(
        getText(text3, 'toasts.downloadFailed', { message: message }, 'Audio save failed: ' + message),
        'error',
      ),
      { success: ![], canceled: ![], error: message }
    );
  }
}
export function addAudioVoiceSegmentAudioToCanvas({
  store: store,
  segment: segment = {},
  kind: kind = 'source',
  anchorNode: anchorNode = null,
  sourceName: sourceName = '',
  text: text4,
  showToast: showToast = globalThis['window']?.['showToast'],
  commitHistory: commitHistory = commit,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const localPath3 = resolveAudioVoiceSegmentOutput(segment, kind);
  if (!localPath3['localPath'])
    return (
      showToast?.(getText(text4, 'toasts.audioMissing', {}, 'Audio is unavailable'), 'warn'),
      { success: ![], reason: 'missing-local-audio' }
    );
  try {
    if (typeof store?.['addNode'] !== 'function') throw new Error('Canvas store is unavailable');
    const state = store['getState']?.() || {},
      source = state['nodes'] || {},
      next = source[anchorNode?.['id']] || anchorNode || {},
      { width: width, height: height } = getNodeDefaultSize('source-audio'),
      x = calcSafeSpawnPosNearNode(source, next, width, height),
      id = generateId('source-audio-voice-segment'),
      name2 = buildSegmentOutputName({
        segment: segment,
        kind: kind,
        sourceName: sourceName,
        text: text4,
      }),
      src = localPathToUrl(localPath3['localPath']),
      node = buildSourceAudioNodePayload({
        id: id,
        x: x['x'],
        y: x['y'],
        width: width,
        height: height,
        name: name2,
        src: src,
        audioUrl: src,
        localPath: localPath3['localPath'],
        audioDuration: localPath3['audioDuration'],
      });
    (store['addNode'](node),
      store['setSelectedNodes']?.([id]),
      commitHistory?.(),
      windowObject?.['_triggerLocalCacheSave']?.());
    const label = getText(
      text4,
      localPath3['kind'] === 'converted' ? 'menu.convertedAudio' : 'menu.sourceAudio',
      {},
      localPath3['kind'] === 'converted' ? 'Converted audio' : 'Original audio',
    );
    return (
      showToast?.(
        getText(text4, 'toasts.addedToCanvas', { label: label }, label + ' added to canvas'),
        'success',
      ),
      { success: !![], nodeId: id, node: node }
    );
  } catch (error2) {
    const message2 = String(error2?.['message'] || error2 || 'Add to canvas failed');
    return (
      showToast?.(
        getText(
          text4,
          'toasts.addToCanvasFailed',
          { message: message2 },
          'Add to canvas failed: ' + message2,
        ),
        'error',
      ),
      { success: ![], error: message2 }
    );
  }
}
