export function disposeVideoNodePromptDetails(node) {
  for (const key of [
    '_generationNodeHelpTip',
    '_promptPresetTrigger',
    '_promptExpansion',
    '_modelProviderProfileControl',
  ]) {
    (node[key]?.['remove'](), (node[key] = null));
  }
}
export function initializeVideoNodePromptDetailsOnMount(
  node,
  { sanitizePromptHtml: sanitizePromptHtml } = {},
) {
  if (!node || node['_rendererDetailsDeferred'] === !![]) return ![];
  return (
    node['_syncPromptBoxSizeFromData'](node['_data']),
    node['_setupPromptBoxResize'](),
    node['_data']?.['prompt'] &&
      ((node['promptEl']['innerHTML'] = sanitizePromptHtml(node['_data']['prompt'])),
      node['_initPromptPills']()),
    node['_syncPromptInputVisibility'](node['_data']),
    node['_syncGenerationNodeHelpTip'](),
    node['_syncModelProviderProfileControl']?.(),
    node['_syncLocaleTexts'](),
    !![]
  );
}
export function hydrateDeferredVideoNodeToolbar(node, hydrateToolbar) {
  const toolbarEl = node?.['_deferredToolbarEl'];
  if (!toolbarEl) return ![];
  ((node['_deferredToolbarEl'] = null), node['_videoToolbarCleanup']?.());
  const cleanup = hydrateToolbar?.(toolbarEl, node['_data']);
  return ((node['_videoToolbarCleanup'] = typeof cleanup === 'function' ? cleanup : null), !![]);
}
export function hydrateVideoNodeDeferredDetails(node, helpers = {}) {
  if (!node || node['_rendererDetailsDeferred'] !== !![]) return;
  const { readStoreState: readStoreState, sanitizePromptHtml: sanitizePromptHtml } = helpers;
  ((node['_rendererDetailsDeferred'] = ![]),
    (node['_data'] = readStoreState()?.['nodes']?.[node['nodeId']] || node['_data']));
  const data = node['_data'] || {};
  node['footerEl']?.['dataset'] && delete node['footerEl']['dataset']['thinVideoHydration'];
  node['footerEl'] && ((node['_lastFooterSig'] = ''), node['_renderFooter'](node['footerEl']));
  if (node['promptEl'] && document['activeElement'] !== node['promptEl'] && data['prompt'] !== undefined) {
    const promptHtml = sanitizePromptHtml(data['prompt'] || '');
    node['promptEl']['innerHTML'] !== promptHtml &&
      ((node['promptEl']['innerHTML'] = promptHtml), node['_initPromptPills']());
  }
  (node['_syncPromptInputVisibility'](data),
    node['_syncPromptBoxSizeFromData'](data),
    node['_setupPromptBoxResize']?.(),
    node['_syncGenerationNodeHelpTip'](),
    node['_syncModelProviderProfileControl']?.(),
    node['_syncLocaleTexts']?.(),
    node['_renderRefBarWhenMediaReady'](),
    node['_updateSubmitButtonState'](),
    node['_syncInitialUpdateSignatures']?.(node['_data'] || data),
    node['_hydrateDeferredToolbarEvents']?.(),
    void node['hydrateRendererThinVideoPresentation']?.());
}
export function renderInitialVideoNodeFooter(node, footerEl) {
  if (!node || !footerEl) return;
  if (node['_rendererThinVideoHydration'] === !![]) {
    ((footerEl['dataset']['thinVideoHydration'] = '1'), (footerEl['innerHTML'] = ''), (node['btnEl'] = null));
    return;
  }
  if (node['_rendererDetailsDeferred'] === !![] && typeof node['_renderFooterShell'] === 'function') {
    node['_renderFooterShell'](footerEl);
    return;
  }
  node['_renderFooter'](footerEl);
}
