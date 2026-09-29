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
export function clearSegmentRetakeSessionOnSuccess(_0x367ab7, _0x4bca00) {
  _0x4bca00 &&
    _0x367ab7?.['segmentRetake'] &&
    Object['assign'](_0x4bca00, buildSegmentRetakeSessionClearPatch(_0x367ab7));
}
export function createSegmentRetakeGenerationLifecycle(
  _0x848d11,
  { nodeData: nodeData = {}, store: _0x9ecd6e, startLoading: _0x4e20f, stopLoading: _0xcdad1a } = {},
) {
  const _0x2ac714 = validateSegmentRetakeSubmitNode(nodeData),
    _0x2b539f = nodeData?.['segmentRetake']?.['phase'] || '';
  let _0x119726 = ![],
    _0x49a321 = ![];
  return {
    ok: _0x2ac714['ok'],
    isSegmentRetake: _0x2ac714['isSegmentRetake'] === !![],
    reject() {
      if (_0x2ac714['ok']) return ![];
      return (
        globalThis['window']?.['showToast']?.(
          t('segmentRetake.errors.' + getSegmentRetakeSubmitErrorKey(_0x2ac714['reason'])),
          'warn',
        ),
        !![]
      );
    },
    begin() {
      if (!_0x2ac714['isSegmentRetake']) return ![];
      ((_0x848d11['_segmentRetakePreparing'] = !![]),
        (_0x848d11['_isGenerating'] = !![]),
        _0x848d11['_setGenerateButtonBusyUi']({ cancellable: ![] }),
        _0x848d11['btnEl']?.['setAttribute']?.('aria-busy', 'true'));
      const _0x456a39 = buildSegmentRetakePhasePatch(nodeData, SEGMENT_RETAKE_PHASE_SUBMITTED);
      return (
        _0x456a39 &&
          (_0x9ecd6e['updateNodeData'](_0x848d11['nodeId'], _0x456a39),
          (_0x848d11['_data'] = { ...(_0x848d11['_data'] || {}), ..._0x456a39 })),
        _0x4e20f(_0x848d11['previewEl']),
        (_0x119726 = !![]),
        !![]
      );
    },
    hasStartedPresentation() {
      return _0x119726;
    },
    markTaskStarted() {
      ((_0x49a321 = !![]),
        (_0x848d11['_segmentRetakePreparing'] = ![]),
        _0x848d11['btnEl']?.['removeAttribute']?.('aria-busy'));
    },
    restoreBeforeTaskStart() {
      if (!_0x119726 || _0x49a321) return ![];
      ((_0x848d11['_segmentRetakePreparing'] = ![]), _0x848d11['btnEl']?.['removeAttribute']?.('aria-busy'));
      const _0x213c2a = _0x9ecd6e['getState']()['nodes']?.[_0x848d11['nodeId']] || _0x848d11['_data'] || {},
        _0x55594f = buildSegmentRetakePhasePatch(_0x213c2a, _0x2b539f);
      return (
        _0x55594f &&
          (_0x9ecd6e['updateNodeData'](_0x848d11['nodeId'], _0x55594f),
          (_0x848d11['_data'] = { ...(_0x848d11['_data'] || {}), ..._0x55594f })),
        (_0x848d11['_isGenerating'] = ![]),
        _0x848d11['_resetGenerateButtonIdleUi']({ cancellable: ![] }),
        _0xcdad1a(_0x848d11['previewEl']),
        _0x848d11['_updateSubmitButtonState']?.(),
        _0x2b539f === 'editing' && globalThis['window']?.['v2Renderer']?.['flushNode']?.(_0x848d11['nodeId']),
        !![]
      );
    },
  };
}
