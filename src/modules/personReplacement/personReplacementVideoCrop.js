import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolvePersonReplacementVideoSourceRef } from './personReplacementProject.js';
function normalizeText(_0x30e754) {
  return String(_0x30e754 ?? '')['trim']();
}
function normalizeMediaUrl(_0x454a85) {
  const _0x40bfd1 = normalizeText(_0x454a85);
  return _0x40bfd1 ? localPathToUrl(_0x40bfd1) || _0x40bfd1 : '';
}
function findShot(_0xc48eb8 = {}, _0x4100af = '') {
  const _0x4e561c = normalizeText(_0x4100af);
  return (
    (Array['isArray'](_0xc48eb8?.['shots']) ? _0xc48eb8['shots'] : [])['find'](
      (_0x1a2f7e) => normalizeText(_0x1a2f7e?.['id']) === _0x4e561c,
    ) || null
  );
}
function resolveCropReverseState(_0x150bde = {}) {
  const _0x33f321 = Boolean(_0x150bde['videoIterationReferenceRef']);
  return {
    isReversed: _0x33f321
      ? _0x150bde['videoIterationInputIsReversed'] === !![]
      : _0x150bde['isReversed'] === !![],
    materializedIsReversed: _0x33f321
      ? _0x150bde['videoIterationInputIsReversed'] === !![]
      : _0x150bde['materializedIsReversed'] === !![],
  };
}
export function isPersonReplacementVideoCropReverseRunning(_0x4166a5 = {}) {
  return (
    !_0x4166a5['videoIterationReferenceRef'] &&
    normalizeText(_0x4166a5['materializationStatus']) === 'running' &&
    Boolean(_0x4166a5['isReversed']) !== Boolean(_0x4166a5['materializedIsReversed'])
  );
}
export function assertPersonReplacementVideoCropSourceCurrent({
  project: project = {},
  projectId: projectId = '',
  shotId: shotId = '',
  result: result = {},
} = {}) {
  const _0x83fade = normalizeText(projectId),
    _0xc39510 = findShot(project, shotId),
    _0x2c59eb = normalizeText(result?.['sourceLocalPath']),
    { isReversed: _0x3f67fe, materializedIsReversed: _0xf1d1fd } = resolveCropReverseState(_0xc39510 || {}),
    _0x25ecac = typeof result?.['isReversed'] === 'boolean' ? result['isReversed'] : _0x3f67fe;
  if (_0x83fade && normalizeText(project?.['id']) !== _0x83fade)
    throw new Error('当前项目已切换，请重新打开裁剪。');
  if (
    !_0xc39510 ||
    (_0x2c59eb && resolvePersonReplacementVideoSourceRef(_0xc39510) !== _0x2c59eb) ||
    _0x3f67fe !== _0x25ecac ||
    _0xf1d1fd !== _0x25ecac
  )
    throw new Error('当前片段的倒放状态已变化，请重新打开裁剪。');
  return _0xc39510;
}
function createReverseControl({
  selectedShot: _0x19aa2c,
  getProject: _0x1e54d0,
  acceptProject: _0x25aff3,
  requestReverseChange: _0x14766d,
}) {
  const _0x53eb2d = normalizeText(_0x19aa2c['videoIterationReferenceRef']),
    _0x3c0910 = Boolean(_0x53eb2d);
  return {
    ...resolveCropReverseState(_0x19aa2c),
    async onChange(_0x58ed00) {
      const _0x3f1222 = _0x14766d(
          _0x19aa2c['id'],
          _0x58ed00,
          _0x3c0910
            ? {
                iterationReferenceRef: _0x53eb2d,
                sourceRef: resolvePersonReplacementVideoSourceRef(findShot(_0x1e54d0(), _0x19aa2c['id'])),
              }
            : {},
        ),
        _0x3e53e2 = _0x3f1222?.['then'] ? await _0x3f1222 : _0x3f1222;
      if (!_0x3e53e2) throw new Error('视频倒放服务不可用');
      const _0x2ad925 = _0x3e53e2['completion'] ? await _0x3e53e2['completion'] : _0x3e53e2,
        _0x569fc1 = _0x2ad925?.['stale'] === !![],
        _0x3ad822 = _0x2ad925?.['project'] || _0x3e53e2['project'] || _0x1e54d0(),
        _0x4e4828 = _0x569fc1 ? _0x1e54d0() : _0x25aff3(_0x3ad822),
        _0x497522 = findShot(_0x4e4828, _0x19aa2c['id']);
      if (!_0x497522) throw new Error('倒放完成后未找到当前片段');
      return {
        ok: _0x2ad925?.['ok'] !== ![] && !_0x569fc1,
        ...resolveCropReverseState(_0x497522),
        sourceLocalPath: resolvePersonReplacementVideoSourceRef(_0x497522),
        sourceUrl: normalizeMediaUrl(resolvePersonReplacementVideoSourceRef(_0x497522)),
        posterUrl: normalizeMediaUrl(_0x497522['keyframeRef']),
        error: _0x2ad925?.['error'] || _0x497522['error'] || '',
        suppressToast: !![],
      };
    },
  };
}
export function createPersonReplacementVideoCropOptions({
  projectId: projectId = '',
  selectedShot: _0x4a4020,
  stage: _0x246954,
  videoEl: _0x461696,
  durationSec: durationSec = 0x0,
  getProject: getProject = () => ({}),
  acceptProject: acceptProject = (_0x56ac34) => _0x56ac34,
  requestReverseChange: requestReverseChange = () => null,
  onConfirm: onConfirm = () => {},
  onExit: onExit = () => {},
} = {}) {
  const _0x40abdd = resolvePersonReplacementVideoSourceRef(_0x4a4020);
  return {
    anchorId: 'person-replacement-video:' + normalizeText(projectId) + ':' + normalizeText(_0x4a4020?.['id']),
    wrapperEl: _0x246954,
    videoEl: _0x461696,
    sourceUrl: normalizeMediaUrl(_0x40abdd),
    sourceLocalPath: _0x40abdd,
    sourceData: {
      videoDuration: durationSec,
      videoFps: _0x4a4020?.['outputFps'],
      videoWidth: Number(_0x461696?.['videoWidth']) || Number(_0x4a4020?.['frame']?.['width']) || 0x0,
      videoHeight: Number(_0x461696?.['videoHeight']) || Number(_0x4a4020?.['frame']?.['height']) || 0x0,
    },
    posterUrl: normalizeMediaUrl(_0x4a4020?.['keyframeRef']),
    durationSec: durationSec,
    videoWidth: Number(_0x461696?.['videoWidth']) || Number(_0x4a4020?.['frame']?.['width']) || 0x0,
    videoHeight: Number(_0x461696?.['videoHeight']) || Number(_0x4a4020?.['frame']?.['height']) || 0x0,
    initialStartSec: 0x0,
    initialEndSec: durationSec,
    dimMode: ![],
    reverseControl: createReverseControl({
      selectedShot: _0x4a4020,
      getProject: getProject,
      acceptProject: acceptProject,
      requestReverseChange: requestReverseChange,
    }),
    onConfirm: (_0x20df06) => {
      return (
        assertPersonReplacementVideoCropSourceCurrent({
          project: getProject(),
          projectId: projectId,
          shotId: _0x4a4020?.['id'],
          result: _0x20df06,
        }),
        onConfirm(_0x20df06)
      );
    },
    onExit: onExit,
  };
}
