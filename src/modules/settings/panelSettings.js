import { revealModelServiceSettingsField } from './modelServiceSettingsNavigator.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { initSettingsSearch } from './settingsSearch.js';
import { createFocusNavigation } from '../../utils/focusNavigation.js';
let releaseSettingsInteraction = null,
  settingsSearch = null;
function getSettingsPanelElements() {
  return {
    settingsOverlay: document['getElementById']('settingsOverlay'),
    avatarMenu: document['getElementById']('avatarMenu'),
  };
}
function isSettingsPanelOpen(enabled) {
  return !!enabled && enabled['style']['display'] === 'block';
}
const SETTINGS_FIELD_HIGHLIGHT_CLASS = 'is-settings-field-highlight',
  fieldHighlightTimers = new WeakMap();
function getTimerHost() {
  return globalThis['window'] || globalThis;
}
function scheduleTimer(handler, value = 0x0) {
  const timerHost = getTimerHost();
  if (typeof timerHost?.['setTimeout'] === 'function') return timerHost['setTimeout'](handler, value);
  return (handler(), null);
}
function clearScheduledTimer(item) {
  if (item == null) return;
  const timerHost2 = getTimerHost();
  typeof timerHost2?.['clearTimeout'] === 'function' && timerHost2['clearTimeout'](item);
}
function dispatchWebPreviewSettingsSync(reason) {
  const enabled2 = globalThis['window'];
  if (!enabled2 || typeof enabled2['dispatchEvent'] !== 'function') return;
  const detail = { reason: reason },
    key =
      typeof globalThis['CustomEvent'] === 'function'
        ? new globalThis['CustomEvent']('web-preview:force-sync', {
            detail: detail,
          })
        : { type: 'web-preview:force-sync', detail: detail };
  enabled2['dispatchEvent'](key);
}
export function activateSettingsPane(index = 'api-input') {
  const enabled3 = String(index || '')['trim']();
  if (!enabled3) return ![];
  let result = ![];
  return (
    document['querySelectorAll']?.('.settings-nav-item')?.['forEach']((data) => {
      const options = data['dataset']?.['pane'] === enabled3;
      data['classList']['toggle']('active', options);
      if (options) data['setAttribute']?.('aria-current', 'page');
      else data['removeAttribute']?.('aria-current');
      result = result || options;
    }),
    document['querySelectorAll']?.('.settings-pane')?.['forEach']((target) => {
      target['classList']['toggle']('active', target['id'] === 'pane-' + enabled3);
    }),
    result
  );
}
export function highlightSettingsField(enabled4, { duration: duration = 0x1068 } = {}) {
  if (!enabled4?.['classList']) return ![];
  document['querySelectorAll']?.('.' + SETTINGS_FIELD_HIGHLIGHT_CLASS)?.['forEach']((source) => {
    if (source !== enabled4) source['classList']['remove'](SETTINGS_FIELD_HIGHLIGHT_CLASS);
  });
  const next = fieldHighlightTimers['get'](enabled4);
  (clearScheduledTimer(next), enabled4['classList']['remove'](SETTINGS_FIELD_HIGHLIGHT_CLASS));
  typeof enabled4['getBoundingClientRect'] === 'function' && enabled4['getBoundingClientRect']();
  enabled4['classList']['add'](SETTINGS_FIELD_HIGHLIGHT_CLASS);
  const scheduleTimer2 = scheduleTimer(() => {
    (enabled4['classList']['remove'](SETTINGS_FIELD_HIGHLIGHT_CLASS),
      fieldHighlightTimers['delete'](enabled4));
  }, duration);
  if (scheduleTimer2 != null) fieldHighlightTimers['set'](enabled4, scheduleTimer2);
  return !![];
}
export function focusSettingsField(current, entry = {}) {
  const enabled5 = (Array['isArray'](current) ? current : [current])
    ['map']((record) => String(record || '')['trim']())
    ['filter'](Boolean);
  if (!enabled5['length']) return ![];
  const enabled6 = enabled5['map']((payload) => document['getElementById'](payload))['find'](Boolean);
  if (!enabled6) return ![];
  (revealModelServiceSettingsField(enabled6),
    enabled6['scrollIntoView']?.({ block: 'center', behavior: 'smooth' }),
    enabled6['focus']?.());
  if (entry['select'] !== ![]) enabled6['select']?.();
  if (entry['highlight'] !== ![]) highlightSettingsField(enabled6, entry);
  return !![];
}
export function openSettingsPanelToField({
  paneName: paneName = 'api-input',
  fieldIds: fieldIds = [],
  select: select = !![],
  highlight: highlight = !![],
} = {}) {
  const openSettingsPanel2 = openSettingsPanel();
  if (!openSettingsPanel2) return ![];
  return (
    settingsSearch?.['clear'](),
    activateSettingsPane(paneName),
    scheduleTimer(() => {
      focusSettingsField(fieldIds, { select: select, highlight: highlight });
    }, 0x0),
    !![]
  );
}
export function openSettingsPanel() {
  const { settingsOverlay: settingsOverlay, avatarMenu: avatarMenu } = getSettingsPanelElements();
  if (!settingsOverlay) return ![];
  ((settingsOverlay['style']['display'] = 'block'), avatarMenu?.['classList']['remove']('open'));
  if (!releaseSettingsInteraction) {
    const root = settingsOverlay['querySelector']?.('.settings-modal') || settingsOverlay,
      focusNavigation = createFocusNavigation();
    focusNavigation['addRoot'](root);
    const run = beginModalInteraction({
      root: root,
      onClose: closeSettingsPanel,
      returnFocus: document['getElementById']('userAvatar'),
      preferredSelector: '.settings-nav-item.active',
    });
    releaseSettingsInteraction = () => {
      (focusNavigation['destroy'](), run());
    };
  }
  return (dispatchWebPreviewSettingsSync('settings-open'), !![]);
}
export function closeSettingsPanel() {
  const { settingsOverlay: settingsOverlay2 } = getSettingsPanelElements();
  if (!settingsOverlay2) return ![];
  (settingsSearch?.['clear']({ restore: !![] }),
    (settingsOverlay2['style']['display'] = 'none'),
    releaseSettingsInteraction?.(),
    (releaseSettingsInteraction = null));
  const handle = globalThis['window'];
  if (handle && typeof handle['dispatchEvent'] === 'function') {
    const state =
      typeof globalThis['CustomEvent'] === 'function'
        ? new globalThis['CustomEvent']('settings-panel-closed')
        : { type: 'settings-panel-closed' };
    handle['dispatchEvent'](state);
  }
  return (dispatchWebPreviewSettingsSync('settings-close'), !![]);
}
export function toggleSettingsPanel() {
  const { settingsOverlay: settingsOverlay3 } = getSettingsPanelElements();
  if (!settingsOverlay3) return ![];
  return isSettingsPanelOpen(settingsOverlay3) ? closeSettingsPanel() : openSettingsPanel();
}
export function initSettingsPanelEvents() {
  const enabled7 = document['getElementById']('btnOpenSettings'),
    config = document['getElementById']('btnSettingsClose'),
    root2 = document['getElementById']('settingsOverlay');
  if (!enabled7 || !root2) return;
  (enabled7['addEventListener']('click', (scope) => {
    (scope['stopPropagation'](), openSettingsPanel());
  }),
    config?.['addEventListener']('click', () => {
      closeSettingsPanel();
    }));
  let enabled8 = ![],
    enabled9 = ![];
  const run2 = () => {
    ((enabled8 = ![]), (enabled9 = ![]));
  };
  (root2['addEventListener']('pointerdown', (input) => {
    ((enabled8 = input['target'] === root2), (enabled9 = ![]));
  }),
    root2['addEventListener']('pointerup', (output) => {
      enabled9 = enabled8 && output['target'] === root2;
    }),
    root2['addEventListener']('pointercancel', run2),
    root2['addEventListener']('click', (value2) => {
      const value3 = value2['target'] === root2 && enabled8 && enabled9;
      (run2(), value3 && closeSettingsPanel());
    }));
  const value4 = document['querySelectorAll']('.settings-nav-item');
  (settingsSearch?.['destroy'](),
    (settingsSearch = initSettingsSearch({
      root: root2,
      activatePane: activateSettingsPane,
    })),
    activateSettingsPane(
      document['querySelector']?.('.settings-nav-item.active')?.['dataset']['pane'] || 'general',
    ),
    value4['forEach']((value5) => {
      value5['addEventListener']('click', () => {
        (settingsSearch?.['clear'](), activateSettingsPane(value5['dataset']['pane']));
      });
    }));
}
