import { createParameterGroupInteraction } from './rhAiAppParameterGroups.js';
import { getParameterEntries } from '../../domain/customAiApp/parameterLayout.js';
import { animatePreviewOrder } from './rhAiAppMotion.js';
export function createRhAiAppPreviewDragController({
  readState: readState = () => ({}),
  actions: actions = {},
  primitives: primitives = {},
  runtime: runtime = {},
} = {}) {
  const {
      PREVIEW_DROP_ZONES: PREVIEW_DROP_ZONES = Object['freeze'](['input', 'prompt', 'params', 'advanced']),
      PREVIEW_CUSTOM_COMPONENT_LIMIT: PREVIEW_CUSTOM_COMPONENT_LIMIT = 0x4,
      PREVIEW_DRAG_START_THRESHOLD_PX: PREVIEW_DRAG_START_THRESHOLD_PX = 0xa,
      PREVIEW_RENAME_CLICK_TOLERANCE_PX: PREVIEW_RENAME_CLICK_TOLERANCE_PX = 0x3,
      PREVIEW_MOVE_ANIMATION_MS: PREVIEW_MOVE_ANIMATION_MS = 0x104,
      assignSequentialOrder: assignSequentialOrder,
      buildComponentByIndex: buildComponentByIndex,
      canPreviewComponentBecomePrompt: canPreviewComponentBecomePrompt,
      canPreviewPromptBecomeParam: canPreviewPromptBecomeParam,
      getComponentByIndex: getComponentByIndex,
      getPreviewAdvancedParamComponents: getPreviewAdvancedParamComponents,
      getPreviewHomeParamComponents: getPreviewHomeParamComponents,
      getPreviewInputComponents: getPreviewInputComponents,
      getPreviewParamText: getPreviewParamText,
      getPreviewPromptReturnControlType: getPreviewPromptReturnControlType,
      isParamComponent: isParamComponent,
      moveComponentToOrder: moveComponentToOrder,
      shouldReduceMotion: shouldReduceMotion,
    } = primitives,
    el = runtime['document'] || globalThis['document'],
    value = runtime['window'] || globalThis['window'];
  class handler {
    constructor() {
      ((this['previewDrag'] = null),
        (this['suppressPreviewRenameClick'] = ![]),
        (this['suppressPreviewRenameClickTimer'] = 0x0),
        (this['parameterGroups'] = createParameterGroupInteraction(this)));
    }
    get ['panel']() {
      return readState()?.['panel'] || null;
    }
    get ['nodePreviewEl']() {
      return readState()?.['nodePreviewEl'] || null;
    }
    get ['componentDrafts']() {
      const state = readState()?.['componentDrafts'];
      return Array['isArray'](state) ? state : [];
    }
    ['handlePointerDown'](item) {
      return (this['bindGroups'](), this['_handlePreviewPointerDown'](item));
    }
    ['bindGroups']() {
      if (!this['groupCleanup'] && this['panel']?.['addEventListener'])
        this['groupCleanup'] = this['parameterGroups']['bind'](this['panel']);
    }
    ['handlePointerMove'](key) {
      return this['_handlePreviewPointerMove'](key);
    }
    ['handlePointerEnd'](index) {
      return this['_handlePreviewPointerEnd'](index);
    }
    ['consumeSuppressedRenameClickForTarget'](event) {
      if (
        this['suppressPreviewRenameClick'] &&
        event['target']?.['closest']?.('.rh-ai-app-preview-draggable')
      )
        return (this['_consumeSuppressedPreviewRenameClick'](event), !![]);
      return ![];
    }
    ['captureComponentRect'](result) {
      return this['_capturePreviewComponentRect'](result);
    }
    ['animateComponentFromRect'](data, options) {
      return this['_animatePreviewComponentFromRect'](data, options);
    }
    ['placeParamDraft'](target, source, next = {}) {
      return this['_placePreviewParamDraft'](target, source, next);
    }
    ['destroy']() {
      (this['groupCleanup']?.(), (this['groupCleanup'] = null));
      const current = this['previewDrag'];
      (current?.['didLiveOrder'] &&
        current['layoutSnapshot'] &&
        this['_restorePreviewLayoutSnapshot'](current['layoutSnapshot']),
        this['_clearPreviewDragState'](),
        value?.['clearTimeout']?.(this['suppressPreviewRenameClickTimer']),
        (this['suppressPreviewRenameClick'] = ![]),
        (this['suppressPreviewRenameClickTimer'] = 0x0));
    }
    ['_isPreviewControlTarget'](entry) {
      return actions['isPreviewControlTarget']?.(entry) === !![];
    }
    ['_startPreviewInlineRename'](record, payload) {
      return actions['startPreviewInlineRename']?.(record, payload);
    }
    ['_refreshBundleFromComponents'](handle) {
      return actions['refreshBundleFromComponents']?.(handle) || null;
    }
    ['_patchPreviewWithoutRebuild'](config, scope) {
      return actions['patchPreviewWithoutRebuild']?.(config, scope);
    }
    ['_getPreviewZoneElement'](input) {
      return actions['getPreviewZoneElement']?.(input) || null;
    }
    ['_getPreviewDropZone'](output, value2) {
      for (const value3 of PREVIEW_DROP_ZONES) {
        const el2 = this['_getPreviewZoneElement'](value3);
        if (!el2) continue;
        const box = el2['getBoundingClientRect']();
        if (
          output >= box['left'] &&
          output <= box['right'] &&
          value2 >= box['top'] &&
          value2 <= box['bottom']
        )
          return value3;
      }
      return '';
    }
    ['_getPreviewMotionTarget'](value4) {
      const value5 = Number(value4);
      if (!Number['isInteger'](value5)) return null;
      const value6 = [
        '.rh-ai-app-preview-prompt-target',
        '.rh-ai-app-preview-param-chip',
        '.rh-ai-app-preview-advanced-param',
        '.rh-ai-app-preview-input-slot',
      ]
        ['map']((value7) => value7 + '[data-preview-component-index=\x22' + value5 + '\x22]')
        ['join'](',\x20');
      return this['nodePreviewEl']?.['querySelector']?.(value6) || null;
    }
    ['_snapshotPreviewRect'](el3) {
      const left = el3?.['getBoundingClientRect']?.();
      if (!left) return null;
      return {
        left: left['left'],
        top: left['top'],
        width: left['width'],
        height: left['height'],
      };
    }
    ['_capturePreviewComponentRect'](value8) {
      return this['_snapshotPreviewRect'](this['_getPreviewMotionTarget'](value8));
    }
    ['_animatePreviewComponentFromRect'](value9, box2) {
      if (shouldReduceMotion() || !box2) return ![];
      const el4 = this['_getPreviewMotionTarget'](value9);
      if (!el4?.['animate']) return ![];
      const box3 = el4['getBoundingClientRect']?.();
      if (!box3) return ![];
      const value10 = Math['round'](Number(box2['left']) - box3['left']),
        value11 = Math['round'](Number(box2['top']) - box3['top']);
      if (Math['abs'](value10) < 0x1 && Math['abs'](value11) < 0x1) return ![];
      return (
        el4['animate'](
          [
            { transform: 'translate(' + value10 + 'px,\x20' + value11 + 'px)', opacity: 0.72 },
            { transform: 'translate(0, 0)', opacity: 0x1 },
          ],
          { duration: PREVIEW_MOVE_ANIMATION_MS, easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
        ),
        !![]
      );
    }
    ['_setPreviewDragTransform'](event2, value12, value13) {
      if (!event2?.['target']) return;
      ((event2['currentClientX'] = value12), (event2['currentClientY'] = value13));
      if (event2['ghost']?.['element']) {
        (event2['ghost']['element']['style']['setProperty'](
          '--rh-ghost-x',
          Math['round'](value12 - event2['ghost']['offsetX']) + 'px',
        ),
          event2['ghost']['element']['style']['setProperty'](
            '--rh-ghost-y',
            Math['round'](value13 - event2['ghost']['offsetY']) + 'px',
          ));
        return;
      }
      const value14 = Math['round'](value12 - event2['startClientX']),
        value15 = Math['round'](value13 - event2['startClientY']);
      (event2['target']['style']['setProperty']('--rh-drag-x', value14 + 'px'),
        event2['target']['style']['setProperty']('--rh-drag-y', value15 + 'px'));
    }
    ['_clearPreviewDragState']() {
      this['parameterGroups']['reset']();
      const event3 = this['previewDrag'];
      if (!event3) return;
      try {
        event3['target']?.['releasePointerCapture']?.(event3['pointerId']);
      } catch {}
      (event3['target']?.['classList']?.['remove']('is-dragging'),
        event3['target']?.['classList']?.['remove']('is-drag-placeholder'),
        event3['target']?.['style']?.['removeProperty']('--rh-drag-x'),
        event3['target']?.['style']?.['removeProperty']('--rh-drag-y'),
        this['_clearPreviewHomeParamDropPlaceholder'](event3),
        this['_clearPreviewAdvancedParamDropPlaceholder'](event3),
        event3['ghost']?.['element']?.['remove']?.(),
        this['panel']?.['classList']['remove']('is-preview-dragging'),
        this['nodePreviewEl']
          ?.['querySelectorAll']('[data-preview-zone]')
          ['forEach']((el5) =>
            el5['classList']['remove']('is-drop-target', 'is-param-drop-target', 'is-prompt-drop-target'),
          ),
        (this['previewDrag'] = null));
    }
    ['_suppressNextPreviewRenameClick']() {
      (value['clearTimeout'](this['suppressPreviewRenameClickTimer']),
        (this['suppressPreviewRenameClick'] = !![]),
        (this['suppressPreviewRenameClickTimer'] = value['setTimeout'](() => {
          ((this['suppressPreviewRenameClick'] = ![]), (this['suppressPreviewRenameClickTimer'] = 0x0));
        }, 0xa0)));
    }
    ['_consumeSuppressedPreviewRenameClick'](event4) {
      if (!this['suppressPreviewRenameClick']) return ![];
      return (
        (this['suppressPreviewRenameClick'] = ![]),
        value['clearTimeout'](this['suppressPreviewRenameClickTimer']),
        (this['suppressPreviewRenameClickTimer'] = 0x0),
        event4?.['preventDefault']?.(),
        event4?.['stopPropagation']?.(),
        !![]
      );
    }
    ['_updatePreviewDropTarget'](value16, value17) {
      const value18 = this['_getPreviewDropZone'](value16, value17);
      return (
        this['nodePreviewEl']?.['querySelectorAll']('[data-preview-zone]')['forEach']((el6) => {
          const enabled = value18 && el6['dataset']['previewZone'] === value18;
          el6['classList']['toggle']('is-drop-target', !!enabled);
        }),
        value18
      );
    }
    ['_activatePreviewDrag'](event5, event6) {
      if (!event5?.['target'] || event5['isActive']) return ![];
      const value19 = this['_createPreviewDragGhost'](event5['target'], event6);
      ((event5['ghost'] = value19),
        (event5['isActive'] = !![]),
        (event5['moved'] = !![]),
        (event5['layoutSnapshot'] = this['_capturePreviewLayoutSnapshot']()),
        event5['target']['classList']['add']('is-dragging'));
      if (value19) event5['target']['classList']['add']('is-drag-placeholder');
      return (
        this['panel']?.['classList']['add']('is-preview-dragging'),
        this['_setPreviewDragTransform'](event5, event6['clientX'], event6['clientY']),
        !![]
      );
    }
    ['_capturePreviewLayoutSnapshot']() {
      return this['componentDrafts']['map']((inputOrder) => ({
        index: Number(inputOrder?.['index']),
        inputOrder: inputOrder?.['inputOrder'],
        homeParamOrder: inputOrder?.['homeParamOrder'],
        advancedParamOrder: inputOrder?.['advancedParamOrder'],
        previewPlacement: inputOrder?.['previewPlacement'],
        hasInputOrder: Object['hasOwn'](inputOrder || {}, 'inputOrder'),
        hasHomeParamOrder: Object['hasOwn'](inputOrder || {}, 'homeParamOrder'),
        hasAdvancedParamOrder: Object['hasOwn'](inputOrder || {}, 'advancedParamOrder'),
        hasPreviewPlacement: Object['hasOwn'](inputOrder || {}, 'previewPlacement'),
      }));
    }
    ['_restorePreviewLayoutSnapshot'](list = []) {
      const map = buildComponentByIndex(this['componentDrafts']);
      list['forEach']((value20) => {
        const enabled2 = map['get'](Number(value20?.['index']));
        if (!enabled2) return;
        if (value20['hasInputOrder']) enabled2['inputOrder'] = value20['inputOrder'];
        else delete enabled2['inputOrder'];
        if (value20['hasHomeParamOrder']) enabled2['homeParamOrder'] = value20['homeParamOrder'];
        else delete enabled2['homeParamOrder'];
        if (value20['hasAdvancedParamOrder']) enabled2['advancedParamOrder'] = value20['advancedParamOrder'];
        else delete enabled2['advancedParamOrder'];
        if (value20['hasPreviewPlacement']) enabled2['previewPlacement'] = value20['previewPlacement'];
        else delete enabled2['previewPlacement'];
      });
    }
    ['_getPreviewDropOrder'](value21, value22, value23, value24 = null) {
      const el7 = this['_getPreviewZoneElement'](value21);
      if (!el7) return 0x0;
      const list2 = Array['from'](el7['querySelectorAll'](value23))['filter'](
          (el8) => !el8['classList']['contains']('is-dragging'),
        ),
        value25 = value21 === 'advanced' && Number['isFinite'](Number(value24));
      let value26 = 0x0;
      return (
        list2['forEach']((el9) => {
          const box4 = el9['getBoundingClientRect']();
          if (value25) {
            if (value24 > box4['top'] + box4['height'] / 0x2) value26 += 0x1;
            return;
          }
          if (value22 > box4['left'] + box4['width'] / 0x2) value26 += 0x1;
        }),
        value26
      );
    }
    ['_getPreviewOrderedIndexesDuringDrag'](value27, value28, value29) {
      const value30 = Number(value27?.['index']);
      if (!Number['isInteger'](value30)) return [];
      const list3 =
          value28 === 'input'
            ? getPreviewInputComponents(this['componentDrafts'])
            : value28 === 'params'
              ? getPreviewHomeParamComponents(this['componentDrafts'])
              : value28 === 'advanced'
                ? getPreviewAdvancedParamComponents(this['componentDrafts'])
                : [],
        list4 = list3['map']((value31) => Number(value31['index'])),
        enabled3 = list4['includes'](value30);
      if (value28 === 'input' && !enabled3) return list4;
      if ((value28 === 'params' || value28 === 'advanced') && !enabled3) {
        const enabled4 = getComponentByIndex(this['componentDrafts'], value30);
        if (!enabled4 || !isParamComponent(enabled4)) return list4;
        if (value28 === 'params' && list4['length'] >= PREVIEW_CUSTOM_COMPONENT_LIMIT) return list4;
      }
      const list5 = list4['filter']((value32) => value32 !== value30),
        value33 = Math['max'](0x0, Math['min'](list5['length'], Number(value29) || 0x0));
      return (
        list5['splice'](value33, 0x0, value30),
        value28 === 'params' ? list5['slice'](0x0, PREVIEW_CUSTOM_COMPONENT_LIMIT) : list5
      );
    }
    ['_animatePreviewZoneOrder'](value34, value35, list6 = []) {
      const el10 = this['_getPreviewZoneElement'](value34);
      if (!el10) return ![];
      const list7 = Array['from'](el10['querySelectorAll'](value35)),
        map2 = new Map(list7['map']((el11) => [Number(el11['dataset']['previewComponentIndex']), el11]));
      return (
        animatePreviewOrder(list7, () =>
          list6['forEach']((value36) => {
            const value37 = map2['get'](Number(value36));
            if (value37) el10['appendChild'](value37);
          }),
        ),
        !![]
      );
    }
    ['_createPreviewDragGhost'](el12, event7) {
      const box5 = el12?.['getBoundingClientRect']?.();
      if (!box5) return null;
      const value38 = el12['classList']?.['contains']('rh-ai-app-preview-prompt-draggable'),
        element = value38 ? el['createElement']('div') : el12['cloneNode'](!![]);
      if (value38) {
        const value39 = Number(el12['dataset']['previewComponentIndex']),
          value40 = getComponentByIndex(this['componentDrafts'], value39);
        ((element['textContent'] =
          String(value40?.['label'] || value40?.['fieldName'] || '提示词')['trim']() || '提示词'),
          (element['className'] = 'rh-ai-app-preview-drag-ghost rh-ai-app-preview-prompt-ghost'));
      } else
        (element['classList']['add']('rh-ai-app-preview-drag-ghost'),
          element['classList']['remove']('is-dragging', 'is-drag-placeholder'),
          element['removeAttribute']('data-preview-component-index'),
          element['querySelectorAll']?.('.rh-ai-app-preview-typebar')['forEach']((el13) => {
            el13['remove']();
          }),
          element['querySelectorAll']?.('[data-preview-component-index]')['forEach']((value41) => {
            value41['removeAttribute']('data-preview-component-index');
          }));
      const value42 = value38
          ? Math['min'](Math['max'](0x78, Math['round'](box5['width'] * 0.46)), 0x104)
          : Math['round'](box5['width']),
        value43 = value38 ? 0x28 : Math['round'](box5['height']),
        offsetX = value38
          ? Math['max'](0x12, Math['min'](value42 - 0x12, event7['clientX'] - box5['left']))
          : event7['clientX'] - box5['left'],
        offsetY = value38
          ? Math['max'](0xc, Math['min'](value43 - 0xc, event7['clientY'] - box5['top']))
          : event7['clientY'] - box5['top'];
      return (
        element['style']['setProperty']('--rh-ghost-width', value42 + 'px'),
        element['style']['setProperty']('--rh-ghost-height', value43 + 'px'),
        el['body']['appendChild'](element),
        { element: element, offsetX: offsetX, offsetY: offsetY }
      );
    }
    ['_createPreviewHomeParamDropPlaceholder'](enabled5) {
      if (!enabled5 || enabled5['homePlaceholder']?.['isConnected'])
        return enabled5?.['homePlaceholder'] || null;
      const el14 = this['_getPreviewZoneElement']('params'),
        enabled6 = getComponentByIndex(this['componentDrafts'], enabled5['index']);
      if (!el14 || !enabled6 || !isParamComponent(enabled6)) return null;
      const el15 = el['createElement']('div');
      ((el15['className'] =
        'img-pill-btn ui-schema-menu-trigger rh-ai-app-preview-component ' +
        'rh-ai-app-preview-draggable\x20rh-ai-app-preview-param-chip\x20' +
        'rh-ai-app-preview-drop-placeholder is-dragging is-drag-placeholder'),
        (el15['dataset']['previewDragKind'] = 'param'),
        (el15['dataset']['previewComponentIndex'] = String(enabled5['index'])),
        el15['setAttribute']('aria-hidden', 'true'));
      const el16 = el['createElement']('span');
      ((el16['className'] = 'rh-ai-app-preview-param-label'),
        (el16['textContent'] = getPreviewParamText(enabled6)),
        el15['appendChild'](el16));
      const el17 = el['createElement']('span');
      return (
        (el17['className'] = 'rh-ai-app-preview-drag-pad'),
        el17['setAttribute']('aria-hidden', 'true'),
        el15['appendChild'](el17),
        el14['appendChild'](el15),
        (enabled5['homePlaceholder'] = el15),
        el15
      );
    }
    ['_clearPreviewHomeParamDropPlaceholder'](value44, { animate: animate = ![] } = {}) {
      const el18 = value44?.['homePlaceholder'];
      if (!el18) return;
      if (!el18['isConnected']) {
        value44['homePlaceholder'] = null;
        return;
      }
      const el19 = el18['closest']?.('[data-preview-zone]'),
        value45 =
          animate && el19
            ? Array['from'](el19['querySelectorAll']('.rh-ai-app-preview-param-chip'))['filter'](
                (value46) => value46 !== el18,
              )
            : [];
      (animatePreviewOrder(value45, () => el18['remove']()), (value44['homePlaceholder'] = null));
    }
    ['_createPreviewAdvancedParamDropPlaceholder'](enabled7) {
      if (!enabled7 || enabled7['advancedPlaceholder']?.['isConnected'])
        return enabled7?.['advancedPlaceholder'] || null;
      const el20 = this['_getPreviewZoneElement']('advanced'),
        enabled8 = getComponentByIndex(this['componentDrafts'], enabled7['index']);
      if (!el20 || !enabled8 || !isParamComponent(enabled8)) return null;
      const el21 = el['createElement']('div');
      ((el21['className'] =
        'ui-schema-field rh-vram-adv-row rh-ai-app-preview-draggable ' +
        'rh-ai-app-preview-advanced-param\x20rh-ai-app-preview-drop-placeholder\x20' +
        'is-dragging is-drag-placeholder'),
        (el21['dataset']['previewDragKind'] = 'advanced-param'),
        (el21['dataset']['previewComponentIndex'] = String(enabled7['index'])),
        el21['setAttribute']('aria-hidden', 'true'));
      const el22 = el['createElement']('div');
      el22['className'] = 'rh-vram-adv-label';
      const el23 = el['createElement']('span');
      ((el23['className'] = 'rh-adv-title ui-schema-field-label'),
        (el23['textContent'] = getPreviewParamText(enabled8)),
        el22['appendChild'](el23),
        el21['appendChild'](el22));
      const el24 = el['createElement']('span');
      ((el24['className'] = 'rh-ai-app-preview-drag-pad'),
        el24['setAttribute']('aria-hidden', 'true'),
        el21['appendChild'](el24));
      const value47 = el['createElement']('div');
      return (
        (value47['className'] = 'ui-schema-field-control rh-ai-app-preview-placeholder-control'),
        el21['appendChild'](value47),
        el20['appendChild'](el21),
        (enabled7['advancedPlaceholder'] = el21),
        el21
      );
    }
    ['_clearPreviewAdvancedParamDropPlaceholder'](value48, { animate: animate = ![] } = {}) {
      const el25 = value48?.['advancedPlaceholder'];
      if (!el25) return;
      if (!el25['isConnected']) {
        value48['advancedPlaceholder'] = null;
        return;
      }
      const el26 = el25['closest']?.('[data-preview-zone]'),
        value49 =
          animate && el26
            ? Array['from'](el26['querySelectorAll']('.rh-ai-app-preview-advanced-param'))['filter'](
                (value50) => value50 !== el25,
              )
            : [];
      (animatePreviewOrder(value49, () => el25['remove']()), (value48['advancedPlaceholder'] = null));
    }
    ['_reorderPreviewInputsDuringDrag'](enabled9) {
      if (!enabled9 || enabled9['dragKind'] !== 'input') return;
      const list8 = getPreviewInputComponents(this['componentDrafts']);
      if (list8['length'] <= 0x1) return;
      const value51 = this['_getPreviewDropOrder'](
        'input',
        enabled9['currentClientX'],
        '.rh-ai-app-preview-input-slot',
      );
      moveComponentToOrder(list8, enabled9['index'], 'inputOrder', value51);
      const list9 = getPreviewInputComponents(this['componentDrafts'])['map']((value52) =>
          Number(value52['index']),
        ),
        value53 = 'input:' + list9['join'](',');
      if (enabled9['lastPreviewOrderKey'] === value53) return;
      (this['_animatePreviewZoneOrder']('input', '.rh-ai-app-preview-input-slot', list9),
        (enabled9['lastPreviewOrderKey'] = value53),
        (enabled9['didLiveOrder'] = !![]));
    }
    ['_placePreviewParamDraft'](
      enabled10,
      value54,
      { clientX: clientX = null, clientY: clientY = null } = {},
    ) {
      if (!enabled10 || !isParamComponent(enabled10)) return ![];
      const value55 = value54 === 'home' ? 'home' : 'advanced';
      if (value55 === 'home') {
        const enabled11 = enabled10['previewPlacement'] === 'home';
        if (
          !enabled11 &&
          getParameterEntries(this['componentDrafts'])['length'] >= PREVIEW_CUSTOM_COMPONENT_LIMIT
        )
          return ![];
        ((enabled10['previewPlacement'] = 'home'), delete enabled10['advancedParamOrder']);
        const list10 = getPreviewHomeParamComponents(this['componentDrafts']),
          value56 =
            clientX !== null && Number['isFinite'](Number(clientX))
              ? this['_getPreviewDropOrder']('params', clientX, '.rh-ai-app-preview-param-chip')
              : list10['length'];
        return (moveComponentToOrder(list10, enabled10['index'], 'homeParamOrder', value56), !![]);
      }
      ((enabled10['previewPlacement'] = 'advanced'),
        delete enabled10['homeParamOrder'],
        assignSequentialOrder(getPreviewHomeParamComponents(this['componentDrafts']), 'homeParamOrder'));
      const list11 = getPreviewAdvancedParamComponents(this['componentDrafts']),
        value57 = clientX !== null && Number['isFinite'](Number(clientX)),
        value58 = clientY !== null && Number['isFinite'](Number(clientY)),
        value59 =
          value57 || value58
            ? this['_getPreviewDropOrder']('advanced', clientX, '.rh-ai-app-preview-advanced-param', clientY)
            : list11['length'];
      return (moveComponentToOrder(list11, enabled10['index'], 'advancedParamOrder', value59), !![]);
    }
    ['_movePreviewTextParamToPrompt'](value60) {
      const enabled12 = getComponentByIndex(this['componentDrafts'], value60?.['index']);
      if (!enabled12 || !isParamComponent(enabled12) || !canPreviewComponentBecomePrompt(enabled12))
        return ![];
      return (
        (enabled12['componentKind'] = 'prompt'),
        (enabled12['controlType'] = 'prompt'),
        delete enabled12['homeParamOrder'],
        delete enabled12['advancedParamOrder'],
        delete enabled12['previewPlacement'],
        assignSequentialOrder(getPreviewHomeParamComponents(this['componentDrafts']), 'homeParamOrder'),
        !![]
      );
    }
    ['_movePreviewPromptToParam'](clientX2, value61, value62 = '') {
      const enabled13 = getComponentByIndex(this['componentDrafts'], clientX2?.['index']);
      if (!enabled13 || !canPreviewPromptBecomeParam(enabled13)) return ![];
      const enabled14 = getPreviewPromptReturnControlType(enabled13, value62);
      if (!enabled14) return ![];
      ((enabled13['componentKind'] = 'param'), (enabled13['controlType'] = enabled14));
      const enabled15 = this['_placePreviewParamDraft'](enabled13, value61, {
        clientX: clientX2?.['currentClientX'],
        clientY: clientX2?.['currentClientY'],
      });
      return (
        !enabled15 &&
          ((enabled13['componentKind'] = 'prompt'),
          (enabled13['controlType'] = 'prompt'),
          delete enabled13['homeParamOrder'],
          delete enabled13['advancedParamOrder'],
          delete enabled13['previewPlacement']),
        enabled15
      );
    }
    ['_movePreviewParamToHome'](clientX3) {
      return this['_placePreviewParamDraft'](
        getComponentByIndex(this['componentDrafts'], clientX3['index']),
        'home',
        {
          clientX: clientX3['currentClientX'],
        },
      );
    }
    ['_movePreviewParamToAdvanced'](value63) {
      const enabled16 = getComponentByIndex(this['componentDrafts'], value63['index']);
      if (!enabled16 || !isParamComponent(enabled16)) return ![];
      const value64 = getPreviewAdvancedParamComponents(this['componentDrafts'])
          ['map']((value65) => Number(value65['index']))
          ['join'](','),
        enabled17 = enabled16['previewPlacement'] === 'advanced',
        value66 = Object['hasOwn'](enabled16, 'homeParamOrder');
      ((enabled16['previewPlacement'] = 'advanced'),
        delete enabled16['homeParamOrder'],
        assignSequentialOrder(getPreviewHomeParamComponents(this['componentDrafts']), 'homeParamOrder'));
      const value67 = getPreviewAdvancedParamComponents(this['componentDrafts']),
        value68 = this['_getPreviewDropOrder'](
          'advanced',
          value63['currentClientX'],
          '.rh-ai-app-preview-advanced-param',
          value63['currentClientY'],
        );
      moveComponentToOrder(value67, value63['index'], 'advancedParamOrder', value68);
      const value69 = getPreviewAdvancedParamComponents(this['componentDrafts'])
        ['map']((value70) => Number(value70['index']))
        ['join'](',');
      return !enabled17 || value66 || value64 !== value69;
    }
    ['_reorderPreviewHomeParamsDuringDrag'](enabled18) {
      if (!enabled18 || (enabled18['dragKind'] !== 'param' && enabled18['dragKind'] !== 'advanced-param'))
        return;
      const value71 = this['_getPreviewDropOrder'](
          'params',
          enabled18['currentClientX'],
          '.rh-ai-app-preview-param-chip',
        ),
        list12 = this['_getPreviewOrderedIndexesDuringDrag'](enabled18, 'params', value71);
      if (!list12['includes'](Number(enabled18['index']))) {
        this['_clearPreviewHomeParamDropPlaceholder'](enabled18, { animate: !![] });
        return;
      }
      if (enabled18['dragKind'] === 'advanced-param')
        this['_createPreviewHomeParamDropPlaceholder'](enabled18);
      else {
        const value72 = getPreviewHomeParamComponents(this['componentDrafts']);
        moveComponentToOrder(value72, enabled18['index'], 'homeParamOrder', value71);
      }
      const list13 =
          enabled18['dragKind'] === 'advanced-param'
            ? list12
            : getPreviewHomeParamComponents(this['componentDrafts'])['map']((value73) =>
                Number(value73['index']),
              ),
        value74 = 'params:' + list13['join'](',');
      if (enabled18['lastPreviewOrderKey'] === value74) return;
      (this['_animatePreviewZoneOrder']('params', '.rh-ai-app-preview-param-chip', list13),
        (enabled18['lastPreviewOrderKey'] = value74));
      if (enabled18['dragKind'] === 'param') enabled18['didLiveOrder'] = !![];
    }
    ['_reorderPreviewAdvancedParamsDuringDrag'](enabled19) {
      if (!enabled19 || !['param', 'advanced-param', 'group-param']['includes'](enabled19['dragKind']))
        return;
      const value75 = this['_getPreviewDropOrder'](
          'advanced',
          enabled19['currentClientX'],
          '.rh-ai-app-preview-advanced-param',
          enabled19['currentClientY'],
        ),
        list14 = this['_getPreviewOrderedIndexesDuringDrag'](enabled19, 'advanced', value75);
      if (!list14['includes'](Number(enabled19['index']))) {
        this['_clearPreviewAdvancedParamDropPlaceholder'](enabled19, { animate: !![] });
        return;
      }
      if (enabled19['dragKind'] !== 'advanced-param')
        this['_createPreviewAdvancedParamDropPlaceholder'](enabled19);
      else {
        const value76 = getPreviewAdvancedParamComponents(this['componentDrafts']);
        moveComponentToOrder(value76, enabled19['index'], 'advancedParamOrder', value75);
      }
      const list15 =
          enabled19['dragKind'] !== 'advanced-param'
            ? list14
            : getPreviewAdvancedParamComponents(this['componentDrafts'])['map']((value77) =>
                Number(value77['index']),
              ),
        value78 = 'advanced:' + list15['join'](',');
      if (enabled19['lastPreviewOrderKey'] === value78) return;
      (this['_animatePreviewZoneOrder']('advanced', '.rh-ai-app-preview-advanced-param', list15),
        (enabled19['lastPreviewOrderKey'] = value78));
      if (enabled19['dragKind'] === 'advanced-param') enabled19['didLiveOrder'] = !![];
    }
    ['_handlePreviewPointerDown'](pointerId) {
      if (pointerId['button'] !== 0x0) return;
      if (
        pointerId['target']?.['closest']?.('.rh-ai-app-group-panel') &&
        !pointerId['target']?.['closest']?.('[data-preview-drag-kind=\x22group-param\x22]')
      )
        return;
      if (this['_isPreviewControlTarget'](pointerId['target'])) return;
      const target2 = pointerId['target']?.['closest']?.('.rh-ai-app-preview-draggable');
      if (!target2 || !this['panel']?.['contains'](target2)) return;
      const index2 = Number(target2['dataset']['previewComponentIndex']);
      if (!Number['isInteger'](index2)) return;
      const dragKind = String(target2['dataset']['previewDragKind'] || 'param'),
        value79 = pointerId['target']?.['closest']?.('.rh-ai-app-preview-rename-target') || null,
        renameTarget = value79 && target2['contains'](value79) ? value79 : null;
      ((this['previewDrag'] = {
        index: index2,
        target: target2,
        renameTarget: renameTarget,
        ghost: null,
        pointerId: pointerId['pointerId'],
        dragKind: dragKind,
        startClientX: pointerId['clientX'],
        startClientY: pointerId['clientY'],
        currentClientX: pointerId['clientX'],
        currentClientY: pointerId['clientY'],
        moved: ![],
        isActive: ![],
        lastPreviewOrderKey: '',
        didLiveOrder: ![],
        homePlaceholder: null,
        advancedPlaceholder: null,
        layoutSnapshot: null,
      }),
        target2['setPointerCapture']?.(pointerId['pointerId']));
    }
    ['_handlePreviewPointerMove'](event8) {
      const enabled20 = this['previewDrag'];
      if (!enabled20) return;
      const enabled21 =
        Math['abs'](event8['clientX'] - enabled20['startClientX']) >= PREVIEW_DRAG_START_THRESHOLD_PX ||
        Math['abs'](event8['clientY'] - enabled20['startClientY']) >= PREVIEW_DRAG_START_THRESHOLD_PX;
      if (!enabled20['isActive'] && !enabled21) {
        ((enabled20['currentClientX'] = event8['clientX']),
          (enabled20['currentClientY'] = event8['clientY']));
        return;
      }
      if (!enabled20['isActive'] && !this['_activatePreviewDrag'](enabled20, event8)) return;
      ((enabled20['moved'] = !![]),
        this['_setPreviewDragTransform'](enabled20, event8['clientX'], event8['clientY']));
      const value80 = this['_updatePreviewDropTarget'](event8['clientX'], event8['clientY']);
      if (this['parameterGroups']['move'](enabled20, value80)) {
        event8['preventDefault']();
        return;
      }
      const value81 = getComponentByIndex(this['componentDrafts'], enabled20['index']),
        value82 =
          (enabled20['dragKind'] === 'param' || enabled20['dragKind'] === 'advanced-param') &&
          canPreviewComponentBecomePrompt(value81),
        value83 = enabled20['dragKind'] === 'prompt' && canPreviewPromptBecomeParam(value81);
      value80 === 'params' &&
      enabled20['moved'] &&
      (enabled20['dragKind'] === 'param' || enabled20['dragKind'] === 'advanced-param' || value83)
        ? this['_getPreviewZoneElement']('params')?.['classList']['add']('is-param-drop-target')
        : this['_getPreviewZoneElement']('params')?.['classList']['remove']('is-param-drop-target');
      this['_getPreviewZoneElement']('prompt')?.['classList']['toggle'](
        'is-prompt-drop-target',
        value80 === 'prompt' && value82,
      );
      enabled20['moved'] &&
        enabled20['dragKind'] === 'input' &&
        value80 === 'input' &&
        this['_reorderPreviewInputsDuringDrag'](enabled20);
      if (
        enabled20['moved'] &&
        (enabled20['dragKind'] === 'param' || enabled20['dragKind'] === 'advanced-param')
      ) {
        if (value80 === 'params')
          (enabled20['advancedPlaceholder'] &&
            this['_clearPreviewAdvancedParamDropPlaceholder'](enabled20, { animate: !![] }),
            this['_reorderPreviewHomeParamsDuringDrag'](enabled20));
        else {
          if (value80 === 'advanced')
            (enabled20['homePlaceholder'] &&
              this['_clearPreviewHomeParamDropPlaceholder'](enabled20, { animate: !![] }),
              this['_reorderPreviewAdvancedParamsDuringDrag'](enabled20));
          else {
            if (enabled20['homePlaceholder'])
              (this['_clearPreviewHomeParamDropPlaceholder'](enabled20, { animate: !![] }),
                (enabled20['lastPreviewOrderKey'] = ''));
            else
              enabled20['advancedPlaceholder'] &&
                (this['_clearPreviewAdvancedParamDropPlaceholder'](enabled20, { animate: !![] }),
                (enabled20['lastPreviewOrderKey'] = ''));
          }
        }
      }
      event8['preventDefault']();
    }
    ['_handlePreviewPointerEnd'](event9) {
      const event10 = this['previewDrag'];
      if (!event10) return;
      if (!event10['isActive']) {
        const el27 = event10['renameTarget'],
          value84 = Number(el27?.['dataset']?.['previewComponentIndex']),
          enabled22 =
            Math['abs'](event9['clientX'] - event10['startClientX']) > PREVIEW_RENAME_CLICK_TOLERANCE_PX ||
            Math['abs'](event9['clientY'] - event10['startClientY']) > PREVIEW_RENAME_CLICK_TOLERANCE_PX,
          value85 =
            event9['type'] === 'pointerup' &&
            el27 &&
            this['panel']?.['contains'](el27) &&
            Number['isInteger'](value84) &&
            !enabled22;
        this['_clearPreviewDragState']();
        if (enabled22) {
          (this['_suppressNextPreviewRenameClick'](),
            event9['preventDefault'](),
            event9['stopPropagation']());
          return;
        }
        value85 &&
          (this['_suppressNextPreviewRenameClick'](),
          event9['preventDefault'](),
          event9['stopPropagation'](),
          this['_startPreviewInlineRename'](el27, value84));
        return;
      }
      (this['_suppressNextPreviewRenameClick'](),
        this['_setPreviewDragTransform'](event10, event9['clientX'], event9['clientY']));
      const renderPrompt = this['_getPreviewDropZone'](event10['currentClientX'], event10['currentClientY']);
      if (this['parameterGroups']['end'](event10, event9, renderPrompt)) {
        this['_clearPreviewDragState']();
        const value86 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
        (this['_patchPreviewWithoutRebuild'](value86, {
          renderParams: !![],
          renderAdvanced: !![],
          renderPrompt: renderPrompt === 'prompt',
        }),
          this['parameterGroups']['restorePanel']());
        return;
      }
      const value87 = this['_snapshotPreviewRect'](event10['ghost']?.['element'] || event10['target']),
        value88 = getComponentByIndex(this['componentDrafts'], event10['index']),
        value89 =
          (event10['dragKind'] === 'param' || event10['dragKind'] === 'advanced-param') &&
          canPreviewComponentBecomePrompt(value88),
        value90 = event10['dragKind'] === 'prompt' && canPreviewPromptBecomeParam(value88),
        value91 =
          value90 &&
          renderPrompt === 'params' &&
          getParameterEntries(this['componentDrafts'])['length'] < PREVIEW_CUSTOM_COMPONENT_LIMIT,
        value92 = value90 && renderPrompt === 'advanced';
      let value93 = ![],
        renderInputs = ![],
        renderParams = ![],
        renderAdvanced = ![],
        renderPrompt2 = ![];
      const enabled23 = event10['dragKind'] === 'input' && renderPrompt === 'input',
        enabled24 =
          (event10['dragKind'] === 'param' || event10['dragKind'] === 'advanced-param') &&
          (renderPrompt === 'params' || renderPrompt === 'advanced'),
        enabled25 = (value89 && renderPrompt === 'prompt') || value91 || value92;
      event10['moved'] &&
        event10['didLiveOrder'] &&
        !enabled23 &&
        !enabled24 &&
        !enabled25 &&
        (this['_restorePreviewLayoutSnapshot'](event10['layoutSnapshot']),
        (value93 = !![]),
        (renderInputs = event10['dragKind'] === 'input'),
        (renderParams = event10['dragKind'] === 'param' || event10['dragKind'] === 'advanced-param'),
        (renderAdvanced = event10['dragKind'] === 'advanced-param'));
      if (event10['moved'] && (event10['dragKind'] === 'param' || event10['dragKind'] === 'advanced-param')) {
        if (renderPrompt === 'params' && event10['dragKind'] === 'advanced-param') {
          const value94 = this['_movePreviewParamToHome'](event10);
          ((value93 = value94 || value93),
            (renderParams = value94 || renderParams),
            (renderAdvanced = value94 || renderAdvanced));
        } else {
          if (renderPrompt === 'advanced' && event10['dragKind'] === 'param') {
            const value95 = this['_movePreviewParamToAdvanced'](event10);
            ((value93 = value95 || value93),
              (renderParams = value95 || renderParams),
              (renderAdvanced = value95 || renderAdvanced));
          }
        }
      }
      if (event10['moved'] && value89 && renderPrompt === 'prompt') {
        const value96 = this['_movePreviewTextParamToPrompt'](event10);
        ((value93 = value96 || value93),
          (renderPrompt2 = value96 || renderPrompt2),
          (renderParams = event10['dragKind'] === 'param' || renderParams),
          (renderAdvanced = event10['dragKind'] === 'advanced-param' || renderAdvanced));
      } else {
        if (event10['moved'] && value90) {
          if (value91) {
            const value97 = this['_movePreviewPromptToParam'](event10, 'home');
            ((value93 = value97 || value93),
              (renderPrompt2 = value97 || renderPrompt2),
              (renderParams = value97 || renderParams));
          } else {
            if (value92) {
              const value98 = this['_movePreviewPromptToParam'](event10, 'advanced');
              ((value93 = value98 || value93),
                (renderPrompt2 = value98 || renderPrompt2),
                (renderAdvanced = value98 || renderAdvanced));
            }
          }
        }
      }
      this['_clearPreviewDragState']();
      const value99 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
      if (value93 || renderPrompt2) {
        this['_patchPreviewWithoutRebuild'](value99, {
          renderInputs: renderInputs,
          renderParams: renderParams,
          renderAdvanced: renderAdvanced,
          renderPrompt: renderPrompt2,
        });
        if (value87) this['_animatePreviewComponentFromRect'](event10['index'], value87);
      }
    }
  }
  return new handler();
}
