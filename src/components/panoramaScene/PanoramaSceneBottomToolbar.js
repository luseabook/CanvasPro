import { createToolbarHtml, createToolbarIconButton } from '../nodeToolbar/buttonFactory.js';
import { t } from '../../i18n/index.js';
function panoramaSceneText(_0x480895, _0x4434e0 = {}) {
  return t('panoramaSceneNode.' + _0x480895, _0x4434e0);
}
const ICONS = {
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m12 2 8 4.5v11L12 22 4 17.5v-11L12 2Z"/><path d="M12 22V11.5"/><path d="M20 6.5 12 11.5 4 6.5"/></svg>',
  mannequin:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="5" r="2.5"/><path d="M12 8v7"/><path d="M8.5 12.5 12 9l3.5 3.5"/><path d="M9 21l3-6 3 6"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18M15 3v18M3 15h18"/></svg>',
  capture:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 8h3l2-2h6l2 2h3v10H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  camera:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 7h12a2 2 0 0 1 2 2v8H4z"/><path d="m16 11 4-2v8l-4-2"/><circle cx="10" cy="13" r="2.5"/></svg>',
  focus:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 4v3"/><path d="M12 17v3"/><path d="M4 12h3"/><path d="M17 12h3"/><circle cx="12" cy="12" r="4"/></svg>',
  reset:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
};
export const PANORAMA_SCENE_BOTTOM_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: 'panorama-scene-fixed-toolbar',
  items: [
    createToolbarIconButton({
      action: 'cube',
      tooltip: panoramaSceneText('toolbar.createCube'),
      label: panoramaSceneText('toolbar.createCube'),
      iconSvg: ICONS.cube,
      extraClass: 'panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--cube',
    }),
    createToolbarIconButton({
      action: 'mannequin-entry',
      tooltip: panoramaSceneText('toolbar.mannequin'),
      label: panoramaSceneText('toolbar.mannequin'),
      iconSvg: ICONS.mannequin,
      extraClass: 'panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--mannequin',
    }),
    createToolbarIconButton({
      action: 'grid',
      tooltip: panoramaSceneText('toolbar.grid'),
      label: panoramaSceneText('toolbar.grid'),
      iconSvg: ICONS.grid,
      extraClass: 'panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--grid',
    }),
    createToolbarIconButton({
      action: 'capture',
      tooltip: panoramaSceneText('toolbar.capture'),
      label: panoramaSceneText('toolbar.capture'),
      iconSvg: ICONS.capture,
      extraClass: 'panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--capture',
    }),
    createToolbarIconButton({
      action: 'camera',
      tooltip: panoramaSceneText('toolbar.createCameraBookmark'),
      label: panoramaSceneText('toolbar.createCameraBookmark'),
      iconSvg: ICONS.camera,
      extraClass: 'panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--camera',
    }),
    createToolbarIconButton({
      action: 'focus',
      tooltip: panoramaSceneText('toolbar.focus'),
      label: panoramaSceneText('toolbar.focus'),
      iconSvg: ICONS.focus,
      extraClass: 'panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--focus',
    }),
    createToolbarIconButton({
      action: 'reset-view',
      tooltip: panoramaSceneText('toolbar.resetView'),
      label: panoramaSceneText('toolbar.resetView'),
      iconSvg: ICONS.reset,
      extraClass: 'panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--reset',
    }),
  ],
});
