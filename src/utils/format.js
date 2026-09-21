import { getLocale, t } from '../i18n/index.js';
function formatRelativeTimeUnit(_0x26f270, _0x4f6fa5) {
  const _0x21a0ec = _0x4f6fa5 === 1 ? 'One' : '';
  return t('format.relativeTime.' + _0x26f270 + _0x21a0ec, { count: _0x4f6fa5 });
}
export function formatFileSize(_0xe9424d, _0x97de28 = 2) {
  if (_0xe9424d === 0) return '0 Bytes';
  if (!_0xe9424d || isNaN(_0xe9424d)) return 'Unknown';
  const _0x1a2d1c = 0x400,
    _0x20f7c6 = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
    _0x26cb79 = Math.floor(Math.log(_0xe9424d) / Math.log(_0x1a2d1c));
  return (
    parseFloat((_0xe9424d / Math.pow(_0x1a2d1c, _0x26cb79)).toFixed(_0x97de28)) + ' ' + _0x20f7c6[_0x26cb79]
  );
}
export function formatDate(_0xee3b80, _0x590d49 = 'YYYY-MM-DD HH:mm:ss') {
  const _0x2ddfb5 = _0xee3b80 instanceof Date ? _0xee3b80 : new Date(_0xee3b80);
  if (isNaN(_0x2ddfb5.getTime())) return 'Invalid Date';
  const _0x5757d2 = (_0x3f3564) => String(_0x3f3564).padStart(2, '0'),
    _0x8e55cd = {
      YYYY: _0x2ddfb5.getFullYear(),
      MM: _0x5757d2(_0x2ddfb5.getMonth() + 1),
      DD: _0x5757d2(_0x2ddfb5.getDate()),
      HH: _0x5757d2(_0x2ddfb5.getHours()),
      mm: _0x5757d2(_0x2ddfb5.getMinutes()),
      ss: _0x5757d2(_0x2ddfb5.getSeconds()),
    };
  return _0x590d49.replace(/YYYY|MM|DD|HH|mm|ss/g, (_0x1f6ddf) => _0x8e55cd[_0x1f6ddf]);
}
export function formatRelativeTime(_0x38ad95) {
  const _0x14bd6d = _0x38ad95 instanceof Date ? _0x38ad95 : new Date(_0x38ad95),
    _0x38b6da = new Date(),
    _0x23849a = _0x38b6da.getTime() - _0x14bd6d.getTime(),
    _0x5ce251 = 60 * 0x3e8,
    _0x58ad0f = 60 * _0x5ce251,
    _0x9c9db2 = 24 * _0x58ad0f,
    _0x2a1202 = 7 * _0x9c9db2,
    _0x1a6400 = 30 * _0x9c9db2,
    _0x109076 = 0x16d * _0x9c9db2;
  if (_0x23849a < _0x5ce251) return t('format.relativeTime.justNow');
  if (_0x23849a < _0x58ad0f) return formatRelativeTimeUnit('minute', Math.floor(_0x23849a / _0x5ce251));
  if (_0x23849a < _0x9c9db2) return formatRelativeTimeUnit('hour', Math.floor(_0x23849a / _0x58ad0f));
  if (_0x23849a < _0x2a1202) return formatRelativeTimeUnit('day', Math.floor(_0x23849a / _0x9c9db2));
  if (_0x23849a < _0x1a6400) return formatRelativeTimeUnit('week', Math.floor(_0x23849a / _0x2a1202));
  if (_0x23849a < _0x109076) return formatRelativeTimeUnit('month', Math.floor(_0x23849a / _0x1a6400));
  return formatRelativeTimeUnit('year', Math.floor(_0x23849a / _0x109076));
}
export function formatNumber(_0x50a74c, _0x3f1e21 = 0) {
  if (_0x50a74c === null || _0x50a74c === undefined || isNaN(_0x50a74c)) return '-';
  return Number(_0x50a74c).toLocaleString(getLocale(), {
    minimumFractionDigits: _0x3f1e21,
    maximumFractionDigits: _0x3f1e21,
  });
}
export function formatDuration(_0x3845b5) {
  if (!_0x3845b5 || _0x3845b5 < 0) return '00:00';
  const _0x2f269c = Math.floor(_0x3845b5 / 0xe10),
    _0x5a5945 = Math.floor((_0x3845b5 % 0xe10) / 60),
    _0x523130 = Math.floor(_0x3845b5 % 60),
    _0x34a7bc = (_0x3ca6f0) => String(_0x3ca6f0).padStart(2, '0');
  if (_0x2f269c > 0) return _0x34a7bc(_0x2f269c) + ':' + _0x34a7bc(_0x5a5945) + ':' + _0x34a7bc(_0x523130);
  return _0x34a7bc(_0x5a5945) + ':' + _0x34a7bc(_0x523130);
}
export function truncateText(_0x558ebb, _0x28505e, _0x4daa03 = '...') {
  if (!_0x558ebb || _0x558ebb.length <= _0x28505e) return _0x558ebb || '';
  return _0x558ebb.slice(0, _0x28505e - _0x4daa03.length) + _0x4daa03;
}
export function capitalize(_0x5664d5) {
  if (!_0x5664d5) return '';
  return _0x5664d5.charAt(0).toUpperCase() + _0x5664d5.slice(1);
}
export function camelToKebab(_0x51418a) {
  return _0x51418a.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
export function kebabToCamel(_0x3155ef) {
  return _0x3155ef.replace(/-([a-z])/g, (_0x422bb1, _0x5407ee) => _0x5407ee.toUpperCase());
}
