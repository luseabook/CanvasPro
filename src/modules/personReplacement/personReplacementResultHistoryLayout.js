const SIZE = '--person-replacement-results-height';
export function createPersonReplacementResultHistoryLayout() {
  let el = null,
    el2 = null,
    value = null;
  const run = (item, enabled = !![]) => {
      if (!el) return [];
      if (!enabled) el['classList']['add']('is-results-layout-static');
      el['style']['setProperty'](SIZE, item + 'px');
      const key = (el['getAnimations']?.() || [])['filter']((index) => index['transitionProperty'] === SIZE);
      if (!enabled) el['classList']['remove']('is-results-layout-static');
      return key;
    },
    handler = () => {
      (value?.['disconnect'](), (value = null), (el2 = null));
    },
    handler2 = () => {
      const result = el2?.['getBoundingClientRect']?.()['height'];
      if (Number['isFinite'](result)) run(result);
    };
  return Object['freeze']({
    show(el3) {
      const data = el3?.['closest']?.('.person-replacement-middle-layout');
      data !== el && (handler(), run(0, ![]), (el = data));
      const options = el3?.['querySelector']?.('.person-replacement-result-history-content');
      if (options !== el2) {
        (handler(), (el2 = options));
        const run2 = el3?.['ownerDocument']?.['defaultView']?.['ResizeObserver'];
        el2 && run2 && ((value = new run2(handler2)), value['observe'](el2));
      }
      handler2();
    },
    hide({ animate: animate = ![] } = {}) {
      return (handler(), run(0, animate));
    },
    destroy() {
      (handler(), run(0, ![]), (el = null));
    },
  });
}
