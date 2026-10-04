export function hostPromptFloatingSurfaces(
  el,
  value,
  { externalDialogSelector: externalDialogSelector, onExternalDialog: onExternalDialog } = {},
) {
  const dom = el['ownerDocument'],
    map = new Map();
  function run(el2) {
    if (!el2['matches']?.(value) || el2['parentNode'] === el) return;
    if (!map['has'](el2)) {
      const item = dom['createComment']('prompt-floating-surface');
      (el2['before'](item), map['set'](el2, item));
    }
    el['appendChild'](el2);
  }
  [...dom['body']['children']]['forEach'](run);
  const key = new dom['defaultView']['MutationObserver']((index) => {
    for (const event of index) {
      if (event['target'] === el) {
        for (const el3 of event['removedNodes']) {
          if (el3['parentNode'] === el || el3['parentNode'] === dom['body']) continue;
          (map['get'](el3)?.['remove'](), map['delete'](el3));
        }
        continue;
      }
      for (const result of event['addedNodes']) {
        if (externalDialogSelector && result['matches']?.(externalDialogSelector)) {
          onExternalDialog?.();
          return;
        }
        run(result);
      }
    }
  });
  return (
    key['observe'](dom['body'], { childList: !![] }),
    key['observe'](el, { childList: !![] }),
    () => {
      key['disconnect']();
      for (const [el4, el5] of map) {
        if (el4['parentNode'] === el && el5['parentNode']) el5['before'](el4);
        el5['remove']();
      }
      map['clear']();
    }
  );
}
