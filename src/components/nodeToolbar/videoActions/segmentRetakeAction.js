import { generateId } from '../../../core/math.js';
import { commit } from '../../../modules/history.js';
import { t } from '../../../i18n/index.js';
import { GENERATION_MANUAL_DISPLAY_SIZE_FIELD } from '../../shared/generationDisplayPolicy.js';
import {
  SEGMENT_RETAKE_PHASE_EDITING,
  decorateSegmentRetakeParameterNodeData,
} from '../../../modules/videoRetake/segmentRetakeModelPolicy.js';
import { getSegmentRetakePreferredModelId } from '../../../modules/videoRetake/segmentRetakeModelPreference.js';
import { getModelManifest } from '../../../manifests/index.js';
function text(value, item = {}) {
  return t('segmentRetake.' + value, item);
}
function pickSourceMediaKey(options = {}, key = {}) {
  return String(
    key.localPath ||
      key.videoUrl ||
      key.src ||
      options.localPath ||
      options.videoUrl ||
      options.src ||
      '',
  ).trim();
}
export function bindVideoSegmentRetakeAction(index) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      store: store,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      getAIGenerationNodeSize: getAIGenerationNodeSize,
      _getCurrentVideoSource: _getCurrentVideoSource,
      _getCurrentVideoUrl: _getCurrentVideoUrl,
      _getCurrentVideoPlaybackUrl: _getCurrentVideoPlaybackUrl,
      _getCurrentVideoLocalPath: _getCurrentVideoLocalPath,
      _resolveCurrentVideoDurationSec: _resolveCurrentVideoDurationSec,
      closeToolbarMoreMenu: closeToolbarMoreMenu,
    } = index,
    el = toolbarEl.querySelector('.act-segment-retake');
  if (!el) return () => {};
  let enabled = false;
  const async2 = async (event) => {
    (event.preventDefault(), event.stopPropagation());
    if (enabled) return;
    ((enabled = true),
      (el.disabled = true),
      el.setAttribute('aria-busy', 'true'),
      closeToolbarMoreMenu?.());
    try {
      const { node: node, item: item2 } = _getCurrentVideoSource(),
        result = String(_getCurrentVideoPlaybackUrl?.() || '').trim(),
        sourceUrl = String(_getCurrentVideoUrl?.() || '').trim() || result,
        sourceLocalPath = String(_getCurrentVideoLocalPath?.() || '').trim();
      if (!node || !sourceUrl) {
        window.showToast?.(text('errors.invalidSource'), 'error');
        return;
      }
      const sourceDurationSec = Number(await _resolveCurrentVideoDurationSec?.(result || sourceUrl));
      if (!Number.isFinite(sourceDurationSec) || sourceDurationSec < 4) {
        window.showToast?.(text('errors.durationTooShort'), 'warn');
        return;
      }
      const state = store.getState(),
        sourceNodeId = state.nodes?.[node.id] || node,
        data = Number(item2?.videoWidth || sourceNodeId.width) || 512,
        target = Number(item2?.videoHeight || sourceNodeId.height) || 288,
        box = getAIGenerationNodeSize(data, target),
        width = Math.max(560, box.width),
        height = Math.max(1, Math.round(box.height * (width / Math.max(1, box.width)))),
        x = calcSafeSpawnPosNearNode(state.nodes || {}, sourceNodeId, width, height),
        id = generateId('ai-video-retake'),
        sourceMediaKey = pickSourceMediaKey(sourceNodeId, item2),
        endSec = Math.min(30, sourceDurationSec),
        model = getSegmentRetakePreferredModelId(),
        provider = getModelManifest(model),
        decorateSegmentRetakeParameterNodeData2 = decorateSegmentRetakeParameterNodeData({
          id: id,
          type: 'ai-video',
          x: x.x,
          y: x.y,
          width: width,
          height: height,
          fixedSize: true,
          needsAutoResize: false,
          [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: true,
          name: text('nodeName'),
          model: model,
          provider: provider?.provider || 'apimart',
          aspectRatio: 'adaptive',
          resolution: '720p',
          duration: -1,
          prompt: '',
          generationParams: {
            aspectRatio: 'adaptive',
            duration: -1,
            resolution: '720p',
            omniReferenceTaskType: 'edit',
          },
          segmentRetake: {
            version: 1,
            phase: SEGMENT_RETAKE_PHASE_EDITING,
            sourceNodeId: sourceNodeId.id,
            sourceMediaKey: sourceMediaKey,
            sourceUrl: sourceUrl,
            sourceLocalPath: sourceLocalPath,
            sourceDurationSec: sourceDurationSec,
            range: { startSec: 0, endSec: endSec, durationSec: endSec },
            annotations: [],
          },
        });
      (store.batch(() => {
        (store.addNode(decorateSegmentRetakeParameterNodeData2),
          store.addEdge({
            id: generateId('edge-retake-video'),
            sourceId: sourceNodeId.id,
            targetId: id,
            refSlot: 'referenceVideo',
            sourceMediaKey: sourceMediaKey,
          }),
          store.setSelectedNodes([id]));
      }),
        commit(),
        window._triggerLocalCacheSave?.(),
        window.v2FocusOnNode?.(id, 100, 500, 1.5));
    } catch (error) {
      window.showToast?.(error?.message || text('errors.createFailed'), 'error');
    } finally {
      ((enabled = false), el.isConnected && ((el.disabled = false), el.removeAttribute('aria-busy')));
    }
  };
  return (el.addEventListener('click', async2), () => el.removeEventListener('click', async2));
}
