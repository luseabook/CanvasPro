import { sanitizePromptHtml } from '../../utils/dom.js';
import {
  clearVirtualizedPromptCommit,
  isVirtualizedPromptEditorCurrent,
} from '../../modules/promptPasteVirtualization.js';
import {
  createReferenceMaskBadgeHtml,
  getReferenceMaskSignaturePart,
  hasReferenceMask,
} from '../../modules/refThumbMaskBadge.js';
import {
  createReferenceInputThumbnailHtml,
  resolveReferenceVideoThumbnail,
} from '../../modules/referenceInputThumbnail.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { createPromptAttachmentButtonHTML } from '../refAttachmentButton.js';
import { bindRefThumbOrderDrag } from '../../modules/refThumbDragController.js';
import {
  resolvePromptTextWithTextRefs,
  resolveTextReferenceContent,
} from '../../modules/nodePromptShared.js';
import {
  isTaskTerminal,
  resolveGenerationButtonMode,
  shouldShowGenerationBusyUi,
} from '../../core/generationTaskUiState.js';
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonLoadingUi,
} from '../../modules/previewGenerateButtonUi.js';
import { t } from '../../i18n/index.js';
import { syncTextResultSources } from './textResultSources.js';
import {
  applyModelCredentialButtonState,
  resetModelCredentialButtonState,
} from '../../modules/modelCredentialUi.js';
export function createAIGenTextNodeStateSyncModule(value) {
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
  } = value;
  class item {
    ['_getStoreStateForRead']() {
      if (typeof store['getStateRaw'] === 'function') return store['getStateRaw']();
      if (typeof store['getState'] === 'function') return store['getState']();
      return {};
    }
    ['_getEffectiveSubmitPromptText']() {
      const nodes = this['_getStoreStateForRead']();
      return resolvePromptTextWithTextRefs({
        promptEl: this['promptEl'],
        inEdges:
          typeof store['getIncomingEdges'] === 'function'
            ? store['getIncomingEdges'](this['nodeId'])
            : [],
        nodes: nodes?.['nodes'] || {},
      });
    }
    ['_updateSubmitButtonState']() {
      if (!this['btnEl']) return;
      const enabled = this['_getEffectiveSubmitPromptText'](),
        jobStatus = this['_getStoreStateForRead']()['nodes']?.[this['nodeId']] || this['_data'] || {},
        disabled = resolveGenerationButtonMode(
          this['_isGenerating'] && jobStatus?.['jobStatus'] !== 'error'
            ? { ...jobStatus, isGenerating: !![], jobStatus: jobStatus['jobStatus'] || 'running' }
            : jobStatus,
          { cancellable: jobStatus?.['taskCancellable'] === !![] },
        );
      if (disabled['busy']) {
        (setGenerateButtonLoadingUi(this['btnEl'], {
          title: t('aigenText.generate'),
          disabled: disabled['disabled'],
          ariaLabel: t('aigenText.generate'),
        }),
          (this['btnEl']['disabled'] = disabled['disabled']),
          (this['btnEl']['style']['cursor'] = disabled['cursor']));
        return;
      }
      (resetGenerateButtonIdleUi(this['btnEl'], t('aigenText.generate')),
        resetModelCredentialButtonState(this['btnEl']),
        !enabled
          ? ((this['btnEl']['disabled'] = !![]),
            (this['btnEl']['style']['cursor'] = 'var(--unavailable-cursor)'))
          : ((this['btnEl']['disabled'] = ![]),
            (this['btnEl']['style']['cursor'] = ''),
            applyModelCredentialButtonState(this['btnEl'], {
              modelId: jobStatus?.['model'],
              provider: jobStatus?.['provider'],
              providerProfileId: jobStatus?.['providerProfileId'] || jobStatus?.['rhProviderProfileId'],
            })));
    }
    ['update'](key) {
      this['_data'] = key;
      if (shouldShowGenerationBusyUi(key))
        ((this['_isGenerating'] = !![]),
          this['previewEl'] && typeof startLoading === 'function' && startLoading(this['previewEl']));
      else
        isTaskTerminal(key) &&
          ((this['_isGenerating'] = ![]),
          this['previewEl'] && typeof stopLoading === 'function' && stopLoading(this['previewEl']));
      const enabled2 = this['outputEl']?.['classList']?.['contains']?.('is-text-selection-active') === !![],
        enabled3 = this['_outputScrollTopDirty'] === !![],
        index = String(key['outputText'] || ''),
        result =
          index !== this['_lastRenderedOutputText'] ||
          JSON['stringify'](key['outputImages'] || []) !== this['_lastRenderedOutputImagesSignature'];
      !enabled2 &&
        !enabled3 &&
        Number['isFinite'](key['outputScrollTop']) &&
        (this['_outputScrollTop'] = Math['max'](0, key['outputScrollTop']));
      const enabled4 =
        this['outputEl'] &&
        document['activeElement'] === this['outputEl'] &&
        this['outputEl']['getAttribute']?.('contenteditable') === 'true';
      !enabled4 && !enabled2 && result && this['outputEl'] && this['_renderOutputText']?.(index);
      if (!enabled2 && !enabled4) syncTextResultSources(this);
      this['outputEl'] &&
        document['activeElement'] !== this['outputEl'] &&
        !enabled2 &&
        !enabled3 &&
        (this['outputEl']['scrollTop'] = this['_outputScrollTop']);
      const data = this['_getStoreStateForRead']()['pickConnectMode'];
      if (this['_placeholderEl']) {
        const el = this['_placeholderEl']['querySelector']('.placeholder-icon-svg');
        el &&
          (data['active'] && data['sourceNodeId'] === this['nodeId']
            ? el['classList']['add']('is-pick-connecting')
            : el['classList']['remove']('is-pick-connecting'));
      }
      const el2 = this['refBarEl']?.['querySelector']('.prompt-attachment-btn');
      if (el2) {
        const el3 = el2['querySelector']('.btn-icon');
        if (el3) {
          const options = data['active'] && data['sourceNodeId'] === this['nodeId'];
          ((el3['style']['transition'] = 'opacity 0.2s ease, transform 0.2s ease'),
            (el3['style']['opacity'] = options ? '0' : ''),
            (el3['style']['transform'] = options ? 'scale(0.4)' : ''));
        }
      }
      if (document['activeElement'] !== this['promptEl'] && key['prompt'] !== undefined) {
        if (!isVirtualizedPromptEditorCurrent(this, key['prompt'])) {
          const sanitizePromptHtml2 = sanitizePromptHtml(key['prompt'] || '');
          this['promptEl']?.['innerHTML'] !== sanitizePromptHtml2 &&
            (clearVirtualizedPromptCommit(this),
            (this['promptEl']['innerHTML'] = sanitizePromptHtml2),
            _rehydratePromptPills(this));
        }
      }
      (this['_syncPromptBoxSizeFromData']?.(key),
        this['_modelProviderProfileControl']?.['sync'](),
        this['_runtimeParameterController']?.['sync']?.(key));
      const el4 = this['modelWrap']?.['querySelector']('.img-model-label');
      if (el4 && key['model']) el4['textContent'] = getDisplayModelName(key['model']);
      const state = this['_getStoreStateForRead'](),
        target = state['nodes'] || {},
        args = store['getIncomingEdges'](this['nodeId']),
        handler = (enabled5, source) => {
          if (!enabled5) return '0';
          const effectiveInputKind = resolveEffectiveInputKind(enabled5, source),
            next = enabled5['_bizRev'] ?? '',
            hasReferenceMask2 = hasReferenceMask(enabled5),
            current = !!resolveTextReferenceContent(enabled5),
            entry =
              !!enabled5['thumbId'] ||
              !!enabled5['thumbUrl'] ||
              !!enabled5['imageUrl'] ||
              !!enabled5['src'] ||
              !!enabled5['localPath'],
            record =
              (Array['isArray'](enabled5['videos']) && enabled5['videos']['length'] > 0) ||
              !!enabled5['thumbId'] ||
              !!enabled5['thumbUrl'] ||
              !!enabled5['videoUrl'] ||
              !!enabled5['src'] ||
              !!enabled5['localPath'],
            payload = !!enabled5['audioUrl'] || !!enabled5['src'] || !!enabled5['localPath'];
          if (effectiveInputKind === 'text') return 't:' + next + ':' + (current ? 1 : 0);
          if (effectiveInputKind === 'video') {
            const referenceVideoThumbnail = resolveReferenceVideoThumbnail(enabled5, source)['thumbUrl'];
            return 'v:' + next + ':' + (record ? 1 : 0) + ':' + referenceVideoThumbnail;
          }
          if (effectiveInputKind === 'audio') return 'a:' + next + ':' + (payload ? 1 : 0);
          return 'i:' + next + ':' + (entry ? 1 : 0) + ':' + (hasReferenceMask2 ? 1 : 0);
        },
        list = [...args],
        handle = list['map'](
          (config) =>
            config['id'] +
            ':' +
            config['sourceId'] +
            ':' +
            String(config?.['refSlot'] || '') +
            ':' +
            String(config?.['sourceMediaKey'] || '') +
            ':' +
            handler(target[config['sourceId']], config),
        )['join']('|');
      (handle !== this['_lastEdgeSig'] && ((this['_lastEdgeSig'] = handle), this['_renderRefBar']()),
        this['_updateSubmitButtonState']());
    }
    ['_renderRefBar']() {
      if (!this['refBarEl']) return;
      const state2 = store['getState'](),
        scope = state2['nodes'] || {},
        list2 = store['getIncomingEdges'](this['nodeId']);
      this['_lastInEdgeCount'] = list2['length'];
      const promptAttachmentButtonHTML = createPromptAttachmentButtonHTML();
      if (list2['length'] === 0) {
        const input = promptAttachmentButtonHTML;
        this['_lastRefHTML'] !== input &&
          ((this['_lastRefHTML'] = input),
          this['refBarEl']['classList']['remove']('active'),
          (this['refBarEl']['innerHTML'] = input));
        this['_syncBtnIconState']();
        return;
      }
      const output = { text: 0, image: 0, video: 0, audio: 0 },
        index2 = [],
        value2 = {};
      list2['forEach']((edgeId) => {
        const error = scope[edgeId['sourceId']];
        if (!error) return;
        const type = resolveEffectiveInputKind(error, edgeId) || 'other';
        output[type] = (output[type] || 0) + 1;
        const value3 = {
            text: t('aigenText.refs.types.text'),
            image: t('aigenText.refs.types.image'),
            video: t('aigenText.refs.types.video'),
            audio: t('aigenText.refs.types.audio'),
            group: t('aigenText.refs.types.group'),
            other: t('aigenText.refs.types.other'),
          },
          label = '@' + value3[type] + output[type];
        value2[edgeId['sourceId']] = label;
        let thumbHTML = '';
        const thumbnailUrl = String(error['src'] || error['imageUrl'] || error['thumbUrl'] || '')[
          'trim'
        ]();
        if (type === 'image' && thumbnailUrl)
          (ensureThumbDecoded(thumbnailUrl),
            (thumbHTML = createReferenceInputThumbnailHtml({
              kind: 'image',
              thumbnailUrl: thumbnailUrl,
              extraHtml: createReferenceMaskBadgeHtml(error),
            })));
        else {
          if (type === 'text') {
            const textReferenceContent = resolveTextReferenceContent(error);
            if (!textReferenceContent) return;
            thumbHTML = createReferenceInputThumbnailHtml({ kind: 'text' });
          } else {
            if (type === 'video') {
              const enabled6 =
                (Array['isArray'](error['videos']) && error['videos']['length'] > 0) ||
                !!error['thumbId'] ||
                !!error['thumbUrl'] ||
                !!error['videoUrl'] ||
                !!error['src'] ||
                !!error['localPath'];
              if (!enabled6) return;
              const thumbnailUrl2 = resolveReferenceVideoThumbnail(error, edgeId)['thumbUrl'];
              if (thumbnailUrl2) ensureThumbDecoded(thumbnailUrl2);
              thumbHTML = createReferenceInputThumbnailHtml({ kind: 'video', thumbnailUrl: thumbnailUrl2 });
            } else {
              if (type === 'audio') {
                const enabled7 = !!error['audioUrl'] || !!error['src'] || !!error['localPath'];
                if (!enabled7) return;
                thumbHTML = createReferenceInputThumbnailHtml({ kind: 'audio' });
              } else {
                if (type === 'group' || type === 'other') {
                  const value4 = type === 'group',
                    value5 = value4 ? error['color'] || 'var(--indigo)' : 'var(--text-muted)',
                    value6 = (error['name'] ||
                      (value4 ? t('aigenText.refs.groupShortName') : t('aigenText.refs.nodeShortName')))
                      ['substring'](0, 2)
                      ['toUpperCase']();
                  thumbHTML =
                    '<div class="ref-thumb-media" style="display:flex;align-items:center;justify-content:center;background:' +
                    value5 +
                    '33;border:1px solid ' +
                    value5 +
                    '80;box-sizing:border-box;">\n                    <span style="color:' +
                    value5 +
                    ';font-size:12px;font-weight:bold;letter-spacing:1px;user-select:none;">' +
                    value6 +
                    '</span>\n                </div>';
                }
              }
            }
          }
        }
        thumbHTML &&
          index2['push']({
            edgeId: edgeId['id'],
            sourceId: edgeId['sourceId'],
            type: type,
            label: label,
            index: index2['length'],
            sig:
              type +
              '|' +
              edgeId['id'] +
              '|' +
              edgeId['sourceId'] +
              '|' +
              thumbHTML +
              '|' +
              getReferenceMaskSignaturePart(error),
            thumbHTML: thumbHTML,
          });
      });
      if (index2['length'] === 0) {
        const value7 = promptAttachmentButtonHTML;
        this['_lastRefHTML'] !== value7 &&
          ((this['_lastRefHTML'] = value7),
          this['refBarEl']['classList']['remove']('active'),
          (this['refBarEl']['innerHTML'] = value7));
        (this['_syncBtnIconState'](), _syncPillLabels(this, value2));
        return;
      }
      if (this['_isDraggingSorting']) {
        (this['_syncBtnIconState'](), _syncPillLabels(this, value2));
        return;
      }
      ((this['_lastRefHTML'] = '__has-items__'), this['refBarEl']['classList']['add']('active'));
      let enabled8 = this['refBarEl']['querySelector']('.prompt-attachment-btn'),
        el5 = this['refBarEl']['querySelector']('.ref-thumb-container');
      (!enabled8 || !el5) &&
        ((this['refBarEl']['innerHTML'] = promptAttachmentButtonHTML + ' <div class="ref-thumb-container"></div>'),
        (enabled8 = this['refBarEl']['querySelector']('.prompt-attachment-btn')),
        (el5 = this['refBarEl']['querySelector']('.ref-thumb-container')));
      const map = new Map();
      el5['querySelectorAll']('.ref-thumb-wrap')['forEach']((el6) =>
        map['set'](String(el6?.['dataset']?.['edgeId'] || ''), el6),
      );
      const map2 = new Set();
      for (const value8 of index2) {
        const enabled9 = String(value8['edgeId'] || '');
        if (!enabled9) continue;
        let el7 = map['get'](enabled9);
        (!el7 &&
          ((el7 = document['createElement']('div')), (el7['className'] = 'ref-thumb-wrap')),
          el7['setAttribute']('draggable', 'true'),
          el7['dataset']['sig'] !== value8['sig'] &&
            ((el7['innerHTML'] =
              value8['thumbHTML'] +
              '<button type="button" class="ref-thumb-delete" title="' +
              t('aigenText.refs.removeReference') +
              '">&times;</button>'),
            (el7['dataset']['sig'] = value8['sig']),
            revealRefThumbMedia(el7, value8['sig'])),
          (el7['dataset']['edgeId'] = enabled9),
          (el7['dataset']['sourceId'] = value8['sourceId'] || ''),
          (el7['dataset']['type'] = value8['type'] || ''),
          (el7['dataset']['label'] = value8['label'] || ''),
          (el7['dataset']['index'] = String(value8['index'] ?? '')),
          el5['appendChild'](el7),
          map2['add'](enabled9));
      }
      for (const [value9, el8] of map['entries']()) {
        if (!map2['has'](value9)) el8['remove']();
      }
      (this['_bindDragSort'](this['refBarEl']), this['_syncBtnIconState'](), _syncPillLabels(this, value2));
    }
    ['_syncBtnIconState']() {
      const value10 = store['getState']()['pickConnectMode'],
        el9 = this['refBarEl']?.['querySelector']('.btn-icon');
      if (!el9) return;
      value10 && value10['active'] && value10['sourceNodeId'] === this['nodeId']
        ? ((el9['style']['opacity'] = '0'),
          (el9['style']['transform'] = 'scale(0.4)'),
          (el9['style']['transition'] = 'opacity 0.2s ease, transform 0.2s ease'))
        : ((el9['style']['opacity'] = ''), (el9['style']['transform'] = ''));
    }
    ['_bindDragSort'](container) {
      bindRefThumbOrderDrag({ owner: this, container: container, store: store, nodeId: this['nodeId'] });
    }
  }
  return item['prototype'];
}
