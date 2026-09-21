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
  constructor(_0xc057e7) {
    ((this._data = _0xc057e7),
      (this.nodeId = _0xc057e7.id),
      (this.previewEl = null),
      (this.outputEl = null),
      (this.refBarEl = null),
      (this.promptEl = null),
      (this.btnEl = null),
      (this.modelWrap = null),
      (this._dragSrcIdx = null),
      (this._dragBounds = []),
      (this._lastEdgeSig = null),
      (this._outputScrollTop = Number.isFinite(_0xc057e7?.outputScrollTop)
        ? Math.max(0, _0xc057e7.outputScrollTop)
        : 0),
      (this._outputScrollTopDirty = false),
      (this._outputScrollTopCommitTimer = null),
      (this._lastRenderedOutputText = ''),
      (this._footerControllerCleanup = null));
  }
  ['_checkAtTrigger'](_0x3bc691) {
    return _checkAtTrigger(this, _0x3bc691);
  }
  ['_populateMentionMenu'](
    _0x5dd532,
    _0x3ec9eb,
    _0x3cee25,
    _0x29c9ea = '',
    _0x571eec = -1,
    _0x5ea83f = null,
  ) {
    return _populateMentionMenu(this, {
      x: _0x5dd532,
      y: _0x3ec9eb,
      triggerRange: _0x3cee25,
      query: _0x29c9ea,
      atIndex: _0x571eec,
      pillToEdit: _0x5ea83f,
    });
  }
  ['_handlePillKeyboard'](_0x43b734) {
    return _handlePillKeyboard(this, _0x43b734);
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
function applyClassPrototypeMethods(_0x507846, _0xfba237) {
  if (!_0xfba237) return;
  const _0xaf3995 = Object.getOwnPropertyDescriptors(_0xfba237);
  (delete _0xaf3995.constructor, Object.defineProperties(_0x507846, _0xaf3995));
}
(applyClassPrototypeMethods(AIGenTextNode.prototype, aiGenTextNodeUiModule),
  applyClassPrototypeMethods(AIGenTextNode.prototype, aiGenTextNodeStateSyncModule),
  applyClassPrototypeMethods(AIGenTextNode.prototype, aiGenTextNodeTaskOrchestrationModule));
export function _renderSharedRefBar(_0x5d7e5f) {
  if (!_0x5d7e5f.refBarEl) return;
  const _0x313833 = appStore.getState(),
    _0x478086 = _0x313833.nodes || {},
    _0x3044a3 = appStore.getIncomingEdges(_0x5d7e5f.nodeId);
  let _0x11a4eb = { text: 0, image: 0, video: 0, audio: 0 };
  const _0x44fb0e = {},
    _0x2d98a1 = createPromptAttachmentButtonHTML();
  if (_0x5d7e5f._isDraggingSorting) {
    _syncPillLabels(_0x5d7e5f, _0x44fb0e);
    return;
  }
  const _0x59d04f = (_0x252c00) => {
      return localPathToUrl(_0x252c00);
    },
    _0x4af7a6 = (_0x17efc0) => {
      const _0x4e9afe = String(_0x17efc0 || '')
        .trim()
        .toLowerCase();
      if (!_0x4e9afe) return false;
      if (_0x4e9afe.startsWith('data:image/')) return true;
      return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i.test(_0x4e9afe);
    },
    _0xd1e6d3 = (_0xf79a46) => {
      return (
        String(_0xf79a46?.src || '').trim() ||
        _0x59d04f(_0xf79a46?.localPath) ||
        String(_0xf79a46?.imageUrl || '').trim() ||
        String(_0xf79a46?.thumbUrl || '').trim()
      );
    },
    _0x155883 = (_0xf53948) => {
      const _0x2f77db = Number.isFinite(Number(_0xf53948?.mainVideoIndex))
          ? Math.max(0, Math.trunc(Number(_0xf53948.mainVideoIndex)))
          : 0,
        _0x1d4753 = Array.isArray(_0xf53948?.videos)
          ? _0xf53948.videos[_0x2f77db] || _0xf53948.videos[0]
          : null,
        _0x1fa6b0 = [
          String(_0x1d4753?.thumbUrl || '').trim(),
          String(_0xf53948?.thumbUrl || '').trim(),
          String(_0xf53948?.firstFrameUrl || '').trim(),
          String(_0xf53948?.firstFrameThumbUrl || '').trim(),
          String(_0xf53948?.imageUrl || '').trim(),
          String(_0xf53948?.src || '').trim(),
          _0x59d04f(_0x1d4753?.localPath),
          _0x59d04f(_0xf53948?.localPath),
          String(_0x1d4753?.videoUrl || '').trim(),
          String(_0xf53948?.videoUrl || '').trim(),
        ].filter(Boolean);
      return _0x1fa6b0.find((_0x521f37) => _0x4af7a6(_0x521f37)) || '';
    },
    _0x3e63eb = (_0x4e225f) => {
      const _0x4f7952 = [
        String(_0x4e225f?.thumbUrl || '').trim(),
        String(_0x4e225f?.imageUrl || '').trim(),
        String(_0x4e225f?.src || '').trim(),
        _0x59d04f(_0x4e225f?.localPath),
        String(_0x4e225f?.audioUrl || '').trim(),
      ].filter(Boolean);
      return _0x4f7952.find((_0x4d3e50) => _0x4af7a6(_0x4d3e50)) || '';
    },
    _0x4c12af = [];
  for (const _0x4f84e3 of _0x3044a3) {
    const _0x4740ac = _0x478086[_0x4f84e3.sourceId];
    if (!_0x4740ac) continue;
    const _0x3a6037 = _0x4740ac.type || '';
    let _0x3e2d3b = '';
    if (_0x3a6037 === 'text' || _0x3a6037 === 'source-text' || _0x3a6037 === 'ai-text')
      (_0x11a4eb.text++, (_0x3e2d3b = 'text'));
    else {
      if (_0x3a6037 === 'source-image' || _0x3a6037 === 'ai-image')
        (_0x11a4eb.image++, (_0x3e2d3b = 'image'));
      else {
        if (_0x3a6037 === 'source-video' || _0x3a6037 === 'video' || _0x3a6037 === 'ai-video')
          (_0x11a4eb.video++, (_0x3e2d3b = 'video'));
        else
          (_0x3a6037 === 'source-audio' || _0x3a6037 === 'audio' || _0x3a6037 === 'ai-audio') &&
            (_0x11a4eb.audio++, (_0x3e2d3b = 'audio'));
      }
    }
    if (_0x3e2d3b) {
      const _0x50a4d4 = {
          text: t('aigenText.refs.types.text'),
          image: t('aigenText.refs.types.image'),
          video: t('aigenText.refs.types.video'),
          audio: t('aigenText.refs.types.audio'),
        },
        _0x2a9622 = '@' + (_0x50a4d4[_0x3e2d3b] || _0x3e2d3b) + _0x11a4eb[_0x3e2d3b];
      _0x44fb0e[_0x4f84e3.sourceId] = _0x2a9622;
    }
    let _0x59bb40 = '';
    if (_0x3a6037 === 'source-image') {
      const _0x3c978b = _0xd1e6d3(_0x4740ac);
      if (_0x3c978b) ensureThumbDecoded(_0x3c978b);
      const _0x244369 = !!String(_0x4740ac.mask || '').trim();
      _0x59bb40 = _0x3c978b
        ? '<img src="' +
          _0x3c978b +
          '" class="ref-thumb-media is-pending" draggable="false">' +
          (_0x244369 ? '<span class="ref-thumb-mask-badge">' + t('aigenText.refs.maskBadge') + '</span>' : '')
        : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>';
    } else {
      if (_0x3a6037 === 'ai-image') {
        const _0x887bda = _0xd1e6d3(_0x4740ac),
          _0xdeeed0 = !!String(_0x4740ac.mask || '').trim();
        if (_0x887bda) ensureThumbDecoded(_0x887bda);
        _0x59bb40 = _0x887bda
          ? '<img src="' +
            _0x887bda +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            (_0xdeeed0
              ? '<span class="ref-thumb-mask-badge">' + t('aigenText.refs.maskBadge') + '</span>'
              : '')
          : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>';
      } else {
        if (_0x3a6037 === 'source-text' || _0x3a6037 === 'text')
          _0x59bb40 = createReferenceFallbackThumbHtml('text');
        else {
          if (_0x3a6037 === 'ai-text') {
            const _0x1922af = String(
              _0x4740ac.outputText || _0x4740ac.text || _0x4740ac.content || _0x4740ac.prompt || '',
            ).trim();
            if (!_0x1922af) continue;
            _0x59bb40 = createReferenceFallbackThumbHtml('text');
          } else {
            if (_0x3a6037 === 'source-video' || _0x3a6037 === 'video' || _0x3a6037 === 'ai-video') {
              const _0xdc4ac1 = _0x155883(_0x4740ac);
              if (_0xdc4ac1) ensureThumbDecoded(_0xdc4ac1);
              _0x59bb40 = _0xdc4ac1
                ? '<img src="' + _0xdc4ac1 + '" class="ref-thumb-media is-pending" draggable="false">'
                : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="var(--bg-node-dark)" /><polygon points="8,6 19,12 8,18" fill="var(--text-secondary)" /></svg></div>';
            } else {
              if (_0x3a6037 === 'source-audio' || _0x3a6037 === 'audio' || _0x3a6037 === 'ai-audio') {
                const _0x257f89 = _0x3e63eb(_0x4740ac);
                if (_0x257f89) ensureThumbDecoded(_0x257f89);
                _0x59bb40 = _0x257f89
                  ? '<img src="' + _0x257f89 + '" class="ref-thumb-media is-pending" draggable="false">'
                  : createReferenceFallbackThumbHtml('audio');
              }
            }
          }
        }
      }
    }
    if (!_0x59bb40) continue;
    const _0x571cd8 = String(_0x4740ac.mask || '').trim() ? 'm1' : 'm0',
      _0x50ceab = Number.isFinite(Number(_0x4740ac.mainVideoIndex))
        ? Math.max(0, Math.trunc(Number(_0x4740ac.mainVideoIndex)))
        : 0,
      _0x3d1e96 = Array.isArray(_0x4740ac.videos) ? _0x4740ac.videos[_0x50ceab] || _0x4740ac.videos[0] : null,
      _0x279289 =
        _0x3a6037 +
        '|' +
        _0x4f84e3.id +
        '|' +
        _0x4f84e3.sourceId +
        '|' +
        (_0x4740ac.src ||
          _0x4740ac.imageUrl ||
          _0x4740ac.thumbUrl ||
          _0x4740ac.videoUrl ||
          _0x4740ac.audioUrl ||
          '') +
        '|' +
        (_0x4740ac.localPath || '') +
        '|' +
        (_0x4740ac.thumbId || '') +
        '|' +
        (_0x3d1e96?.thumbUrl || '') +
        '|' +
        (_0x3d1e96?.localPath || '') +
        '|' +
        (_0x3d1e96?.videoUrl || '') +
        '|' +
        _0x571cd8;
    _0x4c12af.push({ edgeId: _0x4f84e3.id, sourceId: _0x4f84e3.sourceId, sig: _0x279289, thumb: _0x59bb40 });
  }
  if (_0x4c12af.length === 0) {
    const _0x4211c4 = !!_0x5d7e5f.refBarEl.querySelector('.ref-thumb-wrap'),
      _0x1c5a5d = !!_0x5d7e5f.refBarEl.querySelector('.ref-thumb-container');
    (_0x5d7e5f._lastRefHTML !== _0x2d98a1 || _0x4211c4 || _0x1c5a5d) &&
      ((_0x5d7e5f._lastRefHTML = _0x2d98a1),
      _0x5d7e5f.refBarEl.classList.remove('active'),
      (_0x5d7e5f.refBarEl.innerHTML = _0x2d98a1));
    _syncPillLabels(_0x5d7e5f, _0x44fb0e);
    return;
  }
  ((_0x5d7e5f._lastRefHTML = '__has-items__'), _0x5d7e5f.refBarEl.classList.add('active'));
  let _0x3820d2 = _0x5d7e5f.refBarEl.querySelector('.prompt-attachment-btn'),
    _0x247d33 = _0x5d7e5f.refBarEl.querySelector('.ref-thumb-container');
  (!_0x3820d2 || !_0x247d33) &&
    ((_0x5d7e5f.refBarEl.innerHTML = _0x2d98a1 + ' <div class="ref-thumb-container"></div>'),
    (_0x3820d2 = _0x5d7e5f.refBarEl.querySelector('.prompt-attachment-btn')),
    (_0x247d33 = _0x5d7e5f.refBarEl.querySelector('.ref-thumb-container')));
  const _0x2f4ee6 = new Map();
  _0x247d33
    .querySelectorAll('.ref-thumb-wrap')
    .forEach((_0x2638ae) => _0x2f4ee6.set(_0x2638ae.dataset.edgeId, _0x2638ae));
  const _0x59b607 = new Set();
  for (const _0x4df95a of _0x4c12af) {
    let _0xbd8852 = _0x2f4ee6.get(_0x4df95a.edgeId);
    (!_0xbd8852 && ((_0xbd8852 = document.createElement('div')), (_0xbd8852.className = 'ref-thumb-wrap')),
      _0xbd8852.dataset.sig !== _0x4df95a.sig &&
        ((_0xbd8852.innerHTML =
          _0x4df95a.thumb +
          '<button type="button" class="ref-thumb-delete" title="' +
          t('aigenText.refs.remove') +
          '">×</button>'),
        (_0xbd8852.dataset.sig = _0x4df95a.sig),
        revealRefThumbMedia(_0xbd8852, _0x4df95a.sig)),
      (_0xbd8852.dataset.edgeId = _0x4df95a.edgeId),
      (_0xbd8852.dataset.sourceId = _0x4df95a.sourceId),
      _0x247d33.appendChild(_0xbd8852),
      _0x59b607.add(_0x4df95a.edgeId));
  }
  for (const [_0x1e66e6, _0x2d09e3] of _0x2f4ee6.entries()) {
    if (!_0x59b607.has(_0x1e66e6)) _0x2d09e3.remove();
  }
  _syncPillLabels(_0x5d7e5f, _0x44fb0e);
}
