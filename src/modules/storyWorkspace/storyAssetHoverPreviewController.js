function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryAssetHoverPreviewController({
  previewElement: previewElement,
  getState: getState,
  getSelectedAppearance: getSelectedAppearance,
  buildContent: buildContent,
  isStoryAssetHoverLandscape: isStoryAssetHoverLandscape,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof getState !== 'function' ||
    typeof getSelectedAppearance !== 'function' ||
    typeof buildContent !== 'function' ||
    typeof isStoryAssetHoverLandscape !== 'function'
  )
    throw new Error('story asset hover preview requires presentation adapters');
  let item = 0x0,
    key = 0x0,
    index = 0x0,
    el = null,
    result = '',
    data = ![];
  const run = () => {
      item = 0x0;
      if (!previewElement?.['classList']['contains']('is-visible')) return;
      const box = previewElement['getBoundingClientRect'](),
        options = windowObject['innerWidth'] || documentObject['documentElement']?.['clientWidth'] || 0x400,
        target = windowObject['innerHeight'] || documentObject['documentElement']?.['clientHeight'] || 0x300,
        source = 0xe,
        next = 0xa,
        current = Math['max'](next, options - box['width'] - next),
        entry = Math['max'](next, target - box['height'] - next),
        box2 = el?.['getBoundingClientRect']?.();
      let record = Math['min'](Math['max'](next, key + source), current),
        payload = Math['min'](Math['max'](next, index + source), entry);
      if (box2) {
        const handle = box2['right'] + source,
          state = box2['left'] - box['width'] - source;
        if (handle <= current) record = handle;
        else {
          if (state >= next) record = state;
          else {
            const config = box2['bottom'] + source,
              scope = box2['top'] - box['height'] - source;
            record = Math['min'](Math['max'](next, key - box['width'] / 0x2), current);
            if (config <= entry) payload = config;
            else {
              if (scope >= next) payload = scope;
            }
          }
        }
        (record === handle || record === state) &&
          (payload = Math['min'](Math['max'](next, index - 0x12), entry));
      }
      ((previewElement['style']['left'] = Math['round'](record) + 'px'),
        (previewElement['style']['top'] = Math['round'](payload) + 'px'));
    },
    handler = (event) => {
      ((key = Number(event?.['clientX'] || 0x0)), (index = Number(event?.['clientY'] || 0x0)));
      if (item) return;
      if (typeof windowObject['requestAnimationFrame'] === 'function') {
        item = windowObject['requestAnimationFrame'](run);
        return;
      }
      run();
    },
    handler2 = (el2) => {
      if (!el2) return;
      const input = isStoryAssetHoverLandscape(el2['naturalWidth'], el2['naturalHeight']);
      (el2['closest']('.story-asset-hover-preview-item')?.['classList']['toggle']('is-landscape', input),
        el2['closest']('.story-asset-hover-preview-cell')?.['classList']['toggle']('is-landscape', input));
      if (previewElement?.['classList']['contains']('is-visible')) run();
    },
    handler3 = () => {
      previewElement?.['querySelectorAll']('[data-story-asset-hover-image]')['forEach']((el3) => {
        if (el3['complete'] && Number(el3['naturalWidth']) > 0x0) {
          handler2(el3);
          return;
        }
        el3['addEventListener']('load', () => handler2(el3), { once: !![] });
      });
    },
    handler4 = (enabled, appearanceId = '') => {
      if (!previewElement || !enabled || enabled['mediaKind'] === 'audio') return ![];
      const selectedAssetId = getState(),
        selectedAppearanceId = getSelectedAppearance(selectedAssetId, enabled),
        enabled2 = buildContent(enabled, {
          appearanceId: appearanceId,
          selectedAssetId: selectedAssetId['selectedAssetId'],
          selectedAppearanceId: selectedAppearanceId?.['id'],
        });
      if (!enabled2)
        return (
          (previewElement['innerHTML'] = ''),
          (previewElement['dataset']['assetId'] = ''),
          (previewElement['dataset']['signature'] = ''),
          ![]
        );
      const output = [
        normalizeText(appearanceId) + ':' + (selectedAppearanceId?.['id'] || ''),
        (enabled['baseAppearanceId'] || '') + ':' + enabled2['hasVoice'],
        enabled2['appearances']
          ['map']((value2) => (value2?.['id'] || '') + ':' + normalizeText(value2?.['imageUrl']))
          ['join']('|'),
      ]['join'](':');
      if (
        previewElement['dataset']['assetId'] === String(enabled['id']) &&
        previewElement['dataset']['signature'] === output
      )
        return !![];
      return (
        (previewElement['dataset']['assetId'] = String(enabled['id'])),
        (previewElement['dataset']['signature'] = output),
        previewElement['style']['setProperty']('--story-asset-hover-columns', String(enabled2['columns'])),
        (previewElement['innerHTML'] = enabled2['html']),
        handler3(),
        !![]
      );
    },
    hide = () => {
      ((result = ''),
        (el = null),
        previewElement?.['classList']['remove']('is-visible'),
        previewElement?.['setAttribute']('aria-hidden', 'true'));
    };
  return Object['freeze']({
    show(el4, value3, enabled3, value4 = '') {
      if (data || !previewElement || value3?.['pointerType'] === 'touch') return ![];
      if (!enabled3) return (hide(), ![]);
      ((el = el4?.['closest']?.('.at-mention-menu') || null), (result = String(enabled3['id'])));
      if (!handler4(enabled3, value4)) return (hide(), ![]);
      return (
        previewElement['classList']['add']('is-visible'),
        previewElement['setAttribute']('aria-hidden', 'false'),
        handler(value3),
        !![]
      );
    },
    hide: hide,
    getHoveredAssetId: () => result,
    destroy() {
      if (data) return;
      (hide(),
        item &&
          typeof windowObject['cancelAnimationFrame'] === 'function' &&
          windowObject['cancelAnimationFrame'](item),
        (item = 0x0),
        (data = !![]));
    },
  });
}
