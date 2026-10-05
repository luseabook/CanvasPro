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
  onStatusChanged: onStatusChanged,
} = {}) {
  let enabled = false;
  const list = [],
    map = new Map(),
    map2 = new Map();
  let value = 0;
  const item = { codex: 'btnCodexCliLogin', dreamina: 'btnDreaminaAuth' },
    handler = (key) => (key === 'codex' ? fetchCliProviderStatuses() : fetchDreaminaCliStatusFromServer());
  function run(enabled2) {
    if (enabled || !enabled2) return;
    const index = enabled2['provider'];
    map['set'](index, enabled2);
    const el = documentObject['querySelector']('[data-cli-component="' + index + '"]');
    if (!el) return;
    const enabled3 = enabled2['phase'] === 'downloading',
      enabled4 = map2['get'](index),
      enabled5 = !!enabled4;
    (el['setAttribute']('aria-busy', String(enabled5 || enabled3)),
      (el['dataset']['componentReady'] = String(!!enabled2['installed'] && !enabled3)));
    const el2 = el['querySelector']('[data-component-version]');
    ((el2['textContent'] = enabled2['installed'] && enabled2['version'] ? 'v' + enabled2['version'] : ''),
      (el2['hidden'] = !el2['textContent']));
    const el3 = el['querySelector']('[data-component-notice]');
    ((el3['textContent'] =
      enabled4 === checkCliComponentUpdate ? '正在检查更新…' : enabled2['updateMessage'] || ''),
      (el3['hidden'] = !el3['textContent']));
    const el4 = el['querySelector']('[data-component-status]'),
      result = enabled2['downloadBytes']
        ? '约 ' + (enabled2['downloadBytes'] / 1000000)['toFixed'](1) + ' MB'
        : '';
    ((el4['textContent'] = enabled3
      ? '正在下载 ' +
        (enabled2['progress'] || 0) +
        '% · ' +
        ((enabled2['receivedBytes'] || 0) / 1000000)['toFixed'](1) +
        ' MB'
      : [enabled2['installed'] ? '' : result, enabled2['error'] || enabled2['busyReason']]
          ['filter'](Boolean)
          ['join'](' · ')),
      (el4['hidden'] = !el4['textContent']));
    const el5 = el['querySelector']('progress');
    el5['hidden'] = !enabled3 && !enabled5;
    if (enabled3 && enabled2['totalBytes'] > 0) el5['value'] = enabled2['progress'] || 0;
    else el5['removeAttribute']('value');
    const el6 = el['querySelector']('[data-component-install]');
    ((el6['hidden'] = enabled2['installed']),
      (el6['disabled'] = enabled2['supported'] === false || enabled3 || map2['has'](index)),
      (el6['textContent'] = enabled3 ? '下载中…' : enabled2['phase'] === 'failed' ? '重试下载' : '下载组件'),
      (el['querySelector']('[data-component-remove]')['hidden'] = !enabled2['installed']),
      (el['querySelector']('[data-component-remove]')['disabled'] =
        enabled3 || enabled2['busy'] || map2['has'](index)));
    const el7 = el['querySelector']('[data-component-update]');
    ((el7['hidden'] = !enabled2['installed']),
      (el7['disabled'] = enabled3 || enabled2['busy'] || map2['has'](index)),
      (el7['textContent'] = enabled3 ? '处理中…' : '修复组件'));
    const el8 = el['querySelector']('[data-component-check]');
    ((el8['hidden'] = !enabled2['installed']),
      (el8['disabled'] = enabled3 || map2['has'](index)),
      (el8['textContent'] = enabled4 === checkCliComponentUpdate ? '检查中…' : '检查更新'));
    const el9 = el['querySelector']('[data-component-upgrade]');
    ((el9['hidden'] = !enabled2['installed'] || !enabled2['updateAvailable']),
      (el9['disabled'] = enabled3 || enabled2['busy'] || map2['has'](index)),
      (el9['textContent'] = '更新到 ' + (enabled2['latestVersion'] || '新版本')));
  }
  async function run2(data, handler2) {
    if (map2['has'](data)) return;
    ((value += 1), map2['set'](data, handler2), run(map['get'](data)));
    try {
      await handler2(data);
      if (!enabled && handler2 !== checkCliComponentUpdate)
        void handler(data)
          ['then'](() => onStatusChanged?.())
          ['catch'](() => {});
    } catch (error2) {
      if (!enabled) showToast?.(error2['message'], 'error');
    } finally {
      (map2['delete'](data), (value += 1), run(map['get'](data)));
    }
  }
  for (const options of Object['keys'](item)) {
    const el10 = documentObject['querySelector']('[data-cli-component="' + options + '"]');
    if (!el10) continue;
    const el11 = el10['querySelector']('[data-component-install]'),
      el12 = el10['querySelector']('[data-component-remove]'),
      el13 = el10['querySelector']('[data-component-update]'),
      el14 = el10['querySelector']('[data-component-check]'),
      el15 = el10['querySelector']('[data-component-upgrade]'),
      el16 = documentObject['getElementById'](item[options]),
      target = () => run2(options, ensureCliComponent),
      source = () => run2(options, removeCliComponent),
      next = () => run2(options, repairCliComponent),
      current = () => run2(options, checkCliComponentUpdate),
      entry = () => run2(options, updateCliComponent),
      record = (event) => {
        if (map['get'](options)?.['installed'] && map['get'](options)?.['phase'] !== 'downloading') return;
        (event['preventDefault'](), event['stopImmediatePropagation']());
      };
    (el11['addEventListener']('click', target),
      el12['addEventListener']('click', source),
      el13['addEventListener']('click', next),
      el14['addEventListener']('click', current),
      el15['addEventListener']('click', entry),
      el16?.['addEventListener']('click', record, true),
      list['push'](() => {
        (el11['removeEventListener']('click', target),
          el12['removeEventListener']('click', source),
          el13['removeEventListener']('click', next),
          el14['removeEventListener']('click', current),
          el15['removeEventListener']('click', entry),
          el16?.['removeEventListener']('click', record, true));
      }));
  }
  const payload = (handle) => {
    ((value += 1), run(handle['detail']));
  };
  host['addEventListener'](CLI_COMPONENT_CHANGED, payload);
  function run3(state) {
    for (const provider2 of Object['keys'](item)) {
      run(
        state[provider2] || {
          provider: provider2,
          installed: false,
          supported: false,
          error: '当前平台暂不支持此组件',
        },
      );
    }
  }
  let config = false;
  const scope = host['setInterval'](async () => {
      const el17 = documentObject['getElementById']('pane-cli-login');
      if (
        enabled ||
        config ||
        !el17?.['classList']['contains']('active') ||
        !el17['getClientRects']()['length']
      )
        return;
      config = true;
      const input = value;
      try {
        const { components: components } = await fetchCliComponents();
        if (input === value) run3(components);
      } catch {
      } finally {
        config = false;
      }
    }, 3000),
    output = value;
  return (
    fetchCliComponents()
      ['then'](({ components: components2 }) => {
        if (enabled) return;
        if (output !== value) return;
        run3(components2);
        for (const value2 of Object['values'](components2)) {
          if (value2['phase'] === 'downloading') run2(value2['provider'], ensureCliComponent);
        }
      })
      ['catch']((error3) => {
        if (!enabled) showToast?.(error3['message'], 'error');
      }),
    {
      destroy() {
        ((enabled = true),
          host['removeEventListener'](CLI_COMPONENT_CHANGED, payload),
          host['clearInterval'](scope),
          list['forEach']((handler3) => handler3()));
      },
    }
  );
}
