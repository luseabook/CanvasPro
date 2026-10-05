export const STORY_MAX_SPOKEN_UNITS_PER_SECOND = 4;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function getSpeakerParts(item = '') {
  const prefix = String(item || '')['match'](/^([^：:\n]{1,20}[：:]\s*)([\s\S]*)$/u);
  return { prefix: prefix?.[1] || '', body: prefix?.[2] ?? String(item || '') };
}
export function countStorySpokenUnits(key = '') {
  const index = String(key || '')
      ['split'](/\r?\n/u)
      ['map']((result) => getSpeakerParts(result)['body'])
      ['join']('\n'),
    data = (index['match'](/[\p{Script=Han}]/gu) || [])['length'],
    options = (index['match'](/[\p{Script=Latin}\p{N}]+(?:['’][\p{Script=Latin}\p{N}]+)*/gu) || [])['length'];
  return data + options;
}
function splitAtAuthoredPauses(target = '') {
  const list = [...String(target || '')],
    list2 = [];
  let source = '';
  for (let next = 0; next < list['length']; next += 1) {
    const current = list[next];
    source += current;
    const entry =
      /[。！？!?；;，,]/u['test'](current) ||
      (current === '…' && list[next + 1] !== '…') ||
      (current === '—' && list[next + 1] !== '—');
    entry && source['trim']() && (list2['push'](source), (source = ''));
  }
  if (source['trim']()) list2['push'](source);
  return list2['length'] ? list2 : [String(target || '')];
}
function hardSplitSpokenPart(record, payload) {
  const list3 = [];
  let handle = '';
  const state =
    String(record || '')['match'](/[\p{Script=Latin}\p{N}]+(?:['’][\p{Script=Latin}\p{N}]+)*|[\s\S]/gu) || [];
  for (const config of state) {
    const scope = '' + handle + config;
    handle && countStorySpokenUnits(scope) > payload
      ? (list3['push'](handle), (handle = config))
      : (handle = scope);
  }
  if (handle) list3['push'](handle);
  return list3;
}
function splitSpokenLine(input, output) {
  const { prefix: prefix2, body: body } = getSpeakerParts(input),
    list4 = splitAtAuthoredPauses(body)['flatMap']((value2) =>
      countStorySpokenUnits(value2) > output ? hardSplitSpokenPart(value2, output) : [value2],
    ),
    list5 = [];
  let value3 = '';
  list4['forEach']((value4) => {
    const value5 = '' + value3 + value4;
    value3 && countStorySpokenUnits(value5) > output
      ? (list5['push'](value3), (value3 = value4))
      : (value3 = value5);
  });
  if (value3) list5['push'](value3);
  return list5['map']((value6) => '' + prefix2 + value6);
}
function splitSpokenText(value7, value8) {
  return String(value7 || '')
    ['split'](/\r?\n/u)
    ['map']((value9) => value9['trim']())
    ['filter'](Boolean)
    ['flatMap']((value10) => splitSpokenLine(value10, value8));
}
function splitImpossibleSpokenShot(
  args = {},
  { maxClipDurationSeconds: maxClipDurationSeconds2, maxSpokenUnitsPerSecond: maxSpokenUnitsPerSecond2 },
) {
  const enabled = Math['max'](0, Number(args?.['durationSec']) || 0),
    list6 = ['dialogue', 'voiceover']['filter']((value11) => normalizeText(args?.[value11]));
  if (list6['length'] !== 1 || !enabled) return [args];
  const value12 = list6[0],
    countStorySpokenUnits2 = countStorySpokenUnits(args[value12]);
  if (countStorySpokenUnits2 < 8 || countStorySpokenUnits2 / enabled <= maxSpokenUnitsPerSecond2)
    return [args];
  const value13 = Math['max'](1, Math['floor'](maxClipDurationSeconds2 * maxSpokenUnitsPerSecond2)),
    list7 = splitSpokenText(args[value12], value13)['filter'](normalizeText);
  if (!list7['length']) return [args];
  return list7['map']((value14) => ({
    ...args,
    durationSec: Math['max'](1, Math['ceil'](countStorySpokenUnits(value14) / maxSpokenUnitsPerSecond2)),
    [value12]: value14,
  }));
}
function finalizeClipShots(list8 = []) {
  let startSec = 0;
  return list8['map']((args2) => {
    const value15 = Math['max'](0, Number(args2?.['durationSec']) || 0),
      value16 = Object['hasOwn'](args2 || {}, 'startSec') || Object['hasOwn'](args2 || {}, 'endSec'),
      value17 = value16 ? { ...args2, startSec: startSec, endSec: startSec + value15 } : args2;
    return ((startSec += value15), value17);
  });
}
function buildTimedClip(args3, value18, ref) {
  const shots = finalizeClipShots(value18),
    durationSec = shots['reduce'](
      (value19, value20) => value19 + Math['max'](0, Number(value20?.['durationSec']) || 0),
      0,
    ),
    script = shots['flatMap']((value21) => [
      normalizeText(value21?.['visual']),
      normalizeText(value21?.['dialogue']),
      normalizeText(value21?.['voiceover']),
    ])
      ['filter'](Boolean)
      ['join']('；');
  return {
    ...args3,
    ref: ref,
    script: script || args3['script'],
    shots: shots,
    durationSec: durationSec,
    ...(Object['hasOwn'](args3 || {}, 'contentDurationSec') ? { contentDurationSec: durationSec } : {}),
    assetRefs: [...new Set(shots['flatMap']((value22) => value22?.['assetRefs'] || []))],
  };
}
export function normalizeStoryEpisodeSpokenTiming(
  list9 = [],
  {
    maxClipDurationSeconds: maxClipDurationSeconds = 15,
    maxSpokenUnitsPerSecond: maxSpokenUnitsPerSecond = STORY_MAX_SPOKEN_UNITS_PER_SECOND,
  } = {},
) {
  const maxClipDurationSeconds3 = Math['max'](1, Number(maxClipDurationSeconds) || 15),
    maxSpokenUnitsPerSecond3 = Math['max'](
      0.1,
      Number(maxSpokenUnitsPerSecond) || STORY_MAX_SPOKEN_UNITS_PER_SECOND,
    );
  return (Array['isArray'](list9) ? list9 : [])['flatMap']((value23, value24) => {
    const list10 = Array['isArray'](value23?.['shots']) ? value23['shots'] : [],
      list11 = list10['flatMap']((value25) =>
        splitImpossibleSpokenShot(value25, {
          maxClipDurationSeconds: maxClipDurationSeconds3,
          maxSpokenUnitsPerSecond: maxSpokenUnitsPerSecond3,
        }),
      ),
      enabled2 =
        list11['length'] !== list10['length'] ||
        list11['some']((value26, value27) => value26 !== list10[value27]);
    if (!enabled2) return [value23];
    const list12 = [];
    let list13 = [],
      value28 = 0;
    list11['forEach']((value29) => {
      const value30 = Math['max'](0, Number(value29?.['durationSec']) || 0);
      (list13['length'] &&
        value28 + value30 > maxClipDurationSeconds3 &&
        (list12['push'](list13), (list13 = []), (value28 = 0)),
        list13['push'](value29),
        (value28 += value30));
    });
    if (list13['length']) list12['push'](list13);
    const text = normalizeText(value23?.['ref']) || 'clip-' + (value24 + 1);
    return list12['map']((value31, value32) =>
      buildTimedClip(value23, value31, list12['length'] === 1 ? text : text + '-timing-' + (value32 + 1)),
    );
  });
}
