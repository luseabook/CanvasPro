import {
  fetchCliProviderStatuses,
  logoutCliProvider,
  startCliProviderLogin,
} from '../../../api/cliProviderApi.js';
import { initCliComponentSettings } from './cliComponentSettings.js';
const PROVIDERS = Object.freeze({
    codex: Object.freeze({
      label: 'OpenAI CLI',
      statusId: 'codexCliStatusText',
      messageId: 'codexCliStatusMessage',
      loginId: 'btnCodexCliLogin',
      logoutId: 'btnCodexCliLogout',
      signedOutMessage:
        '未登录。点击登录后，按终端提示在浏览器完成 ChatGPT 官方登录；不要选择 API Key 或 Access Token。',
    }),
  }),
  LOGIN_STATUS_POLL_INTERVAL_MS = 2000,
  LOGIN_STATUS_POLL_MAX_ATTEMPTS = 45;
function pickStatusMessage(error, value) {
  return String(error?.message || error?.error || value).trim();
}
export function formatCliProviderStatus(enabled) {
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled))
    return Object.freeze({
      statusText: '未检测',
      message: '尚未获取 CLI 状态',
      installed: false,
      loggedIn: false,
      busy: false,
    });
  const installed = !!enabled.installed,
    loggedIn = !!enabled.loggedIn,
    busy = !!(
      enabled.busy ||
      enabled.active ||
      enabled.loginInProgress ||
      enabled.runtime?.active
    );
  if (busy)
    return Object.freeze({
      statusText: '登录中...',
      message: pickStatusMessage(enabled, '正在等待浏览器授权'),
      installed: installed,
      loggedIn: loggedIn,
      busy: busy,
    });
  if (enabled.error)
    return Object.freeze({
      statusText: '检测失败',
      message: pickStatusMessage(enabled, 'CLI 状态检测失败'),
      installed: installed,
      loggedIn: loggedIn,
      busy: busy,
    });
  if (!installed)
    return Object.freeze({
      statusText: '未安装',
      message: pickStatusMessage(enabled, '未检测到本地 CLI'),
      installed: installed,
      loggedIn: false,
      busy: busy,
    });
  if (loggedIn) {
    const item = [enabled.account, enabled.version].filter(Boolean).join(' · ');
    return Object.freeze({
      statusText: '已登录',
      message: pickStatusMessage(enabled, item || '本地 CLI 已登录'),
      installed: installed,
      loggedIn: loggedIn,
      busy: busy,
    });
  }
  if (enabled.authConfigured)
    return Object.freeze({
      statusText: '已配置',
      message: pickStatusMessage(enabled, '已配置本地登录方式，首次生成时验证账号状态'),
      installed: installed,
      loggedIn: loggedIn,
      busy: busy,
    });
  return Object.freeze({
    statusText: '未登录',
    message: pickStatusMessage(enabled, '点击登录以授权本地 CLI'),
    installed: installed,
    loggedIn: loggedIn,
    busy: busy,
  });
}
function getProviderElements(statusTextEl, key) {
  return {
    statusTextEl: statusTextEl?.getElementById?.(key.statusId) || null,
    messageEl: statusTextEl?.getElementById?.(key.messageId) || null,
    loginButtonEl: statusTextEl?.getElementById?.(key.loginId) || null,
    logoutButtonEl: statusTextEl?.getElementById?.(key.logoutId) || null,
  };
}
function resolveProviderStatus(enabled2, index) {
  if (!enabled2 || typeof enabled2 !== 'object') return null;
  const result = enabled2.providers;
  if (result && typeof result === 'object' && !Array.isArray(result)) return result[index] || null;
  return enabled2[index] || null;
}
export async function initCliProviderSettings({
  documentObject: documentObject = globalThis.document,
  showToast: showToast = globalThis.window?.showToast,
  setTimeoutFn: setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn: clearTimeoutFn = globalThis.clearTimeout,
  loginStatusPollIntervalMs: loginStatusPollIntervalMs = LOGIN_STATUS_POLL_INTERVAL_MS,
  loginStatusPollMaxAttempts: loginStatusPollMaxAttempts = LOGIN_STATUS_POLL_MAX_ATTEMPTS,
} = {}) {
  const list = Object.entries(PROVIDERS).map(([provider, config]) => ({
      provider: provider,
      config: config,
      elements: getProviderElements(documentObject, config),
    })),
    list2 = [];
  if (documentObject?.querySelector?.('[data-cli-component]')) {
    const initCliComponentSettings2 = initCliComponentSettings({
      documentObject: documentObject,
      showToast: showToast,
      onStatusChanged: () => refresh(),
    });
    list2.push(() => initCliComponentSettings2.destroy());
  }
  const map = new Map();
  let enabled3 = false;
  function run(data) {
    const options = map.get(data);
    if (options !== undefined) clearTimeoutFn?.(options);
    map.delete(data);
  }
  function run2(target, error2) {
    const message = list.find((source) => source.provider === target);
    if (!message) return;
    const next =
        error2 &&
        typeof error2 === 'object' &&
        !Array.isArray(error2) &&
        error2.installed &&
        !error2.loggedIn &&
        !error2.authConfigured &&
        !error2.message &&
        !error2.error,
      error3 = formatCliProviderStatus(
        next ? { ...error2, message: message.config.signedOutMessage } : error2,
      ),
      {
        statusTextEl: statusTextEl2,
        messageEl: messageEl,
        loginButtonEl: loginButtonEl,
        logoutButtonEl: logoutButtonEl,
      } = message.elements;
    if (statusTextEl2) statusTextEl2.textContent = error3.statusText;
    if (messageEl) messageEl.textContent = error3.message;
    (loginButtonEl &&
      ((loginButtonEl.hidden = error3.loggedIn), (loginButtonEl.disabled = error3.busy)),
      logoutButtonEl &&
        ((logoutButtonEl.hidden = !error3.loggedIn), (logoutButtonEl.disabled = error3.busy)));
  }
  async function refresh() {
    try {
      const fetchCliProviderStatuses2 = await fetchCliProviderStatuses();
      if (enabled3) return fetchCliProviderStatuses2;
      return (
        list.forEach(({ provider: provider2 }) => {
          run2(provider2, resolveProviderStatus(fetchCliProviderStatuses2, provider2));
        }),
        fetchCliProviderStatuses2
      );
    } catch (error4) {
      !enabled3 &&
        list.forEach(({ provider: provider3 }) => {
          run2(provider3, { error: error4?.message || 'CLI 状态检测失败' });
        });
      throw error4;
    }
  }
  function run3(current) {
    run(current);
    let entry = 0;
    const async2 = async () => {
        map.delete(current);
        if (enabled3) return;
        entry += 1;
        try {
          const record = await refresh(),
            providerStatus = resolveProviderStatus(record, current);
          if (providerStatus?.loggedIn || providerStatus?.authConfigured) {
            run(current);
            return;
          }
        } catch {}
        if (enabled3 || entry >= loginStatusPollMaxAttempts) return;
        const payload = setTimeoutFn?.(async2, loginStatusPollIntervalMs);
        if (payload !== undefined) map.set(current, payload);
      },
      handle = setTimeoutFn?.(async2, loginStatusPollIntervalMs);
    if (handle !== undefined) map.set(current, handle);
  }
  async function run4(state, handler, scope) {
    const enabled4 = list.find((input) => input.provider === state);
    if (!enabled4 || enabled3) return;
    const { loginButtonEl: loginButtonEl2, logoutButtonEl: logoutButtonEl2 } = enabled4.elements;
    if (loginButtonEl2) loginButtonEl2.disabled = true;
    if (logoutButtonEl2) logoutButtonEl2.disabled = true;
    let enabled5 = false;
    try {
      const enabled6 = await handler(state);
      ((enabled5 = !!enabled6?.started),
        enabled5 &&
          (run2(state, {
            installed: true,
            busy: true,
            message: String(enabled6?.instructions || '正在等待官方授权完成'),
          }),
          run3(state)),
        showToast?.(scope, 'success'));
    } catch (error5) {
      showToast?.(error5?.message || enabled4.config.label + ' 操作失败', 'error');
    } finally {
      !enabled3 &&
        !enabled5 &&
        (await refresh().catch((error6) => {
          showToast?.(error6?.message || 'CLI 状态刷新失败', 'error');
        }));
    }
  }
  return (
    list.forEach(({ provider: provider4, config: config2, elements: elements }) => {
      const output = () => run4(provider4, startCliProviderLogin, config2.label + ' 登录已启动'),
        value2 = () => run4(provider4, logoutCliProvider, config2.label + ' 已退出登录');
      (elements.loginButtonEl?.addEventListener?.('click', output),
        elements.logoutButtonEl?.addEventListener?.('click', value2),
        list2.push(() => {
          (elements.loginButtonEl?.removeEventListener?.('click', output),
            elements.logoutButtonEl?.removeEventListener?.('click', value2));
        }));
    }),
    await refresh().catch((error7) => {
      showToast?.(error7?.message || 'CLI 状态刷新失败', 'error');
    }),
    Object.freeze({
      refresh: refresh,
      destroy() {
        if (enabled3) return;
        ((enabled3 = true),
          [...map.keys()].forEach(run),
          list2.splice(0).forEach((handler2) => handler2()));
      },
    })
  );
}
