export function createWorkspacePresentationLifecycle({
  getRoot: getRoot,
  getContentKey: getContentKey = null,
  initiallyActive: initiallyActive = false,
} = {}) {
  let enabled = initiallyActive,
    enabled2 = false,
    el = null,
    value = null,
    enabled3 = true;
  const map = new Set(),
    handler = (item) => {
      if (!['VIDEO', 'AUDIO']['includes'](item?.['tagName'])) return;
      try {
        item['pause']();
      } catch {}
    },
    key = (event) => {
      if (!enabled) handler(event['target']);
    },
    handler2 = () => {
      const el2 = getRoot?.() || null;
      return (
        el2 !== el &&
          (el?.['removeEventListener']?.('play', key, true),
          (el = el2),
          el2?.['addEventListener']?.('play', key, true)),
        el2
      );
    },
    handler3 = () => {
      try {
        return getContentKey?.() ?? null;
      } catch {
        return null;
      }
    };
  return {
    isActive: () => enabled && !enabled2,
    invalidate: () => {
      enabled3 = true;
    },
    activate() {
      if (enabled2) return false;
      const index = handler3(),
        result = enabled3 || index === null || index !== value;
      ((enabled = true), (enabled3 = false));
      const el3 = handler2();
      el3 && ((el3['hidden'] = false), el3['setAttribute']?.('aria-hidden', 'false'));
      for (const data of map) {
        if (data['effect']?.['target']?.['isConnected'] && data['playState'] === 'paused')
          try {
            data['play']();
          } catch {}
      }
      return (map['clear'](), result);
    },
    deactivate() {
      if (enabled2) return;
      if (enabled) value = handler3();
      enabled = false;
      const el4 = handler2();
      el4?.['querySelectorAll']?.('video, audio')['forEach'](handler);
      for (const options of el4?.['getAnimations']?.({ subtree: true }) || []) {
        if (options['playState'] !== 'running') continue;
        try {
          (options['pause'](), map['add'](options));
        } catch {}
      }
      el4 && ((el4['hidden'] = true), el4['setAttribute']?.('aria-hidden', 'true'));
    },
    dispose() {
      (this['deactivate'](),
        (enabled2 = true),
        el?.['removeEventListener']?.('play', key, true),
        (el = null),
        (value = null),
        map['clear']());
    },
  };
}
