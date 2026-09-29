import { REPLACEMENT_STUDIO_NAME } from './replacementStudioTerminology.js';
import { PERSON_REPLACEMENT_ORIENTATION_ENABLED } from './personReplacementCapabilities.js';
function normalizeText(_0x4d06a3) {
  return String(_0x4d06a3 ?? '')['trim']();
}
function escapeHtml(_0x179980) {
  return String(_0x179980 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#039;');
}
function isModelPackReady(_0x2e65d9) {
  const _0x12beaf = Array['isArray'](_0x2e65d9?.['models']) ? _0x2e65d9['models'] : [],
    _0x1bc5ef =
      Boolean(_0x2e65d9?.['reidModel']) ||
      _0x12beaf['some']((_0x5c7543) =>
        /osnet|reid/iu['test']((_0x5c7543?.['id'] || '') + '\x20' + (_0x5c7543?.['filename'] || '')),
      ),
    _0x54bf6f =
      Boolean(_0x2e65d9?.['orientationModel']) ||
      _0x12beaf['some']((_0x243269) =>
        /pp.?lcnet|orientation|pedestrian.?attribute/iu['test'](
          (_0x243269?.['id'] || '') + '\x20' + (_0x243269?.['filename'] || ''),
        ),
      );
  return (
    _0x2e65d9?.['installed'] === !![] &&
    Boolean(_0x2e65d9?.['model']) &&
    _0x1bc5ef &&
    (!PERSON_REPLACEMENT_ORIENTATION_ENABLED || _0x54bf6f)
  );
}
export function formatPersonReplacementModelBytes(_0x74c728) {
  const _0x3d2bc7 = Math['max'](0x0, Number(_0x74c728) || 0x0);
  if (!_0x3d2bc7) return '';
  if (_0x3d2bc7 >= 0x400 * 0x400 * 0x400)
    return (_0x3d2bc7 / (0x400 * 0x400 * 0x400))['toFixed'](0x1) + ' GB';
  if (_0x3d2bc7 >= 0x400 * 0x400)
    return (_0x3d2bc7 / (0x400 * 0x400))['toFixed'](_0x3d2bc7 >= 0x64 * 0x400 * 0x400 ? 0x0 : 0x1) + ' MB';
  return Math['max'](0x1, Math['round'](_0x3d2bc7 / 0x400)) + '\x20KB';
}
function normalizeProgress(_0x26bf3f = {}, _0x169f92 = 0x0) {
  const _0x1edfcc = Math['max'](0x0, Number(_0x26bf3f['downloadedBytes']) || 0x0),
    _0x5e6c17 = Math['max'](0x0, Number(_0x26bf3f['totalBytes']) || Number(_0x169f92) || 0x0);
  return {
    state: normalizeText(_0x26bf3f['state']),
    downloadedBytes: _0x1edfcc,
    totalBytes: _0x5e6c17,
    percent: Math['min'](
      0x64,
      Math['max'](0x0, Number(_0x26bf3f['percent']) || (_0x5e6c17 ? (_0x1edfcc / _0x5e6c17) * 0x64 : 0x0)),
    ),
  };
}
function formatProgressMessage(_0x47788a) {
  if (_0x47788a === 'verifying') return '正在校验下载内容';
  if (_0x47788a === 'complete') return '准备完成';
  return '正在下载所需资源';
}
export function renderPersonReplacementModelGate({
  state: state = 'checking',
  downloadBytes: downloadBytes = 0x0,
  installProgress: installProgress = {},
  error: error = '',
} = {}) {
  const _0x583eb8 = state === 'installing',
    _0x19244f = state === 'checking',
    _0x1804d7 = normalizeProgress(installProgress, downloadBytes),
    _0x2d5396 = formatPersonReplacementModelBytes(downloadBytes),
    _0x210f5f = _0x19244f ? '正在检查人物识别模型' : '下载人物识别基础模型',
    _0x1ec31f = _0x19244f
      ? '正在确认本机是否已经安装人物替换所需的轻量识别模型。'
      : '人物替换会先在本机识别视频关键帧中的人物。模型只需下载一次，安装完成后才能进入' +
        REPLACEMENT_STUDIO_NAME +
        '。';
  return (
    '<div class="person-replacement-model-gate-backdrop" data-person-replacement-model-gate-dialog role="presentation">\n    <section class="person-replacement-model-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="personReplacementModelGateTitle" aria-describedby="personReplacementModelGateDescription" tabindex="-1">\n      <span class="person-replacement-model-gate-mark" aria-hidden="true">\n        <svg viewBox="0 0 24 24" fill="none"><path d="M7.5 10.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"/><path d="M2.75 18.75v-1.5a4.75 4.75 0 0 1 4.75-4.75h1.25"/><path d="M16.5 13.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12.25 20.25v-1.5A3.75 3.75 0 0 1 16 15h1a4.25 4.25 0 0 1 4.25 4.25v1"/></svg>\n      </span>\n      <div class="person-replacement-model-gate-copy">\n        <span class="person-replacement-model-gate-eyebrow">首次使用准备</span>\n        <h2 id="personReplacementModelGateTitle">' +
    escapeHtml(_0x210f5f) +
    '</h2>\n        <p id="personReplacementModelGateDescription">' +
    escapeHtml(_0x1ec31f) +
    '</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    (_0x583eb8
      ? '<div\x20class=\x22person-replacement-model-gate-progress\x22\x20role=\x22status\x22\x20aria-live=\x22polite\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div><strong>' +
        formatProgressMessage(_0x1804d7['state']) +
        '</strong><span>' +
        Math['round'](_0x1804d7['percent']) +
        '%</span></div>\n              <progress max="100" value="' +
        _0x1804d7['percent'] +
        '" aria-label="人物识别模型下载进度">' +
        Math['round'](_0x1804d7['percent']) +
        '%</progress>\n              <small>' +
        escapeHtml(formatPersonReplacementModelBytes(_0x1804d7['downloadedBytes']) || '0 KB') +
        ' / ' +
        escapeHtml(formatPersonReplacementModelBytes(_0x1804d7['totalBytes']) || _0x2d5396 || '计算中') +
        '</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>'
      : '') +
    '\n        ' +
    (_0x19244f
      ? '<div\x20class=\x22person-replacement-model-gate-checking\x22\x20role=\x22status\x22><span\x20aria-hidden=\x22true\x22></span><small>正在读取本地模型状态…</small></div>'
      : '') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    (error
      ? '<div class="person-replacement-model-gate-error" role="alert">' + escapeHtml(error) + '</div>'
      : '') +
    '\n      </div>\n      <footer>\n        <button type="button" data-person-replacement-model-gate-action="cancel" ' +
    (_0x583eb8 ? 'disabled' : '') +
    '>取消</button>\n        ' +
    (_0x19244f
      ? ''
      : '<button\x20type=\x22button\x22\x20class=\x22person-replacement-model-gate-primary\x22\x20data-person-replacement-model-gate-action=\x22install\x22\x20' +
        (_0x583eb8 ? 'disabled' : '') +
        '>' +
        (_0x583eb8 ? '正在下载…' : error ? '重新下载' : '下载模型并进入') +
        '</button>') +
    '\x0a\x20\x20\x20\x20\x20\x20</footer>\x0a\x20\x20\x20\x20</section>\x0a\x20\x20</div>'
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
    pollIntervalMs: pollIntervalMs = 0x15e,
  } = {}) {
    ((this['document'] = documentObject),
      (this['modelPackApi'] = modelPackApi),
      (this['onReady'] = onReady),
      (this['onNotify'] = onNotify),
      (this['setTimeoutFn'] = setTimeoutFn),
      (this['clearTimeoutFn'] = clearTimeoutFn),
      (this['pollIntervalMs'] = Math['max'](0x64, Number(pollIntervalMs) || 0x15e)),
      (this['status'] = {
        state: 'idle',
        installed: ![],
        downloadBytes: 0x0,
        installProgress: {},
        error: '',
      }),
      (this['dialogOpen'] = ![]),
      (this['pendingOpen'] = ![]),
      (this['destroyed'] = ![]),
      (this['root'] = null),
      (this['checkPromise'] = null),
      (this['installPromise'] = null),
      (this['pollTimer'] = 0x0),
      (this['pollInFlight'] = ![]),
      (this['returnFocusElement'] = null),
      (this['_handleClick'] = this['_handleClick']['bind'](this)),
      (this['_handleKeyDown'] = this['_handleKeyDown']['bind'](this)));
  }
  ['requestOpen'](_0x312091) {
    if (this['destroyed']) return null;
    if (this['status']['installed'] === !![]) return typeof _0x312091 === 'function' ? _0x312091() : null;
    if (!this['dialogOpen']) this['_captureReturnFocus']();
    return (
      (this['pendingOpen'] = !![]),
      (this['dialogOpen'] = !![]),
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
          installed: ![],
          error: '人物识别模型服务尚未初始化。',
        }),
        this['render'](),
        this['status']
      );
    ((this['status'] = { ...this['status'], state: 'checking', error: '' }), this['render']());
    const _0xb711df = Promise['resolve'](this['modelPackApi']['getStatus']())
      ['then']((_0x6eeaba) => {
        return (
          isModelPackReady(_0x6eeaba)
            ? this['_unlock'](_0x6eeaba)
            : ((this['status'] = {
                ...this['status'],
                ..._0x6eeaba,
                state: 'missing',
                installed: ![],
                error: '',
              }),
              this['render']()),
          this['status']
        );
      })
      ['catch']((_0x425f59) => {
        return (
          (this['status'] = {
            ...this['status'],
            state: 'error',
            installed: ![],
            error: normalizeText(_0x425f59?.['message']) || '无法检测人物识别模型状态。',
          }),
          this['render'](),
          this['status']
        );
      })
      ['finally'](() => {
        this['checkPromise'] = null;
      });
    return ((this['checkPromise'] = _0xb711df), _0xb711df);
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
      installed: ![],
      error: '',
      installProgress: {
        state: 'downloading',
        downloadedBytes: 0x0,
        totalBytes: this['status']['downloadBytes'],
        percent: 0x0,
        message: '正在连接模型下载源',
      },
    }),
      (this['dialogOpen'] = !![]),
      this['render']());
    const _0x2b2ee1 = Promise['resolve'](this['modelPackApi']['install']())
      ['then']((_0x46e959) => {
        if (!isModelPackReady(_0x46e959)) throw new Error('人物识别模型下载未完成，请重试。');
        return (
          this['_unlock'](_0x46e959),
          this['onNotify']?.('人物识别模型下载完成。', 'success'),
          this['status']
        );
      })
      ['catch'](async (_0x325365) => {
        try {
          const _0x3f3135 = await this['modelPackApi']['getStatus']?.();
          if (isModelPackReady(_0x3f3135))
            return (
              this['_unlock'](_0x3f3135),
              this['onNotify']?.('人物识别模型下载完成。', 'success'),
              this['status']
            );
        } catch {}
        return (
          this['_stopPolling'](),
          (this['status'] = {
            ...this['status'],
            state: 'error',
            installed: ![],
            error: normalizeText(_0x325365?.['message']) || '人物识别模型下载失败。',
          }),
          this['render'](),
          this['status']
        );
      })
      ['finally'](() => {
        this['installPromise'] = null;
      });
    return ((this['installPromise'] = _0x2b2ee1), this['_pollProgress'](), _0x2b2ee1);
  }
  ['dismiss']() {
    if (this['status']['state'] === 'installing') return ![];
    return ((this['pendingOpen'] = ![]), (this['dialogOpen'] = ![]), this['render'](), !![]);
  }
  ['_unlock'](_0x345145) {
    (this['_stopPolling'](),
      (this['status'] = { ...this['status'], ..._0x345145, state: 'installed', installed: !![], error: '' }),
      (this['dialogOpen'] = ![]),
      this['render']({ restoreFocus: ![] }));
    const _0x12d94a = this['pendingOpen'];
    (_0x12d94a && ((this['pendingOpen'] = ![]), this['onReady']?.()), this['_restoreFocus']());
  }
  ['_pollProgress']() {
    if (
      this['destroyed'] ||
      this['status']['state'] !== 'installing' ||
      this['pollInFlight'] ||
      typeof this['modelPackApi']?.['getStatus'] !== 'function'
    )
      return;
    ((this['pollInFlight'] = !![]),
      Promise['resolve'](this['modelPackApi']['getStatus']())
        ['then']((_0x3ab1a2) => {
          if (isModelPackReady(_0x3ab1a2)) {
            this['_unlock'](_0x3ab1a2);
            return;
          }
          this['status']['state'] === 'installing' &&
            ((this['status'] = {
              ...this['status'],
              downloadBytes: Number(_0x3ab1a2?.['downloadBytes']) || this['status']['downloadBytes'],
              installProgress: _0x3ab1a2?.['installProgress'] || this['status']['installProgress'],
            }),
            this['render']());
        })
        ['catch'](() => {})
        ['finally'](() => {
          ((this['pollInFlight'] = ![]),
            !this['destroyed'] &&
              this['status']['state'] === 'installing' &&
              (this['pollTimer'] =
                this['setTimeoutFn']?.(() => {
                  ((this['pollTimer'] = 0x0), this['_pollProgress']());
                }, this['pollIntervalMs']) || 0x0));
        }));
  }
  ['_stopPolling']() {
    if (this['pollTimer']) this['clearTimeoutFn']?.(this['pollTimer']);
    this['pollTimer'] = 0x0;
  }
  ['_ensureRoot']() {
    if (this['root'] || !this['document']?.['body']?.['appendChild']) return this['root'];
    const _0x296ed8 = this['document']['createElement']('div');
    return (
      (_0x296ed8['className'] = 'person-replacement-model-gate'),
      (_0x296ed8['dataset']['personReplacementModelGate'] = ''),
      _0x296ed8['addEventListener']('click', this['_handleClick']),
      _0x296ed8['addEventListener']('keydown', this['_handleKeyDown']),
      this['document']['body']['appendChild'](_0x296ed8),
      (this['root'] = _0x296ed8),
      _0x296ed8
    );
  }
  ['_handleClick'](_0xe4cd0f) {
    const _0x2e4fbc = _0xe4cd0f['target']?.['closest']?.('[data-person-replacement-model-gate-action]')?.[
      'dataset'
    ]?.['personReplacementModelGateAction'];
    if (_0x2e4fbc === 'cancel') this['dismiss']();
    if (_0x2e4fbc === 'install') void this['install']();
  }
  ['_handleKeyDown'](_0x319049) {
    if (!this['dialogOpen']) return;
    if (_0x319049['key'] === 'Escape') {
      if (this['status']['state'] === 'installing') return;
      (_0x319049['preventDefault']?.(), _0x319049['stopPropagation']?.(), this['dismiss']());
      return;
    }
    if (_0x319049['key'] !== 'Tab') return;
    const _0x45d528 = this['_getFocusableElements'](),
      _0x263c26 = this['root']?.['querySelector']?.('.person-replacement-model-gate-dialog');
    if (!_0x45d528['length']) {
      (_0x319049['preventDefault']?.(), _0x263c26?.['focus']?.({ preventScroll: !![] }));
      return;
    }
    const _0x1b770c = _0x45d528['indexOf'](this['document']?.['activeElement']),
      _0x1aa793 = _0x319049['shiftKey'] && _0x1b770c <= 0x0,
      _0x5a63b7 = !_0x319049['shiftKey'] && (_0x1b770c === -0x1 || _0x1b770c === _0x45d528['length'] - 0x1);
    if (!_0x1aa793 && !_0x5a63b7) return;
    _0x319049['preventDefault']?.();
    const _0x1d677d = _0x1aa793 ? _0x45d528['at'](-0x1) : _0x45d528[0x0];
    _0x1d677d?.['focus']?.({ preventScroll: !![] });
  }
  ['_getFocusableElements']() {
    const _0x250b13 = this['root']?.['querySelector']?.('.person-replacement-model-gate-dialog');
    if (!_0x250b13) return [];
    return Array['from'](
      _0x250b13['querySelectorAll']?.(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || [],
    )['filter'](
      (_0x446e06) => _0x446e06['hidden'] !== !![] && _0x446e06['getAttribute']?.('aria-hidden') !== 'true',
    );
  }
  ['_captureReturnFocus']() {
    const _0x5d0611 = this['document']?.['activeElement'];
    this['returnFocusElement'] = _0x5d0611 && _0x5d0611 !== this['document']?.['body'] ? _0x5d0611 : null;
  }
  ['_focusDialog'](_0x1c7e55 = '') {
    const _0x2257f4 = _0x1c7e55
        ? this['root']?.['querySelector']?.(
            '[data-person-replacement-model-gate-action=\x22' + _0x1c7e55 + '"]:not([disabled])',
          )
        : null,
      _0x11d57c =
        _0x2257f4 ||
        this['_getFocusableElements']()['find'](
          (_0x508617) => _0x508617['dataset']?.['personReplacementModelGateAction'] === 'install',
        ) ||
        this['_getFocusableElements']()[0x0] ||
        this['root']?.['querySelector']?.('.person-replacement-model-gate-dialog');
    try {
      _0x11d57c?.['focus']?.({ preventScroll: !![] });
    } catch {
      _0x11d57c?.['focus']?.();
    }
  }
  ['_restoreFocus']() {
    const _0x416847 =
        this['returnFocusElement']?.['isConnected'] !== ![] &&
        (typeof this['returnFocusElement']?.['getClientRects'] !== 'function' ||
          this['returnFocusElement']['getClientRects']()['length'] > 0x0)
          ? this['returnFocusElement']
          : null,
      _0x192716 = this['document']?.['querySelector']?.('.workspace-mode-current'),
      _0x24be8b = this['document']?.['querySelector']?.('[data-story-workspace-mode="person-replacement"]'),
      _0x565b43 = _0x416847 || _0x192716 || _0x24be8b;
    this['returnFocusElement'] = null;
    if (!_0x565b43 || _0x565b43['isConnected'] === ![]) return ![];
    try {
      _0x565b43['focus']?.({ preventScroll: !![] });
    } catch {
      _0x565b43['focus']?.();
    }
    return this['document']?.['activeElement'] === _0x565b43;
  }
  ['render']({ restoreFocus: restoreFocus = !![] } = {}) {
    if (!this['root'] && this['dialogOpen']) this['_ensureRoot']();
    if (!this['root']) return;
    const _0x424b5b = this['root']['contains']?.(this['document']?.['activeElement'])
      ? normalizeText(this['document']?.['activeElement']?.['dataset']?.['personReplacementModelGateAction'])
      : '';
    ((this['root']['hidden'] = !this['dialogOpen']),
      (this['root']['innerHTML'] = this['dialogOpen']
        ? renderPersonReplacementModelGate(this['status'])
        : ''));
    if (this['dialogOpen']) this['_focusDialog'](_0x424b5b);
    else {
      if (restoreFocus) this['_restoreFocus']();
    }
  }
  ['destroy']() {
    if (this['destroyed']) return;
    ((this['destroyed'] = !![]),
      (this['pendingOpen'] = ![]),
      this['_stopPolling'](),
      this['root']?.['removeEventListener']?.('click', this['_handleClick']),
      this['root']?.['removeEventListener']?.('keydown', this['_handleKeyDown']),
      this['root']?.['remove']?.(),
      (this['root'] = null),
      this['_restoreFocus']());
  }
}
export const PersonReplacementModelGate = ReplacementStudioModelGate;
