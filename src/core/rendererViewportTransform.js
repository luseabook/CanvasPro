import { syncViewportGridDots } from './viewportGridDots.js';
let lastZoomInv = null,
  lastZoomInvRaw = null,
  lastNodeLabelComp = null;
export function renderViewport(viewportEl, viewport, nodeLabels = false) {
  const originValue = '0 0';
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
    numericZoom = typeof zoom === 'number' && isFinite(zoom) ? zoom : 1,
    safeZoom = numericZoom > 0 ? numericZoom : 1,
    zoomInv = Math['min'](1 / safeZoom, 1 / minZoom),
    zoomInvRaw = 1 / safeZoom,
    labelComp = numericZoom > 0 ? Math['pow'](1 / numericZoom, 0.35) : 1,
    hasLabelsFlag = typeof nodeLabels === 'boolean',
    nodeLabelComp = nodeLabels === true ? Math['min'](labelComp, 1.6) : 1;
  (lastZoomInv !== zoomInv &&
    ((lastZoomInv = zoomInv), rootElement['style']['setProperty']('--zoom-inv', zoomInv)),
    lastZoomInvRaw !== zoomInvRaw &&
      ((lastZoomInvRaw = zoomInvRaw), rootElement['style']['setProperty']('--zoom-inv-raw', zoomInvRaw)),
    hasLabelsFlag &&
      lastNodeLabelComp !== nodeLabelComp &&
      ((lastNodeLabelComp = nodeLabelComp),
      rootElement['style']['setProperty']('--node-label-comp', nodeLabelComp)));
}
