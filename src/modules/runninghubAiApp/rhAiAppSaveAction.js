function draftIdentity(value) {
  return JSON['stringify']([
    value['sourceType'],
    value['kind'],
    value['savedAppId'],
    value['runningHubProfileId'],
    value['_getInputText'](),
    value['appName'],
    value['appDescription'],
    value['promptHelpTooltip'],
    value['componentDrafts'],
  ]);
}
export async function saveRhAiApp(enabled, overwriteSavedAppId = null) {
  if (enabled['savePending']) return null;
  if (overwriteSavedAppId === null) {
    const enabled2 = enabled['_findSavedApp'](enabled['savedAppId']),
      item = enabled['_findSameNameSavedAppForCurrentScope']();
    if (!enabled2 && item) return (enabled['_showOverwriteConfirm'](item['id'], 'save'), null);
    overwriteSavedAppId = enabled2?.['id'] || '';
  }
  const draftIdentity2 = draftIdentity(enabled);
  ((enabled['savePending'] = !![]), enabled['_resetSaveSuccessFeedback']());
  enabled['saveBtn'] &&
    ((enabled['saveBtn']['disabled'] = !![]),
    (enabled['saveBtn']['textContent'] = '保存中…'),
    enabled['saveBtn']['setAttribute']('aria-busy', 'true'));
  try {
    const key = await enabled['_saveCurrentConfigAsSavedApp']({
      overwriteSavedAppId: overwriteSavedAppId,
      isCurrentDraft: () => draftIdentity(enabled) === draftIdentity2,
    });
    return (
      key['isCurrentDraft'] &&
        (enabled['_patchSavedConfigSuccessPreview'](key['bundle']),
        enabled['_resetSaveSuccessFeedback'](),
        enabled['_flashSaveSuccessFeedback'](),
        enabled['_setError']('')),
      window['showToast']?.('模型“' + key['record']['name'] + '”已保存', 'success'),
      key['record']
    );
  } catch (error) {
    const index = error?.['message'] || '模型保存失败，请重试';
    if (draftIdentity(enabled) === draftIdentity2) enabled['_setError'](index);
    return (window['showToast']?.(index, 'error'), enabled['_resetSaveSuccessFeedback'](), null);
  } finally {
    enabled['savePending'] = ![];
    if (enabled['saveBtn']) {
      (enabled['saveBtn']['removeAttribute']('aria-busy'),
        (enabled['saveBtn']['disabled'] = !enabled['currentBundle']));
      if (enabled['saveBtn']['textContent'] === '保存中…') enabled['_resetSaveSuccessFeedback']();
    }
  }
}
