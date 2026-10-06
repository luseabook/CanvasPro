import { computeStoryboard3DSubjectBounds } from './shotExploration.js';
import { focalLengthToFov } from '../../core/panoramaSceneMath.js';
export const DIRECTOR_CAMERA_PRESETS = Object.freeze([
  { id: 'front-medium', name: '正面中景', yaw: 0, elevation: 0, size: 0.65, focal: 50 },
  { id: 'front-close', name: '正面特写', yaw: 0, elevation: 0, size: 0.24, focal: 0x55 },
  { id: 'front-full', name: '正面全景', yaw: 0, elevation: 0, size: 1.2, focal: 35 },
  { id: 'side-medium', name: '侧面中景', yaw: 90, elevation: 0, size: 0.65, focal: 50 },
  { id: 'side-close', name: '侧面特写', yaw: 90, elevation: 0, size: 0.24, focal: 0x55 },
  { id: 'rear-medium', name: '背面中景', yaw: 180, elevation: 0, size: 0.65, focal: 50 },
  { id: 'high-full', name: '俯拍全景', yaw: 0, elevation: 35, size: 1.3, focal: 35 },
  { id: 'high-45', name: '45° 俯拍', yaw: 45, elevation: 45, size: 1.2, focal: 35 },
  { id: 'low-medium', name: '仰拍中景', yaw: 0, elevation: -16, size: 0.65, focal: 50 },
  { id: 'low-wide', name: '低机位广角', yaw: 20, elevation: -12, size: 1.2, focal: 24 },
  { id: 'shoulder-left', name: '左肩后机位', yaw: -150, elevation: 5, size: 0.7, focal: 50 },
  { id: 'shoulder-right', name: '右肩后机位', yaw: 150, elevation: 5, size: 0.7, focal: 50 },
  { id: 'bird', name: '鸟瞰', yaw: 0, elevation: 89, size: 1.5, focal: 28 },
  { id: 'dutch', name: '荷兰角', yaw: 0, elevation: 0, size: 0.75, focal: 50, roll: 15 },
]);
export function createDirectorCameraPreset(
  value,
  { preset: preset, objectId: objectId, camera: camera = {} } = {},
) {
  const enabled = DIRECTOR_CAMERA_PRESETS.find((item) => item.id === preset);
  if (!enabled) throw new Error('请选择机位预设。');
  const args = computeStoryboard3DSubjectBounds(value, objectId ? { subjectIds: [objectId] } : {});
  if (!args) throw new Error('请先添加角色或物体，再应用机位。');
  const key = value.objects.find((index) => index.id === objectId),
    result = Math.max(0.2, args.size[1]),
    data = [...args.center];
  if (enabled.size < 1) data[1] = args.min[1] + result * (enabled.size < 0.3 ? 0.87 : 0.7);
  const fov = (focalLengthToFov(enabled.focal) * Math.PI) / 180,
    options = Math.max(
      (result * enabled.size) / (2 * Math.tan(fov / 2)),
      args.size[0] * 0.7,
    ),
    target = (enabled.yaw * Math.PI) / 180 + (key?.transform.rotation[1] || 0),
    source = (enabled.elevation * Math.PI) / 180,
    next = {
      ...camera,
      focalLength: enabled.focal,
      roll: ((enabled.roll || 0) * Math.PI) / 180,
      target: data,
      position: [
        data[0] + Math.sin(target) * Math.cos(source) * options,
        data[1] + Math.sin(source) * options,
        data[2] + Math.cos(target) * Math.cos(source) * options,
      ],
    };
  return (delete next.fov, next);
}
