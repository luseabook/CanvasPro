import { t } from '../../i18n/index.js';
import { createContextMenuIcon } from '../../modules/interaction/contextMenuIcons.js';
import { getShortcutLabel } from '../../modules/shortcuts.js';
import { stopPointer, toNumber } from './mediaClipUtils.js';
function mediaClipText(value, item = {}) {
  return t('mediaClip.' + value, item);
}
function createMaterialMenuRow(key, index, result, handler) {
  const el = document['createElement']('div');
  ((el['className'] = 'v2-menu-row'),
    el['setAttribute']('role', 'menuitem'),
    (el['tabIndex'] = -1),
    (el['dataset']['shortcutAction'] = result));
  const el2 = document['createElement']('span');
  ((el2['className'] = 'v2-menu-leading-icon'), el2['setAttribute']('aria-hidden', 'true'));
  const contextMenuIcon = createContextMenuIcon(index);
  if (contextMenuIcon) el2['appendChild'](contextMenuIcon);
  const el3 = document['createElement']('span');
  ((el3['textContent'] = key), el['appendChild'](el2), el['appendChild'](el3));
  const shortcutLabel = getShortcutLabel(result);
  if (shortcutLabel) {
    const el4 = document['createElement']('span');
    ((el4['className'] = 'v2-menu-kbd'), (el4['textContent'] = shortcutLabel), el['appendChild'](el4));
  }
  return (
    (el['__contextMenuShortcutActivate'] = handler),
    el['addEventListener']('pointerdown', (event) => {
      if (event['button'] !== 0) return;
      (stopPointer(event), handler(event));
    }),
    el
  );
}
export function renderMediaClipMaterialMenu(data) {
  const options = data['_materialMenu'] || {},
    el5 = document['createElement']('div');
  ((el5['className'] = 'v2-canvas-ctx-menu media-clip-material-menu'),
    el5['setAttribute']('role', 'menu'),
    (el5['dataset']['uiStop'] = 'true'),
    el5['appendChild'](
      createMaterialMenuRow(
        mediaClipText('materialMenu.exportToCanvas'),
        'add-to-canvas',
        'context-media-clip-export-to-canvas',
        async () => {
          if (data['_exporting'] === true) return;
          const { kind: kind, clipIndex: clipIndex } = data['_materialMenu'] || options;
          (data['_closeMaterialMenu']({ render: false }),
            await data['_exportMaterialToCanvas'](kind, clipIndex));
        },
      ),
    ));
  const el6 =
    options['kind'] === 'audio'
      ? data['_audioTimelineClips'](data['_mediaClip']['tracks']?.['audio'])[
          Math['max'](0, Math['trunc'](toNumber(options['clipIndex'], 0)))
        ] || null
      : null;
  return (
    el6 &&
      el5['appendChild'](
        createMaterialMenuRow(
          mediaClipText(el6['disabled'] === true ? 'materialMenu.enable' : 'materialMenu.disable'),
          el6['disabled'] === true ? 'enable' : 'disable',
          el6['disabled'] === true ? 'context-media-clip-enable-audio' : 'context-media-clip-disable-audio',
          () => {
            const { clipIndex: clipIndex2 } = data['_materialMenu'] || options;
            (data['_closeMaterialMenu']({ render: false }), data['_toggleAudioClipDisabled'](clipIndex2));
          },
        ),
      ),
    el5['appendChild'](
      createMaterialMenuRow(
        mediaClipText('materialMenu.delete'),
        'delete',
        'context-media-clip-delete',
        () => {
          const { kind: kind2, clipIndex: clipIndex3 } = data['_materialMenu'] || options;
          (data['_closeMaterialMenu']({ render: false }), data['_deleteMaterial'](kind2, clipIndex3));
        },
      ),
    ),
    el5
  );
}
