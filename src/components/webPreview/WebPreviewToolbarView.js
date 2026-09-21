import { createIcon, createIconButton, stopNodeDragPropagation } from './webPreviewDomUtils.js';
import { t } from '../../i18n/index.js';
const LINK_ICON = [
  'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
  'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
];
function webPreviewText(_0xa8fd, _0x15f02f = {}) {
  return t('webPreview.' + _0xa8fd, _0x15f02f);
}
export function createWebPreviewToolbar({
  className: className = 'web-preview-header',
  url: url = '',
  onSubmit: _0x1fe081,
  onBack: _0x17868b,
  onForward: _0x531280,
  onRefresh: _0x15f57a,
  onExtractMedia: _0x256476,
  onExtractImages: _0x580a16,
  onExtractVideos: _0xe725ca,
  onSaveReference: _0x1b2fec,
  onExternal: _0xb3fc5b,
  onFullscreen: _0x84f693,
  onExit: _0x103136,
} = {}) {
  const _0x292a02 = document.createElement('form');
  ((_0x292a02.className = className), _0x292a02.setAttribute('autocomplete', 'off'));
  const _0x4a817f = document.createElement('div');
  _0x4a817f.className = 'web-preview-nav';
  const _0x388501 = createIconButton({
      title: webPreviewText('toolbar.back'),
      icon: 'M19 12H5M12 19l-7-7 7-7',
      onClick: _0x17868b,
    }),
    _0x48aade = createIconButton({
      title: webPreviewText('toolbar.forward'),
      icon: 'M5 12h14M13 5l7 7-7 7',
      onClick: _0x531280,
    });
  (_0x4a817f.appendChild(_0x388501), _0x4a817f.appendChild(_0x48aade));
  const _0xeb46b8 = document.createElement('label');
  ((_0xeb46b8.className = 'web-preview-url-wrap'),
    _0xeb46b8.addEventListener('pointerdown', stopNodeDragPropagation),
    _0xeb46b8.addEventListener('wheel', stopNodeDragPropagation, { passive: true }),
    _0xeb46b8.appendChild(createIcon(LINK_ICON)));
  const _0x55e53a = document.createElement('input');
  ((_0x55e53a.className = 'web-preview-url-input'),
    (_0x55e53a.type = 'text'),
    (_0x55e53a.inputMode = 'search'),
    (_0x55e53a.placeholder = webPreviewText('addressPlaceholder')),
    (_0x55e53a.value = url),
    _0x55e53a.addEventListener('keydown', (_0x264c7b) => {
      _0x264c7b.stopPropagation();
      if (_0x264c7b.key === 'Escape') _0x55e53a.blur();
    }),
    _0x292a02.addEventListener('submit', (_0x37945d) => {
      (_0x37945d.preventDefault(), _0x1fe081?.(_0x55e53a.value));
    }),
    _0xeb46b8.appendChild(_0x55e53a));
  const _0x2162d5 = createIconButton({
      title: webPreviewText('toolbar.open'),
      icon: 'M5 12h14M13 5l7 7-7 7',
      type: 'submit',
    }),
    _0xbbbfd = createIconButton({
      title: webPreviewText('toolbar.refresh'),
      icon: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
      onClick: _0x15f57a,
    }),
    _0x428e62 =
      typeof _0x256476 === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.extractMedia'),
            icon: ['M4 5h10v8H4z', 'm4 13 3-3 3 3 2-2 2 2', 'M16 8h4v8h-4z', 'm20 10 2-1.5v5L20 12'],
            onClick: _0x256476,
          })
        : null,
    _0x1ed4c8 =
      !_0x428e62 && typeof _0x580a16 === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.extractImages'),
            icon: ['M4 5h16v14H4z', 'm4 15 4-4 4 4 3-3 5 5', 'M14 9h.01'],
            onClick: _0x580a16,
          })
        : null,
    _0x21ff42 =
      !_0x428e62 && typeof _0xe725ca === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.extractVideos'),
            icon: ['M4 7h12v10H4z', 'm16 10 4-3v10l-4-3z'],
            onClick: _0xe725ca,
          })
        : null,
    _0x14f4b3 =
      typeof _0x1b2fec === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.saveReference'),
            icon: ['M5 4h14v16H5z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
            onClick: _0x1b2fec,
          })
        : null,
    _0x222b9e = createIconButton({
      title: webPreviewText('toolbar.openExternal'),
      icon: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
      onClick: _0xb3fc5b,
    }),
    _0x17ee45 =
      typeof _0x103136 === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.exitFullscreen'),
            icon: ['M9 3v6H3', 'M15 3v6h6', 'M9 21v-6H3', 'M15 21v-6h6'],
            onClick: _0x103136,
          })
        : createIconButton({
            title: webPreviewText('toolbar.fullscreen'),
            icon: [
              'M8 3H5a2 2 0 0 0-2 2v3',
              'M16 3h3a2 2 0 0 1 2 2v3',
              'M8 21H5a2 2 0 0 1-2-2v-3',
              'M16 21h3a2 2 0 0 0 2-2v-3',
            ],
            onClick: _0x84f693,
          });
  (_0x292a02.appendChild(_0x4a817f),
    _0x292a02.appendChild(_0xeb46b8),
    _0x292a02.appendChild(_0x2162d5),
    _0x292a02.appendChild(_0xbbbfd));
  if (_0x428e62) _0x292a02.appendChild(_0x428e62);
  if (_0x1ed4c8) _0x292a02.appendChild(_0x1ed4c8);
  if (_0x21ff42) _0x292a02.appendChild(_0x21ff42);
  if (_0x14f4b3) _0x292a02.appendChild(_0x14f4b3);
  (_0x292a02.appendChild(_0x222b9e), _0x292a02.appendChild(_0x17ee45));
  const _0x5c9c40 = () => {
    ((_0x388501.title = webPreviewText('toolbar.back')),
      (_0x48aade.title = webPreviewText('toolbar.forward')),
      (_0x55e53a.placeholder = webPreviewText('addressPlaceholder')),
      (_0x2162d5.title = webPreviewText('toolbar.open')),
      (_0xbbbfd.title = webPreviewText('toolbar.refresh')));
    if (_0x428e62) _0x428e62.title = webPreviewText('toolbar.extractMedia');
    if (_0x1ed4c8) _0x1ed4c8.title = webPreviewText('toolbar.extractImages');
    if (_0x21ff42) _0x21ff42.title = webPreviewText('toolbar.extractVideos');
    if (_0x14f4b3) _0x14f4b3.title = webPreviewText('toolbar.saveReference');
    ((_0x222b9e.title = webPreviewText('toolbar.openExternal')),
      (_0x17ee45.title =
        typeof _0x103136 === 'function'
          ? webPreviewText('toolbar.exitFullscreen')
          : webPreviewText('toolbar.fullscreen')));
  };
  return {
    element: _0x292a02,
    input: _0x55e53a,
    backButton: _0x388501,
    forwardButton: _0x48aade,
    syncLocale: _0x5c9c40,
  };
}
