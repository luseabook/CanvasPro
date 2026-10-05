import { positionAnchoredSubmenu } from '../utils/submenuPosition.js';
export function positionAudioVoiceModelSubmenu(
  value,
  item,
  { windowObject: windowObject = globalThis['window'], gap: gap = 0, container: container = value } = {},
) {
  const enabled = value?.['getBoundingClientRect']?.();
  if (!enabled) return null;
  const key = container?.['getBoundingClientRect']?.() || enabled;
  return positionAnchoredSubmenu({
    submenu: item,
    anchorRect: enabled,
    containerRect: key,
    preferredSide: 'left',
    position: 'absolute',
    gap: gap,
    viewportWidth: windowObject?.['innerWidth'],
    viewportHeight: windowObject?.['innerHeight'],
  });
}
export function bindAudioVoiceModelSubmenuPosition(el, el2, index, args) {
  let result = null;
  const run = () => {
      if (result === null) return;
      (index?.['clearTimeout']?.(result), (result = null));
    },
    data = () => {
      (run(),
        el?.['classList']?.['add']('is-model-submenu-open'),
        el2?.['classList']?.['add']('is-model-submenu-open'),
        positionAudioVoiceModelSubmenu(el, el2, { windowObject: index, ...args }));
    },
    options = (target) => {
      if (el?.['contains']?.(target?.['relatedTarget']) || el2?.['contains']?.(target?.['relatedTarget']))
        return;
      (run(),
        (result = index?.['setTimeout']?.(() => {
          result = null;
          const source = el?.['ownerDocument']?.['activeElement'];
          if (
            el?.['matches']?.(':hover') ||
            el2?.['matches']?.(':hover') ||
            el?.['contains']?.(source) ||
            el2?.['contains']?.(source)
          )
            return;
          (el?.['classList']?.['remove']('is-model-submenu-open'),
            el2?.['classList']?.['remove']('is-model-submenu-open'));
        }, 80)));
    };
  (el?.['addEventListener']?.('mouseenter', data),
    el?.['addEventListener']?.('mouseleave', options),
    el?.['addEventListener']?.('focusin', data),
    el?.['addEventListener']?.('focusout', options),
    el2?.['addEventListener']?.('mouseenter', data),
    el2?.['addEventListener']?.('mouseleave', options),
    el2?.['addEventListener']?.('focusin', data),
    el2?.['addEventListener']?.('focusout', options));
}
export function createEl(next, current = '', entry = '') {
  const el3 = document['createElement'](next);
  if (current) el3['className'] = current;
  if (entry) el3['textContent'] = entry;
  return el3;
}
export function createButton(record, payload, handle, state = '') {
  const el4 = createEl('button', record),
    config = String(payload || '')['trim'](),
    scope = String(state || '')['trim'](),
    input = config || scope;
  el4['type'] = 'button';
  config && config !== scope && (el4['title'] = config);
  if (input) el4['setAttribute']('aria-label', input);
  return (
    (el4['innerHTML'] = iconSvg(handle)),
    scope && el4['appendChild'](createEl('span', 'audio-voice-btn-label', state)),
    el4
  );
}
export function createAudioVoiceModelIcon(options2 = {}, output = '') {
  const enabled2 = String(options2?.['icon'] || '')['trim'](),
    value2 = String(options2?.['iconName'] || '')['trim'](),
    value3 = String(options2?.['iconAlt'] || options2?.['label'] || 'model')['trim'](),
    el5 = createEl('span', output || 'audio-voice-global-model-provider');
  if (value2) return (el5['classList']['add']('has-svg-icon'), (el5['innerHTML'] = iconSvg(value2)), el5);
  if (!enabled2)
    return ((el5['textContent'] = String(options2?.['badgeText'] || 'RH')['trim']() || 'RH'), el5);
  const el6 = createEl('img', 'audio-voice-global-model-icon-img');
  return (
    (el6['src'] = enabled2),
    (el6['alt'] = value3),
    (el6['draggable'] = ![]),
    el5['appendChild'](el6),
    el5
  );
}
export function iconSvg(value4) {
  const value5 =
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    value6 = {
      align:
        '<path d="M4 6h16"></path><path d="M4 12h10"></path><path d="M4 18h16"></path>',
      audio:
        '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      check: '<path d="m5 12 4 4L19 6"></path>',
      close: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
      device:
        '<rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><path d="M9 1v3"></path><path d="M15 1v3"></path><path d="M9 20v3"></path><path d="M15 20v3"></path><path d="M20 9h3"></path><path d="M20 15h3"></path><path d="M1 9h3"></path><path d="M1 15h3"></path>',
      edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path>',
      generate: '<path d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"></path>',
      generateAction:
        '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>',
      grid: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
      history:
        '<path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 3v6h-6"></path><path d="M12 7v5l3 2"></path>',
      insert: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
      loading: '<path d="M21 12a9 9 0 1 1-2.64-6.36"></path>',
      merge:
        '<path d="M12 3v7"></path><path d="m8 7 4 4 4-4"></path><path d="M12 21v-7"></path><path d="m16 17-4-4-4 4"></path>',
      more: '<path d="M12 12h.01"></path><path d="M19 12h.01"></path><path d="M5 12h.01"></path>',
      play: '<path d="m8 5 11 7-11 7V5Z"></path>',
      plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
      settings:
        '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 .9-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5.9Z"></path>',
      speaker: '<path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="M15 9.5a4 4 0 0 1 0 5"></path>',
      translate:
        '<path d="m5 8 6 6"></path><path d="m4 14 6-7 2-3"></path><path d="M2 4h12"></path><path d="M7 2h1"></path><path d="m12 20 4-9 4 9"></path><path d="m13.5 17h5"></path>',
      video: '<rect x="3" y="5" width="14" height="14" rx="2"></rect><path d="m17 9 4-2v10l-4-2"></path>',
    };
  return '<svg width="18" height="18" ' + value5 + '>' + (value6[value4] || '') + '</svg>';
}
