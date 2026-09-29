import {
  fetchCliProviderStatuses,
  logoutCliProvider,
  startCliProviderLogin,
} from '../../../api/cliProviderApi.js';
import { initCliComponentSettings } from './cliComponentSettings.js';
const PROVIDERS = Object['freeze']({
    codex: Object['freeze']({
      label: 'OpenAI CLI',
      statusId: 'codexCliStatusText',
      messageId: 'codexCliStatusMessage',
      loginId: 'btnCodexCliLogin',
      logoutId: 'btnCodexCliLogout',
      signedOutMessage:
        '未登录。点击登录后，按终端提示在浏览器完成 ChatGPT 官方登录；不要选择 API Key 或 Access Token。',
    }),
  }),
  LOGIN_STATUS_POLL_INTERVAL_MS = 0x7d0,
  LOGIN_STATUS_POLL_MAX_ATTEMPTS = 0x2d;
function pickStatusMessage(_0x1173ed, _0x4be342) {
  return String(_0x1173ed?.['message'] || _0x1173ed?.['error'] || _0x4be342)['trim']();
}
export function formatCliProviderStatus(_0x2c21de) {
  if (!_0x2c21de || typeof _0x2c21de !== 'object' || Array['isArray'](_0x2c21de))
    return Object['freeze']({
      statusText: '未检测',
      message: '尚未获取 CLI 状态',
      installed: ![],
      loggedIn: ![],
      busy: ![],
    });
  const _0x23fb5d = !!_0x2c21de['installed'],
    _0x3995ce = !!_0x2c21de['loggedIn'],
    _0x3820c3 = !!(
      _0x2c21de['busy'] ||
      _0x2c21de['active'] ||
      _0x2c21de['loginInProgress'] ||
      _0x2c21de['runtime']?.['active']
    );
  if (_0x3820c3)
    return Object['freeze']({
      statusText: '登录中...',
      message: pickStatusMessage(_0x2c21de, '正在等待浏览器授权'),
      installed: _0x23fb5d,
      loggedIn: _0x3995ce,
      busy: _0x3820c3,
    });
  if (_0x2c21de['error'])
    return Object['freeze']({
      statusText: '检测失败',
      message: pickStatusMessage(_0x2c21de, 'CLI 状态检测失败'),
      installed: _0x23fb5d,
      loggedIn: _0x3995ce,
      busy: _0x3820c3,
    });
  if (!_0x23fb5d)
    return Object['freeze']({
      statusText: '未安装',
      message: pickStatusMessage(_0x2c21de, '未检测到本地 CLI'),
      installed: _0x23fb5d,
      loggedIn: ![],
      busy: _0x3820c3,
    });
  if (_0x3995ce) {
    const _0x1c0aed = [_0x2c21de['account'], _0x2c21de['version']]['filter'](Boolean)['join'](' · ');
    return Object['freeze']({
      statusText: '已登录',
      message: pickStatusMessage(_0x2c21de, _0x1c0aed || '本地\x20CLI\x20已登录'),
      installed: _0x23fb5d,
      loggedIn: _0x3995ce,
      busy: _0x3820c3,
    });
  }
  if (_0x2c21de['authConfigured'])
    return Object['freeze']({
      statusText: '已配置',
      message: pickStatusMessage(_0x2c21de, '已配置本地登录方式，首次生成时验证账号状态'),
      installed: _0x23fb5d,
      loggedIn: _0x3995ce,
      busy: _0x3820c3,
    });
  return Object['freeze']({
    statusText: '未登录',
    message: pickStatusMessage(_0x2c21de, '点击登录以授权本地 CLI'),
    installed: _0x23fb5d,
    loggedIn: _0x3995ce,
    busy: _0x3820c3,
  });
}
function getProviderElements(_0x3ec71a, _0x2f51f7) {
  return {
    statusTextEl: _0x3ec71a?.['getElementById']?.(_0x2f51f7['statusId']) || null,
    messageEl: _0x3ec71a?.['getElementById']?.(_0x2f51f7['messageId']) || null,
    loginButtonEl: _0x3ec71a?.['getElementById']?.(_0x2f51f7['loginId']) || null,
    logoutButtonEl: _0x3ec71a?.['getElementById']?.(_0x2f51f7['logoutId']) || null,
  };
}
function resolveProviderStatus(_0x42c924, _0x341164) {
  if (!_0x42c924 || typeof _0x42c924 !== 'object') return null;
  const _0x38aaaa = _0x42c924['providers'];
  if (_0x38aaaa && typeof _0x38aaaa === 'object' && !Array['isArray'](_0x38aaaa))
    return _0x38aaaa[_0x341164] || null;
  return _0x42c924[_0x341164] || null;
}
export async function initCliProviderSettings({
  documentObject: documentObject = globalThis['document'],
  showToast: showToast = globalThis['window']?.['showToast'],
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout'],
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout'],
  loginStatusPollIntervalMs: loginStatusPollIntervalMs = LOGIN_STATUS_POLL_INTERVAL_MS,
  loginStatusPollMaxAttempts: loginStatusPollMaxAttempts = LOGIN_STATUS_POLL_MAX_ATTEMPTS,
} = {}) {
  const _0x4b8e89 = Object['entries'](PROVIDERS)['map'](([_0x172e0d, _0x557615]) => ({
      provider: _0x172e0d,
      config: _0x557615,
      elements: getProviderElements(documentObject, _0x557615),
    })),
    _0x329789 = [];
  if (documentObject?.['querySelector']?.('[data-cli-component]')) {
    const _0x43e8a9 = initCliComponentSettings({
      documentObject: documentObject,
      showToast: showToast,
      onStatusChanged: () => _0xec876d(),
    });
    _0x329789['push'](() => _0x43e8a9['destroy']());
  }
  const _0x2ec576 = new Map();
  let _0xf88c9c = ![];
  function _0x15d124(_0x220173) {
    const _0x333867 = _0x2ec576['get'](_0x220173);
    if (_0x333867 !== undefined) clearTimeoutFn?.(_0x333867);
    _0x2ec576['delete'](_0x220173);
  }
  function _0x45e350(_0x5ddf61, _0x26611a) {
    const _0x53aade = _0x4b8e89['find']((_0x5cc7e6) => _0x5cc7e6['provider'] === _0x5ddf61);
    if (!_0x53aade) return;
    const _0x5658e3 =
        _0x26611a &&
        typeof _0x26611a === 'object' &&
        !Array['isArray'](_0x26611a) &&
        _0x26611a['installed'] &&
        !_0x26611a['loggedIn'] &&
        !_0x26611a['authConfigured'] &&
        !_0x26611a['message'] &&
        !_0x26611a['error'],
      _0x1bf398 = formatCliProviderStatus(
        _0x5658e3 ? { ..._0x26611a, message: _0x53aade['config']['signedOutMessage'] } : _0x26611a,
      ),
      {
        statusTextEl: _0x3066a6,
        messageEl: _0xc12793,
        loginButtonEl: _0x310f85,
        logoutButtonEl: _0x1ebd20,
      } = _0x53aade['elements'];
    if (_0x3066a6) _0x3066a6['textContent'] = _0x1bf398['statusText'];
    if (_0xc12793) _0xc12793['textContent'] = _0x1bf398['message'];
    (_0x310f85 &&
      ((_0x310f85['hidden'] = _0x1bf398['loggedIn']), (_0x310f85['disabled'] = _0x1bf398['busy'])),
      _0x1ebd20 &&
        ((_0x1ebd20['hidden'] = !_0x1bf398['loggedIn']), (_0x1ebd20['disabled'] = _0x1bf398['busy'])));
  }
  async function _0xec876d() {
    try {
      const _0x158007 = await fetchCliProviderStatuses();
      if (_0xf88c9c) return _0x158007;
      return (
        _0x4b8e89['forEach'](({ provider: _0x2e726a }) => {
          _0x45e350(_0x2e726a, resolveProviderStatus(_0x158007, _0x2e726a));
        }),
        _0x158007
      );
    } catch (_0x18da07) {
      !_0xf88c9c &&
        _0x4b8e89['forEach'](({ provider: _0x1a16ff }) => {
          _0x45e350(_0x1a16ff, { error: _0x18da07?.['message'] || 'CLI 状态检测失败' });
        });
      throw _0x18da07;
    }
  }
  function _0x128cdd(_0x4eca66) {
    _0x15d124(_0x4eca66);
    let _0x3fdfe0 = 0x0;
    const _0x113f65 = async () => {
        _0x2ec576['delete'](_0x4eca66);
        if (_0xf88c9c) return;
        _0x3fdfe0 += 0x1;
        try {
          const _0x786354 = await _0xec876d(),
            _0x38ac19 = resolveProviderStatus(_0x786354, _0x4eca66);
          if (_0x38ac19?.['loggedIn'] || _0x38ac19?.['authConfigured']) {
            _0x15d124(_0x4eca66);
            return;
          }
        } catch {}
        if (_0xf88c9c || _0x3fdfe0 >= loginStatusPollMaxAttempts) return;
        const _0x194e89 = setTimeoutFn?.(_0x113f65, loginStatusPollIntervalMs);
        if (_0x194e89 !== undefined) _0x2ec576['set'](_0x4eca66, _0x194e89);
      },
      _0x4694ba = setTimeoutFn?.(_0x113f65, loginStatusPollIntervalMs);
    if (_0x4694ba !== undefined) _0x2ec576['set'](_0x4eca66, _0x4694ba);
  }
  async function _0x4002f4(_0x10f0e6, _0x4e49c2, _0x4f441e) {
    const _0x4b34b6 = _0x4b8e89['find']((_0x113f40) => _0x113f40['provider'] === _0x10f0e6);
    if (!_0x4b34b6 || _0xf88c9c) return;
    const { loginButtonEl: _0x54eeca, logoutButtonEl: _0x519b9a } = _0x4b34b6['elements'];
    if (_0x54eeca) _0x54eeca['disabled'] = !![];
    if (_0x519b9a) _0x519b9a['disabled'] = !![];
    let _0x4ff600 = ![];
    try {
      const _0x3dbd50 = await _0x4e49c2(_0x10f0e6);
      ((_0x4ff600 = !!_0x3dbd50?.['started']),
        _0x4ff600 &&
          (_0x45e350(_0x10f0e6, {
            installed: !![],
            busy: !![],
            message: String(_0x3dbd50?.['instructions'] || '正在等待官方授权完成'),
          }),
          _0x128cdd(_0x10f0e6)),
        showToast?.(_0x4f441e, 'success'));
    } catch (_0x3b8dec) {
      showToast?.(_0x3b8dec?.['message'] || _0x4b34b6['config']['label'] + '\x20操作失败', 'error');
    } finally {
      !_0xf88c9c &&
        !_0x4ff600 &&
        (await _0xec876d()['catch']((_0x1f4fb6) => {
          showToast?.(_0x1f4fb6?.['message'] || 'CLI 状态刷新失败', 'error');
        }));
    }
  }
  return (
    _0x4b8e89['forEach'](({ provider: _0x40d7ab, config: _0x155136, elements: _0xda5878 }) => {
      const _0x162454 = () => _0x4002f4(_0x40d7ab, startCliProviderLogin, _0x155136['label'] + ' 登录已启动'),
        _0x3e5df5 = () => _0x4002f4(_0x40d7ab, logoutCliProvider, _0x155136['label'] + ' 已退出登录');
      (_0xda5878['loginButtonEl']?.['addEventListener']?.('click', _0x162454),
        _0xda5878['logoutButtonEl']?.['addEventListener']?.('click', _0x3e5df5),
        _0x329789['push'](() => {
          (_0xda5878['loginButtonEl']?.['removeEventListener']?.('click', _0x162454),
            _0xda5878['logoutButtonEl']?.['removeEventListener']?.('click', _0x3e5df5));
        }));
    }),
    await _0xec876d()['catch']((_0x5b7f19) => {
      showToast?.(_0x5b7f19?.['message'] || 'CLI\x20状态刷新失败', 'error');
    }),
    Object['freeze']({
      refresh: _0xec876d,
      destroy() {
        if (_0xf88c9c) return;
        ((_0xf88c9c = !![]),
          [..._0x2ec576['keys']()]['forEach'](_0x15d124),
          _0x329789['splice'](0x0)['forEach']((_0x83dd79) => _0x83dd79()));
      },
    })
  );
}
