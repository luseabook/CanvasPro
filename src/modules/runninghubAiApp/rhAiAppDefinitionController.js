import { fetchRunningHubDefinition } from '../../../api/runningHubDefinitionApi.js';
import { isRunningHubSource, SOURCE_TYPES } from './rhAiAppSources.js';
import { parseRunningHubAiAppInput } from './rhAiAppImport.js';
import { createRunningHubWorkflowComponentDrafts } from './rhWorkflowImport.js';
import { resolveRunningHubModelApiBaseUrl } from '../runningHubProviderProfiles.js';
export function createRhAiAppDefinitionController(
  sourceType,
  { fetchDefinition: fetchDefinition = fetchRunningHubDefinition } = {},
) {
  let value = null,
    value2 = null,
    el = null,
    reference = null,
    el2 = null;
  const run = (item) => {
      const el3 = sourceType.workflowInputFieldEl?.querySelector('[data-role="workflow-input-shell"]');
      (el3?.setAttribute('aria-busy', String(item)), el3?.classList.toggle('is-loading', item));
    },
    handler = (key) => {
      if (!el2) return;
      ((el2.disabled = key),
        el2.setAttribute('aria-busy', String(key)),
        el2.classList.toggle('is-loading', key),
        (el2.querySelector('span').textContent = key ? '正在解析…' : '解析连接'));
    },
    index = {
      syncInputSource() {
        if (!isRunningHubSource(sourceType.sourceType)) return;
        const result = sourceType._getInputText();
        let data;
        try {
          data = JSON.parse(result);
        } catch {}
        let sourceType2,
          appId,
          runningHubProfileId = sourceType.runningHubProfileId;
        if (data?.workflow)
          ((appId = createRunningHubWorkflowComponentDrafts(result).parsed.workflowId),
            (sourceType2 = SOURCE_TYPES.runninghubWorkflow));
        else {
          const dom = parseRunningHubAiAppInput(result);
          if (!dom.body.appId && !dom.body.aiAppId && dom.body.workflowId) return;
          ((appId = dom.appId),
            (runningHubProfileId = dom.providerProfileId || runningHubProfileId),
            (sourceType2 = SOURCE_TYPES.runninghub));
        }
        (sourceType.sourceType !== sourceType2 &&
          ((sourceType.savedAppId = ''),
          (sourceType.componentDrafts = []),
          (sourceType.componentCandidates = []),
          (sourceType.componentDraftKey = ''),
          (sourceType.promptHelpTooltip = ''),
          (sourceType.sourceType = sourceType2),
          sourceType._syncSourceView()),
          (sourceType.definitionReference = index.getSavedReference({
            sourceType: sourceType2,
            runningHubProfileId: runningHubProfileId,
            input: JSON.stringify({ appId: appId }),
          })),
          index.sync());
      },
      beginFileRead() {
        (index.cancel(), window.clearTimeout(sourceType.parseTimer));
        const options = {};
        return (
          (value2 = options),
          (sourceType.workflowInputCollapsed = false),
          sourceType._syncWorkflowInputCollapsed(),
          run(true),
          {
            isCurrent: () => value2 === options,
            finish() {
              value2 === options && ((value2 = null), run(false));
            },
          }
        );
      },
      getSavedReference(target) {
        if (!isRunningHubSource(target.sourceType)) return '';
        try {
          const source = JSON.parse(target.input),
            next = source.workflowId || source.appId;
          if (!/^\d{1,30}$/.test(String(next || ''))) return '';
          return (
            resolveRunningHubModelApiBaseUrl(target.runningHubProfileId) +
            '/' +
            (target.sourceType === 'runninghub-workflow' ? 'workflow' : 'ai-detail') +
            '/' +
            next
          );
        } catch {
          return '';
        }
      },
      mount() {
        ((el = document.createElement('div')),
          (el.className = 'rh-ai-app-definition'),
          (el.innerHTML =
            '<div class="rh-ai-app-definition-head">\n          <label class="rh-ai-app-label rh-ai-app-input-title" for="rh-definition-reference">RunningHub 链接</label>\n          <div class="rh-ai-app-site-links">\n            <a href="https://www.runninghub.cn/ai-apps?inviteCode=rh-v1312" target="_blank" rel="noopener noreferrer">国内站 <span aria-hidden="true">↗</span></a>\n            <a href="https://www.runninghub.ai/ai-apps?inviteCode=rh-v1312" target="_blank" rel="noopener noreferrer">国际站 <span aria-hidden="true">↗</span></a>\n          </div>\n        </div>\n        <div class="rh-ai-app-definition-row">\n          <input id="rh-definition-reference" data-role="definition-reference" type="text" autocomplete="off" spellcheck="false" />\n          <button type="button" class="rh-ai-app-secondary" data-action="fetch-definition"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12 0l2 5M4 12l2 5a7 7 0 0 0 12 0"/></svg><span>解析连接</span></button>\n        </div>'),
          sourceType.panel.querySelector('[data-role="workbench"]').prepend(el),
          (reference = el.querySelector('input')),
          (el2 = el.querySelector('button')),
          reference.addEventListener('input', () => {
            (index.cancel(),
              (sourceType.definitionReference = reference.value),
              sourceType._saveKindState());
          }),
          reference.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || event.isComposing) return;
            (event.preventDefault(), void index.load());
          }),
          sourceType.textarea.addEventListener('input', index.cancel),
          sourceType.panel.addEventListener('input', (event2) => {
            if (event2.target !== reference) index.cancel();
          }),
          sourceType.panel.addEventListener(
            'click',
            () => {
              if (value2) index.cancel();
            },
            true,
          ),
          el2.addEventListener('click', () => void index.load()),
          index.sync());
      },
      sync() {
        if (!el) return;
        ((el.hidden = !isRunningHubSource(sourceType.sourceType)),
          (reference.placeholder = '粘贴 AI 应用或工作流链接，自动识别类型'),
          (reference.value = sourceType.definitionReference || ''));
      },
      cancel() {
        ((value2 = null), run(false));
        const current = value;
        ((value = null), current?.abort(), handler(false));
      },
      async load() {
        if (value || !isRunningHubSource(sourceType.sourceType)) return;
        if (!sourceType._guardRunningHubAiAppAccess()) return;
        index.cancel();
        const signal = new AbortController();
        value = signal;
        const args = {
            sourceType: sourceType.sourceType,
            kind: sourceType.kind,
            profileId: sourceType.runningHubProfileId,
            reference: reference.value.trim(),
          },
          entry = sourceType._getInputText();
        (handler(true), sourceType._setError(''));
        try {
          const error = await fetchDefinition({
            ...args,
            sourceType: 'auto',
            signal: signal.signal,
          });
          if (
            value !== signal ||
            sourceType.sourceType !== args.sourceType ||
            sourceType.kind !== args.kind ||
            sourceType._getInputText() !== entry
          )
            return;
          (window.clearTimeout(sourceType.parseTimer),
            sourceType._clearCurrentDraftIdentity(),
            (sourceType.componentDrafts = []),
            (sourceType.componentCandidates = []),
            (sourceType.componentDraftKey = ''),
            (sourceType.sourceType = error.sourceType),
            (sourceType.runningHubProfileId = error.providerProfileId),
            (sourceType.definitionReference = args.reference),
            (sourceType.textarea.value = error.input),
            (sourceType.appName = error.name),
            sourceType._syncSourceView(),
            sourceType._parseNow());
        } catch (error2) {
          if (value !== signal || signal.signal.aborted) return;
          (sourceType._setError(error2?.message || '获取配置失败，请重试'),
            sourceType._saveKindState());
        } finally {
          value === signal && ((value = null), handler(false));
        }
      },
    };
  return index;
}
