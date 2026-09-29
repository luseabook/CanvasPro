import { renderStoryHomeComposerBody } from './storyHomePresentation.js';
import { syncStoryReplicationSelection } from './storyVideoReplicationPresentation.js';
import { resolveWorkspaceCardMultiSelection } from '../workspaceAssetSelection.js';
import { createStoryMarqueeSelectionController } from './storyMarqueeSelection.js';
export function syncStoryReplicationHomeSources(_0x3d4add, _0x3d361f) {
  const _0x2c3398 = _0x3d4add['querySelector']('[data-story-replication-upload-list]');
  if (!_0x2c3398) return;
  const _0x13e3eb = _0x3d4add['ownerDocument']['createElement']('template');
  _0x13e3eb['innerHTML'] = renderStoryHomeComposerBody(_0x3d361f);
  const _0x1d4f3c = _0x13e3eb['content'],
    _0x87848f = _0x1d4f3c['querySelector']('[data-story-replication-upload-list]'),
    _0x5cdb3e = new Map(
      [..._0x2c3398['children']]['map']((_0xf16279) => [
        _0xf16279['dataset']['replicationSourceKey'],
        _0xf16279,
      ]),
    ),
    _0x58eb63 = [..._0x87848f['children']],
    _0x535231 = new Set(_0x58eb63['map']((_0x4cad5a) => _0x4cad5a['dataset']['replicationSourceKey'])),
    _0x51f607 = _0x2c3398['scrollTop'];
  for (const [_0x375c05, _0x3b3113] of _0x5cdb3e) if (!_0x535231['has'](_0x375c05)) _0x3b3113['remove']();
  (_0x58eb63['forEach']((_0x41918b, _0x4d1274) => {
    const _0xbe81f = _0x5cdb3e['get'](_0x41918b['dataset']['replicationSourceKey']),
      _0x493ba3 = _0xbe81f || _0x41918b;
    _0x493ba3['querySelector']('[data-story-replication-file-index]')['dataset'][
      'storyReplicationFileIndex'
    ] = String(_0x4d1274);
    if (_0x2c3398['children'][_0x4d1274] !== _0x493ba3)
      _0x2c3398['insertBefore'](_0x493ba3, _0x2c3398['children'][_0x4d1274] || null);
  }),
    (_0x2c3398['hidden'] = _0x87848f['hidden']),
    (_0x2c3398['scrollTop'] = _0x51f607),
    _0x3d4add['querySelector']('.story-replication-upload')['classList']['toggle'](
      'has-sources',
      !_0x87848f['hidden'],
    ),
    (_0x3d4add['querySelector']('.story-replication-upload-empty')['hidden'] = !_0x87848f['hidden']));
}
export function bindStoryReplicationIntake(
  _0x50f0ed,
  { root: _0x3f1ad6, state: _0x5d6c9b, analyze: _0x380367, sync: _0x5e3d16, persist: _0x3e685c } = {},
) {
  const _0x5aa52e = _0x50f0ed['querySelector']('[data-story-replication-grid]'),
    _0x273bc4 = () =>
      _0x5d6c9b['data']['episodes']['filter']((_0x3e7fa5) =>
        ['pending', 'failed']['includes'](_0x3e7fa5['replication']?.['status']),
      ),
    _0xfe55ef = () =>
      _0x5d6c9b['data']['episodes']['some']((_0x313786) =>
        ['queued', 'uploading', 'analyzing']['includes'](_0x313786['replication']?.['status']),
      ),
    _0x286c58 = () => syncStoryReplicationSelection(_0x50f0ed, _0x5d6c9b),
    _0x214edf = () => _0x50f0ed['closest']('.story-page.is-current') || _0x50f0ed;
  let _0x38aa3b = '';
  const _0x2f9e39 = (_0x3af093) => {
      _0x5d6c9b['replicationSelectionMode'] = _0x3af093['length'] > 0x0;
      for (const _0x11a2da of _0x273bc4())
        _0x11a2da['replication']['selectedForAnalysis'] = _0x3af093['includes'](_0x11a2da['id']);
      (_0x286c58(), _0x5e3d16(), _0x3e685c());
    },
    _0x4ba4d9 = () => {
      _0x5d6c9b['replicationSelectionMode'] = ![];
      for (const _0x50220e of _0x5d6c9b['data']['episodes'])
        _0x50220e['replication']['selectedForAnalysis'] = ![];
      (_0x286c58(), _0x5e3d16(), _0x3e685c());
    },
    _0x5e3de5 = _0x5aa52e
      ? createStoryMarqueeSelectionController({
          root: _0x3f1ad6,
          documentObject: _0x50f0ed['ownerDocument'],
          windowObject: _0x50f0ed['ownerDocument']['defaultView'],
          surfaceSelector: '[data-story-replication-grid]',
          itemSelector: '.story-replication-card:is(.is-pending, .is-failed)',
          resolveSurface: (_0x4ca9ed) => (_0x214edf()['contains'](_0x4ca9ed['target']) ? _0x214edf() : null),
          blockedControlSelector:
            "button, input, textarea, select, a, [contenteditable='true'], [draggable='true']",
          getItemId: (_0x450879) => _0x450879['dataset']['storyReplicationEpisodeId'],
          getConfig: () => ({
            enabled: !_0xfe55ef(),
            selectedIds: _0x273bc4()
              ['filter']((_0x3d4de2) => _0x3d4de2['replication']['selectedForAnalysis'])
              ['map']((_0x2476a0) => _0x2476a0['id']),
            commit: _0x2f9e39,
          }),
        })
      : null,
    _0x12aa80 = (_0x1cfe61) => _0x5e3de5?.['begin'](_0x1cfe61),
    _0x991e4b = (_0x5481d5) => {
      if (_0x5481d5['key'] === 'Escape' && _0x5d6c9b['replicationSelectionMode']) _0x4ba4d9();
    },
    _0x20733e = (_0x56c479) => {
      if (_0x5e3de5?.['consumeClick'](_0x56c479)) return;
      if (
        _0x214edf()['contains'](_0x56c479['target']) &&
        !_0x56c479['target']['closest'](
          'button, input, textarea, select, a, [contenteditable="true"], .story-replication-card',
        ) &&
        _0x5d6c9b['replicationSelectionMode']
      ) {
        _0x4ba4d9();
        return;
      }
      const _0xa2e55e = _0x56c479['target']['closest']('[data-replication-selection]');
      if (_0xa2e55e && !_0xa2e55e['disabled']) {
        const _0x239dd2 = _0xa2e55e['dataset']['replicationSelection'];
        if (_0x239dd2 === 'all')
          _0x2f9e39(
            _0x273bc4()['every']((_0x334730) => _0x334730['replication']['selectedForAnalysis'])
              ? []
              : _0x273bc4()['map']((_0x317102) => _0x317102['id']),
          );
        return;
      }
      const _0x1492c9 = _0x56c479['target']['closest']('[data-replication-card-action]');
      if (_0x1492c9 && !_0x1492c9['disabled']) {
        const _0x50f78c = _0x1492c9['dataset']['replicationCardAction'];
        if (
          !_0x1492c9['hasAttribute']('data-replication-open') ||
          _0x56c479['shiftKey'] ||
          _0x56c479['ctrlKey'] ||
          _0x56c479['metaKey']
        ) {
          if (!_0x273bc4()['some']((_0x31d18b) => _0x31d18b['id'] === _0x50f78c) || _0xfe55ef()) return;
          _0x56c479['stopImmediatePropagation']();
          const _0x4399e5 = resolveWorkspaceCardMultiSelection({
            selectedIds: _0x273bc4()
              ['filter']((_0x2a9aaa) => _0x2a9aaa['replication']['selectedForAnalysis'])
              ['map']((_0x16ef46) => _0x16ef46['id']),
            itemId: _0x50f78c,
            activeItemId: _0x38aa3b,
            orderedIds: _0x273bc4()['map']((_0x131cb9) => _0x131cb9['id']),
            toggleKey: _0x56c479['ctrlKey'] || _0x56c479['metaKey'],
            shiftKey: _0x56c479['shiftKey'],
          });
          if (!_0x56c479['shiftKey']) _0x38aa3b = _0x50f78c;
          _0x2f9e39(_0x4399e5['selectedIds']);
        }
        return;
      }
      const _0x5552a8 = _0x56c479['target']['closest'](
        '[data-replication-analyze],\x20[data-story-action=\x27analyze-all-replication\x27]',
      );
      if (!_0x5552a8 || _0x5552a8['disabled']) return;
      void _0x380367({
        all:
          _0x5552a8['dataset']['replicationAnalyze'] === 'all' ||
          _0x5552a8['dataset']['storyAction'] === 'analyze-all-replication',
      });
    };
  return (
    _0x50f0ed['addEventListener']('click', _0x20733e),
    _0x3f1ad6['addEventListener']('pointerdown', _0x12aa80),
    _0x50f0ed['addEventListener']('keydown', _0x991e4b),
    _0x50f0ed['addEventListener']('story-replication-updated', _0x286c58),
    _0x286c58(),
    {
      destroy() {
        (_0x5e3de5?.['destroy'](),
          _0x3f1ad6['removeEventListener']('pointerdown', _0x12aa80),
          _0x50f0ed['removeEventListener']('keydown', _0x991e4b),
          _0x50f0ed['removeEventListener']('story-replication-updated', _0x286c58),
          _0x50f0ed['removeEventListener']('click', _0x20733e));
      },
    }
  );
}
