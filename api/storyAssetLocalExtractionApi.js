import { post } from './requester.js';
export const STORY_ASSET_LOCAL_EXTRACTION_PATH = '/api/v2/story-workspace/assets/extract-local';
export const STORY_ASSET_LOCAL_MODEL = 'paddlenlp/PP-UIE-0.5B';
export const STORY_ASSET_LOCAL_CHUNK_CHARACTERS = 0x2f8;
export const STORY_ASSET_LOCAL_CHUNK_OVERLAP = 0x64;
export const STORY_ASSET_LOCAL_BATCH_SIZE = 0x8;
const STORY_ASSET_LOCAL_ENTITY_KINDS = new Set(['character', 'scene', 'prop']),
  STORY_ASSET_LOCAL_EVIDENCE_MAX_CHARACTERS = 0x384;
function normalizeText(_0x5bc26d) {
  return typeof _0x5bc26d === 'string' ? _0x5bc26d['trim']() : '';
}
function normalizeStringArray(_0x2074e2) {
  return [
    ...new Set((Array['isArray'](_0x2074e2) ? _0x2074e2 : [])['map'](normalizeText)['filter'](Boolean)),
  ];
}
function normalizeLocalEntityText(_0x52a240) {
  const _0x4289da = normalizeText(_0x52a240)
    ['replace'](/^[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+/u, '')
    ['replace'](/[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+$/u, '')
    ['replace'](/\s+/gu, '\x20');
  if (!_0x4289da || [..._0x4289da]['length'] > 0x30 || /[\r\n]/u['test'](_0x4289da)) return '';
  return _0x4289da;
}
function normalizeLocalEntityTexts(_0x46bd44) {
  return normalizeStringArray(
    normalizeText(_0x46bd44)
      ['split'](/[,，、;；|\r\n]+/u)
      ['map'](normalizeLocalEntityText),
  );
}
export function createStoryAssetLocalExtractionChunks(
  _0x2e70de = [],
  {
    maxChunkCharacters: maxChunkCharacters = STORY_ASSET_LOCAL_CHUNK_CHARACTERS,
    overlapCharacters: overlapCharacters = STORY_ASSET_LOCAL_CHUNK_OVERLAP,
  } = {},
) {
  const _0x5513b0 = Math['max'](0x12c, Math['trunc'](Number(maxChunkCharacters) || 0x0)),
    _0x27c5de = Math['min'](
      _0x5513b0 - 0x1,
      Math['max'](0x0, Math['trunc'](Number(overlapCharacters) || 0x0)),
    ),
    _0x185350 = Math['max'](0x1, _0x5513b0 - _0x27c5de),
    _0x4c2d09 = [];
  return (
    (Array['isArray'](_0x2e70de) ? _0x2e70de : [])['forEach']((_0x2b1202, _0x9c5d2f) => {
      const _0x2d7802 = normalizeText(_0x2b1202?.['body']);
      if (!_0x2d7802) return;
      let _0x587419 = 0x0,
        _0x4116fa = 0x0;
      while (_0x587419 < _0x2d7802['length']) {
        const _0x3640f2 = Math['min'](_0x2d7802['length'], _0x587419 + _0x5513b0);
        _0x4c2d09['push']({
          id:
            (normalizeText(_0x2b1202?.['ref']) || 'scene-' + (_0x9c5d2f + 0x1)) +
            '-chunk-' +
            (_0x4116fa + 0x1),
          sceneRef: normalizeText(_0x2b1202?.['ref']),
          episodeRef: normalizeText(_0x2b1202?.['episodeRef']),
          start: _0x587419,
          end: _0x3640f2,
          text: _0x2d7802['slice'](_0x587419, _0x3640f2),
        });
        if (_0x3640f2 >= _0x2d7802['length']) break;
        ((_0x587419 += _0x185350), (_0x4116fa += 0x1));
      }
    }),
    _0x4c2d09
  );
}
export function createStoryAssetLocalExtractionBatches(
  _0x455111 = [],
  { batchSize: batchSize = STORY_ASSET_LOCAL_BATCH_SIZE } = {},
) {
  const _0x2eebd5 = Math['max'](0x1, Math['min'](0x10, Math['trunc'](Number(batchSize) || 0x0))),
    _0x35853f = [];
  for (let _0x20baf9 = 0x0; _0x20baf9 < _0x455111['length']; _0x20baf9 += _0x2eebd5) {
    _0x35853f['push'](_0x455111['slice'](_0x20baf9, _0x20baf9 + _0x2eebd5));
  }
  return _0x35853f;
}
export async function requestStoryAssetMentionsLocal(_0x495f5b, _0x33a620 = {}) {
  return post(
    STORY_ASSET_LOCAL_EXTRACTION_PATH,
    {
      chunks: _0x495f5b['map']((_0x5866e6) => ({
        id: _0x5866e6['id'],
        sceneRef: _0x5866e6['sceneRef'],
        text: _0x5866e6['text'],
      })),
    },
    {
      provider: 'local',
      signal: _0x33a620['signal'],
      timeout: Number(_0x33a620['timeout']) || 0x927c0,
    },
  );
}
export async function extractStoryAssetMentionsLocal({
  sourceScenes: sourceScenes = [],
  localExtract: localExtract = requestStoryAssetMentionsLocal,
  onProgress: onProgress = null,
} = {}) {
  const _0x15ae65 = createStoryAssetLocalExtractionChunks(sourceScenes);
  if (!_0x15ae65['length']) throw new Error('本地 PP-UIE 没有找到可扫描的场次正文。');
  const _0x1f132e = createStoryAssetLocalExtractionBatches(_0x15ae65),
    _0x754842 = new Map(_0x15ae65['map']((_0x1c37a4) => [_0x1c37a4['id'], _0x1c37a4])),
    _0x1d2a6d = [];
  let _0xbbc518 = { model: STORY_ASSET_LOCAL_MODEL, device: '', precision: '' };
  for (let _0x440763 = 0x0; _0x440763 < _0x1f132e['length']; _0x440763 += 0x1) {
    onProgress?.({
      stage: 'local-entity-extraction',
      current: _0x440763,
      total: _0x1f132e['length'],
      message: 'PP-UIE 正在本地扫描证据（' + (_0x440763 + 0x1) + '/' + _0x1f132e['length'] + '）',
    });
    const _0x370e44 = await localExtract(_0x1f132e[_0x440763]);
    _0xbbc518 = {
      model: normalizeText(_0x370e44?.['model']) || STORY_ASSET_LOCAL_MODEL,
      device: normalizeText(_0x370e44?.['device']),
      precision: normalizeText(_0x370e44?.['precision']),
    };
    const _0x566c03 = Array['isArray'](_0x370e44?.['chunks']) ? _0x370e44['chunks'] : [];
    _0x566c03['forEach']((_0x3df3fd) => {
      const _0xd5a3c2 = _0x754842['get'](normalizeText(_0x3df3fd?.['id']));
      if (!_0xd5a3c2) return;
      (Array['isArray'](_0x3df3fd?.['entities']) ? _0x3df3fd['entities'] : [])['forEach']((_0x26377d) => {
        const _0x4b0611 = normalizeText(_0x26377d?.['kind']);
        if (!STORY_ASSET_LOCAL_ENTITY_KINDS['has'](_0x4b0611)) return;
        normalizeLocalEntityTexts(_0x26377d?.['text'])['forEach']((_0x3960f3) => {
          const _0x45c1fe = Number(_0x26377d?.['start']),
            _0x107d8b = Number(_0x26377d?.['end']),
            _0x8f12f8 =
              Number['isFinite'](_0x45c1fe) &&
              Number['isFinite'](_0x107d8b) &&
              Math['trunc'](_0x45c1fe) >= 0x0 &&
              Math['trunc'](_0x107d8b) > Math['trunc'](_0x45c1fe) &&
              _0xd5a3c2['text']['slice'](Math['trunc'](_0x45c1fe), Math['trunc'](_0x107d8b)) === _0x3960f3,
            _0x5cb113 = _0x8f12f8 ? Math['trunc'](_0x45c1fe) : _0xd5a3c2['text']['indexOf'](_0x3960f3);
          if (_0x5cb113 < 0x0) return;
          _0x1d2a6d['push']({
            kind: _0x4b0611,
            text: _0x3960f3,
            sceneRef: _0xd5a3c2['sceneRef'],
            episodeRef: _0xd5a3c2['episodeRef'],
            start: _0xd5a3c2['start'] + _0x5cb113,
            end: _0xd5a3c2['start'] + _0x5cb113 + _0x3960f3['length'],
            ...(Number['isFinite'](Number(_0x26377d?.['probability']))
              ? {
                  probability: Math['max'](0x0, Math['min'](0x1, Number(_0x26377d['probability']))),
                }
              : {}),
          });
        });
      });
    });
  }
  const _0x2bcc50 = new Map();
  return (
    _0x1d2a6d['forEach']((_0x55f299) => {
      const _0x9f3f8e =
        _0x55f299['kind'] +
        ':' +
        _0x55f299['text']['toLowerCase']() +
        ':' +
        _0x55f299['sceneRef'] +
        ':' +
        _0x55f299['start'];
      if (!_0x2bcc50['has'](_0x9f3f8e)) _0x2bcc50['set'](_0x9f3f8e, _0x55f299);
    }),
    onProgress?.({
      stage: 'local-entity-extraction',
      current: _0x1f132e['length'],
      total: _0x1f132e['length'],
      message: 'PP-UIE 本地扫描完成：发现 ' + _0x2bcc50['size'] + ' 条实体证据',
    }),
    { ..._0xbbc518, chunks: _0x15ae65, mentions: [..._0x2bcc50['values']()] }
  );
}
function mergeEvidenceRanges(_0x2042df = [], _0x36be12) {
  const _0x5616cf = _0x2042df['map'](([_0x291631, _0x130e65]) => [
      Math['max'](0x0, _0x291631),
      Math['max'](0x0, _0x130e65),
    ])['sort']((_0x34f1e8, _0x5c5ac0) => _0x34f1e8[0x0] - _0x5c5ac0[0x0]),
    _0x43451a = [];
  _0x5616cf['forEach'](([_0x2f72d4, _0x3de4e6]) => {
    const _0x55d3cb = _0x43451a['at'](-0x1);
    _0x55d3cb && _0x2f72d4 <= _0x55d3cb[0x1] + 0x28
      ? (_0x55d3cb[0x1] = Math['max'](_0x55d3cb[0x1], _0x3de4e6))
      : _0x43451a['push']([_0x2f72d4, _0x3de4e6]);
  });
  let _0x371086 = _0x36be12;
  return _0x43451a['flatMap'](([_0x1dc63c, _0x4d9df9]) => {
    if (_0x371086 <= 0x0) return [];
    const _0x4d7bbe = Math['min'](_0x371086, Math['max'](0x0, _0x4d9df9 - _0x1dc63c));
    return ((_0x371086 -= _0x4d7bbe), _0x4d7bbe ? [[_0x1dc63c, _0x1dc63c + _0x4d7bbe]] : []);
  });
}
export function createStoryAssetLocalEvidenceScenes(_0x4016d9 = [], _0x221e6b = []) {
  const _0xf7b1c8 = new Map();
  return (
    (Array['isArray'](_0x221e6b) ? _0x221e6b : [])['forEach']((_0x2d6bb1) => {
      const _0x29ecfa = normalizeText(_0x2d6bb1?.['sceneRef']);
      if (!_0x29ecfa) return;
      const _0x3717aa = _0xf7b1c8['get'](_0x29ecfa) || [];
      (_0x3717aa['push'](_0x2d6bb1), _0xf7b1c8['set'](_0x29ecfa, _0x3717aa));
    }),
    (Array['isArray'](_0x4016d9) ? _0x4016d9 : [])['map']((_0x201d87) => {
      const _0x41844f = normalizeText(_0x201d87?.['body']),
        _0x5dd7c7 = _0xf7b1c8['get'](normalizeText(_0x201d87?.['ref'])) || [],
        _0x553392 = _0x5dd7c7['map']((_0x2fa5f8) => [
          Math['max'](0x0, Number(_0x2fa5f8['start']) - 0x5a),
          Math['min'](_0x41844f['length'], Number(_0x2fa5f8['end']) + 0xa0),
        ]);
      if (!_0x553392['length']) {
        _0x553392['push']([0x0, Math['min'](_0x41844f['length'], 0x118)]);
        if (_0x41844f['length'] > 0x118)
          _0x553392['push']([Math['max'](0x0, _0x41844f['length'] - 0xb4), _0x41844f['length']]);
      }
      const _0x13744e = mergeEvidenceRanges(_0x553392, STORY_ASSET_LOCAL_EVIDENCE_MAX_CHARACTERS),
        _0x4559aa = _0x13744e['map'](([_0x3c1f1b, _0x149350]) => _0x41844f['slice'](_0x3c1f1b, _0x149350))[
          'join'
        ]('\n……\n'),
        _0x177ada = {
          character: normalizeStringArray(
            _0x5dd7c7['filter']((_0x2f0cbd) => _0x2f0cbd['kind'] === 'character')['map'](
              (_0x1aab37) => _0x1aab37['text'],
            ),
          ),
          scene: normalizeStringArray(
            _0x5dd7c7['filter']((_0x15766b) => _0x15766b['kind'] === 'scene')['map'](
              (_0x1332c6) => _0x1332c6['text'],
            ),
          ),
          prop: normalizeStringArray(
            _0x5dd7c7['filter']((_0x3d3997) => _0x3d3997['kind'] === 'prop')['map'](
              (_0x1ffd9d) => _0x1ffd9d['text'],
            ),
          ),
        },
        _0x219faf = [
          _0x177ada['character']['length'] ? '角色候选：' + _0x177ada['character']['join']('、') : '',
          _0x177ada['scene']['length'] ? '地点候选：' + _0x177ada['scene']['join']('、') : '',
          _0x177ada['prop']['length'] ? '道具候选：' + _0x177ada['prop']['join']('、') : '',
        ]
          ['filter'](Boolean)
          ['join']('；');
      return {
        ..._0x201d87,
        characters: normalizeStringArray(
          Array['isArray'](_0x201d87?.['characters']) ? _0x201d87['characters'] : [],
        ),
        body: [_0x219faf ? 'PP-UIE 本地候选：' + _0x219faf : '', _0x4559aa]
          ['filter'](Boolean)
          ['join']('\n证据原文：'),
        localEntityCandidates: _0x177ada,
        localEntityEvidence: _0x5dd7c7['map']((_0x35ba21) => ({
          kind: _0x35ba21['kind'],
          text: _0x35ba21['text'],
          start: _0x35ba21['start'],
          end: _0x35ba21['end'],
          ...(Number['isFinite'](Number(_0x35ba21?.['probability']))
            ? { probability: Number(_0x35ba21['probability']) }
            : {}),
        })),
        originalBodyCharacters: _0x41844f['length'],
      };
    })
  );
}
