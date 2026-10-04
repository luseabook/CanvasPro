const TOOLTIP_ATTRS = ['data-tooltip', 'data-tooltip-right'],
  NATIVE_TITLE_BACKUP_ATTR = 'data-native-title',
  GENERATED_TOOLTIP_ATTR = 'data-tooltip-source',
  GENERATED_TOOLTIP_VALUE = 'native-title',
  TOOLTIP_PORTAL_CLASS = 'global-tooltip',
  TOOLTIP_PORTAL_READY_CLASS = 'has-global-tooltip-portal',
  TOOLTIP_ARROW_CLASS = 'global-tooltip-arrow',
  DEFAULT_TOOLTIP_PLACEMENT = 'top',
  RIGHT_TOOLTIP_PLACEMENT = 'right',
  TOOLTIP_GAP_PX = 12,
  TOOLTIP_VIEWPORT_PADDING_PX = 8,
  TOOLTIP_ARROW_PADDING_PX = 12,
  GLOBAL_TOOLTIP_EXCLUDE_SELECTOR = '.generation-node-help-tip';
let installed = null;
function isElementNode(value) {
  return value && value.nodeType === 1;
}
function clamp(item, key, index) {
  const result = Number.isFinite(key) ? key : 0,
    data = Number.isFinite(index) ? Math.max(result, index) : result;
  return Math.min(Math.max(item, result), data);
}
function normalizeRect(box = {}) {
  const left = Number(box.left) || 0,
    top = Number(box.top) || 0,
    width = Number(box.width) || Math.max(0, (Number(box.right) || left) - left),
    height = Number(box.height) || Math.max(0, (Number(box.bottom) || top) - top);
  return {
    left: left,
    top: top,
    right: Number(box.right) || left + width,
    bottom: Number(box.bottom) || top + height,
    width: width,
    height: height,
  };
}
function normalizeViewport(box2 = {}) {
  return {
    width: Number(box2.width) || Number(box2.innerWidth) || Number(globalThis.innerWidth) || 0,
    height: Number(box2.height) || Number(box2.innerHeight) || Number(globalThis.innerHeight) || 0,
    padding: Number(box2.padding) >= 0 ? Number(box2.padding) : TOOLTIP_VIEWPORT_PADDING_PX,
    gap: Number(box2.gap) >= 0 ? Number(box2.gap) : TOOLTIP_GAP_PX,
    arrowPadding: Number(box2.arrowPadding) >= 0 ? Number(box2.arrowPadding) : TOOLTIP_ARROW_PADDING_PX,
  };
}
export function computeTooltipPosition(options, target, source, next = DEFAULT_TOOLTIP_PLACEMENT) {
  const box3 = normalizeRect(options),
    box4 = normalizeRect(target),
    box5 = normalizeViewport(source),
    current = box5.width - box5.padding - box4.width,
    entry = box5.height - box5.padding - box4.height,
    record = box3.left + box3.width / 2,
    payload = box3.top + box3.height / 2;
  let placement = next === RIGHT_TOOLTIP_PLACEMENT ? RIGHT_TOOLTIP_PLACEMENT : 'top',
    left2 = record - box4.width / 2,
    top2 = box3.top - box4.height - box5.gap;
  if (placement === 'top') {
    const handle = box3.bottom + box5.gap;
    return (
      top2 < box5.padding &&
        handle + box4.height <= box5.height - box5.padding &&
        ((placement = 'bottom'), (top2 = handle)),
      (left2 = clamp(left2, box5.padding, current)),
      (top2 = clamp(top2, box5.padding, entry)),
      {
        left: left2,
        top: top2,
        placement: placement,
        arrowLeft: clamp(record - left2, box5.arrowPadding, box4.width - box5.arrowPadding),
        arrowTop: null,
      }
    );
  }
  return (
    (left2 = box3.right + box5.gap),
    (top2 = payload - box4.height / 2),
    left2 + box4.width > box5.width - box5.padding &&
      box3.left - box5.gap - box4.width >= box5.padding &&
      ((placement = 'left'), (left2 = box3.left - box5.gap - box4.width)),
    (left2 = clamp(left2, box5.padding, current)),
    (top2 = clamp(top2, box5.padding, entry)),
    {
      left: left2,
      top: top2,
      placement: placement,
      arrowLeft: null,
      arrowTop: clamp(payload - top2, box5.arrowPadding, box4.height - box5.arrowPadding),
    }
  );
}
function hasUnifiedTooltip(state) {
  return TOOLTIP_ATTRS.some((item2) => {
    const config = state.getAttribute(item2);
    return typeof config === 'string' && config.trim();
  });
}
function shouldMirrorToAriaLabel(scope) {
  if (scope.hasAttribute('aria-label')) return false;
  const input = String(scope.tagName || '').toLowerCase();
  if (input === 'button' || input === 'input' || input === 'select') return true;
  return scope.hasAttribute('role') || scope.hasAttribute('tabindex');
}
export function unifyNativeTooltipElement(el) {
  if (!isElementNode(el) || !el.hasAttribute('title')) return false;
  const output = String(el.getAttribute('title') || '').trim(),
    value2 = el.getAttribute(GENERATED_TOOLTIP_ATTR) === GENERATED_TOOLTIP_VALUE;
  if (output)
    ((value2 || !hasUnifiedTooltip(el)) &&
      (el.setAttribute('data-tooltip', output),
      el.setAttribute(GENERATED_TOOLTIP_ATTR, GENERATED_TOOLTIP_VALUE)),
      el.setAttribute(NATIVE_TITLE_BACKUP_ATTR, output),
      shouldMirrorToAriaLabel(el) && el.setAttribute('aria-label', output));
  else
    value2 &&
      (el.removeAttribute('data-tooltip'),
      el.removeAttribute(GENERATED_TOOLTIP_ATTR),
      el.removeAttribute(NATIVE_TITLE_BACKUP_ATTR));
  return (el.removeAttribute('title'), true);
}
export function unifyNativeTooltips(el2 = globalThis.document) {
  if (!el2) return 0;
  let value3 = 0;
  if (isElementNode(el2) && unifyNativeTooltipElement(el2)) value3 += 1;
  const list = el2.querySelectorAll?.('[title]');
  if (!list) return value3;
  return (
    list.forEach((item3) => {
      if (unifyNativeTooltipElement(item3)) value3 += 1;
    }),
    value3
  );
}
function normalizeMutationRecord(event) {
  if (event.type === 'attributes') {
    unifyNativeTooltipElement(event.target);
    return;
  }
  event.addedNodes.forEach((item4) => {
    unifyNativeTooltips(item4);
  });
}
function getTooltipDescriptor(el3) {
  if (!isElementNode(el3)) return null;
  if (el3.closest?.(GLOBAL_TOOLTIP_EXCLUDE_SELECTOR)) return null;
  const text = String(el3.getAttribute('data-tooltip-right') || '').trim();
  if (text) {
    if (el3.getAttribute('aria-expanded') === 'true') return null;
    return { text: text, placement: RIGHT_TOOLTIP_PLACEMENT };
  }
  const text2 = String(el3.getAttribute('data-tooltip') || '').trim();
  if (text2) return { text: text2, placement: DEFAULT_TOOLTIP_PLACEMENT };
  return null;
}
function findTooltipTarget(value4) {
  let isElementNode2 = isElementNode(value4) ? value4 : value4?.parentElement;
  while (isElementNode(isElementNode2)) {
    if (getTooltipDescriptor(isElementNode2)) return isElementNode2;
    isElementNode2 = isElementNode2.parentElement;
  }
  return null;
}
function createTooltipPortal(el4) {
  const portal = el4.createElement('div');
  ((portal.className = TOOLTIP_PORTAL_CLASS), portal.setAttribute('role', 'tooltip'), (portal.hidden = true));
  const arrow = el4.createElement('div');
  return (
    (arrow.className = TOOLTIP_ARROW_CLASS),
    portal.appendChild(arrow),
    el4.body?.appendChild(portal),
    { portal: portal, arrow: arrow }
  );
}
export function installTooltipUnifier(el5 = globalThis.document) {
  if (!el5?.documentElement) return () => {};
  if (installed) return installed.cleanup;
  (unifyNativeTooltips(el5), el5.documentElement.classList?.add(TOOLTIP_PORTAL_READY_CLASS));
  let el6 = null,
    el7 = null,
    el8 = null;
  const run = () => {
      if (el7 && el7.isConnected !== false) return el7;
      if (!el5.body || typeof el5.createElement !== 'function') return null;
      const tooltipPortal = createTooltipPortal(el5);
      return ((el7 = tooltipPortal.portal), (el8 = tooltipPortal.arrow), el7);
    },
    handler = (value5 = null) => {
      if (value5 && el6 !== value5) return;
      el6 = null;
      if (!el7) return;
      (el7.classList?.remove('is-visible'), (el7.hidden = true));
    },
    handler2 = () => {
      if (!el6 || !el7 || el7.hidden) return;
      if (!el5.documentElement.contains?.(el6)) {
        handler();
        return;
      }
      const tooltipDescriptor = getTooltipDescriptor(el6);
      if (!tooltipDescriptor) {
        handler();
        return;
      }
      const enabled = el6.getBoundingClientRect?.(),
        enabled2 = el7.getBoundingClientRect?.();
      if (!enabled || !enabled2) return;
      const width2 = el5.defaultView || globalThis,
        box6 = computeTooltipPosition(
          enabled,
          enabled2,
          { width: width2.innerWidth, height: width2.innerHeight },
          tooltipDescriptor.placement,
        );
      ((el7.style.left = box6.left + 'px'),
        (el7.style.top = box6.top + 'px'),
        (el7.dataset.placement = box6.placement),
        el7.classList?.toggle('is-placement-right', box6.placement === 'right'),
        el7.classList?.toggle('is-placement-left', box6.placement === 'left'),
        el7.classList?.toggle('is-placement-bottom', box6.placement === 'bottom'),
        el7.classList?.toggle('is-placement-top', box6.placement === 'top'),
        el8 &&
          (box6.arrowLeft != null && ((el8.style.left = box6.arrowLeft + 'px'), (el8.style.top = '')),
          box6.arrowTop != null && ((el8.style.top = box6.arrowTop + 'px'), (el8.style.left = ''))));
    },
    handler3 = (value6) => {
      const response = getTooltipDescriptor(value6);
      if (!response) {
        handler(value6);
        return;
      }
      const el9 = run();
      if (!el9) return;
      ((el6 = value6), (el9.textContent = response.text));
      if (el8) el9.appendChild(el8);
      ((el9.hidden = false),
        el9.classList?.remove('is-visible'),
        (el9.style.left = '0px'),
        (el9.style.top = '0px'),
        handler2(),
        el9.classList?.add('is-visible'));
    },
    handler4 = (el10) => {
      if (!isElementNode(el10)) return;
      const value7 = el10.classList?.contains('is-tooltip-pinned');
      if (value7 && getTooltipDescriptor(el10)) {
        handler3(el10);
        return;
      }
      if (el6 === el10) {
        const tooltipDescriptor2 = getTooltipDescriptor(el10);
        if (tooltipDescriptor2) handler3(el10);
        else handler(el10);
      }
    },
    handler5 = el5.defaultView?.MutationObserver || globalThis.MutationObserver,
    value8 = handler5
      ? new handler5((list2) => {
          (list2.forEach((event2) => {
            (normalizeMutationRecord(event2),
              event2.type === 'attributes' &&
                ['class', 'data-tooltip', 'data-tooltip-right', 'aria-expanded'].includes(
                  event2.attributeName,
                ) &&
                handler4(event2.target));
          }),
            el6 && !el5.documentElement.contains?.(el6) && handler());
        })
      : null;
  value8?.observe(el5.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['title', 'class', 'data-tooltip', 'data-tooltip-right', 'aria-expanded'],
  });
  const value9 = (event3) => {
      const value10 = event3.target?.closest?.('[title]') || event3.target;
      unifyNativeTooltipElement(value10);
      const tooltipTarget = findTooltipTarget(event3.target);
      if (tooltipTarget) handler3(tooltipTarget);
    },
    value11 = (value12) => {
      if (!el6) return;
      if (el6.contains?.(value12.relatedTarget)) return;
      handler(el6);
    },
    value13 = (event4) => {
      const value14 = event4.target?.closest?.('[title]') || event4.target;
      unifyNativeTooltipElement(value14);
      const tooltipTarget2 = findTooltipTarget(event4.target);
      if (tooltipTarget2) handler3(tooltipTarget2);
    },
    value15 = (value16) => {
      if (!el6) return;
      if (el6.contains?.(value16.relatedTarget)) return;
      handler(el6);
    },
    value17 = () => {
      handler();
    },
    value18 = () => handler();
  (el5.addEventListener?.('pointerover', value9, true),
    el5.addEventListener?.('pointerout', value11, true),
    el5.addEventListener?.('focusin', value13, true),
    el5.addEventListener?.('focusout', value15, true),
    el5.addEventListener?.('pointerdown', value18, true),
    el5.addEventListener?.('scroll', value17, true),
    el5.defaultView?.addEventListener?.('scroll', value17, true),
    el5.defaultView?.addEventListener?.('resize', value17));
  const cleanup = () => {
    (value8?.disconnect(),
      el5.removeEventListener?.('pointerover', value9, true),
      el5.removeEventListener?.('pointerout', value11, true),
      el5.removeEventListener?.('focusin', value13, true),
      el5.removeEventListener?.('focusout', value15, true),
      el5.removeEventListener?.('pointerdown', value18, true),
      el5.removeEventListener?.('scroll', value17, true),
      el5.defaultView?.removeEventListener?.('scroll', value17, true),
      el5.defaultView?.removeEventListener?.('resize', value17),
      el5.documentElement.classList?.remove(TOOLTIP_PORTAL_READY_CLASS),
      el7?.remove?.(),
      (el6 = null),
      (el7 = null),
      (el8 = null),
      (installed = null));
  };
  return ((installed = { cleanup: cleanup }), cleanup);
}
