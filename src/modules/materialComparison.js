import {
  closeActiveImagePreview,
  closeActiveVideoPreview,
  resolveNodeImageOriginalSource,
} from './imagePreview.js';
import {
  MATERIAL_COMPARISON_KIND_VIDEO,
  findInitialMaterialComparisonPair,
  getMaterialComparisonKindCounts,
  resolveMaterialComparisonEntries,
} from './materialComparisonEntries.js';
import { createMaterialComparisonPlaybackController } from './materialComparisonPlayback.js';
import { findCanvasVideoElementForEntry, stopActiveSyncVideoPlayback } from './videoSyncPlayback.js';
import { releaseCanvasPanShortcut } from '../services/canvasPanShortcutState.js';
import { beginModalInteraction } from '../services/modalInteractionScope.js';
import { getComparisonImageCache, getComparisonOriginalKey } from './materialComparisonImageCache.js';
import { createMaterialComparisonViewport } from './materialComparisonViewport.js';
import { createImageLoadDiagnostics, getImageLoadTiming } from '../services/imageLoadDiagnostics.js';
import { t } from '../i18n/index.js';
export { resolveMaterialComparisonEntries } from './materialComparisonEntries.js';
const MODE_SLIDE = 'slide',
  MODE_SIDE_BY_SIDE = 'side-by-side',
  SLOT_LEFT = 'left',
  SLOT_RIGHT = 'right';
