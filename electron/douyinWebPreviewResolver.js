const DOUYIN_DETAIL_API_PATH_RE = /\/aweme\/v1\/web\/aweme\/detail\//i,
  DOUYIN_WORK_ID_RE = /\b\d{15,25}\b/,
  DOUYIN_VIDEO_SOURCE_TYPE = 'douyin-detail',
  MAX_DOUYIN_DETAIL_API_REPLAY = 6,
  MAX_DOUYIN_AWEME_SCAN_DEPTH = 8,
  MAX_DOUYIN_AWEME_DETAILS = 40;
function normalizeHttpUrl(_0x47c312, _0x41da29 = '') {
  const _0x187e49 = String(_0x47c312 || '').trim();
  if (!_0x187e49) return '';
  try {
    const _0x4f8ef1 = _0x41da29 ? new URL(_0x187e49, _0x41da29) : new URL(_0x187e49);
    if (_0x4f8ef1.protocol !== 'http:' && _0x4f8ef1.protocol !== 'https:') return '';
    return ((_0x4f8ef1.username = ''), (_0x4f8ef1.password = ''), _0x4f8ef1.href);
  } catch {
    return '';
  }
}
function isDouyinHost(_0x111056) {
  const _0x533d7f = String(_0x111056 || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  return (
    _0x533d7f === 'douyin.com' ||
    _0x533d7f.endsWith('.douyin.com') ||
    _0x533d7f === 'iesdouyin.com' ||
    _0x533d7f.endsWith('.iesdouyin.com')
  );
}
export function extractDouyinAwemeIdFromUrl(_0x143c74) {
  const _0x4ff89d = normalizeHttpUrl(_0x143c74);
  if (!_0x4ff89d) return '';
  try {
    const _0x1c53df = new URL(_0x4ff89d);
    if (!isDouyinHost(_0x1c53df.hostname)) return '';
    for (const _0xda54f7 of ['aweme_id', 'modal_id', 'item_id', 'group_id']) {
      const _0x449c62 = _0x1c53df.searchParams.get(_0xda54f7);
      if (DOUYIN_WORK_ID_RE.test(_0x449c62 || '')) return _0x449c62.match(DOUYIN_WORK_ID_RE)[0];
    }
    const _0x1e0718 = _0x1c53df.pathname.match(
      /\/(?:video|note|slides|share\/(?:video|note|slides))\/(\d{15,25})(?:\/|$)/i,
    );
    if (_0x1e0718?.[1]) return _0x1e0718[1];
    const _0x368840 = _0x1c53df.pathname.match(DOUYIN_WORK_ID_RE);
    return _0x368840?.[0] || '';
  } catch {
    return '';
  }
}
function isDouyinDetailApiUrl(_0x15bbc2) {
  const _0x3c0630 = normalizeHttpUrl(_0x15bbc2);
  if (!_0x3c0630) return false;
  try {
    const _0x7e60f5 = new URL(_0x3c0630);
    return (
      isDouyinHost(_0x7e60f5.hostname) &&
      DOUYIN_DETAIL_API_PATH_RE.test(_0x7e60f5.pathname) &&
      DOUYIN_WORK_ID_RE.test(_0x7e60f5.searchParams.get('aweme_id') || '')
    );
  } catch {
    return false;
  }
}
function normalizeDouyinDetailApiUrls(_0x2a87a9 = []) {
  const _0x4268b8 = [],
    _0x1c6806 = new Set();
  for (const _0x2ff186 of Array.isArray(_0x2a87a9) ? _0x2a87a9 : []) {
    const _0x41da35 = normalizeHttpUrl(_0x2ff186);
    if (!_0x41da35 || _0x1c6806.has(_0x41da35) || !isDouyinDetailApiUrl(_0x41da35)) continue;
    (_0x1c6806.add(_0x41da35), _0x4268b8.push(_0x41da35));
    if (_0x4268b8.length >= MAX_DOUYIN_DETAIL_API_REPLAY) break;
  }
  return _0x4268b8;
}
function toArray(_0x15a721) {
  if (Array.isArray(_0x15a721)) return _0x15a721;
  return _0x15a721 === undefined || _0x15a721 === null ? [] : [_0x15a721];
}
function readObjectValue(_0xbaa714, _0x403f8a = []) {
  if (!_0xbaa714 || typeof _0xbaa714 !== 'object') return undefined;
  for (const _0x2f7847 of _0x403f8a) {
    if (Object.prototype.hasOwnProperty.call(_0xbaa714, _0x2f7847)) return _0xbaa714[_0x2f7847];
  }
  return undefined;
}
function readNumber(_0x3b863b, _0x3d50a9 = []) {
  const _0x26c7ed = Array.isArray(_0x3d50a9) ? readObjectValue(_0x3b863b, _0x3d50a9) : _0x3b863b,
    _0x134884 = Number(_0x26c7ed);
  return Number.isFinite(_0x134884) && _0x134884 > 0 ? _0x134884 : 0;
}
function sanitizeTitle(_0xb1573, _0x387a5e = '抖音素材') {
  return (
    String(_0xb1573 || _0x387a5e)
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 160) || _0x387a5e
  );
}
function normalizeEscapedUrlText(_0x27dc48) {
  return String(_0x27dc48 || '')
    .replace(/\\u002[fF]/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003[dD]/g, '=')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .trim();
}
function extractUrlsFromValue(_0x3e520b) {
  const _0x3f31e3 = normalizeEscapedUrlText(_0x3e520b);
  if (!_0x3f31e3) return [];
  const _0x3f87e6 = [],
    _0x1ec134 = normalizeHttpUrl(_0x3f31e3);
  if (_0x1ec134) _0x3f87e6.push(_0x1ec134);
  const _0x498d7b = /https?:\/\/[^"'\s<>]+/g;
  let _0x2c7e92 = null;
  while ((_0x2c7e92 = _0x498d7b.exec(_0x3f31e3))) {
    const _0x29d1b5 = normalizeHttpUrl(_0x2c7e92[0].replace(/[),.;，。；）]+$/u, ''));
    if (_0x29d1b5) _0x3f87e6.push(_0x29d1b5);
  }
  return Array.from(new Set(_0x3f87e6));
}
function addressUrlCandidates(_0x223f42) {
  const _0xa35205 = [],
    _0x4972fa = (_0x13613e, _0x15368c = 0) => {
      if (_0x15368c > 6 || _0x13613e === undefined || _0x13613e === null) return;
      if (typeof _0x13613e === 'string') {
        _0xa35205.push(...extractUrlsFromValue(_0x13613e));
        return;
      }
      if (Array.isArray(_0x13613e)) {
        for (const _0x40e0a2 of _0x13613e) _0x4972fa(_0x40e0a2, _0x15368c + 1);
        return;
      }
      if (typeof _0x13613e !== 'object') return;
      for (const _0xa14970 of [
        'url_list',
        'urlList',
        'url',
        'urls',
        'main_url',
        'mainUrl',
        'backup_url',
        'backup_urls',
        'backupUrls',
        'download_url',
        'downloadUrl',
        'play_addr',
        'playAddr',
        'PlayAddr',
        'origin_url',
        'originUrl',
        'image_url',
        'imageUrl',
        'uri',
      ]) {
        Object.prototype.hasOwnProperty.call(_0x13613e, _0xa14970) &&
          _0x4972fa(_0x13613e[_0xa14970], _0x15368c + 1);
      }
    };
  return (_0x4972fa(_0x223f42), Array.from(new Set(_0xa35205)));
}
function pickPreferredAddressUrl(_0x1a2b4d) {
  const _0x5d4524 = addressUrlCandidates(_0x1a2b4d);
  return _0x5d4524.at(-1) || '';
}
function normalizeDouyinDurationSeconds(_0x46be38) {
  const _0x2f0a49 = Number(_0x46be38);
  if (!Number.isFinite(_0x2f0a49) || _0x2f0a49 <= 0) return 0;
  return _0x2f0a49 >= 0x3e8 ? _0x2f0a49 / 0x3e8 : _0x2f0a49;
}
function getDouyinVideoTitle(_0x3addd6, _0x18206a = '抖音视频') {
  return sanitizeTitle(
    _0x3addd6?.desc ||
      _0x3addd6?.item_title ||
      _0x3addd6?.itemTitle ||
      _0x3addd6?.share_info?.share_title ||
      _0x3addd6?.shareInfo?.shareTitle,
    _0x18206a,
  );
}
function getVideoAddress(_0x4e4a92) {
  return (
    _0x4e4a92?.play_addr ||
    _0x4e4a92?.playAddr ||
    _0x4e4a92?.PlayAddr ||
    _0x4e4a92?.download_addr ||
    _0x4e4a92?.downloadAddr ||
    _0x4e4a92
  );
}
function scoreBitRateItem(_0x23a0c8 = {}) {
  const _0x268442 = getVideoAddress(_0x23a0c8),
    _0x213a3d = readNumber(_0x268442, ['height', 'h']) || readNumber(_0x23a0c8, ['height', 'h']),
    _0x5d8bc9 = readNumber(_0x268442, ['width', 'w']) || readNumber(_0x23a0c8, ['width', 'w']),
    _0x1a29ae = readNumber(_0x23a0c8, ['FPS', 'fps']),
    _0x256b7f = readNumber(_0x23a0c8, ['bit_rate', 'bitRate', 'bitrate']),
    _0x151e37 =
      readNumber(_0x268442, ['data_size', 'dataSize']) || readNumber(_0x23a0c8, ['data_size', 'dataSize']);
  return [Math.max(_0x213a3d, _0x5d8bc9), _0x1a29ae, _0x256b7f, _0x151e37];
}
function compareScore(_0x40f87d, _0x3af3db) {
  for (let _0x11c126 = 0; _0x11c126 < Math.max(_0x40f87d.length, _0x3af3db.length); _0x11c126 += 1) {
    const _0x406080 = Number(_0x40f87d[_0x11c126] || 0) - Number(_0x3af3db[_0x11c126] || 0);
    if (_0x406080 !== 0) return _0x406080;
  }
  return 0;
}
function pickBestBitRateVideo(_0x5b47df = {}) {
  const _0x39f98a = toArray(
      _0x5b47df?.bit_rate || _0x5b47df?.bitRate || _0x5b47df?.bitrate_info || _0x5b47df?.bitrateInfo,
    ).filter((_0x26dfcd) => _0x26dfcd && typeof _0x26dfcd === 'object'),
    _0x5e9936 = _0x39f98a
      .map((_0x539bb4) => {
        const _0x51c1ec = getVideoAddress(_0x539bb4),
          _0xcdf5b7 = pickPreferredAddressUrl(_0x51c1ec);
        if (!_0xcdf5b7) return null;
        return {
          url: _0xcdf5b7,
          score: scoreBitRateItem(_0x539bb4),
          width: readNumber(_0x51c1ec, ['width', 'w']) || readNumber(_0x539bb4, ['width', 'w']),
          height: readNumber(_0x51c1ec, ['height', 'h']) || readNumber(_0x539bb4, ['height', 'h']),
        };
      })
      .filter(Boolean)
      .sort((_0x3d8692, _0x4f1ed7) => compareScore(_0x3d8692.score, _0x4f1ed7.score));
  return _0x5e9936.at(-1) || null;
}
function pickDouyinVideoDownload(_0x36e8b2 = {}) {
  const _0x49bcb4 = pickBestBitRateVideo(_0x36e8b2);
  if (_0x49bcb4?.url) return _0x49bcb4;
  for (const _0x439929 of [
    'play_addr_h264',
    'playAddrH264',
    'play_addr_256',
    'playAddr256',
    'play_addr',
    'playAddr',
    'download_addr',
    'downloadAddr',
  ]) {
    const _0x5030b2 = pickPreferredAddressUrl(_0x36e8b2?.[_0x439929]);
    if (!_0x5030b2) continue;
    return {
      url: _0x5030b2,
      width: readNumber(_0x36e8b2?.[_0x439929], ['width', 'w']) || readNumber(_0x36e8b2, ['width', 'w']),
      height: readNumber(_0x36e8b2?.[_0x439929], ['height', 'h']) || readNumber(_0x36e8b2, ['height', 'h']),
    };
  }
  return null;
}
function normalizeDouyinVideoCandidate(_0x43bbac, _0x5bb8e4 = {}) {
  const _0x4acbf6 = _0x5bb8e4.video || _0x43bbac?.video;
  if (!_0x4acbf6 || typeof _0x4acbf6 !== 'object') return null;
  const _0x224e5d = pickDouyinVideoDownload(_0x4acbf6);
  if (!_0x224e5d?.url) return null;
  const _0x844b35 = sanitizeTitle(_0x5bb8e4.title || getDouyinVideoTitle(_0x43bbac), '抖音视频');
  return {
    kind: 'video',
    url: _0x224e5d.url,
    title: _0x844b35,
    pageUrl: normalizeHttpUrl(_0x5bb8e4.pageUrl),
    pageTitle: sanitizeTitle(_0x5bb8e4.pageTitle || _0x844b35, ''),
    nodeId: String(_0x5bb8e4.nodeId || '').trim(),
    tabId: String(_0x5bb8e4.tabId || '').trim(),
    width:
      Math.max(0, Math.round(Number(_0x224e5d.width || 0) || 0)) ||
      Math.max(0, Math.round(readNumber(_0x4acbf6, ['width', 'w', 'videoWidth']))),
    height:
      Math.max(0, Math.round(Number(_0x224e5d.height || 0) || 0)) ||
      Math.max(0, Math.round(readNumber(_0x4acbf6, ['height', 'h', 'videoHeight']))),
    duration: normalizeDouyinDurationSeconds(
      _0x4acbf6?.duration || _0x43bbac?.duration || _0x4acbf6?.videoDuration,
    ),
    sourceType: DOUYIN_VIDEO_SOURCE_TYPE,
    mimeType: 'video/mp4',
  };
}
function readDouyinImageList(_0x1df0fc = {}) {
  const _0x1a21f6 = toArray(_0x1df0fc?.images).filter(Boolean),
    _0x15a23c = toArray(_0x1df0fc?.image_post_info?.images || _0x1df0fc?.imagePostInfo?.images).filter(
      Boolean,
    );
  return _0x1a21f6.length ? _0x1a21f6 : _0x15a23c;
}
function normalizeDouyinImageCandidates(_0xbd5680, _0x287b60 = {}) {
  const _0xb043b8 = sanitizeTitle(getDouyinVideoTitle(_0xbd5680, '抖音图集'), '抖音图集'),
    _0x4d6a37 = [],
    _0x5a584b = [];
  return (
    readDouyinImageList(_0xbd5680).forEach((_0x278e6a, _0x1646d9) => {
      if (!_0x278e6a || typeof _0x278e6a !== 'object') return;
      if (_0x278e6a.video && typeof _0x278e6a.video === 'object') {
        const _0x418e60 = normalizeDouyinVideoCandidate(_0xbd5680, {
          ..._0x287b60,
          video: _0x278e6a.video,
          title: _0xb043b8 + ' #' + (_0x1646d9 + 1),
        });
        if (_0x418e60) _0x5a584b.push(_0x418e60);
        return;
      }
      const _0x574df2 = pickPreferredAddressUrl(_0x278e6a);
      if (!_0x574df2) return;
      _0x4d6a37.push({
        kind: 'image',
        url: _0x574df2,
        title: _0xb043b8 + ' #' + (_0x1646d9 + 1),
        pageUrl: normalizeHttpUrl(_0x287b60.pageUrl),
        pageTitle: sanitizeTitle(_0x287b60.pageTitle || _0xb043b8, ''),
        nodeId: String(_0x287b60.nodeId || '').trim(),
        tabId: String(_0x287b60.tabId || '').trim(),
        width: Math.max(0, Math.round(readNumber(_0x278e6a, ['width', 'w']))),
        height: Math.max(0, Math.round(readNumber(_0x278e6a, ['height', 'h']))),
        sourceType: 'douyin-detail',
      });
    }),
    { images: _0x4d6a37, videos: _0x5a584b }
  );
}
export function normalizeDouyinAwemeMedia(_0xc1376d, _0x53ae78 = {}) {
  if (!_0xc1376d || typeof _0xc1376d !== 'object') return { images: [], videos: [] };
  const _0x48478d = normalizeDouyinImageCandidates(_0xc1376d, _0x53ae78);
  if (_0x48478d.images.length || _0x48478d.videos.length) return _0x48478d;
  const _0x2953ec = normalizeDouyinVideoCandidate(_0xc1376d, _0x53ae78);
  return { images: [], videos: _0x2953ec ? [_0x2953ec] : [] };
}
function looksLikeAwemeDetail(_0x492446) {
  if (!_0x492446 || typeof _0x492446 !== 'object') return false;
  return Boolean(
    _0x492446.video ||
    _0x492446.images ||
    _0x492446.image_post_info ||
    _0x492446.imagePostInfo ||
    _0x492446.aweme_id ||
    _0x492446.awemeId,
  );
}
export function collectDouyinAwemeDetails(_0x50c0e4) {
  const _0x547c40 = [],
    _0x429526 = new WeakSet(),
    _0x424507 = new Set(),
    _0x4a4490 = (_0x481617) => {
      if (!looksLikeAwemeDetail(_0x481617)) return;
      const _0x530be3 = String(_0x481617.aweme_id || _0x481617.awemeId || _0x481617.id || '').trim(),
        _0x199a98 = _0x530be3 || _0x547c40.length + ':' + (_0x481617.desc || '');
      if (_0x424507.has(_0x199a98)) return;
      (_0x424507.add(_0x199a98), _0x547c40.push(_0x481617));
    },
    _0x42501e = (_0x3691c1, _0x475cdd = 0) => {
      if (
        _0x475cdd > MAX_DOUYIN_AWEME_SCAN_DEPTH ||
        _0x547c40.length >= MAX_DOUYIN_AWEME_DETAILS ||
        !_0x3691c1 ||
        typeof _0x3691c1 !== 'object'
      )
        return;
      if (_0x429526.has(_0x3691c1)) return;
      _0x429526.add(_0x3691c1);
      if (looksLikeAwemeDetail(_0x3691c1)) _0x4a4490(_0x3691c1);
      const _0x1c654b = _0x3691c1.aweme_detail || _0x3691c1.awemeDetail;
      if (_0x1c654b) _0x42501e(_0x1c654b, _0x475cdd + 1);
      for (const _0x63919c of ['aweme_list', 'awemeList', 'items', 'data']) {
        const _0x25fe29 = _0x3691c1[_0x63919c];
        if (!_0x25fe29) continue;
        if (Array.isArray(_0x25fe29)) {
          for (const _0x5c2df7 of _0x25fe29) _0x42501e(_0x5c2df7, _0x475cdd + 1);
        } else _0x42501e(_0x25fe29, _0x475cdd + 1);
      }
    };
  return (_0x42501e(_0x50c0e4), _0x547c40);
}
async function readJsonResponse(_0x411d0d) {
  if (typeof _0x411d0d?.json === 'function') return await _0x411d0d.json();
  if (typeof _0x411d0d?.text === 'function') {
    const _0x2b698c = await _0x411d0d.text();
    return JSON.parse(_0x2b698c);
  }
  return null;
}
async function fetchDouyinDetailPayloads({
  detailApiUrls: detailApiUrls = [],
  sessionRef: _0xe294a9,
  pageUrl: pageUrl = '',
  logDiagnosticEvent: _0x699e54,
} = {}) {
  if (typeof _0xe294a9?.fetch !== 'function') return [];
  const _0x28ab89 = [],
    _0x4389a6 = normalizeHttpUrl(pageUrl) || 'https://www.douyin.com/',
    _0x1a1d6f = String(_0xe294a9?.getUserAgent?.() || '').trim();
  for (const _0x647b83 of normalizeDouyinDetailApiUrls(detailApiUrls)) {
    try {
      const _0x4617dd = await _0xe294a9.fetch(_0x647b83, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'application/json,text/plain,*/*',
          Referer: _0x4389a6,
          ...(_0x1a1d6f ? { 'User-Agent': _0x1a1d6f } : {}),
        },
      });
      if (!_0x4617dd?.ok) throw new Error('Douyin detail HTTP ' + (_0x4617dd?.status || 0));
      const _0x4a113a = await readJsonResponse(_0x4617dd);
      if (_0x4a113a && typeof _0x4a113a === 'object') _0x28ab89.push(_0x4a113a);
    } catch (_0x49ce07) {
      _0x699e54?.({
        type: 'web_preview.douyin_detail_fetch_failed',
        level: 'warn',
        source: 'main',
        message: 'Douyin detail replay failed',
        error: _0x49ce07,
        context: { url: _0x647b83, pageUrl: _0x4389a6, awemeId: extractDouyinAwemeIdFromUrl(_0x647b83) },
      });
    }
  }
  return _0x28ab89;
}
function dedupeCandidates(_0x62dffe = []) {
  const _0x51b55a = [],
    _0x1f343a = new Set();
  for (const _0x415823 of _0x62dffe) {
    const _0x434871 = normalizeHttpUrl(_0x415823?.url);
    if (!_0x434871 || _0x1f343a.has(_0x434871)) continue;
    (_0x1f343a.add(_0x434871), _0x51b55a.push({ ..._0x415823, url: _0x434871 }));
  }
  return _0x51b55a;
}
export async function resolveDouyinCurrentPageMedia({
  pageUrl: pageUrl = '',
  pageTitle: pageTitle = '',
  nodeId: nodeId = '',
  tabId: tabId = '',
  videoResult: videoResult = {},
  webContents: _0x192401,
  logDiagnosticEvent: _0x297f05,
} = {}) {
  const _0x2a7c5d = normalizeDouyinDetailApiUrls(videoResult?.douyinDetailApiUrls);
  if (!_0x2a7c5d.length) return { images: [], videos: [], detailApiUrls: [], fetchedCount: 0 };
  const _0x52f812 = await fetchDouyinDetailPayloads({
      detailApiUrls: _0x2a7c5d,
      sessionRef: _0x192401?.session,
      pageUrl: pageUrl,
      logDiagnosticEvent: _0x297f05,
    }),
    _0x5c8a70 = [],
    _0x273528 = [];
  for (const _0x21ce41 of _0x52f812) {
    for (const _0x1a0902 of collectDouyinAwemeDetails(_0x21ce41)) {
      const _0x374309 = normalizeDouyinAwemeMedia(_0x1a0902, {
        pageUrl: pageUrl,
        pageTitle: pageTitle,
        nodeId: nodeId,
        tabId: tabId,
      });
      (_0x5c8a70.push(..._0x374309.images), _0x273528.push(..._0x374309.videos));
    }
  }
  return {
    images: dedupeCandidates(_0x5c8a70),
    videos: dedupeCandidates(_0x273528),
    detailApiUrls: _0x2a7c5d,
    fetchedCount: _0x52f812.length,
  };
}
