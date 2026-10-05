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
  text: text,
} = {}) {
  return [
    {
      action: 'use-converted',
      label: text('menu.useGenerated'),
      disabled: !hasConverted,
      checked: usingConverted,
    },
    {
      action: 'use-source',
      label: text('menu.useSource'),
      disabled: !hasSource,
      checked: !usingConverted,
    },
    {
      label: text('menu.download'),
      icon: 'download',
      disabled: !hasSource && !hasConverted,
      subItems: [
        { action: 'download-source', label: text('menu.sourceAudio'), disabled: !hasSource },
        { action: 'download-converted', label: text('menu.convertedAudio'), disabled: !hasConverted },
      ],
    },
    {
      label: text('menu.addToCanvas'),
      icon: 'add-to-canvas',
      disabled: !hasSource && !hasConverted,
      subItems: [
        { action: 'add-source-to-canvas', label: text('menu.sourceAudio'), disabled: !hasSource },
        {
          action: 'add-converted-to-canvas',
          label: text('menu.convertedAudio'),
          disabled: !hasConverted,
        },
      ],
    },
    { action: 'remove', label: text('menu.remove'), disabled: ![], danger: !![] },
  ];
}
function buildAudioVoiceContextMenuEntry(label, action) {
  const subItems = Array['isArray'](label?.['subItems'])
    ? label['subItems']['map']((value) => buildAudioVoiceContextMenuEntry(value, action))
    : null;
  return {
    label: label['label'],
    icon: label['icon'] || AUDIO_VOICE_ACTION_ICONS[label['action']] || 'action',
    checked: label['checked'],
    disabled: label['disabled'] === !![],
    danger: label['danger'],
    ...(subItems
      ? { subItems: subItems }
      : {
          shortcutActionId: AUDIO_VOICE_SHORTCUT_ACTIONS[label['action']],
          action: action(label['action'], label['dataset']),
        }),
  };
}
export function buildAudioVoiceSegmentContextMenuItems({
  entries: entries = [],
  modelOptions: modelOptions = [],
  selectedModelId: selectedModelId = '',
  imitateToneAvailable: imitateToneAvailable = ![],
  imitateToneEnabled: imitateToneEnabled = ![],
  text: text2,
  onAction: onAction = null,
} = {}) {
  const action2 =
      (item, key = {}) =>
      () =>
        onAction?.(item, key),
    list = [];
  return (
    imitateToneAvailable &&
      list['push']({
        label: text2('actions.imitateTone'),
        icon: 'tone',
        checked: imitateToneEnabled,
        shortcutActionId: 'context-audio-voice-toggle-imitate-tone',
        action: action2('toggle-imitate-tone'),
      }),
    list['push']({
      label: text2('actions.segmentModel'),
      icon: 'model',
      shortcutActionId: 'context-audio-voice-open-model-menu',
      subItems: [
        {
          label: text2('actions.useGlobalModel'),
          icon: 'model',
          checked: !selectedModelId,
          shortcutActionId: 'context-audio-voice-use-global-model',
          action: action2('select-segment-model', { modelId: '' }),
        },
        ...modelOptions['map']((label2) => ({
          label: label2['label'] || label2['id'],
          icon: 'model',
          checked: label2['id'] === selectedModelId,
          action: action2('select-segment-model', { modelId: label2['id'] }),
        })),
      ],
    }),
    entries['forEach']((index) => {
      if (index['action'] === 'remove') list['push']('sep');
      list['push'](buildAudioVoiceContextMenuEntry(index, action2));
    }),
    list
  );
}
function createAudioVoiceInlineMenuItem(el, result, data = '') {
  const el2 = createEl(
    'button',
    ['audio-voice-menu-item', data]['filter'](Boolean)['join'](' '),
    el['label'],
  );
  el2['type'] = 'button';
  if (el['action']) el2['dataset']['audioVoiceAction'] = el['action'];
  ((el2['dataset']['segmentId'] = result),
    Object['entries'](el['dataset'] || {})['forEach'](([options, target]) => {
      el2['dataset'][options] = String(target ?? '');
    }),
    (el2['disabled'] = el['disabled'] === !![]));
  if (el2['disabled']) el2['setAttribute']('aria-disabled', 'true');
  return (
    el['checked'] && (el2['classList']['add']('is-active'), el2['setAttribute']('aria-pressed', 'true')),
    el2
  );
}
function appendAudioVoiceInlineSubmenu(el3, source, next, current) {
  const el4 = createEl('div', 'audio-voice-menu-submenu-wrap'),
    el5 = createAudioVoiceInlineMenuItem(source, next);
  (el5['classList']['add']('audio-voice-submenu-trigger'), el5['setAttribute']('aria-haspopup', 'menu'));
  const el6 = createEl('div', 'audio-voice-model-submenu');
  (el6['setAttribute']('role', 'menu'),
    source['subItems']['forEach']((entry) => {
      el6['appendChild'](
        createAudioVoiceInlineMenuItem(entry, next, source['modelMenu'] ? 'audio-voice-model-menu-item' : ''),
      );
    }),
    el4['append'](el5, el6),
    bindAudioVoiceModelSubmenuPosition(el4, el6, current),
    el3['appendChild'](el4));
}
export function renderAudioVoiceSegmentInlineMenu({
  segmentId: segmentId = '',
  entries: entries = [],
  modelOptions: modelOptions = [],
  selectedModelId: selectedModelId = '',
  text: text3,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const el7 = createEl('div', 'audio-voice-more-menu');
  el7['setAttribute']('role', 'menu');
  const record = {
    label: text3('actions.segmentModel'),
    modelMenu: !![],
    subItems: [
      {
        action: 'select-segment-model',
        label: text3('actions.useGlobalModel'),
        checked: !selectedModelId,
        dataset: { modelId: '' },
      },
      ...modelOptions['map']((label3) => ({
        action: 'select-segment-model',
        label: label3['label'] || label3['id'],
        checked: label3['id'] === selectedModelId,
        dataset: { modelId: label3['id'] },
      })),
    ],
  };
  return (
    [record, ...entries]['forEach']((payload) => {
      Array['isArray'](payload['subItems'])
        ? appendAudioVoiceInlineSubmenu(el7, payload, segmentId, windowObject)
        : el7['appendChild'](createAudioVoiceInlineMenuItem(payload, segmentId));
    }),
    el7
  );
}
export function createAudioVoiceSegmentContextMenuController({
  panel: panel,
  getSegment: getSegment,
  buildItems: buildItems,
  onAction: onAction2,
  closeInlineMenus: closeInlineMenus,
} = {}) {
  let showContextMenu2 = null;
  const close = () => {
      (showContextMenu2?.['close']?.(), (showContextMenu2 = null));
    },
    handle = (event) => {
      if (
        event['defaultPrevented'] ||
        event['target']?.['closest']?.(
          TEXT_CONTEXT_MENU_TARGET_SELECTOR + ', .audio-voice-more-menu, .audio-voice-model-submenu',
        )
      )
        return;
      const ownerElement = event['target']?.['closest']?.('.audio-voice-segment-card'),
        state = ownerElement ? getSegment?.(ownerElement['dataset']['segmentId'] || '') : null,
        enabled = String(state?.['id'] || '')['trim']();
      if (!enabled) return;
      const config = buildItems(state, (scope, dataset = {}) => {
        onAction2?.(scope, enabled, { dataset: dataset, closest: () => null, setAttribute: () => {} }, event);
      });
      (event['preventDefault']?.(),
        event['stopPropagation']?.(),
        closeInlineMenus?.(),
        close(),
        (showContextMenu2 = showContextMenu(
          Number(event['clientX']) || 0,
          Number(event['clientY']) || 0,
          config,
          {
            className: 'v2-canvas-ctx-menu audio-voice-segment-context-menu',
            ensureItemIcons: !![],
            ownerElement: ownerElement,
            ownerRoot: panel,
          },
        )));
    };
  return (
    panel?.['addEventListener']?.('contextmenu', handle),
    {
      close: close,
      destroy() {
        (close(), panel?.['removeEventListener']?.('contextmenu', handle));
      },
    }
  );
}
