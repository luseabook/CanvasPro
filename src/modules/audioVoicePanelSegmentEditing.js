import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
import {
  cloneAudioVoiceSegment,
  createAudioVoicePayloadError,
  firstNonEmptyString,
} from './audioVoicePanelSegmentState.js';
export const AUDIO_VOICE_SOURCE_CLIP_MIN_MS = 100;
function buildAudioVoiceSegmentFingerprint(options = {}) {
  return JSON['stringify'](cloneAudioVoiceSegment(options));
}
export function buildAudioVoicePendingSegmentMerge(args = {}, value = {}) {
  const currentSegmentId = String(args['id'] || '')['trim'](),
    nextSegmentId = String(value['id'] || '')['trim']();
  if (!currentSegmentId || !nextSegmentId) return null;
  const startMs = Math['max'](0, Math['round'](Number(args['startMs']) || 0)),
    endMs = Math['max'](startMs, Math['round'](Number(value['endMs']) || startMs)),
    draftSegment = cloneAudioVoiceSegment({
      ...args,
      startMs: startMs,
      endMs: endMs,
      sourceText: [args['sourceText'], value['sourceText']]['filter'](Boolean)['join'](' '),
      targetText: [args['targetText'], value['targetText']]['filter'](Boolean)['join'](' '),
      convertedAudioLocalPath: '',
      convertedAudioUrl: '',
      convertedAudioDuration: 0,
      convertedAudioReady: ![],
      activeAudio: 'source',
      status: 'edited',
      error: '',
      rhTaskId: '',
    });
  return {
    currentSegmentId: currentSegmentId,
    nextSegmentId: nextSegmentId,
    currentFingerprint: buildAudioVoiceSegmentFingerprint(args),
    nextFingerprint: buildAudioVoiceSegmentFingerprint(value),
    draftSegment: draftSegment,
  };
}
export function projectAudioVoicePendingSegmentMerges(list = [], item = []) {
  const list2 = Array['isArray'](list) ? list : [],
    list3 = (Array['isArray'](item) ? item : [])['filter'](
      (key) => key?.['currentSegmentId'] && key?.['nextSegmentId'] && key?.['draftSegment'],
    );
  if (list3['length'] <= 0) return [...list2];
  const map = new Map(list3['map']((index) => [String(index['currentSegmentId']), index['draftSegment']])),
    map2 = new Set(list3['map']((result) => String(result['nextSegmentId'])));
  return list2['filter']((data) => !map2['has'](String(data?.['id'] || '')))['map'](
    (target) => map['get'](String(target?.['id'] || '')) || target,
  );
}
export function isAudioVoicePendingSegmentMergeCurrent(options2 = {}, source = []) {
  const list4 = (Array['isArray'](source) ? source : [])['filter'](
      (response) => response?.['status'] !== 'removed',
    ),
    count = list4['findIndex'](
      (next) => String(next?.['id'] || '') === String(options2['currentSegmentId'] || ''),
    );
  if (count < 0) return ![];
  const current = list4[count],
    enabled = list4[count + 1];
  if (!enabled || String(enabled['id'] || '') !== String(options2['nextSegmentId'] || '')) return ![];
  return (
    buildAudioVoiceSegmentFingerprint(current) === String(options2['currentFingerprint'] || '') &&
    buildAudioVoiceSegmentFingerprint(enabled) === String(options2['nextFingerprint'] || '')
  );
}
export async function mergeAudioVoiceSourceSegments(options3 = {}, entry = {}, record = {}) {
  const run = record['composeAudio'];
  if (typeof run !== 'function') throw new TypeError('composeAudio is required');
  const localPath = normalizeLocalPath(options3['sourceAudioLocalPath'] || ''),
    localPath2 = normalizeLocalPath(entry['sourceAudioLocalPath'] || '');
  if (!localPath || !localPath2) throw createAudioVoicePayloadError('audioMissing');
  const durationMs =
      Math['max'](
        0,
        Math['round'](Number(options3['endMs']) || 0) - Math['round'](Number(options3['startMs']) || 0),
      ) +
      Math['max'](
        0,
        Math['round'](Number(entry['endMs']) || 0) - Math['round'](Number(entry['startMs']) || 0),
      ),
    response2 = await run([localPath, localPath2], { durationMs: durationMs }),
    localPath3 = normalizeLocalPath(response2?.['localPath'] || response2?.['path'] || ''),
    audioUrl = firstNonEmptyString(response2?.['audioUrl'], response2?.['url'], localPathToUrl(localPath3));
  if (!localPath3 && !audioUrl) throw createAudioVoicePayloadError('sourceClipFailed');
  const audioVoicePendingSegmentMerge = buildAudioVoicePendingSegmentMerge(options3, entry);
  if (!audioVoicePendingSegmentMerge) throw createAudioVoicePayloadError('sourceClipFailed');
  const args2 = audioVoicePendingSegmentMerge['draftSegment'],
    startMs2 = args2['startMs'],
    endMs2 = args2['endMs'];
  return cloneAudioVoiceSegment({
    ...args2,
    ...buildAudioVoiceApplySourceClipPatch(args2, {
      startMs: startMs2,
      endMs: endMs2,
      localPath: localPath3,
      audioUrl: audioUrl,
      sourceClipBaseAudioLocalPath: localPath3,
      sourceClipBaseAudioUrl: audioUrl,
      sourceClipBaseStartMs: startMs2,
      sourceClipBaseEndMs: startMs2 + durationMs,
    }),
  });
}
export function buildAudioVoiceTextEditPatch(options4 = {}, payload = '') {
  const handle = String(options4['sourceText'] || ''),
    state = String(payload || ''),
    targetText = state['trim']() && state['trim']() !== handle['trim']();
  return {
    targetText: targetText ? state : '',
    convertedAudioLocalPath: '',
    convertedAudioUrl: '',
    convertedAudioDuration: 0,
    convertedAudioReady: ![],
    activeAudio: 'source',
    status: targetText ? 'edited' : options4['sourceAudioReady'] ? 'detected' : 'edited',
    error: '',
    rhTaskId: '',
  };
}
export function shouldCloseAudioVoiceEmptyConvertedTextEdit(event = {}, el = {}) {
  return (
    event?.['key'] === 'Backspace' &&
    el?.['dataset']?.['audioVoiceTextKind'] === 'converted' &&
    String(el?.['value'] ?? '') === ''
  );
}
export function applyAudioVoiceTranslationResults(list5 = [], config = []) {
  const map3 = new Map(
    (Array['isArray'](config) ? config : [])
      ['map']((scope) => [
        String(scope?.['id'] || '')['trim'](),
        String(scope?.['targetText'] || '')['trim'](),
      ])
      ['filter'](([input, output]) => input && output),
  );
  return (Array['isArray'](list5) ? list5 : [])['map']((args3) => {
    const targetText2 = map3['get'](String(args3?.['id'] || '')['trim']());
    if (!targetText2) return args3;
    return {
      ...args3,
      ...buildAudioVoiceTextEditPatch(args3, targetText2),
      targetText: targetText2,
      status: 'edited',
    };
  });
}
export function buildAudioVoiceApplySourceClipPatch(options5 = {}, value2 = {}) {
  const startMs3 = Math['max'](0, Math['round'](Number(value2['startMs'] ?? options5['startMs']) || 0)),
    endMs3 = Math['max'](startMs3, Math['round'](Number(value2['endMs'] ?? options5['endMs']) || startMs3)),
    sourceAudioLocalPath = normalizeLocalPath(value2['localPath'] || value2['sourceAudioLocalPath'] || ''),
    sourceAudioUrl = firstNonEmptyString(
      value2['audioUrl'],
      value2['sourceAudioUrl'],
      localPathToUrl(sourceAudioLocalPath),
    ),
    hasAudioVoiceSourceClipBase2 = hasAudioVoiceSourceClipBase(options5),
    value3 = hasAudioVoiceSourceClipBase2 ? options5['sourceClipBaseStartMs'] : options5['startMs'],
    value4 = hasAudioVoiceSourceClipBase2 ? options5['sourceClipBaseEndMs'] : options5['endMs'],
    sourceClipBaseStartMs = Math['max'](
      0,
      Math['round'](Number(value2['sourceClipBaseStartMs'] ?? value3) || 0),
    ),
    sourceClipBaseEndMs = Math['max'](
      sourceClipBaseStartMs,
      Math['round'](Number(value2['sourceClipBaseEndMs'] ?? value4) || sourceClipBaseStartMs),
    ),
    sourceClipBaseAudioLocalPath = normalizeLocalPath(
      value2['sourceClipBaseAudioLocalPath'] ||
        options5['sourceClipBaseAudioLocalPath'] ||
        options5['sourceAudioLocalPath'] ||
        sourceAudioLocalPath,
    ),
    sourceClipBaseAudioUrl = firstNonEmptyString(
      value2['sourceClipBaseAudioUrl'],
      options5['sourceClipBaseAudioUrl'],
      sourceClipBaseAudioLocalPath ? localPathToUrl(sourceClipBaseAudioLocalPath) : '',
    );
  return {
    startMs: startMs3,
    endMs: endMs3,
    sourceAudioLocalPath: sourceAudioLocalPath,
    sourceAudioUrl: sourceAudioUrl,
    sourceClipBaseAudioLocalPath: sourceClipBaseAudioLocalPath,
    sourceClipBaseAudioUrl: sourceClipBaseAudioUrl,
    sourceClipBaseStartMs: sourceClipBaseStartMs,
    sourceClipBaseEndMs: sourceClipBaseEndMs,
    sourceAudioReady: !!sourceAudioUrl,
    convertedAudioLocalPath: '',
    convertedAudioUrl: '',
    convertedAudioDuration: 0,
    convertedAudioReady: ![],
    activeAudio: 'source',
    status: 'edited',
    error: '',
    rhTaskId: '',
    needsSourceAudioRecut: ![],
  };
}
function hasAudioVoiceSourceClipBase(options6 = {}) {
  return (
    !!normalizeLocalPath(options6['sourceClipBaseAudioLocalPath'] || '') ||
    !!String(options6['sourceClipBaseAudioUrl'] || '')['trim']() ||
    Math['round'](Number(options6['sourceClipBaseEndMs']) || 0) >
      Math['round'](Number(options6['sourceClipBaseStartMs']) || 0)
  );
}
export function resolveAudioVoiceSourceClipEditBase(options7 = {}, value5 = {}) {
  const hasAudioVoiceSourceClipBase3 = hasAudioVoiceSourceClipBase(options7),
    localPath4 = normalizeLocalPath(options7['sourceClipBaseAudioLocalPath'] || ''),
    localPath5 = normalizeLocalPath(options7['sourceAudioLocalPath'] || ''),
    localPath6 = normalizeLocalPath(value5['analysisSourceAudioLocalPath'] || value5['localPath'] || ''),
    localPath7 = localPath4 || localPath5 || localPath6,
    audioUrl2 = firstNonEmptyString(
      options7['sourceClipBaseAudioUrl'],
      !localPath4 ? options7['sourceAudioUrl'] : '',
      value5['analysisSourceAudioUrl'],
      value5['audioUrl'],
      localPathToUrl(localPath7),
    ),
    value6 = Math['max'](0, Math['round'](Number(options7['startMs']) || 0)),
    value7 = Math['max'](value6, Math['round'](Number(options7['endMs']) || value6)),
    startMs4 = Math['max'](
      0,
      Math['round'](Number(hasAudioVoiceSourceClipBase3 ? options7['sourceClipBaseStartMs'] : value6) || 0),
    ),
    endMs4 = Math['max'](
      startMs4,
      Math['round'](
        Number(hasAudioVoiceSourceClipBase3 ? options7['sourceClipBaseEndMs'] : value7) || startMs4,
      ),
    );
  return {
    localPath: localPath7,
    audioUrl: audioUrl2,
    startMs: startMs4,
    endMs: endMs4,
    durationMs: Math['max'](0, endMs4 - startMs4),
  };
}
function splitAudioVoiceTextAtRatio(value8 = '', value9 = 0.5) {
  const enabled2 = String(value8 || '');
  if (!enabled2) return ['', ''];
  const list6 = Array['from'](enabled2);
  if (list6['length'] <= 1) return [enabled2, ''];
  const value10 = Math['max'](0, Math['min'](1, Number(value9) || 0)),
    value11 = Math['max'](1, Math['min'](list6['length'] - 1, Math['round'](list6['length'] * value10)));
  return [list6['slice'](0, value11)['join']('')['trim'](), list6['slice'](value11)['join']('')['trim']()];
}
export function buildAudioVoiceSplitSourceSegmentDraft(args4 = {}, value12 = {}) {
  const startMs5 = Math['max'](0, Math['round'](Number(value12['selectionStartMs']) || 0)),
    endMs5 = Math['max'](startMs5, Math['round'](Number(value12['selectionEndMs']) || 0)),
    endMs6 = Math['round'](Number(value12['splitAtMs']) || 0);
  if (endMs6 - startMs5 < AUDIO_VOICE_SOURCE_CLIP_MIN_MS || endMs5 - endMs6 < AUDIO_VOICE_SOURCE_CLIP_MIN_MS)
    return null;
  const args5 = {
      sourceAudioLocalPath: '',
      sourceAudioUrl: '',
      sourceAudioReady: ![],
      convertedAudioLocalPath: '',
      convertedAudioUrl: '',
      convertedAudioDuration: 0,
      convertedAudioReady: ![],
      activeAudio: 'source',
      status: 'edited',
      error: '',
      rhTaskId: '',
      needsSourceAudioRecut: !![],
    },
    value13 = endMs5 > startMs5 ? (endMs6 - startMs5) / (endMs5 - startMs5) : 0.5,
    [sourceText, sourceText2] = splitAudioVoiceTextAtRatio(args4['sourceText'], value13),
    [targetText3, targetText4] = splitAudioVoiceTextAtRatio(args4['targetText'], value13),
    cloneAudioVoiceSegment2 = cloneAudioVoiceSegment({
      ...args4,
      ...args5,
      startMs: startMs5,
      endMs: endMs6,
      sourceText: sourceText,
      targetText: targetText3,
    }),
    cloneAudioVoiceSegment3 = cloneAudioVoiceSegment({
      ...args4,
      ...args5,
      id: String(value12['newSegmentId'] || 'audio-voice-split-' + Date['now']()),
      startMs: endMs6,
      endMs: endMs5,
      sourceText: sourceText2,
      targetText: targetText4,
    });
  return [cloneAudioVoiceSegment2, cloneAudioVoiceSegment3];
}
function normalizeAudioVoiceSourceClipRanges(list7 = []) {
  if (!Array['isArray'](list7) || list7['length'] < 2) return null;
  const list8 = list7['map']((value14, count2) => {
    const startMs6 = Math['max'](0, Math['round'](Number(value14?.['startMs']) || 0)),
      endMs7 = Math['max'](startMs6, Math['round'](Number(value14?.['endMs']) || 0));
    return {
      id: String(value14?.['id'] || (count2 === 0 ? 'left' : 'right')),
      startMs: startMs6,
      endMs: endMs7,
    };
  })
    ['filter']((value15) => value15['endMs'] - value15['startMs'] >= AUDIO_VOICE_SOURCE_CLIP_MIN_MS)
    ['sort']((value16, value17) => value16['startMs'] - value17['startMs'])
    ['slice'](0, 2);
  if (list8['length'] < 2) return null;
  if (list8[0]['endMs'] > list8[1]['startMs']) return null;
  return list8;
}
function buildAudioVoiceRangeSourceSegmentDraft(args6 = {}, value18 = {}) {
  const list9 = normalizeAudioVoiceSourceClipRanges(value18['rangesMs']);
  if (!list9) return null;
  const args7 = {
      sourceAudioLocalPath: '',
      sourceAudioUrl: '',
      sourceAudioReady: ![],
      convertedAudioLocalPath: '',
      convertedAudioUrl: '',
      convertedAudioDuration: 0,
      convertedAudioReady: ![],
      activeAudio: 'source',
      status: 'edited',
      error: '',
      rhTaskId: '',
      needsSourceAudioRecut: !![],
    },
    count3 = list9['reduce'](
      (value19, value20) => value19 + Math['max'](0, value20['endMs'] - value20['startMs']),
      0,
    ),
    value21 = count3 > 0 ? (list9[0]['endMs'] - list9[0]['startMs']) / count3 : 0.5,
    [value22, value23] = splitAudioVoiceTextAtRatio(args6['sourceText'], value21),
    [value24, value25] = splitAudioVoiceTextAtRatio(args6['targetText'], value21),
    sourceText3 = [
      [value22, value24],
      [value23, value25],
    ];
  return list9['map']((startMs7, id) =>
    cloneAudioVoiceSegment({
      ...args6,
      ...args7,
      id: id === 0 ? args6['id'] : String(value18['newSegmentId'] || 'audio-voice-split-' + Date['now']()),
      startMs: startMs7['startMs'],
      endMs: startMs7['endMs'],
      sourceText: sourceText3[id]?.[0] || '',
      targetText: sourceText3[id]?.[1] || '',
    }),
  );
}
export async function commitAudioVoiceSourceClipEdit(args8 = {}, rangesMs = {}) {
  const run2 = rangesMs['cutRange'];
  if (typeof run2 !== 'function') throw new TypeError('cutRange is required');
  const sourceClipBaseAudioLocalPath2 = resolveAudioVoiceSourceClipEditBase(
      args8,
      rangesMs['editBase'] || {},
    ),
    selectionStartMs = Math['max'](0, Math['round'](Number(rangesMs['selectionStartMs']) || 0)),
    selectionEndMs = Math['max'](selectionStartMs, Math['round'](Number(rangesMs['selectionEndMs']) || 0));
  if (selectionEndMs - selectionStartMs < AUDIO_VOICE_SOURCE_CLIP_MIN_MS)
    throw createAudioVoicePayloadError('sourceClipInvalidSelection');
  const enabled3 = Array['isArray'](rangesMs['rangesMs']) && rangesMs['rangesMs']['length'] > 0,
    enabled4 = enabled3
      ? buildAudioVoiceRangeSourceSegmentDraft(args8, {
          rangesMs: rangesMs['rangesMs'],
          newSegmentId: rangesMs['newSegmentId'],
        })
      : null;
  if (enabled3 && !enabled4) throw createAudioVoicePayloadError('sourceClipSplitAtMiddle');
  const value26 = !enabled3 && rangesMs['splitAtMs'] !== undefined && rangesMs['splitAtMs'] !== null,
    enabled5 = value26
      ? buildAudioVoiceSplitSourceSegmentDraft(args8, {
          selectionStartMs: selectionStartMs,
          selectionEndMs: selectionEndMs,
          splitAtMs: rangesMs['splitAtMs'],
          newSegmentId: rangesMs['newSegmentId'],
        })
      : null;
  if (value26 && !enabled5) throw createAudioVoicePayloadError('sourceClipSplitAtMiddle');
  const value27 = enabled4 ||
      enabled5 || [cloneAudioVoiceSegment({ ...args8, startMs: selectionStartMs, endMs: selectionEndMs })],
    list10 = [];
  for (const startMs8 of value27) {
    const response3 = await run2({ startMs: startMs8['startMs'], endMs: startMs8['endMs'] }),
      sourceClipBaseAudioLocalPath3 = normalizeLocalPath(
        response3?.['localPath'] || response3?.['path'] || response3?.['sourceAudioLocalPath'] || '',
      ),
      sourceClipBaseAudioUrl2 = firstNonEmptyString(
        response3?.['audioUrl'],
        response3?.['url'],
        response3?.['sourceAudioUrl'],
        localPathToUrl(sourceClipBaseAudioLocalPath3),
      ),
      args9 =
        enabled4 || enabled5
          ? {
              sourceClipBaseAudioLocalPath: sourceClipBaseAudioLocalPath3,
              sourceClipBaseAudioUrl: sourceClipBaseAudioUrl2,
              sourceClipBaseStartMs: startMs8['startMs'],
              sourceClipBaseEndMs: startMs8['endMs'],
            }
          : {
              sourceClipBaseAudioLocalPath: sourceClipBaseAudioLocalPath2['localPath'],
              sourceClipBaseAudioUrl: sourceClipBaseAudioLocalPath2['audioUrl'],
              sourceClipBaseStartMs: sourceClipBaseAudioLocalPath2['startMs'],
              sourceClipBaseEndMs: sourceClipBaseAudioLocalPath2['endMs'],
            };
    list10['push'](
      cloneAudioVoiceSegment({
        ...startMs8,
        ...buildAudioVoiceApplySourceClipPatch(startMs8, {
          startMs: startMs8['startMs'],
          endMs: startMs8['endMs'],
          localPath: sourceClipBaseAudioLocalPath3,
          audioUrl: sourceClipBaseAudioUrl2,
          ...args9,
        }),
      }),
    );
  }
  return list10;
}
