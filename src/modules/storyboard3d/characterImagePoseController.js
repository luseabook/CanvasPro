import { createStoryboard3DImagePoseEstimator } from './imagePoseEstimator.js';
import { retargetMediaPipePoseToStoryboard3D } from './imagePoseRetargeter.js';
const MIN_APPLIED_BONES = 0x6;
function idleState(_0x14e1a6 = '') {
  return Object['freeze']({
    status: 'idle',
    objectId: String(_0x14e1a6 || ''),
    fileName: '',
    confidence: 0x0,
    boneCount: 0x0,
    warningCount: 0x0,
    poseSignature: '',
    error: '',
  });
}
export function createStoryboard3DBoneOverridesSignature(_0x2f566f) {
  return JSON['stringify'](
    Object['entries'](_0x2f566f || {})
      ['sort'](([_0xedb61f], [_0x42fcca]) => _0xedb61f['localeCompare'](_0x42fcca))
      ['map'](([_0x6423d0, _0x18d7b1]) => [
        _0x6423d0,
        Array['isArray'](_0x18d7b1)
          ? _0x18d7b1['map']((_0x5bfc64) => Number(Number(_0x5bfc64)['toFixed'](0x8)))
          : [],
      ]),
  );
}
function poseError(_0xb98997, _0x1f0348) {
  const _0x2c8acc = new Error(_0x1f0348);
  return ((_0x2c8acc['code'] = _0xb98997), _0x2c8acc);
}
export function createStoryboard3DCharacterImagePoseController({
  estimator: estimator = createStoryboard3DImagePoseEstimator(),
  retarget: retarget = retargetMediaPipePoseToStoryboard3D,
  getCharacter: _0x5f3822,
  applyPose: _0x1336fd,
  onStateChange: _0x4fe1b1,
} = {}) {
  if (typeof _0x5f3822 !== 'function') throw new TypeError('getCharacter is required.');
  if (typeof _0x1336fd !== 'function') throw new TypeError('applyPose is required.');
  let _0x22bca1 = ![],
    _0x10cb2d = 0x0,
    _0x29bbaa = null;
  const _0x35bccb = new Map(),
    _0x1092a9 = (_0x31cb75, _0x28878f) => {
      const _0x11ca82 = Object['freeze']({
        ...idleState(_0x31cb75),
        ..._0x28878f,
        objectId: String(_0x31cb75 || ''),
      });
      return (_0x35bccb['set'](_0x11ca82['objectId'], _0x11ca82), _0x4fe1b1?.(_0x11ca82), _0x11ca82);
    },
    _0x4511c4 = (_0x18d30d) => _0x35bccb['get'](String(_0x18d30d || '')) || idleState(_0x18d30d),
    _0x421edf = async ({ objectId: _0x164020, file: _0x592570 } = {}) => {
      if (_0x22bca1) throw poseError('POSE_CONTROLLER_DISPOSED', '姿势识别器已关闭。');
      const _0x33056e = String(_0x164020 || ''),
        _0x164840 = _0x5f3822(_0x33056e);
      if (_0x164840?.['type'] !== 'character')
        throw poseError('POSE_CHARACTER_NOT_FOUND', '目标人物已不存在。');
      _0x29bbaa?.['abortController']['abort']('开始新的姿势识别。');
      const _0x1ec425 = ++_0x10cb2d,
        _0x3b4418 = new AbortController();
      ((_0x29bbaa = { requestId: _0x1ec425, objectId: _0x33056e, abortController: _0x3b4418 }),
        _0x1092a9(_0x33056e, { status: 'running', fileName: String(_0x592570?.['name'] || '参考图') }));
      try {
        const _0x148281 = await estimator['analyze'](_0x592570, { signal: _0x3b4418['signal'] });
        if (_0x22bca1 || _0x1ec425 !== _0x10cb2d) return null;
        if (_0x5f3822(_0x33056e)?.['type'] !== 'character')
          throw poseError('POSE_CHARACTER_NOT_FOUND', '识别完成前目标人物已被移除。');
        const _0x1c5ba4 = retarget(_0x148281),
          _0x1e5384 = Object['keys'](_0x1c5ba4?.['boneOverrides'] || {})['length'];
        if (_0x1e5384 < MIN_APPLIED_BONES)
          throw poseError(
            'POSE_RETARGET_INSUFFICIENT',
            '可见关节太少，无法生成可靠姿势。请换一张全身清晰、遮挡较少的图片。',
          );
        await _0x1336fd({
          objectId: _0x33056e,
          boneOverrides: _0x1c5ba4['boneOverrides'],
          confidence: Math['max'](0x0, Math['min'](0x1, Number(_0x1c5ba4['confidence']) || 0x0)),
          warnings: Array['isArray'](_0x1c5ba4['warnings']) ? _0x1c5ba4['warnings'] : [],
        });
        if (_0x22bca1 || _0x1ec425 !== _0x10cb2d) return null;
        const _0xecb723 = _0x1092a9(_0x33056e, {
          status: 'success',
          fileName: String(_0x592570?.['name'] || '参考图'),
          confidence: Math['max'](0x0, Math['min'](0x1, Number(_0x1c5ba4['confidence']) || 0x0)),
          boneCount: _0x1e5384,
          warningCount: Array['isArray'](_0x1c5ba4['warnings']) ? _0x1c5ba4['warnings']['length'] : 0x0,
          poseSignature: createStoryboard3DBoneOverridesSignature(_0x1c5ba4['boneOverrides']),
        });
        return ((_0x29bbaa = null), { ..._0x1c5ba4, state: _0xecb723 });
      } catch (_0x5aafd5) {
        if (_0x22bca1 || _0x1ec425 !== _0x10cb2d) return null;
        _0x29bbaa = null;
        if (_0x5aafd5?.['name'] === 'AbortError' || _0x5aafd5?.['code'] === 'ABORT_ERR')
          return (_0x1092a9(_0x33056e, { status: 'idle' }), null);
        _0x1092a9(_0x33056e, {
          status: 'error',
          fileName: String(_0x592570?.['name'] || '参考图'),
          error: String(_0x5aafd5?.['message'] || '姿势识别失败。'),
        });
        throw _0x5aafd5;
      }
    },
    _0x4b06b8 = (_0x59c07e) => {
      const _0x38ad1c = String(_0x59c07e || '');
      return (
        _0x29bbaa?.['objectId'] === _0x38ad1c &&
          (_0x29bbaa['abortController']['abort']('姿势已重置。'), (_0x29bbaa = null), (_0x10cb2d += 0x1)),
        _0x1092a9(_0x38ad1c, { status: 'idle' })
      );
    },
    _0x3f8566 = () => {
      if (_0x22bca1) return;
      ((_0x22bca1 = !![]),
        (_0x10cb2d += 0x1),
        _0x29bbaa?.['abortController']['abort']('编辑器已关闭。'),
        (_0x29bbaa = null),
        estimator['dispose']?.(),
        _0x35bccb['clear']());
    };
  return {
    extract: _0x421edf,
    clear: _0x4b06b8,
    getSnapshot: _0x4511c4,
    dispose: _0x3f8566,
    get disposed() {
      return _0x22bca1;
    },
  };
}
