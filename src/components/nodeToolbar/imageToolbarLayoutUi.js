import { t } from '../../i18n/index.js';
function imageToolbarText(value) {
  return t('nodeToolbar.image.' + value);
}
const IMAGE_TOOLBAR_ZONE_MAP = Object.freeze({
  'outside-primary': 'outsidePrimary',
  'outside-secondary': 'outsideSecondary',
  more: 'more',
});
function getToolbarZones(outsidePrimary) {
  return {
    outsidePrimary: outsidePrimary.querySelector('[data-zone="outside-primary"]'),
    outsideSecondary: outsidePrimary.querySelector('[data-zone="outside-secondary"]'),
    more: outsidePrimary.querySelector('[data-zone="more"]'),
  };
}
function collectToolbarActionButtons(el, handler) {
  const map = new Map();
  return (
    el.querySelectorAll('.ftb-btn').forEach((el2) => {
      if (el2.dataset.fixedToolbarButton === '1') return;
      const enabled = handler(el2);
      if (!enabled || map.has(enabled)) return;
      map.set(enabled, el2);
    }),
    map
  );
}
function applyToolbarLayoutToDom({
  toolbarEl: toolbarEl,
  layoutInput: layoutInput,
  imageToolbarActions: imageToolbarActions,
  normalizeImageToolbarLayout: normalizeImageToolbarLayout,
  getToolbarActionFromButton: getToolbarActionFromButton,
}) {
  const toolbarZones = getToolbarZones(toolbarEl);
  if (!toolbarZones.outsidePrimary || !toolbarZones.outsideSecondary || !toolbarZones.more) return;
  const item = normalizeImageToolbarLayout(layoutInput),
    map2 = collectToolbarActionButtons(toolbarEl, getToolbarActionFromButton),
    map3 = new Set();
  for (const [key, list] of Object.entries(item)) {
    const el3 = toolbarZones[key];
    if (!el3) continue;
    list.forEach((item2) => {
      const enabled2 = map2.get(item2);
      if (!enabled2) return;
      (el3.appendChild(enabled2), map3.add(item2));
    });
  }
  for (const index of imageToolbarActions) {
    if (map3.has(index)) continue;
    const enabled3 = map2.get(index);
    if (!enabled3) continue;
    toolbarZones.more.appendChild(enabled3);
  }
  const el4 = toolbarEl.querySelector('.v2-img-toolbar-main-divider');
  if (el4) {
    const enabled4 = toolbarZones.outsideSecondary.querySelectorAll('.ftb-btn').length > 0;
    el4.hidden = !enabled4;
  }
}
function readToolbarLayoutFromDom(el5, handler2, handler3, result = null) {
  const enabled5 = { outsidePrimary: [], outsideSecondary: [], more: [] },
    list2 = result && typeof result === 'object' ? Object.entries(result) : [];
  if (list2.length > 0)
    return (
      list2.forEach(([data, el6]) => {
        if (!enabled5[data] || !el6) return;
        el6.querySelectorAll('.ftb-btn').forEach((item3) => {
          const enabled6 = handler2(item3);
          if (!enabled6) return;
          enabled5[data].push(enabled6);
        });
      }),
      handler3(enabled5)
    );
  return (
    el5.querySelectorAll('[data-zone]').forEach((el7) => {
      const options = String(el7.getAttribute('data-zone') || '').trim(),
        enabled7 = IMAGE_TOOLBAR_ZONE_MAP[options];
      if (!enabled7) return;
      el7.querySelectorAll('.ftb-btn').forEach((item4) => {
        const enabled8 = handler2(item4);
        if (!enabled8) return;
        enabled5[enabled7].push(enabled8);
      });
    }),
    handler3(enabled5)
  );
}
export function bindImageToolbarLayoutUi(toolbarEl2, target = {}) {
  const {
      store: store,
      getStateSnapshot: getStateSnapshot,
      getToolbarActionFromButton: getToolbarActionFromButton2,
    } = target,
    imageToolbarActions2 = target.toolbarActions || target.imageToolbarActions || [],
    normalizeImageToolbarLayout2 = target.normalizeToolbarLayout || target.normalizeImageToolbarLayout,
    handler4 = target.serializeToolbarLayout || target.serializeImageToolbarLayout,
    layoutInput2 =
      typeof target.getToolbarLayout === 'function'
        ? target.getToolbarLayout
        : (source) => source?.ui?.imageToolbarLayout,
    handler5 =
      typeof target.setToolbarLayout === 'function'
        ? target.setToolbarLayout
        : (next) => store?.setImageToolbarLayout?.(next),
    map4 = new Set(
      Array.isArray(target.moreMenuStickyActions)
        ? target.moreMenuStickyActions
        : ['hd', 'auto-subject', 'multigrid'],
    ),
    toolbarZones2 = getToolbarZones(toolbarEl2),
    el8 = toolbarEl2.querySelector('.act-more-tools'),
    el9 = toolbarEl2.querySelector('[data-role="more-menu"]'),
    el10 = toolbarEl2.querySelector('.act-customize-tools');
  if (
    !toolbarZones2.outsidePrimary ||
    !toolbarZones2.outsideSecondary ||
    !toolbarZones2.more ||
    !el8 ||
    !el9 ||
    !el10
  )
    return { closeMoreMenu() {} };
  applyToolbarLayoutToDom({
    toolbarEl: toolbarEl2,
    layoutInput: layoutInput2(getStateSnapshot()),
    imageToolbarActions: imageToolbarActions2,
    normalizeImageToolbarLayout: normalizeImageToolbarLayout2,
    getToolbarActionFromButton: getToolbarActionFromButton2,
  });
  let enabled9 = false,
    enabled10 = false,
    current = false,
    el11 = null,
    entry = null,
    enabled11 = null,
    requestAnimationFrame2 = 0;
  const el12 = el9.parentNode,
    el13 = el9.nextSibling,
    handler6 = () => {
      if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
      ((requestAnimationFrame2 = 0), el9.classList.remove('is-portaled'), el9.removeAttribute('style'));
      if (el12 && el9.parentNode !== el12) {
        const record = el13 && el13.parentNode === el12 ? el13 : null;
        el12.insertBefore(el9, record);
      }
    },
    handler7 = () => {
      if (!enabled9 || el9.hidden || !toolbarEl2.isConnected) {
        handler6();
        return;
      }
      const left = toolbarEl2.getBoundingClientRect();
      (left.width > 0 &&
        left.height > 0 &&
        Object.assign(el9.style, {
          left: left.left + left.width / 2 + 'px',
          top: left.top - 10 + 'px',
        }),
        (requestAnimationFrame2 = requestAnimationFrame(handler7)));
    },
    handler8 = () => {
      el9.parentNode !== document.body && document.body.appendChild(el9);
      el9.classList.add('is-portaled');
      if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
      requestAnimationFrame2 = 0;
    },
    handler9 = () => {
      const map5 = collectToolbarActionButtons(toolbarEl2, getToolbarActionFromButton2);
      return (
        collectToolbarActionButtons(el9, getToolbarActionFromButton2).forEach((item5, payload) =>
          map5.set(payload, item5),
        ),
        map5
      );
    },
    handler10 = (el14, enabled12) => {
      el14.classList.toggle('is-drop-target', !!enabled12);
    },
    handler11 = (handle) => {
      if (entry === handle) return;
      if (entry) handler10(entry, false);
      entry = handle || null;
      if (entry) handler10(entry, true);
    },
    handler12 = () => {
      (handler11(null), Object.values(toolbarZones2).forEach((item6) => handler10(item6, false)));
    },
    handler13 = (enabled13) => {
      (toolbarEl2.classList.toggle('is-toolbar-drag-active', !!enabled13),
        el9.classList.toggle('is-toolbar-drag-active', !!enabled13));
    },
    handler14 = () =>
      Object.values(toolbarZones2).flatMap((el15) =>
        Array.from(el15?.querySelectorAll?.('.ftb-btn') || []).filter((item7) =>
          getToolbarActionFromButton2(item7),
        ),
      ),
    handler15 = (handler16) => {
      const list3 = handler14(),
        map6 = new Map(list3.map((el16) => [el16, el16.getBoundingClientRect?.() || {}])),
        enabled14 = handler16();
      if (!enabled14) return false;
      return (
        handler14().forEach((el17) => {
          const box = map6.get(el17);
          if (!box) return;
          const box2 = el17.getBoundingClientRect?.() || {},
            count = Number(box.left || 0) - Number(box2.left || 0),
            count2 = Number(box.top || 0) - Number(box2.top || 0);
          if (count === 0 && count2 === 0) return;
          ((el17.style.transform = 'translate(' + count + 'px, ' + count2 + 'px)'),
            (el17.style.transition = 'none'));
          const run =
            typeof requestAnimationFrame === 'function'
              ? requestAnimationFrame
              : (state) => setTimeout(state, 0);
          run(() => {
            ((el17.style.transform = ''),
              (el17.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'));
          });
        }),
        true
      );
    },
    handler17 = () => {
      const toolbarLayoutFromDom = readToolbarLayoutFromDom(
          toolbarEl2,
          getToolbarActionFromButton2,
          normalizeImageToolbarLayout2,
          toolbarZones2,
        ),
        config = handler4(layoutInput2(getStateSnapshot())),
        scope = handler4(toolbarLayoutFromDom);
      if (config === scope) return;
      handler5(toolbarLayoutFromDom);
    },
    handler18 = (el18, input) => {
      const output = Array.from(el18.querySelectorAll('.ftb-btn')).filter((item8) => item8 !== el11);
      for (const el19 of output) {
        const box3 = el19.getBoundingClientRect(),
          value2 = box3.left + box3.width / 2;
        if (input < value2) return el19;
      }
      return null;
    },
    handler19 = (value3, event) => {
      const el20 = event.target?.closest?.('.ftb-btn');
      if (el20 === el11) return el11;
      if (el20 && value3.contains(el20) && getToolbarActionFromButton2(el20)) {
        const box4 = el20.getBoundingClientRect(),
          value4 = box4.left + box4.width / 2;
        return Number(event.clientX || 0) < value4 ? el20 : el20.nextElementSibling;
      }
      return handler18(value3, event.clientX);
    },
    handler20 = (el21, value5) => {
      if (!el11 || !el21) return false;
      if (value5 === el11) return false;
      const enabled15 = value5 || null;
      if (el11.parentNode === el21) {
        const value6 = el11.nextElementSibling;
        if (enabled15 && value6 === enabled15) return false;
        if (!enabled15 && el11 === el21.lastElementChild) return false;
      }
      return handler15(() => {
        return (enabled15 ? el21.insertBefore(el11, enabled15) : el21.appendChild(el11), true);
      });
    },
    handler21 = (enabled16) => {
      ((current = !!enabled16), el10.classList.toggle('is-tooltip-pinned', current));
    },
    handler22 = (enabled17) => {
      ((enabled10 = !!enabled17),
        toolbarEl2.classList.toggle('is-toolbar-customizing', enabled10),
        el9.classList.toggle('is-toolbar-customizing', enabled10),
        handler21(enabled10),
        (el10.hidden = false),
        el10.classList.toggle('is-active', enabled10),
        (el10.textContent = enabled10 ? imageToolbarText('done') : imageToolbarText('customize')),
        el10.setAttribute(
          'aria-label',
          enabled10 ? imageToolbarText('doneCustomize') : imageToolbarText('customize'),
        ),
        handler9().forEach((el22) => {
          ((el22.draggable = enabled10), el22.classList.toggle('is-toolbar-draggable', enabled10));
        }),
        !enabled10 &&
          ((el11 = null),
          handler13(false),
          handler12(),
          handler9().forEach((el23) => {
            (el23.classList.remove('is-toolbar-dragging'),
              el23.classList.remove('is-toolbar-dragging-capture'));
          })));
    },
    closeMoreMenu2 = () => {
      if (!enabled9) return;
      ((enabled9 = false),
        enabled10 && (handler6(), handler17()),
        handler22(false),
        el8.classList.remove('is-active'),
        (el9.hidden = true),
        handler6(),
        enabled11 && (document.removeEventListener('pointerdown', enabled11, true), (enabled11 = null)));
    },
    handler23 = () => {
      if (enabled9) return;
      ((enabled9 = true),
        el8.classList.add('is-active'),
        handler8(),
        (el9.hidden = false),
        handler7(),
        !enabled11 &&
          ((enabled11 = (event2) => {
            !toolbarEl2.contains(event2.target) && !el9.contains(event2.target) && closeMoreMenu2();
          }),
          document.addEventListener('pointerdown', enabled11, true)));
    };
  (el8.addEventListener('click', (event3) => {
    (event3.preventDefault(), event3.stopPropagation(), enabled9 ? closeMoreMenu2() : handler23());
  }),
    el10.addEventListener('click', (event4) => {
      (event4.preventDefault(), event4.stopPropagation(), handler23());
      if (enabled10) {
        (handler22(false), handler17());
        return;
      }
      handler22(true);
    }));
  const value7 = (event5) => {
    const enabled18 = event5.target?.closest?.('.ftb-btn');
    if (!enabled18) return;
    const enabled19 = getToolbarActionFromButton2(enabled18);
    if (!enabled19) return;
    if (enabled10) {
      (event5.preventDefault(), event5.stopPropagation());
      return;
    }
    if (toolbarZones2.more.contains(enabled18)) {
      if (map4.has(enabled19)) return;
      queueMicrotask(() => {
        if (!toolbarEl2.isConnected) return;
        if (enabled10) return;
        closeMoreMenu2();
      });
    }
  };
  return (
    toolbarEl2.addEventListener('click', value7, true),
    el9.addEventListener('click', value7, true),
    collectToolbarActionButtons(toolbarEl2, getToolbarActionFromButton2).forEach((el24) => {
      if (el24.dataset.toolbarDnDBound === '1') return;
      ((el24.dataset.toolbarDnDBound = '1'),
        el24.addEventListener('dragstart', (event6) => {
          if (!enabled10) {
            event6.preventDefault();
            return;
          }
          ((el11 = el24),
            handler13(true),
            el24.classList.add('is-toolbar-dragging-capture'),
            setTimeout(() => {
              if (el11 === el24) el24.classList.add('is-toolbar-dragging');
            }, 0),
            event6.dataTransfer &&
              ((event6.dataTransfer.effectAllowed = 'move'),
              event6.dataTransfer.setData('text/plain', 'image-toolbar-button')));
        }),
        el24.addEventListener('dragend', () => {
          (el24.classList.remove('is-toolbar-dragging-capture'),
            el24.classList.remove('is-toolbar-dragging'),
            (el11 = null),
            handler13(false),
            handler12());
        }));
    }),
    Object.values(toolbarZones2).forEach((el25) => {
      if (el25.dataset.toolbarDropBound === '1') return;
      ((el25.dataset.toolbarDropBound = '1'),
        el25.addEventListener('dragover', (event7) => {
          if (!enabled10 || !el11) return;
          (event7.preventDefault(), handler11(el25));
          const value8 = handler19(el25, event7);
          handler20(el25, value8);
        }),
        el25.addEventListener('dragleave', (value9) => {
          if (el11) {
            const enabled20 = value9.relatedTarget || null;
            if (!enabled20 || el25.contains(enabled20)) return;
          }
          if (entry === el25) handler11(null);
        }),
        el25.addEventListener('drop', (event8) => {
          if (!enabled10 || !el11) return;
          (event8.preventDefault(), handler11(null), handler17());
        }));
    }),
    { closeMoreMenu: closeMoreMenu2 }
  );
}
