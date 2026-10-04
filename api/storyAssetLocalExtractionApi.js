import { post } from './requester.js';
export const STORY_ASSET_LOCAL_EXTRACTION_PATH = '/api/v2/story-workspace/assets/extract-local';
export const STORY_ASSET_LOCAL_MODEL = 'paddlenlp/PP-UIE-0.5B';
export const STORY_ASSET_LOCAL_CHUNK_CHARACTERS = 0x2f8;
export const STORY_ASSET_LOCAL_CHUNK_OVERLAP = 0x64;
export const STORY_ASSET_LOCAL_BATCH_SIZE = 0x8;
const STORY_ASSET_LOCAL_ENTITY_KINDS = new Set(['character', 'scene', 'prop']),
  STORY_ASSET_LOCAL_EVIDENCE_MAX_CHARACTERS = 0x384;
function normalizeText(value) {
  return typeof value === 'string' ? value['trim']() : '';
}
function normalizeStringArray(item) {
  return [...new Set((Array['isArray'](item) ? item : [])['map'](normalizeText)['filter'](Boolean))];
}
function normalizeLocalEntityText(key) {
  const args = normalizeText(key)
    ['replace'](/^[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+/u, '')
    ['replace'](/[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+$/u, '')
    ['replace'](/\s+/gu, '\x20');
  if (!args || [...args]['length'] > 0x30 || /[\r\n]/u['test'](args)) return '';
  return args;
}
function normalizeLocalEntityTexts(index) {
  return normalizeStringArray(
    normalizeText(index)
      ['split'](/[,，、;；|\r\n]+/u)
      ['map'](normalizeLocalEntityText),
  );
}
export function createStoryAssetLocalExtractionChunks(
  list = [],
  {
    maxChunkCharacters: maxChunkCharacters = STORY_ASSET_LOCAL_CHUNK_CHARACTERS,
    overlapCharacters: overlapCharacters = STORY_ASSET_LOCAL_CHUNK_OVERLAP,
  } = {},
) {
  const result = Math['max'](0x12c, Math['trunc'](Number(maxChunkCharacters) || 0x0)),
    data = Math['min'](result - 0x1, Math['max'](0x0, Math['trunc'](Number(overlapCharacters) || 0x0))),
    options = Math['max'](0x1, result - data),
    list2 = [];
  return (
    (Array['isArray'](list) ? list : [])['forEach']((dom, target) => {
      const text = normalizeText(dom?.['body']);
      if (!text) return;
      let start = 0x0,
        source = 0x0;
      while (start < text['length']) {
        const end = Math['min'](text['length'], start + result);
        list2['push']({
          id: (normalizeText(dom?.['ref']) || 'scene-' + (target + 0x1)) + '-chunk-' + (source + 0x1),
          sceneRef: normalizeText(dom?.['ref']),
          episodeRef: normalizeText(dom?.['episodeRef']),
          start: start,
          end: end,
          text: text['slice'](start, end),
        });
        if (end >= text['length']) break;
        ((start += options), (source += 0x1));
      }
    }),
    list2
  );
}
export function createStoryAssetLocalExtractionBatches(
  list3 = [],
  { batchSize: batchSize = STORY_ASSET_LOCAL_BATCH_SIZE } = {},
) {
  const next = Math['max'](0x1, Math['min'](0x10, Math['trunc'](Number(batchSize) || 0x0))),
    list4 = [];
  for (let current = 0x0; current < list3['length']; current += next) {
    list4['push'](list3['slice'](current, current + next));
  }
  return list4;
}
export async function requestStoryAssetMentionsLocal(chunks, signal = {}) {
  return post(
    STORY_ASSET_LOCAL_EXTRACTION_PATH,
    {
      chunks: chunks['map']((id) => ({
        id: id['id'],
        sceneRef: id['sceneRef'],
        text: id['text'],
      })),
    },
    {
      provider: 'local',
      signal: signal['signal'],
      timeout: Number(signal['timeout']) || 0x927c0,
    },
  );
}
export async function extractStoryAssetMentionsLocal({
  sourceScenes: sourceScenes = [],
  localExtract: localExtract = requestStoryAssetMentionsLocal,
  onProgress: onProgress = null,
} = {}) {
  const chunks2 = createStoryAssetLocalExtractionChunks(sourceScenes);
  if (!chunks2['length']) throw new Error('本地 PP-UIE 没有找到可扫描的场次正文。');
  const total = createStoryAssetLocalExtractionBatches(chunks2),
    map = new Map(chunks2['map']((entry) => [entry['id'], entry])),
    list5 = [];
  let args2 = { model: STORY_ASSET_LOCAL_MODEL, device: '', precision: '' };
  for (let current2 = 0x0; current2 < total['length']; current2 += 0x1) {
    onProgress?.({
      stage: 'local-entity-extraction',
      current: current2,
      total: total['length'],
      message: 'PP-UIE 正在本地扫描证据（' + (current2 + 0x1) + '/' + total['length'] + '）',
    });
    const localExtract2 = await localExtract(total[current2]);
    args2 = {
      model: normalizeText(localExtract2?.['model']) || STORY_ASSET_LOCAL_MODEL,
      device: normalizeText(localExtract2?.['device']),
      precision: normalizeText(localExtract2?.['precision']),
    };
    const list6 = Array['isArray'](localExtract2?.['chunks']) ? localExtract2['chunks'] : [];
    list6['forEach']((record) => {
      const sceneRef = map['get'](normalizeText(record?.['id']));
      if (!sceneRef) return;
      (Array['isArray'](record?.['entities']) ? record['entities'] : [])['forEach']((response) => {
        const kind = normalizeText(response?.['kind']);
        if (!STORY_ASSET_LOCAL_ENTITY_KINDS['has'](kind)) return;
        normalizeLocalEntityTexts(response?.['text'])['forEach']((text2) => {
          const payload = Number(response?.['start']),
            handle = Number(response?.['end']),
            state =
              Number['isFinite'](payload) &&
              Number['isFinite'](handle) &&
              Math['trunc'](payload) >= 0x0 &&
              Math['trunc'](handle) > Math['trunc'](payload) &&
              sceneRef['text']['slice'](Math['trunc'](payload), Math['trunc'](handle)) === text2,
            count = state ? Math['trunc'](payload) : sceneRef['text']['indexOf'](text2);
          if (count < 0x0) return;
          list5['push']({
            kind: kind,
            text: text2,
            sceneRef: sceneRef['sceneRef'],
            episodeRef: sceneRef['episodeRef'],
            start: sceneRef['start'] + count,
            end: sceneRef['start'] + count + text2['length'],
            ...(Number['isFinite'](Number(response?.['probability']))
              ? {
                  probability: Math['max'](0x0, Math['min'](0x1, Number(response['probability']))),
                }
              : {}),
          });
        });
      });
    });
  }
  const map2 = new Map();
  return (
    list5['forEach']((response2) => {
      const config =
        response2['kind'] +
        ':' +
        response2['text']['toLowerCase']() +
        ':' +
        response2['sceneRef'] +
        ':' +
        response2['start'];
      if (!map2['has'](config)) map2['set'](config, response2);
    }),
    onProgress?.({
      stage: 'local-entity-extraction',
      current: total['length'],
      total: total['length'],
      message: 'PP-UIE 本地扫描完成：发现 ' + map2['size'] + ' 条实体证据',
    }),
    { ...args2, chunks: chunks2, mentions: [...map2['values']()] }
  );
}
function mergeEvidenceRanges(list7 = [], scope) {
  const list8 = list7['map'](([input, output]) => [Math['max'](0x0, input), Math['max'](0x0, output)])[
      'sort'
    ]((value2, value3) => value2[0x0] - value3[0x0]),
    list9 = [];
  list8['forEach'](([value4, value5]) => {
    const value6 = list9['at'](-0x1);
    value6 && value4 <= value6[0x1] + 0x28
      ? (value6[0x1] = Math['max'](value6[0x1], value5))
      : list9['push']([value4, value5]);
  });
  let count2 = scope;
  return list9['flatMap'](([value7, value8]) => {
    if (count2 <= 0x0) return [];
    const value9 = Math['min'](count2, Math['max'](0x0, value8 - value7));
    return ((count2 -= value9), value9 ? [[value7, value7 + value9]] : []);
  });
}
export function createStoryAssetLocalEvidenceScenes(list10 = [], value10 = []) {
  const map3 = new Map();
  return (
    (Array['isArray'](value10) ? value10 : [])['forEach']((value11) => {
      const text3 = normalizeText(value11?.['sceneRef']);
      if (!text3) return;
      const list11 = map3['get'](text3) || [];
      (list11['push'](value11), map3['set'](text3, list11));
    }),
    (Array['isArray'](list10) ? list10 : [])['map']((dom2) => {
      const originalBodyCharacters = normalizeText(dom2?.['body']),
        localEntityEvidence = map3['get'](normalizeText(dom2?.['ref'])) || [],
        list12 = localEntityEvidence['map']((value12) => [
          Math['max'](0x0, Number(value12['start']) - 0x5a),
          Math['min'](originalBodyCharacters['length'], Number(value12['end']) + 0xa0),
        ]);
      if (!list12['length']) {
        list12['push']([0x0, Math['min'](originalBodyCharacters['length'], 0x118)]);
        if (originalBodyCharacters['length'] > 0x118)
          list12['push']([
            Math['max'](0x0, originalBodyCharacters['length'] - 0xb4),
            originalBodyCharacters['length'],
          ]);
      }
      const list13 = mergeEvidenceRanges(list12, STORY_ASSET_LOCAL_EVIDENCE_MAX_CHARACTERS),
        value13 = list13['map'](([value14, value15]) => originalBodyCharacters['slice'](value14, value15))[
          'join'
        ]('\n……\n'),
        localEntityCandidates = {
          character: normalizeStringArray(
            localEntityEvidence['filter']((value16) => value16['kind'] === 'character')['map'](
              (response3) => response3['text'],
            ),
          ),
          scene: normalizeStringArray(
            localEntityEvidence['filter']((value17) => value17['kind'] === 'scene')['map'](
              (response4) => response4['text'],
            ),
          ),
          prop: normalizeStringArray(
            localEntityEvidence['filter']((value18) => value18['kind'] === 'prop')['map'](
              (response5) => response5['text'],
            ),
          ),
        },
        value19 = [
          localEntityCandidates['character']['length']
            ? '角色候选：' + localEntityCandidates['character']['join']('、')
            : '',
          localEntityCandidates['scene']['length']
            ? '地点候选：' + localEntityCandidates['scene']['join']('、')
            : '',
          localEntityCandidates['prop']['length']
            ? '道具候选：' + localEntityCandidates['prop']['join']('、')
            : '',
        ]
          ['filter'](Boolean)
          ['join']('；');
      return {
        ...dom2,
        characters: normalizeStringArray(Array['isArray'](dom2?.['characters']) ? dom2['characters'] : []),
        body: [value19 ? 'PP-UIE 本地候选：' + value19 : '', value13]
          ['filter'](Boolean)
          ['join']('\n证据原文：'),
        localEntityCandidates: localEntityCandidates,
        localEntityEvidence: localEntityEvidence['map']((kind2) => ({
          kind: kind2['kind'],
          text: kind2['text'],
          start: kind2['start'],
          end: kind2['end'],
          ...(Number['isFinite'](Number(kind2?.['probability']))
            ? { probability: Number(kind2['probability']) }
            : {}),
        })),
        originalBodyCharacters: originalBodyCharacters['length'],
      };
    })
  );
}
