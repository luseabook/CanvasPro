import { t } from '../../i18n/index.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&apos;');
}
function panelText(item, key = {}) {
  return t('videoClip.smartPanel.' + item, key);
}
function renderSettingLabel(index, result) {
  return (
    '<span class="person-replacement-smart-clip-setting-label">' +
    escapeHtml(index) +
    '<span class="rh-tip" data-tooltip="' +
    escapeHtml(result) +
    '" aria-label="' +
    escapeHtml(result) +
    '">!</span></span>'
  );
}
function renderModeOptions(data, options = 'set-smart-clip-mode') {
  return [
    ['stable', panelText('modeStable')],
    ['balanced', panelText('modeBalanced')],
    ['sensitive', panelText('modeSensitive')],
  ]
    ['map'](
      ([target, source]) =>
        '<button type="button" class="person-replacement-smart-clip-option ' +
        (data === target ? 'is-active' : '') +
        '" data-person-replacement-action="' +
        escapeHtml(options) +
        '" data-smart-clip-mode="' +
        target +
        '\x22\x20aria-pressed=\x22' +
        (data === target) +
        '\x22>' +
        escapeHtml(source) +
        '</button>',
    )
    ['join']('');
}
export function createPersonReplacementSmartDetectPresentation({ renderIcon: renderIcon = () => '' } = {}) {
  const renderPanel = (next, { smartDetecting: smartDetecting = ![] } = {}) =>
      '<div id="person-replacement-shot-cut-smart-detect-panel" class="person-replacement-shot-cut-smart-detect-panel" role="dialog" aria-label="智能检测切口">\n      <strong class="person-replacement-smart-clip-settings-title">智能检测</strong>\n      <div class="person-replacement-smart-clip-setting-row">\n        ' +
      renderSettingLabel(panelText('mode'), panelText('modeTip')) +
      '\n        <div class="person-replacement-smart-clip-option-group" role="group" aria-label="' +
      escapeHtml(panelText('mode')) +
      '">\n          ' +
      renderModeOptions(next['settings']['smartClipMode'], 'set-shot-cut-smart-detect-mode') +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-shot-cut-smart-detect-footer\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x20person-replacement-shot-cut-smart-detect-confirm\x20' +
      (smartDetecting ? 'is-loading' : '') +
      '\x22\x20data-person-replacement-action=\x22confirm-shot-cut-smart-detect\x22\x20aria-busy=\x22' +
      smartDetecting +
      '\x22\x20' +
      (smartDetecting ? 'disabled' : '') +
      '>' +
      (smartDetecting ? '检测中…' : '确定') +
      '</button>\n      </div>\n    </div>',
    renderTrigger = ({
      smartDetectOpen: smartDetectOpen = ![],
      smartDetecting: smartDetecting = ![],
      disabled: disabled = ![],
    } = {}) => {
      const current = smartDetecting ? '智能检测中' : '智能检测';
      return (
        '<span\x20class=\x22person-replacement-shot-cut-smart-detect\x20' +
        (smartDetectOpen ? 'is-open' : '') +
        '\x22\x20data-person-replacement-shot-cut-smart-detect>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22person-replacement-secondary-button\x20person-replacement-keyframe-smart-detect' +
        (smartDetecting ? ' is-loading' : '') +
        '" data-person-replacement-action="toggle-shot-cut-smart-detect" aria-label="' +
        current +
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
  return Object['freeze']({ renderPanel: renderPanel, renderTrigger: renderTrigger });
}
