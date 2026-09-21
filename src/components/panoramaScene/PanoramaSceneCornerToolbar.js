import { createToolbarHtml, createToolbarIconButton } from '../nodeToolbar/buttonFactory.js';
import { t } from '../../i18n/index.js';
function panoramaSceneText(_0x261547, _0x4c311b = {}) {
  return t('panoramaSceneNode.' + _0x261547, _0x4c311b);
}
const ICONS = {
  environment:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4"/></svg>',
};
export const PANORAMA_SCENE_CORNER_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: 'v2-panorama-scene-corner-toolbar',
  items: [
    createToolbarIconButton({
      action: 'environment-toggle',
      tooltip: panoramaSceneText('toolbar.switchToNight'),
      label: panoramaSceneText('toolbar.switchEnvironment'),
      iconSvg: ICONS.environment,
      extraClass: 'panorama-scene-env-toggle-btn',
    }),
  ],
});
