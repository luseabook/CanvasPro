export function createRhAiAppPreviewPresentation({
  readState: readState = () => ({}),
  writeState: writeState = () => {},
  actions: actions = {},
  primitives: primitives = {},
  windowObject: windowObject = globalThis['window'] || globalThis,
  documentObject: documentObject = globalThis['document'],
} = {}) {
  const {
      OUTPUT_KIND_LABELS: _0x218c0a,
      RH_AI_APP_EXIT_MOTION_MS: _0xd7c5a0,
      bindUiSchemaFieldControls: _0x2dc6d5,
      buildPreviewUiSchemaNodeData: _0x345fd5,
      canPreviewPromptBecomeParam: _0x525192,
      getBundleParamFields: _0x4d8197,
      getComponentByIndex: _0x4bb0fc,
      getCustomAiAppComponentIndex: _0x184766,
      getPreviewComponentDescription: _0xcf7f12,
      getPreviewInstanceText: _0x17fec8,
      getPreviewPromptHelpComponent: _0x1ed563,
      normalizeAppName: _0x336046,
      normalizeComponentKind: _0x20b123,
      normalizeKind: _0x41ad6d,
      renderPreviewAdvancedPanelHtml: _0xb2ebee,
      renderPreviewAppMenuHtml: _0x21e9a6,
      renderPreviewBatchControlsHtml: _0x340d52,
      renderPreviewHomeParamsHtml: _0x286205,
      renderPreviewInputComponentsHtml: _0x3d5851,
      renderPreviewPromptHelpTipHtml: _0x21ab48,
      renderPreviewTypeBarHtml: _0x3f51e5,
      renderRhAiAppNodePreviewHtml: _0x212d3c,
      renderSaveConfigOverwriteMenuHtml: _0x5424e6,
      shouldReduceMotion: _0x252dc2,
    } = primitives,
    _0x47f38f = windowObject,
    _0x3a1c88 = documentObject;
  class _0x56102e {
    constructor() {
      this['previewUiSchemaCleanup'] = null;
    }
    get ['nodePreviewEl']() {
      return readState()['nodePreviewEl'] || null;
    }
    get ['componentDrafts']() {
      return readState()['componentDrafts'] || [];
    }
    get ['kind']() {
      return readState()['kind'] || 'image';
    }
    get ['currentBundle']() {
      return readState()['currentBundle'] || null;
    }
    get ['appName']() {
      return readState()['appName'] || '';
    }
    get ['previewAppMenuOpen']() {
      return readState()['previewAppMenuOpen'] === !![];
    }
    get ['pendingDeleteSavedAppId']() {
      return readState()['pendingDeleteSavedAppId'] || '';
    }
    get ['pendingOverwriteSavedAppId']() {
      return readState()['pendingOverwriteSavedAppId'] || '';
    }
    get ['pendingOverwriteIntent']() {
      return readState()['pendingOverwriteIntent'] || '';
    }
    get ['componentDraftKey']() {
      return readState()['componentDraftKey'] || '';
    }
    get ['comfyCandidatePickerOpen']() {
      return readState()['comfyCandidatePickerOpen'] === !![];
    }
    get ['comfyCandidateSearchText']() {
      return readState()['comfyCandidateSearchText'] || '';
    }
    get ['saveConfigMenuEl']() {
      return readState()['saveConfigMenuEl'] || null;
    }
    get ['createConfigMenuEl']() {
      return readState()['createConfigMenuEl'] || null;
    }
    set ['componentPickerEl'](_0x4be3ed) {
      writeState({ componentPickerEl: _0x4be3ed });
    }
    ['_getSavedAppsForKind']() {
      return actions['getSavedAppsForKind']?.() || [];
    }
    ['_getSourceMeta']() {
      return actions['getSourceMeta']?.() || null;
    }
    ['_shouldShowManualComponentPicker']() {
      return actions['shouldShowManualComponentPicker']?.() === !![];
    }
    ['_canRemovePreviewParams']() {
      return actions['canRemovePreviewParams']?.() !== ![];
    }
    ['_canRemovePreviewInputs']() {
      return actions['canRemovePreviewInputs']?.() !== ![];
    }
    ['_renderComfyCandidatePicker'](_0x45b2e2 = {}) {
      return actions['renderComfyCandidatePicker']?.(_0x45b2e2);
    }
    ['_findSavedApp'](_0x343e09) {
      return actions['findSavedApp']?.(_0x343e09) || null;
    }
    ['_commitPreviewUiSchemaValue'](_0x4828d0, _0x48aa10) {
      return actions['commitPreviewUiSchemaValue']?.(_0x4828d0, _0x48aa10);
    }
    ['_renderNodePreview'](_0x57e84c = this['currentBundle']) {
      if (!this['nodePreviewEl']) return;
      (this['clearUiSchemaBinding'](),
        (this['nodePreviewEl']['innerHTML'] = _0x212d3c({
          components: this['componentDrafts'],
          kind: this['kind'],
          bundle: _0x57e84c,
          appName: this['appName'],
          savedApps: this['_getSavedAppsForKind'](),
          isAppMenuOpen: this['previewAppMenuOpen'],
          pendingDeleteSavedAppId: this['pendingDeleteSavedAppId'],
          pendingOverwriteSavedAppId: this['pendingOverwriteSavedAppId'],
          pendingOverwriteIntent: this['pendingOverwriteIntent'],
          sourceLabel: this['_getSourceMeta']()?.['label'] || 'RH AI应用',
          runningHubProfileLabel: readState()['runningHubProfileLabel'] || '',
          showComfyAddPanel: this['_shouldShowManualComponentPicker'](),
          canAddComfyComponents: Boolean(this['componentDraftKey']),
          comfyCandidatePickerOpen: this['comfyCandidatePickerOpen'],
          comfyCandidateSearchText: this['comfyCandidateSearchText'],
          comfyCandidateEmptyText: '点击添加组件，逐行选择要暴露到节点上的工作流输入。',
          canRemovePreviewParams: this['_canRemovePreviewParams'](),
          canRemovePreviewInputs: this['_canRemovePreviewInputs'](),
        })),
        (this['componentPickerEl'] = this['nodePreviewEl']?.['querySelector']?.(
          "[data-role='comfyui-candidate-menu']",
        )),
        this['_renderComfyCandidatePicker']({ open: this['comfyCandidatePickerOpen'] }),
        this['_decoratePreviewAdvancedFields'](_0x57e84c),
        this['_bindPreviewUiSchemaControls']());
    }
    ['_closePreviewAppMenuElement'](_0x221c7c) {
      if (!_0x221c7c) return;
      if (_0x252dc2()) {
        _0x221c7c['remove']();
        return;
      }
      (_0x221c7c['classList']['add']('is-closing'),
        _0x221c7c['setAttribute']('aria-hidden', 'true'),
        _0x47f38f['setTimeout'](() => {
          if (_0x221c7c['classList']?.['contains']('is-closing')) _0x221c7c['remove']();
        }, _0xd7c5a0));
    }
    ['_patchPreviewAppChrome']() {
      (this['_patchSaveConfigMenu'](), this['_patchCreateConfigMenu']());
      const _0x3a0c41 = this['nodePreviewEl']?.['querySelector']?.('.rh-ai-app-preview-node .img-model-wrap');
      if (!_0x3a0c41) return ![];
      const _0x85faf4 = _0x3a0c41['querySelector']('.rh-ai-app-preview-model-trigger'),
        _0x2a28eb = _0x3a0c41['querySelector']('.img-model-label');
      if (_0x2a28eb) _0x2a28eb['textContent'] = _0x336046(this['appName']);
      actions['syncRunningHubProfileBadge']?.(_0x3a0c41);
      _0x85faf4 && _0x85faf4['setAttribute']('aria-expanded', this['previewAppMenuOpen'] ? 'true' : 'false');
      const _0x4d4ee5 = _0x3a0c41['querySelector']("[data-role='saved-app-menu']");
      if (!this['previewAppMenuOpen']) return (this['_closePreviewAppMenuElement'](_0x4d4ee5), !![]);
      _0x4d4ee5?.['remove']();
      const _0x2266bc = _0x21e9a6({
        appName: this['appName'],
        savedApps: this['_getSavedAppsForKind'](),
        isOpen: this['previewAppMenuOpen'],
        pendingDeleteSavedAppId: this['pendingDeleteSavedAppId'],
        pendingOverwriteSavedAppId: this['pendingOverwriteSavedAppId'],
        pendingOverwriteIntent: this['pendingOverwriteIntent'],
        sourceLabel: this['_getSourceMeta']()?.['label'] || 'RH AI应用',
      });
      return (_0x2266bc && _0x85faf4 && _0x85faf4['insertAdjacentHTML']('afterend', _0x2266bc), !![]);
    }
    ['_patchSaveConfigMenu']() {
      return this['_patchFooterOverwriteMenu'](this['saveConfigMenuEl'], 'save');
    }
    ['_patchCreateConfigMenu']() {
      return this['_patchFooterOverwriteMenu'](this['createConfigMenuEl'], 'create');
    }
    ['_patchFooterOverwriteMenu'](_0x5a245b, _0x5ca2d0) {
      if (!_0x5a245b) return ![];
      const _0x39432d =
          this['pendingOverwriteIntent'] === _0x5ca2d0 && Boolean(this['pendingOverwriteSavedAppId']),
        _0x22affd = _0x39432d ? this['_findSavedApp'](this['pendingOverwriteSavedAppId']) : null;
      if (!_0x22affd)
        return (
          (_0x5a245b['hidden'] = !![]),
          _0x5a245b['setAttribute']('aria-hidden', 'true'),
          (_0x5a245b['innerHTML'] = ''),
          !![]
        );
      return (
        (_0x5a245b['hidden'] = ![]),
        _0x5a245b['setAttribute']('aria-hidden', 'false'),
        (_0x5a245b['innerHTML'] = _0x5424e6({ savedApp: _0x22affd, intent: _0x5ca2d0 })),
        !![]
      );
    }
    ['_patchPreviewPromptArea']() {
      const _0x45e902 = this['nodePreviewEl']?.['querySelector']?.('.rh-ai-app-preview-input'),
        _0x28e08c = _0x45e902?.['querySelector']?.('.rh-ai-app-preview-prompt'),
        _0x293e14 = _0x45e902?.['closest']?.('.rh-ai-app-real-preview-panel');
      if (!_0x45e902 || !_0x28e08c) return ![];
      const _0x51500e = this['componentDrafts']['find'](
          (_0x31f81e) => _0x20b123(_0x31f81e?.['componentKind']) === 'prompt',
        ),
        _0x52d75b = _0x1ed563(this['componentDrafts']),
        _0x2ded60 = (_0x51500e || _0x52d75b)?.['label']
          ? '填写' + (_0x51500e || _0x52d75b)['label'] + '，按 @ 引用素材，/呼出指令...'
          : '描述' + (_0x218c0a[this['kind']] || '生成') + '内容，按 @ 引用素材，/呼出指令...',
        _0x56641e = Number(_0x51500e?.['index']),
        _0x6af46f = Number['isInteger'](_0x56641e),
        _0x104bb2 = _0x6af46f && _0x525192(_0x51500e);
      (_0x45e902['classList']['add']('rh-ai-app-preview-prompt-zone'),
        _0x45e902['classList']['toggle']('rh-ai-app-preview-prompt-target', _0x6af46f),
        _0x45e902['classList']['toggle']('rh-ai-app-preview-draggable', _0x104bb2),
        _0x45e902['classList']['toggle']('rh-ai-app-preview-prompt-draggable', _0x104bb2),
        (_0x45e902['dataset']['previewZone'] = 'prompt'));
      _0x6af46f
        ? (_0x45e902['dataset']['previewComponentIndex'] = String(_0x56641e))
        : delete _0x45e902['dataset']['previewComponentIndex'];
      if (_0x104bb2) _0x45e902['dataset']['previewDragKind'] = 'prompt';
      else delete _0x45e902['dataset']['previewDragKind'];
      const _0x46c323 = '.rh-ai-app-preview-prompt-help-tip, .rh-ai-app-preview-description-input--prompt';
      (this['nodePreviewEl']?.['querySelectorAll']?.(_0x46c323)['forEach']((_0x4486cc) => {
        _0x4486cc['remove']();
      }),
        Array['from'](_0x45e902['children'])
          ['filter']((_0x3969fd) => _0x3969fd['classList']?.['contains']('rh-ai-app-preview-typebar'))
          ['forEach']((_0x48fead) => _0x48fead['remove']()));
      const _0x31e4ab = _0x51500e
        ? _0x3f51e5(_0x51500e, { canRemove: this['_canRemovePreviewParams']() })
        : '';
      _0x31e4ab && _0x28e08c['insertAdjacentHTML']('beforebegin', _0x31e4ab);
      const _0x2c5714 = _0x21ab48(_0x52d75b, { bundle: this['currentBundle'] });
      if (_0x2c5714 && _0x293e14) _0x293e14['insertAdjacentHTML']('afterbegin', _0x2c5714);
      return ((_0x28e08c['dataset']['placeholder'] = _0x2ded60), !![]);
    }
    ['_patchPreviewActionControls'](_0x375601 = this['currentBundle']) {
      const _0xc33143 = this['nodePreviewEl']?.['querySelector']?.('.rh-ai-app-preview-node');
      if (!_0xc33143) return ![];
      const _0x528a59 = _0x17fec8(_0x375601),
        _0x3cfcf7 = _0xc33143['querySelector']('.ui-schema-instance-slot');
      if (_0x3cfcf7) {
        _0x3cfcf7['hidden'] = !_0x528a59;
        const _0x2ad9d1 = _0x3cfcf7['querySelector']('.rh-vram-label');
        _0x2ad9d1 && (_0x2ad9d1['textContent'] = _0x528a59);
      }
      const _0x1e0407 = _0x340d52(_0x375601),
        _0x5b8e55 = _0xc33143['querySelector']('.ui-schema-batch-slot');
      return (
        _0x5b8e55 &&
          ((_0x5b8e55['hidden'] = !_0x1e0407),
          _0x5b8e55['innerHTML'] !== _0x1e0407 && (_0x5b8e55['innerHTML'] = _0x1e0407)),
        !![]
      );
    }
    ['_patchPreviewWithoutRebuild'](
      _0x46506d = this['currentBundle'],
      {
        renderInputs: renderInputs = ![],
        renderParams: renderParams = ![],
        renderAdvanced: renderAdvanced = ![],
        renderPrompt: renderPrompt = ![],
        renderAppChrome: renderAppChrome = ![],
        renderActionControls: renderActionControls = ![],
      } = {},
    ) {
      const _0x7657f = this['nodePreviewEl']?.['querySelector']?.('.rh-ai-app-preview-node');
      if (!_0x7657f) return (this['_renderNodePreview'](_0x46506d), ![]);
      _0x7657f['dataset']['previewNodeKind'] = _0x41ad6d(this['kind']);
      if (renderAppChrome) this['_patchPreviewAppChrome']();
      if (renderPrompt) this['_patchPreviewPromptArea']();
      if (renderActionControls) this['_patchPreviewActionControls'](_0x46506d);
      return (
        (renderInputs || renderParams || renderAdvanced) &&
          this['_renderPreviewMutableZones'](_0x46506d, {
            renderInputs: renderInputs,
            renderParams: renderParams,
            renderAdvanced: renderAdvanced,
          }),
        !![]
      );
    }
    ['_renderPreviewMutableZones'](
      _0x385665 = this['currentBundle'],
      {
        renderInputs: renderInputs = ![],
        renderParams: renderParams = !![],
        renderAdvanced: renderAdvanced = !![],
      } = {},
    ) {
      if (!this['nodePreviewEl']) return;
      const _0x5d12ef = this['_getPreviewZoneElement']('input');
      renderInputs &&
        _0x5d12ef &&
        (_0x5d12ef['innerHTML'] = _0x3d5851(this['componentDrafts'], {
          canRemovePreviewInputs: this['_canRemovePreviewInputs'](),
        }));
      const _0x5d376b = this['_getPreviewZoneElement']('params');
      renderParams &&
        _0x5d376b &&
        (_0x5d376b['innerHTML'] = _0x286205(this['componentDrafts'], _0x385665, {
          canRemovePreviewParams: this['_canRemovePreviewParams'](),
        }));
      if (renderAdvanced) {
        const _0x13fa07 = _0xb2ebee({ components: this['componentDrafts'], bundle: _0x385665 }),
          _0x45f9e3 = this['nodePreviewEl']['querySelector']('.rh-ai-app-real-preview-panel'),
          _0x125a92 = this['_getPreviewZoneElement']('advanced');
        this['clearUiSchemaBinding']();
        if (_0x125a92) {
          if (_0x13fa07) _0x125a92['outerHTML'] = _0x13fa07;
          else _0x125a92['remove']();
        } else _0x13fa07 && _0x45f9e3 && _0x45f9e3['insertAdjacentHTML']('beforeend', _0x13fa07);
        (this['_decoratePreviewAdvancedFields'](_0x385665), this['_bindPreviewUiSchemaControls']());
      } else renderParams && this['_bindPreviewUiSchemaControls']();
    }
    ['_bindPreviewUiSchemaControls']() {
      const _0x597e92 = this['nodePreviewEl']?.['querySelector']?.('.rh-ai-app-preview-node');
      if (!_0x597e92) return;
      (this['clearUiSchemaBinding'](),
        (this['previewUiSchemaCleanup'] = _0x2dc6d5(_0x597e92, {
          getNodeData: () => _0x345fd5(this['currentBundle']),
          commitFieldValue: (_0x5662a0, _0x369148) =>
            this['_commitPreviewUiSchemaValue'](_0x5662a0, _0x369148),
        })));
    }
    ['_decoratePreviewAdvancedFields'](_0x2560a4 = this['currentBundle']) {
      const _0x4527ee = _0x4d8197(_0x2560a4);
      if (!_0x4527ee['length'] || !this['nodePreviewEl']) return;
      _0x4527ee['forEach']((_0x13a4d7) => {
        const _0x24d94f = _0x184766(_0x13a4d7);
        if (!Number['isInteger'](_0x24d94f)) return;
        const _0x5b29ee = String(_0x13a4d7?.['id'] || '')['trim']();
        if (!_0x5b29ee) return;
        const _0x3510e0 = Array['from'](this['nodePreviewEl']['querySelectorAll']('[data-ui-schema-field]'))[
          'find'
        ]((_0x370588) => String(_0x370588?.['dataset']?.['uiSchemaField'] || '') === _0x5b29ee);
        if (!_0x3510e0) return;
        (_0x3510e0['classList']['add']('rh-ai-app-preview-draggable', 'rh-ai-app-preview-advanced-param'),
          (_0x3510e0['dataset']['previewDragKind'] = _0x3510e0['closest']('.rh-ai-app-group-panel')
            ? 'group-param'
            : 'advanced-param'),
          (_0x3510e0['dataset']['previewComponentIndex'] = String(_0x24d94f)),
          _0x3510e0['removeAttribute']('title'));
        if (!_0x3510e0['querySelector']('.rh-ai-app-preview-typebar')) {
          const _0x568df4 = _0x3f51e5(_0x4bb0fc(this['componentDrafts'], _0x24d94f), {
            canRemove: this['_canRemovePreviewParams'](),
          });
          _0x568df4 && _0x3510e0['insertAdjacentHTML']('afterbegin', _0x568df4);
        }
        const _0xbe43c5 = _0x4bb0fc(this['componentDrafts'], _0x24d94f),
          _0x4ece92 = _0x3510e0['querySelector']('.ui-schema-field-label'),
          _0x404bbd =
            _0x4ece92?.['closest']?.('.rh-vram-adv-label') ||
            _0x3510e0['querySelector']('.rh-vram-adv-label'),
          _0x1535f4 =
            _0x4ece92 ||
            _0x404bbd?.['querySelector']?.(
              '.rh-adv-title,\x20.ui-schema-field-label,\x20' + 'span:not(.rh-tip):not(.ui-schema-info-tip)',
            );
        _0x1535f4 &&
          (_0x1535f4['classList']['add']('rh-ai-app-preview-rename-target'),
          (_0x1535f4['dataset']['previewComponentIndex'] = String(_0x24d94f)),
          _0x1535f4['removeAttribute']('title'));
        const _0x3a6e7d = _0xcf7f12(_0xbe43c5 || _0x13a4d7, '参数说明'),
          _0x162801 = _0x404bbd || _0x3510e0;
        let _0xad13d1 = Array['from'](_0x162801['querySelectorAll']?.('.rh-tip, .ui-schema-info-tip') || []);
        if (!_0xad13d1['length'] && _0x162801) {
          const _0x56bf61 = _0x3a1c88['createElement']('span');
          ((_0x56bf61['className'] = 'rh-tip ui-schema-info-tip'),
            (_0x56bf61['textContent'] = '!'),
            _0x1535f4
              ? _0x1535f4['insertAdjacentElement']('afterend', _0x56bf61)
              : _0x162801['appendChild'](_0x56bf61),
            (_0xad13d1 = [_0x56bf61]));
        }
        _0xad13d1['forEach']((_0x411841) => {
          (_0x411841['classList']['add'](
            'rh-ai-app-preview-description-target',
            'rh-ai-app-preview-param-description-tip',
          ),
            (_0x411841['dataset']['previewComponentIndex'] = String(_0x24d94f)),
            _0x411841['setAttribute']('role', 'button'),
            _0x411841['setAttribute']('tabindex', '0'),
            _0x411841['setAttribute']('aria-label', '编辑参数说明'),
            _0x411841['setAttribute']('data-tooltip', _0x3a6e7d),
            _0x411841['setAttribute']('title', _0x3a6e7d));
        });
        const _0x340337 = _0x3510e0['querySelector']('.rh-adv-control-line, .ui-schema-field-control');
        if (!_0x3510e0['querySelector']('.rh-ai-app-preview-drag-pad')) {
          const _0x23525b = _0x3a1c88['createElement']('span');
          ((_0x23525b['className'] = 'rh-ai-app-preview-drag-pad'),
            (_0x23525b['dataset']['previewComponentIndex'] = String(_0x24d94f)),
            _0x23525b['setAttribute']('aria-hidden', 'true'),
            _0x3510e0['insertBefore'](_0x23525b, _0x340337 || null));
        }
      });
    }
    ['_getPreviewZoneElement'](_0x558777) {
      const _0x226e8f = String(_0x558777 || '')['trim']();
      if (!['input', 'prompt', 'params', 'advanced']['includes'](_0x226e8f)) return null;
      return this['nodePreviewEl']?.['querySelector']?.('[data-preview-zone="' + _0x226e8f + '\x22]') || null;
    }
    ['clearUiSchemaBinding']() {
      (this['previewUiSchemaCleanup']?.(), (this['previewUiSchemaCleanup'] = null));
    }
    ['destroy']() {
      this['clearUiSchemaBinding']();
    }
  }
  return new _0x56102e();
}
