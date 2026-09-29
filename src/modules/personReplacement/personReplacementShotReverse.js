import { getPersonReplacementShotCutPositionAtTimelineSec } from './personReplacementShotCutModel.js';
function normalizeText(_0x28e114) {
  return String(_0x28e114 ?? '')['trim']();
}
export function togglePersonReplacementShotReverseAtTimelineSec(_0xdbc018 = [], _0x3ebd62 = 0x0) {
  const _0x3d233b = getPersonReplacementShotCutPositionAtTimelineSec(_0xdbc018, _0x3ebd62),
    _0x3fa345 = _0xdbc018[_0x3d233b['shotIndex']];
  if (!_0x3fa345) return null;
  const _0x4ad6fa = _0x3fa345['isReversed'] !== !![];
  return {
    draft: _0xdbc018['map']((_0x37376d, _0x5c68c6) =>
      _0x5c68c6 === _0x3d233b['shotIndex'] ? { ..._0x37376d, isReversed: _0x4ad6fa } : _0x37376d,
    ),
    position: _0x3d233b,
    isReversed: _0x4ad6fa,
    message: _0x4ad6fa ? '当前片段已倒放。' : '已取消当前片段倒放。',
  };
}
export function resolveShotCutSubmissionUi(_0x347aea = '', _0x5f22c7 = ![]) {
  const _0x3a5b84 = _0x347aea === 'reverse',
    _0x3a5913 = _0x347aea === 'cuts';
  return {
    reversePending: _0x3a5b84,
    cutSubmitting: _0x3a5913,
    editorBusy: Boolean(_0x347aea) || _0x5f22c7,
    loadingTitle: _0x5f22c7 ? '智能裁切中' : _0x3a5b84 ? '正在倒放视频' : '正在应用切口',
    loadingDescription: _0x5f22c7
      ? '正在检测并裁切视频，完成后会自动更新时间线。'
      : _0x3a5b84
        ? '正在处理当前片段，完成后会直接更新时间线。'
        : '正在裁切视频，完成后会自动更新时间线。',
  };
}
export async function materializePersonReplacementShotPlayback({
  currentShot: _0x30148a,
  range: _0x5ed764,
  isNewShot: isNewShot = ![],
  sourceVideoRef: _0x326528,
  outputFps: _0x5106f2,
  epsilonSec: _0x20e634,
  enqueueMediaTask: _0x58cd04,
  resolveMediaRef: _0xa1cf46,
} = {}) {
  if (!_0x30148a || !_0x5ed764 || typeof _0x58cd04 !== 'function' || typeof _0xa1cf46 !== 'function')
    throw new Error('镜头片段倒放参数不完整');
  const _0x479609 =
      isNewShot ||
      Math['abs'](Number(_0x5ed764['startSec']) - Number(_0x30148a['startTimeSec'])) > _0x20e634 ||
      Math['abs'](Number(_0x5ed764['endSec']) - Number(_0x30148a['endTimeSec'])) > _0x20e634,
    _0x209088 =
      Boolean(_0x5ed764['isReversed']) !==
      Boolean(
        typeof _0x30148a['materializedIsReversed'] === 'boolean'
          ? _0x30148a['materializedIsReversed']
          : normalizeText(_0x30148a['videoRef']) && _0x30148a['isReversed'],
      ),
    _0x514a7f = Boolean(
      typeof _0x30148a['materializedIsReversed'] === 'boolean'
        ? _0x30148a['materializedIsReversed']
        : normalizeText(_0x30148a['videoRef']) && _0x30148a['isReversed'],
    );
  let _0x2c85a4 = normalizeText(_0x30148a['videoRef']);
  const _0x4c62db = Boolean(_0x30148a['videoRefIsCropped'] === !![] && !_0x479609 && _0x2c85a4),
    _0x11ae7f = Boolean(_0x4c62db && _0x209088);
  if (_0x479609 || !_0x2c85a4 || (_0x514a7f && _0x5ed764['isReversed'] !== !![] && !_0x11ae7f)) {
    const _0x2804d0 = await _0x58cd04(
      {
        kind: 'mediaClipExport',
        src: _0x326528,
        args: { videoStart: _0x5ed764['startSec'], videoEnd: _0x5ed764['endSec'], fps: _0x5106f2 },
      },
      { wait: !![], timeout: 0x927c0 },
    );
    _0x2c85a4 = _0xa1cf46(_0x2804d0);
    if (_0x2804d0?.['success'] === ![] || !_0x2c85a4)
      throw new Error(_0x2804d0?.['error'] || _0x2804d0?.['message'] || '镜头片段导出失败');
  }
  if (
    _0x11ae7f ||
    (_0x5ed764['isReversed'] === !![] && (_0x479609 || _0x209088 || !normalizeText(_0x30148a['videoRef'])))
  ) {
    const _0x26c1f5 = await _0x58cd04(
      { kind: 'videoReverse', src: _0x2c85a4 },
      { wait: !![], timeout: 0x927c0 },
    );
    _0x2c85a4 = _0xa1cf46(_0x26c1f5);
    if (_0x26c1f5?.['success'] === ![] || !_0x2c85a4)
      throw new Error(_0x26c1f5?.['error'] || _0x26c1f5?.['message'] || '镜头片段倒放失败');
  }
  return { videoRef: _0x2c85a4, reverseChanged: _0x209088, videoRefIsCropped: _0x4c62db };
}
