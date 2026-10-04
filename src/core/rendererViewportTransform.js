import { syncViewportGridDots } from './viewportGridDots.js';
let lastZoomInv = null,
  lastZoomInvRaw = null,
  lastNodeLabelComp = null;
export function renderViewport(viewportEl, viewport, nodeLabels = ![]) {
  const originValue = '0\x200';
  viewportEl['style']['transformOrigin'] !== originValue &&
    (viewportEl['style']['transformOrigin'] = originValue);
  const transform =
    'translate3d(' + viewport['x'] + 'px, ' + viewport['y'] + 'px, 0) scale(' + viewport['zoom'] + ')';
  (viewportEl['_lastTransform'] !== transform &&
    ((viewportEl['style']['transform'] = transform), (viewportEl['_lastTransform'] = transform)),
    syncViewportGridDots(viewportEl, viewport),
    syncViewportZoomCssVars(viewport['zoom'], nodeLabels));
}
export function syncViewportZoomCssVars(zoom, nodeLabels) {
  const rootElement = typeof document !== 'undefined' ? document['documentElement'] : null;
  if (!rootElement) return;
  const minZoom = 0.2 + 0.05 * 1.8,
    numericZoom = typeof zoom === 'number' && isFinite(zoom) ? zoom : 0x1,
    safeZoom = numericZoom > 0x0 ? numericZoom : 0x1,
    zoomInv = Math['min'](0x1 / safeZoom, 0x1 / minZoom),
    zoomInvRaw = 0x1 / safeZoom,
    labelComp = numericZoom > 0x0 ? Math['pow'](0x1 / numericZoom, 0.35) : 0x1,
    hasLabelsFlag = typeof nodeLabels === 'boolean',
    nodeLabelComp = nodeLabels === !![] ? Math['min'](labelComp, 1.6) : 0x1;
  (lastZoomInv !== zoomInv &&
    ((lastZoomInv = zoomInv), rootElement['style']['setProperty']('--zoom-inv', zoomInv)),
    lastZoomInvRaw !== zoomInvRaw &&
      ((lastZoomInvRaw = zoomInvRaw), rootElement['style']['setProperty']('--zoom-inv-raw', zoomInvRaw)),
    hasLabelsFlag &&
      lastNodeLabelComp !== nodeLabelComp &&
      ((lastNodeLabelComp = nodeLabelComp),
      rootElement['style']['setProperty']('--node-label-comp', nodeLabelComp)));
}
