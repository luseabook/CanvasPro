import appStore from '../core/stores/appStore.js';
import { getDisplayModelName } from '../modules/providers.js';
import { ensureThumbDecoded, revealRefThumbMedia } from '../modules/refThumbMediaReveal.js';
import { commit } from '../modules/history.js';
import { TEXT_TOOLBAR_HTML, bindTextToolbarEvents } from './NodeToolbarConfig.js';
import { getPromptPresets, openCustomPresetsManager } from '../modules/promptPresets.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import { buildGenerateTextRequest, generateText } from '../../api/aiTextApi.js';
import { getCustomTextModels, saveCustomTextModels } from './aigenText/customTextModels.js';
import { bindRefThumbHoverPreview } from '../modules/refThumbHoverPreview.js';
import { createReferenceFallbackThumbHtml } from '../modules/referenceThumbnailFallback.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { t } from '../i18n/index.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation, closeSlashMenu } from '../modules/slashMenu.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import { createPromptAttachmentButtonHTML } from './refAttachmentButton.js';
import {
  _checkAtTrigger,
  _populateMentionMenu,
  _handleMentionMenuKeyboard,
  _handlePillKeyboard,
  _rehydratePromptPills,
  _handlePillHover,
  _handlePillOut,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
} from '../modules/nodePromptShared.js';
import { createAIGenTextNodeUiModule } from './aigenText/uiModule.js';
import { createAIGenTextNodeStateSyncModule } from './aigenText/stateSyncModule.js';
import { createAIGenTextNodeTaskOrchestrationModule } from './aigenText/taskOrchestrationModule.js';
const api = { buildGenerateTextRequest: buildGenerateTextRequest, generateText: generateText },
  AI_GEN_TEXT_NODE_MODULE_DEPS = {
    store: appStore,
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
    handlePromptPaste: handlePromptPaste,
    handlePromptSelectAll: handlePromptSelectAll,
    getCustomTextModels: getCustomTextModels,
    saveCustomTextModels: saveCustomTextModels,
  };
export class AIGenTextNode {
  constructor(value) {
    ((this._data = value),
      (this.nodeId = value.id),
      (this.previewEl = null),
      (this.outputEl = null),
      (this.refBarEl = null),
      (this.promptEl = null),
      (this.btnEl = null),
      (this.modelWrap = null),
      (this._dragSrcIdx = null),
      (this._dragBounds = []),
      (this._lastEdgeSig = null),
      (this._outputScrollTop = Number.isFinite(value?.outputScrollTop)
        ? Math.max(0, value.outputScrollTop)
        : 0),
      (this._outputScrollTopDirty = false),
      (this._outputScrollTopCommitTimer = null),
      (this._lastRenderedOutputText = ''),
      (this._footerControllerCleanup = null));
  }
  ['_checkAtTrigger'](item) {
    return _checkAtTrigger(this, item);
  }
  ['_populateMentionMenu'](x, y, triggerRange, query = '', atIndex = -1, pillToEdit = null) {
    return _populateMentionMenu(this, {
      x: x,
      y: y,
      triggerRange: triggerRange,
      query: query,
      atIndex: atIndex,
      pillToEdit: pillToEdit,
    });
  }
  ['_handlePillKeyboard'](key) {
    return _handlePillKeyboard(this, key);
  }
  ['unmount']() {
    (this._commitOutputScrollTop?.(),
      this._flushPromptHtmlCommit?.(),
      this._unbindOutputTextSelection?.(),
      (this._unbindOutputTextSelection = null),
      this._unbindLocaleChange?.(),
      (this._unbindLocaleChange = null),
      this._footerControllerCleanup?.(),
      (this._footerControllerCleanup = null));
  }
}
const aiGenTextNodeUiModule = createAIGenTextNodeUiModule(AI_GEN_TEXT_NODE_MODULE_DEPS),
  aiGenTextNodeStateSyncModule = createAIGenTextNodeStateSyncModule(AI_GEN_TEXT_NODE_MODULE_DEPS),
  aiGenTextNodeTaskOrchestrationModule = createAIGenTextNodeTaskOrchestrationModule(
    AI_GEN_TEXT_NODE_MODULE_DEPS,
  );
function applyClassPrototypeMethods(index, enabled) {
  if (!enabled) return;
  const result = Object.getOwnPropertyDescriptors(enabled);
  (delete result.constructor, Object.defineProperties(index, result));
}
(applyClassPrototypeMethods(AIGenTextNode.prototype, aiGenTextNodeUiModule),
  applyClassPrototypeMethods(AIGenTextNode.prototype, aiGenTextNodeStateSyncModule),
  applyClassPrototypeMethods(AIGenTextNode.prototype, aiGenTextNodeTaskOrchestrationModule));
