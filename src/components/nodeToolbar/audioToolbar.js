import { registerStaticInnerHTML } from '../../utils/dom.js';
import { createToolbarHtml, createToolbarIconButton } from './buttonFactory.js';
import { t } from '../../i18n/index.js';
function toolbarText(value) {
  return t('nodeToolbar.' + value);
}
const CLIP_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
  SEPARATE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 15v-6"/><path d="M8 18V6"/><path d="M12 4v16"/><path d="M16 6v12"/><path d="M20 9v6"/><path d="M12 3v18"/></svg>',
  SPEED_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  DOWNLOAD_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
function createAudioToolbarItems() {
  const list = [
    createToolbarIconButton({
      action: 'clip',
      tooltip: toolbarText('audio.clip'),
      label: toolbarText('audio.clip'),
      iconSvg: CLIP_ICON,
    }),
    createToolbarIconButton({
      action: 'separate',
      tooltip: toolbarText('audio.separate'),
      label: toolbarText('audio.separate'),
      iconSvg: SEPARATE_ICON,
    }),
    createToolbarIconButton({
      action: 'speed',
      tooltip: toolbarText('audio.speed'),
      label: toolbarText('audio.speed'),
      iconSvg: SPEED_ICON,
    }),
  ];
  return (
    list.push(
      createToolbarIconButton({
        action: 'download',
        tooltip: toolbarText('common.download'),
        label: toolbarText('common.download'),
        iconSvg: DOWNLOAD_ICON,
      }),
    ),
    list
  );
}
export const SOURCE_AUDIO_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: 'audio-toolbar',
  items: createAudioToolbarItems(),
});
export const AUDIO_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: 'audio-toolbar',
  items: createAudioToolbarItems(),
});
(registerStaticInnerHTML('toolbar:audio', AUDIO_TOOLBAR_HTML),
  registerStaticInnerHTML('toolbar:source-audio', SOURCE_AUDIO_TOOLBAR_HTML));
