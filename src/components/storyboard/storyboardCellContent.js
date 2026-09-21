import { t } from '../../i18n/index.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
function storyboardCellText(_0x123f29, _0x51de03 = {}) {
  return t('storyboard.cell.' + _0x123f29, _0x51de03);
}
function createEmptyPlusIcon() {
  const _0x41e560 = document.createElementNS(SVG_NS, 'svg');
  (_0x41e560.setAttribute('width', '24'),
    _0x41e560.setAttribute('height', '24'),
    _0x41e560.setAttribute('viewBox', '0 0 24 24'),
    _0x41e560.setAttribute('fill', 'none'),
    _0x41e560.setAttribute('stroke', 'currentColor'),
    _0x41e560.setAttribute('stroke-width', '1.5'));
  const _0x477dfa = document.createElementNS(SVG_NS, 'path');
  return (_0x477dfa.setAttribute('d', 'M12 3v18m9-9H3'), _0x41e560.appendChild(_0x477dfa), _0x41e560);
}
export function createStoryboardCellImageElement(_0x10a06b) {
  const _0x9d51e3 = document.createElement('img');
  return (
    (_0x9d51e3.className = 'storyboard-cell-img'),
    _0x9d51e3.setAttribute('src', _0x10a06b),
    (_0x9d51e3.decoding = 'async'),
    (_0x9d51e3.loading = 'eager'),
    (_0x9d51e3.style.width = '100%'),
    (_0x9d51e3.style.height = '100%'),
    (_0x9d51e3.style.objectFit = 'cover'),
    (_0x9d51e3.style.pointerEvents = 'none'),
    _0x9d51e3.addEventListener('error', () => {
      const _0x5762dc = _0x9d51e3.parentElement;
      if (!_0x5762dc) return;
      _0x5762dc.replaceChildren();
      const _0x57ed54 = document.createElement('div');
      ((_0x57ed54.style.color = 'var(--text-muted)'),
        (_0x57ed54.style.fontSize = '10px'),
        (_0x57ed54.textContent = storyboardCellText('loadFailed')),
        _0x5762dc.appendChild(_0x57ed54));
    }),
    _0x9d51e3
  );
}
function createResidualImage(_0x391110) {
  const _0xb2e184 = document.createElement('img');
  return (
    (_0xb2e184.className = 'storyboard-empty-residual-img'),
    _0xb2e184.setAttribute('src', _0x391110),
    (_0xb2e184.decoding = 'async'),
    (_0xb2e184.loading = 'eager'),
    (_0xb2e184.style.pointerEvents = 'none'),
    _0xb2e184
  );
}
function createEmptyPlaceholder(_0x402821 = 'empty-placeholder') {
  const _0x1a8165 = document.createElement('div');
  return (
    (_0x1a8165.className = _0x402821),
    (_0x1a8165.style.color = 'var(--white-10)'),
    _0x1a8165.appendChild(createEmptyPlusIcon()),
    _0x1a8165
  );
}
function createEmptyResidualContent(_0xdd71a6) {
  const _0x3bb287 = document.createElement('div');
  return (
    (_0x3bb287.className = 'storyboard-empty-residual'),
    _0x3bb287.appendChild(createResidualImage(_0xdd71a6)),
    _0x3bb287.appendChild(createEmptyPlaceholder('empty-placeholder storyboard-empty-cutout')),
    _0x3bb287
  );
}
function createExtractedCellContent(_0x5fb153, _0x4c6d63, _0x1e9bd3) {
  const _0x2c6432 = document.createElement('div');
  _0x2c6432.className = 'storyboard-extracted-cell-content';
  if (_0x1e9bd3) _0x2c6432.appendChild(createResidualImage(_0x1e9bd3));
  const _0x4e5bb5 = createStoryboardCellImageElement(_0x4c6d63);
  return (
    _0x4e5bb5.classList.add('storyboard-cell-img--extracted-cutout'),
    _0x2c6432.appendChild(_0x4e5bb5),
    _0x2c6432
  );
}
export function createStoryboardCellContentNode({
  cell: _0x57dbf4,
  finalUrl: _0x3d6c82,
  residualUrl: residualUrl = '',
} = {}) {
  if (!_0x57dbf4) return document.createTextNode('');
  if (!_0x3d6c82) return residualUrl ? createEmptyResidualContent(residualUrl) : createEmptyPlaceholder();
  if (_0x57dbf4.storyboardExtractedCell === true || _0x57dbf4.storyboardLockedCell === true)
    return createExtractedCellContent(_0x57dbf4, _0x3d6c82, residualUrl);
  return createStoryboardCellImageElement(_0x3d6c82);
}
export function buildReusableStoryboardCellImageMap(_0xc08e9b) {
  const _0x23cb4e = new Map();
  if (!_0xc08e9b) return _0x23cb4e;
  return (
    _0xc08e9b.forEach((_0x4a96bb) => {
      const _0x49bc82 = _0x4a96bb?.querySelector?.('.cell-content-wrap'),
        _0x33a7b2 = _0x49bc82?.querySelector?.('.storyboard-cell-img');
      if (!_0x33a7b2 || _0x33a7b2.tagName !== 'IMG') return;
      const _0x4ae66c = _0x33a7b2.getAttribute('src') || '';
      if (_0x4ae66c && !_0x23cb4e.has(_0x4ae66c)) _0x23cb4e.set(_0x4ae66c, _0x33a7b2);
    }),
    _0x23cb4e
  );
}
export function cloneReusableStoryboardCellImage(_0x3d919e, _0x1d32c9) {
  const _0x210e05 = _0x1d32c9?.get?.(_0x3d919e);
  if (!_0x210e05 || _0x210e05.tagName !== 'IMG') return null;
  const _0x1c88b9 = _0x210e05.cloneNode(false);
  return (
    _0x1c88b9.classList.remove('is-cell-preloading', 'is-cell-ready'),
    _0x1c88b9.classList.add('storyboard-cell-img'),
    _0x1c88b9.setAttribute('src', _0x3d919e),
    (_0x1c88b9.decoding = 'async'),
    (_0x1c88b9.loading = 'eager'),
    (_0x1c88b9.style.width = '100%'),
    (_0x1c88b9.style.height = '100%'),
    (_0x1c88b9.style.objectFit = 'cover'),
    (_0x1c88b9.style.pointerEvents = 'none'),
    (_0x1c88b9.style.position = ''),
    (_0x1c88b9.style.inset = ''),
    (_0x1c88b9.style.opacity = ''),
    (_0x1c88b9.style.transition = ''),
    _0x1c88b9
  );
}
