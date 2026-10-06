import { createWorkspaceMenuController } from './workspaceMenuController.js';
import { MATERIAL_TREE_CHEVRON_ICON_SVG } from '../components/sharedIconMarkup.js';
export function bindWorkspaceSelects(root) {
  const el = root.ownerDocument,
    value = el.defaultView,
    list = [...root.querySelectorAll('select')].map((select) => {
      const item =
          select.getAttribute('aria-label') ||
          [...(select.labels?.[0]?.childNodes || [])]
            .filter((key) => key.nodeType === 3)
            .map((el2) => el2.textContent)
            .join('')
            .trim(),
        root2 = el.createElement('span');
      root2.className = 'story-replication-select';
      const trigger = el.createElement('button');
      ((trigger.type = 'button'),
        (trigger.className = 'story-replication-select-trigger'),
        trigger.setAttribute('aria-label', item),
        trigger.setAttribute('aria-haspopup', 'listbox'),
        trigger.setAttribute('aria-expanded', 'false'));
      const text = el.createElement('span'),
        el3 = el.createElement('span');
      ((el3.innerHTML = MATERIAL_TREE_CHEVRON_ICON_SVG),
        el3.setAttribute('aria-hidden', 'true'),
        trigger.append(text, el3));
      const menu = el.createElement('span');
      ((menu.className = 'story-replication-select-menu'),
        menu.setAttribute('popover', 'manual'),
        menu.setAttribute('role', 'listbox'),
        menu.setAttribute('aria-label', item),
        menu.setAttribute('aria-hidden', 'true'),
        (menu.id = 'replication-select-' + value.crypto.randomUUID()),
        trigger.setAttribute('aria-controls', menu.id));
      for (const el4 of select.options) {
        const el5 = el.createElement('button');
        ((el5.type = 'button'),
          (el5.className = 'story-replication-select-option'),
          el5.setAttribute('role', 'option'),
          (el5.dataset.value = el4.value),
          (el5.textContent = el4.textContent));
        if (el4.dataset.thumbnailUrl) {
          const el6 = el.createElement('img');
          ((el6.className = 'workspace-select-character-thumbnail'),
            (el6.src = el4.dataset.thumbnailUrl),
            (el6.alt = ''),
            (el6.loading = 'lazy'),
            el6.addEventListener('error', () => el6.remove(), { once: true }),
            el5.classList.add('has-character-thumbnail'),
            el5.append(el6));
        }
        ((el5.disabled = el4.disabled), (el5.tabIndex = -1), menu.append(el5));
      }
      const hidden = select.hidden;
      return (
        select.before(root2),
        (select.hidden = true),
        root2.append(select, trigger, menu),
        {
          select: select,
          root: root2,
          trigger: trigger,
          text: text,
          menu: menu,
          hidden: hidden,
        }
      );
    }),
    workspaceMenuController = createWorkspaceMenuController({
      root: root,
      wrapperSelector: '.story-replication-select',
      triggerSelector: '.story-replication-select-trigger',
      menuSelector: '.story-replication-select-menu',
      optionSelector: '.story-replication-select-option',
    });
  let enabled = null,
    index = 0;
  function close(enabled2 = false) {
    const result = enabled;
    ((enabled = null),
      value.cancelAnimationFrame(index),
      workspaceMenuController.close(),
      result?.menu.hidePopover(),
      el.removeEventListener('pointerdown', run, true));
    if (enabled2 && result?.trigger.isConnected) result.trigger.focus({ preventScroll: true });
  }
  function run(event) {
    if (!enabled?.root.contains(event.target)) close();
  }
  function sync() {
    for (const data of list) {
      const { select: select2, trigger: trigger2, text: text2, menu: menu2 } = data;
      ((trigger2.disabled = select2.matches(':disabled')),
        (text2.textContent = select2.selectedOptions[0]?.textContent || '请选择'),
        (trigger2.title = text2.textContent));
      for (const el7 of menu2.children)
        el7.setAttribute('aria-selected', String(el7.dataset.value === select2.value));
      if (enabled === data && trigger2.disabled) close();
    }
  }
  function run2() {
    if (!enabled) return;
    const { trigger: trigger3, menu: menu3 } = enabled;
    if (!trigger3.isConnected || !trigger3.checkVisibility() || trigger3.matches(':disabled')) {
      close();
      return;
    }
    const box = trigger3.getBoundingClientRect(),
      options = Math.min(Math.max(box.width, 160), value.innerWidth - 24),
      count = value.innerHeight - box.bottom - 16,
      target = box.top - 16,
      source = count < 160 && target > count;
    ((menu3.style.width = options + 'px'),
      (menu3.style.left =
        Math.max(12, Math.min(box.left, value.innerWidth - options - 12)) + 'px'),
      (menu3.style.maxHeight = Math.max(40, Math.min(280, source ? target : count)) + 'px'),
      (menu3.style.top = source ? 'auto' : box.bottom + 4 + 'px'),
      (menu3.style.bottom = source ? value.innerHeight - box.top + 4 + 'px' : 'auto'),
      (index = value.requestAnimationFrame(run2)));
  }
  function run3(next) {
    (close(), sync());
    if (!workspaceMenuController.open(next.root, next.trigger)) return false;
    return (
      (enabled = next),
      next.menu.showPopover(),
      run2(),
      el.addEventListener('pointerdown', run, true),
      true
    );
  }
  function run4(event2) {
    const enabled3 = list.find((current) => current.root.contains(event2.target));
    if (!enabled3 || enabled3.select.matches(':disabled')) return;
    if (event2.target.closest('.story-replication-select-trigger')) {
      if (enabled === enabled3) close(true);
      else {
        if (run3(enabled3)) {
          const el8 =
            enabled3.menu.querySelector('[aria-selected="true"]:not(:disabled)') ||
            enabled3.menu.querySelector('button:not(:disabled)');
          (el8?.focus({ preventScroll: true }), el8?.scrollIntoView({ block: 'nearest' }));
        }
      }
    }
    const el9 = event2.target.closest('.story-replication-select-option');
    if (!el9 || el9.disabled) return;
    ((enabled3.select.value = el9.dataset.value),
      sync(),
      close(true),
      enabled3.select.dispatchEvent(new value.Event('change', { bubbles: true })));
  }
  function run5(event3) {
    const enabled4 = list.find((entry) => entry.root.contains(event3.target));
    if (!enabled4 || enabled4.select.matches(':disabled')) return;
    if (
      event3.target === enabled4.trigger &&
      ['ArrowDown', 'ArrowUp'].includes(event3.key) &&
      enabled !== enabled4
    ) {
      if (!run3(enabled4)) return;
    }
    if (event3.key === 'Tab' && enabled) {
      close(true);
      return;
    }
    if (workspaceMenuController.handleKeyDown(event3)) {
      if (!enabled4.root.classList.contains('is-open')) close();
      else {
        if (enabled4.menu.contains(el.activeElement))
          el.activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }
  return (
    root.addEventListener('click', run4),
    root.addEventListener('keydown', run5),
    root.addEventListener('change', sync),
    sync(),
    {
      sync: sync,
      close: close,
      destroy() {
        (close(),
          root.removeEventListener('click', run4),
          root.removeEventListener('keydown', run5),
          root.removeEventListener('change', sync));
        for (const { select: select3, root: root3, hidden: hidden2 } of list) {
          (root3.before(select3), (select3.hidden = hidden2), root3.remove());
        }
      },
    }
  );
}
