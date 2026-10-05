import { REPLACEMENT_STUDIO_NAME } from './replacementStudioTerminology.js';
import { PERSON_REPLACEMENT_ORIENTATION_ENABLED } from './personReplacementCapabilities.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#039;');
}
function isModelPackReady(key) {
  const list = Array['isArray'](key?.['models']) ? key['models'] : [],
    index =
      Boolean(key?.['reidModel']) ||
      list['some']((result) =>
        /osnet|reid/iu['test']((result?.['id'] || '') + ' ' + (result?.['filename'] || '')),
      ),
    data =
      Boolean(key?.['orientationModel']) ||
      list['some']((options) =>
        /pp.?lcnet|orientation|pedestrian.?attribute/iu['test'](
          (options?.['id'] || '') + ' ' + (options?.['filename'] || ''),
        ),
      );
  return (
    key?.['installed'] === true &&
    Boolean(key?.['model']) &&
    index &&
    (!PERSON_REPLACEMENT_ORIENTATION_ENABLED || data)
  );
}
export function formatPersonReplacementModelBytes(target) {
  const enabled = Math['max'](0, Number(target) || 0);
  if (!enabled) return '';
  if (enabled >= 1024 * 1024 * 1024) return (enabled / (1024 * 1024 * 1024))['toFixed'](1) + ' GB';
  if (enabled >= 1024 * 1024)
    return (enabled / (1024 * 1024))['toFixed'](enabled >= 100 * 1024 * 1024 ? 0 : 1) + ' MB';
  return Math['max'](1, Math['round'](enabled / 1024)) + ' KB';
}
function normalizeProgress(options2 = {}, source = 0) {
  const downloadedBytes = Math['max'](0, Number(options2['downloadedBytes']) || 0),
    totalBytes = Math['max'](0, Number(options2['totalBytes']) || Number(source) || 0);
  return {
    state: normalizeText(options2['state']),
    downloadedBytes: downloadedBytes,
    totalBytes: totalBytes,
    percent: Math['min'](
      100,
      Math['max'](
        0,
        Number(options2['percent']) || (totalBytes ? (downloadedBytes / totalBytes) * 100 : 0),
      ),
    ),
  };
}
function formatProgressMessage(next) {
  if (next === 'verifying') return '正在校验下载内容';
  if (next === 'complete') return '准备完成';
  return '正在下载所需资源';
}
export function renderPersonReplacementModelGate({
  state: state = 'checking',
  downloadBytes: downloadBytes = 0,
  installProgress: installProgress = {},
  error: error = '',
} = {}) {
  const current = state === 'installing',
    entry = state === 'checking',
    progress = normalizeProgress(installProgress, downloadBytes),
    formatPersonReplacementModelBytes2 = formatPersonReplacementModelBytes(downloadBytes),
    record = entry ? '正在检查人物识别模型' : '下载人物识别基础模型',
    payload = entry
      ? '正在确认本机是否已经安装人物替换所需的轻量识别模型。'
      : '人物替换会先在本机识别视频关键帧中的人物。模型只需下载一次，安装完成后才能进入' +
        REPLACEMENT_STUDIO_NAME +
        '。';
  return (
    '<div class="person-replacement-model-gate-backdrop" data-person-replacement-model-gate-dialog role="presentation">\n    <section class="person-replacement-model-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="personReplacementModelGateTitle" aria-describedby="personReplacementModelGateDescription" tabindex="-1">\n      <span class="person-replacement-model-gate-mark" aria-hidden="true">\n        <svg viewBox="0 0 24 24" fill="none"><path d="M7.5 10.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"/><path d="M2.75 18.75v-1.5a4.75 4.75 0 0 1 4.75-4.75h1.25"/><path d="M16.5 13.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12.25 20.25v-1.5A3.75 3.75 0 0 1 16 15h1a4.25 4.25 0 0 1 4.25 4.25v1"/></svg>\n      </span>\n      <div class="person-replacement-model-gate-copy">\n        <span class="person-replacement-model-gate-eyebrow">首次使用准备</span>\n        <h2 id="personReplacementModelGateTitle">' +
    escapeHtml(record) +
    '</h2>\n        <p id="personReplacementModelGateDescription">' +
    escapeHtml(payload) +
    '</p>\n        ' +
    (current
      ? '<div class="person-replacement-model-gate-progress" role="status" aria-live="polite">\n              <div><strong>' +
        formatProgressMessage(progress['state']) +
        '</strong><span>' +
        Math['round'](progress['percent']) +
        '%</span></div>\n              <progress max="100" value="' +
        progress['percent'] +
        '" aria-label="人物识别模型下载进度">' +
        Math['round'](progress['percent']) +
        '%</progress>\n              <small>' +
        escapeHtml(formatPersonReplacementModelBytes(progress['downloadedBytes']) || '0 KB') +
        ' / ' +
        escapeHtml(
          formatPersonReplacementModelBytes(progress['totalBytes']) ||
            formatPersonReplacementModelBytes2 ||
            '计算中',
        ) +
        '</small>\n            </div>'
      : '') +
    '\n        ' +
    (entry
      ? '<div class="person-replacement-model-gate-checking" role="status"><span aria-hidden="true"></span><small>正在读取本地模型状态…</small></div>'
      : '') +
    '\n        ' +
    (error
      ? '<div class="person-replacement-model-gate-error" role="alert">' + escapeHtml(error) + '</div>'
      : '') +
    '\n      </div>\n      <footer>\n        <button type="button" data-person-replacement-model-gate-action="cancel" ' +
    (current ? 'disabled' : '') +
    '>取消</button>\n        ' +
    (entry
      ? ''
      : '<button type="button" class="person-replacement-model-gate-primary" data-person-replacement-model-gate-action="install" ' +
        (current ? 'disabled' : '') +
        '>' +
        (current ? '正在下载…' : error ? '重新下载' : '下载模型并进入') +
        '</button>') +
    '\n      </footer>\n    </section>\n  </div>'
  );
}
export class ReplacementStudioModelGate {
  constructor({
    documentObject: documentObject = globalThis['document'],
    modelPackApi: modelPackApi = null,
    onReady: onReady = () => {},
    onNotify: onNotify = () => {},
    setTimeoutFn: setTimeoutFn = globalThis['setTimeout'],
    clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout'],
    pollIntervalMs: pollIntervalMs = 350,
  } = {}) {
    ((this['document'] = documentObject),
      (this['modelPackApi'] = modelPackApi),
      (this['onReady'] = onReady),
      (this['onNotify'] = onNotify),
      (this['setTimeoutFn'] = setTimeoutFn),
      (this['clearTimeoutFn'] = clearTimeoutFn),
      (this['pollIntervalMs'] = Math['max'](100, Number(pollIntervalMs) || 350)),
      (this['status'] = {
        state: 'idle',
        installed: false,
        downloadBytes: 0,
        installProgress: {},
        error: '',
      }),
      (this['dialogOpen'] = false),
      (this['pendingOpen'] = false),
      (this['destroyed'] = false),
      (this['root'] = null),
      (this['checkPromise'] = null),
      (this['installPromise'] = null),
      (this['pollTimer'] = 0),
      (this['pollInFlight'] = false),
      (this['returnFocusElement'] = null),
      (this['_handleClick'] = this['_handleClick']['bind'](this)),
      (this['_handleKeyDown'] = this['_handleKeyDown']['bind'](this)));
  }
  ['requestOpen'](handler) {
    if (this['destroyed']) return null;
    if (this['status']['installed'] === true) return typeof handler === 'function' ? handler() : null;
    if (!this['dialogOpen']) this['_captureReturnFocus']();
    return (
      (this['pendingOpen'] = true),
      (this['dialogOpen'] = true),
      this['_ensureRoot'](),
      this['status']['state'] === 'missing' || this['status']['state'] === 'error'
        ? this['render']()
        : void this['checkStatus'](),
      null
    );
  }
  async ['checkStatus']() {
    if (this['destroyed']) return this['status'];
    if (this['checkPromise']) return this['checkPromise'];
    if (typeof this['modelPackApi']?.['getStatus'] !== 'function')
      return (
        (this['status'] = {
          ...this['status'],
          state: 'error',
          installed: false,
          error: '人物识别模型服务尚未初始化。',
        }),
        this['render'](),
        this['status']
      );
    ((this['status'] = { ...this['status'], state: 'checking', error: '' }), this['render']());
    const handle = Promise['resolve'](this['modelPackApi']['getStatus']())
      ['then']((args) => {
        return (
          isModelPackReady(args)
            ? this['_unlock'](args)
            : ((this['status'] = {
                ...this['status'],
                ...args,
                state: 'missing',
                installed: false,
                error: '',
              }),
              this['render']()),
          this['status']
        );
      })
      ['catch']((error2) => {
        return (
          (this['status'] = {
            ...this['status'],
            state: 'error',
            installed: false,
            error: normalizeText(error2?.['message']) || '无法检测人物识别模型状态。',
          }),
          this['render'](),
          this['status']
        );
      })
      ['finally'](() => {
        this['checkPromise'] = null;
      });
    return ((this['checkPromise'] = handle), handle);
  }
  async ['install']() {
    if (this['destroyed'] || this['installPromise']) return this['installPromise'];
    if (typeof this['modelPackApi']?.['install'] !== 'function')
      return (
        (this['status'] = { ...this['status'], state: 'error', error: '人物识别模型下载服务尚未初始化。' }),
        this['render'](),
        null
      );
    ((this['status'] = {
      ...this['status'],
      state: 'installing',
      installed: false,
      error: '',
      installProgress: {
        state: 'downloading',
        downloadedBytes: 0,
        totalBytes: this['status']['downloadBytes'],
        percent: 0,
        message: '正在连接模型下载源',
      },
    }),
      (this['dialogOpen'] = true),
      this['render']());
    const config = Promise['resolve'](this['modelPackApi']['install']())
      ['then']((scope) => {
        if (!isModelPackReady(scope)) throw new Error('人物识别模型下载未完成，请重试。');
        return (
          this['_unlock'](scope),
          this['onNotify']?.('人物识别模型下载完成。', 'success'),
          this['status']
        );
      })
      ['catch'](async (error3) => {
        try {
          const input = await this['modelPackApi']['getStatus']?.();
          if (isModelPackReady(input))
            return (
              this['_unlock'](input),
              this['onNotify']?.('人物识别模型下载完成。', 'success'),
              this['status']
            );
        } catch {}
        return (
          this['_stopPolling'](),
          (this['status'] = {
            ...this['status'],
            state: 'error',
            installed: false,
            error: normalizeText(error3?.['message']) || '人物识别模型下载失败。',
          }),
          this['render'](),
          this['status']
        );
      })
      ['finally'](() => {
        this['installPromise'] = null;
      });
    return ((this['installPromise'] = config), this['_pollProgress'](), config);
  }
  ['dismiss']() {
    if (this['status']['state'] === 'installing') return false;
    return ((this['pendingOpen'] = false), (this['dialogOpen'] = false), this['render'](), true);
  }
  ['_unlock'](args2) {
    (this['_stopPolling'](),
      (this['status'] = { ...this['status'], ...args2, state: 'installed', installed: true, error: '' }),
      (this['dialogOpen'] = false),
      this['render']({ restoreFocus: false }));
    const output = this['pendingOpen'];
    (output && ((this['pendingOpen'] = false), this['onReady']?.()), this['_restoreFocus']());
  }
  ['_pollProgress']() {
    if (
      this['destroyed'] ||
      this['status']['state'] !== 'installing' ||
      this['pollInFlight'] ||
      typeof this['modelPackApi']?.['getStatus'] !== 'function'
    )
      return;
    ((this['pollInFlight'] = true),
      Promise['resolve'](this['modelPackApi']['getStatus']())
        ['then']((installProgress2) => {
          if (isModelPackReady(installProgress2)) {
            this['_unlock'](installProgress2);
            return;
          }
          this['status']['state'] === 'installing' &&
            ((this['status'] = {
              ...this['status'],
              downloadBytes: Number(installProgress2?.['downloadBytes']) || this['status']['downloadBytes'],
              installProgress: installProgress2?.['installProgress'] || this['status']['installProgress'],
            }),
            this['render']());
        })
        ['catch'](() => {})
        ['finally'](() => {
          ((this['pollInFlight'] = false),
            !this['destroyed'] &&
              this['status']['state'] === 'installing' &&
              (this['pollTimer'] =
                this['setTimeoutFn']?.(() => {
                  ((this['pollTimer'] = 0), this['_pollProgress']());
                }, this['pollIntervalMs']) || 0));
        }));
  }
  ['_stopPolling']() {
    if (this['pollTimer']) this['clearTimeoutFn']?.(this['pollTimer']);
    this['pollTimer'] = 0;
  }
  ['_ensureRoot']() {
    if (this['root'] || !this['document']?.['body']?.['appendChild']) return this['root'];
    const el = this['document']['createElement']('div');
    return (
      (el['className'] = 'person-replacement-model-gate'),
      (el['dataset']['personReplacementModelGate'] = ''),
      el['addEventListener']('click', this['_handleClick']),
      el['addEventListener']('keydown', this['_handleKeyDown']),
      this['document']['body']['appendChild'](el),
      (this['root'] = el),
      el
    );
  }
  ['_handleClick'](event) {
    const value2 = event['target']?.['closest']?.('[data-person-replacement-model-gate-action]')?.[
      'dataset'
    ]?.['personReplacementModelGateAction'];
    if (value2 === 'cancel') this['dismiss']();
    if (value2 === 'install') void this['install']();
  }
  ['_handleKeyDown'](event2) {
    if (!this['dialogOpen']) return;
    if (event2['key'] === 'Escape') {
      if (this['status']['state'] === 'installing') return;
      (event2['preventDefault']?.(), event2['stopPropagation']?.(), this['dismiss']());
      return;
    }
    if (event2['key'] !== 'Tab') return;
    const list2 = this['_getFocusableElements'](),
      el2 = this['root']?.['querySelector']?.('.person-replacement-model-gate-dialog');
    if (!list2['length']) {
      (event2['preventDefault']?.(), el2?.['focus']?.({ preventScroll: true }));
      return;
    }
    const count = list2['indexOf'](this['document']?.['activeElement']),
      enabled2 = event2['shiftKey'] && count <= 0,
      enabled3 = !event2['shiftKey'] && (count === -1 || count === list2['length'] - 1);
    if (!enabled2 && !enabled3) return;
    event2['preventDefault']?.();
    const el3 = enabled2 ? list2['at'](-1) : list2[0];
    el3?.['focus']?.({ preventScroll: true });
  }
  ['_getFocusableElements']() {
    const el4 = this['root']?.['querySelector']?.('.person-replacement-model-gate-dialog');
    if (!el4) return [];
    return Array['from'](
      el4['querySelectorAll']?.(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || [],
    )['filter']((el5) => el5['hidden'] !== true && el5['getAttribute']?.('aria-hidden') !== 'true');
  }
  ['_captureReturnFocus']() {
    const value3 = this['document']?.['activeElement'];
    this['returnFocusElement'] = value3 && value3 !== this['document']?.['body'] ? value3 : null;
  }
  ['_focusDialog'](value4 = '') {
    const value5 = value4
        ? this['root']?.['querySelector']?.(
            '[data-person-replacement-model-gate-action="' + value4 + '"]:not([disabled])',
          )
        : null,
      el6 =
        value5 ||
        this['_getFocusableElements']()['find'](
          (el7) => el7['dataset']?.['personReplacementModelGateAction'] === 'install',
        ) ||
        this['_getFocusableElements']()[0] ||
        this['root']?.['querySelector']?.('.person-replacement-model-gate-dialog');
    try {
      el6?.['focus']?.({ preventScroll: true });
    } catch {
      el6?.['focus']?.();
    }
  }
  ['_restoreFocus']() {
    const value6 =
        this['returnFocusElement']?.['isConnected'] !== false &&
        (typeof this['returnFocusElement']?.['getClientRects'] !== 'function' ||
          this['returnFocusElement']['getClientRects']()['length'] > 0)
          ? this['returnFocusElement']
          : null,
      value7 = this['document']?.['querySelector']?.('.workspace-mode-current'),
      value8 = this['document']?.['querySelector']?.('[data-story-workspace-mode="person-replacement"]'),
      el8 = value6 || value7 || value8;
    this['returnFocusElement'] = null;
    if (!el8 || el8['isConnected'] === false) return false;
    try {
      el8['focus']?.({ preventScroll: true });
    } catch {
      el8['focus']?.();
    }
    return this['document']?.['activeElement'] === el8;
  }
  ['render']({ restoreFocus: restoreFocus = true } = {}) {
    if (!this['root'] && this['dialogOpen']) this['_ensureRoot']();
    if (!this['root']) return;
    const value9 = this['root']['contains']?.(this['document']?.['activeElement'])
      ? normalizeText(this['document']?.['activeElement']?.['dataset']?.['personReplacementModelGateAction'])
      : '';
    ((this['root']['hidden'] = !this['dialogOpen']),
      (this['root']['innerHTML'] = this['dialogOpen']
        ? renderPersonReplacementModelGate(this['status'])
        : ''));
    if (this['dialogOpen']) this['_focusDialog'](value9);
    else {
      if (restoreFocus) this['_restoreFocus']();
    }
  }
  ['destroy']() {
    if (this['destroyed']) return;
    ((this['destroyed'] = true),
      (this['pendingOpen'] = false),
      this['_stopPolling'](),
      this['root']?.['removeEventListener']?.('click', this['_handleClick']),
      this['root']?.['removeEventListener']?.('keydown', this['_handleKeyDown']),
      this['root']?.['remove']?.(),
      (this['root'] = null),
      this['_restoreFocus']());
  }
}
export const PersonReplacementModelGate = ReplacementStudioModelGate;
