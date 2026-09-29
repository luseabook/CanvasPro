import { t } from '../../i18n/index.js';
import { createContextMenuIcon } from '../../modules/interaction/contextMenuIcons.js';
import { getShortcutLabel } from '../../modules/shortcuts.js';
import { stopPointer, toNumber } from './mediaClipUtils.js';
function mediaClipText(_0xbdfaf9, _0xb3cbcc = {}) {
  return t('mediaClip.' + _0xbdfaf9, _0xb3cbcc);
}
function createMaterialMenuRow(_0x3977ad, _0x309787, _0x53ca14, _0x6d9b85) {
  const _0x58e88e = document['createElement']('div');
  ((_0x58e88e['className'] = 'v2-menu-row'),
    _0x58e88e['setAttribute']('role', 'menuitem'),
    (_0x58e88e['tabIndex'] = -0x1),
    (_0x58e88e['dataset']['shortcutAction'] = _0x53ca14));
  const _0x2b81a6 = document['createElement']('span');
  ((_0x2b81a6['className'] = 'v2-menu-leading-icon'), _0x2b81a6['setAttribute']('aria-hidden', 'true'));
  const _0x31e231 = createContextMenuIcon(_0x309787);
  if (_0x31e231) _0x2b81a6['appendChild'](_0x31e231);
  const _0x29b9ce = document['createElement']('span');
  ((_0x29b9ce['textContent'] = _0x3977ad),
    _0x58e88e['appendChild'](_0x2b81a6),
    _0x58e88e['appendChild'](_0x29b9ce));
  const _0x3ada99 = getShortcutLabel(_0x53ca14);
  if (_0x3ada99) {
    const _0x5854ca = document['createElement']('span');
    ((_0x5854ca['className'] = 'v2-menu-kbd'),
      (_0x5854ca['textContent'] = _0x3ada99),
      _0x58e88e['appendChild'](_0x5854ca));
  }
  return (
    (_0x58e88e['__contextMenuShortcutActivate'] = _0x6d9b85),
    _0x58e88e['addEventListener']('pointerdown', (_0x3eccec) => {
      if (_0x3eccec['button'] !== 0x0) return;
      (stopPointer(_0x3eccec), _0x6d9b85(_0x3eccec));
    }),
    _0x58e88e
  );
}
export function renderMediaClipMaterialMenu(_0x1e97a5) {
  const _0x2b95fd = _0x1e97a5['_materialMenu'] || {},
    _0x8fb31b = document['createElement']('div');
  ((_0x8fb31b['className'] = 'v2-canvas-ctx-menu\x20media-clip-material-menu'),
    _0x8fb31b['setAttribute']('role', 'menu'),
    (_0x8fb31b['dataset']['uiStop'] = 'true'),
    _0x8fb31b['appendChild'](
      createMaterialMenuRow(
        mediaClipText('materialMenu.exportToCanvas'),
        'add-to-canvas',
        'context-media-clip-export-to-canvas',
        async () => {
          if (_0x1e97a5['_exporting'] === !![]) return;
          const { kind: _0x44c361, clipIndex: _0x377d54 } = _0x1e97a5['_materialMenu'] || _0x2b95fd;
          (_0x1e97a5['_closeMaterialMenu']({ render: ![] }),
            await _0x1e97a5['_exportMaterialToCanvas'](_0x44c361, _0x377d54));
        },
      ),
    ));
  const _0x4336f7 =
    _0x2b95fd['kind'] === 'audio'
      ? _0x1e97a5['_audioTimelineClips'](_0x1e97a5['_mediaClip']['tracks']?.['audio'])[
          Math['max'](0x0, Math['trunc'](toNumber(_0x2b95fd['clipIndex'], 0x0)))
        ] || null
      : null;
  return (
    _0x4336f7 &&
      _0x8fb31b['appendChild'](
        createMaterialMenuRow(
          mediaClipText(_0x4336f7['disabled'] === !![] ? 'materialMenu.enable' : 'materialMenu.disable'),
          _0x4336f7['disabled'] === !![] ? 'enable' : 'disable',
          _0x4336f7['disabled'] === !![]
            ? 'context-media-clip-enable-audio'
            : 'context-media-clip-disable-audio',
          () => {
            const { clipIndex: _0x165737 } = _0x1e97a5['_materialMenu'] || _0x2b95fd;
            (_0x1e97a5['_closeMaterialMenu']({ render: ![] }),
              _0x1e97a5['_toggleAudioClipDisabled'](_0x165737));
          },
        ),
      ),
    _0x8fb31b['appendChild'](
      createMaterialMenuRow(
        mediaClipText('materialMenu.delete'),
        'delete',
        'context-media-clip-delete',
        () => {
          const { kind: _0x181b87, clipIndex: _0x1dba2c } = _0x1e97a5['_materialMenu'] || _0x2b95fd;
          (_0x1e97a5['_closeMaterialMenu']({ render: ![] }),
            _0x1e97a5['_deleteMaterial'](_0x181b87, _0x1dba2c));
        },
      ),
    ),
    _0x8fb31b
  );
}
