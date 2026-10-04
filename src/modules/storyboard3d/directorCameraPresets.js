import { computeStoryboard3DSubjectBounds } from './shotExploration.js';
import { focalLengthToFov } from '../../core/panoramaSceneMath.js';
export const DIRECTOR_CAMERA_PRESETS = Object['freeze']([
  { id: 'front-medium', name: '正面中景', yaw: 0x0, elevation: 0x0, size: 0.65, focal: 0x32 },
  { id: 'front-close', name: '正面特写', yaw: 0x0, elevation: 0x0, size: 0.24, focal: 0x55 },
  { id: 'front-full', name: '正面全景', yaw: 0x0, elevation: 0x0, size: 1.2, focal: 0x23 },
  { id: 'side-medium', name: '侧面中景', yaw: 0x5a, elevation: 0x0, size: 0.65, focal: 0x32 },
  { id: 'side-close', name: '侧面特写', yaw: 0x5a, elevation: 0x0, size: 0.24, focal: 0x55 },
  { id: 'rear-medium', name: '背面中景', yaw: 0xb4, elevation: 0x0, size: 0.65, focal: 0x32 },
  { id: 'high-full', name: '俯拍全景', yaw: 0x0, elevation: 0x23, size: 1.3, focal: 0x23 },
  { id: 'high-45', name: '45° 俯拍', yaw: 0x2d, elevation: 0x2d, size: 1.2, focal: 0x23 },
  { id: 'low-medium', name: '仰拍中景', yaw: 0x0, elevation: -0x10, size: 0.65, focal: 0x32 },
  { id: 'low-wide', name: '低机位广角', yaw: 0x14, elevation: -0xc, size: 1.2, focal: 0x18 },
  { id: 'shoulder-left', name: '左肩后机位', yaw: -0x96, elevation: 0x5, size: 0.7, focal: 0x32 },
  { id: 'shoulder-right', name: '右肩后机位', yaw: 0x96, elevation: 0x5, size: 0.7, focal: 0x32 },
  { id: 'bird', name: '鸟瞰', yaw: 0x0, elevation: 0x59, size: 1.5, focal: 0x1c },
  { id: 'dutch', name: '荷兰角', yaw: 0x0, elevation: 0x0, size: 0.75, focal: 0x32, roll: 0xf },
]);
export function createDirectorCameraPreset(
  value,
  { preset: preset, objectId: objectId, camera: camera = {} } = {},
) {
  const enabled = DIRECTOR_CAMERA_PRESETS['find']((item) => item['id'] === preset);
  if (!enabled) throw new Error('请选择机位预设。');
  const args = computeStoryboard3DSubjectBounds(value, objectId ? { subjectIds: [objectId] } : {});
  if (!args) throw new Error('请先添加角色或物体，再应用机位。');
  const key = value['objects']['find']((index) => index['id'] === objectId),
    result = Math['max'](0.2, args['size'][0x1]),
    data = [...args['center']];
  if (enabled['size'] < 0x1) data[0x1] = args['min'][0x1] + result * (enabled['size'] < 0.3 ? 0.87 : 0.7);
  const fov = (focalLengthToFov(enabled['focal']) * Math['PI']) / 0xb4,
    options = Math['max'](
      (result * enabled['size']) / (0x2 * Math['tan'](fov / 0x2)),
      args['size'][0x0] * 0.7,
    ),
    target = (enabled['yaw'] * Math['PI']) / 0xb4 + (key?.['transform']['rotation'][0x1] || 0x0),
    source = (enabled['elevation'] * Math['PI']) / 0xb4,
    next = {
      ...camera,
      focalLength: enabled['focal'],
      roll: ((enabled['roll'] || 0x0) * Math['PI']) / 0xb4,
      target: data,
      position: [
        data[0x0] + Math['sin'](target) * Math['cos'](source) * options,
        data[0x1] + Math['sin'](source) * options,
        data[0x2] + Math['cos'](target) * Math['cos'](source) * options,
      ],
    };
  return (delete next['fov'], next);
}
