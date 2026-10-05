import { getModelManifest, getModelsByKind } from './modelRegistry.js';
export function isVideoAnalysisModel(value) {
  const item = typeof value === 'string' ? getModelManifest(value) : value;
  return (
    item?.['kind'] === 'text' &&
    item['inputSlots']?.['allowedKinds']?.['includes']('video') === true &&
    Number(item['inputSlots']?.['maxByKind']?.['video']) > 0
  );
}
export function getVideoAnalysisModelIds() {
  return getModelsByKind('text')
    ['filter'](isVideoAnalysisModel)
    ['map']((key) => key['modelId']);
}
export function assertVideoAnalysisModel(index) {
  if (!isVideoAnalysisModel(index)) throw new Error('当前模型未启用视频分析，请从模型菜单重新选择。');
}
