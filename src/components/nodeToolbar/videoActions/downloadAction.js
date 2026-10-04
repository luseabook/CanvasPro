import { t } from '../../../i18n/index.js';
function toolbarText(value) {
  return t('nodeToolbar.common.' + value);
}
export function bindVideoDownloadAction(item) {
  const {
      toolbarEl: toolbarEl,
      fetchRemoteBlob: fetchRemoteBlob,
      _guessDownloadName: _guessDownloadName,
      _triggerHrefDownload: _triggerHrefDownload,
      _isProbablyLocalUrl: _isProbablyLocalUrl,
      _getCurrentVideoUrl: _getCurrentVideoUrl,
    } = item,
    el = toolbarEl.querySelector('.act-download');
  el &&
    el.addEventListener('click', async (event) => {
      event.stopPropagation();
      const enabled = _getCurrentVideoUrl();
      if (!enabled) {
        alert(toolbarText('noDownloadableVideo'));
        return;
      }
      const key = _guessDownloadName(enabled);
      if (_isProbablyLocalUrl(enabled)) {
        _triggerHrefDownload(enabled, key);
        return;
      }
      try {
        const signal = new AbortController(),
          setTimeout2 = setTimeout(() => signal.abort(), 0x4e20),
          index = await fetchRemoteBlob(enabled, { signal: signal.signal });
        clearTimeout(setTimeout2);
        const result = window.URL.createObjectURL(index);
        (_triggerHrefDownload(result, key), setTimeout(() => window.URL.revokeObjectURL(result), 0x5dc));
      } catch {
        _triggerHrefDownload(enabled, key);
      }
    });
}
