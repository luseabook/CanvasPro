import { isAdaptiveRatioLabel, pickClosestRatioForProviderModel } from '../../api/imageRatioPolicy.js';
function getPlainObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
function isPositiveSize(item, key) {
  return Number(item) > 0 && Number(key) > 0;
}
export function findVideoAspectRatioField(index) {
  const list = Array['isArray'](index?.['uiSchema']?.['fields']) ? index['uiSchema']['fields'] : [];
  return (
    list['find']((result) => String(result?.['displayRole'] || '')['trim']() === 'aspectRatio') ||
    list['find']((data) => String(data?.['id'] || '')['trim']() === 'aspectRatio') ||
    null
  );
}
export function getConcreteVideoAspectRatioOptions(options) {
  const videoAspectRatioField = findVideoAspectRatioField(options),
    list2 = Array['isArray'](videoAspectRatioField?.['options']) ? videoAspectRatioField['options'] : [];
  return list2['map']((el) => String(el?.['value'] ?? el ?? '')['trim']())['filter'](
    (list3) => list3 && list3['includes'](':') && !isAdaptiveRatioLabel(list3),
  );
}
export function resolveVideoAspectRatioInput({
  nodeData: nodeData = {},
  payload: payload = {},
  modelManifest: modelManifest = null,
} = {}) {
  const plainObject = getPlainObject(nodeData?.['generationParams']),
    plainObject2 = getPlainObject(payload?.['generationParams']),
    target = String(findVideoAspectRatioField(modelManifest)?.['id'] || '')['trim'](),
    list4 = [];
  target &&
    target !== 'aspectRatio' &&
    list4['push']([plainObject, target], [plainObject2, target], [payload, target]);
  list4['push'](
    [plainObject, 'aspectRatio'],
    [nodeData, 'aspectRatio'],
    [plainObject2, 'aspectRatio'],
    [payload, 'aspectRatio'],
  );
  for (const [source, next] of list4) {
    if (next && Object['prototype']['hasOwnProperty']['call'](source || {}, next)) return source[next];
  }
  return findVideoAspectRatioField(modelManifest)?.['defaultValue'] ?? '';
}
export function resolveVideoAdaptiveAspectRatio({
  provider: provider = '',
  model: model = '',
  modelManifest: modelManifest = null,
  displayWidth: displayWidth = 0,
  displayHeight: displayHeight = 0,
  sourceWidth: sourceWidth = 0,
  sourceHeight: sourceHeight = 0,
  imageSize: imageSize = '',
} = {}) {
  const list5 = getConcreteVideoAspectRatioOptions(modelManifest);
  if (list5['length'] <= 0) return '';
  if (isPositiveSize(displayWidth, displayHeight))
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: Number(displayWidth),
      height: Number(displayHeight),
      imageSize: imageSize,
    });
  if (isPositiveSize(sourceWidth, sourceHeight))
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: Number(sourceWidth),
      height: Number(sourceHeight),
      imageSize: imageSize,
    });
  return list5['includes']('1:1') ? '1:1' : list5[0];
}
export function applyVideoAdaptiveAspectRatio(payload2, nodeData2 = {}) {
  const modelManifest2 = nodeData2?.['modelManifest'] || null,
    videoAspectRatioField2 = findVideoAspectRatioField(modelManifest2);
  if (!videoAspectRatioField2) return payload2;
  const aspectRatio = resolveVideoAspectRatioInput({
    nodeData: nodeData2?.['nodeData'],
    payload: payload2,
    modelManifest: modelManifest2,
  });
  if (!isAdaptiveRatioLabel(aspectRatio)) return payload2;
  const current = modelManifest2?.['extensions']?.['ratioPolicy'] || modelManifest2?.['ratioPolicy'] || {};
  if (current?.['preserveAdaptiveAtSubmit'] === true) {
    const entry = String(videoAspectRatioField2?.['id'] || 'aspectRatio')['trim']();
    return (
      delete payload2['resolvedRatioLabel'],
      (payload2['aspectRatio'] = aspectRatio),
      (payload2['generationParams'] = {
        ...getPlainObject(payload2['generationParams']),
        aspectRatio: aspectRatio,
        ...(entry ? { [entry]: aspectRatio } : {}),
      }),
      entry && entry !== 'aspectRatio' && (payload2[entry] = aspectRatio),
      payload2
    );
  }
  const aspectRatio2 = resolveVideoAdaptiveAspectRatio(nodeData2);
  if (!aspectRatio2 || isAdaptiveRatioLabel(aspectRatio2)) return payload2;
  const record = String(videoAspectRatioField2?.['id'] || 'aspectRatio')['trim']();
  return (
    (payload2['resolvedRatioLabel'] = aspectRatio2),
    (payload2['aspectRatio'] = aspectRatio2),
    (payload2['generationParams'] = {
      ...getPlainObject(payload2['generationParams']),
      aspectRatio: aspectRatio2,
      ...(record ? { [record]: aspectRatio2 } : {}),
    }),
    record && record !== 'aspectRatio' && (payload2[record] = aspectRatio2),
    payload2
  );
}
