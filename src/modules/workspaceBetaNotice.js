function hasSeenWorkspaceBetaNotice(value, item) {
  try {
    return value?.localStorage?.getItem?.(item) === '1';
  } catch {
    return false;
  }
}
function markWorkspaceBetaNoticeSeen(key, index) {
  try {
    return (key?.localStorage?.setItem?.(index, '1'), true);
  } catch {
    return false;
  }
}
export function hasSeenBetaNotice({
  windowObject: windowObject = globalThis.window,
  storageKey: storageKey = '',
} = {}) {
  return hasSeenWorkspaceBetaNotice(windowObject, storageKey);
}
export function markBetaNoticeSeen({
  windowObject: windowObject = globalThis.window,
  storageKey: storageKey = '',
} = {}) {
  return markWorkspaceBetaNoticeSeen(windowObject, storageKey);
}
export function showWorkspaceBetaNotice({
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window,
  storageKey: storageKey = '',
  title: title = '',
  message: message = '',
  onConfirm: onConfirm = null,
} = {}) {
  if (!documentObject?.body) return false;
  if (hasSeenWorkspaceBetaNotice(windowObject, storageKey)) return false;
  markWorkspaceBetaNoticeSeen(windowObject, storageKey);
  const result = 'story-beta-notice-overlay',
    el = documentObject.getElementById(result);
  typeof el?._workspaceNoticeClose === 'function' ? el._workspaceNoticeClose() : el?.remove();
  const el2 = documentObject.createElement('div');
  ((el2.id = result),
    (el2.className = 'custom-confirm-overlay'),
    (el2.dataset.workspaceModeNotice = '1'));
  const data = documentObject.createElement('div');
  data.className = 'custom-confirm-box';
  const el3 = documentObject.createElement('div');
  ((el3.className = 'confirm-title'), (el3.textContent = title));
  const el4 = documentObject.createElement('div');
  ((el4.className = 'confirm-msg'), (el4.textContent = message));
  const el5 = documentObject.createElement('div');
  el5.className = 'confirm-btns';
  const el6 = documentObject.createElement('button');
  ((el6.type = 'button'),
    (el6.className = 'confirm-btn confirm-ok'),
    (el6.textContent = '我知道了'));
  let options = false;
  const target = (event) => {
      if (event.key !== 'Escape') return;
      (event.preventDefault(), handler());
    },
    handler = () => {
      if (options) return;
      ((options = true), documentObject.removeEventListener('keydown', target, true), el2.remove());
      onConfirm?.();
    };
  return (
    (el2._workspaceNoticeClose = handler),
    el6.addEventListener('click', handler),
    el2.addEventListener('click', (event2) => {
      if (event2.target === el2) handler();
    }),
    el5.appendChild(el6),
    data.append(el3, el4, el5),
    el2.appendChild(data),
    documentObject.body.appendChild(el2),
    documentObject.addEventListener('keydown', target, true),
    el6.focus?.(),
    true
  );
}
