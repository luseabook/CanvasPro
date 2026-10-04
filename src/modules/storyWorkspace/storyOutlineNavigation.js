function findOutlineSection(el, value) {
  return (
    [...el['querySelectorAll']('[data-story-outline-section]')]['find'](
      (el2) => el2['dataset']['storyOutlineSection'] === value,
    ) || null
  );
}
export function jumpToStoryOutlineSection(
  item,
  key,
  { windowObject: windowObject = globalThis['window'] } = {},
) {
  const outlineSection = findOutlineSection(item, key);
  if (!outlineSection) return ![];
  const run = () => outlineSection['scrollIntoView']?.({ behavior: 'smooth', block: 'start' });
  return (
    typeof windowObject?.['requestAnimationFrame'] === 'function'
      ? windowObject['requestAnimationFrame'](run)
      : run(),
    !![]
  );
}
export function bindStoryOutlineNavigation(el3, { windowObject: windowObject = globalThis['window'] } = {}) {
  const el4 = el3?.['querySelector']?.('[data-story-outline-nav]');
  if (!el4) return null;
  const el5 = el4['querySelector']('[data-story-outline-nav-toggle]'),
    dom = el3['ownerDocument'];
  let enabled = ![],
    index = ![],
    result = 0x0,
    enabled2 = 0x0;
  const run2 = (data) => {
      el5?.['setAttribute']('aria-expanded', String(data));
    },
    handler = () => {
      if (!enabled2) return;
      (windowObject['clearTimeout'](enabled2), (enabled2 = 0x0));
    },
    handler2 = (options) => {
      ((index = Boolean(options)),
        el4['classList']['toggle']('is-hover-open', index),
        run2(index || enabled || el4['contains'](dom['activeElement'])));
    },
    handler3 = (target) => {
      ((enabled = Boolean(target)),
        el4['classList']['toggle']('is-pinned', enabled),
        run2(enabled || index || el4['matches'](':hover') || el4['contains'](dom['activeElement'])));
    },
    source = (event) => {
      (event['preventDefault'](), handler3(!enabled));
    },
    next = () => {
      (handler(), handler2(!![]));
    },
    current = () => {
      handler();
      if (enabled) return;
      enabled2 = windowObject['setTimeout'](() => {
        ((enabled2 = 0x0), handler2(![]));
      }, 0xb4);
    },
    entry = () => run2(!![]),
    record = () => {
      if (result) windowObject['clearTimeout'](result);
      result = windowObject['setTimeout'](() => {
        ((result = 0x0), run2(enabled || el4['contains'](dom['activeElement'])));
      }, 0x0);
    },
    payload = (event2) => {
      const el6 = event2['target']['closest']?.('[data-story-outline-nav-target]');
      if (el6 && el4['contains'](el6)) {
        (event2['preventDefault'](),
          jumpToStoryOutlineSection(el3, el6['dataset']['storyOutlineNavTarget'], {
            windowObject: windowObject,
          }));
        return;
      }
      !el4['contains'](event2['target']) && (handler(), handler2(![]), handler3(![]));
    },
    handle = (event3) => {
      if (event3['key'] !== 'Escape') return;
      (handler(), handler2(![]), handler3(![]), dom['activeElement']?.['blur']?.());
    };
  return (
    el5?.['addEventListener']('click', source),
    el4['addEventListener']('pointerenter', next),
    el4['addEventListener']('pointerleave', current),
    el4['addEventListener']('focusin', entry),
    el4['addEventListener']('focusout', record),
    el4['addEventListener']('keydown', handle),
    el3['addEventListener']('click', payload),
    {
      destroy() {
        if (result) windowObject['clearTimeout'](result);
        (handler(),
          el5?.['removeEventListener']('click', source),
          el4['removeEventListener']('pointerenter', next),
          el4['removeEventListener']('pointerleave', current),
          el4['removeEventListener']('focusin', entry),
          el4['removeEventListener']('focusout', record),
          el4['removeEventListener']('keydown', handle),
          el3['removeEventListener']('click', payload));
      },
    }
  );
}
