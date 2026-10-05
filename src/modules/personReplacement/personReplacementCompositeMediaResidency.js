import { clearDesktopMediaPlaybackSourceMetadata } from '../../services/desktopMediaBlobSource.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function releaseCompositeMediaElement({ videoEl: videoEl2 } = {}) {
  if (!videoEl2) return;
  try {
    (videoEl2['pause']?.(),
      videoEl2['removeAttribute']?.('src'),
      clearDesktopMediaPlaybackSourceMetadata(videoEl2),
      (videoEl2['preload'] = 'none'),
      videoEl2['load']?.(),
      videoEl2['remove']?.());
  } catch {}
}
function adoptCompositeMediaElement(el, item, { role: role, sourceUrl: sourceUrl }) {
  const enabled = el === item;
  if (!enabled && typeof item['replaceWith'] !== 'function')
    throw new Error('composite media placeholder cannot be replaced');
  try {
    (el['pause']?.(), (el['currentTime'] = 0));
  } catch {}
  ((el['className'] = item['className'] || ''),
    (el['dataset']['personReplacementCompareVideo'] = role),
    (el['dataset']['personReplacementCompareVideoUrl'] = sourceUrl),
    (el['preload'] = 'auto'),
    (el['muted'] = true),
    el['removeAttribute']?.('aria-hidden'),
    el['removeAttribute']?.('tabindex'),
    el['setAttribute']?.('playsinline', ''),
    ['poster', 'aria-label']['forEach']((key) => {
      const index = item['getAttribute']?.(key);
      if (index) el['setAttribute']?.(key, index);
      else el['removeAttribute']?.(key);
    }));
  if (!enabled) item['replaceWith'](el);
}
export function createPersonReplacementCompositeMediaResidency({
  projectId: projectId = '',
  releaseMedia: releaseMedia = releaseCompositeMediaElement,
} = {}) {
  let text = normalizeText(projectId),
    result = false;
  const map = new Map(),
    map2 = new Map(),
    map3 = new WeakSet(),
    map4 = new WeakSet(),
    handler = (enabled2) => {
      if (!enabled2) return false;
      const data = enabled2['controller'];
      if (data && typeof data === 'object' && !map3['has'](data)) {
        map3['add'](data);
        try {
          data['destroy']?.();
        } catch {}
      }
      const options = enabled2['videoEl'];
      if (options && typeof options === 'object' && !map4['has'](options)) {
        map4['add'](options);
        try {
          releaseMedia(enabled2);
        } catch {}
      }
      return true;
    },
    evict = (target) => {
      const text2 = normalizeText(target),
        enabled3 = map['get'](text2);
      if (!enabled3) return false;
      return (map['delete'](text2), handler(enabled3));
    };
  return Object['freeze']({
    retain(args = {}) {
      if (result) return false;
      const role2 = normalizeText(args['role']),
        sourceUrl2 = normalizeText(args['sourceUrl']),
        projectId2 = normalizeText(args['projectId']) || text;
      if (
        !role2 ||
        !sourceUrl2 ||
        !args['videoEl'] ||
        (!args['controller'] && args['preserveVisibleElement'] !== true) ||
        projectId2 !== text
      )
        return false;
      const source = map['get'](role2);
      if (
        source &&
        source['projectId'] === projectId2 &&
        source['sourceUrl'] === sourceUrl2 &&
        source['videoEl'] === args['videoEl'] &&
        source['controller'] === args['controller']
      )
        return true;
      if (source) evict(role2);
      return (
        map['set'](role2, {
          ...args,
          projectId: projectId2,
          role: role2,
          sourceUrl: sourceUrl2,
        }),
        true
      );
    },
    has(next) {
      return map['has'](normalizeText(next));
    },
    peek(current) {
      return map['get'](normalizeText(current)) || null;
    },
    forget(entry) {
      const text3 = normalizeText(entry);
      if (!map['has'](text3)) return false;
      return (map['delete'](text3), true);
    },
    handoff(record, { videoEl: videoEl = null, controller: controller = null } = {}) {
      if (result || !videoEl || !controller) return false;
      const text4 = normalizeText(record),
        args2 = map['get'](text4);
      if (!args2 || args2['videoEl'] !== videoEl) return false;
      return (map['set'](text4, { ...args2, videoEl: videoEl, controller: controller }), true);
    },
    nextSequence(payload) {
      const text5 = normalizeText(payload),
        handle = (map2['get'](text5) || 0) + 1;
      return (map2['set'](text5, handle), handle);
    },
    adopt({
      projectId: projectId3 = '',
      role: role3 = '',
      sourceUrl: sourceUrl3 = '',
      renderedVideo: renderedVideo = null,
      adoptMedia: adoptMedia = null,
    } = {}) {
      if (result || !renderedVideo) return null;
      const text6 = normalizeText(projectId3),
        text7 = normalizeText(role3),
        text8 = normalizeText(sourceUrl3);
      if (!text6 || text6 !== text || !text7 || !text8) return null;
      const enabled4 = map['get'](text7);
      if (!enabled4 || enabled4['projectId'] !== text6 || enabled4['sourceUrl'] !== text8) return null;
      try {
        const run = typeof adoptMedia === 'function' ? adoptMedia : adoptCompositeMediaElement;
        run(enabled4['videoEl'], renderedVideo, enabled4);
      } catch {
        return null;
      }
      return (map['delete'](text7), enabled4);
    },
    evict: evict,
    switchProject(state = '') {
      if (result) return false;
      const text9 = normalizeText(state);
      if (!text9 || text9 === text) return false;
      return (Array['from'](map['keys']())['forEach'](evict), (text = text9), true);
    },
    dispose() {
      if (result) return;
      ((result = true), Array['from'](map['keys']())['forEach'](evict), (text = ''));
    },
  });
}
