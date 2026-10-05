import { getLocale, t } from '../i18n/index.js';
function formatRelativeTimeUnit(value, count) {
  const item = count === 1 ? 'One' : '';
  return t('format.relativeTime.' + value + item, { count: count });
}
export function formatFileSize(enabled, key = 2) {
  if (enabled === 0) return '0 Bytes';
  if (!enabled || isNaN(enabled)) return 'Unknown';
  const index = 1024,
    result = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
    data = Math.floor(Math.log(enabled) / Math.log(index));
  return parseFloat((enabled / Math.pow(index, data)).toFixed(key)) + ' ' + result[data];
}
export function formatDate(options, target = 'YYYY-MM-DD HH:mm:ss') {
  const YYYY = options instanceof Date ? options : new Date(options);
  if (isNaN(YYYY.getTime())) return 'Invalid Date';
  const MM = (source) => String(source).padStart(2, '0'),
    next = {
      YYYY: YYYY.getFullYear(),
      MM: MM(YYYY.getMonth() + 1),
      DD: MM(YYYY.getDate()),
      HH: MM(YYYY.getHours()),
      mm: MM(YYYY.getMinutes()),
      ss: MM(YYYY.getSeconds()),
    };
  return target.replace(/YYYY|MM|DD|HH|mm|ss/g, (current) => next[current]);
}
export function formatRelativeTime(entry) {
  const record = entry instanceof Date ? entry : new Date(entry),
    payload = new Date(),
    handle = payload.getTime() - record.getTime(),
    state = 60 * 1000,
    config = 60 * state,
    scope = 24 * config,
    input = 7 * scope,
    output = 30 * scope,
    value2 = 365 * scope;
  if (handle < state) return t('format.relativeTime.justNow');
  if (handle < config) return formatRelativeTimeUnit('minute', Math.floor(handle / state));
  if (handle < scope) return formatRelativeTimeUnit('hour', Math.floor(handle / config));
  if (handle < input) return formatRelativeTimeUnit('day', Math.floor(handle / scope));
  if (handle < output) return formatRelativeTimeUnit('week', Math.floor(handle / input));
  if (handle < value2) return formatRelativeTimeUnit('month', Math.floor(handle / output));
  return formatRelativeTimeUnit('year', Math.floor(handle / value2));
}
export function formatNumber(value3, minimumFractionDigits = 0) {
  if (value3 === null || value3 === undefined || isNaN(value3)) return '-';
  return Number(value3).toLocaleString(getLocale(), {
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  });
}
export function formatDuration(enabled2) {
  if (!enabled2 || enabled2 < 0) return '00:00';
  const count2 = Math.floor(enabled2 / 3600),
    value4 = Math.floor((enabled2 % 3600) / 60),
    value5 = Math.floor(enabled2 % 60),
    handler = (value6) => String(value6).padStart(2, '0');
  if (count2 > 0) return handler(count2) + ':' + handler(value4) + ':' + handler(value5);
  return handler(value4) + ':' + handler(value5);
}
export function truncateText(list, value7, list2 = '...') {
  if (!list || list.length <= value7) return list || '';
  return list.slice(0, value7 - list2.length) + list2;
}
export function capitalize(list3) {
  if (!list3) return '';
  return list3.charAt(0).toUpperCase() + list3.slice(1);
}
export function camelToKebab(value8) {
  return value8.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
export function kebabToCamel(value9) {
  return value9.replace(/-([a-z])/g, (value10, value11) => value11.toUpperCase());
}
