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
export function createAIGenerateNodeStateSyncModule(_0x5edd92) {
  const {
    store: _0xc4985d,
    api: _0x235dbd,
    getDisplayModelName: _0x481c2f,
    _handlePillHover: _0x423441,
    _handlePillOut: _0x5bbcc9,
    _syncEdgesOrderFromPills: _0x540a25,
    _syncPillLabels: _0x20f72a,
    _checkAtTrigger: _0xa2ee4a,
    _populateMentionMenu: _0x360f7c,
    _insertMentionPill: _0x1c6dcf,
    _handlePillKeyboard: _0x257665,
    _rehydratePromptPills: _0x48ce81,
    _handleMentionMenuKeyboard: _0x224bcc,
    TEXT_TOOLBAR_HTML: _0x574ab2,
    bindTextToolbarEvents: _0x56e0d5,
    IMAGE_TOOLBAR_HTML: _0x52ad68,
    bindImageToolbarEvents: _0x5c025f,
    showDevToast: _0x4eb1e6,
    getImage: _0x9434a6,
    openNodeImagePreview: _0x3862db,
    getPromptPresets: _0x49961c,
    openCustomPresetsManager: _0x5090f0,
    startLoading: _0x81d446,
    stopLoading: _0x1d22ce,
    bindRefThumbHoverPreview: _0x382645,
    ensureThumbDecoded: _0x8dcb84,
    revealRefThumbMedia: _0xf5be36,
    getRefKindByNodeType: _0xdac694,
    uploadFile: _0x22e8b1,
    ensureConfig: _0x318e8a,
    getProviderConfig: _0x280b89,
    generateId: _0x9e9ee,
    checkSlashTrigger: _0x2ec880,
    handleSlashKeyboardNavigation: _0x504e22,
    closeSlashMenu: _0x2c4601,
    activateMenuKeyboard: _0x9d86bb,
    ImageFreeAngleController: _0x76018,
  } = _0x5edd92;
  class _0x4bdcfc {
    ['_getStoreStateForRead']() {
      return typeof _0xc4985d.getStateRaw === 'function' ? _0xc4985d.getStateRaw() : _0xc4985d.getState();
    }
    async ['_resolveRefThumbObjectUrl'](_0x568a5e) {
      const _0x1aa3d1 = String(_0x568a5e || '').trim();
      if (!_0x1aa3d1) return '';
      if (this._refThumbObjectUrls.has(_0x1aa3d1)) return this._refThumbObjectUrls.get(_0x1aa3d1) || '';
      const _0x4f4814 = await _0x9434a6(_0x1aa3d1);
      if (!_0x4f4814) return '';
      const _0x5bcbfa = URL.createObjectURL(_0x4f4814);
      return (this._refThumbObjectUrls.set(_0x1aa3d1, _0x5bcbfa), _0x5bcbfa);
    }
    ['_shouldRenderRefBarNow'](_0xd9fe38, _0x4b95fa) {
      const _0x38e285 = Array.isArray(_0xd9fe38?.selectedNodeIds) ? _0xd9fe38.selectedNodeIds : [];
      if (_0x38e285.includes(this.nodeId)) return true;
      if (_0x4b95fa?.active && _0x4b95fa?.sourceNodeId === this.nodeId) return true;
      return shouldAlwaysShowImageRefBar(this._data?.model);
    }
    ['update'](_0x36fe81) {
      const _0x196581 = this._normalizeDreaminaNodeData(_0x36fe81),
        _0xf3a7 = this._data?.model,
        _0x328e5e = this._data?.rhAnimeRealRefUrl;
      ((_0x36fe81 = _0x196581), (this._data = _0x36fe81));
      const _0x2221bf = _0xf3a7 !== _0x36fe81?.model,
        _0x338f5e = _0x328e5e !== _0x36fe81?.rhAnimeRealRefUrl,
        _0x56f274 = shouldShowGenerationBusyUi(_0x36fe81),
        _0x500927 = isTerminalGenerationUiState(_0x36fe81),
        _0x2d2464 = isFailureGenerationUiState(_0x36fe81);
      if (_0x56f274)
        ((this._isGenerating = true),
          this.previewEl && typeof _0x81d446 === 'function' && _0x81d446(this.previewEl));
      else {
        if (_0x500927) {
          this._isGenerating = false;
          isDreaminaTerminalGenerationState(_0x36fe81) &&
            ((this._dreaminaActiveSubmitId = ''), this._stopDreaminaRecovery?.(false));
          stopPreviewNodeLoading(this.nodeId);
          if (this.previewEl) _0x1d22ce(this.previewEl);
          resetGenerateButtonIdleUi(this.btnEl);
        }
      }
      this._rendererMediaDeferred !== true &&
        (this._loadAndDisplayImage(),
        this._applyMaskPreview(_0x36fe81.maskPreviewUrl || _0x36fe81.maskPreview));
      const _0x3f8fa4 = this._getStoreStateForRead(),
        _0x4033f5 = _0x3f8fa4.pickConnectMode || {};
      if (this._placeholderEl) {
        const _0x4f7368 = this._placeholderEl.querySelector('.placeholder-icon-svg');
        _0x4f7368 &&
          (_0x4033f5.active && _0x4033f5.sourceNodeId === this.nodeId
            ? _0x4f7368.classList.add('is-pick-connecting')
            : _0x4f7368.classList.remove('is-pick-connecting'));
      }
      const _0x3d8df1 = this._attachBtnIcon;
      if (_0x3d8df1) {
        const _0x37ede6 = _0x4033f5.active && _0x4033f5.sourceNodeId === this.nodeId;
        ((_0x3d8df1.style.transition = 'opacity 0.2s ease, transform 0.2s ease'),
          (_0x3d8df1.style.opacity = _0x37ede6 ? '0' : ''),
          (_0x3d8df1.style.transform = _0x37ede6 ? 'scale(0.4)' : ''),
          (_0x3d8df1.style.pointerEvents = _0x37ede6 ? 'none' : ''));
      }
      if (document.activeElement !== this.promptEl && _0x36fe81.prompt !== undefined) {
        const _0x3c3159 = sanitizePromptHtml(_0x36fe81.prompt || '');
        this.promptEl.innerHTML !== _0x3c3159 && ((this.promptEl.innerHTML = _0x3c3159), _0x48ce81(this));
      }
      (this._syncPromptPlaceholder?.(_0x36fe81),
        this._syncPromptBoxSizeFromData?.(_0x36fe81),
        this._generationNodeHelpTip?.sync());
      const _0xe2c84f = this.modelWrap?.querySelector('.img-model-label');
      if (_0xe2c84f && _0x36fe81.model) _0xe2c84f.textContent = _0x481c2f(_0x36fe81.model);
      this._applyModelParamVisibility(_0x36fe81);
      const _0x53f971 = getImageNodeRootClass(_0x36fe81.model),
        _0x5cb6d0 = isRhPersonReplaceWorkflowModel(_0x36fe81.model);
      this._root &&
        (this._root.classList.toggle('rh-anime-real-node', _0x53f971 === 'rh-anime-real-node'),
        _0x53f971 && _0x53f971 !== 'rh-anime-real-node' && this._root.classList.add(_0x53f971),
        _0x5cb6d0
          ? this._root.classList.add('rh-person-replace-v3-node')
          : this._root.classList.remove('rh-person-replace-v3-node'));
      const _0x54cabd = this._shouldRenderRefBarNow(_0x3f8fa4, _0x4033f5),
        _0x36e005 = _0xc4985d.getIncomingEdges(this.nodeId),
        _0x5f8d0c = _0x3f8fa4.nodes || {};
      syncAdaptiveImageInputRatio(this, {
        store: _0xc4985d,
        nodeId: this.nodeId,
        inEdges: _0x36e005,
        nodes: _0x5f8d0c,
        targetNodeData: _0x5f8d0c?.[this.nodeId] || _0x36fe81 || {},
      });
      if (this._rendererMediaDeferred === true || !_0x54cabd) this._renderRefBarPendingWhenVisible = true;
      else {
        const _0x3b3ea7 = [..._0x36e005],
          _0x516367 = _0x3b3ea7
            .map((_0x5e6654) => {
              const _0x19333a = _0x5f8d0c[_0x5e6654.sourceId] || null,
                _0x3dccc6 =
                  _0x19333a &&
                  (typeof _0x19333a._bizRev === 'number' || typeof _0x19333a._bizRev === 'string')
                    ? String(_0x19333a._bizRev)
                    : '',
                _0x7d1412 = _0x19333a?.thumbId ? String(_0x19333a.thumbId) : '',
                _0x194689 = String(_0x19333a?.mask || '').trim() ? 'm1' : 'm0',
                _0x502a44 = String(_0x5e6654?.refSlot || ''),
                _0x3dfc93 = String(_0x5e6654?.sourceMediaKey || '');
              return (
                _0x5e6654.id +
                ':' +
                _0x5e6654.sourceId +
                ':' +
                _0x502a44 +
                ':' +
                _0x3dfc93 +
                ':' +
                _0x3dccc6 +
                ':' +
                _0x7d1412 +
                ':' +
                _0x194689
              );
            })
            .join('|');
        (_0x2221bf || _0x338f5e || this._renderRefBarPendingWhenVisible || _0x516367 !== this._lastEdgeSig) &&
          ((this._renderRefBarPendingWhenVisible = false),
          (this._lastEdgeSig = _0x516367),
          this._renderRefBar());
      }
      (!_0x2d2464 &&
        typeof this._maybeResumeRunningHubTaskImpl === 'function' &&
        this._maybeResumeRunningHubTaskImpl(),
        !_0x2d2464 &&
          typeof this._maybeResumeDreaminaTaskImpl === 'function' &&
          this._maybeResumeDreaminaTaskImpl(),
        !_0x2d2464 &&
          typeof this._maybeResumeAsyncTaskImpl === 'function' &&
          this._maybeResumeAsyncTaskImpl(),
        this._updateSubmitButtonState());
    }
    async ['_renderRefBar']() {
      if (!this.refBarEl) return;
      if (this._rendererMediaDeferred === true) return void (this._renderRefBarPendingWhenVisible = true);
      const _0x329146 = this._getStoreStateForRead(),
        _0x4fbb7d = _0x329146?.pickConnectMode || {};
      if (!this._shouldRenderRefBarNow(_0x329146, _0x4fbb7d)) {
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
      const _0x2a460b = this._getStoreStateForRead(),
        _0x142ce1 = Object.values(_0x2a460b.edges || {}),
        _0x2fc849 = _0x2a460b.nodes || {},
        _0x397d40 = _0xc4985d.getIncomingEdges(this.nodeId),
        _0x4393f8 = new Set();
      for (const _0x2c0098 of _0x397d40) {
        const _0x42fce0 = _0x2fc849[_0x2c0098.sourceId];
        for (const _0x3c1b56 of collectRefThumbIds(_0x42fce0)) {
          _0x4393f8.add(_0x3c1b56);
        }
      }
      for (const [_0x5d7611, _0x1dc656] of this._refThumbObjectUrls.entries()) {
        !_0x4393f8.has(_0x5d7611) &&
          (_0x1dc656 && String(_0x1dc656).startsWith('blob:') && URL.revokeObjectURL(_0x1dc656),
          this._refThumbObjectUrls.delete(_0x5d7611));
      }
      const _0x560828 = getImageNodeInputGate(this._data?.model),
        _0x2911e8 = String(_0x560828.kind || '').trim(),
        _0x46c5e2 = Number(_0x560828.max),
        _0x86d620 = isRhPersonReplaceWorkflowModel(this._data?.model),
        _0x4fb9a8 = getImageInputGateUploadedUrl(this._data, _0x560828),
        _0x4f33d0 = _0x2fc849?.[this.nodeId] || this._data || {},
        _0x18f9c4 = getTargetInputPolicy(_0x4f33d0),
        _0x40a9e1 = getFixedInputSlotConfigFromManifest(_0x4f33d0);
      syncAdaptiveImageInputRatio(this, {
        store: _0xc4985d,
        nodeId: this.nodeId,
        inEdges: _0x397d40,
        nodes: _0x2fc849,
        targetNodeData: _0x4f33d0,
      });
      const _0x5c7e36 = createPromptAttachmentButtonHTML({ stroke: 'var(--white-80)' }),
        _0x34797b = () => {
          let _0x24849b = this.refBarEl.querySelector('.prompt-attachment-btn'),
            _0x2b88fd = this.refBarEl.querySelector('.ref-thumb-container');
          return (
            (!_0x24849b || !_0x2b88fd) &&
              ((this.refBarEl.innerHTML = _0x5c7e36 + ' <div class="ref-thumb-container"></div>'),
              (_0x24849b = this.refBarEl.querySelector('.prompt-attachment-btn')),
              (_0x2b88fd = this.refBarEl.querySelector('.ref-thumb-container')),
              (this._attachBtnIcon = _0x24849b ? _0x24849b.querySelector('.btn-icon') : null)),
            { attachBtn: _0x24849b, thumbContainer: _0x2b88fd }
          );
        };
      let _0x79c9be = [];
      const _0x42bcd7 = { text: 0, image: 0, video: 0, audio: 0 },
        _0x4ac0a6 = {};
      for (const _0x3e33e2 of _0x397d40) {
        const _0x98976a = _0x2fc849[_0x3e33e2.sourceId];
        if (!_0x98976a) continue;
        const _0x1c38ec = resolveEffectiveInputKind(_0x98976a, _0x3e33e2);
        if (!_0x1c38ec) continue;
        if (!isInputKindAllowed(_0x18f9c4, _0x1c38ec)) continue;
        if (_0x2911e8 && _0x1c38ec !== _0x2911e8) continue;
        if (_0x2911e8 && Number.isFinite(_0x46c5e2) && _0x42bcd7[_0x2911e8] >= _0x46c5e2) continue;
        if (_0x86d620 && _0x1c38ec !== 'image') continue;
        if (_0x86d620 && _0x42bcd7.image >= 2) continue;
        _0x42bcd7[_0x1c38ec]++;
        const _0x3186a4 = {
            text: t('aigenImage.refs.types.text'),
            image: t('aigenImage.refs.types.image'),
            video: t('aigenImage.refs.types.video'),
            audio: t('aigenImage.refs.types.audio'),
          },
          _0xc8fd68 = '@' + _0x3186a4[_0x1c38ec] + _0x42bcd7[_0x1c38ec];
        _0x4ac0a6[_0x3e33e2.sourceId] = _0xc8fd68;
        let _0x57bf30 = '',
          _0x2bee4b = '',
          _0x4ac241 = '';
        if (_0x1c38ec === 'image') {
          let _0x1289c6 = '';
          for (const _0x18da54 of collectRefThumbIds(_0x98976a)) {
            _0x1289c6 = await this._resolveRefThumbObjectUrl(_0x18da54);
            if (_0x1289c6) break;
          }
          ({ thumbSrc: _0x2bee4b, previewSrc: _0x4ac241 } = resolveRefImageRenderSources(_0x98976a, {
            thumbBlobUrl: _0x1289c6,
          }));
        }
        let _0x147503 = resolveCanvasImageDisplayUrl(_0x98976a);
        if (!_0x147503 && _0x98976a.thumbId) {
          if (this._refThumbObjectUrls.has(_0x98976a.thumbId))
            _0x147503 = this._refThumbObjectUrls.get(_0x98976a.thumbId);
          else {
            const _0xb00104 = await _0x9434a6(_0x98976a.thumbId);
            if (_0xb00104) {
              const _0x278e57 = URL.createObjectURL(_0xb00104);
              (this._refThumbObjectUrls.set(_0x98976a.thumbId, _0x278e57), (_0x147503 = _0x278e57));
            }
          }
        }
        if (!_0x147503) {
          const _0x269683 = resolveRefImageCandidateUrls(_0x98976a);
          _0x147503 = _0x269683[0] || '';
        }
        _0x1c38ec === 'image' && (_0x147503 = _0x2bee4b || _0x147503);
        if (_0x1c38ec === 'image' && _0x147503) {
          _0x8dcb84(_0x147503);
          _0x4ac241 && _0x4ac241 !== _0x147503 && _0x8dcb84(_0x4ac241);
          const _0x290673 = !!String(_0x98976a.mask || '').trim();
          _0x57bf30 =
            '<img src="' +
            _0x147503 +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            (_0x290673
              ? '<span class="ref-thumb-mask-badge">' + t('aigenImage.refs.maskBadge') + '</span>'
              : '');
        } else {
          if (_0x1c38ec === 'text') {
            const _0x650316 = _0x98976a.type === 'ai-text';
            if (_0x650316 && !_0x98976a.outputText) continue;
            _0x57bf30 = createReferenceFallbackThumbHtml('text');
          } else {
            if (_0x1c38ec === 'video')
              _0x57bf30 =
                '<div class="ref-thumb-media" style="background:var(--bg);display:flex;align-items:center;justify-content:center;">\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>\n                </div>';
            else _0x1c38ec === 'audio' && (_0x57bf30 = createReferenceFallbackThumbHtml('audio'));
          }
        }
        if (_0x57bf30) {
          const _0x4a6a5f = String(_0x98976a.mask || '').trim() ? 'm1' : 'm0',
            _0x144abe =
              _0x1c38ec +
              '|' +
              _0x3e33e2.id +
              '|' +
              _0x3e33e2.sourceId +
              '|' +
              (_0x147503 || '') +
              '|' +
              _0x4a6a5f;
          _0x79c9be.push({
            key: 'edge:' + _0x3e33e2.id,
            edgeId: _0x3e33e2.id,
            sourceId: _0x3e33e2.sourceId,
            refSlot: _0x3e33e2.refSlot || '',
            type: _0x1c38ec,
            label: _0xc8fd68,
            sig: _0x144abe,
            thumbHTML: _0x57bf30,
            thumbSrc: _0x2bee4b || _0x147503 || '',
            previewSrc: _0x4ac241 || _0x147503 || '',
          });
        }
      }
      (isRunningHubWorkflowNode(_0x4f33d0) || _0x40a9e1) &&
        getAssetInputRefsFromPromptAndNode(this.promptEl, {
          nodeData: _0x4f33d0,
          allowedTypes: ['image'],
        }).forEach((_0x33b6e5, _0x5d7de1) => {
          const _0x1766ac = resolveEffectiveInputKind(_0x33b6e5);
          if (_0x1766ac !== 'image' || !isInputKindAllowed(_0x18f9c4, _0x1766ac)) return;
          const _0x164294 = String(_0x33b6e5.thumbUrl || _0x33b6e5.url || '').trim();
          if (!_0x164294) return;
          _0x8dcb84(_0x164294);
          const _0x3fd260 = String(_0x33b6e5.assetId || ''),
            _0x5500cc = String(_0x33b6e5.itemIndex ?? ''),
            _0x55abd4 = String(_0x33b6e5.assetMentionOccurrence ?? ''),
            _0x2dece6 = String(_0x33b6e5.assetRefSource || 'prompt'),
            _0x55f50e = 'asset:' + _0x3fd260 + ':' + _0x5500cc,
            _0x23cb87 = 'asset:' + _0x2dece6 + ':' + _0x3fd260 + ':' + _0x5500cc + ':image:' + _0x5d7de1;
          _0x79c9be.push({
            key: _0x23cb87,
            edgeId: '',
            sourceId: _0x55f50e,
            refSlot: '',
            type: 'image',
            label: _0x33b6e5.label || _0x33b6e5.name || t('aigenImage.refs.referenceImage'),
            sig: _0x23cb87 + '|' + String(_0x33b6e5.url || '') + '|' + _0x164294,
            thumbHTML: '<img src="' + _0x164294 + '" class="ref-thumb-media is-pending" draggable="false">',
            thumbSrc: _0x164294,
            previewSrc: String(_0x33b6e5.url || _0x164294),
            virtual: true,
            assetId: _0x3fd260,
            assetIndex: _0x5500cc,
            assetOccurrence: _0x55abd4,
            assetRefSource: _0x2dece6,
            refType: 'image',
          });
        });
      if (_0x86d620) {
        const _0x22e1d1 = ['replaceTarget', 'replacedImage'],
          _0x4b2810 = () => {
            const _0x2fe4c2 = !!this.refBarEl.querySelector('[data-ref-slot="replaceTarget"]'),
              _0x10baf4 = !!this.refBarEl.querySelector('[data-ref-slot="replacedImage"]');
            let _0x22d031 = this.refBarEl.querySelector('.prompt-attachment-btn'),
              _0x25a4b3 = this.refBarEl.querySelector('.ref-thumb-container');
            if (!_0x22d031 || !_0x25a4b3 || !_0x2fe4c2 || !_0x10baf4) {
              const _0x3dce54 = t('aigenImage.refs.replaceTarget'),
                _0x563b0b = t('aigenImage.refs.replacedImage');
              ((this.refBarEl.innerHTML =
                _0x5c7e36 +
                ' <div class="ref-thumb-container"><div class="ref-thumb-wrap ref-upload-slot" data-ref-slot="replaceTarget" data-slot="replaceTarget" data-kind="image" draggable="false" title="' +
                escapeRefBarHtml(_0x3dce54) +
                '"><span class="ref-upload-label">' +
                formatRefUploadLabel(_0x3dce54) +
                '</span></div><div class="ref-thumb-wrap ref-upload-slot" data-ref-slot="replacedImage" data-slot="replacedImage" data-kind="image" draggable="false" title="' +
                escapeRefBarHtml(_0x563b0b) +
                '"><span class="ref-upload-label">' +
                formatRefUploadLabel(_0x563b0b) +
                '</span></div></div>'),
                (_0x22d031 = this.refBarEl.querySelector('.prompt-attachment-btn')),
                (_0x25a4b3 = this.refBarEl.querySelector('.ref-thumb-container')),
                (this._attachBtnIcon = _0x22d031 ? _0x22d031.querySelector('.btn-icon') : null));
            }
            const _0x29cad8 = this.refBarEl.querySelector('[data-ref-slot="replaceTarget"]'),
              _0x53e41f = this.refBarEl.querySelector('[data-ref-slot="replacedImage"]');
            return { targetEl: _0x29cad8, sourceEl: _0x53e41f, container: _0x25a4b3 };
          },
          { targetEl: _0xc51452, sourceEl: _0x25a0e7, container: _0x2d2e46 } = _0x4b2810();
        ((this._lastRefHTML = '__rh-person-replace-v3__'), this.refBarEl.classList.add('active'));
        const _0x1fdc51 = (_0x1e30d9) => String(_0x1e30d9?.key || _0x1e30d9?.edgeId || ''),
          _0x559b1d = new Set(),
          _0x54f970 = new Map(),
          _0x9072ff = [
            {
              key: _0x22e1d1[0],
              el: _0xc51452,
              title: t('aigenImage.refs.replaceTarget'),
              emptyHtml: formatRefUploadLabel(t('aigenImage.refs.replaceTarget')),
            },
            {
              key: _0x22e1d1[1],
              el: _0x25a0e7,
              title: t('aigenImage.refs.replacedImage'),
              emptyHtml: formatRefUploadLabel(t('aigenImage.refs.replacedImage')),
            },
          ];
        for (const _0xd541c8 of _0x79c9be) {
          const _0x4e0d2d = _0x1fdc51(_0xd541c8);
          if (!_0x4e0d2d || _0x559b1d.has(_0x4e0d2d)) continue;
          const _0x187053 = String(_0xd541c8.refSlot || '');
          if (!_0x22e1d1.includes(_0x187053)) continue;
          if (_0x54f970.has(_0x187053)) continue;
          (_0x54f970.set(_0x187053, _0xd541c8), _0x559b1d.add(_0x4e0d2d));
        }
        for (const _0x505a44 of _0x79c9be) {
          const _0x1aee47 = _0x1fdc51(_0x505a44);
          if (!_0x1aee47 || _0x559b1d.has(_0x1aee47)) continue;
          for (const _0x488467 of _0x22e1d1) {
            if (!_0x54f970.has(_0x488467)) {
              (_0x54f970.set(_0x488467, _0x505a44), _0x559b1d.add(_0x1aee47));
              break;
            }
          }
        }
        const _0x13d3ed = (_0x21f9fd, _0x41c935, _0xe040ee) => {
            const _0x38ff71 = document.createElement('div');
            return (
              (_0x38ff71.className = 'ref-thumb-wrap ref-upload-slot'),
              (_0x38ff71.dataset.refSlot = _0x21f9fd),
              (_0x38ff71.dataset.slot = _0x21f9fd),
              (_0x38ff71.dataset.kind = 'image'),
              (_0x38ff71.title = _0x41c935),
              _0x38ff71.setAttribute('draggable', 'false'),
              (_0x38ff71.innerHTML = '<span class="ref-upload-label">' + _0xe040ee + '</span>'),
              _0x38ff71
            );
          },
          _0x367a26 = (_0x29fc9a, _0x2f0e0e, _0x10461a) => {
            const _0xaffd28 = document.createElement('div');
            return (
              (_0xaffd28.className = 'ref-thumb-wrap' + (_0x10461a.virtual ? ' ref-thumb-wrap--asset' : '')),
              (_0xaffd28.dataset.refSlot = _0x29fc9a),
              (_0xaffd28.dataset.slot = _0x29fc9a),
              (_0xaffd28.dataset.kind = 'image'),
              (_0xaffd28.title = _0x2f0e0e),
              _0xaffd28.setAttribute('draggable', _0x10461a.virtual ? 'false' : 'true'),
              _0xaffd28
            );
          };
        for (const _0x2887e9 of _0x9072ff) {
          const _0x399155 = _0x54f970.get(_0x2887e9.key) || null;
          let _0x42aeba = _0x2887e9.el;
          if (!_0x42aeba) continue;
          if (_0x399155 && _0x42aeba.classList?.contains?.('ref-upload-slot')) {
            const _0x148aca = _0x367a26(_0x2887e9.key, _0x2887e9.title, _0x399155);
            (_0x42aeba.replaceWith(_0x148aca), (_0x42aeba = _0x148aca), (_0x2887e9.el = _0x148aca));
          } else {
            if (!_0x399155 && !_0x42aeba.classList?.contains?.('ref-upload-slot')) {
              const _0x1fd081 = _0x13d3ed(_0x2887e9.key, _0x2887e9.title, _0x2887e9.emptyHtml);
              (_0x42aeba.replaceWith(_0x1fd081), (_0x42aeba = _0x1fd081), (_0x2887e9.el = _0x1fd081));
            }
          }
          ((_0x42aeba.dataset.refSlot = _0x2887e9.key),
            (_0x42aeba.dataset.slot = _0x2887e9.key),
            (_0x42aeba.dataset.kind = 'image'),
            (_0x42aeba.title = _0x2887e9.title));
          if (_0x399155) {
            ((_0x42aeba.className = 'ref-thumb-wrap' + (_0x399155.virtual ? ' ref-thumb-wrap--asset' : '')),
              _0x42aeba.classList?.remove?.('ref-upload-slot'),
              _0x42aeba.setAttribute('draggable', _0x399155.virtual ? 'false' : 'true'),
              (_0x42aeba.dataset.refKey = _0x1fdc51(_0x399155)),
              (_0x42aeba.dataset.edgeId = _0x399155.edgeId || ''),
              (_0x42aeba.dataset.sourceId = _0x399155.sourceId || ''),
              (_0x42aeba.dataset.refOrigin = _0x399155.virtual ? 'asset' : 'node'));
            _0x399155.virtual
              ? ((_0x42aeba.dataset.assetId = _0x399155.assetId || ''),
                (_0x42aeba.dataset.assetIndex = _0x399155.assetIndex || ''),
                (_0x42aeba.dataset.assetOccurrence = _0x399155.assetOccurrence || ''),
                (_0x42aeba.dataset.assetRefSource = _0x399155.assetRefSource || 'prompt'),
                (_0x42aeba.dataset.refType = _0x399155.refType || _0x399155.type || ''))
              : (delete _0x42aeba.dataset.assetId,
                delete _0x42aeba.dataset.assetIndex,
                delete _0x42aeba.dataset.assetOccurrence,
                delete _0x42aeba.dataset.assetRefSource,
                delete _0x42aeba.dataset.refType);
            _0x42aeba.dataset.sig !== _0x399155.sig &&
              ((_0x42aeba.innerHTML =
                _0x399155.thumbHTML +
                '<button type="button" class="ref-thumb-delete" title="' +
                t('aigenImage.refs.removeReference') +
                '">&times;</button>'),
              (_0x42aeba.dataset.sig = _0x399155.sig),
              _0xf5be36(_0x42aeba, _0x399155.sig));
            if (_0x399155.thumbSrc) _0x42aeba.dataset.thumbSrc = _0x399155.thumbSrc;
            else delete _0x42aeba.dataset.thumbSrc;
            if (_0x399155.previewSrc) _0x42aeba.dataset.previewSrc = _0x399155.previewSrc;
            else delete _0x42aeba.dataset.previewSrc;
          } else {
            ((_0x42aeba.className = 'ref-thumb-wrap ref-upload-slot'),
              _0x42aeba.setAttribute('draggable', 'false'));
            if (_0x42aeba.dataset.refKey) delete _0x42aeba.dataset.refKey;
            if (_0x42aeba.dataset.edgeId) delete _0x42aeba.dataset.edgeId;
            if (_0x42aeba.dataset.sourceId) delete _0x42aeba.dataset.sourceId;
            if (_0x42aeba.dataset.refOrigin) delete _0x42aeba.dataset.refOrigin;
            if (_0x42aeba.dataset.assetId) delete _0x42aeba.dataset.assetId;
            if (_0x42aeba.dataset.assetIndex) delete _0x42aeba.dataset.assetIndex;
            if (_0x42aeba.dataset.assetOccurrence) delete _0x42aeba.dataset.assetOccurrence;
            if (_0x42aeba.dataset.assetRefSource) delete _0x42aeba.dataset.assetRefSource;
            if (_0x42aeba.dataset.refType) delete _0x42aeba.dataset.refType;
            if (_0x42aeba.dataset.sig) delete _0x42aeba.dataset.sig;
            if (_0x42aeba.dataset.thumbSrc) delete _0x42aeba.dataset.thumbSrc;
            if (_0x42aeba.dataset.previewSrc) delete _0x42aeba.dataset.previewSrc;
            const _0x580900 = '<span class="ref-upload-label">' + _0x2887e9.emptyHtml + '</span>';
            if (_0x42aeba.innerHTML !== _0x580900) _0x42aeba.innerHTML = _0x580900;
          }
        }
        (bindRefThumbFixedSlotDrag({
          owner: this,
          container: _0x2d2e46,
          store: _0xc4985d,
          nodeId: this.nodeId,
          acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
        }),
          this._syncBtnIconState(),
          _0x20f72a(this, {}));
        return;
      }
      if (
        _0x40a9e1 &&
        renderManifestFixedImageRefBar({
          owner: this,
          refBarEl: this.refBarEl,
          promptEl: this.promptEl,
          attachBtnHTML: _0x5c7e36,
          fixedInputConfig: _0x40a9e1,
          items: _0x79c9be,
          targetNodeData: _0x4f33d0,
          sourceIdToLabel: _0x4ac0a6,
          store: _0xc4985d,
          nodeId: this.nodeId,
          ensureThumbDecoded: _0x8dcb84,
          revealRefThumbMedia: _0xf5be36,
          syncPillLabels: _0x20f72a,
        })
      )
        return;
      if (this._isDraggingSorting) {
        (this._syncBtnIconState(), _0x20f72a(this, _0x4ac0a6));
        return;
      }
      if (_0x79c9be.length > 0) {
        (this.refBarEl.classList.add('active'), this.refBarEl.classList.remove('rh-v5-refbar'));
        const _0x270c89 = this._lastRefHTML;
        this._lastRefHTML = '__has-items__';
        const { thumbContainer: _0x35b596 } = _0x34797b();
        String(_0x270c89 || '').startsWith('__rh-') &&
          _0x35b596.querySelectorAll('.ref-thumb-wrap').forEach((_0x330392) => _0x330392.remove());
        (_0x35b596.querySelectorAll('.ref-upload-slot').forEach((_0xf576ac) => _0xf576ac.remove()),
          _0x35b596.querySelectorAll('.ref-thumb-wrap').forEach((_0x717c4) => {
            const _0x40c42e =
              String(_0x717c4?.dataset?.refKey || '').trim() ||
              (String(_0x717c4?.dataset?.edgeId || '').trim()
                ? 'edge:' + String(_0x717c4.dataset.edgeId).trim()
                : '');
            if (!_0x40c42e) _0x717c4.remove();
          }));
        const _0x199480 = new Map();
        _0x35b596.querySelectorAll('.ref-thumb-wrap').forEach((_0xce9b1a) => {
          const _0xb4ec7e = String(_0xce9b1a?.dataset?.edgeId || '').trim(),
            _0x5d1f2b =
              String(_0xce9b1a?.dataset?.refKey || '').trim() || (_0xb4ec7e ? 'edge:' + _0xb4ec7e : '');
          if (!_0x5d1f2b) return;
          _0x199480.set(_0x5d1f2b, _0xce9b1a);
        });
        const _0x4f52a8 = new Set();
        for (let _0x5ea01c = 0; _0x5ea01c < _0x79c9be.length; _0x5ea01c++) {
          const _0xad4d86 = _0x79c9be[_0x5ea01c],
            _0x2d8b1f = String(_0xad4d86.key || _0xad4d86.edgeId || '');
          if (!_0x2d8b1f) continue;
          let _0x4b5394 = _0x199480.get(_0x2d8b1f);
          !_0x4b5394 &&
            ((_0x4b5394 = document.createElement('div')),
            (_0x4b5394.className = 'ref-thumb-wrap' + (_0xad4d86.virtual ? ' ref-thumb-wrap--asset' : '')));
          _0x4b5394.setAttribute('draggable', _0xad4d86.virtual ? 'false' : 'true');
          _0x4b5394.dataset.sig !== _0xad4d86.sig &&
            ((_0x4b5394.innerHTML =
              _0xad4d86.thumbHTML +
              '<button type="button" class="ref-thumb-delete" title="' +
              t('aigenImage.refs.removeReference') +
              '">&times;</button>'),
            (_0x4b5394.dataset.sig = _0xad4d86.sig),
            _0xf5be36(_0x4b5394, _0xad4d86.sig));
          ((_0x4b5394.dataset.refKey = _0x2d8b1f),
            (_0x4b5394.dataset.edgeId = _0xad4d86.edgeId || ''),
            (_0x4b5394.dataset.sourceId = _0xad4d86.sourceId),
            (_0x4b5394.dataset.refOrigin = _0xad4d86.virtual ? 'asset' : 'node'));
          _0xad4d86.virtual
            ? ((_0x4b5394.dataset.assetId = _0xad4d86.assetId || ''),
              (_0x4b5394.dataset.assetIndex = _0xad4d86.assetIndex || ''),
              (_0x4b5394.dataset.assetOccurrence = _0xad4d86.assetOccurrence || ''),
              (_0x4b5394.dataset.assetRefSource = _0xad4d86.assetRefSource || 'prompt'),
              (_0x4b5394.dataset.refType = _0xad4d86.refType || _0xad4d86.type || ''))
            : (delete _0x4b5394.dataset.assetId,
              delete _0x4b5394.dataset.assetIndex,
              delete _0x4b5394.dataset.assetOccurrence,
              delete _0x4b5394.dataset.assetRefSource,
              delete _0x4b5394.dataset.refType);
          ((_0x4b5394.dataset.type = _0xad4d86.type),
            (_0x4b5394.dataset.label = _0xad4d86.label),
            (_0x4b5394.dataset.index = String(_0x5ea01c)));
          if (_0xad4d86.thumbSrc) _0x4b5394.dataset.thumbSrc = _0xad4d86.thumbSrc;
          else delete _0x4b5394.dataset.thumbSrc;
          if (_0xad4d86.previewSrc) _0x4b5394.dataset.previewSrc = _0xad4d86.previewSrc;
          else delete _0x4b5394.dataset.previewSrc;
          (_0x35b596.appendChild(_0x4b5394), _0x4f52a8.add(_0x2d8b1f));
        }
        for (const [_0x297901, _0xc15073] of _0x199480.entries()) {
          if (!_0x4f52a8.has(_0x297901)) _0xc15073.remove();
        }
        this._bindDragSort(this.refBarEl);
      } else {
        if (_0x2911e8 === 'image') {
          this.refBarEl.classList.remove('rh-v5-refbar');
          const _0x5cf002 = t('aigenImage.refs.uploadReference'),
            _0x5ae8d8 =
              _0x5c7e36 +
              ' <div class="ref-thumb-container">' +
              (_0x4fb9a8
                ? '<div class="ref-thumb-wrap ref-upload-slot" data-ref-src="upload"><img src="' +
                  _0x4fb9a8 +
                  '" class="ref-thumb-media" draggable="false"><button type="button" class="ref-upload-delete" title="' +
                  t('aigenImage.refs.removeReference') +
                  '">&times;</button></div>'
                : '<button type="button" class="ref-thumb-wrap ref-upload-slot" title="' +
                  escapeRefBarHtml(_0x5cf002) +
                  '"><span class="ref-upload-label">' +
                  formatRefUploadLabel(_0x5cf002) +
                  '</span></button>') +
              '</div>';
          if (this._lastRefHTML !== _0x5ae8d8) {
            ((this._lastRefHTML = _0x5ae8d8),
              this.refBarEl.classList.add('active'),
              (this.refBarEl.innerHTML = _0x5ae8d8));
            const _0x343766 = this.refBarEl.querySelector('.prompt-attachment-btn');
            this._attachBtnIcon = _0x343766 ? _0x343766.querySelector('.btn-icon') : null;
          }
        } else {
          (this.refBarEl.classList.remove('active'),
            this.refBarEl.classList.remove('rh-v5-refbar'),
            (this._lastRefHTML = '__empty__'));
          const { thumbContainer: _0x1a4ae0 } = _0x34797b();
          _0x1a4ae0.querySelectorAll('.ref-thumb-wrap').forEach((_0x1fcc58) => _0x1fcc58.remove());
        }
      }
      (this._syncBtnIconState(), _0x20f72a(this, _0x4ac0a6));
    }
    ['_syncBtnIconState']() {
      syncImageRefBarButtonIcon({
        refBarEl: this.refBarEl,
        pickMode: _0xc4985d.getState().pickConnectMode,
        nodeId: this.nodeId,
      });
    }
    ['_bindDragSort'](_0x575655) {
      bindImageRefThumbOrderDrag({ owner: this, refBar: _0x575655, store: _0xc4985d, nodeId: this.nodeId });
    }
  }
  return _0x4bdcfc.prototype;
}
