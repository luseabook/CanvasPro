import { get, post } from './apiBase.js';
const MODEL_PACK_API = '/api/v2/person-replacement/model-pack';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeInstallProgress(item) {
  const error = item && typeof item === 'object' ? item : {},
    downloadedBytes = Math['max'](0x0, Number(error['downloadedBytes']) || 0x0),
    totalBytes = Math['max'](0x0, Number(error['totalBytes']) || 0x0),
    key = totalBytes > 0x0 ? (downloadedBytes / totalBytes) * 0x64 : 0x0;
  return {
    state: normalizeText(error['state']),
    downloadedBytes: downloadedBytes,
    totalBytes: totalBytes,
    percent: Math['min'](0x64, Math['max'](0x0, Number(error['percent']) || key)),
    currentSource: normalizeText(error['currentSource']),
    completedSources: Math['max'](0x0, Math['floor'](Number(error['completedSources']) || 0x0)),
    totalSources: Math['max'](0x0, Math['floor'](Number(error['totalSources']) || 0x0)),
    message: normalizeText(error['message']),
  };
}
function normalizeStatus(index) {
  const success = index && typeof index === 'object' ? index : {},
    model = success['model'] && typeof success['model'] === 'object' ? { ...success['model'] } : null,
    reidModel =
      success['reidModel'] && typeof success['reidModel'] === 'object' ? { ...success['reidModel'] } : null,
    orientationModel =
      success['orientationModel'] && typeof success['orientationModel'] === 'object'
        ? { ...success['orientationModel'] }
        : null,
    models = Array['isArray'](success['models'])
      ? success['models']
          ['filter']((result) => result && typeof result === 'object')
          ['map']((args) => ({ ...args }))
      : [model, reidModel, orientationModel]['filter'](Boolean);
  return {
    success: success['success'] !== ![],
    installed: success['installed'] === !![],
    packId: normalizeText(success['packId']),
    version: normalizeText(success['version']),
    requiredVersion: normalizeText(success['requiredVersion']),
    downloadBytes: Math['max'](0x0, Number(success['downloadBytes']) || 0x0),
    model: model,
    reidModel: reidModel,
    orientationModel: orientationModel,
    models: models,
    installProgress: normalizeInstallProgress(success['installProgress']),
  };
}
function unwrap(response, data) {
  if (!response?.['success']) throw new Error(response?.['error'] || data);
  const response2 = response['data'];
  if (!response2 || typeof response2 !== 'object') throw new Error(data);
  if (response2['success'] === ![])
    throw new Error(response2['error']?.['message'] || response2['error'] || data);
  return normalizeStatus(response2);
}
export async function getPersonReplacementModelPackStatus() {
  return unwrap(await get(MODEL_PACK_API + '/status', 0x7530), '无法读取人物识别模型状态。');
}
export async function installPersonReplacementModelPack() {
  return unwrap(await post(MODEL_PACK_API + '/install', {}, 0xf * 0x3c * 0x3e8), '人物识别模型下载失败。');
}
export async function detectPersonReplacementPeople(
  options,
  { confidence: confidence = 0.5, nmsThreshold: nmsThreshold = 0.5, maxPeople: maxPeople = 0x20 } = {},
) {
  const imageRef = normalizeText(options);
  if (!imageRef) throw new Error('人物检测缺少首帧图片');
  const response3 = await post(
    '/api/v2/person-replacement/detect',
    { imageRef: imageRef, confidence: confidence, nmsThreshold: nmsThreshold, maxPeople: maxPeople },
    0x1d4c0,
  );
  if (!response3?.['success']) throw new Error(response3?.['error'] || '人物检测失败');
  const frame = response3['data'];
  if (!frame || frame['success'] === ![])
    throw new Error(frame?.['error']?.['message'] || frame?.['error'] || '人物检测失败');
  return {
    modelId: normalizeText(frame['modelId']),
    frame:
      frame['frame'] && typeof frame['frame'] === 'object'
        ? {
            width: Math['max'](0x0, Number(frame['frame']['width']) || 0x0),
            height: Math['max'](0x0, Number(frame['frame']['height']) || 0x0),
          }
        : { width: 0x0, height: 0x0 },
    people: (Array['isArray'](frame['people']) ? frame['people'] : [])['map']((target) => ({
      bbox: {
        x: Math['max'](0x0, Math['min'](0x1, Number(target?.['bbox']?.['x']) || 0x0)),
        y: Math['max'](0x0, Math['min'](0x1, Number(target?.['bbox']?.['y']) || 0x0)),
        width: Math['max'](0x0, Math['min'](0x1, Number(target?.['bbox']?.['width']) || 0x0)),
        height: Math['max'](0x0, Math['min'](0x1, Number(target?.['bbox']?.['height']) || 0x0)),
      },
      confidence: Math['max'](0x0, Math['min'](0x1, Number(target?.['confidence']) || 0x0)),
      classId: Number(target?.['classId']) || 0x0,
      className: normalizeText(target?.['className']) || 'person',
      orientation: normalizeText(target?.['orientation']) || 'unknown',
      orientationConfidence: Math['max'](
        0x0,
        Math['min'](0x1, Number(target?.['orientationConfidence']) || 0x0),
      ),
      orientationModelId: normalizeText(target?.['orientationModelId']),
    })),
  };
}
function normalizeBoundingBox(box = {}) {
  const x = Math['max'](0x0, Math['min'](0x1, Number(box['x']) || 0x0)),
    y = Math['max'](0x0, Math['min'](0x1, Number(box['y']) || 0x0));
  return {
    x: x,
    y: y,
    width: Math['max'](0x0, Math['min'](0x1 - x, Number(box['width']) || 0x0)),
    height: Math['max'](0x0, Math['min'](0x1 - y, Number(box['height']) || 0x0)),
  };
}
export async function identifyPersonReplacementPeople(
  source,
  {
    autoThreshold: autoThreshold = 0.78,
    reviewThreshold: reviewThreshold = 0.68,
    ambiguityMargin: ambiguityMargin = 0.06,
    maxShotGap: maxShotGap = 0x2,
  } = {},
) {
  const shots = (Array['isArray'](source) ? source : [])
    ['map']((next, current) => ({
      shotId: normalizeText(next?.['shotId'] || next?.['id']),
      sourceId: normalizeText(next?.['sourceId']),
      sourceOrder: Math['max'](0x0, Math['trunc'](Number(next?.['sourceOrder']) || 0x0)),
      shotIndex: Math['max'](
        0x0,
        Math['trunc'](Number(next?.['shotIndex'] ?? next?.['index'] ?? current) || 0x0),
      ),
      shotTimeSec: Math['max'](0x0, Number(next?.['shotTimeSec'] ?? next?.['startTimeSec']) || 0x0),
      imageRef: normalizeText(next?.['imageRef'] || next?.['keyframeRef']),
      people: (Array['isArray'](next?.['people']) ? next['people'] : [])
        ['map']((entry) => ({
          personId: normalizeText(entry?.['personId'] || entry?.['id']),
          bbox: normalizeBoundingBox(entry?.['bbox'] || entry?.['locator']?.['bbox']),
          detectionConfidence: Math['max'](
            0x0,
            Math['min'](0x1, Number(entry?.['detectionConfidence'] ?? entry?.['confidence']) || 0x0),
          ),
        }))
        ['filter']((record) => record['personId']),
    }))
    ['filter']((payload) => payload['shotId'] && payload['people']['length']);
  if (!shots['length'])
    return {
      modelId: '',
      identities: [],
      assignments: [],
      stats: { sampleCount: 0x0, trackletCount: 0x0, identityCount: 0x0, reviewCount: 0x0 },
    };
  const response4 = await post(
    '/api/v2/person-replacement/identify',
    {
      shots: shots,
      autoThreshold: autoThreshold,
      reviewThreshold: reviewThreshold,
      ambiguityMargin: ambiguityMargin,
      maxShotGap: maxShotGap,
    },
    0x5 * 0x3c * 0x3e8,
  );
  if (!response4?.['success']) throw new Error(response4?.['error'] || '人物身份分析失败');
  const response5 = response4['data'];
  if (!response5 || response5['success'] === ![])
    throw new Error(response5?.['error']?.['message'] || response5?.['error'] || '人物身份分析失败');
  return {
    modelId: normalizeText(response5['modelId']),
    identities: (Array['isArray'](response5['identities']) ? response5['identities'] : [])
      ['map']((reviewRequired) => ({
        id: normalizeText(reviewRequired?.['id'] || reviewRequired?.['identityId']),
        name: normalizeText(reviewRequired?.['name'] || reviewRequired?.['label']),
        confidence: Math['max'](0x0, Math['min'](0x1, Number(reviewRequired?.['confidence']) || 0x0)),
        reviewRequired: reviewRequired?.['reviewRequired'] === !![],
        memberCount: Math['max'](0x0, Math['trunc'](Number(reviewRequired?.['memberCount']) || 0x0)),
        trackletCount: Math['max'](0x0, Math['trunc'](Number(reviewRequired?.['trackletCount']) || 0x0)),
        exemplarShotId: normalizeText(reviewRequired?.['exemplarShotId']),
        exemplarPersonId: normalizeText(reviewRequired?.['exemplarPersonId']),
        ambiguousIdentityIds: (Array['isArray'](reviewRequired?.['ambiguousIdentityIds'])
          ? reviewRequired['ambiguousIdentityIds']
          : [])
          ['map'](normalizeText)
          ['filter'](Boolean),
        notes: normalizeText(reviewRequired?.['notes']),
      }))
      ['filter']((handle) => handle['id']),
    assignments: (Array['isArray'](response5['assignments']) ? response5['assignments'] : [])
      ['map']((reviewRequired2) => ({
        shotId: normalizeText(reviewRequired2?.['shotId']),
        personId: normalizeText(reviewRequired2?.['personId']),
        sourceCharacterId: normalizeText(
          reviewRequired2?.['sourceCharacterId'] || reviewRequired2?.['identityId'],
        ),
        label: normalizeText(reviewRequired2?.['label']),
        identityConfidence: Math['max'](
          0x0,
          Math['min'](0x1, Number(reviewRequired2?.['identityConfidence']) || 0x0),
        ),
        matchSimilarity: Math['max'](
          0x0,
          Math['min'](0x1, Number(reviewRequired2?.['matchSimilarity']) || 0x0),
        ),
        reviewRequired: reviewRequired2?.['reviewRequired'] === !![],
        ambiguousIdentityIds: (Array['isArray'](reviewRequired2?.['ambiguousIdentityIds'])
          ? reviewRequired2['ambiguousIdentityIds']
          : [])
          ['map'](normalizeText)
          ['filter'](Boolean),
        notes: normalizeText(reviewRequired2?.['notes']),
      }))
      ['filter']((state) => state['shotId'] && state['personId'] && state['sourceCharacterId']),
    stats: {
      sampleCount: Math['max'](0x0, Math['trunc'](Number(response5['stats']?.['sampleCount']) || 0x0)),
      trackletCount: Math['max'](0x0, Math['trunc'](Number(response5['stats']?.['trackletCount']) || 0x0)),
      identityCount: Math['max'](0x0, Math['trunc'](Number(response5['stats']?.['identityCount']) || 0x0)),
      reviewCount: Math['max'](0x0, Math['trunc'](Number(response5['stats']?.['reviewCount']) || 0x0)),
      skippedCount: Math['max'](0x0, Math['trunc'](Number(response5['stats']?.['skippedCount']) || 0x0)),
    },
  };
}
