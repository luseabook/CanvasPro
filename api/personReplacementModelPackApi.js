import { get, post } from './apiBase.js';
const MODEL_PACK_API = '/api/v2/person-replacement/model-pack';
function normalizeText(_0xb620b9) {
  return String(_0xb620b9 || '')['trim']();
}
function normalizeInstallProgress(_0x274af4) {
  const _0x106436 = _0x274af4 && typeof _0x274af4 === 'object' ? _0x274af4 : {},
    _0x31e963 = Math['max'](0x0, Number(_0x106436['downloadedBytes']) || 0x0),
    _0x1b72a3 = Math['max'](0x0, Number(_0x106436['totalBytes']) || 0x0),
    _0xf27d3c = _0x1b72a3 > 0x0 ? (_0x31e963 / _0x1b72a3) * 0x64 : 0x0;
  return {
    state: normalizeText(_0x106436['state']),
    downloadedBytes: _0x31e963,
    totalBytes: _0x1b72a3,
    percent: Math['min'](0x64, Math['max'](0x0, Number(_0x106436['percent']) || _0xf27d3c)),
    currentSource: normalizeText(_0x106436['currentSource']),
    completedSources: Math['max'](0x0, Math['floor'](Number(_0x106436['completedSources']) || 0x0)),
    totalSources: Math['max'](0x0, Math['floor'](Number(_0x106436['totalSources']) || 0x0)),
    message: normalizeText(_0x106436['message']),
  };
}
function normalizeStatus(_0x5f47bc) {
  const _0x48ac53 = _0x5f47bc && typeof _0x5f47bc === 'object' ? _0x5f47bc : {},
    _0x2fc582 =
      _0x48ac53['model'] && typeof _0x48ac53['model'] === 'object' ? { ..._0x48ac53['model'] } : null,
    _0xdd243f =
      _0x48ac53['reidModel'] && typeof _0x48ac53['reidModel'] === 'object'
        ? { ..._0x48ac53['reidModel'] }
        : null,
    _0x4e8644 =
      _0x48ac53['orientationModel'] && typeof _0x48ac53['orientationModel'] === 'object'
        ? { ..._0x48ac53['orientationModel'] }
        : null,
    _0x2aa36e = Array['isArray'](_0x48ac53['models'])
      ? _0x48ac53['models']
          ['filter']((_0xb708a4) => _0xb708a4 && typeof _0xb708a4 === 'object')
          ['map']((_0x1ebe8e) => ({ ..._0x1ebe8e }))
      : [_0x2fc582, _0xdd243f, _0x4e8644]['filter'](Boolean);
  return {
    success: _0x48ac53['success'] !== ![],
    installed: _0x48ac53['installed'] === !![],
    packId: normalizeText(_0x48ac53['packId']),
    version: normalizeText(_0x48ac53['version']),
    requiredVersion: normalizeText(_0x48ac53['requiredVersion']),
    downloadBytes: Math['max'](0x0, Number(_0x48ac53['downloadBytes']) || 0x0),
    model: _0x2fc582,
    reidModel: _0xdd243f,
    orientationModel: _0x4e8644,
    models: _0x2aa36e,
    installProgress: normalizeInstallProgress(_0x48ac53['installProgress']),
  };
}
function unwrap(_0x428a09, _0x419162) {
  if (!_0x428a09?.['success']) throw new Error(_0x428a09?.['error'] || _0x419162);
  const _0x2e58d8 = _0x428a09['data'];
  if (!_0x2e58d8 || typeof _0x2e58d8 !== 'object') throw new Error(_0x419162);
  if (_0x2e58d8['success'] === ![])
    throw new Error(_0x2e58d8['error']?.['message'] || _0x2e58d8['error'] || _0x419162);
  return normalizeStatus(_0x2e58d8);
}
export async function getPersonReplacementModelPackStatus() {
  return unwrap(await get(MODEL_PACK_API + '/status', 0x7530), '无法读取人物识别模型状态。');
}
export async function installPersonReplacementModelPack() {
  return unwrap(await post(MODEL_PACK_API + '/install', {}, 0xf * 0x3c * 0x3e8), '人物识别模型下载失败。');
}
export async function detectPersonReplacementPeople(
  _0x20290c,
  { confidence: confidence = 0.5, nmsThreshold: nmsThreshold = 0.5, maxPeople: maxPeople = 0x20 } = {},
) {
  const _0x4538db = normalizeText(_0x20290c);
  if (!_0x4538db) throw new Error('人物检测缺少首帧图片');
  const _0x23aa1d = await post(
    '/api/v2/person-replacement/detect',
    { imageRef: _0x4538db, confidence: confidence, nmsThreshold: nmsThreshold, maxPeople: maxPeople },
    0x1d4c0,
  );
  if (!_0x23aa1d?.['success']) throw new Error(_0x23aa1d?.['error'] || '人物检测失败');
  const _0x52274e = _0x23aa1d['data'];
  if (!_0x52274e || _0x52274e['success'] === ![])
    throw new Error(_0x52274e?.['error']?.['message'] || _0x52274e?.['error'] || '人物检测失败');
  return {
    modelId: normalizeText(_0x52274e['modelId']),
    frame:
      _0x52274e['frame'] && typeof _0x52274e['frame'] === 'object'
        ? {
            width: Math['max'](0x0, Number(_0x52274e['frame']['width']) || 0x0),
            height: Math['max'](0x0, Number(_0x52274e['frame']['height']) || 0x0),
          }
        : { width: 0x0, height: 0x0 },
    people: (Array['isArray'](_0x52274e['people']) ? _0x52274e['people'] : [])['map']((_0x62d142) => ({
      bbox: {
        x: Math['max'](0x0, Math['min'](0x1, Number(_0x62d142?.['bbox']?.['x']) || 0x0)),
        y: Math['max'](0x0, Math['min'](0x1, Number(_0x62d142?.['bbox']?.['y']) || 0x0)),
        width: Math['max'](0x0, Math['min'](0x1, Number(_0x62d142?.['bbox']?.['width']) || 0x0)),
        height: Math['max'](0x0, Math['min'](0x1, Number(_0x62d142?.['bbox']?.['height']) || 0x0)),
      },
      confidence: Math['max'](0x0, Math['min'](0x1, Number(_0x62d142?.['confidence']) || 0x0)),
      classId: Number(_0x62d142?.['classId']) || 0x0,
      className: normalizeText(_0x62d142?.['className']) || 'person',
      orientation: normalizeText(_0x62d142?.['orientation']) || 'unknown',
      orientationConfidence: Math['max'](
        0x0,
        Math['min'](0x1, Number(_0x62d142?.['orientationConfidence']) || 0x0),
      ),
      orientationModelId: normalizeText(_0x62d142?.['orientationModelId']),
    })),
  };
}
function normalizeBoundingBox(_0x1cc902 = {}) {
  const _0x51a322 = Math['max'](0x0, Math['min'](0x1, Number(_0x1cc902['x']) || 0x0)),
    _0x24ab99 = Math['max'](0x0, Math['min'](0x1, Number(_0x1cc902['y']) || 0x0));
  return {
    x: _0x51a322,
    y: _0x24ab99,
    width: Math['max'](0x0, Math['min'](0x1 - _0x51a322, Number(_0x1cc902['width']) || 0x0)),
    height: Math['max'](0x0, Math['min'](0x1 - _0x24ab99, Number(_0x1cc902['height']) || 0x0)),
  };
}
export async function identifyPersonReplacementPeople(
  _0x4412c1,
  {
    autoThreshold: autoThreshold = 0.78,
    reviewThreshold: reviewThreshold = 0.68,
    ambiguityMargin: ambiguityMargin = 0.06,
    maxShotGap: maxShotGap = 0x2,
  } = {},
) {
  const _0x4c6114 = (Array['isArray'](_0x4412c1) ? _0x4412c1 : [])
    ['map']((_0x50aecb, _0x832bcf) => ({
      shotId: normalizeText(_0x50aecb?.['shotId'] || _0x50aecb?.['id']),
      sourceId: normalizeText(_0x50aecb?.['sourceId']),
      sourceOrder: Math['max'](0x0, Math['trunc'](Number(_0x50aecb?.['sourceOrder']) || 0x0)),
      shotIndex: Math['max'](
        0x0,
        Math['trunc'](Number(_0x50aecb?.['shotIndex'] ?? _0x50aecb?.['index'] ?? _0x832bcf) || 0x0),
      ),
      shotTimeSec: Math['max'](0x0, Number(_0x50aecb?.['shotTimeSec'] ?? _0x50aecb?.['startTimeSec']) || 0x0),
      imageRef: normalizeText(_0x50aecb?.['imageRef'] || _0x50aecb?.['keyframeRef']),
      people: (Array['isArray'](_0x50aecb?.['people']) ? _0x50aecb['people'] : [])
        ['map']((_0x23de80) => ({
          personId: normalizeText(_0x23de80?.['personId'] || _0x23de80?.['id']),
          bbox: normalizeBoundingBox(_0x23de80?.['bbox'] || _0x23de80?.['locator']?.['bbox']),
          detectionConfidence: Math['max'](
            0x0,
            Math['min'](0x1, Number(_0x23de80?.['detectionConfidence'] ?? _0x23de80?.['confidence']) || 0x0),
          ),
        }))
        ['filter']((_0x5c8b29) => _0x5c8b29['personId']),
    }))
    ['filter']((_0x53bc1b) => _0x53bc1b['shotId'] && _0x53bc1b['people']['length']);
  if (!_0x4c6114['length'])
    return {
      modelId: '',
      identities: [],
      assignments: [],
      stats: { sampleCount: 0x0, trackletCount: 0x0, identityCount: 0x0, reviewCount: 0x0 },
    };
  const _0xe11366 = await post(
    '/api/v2/person-replacement/identify',
    {
      shots: _0x4c6114,
      autoThreshold: autoThreshold,
      reviewThreshold: reviewThreshold,
      ambiguityMargin: ambiguityMargin,
      maxShotGap: maxShotGap,
    },
    0x5 * 0x3c * 0x3e8,
  );
  if (!_0xe11366?.['success']) throw new Error(_0xe11366?.['error'] || '人物身份分析失败');
  const _0xd7fdfa = _0xe11366['data'];
  if (!_0xd7fdfa || _0xd7fdfa['success'] === ![])
    throw new Error(_0xd7fdfa?.['error']?.['message'] || _0xd7fdfa?.['error'] || '人物身份分析失败');
  return {
    modelId: normalizeText(_0xd7fdfa['modelId']),
    identities: (Array['isArray'](_0xd7fdfa['identities']) ? _0xd7fdfa['identities'] : [])
      ['map']((_0x33dedc) => ({
        id: normalizeText(_0x33dedc?.['id'] || _0x33dedc?.['identityId']),
        name: normalizeText(_0x33dedc?.['name'] || _0x33dedc?.['label']),
        confidence: Math['max'](0x0, Math['min'](0x1, Number(_0x33dedc?.['confidence']) || 0x0)),
        reviewRequired: _0x33dedc?.['reviewRequired'] === !![],
        memberCount: Math['max'](0x0, Math['trunc'](Number(_0x33dedc?.['memberCount']) || 0x0)),
        trackletCount: Math['max'](0x0, Math['trunc'](Number(_0x33dedc?.['trackletCount']) || 0x0)),
        exemplarShotId: normalizeText(_0x33dedc?.['exemplarShotId']),
        exemplarPersonId: normalizeText(_0x33dedc?.['exemplarPersonId']),
        ambiguousIdentityIds: (Array['isArray'](_0x33dedc?.['ambiguousIdentityIds'])
          ? _0x33dedc['ambiguousIdentityIds']
          : [])
          ['map'](normalizeText)
          ['filter'](Boolean),
        notes: normalizeText(_0x33dedc?.['notes']),
      }))
      ['filter']((_0x2e76f3) => _0x2e76f3['id']),
    assignments: (Array['isArray'](_0xd7fdfa['assignments']) ? _0xd7fdfa['assignments'] : [])
      ['map']((_0x3876f2) => ({
        shotId: normalizeText(_0x3876f2?.['shotId']),
        personId: normalizeText(_0x3876f2?.['personId']),
        sourceCharacterId: normalizeText(_0x3876f2?.['sourceCharacterId'] || _0x3876f2?.['identityId']),
        label: normalizeText(_0x3876f2?.['label']),
        identityConfidence: Math['max'](
          0x0,
          Math['min'](0x1, Number(_0x3876f2?.['identityConfidence']) || 0x0),
        ),
        matchSimilarity: Math['max'](0x0, Math['min'](0x1, Number(_0x3876f2?.['matchSimilarity']) || 0x0)),
        reviewRequired: _0x3876f2?.['reviewRequired'] === !![],
        ambiguousIdentityIds: (Array['isArray'](_0x3876f2?.['ambiguousIdentityIds'])
          ? _0x3876f2['ambiguousIdentityIds']
          : [])
          ['map'](normalizeText)
          ['filter'](Boolean),
        notes: normalizeText(_0x3876f2?.['notes']),
      }))
      ['filter'](
        (_0x44b086) => _0x44b086['shotId'] && _0x44b086['personId'] && _0x44b086['sourceCharacterId'],
      ),
    stats: {
      sampleCount: Math['max'](0x0, Math['trunc'](Number(_0xd7fdfa['stats']?.['sampleCount']) || 0x0)),
      trackletCount: Math['max'](0x0, Math['trunc'](Number(_0xd7fdfa['stats']?.['trackletCount']) || 0x0)),
      identityCount: Math['max'](0x0, Math['trunc'](Number(_0xd7fdfa['stats']?.['identityCount']) || 0x0)),
      reviewCount: Math['max'](0x0, Math['trunc'](Number(_0xd7fdfa['stats']?.['reviewCount']) || 0x0)),
      skippedCount: Math['max'](0x0, Math['trunc'](Number(_0xd7fdfa['stats']?.['skippedCount']) || 0x0)),
    },
  };
}
