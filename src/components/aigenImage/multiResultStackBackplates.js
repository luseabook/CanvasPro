export const MAX_MULTI_RESULT_BACKPLATES = 3;
export const MULTI_RESULT_STACK_PREVIEW_CLASS = 'is-multi-result-stack';
export const MULTI_RESULT_STACK_EXPANDED_CLASS = 'is-multi-result-stack-expanded';
export const MULTI_RESULT_STACK_WRAP_CLASS = 'multi-stack-wrap';
export const MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS = 'is-expanded';
export const MULTI_RESULT_BACKPLATES_CLASS = 'multi-stack-backplates';
export const MULTI_RESULT_BACKPLATE_CLASS = 'multi-stack-backplate';
function toFiniteCount(_0x5c5223) {
  const _0x3fffe7 = Number(_0x5c5223);
  if (!Number.isFinite(_0x3fffe7) || _0x3fffe7 <= 0) return 0;
  return Math.floor(_0x3fffe7);
}
export function getMultiResultBackplateCount(_0x5ec34e) {
  const _0x25bf56 = toFiniteCount(_0x5ec34e);
  return Math.min(Math.max(_0x25bf56 - 1, 0), MAX_MULTI_RESULT_BACKPLATES);
}
function normalizeBackplateItem(_0x20c8d3, _0x25ac05) {
  const _0x2f8a91 = Number.isFinite(Number(_0x20c8d3?.imageIndex))
    ? Math.floor(Number(_0x20c8d3.imageIndex))
    : _0x25ac05;
  return { imageIndex: _0x2f8a91 };
}
export function buildMultiResultBackplateItems({
  imageCount: imageCount = 0,
  mainIndex: mainIndex = 0,
} = {}) {
  const _0x18566 = toFiniteCount(imageCount);
  if (_0x18566 <= 1) return [];
  const _0x15369c =
      Number.isFinite(Number(mainIndex)) && mainIndex >= 0 && mainIndex < _0x18566
        ? Math.floor(Number(mainIndex))
        : 0,
    _0x49050f = [];
  for (let _0x267709 = 0; _0x267709 < _0x18566; _0x267709 += 1) {
    if (_0x267709 === _0x15369c) continue;
    _0x49050f.push({ imageIndex: _0x267709 });
    if (_0x49050f.length >= MAX_MULTI_RESULT_BACKPLATES) break;
  }
  return _0x49050f;
}
export function getMultiResultBackplateKey(_0xb656bf = []) {
  return (Array.isArray(_0xb656bf) ? _0xb656bf : [])
    .map((_0x5615eb, _0x23d533) => {
      const _0x52dda4 = normalizeBackplateItem(_0x5615eb, _0x23d533);
      return '' + _0x52dda4.imageIndex;
    })
    .join(',');
}
export function shouldRefreshMultiResultStackDom({
  imageCount: imageCount = 0,
  previewEl: previewEl = null,
  containerEl: containerEl = null,
  stackWrap: stackWrap = null,
  backdropWrap: backdropWrap = null,
} = {}) {
  const _0x357ceb = getMultiResultBackplateCount(imageCount);
  if (_0x357ceb <= 0) return false;
  if (!containerEl || !stackWrap || stackWrap.parentNode !== containerEl) return true;
  if (!backdropWrap || backdropWrap.parentNode !== stackWrap) return true;
  if ((Number(backdropWrap.children?.length) || 0) !== _0x357ceb) return true;
  return !previewEl?.classList?.contains(MULTI_RESULT_STACK_PREVIEW_CLASS);
}
export function createMultiResultBackplates(_0x30bcf9, _0x32feab, _0x31d199 = {}) {
  if (!_0x30bcf9?.createElement) return null;
  const _0x5f27de = Array.isArray(_0x31d199.items) ? _0x31d199.items : null,
    _0x556cf6 = _0x5f27de
      ? _0x5f27de
          .slice(0, MAX_MULTI_RESULT_BACKPLATES)
          .map((_0x4db803, _0x4d4778) => normalizeBackplateItem(_0x4db803, _0x4d4778))
      : Array.from({ length: getMultiResultBackplateCount(_0x32feab) }, (_0x27b9ea, _0x45ccad) =>
          normalizeBackplateItem({}, _0x45ccad + 1),
        );
  if (_0x556cf6.length <= 0) return null;
  const _0xd98f1f = _0x30bcf9.createElement('div');
  ((_0xd98f1f.className = MULTI_RESULT_BACKPLATES_CLASS), _0xd98f1f.setAttribute('aria-hidden', 'true'));
  for (let _0x1839db = 0; _0x1839db < _0x556cf6.length; _0x1839db += 1) {
    const _0x34e3c8 = _0x556cf6[_0x1839db],
      _0x1b6561 = _0x30bcf9.createElement('div');
    ((_0x1b6561.className = MULTI_RESULT_BACKPLATE_CLASS),
      (_0x1b6561.dataset.stackIndex = String(_0x1839db + 1)),
      (_0x1b6561.dataset.imageIndex = String(_0x34e3c8.imageIndex)),
      _0xd98f1f.appendChild(_0x1b6561));
  }
  return _0xd98f1f;
}
export function syncMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
  isActive: isActive = false,
  isExpanded: isExpanded = false,
} = {}) {
  const _0x4b26d7 = !!isActive,
    _0x5168e9 = _0x4b26d7 && !!isExpanded;
  (previewEl?.classList?.toggle(MULTI_RESULT_STACK_PREVIEW_CLASS, _0x4b26d7),
    previewEl?.classList?.toggle(MULTI_RESULT_STACK_EXPANDED_CLASS, _0x5168e9),
    stackWrap?.classList?.toggle(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS, _0x5168e9));
}
export function clearMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
} = {}) {
  (previewEl?.classList?.remove(MULTI_RESULT_STACK_PREVIEW_CLASS, MULTI_RESULT_STACK_EXPANDED_CLASS),
    stackWrap?.classList?.remove(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS));
}
