import { isEmbeddedImage } from './whiteboardModel.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
export function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}
export function arrowHead(layer) {
  const angle = Math.atan2(layer.y2 - layer.y, layer.x2 - layer.x);
  const size = Math.max(14, layer.strokeWidth * 4);
  return [
    [layer.x2 - Math.cos(angle - Math.PI / 6) * size, layer.y2 - Math.sin(angle - Math.PI / 6) * size],
    [layer.x2, layer.y2],
    [layer.x2 - Math.cos(angle + Math.PI / 6) * size, layer.y2 - Math.sin(angle + Math.PI / 6) * size],
  ];
}
export function drawSvgLayer(layer) {
  const group = svgElement('g', { 'data-layer-id': layer.id });
  const style = { stroke: layer.color, 'stroke-width': layer.strokeWidth,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: layer.fill };
  switch (layer.type) {
    case 'pen':
      if (layer.points.length === 1) group.append(svgElement('circle', { cx: layer.points[0][0], cy: layer.points[0][1], r: layer.strokeWidth / 2, fill: layer.color }));
      else group.append(svgElement('polyline', { ...style, fill: 'none', points: layer.points.map(p => p.join(',')).join(' ') }));
      break;
    case 'rect': group.append(svgElement('rect', { ...style, x: layer.x, y: layer.y, width: layer.width, height: layer.height })); break;
    case 'ellipse': group.append(svgElement('ellipse', { ...style, cx: layer.x + layer.width / 2, cy: layer.y + layer.height / 2, rx: layer.width / 2, ry: layer.height / 2 })); break;
    case 'line':
    case 'arrow':
      group.append(svgElement('line', { ...style, x1: layer.x, y1: layer.y, x2: layer.x2, y2: layer.y2 }));
      if (layer.type === 'arrow') group.append(svgElement('polyline', { ...style, fill: 'none', points: arrowHead(layer).map(p => p.join(',')).join(' ') }));
      break;
    case 'text': {
      const text = svgElement('text', { x: layer.x, y: layer.y, fill: layer.color,
        'font-size': layer.fontSize, 'font-family': 'sans-serif', 'xml:space': 'preserve' });
      layer.text.split('\n').forEach((line, index) => {
        const span = svgElement('tspan', { x: layer.x, y: layer.y + layer.fontSize + index * layer.fontSize * 1.3 });
        span.textContent = line; text.append(span);
      });
      group.append(text); break;
    }
    case 'image': group.append(svgElement('image', { href: layer.src, x: layer.x, y: layer.y,
      width: layer.width, height: layer.height, preserveAspectRatio: 'none' })); break;
  }
  return group;
}
export function paintSvg(svg, board, selectedId = '') {
  svg.setAttribute('viewBox', `0 0 ${board.width} ${board.height}`);
  const fragment = document.createDocumentFragment();
  if (board.background !== 'transparent') fragment.append(svgElement('rect', { width: board.width, height: board.height, fill: board.background }));
  for (const layer of board.layers) fragment.append(drawSvgLayer(layer));
  const selected = board.layers.find(layer => layer.id === selectedId);
  if (selected) {
    const b = layerBounds(selected);
    fragment.append(svgElement('rect', { x: b.x - 4, y: b.y - 4, width: b.width + 8, height: b.height + 8,
      fill: 'none', stroke: '#6366f1', 'stroke-width': 2, 'stroke-dasharray': '6 4', 'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none' }));
  }
  svg.replaceChildren(fragment);
}
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image decode failed'));
    image.src = source;
  });
}
export async function renderWhiteboardPng(board) {
  const canvas = document.createElement('canvas');
  canvas.width = board.width; canvas.height = board.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  if (board.background !== 'transparent') { ctx.fillStyle = board.background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  // Render the same vectors directly, so exported pixels never contain selection borders.
  for (const layer of board.layers) {
    ctx.save(); ctx.strokeStyle = layer.color; ctx.fillStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (layer.type === 'image') ctx.drawImage(await loadImage(layer.src), layer.x, layer.y, layer.width, layer.height);
    else if (layer.type === 'text') {
      ctx.font = `${layer.fontSize}px sans-serif`; ctx.textBaseline = 'alphabetic';
      layer.text.split('\n').forEach((line, index) => ctx.fillText(line, layer.x, layer.y + layer.fontSize + index * layer.fontSize * 1.3));
    } else {
      ctx.beginPath();
      if (layer.type === 'rect') ctx.rect(layer.x, layer.y, layer.width, layer.height);
      else if (layer.type === 'ellipse') ctx.ellipse(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
      else if (layer.type === 'pen') {
        if (layer.points.length === 1) {
          ctx.arc(layer.points[0][0], layer.points[0][1], layer.strokeWidth / 2, 0, Math.PI * 2); ctx.fill();
          ctx.restore(); continue;
        }
        layer.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      } else {
        ctx.moveTo(layer.x, layer.y); ctx.lineTo(layer.x2, layer.y2);
        if (layer.type === 'arrow') arrowHead(layer).forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      }
      if ((layer.type === 'rect' || layer.type === 'ellipse') && layer.fill !== 'none') { ctx.fillStyle = layer.fill; ctx.fill(); }
      ctx.stroke();
    }
    ctx.restore();
  }
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
}
export async function importWhiteboardImage(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) throw new Error('IMAGE_LIMIT');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/png');
    if (!isEmbeddedImage(src)) throw new Error('IMAGE_LIMIT');
    return { src, width: canvas.width, height: canvas.height };
  } finally { URL.revokeObjectURL(url); }
}
