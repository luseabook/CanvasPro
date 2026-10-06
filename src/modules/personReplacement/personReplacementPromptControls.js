import {
  normalizePersonReplacementPromptMode,
  PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
  PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
  PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
  isPersonReplacementTestModeAvailable,
} from './personReplacementPromptMode.js';
import { isPersonReplacementGenerationTaskActive } from './personReplacementGenerationTaskIdentity.js';
import { resolvePersonReplacementImageGenerationState } from './personReplacementImageGeneration.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { syncPersonReplacementPromptReferenceInputs } from './personReplacementIdentityPresentation.js';
function selectedShot(value) {
  return (
    value.shots?.find((item) => item.id === value.workspace?.selectedShotId) ||
    value.shots?.[0] ||
    null
  );
}
function isPromptModeLocked(key, list = []) {
  const edShot = selectedShot(key);
  return (
    !edShot ||
    list.includes(edShot.id) ||
    isPersonReplacementGenerationTaskActive(
      resolvePersonReplacementImageGenerationState(key.workspace, edShot.id),
    )
  );
}
function modePresentation(index) {
  const positioning = normalizePersonReplacementPromptMode(selectedShot(index)?.replacementPromptMode),
    result = positioning === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
    label = positioning === PERSON_REPLACEMENT_PROMPT_MODE_TEST;
  return {
    positioning: positioning !== PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
    label: label
      ? '测试模式'
      : positioning === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL
        ? '手动模式'
        : result
          ? '指定替换'
          : '全部替换',
    tooltip: label
      ? '测试模式仅限开发者：图1叠加人物框和参考图号，不发送独立定位图。点击切换为全部替换。'
      : positioning === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL
        ? '手动模式：直接提交原图和参考图，不添加默认提示词、定位图或 AI 增强。请自行填写完整提示词，可输入 @ 引用素材。点击切换为' +
          (isPersonReplacementTestModeAvailable() ? '测试模式' : '全部替换') +
          '。'
        : result
          ? '指定替换：只框选并绑定需要替换的人物，其余人物保持原样。用户提示词作为补充。点击切换为手动模式。'
          : '全部替换：用于一次替换画面中的所有人物。请检查人物框齐全并全部绑定；用户提示词作为补充。点击切换为指定替换。',
  };
}
export function isPersonReplacementManualPromptMode(data) {
  return selectedShot(data)?.replacementPromptMode === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL;
}
export const PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP =
  '手动模式仅使用你填写的提示词，不执行 AI 提示词增强。切回替换模式后恢复增强设置。';
export function renderPersonReplacementPromptModeControl(
  options,
  { pendingShotIds: pendingShotIds = [] } = {},
) {
  const { positioning: positioning2, label: label2, tooltip: tooltip } = modePresentation(options);
  return (
    '<button type="button" class="story-secondary-button person-replacement-toggle-button person-replacement-prompt-mode-toggle" data-person-replacement-action="toggle-prompt-mode" aria-pressed="' +
    positioning2 +
    '" aria-label="' +
    label2 +
    '" data-tooltip="仅对当前选中的片段生效。' +
    tooltip +
    '" ' +
    (isPromptModeLocked(options, pendingShotIds) ? 'disabled' : '') +
    '>' +
    label2 +
    '</button>'
  );
}
function syncModeButton(el, target) {
  const { positioning: positioning3, label: label3, tooltip: tooltip2 } = modePresentation(target);
  if (el.textContent !== label3) el.textContent = label3;
  for (const [source, next] of Object.entries({
    'aria-pressed': String(positioning3),
    'aria-label': label3,
    'data-tooltip': '仅对当前选中的片段生效。' + tooltip2,
  })) {
    if (el.getAttribute?.(source) !== next) el.setAttribute?.(source, next);
  }
}
export function syncPersonReplacementPromptModeControl(el2, project, current = []) {
  const el3 = el2?.querySelector?.('[data-person-replacement-action="toggle-prompt-mode"]');
  if (!el3) return;
  (syncModeButton(el3, project),
    (el3.disabled = isPromptModeLocked(project, current)),
    syncPersonReplacementPromptReferenceInputs(
      el2,
      project,
      buildPersonReplacementPromptPackage({ project: project, shot: selectedShot(project) || {} }),
    ));
  const el4 = el2?.querySelector?.('[data-person-replacement-action="toggle-prompt-enhancement"]');
  if (el4) {
    const isPersonReplacementManualPromptMode2 = isPersonReplacementManualPromptMode(project);
    ((el4.disabled = isPersonReplacementManualPromptMode2 || el3.disabled),
      el4.setAttribute(
        'aria-pressed',
        String(
          !isPersonReplacementManualPromptMode2 &&
            project.settings?.replacementPromptEnhancementEnabled === true,
        ),
      ),
      el4.setAttribute(
        'data-tooltip',
        isPersonReplacementManualPromptMode2
          ? PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP
          : el4.getAttribute('data-auto-tooltip') || '使用画布 Agent 当前模型补充替换提示词。',
      ));
  }
}
export function applyPersonReplacementPromptControlAction(args, entry, el5, record = []) {
  if (el5.disabled) return null;
  if (entry === 'toggle-prompt-enhancement') {
    if (isPersonReplacementManualPromptMode(args)) return null;
    const replacementPromptEnhancementEnabled =
      args.settings.replacementPromptEnhancementEnabled !== true;
    return (
      el5.setAttribute?.('aria-pressed', String(replacementPromptEnhancementEnabled)),
      {
        patch: {
          settings: {
            ...args.settings,
            replacementPromptEnhancementEnabled: replacementPromptEnhancementEnabled,
          },
        },
        reason: 'image-prompt-enhancement',
      }
    );
  }
  if (entry !== 'toggle-prompt-mode' || isPromptModeLocked(args, record)) return null;
  const args2 = selectedShot(args),
    replacementPromptMode = normalizePersonReplacementPromptMode(args2.replacementPromptMode),
    payload = {
      ...args2,
      replacementPromptMode:
        replacementPromptMode === PERSON_REPLACEMENT_PROMPT_MODE_REGULAR
          ? PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
          : replacementPromptMode === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
            ? PERSON_REPLACEMENT_PROMPT_MODE_MANUAL
            : replacementPromptMode === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL &&
                isPersonReplacementTestModeAvailable()
              ? PERSON_REPLACEMENT_PROMPT_MODE_TEST
              : PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
    },
    shots = args.shots.map((handle) => (handle.id === args2.id ? payload : handle));
  return (
    syncModeButton(el5, { ...args, shots: shots }),
    { patch: { shots: shots }, reason: 'image-prompt-mode' }
  );
}
