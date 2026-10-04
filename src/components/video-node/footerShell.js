export function renderVideoFooterShell(iconHtml, el, value = {}) {
  if (!iconHtml || !el) return;
  const {
      DEBUG_WRENCH_ICON_HTML: DEBUG_WRENCH_ICON_HTML,
      getDefaultVideoModelId: getDefaultVideoModelId,
      getDisplayModelName: getDisplayModelName,
      getVideoCancelTooltip: getVideoCancelTooltip,
      getVideoGenerateTitle: getVideoGenerateTitle,
      renderNodeModelTrigger: renderNodeModelTrigger,
      videoPanelText: videoPanelText,
    } = value,
    item = String(iconHtml['_data']?.['model'] || '')['trim']() || getDefaultVideoModelId(),
    key = iconHtml['_isRunninghubWorkflowModel'](item, iconHtml['_data']?.['provider']);
  (iconHtml['_uiSchemaCleanup']?.(),
    (iconHtml['_uiSchemaCleanup'] = null),
    iconHtml['_footerControllerCleanup']?.(),
    (iconHtml['_footerControllerCleanup'] = null),
    (iconHtml['rhVramAdvPanelEl'] = null),
    (el['dataset']['deferredDetailsShell'] = '1'),
    (el['innerHTML'] =
      '\n        <div class="img-model-pills">\n          <div class="img-model-wrap">\n            ' +
      renderNodeModelTrigger({
        iconHtml: iconHtml['_getModelIconHTML'](item, iconHtml['_data']?.['provider']),
        label: getDisplayModelName(item),
      }) +
      '\n            <div class="floating-menu img-model-menu node-model-menu" data-node-menu-kind="video" data-lazy-model-menu="video"></div>\n          </div>\n        </div>\n        <div class="prompt-actions">\n          <button type="button" class="prompt-submit debug-wrench-btn" title="' +
      videoPanelText('debugApiParams') +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      DEBUG_WRENCH_ICON_HTML +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22prompt-submit\x20img-gen-btn\x22\x20' +
      (key
        ? 'data-tooltip=\x22' + getVideoCancelTooltip() + '\x22'
        : 'title=\x22' + getVideoGenerateTitle() + '\x22') +
      '>\n            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n          </button>\n        </div>'),
    (iconHtml['btnEl'] = el['querySelector']('.img-gen-btn')));
}
