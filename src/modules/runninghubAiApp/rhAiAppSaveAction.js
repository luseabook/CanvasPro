function draftIdentity(_0x21db89) {
  return JSON['stringify']([
    _0x21db89['sourceType'],
    _0x21db89['kind'],
    _0x21db89['savedAppId'],
    _0x21db89['runningHubProfileId'],
    _0x21db89['_getInputText'](),
    _0x21db89['appName'],
    _0x21db89['appDescription'],
    _0x21db89['promptHelpTooltip'],
    _0x21db89['componentDrafts'],
  ]);
}
export async function saveRhAiApp(_0x3b46b5, _0x20cd71 = null) {
  if (_0x3b46b5['savePending']) return null;
  if (_0x20cd71 === null) {
    const _0x4e7e8c = _0x3b46b5['_findSavedApp'](_0x3b46b5['savedAppId']),
      _0x2c1323 = _0x3b46b5['_findSameNameSavedAppForCurrentScope']();
    if (!_0x4e7e8c && _0x2c1323) return (_0x3b46b5['_showOverwriteConfirm'](_0x2c1323['id'], 'save'), null);
    _0x20cd71 = _0x4e7e8c?.['id'] || '';
  }
  const _0x2fb65e = draftIdentity(_0x3b46b5);
  ((_0x3b46b5['savePending'] = !![]), _0x3b46b5['_resetSaveSuccessFeedback']());
  _0x3b46b5['saveBtn'] &&
    ((_0x3b46b5['saveBtn']['disabled'] = !![]),
    (_0x3b46b5['saveBtn']['textContent'] = '保存中…'),
    _0x3b46b5['saveBtn']['setAttribute']('aria-busy', 'true'));
  try {
    const _0x47a595 = await _0x3b46b5['_saveCurrentConfigAsSavedApp']({
      overwriteSavedAppId: _0x20cd71,
      isCurrentDraft: () => draftIdentity(_0x3b46b5) === _0x2fb65e,
    });
    return (
      _0x47a595['isCurrentDraft'] &&
        (_0x3b46b5['_patchSavedConfigSuccessPreview'](_0x47a595['bundle']),
        _0x3b46b5['_resetSaveSuccessFeedback'](),
        _0x3b46b5['_flashSaveSuccessFeedback'](),
        _0x3b46b5['_setError']('')),
      window['showToast']?.('模型“' + _0x47a595['record']['name'] + '”已保存', 'success'),
      _0x47a595['record']
    );
  } catch (_0xcfa8cd) {
    const _0x4975ef = _0xcfa8cd?.['message'] || '模型保存失败，请重试';
    if (draftIdentity(_0x3b46b5) === _0x2fb65e) _0x3b46b5['_setError'](_0x4975ef);
    return (window['showToast']?.(_0x4975ef, 'error'), _0x3b46b5['_resetSaveSuccessFeedback'](), null);
  } finally {
    _0x3b46b5['savePending'] = ![];
    if (_0x3b46b5['saveBtn']) {
      (_0x3b46b5['saveBtn']['removeAttribute']('aria-busy'),
        (_0x3b46b5['saveBtn']['disabled'] = !_0x3b46b5['currentBundle']));
      if (_0x3b46b5['saveBtn']['textContent'] === '保存中…') _0x3b46b5['_resetSaveSuccessFeedback']();
    }
  }
}