export function _renderSharedRefBar(enabled2) {
  if (!enabled2.refBarEl) return;
  const data = appStore.getState(),
    options = data.nodes || {},
    target = appStore.getIncomingEdges(enabled2.nodeId);
  let response = { text: 0, image: 0, video: 0, audio: 0 };
  const source = {},
    promptAttachmentButtonHTML = createPromptAttachmentButtonHTML();
  if (enabled2._isDraggingSorting) {
    _syncPillLabels(enabled2, source);
    return;
  }
  const run = (next) => {
      return localPathToUrl(next);
    },
    handler = (current) => {
      const enabled3 = String(current || '')
        .trim()
        .toLowerCase();
      if (!enabled3) return false;
      if (enabled3.startsWith('data:image/')) return true;
      return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i.test(enabled3);
    },
    handler2 = (entry) => {
      return (
        String(entry?.src || '').trim() ||
        run(entry?.localPath) ||
        String(entry?.imageUrl || '').trim() ||
        String(entry?.thumbUrl || '').trim()
      );
    },
    handler3 = (record) => {
      const payload = Number.isFinite(Number(record?.mainVideoIndex))
          ? Math.max(0, Math.trunc(Number(record.mainVideoIndex)))
          : 0,
        handle = Array.isArray(record?.videos) ? record.videos[payload] || record.videos[0] : null,
        list = [
          String(handle?.thumbUrl || '').trim(),
          String(record?.thumbUrl || '').trim(),
          String(record?.firstFrameUrl || '').trim(),
          String(record?.firstFrameThumbUrl || '').trim(),
          String(record?.imageUrl || '').trim(),
          String(record?.src || '').trim(),
          run(handle?.localPath),
          run(record?.localPath),
          String(handle?.videoUrl || '').trim(),
          String(record?.videoUrl || '').trim(),
        ].filter(Boolean);
      return list.find((item2) => handler(item2)) || '';
    },
    handler4 = (state) => {
      const list2 = [
        String(state?.thumbUrl || '').trim(),
        String(state?.imageUrl || '').trim(),
        String(state?.src || '').trim(),
        run(state?.localPath),
        String(state?.audioUrl || '').trim(),
      ].filter(Boolean);
      return list2.find((item3) => handler(item3)) || '';
    },
    list3 = [];
  for (const edgeId of target) {
    const response2 = options[edgeId.sourceId];
    if (!response2) continue;
    const config = response2.type || '';
    let scope = '';
    if (config === 'text' || config === 'source-text' || config === 'ai-text')
      (response.text++, (scope = 'text'));
    else {
      if (config === 'source-image' || config === 'ai-image') (response.image++, (scope = 'image'));
      else {
        if (config === 'source-video' || config === 'video' || config === 'ai-video')
          (response.video++, (scope = 'video'));
        else
          (config === 'source-audio' || config === 'audio' || config === 'ai-audio') &&
            (response.audio++, (scope = 'audio'));
      }
    }
    if (scope) {
      const input = {
          text: t('aigenText.refs.types.text'),
          image: t('aigenText.refs.types.image'),
          video: t('aigenText.refs.types.video'),
          audio: t('aigenText.refs.types.audio'),
        },
        output = '@' + (input[scope] || scope) + response[scope];
      source[edgeId.sourceId] = output;
    }
    let thumb = '';
    if (config === 'source-image') {
      const value2 = handler2(response2);
      if (value2) ensureThumbDecoded(value2);
      const value3 = !!String(response2.mask || '').trim();
      thumb = value2
        ? '<img src="' +
          value2 +
          '" class="ref-thumb-media is-pending" draggable="false">' +
          (value3 ? '<span class="ref-thumb-mask-badge">' + t('aigenText.refs.maskBadge') + '</span>' : '')
        : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>';
    } else {
      if (config === 'ai-image') {
        const value4 = handler2(response2),
          value5 = !!String(response2.mask || '').trim();
        if (value4) ensureThumbDecoded(value4);
        thumb = value4
          ? '<img src="' +
            value4 +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            (value5 ? '<span class="ref-thumb-mask-badge">' + t('aigenText.refs.maskBadge') + '</span>' : '')
          : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>';
      } else {
        if (config === 'source-text' || config === 'text') thumb = createReferenceFallbackThumbHtml('text');
        else {
          if (config === 'ai-text') {
            const enabled4 = String(
              response2.outputText || response2.text || response2.content || response2.prompt || '',
            ).trim();
            if (!enabled4) continue;
            thumb = createReferenceFallbackThumbHtml('text');
          } else {
            if (config === 'source-video' || config === 'video' || config === 'ai-video') {
              const value6 = handler3(response2);
              if (value6) ensureThumbDecoded(value6);
              thumb = value6
                ? '<img src="' + value6 + '" class="ref-thumb-media is-pending" draggable="false">'
                : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="var(--bg-node-dark)" /><polygon points="8,6 19,12 8,18" fill="var(--text-secondary)" /></svg></div>';
            } else {
              if (config === 'source-audio' || config === 'audio' || config === 'ai-audio') {
                const value7 = handler4(response2);
                if (value7) ensureThumbDecoded(value7);
                thumb = value7
                  ? '<img src="' + value7 + '" class="ref-thumb-media is-pending" draggable="false">'
                  : createReferenceFallbackThumbHtml('audio');
              }
            }
          }
        }
      }
    }
    if (!thumb) continue;
    const value8 = String(response2.mask || '').trim() ? 'm1' : 'm0',
      value9 = Number.isFinite(Number(response2.mainVideoIndex))
        ? Math.max(0, Math.trunc(Number(response2.mainVideoIndex)))
        : 0,
      value10 = Array.isArray(response2.videos) ? response2.videos[value9] || response2.videos[0] : null,
      sig =
        config +
        '|' +
        edgeId.id +
        '|' +
        edgeId.sourceId +
        '|' +
        (response2.src ||
          response2.imageUrl ||
          response2.thumbUrl ||
          response2.videoUrl ||
          response2.audioUrl ||
          '') +
        '|' +
        (response2.localPath || '') +
        '|' +
        (response2.thumbId || '') +
        '|' +
        (value10?.thumbUrl || '') +
        '|' +
        (value10?.localPath || '') +
        '|' +
        (value10?.videoUrl || '') +
        '|' +
        value8;
    list3.push({ edgeId: edgeId.id, sourceId: edgeId.sourceId, sig: sig, thumb: thumb });
  }
  if (list3.length === 0) {
    const value11 = !!enabled2.refBarEl.querySelector('.ref-thumb-wrap'),
      value12 = !!enabled2.refBarEl.querySelector('.ref-thumb-container');
    (enabled2._lastRefHTML !== promptAttachmentButtonHTML || value11 || value12) &&
      ((enabled2._lastRefHTML = promptAttachmentButtonHTML),
      enabled2.refBarEl.classList.remove('active'),
      (enabled2.refBarEl.innerHTML = promptAttachmentButtonHTML));
    _syncPillLabels(enabled2, source);
    return;
  }
  ((enabled2._lastRefHTML = '__has-items__'), enabled2.refBarEl.classList.add('active'));
  let enabled5 = enabled2.refBarEl.querySelector('.prompt-attachment-btn'),
    el = enabled2.refBarEl.querySelector('.ref-thumb-container');
  (!enabled5 || !el) &&
    ((enabled2.refBarEl.innerHTML = promptAttachmentButtonHTML + ' <div class="ref-thumb-container"></div>'),
    (enabled5 = enabled2.refBarEl.querySelector('.prompt-attachment-btn')),
    (el = enabled2.refBarEl.querySelector('.ref-thumb-container')));
  const map = new Map();
  el.querySelectorAll('.ref-thumb-wrap').forEach((el2) => map.set(el2.dataset.edgeId, el2));
  const map2 = new Set();
  for (const value13 of list3) {
    let el3 = map.get(value13.edgeId);
    (!el3 && ((el3 = document.createElement('div')), (el3.className = 'ref-thumb-wrap')),
      el3.dataset.sig !== value13.sig &&
        ((el3.innerHTML =
          value13.thumb +
          '<button type="button" class="ref-thumb-delete" title="' +
          t('aigenText.refs.remove') +
          '">×</button>'),
        (el3.dataset.sig = value13.sig),
        revealRefThumbMedia(el3, value13.sig)),
      (el3.dataset.edgeId = value13.edgeId),
      (el3.dataset.sourceId = value13.sourceId),
      el.appendChild(el3),
      map2.add(value13.edgeId));
  }
  for (const [value14, el4] of map.entries()) {
    if (!map2.has(value14)) el4.remove();
  }
  _syncPillLabels(enabled2, source);
}
