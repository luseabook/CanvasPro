import { findMannequinPosePreset } from '../panoramaSceneNode/poseCatalog.js';
export function sampleCharacterActionPose(_0x1a1974, _0x350cab = 0x0) {
  if (!/^(walking|running)-(left|right)$/['test'](_0x1a1974['id']))
    return findMannequinPosePreset(_0x1a1974['poseId']);
  const _0x9c8ecf = _0x1a1974['id']['startsWith']('running') ? 'run' : 'walk',
    _0x58bb83 = findMannequinPosePreset(_0x9c8ecf + '-left')['bones'],
    _0x2ad028 = findMannequinPosePreset(_0x9c8ecf + '-right')['bones'],
    _0x403936 =
      ((Number(_0x350cab) || 0x0) / _0x1a1974['duration']) * Math['PI'] * 0x2 +
      (_0x1a1974['id']['endsWith']('right') ? Math['PI'] : 0x0),
    _0x34a104 = (0x1 - Math['cos'](_0x403936)) / 0x2,
    _0x3f9438 = new Set([...Object['keys'](_0x58bb83), ...Object['keys'](_0x2ad028)]);
  return {
    bones: Object['fromEntries'](
      [..._0x3f9438]['map']((_0x5935f9) => [
        _0x5935f9,
        Object['fromEntries'](
          ['x', 'y', 'z']['map']((_0x3909e9) => {
            const _0x2550cf = _0x58bb83[_0x5935f9]?.[_0x3909e9] || 0x0,
              _0xf0f2ca = _0x2ad028[_0x5935f9]?.[_0x3909e9] || 0x0;
            return [_0x3909e9, _0x2550cf + (_0xf0f2ca - _0x2550cf) * _0x34a104];
          }),
        ),
      ]),
    ),
  };
}
