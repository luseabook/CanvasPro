import { isNodeType } from '../modules/registry.js';
import { getMediaComposeButtonLabel, getSelectedMediaComposeKind } from '../modules/mediaComposeSelection.js';
import {
  hasBatchExportableSelection,
  isNodeBatchExportPending,
  subscribeNodeBatchExportPending,
} from '../modules/nodeBatchExport.js';
import { hasMaterialComparisonPair } from '../modules/materialComparisonEntries.js';
import {
  getSelectedSyncPlayableVideoCount,
  getSyncVideoPlaybackState,
  subscribeSyncVideoPlaybackState,
} from '../modules/videoSyncPlayback.js';
import { t } from '../i18n/index.js';
import { computeSelectionBounds, getAlignableSelectionNodes } from './math.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
function createSvg(_0x4eade3 = '2') {
  const _0x288f4f = document['createElementNS'](SVG_NS, 'svg');
  return (
    _0x288f4f['setAttribute']('viewBox', '0 0 24 24'),
    _0x288f4f['setAttribute']('fill', 'none'),
    _0x288f4f['setAttribute']('stroke', 'currentColor'),
    _0x288f4f['setAttribute']('stroke-width', _0x4eade3),
    _0x288f4f['setAttribute']('stroke-linecap', 'round'),
    _0x288f4f['setAttribute']('stroke-linejoin', 'round'),
    _0x288f4f
  );
}
function appendPath(_0x521f30, _0x39c3bf) {
  const _0x164e02 = document['createElementNS'](SVG_NS, 'path');
  return (_0x164e02['setAttribute']('d', _0x39c3bf), _0x521f30['appendChild'](_0x164e02), _0x164e02);
}
function createIconButton(_0x5b8e16, _0x579e33, _0x464069) {
  const _0x3d1871 = document['createElement']('button');
  return (
    (_0x3d1871['type'] = 'button'),
    (_0x3d1871['className'] = 'v2-multi-select-btn'),
    (_0x3d1871['dataset']['uiAction'] = _0x5b8e16),
    (_0x3d1871['title'] = _0x579e33),
    _0x3d1871['setAttribute']('aria-label', _0x579e33),
    _0x3d1871['replaceChildren'](_0x464069),
    _0x3d1871
  );
}
function syncVideoPlaybackButtonPresentation(_0x1e9cdf, _0xf43611 = {}) {
  if (!_0x1e9cdf) return ![];
  const _0x3a5d33 = _0xf43611?.['active'] === !![],
    _0x869051 = t(
      _0x3a5d33
        ? 'coreUi.renderer.multiSelect.syncVideoPause'
        : 'coreUi.renderer.multiSelect.syncVideoPlayHint',
    ),
    _0x33c7de = _0x3a5d33 ? 'playing' : 'idle';
  if (
    _0x1e9cdf['dataset']['syncPlaybackState'] === _0x33c7de &&
    _0x1e9cdf['getAttribute']('aria-label') === _0x869051
  )
    return _0x3a5d33;
  (_0x1e9cdf['classList']['toggle']('is-playing', _0x3a5d33),
    _0x1e9cdf['setAttribute']('aria-pressed', _0x3a5d33 ? 'true' : 'false'),
    _0x1e9cdf['setAttribute']('aria-label', _0x869051));
  if (_0x1e9cdf['hasAttribute']?.('title')) _0x1e9cdf['setAttribute']('title', _0x869051);
  ((_0x1e9cdf['dataset']['tooltip'] = _0x869051), (_0x1e9cdf['dataset']['syncPlaybackState'] = _0x33c7de));
  const _0x19505e = _0x1e9cdf['querySelector']('[data-sync-video-icon=\x22play\x22]'),
    _0x2ac5cf = _0x1e9cdf['querySelector']('[data-sync-video-icon=\x22pause\x22]');
  if (_0x19505e?.['style']) _0x19505e['style']['display'] = _0x3a5d33 ? 'none' : '';
  if (_0x2ac5cf?.['style']) _0x2ac5cf['style']['display'] = _0x3a5d33 ? '' : 'none';
  return _0x3a5d33;
}
function createMultiSelectBoxEl() {
  const _0x493e7d = document['createElement']('div');
  ((_0x493e7d['id'] = 'v2-multi-select-box'), (_0x493e7d['className'] = 'v2-multi-select-box'));
  const _0x4862ba = document['createElement']('div');
  ((_0x4862ba['className'] = 'v2-multi-select-tab'), (_0x4862ba['dataset']['uiStop'] = '1'));
  const _0x1d4602 = createSvg('2.5');
  _0x1d4602['dataset']['syncVideoIcon'] = 'play';
  const _0x44b04d = document['createElementNS'](SVG_NS, 'polygon');
  (_0x44b04d['setAttribute']('points', '5 3 19 12 5 21 5 3'), _0x1d4602['appendChild'](_0x44b04d));
  const _0x296875 = createIconButton(
      'ms-sync-video-play',
      t('coreUi.renderer.multiSelect.syncVideoPlay'),
      _0x1d4602,
    ),
    _0x5bfb59 = createSvg('2.5');
  _0x5bfb59['dataset']['syncVideoIcon'] = 'pause';
  for (const _0x17cbba of [0x6, 0xe]) {
    const _0x4cb343 = document['createElementNS'](SVG_NS, 'rect');
    (_0x4cb343['setAttribute']('x', String(_0x17cbba)),
      _0x4cb343['setAttribute']('y', '4'),
      _0x4cb343['setAttribute']('width', '4'),
      _0x4cb343['setAttribute']('height', '16'),
      _0x4cb343['setAttribute']('rx', '1'),
      _0x5bfb59['appendChild'](_0x4cb343));
  }
  ((_0x5bfb59['style']['display'] = 'none'),
    _0x296875['appendChild'](_0x5bfb59),
    syncVideoPlaybackButtonPresentation(_0x296875, { active: ![] }),
    (_0x296875['style']['display'] = 'none'));
  const _0x4f9e11 = createSvg('2');
  [
    'M12 3l1.2 4.1L17 8.3l-3.8 1.2L12 13.5l-1.2-4-3.8-1.2 3.8-1.2L12 3z',
    'M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z',
    'M6 13l.8 2.7L9.5 16.5l-2.7.8L6 20l-.8-2.7-2.7-.8 2.7-.8L6 13z',
  ]['forEach']((_0x154c8b) => appendPath(_0x4f9e11, _0x154c8b));
  const _0x3bf123 = createIconButton(
      'ms-run-selected',
      t('coreUi.renderer.multiSelect.runSelected'),
      _0x4f9e11,
    ),
    _0x19d954 = createSvg('1.8'),
    _0x2de38e = document['createElementNS'](SVG_NS, 'polygon');
  (_0x2de38e['setAttribute']('points', '12 2 20 12 16 12 16 22 8 22 8 12 4 12 12 2'),
    _0x19d954['appendChild'](_0x2de38e));
  const _0x3fe31a = createIconButton('ms-asset', t('coreUi.renderer.multiSelect.createAsset'), _0x19d954),
    _0x289c6b = createSvg('2');
  ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7\x2010l5\x205\x205-5', 'M12 15V3']['forEach'](
    (_0x44d840) => appendPath(_0x289c6b, _0x44d840),
  );
  const _0xb66dbb = createIconButton(
      'ms-batch-download',
      t('coreUi.renderer.multiSelect.batchDownload'),
      _0x289c6b,
    ),
    _0x176473 = createSvg('2');
  for (const [_0x4a0aba, _0x11fa59] of [
    [0x3, 0x3],
    [0xe, 0x3],
    [0xe, 0xe],
    [0x3, 0xe],
  ]) {
    const _0x78230d = document['createElementNS'](SVG_NS, 'rect');
    (_0x78230d['setAttribute']('x', String(_0x4a0aba)),
      _0x78230d['setAttribute']('y', String(_0x11fa59)),
      _0x78230d['setAttribute']('width', '7'),
      _0x78230d['setAttribute']('height', '7'),
      _0x176473['appendChild'](_0x78230d));
  }
  const _0x4db40c = createIconButton('ms-group', t('coreUi.renderer.multiSelect.group'), _0x176473),
    _0x54c103 = createSvg('2');
  (appendPath(_0x54c103, 'M3 12a9 9 0 0 1 15.36-6.36'), appendPath(_0x54c103, 'M21 12a9 9 0 0 1-15.36 6.36'));
  const _0x395475 = document['createElementNS'](SVG_NS, 'polyline');
  _0x395475['setAttribute']('points', '21\x203\x2021\x209\x2015\x209');
  const _0x31e531 = document['createElementNS'](SVG_NS, 'polyline');
  (_0x31e531['setAttribute']('points', '3 21 3 15 9 15'),
    _0x54c103['appendChild'](_0x395475),
    _0x54c103['appendChild'](_0x31e531));
  const _0x6e778f = createIconButton(
    'ms-reset-image-size',
    t('coreUi.renderer.multiSelect.resetDefaultSize'),
    _0x54c103,
  );
  _0x6e778f['style']['display'] = 'none';
  const _0x40c42f = createSvg('2'),
    _0x34cfd1 = document['createElementNS'](SVG_NS, 'rect');
  (_0x34cfd1['setAttribute']('x', '3'),
    _0x34cfd1['setAttribute']('y', '5'),
    _0x34cfd1['setAttribute']('width', '18'),
    _0x34cfd1['setAttribute']('height', '14'),
    _0x34cfd1['setAttribute']('rx', '2'),
    _0x40c42f['appendChild'](_0x34cfd1),
    appendPath(_0x40c42f, 'M3 9h18'),
    appendPath(_0x40c42f, 'M7 5l4 4'),
    appendPath(_0x40c42f, 'M13 5l4 4'));
  const _0x2ddece = createIconButton(
    'ms-compose-video',
    t('coreUi.renderer.multiSelect.composeVideo'),
    _0x40c42f,
  );
  _0x2ddece['style']['display'] = 'none';
  const _0xeb1a34 = createSvg('2'),
    _0x1a21bf = document['createElementNS'](SVG_NS, 'rect');
  (_0x1a21bf['setAttribute']('x', '3'),
    _0x1a21bf['setAttribute']('y', '4'),
    _0x1a21bf['setAttribute']('width', '18'),
    _0x1a21bf['setAttribute']('height', '16'),
    _0x1a21bf['setAttribute']('rx', '2'),
    _0xeb1a34['appendChild'](_0x1a21bf),
    appendPath(_0xeb1a34, 'M12 4v16'));
  const _0x168f41 = createIconButton(
    'ms-material-comparison',
    t('coreUi.renderer.multiSelect.materialComparison'),
    _0xeb1a34,
  );
  _0x168f41['style']['display'] = 'none';
  const _0x5b178d = createSvg('2');
  [
    'M5\x204h14a2\x202\x200\x200\x201\x202\x202v12a2\x202\x200\x200\x201-2\x202H5a2\x202\x200\x200\x201-2-2V6a2\x202\x200\x200\x201\x202-2z',
    'M3 10h18',
    'M12\x2010v10',
  ]['forEach']((_0x326211) => appendPath(_0x5b178d, _0x326211));
  const _0x8327bd = createIconButton(
    'ms-create-collage',
    t('coreUi.renderer.multiSelect.createCollage'),
    _0x5b178d,
  );
  _0x8327bd['style']['display'] = 'none';
  const _0x259211 = document['createElement']('span');
  return (
    (_0x259211['className'] = 'v2-multi-select-separator'),
    _0x259211['setAttribute']('aria-hidden', 'true'),
    (_0x259211['textContent'] = '|'),
    _0x4862ba['appendChild'](_0x3bf123),
    _0x4862ba['appendChild'](_0x296875),
    _0x4862ba['appendChild'](_0x3fe31a),
    _0x4862ba['appendChild'](_0x4db40c),
    _0x4862ba['appendChild'](_0x168f41),
    _0x4862ba['appendChild'](_0x8327bd),
    _0x4862ba['appendChild'](_0x2ddece),
    _0x4862ba['appendChild'](_0x259211),
    _0x4862ba['appendChild'](_0x6e778f),
    _0x4862ba['appendChild'](_0xb66dbb),
    _0x493e7d['appendChild'](_0x4862ba),
    _0x493e7d
  );
}
function createAlignCenterPanelEl() {
  const _0x474fc9 = document['createElement']('div');
  ((_0x474fc9['id'] = 'v2-align-center-panel'),
    (_0x474fc9['className'] = 'v2-align-center-panel'),
    (_0x474fc9['dataset']['uiStop'] = '1'),
    (_0x474fc9['style']['display'] = 'none'));
  const _0xbf9876 = {
      'ms-align-left': ['M4 4v16', 'M8 7h10', 'M8 12h7', 'M8 17h9'],
      'ms-align-h-center': ['M12 4v16', 'M7\x207h10', 'M9\x2012h6', 'M8 17h8'],
      'ms-align-right': ['M20 4v16', 'M6 7h10', 'M9\x2012h7', 'M7\x2017h9'],
      'ms-align-top': ['M4 4h16', 'M7 8v10', 'M12\x208v7', 'M17 8v9'],
      'ms-align-v-center': ['M4 12h16', 'M7 7v10', 'M12 9v6', 'M17 8v8'],
      'ms-align-bottom': ['M4 20h16', 'M7 6v10', 'M12 9v7', 'M17 7v9'],
      'ms-distribute-h': ['M3 20h18', 'M5 8h3v8H5z', 'M11\x205h3v11h-3z', 'M17\x2010h3v6h-3z'],
      'ms-distribute-v': ['M20\x203v18', 'M8\x205h8v3H8z', 'M5 11h11v3H5z', 'M10\x2017h6v3h-6z'],
      'ms-arrange-grid': ['M4 4h5v5H4z', 'M15\x204h5v5h-5z', 'M4 15h5v5H4z', 'M15\x2015h5v5h-5z'],
    },
    _0x3a5e8d = [
      { action: 'ms-align-left', tooltip: t('coreUi.renderer.align.left'), slot: 'slot-1' },
      { action: 'ms-align-h-center', tooltip: t('coreUi.renderer.align.hCenter'), slot: 'slot-2' },
      { action: 'ms-align-right', tooltip: t('coreUi.renderer.align.right'), slot: 'slot-3' },
      { action: 'ms-align-top', tooltip: t('coreUi.renderer.align.top'), slot: 'slot-4' },
      { action: 'ms-arrange-grid', tooltip: t('coreUi.renderer.align.arrangeGridHint'), slot: 'slot-5' },
      { action: 'ms-align-bottom', tooltip: t('coreUi.renderer.align.bottom'), slot: 'slot-6' },
      { action: 'ms-distribute-h', tooltip: t('coreUi.renderer.align.distributeH'), slot: 'slot-7' },
      { action: 'ms-align-v-center', tooltip: t('coreUi.renderer.align.vCenter'), slot: 'slot-8' },
      { action: 'ms-distribute-v', tooltip: t('coreUi.renderer.align.distributeV'), slot: 'slot-9' },
    ];
  for (const _0x3ed30d of _0x3a5e8d) {
    const _0x274fce = document['createElement']('button');
    ((_0x274fce['type'] = 'button'),
      (_0x274fce['className'] = 'v2-align-center-btn ' + _0x3ed30d['slot']),
      (_0x274fce['dataset']['uiAction'] = _0x3ed30d['action']),
      (_0x274fce['dataset']['tooltip'] = _0x3ed30d['tooltip']),
      _0x274fce['setAttribute']('aria-label', _0x3ed30d['tooltip']));
    _0x3ed30d['action'] === 'ms-arrange-grid' &&
      (_0x274fce['setAttribute']('aria-haspopup', 'menu'),
      _0x274fce['setAttribute']('aria-expanded', 'false'));
    const _0x115d01 = createSvg('2');
    (_0x115d01['setAttribute']('width', '16'), _0x115d01['setAttribute']('height', '16'));
    for (const _0x472293 of _0xbf9876[_0x3ed30d['action']] || []) appendPath(_0x115d01, _0x472293);
    (_0x274fce['appendChild'](_0x115d01), _0x474fc9['appendChild'](_0x274fce));
  }
  return _0x474fc9;
}
function restoreNodeOverlays(_0x585c06) {
  if (!_0x585c06) return;
  const _0x13bf13 = _0x585c06['querySelector']('.node-floating-toolbar'),
    _0x1218c6 = _0x585c06['querySelector']('.group-toolbar'),
    _0x19e3de = _0x585c06['querySelector']('.text-prompt-panel');
  if (_0x13bf13) _0x13bf13['style']['display'] = '';
  if (_0x1218c6) _0x1218c6['style']['display'] = '';
  if (_0x19e3de) _0x19e3de['style']['display'] = '';
}
function hideNodeOverlays(_0x2381f4) {
  if (!_0x2381f4) return;
  const _0x10ff85 = _0x2381f4['querySelector']('.node-floating-toolbar'),
    _0x5f14b9 = _0x2381f4['querySelector']('.group-toolbar'),
    _0x4aff47 = _0x2381f4['querySelector']('.text-prompt-panel');
  if (_0x10ff85) _0x10ff85['style']['display'] = 'none';
  if (_0x5f14b9) _0x5f14b9['style']['display'] = 'none';
  if (_0x4aff47) _0x4aff47['style']['display'] = 'none';
}
export function createRendererSelectionOverlay({
  getWrapper: _0x469e5d,
  isMounted: _0x1895f4,
  getSyncPlaybackState: getSyncPlaybackState = getSyncVideoPlaybackState,
  subscribeSyncPlaybackState: subscribeSyncPlaybackState = subscribeSyncVideoPlaybackState,
}) {
  let _0xa6e2bd = null,
    _0x525a25 = null,
    _0x5ad492 = null,
    _0x3fea55 = null,
    _0x2594e7 = ![];
  const _0xd9d2fe = () => {
    const _0x4a02d9 = _0xa6e2bd?.['querySelector']?.('[data-ui-action="ms-batch-download"]');
    if (!_0x4a02d9) return;
    const _0x30b4b0 = isNodeBatchExportPending();
    ((_0x4a02d9['disabled'] = _0x30b4b0 || !_0x2594e7),
      _0x4a02d9['classList']['toggle']('is-disabled', _0x4a02d9['disabled']),
      _0x4a02d9['classList']['toggle']('is-loading', _0x30b4b0),
      _0x4a02d9['setAttribute']('aria-busy', String(_0x30b4b0)));
  };
  let _0x5443ee = getSyncPlaybackState?.() || { active: ![], loop: ![] },
    _0x5d922 = new Set();
  const _0x4faed2 = { geometrySig: '', resetBtnVisible: null, composeBtnVisible: null, composeBtnKind: '' },
    _0xc8a696 = { centerSig: '', buttonStateSig: '' },
    _0x51bcda = (_0x50b91e, { mountedOnly: mountedOnly = ![] } = {}) => {
      if (!_0x50b91e) return null;
      if (mountedOnly && !_0x1895f4(_0x50b91e)) return null;
      return _0x469e5d(_0x50b91e) || null;
    },
    _0x396ff2 = () => {
      ((_0x4faed2['geometrySig'] = ''),
        (_0x4faed2['resetBtnVisible'] = null),
        (_0x4faed2['composeBtnVisible'] = null),
        (_0x4faed2['composeBtnKind'] = ''),
        (_0xc8a696['centerSig'] = ''),
        (_0xc8a696['buttonStateSig'] = ''));
    },
    _0x49a447 = () => {
      for (const _0x1b4a0a of _0x5d922) restoreNodeOverlays(_0x51bcda(_0x1b4a0a));
      _0x5d922 = new Set();
    },
    _0x4c4034 = (_0x4ec8ea, _0x344d04, _0x3c4e3e) => {
      if (!_0xa6e2bd) return;
      const _0x46985f = Array['isArray'](_0x4ec8ea) && _0x4ec8ea['length'] >= 0x2;
      if (!_0x46985f) _0x49a447();
      else {
        const _0x302f50 = new Set(_0x4ec8ea),
          _0x159553 = new Set();
        for (const _0x1d1968 of _0x5d922) {
          if (_0x302f50['has'](_0x1d1968)) continue;
          restoreNodeOverlays(_0x51bcda(_0x1d1968));
        }
        for (const _0x4cbc3c of _0x302f50) {
          const _0x5c30ed = _0x51bcda(_0x4cbc3c, { mountedOnly: !![] });
          if (!_0x5c30ed) continue;
          (hideNodeOverlays(_0x5c30ed), _0x159553['add'](_0x4cbc3c));
        }
        _0x5d922 = _0x159553;
      }
      if (!_0x46985f) {
        if (_0xa6e2bd['style']['display'] !== 'none') _0xa6e2bd['style']['display'] = 'none';
        ((_0x4faed2['geometrySig'] = ''),
          (_0x4faed2['resetBtnVisible'] = null),
          (_0x4faed2['composeBtnVisible'] = null),
          (_0x4faed2['composeBtnKind'] = ''));
        return;
      }
      const _0x263912 = _0xa6e2bd['querySelector'](
          '.v2-multi-select-tab button[data-ui-action="ms-sync-video-play"]',
        ),
        _0x248267 = _0xa6e2bd['querySelector'](
          '.v2-multi-select-tab button[data-ui-action="ms-run-selected"]',
        ),
        _0x2e6003 = _0xa6e2bd['querySelector'](
          '.v2-multi-select-tab button[data-ui-action="ms-batch-download"]',
        ),
        _0x3609e1 = _0xa6e2bd['querySelector'](
          '.v2-multi-select-tab button[data-ui-action="ms-compose-video"]',
        ),
        _0x452736 = _0xa6e2bd['querySelector'](
          '.v2-multi-select-tab button[data-ui-action="ms-reset-image-size"]',
        ),
        _0xa854df = _0xa6e2bd['querySelector'](
          '.v2-multi-select-tab button[data-ui-action="ms-create-collage"]',
        ),
        _0x13b24e = _0xa6e2bd['querySelector'](
          '.v2-multi-select-tab button[data-ui-action="ms-material-comparison"]',
        );
      _0x263912 &&
        ((_0x263912['style']['display'] =
          getSelectedSyncPlayableVideoCount(_0x344d04, _0x4ec8ea) >= 0x2 ? '' : 'none'),
        syncVideoPlaybackButtonPresentation(_0x263912, _0x5443ee));
      if (_0x248267) {
        _0x248267['style']['display'] = '';
        const _0x558ca9 = _0x4ec8ea['some']((_0x332b46) =>
            isNodeType(_0x344d04[_0x332b46], ['ai-text', 'ai-image', 'ai-video', 'ai-audio']),
          ),
          _0xc49e56 =
            _0x248267['dataset']['batchActive'] === 'true' ||
            _0x4ec8ea['some'](
              (_0x539e29) =>
                isNodeType(_0x344d04[_0x539e29], ['ai-text', 'ai-image', 'ai-video', 'ai-audio']) &&
                _0x344d04[_0x539e29]?.['isGenerating'] === !![],
            ),
          _0x486623 = _0xc49e56
            ? t('groupExecution.stopSelected')
            : t('coreUi.renderer.multiSelect.runSelected');
        ((_0x248267['dataset']['tooltip'] = _0x486623),
          _0x248267['setAttribute']('aria-label', _0x486623),
          _0x248267['setAttribute']('aria-busy', String(_0xc49e56)),
          _0x248267['classList']['toggle']('is-active', _0xc49e56),
          (_0x248267['disabled'] = !_0x558ca9 && !_0xc49e56),
          _0x248267['classList']['toggle']('is-disabled', !_0x558ca9 && !_0xc49e56));
      }
      _0x2e6003 &&
        ((_0x2e6003['style']['display'] = ''),
        (_0x2594e7 = hasBatchExportableSelection(_0x344d04, _0x4ec8ea)),
        _0xd9d2fe());
      if (_0x452736) {
        const _0x43844a = _0x4ec8ea['some']((_0x2beb62) =>
            isNodeType(_0x344d04[_0x2beb62], ['source-image', 'source-video', 'ai-image', 'ai-video']),
          ),
          _0x95d179 = _0x3c4e3e && _0x43844a;
        _0x4faed2['resetBtnVisible'] !== _0x95d179 &&
          ((_0x4faed2['resetBtnVisible'] = _0x95d179),
          (_0x452736['style']['display'] = _0x95d179 ? '' : 'none'));
      }
      if (_0xa854df) {
        const _0x559af2 = _0x4ec8ea['filter']((_0x570041) =>
          isNodeType(_0x344d04[_0x570041], ['source-image', 'ai-image', 'storyboard']),
        )['length'];
        _0xa854df['style']['display'] = _0x559af2 >= 0x2 ? '' : 'none';
      }
      if (_0x13b24e) {
        const _0x22a5fc = _0x4ec8ea['map']((_0x2b3d09) => _0x344d04[_0x2b3d09])['filter'](Boolean);
        _0x13b24e['style']['display'] = hasMaterialComparisonPair(_0x22a5fc) ? '' : 'none';
      }
      if (_0x3609e1) {
        const _0x17a8a6 = getSelectedMediaComposeKind(_0x344d04, _0x4ec8ea),
          _0x2191d1 = !!_0x17a8a6;
        _0x4faed2['composeBtnVisible'] !== _0x2191d1 &&
          ((_0x4faed2['composeBtnVisible'] = _0x2191d1),
          (_0x3609e1['style']['display'] = _0x2191d1 ? '' : 'none'));
        if (_0x4faed2['composeBtnKind'] !== _0x17a8a6) {
          _0x4faed2['composeBtnKind'] = _0x17a8a6;
          const _0x9828cc = getMediaComposeButtonLabel(_0x17a8a6);
          ((_0x3609e1['dataset']['composeKind'] = _0x17a8a6),
            (_0x3609e1['dataset']['tooltip'] = _0x9828cc),
            _0x3609e1['setAttribute']('aria-label', _0x9828cc));
        }
      }
      let _0x5c1ebb = Infinity,
        _0x1a72e5 = Infinity,
        _0x45370d = -Infinity,
        _0x2fc570 = -Infinity,
        _0x4bc112 = 0x0;
      for (const _0xb9918f of _0x4ec8ea) {
        const _0x2a3eea = _0x344d04[_0xb9918f];
        if (!_0x2a3eea) continue;
        _0x4bc112 += 0x1;
        const _0x236e81 = _0x2a3eea['width'] || 0x104,
          _0x133707 = _0x2a3eea['height'] || 0x64,
          _0x908623 = _0x2a3eea['type'] === 'group' ? _0x2a3eea['y'] : _0x2a3eea['y'] - 0x1e;
        ((_0x5c1ebb = Math['min'](_0x5c1ebb, _0x2a3eea['x'])),
          (_0x1a72e5 = Math['min'](_0x1a72e5, _0x908623)),
          (_0x45370d = Math['max'](_0x45370d, _0x2a3eea['x'] + _0x236e81)),
          (_0x2fc570 = Math['max'](_0x2fc570, _0x2a3eea['y'] + _0x133707)));
      }
      if (_0x4bc112 < 0x2) {
        if (_0xa6e2bd['style']['display'] !== 'none') _0xa6e2bd['style']['display'] = 'none';
        _0x4faed2['geometrySig'] = '';
        return;
      }
      if (_0xa6e2bd['style']['display'] !== 'block') _0xa6e2bd['style']['display'] = 'block';
      const _0x8de73 = 0x12,
        _0x1c18c0 = _0x5c1ebb - _0x8de73,
        _0x36cf6d = _0x1a72e5 - _0x8de73,
        _0x24d41d = _0x45370d - _0x5c1ebb + _0x8de73 * 0x2,
        _0x403ff2 = _0x2fc570 - _0x1a72e5 + _0x8de73 * 0x2,
        _0x58747e =
          _0x1c18c0['toFixed'](0x2) +
          '|' +
          _0x36cf6d['toFixed'](0x2) +
          '|' +
          _0x24d41d['toFixed'](0x2) +
          '|' +
          _0x403ff2['toFixed'](0x2);
      _0x4faed2['geometrySig'] !== _0x58747e &&
        ((_0x4faed2['geometrySig'] = _0x58747e),
        (_0xa6e2bd['style']['left'] = _0x1c18c0 + 'px'),
        (_0xa6e2bd['style']['top'] = _0x36cf6d + 'px'),
        (_0xa6e2bd['style']['width'] = _0x24d41d + 'px'),
        (_0xa6e2bd['style']['height'] = _0x403ff2 + 'px'));
    },
    _0x358ccb = (_0x32d26e, _0x562616, _0x5d23bb = {}) => {
      if (!_0x525a25) return;
      const _0x1096c7 = String(_0x5d23bb?.['alignFeatureTriggerMode'] || 'click'),
        _0x39e4c9 = _0x5d23bb?.['alignFeatureEnabled'] !== ![] && _0x1096c7 !== 'off',
        _0x10a207 = Array['isArray'](_0x32d26e) ? _0x32d26e : [],
        _0x45f1c8 = getAlignableSelectionNodes(_0x562616 || {}, _0x10a207),
        _0x16f7fc =
          _0x39e4c9 &&
          _0x5d23bb?.['alignPanelVisible'] === !![] &&
          _0x10a207['length'] >= 0x2 &&
          _0x45f1c8['length'] >= 0x2;
      if (!_0x16f7fc) {
        if (_0x525a25['style']['display'] !== 'none') _0x525a25['style']['display'] = 'none';
        ((_0xc8a696['centerSig'] = ''), (_0xc8a696['buttonStateSig'] = ''));
        return;
      }
      const _0x38340c = _0x5d23bb?.['alignPanelAnchorWorld'],
        _0x4153bb = !!_0x38340c && Number['isFinite'](_0x38340c['x']) && Number['isFinite'](_0x38340c['y']),
        _0x460dcb = _0x4153bb ? null : computeSelectionBounds(_0x45f1c8);
      if (!_0x4153bb && !_0x460dcb) {
        if (_0x525a25['style']['display'] !== 'none') _0x525a25['style']['display'] = 'none';
        ((_0xc8a696['centerSig'] = ''), (_0xc8a696['buttonStateSig'] = ''));
        return;
      }
      const _0x5af945 = _0x4153bb ? Number(_0x38340c['x']) : _0x460dcb['centerX'],
        _0x38466f = _0x4153bb ? Number(_0x38340c['y']) : _0x460dcb['centerY'];
      if (_0x525a25['style']['display'] !== 'block') _0x525a25['style']['display'] = 'block';
      const _0x5109b2 = _0x5af945['toFixed'](0x2) + '|' + _0x38466f['toFixed'](0x2);
      _0xc8a696['centerSig'] !== _0x5109b2 &&
        ((_0xc8a696['centerSig'] = _0x5109b2),
        (_0x525a25['style']['left'] = _0x5af945 + 'px'),
        (_0x525a25['style']['top'] = _0x38466f + 'px'));
      const _0x4ddcf1 = _0x45f1c8['length'] >= 0x2,
        _0xc4a6fc = _0x4ddcf1 ? '1' : '0';
      if (_0xc8a696['buttonStateSig'] !== _0xc4a6fc) {
        _0xc8a696['buttonStateSig'] = _0xc4a6fc;
        const _0x39983c =
          _0x525a25['_actionButtons'] ||
          Array['from'](_0x525a25['querySelectorAll']('button[data-ui-action]'));
        _0x525a25['_actionButtons'] = _0x39983c;
        for (const _0x57306c of _0x39983c) {
          const _0xb10bd1 = _0x57306c['dataset']['uiAction'],
            _0x3d6c97 = _0xb10bd1 === 'ms-distribute-h' || _0xb10bd1 === 'ms-distribute-v',
            _0x3ba192 = _0x3d6c97 ? !_0x4ddcf1 : ![];
          ((_0x57306c['disabled'] = _0x3ba192), _0x57306c['classList']['toggle']('is-disabled', _0x3ba192));
        }
      }
    },
    _0x22270e = (_0x32966a) => {
      (_0x3fea55?.(),
        _0x5ad492?.(),
        (_0x5ad492 = null),
        _0x271ba8({ restoreNodeChrome: !![] }),
        _0xa6e2bd?.['remove']?.(),
        _0x525a25?.['remove']?.(),
        (_0xa6e2bd = createMultiSelectBoxEl()),
        (_0x525a25 = createAlignCenterPanelEl()),
        _0x32966a['appendChild'](_0xa6e2bd),
        _0x32966a['appendChild'](_0x525a25),
        (_0x3fea55 = subscribeNodeBatchExportPending(_0xd9d2fe)),
        (_0x5ad492 = subscribeSyncPlaybackState?.((_0x534f68) => {
          ((_0x5443ee = _0x534f68 || { active: ![], loop: ![] }),
            syncVideoPlaybackButtonPresentation(
              _0xa6e2bd?.['querySelector']?.(
                '.v2-multi-select-tab button[data-ui-action="ms-sync-video-play"]',
              ),
              _0x5443ee,
            ));
        })));
    },
    _0x2f9a60 = (_0x2eddb7 = {}) => {
      (_0x4c4034(
        _0x2eddb7['selectedNodeIds'],
        _0x2eddb7['nodes'] || {},
        _0x2eddb7['ui']?.['imageVideoNodeResizeEnabled'] === !![],
      ),
        _0x358ccb(_0x2eddb7['selectedNodeIds'], _0x2eddb7['nodes'] || {}, _0x2eddb7['ui']));
    },
    _0x271ba8 = ({ restoreNodeChrome: restoreNodeChrome = ![] } = {}) => {
      if (restoreNodeChrome) _0x49a447();
      else _0x5d922 = new Set();
      _0x396ff2();
      if (_0xa6e2bd) _0xa6e2bd['style']['display'] = 'none';
      if (_0x525a25) _0x525a25['style']['display'] = 'none';
    },
    _0x26d83f = () => {
      (_0x3fea55?.(),
        (_0x3fea55 = null),
        _0x5ad492?.(),
        (_0x5ad492 = null),
        _0x271ba8({ restoreNodeChrome: !![] }),
        _0xa6e2bd?.['remove']?.(),
        _0x525a25?.['remove']?.(),
        (_0xa6e2bd = null),
        (_0x525a25 = null));
    };
  return Object['freeze']({ mount: _0x22270e, render: _0x2f9a60, reset: _0x271ba8, unmount: _0x26d83f });
}
