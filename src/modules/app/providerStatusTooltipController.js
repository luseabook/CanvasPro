export function createProviderStatusTooltipController() {
  let el = null,
    value = null;
  function run() {
    if (el) return el;
    const el2 = globalThis['document'];
    if (!el2?.['body']) return null;
    return (
      (el = el2['createElement']('div')),
      (el['className'] = 'settings-provider-test-tooltip'),
      el['setAttribute']('role', 'tooltip'),
      (el['hidden'] = !![]),
      el2['body']['appendChild'](el),
      el
    );
  }
  function run2(item) {
    return String(item?.['getAttribute']('data-provider-test-tooltip') || '')['trim']();
  }
  function run3(el3) {
    if (!el || !el3) return;
    const enabled = globalThis['window'];
    if (!enabled) return;
    const el4 = el,
      box = el3['getBoundingClientRect'](),
      box2 = el4['getBoundingClientRect'](),
      key = 24,
      index = el3['closest']('.settings-modal')?.['getBoundingClientRect']()['top'] ?? 0,
      result = Math['max'](key, index + 10),
      data = Math['max'](key, enabled['innerWidth'] - box2['width'] - key),
      options = Math['min'](data, Math['max'](key, box['left'] + box['width'] / 2 - box2['width'] / 2)),
      target = Math['max'](result, box['top'] - box2['height'] - 12),
      source = Math['min'](box2['width'] - 14, Math['max'](14, box['left'] + box['width'] / 2 - options));
    ((el4['style']['left'] = options + 'px'),
      (el4['style']['top'] = target + 'px'),
      el4['style']['setProperty']('--settings-provider-test-tooltip-arrow-left', source + 'px'));
  }
  function run4(next) {
    const enabled2 = run2(next);
    if (!enabled2) return;
    const el5 = run();
    if (!el5) return;
    ((value = next),
      (el5['textContent'] = enabled2),
      (el5['hidden'] = ![]),
      run3(next),
      el5['classList']['add']('is-visible'));
  }
  function hide(value2 = null) {
    if (value2 && value !== value2) return;
    value = null;
    if (!el) return;
    (el['classList']['remove']('is-visible'), (el['hidden'] = !![]));
  }
  function bind(el6) {
    if (!el6 || el6['dataset']['providerTestTooltipBound'] === '1') return;
    ((el6['dataset']['providerTestTooltipBound'] = '1'),
      el6['addEventListener']('pointerenter', () => run4(el6)),
      el6['addEventListener']('pointerleave', () => hide(el6)),
      el6['addEventListener']('focus', () => run4(el6)),
      el6['addEventListener']('blur', () => hide(el6)));
  }
  return { bind: bind, hide: hide };
}
