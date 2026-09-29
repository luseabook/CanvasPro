import { t } from '../../i18n/index.js';
import { formatCleanupBytes } from '../../services/localAssetCleanupService.js';
const PAGE_SIZE = 0x32,
  text = (_0x4cd846, _0x30472b = {}) => t('settings.fileSave.cleanupRuntime.' + _0x4cd846, _0x30472b);
export function createLocalAssetCleanupList({
  list: _0x2df221,
  toolbar: _0x4c629b,
  details: _0xd0c756,
  onSelectionChange: _0x10c707,
}) {
  let _0x1ea1ff = null,
    _0x44fcd4 = 0x0,
    _0x249ad0 = ![];
  const _0x149150 = new Set(),
    _0x3851c2 = new Map(),
    _0x561ed0 = document['createElement']('span');
  ((_0x561ed0['className'] = 'settings-desc'),
    _0x561ed0['setAttribute']('aria-live', 'polite'),
    _0x4c629b['appendChild'](_0x561ed0));
  function _0x188736(_0x4d79da, _0x57efd6) {
    const _0x22110c = document['createElement']('button');
    return (
      (_0x22110c['type'] = 'button'),
      (_0x22110c['className'] = 'settings-save-btn\x20settings-btn-ghost'),
      (_0x22110c['textContent'] = text(_0x4d79da)),
      (_0x22110c['dataset']['cleanupAction'] = _0x4d79da),
      _0x22110c['addEventListener']('click', () => {
        if (!_0x22110c['disabled']) _0x57efd6();
      }),
      _0x4c629b['appendChild'](_0x22110c),
      _0x22110c
    );
  }
  const _0x5cab88 = () =>
      (_0x1ea1ff?.['items'] || [])['slice'](_0x44fcd4 * PAGE_SIZE, (_0x44fcd4 + 0x1) * PAGE_SIZE),
    _0x54d968 = () =>
      (_0x1ea1ff?.['items'] || [])['filter']((_0x8750f6) => _0x149150['has'](_0x8750f6['localPath'])),
    _0x37c454 = _0x188736('selectPage', () => {
      (_0x5cab88()['forEach']((_0x3ef92b) => _0x149150['add'](_0x3ef92b['localPath'])), _0x2206ec());
    }),
    _0xe3fc17 = _0x188736('clearSelection', () => {
      (_0x149150['clear'](), _0x2206ec());
    }),
    _0x246be4 = _0x188736('previousPage', () => {
      (_0x44fcd4--, _0x28c3b2());
    }),
    _0x1dda36 = document['createElement']('span');
  ((_0x1dda36['className'] = 'settings-desc'), _0x4c629b['appendChild'](_0x1dda36));
  const _0x3df5f6 = _0x188736('nextPage', () => {
    (_0x44fcd4++, _0x28c3b2());
  });
  function _0x2206ec() {
    const _0x13c648 = _0x54d968(),
      _0x15d728 = _0x1ea1ff?.['ok'] === !![] && _0x1ea1ff?.['canTrash'] !== ![] && !_0x249ad0;
    ((_0x561ed0['textContent'] = text('selectedSummary', {
      count: _0x13c648['length'],
      bytes: formatCleanupBytes(
        _0x13c648['reduce']((_0x429e7e, _0x4c6c2b) => _0x429e7e + Number(_0x4c6c2b['size'] || 0x0), 0x0),
      ),
    })),
      (_0x37c454['disabled'] = !_0x15d728 || !_0x5cab88()['length']),
      (_0xe3fc17['disabled'] = _0x249ad0 || !_0x149150['size']),
      (_0x246be4['disabled'] = _0x249ad0 || _0x44fcd4 === 0x0),
      (_0x3df5f6['disabled'] =
        _0x249ad0 || (_0x44fcd4 + 0x1) * PAGE_SIZE >= (_0x1ea1ff?.['items']?.['length'] || 0x0)),
      (_0x1dda36['textContent'] = text('pageSummary', {
        page: _0x44fcd4 + 0x1,
        pages: Math['max'](0x1, Math['ceil']((_0x1ea1ff?.['items']?.['length'] || 0x0) / PAGE_SIZE)),
      })));
    for (const [_0x4aa6e8, _0x388398] of _0x3851c2) {
      ((_0x388398['checked'] = _0x149150['has'](_0x4aa6e8)), (_0x388398['disabled'] = !_0x15d728));
    }
    _0x10c707(_0x15d728 ? _0x13c648 : []);
  }
  function _0x28c3b2() {
    (_0x3851c2['clear'](),
      _0x2df221['replaceChildren'](),
      (_0x2df221['hidden'] = !_0x1ea1ff?.['items']?.['length']),
      (_0x4c629b['hidden'] = _0x2df221['hidden']));
    for (const _0x57971a of _0x5cab88()) {
      const _0x1bb6b7 = document['createElement']('label');
      _0x1bb6b7['className'] = 'settings-local-cleanup-item';
      const _0x5f078d = document['createElement']('input');
      ((_0x5f078d['type'] = 'checkbox'),
        (_0x5f078d['className'] = 'settings-local-cleanup-checkbox'),
        _0x5f078d['setAttribute']('aria-label', text('selectFile', { path: _0x57971a['localPath'] })),
        _0x5f078d['addEventListener']('change', () => {
          if (_0x5f078d['disabled']) return;
          if (_0x5f078d['checked']) _0x149150['add'](_0x57971a['localPath']);
          else _0x149150['delete'](_0x57971a['localPath']);
          _0x2206ec();
        }),
        _0x3851c2['set'](_0x57971a['localPath'], _0x5f078d));
      const _0x37627f = document['createElement']('div');
      _0x37627f['className'] = 'settings-local-cleanup-info';
      const _0x2870b8 = document['createElement']('div');
      ((_0x2870b8['className'] = 'settings-local-cleanup-filename'),
        (_0x2870b8['textContent'] = _0x57971a['localPath']['split']('/')['pop']()));
      const _0x491b8d = document['createElement']('div');
      ((_0x491b8d['className'] = 'settings-local-cleanup-path'),
        (_0x491b8d['textContent'] = _0x57971a['absolutePath'] || _0x57971a['localPath']),
        (_0x491b8d['dataset']['tooltip'] = _0x491b8d['textContent']),
        (_0x491b8d['dataset']['tooltipOverflow'] = 'true'),
        _0x37627f['appendChild'](_0x2870b8),
        _0x37627f['appendChild'](_0x491b8d));
      const _0x15d0d5 = document['createElement']('span');
      _0x15d0d5['className'] = 'settings-local-cleanup-meta';
      const _0x4cfacf = ['image', 'video', 'audio', 'waveform']['includes'](_0x57971a['kind'])
        ? _0x57971a['kind']
        : 'media';
      ((_0x15d0d5['textContent'] =
        text('kinds.' + _0x4cfacf) + ' · ' + formatCleanupBytes(_0x57971a['size'])),
        _0x1bb6b7['appendChild'](_0x5f078d),
        _0x1bb6b7['appendChild'](_0x37627f),
        _0x1bb6b7['appendChild'](_0x15d0d5),
        _0x2df221['appendChild'](_0x1bb6b7));
    }
    ((_0x2df221['scrollTop'] = 0x0), _0x2206ec());
  }
  return {
    selectedItems: _0x54d968,
    setBusy(_0xc31385) {
      ((_0x249ad0 = _0xc31385), _0x2206ec());
    },
    setScan(_0x2c379f) {
      ((_0x1ea1ff = _0x2c379f), _0x149150['clear'](), (_0x44fcd4 = 0x0));
      const _0x585fa0 = _0x1ea1ff?.['coverage'],
        _0x4c8bf4 = _0x1ea1ff ? [text('scopeNotice')] : [];
      if (_0x585fa0) {
        _0x4c8bf4['push'](
          text('scopeProjects', {
            count: _0x585fa0['projectFiles'] || 0x0,
            path: _0x585fa0['canvasDirectory'] || '—',
          }),
        );
        for (const _0x3d8730 of _0x585fa0['mediaDirectories'] || [])
          _0x4c8bf4['push'](_0x3d8730['prefix'] + ' → ' + _0x3d8730['path']);
      }
      for (const _0x2f4944 of _0x1ea1ff?.['warnings'] || [])
        _0x4c8bf4['push'](_0x2f4944['source'] + ':\x20' + _0x2f4944['message']);
      ((_0xd0c756['textContent'] = _0x4c8bf4['join']('\x0a')),
        (_0xd0c756['hidden'] = !_0x4c8bf4['length']),
        _0x28c3b2());
    },
  };
}
