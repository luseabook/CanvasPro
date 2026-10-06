export const RUNNINGHUB_DEFAULT_INSTANCE_TYPE = 'default';
export const RUNNINGHUB_PLUS_INSTANCE_TYPE = 'plus';
export const RUNNINGHUB_ULTRA_INSTANCE_TYPE = 'ultra';
export const RUNNINGHUB_INSTANCE_OPTIONS = Object.freeze([
  Object.freeze({ value: RUNNINGHUB_DEFAULT_INSTANCE_TYPE, label: '24G' }),
  Object.freeze({ value: RUNNINGHUB_PLUS_INSTANCE_TYPE, label: '48G' }),
  Object.freeze({ value: RUNNINGHUB_ULTRA_INSTANCE_TYPE, label: '84G' }),
]);
export const RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES = Object.freeze([
  RUNNINGHUB_DEFAULT_INSTANCE_TYPE,
  RUNNINGHUB_PLUS_INSTANCE_TYPE,
  RUNNINGHUB_ULTRA_INSTANCE_TYPE,
]);
export function normalizeRunningHubInstanceType(value) {
  const item = String(value || '')
    .trim()
    .toLowerCase();
  if (item === RUNNINGHUB_PLUS_INSTANCE_TYPE) return RUNNINGHUB_PLUS_INSTANCE_TYPE;
  if (item === RUNNINGHUB_ULTRA_INSTANCE_TYPE.toLowerCase()) return RUNNINGHUB_ULTRA_INSTANCE_TYPE;
  return RUNNINGHUB_DEFAULT_INSTANCE_TYPE;
}
export function getRunningHubInstanceTypeLabel(key) {
  const runningHubInstanceType = normalizeRunningHubInstanceType(key);
  if (runningHubInstanceType === RUNNINGHUB_ULTRA_INSTANCE_TYPE) return '84G';
  if (runningHubInstanceType === RUNNINGHUB_PLUS_INSTANCE_TYPE) return '48G';
  return '24G';
}
