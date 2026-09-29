import { generateId } from '../../../core/math.js';
import { commit } from '../../../modules/history.js';
import { t } from '../../../i18n/index.js';
import { GENERATION_MANUAL_DISPLAY_SIZE_FIELD } from '../../shared/generationDisplayPolicy.js';
import {
  SEGMENT_RETAKE_PHASE_EDITING,
  decorateSegmentRetakeParameterNodeData,
} from '../../../modules/videoRetake/segmentRetakeModelPolicy.js';
import { getSegmentRetakePreferredModelId } from '../../../modules/videoRetake/segmentRetakeModelPreference.js';
import { getModelManifest } from '../../../manifests/index.js';
function text(_0xb38f17, _0x2ef8e9 = {}) {
  return t('segmentRetake.' + _0xb38f17, _0x2ef8e9);
}
function pickSourceMediaKey(_0x2530c4 = {}, _0xf85679 = {}) {
  return String(
    _0xf85679['localPath'] ||
      _0xf85679['videoUrl'] ||
      _0xf85679['src'] ||
      _0x2530c4['localPath'] ||
      _0x2530c4['videoUrl'] ||
      _0x2530c4['src'] ||
      '',
  )['trim']();
}
export function bindVideoSegmentRetakeAction(_0x450f15) {
  const {
      toolbarEl: _0x540815,
      nodeData: _0x1e9d36,
      store: _0xc5df3,
      calcSafeSpawnPosNearNode: _0x4ed9d3,
      getAIGenerationNodeSize: _0x4a619d,
      _getCurrentVideoSource: _0x15e1f9,
      _getCurrentVideoUrl: _0xb8e281,
      _getCurrentVideoPlaybackUrl: _0x4c6cb6,
      _getCurrentVideoLocalPath: _0x523725,
      _resolveCurrentVideoDurationSec: _0x5992d6,
      closeToolbarMoreMenu: _0x98fcf1,
    } = _0x450f15,
    _0x1edb72 = _0x540815['querySelector']('.act-segment-retake');
  if (!_0x1edb72) return () => {};
  let _0x59829a = ![];
  const _0x371c2d = async (_0x20ba58) => {
    (_0x20ba58['preventDefault'](), _0x20ba58['stopPropagation']());
    if (_0x59829a) return;
    ((_0x59829a = !![]),
      (_0x1edb72['disabled'] = !![]),
      _0x1edb72['setAttribute']('aria-busy', 'true'),
      _0x98fcf1?.());
    try {
      const { node: _0x44d563, item: _0x3c6925 } = _0x15e1f9(),
        _0x3470ac = String(_0x4c6cb6?.() || '')['trim'](),
        _0x2302f8 = String(_0xb8e281?.() || '')['trim']() || _0x3470ac,
        _0x5fc699 = String(_0x523725?.() || '')['trim']();
      if (!_0x44d563 || !_0x2302f8) {
        window['showToast']?.(text('errors.invalidSource'), 'error');
        return;
      }
      const _0x1556e9 = Number(await _0x5992d6?.(_0x3470ac || _0x2302f8));
      if (!Number['isFinite'](_0x1556e9) || _0x1556e9 < 0x4) {
        window['showToast']?.(text('errors.durationTooShort'), 'warn');
        return;
      }
      const _0x1a79d6 = _0xc5df3['getState'](),
        _0x4fb3cd = _0x1a79d6['nodes']?.[_0x44d563['id']] || _0x44d563,
        _0x39a533 = Number(_0x3c6925?.['videoWidth'] || _0x4fb3cd['width']) || 0x200,
        _0x16bd89 = Number(_0x3c6925?.['videoHeight'] || _0x4fb3cd['height']) || 0x120,
        _0x43c245 = _0x4a619d(_0x39a533, _0x16bd89),
        _0x2fee2c = Math['max'](0x230, _0x43c245['width']),
        _0x6f1efa = Math['max'](
          0x1,
          Math['round'](_0x43c245['height'] * (_0x2fee2c / Math['max'](0x1, _0x43c245['width']))),
        ),
        _0x479ada = _0x4ed9d3(_0x1a79d6['nodes'] || {}, _0x4fb3cd, _0x2fee2c, _0x6f1efa),
        _0x3f596c = generateId('ai-video-retake'),
        _0x54ca98 = pickSourceMediaKey(_0x4fb3cd, _0x3c6925),
        _0x219ac0 = Math['min'](0x1e, _0x1556e9),
        _0x3e9287 = getSegmentRetakePreferredModelId(),
        _0x2e096b = getModelManifest(_0x3e9287),
        _0x401108 = decorateSegmentRetakeParameterNodeData({
          id: _0x3f596c,
          type: 'ai-video',
          x: _0x479ada['x'],
          y: _0x479ada['y'],
          width: _0x2fee2c,
          height: _0x6f1efa,
          fixedSize: !![],
          needsAutoResize: ![],
          [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: !![],
          name: text('nodeName'),
          model: _0x3e9287,
          provider: _0x2e096b?.['provider'] || 'apimart',
          aspectRatio: 'adaptive',
          resolution: '720p',
          duration: -0x1,
          prompt: '',
          generationParams: {
            aspectRatio: 'adaptive',
            duration: -0x1,
            resolution: '720p',
            omniReferenceTaskType: 'edit',
          },
          segmentRetake: {
            version: 0x1,
            phase: SEGMENT_RETAKE_PHASE_EDITING,
            sourceNodeId: _0x4fb3cd['id'],
            sourceMediaKey: _0x54ca98,
            sourceUrl: _0x2302f8,
            sourceLocalPath: _0x5fc699,
            sourceDurationSec: _0x1556e9,
            range: { startSec: 0x0, endSec: _0x219ac0, durationSec: _0x219ac0 },
            annotations: [],
          },
        });
      (_0xc5df3['batch'](() => {
        (_0xc5df3['addNode'](_0x401108),
          _0xc5df3['addEdge']({
            id: generateId('edge-retake-video'),
            sourceId: _0x4fb3cd['id'],
            targetId: _0x3f596c,
            refSlot: 'referenceVideo',
            sourceMediaKey: _0x54ca98,
          }),
          _0xc5df3['setSelectedNodes']([_0x3f596c]));
      }),
        commit(),
        window['_triggerLocalCacheSave']?.(),
        window['v2FocusOnNode']?.(_0x3f596c, 0x64, 0x1f4, 1.5));
    } catch (_0x48c0f2) {
      window['showToast']?.(_0x48c0f2?.['message'] || text('errors.createFailed'), 'error');
    } finally {
      ((_0x59829a = ![]),
        _0x1edb72['isConnected'] &&
          ((_0x1edb72['disabled'] = ![]), _0x1edb72['removeAttribute']('aria-busy')));
    }
  };
  return (
    _0x1edb72['addEventListener']('click', _0x371c2d),
    () => _0x1edb72['removeEventListener']('click', _0x371c2d)
  );
}
