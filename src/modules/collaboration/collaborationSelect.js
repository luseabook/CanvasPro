import { MATERIAL_TREE_CHEVRON_ICON_SVG } from '../../components/sharedIconMarkup.js';
export function createCollaborationSelect(el, value) {
  ((el['hidden'] = !![]), el['removeAttribute']('aria-label'));
  const el2 = document['createElement']('div');
  el2['className'] = 'collaboration-select';
  const trigger = document['createElement']('button');
  ((trigger['type'] = 'button'),
    (trigger['className'] = 'collaboration-button collaboration-select-trigger'),
    trigger['setAttribute']('aria-label', value),
    trigger['setAttribute']('aria-haspopup', 'listbox'));
  const el3 = document['createElement']('span'),
    el4 = document['createElement']('span');
  ((el4['innerHTML'] = MATERIAL_TREE_CHEVRON_ICON_SVG), trigger['append'](el3, el4));
  const el5 = document['createElement']('div');
  ((el5['className'] = 'collaboration-select-menu'),
    el5['setAttribute']('popover', 'manual'),
    el5['setAttribute']('role', 'listbox'),
    el5['setAttribute']('aria-label', value),
    (el5['id'] = 'collaboration-select-' + crypto['randomUUID']()),
    trigger['setAttribute']('aria-controls', el5['id']),
    el['before'](el2),
    el2['append'](el, trigger, el5));
  let enabled = ![],
    requestAnimationFrame2 = 0,
    item = '';
  function close(enabled2 = ![]) {
    if (!enabled) return;
    ((enabled = ![]),
      cancelAnimationFrame(requestAnimationFrame2),
      el5['hidePopover'](),
      trigger['setAttribute']('aria-expanded', 'false'),
      document['removeEventListener']('pointerdown', run, !![]));
    if (enabled2 && trigger['isConnected']) trigger['focus']();
  }
  function run(event) {
    if (!el2['contains'](event['target'])) close();
  }
  function run2() {
    if (!enabled) return;
    if (!trigger['isConnected'] || !trigger['checkVisibility']()) {
      close();
      return;
    }
    const box = trigger['getBoundingClientRect'](),
      key = Math['min'](Math['max'](box['width'], 130), innerWidth - 24);
    ((el5['style']['width'] = key + 'px'),
      (el5['style']['left'] =
        Math['max'](12, Math['min'](box['right'] - key, innerWidth - key - 12)) + 'px'));
    const count = innerHeight - box['bottom'] - 16,
      index = box['top'] - 16,
      result = count < 120 && index > count;
    ((el5['style']['maxHeight'] = Math['max'](40, Math['min'](280, result ? index : count)) + 'px'),
      (el5['style']['top'] = result ? 'auto' : box['bottom'] + 4 + 'px'),
      (el5['style']['bottom'] = result ? innerHeight - box['top'] + 4 + 'px' : 'auto'),
      (requestAnimationFrame2 = requestAnimationFrame(run2)));
  }
  function sync() {
    ((trigger['disabled'] = el['disabled']),
      (el3['textContent'] = el['selectedOptions'][0]?.['textContent'] || '请选择'));
    const data = JSON['stringify'](
      [...el['options']]['map']((el6) => [el6['value'], el6['textContent'], el6['disabled'], el6['hidden']]),
    );
    if (data !== item) {
      ((item = data), el5['replaceChildren']());
      for (const el7 of el['options']) {
        if (el7['hidden']) continue;
        const el8 = document['createElement']('button');
        ((el8['type'] = 'button'),
          (el8['className'] = 'collaboration-select-option'),
          el8['setAttribute']('role', 'option'),
          (el8['textContent'] = el7['textContent']),
          (el8['dataset']['value'] = el7['value']),
          (el8['disabled'] = el7['disabled']),
          el8['addEventListener']('click', () => {
            ((el['value'] = el7['value']),
              sync(),
              close(!![]),
              el['dispatchEvent'](new Event('change', { bubbles: !![] })));
          }),
          el5['append'](el8));
      }
    }
    for (const el9 of el5['children']) {
      const options = el9['dataset']['value'] === el['value'];
      (el9['setAttribute']('aria-selected', String(options)), (el9['tabIndex'] = options ? 0 : -1));
    }
  }
  function open() {
    if (trigger['disabled']) return;
    (sync(),
      (enabled = !![]),
      el5['showPopover'](),
      trigger['setAttribute']('aria-expanded', 'true'),
      run2(),
      document['addEventListener']('pointerdown', run, !![]),
      (el5['querySelector']('[aria-selected="true"]') || el5['firstElementChild'])?.['focus']());
  }
  return (
    trigger['addEventListener']('click', () => (enabled ? close(!![]) : open())),
    trigger['addEventListener']('keydown', (event2) => {
      ['ArrowDown', 'ArrowUp']['includes'](event2['key']) && (event2['preventDefault'](), open());
    }),
    el5['addEventListener']('keydown', (event3) => {
      event3['key'] === 'Escape' && (event3['preventDefault'](), event3['stopPropagation'](), close(!![]));
      if (event3['key'] === 'Tab') close();
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End']['includes'](event3['key'])) return;
      event3['preventDefault']();
      const list = [...el5['children']]['filter']((el10) => !el10['disabled']),
        target = list['indexOf'](document['activeElement']),
        source =
          event3['key'] === 'Home'
            ? 0
            : event3['key'] === 'End'
              ? list['length'] - 1
              : (target + (event3['key'] === 'ArrowDown' ? 1 : -1) + list['length']) % list['length'];
      list[source]?.['focus']();
    }),
    trigger['setAttribute']('aria-expanded', 'false'),
    sync(),
    {
      sync: sync,
      open: open,
      close: close,
      trigger: trigger,
      destroy() {
        (close(), el2['remove']());
      },
    }
  );
}
