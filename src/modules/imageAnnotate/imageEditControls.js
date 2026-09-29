import { t } from '../../i18n/index.js';
import { normalizeRotationDegrees, getImageRotationLayout, worldToScreen } from '../../core/math.js';
import { positionCanvasEditorToolbar } from '../../components/shared/canvasEditorSurface.js';
import { bindRotationDrag } from './rotationDrag.js';
import { bindEditPopover } from './editPopover.js';
import { scrollElementHorizontallyWithWheel } from '../workspaceHorizontalWheel.js';
const text = (_0x5438f3) => t('imageAnnotate.edit.' + _0x5438f3),
  layoutKeys = new WeakMap();
export function getImageRotation(_0x122ffc = []) {
  return normalizeRotationDegrees(
    _0x122ffc['reduce']((_0xc70398, _0x16ca74) => {
      if (_0x16ca74?.['type'] === 'rotate-image') return _0xc70398 + (Number(_0x16ca74['degrees']) || 0x0);
      if (_0x16ca74?.['type'] === 'flip-horizontal' || _0x16ca74?.['type'] === 'flip-vertical')
        return -_0xc70398;
      return _0xc70398;
    }, 0x0),
  );
}
export const getEditorRotation = (_0x50dc40) =>
  _0x50dc40['_rotationPreview'] ?? getImageRotation(_0x50dc40['_commands']);
export const getKeepImageRatio = (_0x2889c9 = []) =>
  _0x2889c9['findLast']((_0x1ca174) => _0x1ca174?.['type'] === 'keep-image-ratio')?.['enabled'] === !![];
