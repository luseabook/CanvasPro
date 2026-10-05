import { getImage } from './storage.js';
import { firstNonEmpty } from '../utils/validators.js';
import { createImageLoadDiagnostics, getImageLoadTiming } from '../services/imageLoadDiagnostics.js';
import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
} from '../services/canvasMediaLocalService.js';
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../services/desktopMediaBlobSource.js';
import {
  acquireLocalVideoPlaybackObjectUrl,
  releaseLocalVideoPlaybackObjectUrlOwner,
} from '../services/localVideoPlaybackObjectUrlService.js';
import {
  claimVideoPlaybackOwnership,
  detachVideoPlaybackRecovery,
} from '../components/video-node/mediaPlaybackRecovery.js';
export async function resolveNodeImageOriginalSource(enabled) {
  if (!enabled) return null;
  const value = Array['isArray'](enabled['images']) ? enabled['images'] : [],
    item = enabled['mainImageIndex'] || 0,
    key = value[item] || null,
    nonEmpty = firstNonEmpty(key?.['sourceId'], enabled['sourceId']);
  if (nonEmpty)
    try {
      const image = await getImage(nonEmpty);
      if (image) return { url: URL['createObjectURL'](image), revokeUrlOnClose: !![] };
    } catch (index) {}
  const url = firstNonEmpty(
    resolveCanvasImageSourceUrl(key),
    resolveCanvasImageSourceUrl(enabled),
  );
  if (url) return { url: url, revokeUrlOnClose: ![] };
  return null;
}
export async function resolveNodeImagePreviewSource(result) {
  const response = await resolveNodeImageOriginalSource(result);
  if (response?.['url']) return response;
  const data = Array['isArray'](result?.['images']) ? result['images'] : [],
    options = result?.['mainImageIndex'] || 0,
    target = data[options] || null,
    url2 = firstNonEmpty(
      resolveCanvasImagePreviewUrl(target),
      resolveCanvasImagePreviewUrl(result),
    );
  if (url2) return { url: url2, revokeUrlOnClose: ![] };
  const url3 = firstNonEmpty(
    resolveCanvasImageThumbUrl(target),
    resolveCanvasImageThumbUrl(result),
  );
  if (url3) return { url: url3, revokeUrlOnClose: ![] };
  return null;
}
function markSidebarSubmenuOwner(el, source) {
  const next = String(source || '')['trim']();
  if (next) el['dataset']['sidebarSubmenuOwner'] = next;
}
function collectUniquePreviewUrls(list = []) {
  const list2 = [],
    map = new Set();
  for (const current of list) {
    const enabled2 = String(current || '')['trim']();
    if (!enabled2 || map['has'](enabled2)) continue;
    (map['add'](enabled2), list2['push'](enabled2));
  }
  return list2;
}
function resolveImmediateNodeImagePreviewUrls(entry, record = '') {
  const payload = Array['isArray'](entry?.['images']) ? entry['images'] : [],
    handle = Math['max'](0, Number(entry?.['mainImageIndex']) || 0),
    state = payload[handle] || payload[0] || null;
  return collectUniquePreviewUrls([
    record,
    resolveCanvasImageDisplayUrl(state),
    resolveCanvasImageDisplayUrl(entry),
    resolveCanvasImagePreviewUrl(state),
    resolveCanvasImagePreviewUrl(entry),
    resolveCanvasImageThumbUrl(state),
    resolveCanvasImageThumbUrl(entry),
  ]);
}
const IMAGE_PREVIEW_MIN_SCALE = 0.25,
  IMAGE_PREVIEW_MAX_SCALE = 6,
  IMAGE_PREVIEW_WHEEL_INTENSITY = 0.0015;
let activeImagePreviewClose = null,
  activeVideoPreviewClose = null,
  videoPreviewOwnerSequence = 0;
