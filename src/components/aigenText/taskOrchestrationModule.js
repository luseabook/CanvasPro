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
function toLocalPathUrl(value) {
  return localPathToUrl(value);
}
function pickResultItem(list, item) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const key = Number(item),
    index = Number.isFinite(key) ? Math.max(0, Math.trunc(key)) : 0;
  return list[Math.min(index, list.length - 1)] || null;
}
function resolveImageRefUrl(result) {
  return resolveGenerationInputImageUrl(result);
}
function resolveVideoRefUrl(data) {
  const response = pickResultItem(data?.videos, data?.mainVideoIndex);
  return (
    [
      String(response?.videoUrl || '').trim(),
      String(response?.url || '').trim(),
      String(response?.src || '').trim(),
      toLocalPathUrl(response?.localPath),
      String(data?.videoUrl || '').trim(),
      String(data?.src || '').trim(),
      toLocalPathUrl(data?.localPath),
      String(data?.thumbUrl || '').trim(),
      String(data?.imageUrl || '').trim(),
      String(response?.thumbUrl || '').trim(),
      toLocalPathUrl(response?.thumbLocalPath),
      String(response?.poster || '').trim(),
    ].find(Boolean) || ''
  );
}
function resolveAudioRefUrl(options) {
  return (
    [
      String(options?.thumbUrl || '').trim(),
      String(options?.imageUrl || '').trim(),
      String(options?.src || '').trim(),
      toLocalPathUrl(options?.localPath),
      String(options?.audioUrl || '').trim(),
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
function getReferenceTypeLabel(target) {
  const source = {
    text: t('aigenText.refs.types.text'),
    image: t('aigenText.refs.types.image'),
    video: t('aigenText.refs.types.video'),
    audio: t('aigenText.refs.types.audio'),
    other: t('aigenText.refs.types.other'),
  };
  return source[target] || source.other;
}
function buildReferenceLabelAliases(next, current) {
  const entry = [
    '@' + getReferenceTypeLabel(next) + current,
    ...(REFERENCE_LABEL_ALIASES[next] || []).map((item2) => '@' + item2 + current),
  ];
  return Array.from(new Set(entry));
}
function isRunningHubImageToTextModel(record, payload) {
  return (
    payload === 'runninghub' &&
    isModelApiModel(record, payload) &&
    String(record || '').endsWith('/image-to-text')
  );
}
export function createAIGenTextNodeTaskOrchestrationModule(handle) {
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
  } = handle;
  class state {
    async ['_buildPayload'](value2 = null) {
      const config = store.getState(),
        list2 = store.getIncomingEdges(this.nodeId),
        scope = config.nodes || {},
        response2 = { text: [], image: [], video: [], audio: [] },
        input = { text: 0, image: 0, video: 0, audio: 0 };
      list2.forEach((item3) => {
        const response3 = scope[item3.sourceId];
        if (!response3) return;
        let type = '';
        const output = response3.type || '';
        if (output === 'text' || output === 'source-text' || output === 'ai-text') type = 'text';
        else {
          if (output === 'source-image' || output === 'ai-image') type = 'image';
          else {
            if (output === 'source-video' || output === 'video' || output === 'ai-video') type = 'video';
            else {
              if (output === 'source-audio' || output === 'audio' || output === 'ai-audio') type = 'audio';
              else type = 'other';
            }
          }
        }
        let content = '',
          url = '';
        if (type === 'text')
          content = response3.outputText || response3.text || response3.content || response3.prompt || '';
        else {
          if (type === 'image') {
            url = resolveImageRefUrl(response3);
            if (!url) return;
          } else {
            if (type === 'video') {
              url = resolveVideoRefUrl(response3);
              if (!url) return;
            } else {
              if (type === 'audio') {
                url = resolveAudioRefUrl(response3);
                if (!url) return;
              } else {
                url = String(response3.src || response3.imageUrl || '').trim();
                if (!url) return;
              }
            }
          }
        }
        input[type]++;
        const labels = buildReferenceLabelAliases(type, input[type]),
          label = labels[0];
        response2[type].push({
          label: label,
          labels: labels,
          content: content,
          url: url,
          used: false,
          type: type,
          sourceId: String(item3.sourceId || ''),
        });
      });
      const list3 = [...response2.text, ...response2.image, ...response2.video, ...response2.audio],
        value3 = {},
        value4 = {};
      list3.forEach((item4) => {
        (item4.labels || [item4.label]).forEach((item5) => {
          value3[item5.replace(/\s+/g, '')] = item4;
        });
        if (item4.sourceId) value4[item4.sourceId] = item4;
      });
      let inputUrls = [],
        inputImageUrls = [],
        inputVideoUrls = [];
      const inputRefs = [],
        mediaCounts = { image: 0, video: 0, audio: 0 },
        handler = (response4) => {
          if (!response4?.url) return;
          if (!inputUrls.includes(response4.url)) inputUrls.push(response4.url);
          (response4.type === 'image' &&
            !inputImageUrls.includes(response4.url) &&
            inputImageUrls.push(response4.url),
            response4.type === 'video' &&
              !inputVideoUrls.includes(response4.url) &&
              inputVideoUrls.push(response4.url));
        },
        handler2 = (enabled) => {
          let value5 = '';
          const run = (value6) => {
            for (const domNode of value6.childNodes) {
              if (domNode.nodeType === Node.TEXT_NODE) value5 += domNode.textContent;
              else {
                if (domNode.nodeType === Node.ELEMENT_NODE) {
                  if (domNode.classList.contains('ref-pill')) {
                    const value7 = domNode.dataset.nodeId || '',
                      rawLabel = domNode.dataset.label || domNode.textContent.trim(),
                      promptParts = [];
                    if (
                      appendAssetMentionToPrompt({
                        domNode: domNode,
                        rawLabel: rawLabel,
                        promptParts: promptParts,
                        inputRefs: inputRefs,
                        mediaCounts: mediaCounts,
                      })
                    ) {
                      ((value5 += promptParts.join('')), inputRefs.forEach(handler));
                      continue;
                    }
                    const value8 = rawLabel.replace(/\s+/g, ''),
                      response5 = (value7 && value4[value7]) || value3[value8];
                    if (response5) {
                      response5.used = true;
                      if (response5.content) value5 += ' ' + response5.content + ' ';
                      else response5.url && ((value5 += ' ' + rawLabel + ' '), handler(response5));
                    } else value5 += ' ' + rawLabel + ' ';
                  } else domNode.tagName === 'BR' ? (value5 += '\n') : run(domNode);
                }
              }
            }
          };
          if (!enabled) return '';
          run(enabled);
          let promptPresetTemplate = value5.replace(/[\s\u00A0]+/g, ' ').trim();
          return (
            value2
              ? (promptPresetTemplate = resolvePromptPresetTemplate(value2, promptPresetTemplate))
              : (promptPresetTemplate = promptPresetTemplate || ''),
            promptPresetTemplate
          );
        };
      let prompt = handler2(this.promptEl);
      const list4 = list3
        .flatMap((ref) => (ref.labels || [ref.label]).map((label2) => ({ ref: ref, label: label2 })))
        .sort((item6, value9) => value9.label.length - item6.label.length);
      list4.forEach(({ ref: ref2, label: label3 }) => {
        if (!ref2.used) {
          const regExp = new RegExp(
            label3.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\u00A0]*'),
            'g',
          );
          if (regExp.test(prompt)) {
            ref2.used = true;
            if (ref2.content) prompt = prompt.replace(regExp, ' ' + ref2.content + ' ');
            else ref2.url && ((prompt = prompt.replace(regExp, ' ' + label3.trim() + ' ')), handler(ref2));
          }
        }
      });
      let value10 = '';
      response2.text.forEach((enabled2) => {
        !enabled2.used && enabled2.content && ((value10 += enabled2.content + '\n'), (enabled2.used = true));
      });
      value10 && (prompt = value10 + prompt);
      list3.forEach((response6) => {
        !response6.used && response6.url && !inputUrls.includes(response6.url) && handler(response6);
      });
      if (!prompt) return (window.showToast?.(t('aigenText.task.promptRequired'), 'warn'), null);
      const model = this._data.model || 'apimart/kimi-k2-instruct';
      let provider = this._data.provider;
      !provider &&
        (provider =
          resolveModelProvider(model) ||
          ((model.startsWith('gemini') || model.startsWith('gpt') || model.startsWith('claude')) &&
          !model.includes('/')
            ? 'grsai'
            : 'openai'));
      const list5 = getCustomTextModels();
      list5.includes(model) && (provider = 'custom');
      if (isRunningHubImageToTextModel(model, provider) && inputImageUrls.length === 0)
        return (window.showToast?.(t('aigenText.task.imageReferenceRequired'), 'warn'), null);
      return {
        prompt: prompt,
        inputUrls: inputUrls,
        inputImageUrls: inputImageUrls,
        inputVideoUrls: inputVideoUrls,
        model: model,
        provider: provider,
        nodeId: this.nodeId,
      };
    }
    ['_getPreviewGenerateButtonLoadingOptions']() {
      return createPreviewGenerateButtonCallbacks(this, t('aigenText.generate'));
    }
    async ['runGeneration'](options2 = {}) {
      return this._onGenerate(null, options2);
    }
    ['cancelGeneration']() {
      return { ok: false, status: 'not-cancellable', message: 'Text generation is not cancellable yet.' };
    }
    ['getGenerationStatus']() {
      const value11 = store.getState?.()?.nodes?.[this.nodeId] || this._data || {},
        jobStatus = String(
          value11.jobStatus || value11.textJobStatus || (this._isGenerating ? 'running' : 'idle'),
        );
      return {
        nodeId: this.nodeId,
        jobStatus: jobStatus,
        isGenerating: this._isGenerating === true || jobStatus === 'running' || jobStatus === 'pending',
        taskId: String(value11.taskId || value11.asyncTaskId || ''),
        cancellable: false,
        resumable: false,
      };
    }
    async ['_onGenerate'](template = null, value12 = {}) {
      if (this._isGenerating) return;
      if (value12?.insertPrompt === true) {
        (insertPresetPromptIntoEditor({
          storeApi: store,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          template: template,
          inEdges: store.getIncomingEdges(this.nodeId),
          nodes: store.getState().nodes || {},
          allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        }),
          this._updateSubmitButtonState?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(template)) {
        const promptText = await this._buildPayload(template);
        if (!promptText) return;
        previewPresetPromptInEditor({
          storeApi: store,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          promptText: promptText.prompt,
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
      const provider2 = await this._buildPayload(template);
      if (!provider2) return;
      ((this._isGenerating = true), startLoading(this.previewEl));
      const startedAt = Date.now();
      this._updateSubmitButtonState?.();
      let response7 = null;
      try {
        response7 = await submitTask(
          {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'text-generation',
            provider: provider2.provider || this._data.provider || '',
            adapterType: 'modelApi',
            modelId: provider2.model || this._data.model || '',
            executionId:
              'text.' +
              (provider2.provider || this._data.provider || 'modelApi') +
              '.' +
              (provider2.model || this._data.model || 'default'),
            payload: provider2,
            cancellable: false,
            resumable: false,
            async: false,
            submit: () => api.generateText(provider2),
            resultBuilder: async (value13, startedAt2) => {
              const textGenerationResultPatch = buildTextGenerationResultPatch(value13, {
                  startedAt: startedAt2.startedAt,
                }),
                value14 = String(textGenerationResultPatch?.outputText || '').trim();
              return (
                value14 && this.outputEl && this._renderOutputText?.(value14),
                textGenerationResultPatch
              );
            },
            failureBuilder: (error, startedAt3) => {
              const textGenerationFailurePatch = buildTextGenerationFailurePatch({
                  error: error || t('aigenText.task.generationFailed'),
                  startedAt: startedAt3.startedAt,
                }),
                value15 = String(textGenerationFailurePatch?.outputText || '').trim();
              return (
                value15 && this.outputEl && this._renderOutputText?.(value15),
                textGenerationFailurePatch
              );
            },
            parseError: (error2) => error2?.message || t('aigenText.task.generationFailed'),
          },
          { store: store, startedAt: startedAt },
        );
        if (response7.status === 'failed') {
          const error3 = response7.error;
          (console.error('[AIGenTextNode] 生成失败:', error3),
            !isTextGenerationTimeoutError(error3) &&
              window.showToast?.(
                t('aigenText.task.generationFailedWithError', { error: error3?.message || error3 }),
                'error',
              ));
        }
        return response7;
      } finally {
        ((this._isGenerating = false), this._updateSubmitButtonState?.(), stopLoading(this.previewEl));
      }
    }
  }
  return state.prototype;
}
