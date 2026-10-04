import { sanitizePromptHtml } from '../../utils/dom.js';
import { createReferenceFallbackThumbHtml } from '../../modules/referenceThumbnailFallback.js';
import {
  getAssetInputRefsFromPromptAndNode,
  isRunningHubWorkflowNode,
} from '../../modules/nodePromptShared.js';
import { getFixedInputSlotConfigFromManifest } from '../../modules/fixedInputAssetRefs.js';
import { stopPreviewNodeLoading } from '../../modules/previewMode.js';
import { resolveCanvasImageDisplayUrl } from '../../services/canvasMediaLocalService.js';
import { shouldShowGenerationBusyUi } from '../../core/generationTaskUiState.js';
import {
  getTargetInputPolicy,
  isRhPersonReplaceWorkflowModel,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from '../../modules/modelInputPolicy.js';
import {
  collectRefThumbIds,
  resolveRefImageCandidateUrls,
  resolveRefImageRenderSources,
} from './referenceImageSources.js';
import {
  isDreaminaTerminalGenerationState,
  isFailureGenerationUiState,
  isTerminalGenerationUiState,
  resetGenerateButtonIdleUi,
} from './generationUiState.js';
import { bindRefThumbFixedSlotDrag } from '../../modules/refThumbDragController.js';
import { createPromptAttachmentButtonHTML } from '../refAttachmentButton.js';
import { syncAdaptiveImageInputRatio } from './adaptiveImageInputRatio.js';
import { t } from '../../i18n/index.js';
import {
  getImageInputGateUploadedUrl,
  getImageNodeInputGate,
  getImageNodeRootClass,
  shouldAlwaysShowImageRefBar,
} from './imageNodeManifestPolicies.js';
import { renderManifestFixedImageRefBar } from './fixedImageRefBar.js';
import {
  bindImageRefThumbOrderDrag,
  escapeRefBarHtml,
  formatRefUploadLabel,
  syncImageRefBarButtonIcon,
} from './refBarUiHelpers.js';
export { resolveRefImageCandidateUrls, resolveRefImageRenderSources } from './referenceImageSources.js';
export function createAIGenerateNodeStateSyncModule(value) {
  const {
    store: store,
    api: api,
    getDisplayModelName: getDisplayModelName,
    _handlePillHover: _handlePillHover,
    _handlePillOut: _handlePillOut,
    _syncEdgesOrderFromPills: _syncEdgesOrderFromPills,
    _syncPillLabels: _syncPillLabels,
    _checkAtTrigger: _checkAtTrigger,
    _populateMentionMenu: _populateMentionMenu,
    _insertMentionPill: _insertMentionPill,
    _handlePillKeyboard: _handlePillKeyboard,
    _rehydratePromptPills: _rehydratePromptPills,
    _handleMentionMenuKeyboard: _handleMentionMenuKeyboard,
    TEXT_TOOLBAR_HTML: TEXT_TOOLBAR_HTML,
    bindTextToolbarEvents: bindTextToolbarEvents,
    IMAGE_TOOLBAR_HTML: IMAGE_TOOLBAR_HTML,
    bindImageToolbarEvents: bindImageToolbarEvents,
    showDevToast: showDevToast,
    getImage: getImage,
    openNodeImagePreview: openNodeImagePreview,
    getPromptPresets: getPromptPresets,
    openCustomPresetsManager: openCustomPresetsManager,
    startLoading: startLoading,
    stopLoading: stopLoading,
    bindRefThumbHoverPreview: bindRefThumbHoverPreview,
    ensureThumbDecoded: ensureThumbDecoded,
    revealRefThumbMedia: revealRefThumbMedia,
    getRefKindByNodeType: getRefKindByNodeType,
    uploadFile: uploadFile,
    ensureConfig: ensureConfig,
    getProviderConfig: getProviderConfig,
    generateId: generateId,
    checkSlashTrigger: checkSlashTrigger,
    handleSlashKeyboardNavigation: handleSlashKeyboardNavigation,
    closeSlashMenu: closeSlashMenu,
    activateMenuKeyboard: activateMenuKeyboard,
    ImageFreeAngleController: ImageFreeAngleController,
  } = value;
  class item {
    ['_getStoreStateForRead']() {
      return typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState();
    }
    async ['_resolveRefThumbObjectUrl'](key) {
      const enabled = String(key || '').trim();
      if (!enabled) return '';
      if (this._refThumbObjectUrls.has(enabled)) return this._refThumbObjectUrls.get(enabled) || '';
      const enabled2 = await getImage(enabled);
      if (!enabled2) return '';
      const index = URL.createObjectURL(enabled2);
      return (this._refThumbObjectUrls.set(enabled, index), index);
    }
    ['_shouldRenderRefBarNow'](result, data) {
      const list = Array.isArray(result?.selectedNodeIds) ? result.selectedNodeIds : [];
      if (list.includes(this.nodeId)) return true;
      if (data?.active && data?.sourceNodeId === this.nodeId) return true;
      return shouldAlwaysShowImageRefBar(this._data?.model);
    }
    ['update'](options) {
      const target = this._normalizeDreaminaNodeData(options),
        source = this._data?.model,
        next = this._data?.rhAnimeRealRefUrl;
      ((options = target), (this._data = options));
      const current = source !== options?.model,
        entry = next !== options?.rhAnimeRealRefUrl,
        shouldShowGenerationBusyUi2 = shouldShowGenerationBusyUi(options),
        isTerminalGenerationUiState2 = isTerminalGenerationUiState(options),
        isFailureGenerationUiState2 = isFailureGenerationUiState(options);
      if (shouldShowGenerationBusyUi2)
        ((this._isGenerating = true),
          this.previewEl && typeof startLoading === 'function' && startLoading(this.previewEl));
      else {
        if (isTerminalGenerationUiState2) {
          this._isGenerating = false;
          isDreaminaTerminalGenerationState(options) &&
            ((this._dreaminaActiveSubmitId = ''), this._stopDreaminaRecovery?.(false));
          stopPreviewNodeLoading(this.nodeId);
          if (this.previewEl) stopLoading(this.previewEl);
          resetGenerateButtonIdleUi(this.btnEl);
        }
      }
      this._rendererMediaDeferred !== true &&
        (this._loadAndDisplayImage(), this._applyMaskPreview(options.maskPreviewUrl || options.maskPreview));
      const record = this._getStoreStateForRead(),
        payload = record.pickConnectMode || {};
      if (this._placeholderEl) {
        const el = this._placeholderEl.querySelector('.placeholder-icon-svg');
        el &&
          (payload.active && payload.sourceNodeId === this.nodeId
            ? el.classList.add('is-pick-connecting')
            : el.classList.remove('is-pick-connecting'));
      }
      const el2 = this._attachBtnIcon;
      if (el2) {
        const handle = payload.active && payload.sourceNodeId === this.nodeId;
        ((el2.style.transition = 'opacity 0.2s ease, transform 0.2s ease'),
          (el2.style.opacity = handle ? '0' : ''),
          (el2.style.transform = handle ? 'scale(0.4)' : ''),
          (el2.style.pointerEvents = handle ? 'none' : ''));
      }
      if (document.activeElement !== this.promptEl && options.prompt !== undefined) {
        const sanitizePromptHtml2 = sanitizePromptHtml(options.prompt || '');
        this.promptEl.innerHTML !== sanitizePromptHtml2 &&
          ((this.promptEl.innerHTML = sanitizePromptHtml2), _rehydratePromptPills(this));
      }
      (this._syncPromptPlaceholder?.(options),
        this._syncPromptBoxSizeFromData?.(options),
        this._generationNodeHelpTip?.sync());
      const el3 = this.modelWrap?.querySelector('.img-model-label');
      if (el3 && options.model) el3.textContent = getDisplayModelName(options.model);
      this._applyModelParamVisibility(options);
      const imageNodeRootClass = getImageNodeRootClass(options.model),
        isRhPersonReplaceWorkflowModel2 = isRhPersonReplaceWorkflowModel(options.model);
      this._root &&
        (this._root.classList.toggle('rh-anime-real-node', imageNodeRootClass === 'rh-anime-real-node'),
        imageNodeRootClass &&
          imageNodeRootClass !== 'rh-anime-real-node' &&
          this._root.classList.add(imageNodeRootClass),
        isRhPersonReplaceWorkflowModel2
          ? this._root.classList.add('rh-person-replace-v3-node')
          : this._root.classList.remove('rh-person-replace-v3-node'));
      const enabled3 = this._shouldRenderRefBarNow(record, payload),
        inEdges = store.getIncomingEdges(this.nodeId),
        nodes = record.nodes || {};
      syncAdaptiveImageInputRatio(this, {
        store: store,
        nodeId: this.nodeId,
        inEdges: inEdges,
        nodes: nodes,
        targetNodeData: nodes?.[this.nodeId] || options || {},
      });
      if (this._rendererMediaDeferred === true || !enabled3) this._renderRefBarPendingWhenVisible = true;
      else {
        const list2 = [...inEdges],
          state = list2
            .map((item2) => {
              const config = nodes[item2.sourceId] || null,
                scope =
                  config && (typeof config._bizRev === 'number' || typeof config._bizRev === 'string')
                    ? String(config._bizRev)
                    : '',
                input = config?.thumbId ? String(config.thumbId) : '',
                output = String(config?.mask || '').trim() ? 'm1' : 'm0',
                value2 = String(item2?.refSlot || ''),
                value3 = String(item2?.sourceMediaKey || '');
              return (
                item2.id +
                ':' +
                item2.sourceId +
                ':' +
                value2 +
                ':' +
                value3 +
                ':' +
                scope +
                ':' +
                input +
                ':' +
                output
              );
            })
            .join('|');
        (current || entry || this._renderRefBarPendingWhenVisible || state !== this._lastEdgeSig) &&
          ((this._renderRefBarPendingWhenVisible = false), (this._lastEdgeSig = state), this._renderRefBar());
      }
      (!isFailureGenerationUiState2 &&
        typeof this._maybeResumeRunningHubTaskImpl === 'function' &&
        this._maybeResumeRunningHubTaskImpl(),
        !isFailureGenerationUiState2 &&
          typeof this._maybeResumeDreaminaTaskImpl === 'function' &&
          this._maybeResumeDreaminaTaskImpl(),
        !isFailureGenerationUiState2 &&
          typeof this._maybeResumeAsyncTaskImpl === 'function' &&
          this._maybeResumeAsyncTaskImpl(),
        this._updateSubmitButtonState());
    }
    async ['_renderRefBar']() {
      if (!this.refBarEl) return;
      if (this._rendererMediaDeferred === true) return void (this._renderRefBarPendingWhenVisible = true);
      const value4 = this._getStoreStateForRead(),
        value5 = value4?.pickConnectMode || {};
      if (!this._shouldRenderRefBarNow(value4, value5)) {
        this._renderRefBarPendingWhenVisible = true;
        return;
      }
      if (this._renderRefBarLock) {
        this._renderRefBarPending = true;
        return;
      }
      ((this._renderRefBarLock = true), (this._renderRefBarPending = false));
      try {
        await this._renderRefBarImpl();
      } finally {
        ((this._renderRefBarLock = false),
          this._renderRefBarPending && ((this._renderRefBarPending = false), this._renderRefBar()));
      }
    }
    async ['_renderRefBarImpl']() {
      if (!this.refBarEl) return;
      const value6 = this._getStoreStateForRead(),
        value7 = Object.values(value6.edges || {}),
        nodes2 = value6.nodes || {},
        inEdges2 = store.getIncomingEdges(this.nodeId),
        map = new Set();
      for (const value8 of inEdges2) {
        const value9 = nodes2[value8.sourceId];
        for (const value10 of collectRefThumbIds(value9)) {
          map.add(value10);
        }
      }
      for (const [value11, value12] of this._refThumbObjectUrls.entries()) {
        !map.has(value11) &&
          (value12 && String(value12).startsWith('blob:') && URL.revokeObjectURL(value12),
          this._refThumbObjectUrls.delete(value11));
      }
      const imageNodeInputGate = getImageNodeInputGate(this._data?.model),
        value13 = String(imageNodeInputGate.kind || '').trim(),
        value14 = Number(imageNodeInputGate.max),
        isRhPersonReplaceWorkflowModel3 = isRhPersonReplaceWorkflowModel(this._data?.model),
        imageInputGateUploadedUrl = getImageInputGateUploadedUrl(this._data, imageNodeInputGate),
        targetNodeData = nodes2?.[this.nodeId] || this._data || {},
        targetInputPolicy = getTargetInputPolicy(targetNodeData),
        fixedInputConfig = getFixedInputSlotConfigFromManifest(targetNodeData);
      syncAdaptiveImageInputRatio(this, {
        store: store,
        nodeId: this.nodeId,
        inEdges: inEdges2,
        nodes: nodes2,
        targetNodeData: targetNodeData,
      });
      const attachBtnHTML = createPromptAttachmentButtonHTML({ stroke: 'var(--white-80)' }),
        handler = () => {
          let attachBtn = this.refBarEl.querySelector('.prompt-attachment-btn'),
            thumbContainer = this.refBarEl.querySelector('.ref-thumb-container');
          return (
            (!attachBtn || !thumbContainer) &&
              ((this.refBarEl.innerHTML = attachBtnHTML + ' <div class="ref-thumb-container"></div>'),
              (attachBtn = this.refBarEl.querySelector('.prompt-attachment-btn')),
              (thumbContainer = this.refBarEl.querySelector('.ref-thumb-container')),
              (this._attachBtnIcon = attachBtn ? attachBtn.querySelector('.btn-icon') : null)),
            { attachBtn: attachBtn, thumbContainer: thumbContainer }
          );
        };
      let items = [];
      const value15 = { text: 0, image: 0, video: 0, audio: 0 },
        sourceIdToLabel = {};
      for (const edgeId of inEdges2) {
        const enabled4 = nodes2[edgeId.sourceId];
        if (!enabled4) continue;
        const type = resolveEffectiveInputKind(enabled4, edgeId);
        if (!type) continue;
        if (!isInputKindAllowed(targetInputPolicy, type)) continue;
        if (value13 && type !== value13) continue;
        if (value13 && Number.isFinite(value14) && value15[value13] >= value14) continue;
        if (isRhPersonReplaceWorkflowModel3 && type !== 'image') continue;
        if (isRhPersonReplaceWorkflowModel3 && value15.image >= 2) continue;
        value15[type]++;
        const value16 = {
            text: t('aigenImage.refs.types.text'),
            image: t('aigenImage.refs.types.image'),
            video: t('aigenImage.refs.types.video'),
            audio: t('aigenImage.refs.types.audio'),
          },
          label = '@' + value16[type] + value15[type];
        sourceIdToLabel[edgeId.sourceId] = label;
        let thumbHTML = '',
          thumbSrc = '',
          previewSrc = '';
        if (type === 'image') {
          let thumbBlobUrl = '';
          for (const value17 of collectRefThumbIds(enabled4)) {
            thumbBlobUrl = await this._resolveRefThumbObjectUrl(value17);
            if (thumbBlobUrl) break;
          }
          ({ thumbSrc: thumbSrc, previewSrc: previewSrc } = resolveRefImageRenderSources(enabled4, {
            thumbBlobUrl: thumbBlobUrl,
          }));
        }
        let canvasImageDisplayUrl = resolveCanvasImageDisplayUrl(enabled4);
        if (!canvasImageDisplayUrl && enabled4.thumbId) {
          if (this._refThumbObjectUrls.has(enabled4.thumbId))
            canvasImageDisplayUrl = this._refThumbObjectUrls.get(enabled4.thumbId);
          else {
            const value18 = await getImage(enabled4.thumbId);
            if (value18) {
              const value19 = URL.createObjectURL(value18);
              (this._refThumbObjectUrls.set(enabled4.thumbId, value19), (canvasImageDisplayUrl = value19));
            }
          }
        }
        if (!canvasImageDisplayUrl) {
          const refImageCandidateUrls = resolveRefImageCandidateUrls(enabled4);
          canvasImageDisplayUrl = refImageCandidateUrls[0] || '';
        }
        type === 'image' && (canvasImageDisplayUrl = thumbSrc || canvasImageDisplayUrl);
        if (type === 'image' && canvasImageDisplayUrl) {
          ensureThumbDecoded(canvasImageDisplayUrl);
          previewSrc && previewSrc !== canvasImageDisplayUrl && ensureThumbDecoded(previewSrc);
          const value20 = !!String(enabled4.mask || '').trim();
          thumbHTML =
            '<img src="' +
            canvasImageDisplayUrl +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            (value20
              ? '<span class="ref-thumb-mask-badge">' + t('aigenImage.refs.maskBadge') + '</span>'
              : '');
        } else {
          if (type === 'text') {
            const value21 = enabled4.type === 'ai-text';
            if (value21 && !enabled4.outputText) continue;
            thumbHTML = createReferenceFallbackThumbHtml('text');
          } else {
            if (type === 'video')
              thumbHTML =
                '<div class="ref-thumb-media" style="background:var(--bg);display:flex;align-items:center;justify-content:center;">\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>\n                </div>';
            else type === 'audio' && (thumbHTML = createReferenceFallbackThumbHtml('audio'));
          }
        }
        if (thumbHTML) {
          const value22 = String(enabled4.mask || '').trim() ? 'm1' : 'm0',
            sig =
              type +
              '|' +
              edgeId.id +
              '|' +
              edgeId.sourceId +
              '|' +
              (canvasImageDisplayUrl || '') +
              '|' +
              value22;
          items.push({
            key: 'edge:' + edgeId.id,
            edgeId: edgeId.id,
            sourceId: edgeId.sourceId,
            refSlot: edgeId.refSlot || '',
            type: type,
            label: label,
            sig: sig,
            thumbHTML: thumbHTML,
            thumbSrc: thumbSrc || canvasImageDisplayUrl || '',
            previewSrc: previewSrc || canvasImageDisplayUrl || '',
          });
        }
      }
      (isRunningHubWorkflowNode(targetNodeData) || fixedInputConfig) &&
        getAssetInputRefsFromPromptAndNode(this.promptEl, {
          nodeData: targetNodeData,
          allowedTypes: ['image'],
        }).forEach((label2, value23) => {
          const effectiveInputKind = resolveEffectiveInputKind(label2);
          if (effectiveInputKind !== 'image' || !isInputKindAllowed(targetInputPolicy, effectiveInputKind))
            return;
          const thumbSrc2 = String(label2.thumbUrl || label2.url || '').trim();
          if (!thumbSrc2) return;
          ensureThumbDecoded(thumbSrc2);
          const assetId = String(label2.assetId || ''),
            assetIndex = String(label2.itemIndex ?? ''),
            assetOccurrence = String(label2.assetMentionOccurrence ?? ''),
            assetRefSource = String(label2.assetRefSource || 'prompt'),
            sourceId = 'asset:' + assetId + ':' + assetIndex,
            key2 = 'asset:' + assetRefSource + ':' + assetId + ':' + assetIndex + ':image:' + value23;
          items.push({
            key: key2,
            edgeId: '',
            sourceId: sourceId,
            refSlot: '',
            type: 'image',
            label: label2.label || label2.name || t('aigenImage.refs.referenceImage'),
            sig: key2 + '|' + String(label2.url || '') + '|' + thumbSrc2,
            thumbHTML: '<img src="' + thumbSrc2 + '" class="ref-thumb-media is-pending" draggable="false">',
            thumbSrc: thumbSrc2,
            previewSrc: String(label2.url || thumbSrc2),
            virtual: true,
            assetId: assetId,
            assetIndex: assetIndex,
            assetOccurrence: assetOccurrence,
            assetRefSource: assetRefSource,
            refType: 'image',
          });
        });
      if (isRhPersonReplaceWorkflowModel3) {
        const key3 = ['replaceTarget', 'replacedImage'],
          handler2 = () => {
            const enabled5 = !!this.refBarEl.querySelector('[data-ref-slot="replaceTarget"]'),
              enabled6 = !!this.refBarEl.querySelector('[data-ref-slot="replacedImage"]');
            let el4 = this.refBarEl.querySelector('.prompt-attachment-btn'),
              container = this.refBarEl.querySelector('.ref-thumb-container');
            if (!el4 || !container || !enabled5 || !enabled6) {
              const t2 = t('aigenImage.refs.replaceTarget'),
                t3 = t('aigenImage.refs.replacedImage');
              ((this.refBarEl.innerHTML =
                attachBtnHTML +
                ' <div class="ref-thumb-container"><div class="ref-thumb-wrap ref-upload-slot" data-ref-slot="replaceTarget" data-slot="replaceTarget" data-kind="image" draggable="false" title="' +
                escapeRefBarHtml(t2) +
                '"><span class="ref-upload-label">' +
                formatRefUploadLabel(t2) +
                '</span></div><div class="ref-thumb-wrap ref-upload-slot" data-ref-slot="replacedImage" data-slot="replacedImage" data-kind="image" draggable="false" title="' +
                escapeRefBarHtml(t3) +
                '"><span class="ref-upload-label">' +
                formatRefUploadLabel(t3) +
                '</span></div></div>'),
                (el4 = this.refBarEl.querySelector('.prompt-attachment-btn')),
                (container = this.refBarEl.querySelector('.ref-thumb-container')),
                (this._attachBtnIcon = el4 ? el4.querySelector('.btn-icon') : null));
            }
            const targetEl = this.refBarEl.querySelector('[data-ref-slot="replaceTarget"]'),
              sourceEl = this.refBarEl.querySelector('[data-ref-slot="replacedImage"]');
            return { targetEl: targetEl, sourceEl: sourceEl, container: container };
          },
          { targetEl: targetEl2, sourceEl: sourceEl2, container: container2 } = handler2();
        ((this._lastRefHTML = '__rh-person-replace-v3__'), this.refBarEl.classList.add('active'));
        const run = (event) => String(event?.key || event?.edgeId || ''),
          map2 = new Set(),
          map3 = new Map(),
          value24 = [
            {
              key: key3[0],
              el: targetEl2,
              title: t('aigenImage.refs.replaceTarget'),
              emptyHtml: formatRefUploadLabel(t('aigenImage.refs.replaceTarget')),
            },
            {
              key: key3[1],
              el: sourceEl2,
              title: t('aigenImage.refs.replacedImage'),
              emptyHtml: formatRefUploadLabel(t('aigenImage.refs.replacedImage')),
            },
          ];
        for (const value25 of items) {
          const enabled7 = run(value25);
          if (!enabled7 || map2.has(enabled7)) continue;
          const value26 = String(value25.refSlot || '');
          if (!key3.includes(value26)) continue;
          if (map3.has(value26)) continue;
          (map3.set(value26, value25), map2.add(enabled7));
        }
        for (const value27 of items) {
          const enabled8 = run(value27);
          if (!enabled8 || map2.has(enabled8)) continue;
          for (const value28 of key3) {
            if (!map3.has(value28)) {
              (map3.set(value28, value27), map2.add(enabled8));
              break;
            }
          }
        }
        const run2 = (value29, value30, value31) => {
            const el5 = document.createElement('div');
            return (
              (el5.className = 'ref-thumb-wrap ref-upload-slot'),
              (el5.dataset.refSlot = value29),
              (el5.dataset.slot = value29),
              (el5.dataset.kind = 'image'),
              (el5.title = value30),
              el5.setAttribute('draggable', 'false'),
              (el5.innerHTML = '<span class="ref-upload-label">' + value31 + '</span>'),
              el5
            );
          },
          handler3 = (value32, value33, value34) => {
            const el6 = document.createElement('div');
            return (
              (el6.className = 'ref-thumb-wrap' + (value34.virtual ? ' ref-thumb-wrap--asset' : '')),
              (el6.dataset.refSlot = value32),
              (el6.dataset.slot = value32),
              (el6.dataset.kind = 'image'),
              (el6.title = value33),
              el6.setAttribute('draggable', value34.virtual ? 'false' : 'true'),
              el6
            );
          };
        for (const event2 of value24) {
          const enabled9 = map3.get(event2.key) || null;
          let el7 = event2.el;
          if (!el7) continue;
          if (enabled9 && el7.classList?.contains?.('ref-upload-slot')) {
            const value35 = handler3(event2.key, event2.title, enabled9);
            (el7.replaceWith(value35), (el7 = value35), (event2.el = value35));
          } else {
            if (!enabled9 && !el7.classList?.contains?.('ref-upload-slot')) {
              const value36 = run2(event2.key, event2.title, event2.emptyHtml);
              (el7.replaceWith(value36), (el7 = value36), (event2.el = value36));
            }
          }
          ((el7.dataset.refSlot = event2.key),
            (el7.dataset.slot = event2.key),
            (el7.dataset.kind = 'image'),
            (el7.title = event2.title));
          if (enabled9) {
            ((el7.className = 'ref-thumb-wrap' + (enabled9.virtual ? ' ref-thumb-wrap--asset' : '')),
              el7.classList?.remove?.('ref-upload-slot'),
              el7.setAttribute('draggable', enabled9.virtual ? 'false' : 'true'),
              (el7.dataset.refKey = run(enabled9)),
              (el7.dataset.edgeId = enabled9.edgeId || ''),
              (el7.dataset.sourceId = enabled9.sourceId || ''),
              (el7.dataset.refOrigin = enabled9.virtual ? 'asset' : 'node'));
            enabled9.virtual
              ? ((el7.dataset.assetId = enabled9.assetId || ''),
                (el7.dataset.assetIndex = enabled9.assetIndex || ''),
                (el7.dataset.assetOccurrence = enabled9.assetOccurrence || ''),
                (el7.dataset.assetRefSource = enabled9.assetRefSource || 'prompt'),
                (el7.dataset.refType = enabled9.refType || enabled9.type || ''))
              : (delete el7.dataset.assetId,
                delete el7.dataset.assetIndex,
                delete el7.dataset.assetOccurrence,
                delete el7.dataset.assetRefSource,
                delete el7.dataset.refType);
            el7.dataset.sig !== enabled9.sig &&
              ((el7.innerHTML =
                enabled9.thumbHTML +
                '<button type="button" class="ref-thumb-delete" title="' +
                t('aigenImage.refs.removeReference') +
                '">&times;</button>'),
              (el7.dataset.sig = enabled9.sig),
              revealRefThumbMedia(el7, enabled9.sig));
            if (enabled9.thumbSrc) el7.dataset.thumbSrc = enabled9.thumbSrc;
            else delete el7.dataset.thumbSrc;
            if (enabled9.previewSrc) el7.dataset.previewSrc = enabled9.previewSrc;
            else delete el7.dataset.previewSrc;
          } else {
            ((el7.className = 'ref-thumb-wrap ref-upload-slot'), el7.setAttribute('draggable', 'false'));
            if (el7.dataset.refKey) delete el7.dataset.refKey;
            if (el7.dataset.edgeId) delete el7.dataset.edgeId;
            if (el7.dataset.sourceId) delete el7.dataset.sourceId;
            if (el7.dataset.refOrigin) delete el7.dataset.refOrigin;
            if (el7.dataset.assetId) delete el7.dataset.assetId;
            if (el7.dataset.assetIndex) delete el7.dataset.assetIndex;
            if (el7.dataset.assetOccurrence) delete el7.dataset.assetOccurrence;
            if (el7.dataset.assetRefSource) delete el7.dataset.assetRefSource;
            if (el7.dataset.refType) delete el7.dataset.refType;
            if (el7.dataset.sig) delete el7.dataset.sig;
            if (el7.dataset.thumbSrc) delete el7.dataset.thumbSrc;
            if (el7.dataset.previewSrc) delete el7.dataset.previewSrc;
            const value37 = '<span class="ref-upload-label">' + event2.emptyHtml + '</span>';
            if (el7.innerHTML !== value37) el7.innerHTML = value37;
          }
        }
        (bindRefThumbFixedSlotDrag({
          owner: this,
          container: container2,
          store: store,
          nodeId: this.nodeId,
          acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
        }),
          this._syncBtnIconState(),
          _syncPillLabels(this, {}));
        return;
      }
      if (
        fixedInputConfig &&
        renderManifestFixedImageRefBar({
          owner: this,
          refBarEl: this.refBarEl,
          promptEl: this.promptEl,
          attachBtnHTML: attachBtnHTML,
          fixedInputConfig: fixedInputConfig,
          items: items,
          targetNodeData: targetNodeData,
          sourceIdToLabel: sourceIdToLabel,
          store: store,
          nodeId: this.nodeId,
          ensureThumbDecoded: ensureThumbDecoded,
          revealRefThumbMedia: revealRefThumbMedia,
          syncPillLabels: _syncPillLabels,
        })
      )
        return;
      if (this._isDraggingSorting) {
        (this._syncBtnIconState(), _syncPillLabels(this, sourceIdToLabel));
        return;
      }
      if (items.length > 0) {
        (this.refBarEl.classList.add('active'), this.refBarEl.classList.remove('rh-v5-refbar'));
        const value38 = this._lastRefHTML;
        this._lastRefHTML = '__has-items__';
        const { thumbContainer: thumbContainer2 } = handler();
        String(value38 || '').startsWith('__rh-') &&
          thumbContainer2.querySelectorAll('.ref-thumb-wrap').forEach((el8) => el8.remove());
        (thumbContainer2.querySelectorAll('.ref-upload-slot').forEach((el9) => el9.remove()),
          thumbContainer2.querySelectorAll('.ref-thumb-wrap').forEach((el10) => {
            const enabled10 =
              String(el10?.dataset?.refKey || '').trim() ||
              (String(el10?.dataset?.edgeId || '').trim()
                ? 'edge:' + String(el10.dataset.edgeId).trim()
                : '');
            if (!enabled10) el10.remove();
          }));
        const map4 = new Map();
        thumbContainer2.querySelectorAll('.ref-thumb-wrap').forEach((el11) => {
          const value39 = String(el11?.dataset?.edgeId || '').trim(),
            enabled11 = String(el11?.dataset?.refKey || '').trim() || (value39 ? 'edge:' + value39 : '');
          if (!enabled11) return;
          map4.set(enabled11, el11);
        });
        const map5 = new Set();
        for (let value40 = 0; value40 < items.length; value40++) {
          const event3 = items[value40],
            enabled12 = String(event3.key || event3.edgeId || '');
          if (!enabled12) continue;
          let el12 = map4.get(enabled12);
          !el12 &&
            ((el12 = document.createElement('div')),
            (el12.className = 'ref-thumb-wrap' + (event3.virtual ? ' ref-thumb-wrap--asset' : '')));
          el12.setAttribute('draggable', event3.virtual ? 'false' : 'true');
          el12.dataset.sig !== event3.sig &&
            ((el12.innerHTML =
              event3.thumbHTML +
              '<button type="button" class="ref-thumb-delete" title="' +
              t('aigenImage.refs.removeReference') +
              '">&times;</button>'),
            (el12.dataset.sig = event3.sig),
            revealRefThumbMedia(el12, event3.sig));
          ((el12.dataset.refKey = enabled12),
            (el12.dataset.edgeId = event3.edgeId || ''),
            (el12.dataset.sourceId = event3.sourceId),
            (el12.dataset.refOrigin = event3.virtual ? 'asset' : 'node'));
          event3.virtual
            ? ((el12.dataset.assetId = event3.assetId || ''),
              (el12.dataset.assetIndex = event3.assetIndex || ''),
              (el12.dataset.assetOccurrence = event3.assetOccurrence || ''),
              (el12.dataset.assetRefSource = event3.assetRefSource || 'prompt'),
              (el12.dataset.refType = event3.refType || event3.type || ''))
            : (delete el12.dataset.assetId,
              delete el12.dataset.assetIndex,
              delete el12.dataset.assetOccurrence,
              delete el12.dataset.assetRefSource,
              delete el12.dataset.refType);
          ((el12.dataset.type = event3.type),
            (el12.dataset.label = event3.label),
            (el12.dataset.index = String(value40)));
          if (event3.thumbSrc) el12.dataset.thumbSrc = event3.thumbSrc;
          else delete el12.dataset.thumbSrc;
          if (event3.previewSrc) el12.dataset.previewSrc = event3.previewSrc;
          else delete el12.dataset.previewSrc;
          (thumbContainer2.appendChild(el12), map5.add(enabled12));
        }
        for (const [value41, el13] of map4.entries()) {
          if (!map5.has(value41)) el13.remove();
        }
        this._bindDragSort(this.refBarEl);
      } else {
        if (value13 === 'image') {
          this.refBarEl.classList.remove('rh-v5-refbar');
          const t4 = t('aigenImage.refs.uploadReference'),
            value42 =
              attachBtnHTML +
              ' <div class="ref-thumb-container">' +
              (imageInputGateUploadedUrl
                ? '<div class="ref-thumb-wrap ref-upload-slot" data-ref-src="upload"><img src="' +
                  imageInputGateUploadedUrl +
                  '" class="ref-thumb-media" draggable="false"><button type="button" class="ref-upload-delete" title="' +
                  t('aigenImage.refs.removeReference') +
                  '">&times;</button></div>'
                : '<button type="button" class="ref-thumb-wrap ref-upload-slot" title="' +
                  escapeRefBarHtml(t4) +
                  '"><span class="ref-upload-label">' +
                  formatRefUploadLabel(t4) +
                  '</span></button>') +
              '</div>';
          if (this._lastRefHTML !== value42) {
            ((this._lastRefHTML = value42),
              this.refBarEl.classList.add('active'),
              (this.refBarEl.innerHTML = value42));
            const el14 = this.refBarEl.querySelector('.prompt-attachment-btn');
            this._attachBtnIcon = el14 ? el14.querySelector('.btn-icon') : null;
          }
        } else {
          (this.refBarEl.classList.remove('active'),
            this.refBarEl.classList.remove('rh-v5-refbar'),
            (this._lastRefHTML = '__empty__'));
          const { thumbContainer: thumbContainer3 } = handler();
          thumbContainer3.querySelectorAll('.ref-thumb-wrap').forEach((el15) => el15.remove());
        }
      }
      (this._syncBtnIconState(), _syncPillLabels(this, sourceIdToLabel));
    }
    ['_syncBtnIconState']() {
      syncImageRefBarButtonIcon({
        refBarEl: this.refBarEl,
        pickMode: store.getState().pickConnectMode,
        nodeId: this.nodeId,
      });
    }
    ['_bindDragSort'](refBar) {
      bindImageRefThumbOrderDrag({ owner: this, refBar: refBar, store: store, nodeId: this.nodeId });
    }
  }
  return item.prototype;
}
