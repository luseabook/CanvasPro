import { normalizeWebPreviewFaviconUrl, normalizeWebPreviewUrl } from './webPreviewUrl.js';
import { t } from '../i18n/index.js';
export const WEB_PREVIEW_MAX_TABS = 8;
export const WEB_PREVIEW_DEFAULT_TAB_TITLE = '新标签页';
let nextGeneratedTabId = 0;
function nowMs(value = Date.now()) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : Date.now();
}
function normalizeTabId(item) {
  return String(item || '')
    .trim()
    .slice(0, 120);
}
export function getWebPreviewDefaultTabTitle() {
  return t('webPreview.tabs.defaultTitle');
}
function normalizeTitle(key, webPreviewDefaultTabTitle = getWebPreviewDefaultTabTitle()) {
  const index = String(key || '')
    .replace(/\s+/g, ' ')
    .trim();
  return (index || webPreviewDefaultTabTitle || getWebPreviewDefaultTabTitle()).slice(0, 80);
}
function getHostLabel(result) {
  try {
    const uRL = new URL(result).hostname.replace(/^www\./i, '');
    return uRL || result;
  } catch {
    return result;
  }
}
function getOrigin(data) {
  try {
    return new URL(data).origin;
  } catch {
    return '';
  }
}
function withOptionalFavicon(args, options) {
  const target = { ...args },
    webPreviewFaviconUrl = normalizeWebPreviewFaviconUrl(options);
  if (webPreviewFaviconUrl) target.faviconUrl = webPreviewFaviconUrl;
  else delete target.faviconUrl;
  return target;
}
function withPendingPopup(args2, source) {
  if (source === true) return { ...args2, pendingPopup: true };
  const next = { ...args2 };
  return (delete next.pendingPopup, next);
}
export function getWebPreviewTabDisplayTitle(response = {}) {
  if (!response?.url) return normalizeTitle(response?.title, getWebPreviewDefaultTabTitle());
  return normalizeTitle(response?.title, getHostLabel(response.url));
}
function createTabId(map = new Set(), current = Date.now()) {
  const entry = Math.max(1, Math.floor(Number(current) || Date.now()));
  let record = '';
  do {
    ((nextGeneratedTabId += 1), (record = 'tab-' + entry + '-' + nextGeneratedTabId));
  } while (map.has(record));
  return record;
}
function normalizeTab(title2 = {}, payload = 0, map2 = new Set()) {
  const url2 = normalizeWebPreviewUrl(title2.url || title2.webUrl) || '',
    createdAt = nowMs(title2.createdAt || title2.updatedAt || title2.lastOpenedAt);
  let id2 = normalizeTabId(title2.id);
  if (!id2 || map2.has(id2)) id2 = createTabId(map2, createdAt + payload);
  return (
    map2.add(id2),
    withPendingPopup(
      {
        ...withOptionalFavicon(
          {
            id: id2,
            title: getWebPreviewTabDisplayTitle({ title: title2.title, url: url2 }),
            url: url2,
            createdAt: createdAt,
            updatedAt: nowMs(title2.updatedAt || createdAt),
          },
          title2.faviconUrl,
        ),
      },
      title2.pendingPopup === true && !url2,
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
    now: now,
  } = {},
  map3 = new Set(),
) {
  const url3 = normalizeWebPreviewUrl(url) || '',
    createdAt2 = nowMs(now);
  let id3 = normalizeTabId(id);
  if (!id3 || map3.has(id3)) id3 = createTabId(map3, createdAt2);
  return (
    map3.add(id3),
    withPendingPopup(
      withOptionalFavicon(
        {
          id: id3,
          title: getWebPreviewTabDisplayTitle({ title: title, url: url3 }),
          url: url3,
          createdAt: createdAt2,
          updatedAt: createdAt2,
        },
        faviconUrl,
      ),
      pendingPopup === true && !url3,
    )
  );
}
export function normalizeWebPreviewTabs(now2 = {}) {
  const handle = new Set(),
    list = Array.isArray(now2.webTabs) ? now2.webTabs : [];
  let tabs = list.map((item2, state) => normalizeTab(item2, state, handle));
  if (tabs.length === 0) {
    const title3 = normalizeWebPreviewUrl(now2.webUrl) || '';
    tabs = [
      createWebPreviewTab(
        {
          id: normalizeTabId(now2.activeTabId) || 'tab-main',
          title: title3 ? now2.webTitle || '' : getWebPreviewDefaultTabTitle(),
          url: title3,
          now: now2.updatedAt || now2.createdAt,
        },
        handle,
      ),
    ];
  }
  tabs = tabs.slice(0, WEB_PREVIEW_MAX_TABS);
  const tabId = normalizeTabId(now2.activeTabId),
    webPreviewUrl = normalizeWebPreviewUrl(now2.webUrl) || '',
    config = webPreviewUrl ? tabs.find((response2) => response2.url === webPreviewUrl) : null,
    activeTabId = tabs.find((item3) => item3.id === tabId) || config || tabs[0];
  return { tabs: tabs, activeTabId: activeTabId.id, activeTab: activeTabId, webUrl: activeTabId.url || '' };
}
function buildTabsPatch(webTabs, activeTabId2) {
  const webTabs2 = normalizeWebPreviewTabs({ webTabs: webTabs, activeTabId: activeTabId2 });
  return { webTabs: webTabs2.tabs, activeTabId: webTabs2.activeTabId, webUrl: webTabs2.webUrl };
}
export function getWebPreviewActiveTab(options2 = {}) {
  return normalizeWebPreviewTabs(options2).activeTab;
}
export function getWebPreviewActiveTabUrl(options3 = {}) {
  return normalizeWebPreviewTabs(options3).webUrl;
}
export function activateWebPreviewTabData(options4 = {}, scope) {
  const state2 = normalizeWebPreviewTabs(options4),
    tabId2 = state2.tabs.find((item4) => item4.id === normalizeTabId(scope));
  if (!tabId2)
    return {
      ok: false,
      error: 'missing-tab',
      state: state2,
      patch: buildTabsPatch(state2.tabs, state2.activeTabId),
    };
  return {
    ok: true,
    tabId: tabId2.id,
    state: { ...state2, activeTabId: tabId2.id, activeTab: tabId2, webUrl: tabId2.url },
    patch: buildTabsPatch(state2.tabs, tabId2.id),
  };
}
export function addWebPreviewTabData(
  options5 = {},
  { id: id = '', title: title = '', url: url = '', pendingPopup: pendingPopup = false, now: now3 } = {},
) {
  const state3 = normalizeWebPreviewTabs(options5);
  if (state3.tabs.length >= WEB_PREVIEW_MAX_TABS)
    return {
      ok: false,
      error: 'max-tabs',
      state: state3,
      patch: buildTabsPatch(state3.tabs, state3.activeTabId),
    };
  const input = new Set(state3.tabs.map((item5) => item5.id)),
    tabId3 = createWebPreviewTab(
      { id: id, title: title, url: url, pendingPopup: pendingPopup, now: now3 },
      input,
    ),
    tabs2 = [...state3.tabs, tabId3];
  return {
    ok: true,
    tabId: tabId3.id,
    tab: tabId3,
    state: { tabs: tabs2, activeTabId: tabId3.id, activeTab: tabId3, webUrl: tabId3.url },
    patch: buildTabsPatch(tabs2, tabId3.id),
  };
}
export function closeWebPreviewTabData(options6 = {}, output) {
  const state4 = normalizeWebPreviewTabs(options6),
    closedTabId = normalizeTabId(output) || state4.activeTabId,
    count2 = state4.tabs.findIndex((item6) => item6.id === closedTabId);
  if (count2 < 0)
    return {
      ok: false,
      error: 'missing-tab',
      state: state4,
      patch: buildTabsPatch(state4.tabs, state4.activeTabId),
    };
  if (state4.tabs.length <= 1) {
    const tabId4 = createWebPreviewTab({}, new Set());
    return {
      ok: true,
      tabId: tabId4.id,
      closedTabId: closedTabId,
      state: { tabs: [tabId4], activeTabId: tabId4.id, activeTab: tabId4, webUrl: '' },
      patch: buildTabsPatch([tabId4], tabId4.id),
    };
  }
  const tabs3 = state4.tabs.filter((item7) => item7.id !== closedTabId);
  let value2 = state4.activeTabId;
  closedTabId === state4.activeTabId &&
    (value2 = tabs3[Math.min(count2, tabs3.length - 1)]?.id || tabs3[0].id);
  const tabId5 = tabs3.find((item8) => item8.id === value2) || tabs3[0];
  return {
    ok: true,
    tabId: tabId5.id,
    closedTabId: closedTabId,
    state: { tabs: tabs3, activeTabId: tabId5.id, activeTab: tabId5, webUrl: tabId5.url },
    patch: buildTabsPatch(tabs3, tabId5.id),
  };
}
export function updateWebPreviewTabUrlData(
  options7 = {},
  { tabId: tabId6, url: url4, title: title = '', now: now4, activate: activate = true } = {},
) {
  const url5 = normalizeWebPreviewUrl(url4);
  if (!url5)
    return { ok: false, error: 'invalid-url', state: normalizeWebPreviewTabs(options7), patch: null };
  const state5 = normalizeWebPreviewTabs(options7),
    tabId7 = normalizeTabId(tabId6) || state5.activeTabId,
    updatedAt = nowMs(now4);
  let tabId8 = null;
  const tabs4 = state5.tabs.map((response3) => {
    if (response3.id !== tabId7) return response3;
    const title4 = !title && response3.url === url5;
    return (
      (tabId8 = {
        ...response3,
        url: url5,
        title: getWebPreviewTabDisplayTitle({ title: title4 ? response3.title : title, url: url5 }),
        updatedAt: updatedAt,
      }),
      delete tabId8.pendingPopup,
      getOrigin(response3.url) !== getOrigin(url5) && delete tabId8.faviconUrl,
      tabId8
    );
  });
  if (!tabId8)
    return {
      ok: false,
      error: 'missing-tab',
      state: state5,
      patch: buildTabsPatch(state5.tabs, state5.activeTabId),
    };
  const value3 = activate ? tabId8.id : state5.activeTabId,
    activeTabId3 = tabs4.find((item9) => item9.id === value3) || tabId8;
  return {
    ok: true,
    tabId: tabId8.id,
    tab: tabId8,
    state: { tabs: tabs4, activeTabId: activeTabId3.id, activeTab: activeTabId3, webUrl: activeTabId3.url },
    patch: buildTabsPatch(tabs4, activeTabId3.id),
  };
}
export function updateWebPreviewTabFaviconData(
  options8 = {},
  { tabId: tabId9, faviconUrl: faviconUrl2, now: now5 } = {},
) {
  const faviconUrl3 = normalizeWebPreviewFaviconUrl(faviconUrl2);
  if (!faviconUrl3)
    return {
      ok: false,
      error: 'invalid-favicon-url',
      state: normalizeWebPreviewTabs(options8),
      patch: null,
    };
  const state6 = normalizeWebPreviewTabs(options8),
    tabId10 = normalizeTabId(tabId9) || state6.activeTabId,
    updatedAt2 = nowMs(now5);
  let tabId11 = null;
  const tabs5 = state6.tabs.map((args3) => {
    if (args3.id !== tabId10) return args3;
    return ((tabId11 = { ...args3, faviconUrl: faviconUrl3, updatedAt: updatedAt2 }), tabId11);
  });
  if (!tabId11)
    return {
      ok: false,
      error: 'missing-tab',
      state: state6,
      patch: buildTabsPatch(state6.tabs, state6.activeTabId),
    };
  return {
    ok: true,
    tabId: tabId11.id,
    tab: tabId11,
    state: {
      tabs: tabs5,
      activeTabId: state6.activeTabId,
      activeTab: tabs5.find((item10) => item10.id === state6.activeTabId) || tabId11,
      webUrl: state6.webUrl,
    },
    patch: buildTabsPatch(tabs5, state6.activeTabId),
  };
}
