import {
  bindAIGenVideoModelSelector,
  renderAIGenVideoModelSelectorMarkup,
} from '../../aigenVideo/modelSelector.js';
import { openCanvasGenerationEditor } from '../../shared/canvasGenerationEditor.js';
import { resolveNodeVideoElement } from '../../../modules/nodeVideoElement.js';
import {
  claimExternalVideoPlayback,
  releaseExternalVideoPlayback,
} from '../../shared/hoverVideoPlaybackLifecycle.js';
export function openVideoDepthEditor(_0x1c99ab) {
  return openCanvasGenerationEditor({
    ..._0x1c99ab,
    settingsKey: 'videoDepthSettings',
    overlayDataKey: 'videoDepthEditor',
    renderSelector: renderAIGenVideoModelSelectorMarkup,
    bindSelector: bindAIGenVideoModelSelector,
    selectorOptions: { allowedModelIds: [_0x1c99ab['modelId']], referenceCounts: { videoCount: 0x1 } },
    acquireMedia({ target: _0x3d709d, source: _0x574392, overlay: _0x34c0d2 }) {
      const _0x5ceee2 = resolveNodeVideoElement(_0x3d709d, _0x574392['mainVideoIndex']);
      return (
        claimExternalVideoPlayback(_0x5ceee2, _0x34c0d2),
        () => releaseExternalVideoPlayback(_0x5ceee2, _0x34c0d2)
      );
    },
  });
}
