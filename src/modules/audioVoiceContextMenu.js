import { showContextMenu } from './interaction/contextMenuPresenter.js';
import { TEXT_CONTEXT_MENU_TARGET_SELECTOR } from './textInputContextMenu.js';
import { bindAudioVoiceModelSubmenuPosition, createEl } from './audioVoicePanelPresentation.js';
const AUDIO_VOICE_ACTION_ICONS = Object['freeze']({
    'use-converted': 'generated',
    'use-source': 'source',
    'download-source': 'source',
    'download-converted': 'generated',
    'add-source-to-canvas': 'source',
    'add-converted-to-canvas': 'generated',
    remove: 'delete',
  }),
  AUDIO_VOICE_SHORTCUT_ACTIONS = Object['freeze']({
    'use-converted': 'context-audio-voice-use-generated',
    'use-source': 'context-audio-voice-use-source',
    'download-source': 'context-audio-voice-download-source',
    'download-converted': 'context-audio-voice-download-generated',
    'add-source-to-canvas': 'context-audio-voice-add-source-to-canvas',
    'add-converted-to-canvas': 'context-audio-voice-add-generated-to-canvas',
    remove: 'context-audio-voice-delete',
  });
export function buildAudioVoiceSegmentMenuEntries({
  hasConverted: hasConverted = ![],
  hasSource: hasSource = ![],
  usingConverted: usingConverted = ![],
  text: _0x2b46de,
} = {}) {
  return [
    {
      action: 'use-converted',
      label: _0x2b46de('menu.useGenerated'),
      disabled: !hasConverted,
      checked: usingConverted,
    },
    {
      action: 'use-source',
      label: _0x2b46de('menu.useSource'),
      disabled: !hasSource,
      checked: !usingConverted,
    },
    {
      label: _0x2b46de('menu.download'),
      icon: 'download',
      disabled: !hasSource && !hasConverted,
      subItems: [
        { action: 'download-source', label: _0x2b46de('menu.sourceAudio'), disabled: !hasSource },
        { action: 'download-converted', label: _0x2b46de('menu.convertedAudio'), disabled: !hasConverted },
      ],
    },
    {
      label: _0x2b46de('menu.addToCanvas'),
      icon: 'add-to-canvas',
      disabled: !hasSource && !hasConverted,
      subItems: [
        { action: 'add-source-to-canvas', label: _0x2b46de('menu.sourceAudio'), disabled: !hasSource },
        {
          action: 'add-converted-to-canvas',
          label: _0x2b46de('menu.convertedAudio'),
          disabled: !hasConverted,
        },
      ],
    },
    { action: 'remove', label: _0x2b46de('menu.remove'), disabled: ![], danger: !![] },
  ];
}
function buildAudioVoiceContextMenuEntry(_0x25c372, _0x5211d2) {
  const _0x548334 = Array['isArray'](_0x25c372?.['subItems'])
    ? _0x25c372['subItems']['map']((_0x2b5613) => buildAudioVoiceContextMenuEntry(_0x2b5613, _0x5211d2))
    : null;
  return {
    label: _0x25c372['label'],
    icon: _0x25c372['icon'] || AUDIO_VOICE_ACTION_ICONS[_0x25c372['action']] || 'action',
    checked: _0x25c372['checked'],
    disabled: _0x25c372['disabled'] === !![],
    danger: _0x25c372['danger'],
    ...(_0x548334
      ? { subItems: _0x548334 }
      : {
          shortcutActionId: AUDIO_VOICE_SHORTCUT_ACTIONS[_0x25c372['action']],
          action: _0x5211d2(_0x25c372['action'], _0x25c372['dataset']),
        }),
  };
}
export function buildAudioVoiceSegmentContextMenuItems({
  entries: entries = [],
  modelOptions: modelOptions = [],
  selectedModelId: selectedModelId = '',
  imitateToneAvailable: imitateToneAvailable = ![],
  imitateToneEnabled: imitateToneEnabled = ![],
  text: _0x3be728,
  onAction: onAction = null,
} = {}) {
  const _0x4e940a =
      (_0x51d13d, _0x357e58 = {}) =>
      () =>
        onAction?.(_0x51d13d, _0x357e58),
    _0x35fb90 = [];
  return (
    imitateToneAvailable &&
      _0x35fb90['push']({
        label: _0x3be728('actions.imitateTone'),
        icon: 'tone',
        checked: imitateToneEnabled,
        shortcutActionId: 'context-audio-voice-toggle-imitate-tone',
        action: _0x4e940a('toggle-imitate-tone'),
      }),
    _0x35fb90['push']({
      label: _0x3be728('actions.segmentModel'),
      icon: 'model',
      shortcutActionId: 'context-audio-voice-open-model-menu',
      subItems: [
        {
          label: _0x3be728('actions.useGlobalModel'),
          icon: 'model',
          checked: !selectedModelId,
          shortcutActionId: 'context-audio-voice-use-global-model',
          action: _0x4e940a('select-segment-model', { modelId: '' }),
        },
        ...modelOptions['map']((_0x393d1b) => ({
          label: _0x393d1b['label'] || _0x393d1b['id'],
          icon: 'model',
          checked: _0x393d1b['id'] === selectedModelId,
          action: _0x4e940a('select-segment-model', { modelId: _0x393d1b['id'] }),
        })),
      ],
    }),
    entries['forEach']((_0x4ee85e) => {
      if (_0x4ee85e['action'] === 'remove') _0x35fb90['push']('sep');
      _0x35fb90['push'](buildAudioVoiceContextMenuEntry(_0x4ee85e, _0x4e940a));
    }),
    _0x35fb90
  );
}
function createAudioVoiceInlineMenuItem(_0x189bed, _0x25ce85, _0x88bf40 = '') {
  const _0x5f0c8f = createEl(
    'button',
    ['audio-voice-menu-item', _0x88bf40]['filter'](Boolean)['join']('\x20'),
    _0x189bed['label'],
  );
  _0x5f0c8f['type'] = 'button';
  if (_0x189bed['action']) _0x5f0c8f['dataset']['audioVoiceAction'] = _0x189bed['action'];
  ((_0x5f0c8f['dataset']['segmentId'] = _0x25ce85),
    Object['entries'](_0x189bed['dataset'] || {})['forEach'](([_0x383295, _0x120e89]) => {
      _0x5f0c8f['dataset'][_0x383295] = String(_0x120e89 ?? '');
    }),
    (_0x5f0c8f['disabled'] = _0x189bed['disabled'] === !![]));
  if (_0x5f0c8f['disabled']) _0x5f0c8f['setAttribute']('aria-disabled', 'true');
  return (
    _0x189bed['checked'] &&
      (_0x5f0c8f['classList']['add']('is-active'), _0x5f0c8f['setAttribute']('aria-pressed', 'true')),
    _0x5f0c8f
  );
}
function appendAudioVoiceInlineSubmenu(_0x261d5e, _0x1b19c0, _0x5b4df9, _0x4ff2db) {
  const _0x1c0f62 = createEl('div', 'audio-voice-menu-submenu-wrap'),
    _0x52066f = createAudioVoiceInlineMenuItem(_0x1b19c0, _0x5b4df9);
  (_0x52066f['classList']['add']('audio-voice-submenu-trigger'),
    _0x52066f['setAttribute']('aria-haspopup', 'menu'));
  const _0x4f0ef2 = createEl('div', 'audio-voice-model-submenu');
  (_0x4f0ef2['setAttribute']('role', 'menu'),
    _0x1b19c0['subItems']['forEach']((_0x43ec87) => {
      _0x4f0ef2['appendChild'](
        createAudioVoiceInlineMenuItem(
          _0x43ec87,
          _0x5b4df9,
          _0x1b19c0['modelMenu'] ? 'audio-voice-model-menu-item' : '',
        ),
      );
    }),
    _0x1c0f62['append'](_0x52066f, _0x4f0ef2),
    bindAudioVoiceModelSubmenuPosition(_0x1c0f62, _0x4f0ef2, _0x4ff2db),
    _0x261d5e['appendChild'](_0x1c0f62));
}
export function renderAudioVoiceSegmentInlineMenu({
  segmentId: segmentId = '',
  entries: entries = [],
  modelOptions: modelOptions = [],
  selectedModelId: selectedModelId = '',
  text: _0x3d560c,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x3c5c93 = createEl('div', 'audio-voice-more-menu');
  _0x3c5c93['setAttribute']('role', 'menu');
  const _0x3ddc9e = {
    label: _0x3d560c('actions.segmentModel'),
    modelMenu: !![],
    subItems: [
      {
        action: 'select-segment-model',
        label: _0x3d560c('actions.useGlobalModel'),
        checked: !selectedModelId,
        dataset: { modelId: '' },
      },
      ...modelOptions['map']((_0x507029) => ({
        action: 'select-segment-model',
        label: _0x507029['label'] || _0x507029['id'],
        checked: _0x507029['id'] === selectedModelId,
        dataset: { modelId: _0x507029['id'] },
      })),
    ],
  };
  return (
    [_0x3ddc9e, ...entries]['forEach']((_0x5abccd) => {
      Array['isArray'](_0x5abccd['subItems'])
        ? appendAudioVoiceInlineSubmenu(_0x3c5c93, _0x5abccd, segmentId, windowObject)
        : _0x3c5c93['appendChild'](createAudioVoiceInlineMenuItem(_0x5abccd, segmentId));
    }),
    _0x3c5c93
  );
}
export function createAudioVoiceSegmentContextMenuController({
  panel: _0x766dcf,
  getSegment: _0x1a1b3b,
  buildItems: _0x1767b7,
  onAction: _0x3eaf71,
  closeInlineMenus: _0x38fb2e,
} = {}) {
  let _0xb62858 = null;
  const _0x28d0da = () => {
      (_0xb62858?.['close']?.(), (_0xb62858 = null));
    },
    _0x1efac6 = (_0x4fdb83) => {
      if (
        _0x4fdb83['defaultPrevented'] ||
        _0x4fdb83['target']?.['closest']?.(
          TEXT_CONTEXT_MENU_TARGET_SELECTOR + ',\x20.audio-voice-more-menu,\x20.audio-voice-model-submenu',
        )
      )
        return;
      const _0x4bdba6 = _0x4fdb83['target']?.['closest']?.('.audio-voice-segment-card'),
        _0x42cf2f = _0x4bdba6 ? _0x1a1b3b?.(_0x4bdba6['dataset']['segmentId'] || '') : null,
        _0x492957 = String(_0x42cf2f?.['id'] || '')['trim']();
      if (!_0x492957) return;
      const _0x529b52 = _0x1767b7(_0x42cf2f, (_0x54f9a4, _0x5b5693 = {}) => {
        _0x3eaf71?.(
          _0x54f9a4,
          _0x492957,
          { dataset: _0x5b5693, closest: () => null, setAttribute: () => {} },
          _0x4fdb83,
        );
      });
      (_0x4fdb83['preventDefault']?.(),
        _0x4fdb83['stopPropagation']?.(),
        _0x38fb2e?.(),
        _0x28d0da(),
        (_0xb62858 = showContextMenu(
          Number(_0x4fdb83['clientX']) || 0x0,
          Number(_0x4fdb83['clientY']) || 0x0,
          _0x529b52,
          {
            className: 'v2-canvas-ctx-menu audio-voice-segment-context-menu',
            ensureItemIcons: !![],
            ownerElement: _0x4bdba6,
            ownerRoot: _0x766dcf,
          },
        )));
    };
  return (
    _0x766dcf?.['addEventListener']?.('contextmenu', _0x1efac6),
    {
      close: _0x28d0da,
      destroy() {
        (_0x28d0da(), _0x766dcf?.['removeEventListener']?.('contextmenu', _0x1efac6));
      },
    }
  );
}
