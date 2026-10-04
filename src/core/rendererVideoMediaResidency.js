import {
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';
import { resolveCanvasVideoDisplayUrl } from '../services/canvasMediaLocalService.js';
export function resolveRendererVideoMediaLeaseKey(value, item = null) {
  const key = Array['isArray'](value?.['videos']) ? value['videos'] : [],
    index = Number['isFinite'](Number(value?.['mainVideoIndex']))
      ? Math['max'](0x0, Math['trunc'](Number(value['mainVideoIndex'])))
      : 0x0,
    canvasVideoDisplayUrl =
      resolveCanvasVideoDisplayUrl(key[index] || key[0x0] || {}) || resolveCanvasVideoDisplayUrl(value);
  return [
    String(value?.['type'] || ''),
    index,
    String(canvasVideoDisplayUrl || ''),
    String(item?.['sourceKey'] || ''),
    Number(item?.['sourceEpoch'] || 0x0),
  ]['join']('|');
}
const DEFAULT_MEDIA_RESIDENCY_SUSPEND_DELAY_MS = 0x78,
  DEFAULT_PRESENTED_MEDIA_LEASE_MS = 0x258,
  DEFAULT_MAX_RETAINED_PRESENTED_MEDIA = 0x3;
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
export function createRendererVideoMediaResidencyController({
  getComponent: getComponent,
  getWrapper: getWrapper,
  isMounted: isMounted,
  isMediaDeferred: isMediaDeferred = (result, data) => data?.['_rendererMediaDeferred'] === !![],
  isPlaybackActive: isPlaybackActive,
  isRetentionProtected: isRetentionProtected,
  shouldRetainPresentedMedia: shouldRetainPresentedMedia,
  onSuspend: onSuspend,
  onParkSuspend: onParkSuspend,
  onResume: onResume,
  suspendDelayMs: suspendDelayMs = DEFAULT_MEDIA_RESIDENCY_SUSPEND_DELAY_MS,
  presentedMediaLeaseMs: presentedMediaLeaseMs = DEFAULT_PRESENTED_MEDIA_LEASE_MS,
  maxRetainedPresentedMedia: maxRetainedPresentedMedia = DEFAULT_MAX_RETAINED_PRESENTED_MEDIA,
} = {}) {
  const map = new Map(),
    map2 = new Map(),
    options = Math['max'](0x0, Number(suspendDelayMs) || 0x0),
    count = Math['max'](0x0, Number(presentedMediaLeaseMs) || 0x0),
    count2 = Math['max'](0x0, Math['trunc'](Number(maxRetainedPresentedMedia) || 0x0)),
    isRendererRuntimeDiagnosticsEnabled2 = isRendererRuntimeDiagnosticsEnabled();
  function run(enabled) {
    if (!enabled || enabled['timer'] === null) return;
    (clearTimeout(enabled['timer']), (enabled['timer'] = null));
  }
  function run2(enabled2) {
    if (!enabled2 || enabled2['presentedLeaseTimer'] === null) return;
    (clearTimeout(enabled2['presentedLeaseTimer']), (enabled2['presentedLeaseTimer'] = null));
  }
  function run3(target) {
    (run2(map2['get'](target)), map2['delete'](target));
  }
  function run4(source, next, current) {
    return (
      isPlaybackActive?.(source, next, current) === !![] ||
      isRetentionProtected?.(source, next, current) === !![]
    );
  }
  function run5(nodeId, enabled3) {
    if (!enabled3 || enabled3['timer'] !== null) return;
    enabled3['timer'] = setTimeout(() => {
      enabled3['timer'] = null;
      if (enabled3['withinResidency']) return;
      const enabled4 = enabled3['parked'] === !![];
      if (!enabled4 && !isMounted?.(nodeId)) return;
      const enabled5 = getComponent?.(nodeId),
        entry = getWrapper?.(nodeId);
      if (!enabled5 || isMediaDeferred(nodeId, enabled5)) return;
      if (run4(nodeId, enabled5, entry)) {
        run5(nodeId, enabled3);
        return;
      }
      run3(nodeId);
      if (enabled4) {
        (onParkSuspend?.(nodeId, enabled5, entry), map['delete'](nodeId));
        return;
      }
      const record = isRendererRuntimeDiagnosticsEnabled2 ? nowMs() : 0x0,
        suspended = onSuspend?.(nodeId, enabled5, entry);
      (isRendererRuntimeDiagnosticsEnabled2 &&
        recordRendererRuntimeDiagnostic({
          kind: 'video-media-suspend',
          nodeId: nodeId,
          suspended: suspended !== ![],
          durationMs: nowMs() - record,
        }),
        suspended === ![] && !enabled3['withinResidency'] && isMounted?.(nodeId) && run5(nodeId, enabled3));
    }, options);
  }
  function run6() {
    const enabled6 = map2['keys']()['next']()['value'];
    if (!enabled6) return ![];
    const enabled7 = map['get'](enabled6);
    run3(enabled6);
    if (!enabled7 || enabled7['withinResidency']) return !![];
    return (run5(enabled6, enabled7), !![]);
  }
  function run7() {
    while (map2['size'] > count2) {
      if (!run6()) break;
    }
  }
  function run8(payload, handle) {
    (run(handle),
      run3(payload),
      map2['set'](payload, handle),
      (handle['presentedLeaseTimer'] = setTimeout(() => {
        handle['presentedLeaseTimer'] = null;
        if (map2['get'](payload) !== handle) return;
        map2['delete'](payload);
        if (handle['withinResidency']) return;
        run5(payload, handle);
      }, count)),
      run7());
  }
  function run9(state) {
    let enabled8 = map['get'](state);
    return (
      !enabled8 &&
        ((enabled8 = {
          timer: null,
          presentedLeaseTimer: null,
          withinResidency: ![],
          initialized: ![],
          parked: ![],
          leaseKey: '',
        }),
        map['set'](state, enabled8)),
      enabled8
    );
  }
  function sync(nodeId2, { withinResidency: withinResidency = ![], leaseKey: leaseKey = '' } = {}) {
    if (!nodeId2) return;
    const config = run9(nodeId2),
      scope = String(leaseKey || ''),
      input = config['initialized'] === !![] && config['leaseKey'] !== scope;
    input && (run3(nodeId2), run(config));
    const output = config['withinResidency'],
      enabled9 = config['initialized'];
    ((config['initialized'] = !![]),
      (config['parked'] = ![]),
      (config['leaseKey'] = scope),
      (config['withinResidency'] = withinResidency === !![]));
    if (config['withinResidency']) {
      (run3(nodeId2), run(config));
      const value2 = getComponent?.(nodeId2);
      if (isMounted?.(nodeId2) && isMediaDeferred(nodeId2, value2)) {
        const value3 = isRendererRuntimeDiagnosticsEnabled2 ? nowMs() : 0x0,
          resumed = onResume?.(nodeId2, value2, getWrapper?.(nodeId2));
        isRendererRuntimeDiagnosticsEnabled2 &&
          recordRendererRuntimeDiagnostic({
            kind: 'video-media-resume',
            nodeId: nodeId2,
            resumed: resumed !== ![],
            durationMs: nowMs() - value3,
          });
      }
      return;
    }
    if (!isMounted?.(nodeId2)) {
      run(config);
      return;
    }
    if (
      count2 > 0x0 &&
      count > 0x0 &&
      (input || !enabled9 || output) &&
      shouldRetainPresentedMedia?.(nodeId2, getComponent?.(nodeId2), getWrapper?.(nodeId2)) === !![]
    ) {
      run8(nodeId2, config);
      return;
    }
    if (map2['has'](nodeId2)) return;
    run5(nodeId2, config);
  }
  function park(
    enabled10,
    { retainPresentedMedia: retainPresentedMedia = ![], leaseKey: leaseKey = '' } = {},
  ) {
    if (!enabled10) return;
    const value4 = run9(enabled10);
    (run(value4),
      run3(enabled10),
      (value4['initialized'] = !![]),
      (value4['withinResidency'] = ![]),
      (value4['parked'] = !![]),
      (value4['leaseKey'] = String(leaseKey || '')));
    const value5 = getComponent?.(enabled10),
      value6 = getWrapper?.(enabled10);
    if (retainPresentedMedia === !![] && count2 > 0x0 && count > 0x0 && !run4(enabled10, value5, value6)) {
      run8(enabled10, value4);
      return;
    }
    if (run4(enabled10, value5, value6)) {
      run5(enabled10, value4);
      return;
    }
    (onParkSuspend?.(enabled10, value5, value6), map['delete'](enabled10));
  }
  function unpark(value7) {
    const enabled11 = map['get'](value7);
    if (!enabled11 || enabled11['parked'] !== !![]) return;
    (run(enabled11), run3(value7), (enabled11['parked'] = ![]));
  }
  function isHydrationAllowed(value8) {
    const enabled12 = map['get'](value8);
    if (!enabled12 || enabled12['withinResidency']) return !![];
    const value9 = getComponent?.(value8),
      value10 = getWrapper?.(value8);
    return run4(value8, value9, value10);
  }
  function forget(value11) {
    const value12 = map['get'](value11);
    (run(value12), run3(value11), map['delete'](value11));
  }
  function clear() {
    for (const value13 of map['values']()) {
      (run(value13), run2(value13));
    }
    (map2['clear'](), map['clear']());
  }
  function getRetainedPresentedMediaCount() {
    return map2['size'];
  }
  return Object['freeze']({
    clear: clear,
    forget: forget,
    getRetainedPresentedMediaCount: getRetainedPresentedMediaCount,
    isHydrationAllowed: isHydrationAllowed,
    park: park,
    sync: sync,
    unpark: unpark,
  });
}
export const __rendererVideoMediaResidencyForTest = Object['freeze']({
  DEFAULT_MEDIA_RESIDENCY_SUSPEND_DELAY_MS: DEFAULT_MEDIA_RESIDENCY_SUSPEND_DELAY_MS,
  DEFAULT_PRESENTED_MEDIA_LEASE_MS: DEFAULT_PRESENTED_MEDIA_LEASE_MS,
  DEFAULT_MAX_RETAINED_PRESENTED_MEDIA: DEFAULT_MAX_RETAINED_PRESENTED_MEDIA,
});
