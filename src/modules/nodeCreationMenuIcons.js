const SVG_NS = 'http://www.w3.org/2000/svg',
  ICON_ALIASES = Object['freeze']({
    'source-text': 'ai-text',
    'source-image': 'ai-image',
    'source-video': 'ai-video',
    'source-audio': 'ai-audio',
    'panorama-360': 'panorama-scene',
  }),
  ICON_SHAPES = Object['freeze']({
    'ai-text': [
      ['path', { d: 'M12 20h9' }],
      ['path', { d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }],
    ],
    'ai-image': [
      ['rect', { x: 0x3, y: 0x3, width: 0x12, height: 0x12, rx: 0x3 }],
      ['circle', { cx: 8.5, cy: 8.5, r: 1.5, fill: 'currentColor' }],
      ['polyline', { points: '21\x2015\x2016\x2010\x205\x2021' }],
    ],
    'ai-video': [
      ['rect', { x: 0x2, y: 0x6, width: 0xf, height: 0xc, rx: 0x2 }],
      ['path', { d: 'M17 9l5-3v12l-5-3V9z' }],
    ],
    'ai-audio': [
      ['path', { d: 'M9 18V5l12-2v13' }],
      ['circle', { cx: 0x6, cy: 0x12, r: 0x3 }],
      ['circle', { cx: 0x12, cy: 0x10, r: 0x3 }],
    ],
    'comment-note': [
      ['rect', { x: 0x4, y: 0x4, width: 0x10, height: 0x10, rx: 0x2 }],
      ['path', { d: 'M8 9h8M8 13h6M15 20v-4h5' }],
    ],
    'panorama-scene': [
      ['circle', { cx: 0xc, cy: 0xc, r: 8.5 }],
      ['path', { d: 'M3.5 12h17M12 3.5c4.7 5.1 4.7 11.9 0 17M12 3.5c-4.7 5.1-4.7 11.9 0 17' }],
    ],
    storyboard: [
      ['rect', { x: 0x3, y: 0x3, width: 0x12, height: 0x12, rx: 0x2 }],
      ['path', { d: 'M3 9h18M3 15h18M9 3v18M15 3v18' }],
    ],
    'storyboard-script': [
      ['rect', { x: 0x3, y: 0x4, width: 0x12, height: 0x10, rx: 0x2 }],
      ['path', { d: 'M3\x209h18M3\x2014h18M8\x204v16' }],
    ],
    collage: [
      ['rect', { x: 0x3, y: 0x4, width: 0x12, height: 0x10, rx: 0x2 }],
      ['path', { d: 'M3\x2010h18M12\x2010v10' }],
    ],
    whiteboard: [
      ['rect', { x: 0x3, y: 0x4, width: 0x12, height: 0x10, rx: 0x2 }],
      ['path', { d: 'M7 8h10M7 15c2.2-3 4.6-3 6.8 0 1.1 1.5 2.2 1.5 3.2 0' }],
    ],
    'web-preview': [
      ['circle', { cx: 0xc, cy: 0xc, r: 0x9 }],
      ['path', { d: 'M3 12h18M12 3c4.7 5.1 4.7 12.9 0 18M12 3c-4.7 5.1-4.7 12.9 0 18' }],
    ],
    'media-clip': [
      [
        'path',
        {
          d: 'M6\x203v12a3\x203\x200\x200\x200\x203\x203h12M3\x206h12a3\x203\x200\x200\x201\x203\x203v12M3\x203l18\x2018',
        },
      ],
    ],
    debug: [
      [
        'path',
        {
          d: 'M14.7\x206.3a1\x201\x200\x200\x200\x200\x201.4l1.6\x201.6a1\x201\x200\x200\x200\x201.4\x200l3.8-3.8a6\x206\x200\x200\x201-8\x208l-6.9\x206.9a2.1\x202.1\x200\x200\x201-3-3l6.9-6.9a6\x206\x200\x200\x201\x208-8z',
        },
      ],
    ],
    'section-generation': [
      [
        'path',
        {
          d: 'M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14zM5 13l.7 1.8 1.8.7-1.8.7L5 18l-.7-1.8-1.8-.7 1.8-.7L5 13z',
        },
      ],
    ],
    'section-source': [['path', { d: 'M12 3v12M7 10l5 5 5-5M5 20h14' }]],
    'section-function': [
      ['rect', { x: 0x4, y: 0x4, width: 0x6, height: 0x6, rx: 0x1 }],
      ['rect', { x: 0xe, y: 0x4, width: 0x6, height: 0x6, rx: 0x1 }],
      ['rect', { x: 0x4, y: 0xe, width: 0x6, height: 0x6, rx: 0x1 }],
      ['rect', { x: 0xe, y: 0xe, width: 0x6, height: 0x6, rx: 0x1 }],
    ],
    'add-node': [
      ['rect', { x: 0x3, y: 0x3, width: 0x12, height: 0x12, rx: 0x3 }],
      ['path', { d: 'M12 8v8M8 12h8' }],
    ],
    upload: [['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' }]],
    paste: [
      ['rect', { x: 0x6, y: 0x5, width: 0xe, height: 0x10, rx: 0x2 }],
      ['path', { d: 'M9 5V3h8v2M4 17H3V7a2 2 0 0 1 2-2h1' }],
    ],
    undo: [['path', { d: 'M9 7l-5 5 5 5M4 12h9a7 7 0 0 1 7 7' }]],
    redo: [['path', { d: 'M15\x207l5\x205-5\x205M20\x2012h-9a7\x207\x200\x200\x200-7\x207' }]],
  });
function appendShape(value, el, item, key) {
  const el2 = value['createElementNS'](SVG_NS, item);
  (Object['entries'](key)['forEach'](([index, result]) => {
    el2['setAttribute'](index, String(result));
  }),
    el['appendChild'](el2));
}
export function createNodeCreationMenuIcon(
  data,
  { documentObject: documentObject = globalThis['document'], stroke: stroke = 'currentColor' } = {},
) {
  if (typeof documentObject?.['createElementNS'] !== 'function') return null;
  const options = ICON_ALIASES[data] || data,
    list = ICON_SHAPES[options];
  if (!list) return null;
  const el3 = documentObject['createElementNS'](SVG_NS, 'svg');
  return (
    el3['setAttribute']('width', '18'),
    el3['setAttribute']('height', '18'),
    el3['setAttribute']('viewBox', '0 0 24 24'),
    el3['setAttribute']('fill', 'none'),
    el3['setAttribute']('stroke', stroke),
    el3['setAttribute']('stroke-width', '1.8'),
    el3['setAttribute']('stroke-linecap', 'round'),
    el3['setAttribute']('stroke-linejoin', 'round'),
    el3['setAttribute']('aria-hidden', 'true'),
    (el3['dataset']['nodeCreationIcon'] = String(data || '')),
    list['forEach'](([target, source]) => {
      appendShape(documentObject, el3, target, source);
    }),
    el3
  );
}
