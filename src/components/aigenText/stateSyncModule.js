import { sanitizePromptHtml } from '../../utils/dom.js';
import { createReferenceFallbackThumbHtml } from '../../modules/referenceThumbnailFallback.js';
import {
  createReferenceMaskBadgeHtml,
  getReferenceMaskSignaturePart,
  hasReferenceMask,
} from '../../modules/refThumbMaskBadge.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { createPromptAttachmentButtonHTML } from '../refAttachmentButton.js';
import { bindRefThumbOrderDrag } from '../../modules/refThumbDragController.js';
import { resolvePromptTextWithTextRefs } from '../../modules/nodePromptShared.js';
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
export function createAIGenTextNodeStateSyncModule(_0x26053f) {
  const {
    store: _0x468a83,
    api: _0x15e6b3,
    getDisplayModelName: _0x36aaf2,
    ensureThumbDecoded: _0x2ebbba,
    revealRefThumbMedia: _0x1d08e6,
    commit: _0x4b415e,
    TEXT_TOOLBAR_HTML: _0x43c042,
    bindTextToolbarEvents: _0x3af148,
    getPromptPresets: _0x36afb7,
    openCustomPresetsManager: _0x7ea72f,
    startLoading: _0x11e7f3,
    stopLoading: _0x1957a1,
    bindRefThumbHoverPreview: _0x4eacb3,
    checkSlashTrigger: _0x4f8090,
    handleSlashKeyboardNavigation: _0x42e6b3,
    closeSlashMenu: _0x5d736d,
    activateMenuKeyboard: _0xc4e4b2,
    _checkAtTrigger: _0x543664,
    _populateMentionMenu: _0x21cf01,
    _handleMentionMenuKeyboard: _0x6971d0,
    _handlePillKeyboard: _0x23f3da,
    _rehydratePromptPills: _0x4425ae,
    _handlePillHover: _0x398318,
    _handlePillOut: _0x4093ff,
    _syncEdgesOrderFromPills: _0x555343,
    _syncPillLabels: _0x244d60,
    getCustomTextModels: _0x1c5e28,
    saveCustomTextModels: _0x548aaa,
  } = _0x26053f;
  class _0xb5bcfc {
    ['_getEffectiveSubmitPromptText']() {
      const _0x5180c7 = typeof _0x468a83.getState === 'function' ? _0x468a83.getState() : {};
      return resolvePromptTextWithTextRefs({
        promptEl: this.promptEl,
        inEdges:
          typeof _0x468a83.getIncomingEdges === 'function' ? _0x468a83.getIncomingEdges(this.nodeId) : [],
        nodes: _0x5180c7?.nodes || {},
      });
    }
    ['_updateSubmitButtonState']() {
      if (!this.btnEl) return;
      const _0x959c53 = this._getEffectiveSubmitPromptText(),
        _0x3329d6 = _0x468a83.getState?.().nodes?.[this.nodeId] || this._data || {},
        _0x3a5ef4 = resolveGenerationButtonMode(
          this._isGenerating && _0x3329d6?.jobStatus !== 'error'
            ? { ..._0x3329d6, isGenerating: true, jobStatus: _0x3329d6.jobStatus || 'running' }
            : _0x3329d6,
          { cancellable: _0x3329d6?.taskCancellable === true },
        );
      if (_0x3a5ef4.busy) {
        (setGenerateButtonLoadingUi(this.btnEl, {
          title: t('aigenText.generate'),
          disabled: _0x3a5ef4.disabled,
          ariaLabel: t('aigenText.generate'),
        }),
          (this.btnEl.disabled = _0x3a5ef4.disabled),
          (this.btnEl.style.cursor = _0x3a5ef4.cursor));
        return;
      }
      (resetGenerateButtonIdleUi(this.btnEl, t('aigenText.generate')),
        !_0x959c53
          ? ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'))
          : ((this.btnEl.disabled = false), (this.btnEl.style.cursor = '')));
    }
    ['update'](_0x9683f4) {
      this._data = _0x9683f4;
      if (shouldShowGenerationBusyUi(_0x9683f4))
        ((this._isGenerating = true),
          this.previewEl && typeof _0x11e7f3 === 'function' && _0x11e7f3(this.previewEl));
      else
        isTaskTerminal(_0x9683f4) &&
          ((this._isGenerating = false),
          this.previewEl && typeof _0x1957a1 === 'function' && _0x1957a1(this.previewEl));
      const _0x5f059a = this.outputEl?.classList?.contains?.('is-text-selection-active') === true,
        _0x33b408 = this._outputScrollTopDirty === true,
        _0x51069b = String(_0x9683f4.outputText || ''),
        _0x5074eb = _0x51069b !== this._lastRenderedOutputText;
      !_0x5f059a &&
        !_0x33b408 &&
        Number.isFinite(_0x9683f4.outputScrollTop) &&
        (this._outputScrollTop = Math.max(0, _0x9683f4.outputScrollTop));
      const _0x123696 =
        this.outputEl &&
        document.activeElement === this.outputEl &&
        this.outputEl.getAttribute?.('contenteditable') === 'true';
      !_0x123696 && !_0x5f059a && _0x5074eb && this.outputEl && this._renderOutputText?.(_0x51069b);
      this.outputEl &&
        document.activeElement !== this.outputEl &&
        !_0x5f059a &&
        !_0x33b408 &&
        (this.outputEl.scrollTop = this._outputScrollTop);
      const _0x59cbc2 = _0x468a83.getState().pickConnectMode;
      if (this._placeholderEl) {
        const _0x376812 = this._placeholderEl.querySelector('.placeholder-icon-svg');
        _0x376812 &&
          (_0x59cbc2.active && _0x59cbc2.sourceNodeId === this.nodeId
            ? _0x376812.classList.add('is-pick-connecting')
            : _0x376812.classList.remove('is-pick-connecting'));
      }
      const _0x273c3a = this.refBarEl?.querySelector('.prompt-attachment-btn');
      if (_0x273c3a) {
        const _0x5afc75 = _0x273c3a.querySelector('.btn-icon');
        if (_0x5afc75) {
          const _0x359e10 = _0x59cbc2.active && _0x59cbc2.sourceNodeId === this.nodeId;
          ((_0x5afc75.style.transition = 'opacity 0.2s ease, transform 0.2s ease'),
            (_0x5afc75.style.opacity = _0x359e10 ? '0' : ''),
            (_0x5afc75.style.transform = _0x359e10 ? 'scale(0.4)' : ''));
        }
      }
      if (document.activeElement !== this.promptEl && _0x9683f4.prompt !== undefined) {
        const _0x497e71 = sanitizePromptHtml(_0x9683f4.prompt || '');
        this.promptEl?.innerHTML !== _0x497e71 && ((this.promptEl.innerHTML = _0x497e71), _0x4425ae(this));
      }
      this._syncPromptBoxSizeFromData?.(_0x9683f4);
      const _0x4a4e1f = this.modelWrap?.querySelector('.img-model-label');
      if (_0x4a4e1f && _0x9683f4.model) _0x4a4e1f.textContent = _0x36aaf2(_0x9683f4.model);
      const _0x596588 = _0x468a83.getState(),
        _0x277e5d = _0x596588.nodes || {},
        _0x5828c7 = _0x468a83.getIncomingEdges(this.nodeId),
        _0x37ce4f = (_0x3407a2, _0x26e165) => {
          if (!_0x3407a2) return '0';
          const _0x5b2695 = resolveEffectiveInputKind(_0x3407a2, _0x26e165),
            _0x3e53a7 = _0x3407a2._bizRev ?? '',
            _0x108fb2 = hasReferenceMask(_0x3407a2),
            _0x159a59 = !!String(
              _0x3407a2.outputText || _0x3407a2.text || _0x3407a2.content || _0x3407a2.prompt || '',
            ).trim(),
            _0x242b6f =
              !!_0x3407a2.thumbId ||
              !!_0x3407a2.thumbUrl ||
              !!_0x3407a2.imageUrl ||
              !!_0x3407a2.src ||
              !!_0x3407a2.localPath,
            _0x3e3c8d =
              (Array.isArray(_0x3407a2.videos) && _0x3407a2.videos.length > 0) ||
              !!_0x3407a2.thumbId ||
              !!_0x3407a2.thumbUrl ||
              !!_0x3407a2.videoUrl ||
              !!_0x3407a2.src ||
              !!_0x3407a2.localPath,
            _0x46f7e1 = !!_0x3407a2.audioUrl || !!_0x3407a2.src || !!_0x3407a2.localPath;
          if (_0x5b2695 === 'text') return 't:' + _0x3e53a7 + ':' + (_0x159a59 ? 1 : 0);
          if (_0x5b2695 === 'video') return 'v:' + _0x3e53a7 + ':' + (_0x3e3c8d ? 1 : 0);
          if (_0x5b2695 === 'audio') return 'a:' + _0x3e53a7 + ':' + (_0x46f7e1 ? 1 : 0);
          return 'i:' + _0x3e53a7 + ':' + (_0x242b6f ? 1 : 0) + ':' + (_0x108fb2 ? 1 : 0);
        },
        _0x4455cf = [..._0x5828c7],
        _0x56d727 = _0x4455cf
          .map(
            (_0xd9c5b0) =>
              _0xd9c5b0.id +
              ':' +
              _0xd9c5b0.sourceId +
              ':' +
              String(_0xd9c5b0?.refSlot || '') +
              ':' +
              String(_0xd9c5b0?.sourceMediaKey || '') +
              ':' +
              _0x37ce4f(_0x277e5d[_0xd9c5b0.sourceId], _0xd9c5b0),
          )
          .join('|');
      (_0x56d727 !== this._lastEdgeSig && ((this._lastEdgeSig = _0x56d727), this._renderRefBar()),
        this._updateSubmitButtonState());
    }
    ['_renderRefBar']() {
      if (!this.refBarEl) return;
      const _0x498309 = _0x468a83.getState(),
        _0x220386 = _0x498309.nodes || {},
        _0x37f6b2 = _0x468a83.getIncomingEdges(this.nodeId);
      this._lastInEdgeCount = _0x37f6b2.length;
      const _0x440b02 = createPromptAttachmentButtonHTML();
      if (_0x37f6b2.length === 0) {
        const _0x2cdae6 = _0x440b02;
        this._lastRefHTML !== _0x2cdae6 &&
          ((this._lastRefHTML = _0x2cdae6),
          this.refBarEl.classList.remove('active'),
          (this.refBarEl.innerHTML = _0x2cdae6));
        this._syncBtnIconState();
        return;
      }
      const _0x58e522 = { text: 0, image: 0, video: 0, audio: 0 },
        _0xe6daa5 = [],
        _0x2a6656 = {};
      _0x37f6b2.forEach((_0x1220c8) => {
        const _0xf3c828 = _0x220386[_0x1220c8.sourceId];
        if (!_0xf3c828) return;
        const _0x27be31 = resolveEffectiveInputKind(_0xf3c828, _0x1220c8) || 'other';
        _0x58e522[_0x27be31] = (_0x58e522[_0x27be31] || 0) + 1;
        const _0x46efbb = {
            text: t('aigenText.refs.types.text'),
            image: t('aigenText.refs.types.image'),
            video: t('aigenText.refs.types.video'),
            audio: t('aigenText.refs.types.audio'),
            group: t('aigenText.refs.types.group'),
            other: t('aigenText.refs.types.other'),
          },
          _0x26abed = '@' + _0x46efbb[_0x27be31] + _0x58e522[_0x27be31];
        _0x2a6656[_0x1220c8.sourceId] = _0x26abed;
        let _0x4ce6b7 = '';
        if (_0x27be31 === 'image' && _0xf3c828.src)
          _0x4ce6b7 =
            '<img src="' +
            _0xf3c828.src +
            '" class="ref-thumb-media" draggable="false">' +
            createReferenceMaskBadgeHtml(_0xf3c828);
        else {
          if (_0x27be31 === 'image' && _0xf3c828.imageUrl)
            _0x4ce6b7 =
              '<img src="' +
              _0xf3c828.imageUrl +
              '" class="ref-thumb-media" draggable="false">' +
              createReferenceMaskBadgeHtml(_0xf3c828);
          else {
            if (_0x27be31 === 'text') {
              const _0x3fc11f = String(
                _0xf3c828.outputText || _0xf3c828.text || _0xf3c828.content || _0xf3c828.prompt || '',
              ).trim();
              if (!_0x3fc11f) return;
              _0x4ce6b7 = createReferenceFallbackThumbHtml('text');
            } else {
              if (_0x27be31 === 'video') {
                const _0xab1fce =
                  (Array.isArray(_0xf3c828.videos) && _0xf3c828.videos.length > 0) ||
                  !!_0xf3c828.thumbId ||
                  !!_0xf3c828.thumbUrl ||
                  !!_0xf3c828.videoUrl ||
                  !!_0xf3c828.src ||
                  !!_0xf3c828.localPath;
                if (!_0xab1fce) return;
                _0x4ce6b7 =
                  '<div class="ref-thumb-media" style="background:var(--bg-node);display:flex;align-items:center;justify-content:center;">\n                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n                </div>';
              } else {
                if (_0x27be31 === 'audio') {
                  const _0x110c7a = !!_0xf3c828.audioUrl || !!_0xf3c828.src || !!_0xf3c828.localPath;
                  if (!_0x110c7a) return;
                  _0x4ce6b7 = createReferenceFallbackThumbHtml('audio');
                } else {
                  if (_0x27be31 === 'group' || _0x27be31 === 'other') {
                    const _0x2c3a20 = _0x27be31 === 'group',
                      _0x3aac0a = _0x2c3a20 ? _0xf3c828.color || 'var(--indigo)' : 'var(--text-muted)',
                      _0x259033 = (
                        _0xf3c828.name ||
                        (_0x2c3a20 ? t('aigenText.refs.groupShortName') : t('aigenText.refs.nodeShortName'))
                      )
                        .substring(0, 2)
                        .toUpperCase();
                    _0x4ce6b7 =
                      '<div class="ref-thumb-media" style="display:flex;align-items:center;justify-content:center;background:' +
                      _0x3aac0a +
                      '33;border:1px solid ' +
                      _0x3aac0a +
                      '80;box-sizing:border-box;">\n                    <span style="color:' +
                      _0x3aac0a +
                      ';font-size:12px;font-weight:bold;letter-spacing:1px;user-select:none;">' +
                      _0x259033 +
                      '</span>\n                </div>';
                  }
                }
              }
            }
          }
        }
        _0x4ce6b7 &&
          _0xe6daa5.push({
            edgeId: _0x1220c8.id,
            sourceId: _0x1220c8.sourceId,
            type: _0x27be31,
            label: _0x26abed,
            index: _0xe6daa5.length,
            sig:
              _0x27be31 +
              '|' +
              _0x1220c8.id +
              '|' +
              _0x1220c8.sourceId +
              '|' +
              _0x4ce6b7 +
              '|' +
              getReferenceMaskSignaturePart(_0xf3c828),
            thumbHTML: _0x4ce6b7,
          });
      });
      if (_0xe6daa5.length === 0) {
        const _0x1182c8 = _0x440b02;
        this._lastRefHTML !== _0x1182c8 &&
          ((this._lastRefHTML = _0x1182c8),
          this.refBarEl.classList.remove('active'),
          (this.refBarEl.innerHTML = _0x1182c8));
        (this._syncBtnIconState(), _0x244d60(this, _0x2a6656));
        return;
      }
      if (this._isDraggingSorting) {
        (this._syncBtnIconState(), _0x244d60(this, _0x2a6656));
        return;
      }
      ((this._lastRefHTML = '__has-items__'), this.refBarEl.classList.add('active'));
      let _0x51f26f = this.refBarEl.querySelector('.prompt-attachment-btn'),
        _0x2aff4b = this.refBarEl.querySelector('.ref-thumb-container');
      (!_0x51f26f || !_0x2aff4b) &&
        ((this.refBarEl.innerHTML = _0x440b02 + ' <div class="ref-thumb-container"></div>'),
        (_0x51f26f = this.refBarEl.querySelector('.prompt-attachment-btn')),
        (_0x2aff4b = this.refBarEl.querySelector('.ref-thumb-container')));
      const _0x1ab261 = new Map();
      _0x2aff4b
        .querySelectorAll('.ref-thumb-wrap')
        .forEach((_0x1e1dcd) => _0x1ab261.set(String(_0x1e1dcd?.dataset?.edgeId || ''), _0x1e1dcd));
      const _0x4b731b = new Set();
      for (const _0x193130 of _0xe6daa5) {
        const _0x14a45f = String(_0x193130.edgeId || '');
        if (!_0x14a45f) continue;
        let _0x2a2dfd = _0x1ab261.get(_0x14a45f);
        (!_0x2a2dfd &&
          ((_0x2a2dfd = document.createElement('div')), (_0x2a2dfd.className = 'ref-thumb-wrap')),
          _0x2a2dfd.setAttribute('draggable', 'true'),
          _0x2a2dfd.dataset.sig !== _0x193130.sig &&
            ((_0x2a2dfd.innerHTML =
              _0x193130.thumbHTML +
              '<button type="button" class="ref-thumb-delete" title="' +
              t('aigenText.refs.removeReference') +
              '">&times;</button>'),
            (_0x2a2dfd.dataset.sig = _0x193130.sig),
            _0x1d08e6(_0x2a2dfd, _0x193130.sig)),
          (_0x2a2dfd.dataset.edgeId = _0x14a45f),
          (_0x2a2dfd.dataset.sourceId = _0x193130.sourceId || ''),
          (_0x2a2dfd.dataset.type = _0x193130.type || ''),
          (_0x2a2dfd.dataset.label = _0x193130.label || ''),
          (_0x2a2dfd.dataset.index = String(_0x193130.index ?? '')),
          _0x2aff4b.appendChild(_0x2a2dfd),
          _0x4b731b.add(_0x14a45f));
      }
      for (const [_0x505d4c, _0xa1ea76] of _0x1ab261.entries()) {
        if (!_0x4b731b.has(_0x505d4c)) _0xa1ea76.remove();
      }
      (this._bindDragSort(this.refBarEl), this._syncBtnIconState(), _0x244d60(this, _0x2a6656));
    }
    ['_syncBtnIconState']() {
      const _0x44cd7c = _0x468a83.getState().pickConnectMode,
        _0x375559 = this.refBarEl?.querySelector('.btn-icon');
      if (!_0x375559) return;
      _0x44cd7c && _0x44cd7c.active && _0x44cd7c.sourceNodeId === this.nodeId
        ? ((_0x375559.style.opacity = '0'),
          (_0x375559.style.transform = 'scale(0.4)'),
          (_0x375559.style.transition = 'opacity 0.2s ease, transform 0.2s ease'))
        : ((_0x375559.style.opacity = ''), (_0x375559.style.transform = ''));
    }
    ['_bindDragSort'](_0x5234f0) {
      bindRefThumbOrderDrag({ owner: this, container: _0x5234f0, store: _0x468a83, nodeId: this.nodeId });
    }
  }
  return _0xb5bcfc.prototype;
}
