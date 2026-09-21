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
export function createAIGenTextNodeUiModule(_0x38ccdb) {
  const {
      store: _0x41b315,
      api: _0x65939d,
      getDisplayModelName: _0x39631b,
      ensureThumbDecoded: _0xee1b0,
      revealRefThumbMedia: _0x22b86e,
      commit: _0x3958e2,
      TEXT_TOOLBAR_HTML: _0x554c23,
      bindTextToolbarEvents: _0xd15dee,
      getPromptPresets: _0x1749e8,
      openCustomPresetsManager: _0x494143,
      startLoading: _0x127c6a,
      stopLoading: _0x3af18e,
      bindRefThumbHoverPreview: _0x199d27,
      checkSlashTrigger: _0x2f09ea,
      handleSlashKeyboardNavigation: _0x3362f6,
      closeSlashMenu: _0x433a57,
      activateMenuKeyboard: _0x45cbf3,
      _checkAtTrigger: _0x4dbae8,
      _populateMentionMenu: _0x315796,
      _handleMentionMenuKeyboard: _0x10476f,
      _handlePillKeyboard: _0x3ac717,
      _rehydratePromptPills: _0x2073cb,
      _handlePillHover: _0x57f3ab,
      _handlePillOut: _0x193562,
      _syncEdgesOrderFromPills: _0x460ba6,
      _syncPillLabels: _0x17c3df,
      getCustomTextModels: _0x538cf7,
      saveCustomTextModels: _0x571948,
    } = _0x38ccdb,
    _0x2e5252 = () =>
      typeof _0x41b315.getStateRaw === 'function' ? _0x41b315.getStateRaw() : _0x41b315.getState(),
    _0x149ee6 = 120;
  class _0x23dde4 {
    ['mount']() {
      const _0x3aaea7 = document.createElement('div');
      ((_0x3aaea7.className = 'aigen-node-root aigen-text-node-root'),
        (this._root = _0x3aaea7),
        (_0x3aaea7.innerHTML = _0x554c23),
        (this.previewEl = document.createElement('div')),
        (this.previewEl.className = 'img-node-preview aigen-node-preview-fill aigen-text-preview'),
        (this.outputEl = document.createElement('div')),
        (this.outputEl.className = 'text-output-content aigen-text-output'),
        this.outputEl.setAttribute('contenteditable', 'false'));
      const _0x12b06c = document.createElement('div');
      ((_0x12b06c.className = 'img-node-placeholder aigen-media-placeholder aigen-text-placeholder'),
        (_0x12b06c.textContent = t('aigenText.previewPlaceholder')),
        (this._placeholderEl = _0x12b06c),
        this.previewEl.appendChild(this.outputEl),
        this.previewEl.appendChild(_0x12b06c),
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
          (_0x104033) => {
            _0x104033.stopPropagation();
          },
          { passive: false },
        ),
        this.outputEl.addEventListener('scroll', () => {
          this._markOutputScrollTopDirty();
        }));
      if (this._data.outputText) this._renderOutputText(this._data.outputText);
      ((this.outputEl.scrollTop = this._outputScrollTop), _0x3aaea7.appendChild(this.previewEl));
      const _0x542c70 = document.createElement('div');
      ((_0x542c70.className = 'text-prompt-panel'),
        (this._promptPanel = _0x542c70),
        _0x542c70.addEventListener('pointerdown', (_0x564695) => {
          _0x564695.stopPropagation();
        }),
        _0x542c70.addEventListener('dblclick', (_0x2ad074) => {
          !_0x2ad074.target.closest('.prompt-textarea') &&
            !_0x2ad074.target.closest('.text-output-content') &&
            (_0x2ad074.preventDefault(), _0x2ad074.stopPropagation());
        }),
        (this.refBarEl = document.createElement('div')),
        (this.refBarEl.className = 'node-ref-bar'),
        _0x542c70.appendChild(this.refBarEl),
        this.refBarEl.addEventListener('click', (_0x19ddb6) => {
          const _0x332827 = _0x19ddb6.target.closest('.ref-thumb-delete');
          if (_0x332827) {
            (_0x19ddb6.stopPropagation(), _0x19ddb6.preventDefault());
            const _0xd5590b = _0x332827.closest('.ref-thumb-wrap')?.dataset.edgeId;
            if (_0xd5590b) _0x41b315.removeEdge(_0xd5590b);
            return;
          }
          const _0x209f49 = _0x19ddb6.target.closest('.prompt-attachment-btn');
          if (!_0x209f49) return;
          if (_0x19ddb6._pickConnectHandled) return;
          (_0x19ddb6.stopPropagation(), _0x19ddb6.preventDefault());
          const _0x2b3a71 = _0x41b315.getState().pickConnectMode;
          _0x2b3a71 && _0x2b3a71.active && _0x2b3a71.sourceNodeId === this.nodeId
            ? _0x41b315.setPickConnectMode({ active: false })
            : _0x41b315.setPickConnectMode({
                active: true,
                sourceNodeId: this.nodeId,
                handleDirection: 'left',
              });
        }),
        this.refBarEl.addEventListener('pointerdown', (_0x561a73) => {
          if (_0x561a73.target.closest('.prompt-attachment-btn, .ref-thumb-delete'))
            _0x561a73.stopPropagation();
        }),
        (this._unbindRefThumbHoverPreview = _0x199d27(this.refBarEl)));
      const _0x2cda57 = document.createElement('div');
      ((_0x2cda57.className = 'prompt-input-wrapper'),
        _0x2cda57.classList.add('is-resizable'),
        (this._promptInputWrap = _0x2cda57),
        (this.promptEl = document.createElement('div')),
        (this.promptEl.className = 'prompt-textarea custom-textarea'),
        (this.promptEl.contentEditable = 'true'),
        (this.promptEl.spellcheck = false),
        (this.promptEl.dataset.placeholder = t('aigenText.promptPlaceholder')));
      if (!document.head.querySelector('#v2-gen-node-css')) {
        const _0xae4500 = document.createElement('style');
        ((_0xae4500.id = 'v2-gen-node-css'),
          (_0xae4500.textContent =
            '\n                .prompt-textarea:empty::before {\n                    content: attr(data-placeholder);\n                    color: var(--text-placeholder);\n                    pointer-events: none;\n                }\n                .ref-pill {\n                    display: inline-flex; align-items: center; gap: 3px;\n                    background: transparent; border: none;\n                    border-radius: 4px; padding: 1px 6px; font-size: 14px;\n                    color: var(--text-secondary); cursor: var(--pointer-cursor); user-select: text; -webkit-user-select: text; font-weight: 500;\n                    vertical-align: middle;\n                }\n                .ref-pill .pill-del {\n                    font-size: 16px; color: var(--text-muted);\n                    cursor: var(--link-cursor); margin-left: 2px; line-height: 1;\n                }\n                .ref-pill .pill-del:hover { color: var(--red); }\n                .ref-thumb-wrap.dragging { opacity: 0.3; }\n                .v2-slash-item {\n                    display: flex; flex-direction: column; justify-content: center;\n                    padding: 10px 12px; border-radius: 12px; cursor: var(--link-cursor);\n                    background: transparent; border: none;\n                    transition: all 0.2s; position: relative; height: 54px; overflow: hidden; box-sizing: border-box;\n                }\n                .v2-slash-item:hover, .v2-slash-item.active { background: var(--white-05); }\n                .v2-slash-title {\n                    color: var(--text-primary); font-size: 13px; font-weight: 600;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);\n                    transform: translateY(10px);\n                }\n                .v2-slash-desc {\n                    color: var(--text-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; margin-top: 4px;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;\n                    transform: translateY(16px);\n                    opacity: 0;\n                }\n                .v2-slash-item:hover > .v2-slash-title, .v2-slash-item.active > .v2-slash-title,\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    transform: translateY(0);\n                }\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    opacity: 1;\n                }\n            '),
          document.head.appendChild(_0xae4500));
      }
      ((this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
        this.promptEl.addEventListener('input', (_0xcdcfbd) => {
          (schedulePromptHtmlCommit(this),
            this._checkAtTrigger(_0xcdcfbd),
            _0x2f09ea(_0xcdcfbd, {
              promptEl: this.promptEl,
              nodeType: this._data.type,
              nodeId: this.nodeId,
              onGenerate: (_0x24caac, _0x6a8628) => this._onGenerate(_0x24caac, _0x6a8628),
            }),
            _0x460ba6(this),
            this._updateSubmitButtonState());
        }),
        this.promptEl.addEventListener('blur', () => {
          flushPromptHtmlCommit(this);
        }),
        this.promptEl.addEventListener('mouseover', (_0xdae309) => _0x57f3ab(_0xdae309, this)),
        this.promptEl.addEventListener('mouseout', (_0x604c58) => _0x193562(_0x604c58, this)),
        this.promptEl.addEventListener('keydown', (_0x64d59f) => {
          if (handlePromptSelectAll(this, _0x64d59f)) return;
          if (_0x10476f(_0x64d59f)) return;
          if (_0x3362f6(_0x64d59f)) return;
          if (shouldSubmitPromptByKeyboard(_0x64d59f)) {
            (_0x64d59f.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
            return;
          }
          _0x3ac717(this, _0x64d59f);
        }),
        this.promptEl.addEventListener('paste', (_0x4c01cb) => {
          handlePromptPaste(this, _0x4c01cb);
        }));
      this._data.prompt &&
        ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), _0x2073cb(this));
      (_0x2cda57.appendChild(this.promptEl),
        this._syncPromptBoxSizeFromData(this._data),
        this._setupPromptBoxResize(),
        _0x542c70.appendChild(_0x2cda57));
      const _0x4bf022 = document.createElement('div');
      _0x4bf022.className = 'prompt-panel-footer';
      const _0x194dae = String(this._data.provider || '')
          .trim()
          .toLowerCase(),
        _0x4b55bd = this._data.model || 'apimart/kimi-k2-instruct',
        _0x2c3255 = () => {
          const _0x5059fb = buildTextModelSmallIconHTML(_0x4b55bd);
          if (_0x5059fb) return _0x5059fb;
          if (_0x194dae === 'custom' || _0x194dae === 'openai')
            return '<div class="text-model-icon-small text-model-icon-badge">OA</div>';
          return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        },
        _0x4eee7f = buildTextProviderMenuGroupsHTML(_0x4b55bd);
      ((_0x4bf022.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              <button type="button" class="img-pill-btn img-model-btn-trigger">\n                ' +
        _0x2c3255() +
        '\n                <span class="img-model-label">' +
        _0x39631b(_0x4b55bd) +
        '</span>\n                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-menu-caret"><polyline points="6 9 12 15 18 9"></polyline></svg>\n              </button>\n              <div class="floating-menu img-model-menu node-model-menu">\n                <div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu">\n                  <div class="text-model-icon text-model-icon-badge">OA</div>\n                  <div class="fmi-content">\n                    <div class="fmi-title" data-aigen-text-locale="customModelTitle">' +
        t('aigenText.customModelTitle') +
        '</div>\n                    <div class="fmi-sub" data-aigen-text-locale="customModelSubtitle">' +
        t('aigenText.customModelSubtitle') +
        '</div>\n                  </div>\n                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n                </div>\n                <div class="custom-submenu node-model-submenu node-menu-submenu"></div>\n                ' +
        _0x4eee7f +
        '\n              </div>\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        t('aigenText.debugApiParams') +
        '" data-aigen-text-title="debugApiParams">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <button type="button" class="prompt-submit img-gen-btn" title="' +
        t('aigenText.generate') +
        '" data-aigen-text-title="generate">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
        (this.modelWrap = _0x4bf022.querySelector('.img-model-wrap')),
        (this.btnEl = _0x4bf022.querySelector('.img-gen-btn')));
      const _0x41529f = _0x4bf022.querySelector('.debug-wrench-btn');
      ((this._syncAigenTextLocale = () => {
        (this._placeholderEl && (this._placeholderEl.textContent = t('aigenText.previewPlaceholder')),
          this.promptEl && (this.promptEl.dataset.placeholder = t('aigenText.promptPlaceholder')),
          _0x4bf022
            .querySelector('[data-aigen-text-locale="customModelTitle"]')
            ?.replaceChildren(document.createTextNode(t('aigenText.customModelTitle'))),
          _0x4bf022
            .querySelector('[data-aigen-text-locale="customModelSubtitle"]')
            ?.replaceChildren(document.createTextNode(t('aigenText.customModelSubtitle'))),
          _0x41529f?.setAttribute('title', t('aigenText.debugApiParams')),
          this.btnEl?.setAttribute('title', t('aigenText.generate')),
          (this._lastRefHTML = ''),
          this._renderRefBar?.(),
          this._updateSubmitButtonState?.(),
          this._renderCustomTextModelSubmenu?.());
      }),
        this._unbindLocaleChange?.(),
        (this._unbindLocaleChange = onLocaleChange(() => this._syncAigenTextLocale?.())),
        this._syncAigenTextLocale());
      const _0x4f13fe = _0x4bf022.querySelector('.img-model-btn-trigger'),
        _0x188b86 = _0x4bf022.querySelector('.img-model-menu'),
        _0x143678 = _0x4bf022.querySelector('.img-model-label'),
        _0xec94eb = _0x188b86?.querySelector('.grsai-submenu'),
        _0x4d8b57 = _0x188b86?.querySelector('.ppio-submenu'),
        _0x1a0d45 = _0x188b86?.querySelector('.apimart-submenu'),
        _0x520192 = _0x188b86?.querySelector('.agnes-submenu'),
        _0x542010 = _0x188b86?.querySelector('.runninghub-submenu'),
        _0x174d23 = _0x188b86?.querySelector('.volcengine-submenu'),
        _0x3f5229 = Object.freeze({
          grsai: _0xec94eb,
          ppio: _0x4d8b57,
          apimart: _0x1a0d45,
          agnes: _0x520192,
          runninghub: _0x542010,
          volcengine: _0x174d23,
        }),
        _0x3678fe = (_0x192f47) => {
          const _0x4af6f3 = _0x192f47?.querySelector('img, svg, div'),
            _0x456b0b = _0x4f13fe?.firstElementChild;
          if (!_0x456b0b || !_0x4af6f3 || _0x4af6f3.classList.contains('fmi-content')) return;
          const _0x2bc4d8 = _0x4af6f3.cloneNode(true);
          (_0x2bc4d8.removeAttribute?.('style'),
            _0x2bc4d8.classList?.remove('text-model-icon', 'node-menu-icon'),
            _0x2bc4d8.classList?.add('text-model-icon-small'),
            _0x2bc4d8.tagName?.toLowerCase() === 'svg' &&
              (_0x2bc4d8.setAttribute('width', '12'),
              _0x2bc4d8.setAttribute('height', '12'),
              _0x2bc4d8.classList.add('node-menu-icon-small')),
            _0x456b0b.replaceWith(_0x2bc4d8));
        },
        _0x9c706a = (_0x4e8116, _0x2141ed, _0x5d7943) => {
          const _0x5117b1 = _0x4e8116?.dataset?.value;
          if (!_0x5117b1) return;
          const _0x3b20e1 = _0x4e8116.dataset.provider || _0x2141ed,
            _0x59913a =
              _0x4e8116.querySelector('.fmi-title') || _0x4e8116.querySelector('.floating-menu-label');
          ((_0x143678.textContent = _0x59913a ? _0x59913a.textContent : _0x5117b1),
            _0x188b86
              .querySelectorAll('.floating-menu-item')
              .forEach((_0x4a948f) => _0x4a948f.classList.remove('active')),
            _0x4e8116.classList.add('active'),
            _0x188b86.classList.remove('show'));
          if (_0x5d7943) _0x5d7943.style.display = 'none';
          (_0x41b315.updateNodeData(this.nodeId, { model: _0x5117b1, provider: _0x3b20e1 }),
            _0x3678fe(_0x4e8116));
        };
      (_0x188b86?.addEventListener('click', (_0x5501b3) => {
        const _0xc22099 = _0x5501b3.target?.closest?.('.floating-menu-item');
        if (!_0xc22099 || !_0x188b86.contains(_0xc22099)) return;
        const _0x422e41 = Object.entries(_0x3f5229),
          _0x101f74 = _0x422e41.find(([, _0x361513]) => _0x361513?.contains(_0xc22099));
        if (!_0x101f74) return;
        (_0x5501b3.stopPropagation(), _0x9c706a(_0xc22099, _0x101f74[0], _0x101f74[1]));
      }),
        _0x41529f?.addEventListener('click', async (_0x4fd638) => {
          (_0x4fd638.stopPropagation(), flushPromptHtmlCommit(this));
          let _0x51732a;
          if (typeof this._buildPayload === 'function') _0x51732a = await this._buildPayload();
          else {
            const _0x2dd864 = this.promptEl?.innerText?.trim() || '';
            _0x51732a = { prompt: _0x2dd864, nodeType: this._data.type };
          }
          if (!_0x51732a) return;
          try {
            const _0x461944 = await _0x65939d.buildGenerateTextRequest(_0x51732a),
              _0x5cf002 = formatFinalApiDebugRequest(_0x461944),
              _0x5ce385 = _0x41b315.getState(),
              _0x5e5aa2 = this._data.x + (this._data.width || 0x17c) + 50,
              _0x17f18f = this._data.y;
            let _0x5662b3 = Object.values(_0x5ce385.nodes).find((_0x1b2729) => _0x1b2729.type === 'debug');
            if (!_0x5662b3) {
              const _0x3c1ce7 = 'debug-' + Date.now();
              _0x41b315.addNode({
                id: _0x3c1ce7,
                type: 'debug',
                x: _0x5e5aa2,
                y: _0x17f18f,
                width: 0x15e,
                height: 0x104,
                name: t('aigenText.debug.nodeName'),
                outputText: _0x5cf002,
              });
            } else
              _0x41b315.updateNodeData(_0x5662b3.id, { outputText: _0x5cf002, x: _0x5e5aa2, y: _0x17f18f });
            window.showToast?.(t('aigenText.debug.paramsShown'), 'warn');
          } catch (_0x58231e) {
            window.showToast?.(
              t('aigenText.debug.buildRequestFailed', { error: _0x58231e?.message || _0x58231e }),
              'error',
            );
          }
        }),
        this._footerControllerCleanup?.(),
        (this._footerControllerCleanup = bindNodeFooterController(_0x4bf022)),
        bindNodeModelMenuTrigger({
          root: _0x4bf022,
          trigger: _0x4f13fe,
          menu: _0x188b86,
          closeOthers: () => closeNodeFooterMenus(_0x4bf022, _0x188b86),
          activateMenuKeyboard: _0x45cbf3,
        }));
      const _0x271e9a = _0x188b86.querySelector('[data-custom-toggle]'),
        _0x25636f = _0x188b86.querySelector('.custom-submenu');
      let _0x3d199b = null;
      const _0x3b1bda = () => {
          clearTimeout(_0x3d199b);
          if (_0x25636f) _0x25636f.style.display = 'flex';
        },
        _0x25fc6c = (_0x288ba2 = 120) => {
          _0x3d199b = setTimeout(() => {
            if (_0x25636f && _0x25636f.querySelector('input:focus')) return;
            if (_0x25636f) _0x25636f.style.display = 'none';
          }, _0x288ba2);
        };
      _0x271e9a &&
        (_0x271e9a.addEventListener('mouseenter', _0x3b1bda),
        _0x271e9a.addEventListener('mouseleave', () => _0x25fc6c()));
      _0x25636f &&
        (_0x25636f.addEventListener('mouseenter', _0x3b1bda),
        _0x25636f.addEventListener('mouseleave', () => _0x25fc6c()),
        _0x25636f.addEventListener('click', (_0x211ec7) => _0x211ec7.stopPropagation()),
        _0x25636f.addEventListener('pointerdown', (_0x38df3f) => _0x38df3f.stopPropagation()));
      const _0x4828e4 = () => {
        if (!_0x25636f) return;
        const _0x414088 = _0x538cf7(),
          _0x2626d8 = this._data.model || '';
        ((_0x25636f.innerHTML = ''),
          _0x414088.forEach((_0x1bb478, _0x4c577f) => {
            const _0xc3e5d0 = document.createElement('div');
            ((_0xc3e5d0.className =
              'floating-menu-item custom-model-item' + (_0x2626d8 === _0x1bb478 ? ' active' : '')),
              (_0xc3e5d0.dataset.value = _0x1bb478),
              (_0xc3e5d0.innerHTML =
                '\n                    <div class="text-model-icon text-model-icon-badge custom-model-icon">OA</div>\n                    <span class="custom-model-label">' +
                _0x1bb478 +
                '</span>\n                    <span class="custom-model-del">×</span>\n                '));
            const _0xba8ac3 = _0xc3e5d0.querySelector('.custom-model-del');
            (_0xc3e5d0.addEventListener('mouseenter', () => {
              if (_0xba8ac3) _0xba8ac3.classList.add('show');
            }),
              _0xc3e5d0.addEventListener('mouseleave', () => {
                if (_0xba8ac3) _0xba8ac3.classList.remove('show');
              }),
              _0xc3e5d0.addEventListener('click', (_0x50a8a6) => {
                if (_0x50a8a6.target.closest('.custom-model-del')) return;
                ((_0x143678.textContent = _0x1bb478),
                  _0x188b86
                    .querySelectorAll('.floating-menu-item')
                    .forEach((_0xb6a4db) => _0xb6a4db.classList.remove('active')),
                  _0xec94eb
                    ?.querySelectorAll('.floating-menu-item')
                    .forEach((_0x3ec6c0) => _0x3ec6c0.classList.remove('active')),
                  _0x4d8b57
                    ?.querySelectorAll('.floating-menu-item')
                    .forEach((_0x3032bc) => _0x3032bc.classList.remove('active')),
                  _0x25636f
                    .querySelectorAll('.floating-menu-item')
                    .forEach((_0x26e4c1) => _0x26e4c1.classList.remove('active')),
                  _0xc3e5d0.classList.add('active'),
                  _0x188b86.classList.remove('show'),
                  (_0x25636f.style.display = 'none'),
                  _0x41b315.updateNodeData(this.nodeId, { model: _0x1bb478, provider: 'custom' }));
                const _0x183863 = _0x4f13fe.firstElementChild;
                if (_0x183863) {
                  const _0x197e50 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  (_0x197e50.setAttribute('width', '12'),
                    _0x197e50.setAttribute('height', '12'),
                    _0x197e50.setAttribute('viewBox', '0 0 24 24'),
                    _0x197e50.setAttribute('fill', 'none'),
                    _0x197e50.setAttribute('stroke', 'currentColor'),
                    _0x197e50.setAttribute('stroke-width', '2'),
                    (_0x197e50.innerHTML =
                      '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),
                    _0x183863.replaceWith(_0x197e50));
                }
              }),
              _0xba8ac3?.addEventListener('click', (_0x567130) => {
                _0x567130.stopPropagation();
                const _0x5b70de = _0x538cf7().filter((_0x27b2d1, _0x14f07a) => _0x14f07a !== _0x4c577f);
                (_0x571948(_0x5b70de), _0x4828e4());
              }),
              _0x25636f.appendChild(_0xc3e5d0));
          }));
        if (_0x414088.length > 0) {
          const _0x268269 = document.createElement('div');
          ((_0x268269.className = 'custom-model-separator'), _0x25636f.appendChild(_0x268269));
        }
        const _0x5a3fdf = document.createElement('div');
        ((_0x5a3fdf.className = 'floating-menu-item custom-model-add'),
          (_0x5a3fdf.innerHTML =
            '\n                <svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n                <span class="custom-model-add-label">' +
            t('aigenText.customModel.addModel') +
            '</span>\n            '),
          _0x5a3fdf.addEventListener('click', (_0x468c52) => {
            (_0x468c52.stopPropagation(), (_0x5a3fdf.innerHTML = ''), _0x5a3fdf.classList.add('editing'));
            const _0x363176 = document.createElement('input');
            ((_0x363176.type = 'text'),
              (_0x363176.placeholder = t('aigenText.customModel.namePlaceholder')),
              (_0x363176.className = 'custom-model-input'));
            const _0x4d0096 = document.createElement('button');
            ((_0x4d0096.type = 'button'),
              (_0x4d0096.textContent = t('aigenText.customModel.confirm')),
              (_0x4d0096.className = 'custom-model-confirm'));
            const _0x1b866d = () => {
              const _0xbd47cd = _0x363176.value.trim();
              if (!_0xbd47cd) return;
              const _0x398d53 = _0x538cf7();
              (!_0x398d53.includes(_0xbd47cd) && (_0x398d53.push(_0xbd47cd), _0x571948(_0x398d53)),
                _0x4828e4());
            };
            (_0x363176.addEventListener('keydown', (_0x805799) => {
              _0x805799.stopPropagation();
              if (_0x805799.key === 'Enter') _0x1b866d();
            }),
              _0x363176.addEventListener('keyup', (_0x2bcaa7) => _0x2bcaa7.stopPropagation()),
              _0x363176.addEventListener('keypress', (_0x5cfa21) => _0x5cfa21.stopPropagation()),
              _0x363176.addEventListener('click', (_0x434de2) => _0x434de2.stopPropagation()),
              _0x4d0096.addEventListener('click', (_0x282435) => {
                (_0x282435.stopPropagation(), _0x1b866d());
              }),
              _0x5a3fdf.appendChild(_0x363176),
              _0x5a3fdf.appendChild(_0x4d0096),
              _0x363176.focus());
          }),
          _0x25636f.appendChild(_0x5a3fdf));
      };
      ((this._renderCustomTextModelSubmenu = _0x4828e4),
        _0x4828e4(),
        this.btnEl.addEventListener('click', () => {
          (flushPromptHtmlCommit(this), this._onGenerate());
        }),
        _0x542c70.appendChild(_0x4bf022),
        _0x3aaea7.appendChild(_0x542c70),
        this._renderRefBar());
      const _0x13ef78 = _0x3aaea7.querySelector('.node-floating-toolbar');
      _0xd15dee(_0x13ef78, this._data, () => this._getOutputRawText?.() || '');
      const _0x57d630 = createNodeResizeHandle(this, {
        store: _0x41b315,
        getStateSnapshot: _0x2e5252,
        commit: _0x3958e2,
      });
      return (_0x3aaea7.appendChild(_0x57d630), this._updateSubmitButtonState(), _0x3aaea7);
    }
    ['_enterOutputEditMode']() {
      this.outputEl && this.outputEl.setAttribute('contenteditable', 'false');
      this._commitOutputScrollTop();
      const _0x5ac3f5 = _0x41b315.getState().selectedNodeIds;
      if (!_0x5ac3f5.includes(this.nodeId)) _0x41b315.setSelectedNodes([this.nodeId]);
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
        }, _0x149ee6)));
    }
    ['_commitOutputScrollTop']() {
      if (!this.outputEl || !this.nodeId) return 0;
      this._outputScrollTopCommitTimer &&
        (clearTimeout(this._outputScrollTopCommitTimer), (this._outputScrollTopCommitTimer = null));
      const _0x5bcc3c = this._captureOutputScrollTop();
      this._outputScrollTopDirty = false;
      const _0x43a213 =
        typeof _0x41b315.getStateRaw === 'function'
          ? _0x41b315.getStateRaw()?.nodes?.[this.nodeId]
          : _0x41b315.getState?.()?.nodes?.[this.nodeId];
      if (Number(_0x43a213?.outputScrollTop) === _0x5bcc3c) return _0x5bcc3c;
      return (
        typeof _0x41b315.updateNodeData === 'function' &&
          _0x41b315.updateNodeData(this.nodeId, { outputScrollTop: _0x5bcc3c }),
        _0x5bcc3c
      );
    }
    ['_getOutputRawText'](_0x110e48 = this._data) {
      const _0x5dfe88 = typeof this.nodeId === 'string' ? this.nodeId : '',
        _0x2620a6 =
          _0x5dfe88 && typeof _0x41b315.getStateRaw === 'function'
            ? _0x41b315.getStateRaw()?.nodes?.[_0x5dfe88]
            : null;
      return String(_0x2620a6?.outputText ?? _0x110e48?.outputText ?? '');
    }
    ['_renderOutputText'](_0x89abb6 = this._getOutputRawText()) {
      if (!this.outputEl) return;
      const _0x5292ba = String(_0x89abb6 ?? '');
      this._lastRenderedOutputText = _0x5292ba;
      if (!_0x5292ba) {
        (this.outputEl.replaceChildren(), (this.outputEl.style.display = 'none'));
        if (this._placeholderEl) this._placeholderEl.style.display = 'flex';
        return;
      }
      ((this.outputEl.innerHTML = renderMarkdownToHtml(_0x5292ba)), (this.outputEl.style.display = 'block'));
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    }
    ['_handlePreviewDblclick'](_0x208b28) {
      if (!isPreviewModeEnabled()) return;
      _0x208b28?.stopPropagation?.();
    }
    ['_syncPromptBoxSizeFromData'](_0x1ab914 = this._data) {
      syncPromptBoxSizeFromData(this, _0x1ab914);
    }
    ['_setupPromptBoxResize']() {
      setupPromptBoxResize(this, { store: _0x41b315, getStateSnapshot: _0x2e5252 });
    }
  }
  return _0x23dde4.prototype;
}
