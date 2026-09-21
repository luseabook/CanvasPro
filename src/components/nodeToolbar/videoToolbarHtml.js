import { createToolbarDivider, createToolbarIconButton } from './buttonFactory.js';
import { STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG } from './storyboardScriptToolbarIcon.js';
import { t } from '../../i18n/index.js';
function toolbarText(_0x116f48, _0x44dc49 = {}) {
  return t('nodeToolbar.' + _0x116f48, _0x44dc49);
}
const MORE_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  FACE_DETECTION_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="5.5"/><path d="M9.5 10.5h.01"/><path d="M14.5 10.5h.01"/><path d="M9.5 14.5c1.5 1.2 3.5 1.2 5 0"/></svg>',
  VIDEO_TOOLBAR_BUTTON_POOL = [
    createToolbarIconButton({
      action: 'clip',
      tooltip: toolbarText('video.clip'),
      label: toolbarText('video.clip'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    }),
    createToolbarIconButton({
      action: 'reverse',
      tooltip: toolbarText('video.reverse'),
      label: toolbarText('video.reverse'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5v14"/><path d="m11 8-6 4 6 4V8Z"/><path d="m19 8-6 4 6 4V8Z"/></svg>',
    }),
    createToolbarIconButton({
      action: 'extract-keyframes',
      tooltip: toolbarText('video.extractKeyframes'),
      label: toolbarText('video.extractKeyframes'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01"/><path d="m8 15 3-3 2 2 3-4 2 5"/></svg>',
    }),
    createToolbarIconButton({
      action: 'keying',
      tooltip: toolbarText('video.keying'),
      label: toolbarText('video.keying'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h6"/></svg>',
    }),
    createToolbarIconButton({
      action: 'storyboard-script',
      tooltip: toolbarText('video.storyboardScript'),
      label: toolbarText('video.storyboardScript'),
      iconSvg: STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG,
    }),
    createToolbarIconButton({
      action: 'apimart-face-detect',
      tooltip: toolbarText('video.faceDetectTooltip'),
      label: toolbarText('video.faceDetect'),
      iconSvg: FACE_DETECTION_ICON_SVG,
    }),
    createToolbarIconButton({
      action: 'hd',
      tooltip: toolbarText('video.hd'),
      label: toolbarText('video.hd'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 3v18m9-9H3m14.48-6.36L6.52 17.64m10.96 0L6.52 6.36"/></svg>',
    }),
    createToolbarIconButton({
      action: 'replace',
      tooltip: toolbarText('video.frameInterpolation'),
      label: toolbarText('video.frameInterpolation'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.7" cy="7.2" r="2.2"/><path d="M2.7 18.2c.6-2.7 1.7-4 3-4s2.4 1.3 3 4"/><path d="M10.2 7.4c.7-.5 1.9-.5 2.6 0" opacity=".35"/><path d="M9.4 11.4c1.3-.9 3.9-.9 5.2 0" opacity=".6"/><path d="M10.2 15.6c.8-.7 2.8-.7 3.6 0" opacity=".35"/><circle cx="18.3" cy="7.2" r="2.2"/><path d="M15.3 18.2c.6-2.7 1.7-4 3-4s2.4 1.3 3 4"/></svg>',
    }),
    createToolbarIconButton({
      action: 'remove',
      tooltip: toolbarText('video.remove'),
      label: toolbarText('video.remove'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg>',
    }),
    createToolbarIconButton({
      action: 'separate-av',
      tooltip: toolbarText('video.separateAv'),
      label: toolbarText('video.separateAv'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="1.5"/><path d="M7 9v6"/><path d="M15 8v8"/><path d="M18 5v14"/><path d="M21 10v4"/></svg>',
    }),
    createToolbarIconButton({
      action: 'fullscreen',
      tooltip: toolbarText('common.fullscreen'),
      label: toolbarText('common.fullscreen'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
    }),
    createToolbarIconButton({
      action: 'download',
      tooltip: toolbarText('common.download'),
      label: toolbarText('common.download'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    }),
    createToolbarIconButton({
      action: 'reset-size',
      tooltip: toolbarText('common.resetSize'),
      label: toolbarText('common.resetSize'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 0 1 15.36-6.36"/><path d="M21 12a9 9 0 0 1-15.36 6.36"/><polyline points="21 3 21 9 15 9"/><polyline points="3 21 3 15 9 15"/></svg>',
    }),
  ].join('\n      ');
export const VIDEO_TOOLBAR_HTML =
  '\n<div class="node-floating-toolbar v2-video-toolbar">\n  <div class="v2-img-toolbar-main v2-video-toolbar-main">\n    <div class="v2-img-toolbar-zone v2-img-toolbar-zone-primary" data-zone="outside-primary"></div>\n    ' +
  createToolbarIconButton({
    action: 'more-tools',
    tooltip: toolbarText('video.more'),
    label: toolbarText('video.more'),
    iconSvg: MORE_ICON_SVG,
  }) +
  '\n    ' +
  createToolbarDivider().replace('class="ftb-divider"', 'class="ftb-divider v2-img-toolbar-main-divider"') +
  '\n    <div class="v2-img-toolbar-zone v2-img-toolbar-zone-secondary" data-zone="outside-secondary"></div>\n  </div>\n  <div class="v2-img-toolbar-more-menu v2-video-toolbar-more-menu" data-role="more-menu" hidden>\n    <div class="v2-img-toolbar-more-title">' +
  toolbarText('video.moreTools') +
  '</div>\n    <div class="v2-img-toolbar-more-inline">\n      <div class="v2-img-toolbar-zone v2-img-toolbar-zone-more" data-zone="more"></div>\n      <div class="ftb-divider v2-img-toolbar-customize-divider"></div>\n      <button class="ftb-btn v2-img-toolbar-customize-toggle act-customize-tools" type="button" data-tooltip="' +
  toolbarText('video.customizeTip') +
  '" aria-label="' +
  toolbarText('video.customize') +
  '">' +
  toolbarText('video.customize') +
  '</button>\n    </div>\n  </div>\n  <div class="v2-img-toolbar-button-pool v2-video-toolbar-button-pool" data-role="button-pool" hidden>\n      ' +
  VIDEO_TOOLBAR_BUTTON_POOL +
  '\n  </div>\n</div>\n';
