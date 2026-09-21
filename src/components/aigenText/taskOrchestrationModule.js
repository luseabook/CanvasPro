import {
  appendAssetMentionToPrompt,
  insertPresetPromptIntoEditor,
  previewPresetPromptInEditor,
  shouldUsePromptPreviewForPreset,
} from '../../modules/nodePromptShared.js';
import { resolvePromptPresetTemplate } from '../../modules/promptPresetTemplate.js';
import {
  isPreviewModeEnabled,
  isPreviewNodeLoading,
  startPreviewNodeLoading,
} from '../../modules/previewMode.js';
import { createPreviewGenerateButtonCallbacks } from '../../modules/previewGenerateButtonUi.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
import { submitTask } from '../../core/generationTaskRuntime.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { isModelApiModel, resolveModelProvider } from '../../manifests/index.js';
import {
  buildTextGenerationFailurePatch,
  buildTextGenerationResultPatch,
  isTextGenerationTimeoutError,
} from './textGenerationResultRenderer.js';
import { t } from '../../i18n/index.js';
function toLocalPathUrl(_0x37758f) {
  return localPathToUrl(_0x37758f);
}
function pickResultItem(_0x34e496, _0x3acf8f) {
  if (!Array.isArray(_0x34e496) || _0x34e496.length === 0) return null;
  const _0x502330 = Number(_0x3acf8f),
    _0x3529a3 = Number.isFinite(_0x502330) ? Math.max(0, Math.trunc(_0x502330)) : 0;
  return _0x34e496[Math.min(_0x3529a3, _0x34e496.length - 1)] || null;
}
function resolveImageRefUrl(_0x52256d) {
  return resolveGenerationInputImageUrl(_0x52256d);
}
function resolveVideoRefUrl(_0x4451e0) {
  const _0x3e26ab = pickResultItem(_0x4451e0?.videos, _0x4451e0?.mainVideoIndex);
  return (
    [
      String(_0x3e26ab?.videoUrl || '').trim(),
      String(_0x3e26ab?.url || '').trim(),
      String(_0x3e26ab?.src || '').trim(),
      toLocalPathUrl(_0x3e26ab?.localPath),
      String(_0x4451e0?.videoUrl || '').trim(),
      String(_0x4451e0?.src || '').trim(),
      toLocalPathUrl(_0x4451e0?.localPath),
      String(_0x4451e0?.thumbUrl || '').trim(),
      String(_0x4451e0?.imageUrl || '').trim(),
      String(_0x3e26ab?.thumbUrl || '').trim(),
      toLocalPathUrl(_0x3e26ab?.thumbLocalPath),
      String(_0x3e26ab?.poster || '').trim(),
    ].find(Boolean) || ''
  );
}
function resolveAudioRefUrl(_0x17bec5) {
  return (
    [
      String(_0x17bec5?.thumbUrl || '').trim(),
      String(_0x17bec5?.imageUrl || '').trim(),
      String(_0x17bec5?.src || '').trim(),
      toLocalPathUrl(_0x17bec5?.localPath),
      String(_0x17bec5?.audioUrl || '').trim(),
    ].find(Boolean) || ''
  );
}
const REFERENCE_LABEL_ALIASES = Object.freeze({
  text: Object.freeze(['文本', 'Text']),
  image: Object.freeze(['图片', 'Image']),
  video: Object.freeze(['视频', 'Video']),
  audio: Object.freeze(['音频', 'Audio']),
  other: Object.freeze(['节点', 'Node']),
});
function getReferenceTypeLabel(_0x30bc59) {
  const _0x2c5680 = {
    text: t('aigenText.refs.types.text'),
    image: t('aigenText.refs.types.image'),
    video: t('aigenText.refs.types.video'),
    audio: t('aigenText.refs.types.audio'),
    other: t('aigenText.refs.types.other'),
  };
  return _0x2c5680[_0x30bc59] || _0x2c5680.other;
}
function buildReferenceLabelAliases(_0x3e8406, _0x1d3ea0) {
  const _0x453469 = [
    '@' + getReferenceTypeLabel(_0x3e8406) + _0x1d3ea0,
    ...(REFERENCE_LABEL_ALIASES[_0x3e8406] || []).map((_0x2b60cb) => '@' + _0x2b60cb + _0x1d3ea0),
  ];
  return Array.from(new Set(_0x453469));
}
function isRunningHubImageToTextModel(_0x504ac3, _0x15af5d) {
  return (
    _0x15af5d === 'runninghub' &&
    isModelApiModel(_0x504ac3, _0x15af5d) &&
    String(_0x504ac3 || '').endsWith('/image-to-text')
  );
}
export function createAIGenTextNodeTaskOrchestrationModule(_0x605324) {
  const {
    store: _0x2f8dc8,
    api: _0x224985,
    getDisplayModelName: _0x1be779,
    ensureThumbDecoded: _0x4f8e92,
    revealRefThumbMedia: _0x37a085,
    commit: _0x2ee007,
    TEXT_TOOLBAR_HTML: _0x3b00d9,
    bindTextToolbarEvents: _0x4a60c7,
    getPromptPresets: _0x241105,
    openCustomPresetsManager: _0x5ca281,
    startLoading: _0x708bc3,
    stopLoading: _0x320307,
    bindRefThumbHoverPreview: _0x47f21a,
    checkSlashTrigger: _0xe6c3e9,
    handleSlashKeyboardNavigation: _0x5edf0a,
    closeSlashMenu: _0x33be2e,
    activateMenuKeyboard: _0x139097,
    _checkAtTrigger: _0x28b2aa,
    _populateMentionMenu: _0x197cd6,
    _handleMentionMenuKeyboard: _0x340da4,
    _handlePillKeyboard: _0x29fa3d,
    _rehydratePromptPills: _0x4afe48,
    _handlePillHover: _0x150de8,
    _handlePillOut: _0x5154a9,
    _syncEdgesOrderFromPills: _0x3b22ac,
    _syncPillLabels: _0x3a6cb1,
    getCustomTextModels: _0x34c666,
    saveCustomTextModels: _0xa98717,
  } = _0x605324;
  class _0x5b3494 {
    async ['_buildPayload'](_0xb432f2 = null) {
      const _0x59b591 = _0x2f8dc8.getState(),
        _0x1f6cae = _0x2f8dc8.getIncomingEdges(this.nodeId),
        _0x2073e4 = _0x59b591.nodes || {},
        _0x538d5e = { text: [], image: [], video: [], audio: [] },
        _0x3672bc = { text: 0, image: 0, video: 0, audio: 0 };
      _0x1f6cae.forEach((_0x31a452) => {
        const _0x379579 = _0x2073e4[_0x31a452.sourceId];
        if (!_0x379579) return;
        let _0x3a3c6d = '';
        const _0x1c44f6 = _0x379579.type || '';
        if (_0x1c44f6 === 'text' || _0x1c44f6 === 'source-text' || _0x1c44f6 === 'ai-text')
          _0x3a3c6d = 'text';
        else {
          if (_0x1c44f6 === 'source-image' || _0x1c44f6 === 'ai-image') _0x3a3c6d = 'image';
          else {
            if (_0x1c44f6 === 'source-video' || _0x1c44f6 === 'video' || _0x1c44f6 === 'ai-video')
              _0x3a3c6d = 'video';
            else {
              if (_0x1c44f6 === 'source-audio' || _0x1c44f6 === 'audio' || _0x1c44f6 === 'ai-audio')
                _0x3a3c6d = 'audio';
              else _0x3a3c6d = 'other';
            }
          }
        }
        let _0x234a1a = '',
          _0x3f6879 = '';
        if (_0x3a3c6d === 'text')
          _0x234a1a = _0x379579.outputText || _0x379579.text || _0x379579.content || _0x379579.prompt || '';
        else {
          if (_0x3a3c6d === 'image') {
            _0x3f6879 = resolveImageRefUrl(_0x379579);
            if (!_0x3f6879) return;
          } else {
            if (_0x3a3c6d === 'video') {
              _0x3f6879 = resolveVideoRefUrl(_0x379579);
              if (!_0x3f6879) return;
            } else {
              if (_0x3a3c6d === 'audio') {
                _0x3f6879 = resolveAudioRefUrl(_0x379579);
                if (!_0x3f6879) return;
              } else {
                _0x3f6879 = String(_0x379579.src || _0x379579.imageUrl || '').trim();
                if (!_0x3f6879) return;
              }
            }
          }
        }
        _0x3672bc[_0x3a3c6d]++;
        const _0x4dfc74 = buildReferenceLabelAliases(_0x3a3c6d, _0x3672bc[_0x3a3c6d]),
          _0x796188 = _0x4dfc74[0];
        _0x538d5e[_0x3a3c6d].push({
          label: _0x796188,
          labels: _0x4dfc74,
          content: _0x234a1a,
          url: _0x3f6879,
          used: false,
          type: _0x3a3c6d,
          sourceId: String(_0x31a452.sourceId || ''),
        });
      });
      const _0x48be19 = [..._0x538d5e.text, ..._0x538d5e.image, ..._0x538d5e.video, ..._0x538d5e.audio],
        _0x123636 = {},
        _0x291449 = {};
      _0x48be19.forEach((_0x477052) => {
        (_0x477052.labels || [_0x477052.label]).forEach((_0x3b07e2) => {
          _0x123636[_0x3b07e2.replace(/\s+/g, '')] = _0x477052;
        });
        if (_0x477052.sourceId) _0x291449[_0x477052.sourceId] = _0x477052;
      });
      let _0x1f8e8d = [],
        _0x50558f = [],
        _0x466a0d = [];
      const _0x444fca = [],
        _0x1264d5 = { image: 0, video: 0, audio: 0 },
        _0x23dea0 = (_0x3ce0b9) => {
          if (!_0x3ce0b9?.url) return;
          if (!_0x1f8e8d.includes(_0x3ce0b9.url)) _0x1f8e8d.push(_0x3ce0b9.url);
          (_0x3ce0b9.type === 'image' && !_0x50558f.includes(_0x3ce0b9.url) && _0x50558f.push(_0x3ce0b9.url),
            _0x3ce0b9.type === 'video' &&
              !_0x466a0d.includes(_0x3ce0b9.url) &&
              _0x466a0d.push(_0x3ce0b9.url));
        },
        _0x2edd0d = (_0x22a903) => {
          let _0x58cdb6 = '';
          const _0x2bb04c = (_0x69e9bb) => {
            for (const _0x520e6b of _0x69e9bb.childNodes) {
              if (_0x520e6b.nodeType === Node.TEXT_NODE) _0x58cdb6 += _0x520e6b.textContent;
              else {
                if (_0x520e6b.nodeType === Node.ELEMENT_NODE) {
                  if (_0x520e6b.classList.contains('ref-pill')) {
                    const _0x149459 = _0x520e6b.dataset.nodeId || '',
                      _0x41949e = _0x520e6b.dataset.label || _0x520e6b.textContent.trim(),
                      _0x902abb = [];
                    if (
                      appendAssetMentionToPrompt({
                        domNode: _0x520e6b,
                        rawLabel: _0x41949e,
                        promptParts: _0x902abb,
                        inputRefs: _0x444fca,
                        mediaCounts: _0x1264d5,
                      })
                    ) {
                      ((_0x58cdb6 += _0x902abb.join('')), _0x444fca.forEach(_0x23dea0));
                      continue;
                    }
                    const _0x1b28b6 = _0x41949e.replace(/\s+/g, ''),
                      _0x58eaea = (_0x149459 && _0x291449[_0x149459]) || _0x123636[_0x1b28b6];
                    if (_0x58eaea) {
                      _0x58eaea.used = true;
                      if (_0x58eaea.content) _0x58cdb6 += ' ' + _0x58eaea.content + ' ';
                      else _0x58eaea.url && ((_0x58cdb6 += ' ' + _0x41949e + ' '), _0x23dea0(_0x58eaea));
                    } else _0x58cdb6 += ' ' + _0x41949e + ' ';
                  } else _0x520e6b.tagName === 'BR' ? (_0x58cdb6 += '\n') : _0x2bb04c(_0x520e6b);
                }
              }
            }
          };
          if (!_0x22a903) return '';
          _0x2bb04c(_0x22a903);
          let _0x32767f = _0x58cdb6.replace(/[\s\u00A0]+/g, ' ').trim();
          return (
            _0xb432f2
              ? (_0x32767f = resolvePromptPresetTemplate(_0xb432f2, _0x32767f))
              : (_0x32767f = _0x32767f || ''),
            _0x32767f
          );
        };
      let _0x3a18ee = _0x2edd0d(this.promptEl);
      const _0x12c2bc = _0x48be19
        .flatMap((_0x40dad3) =>
          (_0x40dad3.labels || [_0x40dad3.label]).map((_0x30da12) => ({ ref: _0x40dad3, label: _0x30da12 })),
        )
        .sort((_0x54b630, _0x3b0948) => _0x3b0948.label.length - _0x54b630.label.length);
      _0x12c2bc.forEach(({ ref: _0x3b5fae, label: _0x2f473d }) => {
        if (!_0x3b5fae.used) {
          const _0xd71838 = new RegExp(
            _0x2f473d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\u00A0]*'),
            'g',
          );
          if (_0xd71838.test(_0x3a18ee)) {
            _0x3b5fae.used = true;
            if (_0x3b5fae.content) _0x3a18ee = _0x3a18ee.replace(_0xd71838, ' ' + _0x3b5fae.content + ' ');
            else
              _0x3b5fae.url &&
                ((_0x3a18ee = _0x3a18ee.replace(_0xd71838, ' ' + _0x2f473d.trim() + ' ')),
                _0x23dea0(_0x3b5fae));
          }
        }
      });
      let _0x2d44c2 = '';
      _0x538d5e.text.forEach((_0x5354f4) => {
        !_0x5354f4.used &&
          _0x5354f4.content &&
          ((_0x2d44c2 += _0x5354f4.content + '\n'), (_0x5354f4.used = true));
      });
      _0x2d44c2 && (_0x3a18ee = _0x2d44c2 + _0x3a18ee);
      _0x48be19.forEach((_0x219d20) => {
        !_0x219d20.used && _0x219d20.url && !_0x1f8e8d.includes(_0x219d20.url) && _0x23dea0(_0x219d20);
      });
      if (!_0x3a18ee) return (window.showToast?.(t('aigenText.task.promptRequired'), 'warn'), null);
      const _0xbf8bd7 = this._data.model || 'apimart/kimi-k2-instruct';
      let _0x32edac = this._data.provider;
      !_0x32edac &&
        (_0x32edac =
          resolveModelProvider(_0xbf8bd7) ||
          ((_0xbf8bd7.startsWith('gemini') ||
            _0xbf8bd7.startsWith('gpt') ||
            _0xbf8bd7.startsWith('claude')) &&
          !_0xbf8bd7.includes('/')
            ? 'grsai'
            : 'openai'));
      const _0x3f5e5e = _0x34c666();
      _0x3f5e5e.includes(_0xbf8bd7) && (_0x32edac = 'custom');
      if (isRunningHubImageToTextModel(_0xbf8bd7, _0x32edac) && _0x50558f.length === 0)
        return (window.showToast?.(t('aigenText.task.imageReferenceRequired'), 'warn'), null);
      return {
        prompt: _0x3a18ee,
        inputUrls: _0x1f8e8d,
        inputImageUrls: _0x50558f,
        inputVideoUrls: _0x466a0d,
        model: _0xbf8bd7,
        provider: _0x32edac,
        nodeId: this.nodeId,
      };
    }
    ['_getPreviewGenerateButtonLoadingOptions']() {
      return createPreviewGenerateButtonCallbacks(this, t('aigenText.generate'));
    }
    async ['runGeneration'](_0x1f52c4 = {}) {
      return this._onGenerate(null, _0x1f52c4);
    }
    ['cancelGeneration']() {
      return { ok: false, status: 'not-cancellable', message: 'Text generation is not cancellable yet.' };
    }
    ['getGenerationStatus']() {
      const _0x528e1c = _0x2f8dc8.getState?.()?.nodes?.[this.nodeId] || this._data || {},
        _0x3e1f90 = String(
          _0x528e1c.jobStatus || _0x528e1c.textJobStatus || (this._isGenerating ? 'running' : 'idle'),
        );
      return {
        nodeId: this.nodeId,
        jobStatus: _0x3e1f90,
        isGenerating: this._isGenerating === true || _0x3e1f90 === 'running' || _0x3e1f90 === 'pending',
        taskId: String(_0x528e1c.taskId || _0x528e1c.asyncTaskId || ''),
        cancellable: false,
        resumable: false,
      };
    }
    async ['_onGenerate'](_0x36a7bd = null, _0x4cf71d = {}) {
      if (this._isGenerating) return;
      if (_0x4cf71d?.insertPrompt === true) {
        (insertPresetPromptIntoEditor({
          storeApi: _0x2f8dc8,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          template: _0x36a7bd,
          inEdges: _0x2f8dc8.getIncomingEdges(this.nodeId),
          nodes: _0x2f8dc8.getState().nodes || {},
          allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        }),
          this._updateSubmitButtonState?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(_0x36a7bd)) {
        const _0x40f0e8 = await this._buildPayload(_0x36a7bd);
        if (!_0x40f0e8) return;
        previewPresetPromptInEditor({
          storeApi: _0x2f8dc8,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          promptText: _0x40f0e8.prompt,
        });
        return;
      }
      if (isPreviewModeEnabled()) {
        !isPreviewNodeLoading(this.nodeId) &&
          startPreviewNodeLoading(
            this.nodeId,
            this.previewEl,
            this._getPreviewGenerateButtonLoadingOptions(),
          );
        return;
      }
      const _0x2ae2de = await this._buildPayload(_0x36a7bd);
      if (!_0x2ae2de) return;
      ((this._isGenerating = true), _0x708bc3(this.previewEl));
      const _0xbd65a6 = Date.now();
      this._updateSubmitButtonState?.();
      let _0x31c321 = null;
      try {
        _0x31c321 = await submitTask(
          {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'text-generation',
            provider: _0x2ae2de.provider || this._data.provider || '',
            adapterType: 'modelApi',
            modelId: _0x2ae2de.model || this._data.model || '',
            executionId:
              'text.' +
              (_0x2ae2de.provider || this._data.provider || 'modelApi') +
              '.' +
              (_0x2ae2de.model || this._data.model || 'default'),
            payload: _0x2ae2de,
            cancellable: false,
            resumable: false,
            async: false,
            submit: () => _0x224985.generateText(_0x2ae2de),
            resultBuilder: async (_0x152672, _0x2cad54) => {
              const _0x4d377d = buildTextGenerationResultPatch(_0x152672, { startedAt: _0x2cad54.startedAt }),
                _0x366f02 = String(_0x4d377d?.outputText || '').trim();
              return (_0x366f02 && this.outputEl && this._renderOutputText?.(_0x366f02), _0x4d377d);
            },
            failureBuilder: (_0x45dac7, _0x151d98) => {
              const _0x3bfd68 = buildTextGenerationFailurePatch({
                  error: _0x45dac7 || t('aigenText.task.generationFailed'),
                  startedAt: _0x151d98.startedAt,
                }),
                _0x450e35 = String(_0x3bfd68?.outputText || '').trim();
              return (_0x450e35 && this.outputEl && this._renderOutputText?.(_0x450e35), _0x3bfd68);
            },
            parseError: (_0x5e6e1d) => _0x5e6e1d?.message || t('aigenText.task.generationFailed'),
          },
          { store: _0x2f8dc8, startedAt: _0xbd65a6 },
        );
        if (_0x31c321.status === 'failed') {
          const _0x21bac2 = _0x31c321.error;
          (console.error('[AIGenTextNode] 生成失败:', _0x21bac2),
            !isTextGenerationTimeoutError(_0x21bac2) &&
              window.showToast?.(
                t('aigenText.task.generationFailedWithError', { error: _0x21bac2?.message || _0x21bac2 }),
                'error',
              ));
        }
        return _0x31c321;
      } finally {
        ((this._isGenerating = false), this._updateSubmitButtonState?.(), _0x320307(this.previewEl));
      }
    }
  }
  return _0x5b3494.prototype;
}
