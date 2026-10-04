import { createLinkCursor, getCursorSize } from './cursorUtils.js';
const VIDEO_NODE_TYPES = new Set(['source-video', 'ai-video', 'video']),
  AUDIO_NODE_TYPES = new Set(['source-audio', 'ai-audio', 'audio']),
  SOURCE_NODE_TYPES = new Set([...VIDEO_NODE_TYPES, ...AUDIO_NODE_TYPES]),
  CANVAS_NODE_SELECTOR = '.v2-node,\x20.v2-fast-preview-node';
export const AUDIO_VOICE_BATCH_AUDIO_PICK_ID = '__audioVoiceSelectedSegments__';
export function isAudioVoiceVideoNode(options = {}) {
  return VIDEO_NODE_TYPES['has'](String(options?.['type'] || '')['trim']());
}
export function isAudioVoiceAudioNode(options2 = {}) {
  return AUDIO_NODE_TYPES['has'](String(options2?.['type'] || '')['trim']());
}
export function isAudioVoiceSourceNode(options3 = {}) {
  return SOURCE_NODE_TYPES['has'](String(options3?.['type'] || '')['trim']());
}
export function resolveAudioVoiceSelectionTargetIds(value = '', item = [], key = [], index = {}) {
  const enabled = String(value || '')['trim']();
  if (!enabled) return [];
  const result = String(index['batchId'] || AUDIO_VOICE_BATCH_AUDIO_PICK_ID),
    map = new Set(
      (Array['isArray'](key) ? key : [])
        ['map']((data) => String(data?.['id'] || '')['trim']())
        ['filter'](Boolean),
    ),
    map2 = item instanceof Set ? item : new Set(Array['isArray'](item) ? item : []),
    list = [...map]['filter']((target) => map2['has'](target));
  if (enabled === result) return list;
  if (map2['has'](enabled) && list['length'] > 0x1) return list;
  return map['has'](enabled) ? [enabled] : [];
}
function getStateSnapshot(store2) {
  return store2?.['getStateRaw']?.() || store2?.['getState']?.() || {};
}
function createConnectCursor() {
  try {
    return createLinkCursor({ size: getCursorSize() });
  } catch {
    return createLinkCursor({ size: 'small' });
  }
}
export function createAudioVoicePanelPickSession({
  panel: panel,
  noticeElement: noticeElement = null,
  store: store = null,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  getSegments: getSegments = () => [],
  getSelectedSegmentIds: getSelectedSegmentIds = () => new Set(),
  doesSegmentSupportAudioReference: doesSegmentSupportAudioReference = () => !![],
  loadSourceNode: loadSourceNode = () => {},
  applyAudioReference: applyAudioReference = () => ({ applied: ![], appliedIds: [], reason: 'no-target' }),
  syncSourceUi: syncSourceUi = () => {},
  syncAudioTargetUi: syncAudioTargetUi = () => {},
  onAudioPickStateChange: onAudioPickStateChange = null,
  text: text = (source) => source,
  getConnectCursor: getConnectCursor = createConnectCursor,
} = {}) {
  let sourceActive = ![],
    el = null,
    audioSegmentId = '',
    args = new Set(),
    el2 = null,
    value2 = null,
    enabled2 = ![];
  function run() {
    return documentObject?.['getElementById']?.('v2-wrap') || null;
  }
  function run2() {
    return Array['from'](run()?.['querySelectorAll']?.(CANVAS_NODE_SELECTOR) || []);
  }
  function run3() {
    return documentObject?.['documentElement'] || globalThis['document']?.['documentElement'] || null;
  }
  function run4() {
    return getStateSnapshot(store)['nodes'] || {};
  }
  function run5(next, current) {
    windowObject?.['showToast']?.(next, current);
  }
  function run6(entry) {
    if (!noticeElement) return;
    ((noticeElement['textContent'] = text('source.pickNotice')), (noticeElement['hidden'] = entry !== !![]));
  }
  function run7() {
    const stateSnapshot = getStateSnapshot(store)['pickConnectMode'] || null;
    if (stateSnapshot?.['active']) store?.['setPickConnectMode']?.({ active: ![] });
  }
  function run8() {
    (el?.['classList']?.['remove']?.('audio-voice-video-pick-hover'), (el = null));
  }
  function run9() {
    (el2?.['classList']?.['remove']?.('audio-voice-audio-pick-hover'), (el2 = null));
  }
  function run10(enabled3) {
    if (el === enabled3) return;
    run8();
    if (!enabled3) return;
    ((el = enabled3), el['classList']?.['add']?.('audio-voice-video-pick-hover'));
  }
  function run11(enabled4) {
    if (el2 === enabled4) return;
    run9();
    if (!enabled4) return;
    ((el2 = enabled4), el2['classList']?.['add']?.('audio-voice-audio-pick-hover'));
  }
  function run12() {
    run2()['forEach']((el3) => {
      el3['classList']?.['remove']?.('audio-voice-video-pick-accepted', 'audio-voice-video-pick-disabled');
    });
  }
  function run13() {
    run2()['forEach']((el4) => {
      el4['classList']?.['remove']?.('audio-voice-audio-pick-accepted', 'audio-voice-audio-pick-disabled');
    });
  }
  function run14() {
    const record = run4();
    run2()['forEach']((el5) => {
      const payload = String(el5['id'] || el5['dataset']?.['nodeId'] || '')['trim'](),
        isAudioVoiceSourceNode2 = isAudioVoiceSourceNode(record[payload]);
      (el5['classList']?.['toggle']?.('audio-voice-video-pick-accepted', isAudioVoiceSourceNode2),
        el5['classList']?.['toggle']?.('audio-voice-video-pick-disabled', !isAudioVoiceSourceNode2));
    });
  }
  function run15() {
    const handle = run4();
    run2()['forEach']((el6) => {
      const state = String(el6['id'] || el6['dataset']?.['nodeId'] || '')['trim'](),
        isAudioVoiceAudioNode2 = isAudioVoiceAudioNode(handle[state]);
      (el6['classList']?.['toggle']?.('audio-voice-audio-pick-accepted', isAudioVoiceAudioNode2),
        el6['classList']?.['toggle']?.('audio-voice-audio-pick-disabled', !isAudioVoiceAudioNode2));
    });
  }
  function run16() {
    if (sourceActive) run14();
    if (audioSegmentId) run15();
  }
  function run17() {
    if (!sourceActive && !audioSegmentId) return;
    if (enabled2) return;
    enabled2 = !![];
    const run18 = () => {
      enabled2 = ![];
      if (!sourceActive && !audioSegmentId) return;
      run16();
    };
    if (typeof windowObject?.['requestAnimationFrame'] === 'function') {
      windowObject['requestAnimationFrame'](run18);
      return;
    }
    if (typeof windowObject?.['setTimeout'] === 'function') {
      windowObject['setTimeout'](run18, 0x0);
      return;
    }
    run18();
  }
  function run19(el7) {
    return !!(
      el7?.['classList']?.['contains']?.('v2-node') ||
      el7?.['classList']?.['contains']?.('v2-fast-preview-node') ||
      el7?.['querySelector']?.(CANVAS_NODE_SELECTOR)
    );
  }
  function run20(list2 = []) {
    return list2['some']((event) => {
      if (event?.['type'] === 'attributes') return run19(event['target']);
      if (event?.['type'] !== 'childList') return ![];
      return (
        Array['from'](event['addedNodes'] || [])['some'](run19) ||
        Array['from'](event['removedNodes'] || [])['some'](run19)
      );
    });
  }
  function run21() {
    if (value2) return;
    const enabled5 = run(),
      handler = windowObject?.['MutationObserver'] || globalThis['MutationObserver'];
    if (!enabled5 || typeof handler !== 'function') return;
    ((value2 = new handler((config) => {
      if (run20(config)) run17();
    })),
      value2['observe'](enabled5, {
        attributeFilter: ['class'],
        attributes: !![],
        childList: !![],
        subtree: !![],
      }));
  }
  function run22() {
    (value2?.['disconnect']?.(), (value2 = null), (enabled2 = ![]));
  }
  function run23() {
    if (sourceActive || audioSegmentId) return;
    run22();
  }
  function run24(el8, accepted) {
    const nodeElement = el8?.['closest']?.(CANVAS_NODE_SELECTOR) || null,
      enabled6 = String(nodeElement?.['id'] || nodeElement?.['dataset']?.['nodeId'] || '')['trim']();
    if (!enabled6) return { nodeElement: null, node: null, accepted: ![] };
    const node = run4()[enabled6] || null;
    return { nodeElement: nodeElement, node: node, accepted: accepted(node) };
  }
  function run25(event2) {
    if (!sourceActive || panel?.['contains']?.(event2['target'])) return;
    const { nodeElement: nodeElement2, accepted: accepted2 } = run24(
      event2['target'],
      isAudioVoiceSourceNode,
    );
    run10(accepted2 ? nodeElement2 : null);
  }
  function run26(event3) {
    if (!sourceActive || panel?.['contains']?.(event3['target'])) return;
    const { node: node2, accepted: accepted3 } = run24(event3['target'], isAudioVoiceSourceNode);
    if (!node2) return;
    (event3['preventDefault']?.(), event3['stopPropagation']?.(), event3['stopImmediatePropagation']?.());
    if (!accepted3) {
      run5(text('toasts.sourcePickUnsupported'), 'warn');
      return;
    }
    (loadSourceNode(node2, { markLastUsed: !![] }), run27());
  }
  function run28(event4) {
    if (!sourceActive || event4['key'] !== 'Escape') return;
    (event4['preventDefault']?.(),
      event4['stopPropagation']?.(),
      run27({ toastText: text('toasts.sourcePickCancelled') }));
  }
  function run29(event5) {
    if (!audioSegmentId || panel?.['contains']?.(event5['target'])) return;
    const { nodeElement: nodeElement3, accepted: accepted4 } = run24(event5['target'], isAudioVoiceAudioNode);
    run11(accepted4 ? nodeElement3 : null);
  }
  function run30(event6) {
    if (!audioSegmentId || panel?.['contains']?.(event6['target'])) return;
    const { node: node3, accepted: accepted5 } = run24(event6['target'], isAudioVoiceAudioNode);
    if (!node3) return;
    (event6['preventDefault']?.(), event6['stopPropagation']?.(), event6['stopImmediatePropagation']?.());
    if (!accepted5) {
      run5(text('toasts.audioPickUnsupported'), 'warn');
      return;
    }
    const enabled7 = selectAudioReference(node3);
    !enabled7['applied'] && enabled7['reason'] === 'invalid' && run5(text('toasts.audioPickInvalid'), 'warn');
  }
  function run31(event7) {
    if (!audioSegmentId || event7['key'] !== 'Escape') return;
    (event7['preventDefault']?.(),
      event7['stopPropagation']?.(),
      run32({ toastText: text('toasts.audioPickCancelled') }));
  }
  function run27({ toastText: toastText = '' } = {}) {
    (documentObject?.['body']?.['classList']?.['remove']?.('audio-voice-video-pick-active'), run6(![]));
    if (!sourceActive) return;
    ((sourceActive = ![]),
      run8(),
      run12(),
      panel?.['classList']?.['remove']?.('is-video-picking'),
      run()?.['classList']?.['remove']?.('is-connecting', 'audio-voice-video-pick-mode'),
      run23());
    const el9 = run3();
    (el9?.['classList']?.['remove']?.('is-connecting-mode'),
      el9?.['style']?.['removeProperty']?.('--connect-cursor'),
      documentObject?.['removeEventListener']?.('click', run26, !![]),
      documentObject?.['removeEventListener']?.('pointermove', run25, !![]),
      documentObject?.['removeEventListener']?.('keydown', run28, !![]),
      syncSourceUi());
    if (toastText) run5(toastText, 'info');
  }
  function startSourcePick({ toggle: toggle = !![] } = {}) {
    if (sourceActive) {
      toggle && run27({ toastText: text('toasts.sourcePickCancelled') });
      return;
    }
    (run7(),
      run32(),
      (sourceActive = !![]),
      panel?.['classList']?.['add']?.('is-video-picking'),
      documentObject?.['body']?.['classList']?.['add']?.('audio-voice-video-pick-active'),
      run6(!![]),
      run()?.['classList']?.['add']?.('is-connecting', 'audio-voice-video-pick-mode'),
      run21(),
      run14());
    const el10 = run3();
    (el10?.['classList']?.['add']?.('is-connecting-mode'),
      el10?.['style']?.['setProperty']?.('--connect-cursor', getConnectCursor()),
      documentObject?.['addEventListener']?.('click', run26, !![]),
      documentObject?.['addEventListener']?.('pointermove', run25, !![]),
      documentObject?.['addEventListener']?.('keydown', run28, !![]),
      syncSourceUi(),
      run5(text('toasts.sourcePickStarted'), 'info'));
  }
  function run33(scope) {
    const input = String(scope || '')['trim'](),
      segments = getSegments(),
      list3 = (Array['isArray'](segments) ? segments : [])['filter'](
        (response) => response?.['status'] !== 'removed',
      ),
      targetIds = resolveAudioVoiceSelectionTargetIds(input, getSelectedSegmentIds(), list3);
    if (targetIds['length'] <= 0x0) return { eligible: ![], reason: 'no-target', targetIds: targetIds };
    const reason = targetIds['some']((output) => {
      const value3 = list3['find']((value4) => value4?.['id'] === output);
      return value3 && !doesSegmentSupportAudioReference(value3);
    });
    return { eligible: !reason, reason: reason ? 'unsupported' : '', targetIds: targetIds };
  }
  function canSelectAudioReference({ segmentId: segmentId = '' } = {}) {
    return run33(segmentId)['eligible'];
  }
  function run32({ toastText: toastText = '' } = {}) {
    if (!audioSegmentId) return;
    const value5 = [...args];
    ((audioSegmentId = ''),
      (args = new Set()),
      run9(),
      run13(),
      panel?.['classList']?.['remove']?.('is-audio-picking'),
      run()?.['classList']?.['remove']?.('is-connecting', 'audio-voice-audio-pick-mode'),
      run23());
    const el11 = run3();
    (el11?.['classList']?.['remove']?.('is-connecting-mode'),
      el11?.['style']?.['removeProperty']?.('--connect-cursor'),
      documentObject?.['removeEventListener']?.('click', run30, !![]),
      documentObject?.['removeEventListener']?.('pointermove', run29, !![]),
      documentObject?.['removeEventListener']?.('keydown', run31, !![]),
      syncAudioTargetUi(value5),
      onAudioPickStateChange?.({ active: ![], segmentId: '', targetSegmentIds: [] }));
    if (toastText) run5(toastText, 'info');
  }
  function startAudioPick(value6, { announce: announce = !![] } = {}) {
    const segmentId2 = String(value6 || '')['trim']();
    if (!segmentId2) return;
    const value7 = run33(segmentId2),
      { targetIds: targetIds2 } = value7;
    if (value7['reason'] === 'no-target') {
      run5(text('toasts.selectSentenceForVoice'), 'warn');
      return;
    }
    if (value7['reason'] === 'unsupported') {
      run5(text('toasts.voiceCloneUnsupported'), 'warn');
      return;
    }
    if (audioSegmentId === segmentId2) {
      run32({ toastText: text('toasts.audioPickCancelled') });
      return;
    }
    (run7(),
      run27(),
      run32(),
      (audioSegmentId = segmentId2),
      (args = new Set(targetIds2)),
      panel?.['classList']?.['add']?.('is-audio-picking'),
      run()?.['classList']?.['add']?.('is-connecting', 'audio-voice-audio-pick-mode'),
      run21(),
      run15());
    const el12 = run3();
    (el12?.['classList']?.['add']?.('is-connecting-mode'),
      el12?.['style']?.['setProperty']?.('--connect-cursor', getConnectCursor()),
      documentObject?.['addEventListener']?.('click', run30, !![]),
      documentObject?.['addEventListener']?.('pointermove', run29, !![]),
      documentObject?.['addEventListener']?.('keydown', run31, !![]),
      syncAudioTargetUi(targetIds2),
      onAudioPickStateChange?.({ active: !![], segmentId: segmentId2, targetSegmentIds: [...targetIds2] }));
    if (announce) run5(text('toasts.audioPickStarted'), 'info');
  }
  function selectAudioReference(options4 = {}, { segmentId: segmentId = '' } = {}) {
    const value8 = String(segmentId || '')['trim']();
    if (value8 && value8 !== audioSegmentId) {
      startAudioPick(value8, { announce: ![] });
      if (audioSegmentId !== value8) return { applied: ![], reason: 'no-target', appliedIds: [] };
    }
    if (!audioSegmentId) return { applied: ![], reason: 'not-picking', appliedIds: [] };
    const reason2 = applyAudioReference(options4, [...args]);
    if (!reason2?.['appliedIds']?.['length'])
      return { applied: ![], reason: reason2?.['reason'] || 'invalid', appliedIds: [] };
    return (
      run32(),
      run5(
        reason2['appliedIds']['length'] > 0x1
          ? text('toasts.audioPickBatchSelected', { count: reason2['appliedIds']['length'] })
          : text('toasts.audioPickSelected'),
        'success',
      ),
      { applied: !![], reason: '', appliedIds: reason2['appliedIds'] }
    );
  }
  function stopAll() {
    (run27(), run32());
  }
  function getSnapshot() {
    return { sourceActive: sourceActive, audioSegmentId: audioSegmentId, audioTargetSegmentIds: [...args] };
  }
  function destroy() {
    (stopAll(), run22());
  }
  return {
    canSelectAudioReference: canSelectAudioReference,
    destroy: destroy,
    getSnapshot: getSnapshot,
    selectAudioReference: selectAudioReference,
    startAudioPick: startAudioPick,
    startSourcePick: startSourcePick,
    stopAll: stopAll,
  };
}
