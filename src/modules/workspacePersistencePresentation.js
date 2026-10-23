import { userFacingError } from '../services/userFacingError.js';

/**
 * 把保存失败的技术错误翻译成用户能处理的话。
 *
 * 原来直接把 `response.error` 拼在「尚未保存：」后面，用户看到的是
 * `ENOSPC: no space left on device, write` 这类原文——既看不懂，也不知道该做什么。
 * 磁盘满/权限这两类能给出明确动作，其余交给 userFacingError 统一兜底。
 */
function presentSaveError(rawError) {
  const message = String(rawError || '').trim();
  if (!message) return '';
  if (/disk full|no space|ENOSPC/i.test(message))
    return '保存位置的磁盘空间不足，请腾出空间后重试。';
  if (/EACCES|EPERM|permission denied|access is denied/i.test(message))
    return '保存目录无法写入，请检查目录权限。';
  const fallback = '项目保存未完成，当前修改仍在窗口中，请稍后重试。';
  // 已经是中文的（后端已翻译过）再过一遍 userFacingError，避免重复包装成兜底文案。
  return /[\u3400-\u9fff]/u.test(message) ? userFacingError(message, fallback) : fallback;
}
export function createWorkspacePersistencePresentation({
  getRoot: getRoot,
  showDelayMs: showDelayMs = 300,
  setTimeoutFn: setTimeoutFn = globalThis.setTimeout?.bind(globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis.clearTimeout?.bind(globalThis),
} = {}) {
  let el = null,
    el2 = null,
    el3 = null,
    enabled = false,
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
      const item = response.status;
      response = { ...response2 };
      const el4 = getRoot?.(),
        el5 = el4?.ownerDocument || globalThis.document;
      if (!el4?.appendChild || !el5?.createElement) return;
      !el &&
        ((el = el5.createElement('div')),
        (el.className = 'workspace-persistence-status'),
        (el.hidden = true),
        el.setAttribute('role', 'status'),
        el.setAttribute('aria-live', 'polite'),
        (el3 = el5.createElement('span')),
        (el3.className = 'storyboard-script-loading-spinner workspace-persistence-spinner'),
        el3.setAttribute('aria-hidden', 'true'),
        (el2 = el5.createElement('span')),
        el.appendChild(el3),
        el.appendChild(el2));
      if (el.parentElement !== el4) el4.appendChild(el);
      const key = response2.status || 'idle';
      if (key === 'error') value = presentSaveError(response2.error);
      if (key === 'saved' || key === 'idle') value = '';
      const index = key === 'saving' && Number(response2.retryAttempt) > 0,
        result = key === 'error' || index || Boolean(value);
      if (key !== 'saving' || result) run();
      if (result) el.hidden = false;
      else {
        if (key !== 'saving') el.hidden = true;
        else
          (item !== 'saving' || (el.hidden && setTimeoutFn2 === null)) &&
            (run(),
            typeof setTimeoutFn === 'function'
              ? (setTimeoutFn2 = setTimeoutFn(() => {
                  setTimeoutFn2 = null;
                  if (!enabled && response.status === 'saving') el.hidden = false;
                }, showDelayMs))
              : (el.hidden = false));
      }
      (el.setAttribute('data-state', result ? 'error' : key),
        (el3.hidden = key !== 'saving'),
        (el2.textContent = index
          ? '保存失败，正在重试' + (value ? '：' + value : '')
          : key === 'error' || (value && key === 'pending')
            ? '尚未保存' +
              (Number(response2.retryAttempt) > 0 ? '，将自动重试' : '') +
              (value ? '：' + value : '')
            : '正在保存…'));
    },
    destroy() {
      ((enabled = true), run(), el?.remove?.(), (el = el2 = el3 = null));
    },
  };
}
