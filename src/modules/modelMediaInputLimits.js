const MEDIA_KINDS = Object['freeze'](['image', 'video', 'audio']);
export const SEEDANCE2_INPUT_MAX_BY_KIND = Object['freeze']({ image: 0x9, video: 0x3, audio: 0x3 });
export const SEEDANCE25_INPUT_MAX_BY_KIND = Object['freeze']({ image: 0x1e, video: 0xa, audio: 0xa });
export const SEEDANCE2_MAX_TOTAL_DURATION_SECONDS_BY_KIND = Object['freeze']({ video: 15.09, audio: 0xf });
export const SEEDANCE25_MAX_TOTAL_DURATION_SECONDS_BY_KIND = Object['freeze']({ video: 0x1e, audio: 0x1e });
function normalizeUrl(value) {
  return String(value || '')['trim']();
}
function normalizeDurationSeconds(...args) {
  for (const item of args) {
    const count = Number(item);
    if (Number['isFinite'](count) && count > 0x0) return count;
  }
  return 0x0;
}
function normalizeSizeBytes(...args2) {
  for (const key of args2) {
    const count2 = Number(key);
    if (Number['isFinite'](count2) && count2 > 0x0) return count2;
  }
  return 0x0;
}
function collectUniqueUrls(list = []) {
  return Array['from'](new Set((Array['isArray'](list) ? list : [])['map'](normalizeUrl)['filter'](Boolean)));
}
function collectMediaStats(list2 = [], index = []) {
  const map = new Map(
    collectUniqueUrls(list2)['map']((url2) => [url2, { url: url2, duration: 0x0, sizeBytes: 0x0 }]),
  );
  for (const response of Array['isArray'](index) ? index : []) {
    const url3 = normalizeUrl(response?.['url']);
    if (!url3) continue;
    const durationSeconds = normalizeDurationSeconds(
        response?.['duration'],
        response?.['durationSeconds'],
        response?.['videoDuration'],
        response?.['audioDuration'],
      ),
      sizeBytes2 = normalizeSizeBytes(
        response?.['sizeBytes'],
        response?.['fileSize'],
        response?.['byteSize'],
      ),
      result = map['get'](url3) || { url: url3, duration: 0x0, sizeBytes: 0x0 };
    map['set'](url3, {
      url: url3,
      duration: Math['max'](result['duration'], durationSeconds),
      sizeBytes: Math['max'](result['sizeBytes'], sizeBytes2),
    });
  }
  const count3 = Array['from'](map['values']())['map'](Object['freeze']);
  return Object['freeze']({
    count: count3['length'],
    totalDurationSeconds: count3['reduce']((data, options) => data + options['duration'], 0x0),
    entries: Object['freeze'](count3),
  });
}
function readPositiveLimit(target, source) {
  const count4 = Number(target?.[source]);
  return Number['isFinite'](count4) && count4 > 0x0 ? count4 : null;
}
function getMediaExtension(next) {
  const url4 = normalizeUrl(next);
  if (!url4 || url4['startsWith']('data:')) return '';
  const list3 = [url4['split'](/[?#]/, 0x1)[0x0]];
  try {
    const uRL = new URL(url4, 'https://local.invalid');
    for (const current of uRL['searchParams']['values']()) list3['push'](current);
  } catch {}
  for (const entry of list3) {
    let record = String(entry || '');
    try {
      record = decodeURIComponent(record);
    } catch {}
    const payload = record['toLowerCase']()['match'](/\.([a-z0-9]+)(?:$|[?#])/);
    if (payload?.[0x1]) return payload[0x1];
  }
  return '';
}
function capitalizeKind(list4) {
  return '' + list4[0x0]['toUpperCase']() + list4['slice'](0x1);
}
export function validateModelMediaInputLimits({
  inputSlots: inputSlots = null,
  images: images = [],
  videos: videos = [],
  audios: audios = [],
  imageEntries: imageEntries = [],
  videoEntries: videoEntries = [],
  audioEntries: audioEntries = [],
  outputDurationSeconds: outputDurationSeconds = 0x0,
} = {}) {
  const handle = {
      image: collectMediaStats(images, imageEntries),
      video: collectMediaStats(videos, videoEntries),
      audio: collectMediaStats(audios, audioEntries),
    },
    state = inputSlots?.['maxByKind'];
  for (const kind of MEDIA_KINDS) {
    const max = readPositiveLimit(state, kind),
      actual = handle[kind]['count'];
    if (max !== null && actual > max)
      return Object['freeze']({
        ok: ![],
        code: 'max' + kind[0x0]['toUpperCase']() + kind['slice'](0x1) + 's',
        kind: kind,
        max: max,
        actual: actual,
      });
  }
  const config = inputSlots?.['mediaConstraintsByKind'] || {};
  for (const kind2 of MEDIA_KINDS) {
    const enabled = config?.[kind2];
    if (!enabled || typeof enabled !== 'object') continue;
    const map2 = new Set(
        (Array['isArray'](enabled['allowedExtensions']) ? enabled['allowedExtensions'] : [])
          ['map']((scope) =>
            String(scope || '')
              ['trim']()
              ['toLowerCase']()
              ['replace'](/^\./, ''),
          )
          ['filter'](Boolean),
      ),
      min = Number(enabled['minDurationSeconds']),
      max2 = Number(enabled['maxDurationSeconds']),
      max3 = Number(enabled['maxBytes']);
    for (const actual2 of handle[kind2]['entries']) {
      if (Number['isFinite'](min) && min > 0x0 && actual2['duration'] > 0x0 && actual2['duration'] < min)
        return Object['freeze']({
          ok: ![],
          code: 'min' + capitalizeKind(kind2) + 'Seconds',
          kind: kind2,
          min: min,
          actual: actual2['duration'],
          url: actual2['url'],
        });
      if (Number['isFinite'](max2) && max2 > 0x0 && actual2['duration'] > max2)
        return Object['freeze']({
          ok: ![],
          code: 'max' + capitalizeKind(kind2) + 'Seconds',
          kind: kind2,
          max: max2,
          actual: actual2['duration'],
          url: actual2['url'],
        });
      const actual3 = getMediaExtension(actual2['url']);
      if (map2['size'] > 0x0 && actual3 && !map2['has'](actual3))
        return Object['freeze']({
          ok: ![],
          code: 'invalid' + capitalizeKind(kind2) + 'Extension',
          kind: kind2,
          actual: actual3,
          allowed: Array['from'](map2)['join'](',\x20'),
          url: actual2['url'],
        });
      if (Number['isFinite'](max3) && max3 > 0x0 && actual2['sizeBytes'] > max3)
        return Object['freeze']({
          ok: ![],
          code: 'max' + capitalizeKind(kind2) + 'Megabytes',
          kind: kind2,
          max: max3 / (0x400 * 0x400),
          actual: actual2['sizeBytes'] / (0x400 * 0x400),
          url: actual2['url'],
        });
    }
  }
  const input = inputSlots?.['maxTotalDurationSecondsByKind'];
  for (const kind3 of ['video', 'audio']) {
    const max4 = readPositiveLimit(input, kind3),
      actual4 = handle[kind3]['totalDurationSeconds'];
    if (max4 !== null && actual4 > max4)
      return Object['freeze']({
        ok: ![],
        code: 'maxTotal' + kind3[0x0]['toUpperCase']() + kind3['slice'](0x1) + 'Seconds',
        kind: kind3,
        max: max4,
        actual: actual4,
      });
  }
  const max5 = Number(inputSlots?.['maxVideoInputAndOutputDurationSeconds']),
    count5 = Number(outputDurationSeconds),
    actual5 = handle['video']['totalDurationSeconds'] + Math['max'](0x0, count5 || 0x0);
  if (max5 > 0x0 && count5 > 0x0 && actual5 > max5)
    return Object['freeze']({
      ok: ![],
      code: 'maxVideoInputAndOutputSeconds',
      kind: 'video',
      max: max5,
      actual: actual5,
    });
  return Object['freeze']({ ok: !![], statsByKind: Object['freeze'](handle) });
}
