import {
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';
import { resolveCanvasVideoDisplayUrl } from '../services/canvasMediaLocalService.js';
export function resolveRendererVideoMediaLeaseKey(_0x257054, _0x2804be = null) {
  const _0x30d670 = Array['isArray'](_0x257054?.['videos']) ? _0x257054['videos'] : [],
    _0xee972f = Number['isFinite'](Number(_0x257054?.['mainVideoIndex']))
      ? Math['max'](0x0, Math['trunc'](Number(_0x257054['mainVideoIndex'])))
      : 0x0,
    _0x2a8cb3 =
      resolveCanvasVideoDisplayUrl(_0x30d670[_0xee972f] || _0x30d670[0x0] || {}) ||
      resolveCanvasVideoDisplayUrl(_0x257054);
  return [
    String(_0x257054?.['type'] || ''),
    _0xee972f,
    String(_0x2a8cb3 || ''),
    String(_0x2804be?.['sourceKey'] || ''),
    Number(_0x2804be?.['sourceEpoch'] || 0x0),
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
  getComponent: _0x2a7bf5,
  getWrapper: _0xef71b3,
  isMounted: _0x208d5c,
  isMediaDeferred: isMediaDeferred = (_0x923bf4, _0x33ab39) => _0x33ab39?.['_rendererMediaDeferred'] === !![],
  isPlaybackActive: _0x3253c4,
  isRetentionProtected: _0x276503,
  shouldRetainPresentedMedia: _0x5aa88b,
  onSuspend: _0x4a7df2,
  onParkSuspend: _0x19a653,
  onResume: _0x41abea,
  suspendDelayMs: suspendDelayMs = DEFAULT_MEDIA_RESIDENCY_SUSPEND_DELAY_MS,
  presentedMediaLeaseMs: presentedMediaLeaseMs = DEFAULT_PRESENTED_MEDIA_LEASE_MS,
  maxRetainedPresentedMedia: maxRetainedPresentedMedia = DEFAULT_MAX_RETAINED_PRESENTED_MEDIA,
} = {}) {
  const _0x29d952 = new Map(),
    _0x15f3b0 = new Map(),
    _0x19286f = Math['max'](0x0, Number(suspendDelayMs) || 0x0),
    _0x261450 = Math['max'](0x0, Number(presentedMediaLeaseMs) || 0x0),
    _0x5729ed = Math['max'](0x0, Math['trunc'](Number(maxRetainedPresentedMedia) || 0x0)),
    _0x47f25f = isRendererRuntimeDiagnosticsEnabled();
  function _0x5883a2(_0x50f936) {
    if (!_0x50f936 || _0x50f936['timer'] === null) return;
    (clearTimeout(_0x50f936['timer']), (_0x50f936['timer'] = null));
  }
  function _0x5e62fc(_0xe0c279) {
    if (!_0xe0c279 || _0xe0c279['presentedLeaseTimer'] === null) return;
    (clearTimeout(_0xe0c279['presentedLeaseTimer']), (_0xe0c279['presentedLeaseTimer'] = null));
  }
  function _0x2de6b6(_0x22dd14) {
    (_0x5e62fc(_0x15f3b0['get'](_0x22dd14)), _0x15f3b0['delete'](_0x22dd14));
  }
  function _0x42d04d(_0x18c8cf, _0x258107, _0x37fd7d) {
    return (
      _0x3253c4?.(_0x18c8cf, _0x258107, _0x37fd7d) === !![] ||
      _0x276503?.(_0x18c8cf, _0x258107, _0x37fd7d) === !![]
    );
  }
  function _0x389e3c(_0x41a988, _0x3423dc) {
    if (!_0x3423dc || _0x3423dc['timer'] !== null) return;
    _0x3423dc['timer'] = setTimeout(() => {
      _0x3423dc['timer'] = null;
      if (_0x3423dc['withinResidency']) return;
      const _0x5de543 = _0x3423dc['parked'] === !![];
      if (!_0x5de543 && !_0x208d5c?.(_0x41a988)) return;
      const _0x1111d6 = _0x2a7bf5?.(_0x41a988),
        _0x82664a = _0xef71b3?.(_0x41a988);
      if (!_0x1111d6 || isMediaDeferred(_0x41a988, _0x1111d6)) return;
      if (_0x42d04d(_0x41a988, _0x1111d6, _0x82664a)) {
        _0x389e3c(_0x41a988, _0x3423dc);
        return;
      }
      _0x2de6b6(_0x41a988);
      if (_0x5de543) {
        (_0x19a653?.(_0x41a988, _0x1111d6, _0x82664a), _0x29d952['delete'](_0x41a988));
        return;
      }
      const _0x586643 = _0x47f25f ? nowMs() : 0x0,
        _0x9aa8c4 = _0x4a7df2?.(_0x41a988, _0x1111d6, _0x82664a);
      (_0x47f25f &&
        recordRendererRuntimeDiagnostic({
          kind: 'video-media-suspend',
          nodeId: _0x41a988,
          suspended: _0x9aa8c4 !== ![],
          durationMs: nowMs() - _0x586643,
        }),
        _0x9aa8c4 === ![] &&
          !_0x3423dc['withinResidency'] &&
          _0x208d5c?.(_0x41a988) &&
          _0x389e3c(_0x41a988, _0x3423dc));
    }, _0x19286f);
  }
  function _0x4347f6() {
    const _0x35e926 = _0x15f3b0['keys']()['next']()['value'];
    if (!_0x35e926) return ![];
    const _0x10a1dc = _0x29d952['get'](_0x35e926);
    _0x2de6b6(_0x35e926);
    if (!_0x10a1dc || _0x10a1dc['withinResidency']) return !![];
    return (_0x389e3c(_0x35e926, _0x10a1dc), !![]);
  }
  function _0x454088() {
    while (_0x15f3b0['size'] > _0x5729ed) {
      if (!_0x4347f6()) break;
    }
  }
  function _0x2ecaec(_0x5e134e, _0x56066e) {
    (_0x5883a2(_0x56066e),
      _0x2de6b6(_0x5e134e),
      _0x15f3b0['set'](_0x5e134e, _0x56066e),
      (_0x56066e['presentedLeaseTimer'] = setTimeout(() => {
        _0x56066e['presentedLeaseTimer'] = null;
        if (_0x15f3b0['get'](_0x5e134e) !== _0x56066e) return;
        _0x15f3b0['delete'](_0x5e134e);
        if (_0x56066e['withinResidency']) return;
        _0x389e3c(_0x5e134e, _0x56066e);
      }, _0x261450)),
      _0x454088());
  }
  function _0x71eab8(_0x4c537b) {
    let _0x315e8d = _0x29d952['get'](_0x4c537b);
    return (
      !_0x315e8d &&
        ((_0x315e8d = {
          timer: null,
          presentedLeaseTimer: null,
          withinResidency: ![],
          initialized: ![],
          parked: ![],
          leaseKey: '',
        }),
        _0x29d952['set'](_0x4c537b, _0x315e8d)),
      _0x315e8d
    );
  }
  function _0x191d72(_0x19153e, { withinResidency: withinResidency = ![], leaseKey: leaseKey = '' } = {}) {
    if (!_0x19153e) return;
    const _0xc6f22c = _0x71eab8(_0x19153e),
      _0x4a1996 = String(leaseKey || ''),
      _0xa9cbf0 = _0xc6f22c['initialized'] === !![] && _0xc6f22c['leaseKey'] !== _0x4a1996;
    _0xa9cbf0 && (_0x2de6b6(_0x19153e), _0x5883a2(_0xc6f22c));
    const _0x4ca970 = _0xc6f22c['withinResidency'],
      _0x1a75b0 = _0xc6f22c['initialized'];
    ((_0xc6f22c['initialized'] = !![]),
      (_0xc6f22c['parked'] = ![]),
      (_0xc6f22c['leaseKey'] = _0x4a1996),
      (_0xc6f22c['withinResidency'] = withinResidency === !![]));
    if (_0xc6f22c['withinResidency']) {
      (_0x2de6b6(_0x19153e), _0x5883a2(_0xc6f22c));
      const _0xc0a260 = _0x2a7bf5?.(_0x19153e);
      if (_0x208d5c?.(_0x19153e) && isMediaDeferred(_0x19153e, _0xc0a260)) {
        const _0x5a8d70 = _0x47f25f ? nowMs() : 0x0,
          _0x4e2694 = _0x41abea?.(_0x19153e, _0xc0a260, _0xef71b3?.(_0x19153e));
        _0x47f25f &&
          recordRendererRuntimeDiagnostic({
            kind: 'video-media-resume',
            nodeId: _0x19153e,
            resumed: _0x4e2694 !== ![],
            durationMs: nowMs() - _0x5a8d70,
          });
      }
      return;
    }
    if (!_0x208d5c?.(_0x19153e)) {
      _0x5883a2(_0xc6f22c);
      return;
    }
    if (
      _0x5729ed > 0x0 &&
      _0x261450 > 0x0 &&
      (_0xa9cbf0 || !_0x1a75b0 || _0x4ca970) &&
      _0x5aa88b?.(_0x19153e, _0x2a7bf5?.(_0x19153e), _0xef71b3?.(_0x19153e)) === !![]
    ) {
      _0x2ecaec(_0x19153e, _0xc6f22c);
      return;
    }
    if (_0x15f3b0['has'](_0x19153e)) return;
    _0x389e3c(_0x19153e, _0xc6f22c);
  }
  function _0x393da3(
    _0x1e1f3e,
    { retainPresentedMedia: retainPresentedMedia = ![], leaseKey: leaseKey = '' } = {},
  ) {
    if (!_0x1e1f3e) return;
    const _0x57625f = _0x71eab8(_0x1e1f3e);
    (_0x5883a2(_0x57625f),
      _0x2de6b6(_0x1e1f3e),
      (_0x57625f['initialized'] = !![]),
      (_0x57625f['withinResidency'] = ![]),
      (_0x57625f['parked'] = !![]),
      (_0x57625f['leaseKey'] = String(leaseKey || '')));
    const _0x257069 = _0x2a7bf5?.(_0x1e1f3e),
      _0x52f317 = _0xef71b3?.(_0x1e1f3e);
    if (
      retainPresentedMedia === !![] &&
      _0x5729ed > 0x0 &&
      _0x261450 > 0x0 &&
      !_0x42d04d(_0x1e1f3e, _0x257069, _0x52f317)
    ) {
      _0x2ecaec(_0x1e1f3e, _0x57625f);
      return;
    }
    if (_0x42d04d(_0x1e1f3e, _0x257069, _0x52f317)) {
      _0x389e3c(_0x1e1f3e, _0x57625f);
      return;
    }
    (_0x19a653?.(_0x1e1f3e, _0x257069, _0x52f317), _0x29d952['delete'](_0x1e1f3e));
  }
  function _0x1fadfc(_0xff33e7) {
    const _0x47ad80 = _0x29d952['get'](_0xff33e7);
    if (!_0x47ad80 || _0x47ad80['parked'] !== !![]) return;
    (_0x5883a2(_0x47ad80), _0x2de6b6(_0xff33e7), (_0x47ad80['parked'] = ![]));
  }
  function _0x348bbc(_0x7d845b) {
    const _0x3e8c66 = _0x29d952['get'](_0x7d845b);
    if (!_0x3e8c66 || _0x3e8c66['withinResidency']) return !![];
    const _0x446078 = _0x2a7bf5?.(_0x7d845b),
      _0x354110 = _0xef71b3?.(_0x7d845b);
    return _0x42d04d(_0x7d845b, _0x446078, _0x354110);
  }
  function _0x1cbb07(_0x427a9c) {
    const _0x12cf07 = _0x29d952['get'](_0x427a9c);
    (_0x5883a2(_0x12cf07), _0x2de6b6(_0x427a9c), _0x29d952['delete'](_0x427a9c));
  }
  function _0x3b0244() {
    for (const _0x11a7bc of _0x29d952['values']()) {
      (_0x5883a2(_0x11a7bc), _0x5e62fc(_0x11a7bc));
    }
    (_0x15f3b0['clear'](), _0x29d952['clear']());
  }
  function _0x1b97c9() {
    return _0x15f3b0['size'];
  }
  return Object['freeze']({
    clear: _0x3b0244,
    forget: _0x1cbb07,
    getRetainedPresentedMediaCount: _0x1b97c9,
    isHydrationAllowed: _0x348bbc,
    park: _0x393da3,
    sync: _0x191d72,
    unpark: _0x1fadfc,
  });
}
export const __rendererVideoMediaResidencyForTest = Object['freeze']({
  DEFAULT_MEDIA_RESIDENCY_SUSPEND_DELAY_MS: DEFAULT_MEDIA_RESIDENCY_SUSPEND_DELAY_MS,
  DEFAULT_PRESENTED_MEDIA_LEASE_MS: DEFAULT_PRESENTED_MEDIA_LEASE_MS,
  DEFAULT_MAX_RETAINED_PRESENTED_MEDIA: DEFAULT_MAX_RETAINED_PRESENTED_MEDIA,
});
