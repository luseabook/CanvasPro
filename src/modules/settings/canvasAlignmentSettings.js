import appStore from '../../core/stores/appStore.js';
import { getShortcuts } from '../shortcuts.js';
import { applySnapGridEnabled, readSnapGridEnabled, subscribeSnapGridChanges } from '../snapGridState.js';
import { getShortcutLabelByAction } from './settingsShared.js';
const SELECTION_RELATED_HIGHLIGHT_COLORS = ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow'];
function normalizeSelectionRelatedHighlightColor(value) {
  const item = String(value || '').trim();
  return SELECTION_RELATED_HIGHLIGHT_COLORS.includes(item) ? item : 'white';
}
function getSelectionRelatedHighlightElements() {
  if (typeof document === 'undefined') return { btnOn: null, btnOff: null, colorRow: null, colorButtons: [] };
  return {
    btnOn: document.getElementById('btnSelectionRelatedHighlightOn'),
    btnOff: document.getElementById('btnSelectionRelatedHighlightOff'),
    colorRow: document.getElementById('selectionRelatedHighlightColorRow'),
    colorButtons: Array.from(document.querySelectorAll('[data-highlight-color]')),
  };
}
function syncSelectionRelatedHighlightColorButtons(key) {
  const selectionRelatedHighlightColor = normalizeSelectionRelatedHighlightColor(key),
    { colorButtons: colorButtons } = getSelectionRelatedHighlightElements();
  colorButtons.forEach((el) => {
    el.classList.toggle('active', el.dataset.highlightColor === selectionRelatedHighlightColor);
  });
}
function syncSelectionRelatedHighlightEnabled(index) {
  const enabled = index !== false,
    {
      btnOn: btnOn,
      btnOff: btnOff,
      colorRow: colorRow,
      colorButtons: colorButtons2,
    } = getSelectionRelatedHighlightElements();
  (btnOn?.classList.toggle('active', enabled),
    btnOff?.classList.toggle('active', !enabled),
    colorRow?.classList.toggle('settings-row-disabled', !enabled),
    colorButtons2.forEach((el2) => {
      ((el2.disabled = !enabled), el2.setAttribute('aria-disabled', enabled ? 'false' : 'true'));
    }));
}
export function setSelectionRelatedHighlightPref(result, data = appStore) {
  const options = result !== false;
  return (
    data.setSelectionRelatedHighlightEnabled(options),
    syncSelectionRelatedHighlightEnabled(options),
    options
  );
}
export function setSelectionRelatedHighlightColorPref(target, source = appStore) {
  const selectionRelatedHighlightColor2 = normalizeSelectionRelatedHighlightColor(target);
  return (
    source.setSelectionRelatedHighlightColor(selectionRelatedHighlightColor2),
    syncSelectionRelatedHighlightColorButtons(selectionRelatedHighlightColor2),
    selectionRelatedHighlightColor2
  );
}
function initSelectionRelatedHighlight() {
  const el3 = document.getElementById('btnSelectionRelatedHighlightOn'),
    el4 = document.getElementById('btnSelectionRelatedHighlightOff'),
    list = Array.from(document.querySelectorAll('[data-highlight-color]'));
  if (!el3 || !el4) return;
  const next = appStore.getState(),
    current = next?.ui?.selectionRelatedHighlightEnabled !== false,
    selectionRelatedHighlightColor3 = normalizeSelectionRelatedHighlightColor(
      next?.ui?.selectionRelatedHighlightColor,
    );
  (setSelectionRelatedHighlightPref(current),
    setSelectionRelatedHighlightColorPref(selectionRelatedHighlightColor3),
    el3.addEventListener('click', () => setSelectionRelatedHighlightPref(true)),
    el4.addEventListener('click', () => setSelectionRelatedHighlightPref(false)),
    list.forEach((el5) => {
      el5.addEventListener('click', () => {
        if (el5.disabled) return;
        setSelectionRelatedHighlightColorPref(el5.dataset.highlightColor);
      });
    }));
}
function initAlignFeature() {
  const el6 = document.getElementById('btnAlignTriggerHold'),
    el7 = document.getElementById('btnAlignTriggerClick'),
    el8 = document.getElementById('btnAlignTriggerOff'),
    el9 = document.getElementById('alignDistributeGapSlider'),
    el10 = document.getElementById('alignDistributeGapValue'),
    el11 = document.getElementById('alignShortcutLabelMain'),
    el12 = document.getElementById('alignShortcutLabelHold'),
    el13 = document.getElementById('alignShortcutLabelClick');
  if (!el6 || !el7 || !el8 || !el9 || !el10) return;
  const run = (entry) => {
      const record = String(entry || '').trim();
      return record === 'hold' || record === 'click' || record === 'off' ? record : 'click';
    },
    handler = () => {
      try {
        const payload = getShortcuts?.() || {},
          list2 = payload?.['align-feature']?.keys;
        if (Array.isArray(list2) && list2.length > 0) return list2.join('+');
      } catch {}
      return 'Tab';
    },
    handler2 = () => {
      const handle = handler();
      if (el11) el11.textContent = handle;
      if (el12) el12.textContent = handle;
      if (el13) el13.textContent = handle;
    },
    handler3 = (state) => {
      const mode = run(state);
      appStore.setAlignFeatureTriggerMode(mode);
      const enabled2 = mode !== 'off';
      (el6.classList.toggle('active', mode === 'hold'),
        el7.classList.toggle('active', mode === 'click'),
        el8.classList.toggle('active', mode === 'off'),
        window.dispatchEvent(
          new CustomEvent('v2-align-feature-changed', { detail: { enabled: enabled2, mode: mode } }),
        ));
    },
    handler4 = (config) => {
      const scope = Number(config),
        input = Number.isFinite(scope) ? Math.max(0, Math.min(200, Math.round(scope / 5) * 5)) : 40;
      ((el9.value = String(input)),
        (el10.textContent = String(input)),
        appStore.setAlignDistributeGap(input));
    },
    output = appStore.getState()?.ui || {},
    value2 = run(output.alignFeatureTriggerMode),
    value3 = Number.isFinite(Number(output.alignDistributeGap)) ? Number(output.alignDistributeGap) : 40;
  (handler3(value2),
    handler4(value3),
    handler2(),
    el6.addEventListener('click', () => handler3('hold')),
    el7.addEventListener('click', () => handler3('click')),
    el8.addEventListener('click', () => handler3('off')),
    el9.addEventListener('input', (event) => handler4(event.target?.value)),
    window.addEventListener('shortcuts-updated', handler2));
}
function initConnectionLines() {
  const el14 = document.getElementById('btnConnectionLinesOn'),
    el15 = document.getElementById('btnConnectionLinesOff'),
    el16 = document.getElementById('connectionLinesShortcutLabel');
  if (!el14 || !el15) return;
  const run2 = (value4) => {
      const enabled3 = value4 !== false;
      (el14.classList.toggle('active', enabled3), el15.classList.toggle('active', !enabled3));
    },
    handler5 = (value5) => {
      const visible = value5 !== false;
      (appStore.setConnectionLinesVisible(visible),
        run2(visible),
        window.dispatchEvent(
          new CustomEvent('v2-connection-lines-visibility-changed', { detail: { visible: visible } }),
        ));
    },
    handler6 = () => {
      if (!el16) return;
      el16.textContent = getShortcutLabelByAction('toggle-connection-lines', 'B');
    };
  (handler5(appStore.getState()?.ui?.connectionLinesVisible !== false),
    handler6(),
    el14.addEventListener('click', () => handler5(true)),
    el15.addEventListener('click', () => handler5(false)),
    window.addEventListener('shortcuts-updated', handler6),
    window.addEventListener('v2-connection-lines-visibility-changed', (value6) => {
      run2(value6?.detail?.visible !== false);
    }));
}
function ensureSnapGuideOverlay() {
  let el17 = document.getElementById('v2-snap-guide-overlay');
  (!el17 &&
    ((el17 = document.createElement('div')),
    (el17.id = 'v2-snap-guide-overlay'),
    (el17.className = 'v2-snap-guide-overlay'),
    document.body.appendChild(el17)),
    (window._showSnapGuideLines = (list3) => {
      if (!el17) return;
      el17.replaceChildren();
      if (!Array.isArray(list3) || list3.length === 0) return;
      const el18 = document.createDocumentFragment();
      (list3.forEach((enabled4) => {
        if (!enabled4 || (enabled4.type !== 'v' && enabled4.type !== 'h')) return;
        const el19 = document.createElement('div');
        el19.className =
          enabled4.type === 'v' ? 'v2-snap-guide-line is-vertical' : 'v2-snap-guide-line is-horizontal';
        if (enabled4.type === 'v') {
          const value7 = Number.isFinite(enabled4.start) ? enabled4.start : 0,
            value8 = Number.isFinite(enabled4.end) ? enabled4.end : value7,
            value9 = Math.min(value7, value8),
            value10 = Math.max(1, Math.abs(value8 - value7));
          ((el19.style.left = (Number(enabled4.pos) || 0) + 'px'),
            (el19.style.top = value9 + 'px'),
            (el19.style.height = value10 + 'px'));
        } else {
          const value11 = Number.isFinite(enabled4.start) ? enabled4.start : 0,
            value12 = Number.isFinite(enabled4.end) ? enabled4.end : value11,
            value13 = Math.min(value11, value12),
            value14 = Math.max(1, Math.abs(value12 - value11));
          ((el19.style.top = (Number(enabled4.pos) || 0) + 'px'),
            (el19.style.left = value13 + 'px'),
            (el19.style.width = value14 + 'px'));
        }
        el18.appendChild(el19);
      }),
        el17.appendChild(el18));
    }),
    (window._clearSnapGuideLines = () => {
      el17?.replaceChildren();
    }));
}
function initSnapGuides() {
  const el20 = document.getElementById('btnSnapGuidesOn'),
    el21 = document.getElementById('btnSnapGuidesOff'),
    el22 = document.getElementById('snapGuidesShortcutLabel');
  if (!el20 || !el21) return;
  ensureSnapGuideOverlay();
  const run3 = () => {
      const value15 = localStorage.getItem('v2-snap-guides');
      if (value15 == null) return true;
      return value15 === '1' || value15 === 'true';
    },
    handler7 = (value16) => {
      const enabled5 = value16 !== false;
      (el20.classList.toggle('active', enabled5), el21.classList.toggle('active', !enabled5));
    },
    handler8 = (value17) => {
      const enabled6 = value17 !== false;
      (appStore.setSnapGuidesEnabled(enabled6), (window.v2SnapGuides = enabled6), handler7(enabled6));
      if (!enabled6) window._clearSnapGuideLines?.();
      window.dispatchEvent(new CustomEvent('v2-snap-guides-changed', { detail: { enabled: enabled6 } }));
    },
    handler9 = () => {
      if (!el22) return;
      el22.textContent = getShortcutLabelByAction('snap-guides', '；');
    },
    value18 = appStore.getState()?.ui?.snapGuidesEnabled,
    value19 = typeof value18 === 'boolean' ? value18 : run3();
  (handler8(value19),
    handler9(),
    el20.addEventListener('click', () => handler8(true)),
    el21.addEventListener('click', () => handler8(false)),
    window.addEventListener('shortcuts-updated', handler9),
    window.addEventListener('v2-snap-guides-changed', (value20) => {
      handler7(value20?.detail?.enabled !== false);
    }));
}
function initSnapGrid() {
  const el23 = document.getElementById('btnSnapGridOn'),
    el24 = document.getElementById('btnSnapGridOff'),
    el25 = document.getElementById('snapGridShortcutLabel');
  if (!el23 || !el24) return;
  const run4 = () => {
      if (!el25) return;
      el25.textContent = getShortcutLabelByAction('snap-grid', 'L');
    },
    snapGridEnabled = readSnapGridEnabled();
  (applySnapGridEnabled(snapGridEnabled, { emitEvent: false }),
    run4(),
    el23.addEventListener('click', () => applySnapGridEnabled(true)),
    el24.addEventListener('click', () => applySnapGridEnabled(false)),
    window.addEventListener('shortcuts-updated', run4),
    subscribeSnapGridChanges((value21) => {
      (el23.classList.toggle('active', value21 === true), el24.classList.toggle('active', value21 !== true));
    }));
}
export function initCanvasAlignmentSettings() {
  (initSelectionRelatedHighlight(),
    initConnectionLines(),
    initSnapGuides(),
    initSnapGrid(),
    initAlignFeature());
}
