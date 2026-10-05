import { createStoryboard3DImagePoseEstimator } from './imagePoseEstimator.js';
import { retargetMediaPipePoseToStoryboard3D } from './imagePoseRetargeter.js';
const MIN_APPLIED_BONES = 6;
function idleState(value = '') {
  return Object['freeze']({
    status: 'idle',
    objectId: String(value || ''),
    fileName: '',
    confidence: 0,
    boneCount: 0,
    warningCount: 0,
    poseSignature: '',
    error: '',
  });
}
export function createStoryboard3DBoneOverridesSignature(item) {
  return JSON['stringify'](
    Object['entries'](item || {})
      ['sort'](([key], [index]) => key['localeCompare'](index))
      ['map'](([result, list]) => [
        result,
        Array['isArray'](list) ? list['map']((data) => Number(Number(data)['toFixed'](8))) : [],
      ]),
  );
}
function poseError(options, target) {
  const error = new Error(target);
  return ((error['code'] = options), error);
}
export function createStoryboard3DCharacterImagePoseController({
  estimator: estimator = createStoryboard3DImagePoseEstimator(),
  retarget: retarget = retargetMediaPipePoseToStoryboard3D,
  getCharacter: getCharacter,
  applyPose: applyPose,
  onStateChange: onStateChange,
} = {}) {
  if (typeof getCharacter !== 'function') throw new TypeError('getCharacter is required.');
  if (typeof applyPose !== 'function') throw new TypeError('applyPose is required.');
  let source = false,
    next = 0,
    value2 = null;
  const map = new Map(),
    handler = (current, args) => {
      const entry = Object['freeze']({
        ...idleState(current),
        ...args,
        objectId: String(current || ''),
      });
      return (map['set'](entry['objectId'], entry), onStateChange?.(entry), entry);
    },
    getSnapshot = (record) => map['get'](String(record || '')) || idleState(record),
    extract = async ({ objectId: objectId, file: file } = {}) => {
      if (source) throw poseError('POSE_CONTROLLER_DISPOSED', '姿势识别器已关闭。');
      const objectId2 = String(objectId || ''),
        payload = getCharacter(objectId2);
      if (payload?.['type'] !== 'character')
        throw poseError('POSE_CHARACTER_NOT_FOUND', '目标人物已不存在。');
      value2?.['abortController']['abort']('开始新的姿势识别。');
      const requestId = ++next,
        abortController = new AbortController();
      ((value2 = { requestId: requestId, objectId: objectId2, abortController: abortController }),
        handler(objectId2, { status: 'running', fileName: String(file?.['name'] || '参考图') }));
      try {
        const handle = await estimator['analyze'](file, { signal: abortController['signal'] });
        if (source || requestId !== next) return null;
        if (getCharacter(objectId2)?.['type'] !== 'character')
          throw poseError('POSE_CHARACTER_NOT_FOUND', '识别完成前目标人物已被移除。');
        const boneOverrides = retarget(handle),
          boneCount = Object['keys'](boneOverrides?.['boneOverrides'] || {})['length'];
        if (boneCount < MIN_APPLIED_BONES)
          throw poseError(
            'POSE_RETARGET_INSUFFICIENT',
            '可见关节太少，无法生成可靠姿势。请换一张全身清晰、遮挡较少的图片。',
          );
        await applyPose({
          objectId: objectId2,
          boneOverrides: boneOverrides['boneOverrides'],
          confidence: Math['max'](0, Math['min'](1, Number(boneOverrides['confidence']) || 0)),
          warnings: Array['isArray'](boneOverrides['warnings']) ? boneOverrides['warnings'] : [],
        });
        if (source || requestId !== next) return null;
        const state = handler(objectId2, {
          status: 'success',
          fileName: String(file?.['name'] || '参考图'),
          confidence: Math['max'](0, Math['min'](1, Number(boneOverrides['confidence']) || 0)),
          boneCount: boneCount,
          warningCount: Array['isArray'](boneOverrides['warnings'])
            ? boneOverrides['warnings']['length']
            : 0,
          poseSignature: createStoryboard3DBoneOverridesSignature(boneOverrides['boneOverrides']),
        });
        return ((value2 = null), { ...boneOverrides, state: state });
      } catch (error2) {
        if (source || requestId !== next) return null;
        value2 = null;
        if (error2?.['name'] === 'AbortError' || error2?.['code'] === 'ABORT_ERR')
          return (handler(objectId2, { status: 'idle' }), null);
        handler(objectId2, {
          status: 'error',
          fileName: String(file?.['name'] || '参考图'),
          error: String(error2?.['message'] || '姿势识别失败。'),
        });
        throw error2;
      }
    },
    clear = (config) => {
      const scope = String(config || '');
      return (
        value2?.['objectId'] === scope &&
          (value2['abortController']['abort']('姿势已重置。'), (value2 = null), (next += 1)),
        handler(scope, { status: 'idle' })
      );
    },
    dispose = () => {
      if (source) return;
      ((source = true),
        (next += 1),
        value2?.['abortController']['abort']('编辑器已关闭。'),
        (value2 = null),
        estimator['dispose']?.(),
        map['clear']());
    };
  return {
    extract: extract,
    clear: clear,
    getSnapshot: getSnapshot,
    dispose: dispose,
    get disposed() {
      return source;
    },
  };
}
