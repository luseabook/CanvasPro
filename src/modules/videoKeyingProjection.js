function toPositiveFinite(value) {
  const count = Number(value);
  return Number['isFinite'](count) && count > 0x0 ? count : 0x0;
}
function normalizeRect(box) {
  if (!box) return null;
  const left = Number(box['left']),
    top = Number(box['top']),
    width = toPositiveFinite(box['width']),
    height = toPositiveFinite(box['height']);
  if (!Number['isFinite'](left) || !Number['isFinite'](top) || !width || !height) return null;
  return { left: left, top: top, width: width, height: height };
}
function buildVideoProjection(item) {
  const rect = normalizeRect(item?.['rect']),
    ew = toPositiveFinite(item?.['elementWidth']),
    eh = toPositiveFinite(item?.['elementHeight']),
    vw = toPositiveFinite(item?.['mediaWidth']),
    vh = toPositiveFinite(item?.['mediaHeight']);
  if (!rect || !ew || !eh || !vw || !vh) return null;
  const fit = item?.['objectFit'] === 'cover' ? 'cover' : 'contain',
    scale = fit === 'cover' ? Math['max'](ew / vw, eh / vh) : Math['min'](ew / vw, eh / vh),
    sx = rect['width'] / ew,
    sy = rect['height'] / eh;
  if (
    !Number['isFinite'](scale) ||
    scale <= 0x0 ||
    !Number['isFinite'](sx) ||
    sx <= 0x0 ||
    !Number['isFinite'](sy) ||
    sy <= 0x0
  )
    return null;
  const dw = vw * scale,
    dh = vh * scale;
  return Object['freeze']({
    rect: rect,
    ew: ew,
    eh: eh,
    vw: vw,
    vh: vh,
    fit: fit,
    scale: scale,
    dw: dw,
    dh: dh,
    ox: (ew - dw) / 0x2,
    oy: (eh - dh) / 0x2,
    sx: sx,
    sy: sy,
  });
}
function buildLayerProjection(box2) {
  const rect2 = normalizeRect(box2?.['rect']),
    lw = toPositiveFinite(box2?.['width']),
    lh = toPositiveFinite(box2?.['height']);
  if (!rect2 || !lw || !lh) return null;
  const sx2 = rect2['width'] / lw,
    sy2 = rect2['height'] / lh;
  if (!Number['isFinite'](sx2) || sx2 <= 0x0 || !Number['isFinite'](sy2) || sy2 <= 0x0) return null;
  return Object['freeze']({ rect: rect2, lw: lw, lh: lh, sx: sx2, sy: sy2 });
}
function clampNormalized(key) {
  return Math['max'](0x0, Math['min'](0x1, Number(key) || 0x0));
}
export function createVideoKeyingProjection({ video: video, layer: layer = null } = {}) {
  const videoProjection = buildVideoProjection(video);
  if (!videoProjection) return null;
  const layer2 = buildLayerProjection(layer),
    pickClientPoint = (index, result) => {
      const data = (Number(index) - videoProjection['rect']['left']) / videoProjection['sx'],
        options = (Number(result) - videoProjection['rect']['top']) / videoProjection['sy'];
      if (!Number['isFinite'](data) || !Number['isFinite'](options)) return null;
      if (
        videoProjection['fit'] !== 'cover' &&
        (data < videoProjection['ox'] ||
          data > videoProjection['ox'] + videoProjection['dw'] ||
          options < videoProjection['oy'] ||
          options > videoProjection['oy'] + videoProjection['dh'])
      )
        return null;
      const target = (data - videoProjection['ox']) / videoProjection['scale'],
        source = (options - videoProjection['oy']) / videoProjection['scale'];
      if (!Number['isFinite'](target) || !Number['isFinite'](source)) return null;
      return {
        nx: clampNormalized(target / videoProjection['vw']),
        ny: clampNormalized(source / videoProjection['vh']),
        videoProjection: videoProjection,
      };
    },
    normalizedToLayerPoint = (next, current) => {
      if (!layer2) return null;
      const entry =
          videoProjection['ox'] + clampNormalized(next) * videoProjection['vw'] * videoProjection['scale'],
        record =
          videoProjection['oy'] + clampNormalized(current) * videoProjection['vh'] * videoProjection['scale'],
        payload = videoProjection['rect']['left'] + entry * videoProjection['sx'],
        handle = videoProjection['rect']['top'] + record * videoProjection['sy'],
        x = (payload - layer2['rect']['left']) / layer2['sx'],
        y = (handle - layer2['rect']['top']) / layer2['sy'];
      if (!Number['isFinite'](x) || !Number['isFinite'](y)) return null;
      return { x: x, y: y };
    },
    getVideoRectInLayer = () => {
      const x2 = normalizedToLayerPoint(0x0, 0x0),
        box3 = normalizedToLayerPoint(0x1, 0x1);
      if (!x2 || !box3) return null;
      return {
        x: x2['x'],
        y: x2['y'],
        width: Math['max'](0x1, box3['x'] - x2['x']),
        height: Math['max'](0x1, box3['y'] - x2['y']),
      };
    };
  return Object['freeze']({
    video: videoProjection,
    layer: layer2,
    pickClientPoint: pickClientPoint,
    normalizedToLayerPoint: normalizedToLayerPoint,
    getVideoRectInLayer: getVideoRectInLayer,
  });
}
function readObjectFit(state) {
  const config = state?.['ownerDocument']?.['defaultView'] || globalThis['window'];
  return config?.['getComputedStyle']?.(state)?.['objectFit'] || 'contain';
}
export function measureVideoKeyingProjection({
  videoElement: videoElement,
  layerElement: layerElement = null,
} = {}) {
  if (!videoElement?.['getBoundingClientRect']) return null;
  const layer3 = layerElement?.['getBoundingClientRect']
    ? {
        rect: layerElement['getBoundingClientRect'](),
        width: Number(layerElement['offsetWidth']) || Number(layerElement['clientWidth']),
        height: Number(layerElement['offsetHeight']) || Number(layerElement['clientHeight']),
      }
    : null;
  return createVideoKeyingProjection({
    video: {
      rect: videoElement['getBoundingClientRect'](),
      elementWidth: videoElement['offsetWidth'],
      elementHeight: videoElement['offsetHeight'],
      mediaWidth: videoElement['videoWidth'],
      mediaHeight: videoElement['videoHeight'],
      objectFit: readObjectFit(videoElement),
    },
    layer: layer3,
  });
}
