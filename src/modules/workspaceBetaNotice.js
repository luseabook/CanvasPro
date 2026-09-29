function hasSeenWorkspaceBetaNotice(_0x217ae7, _0x5e7031) {
  try {
    return _0x217ae7?.['localStorage']?.['getItem']?.(_0x5e7031) === '1';
  } catch {
    return ![];
  }
}
function markWorkspaceBetaNoticeSeen(_0x2aec45, _0x2ba45b) {
  try {
    return (_0x2aec45?.['localStorage']?.['setItem']?.(_0x2ba45b, '1'), !![]);
  } catch {
    return ![];
  }
}
export function hasSeenBetaNotice({
  windowObject: windowObject = globalThis['window'],
  storageKey: storageKey = '',
} = {}) {
  return hasSeenWorkspaceBetaNotice(windowObject, storageKey);
}
export function markBetaNoticeSeen({
  windowObject: windowObject = globalThis['window'],
  storageKey: storageKey = '',
} = {}) {
  return markWorkspaceBetaNoticeSeen(windowObject, storageKey);
}
export function showWorkspaceBetaNotice({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  storageKey: storageKey = '',
  title: title = '',
  message: message = '',
} = {}) {
  if (!documentObject?.['body']) return ![];
  if (hasSeenWorkspaceBetaNotice(windowObject, storageKey)) return ![];
  markWorkspaceBetaNoticeSeen(windowObject, storageKey);
  const _0xdbeca7 = 'story-beta-notice-overlay',
    _0xc4b13e = documentObject['getElementById'](_0xdbeca7);
  typeof _0xc4b13e?.['_workspaceNoticeClose'] === 'function'
    ? _0xc4b13e['_workspaceNoticeClose']()
    : _0xc4b13e?.['remove']();
  const _0x19d403 = documentObject['createElement']('div');
  ((_0x19d403['id'] = _0xdbeca7),
    (_0x19d403['className'] = 'custom-confirm-overlay'),
    (_0x19d403['dataset']['workspaceModeNotice'] = '1'));
  const _0x274cc4 = documentObject['createElement']('div');
  _0x274cc4['className'] = 'custom-confirm-box';
  const _0x635899 = documentObject['createElement']('div');
  ((_0x635899['className'] = 'confirm-title'), (_0x635899['textContent'] = title));
  const _0x13ec64 = documentObject['createElement']('div');
  ((_0x13ec64['className'] = 'confirm-msg'), (_0x13ec64['textContent'] = message));
  const _0xf648eb = documentObject['createElement']('div');
  _0xf648eb['className'] = 'confirm-btns';
  const _0x434cf0 = documentObject['createElement']('button');
  ((_0x434cf0['type'] = 'button'),
    (_0x434cf0['className'] = 'confirm-btn confirm-ok'),
    (_0x434cf0['textContent'] = '我知道了'));
  let _0x48678c = ![];
  const _0xe92135 = (_0x5382b9) => {
      if (_0x5382b9['key'] !== 'Escape') return;
      (_0x5382b9['preventDefault'](), _0xd1806c());
    },
    _0xd1806c = () => {
      if (_0x48678c) return;
      ((_0x48678c = !![]),
        documentObject['removeEventListener']('keydown', _0xe92135, !![]),
        _0x19d403['remove']());
    };
  return (
    (_0x19d403['_workspaceNoticeClose'] = _0xd1806c),
    _0x434cf0['addEventListener']('click', _0xd1806c),
    _0x19d403['addEventListener']('click', (_0x29ee25) => {
      if (_0x29ee25['target'] === _0x19d403) _0xd1806c();
    }),
    _0xf648eb['appendChild'](_0x434cf0),
    _0x274cc4['append'](_0x635899, _0x13ec64, _0xf648eb),
    _0x19d403['appendChild'](_0x274cc4),
    documentObject['body']['appendChild'](_0x19d403),
    documentObject['addEventListener']('keydown', _0xe92135, !![]),
    _0x434cf0['focus']?.(),
    !![]
  );
}
