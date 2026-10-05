import { RH_AI_APP_PERSISTENT_ADVANCED_CLASS } from './rhAiAppNodeBehavior.js';
function isPersistentAdvancedPanel(el) {
  return el?.['classList']?.['contains']?.(RH_AI_APP_PERSISTENT_ADVANCED_CLASS);
}
function hidePopup(el2) {
  if (!el2) return;
  if (el2['classList']?.['contains']('floating-menu')) {
    el2['classList']['remove']('show');
    return;
  }
  if (el2['classList']?.['contains']('rh-adv-panel') || el2['classList']?.['contains']('rh-vram-adv-panel')) {
    if (isPersistentAdvancedPanel(el2)) {
      (el2['classList']['add']('show'), (el2['style']['display'] = ''));
      return;
    }
    (el2['classList']['remove']('show'), (el2['style']['display'] = ''));
    return;
  }
  el2['style']['display'] = 'none';
}
function showPopup(el3, value = 'block') {
  if (!el3) return;
  if (el3['classList']?.['contains']('floating-menu')) {
    el3['classList']['add']('show');
    return;
  }
  el3['style']['display'] = value;
}
function syncAdvancedButtonState(el4, item, key) {
  el4['querySelectorAll'](item)['forEach']((el5) => {
    const el6 =
        el5['closest']?.('.prompt-panel-footer, .aigen-image-model-selector, .aigen-video-model-selector') ||
        el4,
      el7 = el6['querySelector']?.(key) || el4['querySelector']?.(key);
    el5['setAttribute']?.('aria-expanded', String(el7?.['classList']?.['contains']?.('show') === true));
  });
}
export function syncNodeFooterAdvancedButtonState(enabled) {
  if (!enabled) return;
  (syncAdvancedButtonState(enabled, '.rh-adv-btn', '.rh-adv-panel'),
    syncAdvancedButtonState(enabled, '.rh-adv2-btn', '.rh-vram-adv-panel'));
}
export function positionNodeAdvancedPanel(el8) {
  if (!el8?.['classList']?.['contains']('show') || isPersistentAdvancedPanel(el8)) return;
  const el9 = el8['offsetParent'];
  if (!el9?.['getBoundingClientRect']) return;
  ((el8['style']['top'] = ''), (el8['style']['bottom'] = ''), (el8['style']['maxHeight'] = ''));
  const box = el9['getBoundingClientRect'](),
    box2 = el8['getBoundingClientRect'](),
    index = box['height'] / el9['offsetHeight'] || 1,
    result = Math['max'](0, window['innerHeight'] - box['bottom'] - 16),
    data = Math['max'](0, box['top'] - 16),
    options = box2['bottom'] > window['innerHeight'] - 12 && data > result;
  options && ((el8['style']['top'] = 'auto'), (el8['style']['bottom'] = 'calc(100% + 8px)'));
  const target = parseFloat(getComputedStyle(el8)['maxHeight']) || Infinity;
  el8['style']['maxHeight'] = Math['max'](0, Math['min'](target, (options ? data : result) / index)) + 'px';
}
export function closeNodeFooterMenus(el10, source = null, next = {}) {
  if (!el10) return;
  const current = next?.['preserveAdvPanel'] || null;
  (el10['querySelectorAll'](
    '.node-model-menu, .img-model-menu, .floating-menu.show, .ui-schema-floating-menu.show',
  )['forEach']((el11) => {
    if (el11 !== source) el11['classList']['remove']('show');
  }),
    el10['querySelectorAll'](
      '.node-menu-submenu, .node-model-submenu, .ui-schema-popup, .img-ratio-popup, .rh-res-popup, .vid-duration-pop',
    )['forEach']((entry) => {
      if (entry !== source) hidePopup(entry);
    }),
    el10['querySelectorAll']('.rh-adv-panel, .rh-vram-adv-panel')['forEach']((record) => {
      if (record === source) return;
      if (current && record['contains'](current)) return;
      hidePopup(record);
    }),
    syncNodeFooterAdvancedButtonState(el10));
}
export function positionNodeSubmenu(el12, el13) {
  if (!el12 || !el13) return;
  (showPopup(el13, 'flex'),
    (el13['style']['top'] = '0px'),
    (el13['style']['maxHeight'] = ''),
    (el13['style']['overflowY'] = ''));
  const el14 = el12['closest']('.node-model-menu, .img-model-menu');
  if (!el14) return;
  const payload = el12['offsetTop'] || 0,
    handle =
      Number(globalThis['window']?.['innerHeight']) ||
      Number(globalThis['document']?.['documentElement']?.['clientHeight']) ||
      0,
    state = 12,
    count =
      el13['offsetHeight'] || el13['getBoundingClientRect']?.()['height'] || el13['scrollHeight'] || 0,
    box3 = el14['getBoundingClientRect']?.() || { top: 0 },
    box4 = el12['getBoundingClientRect']?.() || null,
    config = el14['clientHeight'] || box3['height'] || el13['parentElement']?.['clientHeight'] || 0,
    count2 = handle > state * 2 && count > 0 ? Math['min'](count, handle - state * 2) : count,
    scope = el13['dataset']?.['nodeSubmenuPlacement'];
  if (scope === 'viewport-left' || scope === 'viewport-auto' || scope === 'viewport-auto-up') {
    const input = el13['offsetWidth'] || el13['getBoundingClientRect']?.()['width'] || box3['width'] || 240,
      output =
        Number(globalThis['window']?.['innerWidth']) ||
        Number(globalThis['document']?.['documentElement']?.['clientWidth']) ||
        0,
      value2 = Math['max'](state, handle - state - count2),
      value3 = Number(box3['top']) || 0,
      value4 = Number(box3['bottom']) || value3 + config,
      value5 = scope === 'viewport-auto-up' ? value4 - count2 : Number(box4?.['top']) || value3 + payload,
      value6 = Math['min'](Math['max'](value5, state), value2),
      value7 = Math['max'](state, output - state - input),
      value8 = Number(box3['left']) || 0,
      value9 = Number(box3['width']) || 0,
      value10 = Number(box3['right']) || value8 + value9,
      value11 =
        Number['parseFloat'](globalThis['window']?.['getComputedStyle']?.(el14)?.['borderRightWidth']) || 0,
      value12 = value8 - input - 6,
      value13 = value10 - value11 + 6;
    let value14 = value12;
    if (scope === 'viewport-auto' || scope === 'viewport-auto-up') {
      const value15 = value13 + input <= output - state,
        enabled2 = value12 >= state;
      if (value15 || !enabled2) value14 = value13;
    }
    ((value14 = Math['max'](state, Math['min'](value14, value7))),
      (el13['style']['position'] = 'fixed'),
      (el13['style']['right'] = 'auto'),
      (el13['style']['left'] = value14 + 'px'),
      (el13['style']['top'] = value6 + 'px'));
    count > count2 &&
      ((el13['style']['maxHeight'] = Math['floor'](count2) + 'px'), (el13['style']['overflowY'] = 'auto'));
    return;
  }
  const value16 = Math['max'](0, config - count2);
  let value17 = Math['min'](payload, value16);
  if (handle > state * 2 && count2 > 0) {
    const value18 = handle - state - count2,
      value19 = Math['min'](Math['max'](box3['top'] + value17, state), value18);
    ((value17 = value19 - box3['top']),
      count > count2 &&
        ((el13['style']['maxHeight'] = Math['floor'](count2) + 'px'), (el13['style']['overflowY'] = 'auto')));
  }
  el13['style']['top'] = Math['round'](value17) + 'px';
}
export function createFloatingModelMenuPortal({
  menu: menu,
  trigger: trigger,
  host: host,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  portalClass: portalClass = 'floating-model-menu-portal',
  submenuPlacement: submenuPlacement = 'viewport-auto',
} = {}) {
  if (!menu || !trigger || !host?.['appendChild'])
    return {
      isOpen: () => menu?.['classList']?.['contains']?.('show') === true,
      open() {
        (menu?.['classList']?.['add']?.('show'), trigger?.['setAttribute']?.('aria-expanded', 'true'));
      },
      close() {
        (menu?.['classList']?.['remove']?.('show'), trigger?.['setAttribute']?.('aria-expanded', 'false'));
      },
      contains: (value20) => menu?.['contains']?.(value20) === true,
      destroy() {},
    };
  const list = [
      'position',
      'left',
      'top',
      'right',
      'bottom',
      'animation',
      'transform',
      'max-height',
      'overflow-x',
      'overflow-y',
      'overscroll-behavior',
    ],
    list2 = ['max-height', 'overflow-x', 'overflow-y', 'overscroll-behavior'],
    map = new Map(list['map']((value21) => [value21, menu['style']?.['getPropertyValue']?.(value21) || ''])),
    map2 = new Map();
  let el15 = null,
    el16 = null,
    enabled3 = false;
  const value22 = (value23) => {
      const value24 = map['get'](value23);
      if (value24) menu['style']?.['setProperty']?.(value23, value24);
      else menu['style']?.['removeProperty']?.(value23);
    },
    handler = () => {
      list2['forEach'](value22);
    },
    handler2 = () => {
      menu['querySelectorAll']?.('.node-model-submenu')['forEach']((el17) => {
        (!map2['has'](el17) && map2['set'](el17, el17['dataset']?.['nodeSubmenuPlacement']),
          el17['dataset'] && (el17['dataset']['nodeSubmenuPlacement'] = submenuPlacement));
      });
    },
    handler3 = () => {
      (map2['forEach']((value25, el18) => {
        if (!el18?.['dataset']) return;
        if (value25 === undefined) delete el18['dataset']['nodeSubmenuPlacement'];
        else el18['dataset']['nodeSubmenuPlacement'] = value25;
        ['position', 'left', 'top', 'right', 'max-height', 'overflow-y']['forEach']((value26) =>
          el18['style']?.['removeProperty']?.(value26),
        );
      }),
        map2['clear']());
    },
    handler4 = () => {
      if (!enabled3 || !menu['classList']['contains']('show')) return;
      handler();
      const box5 = trigger['getBoundingClientRect']?.(),
        box6 = menu['getBoundingClientRect']?.();
      if (!box5 || !box6) return;
      const right2 =
          Number(windowObject?.['innerWidth']) ||
          Number(documentObject?.['documentElement']?.['clientWidth']) ||
          0,
        bottom2 =
          Number(windowObject?.['innerHeight']) ||
          Number(documentObject?.['documentElement']?.['clientHeight']) ||
          0,
        box7 = host['getBoundingClientRect']?.() || {
          top: 0,
          left: 0,
          right: right2,
          bottom: bottom2,
        },
        value27 = 12,
        value28 = 12,
        value29 = Math['max'](value27, (Number(box7['left']) || 0) + value27),
        value30 = Math['max'](value27, (Number(box7['top']) || 0) + value27),
        value31 = Math['min'](right2 - value27, Number(box7['right']) || right2 - value27),
        value32 = Math['min'](bottom2 - value27, Number(box7['bottom']) || bottom2 - value27),
        value33 = Math['max'](0, value32 - value30),
        value34 = Math['min'](box6['height'], value33);
      box6['height'] > value33 &&
        (menu['style']?.['setProperty']?.('max-height', Math['floor'](value33) + 'px'),
        menu['style']?.['setProperty']?.('overflow-x', 'hidden'),
        menu['style']?.['setProperty']?.('overflow-y', 'auto'),
        menu['style']?.['setProperty']?.('overscroll-behavior', 'contain'));
      const value35 = Math['max'](value29, value31 - box6['width']),
        value36 = Math['max'](value30, value32 - value34),
        value37 = Math['min'](Math['max'](box5['left'], value29), value35),
        value38 = box5['top'] - value28 - value34,
        value39 = box5['bottom'] + value28,
        value40 =
          value38 >= value30
            ? Math['min'](value38, value36)
            : Math['min'](Math['max'](value39, value30), value36);
      (menu['style']?.['setProperty']?.('position', 'fixed'),
        menu['style']?.['setProperty']?.('left', value37 + 'px'),
        menu['style']?.['setProperty']?.('top', value40 + 'px'),
        menu['style']?.['setProperty']?.('right', 'auto'),
        menu['style']?.['setProperty']?.('bottom', 'auto'));
    },
    handler5 = () => {
      if (!enabled3) return;
      handler3();
      if (portalClass) menu['classList']['remove'](portalClass);
      list['forEach'](value22);
      if (el15?.['isConnected']) {
        const value41 = el16?.['parentNode'] === el15 ? el16 : null;
        el15['insertBefore'](menu, value41);
      }
      ((el15 = null), (el16 = null), (enabled3 = false));
    },
    close2 = () => {
      (closeNodeFooterMenus(menu),
        menu['classList']['remove']('show'),
        trigger['setAttribute']?.('aria-expanded', 'false'),
        handler5());
    },
    open2 = () => {
      if (!enabled3) {
        ((el15 = menu['parentNode']), (el16 = menu['nextSibling']), host['appendChild'](menu));
        if (portalClass) menu['classList']['add'](portalClass);
        enabled3 = true;
      }
      (menu['style']?.['setProperty']?.('animation', 'none'),
        menu['style']?.['setProperty']?.('transform', 'none'),
        handler2(),
        menu['classList']['add']('show'),
        trigger['setAttribute']?.('aria-expanded', 'true'),
        handler4());
    };
  return (
    documentObject?.['addEventListener']?.('scroll', handler4, true),
    windowObject?.['addEventListener']?.('resize', handler4),
    {
      isOpen: () => menu['classList']['contains']('show'),
      open: open2,
      close: close2,
      contains: (value42) => menu['contains']?.(value42) === true,
      destroy() {
        (close2(),
          documentObject?.['removeEventListener']?.('scroll', handler4, true),
          windowObject?.['removeEventListener']?.('resize', handler4));
      },
    }
  );
}
export function createFloatingUiSchemaPopupPortal({
  selector: selector,
  host: host2,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  placement: placement = 'inline',
  portalClass: portalClass = 'aigen-ui-schema-popup-portal',
  horizontalAlign: horizontalAlign = 'center',
  contextClass: contextClass = '',
} = {}) {
  if (!selector || placement !== 'portal-auto-up' || !host2?.['appendChild'])
    return { close() {}, contains: () => false, destroy() {} };
  const list3 = [
      'animation',
      'transition',
      'position',
      'left',
      'top',
      'right',
      'bottom',
      'transform',
      'min-width',
      'max-height',
      'overflow-x',
      'overflow-y',
    ],
    list4 = ['click', 'mousedown', 'input', 'change'],
    value43 = 12,
    value44 = 8;
  let fieldEl = null,
    enabled4 = 0;
  const run = () => {
      if (!enabled4) return;
      (windowObject?.['cancelAnimationFrame']?.(enabled4), (enabled4 = 0));
    },
    handler6 = () => {
      const right3 =
          Number(windowObject?.['innerWidth']) ||
          Number(documentObject?.['documentElement']?.['clientWidth']) ||
          0,
        bottom3 =
          Number(windowObject?.['innerHeight']) ||
          Number(documentObject?.['documentElement']?.['clientHeight']) ||
          0,
        box8 = host2['getBoundingClientRect']?.() || {
          top: 0,
          left: 0,
          right: right3,
          bottom: bottom3,
        };
      return {
        left: Math['max'](value43, (Number(box8['left']) || 0) + value43),
        top: Math['max'](value43, (Number(box8['top']) || 0) + value43),
        right: Math['min'](right3 - value43, Number(box8['right']) || right3 - value43),
        bottom: Math['min'](bottom3 - value43, Number(box8['bottom']) || bottom3 - value43),
      };
    },
    handler7 = () => {
      enabled4 = 0;
      const el19 = fieldEl?.['popup'],
        el20 = fieldEl?.['trigger'] || fieldEl?.['fieldEl'];
      if (!el19?.['isConnected'] || !el20?.['isConnected']) return;
      const box9 = el20['getBoundingClientRect']?.();
      if (!box9) return;
      const box10 = handler6(),
        count3 =
          Number(box9['width']) ||
          Math['max'](0, (Number(box9['right']) || 0) - (Number(box9['left']) || 0));
      if (fieldEl?.['preservesAnchorWidth'] && count3 > 0) {
        const value45 = Math['max'](0, box10['right'] - box10['left']),
          count4 = Math['min'](Math['ceil'](count3), Math['floor'](value45));
        count4 > 0 && el19['style']?.['setProperty']?.('min-width', count4 + 'px');
      }
      const box11 = el19['getBoundingClientRect']?.();
      if (!box11 || box11['width'] <= 0) return;
      const value46 = Math['max'](80, box10['bottom'] - box10['top']),
        value47 = Math['min'](box11['height'] || el19['scrollHeight'] || value46, value46),
        value48 = fieldEl?.['ownerProxy']?.['classList']?.['contains']?.('ui-schema-pill-menu')
          ? 12
          : value44,
        value49 = Math['max'](box10['left'], box10['right'] - box11['width']),
        value50 =
          horizontalAlign === 'start'
            ? box9['left']
            : horizontalAlign === 'end'
              ? box9['right'] - box11['width']
              : box9['left'] + (count3 - box11['width']) / 2,
        value51 = Math['min'](Math['max'](value50, box10['left']), value49),
        value52 = Math['max'](box10['top'], box10['bottom'] - value47),
        value53 = box9['top'] - value48 - value47,
        value54 = box9['bottom'] + value48,
        value55 =
          value53 >= box10['top']
            ? Math['min'](value53, value52)
            : Math['min'](Math['max'](value54, box10['top']), value52);
      (el19['style']?.['setProperty']?.('position', 'fixed'),
        el19['style']?.['setProperty']?.('left', value51 + 'px'),
        el19['style']?.['setProperty']?.('top', value55 + 'px'),
        el19['style']?.['setProperty']?.('right', 'auto'),
        el19['style']?.['setProperty']?.('bottom', 'auto'),
        el19['style']?.['setProperty']?.('transform', 'none'),
        el19['style']?.['setProperty']?.('max-height', Math['floor'](value46) + 'px'),
        el19['style']?.['setProperty']?.('overflow-x', 'hidden'),
        el19['style']?.['setProperty']?.('overflow-y', 'auto'));
    },
    handler8 = () => {
      if (!fieldEl) return;
      run();
      const run2 =
        windowObject?.['requestAnimationFrame']?.['bind']?.(windowObject) ||
        ((value56) => windowObject?.['setTimeout']?.(value56, 0));
      enabled4 = run2(handler7);
    },
    value57 = (nativeEvent) => {
      const run3 = windowObject?.['CustomEvent'] || globalThis['CustomEvent'];
      if (typeof run3 !== 'function' || !fieldEl) return;
      selector['dispatchEvent']?.(
        new run3('ui-schema-portaled-interaction', {
          detail: { fieldEl: fieldEl['fieldEl'], nativeEvent: nativeEvent, popup: fieldEl['popup'] },
        }),
      );
    },
    value58 = (event) => event['stopPropagation'](),
    handler9 = () => {
      run();
      if (!fieldEl) return;
      const {
        popup: popup,
        fieldEl: fieldEl2,
        originalParent: originalParent,
        originalNextSibling: originalNextSibling,
        originalStyles: originalStyles,
        ownerProxy: ownerProxy,
      } = fieldEl;
      (list4['forEach']((value59) => {
        popup['removeEventListener']?.(value59, value57, true);
      }),
        popup['removeEventListener']?.('wheel', value58),
        popup['classList']?.['remove']?.(portalClass));
      popup['__uiSchemaPortalRoot'] === selector && delete popup['__uiSchemaPortalRoot'];
      fieldEl2?.['__uiSchemaPortaledPopup'] === popup && delete fieldEl2['__uiSchemaPortaledPopup'];
      originalStyles['forEach']((value60, value61) => {
        if (value60) popup['style']?.['setProperty']?.(value61, value60);
        else popup['style']?.['removeProperty']?.(value61);
      });
      if (originalParent?.['isConnected']) {
        const value62 = originalNextSibling?.['parentNode'] === originalParent ? originalNextSibling : null;
        originalParent['insertBefore'](popup, value62);
      }
      (ownerProxy?.['remove']?.(), (fieldEl = null));
    },
    close3 = () => {
      const el21 = fieldEl?.['popup'],
        el22 = fieldEl?.['trigger'];
      (el21 &&
        (el21['classList']?.['remove']?.('show', 'is-closing'),
        el21['setAttribute']?.('aria-hidden', 'true'),
        el21['classList']?.['contains']?.('floating-menu')
          ? el21['style']?.['setProperty']?.('display', '')
          : el21['style']?.['setProperty']?.('display', 'none')),
        el22?.['setAttribute']?.('aria-expanded', 'false'),
        handler9());
    },
    handler10 = ({ popup: popup2, fieldEl: fieldEl3 }) => {
      const trigger2 = fieldEl3?.['querySelector']?.('[data-ui-schema-menu-trigger]') || fieldEl3,
        el23 = popup2['parentElement'] || fieldEl3,
        list5 = String(el23?.['className'] || '')['split'](/\s+/u),
        preservesAnchorWidth =
          el23?.['classList']?.['contains']?.('ui-schema-advanced-dropdown') ||
          list5['includes']('ui-schema-advanced-dropdown'),
        originalStyles2 = new Map(
          list3['map']((value63) => [value63, popup2['style']?.['getPropertyValue']?.(value63) || '']),
        ),
        ownerProxy2 = documentObject?.['createElement']?.('div') || null;
      (ownerProxy2 &&
        (ownerProxy2['className'] = [
          String(el23?.['className'] || '')['trim'](),
          String(fieldEl3?.['className'] || '')['trim'](),
          'aigen-ui-schema-owner-proxy',
          contextClass,
        ]
          ['filter'](Boolean)
          ['join'](' ')),
        (fieldEl = {
          popup: popup2,
          fieldEl: fieldEl3,
          trigger: trigger2,
          originalParent: popup2['parentNode'],
          originalNextSibling: popup2['nextSibling'],
          originalStyles: originalStyles2,
          ownerProxy: ownerProxy2,
          preservesAnchorWidth: preservesAnchorWidth,
        }),
        (fieldEl3['__uiSchemaPortaledPopup'] = popup2),
        (popup2['__uiSchemaPortalRoot'] = selector),
        trigger2?.['setAttribute']?.('aria-expanded', 'true'),
        host2['appendChild'](ownerProxy2 || popup2),
        ownerProxy2?.['appendChild']?.(popup2),
        popup2['classList']?.['add']?.(portalClass),
        popup2['style']?.['setProperty']?.('animation', 'none'),
        popup2['style']?.['setProperty']?.('transition', 'none'),
        popup2['style']?.['setProperty']?.('transform', 'none'),
        list4['forEach']((value64) => {
          popup2['addEventListener']?.(value64, value57, true);
        }),
        popup2['addEventListener']?.('wheel', value58, { passive: true }),
        handler8());
    },
    value65 = (enabled5) => {
      const popup3 = enabled5?.['detail']?.['popup'] || null,
        fieldEl4 = enabled5?.['detail']?.['fieldEl'] || null;
      if (!popup3 || !fieldEl4) return;
      const enabled6 = selector['contains']?.(fieldEl4) || popup3['__uiSchemaPortalRoot'] === selector;
      if (!enabled6) return;
      if (!enabled5['detail']?.['shouldOpen']) {
        if (popup3 === fieldEl?.['popup']) close3();
        return;
      }
      if (fieldEl?.['popup'] !== popup3) close3();
      if (!fieldEl) handler10({ popup: popup3, fieldEl: fieldEl4 });
      handler8();
    },
    value66 = (value67) => {
      if (!fieldEl || value67?.['detail']?.['popup'] !== fieldEl['popup']) return;
      (run(), handler7());
    },
    value68 = (enabled7) => {
      (!enabled7?.['detail']?.['popup'] || enabled7['detail']['popup'] === fieldEl?.['popup']) && close3();
    };
  return (
    selector['addEventListener']?.('ui-schema-menu-before-open', value65),
    selector['addEventListener']?.('ui-schema-menu-after-open', value66),
    selector['addEventListener']?.('ui-schema-portaled-close-request', value68),
    documentObject?.['addEventListener']?.('scroll', handler8, true),
    windowObject?.['addEventListener']?.('resize', handler8),
    {
      close: close3,
      contains: (value69) => fieldEl?.['popup']?.['contains']?.(value69) === true,
      destroy() {
        (close3(),
          selector['removeEventListener']?.('ui-schema-menu-before-open', value65),
          selector['removeEventListener']?.('ui-schema-menu-after-open', value66),
          selector['removeEventListener']?.('ui-schema-portaled-close-request', value68),
          documentObject?.['removeEventListener']?.('scroll', handler8, true),
          windowObject?.['removeEventListener']?.('resize', handler8));
      },
    }
  );
}
export function bindNodeModelMenuTrigger({
  root: root,
  trigger: trigger3,
  menu: menu2,
  closeOthers: closeOthers,
  activateMenuKeyboard: activateMenuKeyboard,
} = {}) {
  if (!root || !trigger3 || !menu2) return () => {};
  const value70 = (event2) => {
    event2['stopPropagation']();
    const value71 = !menu2['classList']['contains']('show');
    if (typeof closeOthers === 'function') closeOthers(menu2);
    else closeNodeFooterMenus(root, menu2);
    (menu2['classList']['toggle']('show', value71),
      value71 && typeof activateMenuKeyboard === 'function' && activateMenuKeyboard(menu2));
  };
  return (
    trigger3['addEventListener']('click', value70),
    () => trigger3['removeEventListener']('click', value70)
  );
}
export function bindNodeModelMenuPrewarm({
  trigger: trigger4,
  prepare: prepare,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const prepareNow = () => null;
  if (!trigger4?.['addEventListener'] || typeof prepare !== 'function')
    return { prepareNow: prepareNow, schedule: prepareNow, destroy: prepareNow };
  let value72 = false,
    value73 = null,
    value74 = null;
  const run4 = windowObject?.['requestIdleCallback']?.['bind'](windowObject),
    value75 = windowObject?.['cancelIdleCallback']?.['bind'](windowObject),
    value76 = windowObject?.['setTimeout']?.['bind'](windowObject) || globalThis['setTimeout'],
    value77 = windowObject?.['clearTimeout']?.['bind'](windowObject) || globalThis['clearTimeout'],
    handler11 = () => {
      (value73 !== null && (value75?.(value73), (value73 = null)),
        value74 !== null && (value77?.(value74), (value74 = null)));
    },
    value78 = () => {
      ((value73 = null), (value74 = null));
      if (value72 || trigger4['isConnected'] === false) return null;
      return prepare();
    },
    schedule = () => {
      if (value72 || value73 !== null || value74 !== null) return null;
      return (
        run4 ? (value73 = run4(value78, { timeout: 100 })) : (value74 = value76?.(value78, 0) ?? null),
        null
      );
    },
    prepareNow2 = () => {
      if (value72) return null;
      return (handler11(), prepare());
    };
  return (
    trigger4['addEventListener']('pointerenter', schedule),
    trigger4['addEventListener']('focus', schedule),
    trigger4['addEventListener']('pointerdown', prepareNow2),
    {
      prepareNow: prepareNow2,
      schedule: schedule,
      destroy() {
        if (value72) return;
        ((value72 = true),
          handler11(),
          trigger4['removeEventListener']?.('pointerenter', schedule),
          trigger4['removeEventListener']?.('focus', schedule),
          trigger4['removeEventListener']?.('pointerdown', prepareNow2));
      },
    }
  );
}
export function bindNodeSubmenus(el24, { delay: delay = 120 } = {}) {
  if (!el24) return () => {};
  const list6 = [],
    map3 = new Map(),
    list7 = el24['querySelectorAll']('[data-node-menu-submenu]');
  return (
    list7['forEach']((el25) => {
      const value79 = el25['dataset']['nodeMenuSubmenu'] || '',
        el26 = value79 ? el24['querySelector'](value79) : null;
      if (!el26) return;
      const value80 = () => {
          (clearTimeout(map3['get'](el26)), positionNodeSubmenu(el25, el26));
        },
        value81 = () => {
          (clearTimeout(map3['get'](el26)),
            map3['set'](
              el26,
              setTimeout(() => {
                (hidePopup(el26), map3['delete'](el26));
              }, delay),
            ));
        };
      (el25['addEventListener']('mouseenter', value80),
        el25['addEventListener']('mouseleave', value81),
        el25['addEventListener']('click', value80),
        el26['addEventListener']('mouseenter', value80),
        el26['addEventListener']('mouseleave', value81),
        list6['push'](() => {
          (clearTimeout(map3['get'](el26)),
            el25['removeEventListener']('mouseenter', value80),
            el25['removeEventListener']('mouseleave', value81),
            el25['removeEventListener']('click', value80),
            el26['removeEventListener']('mouseenter', value80),
            el26['removeEventListener']('mouseleave', value81));
        }));
    }),
    () => list6['forEach']((handler12) => handler12())
  );
}
export function bindNodeFooterController(el27, value82 = {}) {
  if (!el27) return () => {};
  const list8 = [];
  list8['push'](bindNodeSubmenus(el27));
  const value83 = (value84) => {
    const preserveAdvPanel = value84?.['detail']?.['fieldEl'] || null;
    closeNodeFooterMenus(el27, null, { preserveAdvPanel: preserveAdvPanel });
  };
  (el27['addEventListener']('ui-schema-menu-before-open', value83),
    list8['push'](() => el27['removeEventListener']('ui-schema-menu-before-open', value83)));
  const value85 = (event3) => {
    const value86 = event3['target']?.['closest']?.('.ui-schema-floating-menu, .floating-menu');
    value86 && el27['contains'](value86) && event3['stopPropagation']();
  };
  (el27['addEventListener']('wheel', value85, { passive: true }),
    list8['push'](() => el27['removeEventListener']('wheel', value85)));
  const value87 = (event4) => {
    const isInsideRoot = el27['contains'](event4['target']);
    if (!isInsideRoot) closeNodeFooterMenus(el27);
    (typeof value82['onDocumentClick'] === 'function' &&
      value82['onDocumentClick'](event4, { isInsideRoot: isInsideRoot }),
      !isInsideRoot && typeof value82['onOutsideClose'] === 'function' && value82['onOutsideClose']());
  };
  return (
    document?.['addEventListener']?.('click', value87),
    list8['push'](() => document?.['removeEventListener']?.('click', value87)),
    () => list8['forEach']((handler13) => handler13())
  );
}
