import { sanitizePromptHtml } from '../../utils/dom.js';
import { isPreviewModeEnabled, syncPreviewNodeLoading } from '../../modules/previewMode.js';
import { setupPromptBoxResize, syncPromptBoxSizeFromData } from './promptBoxResizeUi.js';
import { createNodeResizeHandle } from './nodeResizeUi.js';
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../../utils/debugRequestPreview.js';
import {
  bindNodeFooterController,
  bindNodeModelMenuTrigger,
  closeNodeFooterMenus,
} from '../shared/nodeFooterControls.js';
import { onLocaleChange, t } from '../../i18n/index.js';
import {
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
  shouldSubmitPromptByKeyboard,
} from '../../modules/nodePromptShared.js';
import { buildTextModelSmallIconHTML, buildTextProviderMenuGroupsHTML } from './apimartTextModelMenu.js';
import { renderMarkdownToHtml } from './markdownRenderer.js';
import { bindReadonlyTextSelection } from './readonlyTextSelection.js';
export function createAIGenTextNodeUiModule(value) {
  const {
      store: store,
      api: api,
      getDisplayModelName: getDisplayModelName,
      ensureThumbDecoded: ensureThumbDecoded,
      revealRefThumbMedia: revealRefThumbMedia,
      commit: commit,
      TEXT_TOOLBAR_HTML: TEXT_TOOLBAR_HTML,
      bindTextToolbarEvents: bindTextToolbarEvents,
      getPromptPresets: getPromptPresets,
      openCustomPresetsManager: openCustomPresetsManager,
      startLoading: startLoading,
      stopLoading: stopLoading,
      bindRefThumbHoverPreview: bindRefThumbHoverPreview,
      checkSlashTrigger: checkSlashTrigger,
      handleSlashKeyboardNavigation: handleSlashKeyboardNavigation,
      closeSlashMenu: closeSlashMenu,
      activateMenuKeyboard: activateMenuKeyboard,
      _checkAtTrigger: _checkAtTrigger,
      _populateMentionMenu: _populateMentionMenu,
      _handleMentionMenuKeyboard: _handleMentionMenuKeyboard,
      _handlePillKeyboard: _handlePillKeyboard,
      _rehydratePromptPills: _rehydratePromptPills,
      _handlePillHover: _handlePillHover,
      _handlePillOut: _handlePillOut,
      _syncEdgesOrderFromPills: _syncEdgesOrderFromPills,
      _syncPillLabels: _syncPillLabels,
      getCustomTextModels: getCustomTextModels,
      saveCustomTextModels: saveCustomTextModels,
    } = value,
    getStateSnapshot = () =>
      typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState(),
    item = 120;
  class key {
    ['mount']() {
      const el = document.createElement('div');
      ((el.className = 'aigen-node-root aigen-text-node-root'),
        (this._root = el),
        (el.innerHTML = TEXT_TOOLBAR_HTML),
        (this.previewEl = document.createElement('div')),
        (this.previewEl.className = 'img-node-preview aigen-node-preview-fill aigen-text-preview'),
        (this.outputEl = document.createElement('div')),
        (this.outputEl.className = 'text-output-content aigen-text-output'),
        this.outputEl.setAttribute('contenteditable', 'false'));
      const el2 = document.createElement('div');
      ((el2.className = 'img-node-placeholder aigen-media-placeholder aigen-text-placeholder'),
        (el2.textContent = t('aigenText.previewPlaceholder')),
        (this._placeholderEl = el2),
        this.previewEl.appendChild(this.outputEl),
        this.previewEl.appendChild(el2),
        syncPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions?.()),
        (this._unbindOutputTextSelection = bindReadonlyTextSelection(this.outputEl, {
          onActivate: () => this._enterOutputEditMode(),
          onDeactivate: () => this._commitOutputScrollTop(),
        })),
        this.outputEl.addEventListener('blur', () => {
          (this.outputEl.setAttribute('contenteditable', 'false'),
            (this.outputEl.style.cursor = ''),
            this._commitOutputScrollTop());
        }),
        this.outputEl.addEventListener(
          'wheel',
          (event) => {
            event.stopPropagation();
          },
          { passive: false },
        ),
        this.outputEl.addEventListener('scroll', () => {
          this._markOutputScrollTopDirty();
        }));
      if (this._data.outputText) this._renderOutputText(this._data.outputText);
      ((this.outputEl.scrollTop = this._outputScrollTop), el.appendChild(this.previewEl));
      const el3 = document.createElement('div');
      ((el3.className = 'text-prompt-panel'),
        (this._promptPanel = el3),
        el3.addEventListener('pointerdown', (event2) => {
          event2.stopPropagation();
        }),
        el3.addEventListener('dblclick', (event3) => {
          !event3.target.closest('.prompt-textarea') &&
            !event3.target.closest('.text-output-content') &&
            (event3.preventDefault(), event3.stopPropagation());
        }),
        (this.refBarEl = document.createElement('div')),
        (this.refBarEl.className = 'node-ref-bar'),
        el3.appendChild(this.refBarEl),
        this.refBarEl.addEventListener('click', (event4) => {
          const el4 = event4.target.closest('.ref-thumb-delete');
          if (el4) {
            (event4.stopPropagation(), event4.preventDefault());
            const index = el4.closest('.ref-thumb-wrap')?.dataset.edgeId;
            if (index) store.removeEdge(index);
            return;
          }
          const enabled = event4.target.closest('.prompt-attachment-btn');
          if (!enabled) return;
          if (event4._pickConnectHandled) return;
          (event4.stopPropagation(), event4.preventDefault());
          const result = store.getState().pickConnectMode;
          result && result.active && result.sourceNodeId === this.nodeId
            ? store.setPickConnectMode({ active: false })
            : store.setPickConnectMode({
                active: true,
                sourceNodeId: this.nodeId,
                handleDirection: 'left',
              });
        }),
        this.refBarEl.addEventListener('pointerdown', (event5) => {
          if (event5.target.closest('.prompt-attachment-btn, .ref-thumb-delete')) event5.stopPropagation();
        }),
        (this._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(this.refBarEl)));
      const el5 = document.createElement('div');
      ((el5.className = 'prompt-input-wrapper'),
        el5.classList.add('is-resizable'),
        (this._promptInputWrap = el5),
        (this.promptEl = document.createElement('div')),
        (this.promptEl.className = 'prompt-textarea custom-textarea'),
        (this.promptEl.contentEditable = 'true'),
        (this.promptEl.spellcheck = false),
        (this.promptEl.dataset.placeholder = t('aigenText.promptPlaceholder')));
      if (!document.head.querySelector('#v2-gen-node-css')) {
        const el6 = document.createElement('style');
        ((el6.id = 'v2-gen-node-css'),
          (el6.textContent =
            '\n                .prompt-textarea:empty::before {\n                    content: attr(data-placeholder);\n                    color: var(--text-placeholder);\n                    pointer-events: none;\n                }\n                .ref-pill {\n                    display: inline-flex; align-items: center; gap: 3px;\n                    background: transparent; border: none;\n                    border-radius: 4px; padding: 1px 6px; font-size: 14px;\n                    color: var(--text-secondary); cursor: var(--pointer-cursor); user-select: text; -webkit-user-select: text; font-weight: 500;\n                    vertical-align: middle;\n                }\n                .ref-pill .pill-del {\n                    font-size: 16px; color: var(--text-muted);\n                    cursor: var(--link-cursor); margin-left: 2px; line-height: 1;\n                }\n                .ref-pill .pill-del:hover { color: var(--red); }\n                .ref-thumb-wrap.dragging { opacity: 0.3; }\n                .v2-slash-item {\n                    display: flex; flex-direction: column; justify-content: center;\n                    padding: 10px 12px; border-radius: 12px; cursor: var(--link-cursor);\n                    background: transparent; border: none;\n                    transition: all 0.2s; position: relative; height: 54px; overflow: hidden; box-sizing: border-box;\n                }\n                .v2-slash-item:hover, .v2-slash-item.active { background: var(--white-05); }\n                .v2-slash-title {\n                    color: var(--text-primary); font-size: 13px; font-weight: 600;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);\n                    transform: translateY(10px);\n                }\n                .v2-slash-desc {\n                    color: var(--text-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; margin-top: 4px;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;\n                    transform: translateY(16px);\n                    opacity: 0;\n                }\n                .v2-slash-item:hover > .v2-slash-title, .v2-slash-item.active > .v2-slash-title,\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    transform: translateY(0);\n                }\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    opacity: 1;\n                }\n            '),
          document.head.appendChild(el6));
      }
      ((this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
        this.promptEl.addEventListener('input', (data) => {
          (schedulePromptHtmlCommit(this),
            this._checkAtTrigger(data),
            checkSlashTrigger(data, {
              promptEl: this.promptEl,
              nodeType: this._data.type,
              nodeId: this.nodeId,
              onGenerate: (options, target) => this._onGenerate(options, target),
            }),
            _syncEdgesOrderFromPills(this),
            this._updateSubmitButtonState());
        }),
        this.promptEl.addEventListener('blur', () => {
          flushPromptHtmlCommit(this);
        }),
        this.promptEl.addEventListener('mouseover', (source) => _handlePillHover(source, this)),
        this.promptEl.addEventListener('mouseout', (next) => _handlePillOut(next, this)),
        this.promptEl.addEventListener('keydown', (event6) => {
          if (handlePromptSelectAll(this, event6)) return;
          if (_handleMentionMenuKeyboard(event6)) return;
          if (handleSlashKeyboardNavigation(event6)) return;
          if (shouldSubmitPromptByKeyboard(event6)) {
            (event6.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
            return;
          }
          _handlePillKeyboard(this, event6);
        }),
        this.promptEl.addEventListener('paste', (current) => {
          handlePromptPaste(this, current);
        }));
      this._data.prompt &&
        ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), _rehydratePromptPills(this));
      (el5.appendChild(this.promptEl),
        this._syncPromptBoxSizeFromData(this._data),
        this._setupPromptBoxResize(),
        el3.appendChild(el5));
      const root = document.createElement('div');
      root.className = 'prompt-panel-footer';
      const entry = String(this._data.provider || '')
          .trim()
          .toLowerCase(),
        record = this._data.model || 'apimart/kimi-k2-instruct',
        handler = () => {
          const textModelSmallIconHTML = buildTextModelSmallIconHTML(record);
          if (textModelSmallIconHTML) return textModelSmallIconHTML;
          if (entry === 'custom' || entry === 'openai')
            return '<div class="text-model-icon-small text-model-icon-badge">OA</div>';
          return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        },
        textProviderMenuGroupsHTML = buildTextProviderMenuGroupsHTML(record);
      ((root.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              <button type="button" class="img-pill-btn img-model-btn-trigger">\n                ' +
        handler() +
        '\n                <span class="img-model-label">' +
        getDisplayModelName(record) +
        '</span>\n                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-menu-caret"><polyline points="6 9 12 15 18 9"></polyline></svg>\n              </button>\n              <div class="floating-menu img-model-menu node-model-menu">\n                <div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu">\n                  <div class="text-model-icon text-model-icon-badge">OA</div>\n                  <div class="fmi-content">\n                    <div class="fmi-title" data-aigen-text-locale="customModelTitle">' +
        t('aigenText.customModelTitle') +
        '</div>\n                    <div class="fmi-sub" data-aigen-text-locale="customModelSubtitle">' +
        t('aigenText.customModelSubtitle') +
        '</div>\n                  </div>\n                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n                </div>\n                <div class="custom-submenu node-model-submenu node-menu-submenu"></div>\n                ' +
        textProviderMenuGroupsHTML +
        '\n              </div>\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        t('aigenText.debugApiParams') +
        '" data-aigen-text-title="debugApiParams">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <button type="button" class="prompt-submit img-gen-btn" title="' +
        t('aigenText.generate') +
        '" data-aigen-text-title="generate">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
        (this.modelWrap = root.querySelector('.img-model-wrap')),
        (this.btnEl = root.querySelector('.img-gen-btn')));
      const el7 = root.querySelector('.debug-wrench-btn');
      ((this._syncAigenTextLocale = () => {
        (this._placeholderEl && (this._placeholderEl.textContent = t('aigenText.previewPlaceholder')),
          this.promptEl && (this.promptEl.dataset.placeholder = t('aigenText.promptPlaceholder')),
          root
            .querySelector('[data-aigen-text-locale="customModelTitle"]')
            ?.replaceChildren(document.createTextNode(t('aigenText.customModelTitle'))),
          root
            .querySelector('[data-aigen-text-locale="customModelSubtitle"]')
            ?.replaceChildren(document.createTextNode(t('aigenText.customModelSubtitle'))),
          el7?.setAttribute('title', t('aigenText.debugApiParams')),
          this.btnEl?.setAttribute('title', t('aigenText.generate')),
          (this._lastRefHTML = ''),
          this._renderRefBar?.(),
          this._updateSubmitButtonState?.(),
          this._renderCustomTextModelSubmenu?.());
      }),
        this._unbindLocaleChange?.(),
        (this._unbindLocaleChange = onLocaleChange(() => this._syncAigenTextLocale?.())),
        this._syncAigenTextLocale());
      const trigger = root.querySelector('.img-model-btn-trigger'),
        menu = root.querySelector('.img-model-menu'),
        el8 = root.querySelector('.img-model-label'),
        grsai = menu?.querySelector('.grsai-submenu'),
        ppio = menu?.querySelector('.ppio-submenu'),
        apimart = menu?.querySelector('.apimart-submenu'),
        agnes = menu?.querySelector('.agnes-submenu'),
        runninghub = menu?.querySelector('.runninghub-submenu'),
        volcengine = menu?.querySelector('.volcengine-submenu'),
        payload = Object.freeze({
          grsai: grsai,
          ppio: ppio,
          apimart: apimart,
          agnes: agnes,
          runninghub: runninghub,
          volcengine: volcengine,
        }),
        handler2 = (el9) => {
          const el10 = el9?.querySelector('img, svg, div'),
            enabled2 = trigger?.firstElementChild;
          if (!enabled2 || !el10 || el10.classList.contains('fmi-content')) return;
          const el11 = el10.cloneNode(true);
          (el11.removeAttribute?.('style'),
            el11.classList?.remove('text-model-icon', 'node-menu-icon'),
            el11.classList?.add('text-model-icon-small'),
            el11.tagName?.toLowerCase() === 'svg' &&
              (el11.setAttribute('width', '12'),
              el11.setAttribute('height', '12'),
              el11.classList.add('node-menu-icon-small')),
            enabled2.replaceWith(el11));
        },
        handler3 = (el12, handle, el13) => {
          const model = el12?.dataset?.value;
          if (!model) return;
          const provider = el12.dataset.provider || handle,
            el14 = el12.querySelector('.fmi-title') || el12.querySelector('.floating-menu-label');
          ((el8.textContent = el14 ? el14.textContent : model),
            menu.querySelectorAll('.floating-menu-item').forEach((el15) => el15.classList.remove('active')),
            el12.classList.add('active'),
            menu.classList.remove('show'));
          if (el13) el13.style.display = 'none';
          (store.updateNodeData(this.nodeId, { model: model, provider: provider }), handler2(el12));
        };
      (menu?.addEventListener('click', (event7) => {
        const enabled3 = event7.target?.closest?.('.floating-menu-item');
        if (!enabled3 || !menu.contains(enabled3)) return;
        const list = Object.entries(payload),
          enabled4 = list.find(([, state]) => state?.contains(enabled3));
        if (!enabled4) return;
        (event7.stopPropagation(), handler3(enabled3, enabled4[0], enabled4[1]));
      }),
        el7?.addEventListener('click', async (event8) => {
          (event8.stopPropagation(), flushPromptHtmlCommit(this));
          let enabled5;
          if (typeof this._buildPayload === 'function') enabled5 = await this._buildPayload();
          else {
            const prompt = this.promptEl?.innerText?.trim() || '';
            enabled5 = { prompt: prompt, nodeType: this._data.type };
          }
          if (!enabled5) return;
          try {
            const config = await api.buildGenerateTextRequest(enabled5),
              outputText = formatFinalApiDebugRequest(config),
              scope = store.getState(),
              x = this._data.x + (this._data.width || 0x17c) + 50,
              y = this._data.y;
            let enabled6 = Object.values(scope.nodes).find((item2) => item2.type === 'debug');
            if (!enabled6) {
              const id = 'debug-' + Date.now();
              store.addNode({
                id: id,
                type: 'debug',
                x: x,
                y: y,
                width: 0x15e,
                height: 0x104,
                name: t('aigenText.debug.nodeName'),
                outputText: outputText,
              });
            } else store.updateNodeData(enabled6.id, { outputText: outputText, x: x, y: y });
            window.showToast?.(t('aigenText.debug.paramsShown'), 'warn');
          } catch (error) {
            window.showToast?.(
              t('aigenText.debug.buildRequestFailed', { error: error?.message || error }),
              'error',
            );
          }
        }),
        this._footerControllerCleanup?.(),
        (this._footerControllerCleanup = bindNodeFooterController(root)),
        bindNodeModelMenuTrigger({
          root: root,
          trigger: trigger,
          menu: menu,
          closeOthers: () => closeNodeFooterMenus(root, menu),
          activateMenuKeyboard: activateMenuKeyboard,
        }));
      const el16 = menu.querySelector('[data-custom-toggle]'),
        el17 = menu.querySelector('.custom-submenu');
      let setTimeout2 = null;
      const input = () => {
          clearTimeout(setTimeout2);
          if (el17) el17.style.display = 'flex';
        },
        handler4 = (output = 120) => {
          setTimeout2 = setTimeout(() => {
            if (el17 && el17.querySelector('input:focus')) return;
            if (el17) el17.style.display = 'none';
          }, output);
        };
      el16 &&
        (el16.addEventListener('mouseenter', input), el16.addEventListener('mouseleave', () => handler4()));
      el17 &&
        (el17.addEventListener('mouseenter', input),
        el17.addEventListener('mouseleave', () => handler4()),
        el17.addEventListener('click', (event9) => event9.stopPropagation()),
        el17.addEventListener('pointerdown', (event10) => event10.stopPropagation()));
      const run = () => {
        if (!el17) return;
        const list2 = getCustomTextModels(),
          value2 = this._data.model || '';
        ((el17.innerHTML = ''),
          list2.forEach((model2, value3) => {
            const el18 = document.createElement('div');
            ((el18.className = 'floating-menu-item custom-model-item' + (value2 === model2 ? ' active' : '')),
              (el18.dataset.value = model2),
              (el18.innerHTML =
                '\n                    <div class="text-model-icon text-model-icon-badge custom-model-icon">OA</div>\n                    <span class="custom-model-label">' +
                model2 +
                '</span>\n                    <span class="custom-model-del">×</span>\n                '));
            const el19 = el18.querySelector('.custom-model-del');
            (el18.addEventListener('mouseenter', () => {
              if (el19) el19.classList.add('show');
            }),
              el18.addEventListener('mouseleave', () => {
                if (el19) el19.classList.remove('show');
              }),
              el18.addEventListener('click', (event11) => {
                if (event11.target.closest('.custom-model-del')) return;
                ((el8.textContent = model2),
                  menu
                    .querySelectorAll('.floating-menu-item')
                    .forEach((el20) => el20.classList.remove('active')),
                  grsai
                    ?.querySelectorAll('.floating-menu-item')
                    .forEach((el21) => el21.classList.remove('active')),
                  ppio
                    ?.querySelectorAll('.floating-menu-item')
                    .forEach((el22) => el22.classList.remove('active')),
                  el17
                    .querySelectorAll('.floating-menu-item')
                    .forEach((el23) => el23.classList.remove('active')),
                  el18.classList.add('active'),
                  menu.classList.remove('show'),
                  (el17.style.display = 'none'),
                  store.updateNodeData(this.nodeId, { model: model2, provider: 'custom' }));
                const value4 = trigger.firstElementChild;
                if (value4) {
                  const el24 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  (el24.setAttribute('width', '12'),
                    el24.setAttribute('height', '12'),
                    el24.setAttribute('viewBox', '0 0 24 24'),
                    el24.setAttribute('fill', 'none'),
                    el24.setAttribute('stroke', 'currentColor'),
                    el24.setAttribute('stroke-width', '2'),
                    (el24.innerHTML =
                      '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),
                    value4.replaceWith(el24));
                }
              }),
              el19?.addEventListener('click', (event12) => {
                event12.stopPropagation();
                const value5 = getCustomTextModels().filter((item3, value6) => value6 !== value3);
                (saveCustomTextModels(value5), run());
              }),
              el17.appendChild(el18));
          }));
        if (list2.length > 0) {
          const value7 = document.createElement('div');
          ((value7.className = 'custom-model-separator'), el17.appendChild(value7));
        }
        const el25 = document.createElement('div');
        ((el25.className = 'floating-menu-item custom-model-add'),
          (el25.innerHTML =
            '\n                <svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n                <span class="custom-model-add-label">' +
            t('aigenText.customModel.addModel') +
            '</span>\n            '),
          el25.addEventListener('click', (event13) => {
            (event13.stopPropagation(), (el25.innerHTML = ''), el25.classList.add('editing'));
            const el26 = document.createElement('input');
            ((el26.type = 'text'),
              (el26.placeholder = t('aigenText.customModel.namePlaceholder')),
              (el26.className = 'custom-model-input'));
            const el27 = document.createElement('button');
            ((el27.type = 'button'),
              (el27.textContent = t('aigenText.customModel.confirm')),
              (el27.className = 'custom-model-confirm'));
            const run2 = () => {
              const enabled7 = el26.value.trim();
              if (!enabled7) return;
              const list3 = getCustomTextModels();
              (!list3.includes(enabled7) && (list3.push(enabled7), saveCustomTextModels(list3)), run());
            };
            (el26.addEventListener('keydown', (event14) => {
              event14.stopPropagation();
              if (event14.key === 'Enter') run2();
            }),
              el26.addEventListener('keyup', (event15) => event15.stopPropagation()),
              el26.addEventListener('keypress', (event16) => event16.stopPropagation()),
              el26.addEventListener('click', (event17) => event17.stopPropagation()),
              el27.addEventListener('click', (event18) => {
                (event18.stopPropagation(), run2());
              }),
              el25.appendChild(el26),
              el25.appendChild(el27),
              el26.focus());
          }),
          el17.appendChild(el25));
      };
      ((this._renderCustomTextModelSubmenu = run),
        run(),
        this.btnEl.addEventListener('click', () => {
          (flushPromptHtmlCommit(this), this._onGenerate());
        }),
        el3.appendChild(root),
        el.appendChild(el3),
        this._renderRefBar());
      const value8 = el.querySelector('.node-floating-toolbar');
      bindTextToolbarEvents(value8, this._data, () => this._getOutputRawText?.() || '');
      const nodeResizeHandle = createNodeResizeHandle(this, {
        store: store,
        getStateSnapshot: getStateSnapshot,
        commit: commit,
      });
      return (el.appendChild(nodeResizeHandle), this._updateSubmitButtonState(), el);
    }
    ['_enterOutputEditMode']() {
      this.outputEl && this.outputEl.setAttribute('contenteditable', 'false');
      this._commitOutputScrollTop();
      const list4 = store.getState().selectedNodeIds;
      if (!list4.includes(this.nodeId)) store.setSelectedNodes([this.nodeId]);
    }
    ['_captureOutputScrollTop']() {
      return (
        (this._outputScrollTop = Math.max(0, Number(this.outputEl?.scrollTop || 0))),
        this._outputScrollTop
      );
    }
    ['_markOutputScrollTopDirty']() {
      (this._captureOutputScrollTop(),
        (this._outputScrollTopDirty = true),
        this._scheduleOutputScrollTopCommit());
    }
    ['_scheduleOutputScrollTopCommit']() {
      (this._outputScrollTopCommitTimer && clearTimeout(this._outputScrollTopCommitTimer),
        (this._outputScrollTopCommitTimer = setTimeout(() => {
          ((this._outputScrollTopCommitTimer = null), this._commitOutputScrollTop());
        }, item)));
    }
    ['_commitOutputScrollTop']() {
      if (!this.outputEl || !this.nodeId) return 0;
      this._outputScrollTopCommitTimer &&
        (clearTimeout(this._outputScrollTopCommitTimer), (this._outputScrollTopCommitTimer = null));
      const outputScrollTop = this._captureOutputScrollTop();
      this._outputScrollTopDirty = false;
      const value9 =
        typeof store.getStateRaw === 'function'
          ? store.getStateRaw()?.nodes?.[this.nodeId]
          : store.getState?.()?.nodes?.[this.nodeId];
      if (Number(value9?.outputScrollTop) === outputScrollTop) return outputScrollTop;
      return (
        typeof store.updateNodeData === 'function' &&
          store.updateNodeData(this.nodeId, { outputScrollTop: outputScrollTop }),
        outputScrollTop
      );
    }
    ['_getOutputRawText'](value10 = this._data) {
      const value11 = typeof this.nodeId === 'string' ? this.nodeId : '',
        value12 =
          value11 && typeof store.getStateRaw === 'function' ? store.getStateRaw()?.nodes?.[value11] : null;
      return String(value12?.outputText ?? value10?.outputText ?? '');
    }
    ['_renderOutputText'](value13 = this._getOutputRawText()) {
      if (!this.outputEl) return;
      const enabled8 = String(value13 ?? '');
      this._lastRenderedOutputText = enabled8;
      if (!enabled8) {
        (this.outputEl.replaceChildren(), (this.outputEl.style.display = 'none'));
        if (this._placeholderEl) this._placeholderEl.style.display = 'flex';
        return;
      }
      ((this.outputEl.innerHTML = renderMarkdownToHtml(enabled8)), (this.outputEl.style.display = 'block'));
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    }
    ['_handlePreviewDblclick'](event19) {
      if (!isPreviewModeEnabled()) return;
      event19?.stopPropagation?.();
    }
    ['_syncPromptBoxSizeFromData'](value14 = this._data) {
      syncPromptBoxSizeFromData(this, value14);
    }
    ['_setupPromptBoxResize']() {
      setupPromptBoxResize(this, { store: store, getStateSnapshot: getStateSnapshot });
    }
  }
  return key.prototype;
}
