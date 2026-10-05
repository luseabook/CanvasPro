import { desktopBridge } from '../../services/desktopBridge.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
let sequence = 0;
export function createPersonReplacementTimelineExportPrompt({
  documentObject: documentObject = globalThis['document'],
  openJianying: openJianying = () => desktopBridge['nodeExport']['openJianying'](),
} = {}) {
  let value = null;
  const close = () => value?.(),
    show = (args, item) => {
      close();
      if (!documentObject?.['body'] || !documentObject['createElement']) return Promise['resolve'](args);
      return new Promise((handler) => {
        const el = documentObject['createElement']('div');
        el['className'] = 'custom-confirm-overlay person-replacement-timeline-export-confirm';
        const key = 'person-replacement-export-confirm-' + ++sequence;
        ((el['innerHTML'] =
          '<section class="custom-confirm-box" role="dialog" aria-modal="true" aria-labelledby="' +
          key +
          '" aria-describedby="' +
          key +
          '-message" tabindex="-1">\n        <div class="confirm-title" id="' +
          key +
          '">是否立即打开剪映？</div>\n        <div class="confirm-msg" id="' +
          key +
          '-message"></div>\n        <div class="confirm-btns">\n          <button type="button" class="confirm-btn confirm-cancel">稍后</button>\n          <button type="button" class="confirm-btn confirm-ok">打开剪映</button>\n        </div>\n      </section>'),
          (el['querySelector']('.confirm-msg')['textContent'] =
            '草稿“' + (item || '替换工作室') + '”已保存到剪映草稿目录。'));
        const root = el['querySelector']('[role=dialog]'),
          el2 = el['querySelector']('.confirm-cancel'),
          el3 = el['querySelector']('.confirm-ok');
        let enabled = false,
          index = false,
          handler2 = () => {};
        const run = (result) => {
          if (index) return;
          ((index = true), (value = null), el['remove'](), handler2(), handler(result));
        };
        value = () => run({ ...args, jianyingLaunch: 'skipped' });
        const onClose = () => {
          if (!enabled) value?.();
        };
        (el2['addEventListener']('click', onClose),
          el['addEventListener']('click', (event) => {
            if (event['target'] === el) onClose();
          }),
          el3['addEventListener']('click', async () => {
            if (enabled || index) return;
            ((enabled = true),
              (el3['disabled'] = true),
              (el2['disabled'] = true),
              el3['setAttribute']('aria-busy', 'true'),
              (el3['innerHTML'] =
                '<span class="storyboard-script-loading-spinner" aria-hidden="true"></span><span>正在打开…</span>'),
              root['focus']({ preventScroll: true }));
            try {
              const response = await openJianying();
              run(
                response?.['success']
                  ? { ...args, jianyingLaunch: 'opened' }
                  : {
                      ...args,
                      jianyingLaunch: 'failed',
                      jianyingLaunchError: '草稿已保存，' + (response?.['error'] || '请手动打开剪映。'),
                    },
              );
            } catch {
              run({
                ...args,
                jianyingLaunch: 'failed',
                jianyingLaunchError: '草稿已保存，请手动打开剪映。',
              });
            }
          }),
          documentObject['body']['appendChild'](el),
          (handler2 = beginModalInteraction({
            root: root,
            onClose: onClose,
            preferredSelector: '.confirm-cancel',
          })));
      });
    };
  return Object['freeze']({ show: show, close: close, destroy: close });
}