let activeMaterialComparisonClose = null;
function clamp(_0x5dd563, _0x45bcdf, _0x5113f2) {
  const _0x4171ef = Number(_0x5dd563);
  if (!Number['isFinite'](_0x4171ef)) return _0x45bcdf;
  return Math['min'](_0x5113f2, Math['max'](_0x45bcdf, _0x4171ef));
}
function createElement(_0x3cd672, _0x19d619, _0x50713e = '') {
  const _0x2c25b7 = _0x3cd672['createElement'](_0x19d619);
  if (_0x50713e) _0x2c25b7['className'] = _0x50713e;
  return _0x2c25b7;
}
function createTextElement(_0x9e2511, _0x45913f, _0x541bd0, _0x70becd) {
  const _0x484857 = createElement(_0x9e2511, _0x45913f, _0x541bd0);
  return ((_0x484857['textContent'] = _0x70becd), _0x484857);
}
function createButton(_0x50d2bc, _0x375ebc, _0x274994, _0x45a494 = _0x274994) {
  const _0x1655ee = createTextElement(_0x50d2bc, 'button', _0x375ebc, _0x274994);
  return ((_0x1655ee['type'] = 'button'), _0x1655ee['setAttribute']('aria-label', _0x45a494), _0x1655ee);
}
function getEntryNodeName(_0x52cbfb) {
  for (const _0x22c3ec of [
    _0x52cbfb?.['node']?.['name'],
    _0x52cbfb?.['node']?.['fileName'],
    _0x52cbfb?.['label'],
  ]) {
    const _0x211055 = String(_0x22c3ec || '')['trim']();
    if (_0x211055) return _0x211055;
  }
  return '';
}
function safeRevokeObjectUrl(_0x143003) {
  try {
    globalThis['URL']?.['revokeObjectURL']?.(_0x143003);
  } catch (_0x49d788) {}
}
export function closeActiveMaterialComparison() {
  if (typeof activeMaterialComparisonClose !== 'function') return ![];
  const _0x4c6c79 = activeMaterialComparisonClose;
  return (_0x4c6c79(), !![]);
}
export function openMaterialComparison(_0x479a1d = [], _0x2e5f4e = {}) {
  const _0x1287fd = typeof _0x2e5f4e['translate'] === 'function' ? _0x2e5f4e['translate'] : t,
    _0x104c21 = resolveMaterialComparisonEntries(_0x479a1d, { translate: _0x1287fd }),
    _0x14d44c = findInitialMaterialComparisonPair(_0x104c21);
  if (!_0x14d44c) return () => {};
  const _0x7f9ba8 = _0x2e5f4e['documentObject'] || globalThis['document'],
    _0x541b40 = _0x2e5f4e['windowObject'] || globalThis['window'];
  if (!_0x7f9ba8?.['body'] || !_0x7f9ba8?.['createElement']) return () => {};
  const _0x26edfc = () => releaseCanvasPanShortcut({ documentObject: _0x7f9ba8, windowObject: _0x541b40 });
  (closeActiveImagePreview(),
    closeActiveVideoPreview(),
    stopActiveSyncVideoPlayback(),
    closeActiveMaterialComparison());
  const _0x5d32d5 =
      typeof _0x2e5f4e['sourceResolver'] === 'function'
        ? _0x2e5f4e['sourceResolver']
        : resolveNodeImageOriginalSource,
    _0x1d85a8 = _0x5d32d5 === resolveNodeImageOriginalSource ? getComparisonImageCache(_0x7f9ba8) : null,
    _0x1517a3 = _0x1d85a8?.['generation'],
    _0x459093 = createImageLoadDiagnostics('material-comparison'),
    _0x177958 =
      typeof _0x2e5f4e['attachVideoSource'] === 'function' ? _0x2e5f4e['attachVideoSource'] : undefined,
    _0x2d40fe =
      typeof _0x2e5f4e['playVideo'] === 'function'
        ? _0x2e5f4e['playVideo']
        : (_0x2d2b2a) => _0x2d2b2a?.['play']?.(),
    _0xfefc3 =
      typeof _0x2e5f4e['videoElementResolver'] === 'function'
        ? _0x2e5f4e['videoElementResolver']
        : (_0x1cd035) =>
            findCanvasVideoElementForEntry(_0x7f9ba8, {
              nodeId: _0x1cd035?.['node']?.['id'] || _0x1cd035?.['id'],
              videoIndex: _0x1cd035?.['videoIndex'],
            }),
    _0x1c9dce = getMaterialComparisonKindCounts(_0x104c21),
    _0x41b185 = {
      mode: MODE_SLIDE,
      leftIndex: _0x14d44c['leftIndex'],
      rightIndex: _0x14d44c['rightIndex'],
      nextSlot: SLOT_LEFT,
      dividerPercent: 0x32,
      zoom: 0x1,
      leftAspectRatio: _0x104c21[_0x14d44c['leftIndex']]['aspectRatio'] || 0x1,
      rightAspectRatio: _0x104c21[_0x14d44c['rightIndex']]['aspectRatio'] || 0x1,
      stageWidth: 0x1,
      stageHeight: 0x1,
    },
    _0x5148cd = new Set();
  let _0x3c21d7 = ![],
    _0x2d4a1d = null,
    _0xdf0b = null,
    _0x13ae53 = null,
    _0x37b381 = ![],
    _0x53fbaa = '',
    _0x8d8223 = ![];
  const _0xa29720 = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-overlay');
  (_0xa29720['setAttribute']('role', 'dialog'),
    _0xa29720['setAttribute']('aria-modal', 'true'),
    _0xa29720['setAttribute']('aria-label', _0x1287fd('canvasInteraction.materialComparison.ariaLabel')));
  const _0x90c2d7 = createElement(_0x7f9ba8, 'header', 'v2-material-comparison-header'),
    _0x52d768 = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-header-meta'),
    _0x1f91aa = createTextElement(
      _0x7f9ba8,
      'h2',
      'v2-material-comparison-title',
      _0x1287fd('canvasInteraction.materialComparison.title'),
    ),
    _0xfd0e7f = createTextElement(
      _0x7f9ba8,
      'span',
      'v2-material-comparison-count',
      '2 / ' + _0x104c21['length'],
    ),
    _0x33ae62 = createTextElement(
      _0x7f9ba8,
      'span',
      'v2-material-comparison-cache-hint',
      _0x1287fd('canvasInteraction.materialComparison.localCache'),
    );
  (_0x52d768['appendChild'](_0x1f91aa),
    _0x52d768['appendChild'](_0xfd0e7f),
    _0x52d768['appendChild'](_0x33ae62));
  const _0x171082 = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-mode-switch');
  (_0x171082['setAttribute']('role', 'group'),
    _0x171082['setAttribute'](
      'aria-label',
      _0x1287fd('canvasInteraction.materialComparison.modeGroupLabel'),
    ));
  const _0x59f480 = createButton(
    _0x7f9ba8,
    'v2-material-comparison-mode-button\x20is-active',
    _0x1287fd('canvasInteraction.materialComparison.slideMode'),
  );
  ((_0x59f480['dataset']['comparisonMode'] = MODE_SLIDE), _0x59f480['setAttribute']('aria-pressed', 'true'));
  const _0x5dff22 = createButton(
    _0x7f9ba8,
    'v2-material-comparison-mode-button',
    _0x1287fd('canvasInteraction.materialComparison.sideBySideMode'),
  );
  ((_0x5dff22['dataset']['comparisonMode'] = MODE_SIDE_BY_SIDE),
    _0x5dff22['setAttribute']('aria-pressed', 'false'),
    _0x171082['appendChild'](_0x59f480),
    _0x171082['appendChild'](_0x5dff22));
  const _0x3edbe6 = createButton(
    _0x7f9ba8,
    'v2-material-comparison-close',
    _0x1287fd('canvasInteraction.materialComparison.close'),
  );
  (_0x90c2d7['appendChild'](_0x52d768),
    _0x90c2d7['appendChild'](_0x171082),
    _0x90c2d7['appendChild'](_0x3edbe6));
  const _0x9cfcc2 = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-viewport'),
    _0x1e127b = createElement(_0x7f9ba8, 'main', 'v2-material-comparison-main');
  _0x1e127b['tabIndex'] = 0x0;
  const _0x513efe = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-stage-shell'),
    _0x2d457d = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-stage');
  ((_0x2d457d['dataset']['comparisonMode'] = MODE_SLIDE),
    _0x2d457d['style']['setProperty']('--material-comparison-divider', '50%'));
  const _0x3d0008 = (_0x284605) => {
      const _0x4038bc = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-panel is-' + _0x284605),
        _0x1ce87c = _0x104c21[_0x284605 === SLOT_LEFT ? _0x41b185['leftIndex'] : _0x41b185['rightIndex']];
      _0x1ce87c['originalCacheKey'] = getComparisonOriginalKey(_0x1ce87c['node']);
      const _0x225e81 =
        _0x1ce87c['kind'] !== MATERIAL_COMPARISON_KIND_VIDEO
          ? _0x1d85a8?.['take'](_0x1ce87c['originalCacheKey'])
          : null;
      if (_0x225e81) {
        (_0x459093['mark']('cache-hit', { slot: _0x284605 }), (_0x1ce87c['originalUrl'] = _0x225e81['url']));
        if (_0x225e81['revokeUrlOnClose']) _0x5148cd['add'](_0x225e81['url']);
      }
      const _0x57c0f2 =
        _0x225e81?.['image'] || createElement(_0x7f9ba8, 'img', 'v2-material-comparison-image');
      ((_0x57c0f2['draggable'] = ![]),
        (_0x57c0f2['decoding'] = 'async'),
        (_0x57c0f2['fetchPriority'] = 'high'));
      const _0x26cab8 = createElement(_0x7f9ba8, 'video', 'v2-material-comparison-video');
      ((_0x26cab8['hidden'] = !![]),
        (_0x26cab8['controls'] = ![]),
        (_0x26cab8['playsInline'] = !![]),
        (_0x26cab8['preload'] = 'auto'));
      const _0xe0ed13 = createTextElement(
        _0x7f9ba8,
        'span',
        'v2-material-comparison-panel-badge',
        _0x1287fd('canvasInteraction.materialComparison.' + _0x284605),
      );
      return (
        _0x4038bc['appendChild'](_0x57c0f2),
        _0x4038bc['appendChild'](_0x26cab8),
        _0x4038bc['appendChild'](_0xe0ed13),
        {
          panel: _0x4038bc,
          image: _0x57c0f2,
          video: _0x26cab8,
          badge: _0xe0ed13,
          slot: _0x284605,
          attachToken: 0x0,
          sourceUrl: '',
          entryKind: _0x225e81 ? _0x1ce87c['kind'] : '',
          playbackReady: ![],
          playbackFailed: ![],
        }
      );
    },
    _0xa51f3d = _0x3d0008(SLOT_RIGHT),
    _0x340950 = _0x3d0008(SLOT_LEFT),
    _0x3f118f = createButton(
      _0x7f9ba8,
      'v2-material-comparison-divider',
      '',
      _0x1287fd('canvasInteraction.materialComparison.dividerLabel'),
    );
  (_0x3f118f['setAttribute']('role', 'slider'),
    _0x3f118f['setAttribute']('aria-valuemin', '0'),
    _0x3f118f['setAttribute']('aria-valuemax', '100'),
    _0x3f118f['setAttribute']('aria-valuenow', '50'));
  const _0x4c1b58 = createElement(_0x7f9ba8, 'span', 'v2-material-comparison-divider-handle');
  (_0x4c1b58['setAttribute']('aria-hidden', 'true'),
    _0x3f118f['appendChild'](_0x4c1b58),
    _0x2d457d['appendChild'](_0xa51f3d['panel']),
    _0x2d457d['appendChild'](_0x340950['panel']),
    _0x513efe['appendChild'](_0x2d457d),
    _0x1e127b['appendChild'](_0x513efe),
    _0x9cfcc2['appendChild'](_0x1e127b),
    _0x9cfcc2['appendChild'](_0x3f118f));
  const _0x208b0a = createMaterialComparisonViewport({
      state: _0x41b185,
      main: _0x1e127b,
      stage: _0x2d457d,
      stageShell: _0x513efe,
      viewport: _0x9cfcc2,
      windowObject: _0x541b40,
    }),
    _0x519d09 = () => _0x208b0a['syncGeometry'](),
    _0x2a0dfd = () => _0x208b0a['syncDivider'](),
    _0x227664 = createMaterialComparisonPlaybackController({
      documentObject: _0x7f9ba8,
      windowObject: _0x541b40,
      translate: _0x1287fd,
      overlay: _0xa29720,
      leftPanel: _0x340950,
      rightPanel: _0xa51f3d,
      leftSlot: SLOT_LEFT,
      rightSlot: SLOT_RIGHT,
      videoKind: MATERIAL_COMPARISON_KIND_VIDEO,
      getActiveEntry: _0x4554cc,
      onMediaAspect: _0x3edae5,
      onGeometryChange: _0x519d09,
      videoElementResolver: _0xfefc3,
      ...(_0x177958 ? { attachVideoSource: _0x177958 } : {}),
      ...(_0x2d40fe ? { playVideo: _0x2d40fe } : {}),
    }),
    _0x4e7d5a = _0x227664['root'],
    _0x126217 = createElement(_0x7f9ba8, 'footer', 'v2-material-comparison-footer'),
    _0x48c7a7 = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-library-header'),
    _0x2eabf2 = createTextElement(
      _0x7f9ba8,
      'strong',
      'v2-material-comparison-library-title',
      _0x1287fd('canvasInteraction.materialComparison.library'),
    ),
    _0x2b90ba = createTextElement(
      _0x7f9ba8,
      'span',
      'v2-material-comparison-library-count',
      String(_0x104c21['length']),
    ),
    _0x4d6429 = createTextElement(
      _0x7f9ba8,
      'span',
      'v2-material-comparison-library-hint',
      _0x1287fd('canvasInteraction.materialComparison.libraryHint'),
    );
  (_0x48c7a7['appendChild'](_0x2eabf2),
    _0x48c7a7['appendChild'](_0x2b90ba),
    _0x48c7a7['appendChild'](_0x4d6429));
  const _0x353c8f = createElement(_0x7f9ba8, 'div', 'v2-material-comparison-thumbnail-track'),
    _0x5c9960 = _0x104c21['map']((_0x45af6d, _0xb9e1ba) => {
      const _0x9db399 = createButton(
        _0x7f9ba8,
        'v2-material-comparison-thumbnail-card',
        '',
        _0x1287fd('canvasInteraction.materialComparison.thumbnailLabel', {
          index: _0xb9e1ba + 0x1,
          name: _0x45af6d['label'],
        }),
      );
      ((_0x9db399['dataset']['comparisonIndex'] = String(_0xb9e1ba)),
        (_0x9db399['dataset']['comparisonKind'] = _0x45af6d['kind']),
        _0x9db399['classList']['add']('is-' + _0x45af6d['kind']));
      let _0x2aa34c;
      _0x45af6d['thumbnailUrl']
        ? ((_0x2aa34c = createElement(_0x7f9ba8, 'img', 'v2-material-comparison-thumbnail-image')),
          (_0x2aa34c['src'] = _0x45af6d['thumbnailUrl']),
          (_0x2aa34c['alt'] = _0x45af6d['label']),
          (_0x2aa34c['draggable'] = ![]))
        : ((_0x2aa34c = createTextElement(
            _0x7f9ba8,
            'span',
            'v2-material-comparison-thumbnail-placeholder',
            '▶',
          )),
          _0x2aa34c['setAttribute']('aria-hidden', 'true'));
      const _0x4bf4e0 = createTextElement(
          _0x7f9ba8,
          'span',
          'v2-material-comparison-thumbnail-name',
          _0x45af6d['label'],
        ),
        _0x4407d0 = createTextElement(
          _0x7f9ba8,
          'span',
          'v2-material-comparison-thumbnail-badge\x20is-left',
          _0x1287fd('canvasInteraction.materialComparison.left'),
        ),
        _0x5a6222 = createTextElement(
          _0x7f9ba8,
          'span',
          'v2-material-comparison-thumbnail-badge is-right',
          _0x1287fd('canvasInteraction.materialComparison.right'),
        );
      return (
        _0x9db399['appendChild'](_0x2aa34c),
        _0x9db399['appendChild'](_0x4bf4e0),
        _0x9db399['appendChild'](_0x4407d0),
        _0x9db399['appendChild'](_0x5a6222),
        _0x353c8f['appendChild'](_0x9db399),
        { card: _0x9db399, leftBadge: _0x4407d0, rightBadge: _0x5a6222, entry: _0x45af6d }
      );
    });
  (_0x126217['appendChild'](_0x48c7a7),
    _0x126217['appendChild'](_0x353c8f),
    _0xa29720['appendChild'](_0x90c2d7),
    _0xa29720['appendChild'](_0x9cfcc2));
  if (_0x4e7d5a) _0xa29720['appendChild'](_0x4e7d5a);
  _0xa29720['appendChild'](_0x126217);
  function _0x3129f(_0x1554c9) {
    return _0x1554c9 === SLOT_LEFT ? _0x340950 : _0xa51f3d;
  }
  function _0x274f95(_0x42e736, _0x5524eb) {
    const _0x14ed9b =
      Number['isFinite'](Number(_0x5524eb)) && Number(_0x5524eb) > 0x0 ? Number(_0x5524eb) : 0x1;
    if (_0x42e736 === SLOT_LEFT) _0x41b185['leftAspectRatio'] = _0x14ed9b;
    else _0x41b185['rightAspectRatio'] = _0x14ed9b;
    _0x3129f(_0x42e736)['panel']['style']['setProperty'](
      '--material-comparison-source-aspect',
      String(_0x14ed9b),
    );
  }
  function _0x4554cc(_0x1baf8a) {
    return _0x104c21[_0x1baf8a === SLOT_LEFT ? _0x41b185['leftIndex'] : _0x41b185['rightIndex']] || null;
  }
  function _0x4a1142(_0x578ac4, _0x2b83c0, _0x183326) {
    const { panel: _0x1dde30, image: _0x2df627 } = _0x578ac4,
      _0xbe4282 = String(_0x183326 || '')['trim']();
    _0x2df627['alt'] = _0x2b83c0['label'];
    if (
      _0x578ac4['entryKind'] === _0x2b83c0['kind'] &&
      _0x2df627['getAttribute']('src') === _0xbe4282 &&
      !_0x1dde30['classList']['contains']('is-error')
    )
      return;
    (_0x578ac4['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO && _0x227664['clearPanelSource'](_0x578ac4),
      (_0x578ac4['entryKind'] = _0x2b83c0['kind']),
      (_0x578ac4['attachToken'] += 0x1),
      (_0x2df627['hidden'] = !![]),
      _0x1dde30['setAttribute']('aria-busy', 'true'),
      _0x1dde30['classList']['add']('is-loading'),
      _0x1dde30['classList']['remove']('is-error'),
      _0x459093['mark']('source-assigned', { slot: _0x578ac4['slot'] }),
      (_0x2df627['src'] = _0xbe4282));
  }
  function _0x4e3cdd(_0x54f2b9, _0x445330) {
    const { panel: _0x555a35, image: _0x4d4e09 } = _0x54f2b9;
    (_0x54f2b9['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO && _0x227664['clearPanelSource'](_0x54f2b9),
      (_0x54f2b9['entryKind'] = _0x445330['kind']),
      (_0x54f2b9['attachToken'] += 0x1),
      (_0x4d4e09['alt'] = _0x445330['label']),
      (_0x4d4e09['hidden'] = !![]),
      _0x4d4e09['removeAttribute']?.('src'),
      _0x555a35['classList']['add']('is-loading'),
      _0x555a35['classList']['remove']('is-error'),
      _0x555a35['setAttribute']('aria-busy', 'true'));
  }
  function _0xc19381(_0x4f1c5e) {
    ((_0x4f1c5e['attachToken'] += 0x1),
      (_0x4f1c5e['image']['hidden'] = !![]),
      (_0x4f1c5e['video']['hidden'] = !![]),
      _0x4f1c5e['panel']['classList']['remove']('is-loading'),
      _0x4f1c5e['panel']['classList']['add']('is-error'),
      _0x4f1c5e['panel']['setAttribute']('aria-busy', 'false'),
      _0x459093['mark']('error', { slot: _0x4f1c5e['slot'] }));
  }
  function _0x6af538(_0x2ae4e4, _0x31d59f) {
    if (_0x3c21d7 || _0x31d59f['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO) return;
    const { image: _0x56172b, panel: _0x2f82d8 } = _0x31d59f;
    (_0x459093['mark']('original-loaded', { slot: _0x2ae4e4, ...getImageLoadTiming(_0x56172b) }),
      _0x3edae5(_0x2ae4e4, _0x31d59f),
      (_0x56172b['hidden'] = ![]),
      _0x2f82d8['classList']['remove']('is-loading', 'is-error'),
      _0x2f82d8['setAttribute']('aria-busy', 'false'),
      _0x541b40?.['requestAnimationFrame']?.(() =>
        _0x541b40['requestAnimationFrame'](() => {
          if (!_0x3c21d7) _0x459093['mark']('paint-opportunity', { slot: _0x2ae4e4 });
        }),
      ));
  }
  function _0x3edae5(_0x2537e5, _0x2bb103, _0x46231f = _0x2bb103['image']) {
    const _0x307037 = Number(_0x46231f?.['naturalWidth'] || _0x46231f?.['videoWidth'] || 0x0),
      _0x4f8765 = Number(_0x46231f?.['naturalHeight'] || _0x46231f?.['videoHeight'] || 0x0);
    if (_0x307037 <= 0x0 || _0x4f8765 <= 0x0) return;
    const _0x233e4d = _0x307037 / _0x4f8765,
      _0x4b8d80 = _0x2537e5 === SLOT_LEFT ? _0x41b185['leftIndex'] : _0x41b185['rightIndex'];
    if (_0x104c21[_0x4b8d80]) _0x104c21[_0x4b8d80]['aspectRatio'] = _0x233e4d;
    (_0x274f95(_0x2537e5, _0x233e4d), _0x519d09());
  }
  function _0x3963ae(_0x1e6f8a) {
    const _0x83849c = _0x104c21[_0x1e6f8a];
    if (!_0x83849c) return Promise['resolve']('');
    if (_0x83849c['kind'] === MATERIAL_COMPARISON_KIND_VIDEO)
      return Promise['resolve'](_0x83849c['sourceUrl'] || '');
    if (_0x83849c['originalUrl']) return Promise['resolve'](_0x83849c['originalUrl']);
    if (_0x83849c['originalPromise']) return _0x83849c['originalPromise'];
    return (
      (_0x83849c['originalPromise'] = Promise['resolve']()
        ['then'](() => {
          return (
            _0x459093['mark']('resolve-start', { index: _0x1e6f8a }),
            (_0x83849c['originalCacheKey'] = getComparisonOriginalKey(_0x83849c['node'])),
            _0x5d32d5(_0x83849c['node'])
          );
        })
        ['then']((_0x30293d) => {
          _0x459093['mark']('resolve-end', { index: _0x1e6f8a, hasSource: !!_0x30293d?.['url'] });
          if (_0x83849c['originalCacheKey'] !== getComparisonOriginalKey(_0x83849c['node']))
            _0x83849c['originalCacheKey'] = '';
          const _0x10ffeb = String(_0x30293d?.['url'] || '')['trim']();
          if (!_0x10ffeb) return '';
          if (_0x30293d?.['revokeUrlOnClose']) {
            if (_0x3c21d7) safeRevokeObjectUrl(_0x10ffeb);
            else _0x5148cd['add'](_0x10ffeb);
          }
          return (
            (_0x83849c['originalUrl'] = _0x10ffeb),
            (_0x83849c['revokeUrlOnClose'] = _0x30293d?.['revokeUrlOnClose'] === !![]),
            _0x10ffeb
          );
        })
        ['catch'](() => '')
        ['finally'](() => {
          _0x83849c['originalPromise'] = null;
        })),
      _0x83849c['originalPromise']
    );
  }
  function _0x1f1ccd(_0x5b5716, _0x1ab150) {
    const _0x4c1e11 = _0x104c21[_0x1ab150];
    if (!_0x4c1e11) return;
    const _0x2294be = _0x5b5716 === SLOT_LEFT ? _0x340950 : _0xa51f3d;
    ((_0x2294be['badge']['textContent'] =
      getEntryNodeName(_0x4c1e11) || _0x1287fd('canvasInteraction.materialComparison.' + _0x5b5716)),
      _0x274f95(_0x5b5716, _0x4c1e11['aspectRatio'] || 0x1),
      _0x519d09());
    if (_0x4c1e11['kind'] === MATERIAL_COMPARISON_KIND_VIDEO) {
      _0x227664['setPanelSource'](_0x5b5716, _0x2294be, _0x4c1e11);
      return;
    }
    if (_0x4c1e11['originalUrl']) {
      _0x4a1142(_0x2294be, _0x4c1e11, _0x4c1e11['originalUrl']);
      if (_0x2294be['image']['complete'] && !_0x2294be['image']['hidden']) _0x6af538(_0x5b5716, _0x2294be);
      return;
    }
    (_0x4e3cdd(_0x2294be, _0x4c1e11),
      void _0x3963ae(_0x1ab150)['then']((_0x1b228f) => {
        if (_0x3c21d7) return;
        const _0xdf3b2a = _0x5b5716 === SLOT_LEFT ? _0x41b185['leftIndex'] : _0x41b185['rightIndex'];
        if (_0xdf3b2a !== _0x1ab150) return;
        _0x1b228f ? _0x4a1142(_0x2294be, _0x4c1e11, _0x1b228f) : _0xc19381(_0x2294be);
      }));
  }
  function _0x537b8d(_0xe22817) {
    const _0x473c7a = _0x104c21[_0xe22817];
    if (!_0x473c7a || (_0x1c9dce['get'](_0x473c7a['kind']) || 0x0) < 0x2) return !![];
    if (_0x41b185['nextSlot'] !== SLOT_RIGHT) return ![];
    return _0x473c7a['kind'] !== _0x4554cc(SLOT_LEFT)?.['kind'];
  }
  function _0x4966af() {
    _0x5c9960['forEach'](({ card: _0x5eb9aa, leftBadge: _0x11984d, rightBadge: _0x14a329 }, _0x4a2187) => {
      const _0x54ce4c = _0x4a2187 === _0x41b185['leftIndex'],
        _0x5116a1 = _0x4a2187 === _0x41b185['rightIndex'],
        _0x2e24ba = _0x537b8d(_0x4a2187);
      (_0x5eb9aa['classList']['toggle']('is-selected', _0x54ce4c || _0x5116a1),
        _0x5eb9aa['classList']['toggle']('is-left', _0x54ce4c),
        _0x5eb9aa['classList']['toggle']('is-right', _0x5116a1),
        _0x5eb9aa['classList']['toggle']('is-disabled', _0x2e24ba),
        (_0x5eb9aa['disabled'] = _0x2e24ba),
        (_0x11984d['hidden'] = !_0x54ce4c),
        (_0x14a329['hidden'] = !_0x5116a1),
        _0x5eb9aa['setAttribute']('aria-pressed', String(_0x54ce4c || _0x5116a1)),
        _0x5eb9aa['setAttribute']('aria-disabled', String(_0x2e24ba)));
    });
  }
  function _0x5f28fb(_0x84014b) {
    if (_0x3c21d7) return;
    const _0x9f712e = Math['trunc'](Number(_0x84014b));
    if (!Number['isFinite'](_0x9f712e) || !_0x104c21[_0x9f712e]) return;
    if (_0x537b8d(_0x9f712e)) return;
    const _0x10d5db = _0x41b185['nextSlot'];
    if (_0x10d5db === SLOT_LEFT) {
      _0x41b185['leftIndex'] = _0x9f712e;
      const _0x49a9ab = _0x4554cc(SLOT_RIGHT);
      if (_0x49a9ab?.['kind'] !== _0x104c21[_0x9f712e]['kind']) {
        const _0x5343d7 = _0x104c21['findIndex'](
          (_0x467632, _0x348d71) =>
            _0x348d71 !== _0x9f712e && _0x467632['kind'] === _0x104c21[_0x9f712e]['kind'],
        );
        _0x5343d7 >= 0x0 && ((_0x41b185['rightIndex'] = _0x5343d7), _0x1f1ccd(SLOT_RIGHT, _0x5343d7));
      }
      _0x41b185['nextSlot'] = SLOT_RIGHT;
    } else ((_0x41b185['rightIndex'] = _0x9f712e), (_0x41b185['nextSlot'] = SLOT_LEFT));
    (_0x1f1ccd(_0x10d5db, _0x9f712e),
      _0x227664['syncVisibility'](),
      _0x182dcf() && _0x53fbaa === 'pan' && _0x3fbe56(![]),
      _0x4966af());
  }
  function _0x175e1a(_0x4e1522) {
    const _0x4034fe = _0x4e1522 === MODE_SIDE_BY_SIDE ? MODE_SIDE_BY_SIDE : MODE_SLIDE;
    ((_0x41b185['mode'] = _0x4034fe),
      (_0x2d457d['dataset']['comparisonMode'] = _0x4034fe),
      (_0x3f118f['hidden'] = _0x4034fe !== MODE_SLIDE),
      _0x59f480['classList']['toggle']('is-active', _0x4034fe === MODE_SLIDE),
      _0x5dff22['classList']['toggle']('is-active', _0x4034fe === MODE_SIDE_BY_SIDE),
      _0x59f480['setAttribute']('aria-pressed', String(_0x4034fe === MODE_SLIDE)),
      _0x5dff22['setAttribute']('aria-pressed', String(_0x4034fe === MODE_SIDE_BY_SIDE)),
      _0x519d09());
  }
  function _0x3ce7f9(_0x3037c9) {
    ((_0x41b185['dividerPercent'] = Math['round'](clamp(_0x3037c9, 0x0, 0x64) * 0x64) / 0x64),
      _0x2a0dfd(),
      _0x3f118f['setAttribute']('aria-valuenow', String(Math['round'](_0x41b185['dividerPercent']))));
  }
  function _0x1b1b21(_0x5969ed) {
    const _0x142b86 = _0x1e127b['getBoundingClientRect']?.(),
      _0x33c221 = Number(_0x1e127b['clientWidth'] || _0x142b86?.['width']) || 0x0;
    if (_0x33c221 <= 0x0) return;
    const _0x37f2e0 = Number(_0x142b86?.['left']) || 0x0;
    _0x3ce7f9(((Number(_0x5969ed?.['clientX']) - _0x37f2e0) / _0x33c221) * 0x64);
  }
  function _0x1d03a4(_0x308fbe) {
    if (_0xdf0b === null) return;
    if (_0x308fbe?.['pointerId'] != null && _0xdf0b != null && _0x308fbe['pointerId'] !== _0xdf0b) return;
    (_0x308fbe?.['preventDefault']?.(),
      _0x308fbe?.['stopPropagation']?.(),
      _0x541b40?.['removeEventListener']?.('pointermove', _0x43fee5, !![]),
      _0x541b40?.['removeEventListener']?.('pointerup', _0x1d03a4, !![]),
      _0x541b40?.['removeEventListener']?.('pointercancel', _0x1d03a4, !![]),
      _0x2d457d['classList']['remove']('is-dragging-divider'),
      (_0xdf0b = null));
  }
  function _0x43fee5(_0x1a6617) {
    if (_0xdf0b === null) return;
    if (_0x1a6617?.['pointerId'] != null && _0xdf0b != null && _0x1a6617['pointerId'] !== _0xdf0b) return;
    (_0x1a6617?.['preventDefault']?.(), _0x1a6617?.['stopPropagation']?.(), _0x1b1b21(_0x1a6617));
  }
  function _0x12193d(_0x216ebb) {
    if (_0x41b185['mode'] !== MODE_SLIDE) return;
    if (_0x37b381) return;
    if (_0x216ebb?.['button'] != null && _0x216ebb['button'] !== 0x0) return;
    (_0x216ebb?.['preventDefault']?.(),
      _0x216ebb?.['stopPropagation']?.(),
      _0x1d03a4(),
      (_0xdf0b = _0x216ebb?.['pointerId'] ?? 0x0),
      _0x2d457d['classList']['add']('is-dragging-divider'),
      _0x1b1b21(_0x216ebb),
      _0x541b40?.['addEventListener']?.('pointermove', _0x43fee5, !![]),
      _0x541b40?.['addEventListener']?.('pointerup', _0x1d03a4, !![]),
      _0x541b40?.['addEventListener']?.('pointercancel', _0x1d03a4, !![]));
  }
  function _0x39ed93(_0x1086cc) {
    if (_0x41b185['mode'] !== MODE_SLIDE) return;
    if (_0x1086cc['key'] !== 'ArrowLeft' && _0x1086cc['key'] !== 'ArrowRight') return;
    (_0x1086cc['preventDefault']?.(),
      _0x1086cc['stopPropagation']?.(),
      _0x3ce7f9(_0x41b185['dividerPercent'] + (_0x1086cc['key'] === 'ArrowRight' ? 0x2 : -0x2)));
  }
  function _0x282ee2() {
    (_0x541b40?.['removeEventListener']?.('pointermove', _0x17d65f, !![]),
      _0x541b40?.['removeEventListener']?.('pointerup', _0x11aa29, !![]),
      _0x541b40?.['removeEventListener']?.('pointercancel', _0x11aa29, !![]));
  }
  function _0xfaad3f() {
    (_0x282ee2(),
      _0xa29720['classList']['remove']('is-panning'),
      _0x2d457d['classList']['remove']('is-panning'),
      (_0x13ae53 = null));
  }
  function _0x276485(_0x5bd73a) {
    const _0x288480 = Number(_0x5bd73a?.['button']),
      _0x15069a = _0x37b381 && _0x288480 === 0x0;
    if (_0x288480 !== 0x1 && !_0x15069a) return;
    (_0x5bd73a['preventDefault']?.(),
      _0x5bd73a['stopPropagation']?.(),
      _0x1d03a4(),
      _0xfaad3f(),
      (_0x13ae53 = {
        pointerId: _0x5bd73a?.['pointerId'],
        startX: Number(_0x5bd73a?.['clientX'] || 0x0),
        startY: Number(_0x5bd73a?.['clientY'] || 0x0),
        scrollLeft: Number(_0x1e127b['scrollLeft'] || 0x0),
        scrollTop: Number(_0x1e127b['scrollTop'] || 0x0),
        captureTarget: _0x1e127b,
        usesSpaceHand: _0x15069a,
        moved: ![],
      }),
      _0xa29720['classList']['add']('is-panning'),
      _0x2d457d['classList']['add']('is-panning'),
      _0x1e127b['setPointerCapture']?.(_0x5bd73a?.['pointerId']),
      _0x541b40?.['addEventListener']?.('pointermove', _0x17d65f, !![]),
      _0x541b40?.['addEventListener']?.('pointerup', _0x11aa29, !![]),
      _0x541b40?.['addEventListener']?.('pointercancel', _0x11aa29, !![]));
  }
  function _0x17d65f(_0x435500) {
    if (!_0x13ae53) return;
    if (
      _0x13ae53['pointerId'] != null &&
      _0x435500?.['pointerId'] != null &&
      _0x435500['pointerId'] !== _0x13ae53['pointerId']
    )
      return;
    (_0x435500['preventDefault']?.(), _0x435500['stopPropagation']?.());
    const _0x4ca7d9 = Number(_0x435500?.['clientX'] || 0x0) - _0x13ae53['startX'],
      _0x52a947 = Number(_0x435500?.['clientY'] || 0x0) - _0x13ae53['startY'];
    (!_0x13ae53['moved'] &&
      Math['hypot'](_0x4ca7d9, _0x52a947) >= 0x2 &&
      ((_0x13ae53['moved'] = !![]), (_0x8d8223 = !![])),
      (_0x1e127b['scrollLeft'] = _0x13ae53['scrollLeft'] - _0x4ca7d9),
      (_0x1e127b['scrollTop'] = _0x13ae53['scrollTop'] - _0x52a947),
      _0x2a0dfd());
  }
  function _0x11aa29(_0x948b7d) {
    if (!_0x13ae53) return;
    if (
      _0x13ae53['pointerId'] != null &&
      _0x948b7d?.['pointerId'] != null &&
      _0x948b7d['pointerId'] !== _0x13ae53['pointerId']
    )
      return;
    (_0x948b7d?.['preventDefault']?.(), _0x948b7d?.['stopPropagation']?.());
    try {
      _0x13ae53['captureTarget']?.['releasePointerCapture']?.(_0x13ae53['pointerId']);
    } catch (_0x17b978) {}
    _0xfaad3f();
  }
  function _0x271953(_0x1a22c9) {
    return _0x1a22c9?.['code'] === 'Space' || _0x1a22c9?.['key'] === '\x20' || _0x1a22c9?.['key'] === 'Space';
  }
  function _0x318933(_0x5c9d49) {
    if (!_0x5c9d49) return ![];
    const _0x15fe4d = String(_0x5c9d49['tagName'] || '')['toLowerCase']();
    if (['button', 'input', 'select', 'textarea']['includes'](_0x15fe4d)) return !![];
    if (_0x5c9d49['isContentEditable'] === !![]) return !![];
    return _0x5c9d49['closest']?.("button, input, select, textarea, [contenteditable='true']") != null;
  }
  function _0x3fbe56(_0x277cc6) {
    ((_0x37b381 = _0x277cc6 === !![]), _0xa29720['classList']['toggle']('is-space-pan-ready', _0x37b381));
  }
  function _0x182dcf() {
    return (
      _0x4554cc(SLOT_LEFT)?.['kind'] === MATERIAL_COMPARISON_KIND_VIDEO &&
      _0x4554cc(SLOT_RIGHT)?.['kind'] === MATERIAL_COMPARISON_KIND_VIDEO
    );
  }
  function _0x31a91f(_0x573bf6) {
    if (!_0x271953(_0x573bf6)) return;
    if (!_0x53fbaa && !_0x37b381) return;
    (_0x573bf6['preventDefault']?.(),
      _0x573bf6['stopPropagation']?.(),
      _0x26edfc(),
      (_0x53fbaa = ''),
      _0x3fbe56(![]));
    if (_0x13ae53?.['usesSpaceHand']) _0x11aa29(_0x573bf6);
  }
  function _0x18ef07() {
    (_0x208b0a['cancelZoom'](),
      _0x26edfc(),
      (_0x53fbaa = ''),
      _0x3fbe56(![]),
      _0x1d03a4(),
      _0x11aa29(),
      (_0x8d8223 = ![]));
  }
  function _0x4039ef(_0x51c513) {
    if (Number(_0x51c513?.['button']) !== 0x1) return;
    (_0x51c513['preventDefault']?.(), _0x51c513['stopPropagation']?.());
  }
  const _0x502733 = () => {
    if (_0x3c21d7) return;
    ((_0x3c21d7 = !![]),
      _0x208b0a['dispose'](),
      _0x459093['finish'](),
      _0x7f9ba8['removeEventListener']?.('keydown', _0x6d6bde, !![]),
      _0x7f9ba8['removeEventListener']?.('keyup', _0x31a91f, !![]),
      _0x541b40?.['removeEventListener']?.('resize', _0x519d09),
      _0x541b40?.['removeEventListener']?.('blur', _0x18ef07),
      _0x541b40?.['removeEventListener']?.('aicanvas:active-canvas-changed', _0x502733),
      _0x18ef07());
    for (const _0x422690 of [SLOT_LEFT, SLOT_RIGHT]) {
      const _0x4ed1a5 = _0x3129f(_0x422690);
      (_0x4ed1a5['image']['removeEventListener']('load', _0x4ed1a5['onImageLoad']),
        _0x4ed1a5['image']['removeEventListener']('error', _0x4ed1a5['onImageError']));
      const _0x3f2b51 = _0x4554cc(_0x422690),
        _0x32a634 = _0x3f2b51?.['originalUrl'],
        _0x2d9ec9 =
          _0x3f2b51?.['kind'] !== MATERIAL_COMPARISON_KIND_VIDEO &&
          !_0x4ed1a5['image']['hidden'] &&
          _0x1d85a8?.['put'](
            _0x3f2b51['originalCacheKey'],
            { image: _0x4ed1a5['image'], url: _0x32a634, revokeUrlOnClose: _0x5148cd['has'](_0x32a634) },
            _0x1517a3,
          );
      if (_0x2d9ec9) _0x5148cd['delete'](_0x32a634);
      else _0x4ed1a5['image']['removeAttribute']?.('src');
    }
    (_0x227664['dispose'](),
      _0xa29720['remove'](),
      _0x2d4a1d?.(),
      (_0x2d4a1d = null),
      _0x5148cd['forEach'](safeRevokeObjectUrl),
      _0x5148cd['clear'](),
      activeMaterialComparisonClose === _0x502733 && (activeMaterialComparisonClose = null));
  };
  function _0x6d6bde(_0x3db6f6) {
    if (_0x3db6f6['key'] === 'Escape') {
      (_0x3db6f6['preventDefault']?.(), _0x3db6f6['stopPropagation']?.(), _0x502733());
      return;
    }
    if (!_0x271953(_0x3db6f6) || _0x318933(_0x3db6f6['target'])) return;
    (_0x3db6f6['preventDefault']?.(), _0x3db6f6['stopPropagation']?.(), _0x26edfc());
    if (_0x3db6f6['repeat']) return;
    if (_0x182dcf()) {
      ((_0x53fbaa = 'playback'), _0x3fbe56(![]), void _0x227664['togglePlayback'](_0x3db6f6));
      return;
    }
    ((_0x53fbaa = 'pan'), _0x3fbe56(!![]));
  }
  return (
    _0x59f480['addEventListener']('click', () => _0x175e1a(MODE_SLIDE)),
    _0x5dff22['addEventListener']('click', () => _0x175e1a(MODE_SIDE_BY_SIDE)),
    _0x3edbe6['addEventListener']('click', _0x502733),
    _0x2d457d['addEventListener']('pointerdown', _0x12193d),
    _0x3f118f['addEventListener']('pointerdown', _0x12193d),
    _0x3f118f['addEventListener']('pointerdown', _0x276485),
    _0x1e127b['addEventListener']('pointerdown', _0x276485),
    _0x1e127b['addEventListener']('auxclick', _0x4039ef),
    _0x3f118f['addEventListener']('auxclick', _0x4039ef),
    _0x1e127b['addEventListener']('scroll', _0x2a0dfd, { passive: !![] }),
    _0x9cfcc2['addEventListener']('wheel', _0x208b0a['zoomBy'], { passive: ![] }),
    _0x3f118f['addEventListener']('keydown', _0x39ed93),
    [SLOT_LEFT, SLOT_RIGHT]['forEach']((_0x4a0973) => {
      const _0x38ca30 = _0x3129f(_0x4a0973);
      ((_0x38ca30['onImageLoad'] = () => _0x6af538(_0x4a0973, _0x38ca30)),
        (_0x38ca30['onImageError'] = () => {
          if (_0x3c21d7 || _0x38ca30['entryKind'] === MATERIAL_COMPARISON_KIND_VIDEO) return;
          _0xc19381(_0x38ca30);
        }),
        _0x38ca30['image']['addEventListener']('load', _0x38ca30['onImageLoad']),
        _0x38ca30['image']['addEventListener']('error', _0x38ca30['onImageError']));
    }),
    _0x5c9960['forEach'](({ card: _0x86589 }, _0x394b10) => {
      _0x86589['addEventListener']('click', () => _0x5f28fb(_0x394b10));
    }),
    _0x353c8f['addEventListener'](
      'wheel',
      (_0x30a9b1) => {
        const _0x19ea61 = Math['max'](
          0x0,
          Number(_0x353c8f['scrollWidth'] || 0x0) - Number(_0x353c8f['clientWidth'] || 0x0),
        );
        if (_0x19ea61 <= 0x0) return;
        const _0x4e3542 = Number(_0x30a9b1['deltaY'] || _0x30a9b1['deltaX'] || 0x0);
        if (!_0x4e3542) return;
        const _0x466555 = Number(_0x353c8f['scrollLeft'] || 0x0),
          _0x650140 = clamp(_0x466555 + _0x4e3542, 0x0, _0x19ea61);
        if (_0x650140 !== _0x466555) _0x353c8f['scrollLeft'] = _0x650140;
        (_0x30a9b1['preventDefault']?.(), _0x30a9b1['stopPropagation']?.());
      },
      { passive: ![] },
    ),
    _0x1e127b['addEventListener']('click', (_0x17ad57) => {
      if (_0x8d8223) {
        ((_0x8d8223 = ![]), _0x17ad57['preventDefault']?.(), _0x17ad57['stopPropagation']?.());
        return;
      }
      if (_0x17ad57['target'] === _0x1e127b || _0x17ad57['target'] === _0x513efe) _0x502733();
    }),
    _0xa29720['addEventListener']('click', (_0x310a61) => {
      if (_0x310a61['target'] === _0xa29720) _0x502733();
    }),
    _0xa29720['addEventListener']('contextmenu', (_0x390c81) => {
      (_0x390c81['preventDefault']?.(), _0x390c81['stopPropagation']?.());
    }),
    _0x7f9ba8['addEventListener']?.('keydown', _0x6d6bde, !![]),
    _0x7f9ba8['addEventListener']?.('keyup', _0x31a91f, !![]),
    _0x541b40?.['addEventListener']?.('resize', _0x519d09),
    _0x541b40?.['addEventListener']?.('blur', _0x18ef07),
    _0x1f1ccd(SLOT_LEFT, _0x41b185['leftIndex']),
    _0x1f1ccd(SLOT_RIGHT, _0x41b185['rightIndex']),
    _0x227664['syncVisibility'](),
    _0x4966af(),
    _0x7f9ba8['body']['appendChild'](_0xa29720),
    _0x519d09(),
    (_0x2d4a1d = beginModalInteraction({
      root: _0xa29720,
      onClose: _0x502733,
      onSuspend: _0x502733,
      preferredSelector: '.v2-material-comparison-main',
    })),
    (activeMaterialComparisonClose = _0x502733),
    _0x541b40?.['addEventListener']?.('aicanvas:active-canvas-changed', _0x502733),
    (_0x502733['overlay'] = _0xa29720),
    (_0x502733['assignEntry'] = _0x5f28fb),
    (_0x502733['setMode'] = _0x175e1a),
    (_0x502733['getState'] = () => ({ ..._0x41b185 })),
    _0x502733
  );
}
