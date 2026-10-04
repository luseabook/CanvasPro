const DOUYIN_DETAIL_API_PATH_RE = /\/aweme\/v1\/web\/aweme\/detail\//i,
  DOUYIN_WORK_ID_RE = /\b\d{15,25}\b/,
  DOUYIN_VIDEO_SOURCE_TYPE = 'douyin-detail',
  MAX_DOUYIN_DETAIL_API_REPLAY = 6,
  MAX_DOUYIN_AWEME_SCAN_DEPTH = 8,
  MAX_DOUYIN_AWEME_DETAILS = 40;
function normalizeHttpUrl(value, item = '') {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  try {
    const key = item ? new URL(enabled, item) : new URL(enabled);
    if (key.protocol !== 'http:' && key.protocol !== 'https:') return '';
    return ((key.username = ''), (key.password = ''), key.href);
  } catch {
    return '';
  }
}
function isDouyinHost(index) {
  const result = String(index || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  return (
    result === 'douyin.com' ||
    result.endsWith('.douyin.com') ||
    result === 'iesdouyin.com' ||
    result.endsWith('.iesdouyin.com')
  );
}
export function extractDouyinAwemeIdFromUrl(data) {
  const httpUrl = normalizeHttpUrl(data);
  if (!httpUrl) return '';
  try {
    const uRL = new URL(httpUrl);
    if (!isDouyinHost(uRL.hostname)) return '';
    for (const options of ['aweme_id', 'modal_id', 'item_id', 'group_id']) {
      const target = uRL.searchParams.get(options);
      if (DOUYIN_WORK_ID_RE.test(target || '')) return target.match(DOUYIN_WORK_ID_RE)[0];
    }
    const source = uRL.pathname.match(
      /\/(?:video|note|slides|share\/(?:video|note|slides))\/(\d{15,25})(?:\/|$)/i,
    );
    if (source?.[1]) return source[1];
    const next = uRL.pathname.match(DOUYIN_WORK_ID_RE);
    return next?.[0] || '';
  } catch {
    return '';
  }
}
function isDouyinDetailApiUrl(current) {
  const httpUrl2 = normalizeHttpUrl(current);
  if (!httpUrl2) return false;
  try {
    const uRL2 = new URL(httpUrl2);
    return (
      isDouyinHost(uRL2.hostname) &&
      DOUYIN_DETAIL_API_PATH_RE.test(uRL2.pathname) &&
      DOUYIN_WORK_ID_RE.test(uRL2.searchParams.get('aweme_id') || '')
    );
  } catch {
    return false;
  }
}
function normalizeDouyinDetailApiUrls(list = []) {
  const list2 = [],
    map = new Set();
  for (const entry of Array.isArray(list) ? list : []) {
    const httpUrl3 = normalizeHttpUrl(entry);
    if (!httpUrl3 || map.has(httpUrl3) || !isDouyinDetailApiUrl(httpUrl3)) continue;
    (map.add(httpUrl3), list2.push(httpUrl3));
    if (list2.length >= MAX_DOUYIN_DETAIL_API_REPLAY) break;
  }
  return list2;
}
function toArray(record) {
  if (Array.isArray(record)) return record;
  return record === undefined || record === null ? [] : [record];
}
function readObjectValue(enabled2, payload = []) {
  if (!enabled2 || typeof enabled2 !== 'object') return undefined;
  for (const handle of payload) {
    if (Object.prototype.hasOwnProperty.call(enabled2, handle)) return enabled2[handle];
  }
  return undefined;
}
function readNumber(state, config = []) {
  const scope = Array.isArray(config) ? readObjectValue(state, config) : state,
    count = Number(scope);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function sanitizeTitle(input, output = '抖音素材') {
  return (
    String(input || output)
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 160) || output
  );
}
function normalizeEscapedUrlText(value2) {
  return String(value2 || '')
    .replace(/\\u002[fF]/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003[dD]/g, '=')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .trim();
}
function extractUrlsFromValue(value3) {
  const escapedUrlText = normalizeEscapedUrlText(value3);
  if (!escapedUrlText) return [];
  const list3 = [],
    httpUrl4 = normalizeHttpUrl(escapedUrlText);
  if (httpUrl4) list3.push(httpUrl4);
  const value4 = /https?:\/\/[^"'\s<>]+/g;
  let value5 = null;
  while ((value5 = value4.exec(escapedUrlText))) {
    const httpUrl5 = normalizeHttpUrl(value5[0].replace(/[),.;，。；）]+$/u, ''));
    if (httpUrl5) list3.push(httpUrl5);
  }
  return Array.from(new Set(list3));
}
function addressUrlCandidates(value6) {
  const list4 = [],
    handler = (value7, count2 = 0) => {
      if (count2 > 6 || value7 === undefined || value7 === null) return;
      if (typeof value7 === 'string') {
        list4.push(...extractUrlsFromValue(value7));
        return;
      }
      if (Array.isArray(value7)) {
        for (const value8 of value7) handler(value8, count2 + 1);
        return;
      }
      if (typeof value7 !== 'object') return;
      for (const value9 of [
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
        Object.prototype.hasOwnProperty.call(value7, value9) && handler(value7[value9], count2 + 1);
      }
    };
  return (handler(value6), Array.from(new Set(list4)));
}
function pickPreferredAddressUrl(value10) {
  const addressUrlCandidates2 = addressUrlCandidates(value10);
  return addressUrlCandidates2.at(-1) || '';
}
function normalizeDouyinDurationSeconds(value11) {
  const count3 = Number(value11);
  if (!Number.isFinite(count3) || count3 <= 0) return 0;
  return count3 >= 0x3e8 ? count3 / 0x3e8 : count3;
}
function getDouyinVideoTitle(value12, value13 = '抖音视频') {
  return sanitizeTitle(
    value12?.desc ||
      value12?.item_title ||
      value12?.itemTitle ||
      value12?.share_info?.share_title ||
      value12?.shareInfo?.shareTitle,
    value13,
  );
}
function getVideoAddress(value14) {
  return (
    value14?.play_addr ||
    value14?.playAddr ||
    value14?.PlayAddr ||
    value14?.download_addr ||
    value14?.downloadAddr ||
    value14
  );
}
function scoreBitRateItem(options2 = {}) {
  const videoAddress = getVideoAddress(options2),
    number = readNumber(videoAddress, ['height', 'h']) || readNumber(options2, ['height', 'h']),
    number2 = readNumber(videoAddress, ['width', 'w']) || readNumber(options2, ['width', 'w']),
    number3 = readNumber(options2, ['FPS', 'fps']),
    number4 = readNumber(options2, ['bit_rate', 'bitRate', 'bitrate']),
    number5 =
      readNumber(videoAddress, ['data_size', 'dataSize']) || readNumber(options2, ['data_size', 'dataSize']);
  return [Math.max(number, number2), number3, number4, number5];
}
function compareScore(list5, list6) {
  for (let value15 = 0; value15 < Math.max(list5.length, list6.length); value15 += 1) {
    const count4 = Number(list5[value15] || 0) - Number(list6[value15] || 0);
    if (count4 !== 0) return count4;
  }
  return 0;
}
function pickBestBitRateVideo(options3 = {}) {
  const list7 = toArray(
      options3?.bit_rate || options3?.bitRate || options3?.bitrate_info || options3?.bitrateInfo,
    ).filter((item2) => item2 && typeof item2 === 'object'),
    value16 = list7
      .map((item3) => {
        const videoAddress2 = getVideoAddress(item3),
          url = pickPreferredAddressUrl(videoAddress2);
        if (!url) return null;
        return {
          url: url,
          score: scoreBitRateItem(item3),
          width: readNumber(videoAddress2, ['width', 'w']) || readNumber(item3, ['width', 'w']),
          height: readNumber(videoAddress2, ['height', 'h']) || readNumber(item3, ['height', 'h']),
        };
      })
      .filter(Boolean)
      .sort((item4, value17) => compareScore(item4.score, value17.score));
  return value16.at(-1) || null;
}
function pickDouyinVideoDownload(options4 = {}) {
  const response = pickBestBitRateVideo(options4);
  if (response?.url) return response;
  for (const value18 of [
    'play_addr_h264',
    'playAddrH264',
    'play_addr_256',
    'playAddr256',
    'play_addr',
    'playAddr',
    'download_addr',
    'downloadAddr',
  ]) {
    const url2 = pickPreferredAddressUrl(options4?.[value18]);
    if (!url2) continue;
    return {
      url: url2,
      width: readNumber(options4?.[value18], ['width', 'w']) || readNumber(options4, ['width', 'w']),
      height: readNumber(options4?.[value18], ['height', 'h']) || readNumber(options4, ['height', 'h']),
    };
  }
  return null;
}
function normalizeDouyinVideoCandidate(value19, value20 = {}) {
  const enabled3 = value20.video || value19?.video;
  if (!enabled3 || typeof enabled3 !== 'object') return null;
  const url3 = pickDouyinVideoDownload(enabled3);
  if (!url3?.url) return null;
  const title = sanitizeTitle(value20.title || getDouyinVideoTitle(value19), '抖音视频');
  return {
    kind: 'video',
    url: url3.url,
    title: title,
    pageUrl: normalizeHttpUrl(value20.pageUrl),
    pageTitle: sanitizeTitle(value20.pageTitle || title, ''),
    nodeId: String(value20.nodeId || '').trim(),
    tabId: String(value20.tabId || '').trim(),
    width:
      Math.max(0, Math.round(Number(url3.width || 0) || 0)) ||
      Math.max(0, Math.round(readNumber(enabled3, ['width', 'w', 'videoWidth']))),
    height:
      Math.max(0, Math.round(Number(url3.height || 0) || 0)) ||
      Math.max(0, Math.round(readNumber(enabled3, ['height', 'h', 'videoHeight']))),
    duration: normalizeDouyinDurationSeconds(
      enabled3?.duration || value19?.duration || enabled3?.videoDuration,
    ),
    sourceType: DOUYIN_VIDEO_SOURCE_TYPE,
    mimeType: 'video/mp4',
  };
}
function readDouyinImageList(options5 = {}) {
  const list8 = toArray(options5?.images).filter(Boolean),
    toArray2 = toArray(options5?.image_post_info?.images || options5?.imagePostInfo?.images).filter(Boolean);
  return list8.length ? list8 : toArray2;
}
function normalizeDouyinImageCandidates(value21, args = {}) {
  const title2 = sanitizeTitle(getDouyinVideoTitle(value21, '抖音图集'), '抖音图集'),
    images = [],
    videos = [];
  return (
    readDouyinImageList(value21).forEach((video, value22) => {
      if (!video || typeof video !== 'object') return;
      if (video.video && typeof video.video === 'object') {
        const douyinVideoCandidate = normalizeDouyinVideoCandidate(value21, {
          ...args,
          video: video.video,
          title: title2 + ' #' + (value22 + 1),
        });
        if (douyinVideoCandidate) videos.push(douyinVideoCandidate);
        return;
      }
      const url4 = pickPreferredAddressUrl(video);
      if (!url4) return;
      images.push({
        kind: 'image',
        url: url4,
        title: title2 + ' #' + (value22 + 1),
        pageUrl: normalizeHttpUrl(args.pageUrl),
        pageTitle: sanitizeTitle(args.pageTitle || title2, ''),
        nodeId: String(args.nodeId || '').trim(),
        tabId: String(args.tabId || '').trim(),
        width: Math.max(0, Math.round(readNumber(video, ['width', 'w']))),
        height: Math.max(0, Math.round(readNumber(video, ['height', 'h']))),
        sourceType: 'douyin-detail',
      });
    }),
    { images: images, videos: videos }
  );
}
export function normalizeDouyinAwemeMedia(enabled4, value23 = {}) {
  if (!enabled4 || typeof enabled4 !== 'object') return { images: [], videos: [] };
  const douyinImageCandidates = normalizeDouyinImageCandidates(enabled4, value23);
  if (douyinImageCandidates.images.length || douyinImageCandidates.videos.length)
    return douyinImageCandidates;
  const videos2 = normalizeDouyinVideoCandidate(enabled4, value23);
  return { images: [], videos: videos2 ? [videos2] : [] };
}
function looksLikeAwemeDetail(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object') return false;
  return Boolean(
    enabled5.video ||
    enabled5.images ||
    enabled5.image_post_info ||
    enabled5.imagePostInfo ||
    enabled5.aweme_id ||
    enabled5.awemeId,
  );
}
export function collectDouyinAwemeDetails(value24) {
  const list9 = [],
    map2 = new WeakSet(),
    map3 = new Set(),
    handler2 = (value25) => {
      if (!looksLikeAwemeDetail(value25)) return;
      const value26 = String(value25.aweme_id || value25.awemeId || value25.id || '').trim(),
        value27 = value26 || list9.length + ':' + (value25.desc || '');
      if (map3.has(value27)) return;
      (map3.add(value27), list9.push(value25));
    },
    handler3 = (enabled6, value28 = 0) => {
      if (
        value28 > MAX_DOUYIN_AWEME_SCAN_DEPTH ||
        list9.length >= MAX_DOUYIN_AWEME_DETAILS ||
        !enabled6 ||
        typeof enabled6 !== 'object'
      )
        return;
      if (map2.has(enabled6)) return;
      map2.add(enabled6);
      if (looksLikeAwemeDetail(enabled6)) handler2(enabled6);
      const value29 = enabled6.aweme_detail || enabled6.awemeDetail;
      if (value29) handler3(value29, value28 + 1);
      for (const value30 of ['aweme_list', 'awemeList', 'items', 'data']) {
        const enabled7 = enabled6[value30];
        if (!enabled7) continue;
        if (Array.isArray(enabled7)) {
          for (const value31 of enabled7) handler3(value31, value28 + 1);
        } else handler3(enabled7, value28 + 1);
      }
    };
  return (handler3(value24), list9);
}
async function readJsonResponse(response2) {
  if (typeof response2?.json === 'function') return await response2.json();
  if (typeof response2?.text === 'function') {
    const value32 = await response2.text();
    return JSON.parse(value32);
  }
  return null;
}
async function fetchDouyinDetailPayloads({
  detailApiUrls: detailApiUrls = [],
  sessionRef: sessionRef,
  pageUrl: pageUrl = '',
  logDiagnosticEvent: logDiagnosticEvent,
} = {}) {
  if (typeof sessionRef?.fetch !== 'function') return [];
  const list10 = [],
    Referer = normalizeHttpUrl(pageUrl) || 'https://www.douyin.com/',
    value33 = String(sessionRef?.getUserAgent?.() || '').trim();
  for (const url5 of normalizeDouyinDetailApiUrls(detailApiUrls)) {
    try {
      const response3 = await sessionRef.fetch(url5, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'application/json,text/plain,*/*',
          Referer: Referer,
          ...(value33 ? { 'User-Agent': value33 } : {}),
        },
      });
      if (!response3?.ok) throw new Error('Douyin detail HTTP ' + (response3?.status || 0));
      const jsonResponse = await readJsonResponse(response3);
      if (jsonResponse && typeof jsonResponse === 'object') list10.push(jsonResponse);
    } catch (error) {
      logDiagnosticEvent?.({
        type: 'web_preview.douyin_detail_fetch_failed',
        level: 'warn',
        source: 'main',
        message: 'Douyin detail replay failed',
        error: error,
        context: { url: url5, pageUrl: Referer, awemeId: extractDouyinAwemeIdFromUrl(url5) },
      });
    }
  }
  return list10;
}
function dedupeCandidates(list11 = []) {
  const list12 = [],
    map4 = new Set();
  for (const response4 of list11) {
    const url6 = normalizeHttpUrl(response4?.url);
    if (!url6 || map4.has(url6)) continue;
    (map4.add(url6), list12.push({ ...response4, url: url6 }));
  }
  return list12;
}
export async function resolveDouyinCurrentPageMedia({
  pageUrl: pageUrl = '',
  pageTitle: pageTitle = '',
  nodeId: nodeId = '',
  tabId: tabId = '',
  videoResult: videoResult = {},
  webContents: webContents,
  logDiagnosticEvent: logDiagnosticEvent2,
} = {}) {
  const detailApiUrls2 = normalizeDouyinDetailApiUrls(videoResult?.douyinDetailApiUrls);
  if (!detailApiUrls2.length) return { images: [], videos: [], detailApiUrls: [], fetchedCount: 0 };
  const fetchedCount = await fetchDouyinDetailPayloads({
      detailApiUrls: detailApiUrls2,
      sessionRef: webContents?.session,
      pageUrl: pageUrl,
      logDiagnosticEvent: logDiagnosticEvent2,
    }),
    list13 = [],
    list14 = [];
  for (const value34 of fetchedCount) {
    for (const value35 of collectDouyinAwemeDetails(value34)) {
      const args2 = normalizeDouyinAwemeMedia(value35, {
        pageUrl: pageUrl,
        pageTitle: pageTitle,
        nodeId: nodeId,
        tabId: tabId,
      });
      (list13.push(...args2.images), list14.push(...args2.videos));
    }
  }
  return {
    images: dedupeCandidates(list13),
    videos: dedupeCandidates(list14),
    detailApiUrls: detailApiUrls2,
    fetchedCount: fetchedCount.length,
  };
}
