import { createToolbarHtml, createToolbarIconButton } from './buttonFactory.js';
import { STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG } from './storyboardScriptToolbarIcon.js';
import { t } from '../../i18n/index.js';
function textToolbarText(value) {
  return t('nodeToolbar.text.' + value);
}
export const TEXT_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: 'v2-text-toolbar',
  items: [
    createToolbarIconButton({
      action: 'copy',
      tooltip: textToolbarText('copy'),
      label: textToolbarText('copy'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    }),
    createToolbarIconButton({
      action: 'clear-empty-lines',
      tooltip: textToolbarText('clearEmptyLines'),
      label: textToolbarText('clearEmptyLines'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h8"/><path d="M18 15l3 3"/><path d="M21 15l-3 3"/></svg>',
    }),
    createToolbarIconButton({
      action: 'storyboard-script',
      tooltip: textToolbarText('storyboardScript'),
      label: textToolbarText('storyboardScript'),
      iconSvg: STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG,
    }),
    createToolbarIconButton({
      action: 'fullscreen',
      tooltip: textToolbarText('fullscreen'),
      label: textToolbarText('fullscreen'),
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
    }),
  ],
});
