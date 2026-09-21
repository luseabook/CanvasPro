import { buildGenerateTextRequest } from '../../api/aiTextApi.js';
import appStore from '../core/stores/appStore.js';
import { getDisplayModelName } from '../modules/providers.js';
import { bindRefThumbHoverPreview } from '../modules/refThumbHoverPreview.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation } from '../modules/slashMenu.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import {
  _checkAtTrigger,
  _handleMentionMenuKeyboard,
  _handlePillHover,
  _handlePillKeyboard,
  _handlePillOut,
  _rehydratePromptPills,
  _syncEdgesOrderFromPills,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
  shouldSubmitPromptByKeyboard,
} from '../modules/nodePromptShared.js';
import { sanitizePromptHtml } from '../utils/dom.js';
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../utils/debugRequestPreview.js';
import {
  buildTextModelSmallIconHTML,
  buildTextProviderMenuGroupsHTML,
} from './aigenText/apimartTextModelMenu.js';
import { getCustomTextModels, saveCustomTextModels } from './aigenText/customTextModels.js';
import { setupPromptBoxResize, syncPromptBoxSizeFromData } from './aigenText/promptBoxResizeUi.js';
import { createPromptAttachmentButtonHTML } from './refAttachmentButton.js';
import {
  bindNodeFooterController,
  bindNodeModelMenuTrigger,
  closeNodeFooterMenus,
} from './shared/nodeFooterControls.js';
import { t } from '../i18n/index.js';
function sharedPromptPanelText(_0x1f57d9, _0x24b19c = {}) {
  return t('sharedPromptPanel.' + _0x1f57d9, _0x24b19c);
}
function escapeSharedPromptPanelHtml(_0x46405c) {
  return String(_0x46405c ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
export function buildSharedPromptPanel(_0x5d755f, _0x2b31e5 = {}) {
  const _0x3540f7 = document.createElement('div');
  ((_0x3540f7.className = 'text-prompt-panel'), (_0x5d755f._promptPanel = _0x3540f7));
  const _0x5ac97c = () =>
    typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
  (_0x3540f7.addEventListener('pointerdown', (_0x29bc7b) => {
    _0x29bc7b.stopPropagation();
  }),
    _0x3540f7.addEventListener('dblclick', (_0x117260) => {
      !_0x117260.target.closest('.prompt-textarea') &&
        (_0x117260.preventDefault(), _0x117260.stopPropagation());
    }),
    (_0x5d755f.refBarEl = document.createElement('div')),
    (_0x5d755f.refBarEl.className = 'node-ref-bar'),
    _0x3540f7.appendChild(_0x5d755f.refBarEl),
    _0x5d755f.refBarEl.addEventListener('click', (_0x5dc040) => {
      const _0x28d2c4 = _0x5dc040.target.closest('.ref-thumb-delete');
      if (_0x28d2c4) {
        (_0x5dc040.stopPropagation(), _0x5dc040.preventDefault());
        const _0x37ef2d = _0x28d2c4.closest('.ref-thumb-wrap')?.dataset.edgeId;
        if (_0x37ef2d) appStore.removeEdge(_0x37ef2d);
        return;
      }
      const _0x4185f9 = _0x5dc040.target.closest('.prompt-attachment-btn');
      if (!_0x4185f9) return;
      if (_0x5dc040._pickConnectHandled) return;
      (_0x5dc040.stopPropagation(), _0x5dc040.preventDefault());
      const _0x3801f8 = appStore.getState().pickConnectMode;
      _0x3801f8 && _0x3801f8.active && _0x3801f8.sourceNodeId === _0x5d755f.nodeId
        ? appStore.setPickConnectMode({ active: false })
        : appStore.setPickConnectMode({
            active: true,
            sourceNodeId: _0x5d755f.nodeId,
            handleDirection: 'left',
          });
    }),
    _0x5d755f.refBarEl.addEventListener('pointerdown', (_0x53c95d) => {
      if (_0x53c95d.target.closest('.prompt-attachment-btn, .ref-thumb-delete')) _0x53c95d.stopPropagation();
    }),
    _0x5d755f._unbindRefThumbHoverPreview?.(),
    (_0x5d755f._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(_0x5d755f.refBarEl)));
  const _0x33dc6d = document.createElement('div');
  ((_0x33dc6d.className = 'prompt-input-wrapper'),
    _0x33dc6d.classList.add('is-resizable'),
    (_0x5d755f._promptInputWrap = _0x33dc6d),
    (_0x5d755f.promptEl = document.createElement('div')),
    (_0x5d755f.promptEl.className = 'prompt-textarea custom-textarea'),
    (_0x5d755f.promptEl.contentEditable = 'true'),
    (_0x5d755f.promptEl.spellcheck = false),
    (_0x5d755f.promptEl.dataset.placeholder =
      _0x2b31e5.placeholder || sharedPromptPanelText('promptPlaceholder')),
    (_0x5d755f._flushPromptHtmlCommit = () => flushPromptHtmlCommit(_0x5d755f)),
    _0x5d755f.promptEl.addEventListener('input', (_0x464516) => {
      (schedulePromptHtmlCommit(_0x5d755f),
        _checkAtTrigger(_0x5d755f, _0x464516),
        checkSlashTrigger(_0x464516, {
          promptEl: _0x5d755f.promptEl,
          nodeType: _0x5d755f._data?.type,
          nodeId: _0x5d755f.nodeId,
          onGenerate: (_0x5c7517, _0xa1fffe) => _0x5d755f._onGenerate?.(_0x5c7517, _0xa1fffe),
        }),
        _syncEdgesOrderFromPills(_0x5d755f),
        _0x5d755f._updateSubmitButtonState?.());
    }),
    _0x5d755f.promptEl.addEventListener('blur', () => {
      flushPromptHtmlCommit(_0x5d755f);
    }),
    _0x5d755f.promptEl.addEventListener('mouseover', (_0x5c39ba) => _handlePillHover(_0x5c39ba, _0x5d755f)),
    _0x5d755f.promptEl.addEventListener('mouseout', (_0x1fa78c) => _handlePillOut(_0x1fa78c, _0x5d755f)),
    _0x5d755f.promptEl.addEventListener('keydown', (_0x3e5c0d) => {
      if (handlePromptSelectAll(_0x5d755f, _0x3e5c0d)) return;
      if (_handleMentionMenuKeyboard(_0x3e5c0d)) return;
      if (handleSlashKeyboardNavigation(_0x3e5c0d)) return;
      if (shouldSubmitPromptByKeyboard(_0x3e5c0d)) {
        (_0x3e5c0d.preventDefault(), flushPromptHtmlCommit(_0x5d755f), _0x5d755f.btnEl?.click());
        return;
      }
      _handlePillKeyboard(_0x5d755f, _0x3e5c0d);
    }),
    _0x5d755f.promptEl.addEventListener('paste', (_0x214e52) => {
      handlePromptPaste(_0x5d755f, _0x214e52);
    }));
  _0x5d755f._data.prompt &&
    ((_0x5d755f.promptEl.innerHTML = sanitizePromptHtml(_0x5d755f._data.prompt)),
    _rehydratePromptPills(_0x5d755f));
  (_0x33dc6d.appendChild(_0x5d755f.promptEl),
    (_0x5d755f._syncPromptBoxSizeFromData = (_0x515bb3 = _0x5d755f._data) =>
      syncPromptBoxSizeFromData(_0x5d755f, _0x515bb3)),
    _0x5d755f._syncPromptBoxSizeFromData(_0x5d755f._data),
    setupPromptBoxResize(_0x5d755f, { store: appStore, getStateSnapshot: _0x5ac97c }),
    _0x3540f7.appendChild(_0x33dc6d));
  const _0x3def85 = document.createElement('div');
  _0x3def85.className = 'prompt-panel-footer text-prompt-actions';
  const _0x3ae255 = [];
  if (_0x2b31e5?.modelMenu) {
    const _0x1bc4b1 = _0x2b31e5.modelMenu,
      _0x54a050 = String(_0x1bc4b1.provider || 'volcengine').trim(),
      _0x11e587 = Array.isArray(_0x1bc4b1.providers)
        ? _0x1bc4b1.providers.map((_0x1edf95) => String(_0x1edf95).toLowerCase())
        : null,
      _0x3b705e = _0x1bc4b1.allowCustomModels !== false,
      _0x1aaeee = String(
        _0x1bc4b1.model ||
          _0x5d755f._data?.model ||
          _0x5d755f._data?.storyboardScript?.model ||
          _0x1bc4b1.defaultModel ||
          '',
      ).trim(),
      _0xa802cf = () => {
        const _0x316bca = buildTextModelSmallIconHTML(_0x1aaeee);
        if (_0x316bca) return _0x316bca;
        if (_0x54a050 === 'custom' || _0x54a050 === 'openai')
          return '<div class="text-model-icon-small text-model-icon-badge">OA</div>';
        return '<div class="text-model-icon-small text-model-icon-badge">AI</div>';
      },
      _0x540959 = document.createElement('div');
    ((_0x540959.className = 'img-model-pills'),
      (_0x540959.innerHTML =
        '\n      <div class="img-model-wrap">\n        <button type="button" class="img-pill-btn img-model-btn-trigger">\n          ' +
        _0xa802cf() +
        '\n          <span class="img-model-label">' +
        getDisplayModelName(_0x1aaeee) +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-menu-caret"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu node-model-menu">\n          ' +
        (_0x3b705e
          ? '<div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu">\n            <div class="text-model-icon text-model-icon-badge">OA</div>\n            <div class="fmi-content">\n              <div class="fmi-title">' +
            escapeSharedPromptPanelHtml(sharedPromptPanelText('customModelTitle')) +
            '</div>\n              <div class="fmi-sub">' +
            escapeSharedPromptPanelHtml(sharedPromptPanelText('customModelSubtitle')) +
            '</div>\n            </div>\n            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n          </div>\n          <div class="custom-submenu node-model-submenu node-menu-submenu"></div>'
          : '') +
        '\n          ' +
        buildTextProviderMenuGroupsHTML(_0x1aaeee, { providers: _0x11e587 }) +
        '\n        </div>\n      </div>'),
      _0x3def85.appendChild(_0x540959));
    const _0x29eebf = _0x540959.querySelector('.img-model-wrap'),
      _0x7b5c77 = _0x540959.querySelector('.img-model-btn-trigger'),
      _0x50c93b = _0x540959.querySelector('.img-model-menu'),
      _0x2c407f = _0x540959.querySelector('.img-model-label'),
      _0x5eb5dc = Object.freeze({
        grsai: _0x50c93b?.querySelector('.grsai-submenu'),
        ppio: _0x50c93b?.querySelector('.ppio-submenu'),
        apimart: _0x50c93b?.querySelector('.apimart-submenu'),
        agnes: _0x50c93b?.querySelector('.agnes-submenu'),
        runninghub: _0x50c93b?.querySelector('.runninghub-submenu'),
        volcengine: _0x50c93b?.querySelector('.volcengine-submenu'),
      }),
      _0x38bebc = (_0x19f75c) => {
        const _0x362e3c = _0x19f75c?.querySelector('img, svg, div'),
          _0xfd8373 = _0x7b5c77?.firstElementChild;
        if (!_0xfd8373 || !_0x362e3c || _0x362e3c.classList?.contains('fmi-content')) return;
        const _0x404783 = _0x362e3c.cloneNode(true);
        (_0x404783.removeAttribute?.('style'),
          _0x404783.classList?.remove('text-model-icon', 'node-menu-icon'),
          _0x404783.classList?.add('text-model-icon-small'),
          _0x404783.tagName?.toLowerCase() === 'svg' &&
            (_0x404783.setAttribute('width', '12'),
            _0x404783.setAttribute('height', '12'),
            _0x404783.classList.add('node-menu-icon-small')),
          _0xfd8373.replaceWith(_0x404783));
      },
      _0x198acd = (_0x3a2bca, _0x4a09e0, _0x214788) => {
        const _0x4c82ed = String(_0x3a2bca?.dataset?.value || '').trim();
        if (!_0x4c82ed) return;
        const _0x25a62d = String(_0x3a2bca.dataset.provider || _0x4a09e0 || _0x54a050).trim(),
          _0x5268e9 =
            _0x3a2bca.querySelector('.fmi-title') ||
            _0x3a2bca.querySelector('.floating-menu-label') ||
            _0x3a2bca.querySelector('.custom-model-label');
        if (_0x2c407f) _0x2c407f.textContent = _0x5268e9?.textContent || _0x4c82ed;
        (_0x50c93b
          ?.querySelectorAll('.floating-menu-item')
          .forEach((_0x1588a2) => _0x1588a2.classList.remove('active')),
          _0x3a2bca.classList.add('active'),
          _0x50c93b?.classList.remove('show'));
        if (_0x214788) _0x214788.style.display = 'none';
        (_0x38bebc(_0x3a2bca),
          typeof _0x1bc4b1.onSelect === 'function'
            ? _0x1bc4b1.onSelect({
                modelId: _0x4c82ed,
                provider: _0x25a62d,
                item: _0x3a2bca,
                self: _0x5d755f,
              })
            : appStore.updateNodeData(_0x5d755f.nodeId, { model: _0x4c82ed, provider: _0x25a62d }));
      };
    _0x50c93b?.addEventListener('click', (_0x492954) => {
      const _0x1c8a3b = _0x492954.target?.closest?.('.floating-menu-item');
      if (!_0x1c8a3b || !_0x50c93b.contains(_0x1c8a3b)) return;
      if (!_0x1c8a3b.dataset.value) return;
      const _0x427d9d = Object.entries(_0x5eb5dc).find(([, _0x229978]) => _0x229978?.contains(_0x1c8a3b));
      if (_0x427d9d) {
        (_0x492954.stopPropagation(), _0x198acd(_0x1c8a3b, _0x427d9d[0], _0x427d9d[1]));
        return;
      }
      if (!_0x3b705e) return;
      const _0x5236ad = _0x50c93b.querySelector('.custom-submenu');
      _0x5236ad?.contains(_0x1c8a3b) &&
        (_0x492954.stopPropagation(), _0x198acd(_0x1c8a3b, 'custom', _0x5236ad));
    });
    const _0x27424c = _0x50c93b?.querySelector('.custom-submenu');
    _0x3b705e &&
      _0x27424c?.addEventListener('pointerdown', (_0x2fe1bf) => {
        _0x2fe1bf.stopPropagation();
      });
    const _0x1ed5ae = () => {
      if (!_0x3b705e || !_0x27424c) return;
      const _0x48f484 = getCustomTextModels(),
        _0x52942f = _0x5d755f._data?.model || '';
      (_0x27424c.replaceChildren(),
        _0x48f484.forEach((_0x26d373, _0x59459a) => {
          const _0xcee038 = document.createElement('div');
          ((_0xcee038.className =
            'floating-menu-item custom-model-item' + (_0x52942f === _0x26d373 ? ' active' : '')),
            (_0xcee038.dataset.value = _0x26d373));
          const _0x2cfddb = document.createElement('div');
          ((_0x2cfddb.className = 'text-model-icon text-model-icon-badge custom-model-icon'),
            (_0x2cfddb.textContent = 'OA'));
          const _0x3face1 = document.createElement('span');
          ((_0x3face1.className = 'custom-model-label'), (_0x3face1.textContent = _0x26d373));
          const _0x196a7d = document.createElement('span');
          ((_0x196a7d.className = 'custom-model-del'),
            (_0x196a7d.textContent = '×'),
            _0xcee038.appendChild(_0x2cfddb),
            _0xcee038.appendChild(_0x3face1),
            _0xcee038.appendChild(_0x196a7d),
            _0xcee038.addEventListener('mouseenter', () => {
              _0x196a7d.classList.add('show');
            }),
            _0xcee038.addEventListener('mouseleave', () => {
              _0x196a7d.classList.remove('show');
            }),
            _0x196a7d.addEventListener('click', (_0xfca84a) => {
              (_0xfca84a.stopPropagation(),
                saveCustomTextModels(
                  getCustomTextModels().filter((_0x15b03f, _0x40880e) => _0x40880e !== _0x59459a),
                ),
                _0x1ed5ae());
            }),
            _0x27424c.appendChild(_0xcee038));
        }));
      if (_0x48f484.length > 0) {
        const _0x28fa3f = document.createElement('div');
        ((_0x28fa3f.className = 'custom-model-separator'), _0x27424c.appendChild(_0x28fa3f));
      }
      const _0x320539 = document.createElement('div');
      ((_0x320539.className = 'floating-menu-item custom-model-add'),
        (_0x320539.innerHTML =
          '\n        <svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n        <span class="custom-model-add-label">' +
          escapeSharedPromptPanelHtml(sharedPromptPanelText('addModel')) +
          '</span>'),
        _0x320539.addEventListener('click', (_0x1e9689) => {
          (_0x1e9689.stopPropagation(), _0x320539.replaceChildren(), _0x320539.classList.add('editing'));
          const _0x4c9169 = document.createElement('input');
          ((_0x4c9169.type = 'text'),
            (_0x4c9169.placeholder = sharedPromptPanelText('modelNamePlaceholder')),
            (_0x4c9169.className = 'custom-model-input'));
          const _0x508ccf = document.createElement('button');
          ((_0x508ccf.type = 'button'),
            (_0x508ccf.textContent = sharedPromptPanelText('confirm')),
            (_0x508ccf.className = 'custom-model-confirm'));
          const _0x3f93b5 = () => {
            const _0x256af2 = _0x4c9169.value.trim();
            if (!_0x256af2) return;
            const _0x18d414 = getCustomTextModels();
            (!_0x18d414.includes(_0x256af2) && (_0x18d414.push(_0x256af2), saveCustomTextModels(_0x18d414)),
              _0x1ed5ae());
          };
          (_0x4c9169.addEventListener('keydown', (_0x12ffb7) => {
            _0x12ffb7.stopPropagation();
            if (_0x12ffb7.key === 'Enter') _0x3f93b5();
          }),
            _0x4c9169.addEventListener('keyup', (_0x45261f) => _0x45261f.stopPropagation()),
            _0x4c9169.addEventListener('keypress', (_0x43c98c) => _0x43c98c.stopPropagation()),
            _0x4c9169.addEventListener('click', (_0x53c7b1) => _0x53c7b1.stopPropagation()),
            _0x508ccf.addEventListener('click', (_0x46f79b) => {
              (_0x46f79b.stopPropagation(), _0x3f93b5());
            }),
            _0x320539.appendChild(_0x4c9169),
            _0x320539.appendChild(_0x508ccf),
            _0x4c9169.focus());
        }),
        _0x27424c.appendChild(_0x320539));
    };
    if (_0x3b705e) _0x1ed5ae();
    const _0x28fdd6 = bindNodeModelMenuTrigger({
        root: _0x3def85,
        trigger: _0x7b5c77,
        menu: _0x50c93b,
        closeOthers: () => closeNodeFooterMenus(_0x3def85, _0x50c93b),
        activateMenuKeyboard: activateMenuKeyboard,
      }),
      _0x10d92e = bindNodeFooterController(_0x3def85);
    (_0x3ae255.push(_0x28fdd6, _0x10d92e), (_0x5d755f.modelWrap = _0x29eebf));
  }
  const _0x3f517d = document.createElement('div');
  _0x3f517d.className = 'prompt-actions';
  const _0x39155e = document.createElement('button');
  return (
    (_0x39155e.type = 'button'),
    (_0x39155e.className = 'prompt-submit debug-wrench-btn'),
    (_0x39155e.title = sharedPromptPanelText('debugApiParams')),
    (_0x39155e.innerHTML = DEBUG_WRENCH_ICON_HTML),
    _0x39155e.addEventListener('click', async (_0x330a10) => {
      (_0x330a10.stopPropagation(), flushPromptHtmlCommit(_0x5d755f));
      let _0x390bcc;
      if (typeof _0x5d755f._buildPayload === 'function') _0x390bcc = await _0x5d755f._buildPayload();
      else {
        const _0x39fe64 = _0x5d755f.promptEl?.innerText?.trim() || '';
        _0x390bcc = { prompt: _0x39fe64, nodeType: _0x5d755f._data.type };
      }
      if (!_0x390bcc) return;
      try {
        const _0x4e130a = await buildGenerateTextRequest(_0x390bcc),
          _0x2af40f = formatFinalApiDebugRequest(_0x4e130a),
          _0x19920c = appStore.getState(),
          _0x127026 = _0x5d755f._data.x + (_0x5d755f._data.width || 0x17c) + 50,
          _0x2369db = _0x5d755f._data.y;
        let _0x44385b = Object.values(_0x19920c.nodes).find((_0x4d7b41) => _0x4d7b41.type === 'debug');
        (!_0x44385b
          ? appStore.addNode({
              id: 'debug-' + Date.now(),
              type: 'debug',
              x: _0x127026,
              y: _0x2369db,
              width: 0x17c,
              height: 0x12c,
              name: sharedPromptPanelText('debugNodeName'),
              outputText: _0x2af40f,
            })
          : appStore.updateNodeData(_0x44385b.id, { outputText: _0x2af40f, x: _0x127026, y: _0x2369db }),
          window.showToast?.(sharedPromptPanelText('debugParamsShown'), 'warn'));
      } catch (_0x5ab476) {
        window.showToast?.(
          sharedPromptPanelText('buildRequestFailed', { error: _0x5ab476.message }),
          'error',
        );
      }
    }),
    (_0x5d755f.btnEl = document.createElement('button')),
    (_0x5d755f.btnEl.type = 'button'),
    (_0x5d755f.btnEl.className = 'prompt-submit img-gen-btn'),
    (_0x5d755f.btnEl.title = _0x2b31e5.btnTitle || sharedPromptPanelText('generate')),
    (_0x5d755f.btnEl.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'),
    _0x5d755f.btnEl.addEventListener('click', (_0x3f57c0) => {
      (_0x3f57c0.stopPropagation(), flushPromptHtmlCommit(_0x5d755f), _0x5d755f._onGenerate?.());
    }),
    _0x3f517d.appendChild(_0x39155e),
    _0x3f517d.appendChild(_0x5d755f.btnEl),
    _0x3def85.appendChild(_0x3f517d),
    _0x3540f7.appendChild(_0x3def85),
    (_0x5d755f._sharedPanelCleanup = () => {
      _0x3ae255.forEach((_0x2226a5) => _0x2226a5?.());
    }),
    _0x5d755f._updateSubmitButtonState?.(),
    _0x3540f7
  );
}