export function closeActiveImagePreview() {
  if (typeof activeImagePreviewClose !== 'function') return ![];
  const run = activeImagePreviewClose;
  return (run(), !![]);
}
export function closeActiveVideoPreview() {
  if (typeof activeVideoPreviewClose !== 'function') return ![];
  const run2 = activeVideoPreviewClose;
  return (run2(), !![]);
}
function clampNumber(config, scope, input) {
  const output = Number(config);
  if (!Number['isFinite'](output)) return scope;
  return Math['min'](input, Math['max'](scope, output));
}
function stopPreviewEvent(event) {
  (event?.['preventDefault']?.(), event?.['stopPropagation']?.());
}
function getOverlayCenterPoint(el2) {
  const x = el2['getBoundingClientRect']?.();
  if (!x)
    return {
      x: (globalThis['window']?.['innerWidth'] || 0) / 2,
      y: (globalThis['window']?.['innerHeight'] || 0) / 2,
    };
  return { x: x['left'] + x['width'] / 2, y: x['top'] + x['height'] / 2 };
}
function isPointerInsideElementBounds(el3, event2) {
  if (!el3 || !event2) return ![];
  const value2 = Number(event2['clientX']),
    value3 = Number(event2['clientY']);
  if (!Number['isFinite'](value2) || !Number['isFinite'](value3))
    return event2['target'] === el3;
  const box = el3['getBoundingClientRect']?.();
  if (!box) return event2['target'] === el3;
  const value4 = Number(box['left']),
    value5 = Number(box['top']),
    value6 = Number['isFinite'](Number(box['right']))
      ? Number(box['right'])
      : value4 + Number(box['width'] || 0),
    value7 = Number['isFinite'](Number(box['bottom']))
      ? Number(box['bottom'])
      : value5 + Number(box['height'] || 0);
  if (
    !Number['isFinite'](value4) ||
    !Number['isFinite'](value5) ||
    !Number['isFinite'](value6) ||
    !Number['isFinite'](value7) ||
    value6 <= value4 ||
    value7 <= value5
  )
    return event2['target'] === el3;
  return value2 >= value4 && value2 <= value6 && value3 >= value5 && value3 <= value7;
}
function applyImagePreviewTransform(el4, el5, box2) {
  (el4['style']['setProperty'](
    '--image-preview-offset-x',
    Math['round'](box2['offsetX'] * 100) / 100 + 'px',
  ),
    el4['style']['setProperty'](
      '--image-preview-offset-y',
      Math['round'](box2['offsetY'] * 100) / 100 + 'px',
    ),
    el5['style']['setProperty'](
      '--image-preview-scale',
      String(Math['round'](box2['scale'] * 1000) / 1000),
    ));
}
export function openImagePreview(enabled3, value8 = {}) {
  const enabled4 = value8['deferredSource'] === !![];
  if (!enabled3 && !enabled4) return () => {};
  (closeActiveVideoPreview(), closeActiveImagePreview());
  let list3 = collectUniquePreviewUrls([
    enabled3,
    ...(Array['isArray'](value8['fallbackUrls']) ? value8['fallbackUrls'] : []),
  ]);
  const value9 = new Set();
  if (value8['revokeUrlOnClose'] && enabled3) value9['add'](enabled3);
  const offsetX = { scale: 1, offsetX: 0, offsetY: 0 };
  let event3 = null,
    enabled5 = ![];
  const el6 = document['createElement']('div');
  ((el6['className'] = 'v2-image-preview-overlay'),
    (el6['style']['zIndex'] = '99999'),
    markSidebarSubmenuOwner(el6, value8['sidebarSubmenuOwner']));
  const el7 = document['createElement']('div');
  el7['className'] = 'v2-image-preview-stage';
  const el8 = document['createElement']('img');
  ((el8['className'] = 'v2-image-preview-media'),
    (el8['alt'] = value8['alt'] || 'Image preview'),
    (el8['draggable'] = ![]));
  let value10 = 0;
  const run3 = (value11) => {
      if (!list3[value11]) return ![];
      return (
        (value10 = value11),
        el6['classList']['add']('is-loading'),
        el6['classList']['remove']('is-error'),
        value8['loadDiagnostics']?.['mark']('source-assigned'),
        (el8['src'] = list3[value10]),
        !![]
      );
    },
    value12 = () => {
      (value8['loadDiagnostics']?.['mark']('image-loaded', getImageLoadTiming(el8)),
        el6['classList']['remove']('is-loading', 'is-error'),
        globalThis['window']?.['requestAnimationFrame']?.(() =>
          globalThis['window']['requestAnimationFrame'](() => {
            if (!enabled5) value8['loadDiagnostics']?.['mark']('paint-opportunity');
          }),
        ));
    },
    value13 = () => {
      value8['loadDiagnostics']?.['mark']('error');
      const value14 = value10 + 1;
      if (value14 < list3['length']) {
        run3(value14);
        return;
      }
      (el6['classList']['remove']('is-loading'), el6['classList']['add']('is-error'));
    };
  (el8['addEventListener']('load', value12), el8['addEventListener']('error', value13));
  if (!run3(0)) el6['classList']['add']('is-loading');
  applyImagePreviewTransform(el7, el8, offsetX);
  const run4 = () => {
      (globalThis['window']?.['removeEventListener']?.('pointermove', run5, !![]),
        globalThis['window']?.['removeEventListener']?.('pointerup', run6, !![]),
        globalThis['window']?.['removeEventListener']?.('pointercancel', run6, !![]));
    },
    handler = () => {
      (run4(), el6['classList']['remove']('is-panning'), (event3 = null));
    },
    handler2 = () => {
      if (enabled5) return;
      ((enabled5 = !![]),
        value8['loadDiagnostics']?.['finish'](),
        document['removeEventListener']('keydown', value15, !![]),
        handler(),
        el8['removeEventListener']('load', value12),
        el8['removeEventListener']('error', value13),
        el6['remove']());
      for (const value16 of value9) {
        try {
          URL['revokeObjectURL'](value16);
        } catch (value17) {}
      }
      if (activeImagePreviewClose === handler2) activeImagePreviewClose = null;
    },
    value15 = (event4) => {
      event4['key'] === 'Escape' &&
        (event4['preventDefault']?.(), event4['stopPropagation']?.(), handler2());
    },
    value18 = (event5) => {
      stopPreviewEvent(event5);
      const value19 = offsetX['scale'],
        value20 = Math['exp'](-Number(event5['deltaY'] || 0) * IMAGE_PREVIEW_WHEEL_INTENSITY),
        clampNumber2 = clampNumber(value19 * value20, IMAGE_PREVIEW_MIN_SCALE, IMAGE_PREVIEW_MAX_SCALE);
      if (clampNumber2 === value19) return;
      const box3 = getOverlayCenterPoint(el6),
        value21 = Number(event5['clientX'] || 0) - box3['x'],
        value22 = Number(event5['clientY'] || 0) - box3['y'],
        value23 = clampNumber2 / value19;
      ((offsetX['offsetX'] = value21 - (value21 - offsetX['offsetX']) * value23),
        (offsetX['offsetY'] = value22 - (value22 - offsetX['offsetY']) * value23),
        (offsetX['scale'] = clampNumber2),
        applyImagePreviewTransform(el7, el8, offsetX));
    },
    value24 = (pointerId) => {
      const count = Number(pointerId?.['button'] ?? 0),
        enabled6 = count === 1;
      if (!enabled6 && count !== 0) return;
      if (!enabled6 && !isPointerInsideElementBounds(el8, pointerId)) return;
      (stopPreviewEvent(pointerId),
        handler(),
        (event3 = {
          pointerId: pointerId['pointerId'],
          startX: Number(pointerId['clientX'] || 0),
          startY: Number(pointerId['clientY'] || 0),
          offsetX: offsetX['offsetX'],
          offsetY: offsetX['offsetY'],
        }),
        el6['classList']['add']('is-panning'),
        el7['setPointerCapture']?.(pointerId['pointerId']),
        globalThis['window']?.['addEventListener']?.('pointermove', run5, !![]),
        globalThis['window']?.['addEventListener']?.('pointerup', run6, !![]),
        globalThis['window']?.['addEventListener']?.('pointercancel', run6, !![]));
    };
  function run5(event6) {
    if (!event3) return;
    if (
      event3['pointerId'] != null &&
      event6['pointerId'] != null &&
      event6['pointerId'] !== event3['pointerId']
    )
      return;
    (stopPreviewEvent(event6),
      (offsetX['offsetX'] =
        event3['offsetX'] + Number(event6['clientX'] || 0) - event3['startX']),
      (offsetX['offsetY'] =
        event3['offsetY'] + Number(event6['clientY'] || 0) - event3['startY']),
      applyImagePreviewTransform(el7, el8, offsetX));
  }
  function run6(event7) {
    if (!event3) return;
    if (
      event3['pointerId'] != null &&
      event7?.['pointerId'] != null &&
      event7['pointerId'] !== event3['pointerId']
    )
      return;
    stopPreviewEvent(event7);
    try {
      el7['releasePointerCapture']?.(event3['pointerId']);
    } catch (value25) {}
    handler();
  }
  return (
    el6['addEventListener']('click', (event8) => {
      if (isPointerInsideElementBounds(el8, event8)) {
        event8['stopPropagation']();
        return;
      }
      handler2();
    }),
    el6['addEventListener']('wheel', value18, { passive: ![] }),
    el6['addEventListener']('pointerdown', value24),
    el6['addEventListener']('auxclick', (event9) => {
      if (event9['button'] === 1) stopPreviewEvent(event9);
    }),
    el8['addEventListener']('dragstart', stopPreviewEvent),
    el7['appendChild'](el8),
    el6['appendChild'](el7),
    document['addEventListener']('keydown', value15, !![]),
    document['body']['appendChild'](el6),
    (activeImagePreviewClose = handler2),
    (handler2['setSources'] = (value26, value27 = {}) => {
      if (enabled5) return ![];
      const list4 = collectUniquePreviewUrls(value26);
      if (list4['length'] === 0)
        return (
          el6['classList']['remove']('is-loading'),
          el6['classList']['add']('is-error'),
          ![]
        );
      return (
        (list3 = list4),
        value27['revokeUrlOnClose'] && list4['forEach']((value28) => value9['add'](value28)),
        run3(0)
      );
    }),
    (handler2['setError'] = () => {
      if (enabled5) return ![];
      return (
        el6['classList']['remove']('is-loading'),
        el6['classList']['add']('is-error'),
        !![]
      );
    }),
    handler2
  );
}
export function openVideoPreview(value29, enabled7 = {}) {
  const enabled8 = String(value29 || '')['trim']();
  if (!enabled8) return () => {};
  (closeActiveImagePreview(), closeActiveVideoPreview());
  const run7 =
      typeof enabled7['acquirePlaybackUrl'] === 'function'
        ? enabled7['acquirePlaybackUrl']
        : acquireLocalVideoPlaybackObjectUrl,
    handler3 =
      typeof enabled7['releasePlaybackUrlOwner'] === 'function'
        ? enabled7['releasePlaybackUrlOwner']
        : releaseLocalVideoPlaybackObjectUrlOwner,
    handler4 =
      typeof enabled7['attachSource'] === 'function'
        ? enabled7['attachSource']
        : attachMediaElementPlaybackSource,
    label = 'video-preview:' + ++videoPreviewOwnerSequence,
    value30 = String(enabled7['playbackUrl'] || '')['trim']();
  let enabled9 = ![],
    value31 = ![],
    value32 = ![],
    value33 = 0,
    value34 = '';
  const el9 = document['createElement']('div');
  el9['className'] = 'v2-image-preview-overlay v2-video-preview-overlay is-loading';
  if (enabled7['overlayDataset'] && typeof enabled7['overlayDataset'] === 'object')
    for (const [enabled10, value35] of Object['entries'](enabled7['overlayDataset'])) {
      if (!enabled10 || value35 == null) continue;
      el9['dataset'][enabled10] = String(value35);
    }
  (markSidebarSubmenuOwner(el9, enabled7['sidebarSubmenuOwner']),
    el9['setAttribute']?.('role', 'dialog'),
    el9['setAttribute']?.('aria-modal', 'true'),
    el9['setAttribute']?.('aria-label', enabled7['ariaLabel'] || 'Video preview'));
  const el10 = document['createElement']('video');
  ((el10['className'] = 'v2-video-preview-media'),
    (el10['controls'] = !![]),
    (el10['autoplay'] = enabled7['autoplay'] !== ![]),
    (el10['loop'] = enabled7['loop'] === !![]),
    (el10['muted'] = !!enabled7['muted']),
    (el10['playsInline'] = !![]),
    (el10['preload'] = 'auto'));
  const run8 = () =>
      String(el10['getAttribute']?.('src') || el10['src'] || el10['currentSrc'] || '')[
        'trim'
      ](),
    handler5 = () => {
      (clearDesktopMediaPlaybackSourceMetadata(el10), el10['removeAttribute']?.('src'));
      try {
        el10['load']?.();
      } catch {}
      value34 = '';
    },
    handler6 = () => {
      if (enabled9) return;
      (el9['classList']['add']('is-loading'), el9['classList']['remove']('is-error'));
    },
    handler7 = () => {
      if (enabled9) return;
      el9['classList']['remove']('is-loading', 'is-error');
    },
    handler8 = () => {
      if (enabled9) return;
      (el9['classList']['remove']('is-loading'), el9['classList']['add']('is-error'));
    },
    handler9 = () => {
      if (enabled9 || enabled7['autoplay'] === ![]) return ![];
      const enabled11 = run8();
      if (!enabled11 || value34 === enabled11) return ![];
      value34 = enabled11;
      if (
        !claimVideoPlaybackOwnership(el10, {
          label: label,
          minBufferAhead: 0.5,
          readyTimeoutMs: 350,
          recoveryDebounceMs: 150,
          recoveryCooldownMs: 500,
          shouldRecover: () => !enabled9 && el10['isConnected'] !== ![] && !el10['paused'],
        })
      )
        return ![];
      try {
        const promise = el10['play']?.();
        promise?.['catch']?.(() => {});
      } catch {}
      return !![];
    };
  let promise2;
  try {
    promise2 = Promise['resolve'](run7(enabled8, label))['then'](
      (value36) => String(value36 || '')['trim'](),
      () => '',
    );
  } catch {
    promise2 = Promise['resolve']('');
  }
  const run9 = async (value37) => {
      if (enabled9) return ![];
      const playbackUrl = String(value37 || enabled8)['trim']();
      if (!playbackUrl) return ![];
      const value38 = ++value33;
      try {
        const value39 = handler4(el10, enabled8, {
          playbackUrl: playbackUrl,
          preload: 'auto',
          load: !![],
          shouldAssign: () => !enabled9 && value38 === value33,
        });
        handler9();
        const value40 = await value39;
        if (enabled9 || value38 !== value33) return ![];
        if (!String(value40 || '')['trim']() && !run8()) return ![];
        return (handler9(), !![]);
      } catch {
        return ![];
      }
    },
    handler10 = async (value41 = '') => {
      if (enabled9) return ![];
      if (value32) return (handler8(), ![]);
      ((value32 = !![]), handler6());
      const value42 = await promise2;
      if (enabled9) return ![];
      const value43 = String(value41 || '')['trim'](),
        value44 = run8(),
        uniquePreviewUrls = collectUniquePreviewUrls([value42, enabled8])['filter'](
          (value45) => value45 !== value43 && value45 !== value44,
        );
      for (const value46 of uniquePreviewUrls) {
        if (run8()) handler5();
        if (await run9(value46)) return !![];
      }
      return (handler8(), ![]);
    },
    value47 = () => handler7(),
    value48 = () => {
      void handler10(run8());
    };
  (el10['addEventListener']('loadeddata', value47),
    el10['addEventListener']('canplay', value47),
    el10['addEventListener']('playing', value47),
    el10['addEventListener']('error', value48));
  const run10 = () => {
      if (value31) return;
      value31 = !![];
      try {
        handler3(label);
      } catch {}
    },
    handler11 = () => {
      if (enabled9) return;
      ((enabled9 = !![]),
        (value33 += 1),
        document['removeEventListener']('keydown', value49, !![]),
        el10['removeEventListener']?.('loadeddata', value47),
        el10['removeEventListener']?.('canplay', value47),
        el10['removeEventListener']?.('playing', value47),
        el10['removeEventListener']?.('error', value48));
      try {
        el10['pause']();
      } catch (value50) {}
      (detachVideoPlaybackRecovery(el10), handler5(), run10(), el9['remove']());
      if (activeVideoPreviewClose === handler11) activeVideoPreviewClose = null;
    },
    value49 = (event10) => {
      event10['key'] === 'Escape' &&
        (event10['preventDefault']?.(), event10['stopPropagation']?.(), handler11());
    };
  return (
    el9['addEventListener']('click', (event11) => {
      if (event11['target'] === el9) handler11();
    }),
    el9['appendChild'](el10),
    document['addEventListener']('keydown', value49, !![]),
    document['body']['appendChild'](el9),
    (activeVideoPreviewClose = handler11),
    value30
      ? void run9(value30)['then']((enabled12) => {
          if (!enabled12) void handler10(value30);
        })
      : void promise2['then']((value51) => {
          if (enabled9) return ![];
          return run9(value51 || enabled8);
        })['then']((value52) => {
          if (!enabled9 && value52 === ![]) void handler10(run8());
        }),
    handler11
  );
}
export async function openNodeImagePreview(value53, args = {}) {
  const loadDiagnostics = createImageLoadDiagnostics('node-image-preview'),
    fallbackUrls = resolveImmediateNodeImagePreviewUrls(value53, args['currentSrc']),
    enabled13 = fallbackUrls['length'] > 0,
    value54 = enabled13
      ? openImagePreview(fallbackUrls[0], {
          ...args,
          loadDiagnostics: loadDiagnostics,
          fallbackUrls: fallbackUrls['slice'](1),
          revokeUrlOnClose: ![],
        })
      : openImagePreview('', {
          ...args,
          loadDiagnostics: loadDiagnostics,
          deferredSource: !![],
          revokeUrlOnClose: ![],
        }),
    handler12 =
      typeof args['sourceResolver'] === 'function'
        ? args['sourceResolver']
        : resolveNodeImagePreviewSource;
  return (
    void Promise['resolve']()
      ['then'](() => {
        return (loadDiagnostics['mark']('resolve-start'), handler12(value53));
      })
      ['then']((revokeUrlOnClose) => {
        loadDiagnostics['mark']('resolve-end', { hasSource: !!revokeUrlOnClose?.['url'] });
        if (!revokeUrlOnClose?.['url']) {
          if (!enabled13) value54['setError']?.();
          return;
        }
        const enabled14 = value54['setSources']?.(
          collectUniquePreviewUrls([revokeUrlOnClose['url'], ...fallbackUrls]),
          { revokeUrlOnClose: revokeUrlOnClose['revokeUrlOnClose'] },
        );
        if (!enabled14 && revokeUrlOnClose['revokeUrlOnClose'])
          try {
            URL['revokeObjectURL'](revokeUrlOnClose['url']);
          } catch (value55) {}
      })
      ['catch'](() => {
        if (!enabled13) value54['setError']?.();
      }),
    value54
  );
}
