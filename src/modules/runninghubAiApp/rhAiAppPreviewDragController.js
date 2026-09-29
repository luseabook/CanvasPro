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
      assignSequentialOrder: _0x4a1992,
      buildComponentByIndex: _0x3a2b4b,
      canPreviewComponentBecomePrompt: _0x10f2b3,
      canPreviewPromptBecomeParam: _0x1ade41,
      getComponentByIndex: _0x44483b,
      getPreviewAdvancedParamComponents: _0x596728,
      getPreviewHomeParamComponents: _0x705e20,
      getPreviewInputComponents: _0x5126d9,
      getPreviewParamText: _0x21c1b2,
      getPreviewPromptReturnControlType: _0x5748c8,
      isParamComponent: _0x18a04a,
      moveComponentToOrder: _0x8e1e5f,
      shouldReduceMotion: _0x317d32,
    } = primitives,
    _0x36d86a = runtime['document'] || globalThis['document'],
    _0x315178 = runtime['window'] || globalThis['window'];
  class _0x432ef0 {
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
      const _0xd114aa = readState()?.['componentDrafts'];
      return Array['isArray'](_0xd114aa) ? _0xd114aa : [];
    }
    ['handlePointerDown'](_0x5e9f96) {
      return (this['bindGroups'](), this['_handlePreviewPointerDown'](_0x5e9f96));
    }
    ['bindGroups']() {
      if (!this['groupCleanup'] && this['panel']?.['addEventListener'])
        this['groupCleanup'] = this['parameterGroups']['bind'](this['panel']);
    }
    ['handlePointerMove'](_0x19691c) {
      return this['_handlePreviewPointerMove'](_0x19691c);
    }
    ['handlePointerEnd'](_0x1bcbae) {
      return this['_handlePreviewPointerEnd'](_0x1bcbae);
    }
    ['consumeSuppressedRenameClickForTarget'](_0x202a6f) {
      if (
        this['suppressPreviewRenameClick'] &&
        _0x202a6f['target']?.['closest']?.('.rh-ai-app-preview-draggable')
      )
        return (this['_consumeSuppressedPreviewRenameClick'](_0x202a6f), !![]);
      return ![];
    }
    ['captureComponentRect'](_0x5a50e5) {
      return this['_capturePreviewComponentRect'](_0x5a50e5);
    }
    ['animateComponentFromRect'](_0x39cccd, _0x4fe162) {
      return this['_animatePreviewComponentFromRect'](_0x39cccd, _0x4fe162);
    }
    ['placeParamDraft'](_0x1dcc9b, _0x2bf345, _0x8f7eb8 = {}) {
      return this['_placePreviewParamDraft'](_0x1dcc9b, _0x2bf345, _0x8f7eb8);
    }
    ['destroy']() {
      (this['groupCleanup']?.(), (this['groupCleanup'] = null));
      const _0x3430b1 = this['previewDrag'];
      (_0x3430b1?.['didLiveOrder'] &&
        _0x3430b1['layoutSnapshot'] &&
        this['_restorePreviewLayoutSnapshot'](_0x3430b1['layoutSnapshot']),
        this['_clearPreviewDragState'](),
        _0x315178?.['clearTimeout']?.(this['suppressPreviewRenameClickTimer']),
        (this['suppressPreviewRenameClick'] = ![]),
        (this['suppressPreviewRenameClickTimer'] = 0x0));
    }
    ['_isPreviewControlTarget'](_0x5ab217) {
      return actions['isPreviewControlTarget']?.(_0x5ab217) === !![];
    }
    ['_startPreviewInlineRename'](_0x24c905, _0x1ab49c) {
      return actions['startPreviewInlineRename']?.(_0x24c905, _0x1ab49c);
    }
    ['_refreshBundleFromComponents'](_0x1c1569) {
      return actions['refreshBundleFromComponents']?.(_0x1c1569) || null;
    }
    ['_patchPreviewWithoutRebuild'](_0x1680d4, _0x2e2273) {
      return actions['patchPreviewWithoutRebuild']?.(_0x1680d4, _0x2e2273);
    }
    ['_getPreviewZoneElement'](_0xf2f090) {
      return actions['getPreviewZoneElement']?.(_0xf2f090) || null;
    }
    ['_getPreviewDropZone'](_0x8a0014, _0x587817) {
      for (const _0x2bed04 of PREVIEW_DROP_ZONES) {
        const _0x2d60b4 = this['_getPreviewZoneElement'](_0x2bed04);
        if (!_0x2d60b4) continue;
        const _0x5661d4 = _0x2d60b4['getBoundingClientRect']();
        if (
          _0x8a0014 >= _0x5661d4['left'] &&
          _0x8a0014 <= _0x5661d4['right'] &&
          _0x587817 >= _0x5661d4['top'] &&
          _0x587817 <= _0x5661d4['bottom']
        )
          return _0x2bed04;
      }
      return '';
    }
    ['_getPreviewMotionTarget'](_0x409d54) {
      const _0x159274 = Number(_0x409d54);
      if (!Number['isInteger'](_0x159274)) return null;
      const _0x3b4989 = [
        '.rh-ai-app-preview-prompt-target',
        '.rh-ai-app-preview-param-chip',
        '.rh-ai-app-preview-advanced-param',
        '.rh-ai-app-preview-input-slot',
      ]
        ['map']((_0x23bc69) => _0x23bc69 + '[data-preview-component-index=\x22' + _0x159274 + '\x22]')
        ['join'](',\x20');
      return this['nodePreviewEl']?.['querySelector']?.(_0x3b4989) || null;
    }
    ['_snapshotPreviewRect'](_0x16aea5) {
      const _0x8520e2 = _0x16aea5?.['getBoundingClientRect']?.();
      if (!_0x8520e2) return null;
      return {
        left: _0x8520e2['left'],
        top: _0x8520e2['top'],
        width: _0x8520e2['width'],
        height: _0x8520e2['height'],
      };
    }
    ['_capturePreviewComponentRect'](_0x135e90) {
      return this['_snapshotPreviewRect'](this['_getPreviewMotionTarget'](_0x135e90));
    }
    ['_animatePreviewComponentFromRect'](_0x1ebfbe, _0xc028f2) {
      if (_0x317d32() || !_0xc028f2) return ![];
      const _0x2f2fff = this['_getPreviewMotionTarget'](_0x1ebfbe);
      if (!_0x2f2fff?.['animate']) return ![];
      const _0x2903e1 = _0x2f2fff['getBoundingClientRect']?.();
      if (!_0x2903e1) return ![];
      const _0x1bf428 = Math['round'](Number(_0xc028f2['left']) - _0x2903e1['left']),
        _0x214047 = Math['round'](Number(_0xc028f2['top']) - _0x2903e1['top']);
      if (Math['abs'](_0x1bf428) < 0x1 && Math['abs'](_0x214047) < 0x1) return ![];
      return (
        _0x2f2fff['animate'](
          [
            { transform: 'translate(' + _0x1bf428 + 'px,\x20' + _0x214047 + 'px)', opacity: 0.72 },
            { transform: 'translate(0, 0)', opacity: 0x1 },
          ],
          { duration: PREVIEW_MOVE_ANIMATION_MS, easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
        ),
        !![]
      );
    }
    ['_setPreviewDragTransform'](_0x3a1074, _0x2eaf3c, _0x5159ff) {
      if (!_0x3a1074?.['target']) return;
      ((_0x3a1074['currentClientX'] = _0x2eaf3c), (_0x3a1074['currentClientY'] = _0x5159ff));
      if (_0x3a1074['ghost']?.['element']) {
        (_0x3a1074['ghost']['element']['style']['setProperty'](
          '--rh-ghost-x',
          Math['round'](_0x2eaf3c - _0x3a1074['ghost']['offsetX']) + 'px',
        ),
          _0x3a1074['ghost']['element']['style']['setProperty'](
            '--rh-ghost-y',
            Math['round'](_0x5159ff - _0x3a1074['ghost']['offsetY']) + 'px',
          ));
        return;
      }
      const _0x5355ba = Math['round'](_0x2eaf3c - _0x3a1074['startClientX']),
        _0x59e4dd = Math['round'](_0x5159ff - _0x3a1074['startClientY']);
      (_0x3a1074['target']['style']['setProperty']('--rh-drag-x', _0x5355ba + 'px'),
        _0x3a1074['target']['style']['setProperty']('--rh-drag-y', _0x59e4dd + 'px'));
    }
    ['_clearPreviewDragState']() {
      this['parameterGroups']['reset']();
      const _0xe98042 = this['previewDrag'];
      if (!_0xe98042) return;
      try {
        _0xe98042['target']?.['releasePointerCapture']?.(_0xe98042['pointerId']);
      } catch {}
      (_0xe98042['target']?.['classList']?.['remove']('is-dragging'),
        _0xe98042['target']?.['classList']?.['remove']('is-drag-placeholder'),
        _0xe98042['target']?.['style']?.['removeProperty']('--rh-drag-x'),
        _0xe98042['target']?.['style']?.['removeProperty']('--rh-drag-y'),
        this['_clearPreviewHomeParamDropPlaceholder'](_0xe98042),
        this['_clearPreviewAdvancedParamDropPlaceholder'](_0xe98042),
        _0xe98042['ghost']?.['element']?.['remove']?.(),
        this['panel']?.['classList']['remove']('is-preview-dragging'),
        this['nodePreviewEl']
          ?.['querySelectorAll']('[data-preview-zone]')
          ['forEach']((_0x2fd3a1) =>
            _0x2fd3a1['classList']['remove'](
              'is-drop-target',
              'is-param-drop-target',
              'is-prompt-drop-target',
            ),
          ),
        (this['previewDrag'] = null));
    }
    ['_suppressNextPreviewRenameClick']() {
      (_0x315178['clearTimeout'](this['suppressPreviewRenameClickTimer']),
        (this['suppressPreviewRenameClick'] = !![]),
        (this['suppressPreviewRenameClickTimer'] = _0x315178['setTimeout'](() => {
          ((this['suppressPreviewRenameClick'] = ![]), (this['suppressPreviewRenameClickTimer'] = 0x0));
        }, 0xa0)));
    }
    ['_consumeSuppressedPreviewRenameClick'](_0x411751) {
      if (!this['suppressPreviewRenameClick']) return ![];
      return (
        (this['suppressPreviewRenameClick'] = ![]),
        _0x315178['clearTimeout'](this['suppressPreviewRenameClickTimer']),
        (this['suppressPreviewRenameClickTimer'] = 0x0),
        _0x411751?.['preventDefault']?.(),
        _0x411751?.['stopPropagation']?.(),
        !![]
      );
    }
    ['_updatePreviewDropTarget'](_0x461445, _0x3696a4) {
      const _0x25bf34 = this['_getPreviewDropZone'](_0x461445, _0x3696a4);
      return (
        this['nodePreviewEl']?.['querySelectorAll']('[data-preview-zone]')['forEach']((_0x594362) => {
          const _0x4fcdc2 = _0x25bf34 && _0x594362['dataset']['previewZone'] === _0x25bf34;
          _0x594362['classList']['toggle']('is-drop-target', !!_0x4fcdc2);
        }),
        _0x25bf34
      );
    }
    ['_activatePreviewDrag'](_0x193b3d, _0x295b07) {
      if (!_0x193b3d?.['target'] || _0x193b3d['isActive']) return ![];
      const _0x544bee = this['_createPreviewDragGhost'](_0x193b3d['target'], _0x295b07);
      ((_0x193b3d['ghost'] = _0x544bee),
        (_0x193b3d['isActive'] = !![]),
        (_0x193b3d['moved'] = !![]),
        (_0x193b3d['layoutSnapshot'] = this['_capturePreviewLayoutSnapshot']()),
        _0x193b3d['target']['classList']['add']('is-dragging'));
      if (_0x544bee) _0x193b3d['target']['classList']['add']('is-drag-placeholder');
      return (
        this['panel']?.['classList']['add']('is-preview-dragging'),
        this['_setPreviewDragTransform'](_0x193b3d, _0x295b07['clientX'], _0x295b07['clientY']),
        !![]
      );
    }
    ['_capturePreviewLayoutSnapshot']() {
      return this['componentDrafts']['map']((_0x27502d) => ({
        index: Number(_0x27502d?.['index']),
        inputOrder: _0x27502d?.['inputOrder'],
        homeParamOrder: _0x27502d?.['homeParamOrder'],
        advancedParamOrder: _0x27502d?.['advancedParamOrder'],
        previewPlacement: _0x27502d?.['previewPlacement'],
        hasInputOrder: Object['hasOwn'](_0x27502d || {}, 'inputOrder'),
        hasHomeParamOrder: Object['hasOwn'](_0x27502d || {}, 'homeParamOrder'),
        hasAdvancedParamOrder: Object['hasOwn'](_0x27502d || {}, 'advancedParamOrder'),
        hasPreviewPlacement: Object['hasOwn'](_0x27502d || {}, 'previewPlacement'),
      }));
    }
    ['_restorePreviewLayoutSnapshot'](_0x38d3ee = []) {
      const _0x175802 = _0x3a2b4b(this['componentDrafts']);
      _0x38d3ee['forEach']((_0x1ad71f) => {
        const _0x18eebb = _0x175802['get'](Number(_0x1ad71f?.['index']));
        if (!_0x18eebb) return;
        if (_0x1ad71f['hasInputOrder']) _0x18eebb['inputOrder'] = _0x1ad71f['inputOrder'];
        else delete _0x18eebb['inputOrder'];
        if (_0x1ad71f['hasHomeParamOrder']) _0x18eebb['homeParamOrder'] = _0x1ad71f['homeParamOrder'];
        else delete _0x18eebb['homeParamOrder'];
        if (_0x1ad71f['hasAdvancedParamOrder'])
          _0x18eebb['advancedParamOrder'] = _0x1ad71f['advancedParamOrder'];
        else delete _0x18eebb['advancedParamOrder'];
        if (_0x1ad71f['hasPreviewPlacement']) _0x18eebb['previewPlacement'] = _0x1ad71f['previewPlacement'];
        else delete _0x18eebb['previewPlacement'];
      });
    }
    ['_getPreviewDropOrder'](_0x8b1436, _0x278b99, _0x32ae00, _0x16d6f0 = null) {
      const _0x556aab = this['_getPreviewZoneElement'](_0x8b1436);
      if (!_0x556aab) return 0x0;
      const _0x9428bb = Array['from'](_0x556aab['querySelectorAll'](_0x32ae00))['filter'](
          (_0x436057) => !_0x436057['classList']['contains']('is-dragging'),
        ),
        _0x4088eb = _0x8b1436 === 'advanced' && Number['isFinite'](Number(_0x16d6f0));
      let _0x9ef67c = 0x0;
      return (
        _0x9428bb['forEach']((_0x30d06f) => {
          const _0x2faf68 = _0x30d06f['getBoundingClientRect']();
          if (_0x4088eb) {
            if (_0x16d6f0 > _0x2faf68['top'] + _0x2faf68['height'] / 0x2) _0x9ef67c += 0x1;
            return;
          }
          if (_0x278b99 > _0x2faf68['left'] + _0x2faf68['width'] / 0x2) _0x9ef67c += 0x1;
        }),
        _0x9ef67c
      );
    }
    ['_getPreviewOrderedIndexesDuringDrag'](_0x5b72d1, _0x22500a, _0x5e3d1f) {
      const _0x147b9d = Number(_0x5b72d1?.['index']);
      if (!Number['isInteger'](_0x147b9d)) return [];
      const _0x1ead27 =
          _0x22500a === 'input'
            ? _0x5126d9(this['componentDrafts'])
            : _0x22500a === 'params'
              ? _0x705e20(this['componentDrafts'])
              : _0x22500a === 'advanced'
                ? _0x596728(this['componentDrafts'])
                : [],
        _0x39301a = _0x1ead27['map']((_0x20d554) => Number(_0x20d554['index'])),
        _0x465b6b = _0x39301a['includes'](_0x147b9d);
      if (_0x22500a === 'input' && !_0x465b6b) return _0x39301a;
      if ((_0x22500a === 'params' || _0x22500a === 'advanced') && !_0x465b6b) {
        const _0x4ec1c7 = _0x44483b(this['componentDrafts'], _0x147b9d);
        if (!_0x4ec1c7 || !_0x18a04a(_0x4ec1c7)) return _0x39301a;
        if (_0x22500a === 'params' && _0x39301a['length'] >= PREVIEW_CUSTOM_COMPONENT_LIMIT) return _0x39301a;
      }
      const _0x16845c = _0x39301a['filter']((_0x36d845) => _0x36d845 !== _0x147b9d),
        _0x1bcf74 = Math['max'](0x0, Math['min'](_0x16845c['length'], Number(_0x5e3d1f) || 0x0));
      return (
        _0x16845c['splice'](_0x1bcf74, 0x0, _0x147b9d),
        _0x22500a === 'params' ? _0x16845c['slice'](0x0, PREVIEW_CUSTOM_COMPONENT_LIMIT) : _0x16845c
      );
    }
    ['_animatePreviewZoneOrder'](_0x46bfb0, _0x580996, _0x265d9d = []) {
      const _0x3711c5 = this['_getPreviewZoneElement'](_0x46bfb0);
      if (!_0x3711c5) return ![];
      const _0x5d9d38 = Array['from'](_0x3711c5['querySelectorAll'](_0x580996)),
        _0x56cd61 = new Map(
          _0x5d9d38['map']((_0x47239e) => [Number(_0x47239e['dataset']['previewComponentIndex']), _0x47239e]),
        );
      return (
        animatePreviewOrder(_0x5d9d38, () =>
          _0x265d9d['forEach']((_0x8d06d8) => {
            const _0x2dd137 = _0x56cd61['get'](Number(_0x8d06d8));
            if (_0x2dd137) _0x3711c5['appendChild'](_0x2dd137);
          }),
        ),
        !![]
      );
    }
    ['_createPreviewDragGhost'](_0x15a83d, _0x4ddf3c) {
      const _0x56950f = _0x15a83d?.['getBoundingClientRect']?.();
      if (!_0x56950f) return null;
      const _0x4f1f57 = _0x15a83d['classList']?.['contains']('rh-ai-app-preview-prompt-draggable'),
        _0x2c4456 = _0x4f1f57 ? _0x36d86a['createElement']('div') : _0x15a83d['cloneNode'](!![]);
      if (_0x4f1f57) {
        const _0xb47b4 = Number(_0x15a83d['dataset']['previewComponentIndex']),
          _0xd9e1b = _0x44483b(this['componentDrafts'], _0xb47b4);
        ((_0x2c4456['textContent'] =
          String(_0xd9e1b?.['label'] || _0xd9e1b?.['fieldName'] || '提示词')['trim']() || '提示词'),
          (_0x2c4456['className'] = 'rh-ai-app-preview-drag-ghost rh-ai-app-preview-prompt-ghost'));
      } else
        (_0x2c4456['classList']['add']('rh-ai-app-preview-drag-ghost'),
          _0x2c4456['classList']['remove']('is-dragging', 'is-drag-placeholder'),
          _0x2c4456['removeAttribute']('data-preview-component-index'),
          _0x2c4456['querySelectorAll']?.('.rh-ai-app-preview-typebar')['forEach']((_0x1d44e8) => {
            _0x1d44e8['remove']();
          }),
          _0x2c4456['querySelectorAll']?.('[data-preview-component-index]')['forEach']((_0x183b40) => {
            _0x183b40['removeAttribute']('data-preview-component-index');
          }));
      const _0x3e72e4 = _0x4f1f57
          ? Math['min'](Math['max'](0x78, Math['round'](_0x56950f['width'] * 0.46)), 0x104)
          : Math['round'](_0x56950f['width']),
        _0x5340a1 = _0x4f1f57 ? 0x28 : Math['round'](_0x56950f['height']),
        _0x24f12f = _0x4f1f57
          ? Math['max'](0x12, Math['min'](_0x3e72e4 - 0x12, _0x4ddf3c['clientX'] - _0x56950f['left']))
          : _0x4ddf3c['clientX'] - _0x56950f['left'],
        _0x1bed10 = _0x4f1f57
          ? Math['max'](0xc, Math['min'](_0x5340a1 - 0xc, _0x4ddf3c['clientY'] - _0x56950f['top']))
          : _0x4ddf3c['clientY'] - _0x56950f['top'];
      return (
        _0x2c4456['style']['setProperty']('--rh-ghost-width', _0x3e72e4 + 'px'),
        _0x2c4456['style']['setProperty']('--rh-ghost-height', _0x5340a1 + 'px'),
        _0x36d86a['body']['appendChild'](_0x2c4456),
        { element: _0x2c4456, offsetX: _0x24f12f, offsetY: _0x1bed10 }
      );
    }
    ['_createPreviewHomeParamDropPlaceholder'](_0x4b8334) {
      if (!_0x4b8334 || _0x4b8334['homePlaceholder']?.['isConnected'])
        return _0x4b8334?.['homePlaceholder'] || null;
      const _0x4874d2 = this['_getPreviewZoneElement']('params'),
        _0x4d3692 = _0x44483b(this['componentDrafts'], _0x4b8334['index']);
      if (!_0x4874d2 || !_0x4d3692 || !_0x18a04a(_0x4d3692)) return null;
      const _0x501dc5 = _0x36d86a['createElement']('div');
      ((_0x501dc5['className'] =
        'img-pill-btn ui-schema-menu-trigger rh-ai-app-preview-component ' +
        'rh-ai-app-preview-draggable\x20rh-ai-app-preview-param-chip\x20' +
        'rh-ai-app-preview-drop-placeholder is-dragging is-drag-placeholder'),
        (_0x501dc5['dataset']['previewDragKind'] = 'param'),
        (_0x501dc5['dataset']['previewComponentIndex'] = String(_0x4b8334['index'])),
        _0x501dc5['setAttribute']('aria-hidden', 'true'));
      const _0x51f58a = _0x36d86a['createElement']('span');
      ((_0x51f58a['className'] = 'rh-ai-app-preview-param-label'),
        (_0x51f58a['textContent'] = _0x21c1b2(_0x4d3692)),
        _0x501dc5['appendChild'](_0x51f58a));
      const _0x273f9b = _0x36d86a['createElement']('span');
      return (
        (_0x273f9b['className'] = 'rh-ai-app-preview-drag-pad'),
        _0x273f9b['setAttribute']('aria-hidden', 'true'),
        _0x501dc5['appendChild'](_0x273f9b),
        _0x4874d2['appendChild'](_0x501dc5),
        (_0x4b8334['homePlaceholder'] = _0x501dc5),
        _0x501dc5
      );
    }
    ['_clearPreviewHomeParamDropPlaceholder'](_0x97e5eb, { animate: animate = ![] } = {}) {
      const _0xfb3917 = _0x97e5eb?.['homePlaceholder'];
      if (!_0xfb3917) return;
      if (!_0xfb3917['isConnected']) {
        _0x97e5eb['homePlaceholder'] = null;
        return;
      }
      const _0x97b647 = _0xfb3917['closest']?.('[data-preview-zone]'),
        _0x412a24 =
          animate && _0x97b647
            ? Array['from'](_0x97b647['querySelectorAll']('.rh-ai-app-preview-param-chip'))['filter'](
                (_0x4457c6) => _0x4457c6 !== _0xfb3917,
              )
            : [];
      (animatePreviewOrder(_0x412a24, () => _0xfb3917['remove']()), (_0x97e5eb['homePlaceholder'] = null));
    }
    ['_createPreviewAdvancedParamDropPlaceholder'](_0x2d31a2) {
      if (!_0x2d31a2 || _0x2d31a2['advancedPlaceholder']?.['isConnected'])
        return _0x2d31a2?.['advancedPlaceholder'] || null;
      const _0x1a754b = this['_getPreviewZoneElement']('advanced'),
        _0x4f93fe = _0x44483b(this['componentDrafts'], _0x2d31a2['index']);
      if (!_0x1a754b || !_0x4f93fe || !_0x18a04a(_0x4f93fe)) return null;
      const _0x3b78df = _0x36d86a['createElement']('div');
      ((_0x3b78df['className'] =
        'ui-schema-field rh-vram-adv-row rh-ai-app-preview-draggable ' +
        'rh-ai-app-preview-advanced-param\x20rh-ai-app-preview-drop-placeholder\x20' +
        'is-dragging is-drag-placeholder'),
        (_0x3b78df['dataset']['previewDragKind'] = 'advanced-param'),
        (_0x3b78df['dataset']['previewComponentIndex'] = String(_0x2d31a2['index'])),
        _0x3b78df['setAttribute']('aria-hidden', 'true'));
      const _0x4314b3 = _0x36d86a['createElement']('div');
      _0x4314b3['className'] = 'rh-vram-adv-label';
      const _0x27303e = _0x36d86a['createElement']('span');
      ((_0x27303e['className'] = 'rh-adv-title ui-schema-field-label'),
        (_0x27303e['textContent'] = _0x21c1b2(_0x4f93fe)),
        _0x4314b3['appendChild'](_0x27303e),
        _0x3b78df['appendChild'](_0x4314b3));
      const _0x430e9b = _0x36d86a['createElement']('span');
      ((_0x430e9b['className'] = 'rh-ai-app-preview-drag-pad'),
        _0x430e9b['setAttribute']('aria-hidden', 'true'),
        _0x3b78df['appendChild'](_0x430e9b));
      const _0x5bbf8a = _0x36d86a['createElement']('div');
      return (
        (_0x5bbf8a['className'] = 'ui-schema-field-control rh-ai-app-preview-placeholder-control'),
        _0x3b78df['appendChild'](_0x5bbf8a),
        _0x1a754b['appendChild'](_0x3b78df),
        (_0x2d31a2['advancedPlaceholder'] = _0x3b78df),
        _0x3b78df
      );
    }
    ['_clearPreviewAdvancedParamDropPlaceholder'](_0x11fa4d, { animate: animate = ![] } = {}) {
      const _0x665583 = _0x11fa4d?.['advancedPlaceholder'];
      if (!_0x665583) return;
      if (!_0x665583['isConnected']) {
        _0x11fa4d['advancedPlaceholder'] = null;
        return;
      }
      const _0xfe65df = _0x665583['closest']?.('[data-preview-zone]'),
        _0x26be59 =
          animate && _0xfe65df
            ? Array['from'](_0xfe65df['querySelectorAll']('.rh-ai-app-preview-advanced-param'))['filter'](
                (_0xb1966d) => _0xb1966d !== _0x665583,
              )
            : [];
      (animatePreviewOrder(_0x26be59, () => _0x665583['remove']()),
        (_0x11fa4d['advancedPlaceholder'] = null));
    }
    ['_reorderPreviewInputsDuringDrag'](_0x4e825c) {
      if (!_0x4e825c || _0x4e825c['dragKind'] !== 'input') return;
      const _0x441f3f = _0x5126d9(this['componentDrafts']);
      if (_0x441f3f['length'] <= 0x1) return;
      const _0x4d5fff = this['_getPreviewDropOrder'](
        'input',
        _0x4e825c['currentClientX'],
        '.rh-ai-app-preview-input-slot',
      );
      _0x8e1e5f(_0x441f3f, _0x4e825c['index'], 'inputOrder', _0x4d5fff);
      const _0x5b5164 = _0x5126d9(this['componentDrafts'])['map']((_0x43b599) => Number(_0x43b599['index'])),
        _0x1e6eff = 'input:' + _0x5b5164['join'](',');
      if (_0x4e825c['lastPreviewOrderKey'] === _0x1e6eff) return;
      (this['_animatePreviewZoneOrder']('input', '.rh-ai-app-preview-input-slot', _0x5b5164),
        (_0x4e825c['lastPreviewOrderKey'] = _0x1e6eff),
        (_0x4e825c['didLiveOrder'] = !![]));
    }
    ['_placePreviewParamDraft'](
      _0x47dd0e,
      _0x218a96,
      { clientX: clientX = null, clientY: clientY = null } = {},
    ) {
      if (!_0x47dd0e || !_0x18a04a(_0x47dd0e)) return ![];
      const _0x417e7a = _0x218a96 === 'home' ? 'home' : 'advanced';
      if (_0x417e7a === 'home') {
        const _0x23e99c = _0x47dd0e['previewPlacement'] === 'home';
        if (
          !_0x23e99c &&
          getParameterEntries(this['componentDrafts'])['length'] >= PREVIEW_CUSTOM_COMPONENT_LIMIT
        )
          return ![];
        ((_0x47dd0e['previewPlacement'] = 'home'), delete _0x47dd0e['advancedParamOrder']);
        const _0x44b651 = _0x705e20(this['componentDrafts']),
          _0x1a7fef =
            clientX !== null && Number['isFinite'](Number(clientX))
              ? this['_getPreviewDropOrder']('params', clientX, '.rh-ai-app-preview-param-chip')
              : _0x44b651['length'];
        return (_0x8e1e5f(_0x44b651, _0x47dd0e['index'], 'homeParamOrder', _0x1a7fef), !![]);
      }
      ((_0x47dd0e['previewPlacement'] = 'advanced'),
        delete _0x47dd0e['homeParamOrder'],
        _0x4a1992(_0x705e20(this['componentDrafts']), 'homeParamOrder'));
      const _0x26cb66 = _0x596728(this['componentDrafts']),
        _0x426f17 = clientX !== null && Number['isFinite'](Number(clientX)),
        _0x29e4ea = clientY !== null && Number['isFinite'](Number(clientY)),
        _0x1b20e6 =
          _0x426f17 || _0x29e4ea
            ? this['_getPreviewDropOrder']('advanced', clientX, '.rh-ai-app-preview-advanced-param', clientY)
            : _0x26cb66['length'];
      return (_0x8e1e5f(_0x26cb66, _0x47dd0e['index'], 'advancedParamOrder', _0x1b20e6), !![]);
    }
    ['_movePreviewTextParamToPrompt'](_0x3136d8) {
      const _0x1e1a6c = _0x44483b(this['componentDrafts'], _0x3136d8?.['index']);
      if (!_0x1e1a6c || !_0x18a04a(_0x1e1a6c) || !_0x10f2b3(_0x1e1a6c)) return ![];
      return (
        (_0x1e1a6c['componentKind'] = 'prompt'),
        (_0x1e1a6c['controlType'] = 'prompt'),
        delete _0x1e1a6c['homeParamOrder'],
        delete _0x1e1a6c['advancedParamOrder'],
        delete _0x1e1a6c['previewPlacement'],
        _0x4a1992(_0x705e20(this['componentDrafts']), 'homeParamOrder'),
        !![]
      );
    }
    ['_movePreviewPromptToParam'](_0x2f0799, _0x4ec58b, _0x4dd117 = '') {
      const _0x5123c4 = _0x44483b(this['componentDrafts'], _0x2f0799?.['index']);
      if (!_0x5123c4 || !_0x1ade41(_0x5123c4)) return ![];
      const _0x1bcf18 = _0x5748c8(_0x5123c4, _0x4dd117);
      if (!_0x1bcf18) return ![];
      ((_0x5123c4['componentKind'] = 'param'), (_0x5123c4['controlType'] = _0x1bcf18));
      const _0x1633fd = this['_placePreviewParamDraft'](_0x5123c4, _0x4ec58b, {
        clientX: _0x2f0799?.['currentClientX'],
        clientY: _0x2f0799?.['currentClientY'],
      });
      return (
        !_0x1633fd &&
          ((_0x5123c4['componentKind'] = 'prompt'),
          (_0x5123c4['controlType'] = 'prompt'),
          delete _0x5123c4['homeParamOrder'],
          delete _0x5123c4['advancedParamOrder'],
          delete _0x5123c4['previewPlacement']),
        _0x1633fd
      );
    }
    ['_movePreviewParamToHome'](_0x188015) {
      return this['_placePreviewParamDraft'](_0x44483b(this['componentDrafts'], _0x188015['index']), 'home', {
        clientX: _0x188015['currentClientX'],
      });
    }
    ['_movePreviewParamToAdvanced'](_0x311135) {
      const _0x49b24e = _0x44483b(this['componentDrafts'], _0x311135['index']);
      if (!_0x49b24e || !_0x18a04a(_0x49b24e)) return ![];
      const _0xdce1ea = _0x596728(this['componentDrafts'])
          ['map']((_0x3d738e) => Number(_0x3d738e['index']))
          ['join'](','),
        _0x305e56 = _0x49b24e['previewPlacement'] === 'advanced',
        _0x9725ab = Object['hasOwn'](_0x49b24e, 'homeParamOrder');
      ((_0x49b24e['previewPlacement'] = 'advanced'),
        delete _0x49b24e['homeParamOrder'],
        _0x4a1992(_0x705e20(this['componentDrafts']), 'homeParamOrder'));
      const _0x18a971 = _0x596728(this['componentDrafts']),
        _0x190724 = this['_getPreviewDropOrder'](
          'advanced',
          _0x311135['currentClientX'],
          '.rh-ai-app-preview-advanced-param',
          _0x311135['currentClientY'],
        );
      _0x8e1e5f(_0x18a971, _0x311135['index'], 'advancedParamOrder', _0x190724);
      const _0x578dea = _0x596728(this['componentDrafts'])
        ['map']((_0x51de24) => Number(_0x51de24['index']))
        ['join'](',');
      return !_0x305e56 || _0x9725ab || _0xdce1ea !== _0x578dea;
    }
    ['_reorderPreviewHomeParamsDuringDrag'](_0x4cdb25) {
      if (!_0x4cdb25 || (_0x4cdb25['dragKind'] !== 'param' && _0x4cdb25['dragKind'] !== 'advanced-param'))
        return;
      const _0x36fbb1 = this['_getPreviewDropOrder'](
          'params',
          _0x4cdb25['currentClientX'],
          '.rh-ai-app-preview-param-chip',
        ),
        _0x5d7368 = this['_getPreviewOrderedIndexesDuringDrag'](_0x4cdb25, 'params', _0x36fbb1);
      if (!_0x5d7368['includes'](Number(_0x4cdb25['index']))) {
        this['_clearPreviewHomeParamDropPlaceholder'](_0x4cdb25, { animate: !![] });
        return;
      }
      if (_0x4cdb25['dragKind'] === 'advanced-param')
        this['_createPreviewHomeParamDropPlaceholder'](_0x4cdb25);
      else {
        const _0x7ce14d = _0x705e20(this['componentDrafts']);
        _0x8e1e5f(_0x7ce14d, _0x4cdb25['index'], 'homeParamOrder', _0x36fbb1);
      }
      const _0x4d9e41 =
          _0x4cdb25['dragKind'] === 'advanced-param'
            ? _0x5d7368
            : _0x705e20(this['componentDrafts'])['map']((_0xe7421d) => Number(_0xe7421d['index'])),
        _0x7e2ab = 'params:' + _0x4d9e41['join'](',');
      if (_0x4cdb25['lastPreviewOrderKey'] === _0x7e2ab) return;
      (this['_animatePreviewZoneOrder']('params', '.rh-ai-app-preview-param-chip', _0x4d9e41),
        (_0x4cdb25['lastPreviewOrderKey'] = _0x7e2ab));
      if (_0x4cdb25['dragKind'] === 'param') _0x4cdb25['didLiveOrder'] = !![];
    }
    ['_reorderPreviewAdvancedParamsDuringDrag'](_0x334170) {
      if (!_0x334170 || !['param', 'advanced-param', 'group-param']['includes'](_0x334170['dragKind']))
        return;
      const _0x3f92c5 = this['_getPreviewDropOrder'](
          'advanced',
          _0x334170['currentClientX'],
          '.rh-ai-app-preview-advanced-param',
          _0x334170['currentClientY'],
        ),
        _0x272b17 = this['_getPreviewOrderedIndexesDuringDrag'](_0x334170, 'advanced', _0x3f92c5);
      if (!_0x272b17['includes'](Number(_0x334170['index']))) {
        this['_clearPreviewAdvancedParamDropPlaceholder'](_0x334170, { animate: !![] });
        return;
      }
      if (_0x334170['dragKind'] !== 'advanced-param')
        this['_createPreviewAdvancedParamDropPlaceholder'](_0x334170);
      else {
        const _0x9cc4c3 = _0x596728(this['componentDrafts']);
        _0x8e1e5f(_0x9cc4c3, _0x334170['index'], 'advancedParamOrder', _0x3f92c5);
      }
      const _0x4ee3c8 =
          _0x334170['dragKind'] !== 'advanced-param'
            ? _0x272b17
            : _0x596728(this['componentDrafts'])['map']((_0x4ce984) => Number(_0x4ce984['index'])),
        _0x816f0f = 'advanced:' + _0x4ee3c8['join'](',');
      if (_0x334170['lastPreviewOrderKey'] === _0x816f0f) return;
      (this['_animatePreviewZoneOrder']('advanced', '.rh-ai-app-preview-advanced-param', _0x4ee3c8),
        (_0x334170['lastPreviewOrderKey'] = _0x816f0f));
      if (_0x334170['dragKind'] === 'advanced-param') _0x334170['didLiveOrder'] = !![];
    }
    ['_handlePreviewPointerDown'](_0xaa417c) {
      if (_0xaa417c['button'] !== 0x0) return;
      if (
        _0xaa417c['target']?.['closest']?.('.rh-ai-app-group-panel') &&
        !_0xaa417c['target']?.['closest']?.('[data-preview-drag-kind=\x22group-param\x22]')
      )
        return;
      if (this['_isPreviewControlTarget'](_0xaa417c['target'])) return;
      const _0x407d40 = _0xaa417c['target']?.['closest']?.('.rh-ai-app-preview-draggable');
      if (!_0x407d40 || !this['panel']?.['contains'](_0x407d40)) return;
      const _0x4a0ec9 = Number(_0x407d40['dataset']['previewComponentIndex']);
      if (!Number['isInteger'](_0x4a0ec9)) return;
      const _0x3ddfcd = String(_0x407d40['dataset']['previewDragKind'] || 'param'),
        _0x5f27d1 = _0xaa417c['target']?.['closest']?.('.rh-ai-app-preview-rename-target') || null,
        _0x334155 = _0x5f27d1 && _0x407d40['contains'](_0x5f27d1) ? _0x5f27d1 : null;
      ((this['previewDrag'] = {
        index: _0x4a0ec9,
        target: _0x407d40,
        renameTarget: _0x334155,
        ghost: null,
        pointerId: _0xaa417c['pointerId'],
        dragKind: _0x3ddfcd,
        startClientX: _0xaa417c['clientX'],
        startClientY: _0xaa417c['clientY'],
        currentClientX: _0xaa417c['clientX'],
        currentClientY: _0xaa417c['clientY'],
        moved: ![],
        isActive: ![],
        lastPreviewOrderKey: '',
        didLiveOrder: ![],
        homePlaceholder: null,
        advancedPlaceholder: null,
        layoutSnapshot: null,
      }),
        _0x407d40['setPointerCapture']?.(_0xaa417c['pointerId']));
    }
    ['_handlePreviewPointerMove'](_0x583fa0) {
      const _0x2439ed = this['previewDrag'];
      if (!_0x2439ed) return;
      const _0x41b385 =
        Math['abs'](_0x583fa0['clientX'] - _0x2439ed['startClientX']) >= PREVIEW_DRAG_START_THRESHOLD_PX ||
        Math['abs'](_0x583fa0['clientY'] - _0x2439ed['startClientY']) >= PREVIEW_DRAG_START_THRESHOLD_PX;
      if (!_0x2439ed['isActive'] && !_0x41b385) {
        ((_0x2439ed['currentClientX'] = _0x583fa0['clientX']),
          (_0x2439ed['currentClientY'] = _0x583fa0['clientY']));
        return;
      }
      if (!_0x2439ed['isActive'] && !this['_activatePreviewDrag'](_0x2439ed, _0x583fa0)) return;
      ((_0x2439ed['moved'] = !![]),
        this['_setPreviewDragTransform'](_0x2439ed, _0x583fa0['clientX'], _0x583fa0['clientY']));
      const _0x589e7c = this['_updatePreviewDropTarget'](_0x583fa0['clientX'], _0x583fa0['clientY']);
      if (this['parameterGroups']['move'](_0x2439ed, _0x589e7c)) {
        _0x583fa0['preventDefault']();
        return;
      }
      const _0xc8cd80 = _0x44483b(this['componentDrafts'], _0x2439ed['index']),
        _0xf4c78e =
          (_0x2439ed['dragKind'] === 'param' || _0x2439ed['dragKind'] === 'advanced-param') &&
          _0x10f2b3(_0xc8cd80),
        _0x552d96 = _0x2439ed['dragKind'] === 'prompt' && _0x1ade41(_0xc8cd80);
      _0x589e7c === 'params' &&
      _0x2439ed['moved'] &&
      (_0x2439ed['dragKind'] === 'param' || _0x2439ed['dragKind'] === 'advanced-param' || _0x552d96)
        ? this['_getPreviewZoneElement']('params')?.['classList']['add']('is-param-drop-target')
        : this['_getPreviewZoneElement']('params')?.['classList']['remove']('is-param-drop-target');
      this['_getPreviewZoneElement']('prompt')?.['classList']['toggle'](
        'is-prompt-drop-target',
        _0x589e7c === 'prompt' && _0xf4c78e,
      );
      _0x2439ed['moved'] &&
        _0x2439ed['dragKind'] === 'input' &&
        _0x589e7c === 'input' &&
        this['_reorderPreviewInputsDuringDrag'](_0x2439ed);
      if (
        _0x2439ed['moved'] &&
        (_0x2439ed['dragKind'] === 'param' || _0x2439ed['dragKind'] === 'advanced-param')
      ) {
        if (_0x589e7c === 'params')
          (_0x2439ed['advancedPlaceholder'] &&
            this['_clearPreviewAdvancedParamDropPlaceholder'](_0x2439ed, { animate: !![] }),
            this['_reorderPreviewHomeParamsDuringDrag'](_0x2439ed));
        else {
          if (_0x589e7c === 'advanced')
            (_0x2439ed['homePlaceholder'] &&
              this['_clearPreviewHomeParamDropPlaceholder'](_0x2439ed, { animate: !![] }),
              this['_reorderPreviewAdvancedParamsDuringDrag'](_0x2439ed));
          else {
            if (_0x2439ed['homePlaceholder'])
              (this['_clearPreviewHomeParamDropPlaceholder'](_0x2439ed, { animate: !![] }),
                (_0x2439ed['lastPreviewOrderKey'] = ''));
            else
              _0x2439ed['advancedPlaceholder'] &&
                (this['_clearPreviewAdvancedParamDropPlaceholder'](_0x2439ed, { animate: !![] }),
                (_0x2439ed['lastPreviewOrderKey'] = ''));
          }
        }
      }
      _0x583fa0['preventDefault']();
    }
    ['_handlePreviewPointerEnd'](_0x4e685e) {
      const _0x55d2b1 = this['previewDrag'];
      if (!_0x55d2b1) return;
      if (!_0x55d2b1['isActive']) {
        const _0x25f889 = _0x55d2b1['renameTarget'],
          _0xc85033 = Number(_0x25f889?.['dataset']?.['previewComponentIndex']),
          _0x31dfcb =
            Math['abs'](_0x4e685e['clientX'] - _0x55d2b1['startClientX']) >
              PREVIEW_RENAME_CLICK_TOLERANCE_PX ||
            Math['abs'](_0x4e685e['clientY'] - _0x55d2b1['startClientY']) > PREVIEW_RENAME_CLICK_TOLERANCE_PX,
          _0x8b3ded =
            _0x4e685e['type'] === 'pointerup' &&
            _0x25f889 &&
            this['panel']?.['contains'](_0x25f889) &&
            Number['isInteger'](_0xc85033) &&
            !_0x31dfcb;
        this['_clearPreviewDragState']();
        if (_0x31dfcb) {
          (this['_suppressNextPreviewRenameClick'](),
            _0x4e685e['preventDefault'](),
            _0x4e685e['stopPropagation']());
          return;
        }
        _0x8b3ded &&
          (this['_suppressNextPreviewRenameClick'](),
          _0x4e685e['preventDefault'](),
          _0x4e685e['stopPropagation'](),
          this['_startPreviewInlineRename'](_0x25f889, _0xc85033));
        return;
      }
      (this['_suppressNextPreviewRenameClick'](),
        this['_setPreviewDragTransform'](_0x55d2b1, _0x4e685e['clientX'], _0x4e685e['clientY']));
      const _0x3078d6 = this['_getPreviewDropZone'](_0x55d2b1['currentClientX'], _0x55d2b1['currentClientY']);
      if (this['parameterGroups']['end'](_0x55d2b1, _0x4e685e, _0x3078d6)) {
        this['_clearPreviewDragState']();
        const _0x1e7ed9 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
        (this['_patchPreviewWithoutRebuild'](_0x1e7ed9, {
          renderParams: !![],
          renderAdvanced: !![],
          renderPrompt: _0x3078d6 === 'prompt',
        }),
          this['parameterGroups']['restorePanel']());
        return;
      }
      const _0x181527 = this['_snapshotPreviewRect'](_0x55d2b1['ghost']?.['element'] || _0x55d2b1['target']),
        _0x21ce0a = _0x44483b(this['componentDrafts'], _0x55d2b1['index']),
        _0x5c91d9 =
          (_0x55d2b1['dragKind'] === 'param' || _0x55d2b1['dragKind'] === 'advanced-param') &&
          _0x10f2b3(_0x21ce0a),
        _0x2392de = _0x55d2b1['dragKind'] === 'prompt' && _0x1ade41(_0x21ce0a),
        _0x5d4ff1 =
          _0x2392de &&
          _0x3078d6 === 'params' &&
          getParameterEntries(this['componentDrafts'])['length'] < PREVIEW_CUSTOM_COMPONENT_LIMIT,
        _0x41e1d9 = _0x2392de && _0x3078d6 === 'advanced';
      let _0x4d2f5e = ![],
        _0x309093 = ![],
        _0x2e476c = ![],
        _0x5755af = ![],
        _0xc9cedc = ![];
      const _0x171689 = _0x55d2b1['dragKind'] === 'input' && _0x3078d6 === 'input',
        _0x5be6dd =
          (_0x55d2b1['dragKind'] === 'param' || _0x55d2b1['dragKind'] === 'advanced-param') &&
          (_0x3078d6 === 'params' || _0x3078d6 === 'advanced'),
        _0x47ad39 = (_0x5c91d9 && _0x3078d6 === 'prompt') || _0x5d4ff1 || _0x41e1d9;
      _0x55d2b1['moved'] &&
        _0x55d2b1['didLiveOrder'] &&
        !_0x171689 &&
        !_0x5be6dd &&
        !_0x47ad39 &&
        (this['_restorePreviewLayoutSnapshot'](_0x55d2b1['layoutSnapshot']),
        (_0x4d2f5e = !![]),
        (_0x309093 = _0x55d2b1['dragKind'] === 'input'),
        (_0x2e476c = _0x55d2b1['dragKind'] === 'param' || _0x55d2b1['dragKind'] === 'advanced-param'),
        (_0x5755af = _0x55d2b1['dragKind'] === 'advanced-param'));
      if (
        _0x55d2b1['moved'] &&
        (_0x55d2b1['dragKind'] === 'param' || _0x55d2b1['dragKind'] === 'advanced-param')
      ) {
        if (_0x3078d6 === 'params' && _0x55d2b1['dragKind'] === 'advanced-param') {
          const _0x2e08fe = this['_movePreviewParamToHome'](_0x55d2b1);
          ((_0x4d2f5e = _0x2e08fe || _0x4d2f5e),
            (_0x2e476c = _0x2e08fe || _0x2e476c),
            (_0x5755af = _0x2e08fe || _0x5755af));
        } else {
          if (_0x3078d6 === 'advanced' && _0x55d2b1['dragKind'] === 'param') {
            const _0x213a2b = this['_movePreviewParamToAdvanced'](_0x55d2b1);
            ((_0x4d2f5e = _0x213a2b || _0x4d2f5e),
              (_0x2e476c = _0x213a2b || _0x2e476c),
              (_0x5755af = _0x213a2b || _0x5755af));
          }
        }
      }
      if (_0x55d2b1['moved'] && _0x5c91d9 && _0x3078d6 === 'prompt') {
        const _0x5bb5c6 = this['_movePreviewTextParamToPrompt'](_0x55d2b1);
        ((_0x4d2f5e = _0x5bb5c6 || _0x4d2f5e),
          (_0xc9cedc = _0x5bb5c6 || _0xc9cedc),
          (_0x2e476c = _0x55d2b1['dragKind'] === 'param' || _0x2e476c),
          (_0x5755af = _0x55d2b1['dragKind'] === 'advanced-param' || _0x5755af));
      } else {
        if (_0x55d2b1['moved'] && _0x2392de) {
          if (_0x5d4ff1) {
            const _0x2799e3 = this['_movePreviewPromptToParam'](_0x55d2b1, 'home');
            ((_0x4d2f5e = _0x2799e3 || _0x4d2f5e),
              (_0xc9cedc = _0x2799e3 || _0xc9cedc),
              (_0x2e476c = _0x2799e3 || _0x2e476c));
          } else {
            if (_0x41e1d9) {
              const _0x291648 = this['_movePreviewPromptToParam'](_0x55d2b1, 'advanced');
              ((_0x4d2f5e = _0x291648 || _0x4d2f5e),
                (_0xc9cedc = _0x291648 || _0xc9cedc),
                (_0x5755af = _0x291648 || _0x5755af));
            }
          }
        }
      }
      this['_clearPreviewDragState']();
      const _0x3fbea1 = this['_refreshBundleFromComponents']({ renderPreview: ![] });
      if (_0x4d2f5e || _0xc9cedc) {
        this['_patchPreviewWithoutRebuild'](_0x3fbea1, {
          renderInputs: _0x309093,
          renderParams: _0x2e476c,
          renderAdvanced: _0x5755af,
          renderPrompt: _0xc9cedc,
        });
        if (_0x181527) this['_animatePreviewComponentFromRect'](_0x55d2b1['index'], _0x181527);
      }
    }
  }
  return new _0x432ef0();
}
