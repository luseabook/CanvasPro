export function renderVideoFooterShell(_0x1d7d29, _0x3c376a, _0x13de9f = {}) {
  if (!_0x1d7d29 || !_0x3c376a) return;
  const {
      DEBUG_WRENCH_ICON_HTML: _0x5856c6,
      getDefaultVideoModelId: _0x43f602,
      getDisplayModelName: _0x519bc1,
      getVideoCancelTooltip: _0x8811bf,
      getVideoGenerateTitle: _0x52f816,
      renderNodeModelTrigger: _0x117ff7,
      videoPanelText: _0x9d557e,
    } = _0x13de9f,
    _0x46bd13 = String(_0x1d7d29['_data']?.['model'] || '')['trim']() || _0x43f602(),
    _0x24635f = _0x1d7d29['_isRunninghubWorkflowModel'](_0x46bd13, _0x1d7d29['_data']?.['provider']);
  (_0x1d7d29['_uiSchemaCleanup']?.(),
    (_0x1d7d29['_uiSchemaCleanup'] = null),
    _0x1d7d29['_footerControllerCleanup']?.(),
    (_0x1d7d29['_footerControllerCleanup'] = null),
    (_0x1d7d29['rhVramAdvPanelEl'] = null),
    (_0x3c376a['dataset']['deferredDetailsShell'] = '1'),
    (_0x3c376a['innerHTML'] =
      '\n        <div class="img-model-pills">\n          <div class="img-model-wrap">\n            ' +
      _0x117ff7({
        iconHtml: _0x1d7d29['_getModelIconHTML'](_0x46bd13, _0x1d7d29['_data']?.['provider']),
        label: _0x519bc1(_0x46bd13),
      }) +
      '\n            <div class="floating-menu img-model-menu node-model-menu" data-node-menu-kind="video" data-lazy-model-menu="video"></div>\n          </div>\n        </div>\n        <div class="prompt-actions">\n          <button type="button" class="prompt-submit debug-wrench-btn" title="' +
      _0x9d557e('debugApiParams') +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      _0x5856c6 +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22prompt-submit\x20img-gen-btn\x22\x20' +
      (_0x24635f ? 'data-tooltip=\x22' + _0x8811bf() + '\x22' : 'title=\x22' + _0x52f816() + '\x22') +
      '>\n            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n          </button>\n        </div>'),
    (_0x1d7d29['btnEl'] = _0x3c376a['querySelector']('.img-gen-btn')));
}
