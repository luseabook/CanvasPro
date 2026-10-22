export const VIDEO_MUTED_FIELD = 'videoMuted';
/**
 * 解析节点应有的静音状态。
 *
 * 优先级：节点显式设置 > 全局「视频默认开声音」开关 > 默认静音。
 * 旧实现只看节点字段，导致全局开关对未单独设置过的节点完全无效。
 */
export function resolveVideoMutedPreference(nodeData = {}, { videoAudioDefaultEnabled = false } = {}) {
  if (nodeData?.[VIDEO_MUTED_FIELD] === false) return false;
  if (nodeData?.[VIDEO_MUTED_FIELD] === true) return true;
  return videoAudioDefaultEnabled === true ? false : true;
}
export function buildVideoMutedPatch(options2 = {}, enabled) {
  const value = !!enabled;
  return options2?.[VIDEO_MUTED_FIELD] === value ? null : { [VIDEO_MUTED_FIELD]: value };
}
export function readVideoAudioDefaultEnabledFromStore(store) {
  try {
    const item = typeof store?.getStateRaw === 'function' ? store.getStateRaw() : store?.getState?.();
    return item?.ui?.videoAudioDefaultEnabled === true;
  } catch {
    return false;
  }
}
