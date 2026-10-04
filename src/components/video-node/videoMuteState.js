export const VIDEO_MUTED_FIELD = 'videoMuted';
export function resolveVideoMutedPreference(options = {}) {
  return options?.[VIDEO_MUTED_FIELD] === false ? false : true;
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
