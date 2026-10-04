export const MODEL_MENU_PREFERENCE_STORAGE_KEY = 'aicanvas.modelMenuPreference';
export const MODEL_MENU_PREFERENCE_CHANGED_EVENT = 'aicanvas:model-menu-preference-changed';
export function createModelMenuPreferenceStore({ getWindow: getWindow = () => globalThis['window'] } = {}) {
  let args = Object['freeze']({ version: '', hideUnconfigured: ![] });
  const list = new Set();
  function run(value) {
    ((args = Object['freeze'](value)), list['forEach']((handler) => handler(args)));
    const window = getWindow(),
      handler2 = window?.['CustomEvent'] || globalThis['CustomEvent'];
    return (
      window?.['dispatchEvent'] &&
        handler2 &&
        window['dispatchEvent'](new handler2(MODEL_MENU_PREFERENCE_CHANGED_EVENT)),
      args
    );
  }
  function run2(item) {
    try {
      getWindow()?.['localStorage']?.['setItem'](MODEL_MENU_PREFERENCE_STORAGE_KEY, JSON['stringify'](item));
    } catch {}
    return run(item);
  }
  return {
    getState: () => args,
    initialize(key) {
      const version = String(key || '')
        ['trim']()
        ['replace'](/^[vV]/, '');
      if (!version || version === args['version']) return args;
      let hideUnconfigured;
      try {
        hideUnconfigured = JSON['parse'](
          getWindow()?.['localStorage']?.['getItem'](MODEL_MENU_PREFERENCE_STORAGE_KEY) || 'null',
        );
      } catch {
        hideUnconfigured = null;
      }
      return run2({
        version: version,
        hideUnconfigured:
          hideUnconfigured?.['version'] === version && hideUnconfigured?.['hideUnconfigured'] === !![],
      });
    },
    setHideUnconfigured(index) {
      if (!args['version']) return args;
      const hideUnconfigured2 = index === !![];
      if (hideUnconfigured2 === args['hideUnconfigured']) return args;
      return run2({ ...args, hideUnconfigured: hideUnconfigured2 });
    },
    subscribe(result) {
      return (list['add'](result), () => list['delete'](result));
    },
  };
}
export const modelMenuPreferenceStore = createModelMenuPreferenceStore();
