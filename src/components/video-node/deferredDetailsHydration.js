export function disposeVideoNodePromptDetails(_0x38aab5) {
  for (const _0x3d6b3b of [
    '_generationNodeHelpTip',
    '_promptPresetTrigger',
    '_promptExpansion',
    '_modelProviderProfileControl',
  ]) {
    (_0x38aab5[_0x3d6b3b]?.['remove'](), (_0x38aab5[_0x3d6b3b] = null));
  }
}
export function initializeVideoNodePromptDetailsOnMount(_0x11307d, { sanitizePromptHtml: _0x5b0d24 } = {}) {
  if (!_0x11307d || _0x11307d['_rendererDetailsDeferred'] === !![]) return ![];
  return (
    _0x11307d['_syncPromptBoxSizeFromData'](_0x11307d['_data']),
    _0x11307d['_setupPromptBoxResize'](),
    _0x11307d['_data']?.['prompt'] &&
      ((_0x11307d['promptEl']['innerHTML'] = _0x5b0d24(_0x11307d['_data']['prompt'])),
      _0x11307d['_initPromptPills']()),
    _0x11307d['_syncPromptInputVisibility'](_0x11307d['_data']),
    _0x11307d['_syncGenerationNodeHelpTip'](),
    _0x11307d['_syncModelProviderProfileControl']?.(),
    _0x11307d['_syncLocaleTexts'](),
    !![]
  );
}
export function hydrateDeferredVideoNodeToolbar(_0x211161, _0x3ca340) {
  const _0x56863e = _0x211161?.['_deferredToolbarEl'];
  if (!_0x56863e) return ![];
  ((_0x211161['_deferredToolbarEl'] = null), _0x211161['_videoToolbarCleanup']?.());
  const _0x52ae96 = _0x3ca340?.(_0x56863e, _0x211161['_data']);
  return ((_0x211161['_videoToolbarCleanup'] = typeof _0x52ae96 === 'function' ? _0x52ae96 : null), !![]);
}
export function hydrateVideoNodeDeferredDetails(_0x2adfab, _0x2d0593 = {}) {
  if (!_0x2adfab || _0x2adfab['_rendererDetailsDeferred'] !== !![]) return;
  const { readStoreState: _0x4f646c, sanitizePromptHtml: _0x2fd70e } = _0x2d0593;
  ((_0x2adfab['_rendererDetailsDeferred'] = ![]),
    (_0x2adfab['_data'] = _0x4f646c()?.['nodes']?.[_0x2adfab['nodeId']] || _0x2adfab['_data']));
  const _0x47856f = _0x2adfab['_data'] || {};
  _0x2adfab['footerEl']?.['dataset'] && delete _0x2adfab['footerEl']['dataset']['thinVideoHydration'];
  _0x2adfab['footerEl'] &&
    ((_0x2adfab['_lastFooterSig'] = ''), _0x2adfab['_renderFooter'](_0x2adfab['footerEl']));
  if (
    _0x2adfab['promptEl'] &&
    document['activeElement'] !== _0x2adfab['promptEl'] &&
    _0x47856f['prompt'] !== undefined
  ) {
    const _0x30ce69 = _0x2fd70e(_0x47856f['prompt'] || '');
    _0x2adfab['promptEl']['innerHTML'] !== _0x30ce69 &&
      ((_0x2adfab['promptEl']['innerHTML'] = _0x30ce69), _0x2adfab['_initPromptPills']());
  }
  (_0x2adfab['_syncPromptInputVisibility'](_0x47856f),
    _0x2adfab['_syncPromptBoxSizeFromData'](_0x47856f),
    _0x2adfab['_setupPromptBoxResize']?.(),
    _0x2adfab['_syncGenerationNodeHelpTip'](),
    _0x2adfab['_syncModelProviderProfileControl']?.(),
    _0x2adfab['_syncLocaleTexts']?.(),
    _0x2adfab['_renderRefBarWhenMediaReady'](),
    _0x2adfab['_updateSubmitButtonState'](),
    _0x2adfab['_syncInitialUpdateSignatures']?.(_0x2adfab['_data'] || _0x47856f),
    _0x2adfab['_hydrateDeferredToolbarEvents']?.(),
    void _0x2adfab['hydrateRendererThinVideoPresentation']?.());
}
export function renderInitialVideoNodeFooter(_0x540f90, _0x4169bf) {
  if (!_0x540f90 || !_0x4169bf) return;
  if (_0x540f90['_rendererThinVideoHydration'] === !![]) {
    ((_0x4169bf['dataset']['thinVideoHydration'] = '1'),
      (_0x4169bf['innerHTML'] = ''),
      (_0x540f90['btnEl'] = null));
    return;
  }
  if (
    _0x540f90['_rendererDetailsDeferred'] === !![] &&
    typeof _0x540f90['_renderFooterShell'] === 'function'
  ) {
    _0x540f90['_renderFooterShell'](_0x4169bf);
    return;
  }
  _0x540f90['_renderFooter'](_0x4169bf);
}
