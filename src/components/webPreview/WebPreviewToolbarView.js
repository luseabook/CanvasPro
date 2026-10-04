import { createIcon, createIconButton, stopNodeDragPropagation } from './webPreviewDomUtils.js';
import { t } from '../../i18n/index.js';
const LINK_ICON = [
  'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
  'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
];
function webPreviewText(value, item = {}) {
  return t('webPreview.' + value, item);
}
export function createWebPreviewToolbar({
  className: className = 'web-preview-header',
  url: url = '',
  onSubmit: onSubmit,
  onBack: onBack,
  onForward: onForward,
  onRefresh: onRefresh,
  onExtractMedia: onExtractMedia,
  onExtractImages: onExtractImages,
  onExtractVideos: onExtractVideos,
  onSaveReference: onSaveReference,
  onExternal: onExternal,
  onFullscreen: onFullscreen,
  onExit: onExit,
} = {}) {
  const element = document.createElement('form');
  ((element.className = className), element.setAttribute('autocomplete', 'off'));
  const el = document.createElement('div');
  el.className = 'web-preview-nav';
  const backButton = createIconButton({
      title: webPreviewText('toolbar.back'),
      icon: 'M19 12H5M12 19l-7-7 7-7',
      onClick: onBack,
    }),
    forwardButton = createIconButton({
      title: webPreviewText('toolbar.forward'),
      icon: 'M5 12h14M13 5l7 7-7 7',
      onClick: onForward,
    });
  (el.appendChild(backButton), el.appendChild(forwardButton));
  const el2 = document.createElement('label');
  ((el2.className = 'web-preview-url-wrap'),
    el2.addEventListener('pointerdown', stopNodeDragPropagation),
    el2.addEventListener('wheel', stopNodeDragPropagation, { passive: true }),
    el2.appendChild(createIcon(LINK_ICON)));
  const input = document.createElement('input');
  ((input.className = 'web-preview-url-input'),
    (input.type = 'text'),
    (input.inputMode = 'search'),
    (input.placeholder = webPreviewText('addressPlaceholder')),
    (input.value = url),
    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') input.blur();
    }),
    element.addEventListener('submit', (event2) => {
      (event2.preventDefault(), onSubmit?.(input.value));
    }),
    el2.appendChild(input));
  const iconButton = createIconButton({
      title: webPreviewText('toolbar.open'),
      icon: 'M5 12h14M13 5l7 7-7 7',
      type: 'submit',
    }),
    iconButton2 = createIconButton({
      title: webPreviewText('toolbar.refresh'),
      icon: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
      onClick: onRefresh,
    }),
    enabled =
      typeof onExtractMedia === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.extractMedia'),
            icon: ['M4 5h10v8H4z', 'm4 13 3-3 3 3 2-2 2 2', 'M16 8h4v8h-4z', 'm20 10 2-1.5v5L20 12'],
            onClick: onExtractMedia,
          })
        : null,
    key =
      !enabled && typeof onExtractImages === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.extractImages'),
            icon: ['M4 5h16v14H4z', 'm4 15 4-4 4 4 3-3 5 5', 'M14 9h.01'],
            onClick: onExtractImages,
          })
        : null,
    index =
      !enabled && typeof onExtractVideos === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.extractVideos'),
            icon: ['M4 7h12v10H4z', 'm16 10 4-3v10l-4-3z'],
            onClick: onExtractVideos,
          })
        : null,
    result =
      typeof onSaveReference === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.saveReference'),
            icon: ['M5 4h14v16H5z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
            onClick: onSaveReference,
          })
        : null,
    iconButton3 = createIconButton({
      title: webPreviewText('toolbar.openExternal'),
      icon: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
      onClick: onExternal,
    }),
    data =
      typeof onExit === 'function'
        ? createIconButton({
            title: webPreviewText('toolbar.exitFullscreen'),
            icon: ['M9 3v6H3', 'M15 3v6h6', 'M9 21v-6H3', 'M15 21v-6h6'],
            onClick: onExit,
          })
        : createIconButton({
            title: webPreviewText('toolbar.fullscreen'),
            icon: [
              'M8 3H5a2 2 0 0 0-2 2v3',
              'M16 3h3a2 2 0 0 1 2 2v3',
              'M8 21H5a2 2 0 0 1-2-2v-3',
              'M16 21h3a2 2 0 0 0 2-2v-3',
            ],
            onClick: onFullscreen,
          });
  (element.appendChild(el),
    element.appendChild(el2),
    element.appendChild(iconButton),
    element.appendChild(iconButton2));
  if (enabled) element.appendChild(enabled);
  if (key) element.appendChild(key);
  if (index) element.appendChild(index);
  if (result) element.appendChild(result);
  (element.appendChild(iconButton3), element.appendChild(data));
  const syncLocale = () => {
    ((backButton.title = webPreviewText('toolbar.back')),
      (forwardButton.title = webPreviewText('toolbar.forward')),
      (input.placeholder = webPreviewText('addressPlaceholder')),
      (iconButton.title = webPreviewText('toolbar.open')),
      (iconButton2.title = webPreviewText('toolbar.refresh')));
    if (enabled) enabled.title = webPreviewText('toolbar.extractMedia');
    if (key) key.title = webPreviewText('toolbar.extractImages');
    if (index) index.title = webPreviewText('toolbar.extractVideos');
    if (result) result.title = webPreviewText('toolbar.saveReference');
    ((iconButton3.title = webPreviewText('toolbar.openExternal')),
      (data.title =
        typeof onExit === 'function'
          ? webPreviewText('toolbar.exitFullscreen')
          : webPreviewText('toolbar.fullscreen')));
  };
  return {
    element: element,
    input: input,
    backButton: backButton,
    forwardButton: forwardButton,
    syncLocale: syncLocale,
  };
}
