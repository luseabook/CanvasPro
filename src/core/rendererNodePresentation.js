import { isNodeType } from '../modules/registry.js';
import { t } from '../i18n/index.js';
import { shouldShowGenerationBusyUi } from './generationTaskUiState.js';
export function getRendererDefaultNodeLabel(_0x100f1c) {
  const _0x5cd38d = String(_0x100f1c?.type || '');
  let _0x3b7873 = t('coreUi.renderer.defaultNodeNames.node');
  if (_0x5cd38d.includes('image')) _0x3b7873 = t('coreUi.renderer.defaultNodeNames.image');
  else {
    if (_0x5cd38d.includes('video')) _0x3b7873 = t('coreUi.renderer.defaultNodeNames.video');
    else {
      if (_0x5cd38d.includes('audio')) _0x3b7873 = t('coreUi.renderer.defaultNodeNames.audio');
      else {
        if (_0x5cd38d.includes('text')) _0x3b7873 = t('coreUi.renderer.defaultNodeNames.text');
      }
    }
  }
  return _0x3b7873;
}
export function getRendererNodeZIndex(_0x300613, _0x2ff19c, _0x237fda = -1, _0x4215d5 = {}) {
  if (isNodeType(_0x300613, 'group')) return 'auto';
  if (isNodeType(_0x300613, 'debug')) return '1200';
  if (isNodeType(_0x300613, 'media-clip') && _0x300613?.mediaClip?.expanded === true) return '12000';
  if (_0x4215d5?.isFocused === true) return '180';
  if (_0x300613?.isImagesExpanded || _0x300613?.isVideosExpanded) return '140';
  if (!_0x2ff19c) return '10';
  const _0x53a935 = Math.max(0, Math.min(39, Number(_0x237fda) || 0));
  return String(100 + _0x53a935);
}
export function shouldSkipInitialMediaNodeUpdate(_0x1a9fa8, _0x43c759) {
  return (
    _0x43c759 &&
    isNodeType(_0x1a9fa8, ['source-image', 'image', 'ai-image', 'source-video', 'video', 'ai-video']) &&
    !shouldShowGenerationBusyUi(_0x1a9fa8)
  );
}
export function buildSelectedNodeRankMap(_0x45da30) {
  const _0x476651 = _0x45da30 instanceof Set ? _0x45da30 : _0x45da30 || [];
  return new Map(Array.from(_0x476651).map((_0x27ef61, _0x1f3768) => [_0x27ef61, _0x1f3768]));
}
export function buildRendererDragTargetSet({
  dragContext: _0x312876,
  selectedNodeSet: _0x2e1850,
  parentToChildren: _0x5adea5,
}) {
  if (!_0x312876?.isDragging || !_0x312876.targetNodeId) return null;
  const _0x2b3912 = _0x2e1850.has(_0x312876.targetNodeId) ? Array.from(_0x2e1850) : [_0x312876.targetNodeId],
    _0x48b6f6 = new Set(_0x2b3912),
    _0x54691a = [..._0x2b3912];
  while (_0x54691a.length > 0) {
    const _0x4bcfa8 = _0x54691a.pop(),
      _0x3a3b99 = _0x5adea5?.[_0x4bcfa8];
    if (!_0x3a3b99) continue;
    for (const _0x54bc7a of _0x3a3b99) {
      if (_0x48b6f6.has(_0x54bc7a)) continue;
      (_0x48b6f6.add(_0x54bc7a), _0x54691a.push(_0x54bc7a));
    }
  }
  return _0x48b6f6;
}
