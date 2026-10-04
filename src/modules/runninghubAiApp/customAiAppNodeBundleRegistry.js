import {
  registerManifestBundle,
  resolveModelExecution,
  unregisterManifestBundle,
} from '../../manifests/index.js';
export function getCustomAiAppBundleModelId(value) {
  return String(value?.['models']?.[0x0]?.['modelId'] || '')['trim']();
}
export function getCustomAiAppBundleKey(item) {
  return String(item?.['sourceId'] || getCustomAiAppBundleModelId(item))['trim']();
}
function canReuseRegisteredBundle(key) {
  const customAiAppBundleModelId = getCustomAiAppBundleModelId(key);
  if (!customAiAppBundleModelId) return ![];
  return Boolean(resolveModelExecution(customAiAppBundleModelId));
}
export function registerCustomAiAppBundle(index, map, { replace: replace = ![] } = {}) {
  const customAiAppBundleKey = getCustomAiAppBundleKey(index);
  if (!customAiAppBundleKey) return !![];
  if (!replace && map['has'](customAiAppBundleKey)) return !![];
  if (replace) unregisterCustomAiAppBundle(index, map);
  try {
    return (registerManifestBundle(index), map['add'](customAiAppBundleKey), !![]);
  } catch (error) {
    if (
      String(error?.['message'] || '')['includes']('duplicate key') &&
      !replace &&
      canReuseRegisteredBundle(index)
    )
      return (map['add'](customAiAppBundleKey), !![]);
    throw error;
  }
}
export function unregisterCustomAiAppBundle(result, map2) {
  const customAiAppBundleKey2 = getCustomAiAppBundleKey(result);
  if (!customAiAppBundleKey2) return !![];
  try {
    return (unregisterManifestBundle(result), map2['delete'](customAiAppBundleKey2), !![]);
  } catch (data) {
    return (console['warn']('[Custom AI App] unregister manifest failed:', data), ![]);
  }
}
export function projectCustomAiAppBundleForNodeRuntime(args) {
  const list = Array['isArray'](args?.['models']) ? args['models'] : [];
  let options = ![];
  const models = list['map']((args2) => {
    const args3 = args2?.['extensions'];
    if (!args3 || typeof args3 !== 'object') return args2;
    let extensions = args3;
    return (
      ['rhAiApp', 'comfyUiWorkflow']['forEach']((target) => {
        const args4 = args3[target];
        if (!args4 || typeof args4 !== 'object') return;
        if (extensions === args3) extensions = { ...args3 };
        ((extensions[target] = { ...args4, appKey: '', isSavedApp: ![] }), (options = !![]));
      }),
      extensions === args3 ? args2 : { ...args2, extensions: extensions }
    );
  });
  return options ? { ...args, models: models } : args;
}
export function createCustomAiAppNodeBundleRegistry({
  registerBundle: registerBundle,
  unregisterBundle: unregisterBundle,
  isBundleRegistered: isBundleRegistered = () => ![],
  onWarning: onWarning = (...args5) => console['warn'](...args5),
} = {}) {
  const map3 = new Map();
  return Object['freeze']({
    reconcile({ bundles: bundles = [], savedBundleKeys: savedBundleKeys = [] } = {}) {
      const map4 = new Set(
          Array['from'](savedBundleKeys || [])
            ['map']((source) => String(source || '')['trim']())
            ['filter'](Boolean),
        ),
        map5 = new Map();
      return (
        (Array['isArray'](bundles) ? bundles : [])['forEach']((enabled) => {
          const customAiAppBundleKey3 = getCustomAiAppBundleKey(enabled);
          if (!customAiAppBundleKey3 || !enabled?.['models'] || !enabled?.['executions']) return;
          if (!map5['has'](customAiAppBundleKey3)) map5['set'](customAiAppBundleKey3, enabled);
        }),
        map3['forEach']((next, current) => {
          if (map4['has'](current)) {
            map3['delete'](current);
            return;
          }
          if (map5['has'](current)) return;
          try {
            const entry = unregisterBundle?.(next);
            if (entry === ![]) return;
          } catch (record) {
            onWarning('[Custom AI App] unregister stale node manifest failed:', record);
            return;
          }
          map3['delete'](current);
        }),
        map5['forEach']((payload, handle) => {
          if (map4['has'](handle)) return;
          const enabled2 = map3['get'](handle);
          if (enabled2 && isBundleRegistered(handle)) return;
          const projectCustomAiAppBundleForNodeRuntime2 = projectCustomAiAppBundleForNodeRuntime(payload);
          try {
            (registerBundle?.(projectCustomAiAppBundleForNodeRuntime2, {
              replace: !enabled2 && isBundleRegistered(handle),
            }),
              map3['set'](handle, projectCustomAiAppBundleForNodeRuntime2));
          } catch (state) {
            onWarning('[Custom AI App] register node manifest failed:', state);
          }
        }),
        {
          liveBundleKeys: Array['from'](map5['keys']()),
          trackedBundleKeys: Array['from'](map3['keys']()),
        }
      );
    },
  });
}
