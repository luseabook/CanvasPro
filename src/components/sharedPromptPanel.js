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
function sharedPromptPanelText(value, item = {}) {
  return t('sharedPromptPanel.' + value, item);
}
function escapeSharedPromptPanelHtml(key) {
  return String(key ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
export function buildSharedPromptPanel(sourceNodeId, index = {}) {
  const el = document.createElement('div');
  ((el.className = 'text-prompt-panel'), (sourceNodeId._promptPanel = el));
  const getStateSnapshot = () =>
    typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
  (el.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  }),
    el.addEventListener('dblclick', (event2) => {
      !event2.target.closest('.prompt-textarea') && (event2.preventDefault(), event2.stopPropagation());
    }),
    (sourceNodeId.refBarEl = document.createElement('div')),
    (sourceNodeId.refBarEl.className = 'node-ref-bar'),
    el.appendChild(sourceNodeId.refBarEl),
    sourceNodeId.refBarEl.addEventListener('click', (event3) => {
      const el2 = event3.target.closest('.ref-thumb-delete');
      if (el2) {
        (event3.stopPropagation(), event3.preventDefault());
        const result = el2.closest('.ref-thumb-wrap')?.dataset.edgeId;
        if (result) appStore.removeEdge(result);
        return;
      }
      const enabled = event3.target.closest('.prompt-attachment-btn');
      if (!enabled) return;
      if (event3._pickConnectHandled) return;
      (event3.stopPropagation(), event3.preventDefault());
      const data = appStore.getState().pickConnectMode;
      data && data.active && data.sourceNodeId === sourceNodeId.nodeId
        ? appStore.setPickConnectMode({ active: false })
        : appStore.setPickConnectMode({
            active: true,
            sourceNodeId: sourceNodeId.nodeId,
            handleDirection: 'left',
          });
    }),
    sourceNodeId.refBarEl.addEventListener('pointerdown', (event4) => {
      if (event4.target.closest('.prompt-attachment-btn, .ref-thumb-delete')) event4.stopPropagation();
    }),
    sourceNodeId._unbindRefThumbHoverPreview?.(),
    (sourceNodeId._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(sourceNodeId.refBarEl)));
  const el3 = document.createElement('div');
  ((el3.className = 'prompt-input-wrapper'),
    el3.classList.add('is-resizable'),
    (sourceNodeId._promptInputWrap = el3),
    (sourceNodeId.promptEl = document.createElement('div')),
    (sourceNodeId.promptEl.className = 'prompt-textarea custom-textarea'),
    (sourceNodeId.promptEl.contentEditable = 'true'),
    (sourceNodeId.promptEl.spellcheck = false),
    (sourceNodeId.promptEl.dataset.placeholder =
      index.placeholder || sharedPromptPanelText('promptPlaceholder')),
    (sourceNodeId._flushPromptHtmlCommit = () => flushPromptHtmlCommit(sourceNodeId)),
    sourceNodeId.promptEl.addEventListener('input', (options) => {
      (schedulePromptHtmlCommit(sourceNodeId),
        _checkAtTrigger(sourceNodeId, options),
        checkSlashTrigger(options, {
          promptEl: sourceNodeId.promptEl,
          nodeType: sourceNodeId._data?.type,
          nodeId: sourceNodeId.nodeId,
          onGenerate: (target, source) => sourceNodeId._onGenerate?.(target, source),
        }),
        _syncEdgesOrderFromPills(sourceNodeId),
        sourceNodeId._updateSubmitButtonState?.());
    }),
    sourceNodeId.promptEl.addEventListener('blur', () => {
      flushPromptHtmlCommit(sourceNodeId);
    }),
    sourceNodeId.promptEl.addEventListener('mouseover', (next) => _handlePillHover(next, sourceNodeId)),
    sourceNodeId.promptEl.addEventListener('mouseout', (current) => _handlePillOut(current, sourceNodeId)),
    sourceNodeId.promptEl.addEventListener('keydown', (event5) => {
      if (handlePromptSelectAll(sourceNodeId, event5)) return;
      if (_handleMentionMenuKeyboard(event5)) return;
      if (handleSlashKeyboardNavigation(event5)) return;
      if (shouldSubmitPromptByKeyboard(event5)) {
        (event5.preventDefault(), flushPromptHtmlCommit(sourceNodeId), sourceNodeId.btnEl?.click());
        return;
      }
      _handlePillKeyboard(sourceNodeId, event5);
    }),
    sourceNodeId.promptEl.addEventListener('paste', (entry) => {
      handlePromptPaste(sourceNodeId, entry);
    }));
  sourceNodeId._data.prompt &&
    ((sourceNodeId.promptEl.innerHTML = sanitizePromptHtml(sourceNodeId._data.prompt)),
    _rehydratePromptPills(sourceNodeId));
  (el3.appendChild(sourceNodeId.promptEl),
    (sourceNodeId._syncPromptBoxSizeFromData = (record = sourceNodeId._data) =>
      syncPromptBoxSizeFromData(sourceNodeId, record)),
    sourceNodeId._syncPromptBoxSizeFromData(sourceNodeId._data),
    setupPromptBoxResize(sourceNodeId, { store: appStore, getStateSnapshot: getStateSnapshot }),
    el.appendChild(el3));
  const root = document.createElement('div');
  root.className = 'prompt-panel-footer text-prompt-actions';
  const list = [];
  if (index?.modelMenu) {
    const payload = index.modelMenu,
      handle = String(payload.provider || 'volcengine').trim(),
      providers = Array.isArray(payload.providers)
        ? payload.providers.map((item2) => String(item2).toLowerCase())
        : null,
      enabled2 = payload.allowCustomModels !== false,
      state = String(
        payload.model ||
          sourceNodeId._data?.model ||
          sourceNodeId._data?.storyboardScript?.model ||
          payload.defaultModel ||
          '',
      ).trim(),
      handler = () => {
        const textModelSmallIconHTML = buildTextModelSmallIconHTML(state);
        if (textModelSmallIconHTML) return textModelSmallIconHTML;
        if (handle === 'custom' || handle === 'openai')
          return '<div class="text-model-icon-small text-model-icon-badge">OA</div>';
        return '<div class="text-model-icon-small text-model-icon-badge">AI</div>';
      },
      el4 = document.createElement('div');
    ((el4.className = 'img-model-pills'),
      (el4.innerHTML =
        '\n      <div class="img-model-wrap">\n        <button type="button" class="img-pill-btn img-model-btn-trigger">\n          ' +
        handler() +
        '\n          <span class="img-model-label">' +
        getDisplayModelName(state) +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-menu-caret"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu node-model-menu">\n          ' +
        (enabled2
          ? '<div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu">\n            <div class="text-model-icon text-model-icon-badge">OA</div>\n            <div class="fmi-content">\n              <div class="fmi-title">' +
            escapeSharedPromptPanelHtml(sharedPromptPanelText('customModelTitle')) +
            '</div>\n              <div class="fmi-sub">' +
            escapeSharedPromptPanelHtml(sharedPromptPanelText('customModelSubtitle')) +
            '</div>\n            </div>\n            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n          </div>\n          <div class="custom-submenu node-model-submenu node-menu-submenu"></div>'
          : '') +
        '\n          ' +
        buildTextProviderMenuGroupsHTML(state, { providers: providers }) +
        '\n        </div>\n      </div>'),
      root.appendChild(el4));
    const config = el4.querySelector('.img-model-wrap'),
      trigger = el4.querySelector('.img-model-btn-trigger'),
      grsai = el4.querySelector('.img-model-menu'),
      el5 = el4.querySelector('.img-model-label'),
      scope = Object.freeze({
        grsai: grsai?.querySelector('.grsai-submenu'),
        ppio: grsai?.querySelector('.ppio-submenu'),
        apimart: grsai?.querySelector('.apimart-submenu'),
        agnes: grsai?.querySelector('.agnes-submenu'),
        runninghub: grsai?.querySelector('.runninghub-submenu'),
        volcengine: grsai?.querySelector('.volcengine-submenu'),
      }),
      handler2 = (el6) => {
        const el7 = el6?.querySelector('img, svg, div'),
          enabled3 = trigger?.firstElementChild;
        if (!enabled3 || !el7 || el7.classList?.contains('fmi-content')) return;
        const el8 = el7.cloneNode(true);
        (el8.removeAttribute?.('style'),
          el8.classList?.remove('text-model-icon', 'node-menu-icon'),
          el8.classList?.add('text-model-icon-small'),
          el8.tagName?.toLowerCase() === 'svg' &&
            (el8.setAttribute('width', '12'),
            el8.setAttribute('height', '12'),
            el8.classList.add('node-menu-icon-small')),
          enabled3.replaceWith(el8));
      },
      handler3 = (item3, input, el9) => {
        const modelId = String(item3?.dataset?.value || '').trim();
        if (!modelId) return;
        const provider = String(item3.dataset.provider || input || handle).trim(),
          el10 =
            item3.querySelector('.fmi-title') ||
            item3.querySelector('.floating-menu-label') ||
            item3.querySelector('.custom-model-label');
        if (el5) el5.textContent = el10?.textContent || modelId;
        (grsai?.querySelectorAll('.floating-menu-item').forEach((el11) => el11.classList.remove('active')),
          item3.classList.add('active'),
          grsai?.classList.remove('show'));
        if (el9) el9.style.display = 'none';
        (handler2(item3),
          typeof payload.onSelect === 'function'
            ? payload.onSelect({
                modelId: modelId,
                provider: provider,
                item: item3,
                self: sourceNodeId,
              })
            : appStore.updateNodeData(sourceNodeId.nodeId, { model: modelId, provider: provider }));
      };
    grsai?.addEventListener('click', (event6) => {
      const el12 = event6.target?.closest?.('.floating-menu-item');
      if (!el12 || !grsai.contains(el12)) return;
      if (!el12.dataset.value) return;
      const output = Object.entries(scope).find(([, value2]) => value2?.contains(el12));
      if (output) {
        (event6.stopPropagation(), handler3(el12, output[0], output[1]));
        return;
      }
      if (!enabled2) return;
      const value3 = grsai.querySelector('.custom-submenu');
      value3?.contains(el12) && (event6.stopPropagation(), handler3(el12, 'custom', value3));
    });
    const el13 = grsai?.querySelector('.custom-submenu');
    enabled2 &&
      el13?.addEventListener('pointerdown', (event7) => {
        event7.stopPropagation();
      });
    const run = () => {
      if (!enabled2 || !el13) return;
      const list2 = getCustomTextModels(),
        value4 = sourceNodeId._data?.model || '';
      (el13.replaceChildren(),
        list2.forEach((item4, value5) => {
          const el14 = document.createElement('div');
          ((el14.className = 'floating-menu-item custom-model-item' + (value4 === item4 ? ' active' : '')),
            (el14.dataset.value = item4));
          const el15 = document.createElement('div');
          ((el15.className = 'text-model-icon text-model-icon-badge custom-model-icon'),
            (el15.textContent = 'OA'));
          const el16 = document.createElement('span');
          ((el16.className = 'custom-model-label'), (el16.textContent = item4));
          const el17 = document.createElement('span');
          ((el17.className = 'custom-model-del'),
            (el17.textContent = '×'),
            el14.appendChild(el15),
            el14.appendChild(el16),
            el14.appendChild(el17),
            el14.addEventListener('mouseenter', () => {
              el17.classList.add('show');
            }),
            el14.addEventListener('mouseleave', () => {
              el17.classList.remove('show');
            }),
            el17.addEventListener('click', (event8) => {
              (event8.stopPropagation(),
                saveCustomTextModels(getCustomTextModels().filter((item5, value6) => value6 !== value5)),
                run());
            }),
            el13.appendChild(el14));
        }));
      if (list2.length > 0) {
        const value7 = document.createElement('div');
        ((value7.className = 'custom-model-separator'), el13.appendChild(value7));
      }
      const el18 = document.createElement('div');
      ((el18.className = 'floating-menu-item custom-model-add'),
        (el18.innerHTML =
          '\n        <svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n        <span class="custom-model-add-label">' +
          escapeSharedPromptPanelHtml(sharedPromptPanelText('addModel')) +
          '</span>'),
        el18.addEventListener('click', (event9) => {
          (event9.stopPropagation(), el18.replaceChildren(), el18.classList.add('editing'));
          const el19 = document.createElement('input');
          ((el19.type = 'text'),
            (el19.placeholder = sharedPromptPanelText('modelNamePlaceholder')),
            (el19.className = 'custom-model-input'));
          const el20 = document.createElement('button');
          ((el20.type = 'button'),
            (el20.textContent = sharedPromptPanelText('confirm')),
            (el20.className = 'custom-model-confirm'));
          const run2 = () => {
            const enabled4 = el19.value.trim();
            if (!enabled4) return;
            const list3 = getCustomTextModels();
            (!list3.includes(enabled4) && (list3.push(enabled4), saveCustomTextModels(list3)), run());
          };
          (el19.addEventListener('keydown', (event10) => {
            event10.stopPropagation();
            if (event10.key === 'Enter') run2();
          }),
            el19.addEventListener('keyup', (event11) => event11.stopPropagation()),
            el19.addEventListener('keypress', (event12) => event12.stopPropagation()),
            el19.addEventListener('click', (event13) => event13.stopPropagation()),
            el20.addEventListener('click', (event14) => {
              (event14.stopPropagation(), run2());
            }),
            el18.appendChild(el19),
            el18.appendChild(el20),
            el19.focus());
        }),
        el13.appendChild(el18));
    };
    if (enabled2) run();
    const bindNodeModelMenuTrigger2 = bindNodeModelMenuTrigger({
        root: root,
        trigger: trigger,
        menu: grsai,
        closeOthers: () => closeNodeFooterMenus(root, grsai),
        activateMenuKeyboard: activateMenuKeyboard,
      }),
      bindNodeFooterController2 = bindNodeFooterController(root);
    (list.push(bindNodeModelMenuTrigger2, bindNodeFooterController2), (sourceNodeId.modelWrap = config));
  }
  const el21 = document.createElement('div');
  el21.className = 'prompt-actions';
  const el22 = document.createElement('button');
  return (
    (el22.type = 'button'),
    (el22.className = 'prompt-submit debug-wrench-btn'),
    (el22.title = sharedPromptPanelText('debugApiParams')),
    (el22.innerHTML = DEBUG_WRENCH_ICON_HTML),
    el22.addEventListener('click', async (event15) => {
      (event15.stopPropagation(), flushPromptHtmlCommit(sourceNodeId));
      let enabled5;
      if (typeof sourceNodeId._buildPayload === 'function') enabled5 = await sourceNodeId._buildPayload();
      else {
        const prompt = sourceNodeId.promptEl?.innerText?.trim() || '';
        enabled5 = { prompt: prompt, nodeType: sourceNodeId._data.type };
      }
      if (!enabled5) return;
      try {
        const generateTextRequest = await buildGenerateTextRequest(enabled5),
          outputText = formatFinalApiDebugRequest(generateTextRequest),
          value8 = appStore.getState(),
          x = sourceNodeId._data.x + (sourceNodeId._data.width || 0x17c) + 50,
          y = sourceNodeId._data.y;
        let enabled6 = Object.values(value8.nodes).find((item6) => item6.type === 'debug');
        (!enabled6
          ? appStore.addNode({
              id: 'debug-' + Date.now(),
              type: 'debug',
              x: x,
              y: y,
              width: 0x17c,
              height: 0x12c,
              name: sharedPromptPanelText('debugNodeName'),
              outputText: outputText,
            })
          : appStore.updateNodeData(enabled6.id, { outputText: outputText, x: x, y: y }),
          window.showToast?.(sharedPromptPanelText('debugParamsShown'), 'warn'));
      } catch (error) {
        window.showToast?.(sharedPromptPanelText('buildRequestFailed', { error: error.message }), 'error');
      }
    }),
    (sourceNodeId.btnEl = document.createElement('button')),
    (sourceNodeId.btnEl.type = 'button'),
    (sourceNodeId.btnEl.className = 'prompt-submit img-gen-btn'),
    (sourceNodeId.btnEl.title = index.btnTitle || sharedPromptPanelText('generate')),
    (sourceNodeId.btnEl.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'),
    sourceNodeId.btnEl.addEventListener('click', (event16) => {
      (event16.stopPropagation(), flushPromptHtmlCommit(sourceNodeId), sourceNodeId._onGenerate?.());
    }),
    el21.appendChild(el22),
    el21.appendChild(sourceNodeId.btnEl),
    root.appendChild(el21),
    el.appendChild(root),
    (sourceNodeId._sharedPanelCleanup = () => {
      list.forEach((item7) => item7?.());
    }),
    sourceNodeId._updateSubmitButtonState?.(),
    el
  );
}
