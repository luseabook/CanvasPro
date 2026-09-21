import { normalizeWebPreviewUrl } from '../modules/webPreviewUrl.js';
export const WEB_PREVIEW_START_PAGE_STORAGE_KEY = 'ai_canvas_web_preview_start_page_v1';
export const WEB_PREVIEW_START_PAGE_SCHEMA_VERSION = 1;
export const WEB_PREVIEW_START_PAGE_MAX_HISTORY = 50;
export const WEB_PREVIEW_START_PAGE_MAX_TILES = 8;
function getStorage(_0x35a79a) {
  if (_0x35a79a) return _0x35a79a;
  return globalThis.localStorage || globalThis.window?.localStorage || null;
}
function nowMs(_0x2d6af5 = Date.now()) {
  const _0x1e0e28 = Number(_0x2d6af5);
  return Number.isFinite(_0x1e0e28) && _0x1e0e28 > 0 ? _0x1e0e28 : Date.now();
}
function readRawState(_0x1f0f08) {
  try {
    const _0x386712 = getStorage(_0x1f0f08)?.getItem?.(WEB_PREVIEW_START_PAGE_STORAGE_KEY);
    return _0x386712 ? JSON.parse(_0x386712) : null;
  } catch {
    return null;
  }
}
function writeRawState(_0x4ab8a8, _0x43acc1) {
  try {
    return (
      getStorage(_0x43acc1)?.setItem?.(WEB_PREVIEW_START_PAGE_STORAGE_KEY, JSON.stringify(_0x4ab8a8)),
      true
    );
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
function normalizeTitle(_0x456184, _0x2a0558 = '') {
  const _0x33fd8e = String(_0x456184 || '')
    .replace(/\s+/g, ' ')
    .trim();
  return (_0x33fd8e || _0x2a0558 || '').slice(0, 80);
}
function getHostLabel(_0x211b12) {
  try {
    const _0x5d9c5f = new URL(_0x211b12).hostname.replace(/^www\./i, '');
    return _0x5d9c5f || _0x211b12;
  } catch {
    return _0x211b12;
  }
}
export function getWebPreviewDisplayTitle({ title: _0x4a9f69, url: _0x5d73ab } = {}) {
  const _0x71683e = normalizeWebPreviewUrl(_0x5d73ab),
    _0x179bf5 = _0x71683e ? getHostLabel(_0x71683e) : '';
  return normalizeTitle(_0x4a9f69, _0x179bf5);
}
export function getWebPreviewTileIconLabel({ title: _0x5a5f1c, url: _0x3b4329 } = {}) {
  const _0x156464 = getWebPreviewDisplayTitle({ title: _0x5a5f1c, url: _0x3b4329 }),
    _0x4674c8 = [..._0x156464].find((_0x16a00e) => /[\p{L}\p{N}]/u.test(_0x16a00e));
  return (_0x4674c8 || '+').toUpperCase();
}
function normalizeHiddenUrls(_0x54fced) {
  const _0x2ac223 = Array.isArray(_0x54fced) ? _0x54fced : [],
    _0xb5d4b0 = new Set(),
    _0x169129 = [];
  for (const _0x1e91fd of _0x2ac223) {
    const _0xf273ab = normalizeWebPreviewUrl(_0x1e91fd);
    if (!_0xf273ab || _0xb5d4b0.has(_0xf273ab)) continue;
    (_0xb5d4b0.add(_0xf273ab), _0x169129.push(_0xf273ab));
  }
  return _0x169129;
}
function normalizeShortcut(_0x3eaceb, _0x193401) {
  const _0x5e599e = normalizeWebPreviewUrl(_0x3eaceb?.url);
  if (!_0x5e599e) return null;
  const _0x383479 = nowMs(_0x3eaceb?.createdAt || _0x3eaceb?.updatedAt || _0x3eaceb?.lastOpenedAt);
  return {
    id: normalizeTitle(_0x3eaceb?.id, 'shortcut-' + _0x383479 + '-' + _0x193401).slice(0, 120),
    title: getWebPreviewDisplayTitle({ title: _0x3eaceb?.title, url: _0x5e599e }),
    url: _0x5e599e,
    pinned: _0x3eaceb?.pinned !== false,
    createdAt: _0x383479,
    updatedAt: nowMs(_0x3eaceb?.updatedAt || _0x383479),
    lastOpenedAt: Number(_0x3eaceb?.lastOpenedAt || 0) || 0,
    order: Number.isFinite(Number(_0x3eaceb?.order)) ? Number(_0x3eaceb.order) : _0x193401,
  };
}
function normalizeHistoryItem(_0x3387aa) {
  const _0x5c58b = normalizeWebPreviewUrl(_0x3387aa?.url);
  if (!_0x5c58b) return null;
  return {
    url: _0x5c58b,
    title: getWebPreviewDisplayTitle({ title: _0x3387aa?.title, url: _0x5c58b }),
    lastVisitedAt: nowMs(_0x3387aa?.lastVisitedAt),
    visitCount: Math.max(1, Number.parseInt(_0x3387aa?.visitCount, 10) || 1),
  };
}
function normalizeState(_0xf225dd) {
  const _0x53ccb4 = _0xf225dd && typeof _0xf225dd === 'object' ? _0xf225dd : createEmptyState(),
    _0xd68f04 = new Map(),
    _0x333e16 = [];
  for (const [_0x3e75c5, _0x461895] of (Array.isArray(_0x53ccb4.shortcuts)
    ? _0x53ccb4.shortcuts
    : []
  ).entries()) {
    const _0x1427cb = normalizeShortcut(_0x461895, _0x3e75c5);
    if (!_0x1427cb) continue;
    const _0x2cfb4e = _0xd68f04.get(_0x1427cb.url);
    if (_0x2cfb4e) {
      ((_0x2cfb4e.title = _0x1427cb.title || _0x2cfb4e.title),
        (_0x2cfb4e.pinned = _0x2cfb4e.pinned || _0x1427cb.pinned),
        (_0x2cfb4e.updatedAt = Math.max(_0x2cfb4e.updatedAt, _0x1427cb.updatedAt)),
        (_0x2cfb4e.lastOpenedAt = Math.max(_0x2cfb4e.lastOpenedAt, _0x1427cb.lastOpenedAt)),
        (_0x2cfb4e.order = Math.min(_0x2cfb4e.order, _0x1427cb.order)));
      continue;
    }
    (_0xd68f04.set(_0x1427cb.url, _0x1427cb), _0x333e16.push(_0x1427cb));
  }
  const _0x2add3c = new Map();
  for (const _0x58571b of Array.isArray(_0x53ccb4.history) ? _0x53ccb4.history : []) {
    const _0x3b250a = normalizeHistoryItem(_0x58571b);
    if (!_0x3b250a) continue;
    const _0x207ef8 = _0x2add3c.get(_0x3b250a.url);
    _0x207ef8
      ? ((_0x207ef8.title = _0x3b250a.title || _0x207ef8.title),
        (_0x207ef8.lastVisitedAt = Math.max(_0x207ef8.lastVisitedAt, _0x3b250a.lastVisitedAt)),
        (_0x207ef8.visitCount += _0x3b250a.visitCount))
      : _0x2add3c.set(_0x3b250a.url, _0x3b250a);
  }
  const _0x15f0f7 = [..._0x2add3c.values()]
    .sort((_0x229df2, _0x4b2aae) => _0x4b2aae.lastVisitedAt - _0x229df2.lastVisitedAt)
    .slice(0, WEB_PREVIEW_START_PAGE_MAX_HISTORY);
  return {
    schemaVersion: WEB_PREVIEW_START_PAGE_SCHEMA_VERSION,
    shortcuts: _0x333e16,
    history: _0x15f0f7,
    hiddenHistoryUrls: normalizeHiddenUrls(_0x53ccb4.hiddenHistoryUrls),
  };
}
function readState(_0xf4c40e) {
  return normalizeState(readRawState(_0xf4c40e));
}
function persistState(_0x11625e, _0x8a6282) {
  const _0x20b5ae = normalizeState(_0x11625e);
  return (writeRawState(_0x20b5ae, _0x8a6282), _0x20b5ae);
}
function getNextOrder(_0x365409) {
  return _0x365409.reduce((_0x266187, _0x31eb1c) => Math.max(_0x266187, _0x31eb1c.order || 0), 0) + 1;
}
function createShortcutId(_0x13db20, _0x30d930) {
  const _0x669343 = getHostLabel(_0x13db20)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 40);
  return 'web-' + (_0x669343 || 'site') + '-' + _0x30d930;
}
function removeHiddenUrl(_0xac9a15, _0x2919e2) {
  _0xac9a15.hiddenHistoryUrls = _0xac9a15.hiddenHistoryUrls.filter((_0x2ad2e9) => _0x2ad2e9 !== _0x2919e2);
}
function addHiddenUrl(_0x310ae9, _0x3842b5) {
  if (!_0x310ae9.hiddenHistoryUrls.includes(_0x3842b5)) _0x310ae9.hiddenHistoryUrls.push(_0x3842b5);
}
export function getWebPreviewStartPageState({ storage: _0x1d0418 } = {}) {
  return readState(_0x1d0418);
}
export function getWebPreviewStartPageTiles({
  storage: _0x3f7fb2,
  limit: limit = WEB_PREVIEW_START_PAGE_MAX_TILES,
} = {}) {
  const _0x1f04e6 = readState(_0x3f7fb2),
    _0x4a60e9 = Math.max(0, Number.parseInt(limit, 10) || WEB_PREVIEW_START_PAGE_MAX_TILES),
    _0x130624 = _0x1f04e6.shortcuts
      .filter((_0x828d74) => _0x828d74.pinned === true)
      .sort(
        (_0x554880, _0x29d88e) =>
          (_0x554880.order || 0) - (_0x29d88e.order || 0) || _0x554880.createdAt - _0x29d88e.createdAt,
      ),
    _0x2beef3 = new Set(_0x130624.map((_0x3b144b) => _0x3b144b.url)),
    _0x1980f9 = new Set(_0x1f04e6.hiddenHistoryUrls),
    _0x22c8c1 = _0x130624.map((_0x499eea) => ({
      kind: 'shortcut',
      id: _0x499eea.id,
      title: _0x499eea.title,
      url: _0x499eea.url,
      pinned: true,
      iconLabel: getWebPreviewTileIconLabel(_0x499eea),
    })),
    _0x317817 = _0x1f04e6.history
      .filter((_0x361176) => !_0x2beef3.has(_0x361176.url) && !_0x1980f9.has(_0x361176.url))
      .map((_0x3811de) => ({
        kind: 'history',
        title: _0x3811de.title,
        url: _0x3811de.url,
        pinned: false,
        iconLabel: getWebPreviewTileIconLabel(_0x3811de),
      }));
  return [..._0x22c8c1, ..._0x317817].slice(0, _0x4a60e9);
}
export function recordWebPreviewVisit({
  url: _0x16f51b,
  title: _0x11b329,
  now: _0x141ee0,
  storage: _0x992c4,
} = {}) {
  const _0x2120e9 = normalizeWebPreviewUrl(_0x16f51b);
  if (!_0x2120e9) return { ok: false, error: 'invalid-url', state: readState(_0x992c4) };
  const _0x5c523c = readState(_0x992c4),
    _0x14032b = nowMs(_0x141ee0),
    _0x359620 = getWebPreviewDisplayTitle({ title: _0x11b329, url: _0x2120e9 }),
    _0x274e8d = _0x5c523c.history.find((_0x8247d3) => _0x8247d3.url === _0x2120e9);
  _0x274e8d
    ? ((_0x274e8d.title = _0x359620 || _0x274e8d.title),
      (_0x274e8d.lastVisitedAt = _0x14032b),
      (_0x274e8d.visitCount += 1))
    : _0x5c523c.history.push({ url: _0x2120e9, title: _0x359620, lastVisitedAt: _0x14032b, visitCount: 1 });
  for (const _0x17a543 of _0x5c523c.shortcuts) {
    if (_0x17a543.url === _0x2120e9) {
      ((_0x17a543.lastOpenedAt = _0x14032b),
        (_0x17a543.updatedAt = Math.max(_0x17a543.updatedAt, _0x14032b)));
      if (!_0x17a543.title && _0x359620) _0x17a543.title = _0x359620;
    }
  }
  return (
    removeHiddenUrl(_0x5c523c, _0x2120e9),
    _0x5c523c.history.sort((_0x3912ef, _0x860a6a) => _0x860a6a.lastVisitedAt - _0x3912ef.lastVisitedAt),
    (_0x5c523c.history = _0x5c523c.history.slice(0, WEB_PREVIEW_START_PAGE_MAX_HISTORY)),
    { ok: true, state: persistState(_0x5c523c, _0x992c4), url: _0x2120e9 }
  );
}
export function addWebPreviewShortcut({
  title: _0x4a10da,
  url: _0x527cb2,
  now: _0x3d19c7,
  storage: _0x3e7679,
  id: _0x302966,
} = {}) {
  const _0x23a6e9 = normalizeWebPreviewUrl(_0x527cb2);
  if (!_0x23a6e9) return { ok: false, error: 'invalid-url', state: readState(_0x3e7679) };
  const _0x2a4b8f = readState(_0x3e7679),
    _0x52ff5a = nowMs(_0x3d19c7),
    _0x198f26 = getWebPreviewDisplayTitle({ title: _0x4a10da, url: _0x23a6e9 });
  let _0x3df9e4 = _0x2a4b8f.shortcuts.find((_0xc484c8) => _0xc484c8.url === _0x23a6e9);
  return (
    _0x3df9e4
      ? ((_0x3df9e4.title = _0x198f26),
        (_0x3df9e4.pinned = true),
        (_0x3df9e4.updatedAt = _0x52ff5a),
        (_0x3df9e4.order = Number.isFinite(Number(_0x3df9e4.order))
          ? _0x3df9e4.order
          : getNextOrder(_0x2a4b8f.shortcuts)))
      : ((_0x3df9e4 = {
          id: normalizeTitle(_0x302966, createShortcutId(_0x23a6e9, _0x52ff5a)).slice(0, 120),
          title: _0x198f26,
          url: _0x23a6e9,
          pinned: true,
          createdAt: _0x52ff5a,
          updatedAt: _0x52ff5a,
          lastOpenedAt: 0,
          order: getNextOrder(_0x2a4b8f.shortcuts),
        }),
        _0x2a4b8f.shortcuts.push(_0x3df9e4)),
    removeHiddenUrl(_0x2a4b8f, _0x23a6e9),
    { ok: true, shortcut: _0x3df9e4, state: persistState(_0x2a4b8f, _0x3e7679) }
  );
}
export function renameWebPreviewShortcut({
  id: _0x4c7402,
  title: _0x4d9f30,
  now: _0x54dc10,
  storage: _0x2e3edb,
} = {}) {
  const _0x321c0e = readState(_0x2e3edb),
    _0x3ea185 = _0x321c0e.shortcuts.find((_0x5e95ac) => _0x5e95ac.id === String(_0x4c7402 || ''));
  if (!_0x3ea185) return { ok: false, error: 'missing-shortcut', state: _0x321c0e };
  return (
    (_0x3ea185.title = getWebPreviewDisplayTitle({ title: _0x4d9f30, url: _0x3ea185.url })),
    (_0x3ea185.updatedAt = nowMs(_0x54dc10)),
    { ok: true, shortcut: _0x3ea185, state: persistState(_0x321c0e, _0x2e3edb) }
  );
}
export function deleteWebPreviewShortcut({ id: _0x18cdcd, url: _0x7c18ae, storage: _0x1599f4 } = {}) {
  const _0x2ea4ed = readState(_0x1599f4),
    _0x440d53 = normalizeWebPreviewUrl(_0x7c18ae),
    _0xe239e9 = _0x2ea4ed.shortcuts.findIndex(
      (_0x4fd4ef) => _0x4fd4ef.id === String(_0x18cdcd || '') || (_0x440d53 && _0x4fd4ef.url === _0x440d53),
    );
  if (_0xe239e9 < 0) return { ok: false, error: 'missing-shortcut', state: _0x2ea4ed };
  const [_0x43cac1] = _0x2ea4ed.shortcuts.splice(_0xe239e9, 1);
  return (
    addHiddenUrl(_0x2ea4ed, _0x43cac1.url),
    { ok: true, shortcut: _0x43cac1, state: persistState(_0x2ea4ed, _0x1599f4) }
  );
}
export function unpinWebPreviewShortcut({ id: _0x3f5468, storage: _0x2889a5, now: _0x52e83a } = {}) {
  const _0x23b824 = readState(_0x2889a5),
    _0x5b8d68 = _0x23b824.shortcuts.find((_0x5c64cd) => _0x5c64cd.id === String(_0x3f5468 || ''));
  if (!_0x5b8d68) return { ok: false, error: 'missing-shortcut', state: _0x23b824 };
  return (
    (_0x5b8d68.pinned = false),
    (_0x5b8d68.updatedAt = nowMs(_0x52e83a)),
    { ok: true, shortcut: _0x5b8d68, state: persistState(_0x23b824, _0x2889a5) }
  );
}
export function pinWebPreviewUrl({
  url: _0x2f8aff,
  title: _0x1c2942,
  now: _0x53e099,
  storage: _0x2a3def,
} = {}) {
  return addWebPreviewShortcut({ url: _0x2f8aff, title: _0x1c2942, now: _0x53e099, storage: _0x2a3def });
}
export function deleteWebPreviewHistoryUrl({ url: _0x46fe61, storage: _0x373853 } = {}) {
  const _0x1b8b2d = normalizeWebPreviewUrl(_0x46fe61),
    _0x150717 = readState(_0x373853);
  if (!_0x1b8b2d) return { ok: false, error: 'invalid-url', state: _0x150717 };
  return (
    (_0x150717.history = _0x150717.history.filter((_0x5509f9) => _0x5509f9.url !== _0x1b8b2d)),
    addHiddenUrl(_0x150717, _0x1b8b2d),
    { ok: true, state: persistState(_0x150717, _0x373853), url: _0x1b8b2d }
  );
}
