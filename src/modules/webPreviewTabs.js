import { normalizeWebPreviewFaviconUrl, normalizeWebPreviewUrl } from './webPreviewUrl.js';
import { t } from '../i18n/index.js';
export const WEB_PREVIEW_MAX_TABS = 8;
export const WEB_PREVIEW_DEFAULT_TAB_TITLE = '新标签页';
let nextGeneratedTabId = 0;
function nowMs(_0x2fb49b = Date.now()) {
  const _0x2b6ee4 = Number(_0x2fb49b);
  return Number.isFinite(_0x2b6ee4) && _0x2b6ee4 > 0 ? _0x2b6ee4 : Date.now();
}
function normalizeTabId(_0x3fad92) {
  return String(_0x3fad92 || '')
    .trim()
    .slice(0, 120);
}
export function getWebPreviewDefaultTabTitle() {
  return t('webPreview.tabs.defaultTitle');
}
function normalizeTitle(_0x199da8, _0x3df563 = getWebPreviewDefaultTabTitle()) {
  const _0xa49fd4 = String(_0x199da8 || '')
    .replace(/\s+/g, ' ')
    .trim();
  return (_0xa49fd4 || _0x3df563 || getWebPreviewDefaultTabTitle()).slice(0, 80);
}
function getHostLabel(_0x2e5b9b) {
  try {
    const _0x15f159 = new URL(_0x2e5b9b).hostname.replace(/^www\./i, '');
    return _0x15f159 || _0x2e5b9b;
  } catch {
    return _0x2e5b9b;
  }
}
function getOrigin(_0x256066) {
  try {
    return new URL(_0x256066).origin;
  } catch {
    return '';
  }
}
function withOptionalFavicon(_0x5e79e0, _0x15833a) {
  const _0x1d5896 = { ..._0x5e79e0 },
    _0x337051 = normalizeWebPreviewFaviconUrl(_0x15833a);
  if (_0x337051) _0x1d5896.faviconUrl = _0x337051;
  else delete _0x1d5896.faviconUrl;
  return _0x1d5896;
}
function withPendingPopup(_0x22580f, _0x4a604d) {
  if (_0x4a604d === true) return { ..._0x22580f, pendingPopup: true };
  const _0x2a8a09 = { ..._0x22580f };
  return (delete _0x2a8a09.pendingPopup, _0x2a8a09);
}
export function getWebPreviewTabDisplayTitle(_0x31f8db = {}) {
  if (!_0x31f8db?.url) return normalizeTitle(_0x31f8db?.title, getWebPreviewDefaultTabTitle());
  return normalizeTitle(_0x31f8db?.title, getHostLabel(_0x31f8db.url));
}
function createTabId(_0x1b8a41 = new Set(), _0x2b5b03 = Date.now()) {
  const _0x457863 = Math.max(1, Math.floor(Number(_0x2b5b03) || Date.now()));
  let _0x4b8a9d = '';
  do {
    ((nextGeneratedTabId += 1), (_0x4b8a9d = 'tab-' + _0x457863 + '-' + nextGeneratedTabId));
  } while (_0x1b8a41.has(_0x4b8a9d));
  return _0x4b8a9d;
}
function normalizeTab(_0x312dc6 = {}, _0x3d5039 = 0, _0xb93a21 = new Set()) {
  const _0x42c051 = normalizeWebPreviewUrl(_0x312dc6.url || _0x312dc6.webUrl) || '',
    _0x521905 = nowMs(_0x312dc6.createdAt || _0x312dc6.updatedAt || _0x312dc6.lastOpenedAt);
  let _0x4e4c11 = normalizeTabId(_0x312dc6.id);
  if (!_0x4e4c11 || _0xb93a21.has(_0x4e4c11)) _0x4e4c11 = createTabId(_0xb93a21, _0x521905 + _0x3d5039);
  return (
    _0xb93a21.add(_0x4e4c11),
    withPendingPopup(
      {
        ...withOptionalFavicon(
          {
            id: _0x4e4c11,
            title: getWebPreviewTabDisplayTitle({ title: _0x312dc6.title, url: _0x42c051 }),
            url: _0x42c051,
            createdAt: _0x521905,
            updatedAt: nowMs(_0x312dc6.updatedAt || _0x521905),
          },
          _0x312dc6.faviconUrl,
        ),
      },
      _0x312dc6.pendingPopup === true && !_0x42c051,
    )
  );
}
export function createWebPreviewTab(
  {
    id: id = '',
    title: title = '',
    url: url = '',
    faviconUrl: faviconUrl = '',
    pendingPopup: pendingPopup = false,
    now: _0x592ba6,
  } = {},
  _0x1a5cfb = new Set(),
) {
  const _0xd25b4f = normalizeWebPreviewUrl(url) || '',
    _0x4fdcf9 = nowMs(_0x592ba6);
  let _0x17d7f6 = normalizeTabId(id);
  if (!_0x17d7f6 || _0x1a5cfb.has(_0x17d7f6)) _0x17d7f6 = createTabId(_0x1a5cfb, _0x4fdcf9);
  return (
    _0x1a5cfb.add(_0x17d7f6),
    withPendingPopup(
      withOptionalFavicon(
        {
          id: _0x17d7f6,
          title: getWebPreviewTabDisplayTitle({ title: title, url: _0xd25b4f }),
          url: _0xd25b4f,
          createdAt: _0x4fdcf9,
          updatedAt: _0x4fdcf9,
        },
        faviconUrl,
      ),
      pendingPopup === true && !_0xd25b4f,
    )
  );
}
export function normalizeWebPreviewTabs(_0x5c2046 = {}) {
  const _0xc4800f = new Set(),
    _0x213581 = Array.isArray(_0x5c2046.webTabs) ? _0x5c2046.webTabs : [];
  let _0x19c8dc = _0x213581.map((_0x14cbde, _0x3ccf15) => normalizeTab(_0x14cbde, _0x3ccf15, _0xc4800f));
  if (_0x19c8dc.length === 0) {
    const _0x50f7d9 = normalizeWebPreviewUrl(_0x5c2046.webUrl) || '';
    _0x19c8dc = [
      createWebPreviewTab(
        {
          id: normalizeTabId(_0x5c2046.activeTabId) || 'tab-main',
          title: _0x50f7d9 ? _0x5c2046.webTitle || '' : getWebPreviewDefaultTabTitle(),
          url: _0x50f7d9,
          now: _0x5c2046.updatedAt || _0x5c2046.createdAt,
        },
        _0xc4800f,
      ),
    ];
  }
  _0x19c8dc = _0x19c8dc.slice(0, WEB_PREVIEW_MAX_TABS);
  const _0x3b132a = normalizeTabId(_0x5c2046.activeTabId),
    _0x59310f = normalizeWebPreviewUrl(_0x5c2046.webUrl) || '',
    _0xd9815d = _0x59310f ? _0x19c8dc.find((_0x571995) => _0x571995.url === _0x59310f) : null,
    _0x447aec = _0x19c8dc.find((_0x2bd09a) => _0x2bd09a.id === _0x3b132a) || _0xd9815d || _0x19c8dc[0];
  return { tabs: _0x19c8dc, activeTabId: _0x447aec.id, activeTab: _0x447aec, webUrl: _0x447aec.url || '' };
}
function buildTabsPatch(_0x44c80e, _0x2f00a0) {
  const _0x28957a = normalizeWebPreviewTabs({ webTabs: _0x44c80e, activeTabId: _0x2f00a0 });
  return { webTabs: _0x28957a.tabs, activeTabId: _0x28957a.activeTabId, webUrl: _0x28957a.webUrl };
}
export function getWebPreviewActiveTab(_0x130c3d = {}) {
  return normalizeWebPreviewTabs(_0x130c3d).activeTab;
}
export function getWebPreviewActiveTabUrl(_0x2d6a46 = {}) {
  return normalizeWebPreviewTabs(_0x2d6a46).webUrl;
}
export function activateWebPreviewTabData(_0x425eb4 = {}, _0xed6d00) {
  const _0x4b796d = normalizeWebPreviewTabs(_0x425eb4),
    _0x495cb2 = _0x4b796d.tabs.find((_0x1fe39a) => _0x1fe39a.id === normalizeTabId(_0xed6d00));
  if (!_0x495cb2)
    return {
      ok: false,
      error: 'missing-tab',
      state: _0x4b796d,
      patch: buildTabsPatch(_0x4b796d.tabs, _0x4b796d.activeTabId),
    };
  return {
    ok: true,
    tabId: _0x495cb2.id,
    state: { ..._0x4b796d, activeTabId: _0x495cb2.id, activeTab: _0x495cb2, webUrl: _0x495cb2.url },
    patch: buildTabsPatch(_0x4b796d.tabs, _0x495cb2.id),
  };
}
export function addWebPreviewTabData(
  _0x38769a = {},
  { id: id = '', title: title = '', url: url = '', pendingPopup: pendingPopup = false, now: _0xff7e0b } = {},
) {
  const _0x1fb828 = normalizeWebPreviewTabs(_0x38769a);
  if (_0x1fb828.tabs.length >= WEB_PREVIEW_MAX_TABS)
    return {
      ok: false,
      error: 'max-tabs',
      state: _0x1fb828,
      patch: buildTabsPatch(_0x1fb828.tabs, _0x1fb828.activeTabId),
    };
  const _0x49272a = new Set(_0x1fb828.tabs.map((_0x5e61b1) => _0x5e61b1.id)),
    _0x552774 = createWebPreviewTab(
      { id: id, title: title, url: url, pendingPopup: pendingPopup, now: _0xff7e0b },
      _0x49272a,
    ),
    _0x1c777a = [..._0x1fb828.tabs, _0x552774];
  return {
    ok: true,
    tabId: _0x552774.id,
    tab: _0x552774,
    state: { tabs: _0x1c777a, activeTabId: _0x552774.id, activeTab: _0x552774, webUrl: _0x552774.url },
    patch: buildTabsPatch(_0x1c777a, _0x552774.id),
  };
}
export function closeWebPreviewTabData(_0xbfda45 = {}, _0x48e684) {
  const _0x2a01b2 = normalizeWebPreviewTabs(_0xbfda45),
    _0x9d50d9 = normalizeTabId(_0x48e684) || _0x2a01b2.activeTabId,
    _0x5ddca0 = _0x2a01b2.tabs.findIndex((_0x1c6422) => _0x1c6422.id === _0x9d50d9);
  if (_0x5ddca0 < 0)
    return {
      ok: false,
      error: 'missing-tab',
      state: _0x2a01b2,
      patch: buildTabsPatch(_0x2a01b2.tabs, _0x2a01b2.activeTabId),
    };
  if (_0x2a01b2.tabs.length <= 1) {
    const _0x58ddfe = createWebPreviewTab({}, new Set());
    return {
      ok: true,
      tabId: _0x58ddfe.id,
      closedTabId: _0x9d50d9,
      state: { tabs: [_0x58ddfe], activeTabId: _0x58ddfe.id, activeTab: _0x58ddfe, webUrl: '' },
      patch: buildTabsPatch([_0x58ddfe], _0x58ddfe.id),
    };
  }
  const _0x33f0aa = _0x2a01b2.tabs.filter((_0x93bb2f) => _0x93bb2f.id !== _0x9d50d9);
  let _0x103b46 = _0x2a01b2.activeTabId;
  _0x9d50d9 === _0x2a01b2.activeTabId &&
    (_0x103b46 = _0x33f0aa[Math.min(_0x5ddca0, _0x33f0aa.length - 1)]?.id || _0x33f0aa[0].id);
  const _0x39ea74 = _0x33f0aa.find((_0x199237) => _0x199237.id === _0x103b46) || _0x33f0aa[0];
  return {
    ok: true,
    tabId: _0x39ea74.id,
    closedTabId: _0x9d50d9,
    state: { tabs: _0x33f0aa, activeTabId: _0x39ea74.id, activeTab: _0x39ea74, webUrl: _0x39ea74.url },
    patch: buildTabsPatch(_0x33f0aa, _0x39ea74.id),
  };
}
export function updateWebPreviewTabUrlData(
  _0x30ddf5 = {},
  { tabId: _0x496ef5, url: _0x3386b9, title: title = '', now: _0xa83989, activate: activate = true } = {},
) {
  const _0x4c791d = normalizeWebPreviewUrl(_0x3386b9);
  if (!_0x4c791d)
    return { ok: false, error: 'invalid-url', state: normalizeWebPreviewTabs(_0x30ddf5), patch: null };
  const _0x2a1ad4 = normalizeWebPreviewTabs(_0x30ddf5),
    _0x5bc77d = normalizeTabId(_0x496ef5) || _0x2a1ad4.activeTabId,
    _0x51e04f = nowMs(_0xa83989);
  let _0x1f7f6f = null;
  const _0x596225 = _0x2a1ad4.tabs.map((_0x180921) => {
    if (_0x180921.id !== _0x5bc77d) return _0x180921;
    const _0x162e58 = !title && _0x180921.url === _0x4c791d;
    return (
      (_0x1f7f6f = {
        ..._0x180921,
        url: _0x4c791d,
        title: getWebPreviewTabDisplayTitle({ title: _0x162e58 ? _0x180921.title : title, url: _0x4c791d }),
        updatedAt: _0x51e04f,
      }),
      delete _0x1f7f6f.pendingPopup,
      getOrigin(_0x180921.url) !== getOrigin(_0x4c791d) && delete _0x1f7f6f.faviconUrl,
      _0x1f7f6f
    );
  });
  if (!_0x1f7f6f)
    return {
      ok: false,
      error: 'missing-tab',
      state: _0x2a1ad4,
      patch: buildTabsPatch(_0x2a1ad4.tabs, _0x2a1ad4.activeTabId),
    };
  const _0x4b9f1a = activate ? _0x1f7f6f.id : _0x2a1ad4.activeTabId,
    _0x341565 = _0x596225.find((_0x27af9e) => _0x27af9e.id === _0x4b9f1a) || _0x1f7f6f;
  return {
    ok: true,
    tabId: _0x1f7f6f.id,
    tab: _0x1f7f6f,
    state: { tabs: _0x596225, activeTabId: _0x341565.id, activeTab: _0x341565, webUrl: _0x341565.url },
    patch: buildTabsPatch(_0x596225, _0x341565.id),
  };
}
export function updateWebPreviewTabFaviconData(
  _0x2bf8b1 = {},
  { tabId: _0x227c27, faviconUrl: _0x165f55, now: _0x556b93 } = {},
) {
  const _0x8dfa94 = normalizeWebPreviewFaviconUrl(_0x165f55);
  if (!_0x8dfa94)
    return {
      ok: false,
      error: 'invalid-favicon-url',
      state: normalizeWebPreviewTabs(_0x2bf8b1),
      patch: null,
    };
  const _0x1c1101 = normalizeWebPreviewTabs(_0x2bf8b1),
    _0x1ba021 = normalizeTabId(_0x227c27) || _0x1c1101.activeTabId,
    _0x1f689b = nowMs(_0x556b93);
  let _0x354303 = null;
  const _0x2661dc = _0x1c1101.tabs.map((_0x15df7d) => {
    if (_0x15df7d.id !== _0x1ba021) return _0x15df7d;
    return ((_0x354303 = { ..._0x15df7d, faviconUrl: _0x8dfa94, updatedAt: _0x1f689b }), _0x354303);
  });
  if (!_0x354303)
    return {
      ok: false,
      error: 'missing-tab',
      state: _0x1c1101,
      patch: buildTabsPatch(_0x1c1101.tabs, _0x1c1101.activeTabId),
    };
  return {
    ok: true,
    tabId: _0x354303.id,
    tab: _0x354303,
    state: {
      tabs: _0x2661dc,
      activeTabId: _0x1c1101.activeTabId,
      activeTab: _0x2661dc.find((_0x32a29f) => _0x32a29f.id === _0x1c1101.activeTabId) || _0x354303,
      webUrl: _0x1c1101.webUrl,
    },
    patch: buildTabsPatch(_0x2661dc, _0x1c1101.activeTabId),
  };
}
