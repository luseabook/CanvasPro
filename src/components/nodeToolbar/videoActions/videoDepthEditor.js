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
export function openVideoDepthEditor(args) {
  return openCanvasGenerationEditor({
    ...args,
    settingsKey: 'videoDepthSettings',
    overlayDataKey: 'videoDepthEditor',
    renderSelector: renderAIGenVideoModelSelectorMarkup,
    bindSelector: bindAIGenVideoModelSelector,
    selectorOptions: { allowedModelIds: [args.modelId], referenceCounts: { videoCount: 1 } },
    acquireMedia({ target: target, source: source, overlay: overlay }) {
      const nodeVideoElement = resolveNodeVideoElement(target, source.mainVideoIndex);
      return (
        claimExternalVideoPlayback(nodeVideoElement, overlay),
        () => releaseExternalVideoPlayback(nodeVideoElement, overlay)
      );
    },
  });
}
