// Serializable, immutable whiteboard data. No DOM objects or transient object URLs.
export const WHITEBOARD_SIZE = Object.freeze({ width: 720, height: 560 });
export const MAX_LAYERS = 500;
export const MAX_POINTS = 4000;
const TYPES = new Set(['pen', 'rect', 'ellipse', 'line', 'arrow', 'text', 'image']);

export function finite(value, fallback = 0, min = -16384, max = 16384) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
export function color(value, fallback = '#222222') {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
export function isEmbeddedImage(value) {
  return typeof value === 'string' && value.length <= 12 * 1024 * 1024 &&
    /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value);
}
export function newLayerId() {
  return globalThis.crypto?.randomUUID?.() || `wb-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function normalizeLayer(value, index = 0) {
  if (!value || !TYPES.has(value.type)) return null;
  const layer = {
    id: typeof value.id === 'string' && value.id ? value.id.slice(0, 120) : `layer-${index}`,
    type: value.type,
    x: finite(value.x), y: finite(value.y),
    width: finite(value.width, 1, 1, 8192), height: finite(value.height, 1, 1, 8192),
    color: color(value.color), fill: value.fill === 'none' ? 'none' : color(value.fill, 'none'),
    strokeWidth: finite(value.strokeWidth, 4, 1, 64),
  };
  if (value.type === 'pen') {
    layer.points = (Array.isArray(value.points) ? value.points : []).slice(0, MAX_POINTS)
      .filter(p => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
      .map(p => [finite(p[0]), finite(p[1])]);
    if (!layer.points.length) return null;
  }
  if (value.type === 'line' || value.type === 'arrow') {
    layer.x2 = finite(value.x2, layer.x);
    layer.y2 = finite(value.y2, layer.y);
  }
  if (value.type === 'text') {
    layer.text = String(value.text || '').slice(0, 2000);
    layer.fontSize = finite(value.fontSize, 32, 8, 256);
    if (!layer.text.trim()) return null;
  }
  if (value.type === 'image') {
    if (!isEmbeddedImage(value.src)) return null;
    layer.src = value.src;
  }
  return layer;
}
export function normalizeWhiteboard(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const seen = new Set();
  const layers = (Array.isArray(source.layers) ? source.layers : []).slice(0, MAX_LAYERS)
    .map(normalizeLayer).filter(Boolean).map((layer, index) => {
      let id = layer.id, suffix = index;
      while (seen.has(id)) id = `${layer.id}-${suffix++}`;
      seen.add(id);
      return { ...layer, id };
    });
  return {
    version: 1,
    width: finite(source.width, 1200, 128, 4096),
    height: finite(source.height, 800, 128, 4096),
    background: source.background === 'transparent' ? 'transparent' : color(source.background, '#ffffff'),
    layers,
  };
}
export function createWhiteboardNodeData({ id, x = 0, y = 0, width, height, name = '白板' } = {}) {
  return {
    id, type: 'whiteboard', name, x, y,
    width: finite(width, WHITEBOARD_SIZE.width, 480, 2400),
    height: finite(height, WHITEBOARD_SIZE.height, 360, 1800),
    whiteboard: normalizeWhiteboard(),
  };
}
export function layerBounds(layer) {
  if (layer.type === 'pen') {
    const xs = layer.points.map(p => p[0]), ys = layer.points.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, width: Math.max(1, Math.max(...xs) - x), height: Math.max(1, Math.max(...ys) - y) };
  }
  if (layer.type === 'line' || layer.type === 'arrow') {
    return { x: Math.min(layer.x, layer.x2), y: Math.min(layer.y, layer.y2),
      width: Math.max(1, Math.abs(layer.x2 - layer.x)), height: Math.max(1, Math.abs(layer.y2 - layer.y)) };
  }
  if (layer.type === 'text') {
    const lines = layer.text.split('\n');
    return { x: layer.x, y: layer.y,
      width: Math.max(layer.fontSize, ...lines.map(line => Array.from(line).length * layer.fontSize)),
      height: lines.length * layer.fontSize * 1.3 };
  }
  return { x: layer.x, y: layer.y, width: layer.width, height: layer.height };
}
export function moveLayer(layer, dx, dy) {
  const next = { ...layer, x: layer.x + dx, y: layer.y + dy };
  if (layer.points) next.points = layer.points.map(([x, y]) => [x + dx, y + dy]);
  if (layer.x2 !== undefined) { next.x2 = layer.x2 + dx; next.y2 = layer.y2 + dy; }
  return next;
}
export function scaleLayer(layer, factor) {
  const bounds = layerBounds(layer);
  const next = { ...layer, width: layer.width * factor, height: layer.height * factor };
  if (layer.points) next.points = layer.points.map(([x, y]) => [bounds.x + (x - bounds.x) * factor, bounds.y + (y - bounds.y) * factor]);
  if (layer.x2 !== undefined) {
    next.x = bounds.x + (layer.x - bounds.x) * factor;
    next.y = bounds.y + (layer.y - bounds.y) * factor;
    next.x2 = bounds.x + (layer.x2 - bounds.x) * factor;
    next.y2 = bounds.y + (layer.y2 - bounds.y) * factor;
  }
  if (layer.type === 'text') next.fontSize = finite(layer.fontSize * factor, 32, 8, 256);
  return next;
}
function segmentDistance(point, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - a[0]) * dx + (point.y - a[1]) * dy) / length)) : 0;
  return Math.hypot(point.x - a[0] - t * dx, point.y - a[1] - t * dy);
}
export function hitLayer(layers, point, tolerance = 8) {
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i], margin = tolerance + layer.strokeWidth / 2;
    if (layer.type === 'pen') {
      if (layer.points.length === 1 && segmentDistance(point, layer.points[0], layer.points[0]) <= margin) return layer;
      if (layer.points.some((p, index) => index > 0 && segmentDistance(point, layer.points[index - 1], p) <= margin)) return layer;
    } else if (layer.type === 'line' || layer.type === 'arrow') {
      if (segmentDistance(point, [layer.x, layer.y], [layer.x2, layer.y2]) <= margin) return layer;
    } else {
      const b = layerBounds(layer);
      if (point.x >= b.x - margin && point.x <= b.x + b.width + margin &&
          point.y >= b.y - margin && point.y <= b.y + b.height + margin) return layer;
    }
  }
  return null;
}
export function updateShape(layer, start, end) {
  if (layer.type === 'line' || layer.type === 'arrow') return { ...layer, x2: end.x, y2: end.y };
  return { ...layer, x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
    width: Math.max(1, Math.abs(end.x - start.x)), height: Math.max(1, Math.abs(end.y - start.y)) };
}
