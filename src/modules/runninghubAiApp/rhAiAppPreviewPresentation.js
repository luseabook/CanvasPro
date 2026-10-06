export function createRhAiAppPreviewPresentation({
  readState: readState = () => ({}),
  writeState: writeState = () => {},
  actions: actions = {},
  primitives: primitives = {},
  windowObject: windowObject = globalThis.window || globalThis,
  documentObject: documentObject = globalThis.document,
} = {}) {
  const {
      OUTPUT_KIND_LABELS: OUTPUT_KIND_LABELS,
      RH_AI_APP_EXIT_MOTION_MS: RH_AI_APP_EXIT_MOTION_MS,
      bindUiSchemaFieldControls: bindUiSchemaFieldControls,
      buildPreviewUiSchemaNodeData: buildPreviewUiSchemaNodeData,
      canPreviewPromptBecomeParam: canPreviewPromptBecomeParam,
      getBundleParamFields: getBundleParamFields,
      getComponentByIndex: getComponentByIndex,
      getCustomAiAppComponentIndex: getCustomAiAppComponentIndex,
      getPreviewComponentDescription: getPreviewComponentDescription,
      getPreviewInstanceText: getPreviewInstanceText,
      getPreviewPromptHelpComponent: getPreviewPromptHelpComponent,
      normalizeAppName: normalizeAppName,
      normalizeComponentKind: normalizeComponentKind,
      normalizeKind: normalizeKind,
      renderPreviewAdvancedPanelHtml: renderPreviewAdvancedPanelHtml,
      renderPreviewAppMenuHtml: renderPreviewAppMenuHtml,
      renderPreviewBatchControlsHtml: renderPreviewBatchControlsHtml,
      renderPreviewHomeParamsHtml: renderPreviewHomeParamsHtml,
      renderPreviewInputComponentsHtml: renderPreviewInputComponentsHtml,
      renderPreviewPromptHelpTipHtml: renderPreviewPromptHelpTipHtml,
      renderPreviewTypeBarHtml: renderPreviewTypeBarHtml,
      renderRhAiAppNodePreviewHtml: renderRhAiAppNodePreviewHtml,
      renderSaveConfigOverwriteMenuHtml: renderSaveConfigOverwriteMenuHtml,
      shouldReduceMotion: shouldReduceMotion,
    } = primitives,
    value = windowObject,
    el = documentObject;
  class handler {
    constructor() {
      this.previewUiSchemaCleanup = null;
    }
    get ['nodePreviewEl']() {
      return readState().nodePreviewEl || null;
    }
    get ['componentDrafts']() {
      return readState().componentDrafts || [];
    }
    get ['kind']() {
      return readState().kind || 'image';
    }
    get ['currentBundle']() {
      return readState().currentBundle || null;
    }
    get ['appName']() {
      return readState().appName || '';
    }
    get ['previewAppMenuOpen']() {
      return readState().previewAppMenuOpen === true;
    }
    get ['pendingDeleteSavedAppId']() {
      return readState().pendingDeleteSavedAppId || '';
    }
    get ['pendingOverwriteSavedAppId']() {
      return readState().pendingOverwriteSavedAppId || '';
    }
    get ['pendingOverwriteIntent']() {
      return readState().pendingOverwriteIntent || '';
    }
    get ['componentDraftKey']() {
      return readState().componentDraftKey || '';
    }
    get ['comfyCandidatePickerOpen']() {
      return readState().comfyCandidatePickerOpen === true;
    }
    get ['comfyCandidateSearchText']() {
      return readState().comfyCandidateSearchText || '';
    }
    get ['saveConfigMenuEl']() {
      return readState().saveConfigMenuEl || null;
    }
    get ['createConfigMenuEl']() {
      return readState().createConfigMenuEl || null;
    }
    set ['componentPickerEl'](componentPickerEl) {
      writeState({ componentPickerEl: componentPickerEl });
    }
    ['_getSavedAppsForKind']() {
      return actions.getSavedAppsForKind?.() || [];
    }
    ['_getSourceMeta']() {
      return actions.getSourceMeta?.() || null;
    }
    ['_shouldShowManualComponentPicker']() {
      return actions.shouldShowManualComponentPicker?.() === true;
    }
    ['_canRemovePreviewParams']() {
      return actions.canRemovePreviewParams?.() !== false;
    }
    ['_canRemovePreviewInputs']() {
      return actions.canRemovePreviewInputs?.() !== false;
    }
    ['_renderComfyCandidatePicker'](options = {}) {
      return actions.renderComfyCandidatePicker?.(options);
    }
    ['_findSavedApp'](item) {
      return actions.findSavedApp?.(item) || null;
    }
    ['_commitPreviewUiSchemaValue'](key, index) {
      return actions.commitPreviewUiSchemaValue?.(key, index);
    }
    ['_renderNodePreview'](bundle = this.currentBundle) {
      if (!this.nodePreviewEl) return;
      (this.clearUiSchemaBinding(),
        (this.nodePreviewEl.innerHTML = renderRhAiAppNodePreviewHtml({
          components: this.componentDrafts,
          kind: this.kind,
          bundle: bundle,
          appName: this.appName,
          savedApps: this._getSavedAppsForKind(),
          isAppMenuOpen: this.previewAppMenuOpen,
          pendingDeleteSavedAppId: this.pendingDeleteSavedAppId,
          pendingOverwriteSavedAppId: this.pendingOverwriteSavedAppId,
          pendingOverwriteIntent: this.pendingOverwriteIntent,
          sourceLabel: this._getSourceMeta()?.label || 'RH AI应用',
          runningHubProfileLabel: readState().runningHubProfileLabel || '',
          showComfyAddPanel: this._shouldShowManualComponentPicker(),
          canAddComfyComponents: Boolean(this.componentDraftKey),
          comfyCandidatePickerOpen: this.comfyCandidatePickerOpen,
          comfyCandidateSearchText: this.comfyCandidateSearchText,
          comfyCandidateEmptyText: '点击添加组件，逐行选择要暴露到节点上的工作流输入。',
          canRemovePreviewParams: this._canRemovePreviewParams(),
          canRemovePreviewInputs: this._canRemovePreviewInputs(),
        })),
        (this.componentPickerEl = this.nodePreviewEl?.querySelector?.(
          "[data-role='comfyui-candidate-menu']",
        )),
        this._renderComfyCandidatePicker({ open: this.comfyCandidatePickerOpen }),
        this._decoratePreviewAdvancedFields(bundle),
        this._bindPreviewUiSchemaControls());
    }
    ['_closePreviewAppMenuElement'](el2) {
      if (!el2) return;
      if (shouldReduceMotion()) {
        el2.remove();
        return;
      }
      (el2.classList.add('is-closing'),
        el2.setAttribute('aria-hidden', 'true'),
        value.setTimeout(() => {
          if (el2.classList?.contains('is-closing')) el2.remove();
        }, RH_AI_APP_EXIT_MOTION_MS));
    }
    ['_patchPreviewAppChrome']() {
      (this._patchSaveConfigMenu(), this._patchCreateConfigMenu());
      const el3 = this.nodePreviewEl?.querySelector?.('.rh-ai-app-preview-node .img-model-wrap');
      if (!el3) return false;
      const el4 = el3.querySelector('.rh-ai-app-preview-model-trigger'),
        el5 = el3.querySelector('.img-model-label');
      if (el5) el5.textContent = normalizeAppName(this.appName);
      actions.syncRunningHubProfileBadge?.(el3);
      el4 && el4.setAttribute('aria-expanded', this.previewAppMenuOpen ? 'true' : 'false');
      const el6 = el3.querySelector("[data-role='saved-app-menu']");
      if (!this.previewAppMenuOpen) return (this._closePreviewAppMenuElement(el6), true);
      el6?.remove();
      const result = renderPreviewAppMenuHtml({
        appName: this.appName,
        savedApps: this._getSavedAppsForKind(),
        isOpen: this.previewAppMenuOpen,
        pendingDeleteSavedAppId: this.pendingDeleteSavedAppId,
        pendingOverwriteSavedAppId: this.pendingOverwriteSavedAppId,
        pendingOverwriteIntent: this.pendingOverwriteIntent,
        sourceLabel: this._getSourceMeta()?.label || 'RH AI应用',
      });
      return (result && el4 && el4.insertAdjacentHTML('afterend', result), true);
    }
    ['_patchSaveConfigMenu']() {
      return this._patchFooterOverwriteMenu(this.saveConfigMenuEl, 'save');
    }
    ['_patchCreateConfigMenu']() {
      return this._patchFooterOverwriteMenu(this.createConfigMenuEl, 'create');
    }
    ['_patchFooterOverwriteMenu'](el7, intent) {
      if (!el7) return false;
      const data = this.pendingOverwriteIntent === intent && Boolean(this.pendingOverwriteSavedAppId),
        savedApp = data ? this._findSavedApp(this.pendingOverwriteSavedAppId) : null;
      if (!savedApp)
        return (
          (el7.hidden = true),
          el7.setAttribute('aria-hidden', 'true'),
          (el7.innerHTML = ''),
          true
        );
      return (
        (el7.hidden = false),
        el7.setAttribute('aria-hidden', 'false'),
        (el7.innerHTML = renderSaveConfigOverwriteMenuHtml({ savedApp: savedApp, intent: intent })),
        true
      );
    }
    ['_patchPreviewPromptArea']() {
      const el8 = this.nodePreviewEl?.querySelector?.('.rh-ai-app-preview-input'),
        el9 = el8?.querySelector?.('.rh-ai-app-preview-prompt'),
        target = el8?.closest?.('.rh-ai-app-real-preview-panel');
      if (!el8 || !el9) return false;
      const source = this.componentDrafts.find(
          (next) => normalizeComponentKind(next?.componentKind) === 'prompt',
        ),
        current = getPreviewPromptHelpComponent(this.componentDrafts),
        entry = (source || current)?.label
          ? '填写' + (source || current).label + '，按 @ 引用素材，/呼出指令...'
          : '描述' + (OUTPUT_KIND_LABELS[this.kind] || '生成') + '内容，按 @ 引用素材，/呼出指令...',
        record = Number(source?.index),
        payload = Number.isInteger(record),
        handle = payload && canPreviewPromptBecomeParam(source);
      (el8.classList.add('rh-ai-app-preview-prompt-zone'),
        el8.classList.toggle('rh-ai-app-preview-prompt-target', payload),
        el8.classList.toggle('rh-ai-app-preview-draggable', handle),
        el8.classList.toggle('rh-ai-app-preview-prompt-draggable', handle),
        (el8.dataset.previewZone = 'prompt'));
      payload
        ? (el8.dataset.previewComponentIndex = String(record))
        : delete el8.dataset.previewComponentIndex;
      if (handle) el8.dataset.previewDragKind = 'prompt';
      else delete el8.dataset.previewDragKind;
      const state = '.rh-ai-app-preview-prompt-help-tip, .rh-ai-app-preview-description-input--prompt';
      (this.nodePreviewEl?.querySelectorAll?.(state).forEach((el10) => {
        el10.remove();
      }),
        Array.from(el8.children)
          .filter((el11) => el11.classList?.contains('rh-ai-app-preview-typebar'))
          .forEach((el12) => el12.remove()));
      const config = source
        ? renderPreviewTypeBarHtml(source, { canRemove: this._canRemovePreviewParams() })
        : '';
      config && el9.insertAdjacentHTML('beforebegin', config);
      const scope = renderPreviewPromptHelpTipHtml(current, { bundle: this.currentBundle });
      if (scope && target) target.insertAdjacentHTML('afterbegin', scope);
      return ((el9.dataset.placeholder = entry), true);
    }
    ['_patchPreviewActionControls'](input = this.currentBundle) {
      const el13 = this.nodePreviewEl?.querySelector?.('.rh-ai-app-preview-node');
      if (!el13) return false;
      const enabled = getPreviewInstanceText(input),
        el14 = el13.querySelector('.ui-schema-instance-slot');
      if (el14) {
        el14.hidden = !enabled;
        const el15 = el14.querySelector('.rh-vram-label');
        el15 && (el15.textContent = enabled);
      }
      const enabled2 = renderPreviewBatchControlsHtml(input),
        el16 = el13.querySelector('.ui-schema-batch-slot');
      return (
        el16 &&
          ((el16.hidden = !enabled2), el16.innerHTML !== enabled2 && (el16.innerHTML = enabled2)),
        true
      );
    }
    ['_patchPreviewWithoutRebuild'](
      output = this.currentBundle,
      {
        renderInputs: renderInputs = false,
        renderParams: renderParams = false,
        renderAdvanced: renderAdvanced = false,
        renderPrompt: renderPrompt = false,
        renderAppChrome: renderAppChrome = false,
        renderActionControls: renderActionControls = false,
      } = {},
    ) {
      const el17 = this.nodePreviewEl?.querySelector?.('.rh-ai-app-preview-node');
      if (!el17) return (this._renderNodePreview(output), false);
      el17.dataset.previewNodeKind = normalizeKind(this.kind);
      if (renderAppChrome) this._patchPreviewAppChrome();
      if (renderPrompt) this._patchPreviewPromptArea();
      if (renderActionControls) this._patchPreviewActionControls(output);
      return (
        (renderInputs || renderParams || renderAdvanced) &&
          this._renderPreviewMutableZones(output, {
            renderInputs: renderInputs,
            renderParams: renderParams,
            renderAdvanced: renderAdvanced,
          }),
        true
      );
    }
    ['_renderPreviewMutableZones'](
      bundle2 = this.currentBundle,
      {
        renderInputs: renderInputs = false,
        renderParams: renderParams = true,
        renderAdvanced: renderAdvanced = true,
      } = {},
    ) {
      if (!this.nodePreviewEl) return;
      const el18 = this._getPreviewZoneElement('input');
      renderInputs &&
        el18 &&
        (el18.innerHTML = renderPreviewInputComponentsHtml(this.componentDrafts, {
          canRemovePreviewInputs: this._canRemovePreviewInputs(),
        }));
      const el19 = this._getPreviewZoneElement('params');
      renderParams &&
        el19 &&
        (el19.innerHTML = renderPreviewHomeParamsHtml(this.componentDrafts, bundle2, {
          canRemovePreviewParams: this._canRemovePreviewParams(),
        }));
      if (renderAdvanced) {
        const value2 = renderPreviewAdvancedPanelHtml({
            components: this.componentDrafts,
            bundle: bundle2,
          }),
          value3 = this.nodePreviewEl.querySelector('.rh-ai-app-real-preview-panel'),
          el20 = this._getPreviewZoneElement('advanced');
        this.clearUiSchemaBinding();
        if (el20) {
          if (value2) el20.outerHTML = value2;
          else el20.remove();
        } else value2 && value3 && value3.insertAdjacentHTML('beforeend', value2);
        (this._decoratePreviewAdvancedFields(bundle2), this._bindPreviewUiSchemaControls());
      } else renderParams && this._bindPreviewUiSchemaControls();
    }
    ['_bindPreviewUiSchemaControls']() {
      const enabled3 = this.nodePreviewEl?.querySelector?.('.rh-ai-app-preview-node');
      if (!enabled3) return;
      (this.clearUiSchemaBinding(),
        (this.previewUiSchemaCleanup = bindUiSchemaFieldControls(enabled3, {
          getNodeData: () => buildPreviewUiSchemaNodeData(this.currentBundle),
          commitFieldValue: (value4, value5) => this._commitPreviewUiSchemaValue(value4, value5),
        })));
    }
    ['_decoratePreviewAdvancedFields'](value6 = this.currentBundle) {
      const list = getBundleParamFields(value6);
      if (!list.length || !this.nodePreviewEl) return;
      list.forEach((value7) => {
        const value8 = getCustomAiAppComponentIndex(value7);
        if (!Number.isInteger(value8)) return;
        const enabled4 = String(value7?.id || '').trim();
        if (!enabled4) return;
        const el21 = Array.from(this.nodePreviewEl.querySelectorAll('[data-ui-schema-field]')).find((el22) => String(el22?.dataset?.uiSchemaField || '') === enabled4);
        if (!el21) return;
        (el21.classList.add('rh-ai-app-preview-draggable', 'rh-ai-app-preview-advanced-param'),
          (el21.dataset.previewDragKind = el21.closest('.rh-ai-app-group-panel')
            ? 'group-param'
            : 'advanced-param'),
          (el21.dataset.previewComponentIndex = String(value8)),
          el21.removeAttribute('title'));
        if (!el21.querySelector('.rh-ai-app-preview-typebar')) {
          const value9 = renderPreviewTypeBarHtml(getComponentByIndex(this.componentDrafts, value8), {
            canRemove: this._canRemovePreviewParams(),
          });
          value9 && el21.insertAdjacentHTML('afterbegin', value9);
        }
        const value10 = getComponentByIndex(this.componentDrafts, value8),
          el23 = el21.querySelector('.ui-schema-field-label'),
          el24 = el23?.closest?.('.rh-vram-adv-label') || el21.querySelector('.rh-vram-adv-label'),
          el25 =
            el23 ||
            el24?.querySelector?.(
              '.rh-adv-title, .ui-schema-field-label, ' + 'span:not(.rh-tip):not(.ui-schema-info-tip)',
            );
        el25 &&
          (el25.classList.add('rh-ai-app-preview-rename-target'),
          (el25.dataset.previewComponentIndex = String(value8)),
          el25.removeAttribute('title'));
        const value11 = getPreviewComponentDescription(value10 || value7, '参数说明'),
          el26 = el24 || el21;
        let list2 = Array.from(el26.querySelectorAll?.('.rh-tip, .ui-schema-info-tip') || []);
        if (!list2.length && el26) {
          const el27 = el.createElement('span');
          ((el27.className = 'rh-tip ui-schema-info-tip'),
            (el27.textContent = '!'),
            el25 ? el25.insertAdjacentElement('afterend', el27) : el26.appendChild(el27),
            (list2 = [el27]));
        }
        list2.forEach((el28) => {
          (el28.classList.add(
            'rh-ai-app-preview-description-target',
            'rh-ai-app-preview-param-description-tip',
          ),
            (el28.dataset.previewComponentIndex = String(value8)),
            el28.setAttribute('role', 'button'),
            el28.setAttribute('tabindex', '0'),
            el28.setAttribute('aria-label', '编辑参数说明'),
            el28.setAttribute('data-tooltip', value11),
            el28.setAttribute('title', value11));
        });
        const value12 = el21.querySelector('.rh-adv-control-line, .ui-schema-field-control');
        if (!el21.querySelector('.rh-ai-app-preview-drag-pad')) {
          const el29 = el.createElement('span');
          ((el29.className = 'rh-ai-app-preview-drag-pad'),
            (el29.dataset.previewComponentIndex = String(value8)),
            el29.setAttribute('aria-hidden', 'true'),
            el21.insertBefore(el29, value12 || null));
        }
      });
    }
    ['_getPreviewZoneElement'](value13) {
      const value14 = String(value13 || '').trim();
      if (!['input', 'prompt', 'params', 'advanced'].includes(value14)) return null;
      return this.nodePreviewEl?.querySelector?.('[data-preview-zone="' + value14 + '"]') || null;
    }
    ['clearUiSchemaBinding']() {
      (this.previewUiSchemaCleanup?.(), (this.previewUiSchemaCleanup = null));
    }
    ['destroy']() {
      this.clearUiSchemaBinding();
    }
  }
  return new handler();
}
