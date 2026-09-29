export const RUNNINGHUB_DEFAULT_INSTANCE_TYPE = 'default';
export const RUNNINGHUB_PLUS_INSTANCE_TYPE = 'plus';
export const RUNNINGHUB_ULTRA_INSTANCE_TYPE = 'ultra';
export const RUNNINGHUB_INSTANCE_OPTIONS = Object['freeze']([
  Object['freeze']({ value: RUNNINGHUB_DEFAULT_INSTANCE_TYPE, label: '24G' }),
  Object['freeze']({ value: RUNNINGHUB_PLUS_INSTANCE_TYPE, label: '48G' }),
  Object['freeze']({ value: RUNNINGHUB_ULTRA_INSTANCE_TYPE, label: '84G' }),
]);
export const RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES = Object['freeze']([
  RUNNINGHUB_DEFAULT_INSTANCE_TYPE,
  RUNNINGHUB_PLUS_INSTANCE_TYPE,
  RUNNINGHUB_ULTRA_INSTANCE_TYPE,
]);
export function normalizeRunningHubInstanceType(_0x500c51) {
  const _0x51b39c = String(_0x500c51 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x51b39c === RUNNINGHUB_PLUS_INSTANCE_TYPE) return RUNNINGHUB_PLUS_INSTANCE_TYPE;
  if (_0x51b39c === RUNNINGHUB_ULTRA_INSTANCE_TYPE['toLowerCase']()) return RUNNINGHUB_ULTRA_INSTANCE_TYPE;
  return RUNNINGHUB_DEFAULT_INSTANCE_TYPE;
}
export function getRunningHubInstanceTypeLabel(_0x288ddf) {
  const _0x4e08f8 = normalizeRunningHubInstanceType(_0x288ddf);
  if (_0x4e08f8 === RUNNINGHUB_ULTRA_INSTANCE_TYPE) return '84G';
  if (_0x4e08f8 === RUNNINGHUB_PLUS_INSTANCE_TYPE) return '48G';
  return '24G';
}
