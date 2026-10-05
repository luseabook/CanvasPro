import { worldToScreen } from '../../core/math.js';
export function createCanvasEditorSurface(el = document) {
  const overlay = el['createElement']('div');
  overlay['className'] = 'v2-annotate-overlay';
  const container = el['createElement']('div');
  container['className'] = 'v2-annotate-container';
  const stage = el['createElement']('div');
  return (
    (stage['className'] = 'v2-annotate-stage'),
    container['appendChild'](stage),
    { overlay: overlay, container: container, stage: stage }
  );
}
export function createCanvasMediaFocusSurface({
  root: root,
  target: target,
  documentObject: documentObject = document,
}) {
  const overlay2 = documentObject['createElement']('div');
  overlay2['className'] = 'canvas-media-controls-layer';
  const el2 = documentObject['createElement']('div');
  return (
    (el2['className'] = 'canvas-media-focus-dim'),
    overlay2['append'](el2),
    root?.['setAttribute']('data-canvas-media-focus', ''),
    target?.['setAttribute']('data-canvas-media-focus-target', ''),
    {
      overlay: overlay2,
      update(box) {
        ((el2['style']['left'] = box['x'] + 'px'),
          (el2['style']['top'] = box['y'] + 'px'),
          (el2['style']['width'] = box['width'] + 'px'),
          (el2['style']['height'] = box['height'] + 'px'));
      },
      release() {
        (root?.['removeAttribute']('data-canvas-media-focus'),
          target?.['removeAttribute']('data-canvas-media-focus-target'),
          overlay2['remove']());
      },
    }
  );
}
export function positionCanvasEditorSurface(el3, box2, box3) {
  const box4 = worldToScreen(box2['x'], box2['y'], box3),
    width = Math['round'](box2['width'] * box3['zoom']),
    height = Math['round'](box2['height'] * box3['zoom']);
  return (
    (el3['style']['left'] = Math['round'](box4['x']) + 'px'),
    (el3['style']['top'] = Math['round'](box4['y']) + 'px'),
    (el3['style']['width'] = width + 'px'),
    (el3['style']['height'] = height + 'px'),
    { ...box4, width: width, height: height }
  );
}
export function renderCanvasEditorSubmitButton(value) {
  const item = String(value)['replace'](/&/g, '&amp;')['replace'](/"/g, '&quot;');
  return (
    '<button class="v2-expand-toolbar-btn go img-gen-btn" title="' +
    item +
    '" aria-label="' +
    item +
    '">\n    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n  </button>'
  );
}
export function positionCanvasEditorToolbar(el4, { center: center, top: top }, key = window) {
  const index = el4['getBoundingClientRect']()['width'] / 2;
  ((el4['style']['left'] =
    Math['max'](12 + index, Math['min'](key['innerWidth'] - 12 - index, center)) + 'px'),
    (el4['style']['top'] =
      Math['max'](12, Math['min'](key['innerHeight'] - el4['offsetHeight'] - 12, top)) + 'px'),
    (el4['style']['bottom'] = 'auto'),
    (el4['style']['transform'] = 'translateX(-50%)'));
}
