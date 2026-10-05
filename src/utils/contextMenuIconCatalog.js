const ICON_ALIASES = Object['freeze']({
    folder: 'folder-open',
    open: 'folder-open',
    remove: 'delete',
    settings: 'edit',
  }),
  ICON_SHAPES = Object['freeze']({
    comment: [
      [
        'path',
        { d: 'M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3V11.5A7.5 7.5 0 0 1 10.5 4h2a7.5 7.5 0 0 1 7.5 7.5Z' },
      ],
      ['path', { d: 'M7 10h9M7 14h6' }],
    ],
    action: [
      ['circle', { cx: 12, cy: 12, r: 8.5 }],
      ['path', { d: 'M8.5 12h7M13 9.5l2.5 2.5-2.5 2.5' }],
    ],
    'add-to-canvas': [
      ['rect', { x: 3, y: 3, width: 18, height: 18, rx: 3 }],
      ['path', { d: 'M12 8v8M8 12h8' }],
    ],
    'add-to-library': [
      ['rect', { x: 4, y: 4, width: 6, height: 6, rx: 1 }],
      ['rect', { x: 14, y: 4, width: 6, height: 6, rx: 1 }],
      ['rect', { x: 4, y: 14, width: 6, height: 6, rx: 1 }],
      ['path', { d: 'M17 14v6M14 17h6' }],
    ],
    archive: [['path', { d: 'M4 7h16v13H4zM3 4h18v3H3zM9 11h6' }]],
    unarchive: [['path', { d: 'M4 9h16v11H4zM3 4h18v5H3zM12 17v-5M9.5 14.5 12 12l2.5 2.5' }]],
    audio: [
      ['path', { d: 'M9 18V5l12-2v13' }],
      ['circle', { cx: 6, cy: 18, r: 3 }],
      ['circle', { cx: 18, cy: 16, r: 3 }],
    ],
    cancel: [
      ['circle', { cx: 12, cy: 12, r: 9 }],
      ['path', { d: 'm9 9 6 6M15 9l-6 6' }],
    ],
    collage: [
      ['rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }],
      ['path', { d: 'M3 10h18M12 10v10' }],
    ],
    compare: [
      ['rect', { x: 3, y: 4, width: 8, height: 16, rx: 2 }],
      ['rect', { x: 13, y: 4, width: 8, height: 16, rx: 2 }],
      ['path', { d: 'm6 15 2-2 3 3M16 14l2-2 3 3' }],
    ],
    copy: [
      ['rect', { x: 8, y: 8, width: 12, height: 12, rx: 2 }],
      [
        'path',
        {
          d: 'M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3',
        },
      ],
    ],
    cut: [
      ['circle', { cx: 6, cy: 6, r: 3 }],
      ['circle', { cx: 6, cy: 18, r: 3 }],
      ['path', { d: 'm8.7 7.3 11.3 11.3M8.7 16.7 20 5.4' }],
    ],
    delete: [['path', { d: 'M4 7h16M9 7V4h6v3m2 0-1 13H8L7 7m3 4v5m4-5v5' }]],
    details: [
      ['circle', { cx: 12, cy: 12, r: 9 }],
      ['path', { d: 'M12 11v6M12 7h.01' }],
    ],
    disable: [
      [
        'path',
        {
          d: 'M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 21 12a13.4 13.4 0 0 1-2.1 3.2M6.2 6.2A13.1 13.1 0 0 0 3 12a10.7 10.7 0 0 0 12.1 7.5',
        },
      ],
    ],
    download: [['path', { d: 'M12 3v12m0 0 4-4m-4 4-4-4M5 19h14' }]],
    duplicate: [
      ['rect', { x: 8, y: 8, width: 12, height: 12, rx: 2 }],
      ['path', { d: 'M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3' }],
      ['path', { d: 'M14 11v6M11 14h6' }],
    ],
    edit: [['path', { d: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }]],
    enable: [
      ['path', { d: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z' }],
      ['circle', { cx: 12, cy: 12, r: 2.5 }],
    ],
    favorite: [
      [
        'path',
        {
          d: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z',
        },
      ],
    ],
    'folder-open': [
      ['path', { d: 'M3 7h6l2-2h10v4H6l-3 10V7Z' }],
      ['path', { d: 'M6 9h16l-3 10H3L6 9Z' }],
    ],
    fullscreen: [['path', { d: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5' }]],
    generated: [
      [
        'path',
        {
          d: 'M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14ZM5 13l.7 1.8 1.8.7-1.8.7L5 18l-.7-1.8-1.8-.7 1.8-.7L5 13Z',
        },
      ],
    ],
    grid: [
      ['rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }],
      ['path', { d: 'M3 10h18M10 3v18' }],
    ],
    image: [
      ['rect', { x: 3, y: 3, width: 18, height: 18, rx: 3 }],
      ['circle', { cx: 8.5, cy: 8.5, r: 1.5, fill: 'currentColor' }],
      ['polyline', { points: '21 15 16 10 5 21' }],
    ],
    model: [
      ['path', { d: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z' }],
      ['path', { d: 'm4 7.5 8 4.5 8-4.5M12 12v9' }],
    ],
    move: [
      ['path', { d: 'M3 7h6l2-2h10v14H3V7Z' }],
      ['path', { d: 'M8 13h8M13 10l3 3-3 3' }],
    ],
    paste: [
      ['rect', { x: 6, y: 5, width: 14, height: 16, rx: 2 }],
      ['path', { d: 'M9 5V3h8v2M4 17H3V7a2 2 0 0 1 2-2h1' }],
    ],
    reveal: [
      ['path', { d: 'M3 7h6l2-2h10v6' }],
      ['circle', { cx: 15, cy: 15, r: 4 }],
      ['path', { d: 'm18 18 3 3' }],
    ],
    save: [
      ['path', { d: 'M5 3h12l2 2v16H5V3Z' }],
      ['path', { d: 'M8 3v6h8V3M8 21v-7h8v7' }],
    ],
    'save-as': [
      ['path', { d: 'M5 3h10l4 4v14H5V3Z' }],
      ['path', { d: 'M8 3v6h7M12 13v6M9 16h6' }],
    ],
    'package-export': [
      ['rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }],
      ['path', { d: 'M8 9h8M12 9v6m0 0-3-3m3 3 3-3' }],
    ],
    'select-all': [
      ['path', { d: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5' }],
      ['rect', { x: 8, y: 8, width: 8, height: 8, rx: 1 }],
    ],
    send: [
      ['path', { d: 'm22 2-7 20-4-9-9-4 20-7Z' }],
      ['path', { d: 'M22 2 11 13' }],
    ],
    source: [
      ['path', { d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z' }],
      ['path', { d: 'M14 3v6h6M8 13h8M8 17h5' }],
    ],
    text: [['path', { d: 'M4 5h16M12 5v14M8 19h8' }]],
    tone: [['path', { d: 'M3 12h2l2-6 3 12 3-13 3 14 2-7h3' }]],
    undo: [['path', { d: 'M9 7 4 12l5 5M4 12h9a7 7 0 0 1 7 7' }]],
    update: [
      ['path', { d: 'M20 7v5h-5M4 17v-5h5' }],
      [
        'path',
        {
          d: 'M6.1 8A7 7 0 0 1 18 6l2 6M17.9 16A7 7 0 0 1 6 18l-2-6',
        },
      ],
    ],
    video: [
      ['rect', { x: 2, y: 6, width: 15, height: 12, rx: 2 }],
      ['path', { d: 'M17 9l5-3v12l-5-3V9z' }],
    ],
  });
export const CONTEXT_MENU_ICON_IDS = Object['freeze'](Object['keys'](ICON_SHAPES));
export function resolveContextMenuIconDefinition(iconId) {
  const normalizedId = String(iconId || '')['trim']();
  if (!normalizedId) return null;
  const resolvedId = ICON_ALIASES[normalizedId] || normalizedId,
    shapes = ICON_SHAPES[resolvedId];
  return shapes ? { id: resolvedId, shapes: shapes } : null;
}
