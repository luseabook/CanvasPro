import { t } from '../../../i18n/index.js';
function toolbarText(value) {
  return t('nodeToolbar.common.' + value);
}
export function bindImageDownloadAction(item) {
  const {
      toolbarEl: toolbarEl,
      getNodeData: getNodeData,
      getImage: getImage,
      localPathToUrl: localPathToUrl,
      fetchRemoteBlob: fetchRemoteBlob,
    } = item,
    el = toolbarEl.querySelector('.act-download');
  el &&
    el.addEventListener('click', async (event) => {
      event.stopPropagation();
      const enabled = getNodeData();
      if (!enabled) {
        alert(toolbarText('nodeMissing'));
        return;
      }
      const run = (key) =>
          String(key || '')
            .trim()
            .replace(/[\\/:*?"<>|]/g, '_'),
        handler = (index) => {
          const enabled2 = String(index || '').trim();
          if (!enabled2) return '';
          const result = enabled2.split('#')[0].split('?')[0],
            data = result.split('/').pop() || '';
          return data;
        },
        handler2 = (options) => {
          const enabled3 = String(options || '').trim();
          if (!enabled3) return '';
          if (
            enabled3.startsWith('http://') ||
            enabled3.startsWith('https://') ||
            enabled3.startsWith('blob:') ||
            enabled3.startsWith('data:')
          )
            return enabled3;
          if (enabled3.startsWith('/')) return enabled3;
          return localPathToUrl(enabled3) || '/' + enabled3.replace(/^\/+/, '');
        },
        handler3 = (target) => {
          const enabled4 = String(target || '').trim();
          if (!enabled4) return false;
          if (enabled4.startsWith('/')) return true;
          try {
            const uRL = new URL(enabled4, window.location.href);
            return uRL.origin === window.location.origin;
          } catch {
            return false;
          }
        },
        handler4 = (source) => {
          const next = run(enabled.fileName);
          if (next) return next;
          const list = run(handler(source));
          if (list) return list.includes('.') ? list : list + '.png';
          return 'image_' + Date.now() + '.png';
        },
        handler5 = (current, entry) => {
          const el2 = document.createElement('a');
          ((el2.href = current),
            (el2.download = entry),
            (el2.rel = 'noopener'),
            document.body.appendChild(el2),
            el2.click(),
            el2.remove());
        },
        enabled5 = handler2(enabled.localPath) || (handler3(enabled.src) ? enabled.src : ''),
        enabled6 =
          enabled.sourceUrl || enabled.src || enabled.resultUrl || enabled.imageUrl || enabled.thumbUrl,
        record = handler4(enabled5 || enabled6);
      if (!enabled5 && !enabled6 && !enabled.sourceId) {
        alert(toolbarText('noDownloadableImage'));
        return;
      }
      if (enabled5) {
        handler5(enabled5, record);
        return;
      }
      if (enabled.sourceId)
        try {
          const payload = await getImage(enabled.sourceId);
          if (payload) {
            const handle = window.URL.createObjectURL(payload);
            (handler5(handle, record), setTimeout(() => window.URL.revokeObjectURL(handle), 0x3e8));
            return;
          }
        } catch {}
      if (!enabled6) {
        alert(toolbarText('noDownloadableImage'));
        return;
      }
      if (handler3(enabled6)) {
        handler5(enabled6, record);
        return;
      }
      try {
        const signal = new AbortController(),
          setTimeout2 = setTimeout(() => signal.abort(), 0x3a98),
          state = await fetchRemoteBlob(enabled6, { signal: signal.signal });
        clearTimeout(setTimeout2);
        const config = window.URL.createObjectURL(state);
        (handler5(config, record), setTimeout(() => window.URL.revokeObjectURL(config), 0x3e8));
      } catch {
        handler5(enabled6, record);
      }
    });
}
