import { normalizeWebPreviewUrl } from '../modules/webPreviewUrl.js';
export const WEB_PREVIEW_START_PAGE_STORAGE_KEY = 'ai_canvas_web_preview_start_page_v1';
export const WEB_PREVIEW_START_PAGE_SCHEMA_VERSION = 1;
export const WEB_PREVIEW_START_PAGE_MAX_HISTORY = 50;
export const WEB_PREVIEW_START_PAGE_MAX_TILES = 8;
function getStorage(value) {
  if (value) return value;
  return globalThis.localStorage || globalThis.window?.localStorage || null;
}
function nowMs(item = Date.now()) {
  const count = Number(item);
  return Number.isFinite(count) && count > 0 ? count : Date.now();
}
function readRawState(key) {
  try {
    const storage = getStorage(key)?.getItem?.(WEB_PREVIEW_START_PAGE_STORAGE_KEY);
    return storage ? JSON.parse(storage) : null;
  } catch {
    return null;
  }
}
function writeRawState(index, result) {
  try {
    return (getStorage(result)?.setItem?.(WEB_PREVIEW_START_PAGE_STORAGE_KEY, JSON.stringify(index)), true);
  } catch {
    return false;
  }
}
function createEmptyState() {
  return {
    schemaVersion: WEB_PREVIEW_START_PAGE_SCHEMA_VERSION,
    shortcuts: [],
    history: [],
    hiddenHistoryUrls: [],
  };
}
function normalizeTitle(data, options = '') {
  const target = String(data || '')
    .replace(/\s+/g, ' ')
    .trim();
  return (target || options || '').slice(0, 80);
}
function getHostLabel(source) {
  try {
    const uRL = new URL(source).hostname.replace(/^www\./i, '');
    return uRL || source;
  } catch {
    return source;
  }
}
export function getWebPreviewDisplayTitle({ title: title, url: url } = {}) {
  const webPreviewUrl = normalizeWebPreviewUrl(url),
    next = webPreviewUrl ? getHostLabel(webPreviewUrl) : '';
  return normalizeTitle(title, next);
}
export function getWebPreviewTileIconLabel({ title: title2, url: url2 } = {}) {
  const args = getWebPreviewDisplayTitle({ title: title2, url: url2 }),
    current = [...args].find((item2) => /[\p{L}\p{N}]/u.test(item2));
  return (current || '+').toUpperCase();
}
function normalizeHiddenUrls(entry) {
  const record = Array.isArray(entry) ? entry : [],
    map = new Set(),
    list = [];
  for (const payload of record) {
    const webPreviewUrl2 = normalizeWebPreviewUrl(payload);
    if (!webPreviewUrl2 || map.has(webPreviewUrl2)) continue;
    (map.add(webPreviewUrl2), list.push(webPreviewUrl2));
  }
  return list;
}
function normalizeShortcut(title3, handle) {
  const url3 = normalizeWebPreviewUrl(title3?.url);
  if (!url3) return null;
  const createdAt = nowMs(title3?.createdAt || title3?.updatedAt || title3?.lastOpenedAt);
  return {
    id: normalizeTitle(title3?.id, 'shortcut-' + createdAt + '-' + handle).slice(0, 120),
    title: getWebPreviewDisplayTitle({ title: title3?.title, url: url3 }),
    url: url3,
    pinned: title3?.pinned !== false,
    createdAt: createdAt,
    updatedAt: nowMs(title3?.updatedAt || createdAt),
    lastOpenedAt: Number(title3?.lastOpenedAt || 0) || 0,
    order: Number.isFinite(Number(title3?.order)) ? Number(title3.order) : handle,
  };
}
function normalizeHistoryItem(title4) {
  const url4 = normalizeWebPreviewUrl(title4?.url);
  if (!url4) return null;
  return {
    url: url4,
    title: getWebPreviewDisplayTitle({ title: title4?.title, url: url4 }),
    lastVisitedAt: nowMs(title4?.lastVisitedAt),
    visitCount: Math.max(1, Number.parseInt(title4?.visitCount, 10) || 1),
  };
}
function normalizeState(state) {
  const config = state && typeof state === 'object' ? state : createEmptyState(),
    map2 = new Map(),
    shortcuts = [];
  for (const [scope, input] of (Array.isArray(config.shortcuts) ? config.shortcuts : []).entries()) {
    const response = normalizeShortcut(input, scope);
    if (!response) continue;
    const output = map2.get(response.url);
    if (output) {
      ((output.title = response.title || output.title),
        (output.pinned = output.pinned || response.pinned),
        (output.updatedAt = Math.max(output.updatedAt, response.updatedAt)),
        (output.lastOpenedAt = Math.max(output.lastOpenedAt, response.lastOpenedAt)),
        (output.order = Math.min(output.order, response.order)));
      continue;
    }
    (map2.set(response.url, response), shortcuts.push(response));
  }
  const map3 = new Map();
  for (const value2 of Array.isArray(config.history) ? config.history : []) {
    const response2 = normalizeHistoryItem(value2);
    if (!response2) continue;
    const value3 = map3.get(response2.url);
    value3
      ? ((value3.title = response2.title || value3.title),
        (value3.lastVisitedAt = Math.max(value3.lastVisitedAt, response2.lastVisitedAt)),
        (value3.visitCount += response2.visitCount))
      : map3.set(response2.url, response2);
  }
  const history = [...map3.values()]
    .sort((item3, value4) => value4.lastVisitedAt - item3.lastVisitedAt)
    .slice(0, WEB_PREVIEW_START_PAGE_MAX_HISTORY);
  return {
    schemaVersion: WEB_PREVIEW_START_PAGE_SCHEMA_VERSION,
    shortcuts: shortcuts,
    history: history,
    hiddenHistoryUrls: normalizeHiddenUrls(config.hiddenHistoryUrls),
  };
}
function readState(value5) {
  return normalizeState(readRawState(value5));
}
function persistState(value6, value7) {
  const state2 = normalizeState(value6);
  return (writeRawState(state2, value7), state2);
}
function getNextOrder(list2) {
  return list2.reduce((item4, value8) => Math.max(item4, value8.order || 0), 0) + 1;
}
function createShortcutId(value9, value10) {
  const hostLabel = getHostLabel(value9)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 40);
  return 'web-' + (hostLabel || 'site') + '-' + value10;
}
function removeHiddenUrl(value11, value12) {
  value11.hiddenHistoryUrls = value11.hiddenHistoryUrls.filter((item5) => item5 !== value12);
}
function addHiddenUrl(enabled, value13) {
  if (!enabled.hiddenHistoryUrls.includes(value13)) enabled.hiddenHistoryUrls.push(value13);
}
export function getWebPreviewStartPageState({ storage: storage2 } = {}) {
  return readState(storage2);
}
export function getWebPreviewStartPageTiles({
  storage: storage3,
  limit: limit = WEB_PREVIEW_START_PAGE_MAX_TILES,
} = {}) {
  const state3 = readState(storage3),
    value14 = Math.max(0, Number.parseInt(limit, 10) || WEB_PREVIEW_START_PAGE_MAX_TILES),
    list3 = state3.shortcuts
      .filter((item6) => item6.pinned === true)
      .sort(
        (item7, value15) => (item7.order || 0) - (value15.order || 0) || item7.createdAt - value15.createdAt,
      ),
    map4 = new Set(list3.map((response3) => response3.url)),
    map5 = new Set(state3.hiddenHistoryUrls),
    args2 = list3.map((id) => ({
      kind: 'shortcut',
      id: id.id,
      title: id.title,
      url: id.url,
      pinned: true,
      iconLabel: getWebPreviewTileIconLabel(id),
    })),
    args3 = state3.history
      .filter((response4) => !map4.has(response4.url) && !map5.has(response4.url))
      .map((title5) => ({
        kind: 'history',
        title: title5.title,
        url: title5.url,
        pinned: false,
        iconLabel: getWebPreviewTileIconLabel(title5),
      }));
  return [...args2, ...args3].slice(0, value14);
}
export function recordWebPreviewVisit({ url: url5, title: title6, now: now, storage: storage4 } = {}) {
  const url6 = normalizeWebPreviewUrl(url5);
  if (!url6) return { ok: false, error: 'invalid-url', state: readState(storage4) };
  const state4 = readState(storage4),
    lastVisitedAt = nowMs(now),
    title7 = getWebPreviewDisplayTitle({ title: title6, url: url6 }),
    value16 = state4.history.find((response5) => response5.url === url6);
  value16
    ? ((value16.title = title7 || value16.title),
      (value16.lastVisitedAt = lastVisitedAt),
      (value16.visitCount += 1))
    : state4.history.push({ url: url6, title: title7, lastVisitedAt: lastVisitedAt, visitCount: 1 });
  for (const response6 of state4.shortcuts) {
    if (response6.url === url6) {
      ((response6.lastOpenedAt = lastVisitedAt),
        (response6.updatedAt = Math.max(response6.updatedAt, lastVisitedAt)));
      if (!response6.title && title7) response6.title = title7;
    }
  }
  return (
    removeHiddenUrl(state4, url6),
    state4.history.sort((item8, value17) => value17.lastVisitedAt - item8.lastVisitedAt),
    (state4.history = state4.history.slice(0, WEB_PREVIEW_START_PAGE_MAX_HISTORY)),
    { ok: true, state: persistState(state4, storage4), url: url6 }
  );
}
export function addWebPreviewShortcut({
  title: title8,
  url: url7,
  now: now2,
  storage: storage5,
  id: id2,
} = {}) {
  const url8 = normalizeWebPreviewUrl(url7);
  if (!url8) return { ok: false, error: 'invalid-url', state: readState(storage5) };
  const state5 = readState(storage5),
    createdAt2 = nowMs(now2),
    title9 = getWebPreviewDisplayTitle({ title: title8, url: url8 });
  let shortcut = state5.shortcuts.find((response7) => response7.url === url8);
  return (
    shortcut
      ? ((shortcut.title = title9),
        (shortcut.pinned = true),
        (shortcut.updatedAt = createdAt2),
        (shortcut.order = Number.isFinite(Number(shortcut.order))
          ? shortcut.order
          : getNextOrder(state5.shortcuts)))
      : ((shortcut = {
          id: normalizeTitle(id2, createShortcutId(url8, createdAt2)).slice(0, 120),
          title: title9,
          url: url8,
          pinned: true,
          createdAt: createdAt2,
          updatedAt: createdAt2,
          lastOpenedAt: 0,
          order: getNextOrder(state5.shortcuts),
        }),
        state5.shortcuts.push(shortcut)),
    removeHiddenUrl(state5, url8),
    { ok: true, shortcut: shortcut, state: persistState(state5, storage5) }
  );
}
export function renameWebPreviewShortcut({ id: id3, title: title10, now: now3, storage: storage6 } = {}) {
  const state6 = readState(storage6),
    url9 = state6.shortcuts.find((item9) => item9.id === String(id3 || ''));
  if (!url9) return { ok: false, error: 'missing-shortcut', state: state6 };
  return (
    (url9.title = getWebPreviewDisplayTitle({ title: title10, url: url9.url })),
    (url9.updatedAt = nowMs(now3)),
    { ok: true, shortcut: url9, state: persistState(state6, storage6) }
  );
}
export function deleteWebPreviewShortcut({ id: id4, url: url10, storage: storage7 } = {}) {
  const state7 = readState(storage7),
    webPreviewUrl3 = normalizeWebPreviewUrl(url10),
    count2 = state7.shortcuts.findIndex(
      (response8) =>
        response8.id === String(id4 || '') || (webPreviewUrl3 && response8.url === webPreviewUrl3),
    );
  if (count2 < 0) return { ok: false, error: 'missing-shortcut', state: state7 };
  const [shortcut2] = state7.shortcuts.splice(count2, 1);
  return (
    addHiddenUrl(state7, shortcut2.url),
    { ok: true, shortcut: shortcut2, state: persistState(state7, storage7) }
  );
}
export function unpinWebPreviewShortcut({ id: id5, storage: storage8, now: now4 } = {}) {
  const state8 = readState(storage8),
    shortcut3 = state8.shortcuts.find((item10) => item10.id === String(id5 || ''));
  if (!shortcut3) return { ok: false, error: 'missing-shortcut', state: state8 };
  return (
    (shortcut3.pinned = false),
    (shortcut3.updatedAt = nowMs(now4)),
    { ok: true, shortcut: shortcut3, state: persistState(state8, storage8) }
  );
}
export function pinWebPreviewUrl({ url: url11, title: title11, now: now5, storage: storage9 } = {}) {
  return addWebPreviewShortcut({ url: url11, title: title11, now: now5, storage: storage9 });
}
export function deleteWebPreviewHistoryUrl({ url: url12, storage: storage10 } = {}) {
  const url13 = normalizeWebPreviewUrl(url12),
    state9 = readState(storage10);
  if (!url13) return { ok: false, error: 'invalid-url', state: state9 };
  return (
    (state9.history = state9.history.filter((response9) => response9.url !== url13)),
    addHiddenUrl(state9, url13),
    { ok: true, state: persistState(state9, storage10), url: url13 }
  );
}
