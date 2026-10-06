import { localPathToUrl } from '../../utils/localMediaPath.js';
import { syncPersonReplacementVideoStageFrame } from './personReplacementVideoPresentation.js';
import { resolvePersonReplacementSourcePlaybackRef } from './personReplacementSourcePlayback.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function normalizeMediaUrl(item) {
  const text = normalizeText(item);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
export function createPersonReplacementShotCutPreviewMediaController({
  session: session,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  getSelectedShot: getSelectedShot = () => null,
  createVideoPlayback: createVideoPlayback = () => null,
  documentObject: documentObject = globalThis.document,
  isDestroyed: isDestroyed = () => false,
} = {}) {
  if (!session?.workspaceState) throw new TypeError('Shot cut preview media requires a session.');
  const enabled = session.workspaceState;
  let value2 = null,
    value3 = null;
  const getSourceMediaRef = (key) => {
      const text2 = normalizeText(key);
      if (!text2) return '';
      const runtimePreviewRef = getProject(),
        source = runtimePreviewRef.sources.find((index) => index.id === text2),
        sourceShot = runtimePreviewRef.shots.find((result) => result.sourceId === text2);
      return normalizeMediaUrl(
        resolvePersonReplacementSourcePlaybackRef({
          runtimePreviewRef: runtimePreviewRef.sourcePreviewRefs?.[text2],
          source: source,
          sourceShot: sourceShot,
        }),
      );
    },
    handler = () => session.clearBufferedWarmup(),
    handler2 = (el, data) => {
      handler();
      if (!el) return false;
      const options = Math.max(0, Number(data) || 0),
        handler3 = () => {
          handler();
          try {
            if (
              !Number.isFinite(Number(el.currentTime)) ||
              Math.abs(Number(el.currentTime) - options) > 0.02
            )
              el.currentTime = options;
          } catch {}
        };
      if (Number(el.readyState) >= 1) return (handler3(), true);
      return (
        el.addEventListener?.('loadedmetadata', handler3, { once: true }),
        (enabled.bufferedWarmupCleanup = () => {
          el.removeEventListener?.('loadedmetadata', handler3);
        }),
        true
      );
    },
    releaseBufferedVideo = () => session.releasePreviewBuffer(),
    preserveBufferedVideo = () => {
      const el2 = getRoot()?.querySelector?.('[data-person-replacement-shot-cut-video]');
      if (!el2) return false;
      const text3 = normalizeText(el2.dataset?.sourceId),
        text4 = normalizeText(
          el2.dataset?.personReplacementShotCutMediaRef || getSourceMediaRef(text3),
        );
      if (!text3 || !text4) return false;
      ((enabled.bufferedVideo = el2),
        (enabled.bufferedSourceId = text3),
        (enabled.bufferedMediaRef = text4),
        session.attachPreviewBuffer(el2));
      try {
        el2.remove?.();
      } catch {}
      return true;
    },
    restoreBufferedVideo = () => {
      const el3 = getRoot()?.querySelector?.('[data-person-replacement-shot-cut-video]');
      if (!el3 || !enabled.bufferedVideo) return null;
      const text5 = normalizeText(el3.dataset?.sourceId),
        enabled2 = getSourceMediaRef(text5);
      if (
        !text5 ||
        !enabled2 ||
        text5 !== enabled.bufferedSourceId ||
        enabled2 !== enabled.bufferedMediaRef ||
        typeof el3.replaceWith !== 'function'
      )
        return (releaseBufferedVideo(), null);
      const el4 = enabled.bufferedVideo;
      ((el4.preload = 'auto'),
        (el4.playsInline = true),
        (el4.muted = !enabled.soundEnabled),
        (el4.dataset.sourceId = text5),
        el4.setAttribute?.('aria-label', '镜头切口预览'),
        el4.setAttribute?.('preload', 'auto'),
        el4.setAttribute?.('playsinline', ''),
        el4.setAttribute?.('data-person-replacement-shot-cut-video', ''),
        el4.setAttribute?.('data-source-id', text5),
        el4.removeAttribute?.('aria-hidden'));
      const target = el3.getAttribute?.('poster');
      if (target) el4.setAttribute?.('poster', target);
      else el4.removeAttribute?.('poster');
      return (el3.replaceWith(el4), syncPersonReplacementVideoStageFrame(el4), el4);
    },
    attachPreviewMedia = (videoEl, next, current) => {
      const text6 = normalizeText(next),
        sourceUrl = normalizeMediaUrl(current);
      if (!videoEl || !text6 || !sourceUrl) return false;
      const project = getProject();
      ((videoEl.dataset.sourceId = text6),
        (videoEl.dataset.personReplacementShotCutMediaRef = sourceUrl),
        (enabled.bufferedVideo = videoEl),
        (enabled.bufferedSourceId = text6),
        (enabled.bufferedMediaRef = sourceUrl));
      const run = () => {
        (session.attachPreviewBuffer(videoEl, () => {}), videoEl.setAttribute?.('src', sourceUrl));
        try {
          videoEl.load?.();
        } catch {}
        return true;
      };
      if (/^(?:blob:|data:)/i.test(sourceUrl)) return run();
      let videoPlayback = null;
      try {
        videoPlayback = createVideoPlayback({
          videoEl: videoEl,
          sourceUrl: sourceUrl,
          ownerId: ['person-replacement', normalizeText(project.id) || 'project', 'shot-cut-preview'].join(':'),
          allowConcurrentPlayback: true,
          preferStreamingSource: true,
          acquirePlaybackOptions: { bypassConcurrencyLimit: true },
        });
      } catch {}
      if (!videoPlayback || typeof videoPlayback.warm !== 'function')
        return (videoPlayback?.destroy?.(), run());
      (session.attachPreviewBuffer(videoEl, () => {
        (value2 === videoPlayback && ((value2 = null), (value3 = null)), videoPlayback.destroy?.());
      }),
        (value2 = videoPlayback),
        (value3 = videoEl));
      const run2 = () => {
        if (
          isDestroyed() ||
          enabled.bufferedVideo !== videoEl ||
          normalizeText(videoEl.dataset?.sourceId) !== text6 ||
          normalizeText(videoEl.getAttribute?.('src') || videoEl.src)
        )
          return false;
        return run();
      };
      return (
        void Promise.resolve(videoPlayback.warm()).then((entry) => (entry ? true : run2()), run2),
        true
      );
    },
    playPreviewVideo = (record) => {
      if (record && value3 === record && typeof value2?.play === 'function') return value2.play();
      return record?.play?.();
    },
    preparePreviewVideo = () => {
      const project2 = getProject(),
        payload = Math.trunc(Number(project2.workspace.step) || 1);
      if (
        enabled.isOpen ||
        project2.workspace.view !== 'project' ||
        ![1, 2].includes(payload)
      ) {
        if (!enabled.isOpen) releaseBufferedVideo();
        return false;
      }
      const handle = 'auto',
        selectedShot = getSelectedShot(project2),
        text7 = normalizeText(selectedShot?.sourceId),
        enabled3 = getSourceMediaRef(text7),
        state = Math.max(0, Number(selectedShot?.startTimeSec) || 0);
      if (!text7 || !enabled3) return (releaseBufferedVideo(), false);
      if (
        enabled.bufferedVideo &&
        enabled.bufferedSourceId === text7 &&
        enabled.bufferedMediaRef === enabled3
      )
        return (
          (enabled.bufferedVideo.preload = handle),
          enabled.bufferedVideo.setAttribute?.('preload', handle),
          (enabled.bufferedVideo.muted = true),
          handler2(enabled.bufferedVideo, state),
          true
        );
      releaseBufferedVideo();
      if (!documentObject?.defaultView?.HTMLVideoElement) return false;
      const el5 = documentObject?.createElement?.('video');
      if (normalizeText(el5?.tagName).toUpperCase() !== 'VIDEO') return false;
      return (
        (el5.preload = handle),
        (el5.playsInline = true),
        (el5.muted = true),
        (el5.dataset.sourceId = text7),
        el5.setAttribute?.('preload', handle),
        el5.setAttribute?.('playsinline', ''),
        el5.setAttribute?.('muted', ''),
        el5.setAttribute?.('aria-hidden', 'true'),
        attachPreviewMedia(el5, text7, enabled3),
        handler2(el5, state),
        true
      );
    };
  return Object.freeze({
    attachPreviewMedia: attachPreviewMedia,
    getSourceMediaRef: getSourceMediaRef,
    playPreviewVideo: playPreviewVideo,
    preparePreviewVideo: preparePreviewVideo,
    preserveBufferedVideo: preserveBufferedVideo,
    releaseBufferedVideo: releaseBufferedVideo,
    restoreBufferedVideo: restoreBufferedVideo,
  });
}
