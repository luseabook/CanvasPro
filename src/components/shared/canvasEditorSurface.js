import { worldToScreen } from '../../core/math.js';
export function createCanvasEditorSurface(_0x3504a0 = document) {
  const _0x19d6bd = _0x3504a0['createElement']('div');
  _0x19d6bd['className'] = 'v2-annotate-overlay';
  const _0x197625 = _0x3504a0['createElement']('div');
  _0x197625['className'] = 'v2-annotate-container';
  const _0x28a6f2 = _0x3504a0['createElement']('div');
  return (
    (_0x28a6f2['className'] = 'v2-annotate-stage'),
    _0x197625['appendChild'](_0x28a6f2),
    { overlay: _0x19d6bd, container: _0x197625, stage: _0x28a6f2 }
  );
}
export function createCanvasMediaFocusSurface({
  root: _0x27ea5c,
  target: _0x4f88e9,
  documentObject: documentObject = document,
}) {
  const _0x3f0d74 = documentObject['createElement']('div');
  _0x3f0d74['className'] = 'canvas-media-controls-layer';
  const _0x4717b2 = documentObject['createElement']('div');
  return (
    (_0x4717b2['className'] = 'canvas-media-focus-dim'),
    _0x3f0d74['append'](_0x4717b2),
    _0x27ea5c?.['setAttribute']('data-canvas-media-focus', ''),
    _0x4f88e9?.['setAttribute']('data-canvas-media-focus-target', ''),
    {
      overlay: _0x3f0d74,
      update(_0x345fbf) {
        ((_0x4717b2['style']['left'] = _0x345fbf['x'] + 'px'),
          (_0x4717b2['style']['top'] = _0x345fbf['y'] + 'px'),
          (_0x4717b2['style']['width'] = _0x345fbf['width'] + 'px'),
          (_0x4717b2['style']['height'] = _0x345fbf['height'] + 'px'));
      },
      release() {
        (_0x27ea5c?.['removeAttribute']('data-canvas-media-focus'),
          _0x4f88e9?.['removeAttribute']('data-canvas-media-focus-target'),
          _0x3f0d74['remove']());
      },
    }
  );
}
export function positionCanvasEditorSurface(_0x133dd7, _0xe0b307, _0x15bbc6) {
  const _0x21a53d = worldToScreen(_0xe0b307['x'], _0xe0b307['y'], _0x15bbc6),
    _0x19f236 = Math['round'](_0xe0b307['width'] * _0x15bbc6['zoom']),
    _0x5e481c = Math['round'](_0xe0b307['height'] * _0x15bbc6['zoom']);
  return (
    (_0x133dd7['style']['left'] = Math['round'](_0x21a53d['x']) + 'px'),
    (_0x133dd7['style']['top'] = Math['round'](_0x21a53d['y']) + 'px'),
    (_0x133dd7['style']['width'] = _0x19f236 + 'px'),
    (_0x133dd7['style']['height'] = _0x5e481c + 'px'),
    { ..._0x21a53d, width: _0x19f236, height: _0x5e481c }
  );
}
export function renderCanvasEditorSubmitButton(_0x7b5d8c) {
  const _0x30a6c2 = String(_0x7b5d8c)['replace'](/&/g, '&amp;')['replace'](/"/g, '&quot;');
  return (
    '<button class="v2-expand-toolbar-btn go img-gen-btn" title="' +
    _0x30a6c2 +
    '" aria-label="' +
    _0x30a6c2 +
    '">\n    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n  </button>'
  );
}
export function positionCanvasEditorToolbar(
  _0x5a9393,
  { center: _0x5b20a2, top: _0x428be2 },
  _0x3e7b34 = window,
) {
  const _0x4df118 = _0x5a9393['getBoundingClientRect']()['width'] / 0x2;
  ((_0x5a9393['style']['left'] =
    Math['max'](0xc + _0x4df118, Math['min'](_0x3e7b34['innerWidth'] - 0xc - _0x4df118, _0x5b20a2)) + 'px'),
    (_0x5a9393['style']['top'] =
      Math['max'](0xc, Math['min'](_0x3e7b34['innerHeight'] - _0x5a9393['offsetHeight'] - 0xc, _0x428be2)) +
      'px'),
    (_0x5a9393['style']['bottom'] = 'auto'),
    (_0x5a9393['style']['transform'] = 'translateX(-50%)'));
}
