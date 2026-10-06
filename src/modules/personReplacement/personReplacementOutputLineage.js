export const PERSON_REPLACEMENT_OUTPUT_TRANSITIONS = Object.freeze({
  INVALIDATE: 'invalidate',
  FINAL_MUX_INVALIDATE: 'final-mux-invalidate',
  SOURCE_GRAPH_CHANGED: 'source-graph-changed',
  COMPOSITION_SUCCEEDED: 'composition-succeeded',
  FINAL_MUX_SUCCEEDED: 'final-mux-succeeded',
});
function normalizeText(value) {
  return String(value ?? '').trim();
}
function invalidateOutput(args) {
  const args2 = args.output || {},
    item = Boolean(
      normalizeText(args2.originalMasterRef) &&
      normalizeText(args2.visualMasterRef || args2.finalVideoRef),
    );
  if (item)
    return {
      ...args,
      output: { ...args2, composeStatus: 'pending' },
      workspace: { ...(args.workspace || {}), compositePreviewMode: 'full' },
    };
  return {
    ...args,
    audio: { ...(args.audio || {}), originalAudioRef: '' },
    output: {
      ...args2,
      originalMasterRef: '',
      visualMasterRef: '',
      finalVideoRef: '',
      finalAudioTrack: '',
      composeStatus: 'pending',
      composedShotIds: [],
    },
    workspace: { ...(args.workspace || {}), compositePreviewMode: 'shot' },
  };
}
function completeComposition(args3, key) {
  const originalAudioRef = normalizeText(key.originalMasterRef),
    visualMasterRef = normalizeText(key.visualMasterRef);
  if (!originalAudioRef || !visualMasterRef)
    throw new TypeError(
      'Replacement Studio composition requires original and visual masters',
    );
  const composedShotIds = Array.isArray(key.composedShotIds)
    ? key.composedShotIds.map(normalizeText).filter(Boolean)
    : [];
  return {
    ...args3,
    status: 'completed',
    audio: { ...(args3.audio || {}), originalAudioRef: originalAudioRef },
    output: {
      ...(args3.output || {}),
      originalMasterRef: originalAudioRef,
      visualMasterRef: visualMasterRef,
      finalVideoRef: '',
      finalAudioTrack: '',
      composeStatus: 'succeeded',
      composedShotIds: composedShotIds,
    },
    workspace: { ...(args3.workspace || {}), compositePreviewMode: 'full' },
  };
}
function invalidateFinalMux(args4) {
  return { ...args4, output: { ...(args4.output || {}), finalVideoRef: '', finalAudioTrack: '' } };
}
function applySourceGraphChange(args5, index) {
  return {
    ...args5,
    audio: {
      ...(args5.audio || {}),
      originalAudioRef: normalizeText(index.nextOriginalAudioRef),
    },
    output: {
      ...(args5.output || {}),
      originalMasterRef: '',
      visualMasterRef: '',
      finalVideoRef: '',
      finalAudioTrack: '',
      composeStatus: normalizeText(index.composeStatus) || 'pending',
      composedShotIds: [],
    },
    workspace: { ...(args5.workspace || {}), compositePreviewMode: 'shot' },
  };
}
function completeFinalMux(args6, result) {
  const finalVideoRef = normalizeText(result.finalVideoRef),
    finalAudioTrack = normalizeText(result.finalAudioTrack);
  if (!finalVideoRef || !['original', 'replacement'].includes(finalAudioTrack))
    throw new TypeError('Replacement Studio final mux requires a video and audio track');
  return {
    ...args6,
    output: { ...(args6.output || {}), finalVideoRef: finalVideoRef, finalAudioTrack: finalAudioTrack },
  };
}
export function transitionPersonReplacementOutput(options = {}, data = {}) {
  const text = normalizeText(data.type);
  if (text === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS.INVALIDATE) return invalidateOutput(options);
  if (text === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS.FINAL_MUX_INVALIDATE)
    return invalidateFinalMux(options);
  if (text === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS.SOURCE_GRAPH_CHANGED)
    return applySourceGraphChange(options, data);
  if (text === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS.COMPOSITION_SUCCEEDED)
    return completeComposition(options, data);
  if (text === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS.FINAL_MUX_SUCCEEDED)
    return completeFinalMux(options, data);
  throw new TypeError('Unknown Replacement Studio output transition: ' + text);
}
