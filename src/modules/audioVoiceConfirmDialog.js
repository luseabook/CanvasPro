let audioVoiceConfirmSequence = 0;
function createElement(el, value, item = '', key = '') {
  const el2 = el['createElement'](value);
  if (item) el2['className'] = item;
  if (key) el2['textContent'] = key;
  return el2;
}
export function createAudioVoiceConfirmDialog({
  root: root,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  let value2 = null;
  const close = (enabled = ![]) => {
      const promise = value2;
      if (!promise) return;
      ((value2 = null),
        documentObject?.['removeEventListener']?.('keydown', promise['handleKeydown'], !![]),
        promise['overlay']?.['remove']?.(),
        promise['resolve']?.(enabled === !![]),
        promise['returnFocus']?.['focus']?.());
    },
    confirm = ({
      className: className = '',
      title: title = '',
      message: message = '',
      cancelLabel: cancelLabel = '取消',
      confirmLabel: confirmLabel = '确定',
      returnFocus: returnFocus,
    } = {}) => {
      close(![]);
      const el3 = documentObject?.['body'] || root;
      if (!el3 || typeof documentObject?.['createElement'] !== 'function') return Promise['resolve'](![]);
      return new Promise((resolve) => {
        const overlay = createElement(
            documentObject,
            'div',
            ('custom-confirm-overlay ' + className)['trim'](),
          ),
          el4 = createElement(documentObject, 'div', 'custom-confirm-box'),
          index = ++audioVoiceConfirmSequence,
          result = 'audio-voice-action-confirm-title-' + index,
          data = 'audio-voice-action-confirm-message-' + index;
        (el4['setAttribute']('role', 'dialog'),
          el4['setAttribute']('aria-modal', 'true'),
          el4['setAttribute']('aria-labelledby', result),
          el4['setAttribute']('aria-describedby', data));
        const element = createElement(documentObject, 'div', 'confirm-title', title);
        element['id'] = result;
        const element2 = createElement(documentObject, 'div', 'confirm-msg', message);
        element2['id'] = data;
        const element3 = createElement(documentObject, 'div', 'confirm-btns'),
          el5 = createElement(documentObject, 'button', 'confirm-btn confirm-cancel', cancelLabel);
        el5['type'] = 'button';
        const el6 = createElement(documentObject, 'button', 'confirm-btn confirm-ok', confirmLabel);
        ((el6['type'] = 'button'),
          element3['append'](el5, el6),
          el4['append'](element, element2, element3),
          overlay['appendChild'](el4));
        const run = (options) => {
            if (value2?.['overlay'] !== overlay) return;
            close(options);
          },
          handleKeydown = (event) => {
            if (event['key'] === 'Escape') (event['preventDefault']?.(), run(![]));
            else event['key'] === 'Enter' && (event['preventDefault']?.(), run(!![]));
          };
        ((value2 = {
          overlay: overlay,
          resolve: resolve,
          returnFocus: returnFocus,
          handleKeydown: handleKeydown,
        }),
          el5['addEventListener']('click', () => run(![])),
          el6['addEventListener']('click', () => run(!![])),
          overlay['addEventListener']('click', (event2) => {
            if (event2['target'] === overlay) run(![]);
          }),
          documentObject?.['addEventListener']?.('keydown', handleKeydown, !![]),
          el3['appendChild'](overlay),
          windowObject?.['setTimeout']?.(() => el5['focus']?.(), 0));
      });
    };
  return Object['freeze']({ confirm: confirm, close: close, destroy: () => close(![]) });
}
