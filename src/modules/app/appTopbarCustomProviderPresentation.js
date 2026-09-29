export const CUSTOM_PROVIDER_TUTORIAL_ID = 'api-guide';
export function createCustomProviderEditorShell({
  documentObject: _0x3c7d19,
  editorId: _0x36c978,
  tutorialLabel: tutorialLabel = '',
  discoverLabel: discoverLabel = '',
  deleteAriaLabel: deleteAriaLabel = '',
} = {}) {
  if (!_0x3c7d19?.['createElement'])
    throw new TypeError('createCustomProviderEditorShell requires a document');
  const _0x5de0de = _0x3c7d19['createElement']('div');
  ((_0x5de0de['className'] = 'custom-provider-editor-item'),
    (_0x5de0de['dataset']['customProviderEditorId'] = _0x36c978));
  const _0x3bdb12 = _0x3c7d19['createElement']('div');
  _0x3bdb12['className'] = 'custom-provider-editor-item-head';
  const _0x152868 = _0x3c7d19['createElement']('button');
  ((_0x152868['type'] = 'button'),
    (_0x152868['className'] = 'custom-provider-editor-tab'),
    (_0x152868['dataset']['customProviderEditorTab'] = ''),
    _0x152868['setAttribute']('aria-selected', 'false'));
  const _0x5ec861 = _0x3c7d19['createElement']('span');
  ((_0x5ec861['className'] = 'custom-provider-editor-item-title'),
    (_0x5ec861['dataset']['customProviderEditorTitle'] = ''),
    _0x152868['append'](_0x5ec861));
  const _0x24f80a = _0x3c7d19['createElement']('div');
  _0x24f80a['className'] = 'custom-provider-editor-item-actions';
  const _0x45bcf5 = _0x3c7d19['createElement']('button');
  ((_0x45bcf5['type'] = 'button'),
    (_0x45bcf5['className'] = 'settings-provider-guide-btn custom-provider-tutorial-btn'),
    (_0x45bcf5['dataset']['customProviderTutorial'] = ''),
    (_0x45bcf5['dataset']['apiTutorialTrigger'] = CUSTOM_PROVIDER_TUTORIAL_ID),
    (_0x45bcf5['textContent'] = tutorialLabel));
  const _0xe11a3a = _0x3c7d19['createElement']('button');
  ((_0xe11a3a['type'] = 'button'),
    (_0xe11a3a['className'] = 'custom-provider-primary-btn custom-provider-discover-btn'),
    (_0xe11a3a['dataset']['customProviderDiscover'] = ''),
    (_0xe11a3a['textContent'] = discoverLabel));
  const _0x4de80c = _0x3c7d19['createElement']('button');
  return (
    (_0x4de80c['type'] = 'button'),
    (_0x4de80c['className'] = 'custom-provider-delete-btn canvas-tab-close'),
    (_0x4de80c['dataset']['customProviderDelete'] = ''),
    _0x4de80c['setAttribute']('aria-label', deleteAriaLabel),
    (_0x4de80c['textContent'] = '×'),
    _0x24f80a['append'](_0x45bcf5, _0xe11a3a),
    _0x3bdb12['append'](_0x152868, _0x4de80c),
    _0x5de0de['append'](_0x3bdb12, _0x24f80a),
    _0x5de0de
  );
}
