import { createToolbarIconButton } from './buttonFactory.js';
import { t } from '../../i18n/index.js';
function toolbarText(value) {
  return t('nodeToolbar.' + value);
}
const MORE_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  FACE_DETECTION_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="5.5"/><path d="M9.5 10.5h.01"/><path d="M14.5 10.5h.01"/><path d="M9.5 14.5c1.5 1.2 3.5 1.2 5 0"/></svg>',
  IMAGE_TOOLBAR_BUTTON_POOL = [
    createToolbarIconButton({
      action: 'matting',
      tooltip: toolbarText('image.matting'),
      label: toolbarText('image.matting'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="12" cy="12" r="5"/><path d="M12 7A5 5 0 0 1 12 17L12 7Z" fill="currentColor" fill-opacity="0.28" stroke="none"/><path d="M7 17l2-2"/><path d="M8.5 18.5l-1-1"/></svg>',
    }),
    createToolbarIconButton({
      action: 'repaint',
      tooltip: toolbarText('image.repaint'),
      label: toolbarText('image.repaint'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3.5" y="4.5" width="13" height="13" rx="2"/><path d="m3.5 14 3-3a2 2 0 0 1 2.8 0L12 13.7"/><path d="M18.5 3.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" fill="currentColor" stroke="none"/><path d="m14 18 5-5 2 2-5 5-3 1 1-3Z"/></svg>',
    }),
    createToolbarIconButton({
      action: 'erase',
      tooltip: toolbarText('image.erase'),
      label: toolbarText('image.erase'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 20H7l-4.5-4.5a2.1 2.1 0 0 1 0-3L11 4a2.1 2.1 0 0 1 3 0l7.5 7.5a2.1 2.1 0 0 1 0 3L16 20"/><path d="m6.5 9.5 8 8"/></svg>',
    }),
    createToolbarIconButton({
      action: 'hd',
      tooltip: toolbarText('image.hd'),
      label: toolbarText('image.hd'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 3v18m9-9H3m14.48-6.36L6.52 17.64m10.96 0L6.52 6.36"/></svg>',
    }),
    createToolbarIconButton({
      action: 'expand',
      tooltip: toolbarText('image.expand'),
      label: toolbarText('image.expand'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    }),
    createToolbarIconButton({
      action: 'auto-subject',
      tooltip: toolbarText('image.autoSubject'),
      label: toolbarText('image.autoSubject'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    }),
    createToolbarIconButton({
      action: 'apimart-face-detect',
      tooltip: toolbarText('image.faceDetectTooltip'),
      label: toolbarText('image.faceDetect'),
      iconSvg: FACE_DETECTION_ICON_SVG,
    }),
    createToolbarIconButton({
      action: 'panorama-360',
      tooltip: toolbarText('image.panorama360'),
      label: toolbarText('image.panorama360'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4a12 12 0 0 0 0 16"/><path d="M12 4a12 12 0 0 1 0 16"/><path d="M3 8c3-2 6-3 9-3s6 1 9 3"/><path d="M3 16c3 2 6 3 9 3s6-1 9-3"/></svg>',
    }),
    createToolbarIconButton({
      action: 'multigrid',
      tooltip: toolbarText('image.multigrid'),
      label: toolbarText('image.multigrid'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    }),
    createToolbarIconButton({
      action: 'multiangle',
      tooltip: toolbarText('image.multiangle'),
      label: toolbarText('image.multiangle'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/><path d="M12 12 3.27 7.73"/><path d="M12 12l8.73-4.27"/></svg>',
    }),
    createToolbarIconButton({
      action: 'annotate',
      tooltip: toolbarText('image.annotate'),
      label: toolbarText('image.annotate'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    }),
    createToolbarIconButton({
      action: 'crop',
      tooltip: toolbarText('image.crop'),
      label: toolbarText('image.crop'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
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
export const IMAGE_TOOLBAR_HTML =
  '\n<div class="node-floating-toolbar v2-img-toolbar">\n  <div class="v2-img-toolbar-main">\n    <div class="v2-img-toolbar-zone v2-img-toolbar-zone-primary" data-zone="outside-primary"></div>\n    ' +
  createToolbarIconButton({
    action: 'more-tools',
    tooltip: toolbarText('image.more'),
    label: toolbarText('image.more'),
    iconSvg: MORE_ICON_SVG,
  }) +
  '\n    <div class="ftb-divider v2-img-toolbar-main-divider"></div>\n    <div class="v2-img-toolbar-zone v2-img-toolbar-zone-secondary" data-zone="outside-secondary"></div>\n  </div>\n  <div class="v2-img-toolbar-more-menu" data-role="more-menu" hidden>\n    <div class="v2-img-toolbar-more-title">' +
  toolbarText('image.moreTools') +
  '</div>\n    <div class="v2-img-toolbar-more-inline">\n      <div class="v2-img-toolbar-zone v2-img-toolbar-zone-more" data-zone="more"></div>\n      <div class="ftb-divider v2-img-toolbar-customize-divider"></div>\n      <button class="ftb-btn v2-img-toolbar-customize-toggle act-customize-tools" type="button" data-tooltip="' +
  toolbarText('image.customizeTip') +
  '" aria-label="' +
  toolbarText('image.customize') +
  '">' +
  toolbarText('image.customize') +
  '</button>\n    </div>\n  </div>\n  <div class="v2-img-toolbar-button-pool" data-role="button-pool" hidden>\n      ' +
  IMAGE_TOOLBAR_BUTTON_POOL +
  '\n  </div>\n</div>\n';
