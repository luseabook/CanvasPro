import { getMediaClipTimelineDisplayDuration } from '../../components/media-clip/mediaClipTimelineModel.js';
export const PERSON_REPLACEMENT_CUT_DEFAULT_FPS = 0x18;
export const PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX = 0x3c0;
export const PERSON_REPLACEMENT_CUT_MIN_SEC = 0.001;
export const PERSON_REPLACEMENT_CUT_EPSILON_SEC = 0.001;
function normalizeText(_0x201c9c, _0x53dfcf = '') {
  const _0x2aa0b3 = String(_0x201c9c ?? '')['trim']();
  return _0x2aa0b3 || _0x53dfcf;
}
function clamp(_0x5cb364, _0x19b56d, _0x4ec8ad, _0x12c9b2 = _0x19b56d) {
  const _0x5b01d5 = Number(_0x5cb364);
  return Number['isFinite'](_0x5b01d5)
    ? Math['min'](_0x4ec8ad, Math['max'](_0x19b56d, _0x5b01d5))
    : _0x12c9b2;
}
function getPersonReplacementSourceShotBounds(_0x4e9f2d = []) {
  const _0x1d3b31 = new Map();
  return (
    (Array['isArray'](_0x4e9f2d) ? _0x4e9f2d : [])['forEach']((_0x60c55f) => {
      const _0x40ce6f = normalizeText(_0x60c55f?.['sourceId']);
      if (!_0x40ce6f) return;
      const _0xfb3f0c = Math['max'](0x0, Number(_0x60c55f?.['startTimeSec']) || 0x0),
        _0x5daec5 = Math['max'](_0xfb3f0c, Number(_0x60c55f?.['endTimeSec']) || _0xfb3f0c),
        _0x1834f8 = _0x1d3b31['get'](_0x40ce6f);
      _0x1d3b31['set'](
        _0x40ce6f,
        _0x1834f8
          ? {
              startSec: Math['min'](_0x1834f8['startSec'], _0xfb3f0c),
              endSec: Math['max'](_0x1834f8['endSec'], _0x5daec5),
            }
          : { startSec: _0xfb3f0c, endSec: _0x5daec5 },
      );
    }),
    _0x1d3b31
  );
}
function findPersonReplacementShotCutOrigin(_0x1cb3b3 = [], _0x7455ce = 0x0, _0x5ef9ad = 0x0) {
  let _0x36e9c3 = null,
    _0x59474d = -0x1,
    _0x526b94 = Number['POSITIVE_INFINITY'];
  const _0x22e162 = _0x7455ce + (_0x5ef9ad - _0x7455ce) / 0x2;
  return (
    (Array['isArray'](_0x1cb3b3) ? _0x1cb3b3 : [])['forEach']((_0x4538c2) => {
      const _0x372383 = Math['max'](0x0, Number(_0x4538c2?.['startTimeSec']) || 0x0),
        _0x76dead = Math['max'](_0x372383, Number(_0x4538c2?.['endTimeSec']) || _0x372383),
        _0x3fb1f1 = Math['max'](0x0, Math['min'](_0x5ef9ad, _0x76dead) - Math['max'](_0x7455ce, _0x372383)),
        _0xda84b0 = _0x372383 + (_0x76dead - _0x372383) / 0x2,
        _0x89b195 = Math['abs'](_0x22e162 - _0xda84b0);
      (_0x3fb1f1 > _0x59474d || (_0x3fb1f1 === _0x59474d && _0x89b195 < _0x526b94)) &&
        ((_0x36e9c3 = _0x4538c2), (_0x59474d = _0x3fb1f1), (_0x526b94 = _0x89b195));
    }),
    _0x36e9c3
  );
}
function getPersonReplacementShotCutKeyframePatch(_0x4f857c = {}) {
  const _0x42ccfd = normalizeText(_0x4f857c?.['keyframeRef']);
  if (!_0x42ccfd) return null;
  const _0x1f746d = Math['max'](0x0, Number(_0x4f857c?.['startSec']) || 0x0),
    _0x54fd61 = Math['max'](_0x1f746d, Number(_0x4f857c?.['endSec']) || _0x1f746d),
    _0x3f91d1 = Number(_0x4f857c?.['keyframeTimeSec']),
    _0x270c36 = Math['max'](0x0, Number(_0x4f857c?.['frame']?.['width']) || 0x0),
    _0x5b5b14 = Math['max'](0x0, Number(_0x4f857c?.['frame']?.['height']) || 0x0);
  return {
    keyframeRef: _0x42ccfd,
    keyframeTimeSec: Number['isFinite'](_0x3f91d1)
      ? clamp(_0x3f91d1, _0x1f746d, _0x54fd61, _0x1f746d)
      : _0x1f746d,
    ...(_0x4f857c?.['keyframeManuallySelected'] === !![] ? { keyframeManuallySelected: !![] } : {}),
    ...(_0x270c36 && _0x5b5b14 ? { frame: { width: _0x270c36, height: _0x5b5b14 } } : {}),
  };
}
function removePersonReplacementShotCutKeyframe(_0x429a75 = {}) {
  const _0x56f904 = { ..._0x429a75 };
  return (
    delete _0x56f904['keyframeRef'],
    delete _0x56f904['keyframeTimeSec'],
    delete _0x56f904['keyframeManuallySelected'],
    delete _0x56f904['frame'],
    _0x56f904
  );
}
export function buildPersonReplacementDetectedShotCutRanges({
  source: _0x57acd6,
  shots: shots = [],
  shotBundles: shotBundles = [],
  fps: fps = PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
} = {}) {
  const _0x182126 = normalizeText(_0x57acd6?.['id']),
    _0x16fbea = (Array['isArray'](shots) ? shots : [])
      ['filter']((_0xc5e2eb) => normalizeText(_0xc5e2eb?.['sourceId']) === _0x182126)
      ['sort'](
        (_0x546888, _0x3798c1) =>
          Number(_0x546888?.['startTimeSec']) - Number(_0x3798c1?.['startTimeSec']) ||
          Number(_0x546888?.['endTimeSec']) - Number(_0x3798c1?.['endTimeSec']),
      );
  if (!_0x182126 || !_0x16fbea['length']) throw new Error('智能检测缺少可映射的原始片段');
  const _0x134a92 = Math['max'](0x0, Number(_0x16fbea[0x0]?.['startTimeSec']) || 0x0),
    _0x37af51 = Math['max'](
      _0x134a92,
      Number(_0x16fbea[_0x16fbea['length'] - 0x1]?.['endTimeSec']) || _0x134a92,
    ),
    _0x488710 = (Array['isArray'](shotBundles) ? shotBundles : [])
      ['filter']((_0x46ecfb) => _0x46ecfb && typeof _0x46ecfb === 'object')
      ['sort'](
        (_0x87775a, _0x5d7998) =>
          Number(_0x87775a?.['start']) - Number(_0x5d7998?.['start']) ||
          Number(_0x87775a?.['end']) - Number(_0x5d7998?.['end']),
      ),
    _0x4d58a4 = [];
  _0x488710['forEach']((_0x2f3a98, _0x37542d) => {
    const _0x4544b0 =
        _0x37542d === 0x0 ? _0x134a92 : Math['max'](_0x134a92, Number(_0x2f3a98?.['start']) || _0x134a92),
      _0x40ab7d = Math['min'](_0x37af51, _0x4544b0),
      _0x5b097e = _0x4d58a4[_0x4d58a4['length'] - 0x1],
      _0x29ba8d = _0x5b097e && _0x37af51 - _0x40ab7d < PERSON_REPLACEMENT_CUT_MIN_SEC,
      _0x2e1675 = _0x5b097e && _0x40ab7d - _0x5b097e['startSec'] < PERSON_REPLACEMENT_CUT_MIN_SEC;
    if (_0x29ba8d || _0x2e1675) return;
    _0x4d58a4['push']({ bundle: _0x2f3a98, startSec: _0x40ab7d });
  });
  if (!_0x4d58a4['length'] || !(_0x37af51 > _0x134a92)) throw new Error('智能检测未返回可用切口');
  const _0x58187f = new Set();
  return _0x4d58a4['map']((_0x3bcc02, _0x403587) => {
    const _0x280650 = _0x403587 === 0x0 ? _0x134a92 : _0x3bcc02['startSec'],
      _0x577176 = _0x403587 + 0x1 < _0x4d58a4['length'] ? _0x4d58a4[_0x403587 + 0x1]['startSec'] : _0x37af51;
    if (_0x577176 - _0x280650 < PERSON_REPLACEMENT_CUT_MIN_SEC) throw new Error('智能检测返回了无效切口');
    const _0x24d5ad = findPersonReplacementShotCutOrigin(_0x16fbea, _0x280650, _0x577176),
      _0xe26da5 = normalizeText(_0x24d5ad?.['id']);
    if (!_0xe26da5) throw new Error('智能检测结果无法映射到原始片段');
    const _0x277283 = _0xe26da5 + ':detected:' + Math['round'](_0x280650 * 0x3e8),
      _0x3b39fe = _0x58187f['has'](_0xe26da5) ? _0x277283 : _0xe26da5;
    _0x58187f['add'](_0x3b39fe);
    const _0x26d217 = Math['max'](
        0x1,
        Number(_0x3bcc02['bundle']?.['fps']) ||
          Number(fps) ||
          Number(_0x24d5ad?.['outputFps']) ||
          PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
      ),
      _0x140f64 = normalizeText(_0x3bcc02['bundle']?.['keyframeRef']),
      _0x10bcbc = Number(_0x3bcc02['bundle']?.['keyframeTimeSec']),
      _0x2cf114 = Number['isFinite'](_0x10bcbc)
        ? Math['max'](_0x280650, Math['min'](_0x577176, _0x10bcbc))
        : _0x280650;
    return {
      shotId: _0x3b39fe,
      sourceId: _0x182126,
      ...(_0x3b39fe !== _0xe26da5 ? { originShotId: _0xe26da5 } : {}),
      startSec: _0x280650,
      endSec: _0x577176,
      durationSec: _0x577176 - _0x280650,
      outputFps: _0x26d217,
      ...(_0x140f64 ? { keyframeRef: _0x140f64, keyframeTimeSec: _0x2cf114 } : {}),
    };
  });
}
export function normalizePersonReplacementShotCutRanges(
  _0x131737 = [],
  _0x1a238f = [],
  { allowTimelineReplacement: allowTimelineReplacement = ![] } = {},
) {
  const _0x54f812 = Array['isArray'](_0x131737) ? _0x131737 : [],
    _0x309c21 = new Map(_0x54f812['map']((_0xab79a0) => [normalizeText(_0xab79a0?.['id']), _0xab79a0])),
    _0xe5e86c = getPersonReplacementSourceShotBounds(_0x54f812),
    _0x26b8e8 = Array['isArray'](_0x1a238f) ? _0x1a238f : [];
  if (!_0x54f812['length'] || (!allowTimelineReplacement && _0x26b8e8['length'] < _0x54f812['length']))
    throw new Error('切口结果必须覆盖当前时间轴的全部片段');
  const _0x503309 = new Set(),
    _0x2ae6d4 = _0x26b8e8['map']((_0x130548) => {
      const _0x549474 = normalizeText(_0x130548?.['shotId']),
        _0x1ac837 = normalizeText(_0x130548?.['originShotId']),
        _0x4d6315 = _0x1ac837 || _0x549474,
        _0x927eda = _0x309c21['get'](_0x4d6315),
        _0x1efcdc = Number(_0x130548?.['startSec']),
        _0x22c3da = Number(_0x130548?.['endSec']);
      if (
        !_0x927eda ||
        !_0x549474 ||
        _0x503309['has'](_0x549474) ||
        normalizeText(_0x130548['sourceId'] || _0x927eda['sourceId']) !==
          normalizeText(_0x927eda['sourceId']) ||
        !Number['isFinite'](_0x1efcdc) ||
        !Number['isFinite'](_0x22c3da) ||
        _0x1efcdc < 0x0 ||
        _0x22c3da - _0x1efcdc < PERSON_REPLACEMENT_CUT_MIN_SEC
      )
        throw new Error('片段\x20' + (_0x549474 || '未知') + ' 的切口范围无效');
      _0x503309['add'](_0x549474);
      const _0x864bd0 = normalizeText(_0x130548?.['keyframeRef']),
        _0x4ab28e = Number(_0x130548?.['keyframeTimeSec']),
        _0x5824b7 = Number['isFinite'](_0x4ab28e)
          ? Math['max'](_0x1efcdc, Math['min'](_0x22c3da, _0x4ab28e))
          : _0x1efcdc,
        _0x2f2444 = Math['max'](0x0, Number(_0x130548?.['frame']?.['width']) || 0x0),
        _0x46f555 = Math['max'](0x0, Number(_0x130548?.['frame']?.['height']) || 0x0);
      return {
        shotId: _0x549474,
        sourceId: normalizeText(_0x927eda['sourceId']),
        startSec: _0x1efcdc,
        endSec: _0x22c3da,
        ...(_0x1ac837 ? { originShotId: _0x1ac837 } : {}),
        ...(_0x130548?.['isReversed'] === !![] ? { isReversed: !![] } : {}),
        ...(_0x864bd0
          ? {
              keyframeRef: _0x864bd0,
              keyframeTimeSec: _0x5824b7,
              ...(_0x130548?.['keyframeManuallySelected'] === !![] ? { keyframeManuallySelected: !![] } : {}),
              ...(_0x2f2444 && _0x46f555 ? { frame: { width: _0x2f2444, height: _0x46f555 } } : {}),
            }
          : {}),
      };
    });
  return (
    _0x2ae6d4['forEach']((_0x54b599, _0xe94c5b) => {
      const _0x290267 = _0x2ae6d4[_0xe94c5b - 0x1],
        _0xafd8ca = _0x2ae6d4[_0xe94c5b + 0x1],
        _0x35c32a = _0x309c21['get'](_0x54b599['originShotId'] || _0x54b599['shotId']),
        _0x4a783a = _0xe5e86c['get'](_0x54b599['sourceId']);
      if (!_0x35c32a) throw new Error('片段 ' + (_0x54b599['shotId'] || '未知') + ' 缺少原始片段');
      const _0xa0e65f = allowTimelineReplacement
          ? Number(_0x4a783a?.['startSec'])
          : Number(_0x35c32a['startTimeSec']),
        _0x59fd07 = allowTimelineReplacement
          ? Number(_0x4a783a?.['endSec'])
          : Number(_0x35c32a['endTimeSec']);
      if (
        (!_0x290267 || _0x290267['sourceId'] !== _0x54b599['sourceId']) &&
        Math['abs'](_0x54b599['startSec'] - (_0xa0e65f || 0x0)) > PERSON_REPLACEMENT_CUT_EPSILON_SEC
      )
        throw new Error('每段源视频的起点不能通过内部切口编辑器修改');
      if (
        (!_0xafd8ca || _0xafd8ca['sourceId'] !== _0x54b599['sourceId']) &&
        Math['abs'](_0x54b599['endSec'] - (_0x59fd07 || 0x0)) > PERSON_REPLACEMENT_CUT_EPSILON_SEC
      )
        throw new Error('每段源视频的终点不能通过内部切口编辑器修改');
      if (
        _0x290267 &&
        _0x290267['sourceId'] === _0x54b599['sourceId'] &&
        Math['abs'](_0x290267['endSec'] - _0x54b599['startSec']) > PERSON_REPLACEMENT_CUT_EPSILON_SEC
      )
        throw new Error('相邻片段必须共享同一个切口');
    }),
    !allowTimelineReplacement &&
      _0x54f812['forEach']((_0x1e7335) => {
        const _0x33b32e = normalizeText(_0x1e7335?.['id']);
        if (
          !_0x2ae6d4['some']((_0x1e27f9) => (_0x1e27f9['originShotId'] || _0x1e27f9['shotId']) === _0x33b32e)
        )
          throw new Error('切口结果必须覆盖当前时间轴的全部片段');
      }),
    _0x2ae6d4
  );
}
export function getPersonReplacementShotDurationSec(_0x17b4d0) {
  const _0x3f5765 = Number(_0x17b4d0?.['durationSec']);
  if (Number['isFinite'](_0x3f5765) && _0x3f5765 > 0x0) return _0x3f5765;
  const _0x3cd0e8 = Number(_0x17b4d0?.['endTimeSec']) - Number(_0x17b4d0?.['startTimeSec']);
  return Number['isFinite'](_0x3cd0e8) && _0x3cd0e8 > 0x0 ? _0x3cd0e8 : 0.1;
}
export function getPersonReplacementShotCutFrameSec(_0x20dc97, _0x41e9e1) {
  const _0x1ceee9 = Math['max'](
    0x1,
    Number(_0x20dc97?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
    Number(_0x41e9e1?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
  );
  return Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, 0x1 / _0x1ceee9);
}
function getPersonReplacementShotCutSplitFrameSec(_0x201460 = {}) {
  const _0x60af4f = Math['max'](0x1, Number(_0x201460?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS);
  return Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, 0x1 / _0x60af4f);
}
export function canSplitPersonReplacementShotCutRange(_0x2f0930 = {}, _0x4e2d39 = 0x0) {
  const _0x4696c2 = Math['max'](
      PERSON_REPLACEMENT_CUT_MIN_SEC,
      Number(_0x2f0930?.['durationSec']) ||
        Number(_0x2f0930?.['endSec']) - Number(_0x2f0930?.['startSec']) ||
        0x0,
    ),
    _0x1af299 = getPersonReplacementShotCutSplitFrameSec(_0x2f0930),
    _0x5c4150 = Number(_0x4e2d39);
  return Number['isFinite'](_0x5c4150) && _0x5c4150 >= _0x1af299 && _0x5c4150 <= _0x4696c2 - _0x1af299;
}
function getPersonReplacementShotCutMergeSelection(_0xcdf2ed = [], _0x474d5c = []) {
  const _0xce0029 = Array['isArray'](_0xcdf2ed) ? _0xcdf2ed : [],
    _0x2c47a4 = [
      ...new Set((Array['isArray'](_0x474d5c) ? _0x474d5c : [])['map'](normalizeText)['filter'](Boolean)),
    ];
  if (_0x2c47a4['length'] !== 0x2) return null;
  const _0x403e42 = _0x2c47a4['map']((_0x418cc6) =>
    _0xce0029['findIndex']((_0x25b176) => normalizeText(_0x25b176?.['shotId']) === _0x418cc6),
  )['sort']((_0x11ff6e, _0x18c2c8) => _0x11ff6e - _0x18c2c8);
  if (_0x403e42[0x0] < 0x0 || _0x403e42[0x1] !== _0x403e42[0x0] + 0x1) return null;
  const _0x46dec8 = _0xce0029[_0x403e42[0x0]],
    _0x4ced65 = _0xce0029[_0x403e42[0x1]];
  if (
    !normalizeText(_0x46dec8?.['sourceId']) ||
    normalizeText(_0x46dec8?.['sourceId']) !== normalizeText(_0x4ced65?.['sourceId']) ||
    Boolean(_0x46dec8?.['isReversed']) !== Boolean(_0x4ced65?.['isReversed']) ||
    Math['abs'](Number(_0x46dec8?.['endSec']) - Number(_0x4ced65?.['startSec'])) >
      PERSON_REPLACEMENT_CUT_EPSILON_SEC
  )
    return null;
  return { left: _0x46dec8, right: _0x4ced65, leftIndex: _0x403e42[0x0] };
}
export function canMergePersonReplacementShotCutRanges(_0x5de82f = [], _0x2688c8 = []) {
  return Boolean(getPersonReplacementShotCutMergeSelection(_0x5de82f, _0x2688c8));
}
export function mergePersonReplacementShotCutRanges(
  _0x394122 = [],
  _0x86e9cc = [],
  { preferredShotId: preferredShotId = '' } = {},
) {
  const _0x2acf31 = Array['isArray'](_0x394122) ? _0x394122 : [],
    _0x219da5 = getPersonReplacementShotCutMergeSelection(_0x2acf31, _0x86e9cc);
  if (!_0x219da5) return _0x394122;
  const { left: _0x226e98, right: _0x3f4a60, leftIndex: _0x115bd5 } = _0x219da5,
    _0x3186d5 = Math['max'](0x0, Number(_0x226e98['startSec']) || 0x0),
    _0x461d68 = Math['max'](_0x3186d5, Number(_0x3f4a60['endSec']) || _0x3186d5);
  if (_0x461d68 - _0x3186d5 < PERSON_REPLACEMENT_CUT_MIN_SEC) return _0x394122;
  const _0x25d939 = normalizeText(_0x226e98['originShotId']) || normalizeText(_0x226e98['shotId']),
    _0x532b0b =
      _0x25d939 + ':merge:' + Math['round'](_0x3186d5 * 0x3e8) + '-' + Math['round'](_0x461d68 * 0x3e8);
  if (
    !_0x25d939 ||
    _0x2acf31['some'](
      (_0x417681, _0x25da1d) =>
        _0x25da1d !== _0x115bd5 &&
        _0x25da1d !== _0x115bd5 + 0x1 &&
        normalizeText(_0x417681?.['shotId']) === _0x532b0b,
    )
  )
    return _0x394122;
  const _0x30d0ec = normalizeText(preferredShotId),
    _0x14cf67 = [_0x226e98, _0x3f4a60]
      ['sort']((_0x53e36f) => (normalizeText(_0x53e36f?.['shotId']) === _0x30d0ec ? -0x1 : 0x1))
      ['find']((_0x36422a) => getPersonReplacementShotCutKeyframePatch(_0x36422a)),
    _0x1badf7 = _0x14cf67 ? getPersonReplacementShotCutKeyframePatch(_0x14cf67) : null,
    _0x5b666b = {
      ...removePersonReplacementShotCutKeyframe(_0x226e98),
      shotId: _0x532b0b,
      originShotId: _0x25d939,
      startSec: _0x3186d5,
      endSec: _0x461d68,
      durationSec: _0x461d68 - _0x3186d5,
      outputFps: Math['max'](
        0x1,
        Number(_0x226e98['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
        Number(_0x3f4a60['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
      ),
      ...(_0x1badf7 || {}),
    };
  return _0x2acf31['flatMap']((_0x3cfdca, _0x4ee22e) => {
    if (_0x4ee22e === _0x115bd5) return [_0x5b666b];
    if (_0x4ee22e === _0x115bd5 + 0x1) return [];
    return [_0x3cfdca];
  })['map']((_0xc74e77, _0x4c8e88) => ({ ..._0xc74e77, index: _0x4c8e88 }));
}
export function createPersonReplacementShotCutDraft(_0x1822db = {}) {
  const _0x55e53b = Array['isArray'](_0x1822db['shots']) ? _0x1822db['shots'] : [],
    _0x1aaffe = _0x55e53b['map']((_0x529e7a, _0x46843c) => {
      const _0x4891b8 = Math['max'](0x0, Number(_0x529e7a['startTimeSec']) || 0x0),
        _0x568b03 = Math['max'](_0x4891b8, Number(_0x529e7a['endTimeSec']) || _0x4891b8),
        _0x54ff4e =
          _0x529e7a?.['keyframeManuallySelected'] === !![]
            ? getPersonReplacementShotCutKeyframePatch({
                ..._0x529e7a,
                startSec: _0x4891b8,
                endSec: _0x568b03,
              })
            : null;
      return {
        shotId: normalizeText(_0x529e7a['id']),
        sourceId: normalizeText(_0x529e7a['sourceId']),
        index: _0x46843c,
        startSec: _0x4891b8,
        endSec: _0x568b03,
        durationSec: Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, _0x568b03 - _0x4891b8),
        outputFps: Math['max'](0x1, Number(_0x529e7a['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS),
        ...(_0x529e7a['isReversed'] === !![] ? { isReversed: !![] } : {}),
        ...(_0x54ff4e || {}),
      };
    });
  for (let _0x17b182 = 0x1; _0x17b182 < _0x1aaffe['length']; _0x17b182 += 0x1) {
    const _0x5614d2 = _0x1aaffe[_0x17b182 - 0x1],
      _0x410a0b = _0x1aaffe[_0x17b182];
    if (!_0x5614d2['sourceId'] || _0x5614d2['sourceId'] !== _0x410a0b['sourceId']) continue;
    const _0x46283c = getPersonReplacementShotCutFrameSec(_0x5614d2, _0x410a0b),
      _0xe7512a = _0x5614d2['startSec'] + _0x46283c,
      _0x35b218 = _0x410a0b['endSec'] - _0x46283c;
    if (_0x35b218 < _0xe7512a) continue;
    const _0x243f00 = clamp(_0x410a0b['startSec'], _0xe7512a, _0x35b218, _0x5614d2['endSec']);
    ((_0x5614d2['endSec'] = _0x243f00),
      (_0x5614d2['durationSec'] = Math['max'](_0x46283c, _0x243f00 - _0x5614d2['startSec'])),
      (_0x410a0b['startSec'] = _0x243f00),
      (_0x410a0b['durationSec'] = Math['max'](_0x46283c, _0x410a0b['endSec'] - _0x243f00)));
  }
  return _0x1aaffe;
}
export function doesPersonReplacementShotCutDraftReplaceTimeline(_0x23ac54 = [], _0x4482ec = []) {
  const _0x440e08 = new Set(
    (Array['isArray'](_0x4482ec) ? _0x4482ec : [])
      ['map'](
        (_0x4a343f) => normalizeText(_0x4a343f?.['originShotId']) || normalizeText(_0x4a343f?.['shotId']),
      )
      ['filter'](Boolean),
  );
  return (Array['isArray'](_0x23ac54) ? _0x23ac54 : [])['some'](
    (_0x21d5b0) => !_0x440e08['has'](normalizeText(_0x21d5b0?.['id'])),
  );
}
export function createPersonReplacementShotCutUpdateRequest(_0x2958d2 = [], _0x59d396 = [], _0x22c7c2 = '') {
  return {
    selectedShotId: normalizeText(_0x22c7c2),
    replaceTimeline: doesPersonReplacementShotCutDraftReplaceTimeline(_0x2958d2, _0x59d396),
    ranges: (Array['isArray'](_0x59d396) ? _0x59d396 : [])['map']((_0x34c0bb) => ({
      shotId: _0x34c0bb['shotId'],
      sourceId: _0x34c0bb['sourceId'],
      startSec: _0x34c0bb['startSec'],
      endSec: _0x34c0bb['endSec'],
      ...(_0x34c0bb['originShotId'] ? { originShotId: _0x34c0bb['originShotId'] } : {}),
      ...(_0x34c0bb['isReversed'] === !![] ? { isReversed: !![] } : {}),
      ...(_0x34c0bb['keyframeRef']
        ? {
            keyframeRef: _0x34c0bb['keyframeRef'],
            keyframeTimeSec: _0x34c0bb['keyframeTimeSec'],
            ...(_0x34c0bb['keyframeManuallySelected'] === !![] ? { keyframeManuallySelected: !![] } : {}),
            frame: _0x34c0bb['frame'],
          }
        : {}),
    })),
  };
}
export function hasPersonReplacementShotCutUpdateChanges(_0x13e82c = [], _0x59982e = []) {
  const _0xa2d8e1 = Array['isArray'](_0x13e82c) ? _0x13e82c : [],
    _0x137f76 = Array['isArray'](_0x59982e) ? _0x59982e : [],
    _0x263ffc = new Map(_0xa2d8e1['map']((_0x18164b) => [normalizeText(_0x18164b?.['id']), _0x18164b]));
  if (_0xa2d8e1['length'] !== _0x137f76['length']) return !![];
  return _0x137f76['some']((_0x134a54) => {
    const _0xd70132 = normalizeText(_0x134a54?.['shotId']),
      _0x121e00 = _0x263ffc['get'](_0xd70132) || _0x263ffc['get'](normalizeText(_0x134a54?.['originShotId'])),
      _0x34119c = normalizeText(_0x134a54?.['keyframeRef']);
    return (
      !_0x121e00 ||
      !_0x263ffc['has'](_0xd70132) ||
      Math['abs'](Number(_0x134a54?.['startSec']) - Number(_0x121e00?.['startTimeSec'])) >
        PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
      Math['abs'](Number(_0x134a54?.['endSec']) - Number(_0x121e00?.['endTimeSec'])) >
        PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
      Boolean(_0x134a54?.['isReversed']) !== Boolean(_0x121e00?.['isReversed']) ||
      Boolean(
        _0x34119c &&
        Boolean(_0x134a54?.['keyframeManuallySelected']) !== Boolean(_0x121e00?.['keyframeManuallySelected']),
      ) ||
      Boolean(
        _0x34119c &&
        (_0x34119c !== normalizeText(_0x121e00?.['keyframeRef']) ||
          Math['abs'](Number(_0x134a54?.['keyframeTimeSec']) - Number(_0x121e00?.['keyframeTimeSec'])) >
            PERSON_REPLACEMENT_CUT_EPSILON_SEC),
      )
    );
  });
}
export function movePersonReplacementShotCutBoundary(_0x972425 = [], _0x26d1d4, _0x5e5720) {
  const _0x38971b = (Array['isArray'](_0x972425) ? _0x972425 : [])['map']((_0x3374c8) => ({ ..._0x3374c8 })),
    _0x5b05db = Math['trunc'](Number(_0x26d1d4));
  if (!(_0x5b05db > 0x0 && _0x5b05db < _0x38971b['length'])) return _0x38971b;
  const _0x19d5ad = _0x38971b[_0x5b05db - 0x1],
    _0x2ddca2 = _0x38971b[_0x5b05db];
  if (!_0x19d5ad?.['sourceId'] || _0x19d5ad['sourceId'] !== _0x2ddca2?.['sourceId']) return _0x38971b;
  const _0x490d8b = getPersonReplacementShotCutFrameSec(_0x19d5ad, _0x2ddca2),
    _0x2c40c5 = Math['max'](
      0x1,
      Number(_0x19d5ad['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
      Number(_0x2ddca2['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
    ),
    _0x4f20e8 = _0x19d5ad['startSec'] + _0x490d8b,
    _0x3c6a89 = _0x2ddca2['endSec'] - _0x490d8b;
  if (_0x3c6a89 < _0x4f20e8) return _0x38971b;
  const _0x5975d1 = clamp(_0x5e5720, _0x4f20e8, _0x3c6a89, _0x2ddca2['startSec']),
    _0x392623 = clamp(Math['round'](_0x5975d1 * _0x2c40c5) / _0x2c40c5, _0x4f20e8, _0x3c6a89, _0x5975d1);
  return (
    (_0x19d5ad['endSec'] = _0x392623),
    (_0x19d5ad['durationSec'] = Math['max'](_0x490d8b, _0x392623 - _0x19d5ad['startSec'])),
    (_0x2ddca2['startSec'] = _0x392623),
    (_0x2ddca2['durationSec'] = Math['max'](_0x490d8b, _0x2ddca2['endSec'] - _0x392623)),
    _0x38971b
  );
}
export function countEditablePersonReplacementShotCuts(_0x515247 = []) {
  return _0x515247['reduce'](
    (_0x87fb32, _0x4c875d, _0x344fb4) =>
      _0x344fb4 > 0x0 && _0x515247[_0x344fb4 - 0x1]?.['sourceId'] === _0x4c875d['sourceId']
        ? _0x87fb32 + 0x1
        : _0x87fb32,
    0x0,
  );
}
export function getPersonReplacementShotCutTotalDuration(_0x39680b = []) {
  return (Array['isArray'](_0x39680b) ? _0x39680b : [])['reduce'](
    (_0x440d39, _0x270609) =>
      _0x440d39 + Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(_0x270609?.['durationSec']) || 0x0),
    0x0,
  );
}
export function getPersonReplacementShotCutDisplayDuration(_0x4234fa = []) {
  return getMediaClipTimelineDisplayDuration(getPersonReplacementShotCutTotalDuration(_0x4234fa));
}
export function getPersonReplacementShotCutPositionAtTimelineSec(_0x33bc86 = [], _0x47ccb1 = 0x0) {
  const _0x175725 = Array['isArray'](_0x33bc86) ? _0x33bc86 : [],
    _0x4dad47 = getPersonReplacementShotCutTotalDuration(_0x175725),
    _0x159e64 = clamp(_0x47ccb1, 0x0, _0x4dad47, 0x0);
  let _0x288b0e = 0x0;
  for (let _0x472c56 = 0x0; _0x472c56 < _0x175725['length']; _0x472c56 += 0x1) {
    const _0x4b58b8 = _0x175725[_0x472c56],
      _0x127fb7 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(_0x4b58b8?.['durationSec']) || 0x0),
      _0x287af5 = _0x472c56 === _0x175725['length'] - 0x1;
    if (_0x159e64 < _0x288b0e + _0x127fb7 || _0x287af5) {
      const _0x1bf082 = clamp(_0x159e64 - _0x288b0e, 0x0, _0x127fb7, 0x0),
        _0x5df65e = Number(_0x4b58b8?.['startSec']) || 0x0,
        _0xd783c6 = Math['max'](_0x5df65e, Number(_0x4b58b8?.['endSec']) || _0x5df65e),
        _0x5b2132 = getPersonReplacementShotCutSplitFrameSec(_0x4b58b8),
        _0x1de853 = Math['max'](0x0, _0xd783c6 - _0x5df65e - Math['min'](_0x5b2132, _0xd783c6 - _0x5df65e)),
        _0x56412c = _0x127fb7 > 0x0 ? clamp(_0x1bf082 / _0x127fb7, 0x0, 0x1, 0x0) : 0x0;
      return {
        shotId: normalizeText(_0x4b58b8?.['shotId']),
        sourceId: normalizeText(_0x4b58b8?.['sourceId']),
        shotIndex: _0x472c56,
        sourceTimeSec:
          _0x4b58b8?.['isReversed'] === !![]
            ? clamp(_0x5df65e + _0x1de853 * (0x1 - _0x56412c), _0x5df65e, _0xd783c6, _0x5df65e)
            : clamp(_0x5df65e + _0x1bf082, _0x5df65e, _0xd783c6, _0x5df65e),
        timelineSec: _0x159e64,
        totalDurationSec: _0x4dad47,
      };
    }
    _0x288b0e += _0x127fb7;
  }
  return {
    shotId: '',
    sourceId: '',
    shotIndex: -0x1,
    sourceTimeSec: 0x0,
    timelineSec: 0x0,
    totalDurationSec: _0x4dad47,
  };
}
export function splitPersonReplacementShotCutAtTimelineSec(_0x2bb3c9 = [], _0x225bc2 = 0x0) {
  const _0x5a4fa3 = Array['isArray'](_0x2bb3c9) ? _0x2bb3c9 : [],
    _0x4ef0fa = getPersonReplacementShotCutTotalDuration(_0x5a4fa3),
    _0x581695 = clamp(_0x225bc2, 0x0, _0x4ef0fa, 0x0);
  let _0x3137cf = 0x0;
  for (let _0x41dcad = 0x0; _0x41dcad < _0x5a4fa3['length']; _0x41dcad += 0x1) {
    const _0x2a38fc = _0x5a4fa3[_0x41dcad],
      _0x4c8965 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(_0x2a38fc?.['durationSec']) || 0x0),
      _0x593849 = _0x581695 - _0x3137cf;
    if (!canSplitPersonReplacementShotCutRange(_0x2a38fc, _0x593849)) {
      _0x3137cf += _0x4c8965;
      continue;
    }
    const _0x3f4176 = clamp(
        Number(_0x2a38fc['startSec']) + _0x593849,
        Number(_0x2a38fc['startSec']) || 0x0,
        Number(_0x2a38fc['endSec']) || Number(_0x2a38fc['startSec']) || 0x0,
        Number(_0x2a38fc['startSec']) || 0x0,
      ),
      _0x57f5c8 = normalizeText(_0x2a38fc['originShotId']) || normalizeText(_0x2a38fc['shotId']),
      _0xe85c91 = _0x57f5c8 + ':split:' + Math['round'](_0x3f4176 * 0x3e8);
    if (_0x5a4fa3['some']((_0x592d0b) => normalizeText(_0x592d0b?.['shotId']) === _0xe85c91))
      return _0x5a4fa3;
    const _0x36606e = getPersonReplacementShotCutKeyframePatch(_0x2a38fc),
      _0x381fac = _0x36606e ? removePersonReplacementShotCutKeyframe(_0x2a38fc) : { ..._0x2a38fc },
      _0xcd0883 = {
        ..._0x381fac,
        endSec: _0x3f4176,
        durationSec: Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, _0x3f4176 - _0x2a38fc['startSec']),
      },
      _0x428bcc = {
        ..._0x381fac,
        shotId: _0xe85c91,
        originShotId: _0x57f5c8,
        startSec: _0x3f4176,
        durationSec: Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, _0x2a38fc['endSec'] - _0x3f4176),
      };
    return (
      _0x36606e &&
        Object['assign'](_0x36606e['keyframeTimeSec'] < _0x3f4176 ? _0xcd0883 : _0x428bcc, _0x36606e),
      _0x5a4fa3['flatMap']((_0x3d3ba4, _0x399b6a) =>
        _0x399b6a === _0x41dcad ? [_0xcd0883, _0x428bcc] : [_0x3d3ba4],
      )['map']((_0x17efaa, _0x4f427b) => ({ ..._0x17efaa, index: _0x4f427b }))
    );
  }
  return _0x5a4fa3;
}
export function getPersonReplacementShotCutTimelineSec(_0x1d530a = [], _0x51192e, _0x53dc10) {
  const _0x60e339 = normalizeText(_0x51192e);
  let _0x3a4396 = 0x0;
  for (const _0x1e6315 of Array['isArray'](_0x1d530a) ? _0x1d530a : []) {
    const _0x2ec013 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(_0x1e6315?.['durationSec']) || 0x0);
    if (normalizeText(_0x1e6315?.['shotId']) === _0x60e339) {
      if (_0x1e6315?.['isReversed'] === !![]) {
        const _0x58733f = Number(_0x1e6315?.['startSec']) || 0x0,
          _0x21fbb3 = Math['max'](_0x58733f, Number(_0x1e6315?.['endSec']) || _0x58733f),
          _0x1c8ef6 = getPersonReplacementShotCutSplitFrameSec(_0x1e6315),
          _0x23b176 = Math['max'](0x0, _0x21fbb3 - _0x58733f - Math['min'](_0x1c8ef6, _0x21fbb3 - _0x58733f));
        if (!(_0x23b176 > 0x0)) return _0x3a4396;
        const _0x3503ed = clamp(Number(_0x53dc10) - _0x58733f, 0x0, _0x23b176, 0x0);
        return _0x3a4396 + (0x1 - _0x3503ed / _0x23b176) * _0x2ec013;
      }
      return _0x3a4396 + clamp(Number(_0x53dc10) - Number(_0x1e6315?.['startSec']), 0x0, _0x2ec013, 0x0);
    }
    _0x3a4396 += _0x2ec013;
  }
  return 0x0;
}
