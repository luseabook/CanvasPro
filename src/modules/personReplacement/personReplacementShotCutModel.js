import { getMediaClipTimelineDisplayDuration } from '../../components/media-clip/mediaClipTimelineModel.js';
export const PERSON_REPLACEMENT_CUT_DEFAULT_FPS = 24;
export const PERSON_REPLACEMENT_CUT_BASE_VIEWPORT_WIDTH_PX = 960;
export const PERSON_REPLACEMENT_CUT_MIN_SEC = 0.001;
export const PERSON_REPLACEMENT_CUT_EPSILON_SEC = 0.001;
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function clamp(index, result, data, options = result) {
  const target = Number(index);
  return Number['isFinite'](target) ? Math['min'](data, Math['max'](result, target)) : options;
}
function getPersonReplacementSourceShotBounds(list = []) {
  const map = new Map();
  return (
    (Array['isArray'](list) ? list : [])['forEach']((source) => {
      const text = normalizeText(source?.['sourceId']);
      if (!text) return;
      const startSec = Math['max'](0, Number(source?.['startTimeSec']) || 0),
        endSec = Math['max'](startSec, Number(source?.['endTimeSec']) || startSec),
        next = map['get'](text);
      map['set'](
        text,
        next
          ? {
              startSec: Math['min'](next['startSec'], startSec),
              endSec: Math['max'](next['endSec'], endSec),
            }
          : { startSec: startSec, endSec: endSec },
      );
    }),
    map
  );
}
function findPersonReplacementShotCutOrigin(list2 = [], current = 0, entry = 0) {
  let record = null,
    payload = -1,
    handle = Number['POSITIVE_INFINITY'];
  const state = current + (entry - current) / 2;
  return (
    (Array['isArray'](list2) ? list2 : [])['forEach']((config) => {
      const scope = Math['max'](0, Number(config?.['startTimeSec']) || 0),
        input = Math['max'](scope, Number(config?.['endTimeSec']) || scope),
        output = Math['max'](0, Math['min'](entry, input) - Math['max'](current, scope)),
        value2 = scope + (input - scope) / 2,
        value3 = Math['abs'](state - value2);
      (output > payload || (output === payload && value3 < handle)) &&
        ((record = config), (payload = output), (handle = value3));
    }),
    record
  );
}
function getPersonReplacementShotCutKeyframePatch(options2 = {}) {
  const keyframeRef = normalizeText(options2?.['keyframeRef']);
  if (!keyframeRef) return null;
  const value4 = Math['max'](0, Number(options2?.['startSec']) || 0),
    value5 = Math['max'](value4, Number(options2?.['endSec']) || value4),
    value6 = Number(options2?.['keyframeTimeSec']),
    width = Math['max'](0, Number(options2?.['frame']?.['width']) || 0),
    height = Math['max'](0, Number(options2?.['frame']?.['height']) || 0);
  return {
    keyframeRef: keyframeRef,
    keyframeTimeSec: Number['isFinite'](value6) ? clamp(value6, value4, value5, value4) : value4,
    ...(options2?.['keyframeManuallySelected'] === true ? { keyframeManuallySelected: true } : {}),
    ...(width && height ? { frame: { width: width, height: height } } : {}),
  };
}
function removePersonReplacementShotCutKeyframe(args = {}) {
  const value7 = { ...args };
  return (
    delete value7['keyframeRef'],
    delete value7['keyframeTimeSec'],
    delete value7['keyframeManuallySelected'],
    delete value7['frame'],
    value7
  );
}
export function buildPersonReplacementDetectedShotCutRanges({
  source: source2,
  shots: shots = [],
  shotBundles: shotBundles = [],
  fps: fps = PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
} = {}) {
  const sourceId = normalizeText(source2?.['id']),
    list3 = (Array['isArray'](shots) ? shots : [])
      ['filter']((value8) => normalizeText(value8?.['sourceId']) === sourceId)
      ['sort'](
        (value9, value10) =>
          Number(value9?.['startTimeSec']) - Number(value10?.['startTimeSec']) ||
          Number(value9?.['endTimeSec']) - Number(value10?.['endTimeSec']),
      );
  if (!sourceId || !list3['length']) throw new Error('智能检测缺少可映射的原始片段');
  const value11 = Math['max'](0, Number(list3[0]?.['startTimeSec']) || 0),
    value12 = Math['max'](value11, Number(list3[list3['length'] - 1]?.['endTimeSec']) || value11),
    list4 = (Array['isArray'](shotBundles) ? shotBundles : [])
      ['filter']((value13) => value13 && typeof value13 === 'object')
      ['sort'](
        (value14, value15) =>
          Number(value14?.['start']) - Number(value15?.['start']) ||
          Number(value14?.['end']) - Number(value15?.['end']),
      ),
    list5 = [];
  list4['forEach']((bundle, count) => {
    const value16 = count === 0 ? value11 : Math['max'](value11, Number(bundle?.['start']) || value11),
      startSec2 = Math['min'](value12, value16),
      value17 = list5[list5['length'] - 1],
      value18 = value17 && value12 - startSec2 < PERSON_REPLACEMENT_CUT_MIN_SEC,
      value19 = value17 && startSec2 - value17['startSec'] < PERSON_REPLACEMENT_CUT_MIN_SEC;
    if (value18 || value19) return;
    list5['push']({ bundle: bundle, startSec: startSec2 });
  });
  if (!list5['length'] || !(value12 > value11)) throw new Error('智能检测未返回可用切口');
  const map2 = new Set();
  return list5['map']((value20, count2) => {
    const startSec3 = count2 === 0 ? value11 : value20['startSec'],
      endSec2 = count2 + 1 < list5['length'] ? list5[count2 + 1]['startSec'] : value12;
    if (endSec2 - startSec3 < PERSON_REPLACEMENT_CUT_MIN_SEC) throw new Error('智能检测返回了无效切口');
    const personReplacementShotCutOrigin = findPersonReplacementShotCutOrigin(list3, startSec3, endSec2),
      originShotId = normalizeText(personReplacementShotCutOrigin?.['id']);
    if (!originShotId) throw new Error('智能检测结果无法映射到原始片段');
    const value21 = originShotId + ':detected:' + Math['round'](startSec3 * 1000),
      shotId = map2['has'](originShotId) ? value21 : originShotId;
    map2['add'](shotId);
    const outputFps = Math['max'](
        1,
        Number(value20['bundle']?.['fps']) ||
          Number(fps) ||
          Number(personReplacementShotCutOrigin?.['outputFps']) ||
          PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
      ),
      keyframeRef2 = normalizeText(value20['bundle']?.['keyframeRef']),
      value22 = Number(value20['bundle']?.['keyframeTimeSec']),
      keyframeTimeSec = Number['isFinite'](value22)
        ? Math['max'](startSec3, Math['min'](endSec2, value22))
        : startSec3;
    return {
      shotId: shotId,
      sourceId: sourceId,
      ...(shotId !== originShotId ? { originShotId: originShotId } : {}),
      startSec: startSec3,
      endSec: endSec2,
      durationSec: endSec2 - startSec3,
      outputFps: outputFps,
      ...(keyframeRef2 ? { keyframeRef: keyframeRef2, keyframeTimeSec: keyframeTimeSec } : {}),
    };
  });
}
export function normalizePersonReplacementShotCutRanges(
  list6 = [],
  value23 = [],
  { allowTimelineReplacement: allowTimelineReplacement = false } = {},
) {
  const list7 = Array['isArray'](list6) ? list6 : [],
    map3 = new Map(list7['map']((value24) => [normalizeText(value24?.['id']), value24])),
    map4 = getPersonReplacementSourceShotBounds(list7),
    list8 = Array['isArray'](value23) ? value23 : [];
  if (!list7['length'] || (!allowTimelineReplacement && list8['length'] < list7['length']))
    throw new Error('切口结果必须覆盖当前时间轴的全部片段');
  const map5 = new Set(),
    list9 = list8['map']((value25) => {
      const shotId2 = normalizeText(value25?.['shotId']),
        originShotId2 = normalizeText(value25?.['originShotId']),
        value26 = originShotId2 || shotId2,
        enabled = map3['get'](value26),
        startSec4 = Number(value25?.['startSec']),
        endSec3 = Number(value25?.['endSec']);
      if (
        !enabled ||
        !shotId2 ||
        map5['has'](shotId2) ||
        normalizeText(value25['sourceId'] || enabled['sourceId']) !== normalizeText(enabled['sourceId']) ||
        !Number['isFinite'](startSec4) ||
        !Number['isFinite'](endSec3) ||
        startSec4 < 0 ||
        endSec3 - startSec4 < PERSON_REPLACEMENT_CUT_MIN_SEC
      )
        throw new Error('片段 ' + (shotId2 || '未知') + ' 的切口范围无效');
      map5['add'](shotId2);
      const keyframeRef3 = normalizeText(value25?.['keyframeRef']),
        value27 = Number(value25?.['keyframeTimeSec']),
        keyframeTimeSec2 = Number['isFinite'](value27)
          ? Math['max'](startSec4, Math['min'](endSec3, value27))
          : startSec4,
        width2 = Math['max'](0, Number(value25?.['frame']?.['width']) || 0),
        height2 = Math['max'](0, Number(value25?.['frame']?.['height']) || 0);
      return {
        shotId: shotId2,
        sourceId: normalizeText(enabled['sourceId']),
        startSec: startSec4,
        endSec: endSec3,
        ...(originShotId2 ? { originShotId: originShotId2 } : {}),
        ...(value25?.['isReversed'] === true ? { isReversed: true } : {}),
        ...(keyframeRef3
          ? {
              keyframeRef: keyframeRef3,
              keyframeTimeSec: keyframeTimeSec2,
              ...(value25?.['keyframeManuallySelected'] === true ? { keyframeManuallySelected: true } : {}),
              ...(width2 && height2 ? { frame: { width: width2, height: height2 } } : {}),
            }
          : {}),
      };
    });
  return (
    list9['forEach']((value28, value29) => {
      const enabled2 = list9[value29 - 1],
        enabled3 = list9[value29 + 1],
        enabled4 = map3['get'](value28['originShotId'] || value28['shotId']),
        value30 = map4['get'](value28['sourceId']);
      if (!enabled4) throw new Error('片段 ' + (value28['shotId'] || '未知') + ' 缺少原始片段');
      const value31 = allowTimelineReplacement
          ? Number(value30?.['startSec'])
          : Number(enabled4['startTimeSec']),
        value32 = allowTimelineReplacement ? Number(value30?.['endSec']) : Number(enabled4['endTimeSec']);
      if (
        (!enabled2 || enabled2['sourceId'] !== value28['sourceId']) &&
        Math['abs'](value28['startSec'] - (value31 || 0)) > PERSON_REPLACEMENT_CUT_EPSILON_SEC
      )
        throw new Error('每段源视频的起点不能通过内部切口编辑器修改');
      if (
        (!enabled3 || enabled3['sourceId'] !== value28['sourceId']) &&
        Math['abs'](value28['endSec'] - (value32 || 0)) > PERSON_REPLACEMENT_CUT_EPSILON_SEC
      )
        throw new Error('每段源视频的终点不能通过内部切口编辑器修改');
      if (
        enabled2 &&
        enabled2['sourceId'] === value28['sourceId'] &&
        Math['abs'](enabled2['endSec'] - value28['startSec']) > PERSON_REPLACEMENT_CUT_EPSILON_SEC
      )
        throw new Error('相邻片段必须共享同一个切口');
    }),
    !allowTimelineReplacement &&
      list7['forEach']((value33) => {
        const text2 = normalizeText(value33?.['id']);
        if (!list9['some']((value34) => (value34['originShotId'] || value34['shotId']) === text2))
          throw new Error('切口结果必须覆盖当前时间轴的全部片段');
      }),
    list9
  );
}
export function getPersonReplacementShotDurationSec(value35) {
  const count3 = Number(value35?.['durationSec']);
  if (Number['isFinite'](count3) && count3 > 0) return count3;
  const count4 = Number(value35?.['endTimeSec']) - Number(value35?.['startTimeSec']);
  return Number['isFinite'](count4) && count4 > 0 ? count4 : 0.1;
}
export function getPersonReplacementShotCutFrameSec(value36, value37) {
  const value38 = Math['max'](
    1,
    Number(value36?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
    Number(value37?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
  );
  return Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, 1 / value38);
}
function getPersonReplacementShotCutSplitFrameSec(options3 = {}) {
  const value39 = Math['max'](1, Number(options3?.['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS);
  return Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, 1 / value39);
}
export function canSplitPersonReplacementShotCutRange(options4 = {}, value40 = 0) {
  const value41 = Math['max'](
      PERSON_REPLACEMENT_CUT_MIN_SEC,
      Number(options4?.['durationSec']) ||
        Number(options4?.['endSec']) - Number(options4?.['startSec']) ||
        0,
    ),
    personReplacementShotCutSplitFrameSec = getPersonReplacementShotCutSplitFrameSec(options4),
    value42 = Number(value40);
  return (
    Number['isFinite'](value42) &&
    value42 >= personReplacementShotCutSplitFrameSec &&
    value42 <= value41 - personReplacementShotCutSplitFrameSec
  );
}
function getPersonReplacementShotCutMergeSelection(list10 = [], value43 = []) {
  const list11 = Array['isArray'](list10) ? list10 : [],
    list12 = [
      ...new Set((Array['isArray'](value43) ? value43 : [])['map'](normalizeText)['filter'](Boolean)),
    ];
  if (list12['length'] !== 2) return null;
  const leftIndex = list12['map']((value44) =>
    list11['findIndex']((value45) => normalizeText(value45?.['shotId']) === value44),
  )['sort']((value46, value47) => value46 - value47);
  if (leftIndex[0] < 0 || leftIndex[1] !== leftIndex[0] + 1) return null;
  const left = list11[leftIndex[0]],
    right = list11[leftIndex[1]];
  if (
    !normalizeText(left?.['sourceId']) ||
    normalizeText(left?.['sourceId']) !== normalizeText(right?.['sourceId']) ||
    Boolean(left?.['isReversed']) !== Boolean(right?.['isReversed']) ||
    Math['abs'](Number(left?.['endSec']) - Number(right?.['startSec'])) > PERSON_REPLACEMENT_CUT_EPSILON_SEC
  )
    return null;
  return { left: left, right: right, leftIndex: leftIndex[0] };
}
export function canMergePersonReplacementShotCutRanges(list13 = [], value48 = []) {
  return Boolean(getPersonReplacementShotCutMergeSelection(list13, value48));
}
export function mergePersonReplacementShotCutRanges(
  list14 = [],
  value49 = [],
  { preferredShotId: preferredShotId = '' } = {},
) {
  const list15 = Array['isArray'](list14) ? list14 : [],
    personReplacementShotCutMergeSelection = getPersonReplacementShotCutMergeSelection(list15, value49);
  if (!personReplacementShotCutMergeSelection) return list14;
  const { left: left2, right: right2, leftIndex: leftIndex2 } = personReplacementShotCutMergeSelection,
    startSec5 = Math['max'](0, Number(left2['startSec']) || 0),
    endSec4 = Math['max'](startSec5, Number(right2['endSec']) || startSec5);
  if (endSec4 - startSec5 < PERSON_REPLACEMENT_CUT_MIN_SEC) return list14;
  const originShotId3 = normalizeText(left2['originShotId']) || normalizeText(left2['shotId']),
    shotId3 =
      originShotId3 + ':merge:' + Math['round'](startSec5 * 1000) + '-' + Math['round'](endSec4 * 1000);
  if (
    !originShotId3 ||
    list15['some'](
      (value50, value51) =>
        value51 !== leftIndex2 &&
        value51 !== leftIndex2 + 1 &&
        normalizeText(value50?.['shotId']) === shotId3,
    )
  )
    return list14;
  const text3 = normalizeText(preferredShotId),
    value52 = [left2, right2]
      ['sort']((value53) => (normalizeText(value53?.['shotId']) === text3 ? -1 : 1))
      ['find']((value54) => getPersonReplacementShotCutKeyframePatch(value54)),
    value55 = value52 ? getPersonReplacementShotCutKeyframePatch(value52) : null,
    value56 = {
      ...removePersonReplacementShotCutKeyframe(left2),
      shotId: shotId3,
      originShotId: originShotId3,
      startSec: startSec5,
      endSec: endSec4,
      durationSec: endSec4 - startSec5,
      outputFps: Math['max'](
        1,
        Number(left2['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
        Number(right2['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
      ),
      ...(value55 || {}),
    };
  return list15['flatMap']((value57, value58) => {
    if (value58 === leftIndex2) return [value56];
    if (value58 === leftIndex2 + 1) return [];
    return [value57];
  })['map']((args2, index2) => ({ ...args2, index: index2 }));
}
export function createPersonReplacementShotCutDraft(options5 = {}) {
  const list16 = Array['isArray'](options5['shots']) ? options5['shots'] : [],
    list17 = list16['map']((args3, index3) => {
      const startSec6 = Math['max'](0, Number(args3['startTimeSec']) || 0),
        endSec5 = Math['max'](startSec6, Number(args3['endTimeSec']) || startSec6),
        value59 =
          args3?.['keyframeManuallySelected'] === true
            ? getPersonReplacementShotCutKeyframePatch({
                ...args3,
                startSec: startSec6,
                endSec: endSec5,
              })
            : null;
      return {
        shotId: normalizeText(args3['id']),
        sourceId: normalizeText(args3['sourceId']),
        index: index3,
        startSec: startSec6,
        endSec: endSec5,
        durationSec: Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, endSec5 - startSec6),
        outputFps: Math['max'](1, Number(args3['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS),
        ...(args3['isReversed'] === true ? { isReversed: true } : {}),
        ...(value59 || {}),
      };
    });
  for (let value60 = 1; value60 < list17['length']; value60 += 1) {
    const enabled5 = list17[value60 - 1],
      value61 = list17[value60];
    if (!enabled5['sourceId'] || enabled5['sourceId'] !== value61['sourceId']) continue;
    const personReplacementShotCutFrameSec = getPersonReplacementShotCutFrameSec(enabled5, value61),
      value62 = enabled5['startSec'] + personReplacementShotCutFrameSec,
      value63 = value61['endSec'] - personReplacementShotCutFrameSec;
    if (value63 < value62) continue;
    const clamp2 = clamp(value61['startSec'], value62, value63, enabled5['endSec']);
    ((enabled5['endSec'] = clamp2),
      (enabled5['durationSec'] = Math['max'](
        personReplacementShotCutFrameSec,
        clamp2 - enabled5['startSec'],
      )),
      (value61['startSec'] = clamp2),
      (value61['durationSec'] = Math['max'](personReplacementShotCutFrameSec, value61['endSec'] - clamp2)));
  }
  return list17;
}
export function doesPersonReplacementShotCutDraftReplaceTimeline(list18 = [], value64 = []) {
  const map6 = new Set(
    (Array['isArray'](value64) ? value64 : [])
      ['map']((value65) => normalizeText(value65?.['originShotId']) || normalizeText(value65?.['shotId']))
      ['filter'](Boolean),
  );
  return (Array['isArray'](list18) ? list18 : [])['some'](
    (value66) => !map6['has'](normalizeText(value66?.['id'])),
  );
}
export function createPersonReplacementShotCutUpdateRequest(list19 = [], value67 = [], value68 = '') {
  return {
    selectedShotId: normalizeText(value68),
    replaceTimeline: doesPersonReplacementShotCutDraftReplaceTimeline(list19, value67),
    ranges: (Array['isArray'](value67) ? value67 : [])['map']((shotId4) => ({
      shotId: shotId4['shotId'],
      sourceId: shotId4['sourceId'],
      startSec: shotId4['startSec'],
      endSec: shotId4['endSec'],
      ...(shotId4['originShotId'] ? { originShotId: shotId4['originShotId'] } : {}),
      ...(shotId4['isReversed'] === true ? { isReversed: true } : {}),
      ...(shotId4['keyframeRef']
        ? {
            keyframeRef: shotId4['keyframeRef'],
            keyframeTimeSec: shotId4['keyframeTimeSec'],
            ...(shotId4['keyframeManuallySelected'] === true ? { keyframeManuallySelected: true } : {}),
            frame: shotId4['frame'],
          }
        : {}),
    })),
  };
}
export function hasPersonReplacementShotCutUpdateChanges(list20 = [], value69 = []) {
  const list21 = Array['isArray'](list20) ? list20 : [],
    list22 = Array['isArray'](value69) ? value69 : [],
    map7 = new Map(list21['map']((value70) => [normalizeText(value70?.['id']), value70]));
  if (list21['length'] !== list22['length']) return true;
  return list22['some']((value71) => {
    const text4 = normalizeText(value71?.['shotId']),
      enabled6 = map7['get'](text4) || map7['get'](normalizeText(value71?.['originShotId'])),
      text5 = normalizeText(value71?.['keyframeRef']);
    return (
      !enabled6 ||
      !map7['has'](text4) ||
      Math['abs'](Number(value71?.['startSec']) - Number(enabled6?.['startTimeSec'])) >
        PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
      Math['abs'](Number(value71?.['endSec']) - Number(enabled6?.['endTimeSec'])) >
        PERSON_REPLACEMENT_CUT_EPSILON_SEC ||
      Boolean(value71?.['isReversed']) !== Boolean(enabled6?.['isReversed']) ||
      Boolean(
        text5 &&
        Boolean(value71?.['keyframeManuallySelected']) !== Boolean(enabled6?.['keyframeManuallySelected']),
      ) ||
      Boolean(
        text5 &&
        (text5 !== normalizeText(enabled6?.['keyframeRef']) ||
          Math['abs'](Number(value71?.['keyframeTimeSec']) - Number(enabled6?.['keyframeTimeSec'])) >
            PERSON_REPLACEMENT_CUT_EPSILON_SEC),
      )
    );
  });
}
export function movePersonReplacementShotCutBoundary(list23 = [], value72, value73) {
  const list24 = (Array['isArray'](list23) ? list23 : [])['map']((args4) => ({ ...args4 })),
    count5 = Math['trunc'](Number(value72));
  if (!(count5 > 0 && count5 < list24['length'])) return list24;
  const enabled7 = list24[count5 - 1],
    value74 = list24[count5];
  if (!enabled7?.['sourceId'] || enabled7['sourceId'] !== value74?.['sourceId']) return list24;
  const personReplacementShotCutFrameSec2 = getPersonReplacementShotCutFrameSec(enabled7, value74),
    value75 = Math['max'](
      1,
      Number(enabled7['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
      Number(value74['outputFps']) || PERSON_REPLACEMENT_CUT_DEFAULT_FPS,
    ),
    value76 = enabled7['startSec'] + personReplacementShotCutFrameSec2,
    value77 = value74['endSec'] - personReplacementShotCutFrameSec2;
  if (value77 < value76) return list24;
  const clamp3 = clamp(value73, value76, value77, value74['startSec']),
    clamp4 = clamp(Math['round'](clamp3 * value75) / value75, value76, value77, clamp3);
  return (
    (enabled7['endSec'] = clamp4),
    (enabled7['durationSec'] = Math['max'](personReplacementShotCutFrameSec2, clamp4 - enabled7['startSec'])),
    (value74['startSec'] = clamp4),
    (value74['durationSec'] = Math['max'](personReplacementShotCutFrameSec2, value74['endSec'] - clamp4)),
    list24
  );
}
export function countEditablePersonReplacementShotCuts(list25 = []) {
  return list25['reduce'](
    (value78, value79, count6) =>
      count6 > 0 && list25[count6 - 1]?.['sourceId'] === value79['sourceId'] ? value78 + 1 : value78,
    0,
  );
}
export function getPersonReplacementShotCutTotalDuration(list26 = []) {
  return (Array['isArray'](list26) ? list26 : [])['reduce'](
    (value80, value81) =>
      value80 + Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(value81?.['durationSec']) || 0),
    0,
  );
}
export function getPersonReplacementShotCutDisplayDuration(list27 = []) {
  return getMediaClipTimelineDisplayDuration(getPersonReplacementShotCutTotalDuration(list27));
}
export function getPersonReplacementShotCutPositionAtTimelineSec(list28 = [], value82 = 0) {
  const list29 = Array['isArray'](list28) ? list28 : [],
    totalDurationSec = getPersonReplacementShotCutTotalDuration(list29),
    timelineSec = clamp(value82, 0, totalDurationSec, 0);
  let value83 = 0;
  for (let shotIndex = 0; shotIndex < list29['length']; shotIndex += 1) {
    const sourceTimeSec = list29[shotIndex],
      count7 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(sourceTimeSec?.['durationSec']) || 0),
      value84 = shotIndex === list29['length'] - 1;
    if (timelineSec < value83 + count7 || value84) {
      const clamp5 = clamp(timelineSec - value83, 0, count7, 0),
        value85 = Number(sourceTimeSec?.['startSec']) || 0,
        value86 = Math['max'](value85, Number(sourceTimeSec?.['endSec']) || value85),
        personReplacementShotCutSplitFrameSec2 = getPersonReplacementShotCutSplitFrameSec(sourceTimeSec),
        value87 = Math['max'](
          0,
          value86 - value85 - Math['min'](personReplacementShotCutSplitFrameSec2, value86 - value85),
        ),
        value88 = count7 > 0 ? clamp(clamp5 / count7, 0, 1, 0) : 0;
      return {
        shotId: normalizeText(sourceTimeSec?.['shotId']),
        sourceId: normalizeText(sourceTimeSec?.['sourceId']),
        shotIndex: shotIndex,
        sourceTimeSec:
          sourceTimeSec?.['isReversed'] === true
            ? clamp(value85 + value87 * (1 - value88), value85, value86, value85)
            : clamp(value85 + clamp5, value85, value86, value85),
        timelineSec: timelineSec,
        totalDurationSec: totalDurationSec,
      };
    }
    value83 += count7;
  }
  return {
    shotId: '',
    sourceId: '',
    shotIndex: -1,
    sourceTimeSec: 0,
    timelineSec: 0,
    totalDurationSec: totalDurationSec,
  };
}
export function splitPersonReplacementShotCutAtTimelineSec(list30 = [], value89 = 0) {
  const list31 = Array['isArray'](list30) ? list30 : [],
    personReplacementShotCutTotalDuration = getPersonReplacementShotCutTotalDuration(list31),
    clamp6 = clamp(value89, 0, personReplacementShotCutTotalDuration, 0);
  let value90 = 0;
  for (let value91 = 0; value91 < list31['length']; value91 += 1) {
    const args5 = list31[value91],
      value92 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(args5?.['durationSec']) || 0),
      value93 = clamp6 - value90;
    if (!canSplitPersonReplacementShotCutRange(args5, value93)) {
      value90 += value92;
      continue;
    }
    const endSec6 = clamp(
        Number(args5['startSec']) + value93,
        Number(args5['startSec']) || 0,
        Number(args5['endSec']) || Number(args5['startSec']) || 0,
        Number(args5['startSec']) || 0,
      ),
      originShotId4 = normalizeText(args5['originShotId']) || normalizeText(args5['shotId']),
      shotId5 = originShotId4 + ':split:' + Math['round'](endSec6 * 1000);
    if (list31['some']((value94) => normalizeText(value94?.['shotId']) === shotId5)) return list31;
    const personReplacementShotCutKeyframePatch = getPersonReplacementShotCutKeyframePatch(args5),
      args6 = personReplacementShotCutKeyframePatch
        ? removePersonReplacementShotCutKeyframe(args5)
        : { ...args5 },
      value95 = {
        ...args6,
        endSec: endSec6,
        durationSec: Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, endSec6 - args5['startSec']),
      },
      value96 = {
        ...args6,
        shotId: shotId5,
        originShotId: originShotId4,
        startSec: endSec6,
        durationSec: Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, args5['endSec'] - endSec6),
      };
    return (
      personReplacementShotCutKeyframePatch &&
        Object['assign'](
          personReplacementShotCutKeyframePatch['keyframeTimeSec'] < endSec6 ? value95 : value96,
          personReplacementShotCutKeyframePatch,
        ),
      list31['flatMap']((value97, value98) => (value98 === value91 ? [value95, value96] : [value97]))['map'](
        (args7, index4) => ({ ...args7, index: index4 }),
      )
    );
  }
  return list31;
}
export function getPersonReplacementShotCutTimelineSec(list32 = [], value99, value100) {
  const text6 = normalizeText(value99);
  let value101 = 0;
  for (const value102 of Array['isArray'](list32) ? list32 : []) {
    const value103 = Math['max'](PERSON_REPLACEMENT_CUT_MIN_SEC, Number(value102?.['durationSec']) || 0);
    if (normalizeText(value102?.['shotId']) === text6) {
      if (value102?.['isReversed'] === true) {
        const value104 = Number(value102?.['startSec']) || 0,
          value105 = Math['max'](value104, Number(value102?.['endSec']) || value104),
          personReplacementShotCutSplitFrameSec3 = getPersonReplacementShotCutSplitFrameSec(value102),
          count8 = Math['max'](
            0,
            value105 - value104 - Math['min'](personReplacementShotCutSplitFrameSec3, value105 - value104),
          );
        if (!(count8 > 0)) return value101;
        const clamp7 = clamp(Number(value100) - value104, 0, count8, 0);
        return value101 + (1 - clamp7 / count8) * value103;
      }
      return value101 + clamp(Number(value100) - Number(value102?.['startSec']), 0, value103, 0);
    }
    value101 += value103;
  }
  return 0;
}
