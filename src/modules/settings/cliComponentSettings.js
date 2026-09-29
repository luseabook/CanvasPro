import {
  CLI_COMPONENT_CHANGED,
  ensureCliComponent,
  fetchCliComponents,
  removeCliComponent,
  updateCliComponent,
  repairCliComponent,
  checkCliComponentUpdate,
} from '../../../api/cliComponentApi.js';
import { fetchCliProviderStatuses } from '../../../api/cliProviderApi.js';
import { fetchDreaminaCliStatusFromServer } from '../../../api/dreaminaCliApi.js';
export function initCliComponentSettings({
  documentObject: documentObject = document,
  host: host = window,
  showToast: showToast = window['showToast'],
  onStatusChanged: _0x16b27a,
} = {}) {
  let _0x39d622 = ![];
  const _0xfe6ee0 = [],
    _0x92d0e6 = new Map(),
    _0xf843b0 = new Map();
  let _0x45f608 = 0x0;
  const _0xe60a8d = { codex: 'btnCodexCliLogin', dreamina: 'btnDreaminaAuth' },
    _0xbd67a7 = (_0x2c1cc8) =>
      _0x2c1cc8 === 'codex' ? fetchCliProviderStatuses() : fetchDreaminaCliStatusFromServer();
  function _0x27be04(_0x312118) {
    if (_0x39d622 || !_0x312118) return;
    const _0x488f78 = _0x312118['provider'];
    _0x92d0e6['set'](_0x488f78, _0x312118);
    const _0x25a187 = documentObject['querySelector']('[data-cli-component="' + _0x488f78 + '\x22]');
    if (!_0x25a187) return;
    const _0x20a9fd = _0x312118['phase'] === 'downloading',
      _0x5f3ee7 = _0xf843b0['get'](_0x488f78),
      _0x4fe4fa = !!_0x5f3ee7;
    (_0x25a187['setAttribute']('aria-busy', String(_0x4fe4fa || _0x20a9fd)),
      (_0x25a187['dataset']['componentReady'] = String(!!_0x312118['installed'] && !_0x20a9fd)));
    const _0x2f3a0a = _0x25a187['querySelector']('[data-component-version]');
    ((_0x2f3a0a['textContent'] =
      _0x312118['installed'] && _0x312118['version'] ? 'v' + _0x312118['version'] : ''),
      (_0x2f3a0a['hidden'] = !_0x2f3a0a['textContent']));
    const _0x40dfd6 = _0x25a187['querySelector']('[data-component-notice]');
    ((_0x40dfd6['textContent'] =
      _0x5f3ee7 === checkCliComponentUpdate ? '正在检查更新…' : _0x312118['updateMessage'] || ''),
      (_0x40dfd6['hidden'] = !_0x40dfd6['textContent']));
    const _0x248283 = _0x25a187['querySelector']('[data-component-status]'),
      _0x341622 = _0x312118['downloadBytes']
        ? '约\x20' + (_0x312118['downloadBytes'] / 0xf4240)['toFixed'](0x1) + ' MB'
        : '';
    ((_0x248283['textContent'] = _0x20a9fd
      ? '正在下载 ' +
        (_0x312118['progress'] || 0x0) +
        '% · ' +
        ((_0x312118['receivedBytes'] || 0x0) / 0xf4240)['toFixed'](0x1) +
        '\x20MB'
      : [_0x312118['installed'] ? '' : _0x341622, _0x312118['error'] || _0x312118['busyReason']]
          ['filter'](Boolean)
          ['join']('\x20·\x20')),
      (_0x248283['hidden'] = !_0x248283['textContent']));
    const _0x4f9071 = _0x25a187['querySelector']('progress');
    _0x4f9071['hidden'] = !_0x20a9fd && !_0x4fe4fa;
    if (_0x20a9fd && _0x312118['totalBytes'] > 0x0) _0x4f9071['value'] = _0x312118['progress'] || 0x0;
    else _0x4f9071['removeAttribute']('value');
    const _0xa262d4 = _0x25a187['querySelector']('[data-component-install]');
    ((_0xa262d4['hidden'] = _0x312118['installed']),
      (_0xa262d4['disabled'] = _0x312118['supported'] === ![] || _0x20a9fd || _0xf843b0['has'](_0x488f78)),
      (_0xa262d4['textContent'] = _0x20a9fd
        ? '下载中…'
        : _0x312118['phase'] === 'failed'
          ? '重试下载'
          : '下载组件'),
      (_0x25a187['querySelector']('[data-component-remove]')['hidden'] = !_0x312118['installed']),
      (_0x25a187['querySelector']('[data-component-remove]')['disabled'] =
        _0x20a9fd || _0x312118['busy'] || _0xf843b0['has'](_0x488f78)));
    const _0x1330ee = _0x25a187['querySelector']('[data-component-update]');
    ((_0x1330ee['hidden'] = !_0x312118['installed']),
      (_0x1330ee['disabled'] = _0x20a9fd || _0x312118['busy'] || _0xf843b0['has'](_0x488f78)),
      (_0x1330ee['textContent'] = _0x20a9fd ? '处理中…' : '修复组件'));
    const _0x709bb9 = _0x25a187['querySelector']('[data-component-check]');
    ((_0x709bb9['hidden'] = !_0x312118['installed']),
      (_0x709bb9['disabled'] = _0x20a9fd || _0xf843b0['has'](_0x488f78)),
      (_0x709bb9['textContent'] = _0x5f3ee7 === checkCliComponentUpdate ? '检查中…' : '检查更新'));
    const _0x3b534d = _0x25a187['querySelector']('[data-component-upgrade]');
    ((_0x3b534d['hidden'] = !_0x312118['installed'] || !_0x312118['updateAvailable']),
      (_0x3b534d['disabled'] = _0x20a9fd || _0x312118['busy'] || _0xf843b0['has'](_0x488f78)),
      (_0x3b534d['textContent'] = '更新到 ' + (_0x312118['latestVersion'] || '新版本')));
  }
  async function _0x1a0f97(_0x23cf49, _0xecb19a) {
    if (_0xf843b0['has'](_0x23cf49)) return;
    ((_0x45f608 += 0x1), _0xf843b0['set'](_0x23cf49, _0xecb19a), _0x27be04(_0x92d0e6['get'](_0x23cf49)));
    try {
      await _0xecb19a(_0x23cf49);
      if (!_0x39d622 && _0xecb19a !== checkCliComponentUpdate)
        void _0xbd67a7(_0x23cf49)
          ['then'](() => _0x16b27a?.())
          ['catch'](() => {});
    } catch (_0x541513) {
      if (!_0x39d622) showToast?.(_0x541513['message'], 'error');
    } finally {
      (_0xf843b0['delete'](_0x23cf49), (_0x45f608 += 0x1), _0x27be04(_0x92d0e6['get'](_0x23cf49)));
    }
  }
  for (const _0x4290e6 of Object['keys'](_0xe60a8d)) {
    const _0x3741d5 = documentObject['querySelector']('[data-cli-component="' + _0x4290e6 + '\x22]');
    if (!_0x3741d5) continue;
    const _0x56760c = _0x3741d5['querySelector']('[data-component-install]'),
      _0x94779e = _0x3741d5['querySelector']('[data-component-remove]'),
      _0x536021 = _0x3741d5['querySelector']('[data-component-update]'),
      _0x26dcbc = _0x3741d5['querySelector']('[data-component-check]'),
      _0x586457 = _0x3741d5['querySelector']('[data-component-upgrade]'),
      _0x1b7386 = documentObject['getElementById'](_0xe60a8d[_0x4290e6]),
      _0x58c22b = () => _0x1a0f97(_0x4290e6, ensureCliComponent),
      _0x211829 = () => _0x1a0f97(_0x4290e6, removeCliComponent),
      _0x2d9ee6 = () => _0x1a0f97(_0x4290e6, repairCliComponent),
      _0x17c589 = () => _0x1a0f97(_0x4290e6, checkCliComponentUpdate),
      _0x356326 = () => _0x1a0f97(_0x4290e6, updateCliComponent),
      _0x52b739 = (_0x48a66b) => {
        if (
          _0x92d0e6['get'](_0x4290e6)?.['installed'] &&
          _0x92d0e6['get'](_0x4290e6)?.['phase'] !== 'downloading'
        )
          return;
        (_0x48a66b['preventDefault'](), _0x48a66b['stopImmediatePropagation']());
      };
    (_0x56760c['addEventListener']('click', _0x58c22b),
      _0x94779e['addEventListener']('click', _0x211829),
      _0x536021['addEventListener']('click', _0x2d9ee6),
      _0x26dcbc['addEventListener']('click', _0x17c589),
      _0x586457['addEventListener']('click', _0x356326),
      _0x1b7386?.['addEventListener']('click', _0x52b739, !![]),
      _0xfe6ee0['push'](() => {
        (_0x56760c['removeEventListener']('click', _0x58c22b),
          _0x94779e['removeEventListener']('click', _0x211829),
          _0x536021['removeEventListener']('click', _0x2d9ee6),
          _0x26dcbc['removeEventListener']('click', _0x17c589),
          _0x586457['removeEventListener']('click', _0x356326),
          _0x1b7386?.['removeEventListener']('click', _0x52b739, !![]));
      }));
  }
  const _0x59b501 = (_0x22116d) => {
    ((_0x45f608 += 0x1), _0x27be04(_0x22116d['detail']));
  };
  host['addEventListener'](CLI_COMPONENT_CHANGED, _0x59b501);
  function _0x2e1250(_0x381265) {
    for (const _0x12812a of Object['keys'](_0xe60a8d)) {
      _0x27be04(
        _0x381265[_0x12812a] || {
          provider: _0x12812a,
          installed: ![],
          supported: ![],
          error: '当前平台暂不支持此组件',
        },
      );
    }
  }
  let _0x53ee9a = ![];
  const _0x473105 = host['setInterval'](async () => {
      const _0x1d2945 = documentObject['getElementById']('pane-cli-login');
      if (
        _0x39d622 ||
        _0x53ee9a ||
        !_0x1d2945?.['classList']['contains']('active') ||
        !_0x1d2945['getClientRects']()['length']
      )
        return;
      _0x53ee9a = !![];
      const _0x44a07a = _0x45f608;
      try {
        const { components: _0x367326 } = await fetchCliComponents();
        if (_0x44a07a === _0x45f608) _0x2e1250(_0x367326);
      } catch {
      } finally {
        _0x53ee9a = ![];
      }
    }, 0xbb8),
    _0x2c0c4e = _0x45f608;
  return (
    fetchCliComponents()
      ['then'](({ components: _0x343498 }) => {
        if (_0x39d622) return;
        if (_0x2c0c4e !== _0x45f608) return;
        _0x2e1250(_0x343498);
        for (const _0x8b5b32 of Object['values'](_0x343498)) {
          if (_0x8b5b32['phase'] === 'downloading') _0x1a0f97(_0x8b5b32['provider'], ensureCliComponent);
        }
      })
      ['catch']((_0x55f5ed) => {
        if (!_0x39d622) showToast?.(_0x55f5ed['message'], 'error');
      }),
    {
      destroy() {
        ((_0x39d622 = !![]),
          host['removeEventListener'](CLI_COMPONENT_CHANGED, _0x59b501),
          host['clearInterval'](_0x473105),
          _0xfe6ee0['forEach']((_0x14e703) => _0x14e703()));
      },
    }
  );
}
