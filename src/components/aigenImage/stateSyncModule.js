import { sanitizePromptHtml } from '../../utils/dom.js';
import {
  clearVirtualizedPromptCommit,
  isVirtualizedPromptEditorCurrent,
} from '../../modules/promptPasteVirtualization.js';
import {
  createReferenceInputThumbnailHtml,
  resolveReferenceVideoThumbnail,
} from '../../modules/referenceInputThumbnail.js';
import { createReferenceMaskBadgeHtml } from '../../modules/refThumbMaskBadge.js';
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
  resolveVersionedRefImageRenderSources,
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
import { syncImageModelTriggerIcon } from './uiModuleModelHelpers.js';
import { scheduleCurrentRefThumbObjectUrl, syncRefThumbObjectUrlScope } from './refThumbObjectUrlScope.js';
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
      return typeof store['getStateRaw'] === 'function'
        ? store['getStateRaw']()
        : store['getState']();
    }
    ['_syncRefThumbObjectUrlScope'](key, index) {
      return syncRefThumbObjectUrlScope(this, key, index, collectRefThumbIds);
    }
    ['_scheduleRefThumbObjectUrl'](result) {
      return scheduleCurrentRefThumbObjectUrl(this, result, {
        store: store,
        getImage: getImage,
        collectRefThumbIds: collectRefThumbIds,
      });
    }
    ['_shouldRenderRefBarNow'](state, data) {
      const list = Array['isArray'](state?.['selectedNodeIds']) ? state['selectedNodeIds'] : [];
      if (list['includes'](this['nodeId'])) return !![];
      if (data?.['active'] && data?.['sourceNodeId'] === this['nodeId']) return !![];
      return shouldAlwaysShowImageRefBar(this['_data']?.['model']);
    }
    ['update'](options) {
      const target = Number(options?.['_bizRev']),
        source = Number(this['_data']?.['_bizRev']);
      if (Number['isFinite'](target) && Number['isFinite'](source) && target < source) return;
      const next = this['_normalizeDreaminaNodeData'](options),
        current = this['_data']?.['model'],
        entry = this['_data']?.['rhAnimeRealRefUrl'];
      ((options = next), (this['_data'] = options));
      const record = current !== options?.['model'],
        payload = entry !== options?.['rhAnimeRealRefUrl'],
        shouldShowGenerationBusyUi2 = shouldShowGenerationBusyUi(options),
        isTerminalGenerationUiState2 = isTerminalGenerationUiState(options),
        isFailureGenerationUiState2 = isFailureGenerationUiState(options);
      if (shouldShowGenerationBusyUi2)
        ((this['_isGenerating'] = !![]),
          this['previewEl'] && typeof startLoading === 'function' && startLoading(this['previewEl']));
      else {
        if (isTerminalGenerationUiState2) {
          this['_isGenerating'] = ![];
          isDreaminaTerminalGenerationState(options) && (this['_dreaminaActiveSubmitId'] = '');
          stopPreviewNodeLoading(this['nodeId']);
          if (this['previewEl']) stopLoading(this['previewEl']);
          resetGenerateButtonIdleUi(this['btnEl']);
        }
      }
      this['_rendererMediaDeferred'] !== !![] &&
        (this['_loadAndDisplayImage'](),
        this['_applyMaskPreview'](options['maskPreviewUrl'] || options['maskPreview']));
      const state2 = this['_getStoreStateForRead'](),
        handle = state2['pickConnectMode'] || {};
      if (this['_placeholderEl']) {
        const el = this['_placeholderEl']['querySelector']('.placeholder-icon-svg');
        el &&
          (handle['active'] && handle['sourceNodeId'] === this['nodeId']
            ? el['classList']['add']('is-pick-connecting')
            : el['classList']['remove']('is-pick-connecting'));
      }
      const el2 = this['_attachBtnIcon'];
      if (el2) {
        const config = handle['active'] && handle['sourceNodeId'] === this['nodeId'];
        ((el2['style']['transition'] = 'opacity 0.2s ease, transform 0.2s ease'),
          (el2['style']['opacity'] = config ? '0' : ''),
          (el2['style']['transform'] = config ? 'scale(0.4)' : ''),
          (el2['style']['pointerEvents'] = config ? 'none' : ''));
      }
      if (document['activeElement'] !== this['promptEl'] && options['prompt'] !== undefined) {
        if (!isVirtualizedPromptEditorCurrent(this, options['prompt'])) {
          const sanitizePromptHtml2 = sanitizePromptHtml(options['prompt'] || '');
          this['promptEl']['innerHTML'] !== sanitizePromptHtml2 &&
            (clearVirtualizedPromptCommit(this),
            (this['promptEl']['innerHTML'] = sanitizePromptHtml2),
            _rehydratePromptPills(this));
        }
      }
      (this['_syncPromptPlaceholder']?.(options),
        this['_syncPromptInputVisibility']?.(options),
        this['_syncPromptBoxSizeFromData']?.(options),
        this['_generationNodeHelpTip']?.['sync'](),
        this['_modelProviderProfileControl']?.['sync']());
      const el3 = this['modelWrap']?.['querySelector']('.img-model-label');
      if (el3 && options['model']) el3['textContent'] = getDisplayModelName(options['model']);
      (syncImageModelTriggerIcon(this['modelWrap']?.['querySelector']('.img-model-btn-trigger'), options),
        this['_applyModelParamVisibility'](options));
      const imageNodeRootClass = getImageNodeRootClass(options['model']),
        isRhPersonReplaceWorkflowModel2 = isRhPersonReplaceWorkflowModel(options['model']);
      this['_root'] &&
        (this['_root']['classList']['toggle']('rh-anime-real-node', imageNodeRootClass === 'rh-anime-real-node'),
        imageNodeRootClass && imageNodeRootClass !== 'rh-anime-real-node' && this['_root']['classList']['add'](imageNodeRootClass),
        isRhPersonReplaceWorkflowModel2
          ? this['_root']['classList']['add']('rh-person-replace-v3-node')
          : this['_root']['classList']['remove']('rh-person-replace-v3-node'));
      const enabled = this['_shouldRenderRefBarNow'](state2, handle),
        inEdges = store['getIncomingEdges'](this['nodeId']),
        nodes = state2['nodes'] || {};
      (this['_syncRefThumbObjectUrlScope'](inEdges, nodes),
        syncAdaptiveImageInputRatio(this, {
          store: store,
          nodeId: this['nodeId'],
          inEdges: inEdges,
          nodes: nodes,
          targetNodeData: nodes?.[this['nodeId']] || options || {},
        }));
      if (this['_rendererMediaDeferred'] === !![] || !enabled)
        this['_renderRefBarPendingWhenVisible'] = !![];
      else {
        const list2 = [...inEdges],
          scope = list2['map']((input) => {
            const output = nodes[input['sourceId']] || null,
              value2 =
                output &&
                (typeof output['_bizRev'] === 'number' || typeof output['_bizRev'] === 'string')
                  ? String(output['_bizRev'])
                  : '',
              value3 = output?.['thumbId'] ? String(output['thumbId']) : '',
              value4 = String(output?.['mask'] || '')['trim']() ? 'm1' : 'm0',
              value5 = String(input?.['refSlot'] || ''),
              value6 = String(input?.['sourceMediaKey'] || '');
            return (
              input['id'] +
              ':' +
              input['sourceId'] +
              ':' +
              value5 +
              ':' +
              value6 +
              ':' +
              value2 +
              ':' +
              value3 +
              ':' +
              value4
            );
          })['join']('|');
        (record ||
          payload ||
          this['_renderRefBarPendingWhenVisible'] ||
          scope !== this['_lastEdgeSig']) &&
          ((this['_renderRefBarPendingWhenVisible'] = ![]),
          (this['_lastEdgeSig'] = scope),
          this['_renderRefBar']());
      }
      if (!isFailureGenerationUiState2) this['resumeGeneration']?.();
      this['_updateSubmitButtonState']();
    }
    async ['_renderRefBar']() {
      if (!this['refBarEl']) return;
      if (this['_rendererMediaDeferred'] === !![])
        return void (this['_renderRefBarPendingWhenVisible'] = !![]);
      const value7 = this['_getStoreStateForRead'](),
        value8 = value7?.['pickConnectMode'] || {};
      if (!this['_shouldRenderRefBarNow'](value7, value8)) {
        this['_renderRefBarPendingWhenVisible'] = !![];
        return;
      }
      if (this['_renderRefBarLock']) {
        this['_renderRefBarPending'] = !![];
        return;
      }
      ((this['_renderRefBarLock'] = !![]), (this['_renderRefBarPending'] = ![]));
      try {
        await this['_renderRefBarImpl']();
      } finally {
        ((this['_renderRefBarLock'] = ![]),
          this['_renderRefBarPending'] && ((this['_renderRefBarPending'] = ![]), this['_renderRefBar']()));
      }
    }
    async ['_renderRefBarImpl']() {
      if (!this['refBarEl']) return;
      const state3 = this['_getStoreStateForRead'](),
        value9 = Object['values'](state3['edges'] || {}),
        nodes2 = state3['nodes'] || {},
        inEdges2 = store['getIncomingEdges'](this['nodeId']);
      this['_syncRefThumbObjectUrlScope'](inEdges2, nodes2);
      const imageNodeInputGate = getImageNodeInputGate(this['_data']?.['model']),
        value10 = String(imageNodeInputGate['kind'] || '')['trim'](),
        value11 = Number(imageNodeInputGate['max']),
        isRhPersonReplaceWorkflowModel3 = isRhPersonReplaceWorkflowModel(this['_data']?.['model']),
        thumbnailUrl = getImageInputGateUploadedUrl(this['_data'], imageNodeInputGate),
        targetNodeData = nodes2?.[this['nodeId']] || this['_data'] || {},
        targetInputPolicy = getTargetInputPolicy(targetNodeData),
        fixedInputConfig = getFixedInputSlotConfigFromManifest(targetNodeData);
      syncAdaptiveImageInputRatio(this, {
        store: store,
        nodeId: this['nodeId'],
        inEdges: inEdges2,
        nodes: nodes2,
        targetNodeData: targetNodeData,
      });
      const attachBtnHTML = createPromptAttachmentButtonHTML({ stroke: 'var(--white-80)' }),
        handler = () => {
          let attachBtn = this['refBarEl']['querySelector']('.prompt-attachment-btn'),
            thumbContainer = this['refBarEl']['querySelector']('.ref-thumb-container');
          return (
            (!attachBtn || !thumbContainer) &&
              ((this['refBarEl']['innerHTML'] = attachBtnHTML + ' <div class="ref-thumb-container"></div>'),
              (attachBtn = this['refBarEl']['querySelector']('.prompt-attachment-btn')),
              (thumbContainer = this['refBarEl']['querySelector']('.ref-thumb-container')),
              (this['_attachBtnIcon'] = attachBtn ? attachBtn['querySelector']('.btn-icon') : null)),
            { attachBtn: attachBtn, thumbContainer: thumbContainer }
          );
        };
      let items = [];
      const value12 = { text: 0, image: 0, video: 0, audio: 0 },
        sourceIdToLabel = {};
      for (const edgeId of inEdges2) {
        const enabled2 = nodes2[edgeId['sourceId']];
        if (!enabled2) continue;
        const type = resolveEffectiveInputKind(enabled2, edgeId);
        if (!type) continue;
        if (!isInputKindAllowed(targetInputPolicy, type)) continue;
        if (value10 && type !== value10) continue;
        if (value10 && Number['isFinite'](value11) && value12[value10] >= value11) continue;
        if (isRhPersonReplaceWorkflowModel3 && type !== 'image') continue;
        if (isRhPersonReplaceWorkflowModel3 && value12['image'] >= 2) continue;
        value12[type]++;
        const value13 = {
            text: t('aigenImage.refs.types.text'),
            image: t('aigenImage.refs.types.image'),
            video: t('aigenImage.refs.types.video'),
            audio: t('aigenImage.refs.types.audio'),
          },
          label = '@' + value13[type] + value12[type];
        sourceIdToLabel[edgeId['sourceId']] = label;
        let thumbHTML = '',
          thumbSrc = '',
          previewSrc = '',
          mediaIdentityKey = '';
        if (type === 'image') {
          let thumbBlobUrl = '';
          for (const value14 of collectRefThumbIds(enabled2)) {
            thumbBlobUrl = this['_refThumbObjectUrls']['get'](value14) || '';
            if (!thumbBlobUrl) this['_scheduleRefThumbObjectUrl'](value14);
            if (thumbBlobUrl) break;
          }
          ({
            thumbSrc: thumbSrc,
            previewSrc: previewSrc,
            mediaIdentityKey: mediaIdentityKey,
          } = resolveVersionedRefImageRenderSources(enabled2, edgeId, { thumbBlobUrl: thumbBlobUrl }));
        }
        let thumbnailUrl2 = resolveCanvasImageDisplayUrl(enabled2);
        !thumbnailUrl2 &&
          enabled2['thumbId'] &&
          (this['_refThumbObjectUrls']['has'](enabled2['thumbId'])
            ? (thumbnailUrl2 = this['_refThumbObjectUrls']['get'](enabled2['thumbId']))
            : this['_scheduleRefThumbObjectUrl'](enabled2['thumbId']));
        if (!thumbnailUrl2) {
          const refImageCandidateUrls = resolveRefImageCandidateUrls(enabled2);
          thumbnailUrl2 = refImageCandidateUrls[0] || '';
        }
        type === 'image' && (thumbnailUrl2 = thumbSrc || thumbnailUrl2);
        if (type === 'image' && thumbnailUrl2)
          (ensureThumbDecoded(thumbnailUrl2),
            previewSrc && previewSrc !== thumbnailUrl2 && ensureThumbDecoded(previewSrc),
            (thumbHTML = createReferenceInputThumbnailHtml({
              kind: 'image',
              thumbnailUrl: thumbnailUrl2,
              extraHtml: createReferenceMaskBadgeHtml(enabled2),
            })));
        else {
          if (type === 'text') {
            const value15 = enabled2['type'] === 'ai-text';
            if (value15 && !enabled2['outputText']) continue;
            thumbHTML = createReferenceInputThumbnailHtml({ kind: 'text' });
          } else {
            if (type === 'video') {
              thumbnailUrl2 = resolveReferenceVideoThumbnail(enabled2, edgeId)['thumbUrl'];
              if (thumbnailUrl2) ensureThumbDecoded(thumbnailUrl2);
              thumbHTML = createReferenceInputThumbnailHtml({ kind: 'video', thumbnailUrl: thumbnailUrl2 });
            } else
              type === 'audio' && (thumbHTML = createReferenceInputThumbnailHtml({ kind: 'audio' }));
          }
        }
        if (thumbHTML) {
          const value16 = String(enabled2['mask'] || '')['trim']() ? 'm1' : 'm0',
            sig =
              type +
              '|' +
              edgeId['id'] +
              '|' +
              edgeId['sourceId'] +
              '|' +
              (thumbnailUrl2 || '') +
              '|' +
              (previewSrc || '') +
              '|' +
              mediaIdentityKey +
              '|' +
              value16;
          items['push']({
            key: 'edge:' + edgeId['id'],
            edgeId: edgeId['id'],
            sourceId: edgeId['sourceId'],
            refSlot: edgeId['refSlot'] || '',
            type: type,
            label: label,
            sig: sig,
            thumbHTML: thumbHTML,
            thumbSrc: thumbSrc || thumbnailUrl2 || '',
            previewSrc: previewSrc || thumbnailUrl2 || '',
          });
        }
      }
      isInputKindAllowed(targetInputPolicy, 'image') &&
        getAssetInputRefsFromPromptAndNode(this['promptEl'], {
          nodeData: targetNodeData,
          allowedTypes: ['image'],
          dedupe: !isRunningHubWorkflowNode(targetNodeData) && !fixedInputConfig,
        })['forEach']((label2, value17) => {
          const effectiveInputKind = resolveEffectiveInputKind(label2);
          if (effectiveInputKind !== 'image' || !isInputKindAllowed(targetInputPolicy, effectiveInputKind)) return;
          const thumbnailUrl3 = String(label2['thumbUrl'] || label2['url'] || '')['trim']();
          if (!thumbnailUrl3) return;
          ensureThumbDecoded(thumbnailUrl3);
          const assetId = String(label2['assetId'] || ''),
            assetIndex = String(label2['itemIndex'] ?? ''),
            assetOccurrence = String(label2['assetMentionOccurrence'] ?? ''),
            assetRefSource = String(label2['assetRefSource'] || 'prompt'),
            sourceId = 'asset:' + assetId + ':' + assetIndex,
            key2 = 'asset:' + assetRefSource + ':' + assetId + ':' + assetIndex + ':image:' + value17;
          items['push']({
            key: key2,
            edgeId: '',
            sourceId: sourceId,
            refSlot: '',
            type: 'image',
            label: label2['label'] || label2['name'] || t('aigenImage.refs.referenceImage'),
            sig: key2 + '|' + String(label2['url'] || '') + '|' + thumbnailUrl3,
            thumbHTML: createReferenceInputThumbnailHtml({ kind: 'image', thumbnailUrl: thumbnailUrl3 }),
            thumbSrc: thumbnailUrl3,
            previewSrc: String(label2['url'] || thumbnailUrl3),
            virtual: !![],
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
            const enabled3 = !!this['refBarEl']['querySelector']('[data-ref-slot="replaceTarget"]'),
              enabled4 = !!this['refBarEl']['querySelector']('[data-ref-slot="replacedImage"]');
            let el4 = this['refBarEl']['querySelector']('.prompt-attachment-btn'),
              container = this['refBarEl']['querySelector']('.ref-thumb-container');
            if (!el4 || !container || !enabled3 || !enabled4) {
              const t2 = t('aigenImage.refs.replaceTarget'),
                t3 = t('aigenImage.refs.replacedImage');
              ((this['refBarEl']['innerHTML'] =
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
                (el4 = this['refBarEl']['querySelector']('.prompt-attachment-btn')),
                (container = this['refBarEl']['querySelector']('.ref-thumb-container')),
                (this['_attachBtnIcon'] = el4 ? el4['querySelector']('.btn-icon') : null));
            }
            const targetEl = this['refBarEl']['querySelector']('[data-ref-slot="replaceTarget"]'),
              sourceEl = this['refBarEl']['querySelector']('[data-ref-slot="replacedImage"]');
            return { targetEl: targetEl, sourceEl: sourceEl, container: container };
          },
          { targetEl: targetEl2, sourceEl: sourceEl2, container: container2 } = handler2();
        ((targetEl2['style']['order'] = String(fixedInputConfig['slotById']['replaceTarget']['displayOrder'])),
          (sourceEl2['style']['order'] = String(fixedInputConfig['slotById']['replacedImage']['displayOrder'])),
          (this['_lastRefHTML'] = '__rh-person-replace-v3__'),
          this['refBarEl']['classList']['add']('active'));
        const run = (event) => String(event?.['key'] || event?.['edgeId'] || ''),
          map = new Set(),
          map2 = new Map(),
          value18 = [
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
        for (const value19 of items) {
          const enabled5 = run(value19);
          if (!enabled5 || map['has'](enabled5)) continue;
          const value20 = String(value19['refSlot'] || '');
          if (!key3['includes'](value20)) continue;
          if (map2['has'](value20)) continue;
          (map2['set'](value20, value19), map['add'](enabled5));
        }
        for (const value21 of items) {
          const enabled6 = run(value21);
          if (!enabled6 || map['has'](enabled6)) continue;
          for (const value22 of key3) {
            if (!map2['has'](value22)) {
              (map2['set'](value22, value21), map['add'](enabled6));
              break;
            }
          }
        }
        const run2 = (value23, value24, value25) => {
            const el5 = document['createElement']('div');
            return (
              (el5['className'] = 'ref-thumb-wrap ref-upload-slot'),
              (el5['dataset']['refSlot'] = value23),
              (el5['dataset']['slot'] = value23),
              (el5['dataset']['kind'] = 'image'),
              (el5['title'] = value24),
              el5['setAttribute']('draggable', 'false'),
              (el5['innerHTML'] = '<span class="ref-upload-label">' + value25 + '</span>'),
              el5
            );
          },
          handler3 = (value26, value27, value28) => {
            const el6 = document['createElement']('div');
            return (
              (el6['className'] =
                'ref-thumb-wrap' + (value28['virtual'] ? ' ref-thumb-wrap--asset' : '')),
              (el6['dataset']['refSlot'] = value26),
              (el6['dataset']['slot'] = value26),
              (el6['dataset']['kind'] = 'image'),
              (el6['title'] = value27),
              el6['setAttribute']('draggable', value28['virtual'] ? 'false' : 'true'),
              el6
            );
          };
        for (const event2 of value18) {
          const enabled7 = map2['get'](event2['key']) || null;
          let el7 = event2['el'];
          if (!el7) continue;
          if (enabled7 && el7['classList']?.['contains']?.('ref-upload-slot')) {
            const value29 = handler3(event2['key'], event2['title'], enabled7);
            (el7['replaceWith'](value29), (el7 = value29), (event2['el'] = value29));
          } else {
            if (!enabled7 && !el7['classList']?.['contains']?.('ref-upload-slot')) {
              const value30 = run2(event2['key'], event2['title'], event2['emptyHtml']);
              (el7['replaceWith'](value30), (el7 = value30), (event2['el'] = value30));
            }
          }
          ((el7['dataset']['refSlot'] = event2['key']),
            (el7['dataset']['slot'] = event2['key']),
            (el7['dataset']['kind'] = 'image'),
            (el7['title'] = event2['title']));
          if (enabled7) {
            ((el7['className'] =
              'ref-thumb-wrap' + (enabled7['virtual'] ? ' ref-thumb-wrap--asset' : '')),
              el7['classList']?.['remove']?.('ref-upload-slot'),
              el7['setAttribute']('draggable', enabled7['virtual'] ? 'false' : 'true'),
              (el7['dataset']['refKey'] = run(enabled7)),
              (el7['dataset']['edgeId'] = enabled7['edgeId'] || ''),
              (el7['dataset']['sourceId'] = enabled7['sourceId'] || ''),
              (el7['dataset']['refOrigin'] = enabled7['virtual'] ? 'asset' : 'node'));
            enabled7['virtual']
              ? ((el7['dataset']['assetId'] = enabled7['assetId'] || ''),
                (el7['dataset']['assetIndex'] = enabled7['assetIndex'] || ''),
                (el7['dataset']['assetOccurrence'] = enabled7['assetOccurrence'] || ''),
                (el7['dataset']['assetRefSource'] = enabled7['assetRefSource'] || 'prompt'),
                (el7['dataset']['refType'] = enabled7['refType'] || enabled7['type'] || ''))
              : (delete el7['dataset']['assetId'],
                delete el7['dataset']['assetIndex'],
                delete el7['dataset']['assetOccurrence'],
                delete el7['dataset']['assetRefSource'],
                delete el7['dataset']['refType']);
            el7['dataset']['sig'] !== enabled7['sig'] &&
              ((el7['innerHTML'] =
                enabled7['thumbHTML'] +
                '<button type="button" class="ref-thumb-delete" title="' +
                t('aigenImage.refs.removeReference') +
                '">&times;</button>'),
              (el7['dataset']['sig'] = enabled7['sig']),
              revealRefThumbMedia(el7, enabled7['sig']));
            if (enabled7['thumbSrc']) el7['dataset']['thumbSrc'] = enabled7['thumbSrc'];
            else delete el7['dataset']['thumbSrc'];
            if (enabled7['previewSrc']) el7['dataset']['previewSrc'] = enabled7['previewSrc'];
            else delete el7['dataset']['previewSrc'];
          } else {
            ((el7['className'] = 'ref-thumb-wrap ref-upload-slot'),
              el7['setAttribute']('draggable', 'false'));
            if (el7['dataset']['refKey']) delete el7['dataset']['refKey'];
            if (el7['dataset']['edgeId']) delete el7['dataset']['edgeId'];
            if (el7['dataset']['sourceId']) delete el7['dataset']['sourceId'];
            if (el7['dataset']['refOrigin']) delete el7['dataset']['refOrigin'];
            if (el7['dataset']['assetId']) delete el7['dataset']['assetId'];
            if (el7['dataset']['assetIndex']) delete el7['dataset']['assetIndex'];
            if (el7['dataset']['assetOccurrence']) delete el7['dataset']['assetOccurrence'];
            if (el7['dataset']['assetRefSource']) delete el7['dataset']['assetRefSource'];
            if (el7['dataset']['refType']) delete el7['dataset']['refType'];
            if (el7['dataset']['sig']) delete el7['dataset']['sig'];
            if (el7['dataset']['thumbSrc']) delete el7['dataset']['thumbSrc'];
            if (el7['dataset']['previewSrc']) delete el7['dataset']['previewSrc'];
            const value31 = '<span class="ref-upload-label">' + event2['emptyHtml'] + '</span>';
            if (el7['innerHTML'] !== value31) el7['innerHTML'] = value31;
          }
        }
        (bindRefThumbFixedSlotDrag({
          owner: this,
          container: container2,
          store: store,
          nodeId: this['nodeId'],
          acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
        }),
          this['_syncBtnIconState'](),
          _syncPillLabels(this, {}));
        return;
      }
      if (
        fixedInputConfig &&
        renderManifestFixedImageRefBar({
          owner: this,
          refBarEl: this['refBarEl'],
          promptEl: this['promptEl'],
          attachBtnHTML: attachBtnHTML,
          fixedInputConfig: fixedInputConfig,
          items: items,
          targetNodeData: targetNodeData,
          sourceIdToLabel: sourceIdToLabel,
          store: store,
          nodeId: this['nodeId'],
          ensureThumbDecoded: ensureThumbDecoded,
          revealRefThumbMedia: revealRefThumbMedia,
          syncPillLabels: _syncPillLabels,
        })
      )
        return;
      if (this['_isDraggingSorting']) {
        (this['_syncBtnIconState'](), _syncPillLabels(this, sourceIdToLabel));
        return;
      }
      if (items['length'] > 0) {
        (this['refBarEl']['classList']['add']('active'),
          this['refBarEl']['classList']['remove']('rh-v5-refbar'));
        const value32 = this['_lastRefHTML'];
        this['_lastRefHTML'] = '__has-items__';
        const { thumbContainer: thumbContainer2 } = handler();
        String(value32 || '')['startsWith']('__rh-') &&
          thumbContainer2['querySelectorAll']('.ref-thumb-wrap')['forEach']((el8) => el8['remove']());
        (thumbContainer2['querySelectorAll']('.ref-upload-slot')['forEach']((el9) => el9['remove']()),
          thumbContainer2['querySelectorAll']('.ref-thumb-wrap')['forEach']((el10) => {
            const enabled8 =
              String(el10?.['dataset']?.['refKey'] || '')['trim']() ||
              (String(el10?.['dataset']?.['edgeId'] || '')['trim']()
                ? 'edge:' + String(el10['dataset']['edgeId'])['trim']()
                : '');
            if (!enabled8) el10['remove']();
          }));
        const map3 = new Map();
        thumbContainer2['querySelectorAll']('.ref-thumb-wrap')['forEach']((el11) => {
          const value33 = String(el11?.['dataset']?.['edgeId'] || '')['trim'](),
            enabled9 =
              String(el11?.['dataset']?.['refKey'] || '')['trim']() ||
              (value33 ? 'edge:' + value33 : '');
          if (!enabled9) return;
          map3['set'](enabled9, el11);
        });
        const map4 = new Set();
        for (let value34 = 0; value34 < items['length']; value34++) {
          const event3 = items[value34],
            enabled10 = String(event3['key'] || event3['edgeId'] || '');
          if (!enabled10) continue;
          let el12 = map3['get'](enabled10);
          !el12 &&
            ((el12 = document['createElement']('div')),
            (el12['className'] =
              'ref-thumb-wrap' + (event3['virtual'] ? ' ref-thumb-wrap--asset' : '')));
          el12['setAttribute']('draggable', event3['virtual'] ? 'false' : 'true');
          el12['dataset']['sig'] !== event3['sig'] &&
            ((el12['innerHTML'] =
              event3['thumbHTML'] +
              '<button type="button" class="ref-thumb-delete" title="' +
              t('aigenImage.refs.removeReference') +
              '">&times;</button>'),
            (el12['dataset']['sig'] = event3['sig']),
            revealRefThumbMedia(el12, event3['sig']));
          ((el12['dataset']['refKey'] = enabled10),
            (el12['dataset']['edgeId'] = event3['edgeId'] || ''),
            (el12['dataset']['sourceId'] = event3['sourceId']),
            (el12['dataset']['refOrigin'] = event3['virtual'] ? 'asset' : 'node'));
          event3['virtual']
            ? ((el12['dataset']['assetId'] = event3['assetId'] || ''),
              (el12['dataset']['assetIndex'] = event3['assetIndex'] || ''),
              (el12['dataset']['assetOccurrence'] = event3['assetOccurrence'] || ''),
              (el12['dataset']['assetRefSource'] = event3['assetRefSource'] || 'prompt'),
              (el12['dataset']['refType'] = event3['refType'] || event3['type'] || ''))
            : (delete el12['dataset']['assetId'],
              delete el12['dataset']['assetIndex'],
              delete el12['dataset']['assetOccurrence'],
              delete el12['dataset']['assetRefSource'],
              delete el12['dataset']['refType']);
          ((el12['dataset']['type'] = event3['type']),
            (el12['dataset']['label'] = event3['label']),
            (el12['dataset']['index'] = String(value34)));
          if (event3['thumbSrc']) el12['dataset']['thumbSrc'] = event3['thumbSrc'];
          else delete el12['dataset']['thumbSrc'];
          if (event3['previewSrc']) el12['dataset']['previewSrc'] = event3['previewSrc'];
          else delete el12['dataset']['previewSrc'];
          (thumbContainer2['appendChild'](el12), map4['add'](enabled10));
        }
        for (const [value35, el13] of map3['entries']()) {
          if (!map4['has'](value35)) el13['remove']();
        }
        this['_bindDragSort'](this['refBarEl']);
      } else {
        if (value10 === 'image') {
          this['refBarEl']['classList']['remove']('rh-v5-refbar');
          const t4 = t('aigenImage.refs.uploadReference'),
            value36 =
              attachBtnHTML +
              ' <div class="ref-thumb-container">' +
              (thumbnailUrl
                ? '<div class="ref-thumb-wrap ref-upload-slot" data-ref-src="upload">' +
                  createReferenceInputThumbnailHtml({ kind: 'image', thumbnailUrl: thumbnailUrl }) +
                  '<button type="button" class="ref-upload-delete" title="' +
                  t('aigenImage.refs.removeReference') +
                  '">&times;</button></div>'
                : '<button type="button" class="ref-thumb-wrap ref-upload-slot" title="' +
                  escapeRefBarHtml(t4) +
                  '"><span class="ref-upload-label">' +
                  formatRefUploadLabel(t4) +
                  '</span></button>') +
              '</div>';
          if (this['_lastRefHTML'] !== value36) {
            ((this['_lastRefHTML'] = value36),
              this['refBarEl']['classList']['add']('active'),
              (this['refBarEl']['innerHTML'] = value36));
            const el14 = this['refBarEl']['querySelector']('.prompt-attachment-btn');
            this['_attachBtnIcon'] = el14 ? el14['querySelector']('.btn-icon') : null;
          }
        } else {
          (this['refBarEl']['classList']['remove']('active'),
            this['refBarEl']['classList']['remove']('rh-v5-refbar'),
            (this['_lastRefHTML'] = '__empty__'));
          const { thumbContainer: thumbContainer3 } = handler();
          thumbContainer3['querySelectorAll']('.ref-thumb-wrap')['forEach']((el15) => el15['remove']());
        }
      }
      (this['_syncBtnIconState'](), _syncPillLabels(this, sourceIdToLabel));
    }
    ['_syncBtnIconState']() {
      syncImageRefBarButtonIcon({
        refBarEl: this['refBarEl'],
        pickMode: this['_getStoreStateForRead']()['pickConnectMode'],
        nodeId: this['nodeId'],
      });
    }
    ['_bindDragSort'](refBar) {
      bindImageRefThumbOrderDrag({
        owner: this,
        refBar: refBar,
        store: store,
        nodeId: this['nodeId'],
      });
    }
  }
  return item['prototype'];
}
