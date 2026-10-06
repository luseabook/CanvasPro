import { createAudioPlaybackSurfaceController } from '../../components/audio-node/audioPlaybackSurface.js';
import { attachMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { syncPersonReplacementVoicePreviewUi } from './personReplacementAssetPresentation.js';
import { renderPersonReplacementVoiceCloneSourceCards } from './personReplacementVoiceClonePresentation.js';
import {
  isPersonReplacementVoiceSeparationActive,
  resolvePersonReplacementVoiceSeparationState,
} from './personReplacementVoiceSeparationState.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function cloneJson(item) {
  return item && typeof item === 'object' ? JSON.parse(JSON.stringify(item)) : item;
}
function requireFunctions(key, index) {
  for (const [result, data] of Object.entries(index)) {
    if (typeof data !== 'function') throw new TypeError(key + ' requires ' + result + '.');
  }
}
export function createPersonReplacementVoiceCloneInteractionController({
  getRoot: getRoot,
  getProject: getProject,
  isDestroyed: isDestroyed,
  commitProject: commitProject,
  mountStudio: mountStudio,
  resumeVoiceSeparation: resumeVoiceSeparation,
  resolveCharacterVoiceUrl: resolveCharacterVoiceUrl,
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window || globalThis,
} = {}) {
  const options = 'Person replacement voice-clone interaction';
  requireFunctions(options, {
    commitProject: commitProject,
    getProject: getProject,
    getRoot: getRoot,
    isDestroyed: isDestroyed,
    mountStudio: mountStudio,
    resolveCharacterVoiceUrl: resolveCharacterVoiceUrl,
    resumeVoiceSeparation: resumeVoiceSeparation,
  });
  let value2 = null,
    value3 = null,
    list = [],
    audioEl = null,
    assetId = '',
    target = '',
    value4 = null,
    el = null,
    value5 = null,
    enabled = false;
  const run = () => getRoot() || null,
    handler = () => getProject() || {};
  function onAudioPickStateChange({ active: active = false } = {}) {
    run()?.classList?.toggle?.('is-voice-audio-picking', active === true);
  }
  function syncPreviewUi() {
    syncPersonReplacementVoicePreviewUi(run(), { audioEl: audioEl, assetId: assetId });
  }
  function run2(el2) {
    ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'ended'].forEach((source) => {
      el2.addEventListener?.(source, syncPreviewUi);
    });
  }
  function stopPreview() {
    value4 = null;
    if (audioEl)
      try {
        (audioEl.pause?.(), (audioEl.currentTime = 0));
      } catch {}
    ((audioEl = null), (assetId = ''), (target = ''), syncPreviewUi());
  }
  function destroySourcePlaybackBindings() {
    (list.forEach((next) => next?.destroy?.()), (list = []));
  }
  function bindSourcePlayback() {
    destroySourcePlaybackBindings();
    const list2 = Array.from(run()?.querySelectorAll?.('[data-person-replacement-voice-track]') || []);
    list2.forEach((el3) => {
      let audioPlaybackSurfaceController = null;
      audioPlaybackSurfaceController = createAudioPlaybackSurfaceController(el3, {
        onBeforePlay: () => {
          (stopPreview(),
            list.forEach((current) => {
              if (current !== audioPlaybackSurfaceController) current?.audioEl?.pause?.();
            }));
        },
        onError: () =>
          windowObject?.showToast?.(
            el3.dataset?.personReplacementVoiceTrack === 'vocals'
              ? '清晰人声播放失败。'
              : '原始声音播放失败。',
            'warn',
          ),
      });
      if (audioPlaybackSurfaceController) list.push(audioPlaybackSurfaceController);
    });
  }
  function unmount() {
    (value2?.(), (value2 = null), (value3 = null), onAudioPickStateChange());
  }
  function mount() {
    unmount();
    const sourceId2 = handler();
    if (sourceId2.workspace?.step !== 4) return false;
    const enabled2 = run()?.querySelector?.('[data-person-replacement-voice-studio-host]');
    if (!enabled2) return false;
    const run3 = mountStudio(enabled2, {
        project: cloneJson(sourceId2),
        sourceId: sourceId2.workspace.selectedVoiceSourceId,
        onAudioPickStateChange: onAudioPickStateChange,
      }),
      text = normalizeText(sourceId2.workspace.selectedVoiceSourceId),
      personReplacementVoiceSeparationState = resolvePersonReplacementVoiceSeparationState(sourceId2, text);
    text &&
      isPersonReplacementVoiceSeparationActive(personReplacementVoiceSeparationState) &&
      resumeVoiceSeparation(text);
    if (typeof run3 === 'function')
      return (
        (value2 = () => {
          (onAudioPickStateChange(), run3());
        }),
        true
      );
    if (run3 && typeof run3 === 'object')
      return (
        (value3 = run3),
        typeof run3.destroy === 'function' &&
          (value2 = () => {
            (onAudioPickStateChange(), run3.destroy());
          }),
        true
      );
    return false;
  }
  function selectVoiceAsset(entry, record = {}) {
    const payload = value3?.selectVoiceAsset?.(entry, record);
    if (payload?.applied) onAudioPickStateChange();
    else {
      if (payload?.reason === 'not-picking')
        windowObject?.showToast?.('请先点击右侧句子轨中的声音克隆入参，再选择人物素材。', 'info');
      else
        payload?.reason === 'invalid' &&
          windowObject?.showToast?.('该人物音频不可用，请重新上传。', 'warn');
    }
    return payload;
  }
  async function playPreview(handle) {
    const text2 = normalizeText(handle),
      state = handler(),
      config = (Array.isArray(state.characters) ? state.characters : []).find(
        (scope) => scope.id === text2,
      ),
      enabled3 = resolveCharacterVoiceUrl(config);
    if (!enabled3 || typeof windowObject?.Audio !== 'function') return;
    list.forEach((input) => input?.audioEl?.pause?.());
    const enabled4 = Boolean(audioEl && assetId === text2 && target === enabled3);
    if (enabled4 && value4) {
      await value4;
      return;
    }
    if (enabled4 && audioEl.paused === false && audioEl.ended !== true) {
      (audioEl.pause?.(), syncPreviewUi());
      return;
    }
    !enabled4 &&
      (stopPreview(),
      (audioEl = new windowObject.Audio()),
      (audioEl.preload = 'auto'),
      (assetId = text2),
      (target = enabled3),
      run2(audioEl));
    const output = audioEl;
    if (output.ended) output.currentTime = 0;
    syncPreviewUi();
    let value6 = null;
    ((value6 = (async () => {
      try {
        const attachMediaElementPlaybackSource2 = await attachMediaElementPlaybackSource(output, enabled3, {
          preload: 'auto',
          shouldAssign: () => audioEl === output && assetId === text2 && target === enabled3,
        });
        if (
          !attachMediaElementPlaybackSource2 ||
          audioEl !== output ||
          assetId !== text2 ||
          target !== enabled3
        )
          return;
        const promise = output.play?.();
        promise && typeof promise.then === 'function' && (await promise);
        if (audioEl === output) syncPreviewUi();
      } catch {
        if (audioEl !== output) return;
        (stopPreview(), windowObject?.showToast?.('声音参考播放失败。', 'warn'));
      } finally {
        value4 === value6 && (value4 = null);
      }
    })()),
      (value4 = value6),
      await value6);
  }
  function selectSource(value7) {
    const args = handler(),
      selectedVoiceSourceId = normalizeText(value7);
    if (
      !selectedVoiceSourceId ||
      selectedVoiceSourceId === args.workspace?.selectedVoiceSourceId ||
      !(Array.isArray(args.sources) ? args.sources : []).some(
        (value8) => value8.id === selectedVoiceSourceId && value8.videoRef,
      )
    )
      return cloneJson(args);
    const value9 = {
      ...args,
      workspace: { ...args.workspace, selectedVoiceSourceId: selectedVoiceSourceId },
    };
    if (typeof value3?.selectSource !== 'function')
      return commitProject(value9, { reason: 'voice-source', render: true });
    const value10 = value3.selectSource(selectedVoiceSourceId);
    if (value10?.selected === false) return cloneJson(args);
    const value11 = commitProject(value9, { reason: 'voice-source', render: false }),
      el4 = run();
    return (
      el4?.querySelectorAll?.('[data-person-replacement-action="select-voice-source"]')?.forEach?.(
        (el5) => {
          const text3 = normalizeText(el5.dataset?.sourceId) === selectedVoiceSourceId;
          (el5.classList?.toggle?.('is-selected', text3),
            el5.setAttribute?.('aria-pressed', text3 ? 'true' : 'false'));
          const el6 = el5.querySelector?.('.person-replacement-voice-source-state');
          if (el6) el6.textContent = text3 ? '当前' : '选择';
        },
      ),
      el4?.querySelectorAll?.('[data-person-replacement-voice-source-shell]')?.forEach?.((el7) => {
        el7.classList?.toggle?.(
          'is-selected',
          normalizeText(el7.dataset?.sourceId) === selectedVoiceSourceId,
        );
      }),
      syncPreviewUi(),
      cloneJson(value11)
    );
  }
  function refreshSourceCards({
    sourceId: sourceId = '',
    remountVoiceStudio: remountVoiceStudio = false,
  } = {}) {
    const value12 = handler();
    if (isDestroyed() || value12.workspace?.step !== 4) return false;
    const el8 = run()?.querySelector?.('.person-replacement-voice-source-list');
    if (!el8) return false;
    const text4 = normalizeText(sourceId),
      el9 = documentObject?.activeElement?.closest?.('[data-person-replacement-voice-source-shell]'),
      value13 = Boolean(text4 && normalizeText(el9?.dataset?.sourceId) === text4);
    (destroySourcePlaybackBindings(),
      (el8.innerHTML =
        renderPersonReplacementVoiceCloneSourceCards(value12) ||
        '<p class="person-replacement-inline-empty">请先在项目首页上传视频</p>'),
      bindSourcePlayback());
    if (remountVoiceStudio) mount();
    return (
      value13 &&
        Array.from(
          el8.querySelectorAll?.(
            '[data-person-replacement-action="extract-clean-voice"], [data-person-replacement-action="cancel-voice-separation"]',
          ) || [],
        )
          .find((el10) => normalizeText(el10.dataset?.sourceId) === text4)
          ?.focus?.(),
      true
    );
  }
  function clearDropTarget() {
    (el?.classList?.remove?.('is-person-replacement-voice-drop-target'), (el = null));
  }
  function resetDropEligibility() {
    ((value5 = null), (enabled = false));
  }
  function canDropOnAudioParam(el11) {
    if (value5 === el11) return enabled;
    const segmentId = normalizeText(el11?.dataset?.segmentId);
    return (
      (value5 = el11),
      (enabled = Boolean(segmentId && value3?.canSelectVoiceAsset?.({ segmentId: segmentId }) === true)),
      enabled
    );
  }
  function setDropTarget(value14) {
    if (el === value14) return;
    (clearDropTarget(),
      (el = value14 || null),
      el?.classList?.add?.('is-person-replacement-voice-drop-target'));
  }
  function destroy() {
    (clearDropTarget(), resetDropEligibility(), destroySourcePlaybackBindings(), unmount(), stopPreview());
  }
  return Object.freeze({
    bindSourcePlayback: bindSourcePlayback,
    canDropOnAudioParam: canDropOnAudioParam,
    clearDropTarget: clearDropTarget,
    destroy: destroy,
    destroySourcePlaybackBindings: destroySourcePlaybackBindings,
    mount: mount,
    playPreview: playPreview,
    refreshSourceCards: refreshSourceCards,
    resetDropEligibility: resetDropEligibility,
    selectSource: selectSource,
    selectVoiceAsset: selectVoiceAsset,
    setDropTarget: setDropTarget,
    stopPreview: stopPreview,
    syncPreviewUi: syncPreviewUi,
    unmount: unmount,
  });
}
