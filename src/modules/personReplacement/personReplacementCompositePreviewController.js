import { localPathToUrl } from '../../utils/localMediaPath.js';
import { createPersonReplacementCompositeMediaResidency } from './personReplacementCompositeMediaResidency.js';
import { buildPersonReplacementCompositePreviewSnapshot } from './personReplacementCompositePreviewProjection.js';
import {
  createPersonReplacementCompositePlaybackBinding,
  PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES,
  PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS,
} from './personReplacementCompositePlayback.js';
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function normalizeMediaUrl(index) {
  const text = normalizeText(index);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
export function createPersonReplacementCompositePreviewController({
  getRoot: getRoot,
  getProject: getProject,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  createVideoPlayback: createVideoPlayback,
  createPlaybackBinding: createPlaybackBinding = createPersonReplacementCompositePlaybackBinding,
  createMediaResidency: createMediaResidency = createPersonReplacementCompositeMediaResidency,
} = {}) {
  if (
    typeof getRoot !== 'function' ||
    typeof getProject !== 'function' ||
    typeof createVideoPlayback !== 'function'
  )
    throw new Error('person replacement composite preview requires workspace adapters');
  const map = createMediaResidency({ projectId: getProject()?.['id'] });
  let playbackBinding = null,
    result = false;
  const stop = () => {
      (playbackBinding?.['destroy']?.(), (playbackBinding = null));
    },
    releaseOriginalWarmup = ({ composeOnly: composeOnly = false } = {}) => {
      const enabled = map['peek']('original');
      if (composeOnly && enabled?.['reason'] !== 'compose') return false;
      if (!enabled) return false;
      if (enabled['preserveVisibleElement'] === true && !enabled['controller'])
        return map['forget']('original');
      return map['evict']('original');
    },
    releaseReplacementCache = () => map['evict']('replacement'),
    startOriginalWarmup = (data = '') => {
      if (result) return false;
      const sourceUrl = normalizeMediaUrl(data);
      if (!sourceUrl) return (releaseOriginalWarmup(), false);
      if (map['peek']('original')?.['sourceUrl'] === sourceUrl) return true;
      releaseOriginalWarmup();
      const projectId = getProject(),
        el = getRoot(),
        el2 = el?.['querySelector']?.('[data-person-replacement-compare-video="original"]'),
        text2 = normalizeText(el2?.['dataset']?.['personReplacementCompareVideoUrl']),
        text3 = normalizeText(el2?.['getAttribute']?.('src') || el2?.['currentSrc'] || el2?.['src']),
        preserveVisibleElement = Boolean(el2 && text2 === sourceUrl && text3),
        videoEl = preserveVisibleElement ? el2 : documentObject?.['createElement']?.('video');
      if (!videoEl) return false;
      ((videoEl['dataset']['personReplacementCompareVideo'] = 'original'),
        (videoEl['dataset']['personReplacementCompareVideoUrl'] = sourceUrl),
        (videoEl['preload'] = 'auto'),
        (videoEl['muted'] = true));
      !preserveVisibleElement &&
        (videoEl['classList']?.['add']?.('person-replacement-composite-original-prewarm'),
        videoEl['setAttribute']?.('aria-hidden', 'true'),
        videoEl['setAttribute']?.('tabindex', '-1'));
      videoEl['setAttribute']?.('playsinline', '');
      const options = map['nextSequence']('original');
      let controller = null;
      if (!preserveVisibleElement)
        try {
          controller = createVideoPlayback({
            videoEl: videoEl,
            sourceUrl: sourceUrl,
            ownerId: [
              'person-replacement',
              normalizeText(projectId?.['id']) || 'project',
              'complete-video',
              'composite',
              'original',
              'warmup-' + options,
            ]['join'](':'),
            allowConcurrentPlayback: true,
            preferStreamingSource: false,
            acquirePlaybackOptions: {
              bypassConcurrencyLimit: true,
              maxBytes: PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES,
              timeout: PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS,
            },
          });
        } catch {
          return (videoEl['remove']?.(), false);
        }
      const enabled2 = map['retain']({
        projectId: projectId?.['id'],
        role: 'original',
        sourceUrl: sourceUrl,
        videoEl: videoEl,
        controller: controller,
        preserveVisibleElement: preserveVisibleElement,
        reason: 'compose',
      });
      if (!enabled2) return (controller?.['destroy']?.(), videoEl['remove']?.(), false);
      if (!preserveVisibleElement) {
        const el3 =
          el?.['querySelector']?.(
            '[data-person-replacement-compare-card="original"] ' + '.person-replacement-compare-media-frame',
          ) || documentObject?.['body'];
        el3?.['appendChild']?.(videoEl);
      }
      const target = preserveVisibleElement
        ? playbackBinding?.['warmOriginalPlayback']?.(sourceUrl)
        : typeof controller?.['play'] === 'function'
          ? controller['play']()
          : controller?.['warm']?.();
      return (
        void Promise['resolve'](target)
          ['then'](() => {
            if (map['peek']('original')?.['videoEl'] !== videoEl) return;
            try {
              videoEl['pause']?.();
            } catch {}
          })
          ['catch'](() => false),
        true
      );
    },
    handler = (renderedVideo) => {
      const projectId2 = getProject(),
        sourceUrl2 = normalizeText(renderedVideo?.['dataset']?.['personReplacementCompareVideoUrl']);
      return map['adopt']({
        projectId: projectId2?.['id'],
        role: 'original',
        sourceUrl: sourceUrl2,
        renderedVideo: renderedVideo,
      });
    },
    handler2 = (renderedVideo2) => {
      const projectId3 = getProject(),
        enabled3 = map['peek']('replacement'),
        sourceUrl3 = normalizeText(renderedVideo2?.['dataset']?.['personReplacementCompareVideoUrl']);
      if (
        !enabled3 ||
        !renderedVideo2 ||
        sourceUrl3 !== enabled3['sourceUrl'] ||
        (renderedVideo2 !== enabled3['videoEl'] && typeof renderedVideo2['replaceWith'] !== 'function')
      )
        return (
          enabled3 &&
            buildPersonReplacementCompositePreviewSnapshot(projectId3)['previewMode'] === 'full' &&
            sourceUrl3 !== enabled3['sourceUrl'] &&
            releaseReplacementCache(),
          null
        );
      return map['adopt']({
        projectId: projectId3?.['id'],
        role: 'replacement',
        sourceUrl: sourceUrl3,
        renderedVideo: renderedVideo2,
      });
    },
    prepareOriginalHandoff = () => {
      const enabled4 = map['peek']('original');
      if (!enabled4 || enabled4['controller'] || enabled4['preserveVisibleElement'] !== true) return false;
      const enabled5 = playbackBinding?.['retainOriginalPlayback']?.(enabled4['sourceUrl']);
      if (!enabled5?.['controller']) return false;
      if (!map['handoff']('original', enabled5)) return (enabled5['controller']['destroy']?.(), false);
      return ((playbackBinding = null), true);
    },
    retainFullVideosForPageRefresh = () => {
      if (map['has']('original') || map['has']('replacement')) return false;
      const projectId4 = getProject(),
        personReplacementCompositePreviewSnapshot =
          buildPersonReplacementCompositePreviewSnapshot(projectId4)['fullMedia'],
        args = playbackBinding?.['retainFullPlaybacks']?.({
          original: normalizeMediaUrl(personReplacementCompositePreviewSnapshot['originalRef']),
          replacement: normalizeMediaUrl(personReplacementCompositePreviewSnapshot['replacementRef']),
        });
      if (!args?.['original'] && !args?.['replacement']) return false;
      return (
        args['original'] &&
          map['retain']({
            ...args['original'],
            projectId: projectId4?.['id'],
            role: 'original',
            preserveVisibleElement: true,
            reason: 'mode-cache',
          }),
        args['replacement'] &&
          map['retain']({
            ...args['replacement'],
            projectId: projectId4?.['id'],
            role: 'replacement',
          }),
        (playbackBinding = null),
        true
      );
    },
    bind = () => {
      stop();
      if (result) return false;
      const project = getProject();
      if (project?.['workspace']?.['view'] !== 'project' || project['workspace']['step'] !== 5) return false;
      const root = getRoot(),
        source = root?.['querySelector']?.('[data-person-replacement-compare-video="original"]'),
        adoptedOriginalPlayback = handler(source),
        originalVideo = adoptedOriginalPlayback?.['videoEl'] || source,
        next = root?.['querySelector']?.('[data-person-replacement-compare-video="replacement"]'),
        adoptedReplacementPlayback = handler2(next),
        replacementVideo = adoptedReplacementPlayback?.['videoEl'] || next;
      return (
        (playbackBinding = createPlaybackBinding({
          root: root,
          project: project,
          getProject: getProject,
          windowObject: windowObject,
          createVideoPlayback: createVideoPlayback,
          originalVideo: originalVideo,
          replacementVideo: replacementVideo,
          adoptedOriginalPlayback: adoptedOriginalPlayback,
          adoptedReplacementPlayback: adoptedReplacementPlayback,
        })),
        Boolean(playbackBinding)
      );
    };
  return Object['freeze']({
    bind: bind,
    stop: stop,
    startOriginalWarmup: startOriginalWarmup,
    releaseOriginalWarmup: releaseOriginalWarmup,
    releaseReplacementCache: releaseReplacementCache,
    prepareOriginalHandoff: prepareOriginalHandoff,
    retainFullVideosForPageRefresh: retainFullVideosForPageRefresh,
    togglePlayback: () => playbackBinding?.['togglePlayback']?.() ?? false,
    setTrack: (current) => playbackBinding?.['setTrack']?.(current),
    switchProject: (entry) => map['switchProject'](entry),
    dispose() {
      if (result) return;
      (stop(), map['dispose'](), (result = true));
    },
  });
}
