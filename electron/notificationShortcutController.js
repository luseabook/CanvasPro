import { normalizeContextMenuAccelerator } from './contextMenuShortcutAccelerators.js';

export function createNotificationShortcutController({
  globalShortcutApi: globalShortcutApi,
  activate: activate,
} = {}) {
  let registeredAccelerator = '';
  return {
    updateGlobalShortcut({ keys: keys = ['Alt', 'E'] } = {}) {
      const accelerator = normalizeContextMenuAccelerator(keys);
      if (!Array.isArray(keys) || (keys.length && !accelerator))
        return { success: false, reason: 'invalid-shortcut' };
      if (registeredAccelerator && accelerator === registeredAccelerator)
        return { success: true, accelerator: accelerator };
      if (registeredAccelerator) globalShortcutApi?.unregister(registeredAccelerator);
      registeredAccelerator = '';
      if (!accelerator) return { success: true, accelerator: '' };
      try {
        if (!globalShortcutApi?.register(accelerator, activate))
          return { success: false, accelerator: accelerator, reason: 'shortcut-unavailable' };
        registeredAccelerator = accelerator;
        return { success: true, accelerator: accelerator };
      } catch {
        return { success: false, accelerator: accelerator, reason: 'shortcut-unavailable' };
      }
    },
    dispose() {
      if (registeredAccelerator) globalShortcutApi?.unregister(registeredAccelerator);
      registeredAccelerator = '';
    },
  };
}
