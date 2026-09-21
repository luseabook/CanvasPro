import { t } from '../../i18n/index.js';
export const PANORAMA_MANNEQUIN_COLOR_OPTIONS = Object.freeze([
  ['red', 'red'],
  ['green', 'green'],
  ['blue', 'blue'],
  ['yellow', 'yellow'],
  ['purple', 'purple'],
  ['cyan', 'cyan'],
  ['white', 'white'],
]);
export const PANORAMA_MANNEQUIN_GENDER_OPTIONS = Object.freeze([
  [
    'male',
    'male',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><circle cx="10" cy="14" r="5"/><path d="M14.5 9.5 21 3"/><path d="M16 3h5v5"/></svg>',
  ],
  [
    'female',
    'female',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M9 18h6"/></svg>',
  ],
]);
function panoramaSceneText(_0x1cb8ee, _0x27a746 = {}) {
  return t('panoramaSceneNode.' + _0x1cb8ee, _0x27a746);
}
export function getPanoramaMannequinColorLabel(_0x992d12) {
  return panoramaSceneText('mannequin.colors.' + _0x992d12);
}
export function getPanoramaMannequinGenderLabel(_0x5523fc) {
  return panoramaSceneText('mannequin.genders.' + (_0x5523fc === 'female' ? 'female' : 'male'));
}
export function resolvePanoramaSceneColorToken(_0x719c15) {
  if (_0x719c15 === 'yellow') return 'gold';
  return _0x719c15;
}
export function createMannequinQuickMenu({ onSelectColor: _0x4dd912, onSelectGender: _0x50bd60 } = {}) {
  const _0x5d6739 = document.createElement('div');
  ((_0x5d6739.className = 'panorama-mannequin-menu'),
    (_0x5d6739.dataset.uiStop = '1'),
    (_0x5d6739.dataset.activeGender = 'male'));
  const _0x519975 = document.createElement('div');
  ((_0x519975.className = 'panorama-mannequin-menu__title'),
    (_0x519975.textContent = panoramaSceneText('mannequin.title')),
    _0x5d6739.appendChild(_0x519975));
  const _0x197109 = document.createElement('div');
  ((_0x197109.className = 'panorama-mannequin-menu__row panorama-mannequin-menu__genders'),
    _0x5d6739.appendChild(_0x197109),
    PANORAMA_MANNEQUIN_GENDER_OPTIONS.forEach(([_0x447dc6, , _0x4d079b]) => {
      const _0x535656 = getPanoramaMannequinGenderLabel(_0x447dc6),
        _0x3b3ffe = document.createElement('button');
      ((_0x3b3ffe.type = 'button'),
        (_0x3b3ffe.className = 'panorama-mannequin-menu__gender-btn'),
        (_0x3b3ffe.dataset.gender = _0x447dc6),
        _0x447dc6 === 'male' && _0x3b3ffe.classList.add('is-active'),
        _0x3b3ffe.setAttribute(
          'aria-label',
          panoramaSceneText('mannequin.setGenderAria', { label: _0x535656 }),
        ),
        (_0x3b3ffe.innerHTML = _0x4d079b),
        _0x3b3ffe.addEventListener('click', () => {
          ((_0x5d6739.dataset.activeGender = _0x447dc6), _0x50bd60?.({ gender: _0x447dc6 }));
        }),
        _0x197109.appendChild(_0x3b3ffe));
    }));
  const _0x70f00c = document.createElement('div');
  return (
    (_0x70f00c.className = 'panorama-mannequin-menu__row panorama-mannequin-menu__colors'),
    _0x5d6739.appendChild(_0x70f00c),
    PANORAMA_MANNEQUIN_COLOR_OPTIONS.forEach(([_0xfffb99]) => {
      const _0x933e70 = getPanoramaMannequinColorLabel(_0xfffb99),
        _0x1de8e3 = document.createElement('button');
      ((_0x1de8e3.type = 'button'),
        (_0x1de8e3.className = 'panorama-mannequin-menu__color-btn'),
        (_0x1de8e3.dataset.colorKey = _0xfffb99),
        _0xfffb99 === 'blue' && _0x1de8e3.classList.add('is-active'),
        _0x1de8e3.setAttribute(
          'aria-label',
          panoramaSceneText('mannequin.createColorAria', { label: _0x933e70 }),
        ),
        _0x1de8e3.addEventListener('click', () => {
          const _0x355011 = _0x5d6739.dataset.activeGender === 'female' ? 'female' : 'male';
          _0x4dd912?.({ colorKey: _0xfffb99, gender: _0x355011 });
        }),
        _0x70f00c.appendChild(_0x1de8e3));
    }),
    _0x5d6739
  );
}
export function renderMannequinQuickMenu(_0x3d8fea, _0x43b165) {
  if (!_0x3d8fea) return;
  const _0x18a4cf = _0x3d8fea.querySelector('.panorama-mannequin-menu__title');
  if (_0x18a4cf) _0x18a4cf.textContent = panoramaSceneText('mannequin.title');
  const _0x25df79 = _0x43b165?.gridPlacement?.gender === 'female' ? 'female' : 'male';
  ((_0x3d8fea.dataset.activeGender = _0x25df79),
    _0x3d8fea.querySelectorAll('.panorama-mannequin-menu__gender-btn').forEach((_0x1c2272) => {
      const _0x1ab571 = _0x1c2272.dataset.gender === 'female' ? 'female' : 'male';
      (_0x1c2272.setAttribute(
        'aria-label',
        panoramaSceneText('mannequin.setGenderAria', { label: getPanoramaMannequinGenderLabel(_0x1ab571) }),
      ),
        _0x1c2272.classList.toggle('is-active', _0x1ab571 === _0x25df79));
    }));
  const _0x25a2e9 = _0x43b165?.gridPlacement?.colorKey || 'blue';
  _0x3d8fea.querySelectorAll('.panorama-mannequin-menu__color-btn').forEach((_0x2b1a58) => {
    const _0x1cd6b0 = _0x2b1a58.dataset.colorKey;
    (_0x2b1a58.setAttribute(
      'aria-label',
      panoramaSceneText('mannequin.createColorAria', { label: getPanoramaMannequinColorLabel(_0x1cd6b0) }),
    ),
      _0x2b1a58.classList.toggle('is-active', _0x1cd6b0 === _0x25a2e9),
      _0x2b1a58.style.setProperty(
        '--panorama-scene-swatch-token',
        'var(--' + resolvePanoramaSceneColorToken(_0x1cd6b0) + ')',
      ));
  });
}
