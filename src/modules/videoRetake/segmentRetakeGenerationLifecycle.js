import { t } from '../../i18n/index.js';
import {
  applySegmentRetakeTaskPayload,
  getSegmentRetakeSubmitErrorKey,
  validateSegmentRetakeSubmitNode,
} from './segmentRetakeSubmit.js';
import {
  SEGMENT_RETAKE_PHASE_SUBMITTED,
  applySegmentRetakeSubmitParameterPolicy,
  buildSegmentRetakePhasePatch,
  buildSegmentRetakeSessionClearPatch,
} from './segmentRetakeModelPolicy.js';
export { applySegmentRetakeSubmitParameterPolicy, applySegmentRetakeTaskPayload };
export function clearSegmentRetakeSessionOnSuccess(value, item) {
  item && value?.['segmentRetake'] && Object['assign'](item, buildSegmentRetakeSessionClearPatch(value));
}
export function createSegmentRetakeGenerationLifecycle(
  key,
  { nodeData: nodeData = {}, store: store, startLoading: startLoading, stopLoading: stopLoading } = {},
) {
  const ok = validateSegmentRetakeSubmitNode(nodeData),
    index = nodeData?.['segmentRetake']?.['phase'] || '';
  let enabled = ![],
    result = ![];
  return {
    ok: ok['ok'],
    isSegmentRetake: ok['isSegmentRetake'] === !![],
    reject() {
      if (ok['ok']) return ![];
      return (
        globalThis['window']?.['showToast']?.(
          t('segmentRetake.errors.' + getSegmentRetakeSubmitErrorKey(ok['reason'])),
          'warn',
        ),
        !![]
      );
    },
    begin() {
      if (!ok['isSegmentRetake']) return ![];
      ((key['_segmentRetakePreparing'] = !![]),
        (key['_isGenerating'] = !![]),
        key['_setGenerateButtonBusyUi']({ cancellable: ![] }),
        key['btnEl']?.['setAttribute']?.('aria-busy', 'true'));
      const args = buildSegmentRetakePhasePatch(nodeData, SEGMENT_RETAKE_PHASE_SUBMITTED);
      return (
        args &&
          (store['updateNodeData'](key['nodeId'], args),
          (key['_data'] = { ...(key['_data'] || {}), ...args })),
        startLoading(key['previewEl']),
        (enabled = !![]),
        !![]
      );
    },
    hasStartedPresentation() {
      return enabled;
    },
    markTaskStarted() {
      ((result = !![]),
        (key['_segmentRetakePreparing'] = ![]),
        key['btnEl']?.['removeAttribute']?.('aria-busy'));
    },
    restoreBeforeTaskStart() {
      if (!enabled || result) return ![];
      ((key['_segmentRetakePreparing'] = ![]), key['btnEl']?.['removeAttribute']?.('aria-busy'));
      const data = store['getState']()['nodes']?.[key['nodeId']] || key['_data'] || {},
        args2 = buildSegmentRetakePhasePatch(data, index);
      return (
        args2 &&
          (store['updateNodeData'](key['nodeId'], args2),
          (key['_data'] = { ...(key['_data'] || {}), ...args2 })),
        (key['_isGenerating'] = ![]),
        key['_resetGenerateButtonIdleUi']({ cancellable: ![] }),
        stopLoading(key['previewEl']),
        key['_updateSubmitButtonState']?.(),
        index === 'editing' && globalThis['window']?.['v2Renderer']?.['flushNode']?.(key['nodeId']),
        !![]
      );
    },
  };
}
