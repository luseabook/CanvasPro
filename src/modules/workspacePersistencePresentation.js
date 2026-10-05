export function createWorkspacePersistencePresentation({
  getRoot: getRoot,
  showDelayMs: showDelayMs = 300,
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout']?.['bind'](globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout']?.['bind'](globalThis),
} = {}) {
  let el = null,
    el2 = null,
    el3 = null,
    enabled = ![],
    value = '',
    setTimeoutFn2 = null,
    response = { status: 'idle' };
  const run = () => {
    if (setTimeoutFn2 !== null) clearTimeoutFn?.(setTimeoutFn2);
    setTimeoutFn2 = null;
  };
  return {
    update(response2 = {}) {
      if (enabled) return;
      const item = response['status'];
      response = { ...response2 };
      const el4 = getRoot?.(),
        el5 = el4?.['ownerDocument'] || globalThis['document'];
      if (!el4?.['appendChild'] || !el5?.['createElement']) return;
      !el &&
        ((el = el5['createElement']('div')),
        (el['className'] = 'workspace-persistence-status'),
        (el['hidden'] = !![]),
        el['setAttribute']('role', 'status'),
        el['setAttribute']('aria-live', 'polite'),
        (el3 = el5['createElement']('span')),
        (el3['className'] = 'storyboard-script-loading-spinner workspace-persistence-spinner'),
        el3['setAttribute']('aria-hidden', 'true'),
        (el2 = el5['createElement']('span')),
        el['appendChild'](el3),
        el['appendChild'](el2));
      if (el['parentElement'] !== el4) el4['appendChild'](el);
      const key = response2['status'] || 'idle';
      if (key === 'error') value = String(response2['error'] || '');
      if (key === 'saved' || key === 'idle') value = '';
      const index = key === 'saving' && Number(response2['retryAttempt']) > 0,
        result = key === 'error' || index || Boolean(value);
      if (key !== 'saving' || result) run();
      if (result) el['hidden'] = ![];
      else {
        if (key !== 'saving') el['hidden'] = !![];
        else
          (item !== 'saving' || (el['hidden'] && setTimeoutFn2 === null)) &&
            (run(),
            typeof setTimeoutFn === 'function'
              ? (setTimeoutFn2 = setTimeoutFn(() => {
                  setTimeoutFn2 = null;
                  if (!enabled && response['status'] === 'saving') el['hidden'] = ![];
                }, showDelayMs))
              : (el['hidden'] = ![]));
      }
      (el['setAttribute']('data-state', result ? 'error' : key),
        (el3['hidden'] = key !== 'saving'),
        (el2['textContent'] = index
          ? '保存失败，正在重试' + (value ? '：' + value : '')
          : key === 'error' || (value && key === 'pending')
            ? '尚未保存' +
              (Number(response2['retryAttempt']) > 0 ? '，将自动重试' : '') +
              (value ? '：' + value : '')
            : '正在保存…'));
    },
    destroy() {
      ((enabled = !![]), run(), el?.['remove']?.(), (el = el2 = el3 = null));
    },
  };
}
