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
function panoramaSceneText(value, item = {}) {
  return t('panoramaSceneNode.' + value, item);
}
export function getPanoramaMannequinColorLabel(key) {
  return panoramaSceneText('mannequin.colors.' + key);
}
export function getPanoramaMannequinGenderLabel(index) {
  return panoramaSceneText('mannequin.genders.' + (index === 'female' ? 'female' : 'male'));
}
export function resolvePanoramaSceneColorToken(result) {
  if (result === 'yellow') return 'gold';
  return result;
}
export function createMannequinQuickMenu({
  onSelectColor: onSelectColor,
  onSelectGender: onSelectGender,
} = {}) {
  const el = document.createElement('div');
  ((el.className = 'panorama-mannequin-menu'), (el.dataset.uiStop = '1'), (el.dataset.activeGender = 'male'));
  const el2 = document.createElement('div');
  ((el2.className = 'panorama-mannequin-menu__title'),
    (el2.textContent = panoramaSceneText('mannequin.title')),
    el.appendChild(el2));
  const el3 = document.createElement('div');
  ((el3.className = 'panorama-mannequin-menu__row panorama-mannequin-menu__genders'),
    el.appendChild(el3),
    PANORAMA_MANNEQUIN_GENDER_OPTIONS.forEach(([gender, , data]) => {
      const label = getPanoramaMannequinGenderLabel(gender),
        el4 = document.createElement('button');
      ((el4.type = 'button'),
        (el4.className = 'panorama-mannequin-menu__gender-btn'),
        (el4.dataset.gender = gender),
        gender === 'male' && el4.classList.add('is-active'),
        el4.setAttribute('aria-label', panoramaSceneText('mannequin.setGenderAria', { label: label })),
        (el4.innerHTML = data),
        el4.addEventListener('click', () => {
          ((el.dataset.activeGender = gender), onSelectGender?.({ gender: gender }));
        }),
        el3.appendChild(el4));
    }));
  const el5 = document.createElement('div');
  return (
    (el5.className = 'panorama-mannequin-menu__row panorama-mannequin-menu__colors'),
    el.appendChild(el5),
    PANORAMA_MANNEQUIN_COLOR_OPTIONS.forEach(([colorKey]) => {
      const label2 = getPanoramaMannequinColorLabel(colorKey),
        el6 = document.createElement('button');
      ((el6.type = 'button'),
        (el6.className = 'panorama-mannequin-menu__color-btn'),
        (el6.dataset.colorKey = colorKey),
        colorKey === 'blue' && el6.classList.add('is-active'),
        el6.setAttribute('aria-label', panoramaSceneText('mannequin.createColorAria', { label: label2 })),
        el6.addEventListener('click', () => {
          const gender2 = el.dataset.activeGender === 'female' ? 'female' : 'male';
          onSelectColor?.({ colorKey: colorKey, gender: gender2 });
        }),
        el5.appendChild(el6));
    }),
    el
  );
}
export function renderMannequinQuickMenu(el7, options) {
  if (!el7) return;
  const el8 = el7.querySelector('.panorama-mannequin-menu__title');
  if (el8) el8.textContent = panoramaSceneText('mannequin.title');
  const target = options?.gridPlacement?.gender === 'female' ? 'female' : 'male';
  ((el7.dataset.activeGender = target),
    el7.querySelectorAll('.panorama-mannequin-menu__gender-btn').forEach((el9) => {
      const source = el9.dataset.gender === 'female' ? 'female' : 'male';
      (el9.setAttribute(
        'aria-label',
        panoramaSceneText('mannequin.setGenderAria', { label: getPanoramaMannequinGenderLabel(source) }),
      ),
        el9.classList.toggle('is-active', source === target));
    }));
  const next = options?.gridPlacement?.colorKey || 'blue';
  el7.querySelectorAll('.panorama-mannequin-menu__color-btn').forEach((el10) => {
    const current = el10.dataset.colorKey;
    (el10.setAttribute(
      'aria-label',
      panoramaSceneText('mannequin.createColorAria', { label: getPanoramaMannequinColorLabel(current) }),
    ),
      el10.classList.toggle('is-active', current === next),
      el10.style.setProperty(
        '--panorama-scene-swatch-token',
        'var(--' + resolvePanoramaSceneColorToken(current) + ')',
      ));
  });
}
