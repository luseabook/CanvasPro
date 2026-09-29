import { getModelManifest, getModelsByKind } from './modelRegistry.js';
export function isVideoAnalysisModel(_0x50544d) {
  const _0x2036a3 = typeof _0x50544d === 'string' ? getModelManifest(_0x50544d) : _0x50544d;
  return (
    _0x2036a3?.['kind'] === 'text' &&
    _0x2036a3['inputSlots']?.['allowedKinds']?.['includes']('video') === !![] &&
    Number(_0x2036a3['inputSlots']?.['maxByKind']?.['video']) > 0x0
  );
}
export function getVideoAnalysisModelIds() {
  return getModelsByKind('text')
    ['filter'](isVideoAnalysisModel)
    ['map']((_0x123f25) => _0x123f25['modelId']);
}
export function assertVideoAnalysisModel(_0x8160d4) {
  if (!isVideoAnalysisModel(_0x8160d4)) throw new Error('当前模型未启用视频分析，请从模型菜单重新选择。');
}
