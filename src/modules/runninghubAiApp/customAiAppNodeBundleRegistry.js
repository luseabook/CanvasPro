import {
  registerManifestBundle,
  resolveModelExecution,
  unregisterManifestBundle,
} from '../../manifests/index.js';
export function getCustomAiAppBundleModelId(_0x1ff068) {
  return String(_0x1ff068?.['models']?.[0x0]?.['modelId'] || '')['trim']();
}
export function getCustomAiAppBundleKey(_0x3a87a3) {
  return String(_0x3a87a3?.['sourceId'] || getCustomAiAppBundleModelId(_0x3a87a3))['trim']();
}
function canReuseRegisteredBundle(_0x2be481) {
  const _0x307095 = getCustomAiAppBundleModelId(_0x2be481);
  if (!_0x307095) return ![];
  return Boolean(resolveModelExecution(_0x307095));
}
export function registerCustomAiAppBundle(_0x1c262f, _0x5da91f, { replace: replace = ![] } = {}) {
  const _0x1ed4ed = getCustomAiAppBundleKey(_0x1c262f);
  if (!_0x1ed4ed) return !![];
  if (!replace && _0x5da91f['has'](_0x1ed4ed)) return !![];
  if (replace) unregisterCustomAiAppBundle(_0x1c262f, _0x5da91f);
  try {
    return (registerManifestBundle(_0x1c262f), _0x5da91f['add'](_0x1ed4ed), !![]);
  } catch (_0x455174) {
    if (
      String(_0x455174?.['message'] || '')['includes']('duplicate key') &&
      !replace &&
      canReuseRegisteredBundle(_0x1c262f)
    )
      return (_0x5da91f['add'](_0x1ed4ed), !![]);
    throw _0x455174;
  }
}
export function unregisterCustomAiAppBundle(_0x25ea98, _0x4bda12) {
  const _0x37742d = getCustomAiAppBundleKey(_0x25ea98);
  if (!_0x37742d) return !![];
  try {
    return (unregisterManifestBundle(_0x25ea98), _0x4bda12['delete'](_0x37742d), !![]);
  } catch (_0x1b44bb) {
    return (console['warn']('[Custom AI App] unregister manifest failed:', _0x1b44bb), ![]);
  }
}
export function projectCustomAiAppBundleForNodeRuntime(_0x25d028) {
  const _0x244ff1 = Array['isArray'](_0x25d028?.['models']) ? _0x25d028['models'] : [];
  let _0x10de12 = ![];
  const _0x3b7cc3 = _0x244ff1['map']((_0x8aed33) => {
    const _0x4f9b20 = _0x8aed33?.['extensions'];
    if (!_0x4f9b20 || typeof _0x4f9b20 !== 'object') return _0x8aed33;
    let _0x158659 = _0x4f9b20;
    return (
      ['rhAiApp', 'comfyUiWorkflow']['forEach']((_0x1edabd) => {
        const _0x1dec37 = _0x4f9b20[_0x1edabd];
        if (!_0x1dec37 || typeof _0x1dec37 !== 'object') return;
        if (_0x158659 === _0x4f9b20) _0x158659 = { ..._0x4f9b20 };
        ((_0x158659[_0x1edabd] = { ..._0x1dec37, appKey: '', isSavedApp: ![] }), (_0x10de12 = !![]));
      }),
      _0x158659 === _0x4f9b20 ? _0x8aed33 : { ..._0x8aed33, extensions: _0x158659 }
    );
  });
  return _0x10de12 ? { ..._0x25d028, models: _0x3b7cc3 } : _0x25d028;
}
export function createCustomAiAppNodeBundleRegistry({
  registerBundle: _0x109454,
  unregisterBundle: _0x1d4da0,
  isBundleRegistered: isBundleRegistered = () => ![],
  onWarning: onWarning = (..._0x124ba6) => console['warn'](..._0x124ba6),
} = {}) {
  const _0x87296b = new Map();
  return Object['freeze']({
    reconcile({ bundles: bundles = [], savedBundleKeys: savedBundleKeys = [] } = {}) {
      const _0x49af5c = new Set(
          Array['from'](savedBundleKeys || [])
            ['map']((_0xfb45ec) => String(_0xfb45ec || '')['trim']())
            ['filter'](Boolean),
        ),
        _0x490c49 = new Map();
      return (
        (Array['isArray'](bundles) ? bundles : [])['forEach']((_0x230555) => {
          const _0x32b847 = getCustomAiAppBundleKey(_0x230555);
          if (!_0x32b847 || !_0x230555?.['models'] || !_0x230555?.['executions']) return;
          if (!_0x490c49['has'](_0x32b847)) _0x490c49['set'](_0x32b847, _0x230555);
        }),
        _0x87296b['forEach']((_0xad167c, _0x27bc5c) => {
          if (_0x49af5c['has'](_0x27bc5c)) {
            _0x87296b['delete'](_0x27bc5c);
            return;
          }
          if (_0x490c49['has'](_0x27bc5c)) return;
          try {
            const _0x4c464e = _0x1d4da0?.(_0xad167c);
            if (_0x4c464e === ![]) return;
          } catch (_0x2bfa67) {
            onWarning('[Custom AI App] unregister stale node manifest failed:', _0x2bfa67);
            return;
          }
          _0x87296b['delete'](_0x27bc5c);
        }),
        _0x490c49['forEach']((_0x54853a, _0x39d986) => {
          if (_0x49af5c['has'](_0x39d986)) return;
          const _0x344583 = _0x87296b['get'](_0x39d986);
          if (_0x344583 && isBundleRegistered(_0x39d986)) return;
          const _0x359029 = projectCustomAiAppBundleForNodeRuntime(_0x54853a);
          try {
            (_0x109454?.(_0x359029, { replace: !_0x344583 && isBundleRegistered(_0x39d986) }),
              _0x87296b['set'](_0x39d986, _0x359029));
          } catch (_0x1de98c) {
            onWarning('[Custom AI App] register node manifest failed:', _0x1de98c);
          }
        }),
        {
          liveBundleKeys: Array['from'](_0x490c49['keys']()),
          trackedBundleKeys: Array['from'](_0x87296b['keys']()),
        }
      );
    },
  });
}