export function setImageRotation(_0x3d1bf3, _0x5ddd00) {
  if (
    !_0x3d1bf3['active'] ||
    !_0x3d1bf3['_isAnnotateScene']() ||
    _0x3d1bf3['_draft'] ||
    !Number['isFinite'](Number(_0x5ddd00))
  )
    return;
  const _0x337bf5 = normalizeRotationDegrees(_0x5ddd00),
    _0x1a476d = getImageRotation(_0x3d1bf3['_commands']);
  if (_0x337bf5 === _0x1a476d) return;
  (_0x3d1bf3['_removeTextInput'](!![]),
    _0x3d1bf3['_commands']['push']({ type: 'rotate-image', degrees: _0x337bf5 - _0x1a476d }),
    (_0x3d1bf3['_redoStack'] = []),
    (_0x3d1bf3['_dirty'] = !![]),
    _0x3d1bf3['_render']());
}
export function syncImageEditControls(_0x2ecf32) {
  if (!_0x2ecf32['_isAnnotateScene']()) return;
  const _0x22622a = getEditorRotation(_0x2ecf32),
    _0x287e99 = getKeepImageRatio(_0x2ecf32['_commands']),
    _0xbe42a1 = _0x2ecf32['_imageEditControls'],
    _0x5146e6 = _0xbe42a1?.['input'];
  if (
    _0x5146e6 &&
    (_0x2ecf32['_rotationPreview'] != null || _0x5146e6['ownerDocument']['activeElement'] !== _0x5146e6)
  )
    _0x5146e6['value'] = String(_0x22622a);
  (_0xbe42a1?.['keepButton']['classList']['toggle']('active', _0x287e99),
    _0xbe42a1?.['keepButton']['setAttribute']('aria-pressed', String(_0x287e99)),
    _0x2ecf32['containerEl']?.['classList']['toggle']('is-ratio-locked', _0x287e99));
  const _0x2bb258 = _0x2ecf32['_view']?.['node'],
    _0x4b461c = _0x2ecf32['_view']?.['viewport'];
  if (!_0x2bb258 || !_0x4b461c || !_0x2ecf32['toolbarEl']) return;
  const _0xde2ed4 = _0xbe42a1 && !_0xbe42a1['menu']['panel']['hidden'],
    _0x32c6f5 = _0xde2ed4 ? _0xbe42a1['anchorDegrees'] : _0x22622a,
    _0x5d249c = _0xde2ed4 ? _0xbe42a1['anchorRatio'] : _0x287e99,
    _0x2a01a4 = [
      _0x32c6f5,
      _0x5d249c,
      _0x2bb258['x'],
      _0x2bb258['y'],
      _0x2bb258['width'],
      _0x2bb258['height'],
      _0x4b461c['x'],
      _0x4b461c['y'],
      _0x4b461c['zoom'],
      _0x4b461c['_screenOriginX'],
      _0x4b461c['_screenOriginY'],
      window['innerWidth'],
      window['innerHeight'],
    ]['join'](':');
  if (layoutKeys['get'](_0x2ecf32['toolbarEl']) === _0x2a01a4) return;
  layoutKeys['set'](_0x2ecf32['toolbarEl'], _0x2a01a4);
  const _0x28a645 = getImageRotationLayout(_0x2bb258['width'], _0x2bb258['height'], _0x32c6f5, _0x5d249c),
    _0x25c663 = worldToScreen(
      _0x2bb258['x'] + _0x2bb258['width'] / 0x2,
      _0x2bb258['y'] + _0x2bb258['height'] / 0x2,
      _0x4b461c,
    );
  (positionCanvasEditorToolbar(_0x2ecf32['toolbarEl'], {
    center: _0x25c663['x'],
    top:
      _0x25c663['y'] -
      (_0x28a645['height'] * _0x4b461c['zoom']) / 0x2 -
      _0x2ecf32['toolbarEl']['offsetHeight'] -
      0xc,
  }),
    _0xbe42a1?.['colorMenu']['position'](),
    _0xbe42a1?.['menu']['position']());
}
export function mountImageEditControls(_0x232328) {
  const _0x5a6b55 = _0x232328['toolbarEl'];
  (_0x5a6b55['classList']['add']('v2-image-edit-toolbar'),
    _0x5a6b55['setAttribute']('aria-label', text('title')));
  const _0x3cc01f = (_0xfdcbed) =>
    scrollElementHorizontallyWithWheel(_0xfdcbed, _0x5a6b55, { stopPropagation: !![] });
  (_0x5a6b55['addEventListener']('wheel', _0x3cc01f, { passive: ![] }),
    _0x232328['containerEl']['classList']['add']('v2-image-edit-surface'),
    (_0x232328['_rotationPreview'] = null));
  const _0x738901 = _0x5a6b55['ownerDocument'],
    _0x1216e9 = _0x738901['createElement']('button');
  ((_0x1216e9['type'] = 'button'),
    (_0x1216e9['className'] = 'v2-annotate-btn icon-only act-image-edit'),
    _0x1216e9['setAttribute']('aria-label', text('title')),
    _0x1216e9['setAttribute']('data-tooltip', text('title')),
    (_0x1216e9['innerHTML'] =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="m3 13 4-4 4 4 3-3 3 3M20 8v10a2 2 0 0 1-2 2H8m0-3-3 3 3 3"/></svg>'),
    _0x5a6b55['insertBefore'](_0x1216e9, _0x5a6b55['querySelector']('.tool-btn')));
  const _0x5abefc = _0x738901['createElement']('div');
  ((_0x5abefc['className'] = 'v2-image-edit-menu'),
    _0x5abefc['setAttribute']('role', 'dialog'),
    _0x5abefc['setAttribute']('aria-label', text('title')));
  const _0x30d518 = (_0x4161b3, _0x418493) => {
    const _0x2fe9db = _0x738901['createElement']('button');
    return (
      (_0x2fe9db['type'] = 'button'),
      (_0x2fe9db['className'] = 'v2-annotate-btn'),
      (_0x2fe9db['textContent'] = _0x4161b3),
      _0x2fe9db['addEventListener']('click', _0x418493),
      _0x5abefc['append'](_0x2fe9db),
      _0x2fe9db
    );
  };
  for (const _0x18a46c of ['.act-flip-horizontal', '.act-flip-vertical']) {
    const _0x560489 = _0x5a6b55['querySelector'](_0x18a46c),
      _0x185ad0 = _0x560489['getAttribute']('data-tooltip');
    (_0x560489['classList']['remove']('icon-only'), _0x560489['removeAttribute']('data-tooltip'));
    const _0x5510f0 = _0x738901['createElement']('span');
    ((_0x5510f0['textContent'] = _0x185ad0),
      _0x560489['append'](_0x5510f0),
      _0x560489['addEventListener']('click', () =>
        _0x18a46c === '.act-flip-horizontal' ? _0x232328['_flipHorizontal']() : _0x232328['_flipVertical'](),
      ),
      _0x5abefc['append'](_0x560489));
  }
  const _0x4ac797 = _0x738901['createElement']('label');
  ((_0x4ac797['className'] = 'v2-annotate-btn v2-image-edit-angle-wrap'),
    _0x4ac797['append'](text('rotation')));
  const _0xec7266 = _0x738901['createElement']('input');
  ((_0xec7266['type'] = 'number'),
    (_0xec7266['step'] = '0.1'),
    (_0xec7266['value'] = '0'),
    (_0xec7266['className'] = 'v2-image-edit-angle'),
    _0xec7266['setAttribute']('aria-label', text('angle')),
    _0xec7266['setAttribute']('data-tooltip', text('dragHint')));
  const _0x1a2869 = () => {
    if (_0xec7266['value']['trim']() && _0xec7266['validity']['valid'])
      setImageRotation(_0x232328, Number(_0xec7266['value']));
    _0xec7266['value'] = String(getImageRotation(_0x232328['_commands']));
  };
  (_0xec7266['addEventListener']('change', _0x1a2869),
    _0xec7266['addEventListener']('keydown', (_0x10502b) => {
      (_0x10502b['stopPropagation'](),
        _0x10502b['key'] === 'Enter' && (_0x10502b['preventDefault'](), _0x1a2869(), _0x5abefc['focus']()),
        _0x10502b['key'] === 'Escape' &&
          ((_0xec7266['value'] = String(getImageRotation(_0x232328['_commands']))), _0x5abefc['focus']()));
    }),
    _0x4ac797['append'](_0xec7266, '°'),
    _0x5abefc['append'](_0x4ac797));
  const _0x14b8d5 = _0x30d518(text('keepRatio'), () => {
    (_0x232328['_commands']['push']({
      type: 'keep-image-ratio',
      enabled: !getKeepImageRatio(_0x232328['_commands']),
    }),
      (_0x232328['_redoStack'] = []),
      (_0x232328['_dirty'] = !![]),
      _0x232328['_render']());
  });
  (_0x14b8d5['setAttribute']('aria-pressed', 'false'),
    _0x30d518(text('reset'), () => setImageRotation(_0x232328, 0x0)));
  const _0x341097 = () => {
      ((_0x232328['_rotationPreview'] = null), _0x232328['_render']());
    },
    _0x459e25 = bindRotationDrag(_0xec7266, {
      read: () => getImageRotation(_0x232328['_commands']),
      preview: (_0xeadc78) => {
        ((_0x232328['_rotationPreview'] = normalizeRotationDegrees(_0xeadc78)), _0x232328['_render']());
      },
      commit: (_0x20d79e) => {
        ((_0x232328['_rotationPreview'] = null),
          setImageRotation(_0x232328, _0x20d79e),
          _0x232328['_render']());
      },
      cancel: _0x341097,
    }),
    _0x458962 = bindEditPopover(_0x1216e9, _0x5abefc, {
      onOpen: () => {
        (_0x5ee5c9['close'](),
          (_0x232328['_imageEditControls']['anchorDegrees'] = getEditorRotation(_0x232328)),
          (_0x232328['_imageEditControls']['anchorRatio'] = getKeepImageRatio(_0x232328['_commands'])));
      },
      onClose: (_0x3b5ff) => {
        if (!_0x3b5ff || !_0x5a6b55['contains'](_0x3b5ff['target'])) syncImageEditControls(_0x232328);
      },
    }),
    _0x401564 = _0x232328['colorMenuEl'];
  _0x401564['classList']['add']('v2-image-edit-color-menu');
  const _0x5ee5c9 = bindEditPopover(_0x232328['colorWrapEl']['querySelector']('button'), _0x401564, {
    onOpen: () => _0x458962['close'](),
  });
  _0x232328['_imageEditControls'] = {
    input: _0xec7266,
    keepButton: _0x14b8d5,
    menu: _0x458962,
    colorMenu: _0x5ee5c9,
    closeColorMenu: () => _0x5ee5c9['close'](),
    destroy() {
      (_0x459e25(),
        _0x458962['destroy'](),
        _0x5ee5c9['destroy'](),
        _0x5a6b55['removeEventListener']('wheel', _0x3cc01f),
        (_0x232328['_rotationPreview'] = null));
    },
  };
}
