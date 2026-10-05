import { t } from '../../i18n/index.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&apos;');
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
        '" aria-pressed="' +
        (data === target) +
        '">' +
        escapeHtml(source) +
        '</button>',
    )
    ['join']('');
}
export function createPersonReplacementSmartDetectPresentation({ renderIcon: renderIcon = () => '' } = {}) {
  const renderPanel = (next, { smartDetecting: smartDetecting = false } = {}) =>
      '<div id="person-replacement-shot-cut-smart-detect-panel" class="person-replacement-shot-cut-smart-detect-panel" role="dialog" aria-label="智能检测切口">\n      <strong class="person-replacement-smart-clip-settings-title">智能检测</strong>\n      <div class="person-replacement-smart-clip-setting-row">\n        ' +
      renderSettingLabel(panelText('mode'), panelText('modeTip')) +
      '\n        <div class="person-replacement-smart-clip-option-group" role="group" aria-label="' +
      escapeHtml(panelText('mode')) +
      '">\n          ' +
      renderModeOptions(next['settings']['smartClipMode'], 'set-shot-cut-smart-detect-mode') +
      '\n        </div>\n      </div>\n      <div class="person-replacement-shot-cut-smart-detect-footer">\n        <button type="button" class="story-primary-button person-replacement-shot-cut-smart-detect-confirm ' +
      (smartDetecting ? 'is-loading' : '') +
      '" data-person-replacement-action="confirm-shot-cut-smart-detect" aria-busy="' +
      smartDetecting +
      '" ' +
      (smartDetecting ? 'disabled' : '') +
      '>' +
      (smartDetecting ? '检测中…' : '确定') +
      '</button>\n      </div>\n    </div>',
    renderTrigger = ({
      smartDetectOpen: smartDetectOpen = false,
      smartDetecting: smartDetecting = false,
      disabled: disabled = false,
    } = {}) => {
      const current = smartDetecting ? '智能检测中' : '智能检测';
      return (
        '<span class="person-replacement-shot-cut-smart-detect ' +
        (smartDetectOpen ? 'is-open' : '') +
        '" data-person-replacement-shot-cut-smart-detect>\n      <button type="button" class="person-replacement-secondary-button person-replacement-keyframe-smart-detect' +
        (smartDetecting ? ' is-loading' : '') +
        '" data-person-replacement-action="toggle-shot-cut-smart-detect" aria-label="' +
        current +
        '" aria-haspopup="dialog" aria-controls="person-replacement-shot-cut-smart-detect-panel" aria-expanded="' +
        smartDetectOpen +
        '"' +
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
