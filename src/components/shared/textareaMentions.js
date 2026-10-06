import { createMentionMenuItem, positionMentionMenu } from './mentionMenu.js';
let nextMenuId = 0;
export function bindTextareaMentions({
  input: input,
  trigger: trigger,
  menu: menu,
  getCandidates: getCandidates,
  onSelect: onSelect,
  optionRole: optionRole = 'option',
}) {
  (menu.classList.add('at-mention-menu'),
    menu.setAttribute('popover', 'manual'),
    (menu.id = 'textarea-mentions-' + ++nextMenuId),
    menu.setAttribute('role', 'listbox'),
    (menu.hidden = true),
    trigger.setAttribute('aria-controls', menu.id),
    trigger.setAttribute('aria-expanded', 'false'),
    input.setAttribute('aria-controls', menu.id),
    input.setAttribute('aria-autocomplete', 'list'));
  const el = document.createElement('div');
  ((el.className = 'at-mention-caret-mirror'),
    el.setAttribute('aria-hidden', 'true'),
    document.body.append(el));
  let value = null,
    item = 0,
    key = '',
    list = [],
    list2 = [],
    index = 0,
    requestAnimationFrame2 = 0;
  const run = () => !menu.hidden;
  function run2() {
    (cancelAnimationFrame(requestAnimationFrame2), (requestAnimationFrame2 = 0));
    if (menu.matches(':popover-open')) menu.hidePopover();
    ((menu.hidden = true),
      (menu.style.display = 'none'),
      trigger.setAttribute('aria-expanded', 'false'),
      input.removeAttribute('aria-activedescendant'));
  }
  function run3() {
    const box = input.getBoundingClientRect(),
      computedStyle = getComputedStyle(input);
    for (const result of [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'fontStyle',
      'lineHeight',
      'letterSpacing',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'boxSizing',
      'wordSpacing',
      'textIndent',
      'tabSize',
    ])
      el.style[result] = computedStyle[result];
    ((el.style.width = box.width + 'px'),
      (el.textContent = input.value.slice(0, value ?? item)));
    const el2 = document.createElement('span');
    ((el2.textContent = input.value.slice(value ?? item) || '​'), el.append(el2));
    const data = document.createRange();
    (data.setStart(el2.firstChild, 0), data.setEnd(el2.firstChild, 0));
    const options = data.getBoundingClientRect(),
      box2 = el.getBoundingClientRect(),
      target = Math.max(
        box.top,
        Math.min(box.bottom, box.top + options.top - box2.top - input.scrollTop),
      ),
      source = Math.max(
        box.left,
        Math.min(box.right, box.left + options.left - box2.left - input.scrollLeft),
      );
    return {
      left: source,
      anchorTop: target,
      top: target + (options.height || parseFloat(computedStyle.lineHeight) || 20) + 5,
    };
  }
  function run4() {
    if (!run()) return;
    if (!input.isConnected || input.disabled || !input.getClientRects().length) return run2();
    (positionMentionMenu(menu, run3()), (requestAnimationFrame2 = requestAnimationFrame(run4)));
  }
  function run5(next, current = false) {
    ((index = Math.max(0, Math.min(next, list2.length - 1))),
      list2.forEach((entry, record) => {
        (entry.classList.toggle('active', record === index),
          entry.classList.toggle('at-mention-keyboard-active', record === index),
          entry.setAttribute('aria-selected', String(record === index)));
      }));
    if (list2[index]) {
      input.setAttribute('aria-activedescendant', list2[index].id);
      if (current) list2[index].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function run6(payload) {
    if (!list[payload] || input.disabled) return;
    const handle = list[payload],
      state = { start: value ?? item, end: item, typed: value !== null };
    (run2(), onSelect(handle, state), input.focus({ preventScroll: true }));
  }
  function run7(config = '') {
    if (input.disabled) return;
    ((key = config),
      (list = getCandidates(key)),
      menu.replaceChildren(),
      (list2 = list.map((scope, output) => {
        const { item: item2, copyEl: copyEl } = createMentionMenuItem(scope);
        (item2.appendChild(copyEl),
          (item2.id = menu.id + '-' + output),
          item2.setAttribute('role', optionRole),
          (item2.tabIndex = -1));
        if (scope.visual) {
          const el3 = document.createElement('span');
          ((el3.className = 'at-mention-visual'),
            el3.setAttribute('aria-hidden', 'true'),
            el3.append(scope.visual),
            item2.insertBefore(el3, copyEl));
        }
        return (
          item2.addEventListener('pointerdown', (value2) => value2.preventDefault()),
          item2.addEventListener('click', () => run6(output)),
          menu.append(item2),
          item2
        );
      })));
    if (!list2.length) {
      const value3 = document.createElement('div');
      ((value3.className = 'at-mention-empty'),
        (value3.textContent = '没有匹配的结果'),
        menu.append(value3));
    }
    ((menu.hidden = false), (menu.style.display = 'flex'));
    if (!menu.matches(':popover-open')) menu.showPopover();
    (trigger.setAttribute('aria-expanded', 'true'),
      run5(0),
      cancelAnimationFrame(requestAnimationFrame2),
      run4());
  }
  function run8(value4) {
    if (value4.isComposing) {
      run2();
      return;
    }
    item = input.selectionStart;
    const value5 = input.value.slice(0, item).match(/[@＠]([^@＠\s]*)$/);
    if (value5 && item === input.selectionEnd) ((value = item - value5[0].length), run7(value5[1]));
    else run2();
  }
  function run9(event) {
    if (!run() || event.isComposing) return;
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
      (event.preventDefault(), event.stopImmediatePropagation());
      if (event.key === 'Escape') run2();
      else {
        if (event.key === 'Enter') run6(index);
        else
          run5(
            (index + (event.key === 'ArrowDown' ? 1 : -1) + list2.length) %
              (list2.length || 1),
            true,
          );
      }
    } else {
      if (event.key === 'Tab') run2();
    }
  }
  function run10() {
    if (run()) return run2();
    ((value = null), (item = input.selectionStart), input.focus({ preventScroll: true }), run7());
  }
  function run11(event2) {
    if (
      !menu.contains(event2.target) &&
      event2.target !== input &&
      !trigger.contains(event2.target)
    )
      run2();
  }
  return (
    input.addEventListener('input', run8),
    input.addEventListener('compositionend', run8),
    input.addEventListener('keydown', run9, true),
    input.addEventListener('click', run2),
    trigger.addEventListener('click', run10),
    document.addEventListener('pointerdown', run11, true),
    {
      close: run2,
      isOpen: run,
      refresh() {
        if (run()) run7(key);
      },
      destroy() {
        (run2(),
          el.remove(),
          menu.remove(),
          input.removeEventListener('input', run8),
          input.removeEventListener('compositionend', run8),
          input.removeEventListener('keydown', run9, true),
          input.removeEventListener('click', run2),
          trigger.removeEventListener('click', run10),
          document.removeEventListener('pointerdown', run11, true));
      },
    }
  );
}
