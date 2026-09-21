export const VIDEO_MUTED_FIELD = 'videoMuted';
export function resolveVideoMutedPreference(_0x3945bf = {}) {
  return _0x3945bf?.[VIDEO_MUTED_FIELD] === false ? false : true;
}
export function buildVideoMutedPatch(_0x5b8e73 = {}, _0x23225f) {
  const _0x131dc9 = !!_0x23225f;
  return _0x5b8e73?.[VIDEO_MUTED_FIELD] === _0x131dc9 ? null : { [VIDEO_MUTED_FIELD]: _0x131dc9 };
}
