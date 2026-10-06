import { findMannequinPosePreset } from '../panoramaSceneNode/poseCatalog.js';
export function sampleCharacterActionPose(value, item = 0) {
  if (!/^(walking|running)-(left|right)$/.test(value.id))
    return findMannequinPosePreset(value.poseId);
  const key = value.id.startsWith('running') ? 'run' : 'walk',
    mannequinPosePreset = findMannequinPosePreset(key + '-left').bones,
    mannequinPosePreset2 = findMannequinPosePreset(key + '-right').bones,
    index =
      ((Number(item) || 0) / value.duration) * Math.PI * 2 +
      (value.id.endsWith('right') ? Math.PI : 0),
    result = (1 - Math.cos(index)) / 2,
    args = new Set([...Object.keys(mannequinPosePreset), ...Object.keys(mannequinPosePreset2)]);
  return {
    bones: Object.fromEntries(
      [...args].map((data) => [
        data,
        Object.fromEntries(
          ['x', 'y', 'z'].map((options) => {
            const target = mannequinPosePreset[data]?.[options] || 0,
              source = mannequinPosePreset2[data]?.[options] || 0;
            return [options, target + (source - target) * result];
          }),
        ),
      ]),
    ),
  };
}
