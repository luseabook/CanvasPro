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
function isConvertedAudioKind(_0xd756d9) {
  return String(_0xd756d9 || '')['trim']() === 'converted';
}
function getText(_0x35df15, _0x3641b9, _0x1db623, _0x441098) {
  if (typeof _0x35df15 !== 'function') return _0x441098;
  const _0x5a1511 = String(_0x35df15(_0x3641b9, _0x1db623) || '')['trim']();
  return _0x5a1511 || _0x441098;
}
function buildSegmentOutputName({
  segment: _0x2c06f5,
  kind: _0x13da4c,
  sourceName: _0x1f554f,
  text: _0x4151d3,
}) {
  const _0x4360f1 = isConvertedAudioKind(_0x13da4c),
    _0x1fbc43 = getText(
      _0x4151d3,
      _0x4360f1 ? 'menu.convertedAudio' : 'menu.sourceAudio',
      {},
      _0x4360f1 ? 'converted' : 'source',
    );
  return [
    String(_0x1f554f || 'audio')['trim']() || 'audio',
    String(_0x2c06f5?.['id'] || 'segment')['trim']() || 'segment',
    _0x1fbc43,
  ]['join']('-');
}
export function resolveAudioVoiceSegmentOutput(_0x310f0b = {}, _0x5eb998 = 'source') {
  const _0x32e756 = isConvertedAudioKind(_0x5eb998),
    _0x25dc7c = normalizeLocalPath(
      _0x32e756 ? _0x310f0b['convertedAudioLocalPath'] : _0x310f0b['sourceAudioLocalPath'],
    ),
    _0x3c1810 = resolveSegmentLocalAudioUrl(
      _0x32e756 ? _0x310f0b['convertedAudioUrl'] : _0x310f0b['sourceAudioUrl'],
      _0x25dc7c,
    ),
    _0x2c9a79 = Math['max'](
      0x0,
      (Number(_0x310f0b['endMs'] || 0x0) - Number(_0x310f0b['startMs'] || 0x0)) / 0x3e8,
    ),
    _0x5f27a9 = _0x32e756
      ? pickAudioDurationSec(_0x310f0b['convertedAudioDuration'], _0x310f0b['audioDuration'], _0x2c9a79)
      : pickAudioDurationSec(_0x2c9a79, _0x310f0b['sourceAudioDuration'], _0x310f0b['audioDuration']);
  return {
    kind: _0x32e756 ? 'converted' : 'source',
    localPath: _0x25dc7c,
    url: _0x3c1810,
    audioDuration: _0x5f27a9,
  };
}
export async function saveAudioVoiceSegmentDownload({
  segment: segment = {},
  kind: kind = 'source',
  sourceName: sourceName = '',
  text: _0x4e4f0b,
  showToast: showToast = globalThis['window']?.['showToast'],
  saveMediaFile: saveMediaFile = saveMediaDownload,
} = {}) {
  const _0x1243df = resolveAudioVoiceSegmentOutput(segment, kind),
    _0x20933d = buildSegmentOutputName({
      segment: segment,
      kind: kind,
      sourceName: sourceName,
      text: _0x4e4f0b,
    }),
    _0x2dae46 = resolveAudioDownloadTarget({
      nodeData: { name: _0x20933d, localPath: _0x1243df['localPath'], audioUrl: _0x1243df['url'] },
    });
  if (!_0x2dae46)
    return (
      showToast?.(getText(_0x4e4f0b, 'toasts.audioMissing', {}, 'Audio is unavailable'), 'warn'),
      { success: ![], canceled: ![], reason: 'missing-audio' }
    );
  try {
    const _0x2fabc7 = await saveMediaFile({
      kind: 'audio',
      localPath: _0x1243df['localPath'],
      url: _0x2dae46['url'],
      filename: _0x2dae46['filename'],
      title: getText(_0x4e4f0b, 'menu.download', {}, 'Download'),
    });
    if (_0x2fabc7?.['canceled']) return _0x2fabc7;
    if (_0x2fabc7?.['success'] === ![]) throw new Error(_0x2fabc7['error'] || 'Audio\x20save\x20failed');
    return (
      showMediaSaveSuccessToast({ result: _0x2fabc7, kind: 'audio', showToast: showToast }),
      _0x2fabc7 || { success: !![], canceled: ![] }
    );
  } catch (_0x5207d1) {
    const _0x4e595b = String(_0x5207d1?.['message'] || _0x5207d1 || 'Audio save failed');
    return (
      showToast?.(
        getText(
          _0x4e4f0b,
          'toasts.downloadFailed',
          { message: _0x4e595b },
          'Audio save failed: ' + _0x4e595b,
        ),
        'error',
      ),
      { success: ![], canceled: ![], error: _0x4e595b }
    );
  }
}
export function addAudioVoiceSegmentAudioToCanvas({
  store: _0x495f3d,
  segment: segment = {},
  kind: kind = 'source',
  anchorNode: anchorNode = null,
  sourceName: sourceName = '',
  text: _0x2f4093,
  showToast: showToast = globalThis['window']?.['showToast'],
  commitHistory: commitHistory = commit,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x38e0da = resolveAudioVoiceSegmentOutput(segment, kind);
  if (!_0x38e0da['localPath'])
    return (
      showToast?.(getText(_0x2f4093, 'toasts.audioMissing', {}, 'Audio is unavailable'), 'warn'),
      { success: ![], reason: 'missing-local-audio' }
    );
  try {
    if (typeof _0x495f3d?.['addNode'] !== 'function') throw new Error('Canvas store is unavailable');
    const _0x276987 = _0x495f3d['getState']?.() || {},
      _0x2fed92 = _0x276987['nodes'] || {},
      _0x47d182 = _0x2fed92[anchorNode?.['id']] || anchorNode || {},
      { width: _0x409e28, height: _0x1486d0 } = getNodeDefaultSize('source-audio'),
      _0x1a2905 = calcSafeSpawnPosNearNode(_0x2fed92, _0x47d182, _0x409e28, _0x1486d0),
      _0x460aa0 = generateId('source-audio-voice-segment'),
      _0x3ca56e = buildSegmentOutputName({
        segment: segment,
        kind: kind,
        sourceName: sourceName,
        text: _0x2f4093,
      }),
      _0x58d8b7 = localPathToUrl(_0x38e0da['localPath']),
      _0x54d394 = buildSourceAudioNodePayload({
        id: _0x460aa0,
        x: _0x1a2905['x'],
        y: _0x1a2905['y'],
        width: _0x409e28,
        height: _0x1486d0,
        name: _0x3ca56e,
        src: _0x58d8b7,
        audioUrl: _0x58d8b7,
        localPath: _0x38e0da['localPath'],
        audioDuration: _0x38e0da['audioDuration'],
      });
    (_0x495f3d['addNode'](_0x54d394),
      _0x495f3d['setSelectedNodes']?.([_0x460aa0]),
      commitHistory?.(),
      windowObject?.['_triggerLocalCacheSave']?.());
    const _0x1d46f8 = getText(
      _0x2f4093,
      _0x38e0da['kind'] === 'converted' ? 'menu.convertedAudio' : 'menu.sourceAudio',
      {},
      _0x38e0da['kind'] === 'converted' ? 'Converted audio' : 'Original audio',
    );
    return (
      showToast?.(
        getText(_0x2f4093, 'toasts.addedToCanvas', { label: _0x1d46f8 }, _0x1d46f8 + ' added to canvas'),
        'success',
      ),
      { success: !![], nodeId: _0x460aa0, node: _0x54d394 }
    );
  } catch (_0x328111) {
    const _0xfbfd03 = String(_0x328111?.['message'] || _0x328111 || 'Add\x20to\x20canvas\x20failed');
    return (
      showToast?.(
        getText(
          _0x2f4093,
          'toasts.addToCanvasFailed',
          { message: _0xfbfd03 },
          'Add to canvas failed: ' + _0xfbfd03,
        ),
        'error',
      ),
      { success: ![], error: _0xfbfd03 }
    );
  }
}
