import { desktopBridge } from '../../services/desktopBridge.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
let sequence = 0x0;
export function createPersonReplacementTimelineExportPrompt({
  documentObject: documentObject = globalThis['document'],
  openJianying: openJianying = () => desktopBridge['nodeExport']['openJianying'](),
} = {}) {
  let _0x254826 = null;
  const _0x38bcfa = () => _0x254826?.(),
    _0x5670bd = (_0x2c79e4, _0x38c984) => {
      _0x38bcfa();
      if (!documentObject?.['body'] || !documentObject['createElement']) return Promise['resolve'](_0x2c79e4);
      return new Promise((_0x1745c1) => {
        const _0xa24e52 = documentObject['createElement']('div');
        _0xa24e52['className'] = 'custom-confirm-overlay person-replacement-timeline-export-confirm';
        const _0x291a9c = 'person-replacement-export-confirm-' + ++sequence;
        ((_0xa24e52['innerHTML'] =
          '<section class="custom-confirm-box" role="dialog" aria-modal="true" aria-labelledby="' +
          _0x291a9c +
          '\x22\x20aria-describedby=\x22' +
          _0x291a9c +
          '-message" tabindex="-1">\n        <div class="confirm-title" id="' +
          _0x291a9c +
          '\x22>是否立即打开剪映？</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22confirm-msg\x22\x20id=\x22' +
          _0x291a9c +
          '-message"></div>\n        <div class="confirm-btns">\n          <button type="button" class="confirm-btn confirm-cancel">稍后</button>\n          <button type="button" class="confirm-btn confirm-ok">打开剪映</button>\n        </div>\n      </section>'),
          (_0xa24e52['querySelector']('.confirm-msg')['textContent'] =
            '草稿“' + (_0x38c984 || '替换工作室') + '”已保存到剪映草稿目录。'));
        const _0x4254b3 = _0xa24e52['querySelector']('[role=dialog]'),
          _0x145b3c = _0xa24e52['querySelector']('.confirm-cancel'),
          _0x21fa7d = _0xa24e52['querySelector']('.confirm-ok');
        let _0x1008cf = ![],
          _0x13bb70 = ![],
          _0x58eb9e = () => {};
        const _0x44a662 = (_0x1e8246) => {
          if (_0x13bb70) return;
          ((_0x13bb70 = !![]), (_0x254826 = null), _0xa24e52['remove'](), _0x58eb9e(), _0x1745c1(_0x1e8246));
        };
        _0x254826 = () => _0x44a662({ ..._0x2c79e4, jianyingLaunch: 'skipped' });
        const _0x520d5b = () => {
          if (!_0x1008cf) _0x254826?.();
        };
        (_0x145b3c['addEventListener']('click', _0x520d5b),
          _0xa24e52['addEventListener']('click', (_0x433227) => {
            if (_0x433227['target'] === _0xa24e52) _0x520d5b();
          }),
          _0x21fa7d['addEventListener']('click', async () => {
            if (_0x1008cf || _0x13bb70) return;
            ((_0x1008cf = !![]),
              (_0x21fa7d['disabled'] = !![]),
              (_0x145b3c['disabled'] = !![]),
              _0x21fa7d['setAttribute']('aria-busy', 'true'),
              (_0x21fa7d['innerHTML'] =
                '<span class="storyboard-script-loading-spinner" aria-hidden="true"></span><span>正在打开…</span>'),
              _0x4254b3['focus']({ preventScroll: !![] }));
            try {
              const _0x3e42f8 = await openJianying();
              _0x44a662(
                _0x3e42f8?.['success']
                  ? { ..._0x2c79e4, jianyingLaunch: 'opened' }
                  : {
                      ..._0x2c79e4,
                      jianyingLaunch: 'failed',
                      jianyingLaunchError: '草稿已保存，' + (_0x3e42f8?.['error'] || '请手动打开剪映。'),
                    },
              );
            } catch {
              _0x44a662({
                ..._0x2c79e4,
                jianyingLaunch: 'failed',
                jianyingLaunchError: '草稿已保存，请手动打开剪映。',
              });
            }
          }),
          documentObject['body']['appendChild'](_0xa24e52),
          (_0x58eb9e = beginModalInteraction({
            root: _0x4254b3,
            onClose: _0x520d5b,
            preferredSelector: '.confirm-cancel',
          })));
      });
    };
  return Object['freeze']({ show: _0x5670bd, close: _0x38bcfa, destroy: _0x38bcfa });
}
