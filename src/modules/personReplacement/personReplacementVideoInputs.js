import { resolveModelProvider } from '../../manifests/index.js';
import { resolveCanvasVideoPosterUrl } from '../../services/canvasMediaLocalService.js';
import { buildRunningHubVideoFixedSlotPayloadPatch } from '../../components/video-node/runningHubVideoSubmitPayload.js';
import { getFixedInputSlotConfigFromManifest } from '../fixedInputAssetRefs.js';
import {
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  getPersonReplacementVideoResults,
  resolvePersonReplacementVideoResultRef,
  resolvePersonReplacementVideoSourceRef,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoModelId,
} from './personReplacementProject.js';
import { normalizePersonReplacementWorkspaceProject } from './personReplacementProjectSession.js';
import { updatePersonReplacementVideoGenerationState } from './personReplacementVideoGeneration.js';
function normalizeText(_0x19e5c1) {
  return String(_0x19e5c1 ?? '')['trim']();
}
function getStoredVideoInputsBySlot(_0x25ab10 = {}) {
  const _0x459bb3 = _0x25ab10?.['replacementVideoInputsBySlot'];
  return _0x459bb3 && typeof _0x459bb3 === 'object' && !Array['isArray'](_0x459bb3) ? _0x459bb3 : {};
}
function resolveStoredInputUrl(_0x3e2f99) {
  if (typeof _0x3e2f99 === 'string') return normalizeText(_0x3e2f99);
  return normalizeText(
    _0x3e2f99?.['url'] ||
      _0x3e2f99?.['localUrl'] ||
      _0x3e2f99?.['imageUrl'] ||
      _0x3e2f99?.['videoUrl'] ||
      _0x3e2f99?.['localPath'],
  );
}
function resolveProjectSourceVideoRef(_0x9a10ef = {}, _0x554ed5 = {}) {
  const _0x2e3cc6 = normalizeText(_0x554ed5?.['sourceId']),
    _0x25068a = (Array['isArray'](_0x9a10ef?.['sources']) ? _0x9a10ef['sources'] : [])['find'](
      (_0x1649fa) => normalizeText(_0x1649fa?.['id']) === _0x2e3cc6,
    );
  return normalizeText(_0x554ed5?.['sourceVideoRef'] || _0x25068a?.['videoRef']);
}
export function appendPersonReplacementVideoResults(_0x1ad3c4 = {}, _0xb45643 = []) {
  const _0x3c07d3 = getPersonReplacementVideoResults(_0x1ad3c4),
    _0x37d7dd = [..._0x3c07d3];
  let _0x63d4c4 = -0x1;
  return (
    _0xb45643['forEach']((_0x2ea32d) => {
      const _0x19db08 = resolvePersonReplacementVideoResultRef(_0x2ea32d);
      if (!_0x19db08) return;
      const _0x1879f4 = _0x37d7dd['findIndex'](
        (_0x4215a3) => resolvePersonReplacementVideoResultRef(_0x4215a3) === _0x19db08,
      );
      if (_0x1879f4 >= 0x0) {
        if (_0x63d4c4 < 0x0) _0x63d4c4 = _0x1879f4;
        return;
      }
      if (_0x63d4c4 < 0x0) _0x63d4c4 = _0x37d7dd['length'];
      _0x37d7dd['push']({ ..._0x2ea32d });
    }),
    {
      results: _0x37d7dd,
      activeIndex: _0x63d4c4 >= 0x0 ? _0x63d4c4 : Math['max'](0x0, _0x37d7dd['length'] - 0x1),
    }
  );
}
export function applyPersonReplacementVideoCrop(
  _0x37a26 = {},
  { shotId: shotId = '', cutLocalPath: cutLocalPath = '', videoUrl: videoUrl = '', fps: fps = 0x0 } = {},
) {
  const _0x18ee53 = normalizePersonReplacementWorkspaceProject(_0x37a26),
    _0x2bafa0 = normalizeText(shotId || _0x18ee53['workspace']['selectedShotId']),
    _0x1f2077 = normalizeText(cutLocalPath || videoUrl);
  if (!_0x2bafa0 || !_0x1f2077) return _0x18ee53;
  const _0x7fa41b = _0x18ee53['shots']['find']((_0x51ae19) => _0x51ae19['id'] === _0x2bafa0);
  if (!_0x7fa41b) return _0x18ee53;
  const _0x29c100 = Number(fps) > 0x0 ? Number(fps) : _0x7fa41b['outputFps'],
    _0x3dabc1 = {
      ..._0x18ee53,
      shots: _0x18ee53['shots']['map']((_0x4caab5) =>
        _0x4caab5['id'] === _0x2bafa0
          ? {
              ..._0x4caab5,
              ...(_0x4caab5['videoIterationReferenceRef']
                ? { videoIterationInputRef: _0x1f2077 }
                : { videoRef: _0x1f2077, videoRefIsCropped: !![] }),
              outputFps: _0x29c100,
              materializationStatus: 'succeeded',
              materializationProgress: 0x64,
              error: '',
            }
          : _0x4caab5,
      ),
      workspace: updatePersonReplacementVideoGenerationState(_0x18ee53['workspace'], {
        status: 'idle',
        shotId: _0x2bafa0,
        error: '',
      }),
    };
  return normalizePersonReplacementWorkspaceProject(_0x3dabc1);
}
export function resolvePersonReplacementVideoSlotState(_0x2a9c4b = {}, _0x36f93b = {}) {
  const _0x4da101 = resolvePersonReplacementVideoModelId(
      _0x2a9c4b?.['settings']?.['replacementModelId'] || PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
    ),
    _0x17751f = resolveModelProvider(_0x4da101, '', { allowProviderHint: ![], allowPrefixInference: ![] }),
    _0x35c4eb = getFixedInputSlotConfigFromManifest(
      {
        model: _0x4da101,
        provider: _0x17751f,
        generationParams: _0x2a9c4b?.['settings']?.['replacementVideoGenerationParams'] || {},
      },
      { includeHiddenSlots: !![] },
    ),
    _0x265fc3 = {},
    _0x11f99e = ['refImage']['filter']((_0x2d3e66) => _0x35c4eb?.['visibleSlots']?.['includes'](_0x2d3e66)),
    _0x4c2da7 = getStoredVideoInputsBySlot(_0x36f93b);
  (_0x35c4eb?.['visibleSlots'] || [])['forEach']((_0x51e439) => {
    const _0x3354a8 = _0x4c2da7[_0x51e439],
      _0x4e2078 = normalizeText(_0x3354a8?.['modelId']),
      _0x426cde = resolveStoredInputUrl(_0x3354a8),
      _0x2ec6de = normalizeText(_0x35c4eb?.['slotKindById']?.[_0x51e439] || _0x3354a8?.['kind']);
    if (!_0x426cde || (_0x4e2078 && _0x4e2078 !== _0x4da101)) return;
    _0x265fc3[_0x51e439] = {
      ...(_0x3354a8 && typeof _0x3354a8 === 'object' ? _0x3354a8 : {}),
      kind: _0x2ec6de,
      url: _0x426cde,
    };
  });
  const _0x394a77 = resolvePersonReplacementVideoSourceRef(_0x36f93b),
    _0x4b178c = _0x394a77 || resolveProjectSourceVideoRef(_0x2a9c4b, _0x36f93b);
  _0x4b178c &&
    _0x35c4eb?.['slotKindById']?.['sourceVideo'] === 'video' &&
    (!_0x265fc3['sourceVideo'] || _0x36f93b?.['videoIterationReferenceRef']) &&
    ((_0x265fc3['sourceVideo'] = {
      kind: 'video',
      url: _0x4b178c,
      thumbUrl: _0x36f93b?.['videoIterationReferenceRef']
        ? resolveCanvasVideoPosterUrl(
            getPersonReplacementVideoResults(_0x36f93b)['find'](
              (_0x56cd29) => resolvePersonReplacementVideoResultRef(_0x56cd29) === _0x394a77,
            ),
          )
        : normalizeText(_0x36f93b?.['keyframeRef']),
      pending: !_0x394a77,
    }),
    _0x11f99e['push']('sourceVideo'));
  const _0x27a51b = resolvePersonReplacementVideoImageInput(_0x2a9c4b, _0x36f93b);
  _0x27a51b['status'] === 'ready' &&
    _0x35c4eb?.['slotKindById']?.['refImage'] === 'image' &&
    (_0x265fc3['refImage'] = { kind: 'image', url: _0x27a51b['imageRef'] });
  const _0x443198 = Object['fromEntries'](
      Object['entries'](_0x265fc3)
        ['filter'](
          ([_0x4bd1fb, _0x4e3c21]) =>
            _0x35c4eb?.['visibleSlots']?.['includes'](_0x4bd1fb) &&
            normalizeText(_0x4e3c21?.['url']) &&
            _0x4e3c21?.['pending'] !== !![],
        )
        ['map'](([_0x3f0dfa, _0x3ac761]) => [
          _0x3f0dfa,
          { ..._0x3ac761, url: normalizeText(_0x3ac761['url']) },
        ]),
    ),
    _0x44d320 = { imageCount: 0x0, videoCount: 0x0, audioCount: 0x0 };
  return (
    Object['entries'](_0x265fc3)['forEach'](([_0x139d5d, _0x223ebb]) => {
      const _0x74f95c = normalizeText(_0x35c4eb?.['slotKindById']?.[_0x139d5d] || _0x223ebb?.['kind']),
        _0x2702ca = _0x74f95c + 'Count';
      Object['hasOwn'](_0x44d320, _0x2702ca) && (_0x44d320[_0x2702ca] += 0x1);
    }),
    {
      modelId: _0x4da101,
      provider: _0x17751f,
      fixedInputConfig: _0x35c4eb,
      imageInput: _0x27a51b,
      inputsBySlot: _0x265fc3,
      readOnlySlots: _0x11f99e,
      slotEntries: _0x443198,
      referenceCounts: _0x44d320,
    }
  );
}
export function buildPersonReplacementVideoSlotPayloadPatch({
  project: project = {},
  shot: shot = {},
  generationParams: generationParams = {},
} = {}) {
  const _0x15d40 = resolvePersonReplacementVideoSlotState(project, shot),
    _0x526cf6 = buildRunningHubVideoFixedSlotPayloadPatch({
      model: _0x15d40['modelId'],
      nodeData: {
        model: _0x15d40['modelId'],
        provider: _0x15d40['provider'],
        generationParams: generationParams,
      },
      slotEntries: _0x15d40['slotEntries'],
    });
  return { slotState: _0x15d40, payloadPatch: _0x526cf6 };
}
