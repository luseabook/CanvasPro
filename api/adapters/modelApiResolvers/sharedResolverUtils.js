export function stripPrefix(_0x585dc4, _0x28c698) {
  const _0x52e6c8 = String(_0x585dc4 || '')['trim']();
  return _0x52e6c8['startsWith'](_0x28c698) ? _0x52e6c8['slice'](_0x28c698['length']) : _0x52e6c8;
}
export function isPresentValue(_0x4988e7) {
  return _0x4988e7 !== undefined && _0x4988e7 !== null && String(_0x4988e7)['trim']() !== '';
}
export function normalizePositiveInteger(_0x11c5e9, _0x197246) {
  const _0x2036ac = Number['parseInt'](String(_0x11c5e9 ?? '')['trim'](), 0xa);
  return Number['isFinite'](_0x2036ac) && _0x2036ac >= 0x0 ? _0x2036ac : _0x197246;
}
export function normalizeOptionalIntegerInRange(_0x3b9fb7, { min: min = null, max: max = null } = {}) {
  if (!isPresentValue(_0x3b9fb7)) return null;
  const _0x40460d = Number(_0x3b9fb7);
  if (!Number['isFinite'](_0x40460d)) return null;
  let _0xcb0215 = Math['trunc'](_0x40460d);
  const _0x298794 = Number(min),
    _0x3cf191 = Number(max);
  return (
    min !== null &&
      Number['isFinite'](_0x298794) &&
      (_0xcb0215 = Math['max'](Math['trunc'](_0x298794), _0xcb0215)),
    max !== null &&
      Number['isFinite'](_0x3cf191) &&
      (_0xcb0215 = Math['min'](Math['trunc'](_0x3cf191), _0xcb0215)),
    _0xcb0215
  );
}
export function normalizeInputList(_0x14d429) {
  return Array['isArray'](_0x14d429)
    ? _0x14d429['map']((_0x601c40) => String(_0x601c40 || '')['trim']())['filter'](Boolean)
    : [];
}
export function normalizeInputUrlsBySlot(_0x649565) {
  if (!_0x649565 || typeof _0x649565 !== 'object' || Array['isArray'](_0x649565)) return {};
  return Object['fromEntries'](
    Object['entries'](_0x649565)
      ['map'](([_0x38efab, _0x14e18c]) => [
        String(_0x38efab || '')['trim'](),
        String(_0x14e18c || '')['trim'](),
      ])
      ['filter'](([_0x52f4a1, _0x163062]) => _0x52f4a1 && _0x163062),
  );
}
export function appendUniqueUrl(_0x529463, _0x3baf6a) {
  const _0x1a4a1c = String(_0x3baf6a || '')['trim']();
  if (_0x1a4a1c && !_0x529463['includes'](_0x1a4a1c)) _0x529463['push'](_0x1a4a1c);
}
export function normalizeKlingKeepOriginalSound(_0x4f8c66) {
  if (_0x4f8c66 === !![] || _0x4f8c66 === ![]) return _0x4f8c66;
  const _0x3f7455 = String(_0x4f8c66 ?? '')
    ['trim']()
    ['toLowerCase']();
  return _0x3f7455 === 'true' || _0x3f7455 === '1' || _0x3f7455 === 'yes';
}
export function replaceKlingO1PromptImageReferences(_0x20e683, _0x43d0a6) {
  const _0x2b0de5 = Math['max'](0x0, Math['trunc'](Number(_0x43d0a6) || 0x0));
  if (_0x2b0de5 <= 0x0) return String(_0x20e683 || '');
  return String(_0x20e683 || '')['replace'](/@?\u56fe\u7247\s*([1-9]\d*)/g, (_0x1a20f0, _0x4c056f) => {
    const _0x398d6c = Number['parseInt'](String(_0x4c056f || ''), 0xa);
    if (!Number['isFinite'](_0x398d6c) || _0x398d6c < 0x1 || _0x398d6c > _0x2b0de5) return _0x1a20f0;
    return '<<<image_' + _0x398d6c + '>>>';
  });
}
