export const CUSTOM_PROVIDER_TUTORIAL_ID = 'api-guide';
export function createCustomProviderEditorShell({
  documentObject: documentObject,
  editorId: editorId,
  tutorialLabel: tutorialLabel = '',
  discoverLabel: discoverLabel = '',
  deleteAriaLabel: deleteAriaLabel = '',
} = {}) {
  if (!documentObject?.createElement)
    throw new TypeError('createCustomProviderEditorShell requires a document');
  const el = documentObject.createElement('div');
  ((el.className = 'custom-provider-editor-item'), (el.dataset.customProviderEditorId = editorId));
  const value = documentObject.createElement('div');
  value.className = 'custom-provider-editor-item-head';
  const el2 = documentObject.createElement('button');
  ((el2.type = 'button'),
    (el2.className = 'custom-provider-editor-tab'),
    (el2.dataset.customProviderEditorTab = ''),
    el2.setAttribute('aria-selected', 'false'));
  const el3 = documentObject.createElement('span');
  ((el3.className = 'custom-provider-editor-item-title'),
    (el3.dataset.customProviderEditorTitle = ''),
    el2.append(el3));
  const item = documentObject.createElement('div');
  item.className = 'custom-provider-editor-item-actions';
  const el4 = documentObject.createElement('button');
  ((el4.type = 'button'),
    (el4.className = 'settings-provider-guide-btn custom-provider-tutorial-btn'),
    (el4.dataset.customProviderTutorial = ''),
    (el4.dataset.apiTutorialTrigger = CUSTOM_PROVIDER_TUTORIAL_ID),
    (el4.textContent = tutorialLabel));
  const el5 = documentObject.createElement('button');
  ((el5.type = 'button'),
    (el5.className = 'custom-provider-primary-btn custom-provider-discover-btn'),
    (el5.dataset.customProviderDiscover = ''),
    (el5.textContent = discoverLabel));
  const el6 = documentObject.createElement('button');
  return (
    (el6.type = 'button'),
    (el6.className = 'custom-provider-delete-btn canvas-tab-close'),
    (el6.dataset.customProviderDelete = ''),
    el6.setAttribute('aria-label', deleteAriaLabel),
    (el6.textContent = '×'),
    item.append(el4, el5),
    value.append(el2, el6),
    el.append(value, item),
    el
  );
}
