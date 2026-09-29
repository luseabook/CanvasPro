import { t } from '../../i18n/index.js';
function escapeHtml(_0x4c2882) {
  return String(_0x4c2882 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&apos;');
}
function panelText(_0x5a1411, _0x45e02a = {}) {
  return t('videoClip.smartPanel.' + _0x5a1411, _0x45e02a);
}
function renderSettingLabel(_0x5de75e, _0x2fa13d) {
  return (
    '<span class="person-replacement-smart-clip-setting-label">' +
    escapeHtml(_0x5de75e) +
    '<span class="rh-tip" data-tooltip="' +
    escapeHtml(_0x2fa13d) +
    '" aria-label="' +
    escapeHtml(_0x2fa13d) +
    '">!</span></span>'
  );
}
function renderModeOptions(_0x53262f, _0x52049c = 'set-smart-clip-mode') {
  return [
    ['stable', panelText('modeStable')],
    ['balanced', panelText('modeBalanced')],
    ['sensitive', panelText('modeSensitive')],
  ]
    ['map'](
      ([_0x1ec17a, _0x2d1411]) =>
        '<button type="button" class="person-replacement-smart-clip-option ' +
        (_0x53262f === _0x1ec17a ? 'is-active' : '') +
        '" data-person-replacement-action="' +
        escapeHtml(_0x52049c) +
        '" data-smart-clip-mode="' +
        _0x1ec17a +
        '\x22\x20aria-pressed=\x22' +
        (_0x53262f === _0x1ec17a) +
        '\x22>' +
        escapeHtml(_0x2d1411) +
        '</button>',
    )
    ['join']('');
}
export function createPersonReplacementSmartDetectPresentation({ renderIcon: renderIcon = () => '' } = {}) {
  const _0x358f52 = (_0x369523, { smartDetecting: smartDetecting = ![] } = {}) =>
      '<div id="person-replacement-shot-cut-smart-detect-panel" class="person-replacement-shot-cut-smart-detect-panel" role="dialog" aria-label="智能检测切口">\n      <strong class="person-replacement-smart-clip-settings-title">智能检测</strong>\n      <div class="person-replacement-smart-clip-setting-row">\n        ' +
      renderSettingLabel(panelText('mode'), panelText('modeTip')) +
      '\n        <div class="person-replacement-smart-clip-option-group" role="group" aria-label="' +
      escapeHtml(panelText('mode')) +
      '">\n          ' +
      renderModeOptions(_0x369523['settings']['smartClipMode'], 'set-shot-cut-smart-detect-mode') +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-shot-cut-smart-detect-footer\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x20person-replacement-shot-cut-smart-detect-confirm\x20' +
      (smartDetecting ? 'is-loading' : '') +
      '\x22\x20data-person-replacement-action=\x22confirm-shot-cut-smart-detect\x22\x20aria-busy=\x22' +
      smartDetecting +
      '\x22\x20' +
      (smartDetecting ? 'disabled' : '') +
      '>' +
      (smartDetecting ? '检测中…' : '确定') +
      '</button>\n      </div>\n    </div>',
    _0x453f7a = ({
      smartDetectOpen: smartDetectOpen = ![],
      smartDetecting: smartDetecting = ![],
      disabled: disabled = ![],
    } = {}) => {
      const _0x34afd8 = smartDetecting ? '智能检测中' : '智能检测';
      return (
        '<span\x20class=\x22person-replacement-shot-cut-smart-detect\x20' +
        (smartDetectOpen ? 'is-open' : '') +
        '\x22\x20data-person-replacement-shot-cut-smart-detect>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-secondary-button\x20person-replacement-keyframe-smart-detect' +
        (smartDetecting ? ' is-loading' : '') +
        '" data-person-replacement-action="toggle-shot-cut-smart-detect" aria-label="' +
        _0x34afd8 +
        '\x22\x20aria-haspopup=\x22dialog\x22\x20aria-controls=\x22person-replacement-shot-cut-smart-detect-panel\x22\x20aria-expanded=\x22' +
        smartDetectOpen +
        '\x22' +
        (disabled ? ' disabled' : '') +
        '>' +
        renderIcon('smartDetect') +
        '<span>' +
        (smartDetecting ? '检测中…' : '智能检测') +
        '</span></button>\n    </span>'
      );
    };
  return Object['freeze']({ renderPanel: _0x358f52, renderTrigger: _0x453f7a });
}
