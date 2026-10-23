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
import { bindWorkspaceSelects } from '../workspaceSelects.js';

// 绑定过的 <select> 需要能被 sync 反查（值变了要重算 tooltip，而不是只改 value）。
const modeBindings = new WeakMap();

export const PERSON_REPLACEMENT_MANUAL_PROMPT_EXAMPLE =
  '格式：把图片1中的【人物特征】的【男人】替换为图2的【人物特征】女人。\n例：把图片1中穿黑色外套的男人替换为图2中穿白色连衣裙的女人。';
const MANUAL_MODE_EXAMPLE = '例子：把图片1中穿黑色外套的男人替换为图2中穿白色连衣裙的女人。',
  MANUAL_MODE_FORMAT =
    '通用格式：把图片1中【人物特征】的【原人物】替换为图片2中【人物特征】的【新人物】。';

function selectedShot(value) {
  return (
    value.shots?.find((item) => item.id === value.workspace?.selectedShotId) ||
    value.shots?.[0] ||
    null
  );
}
function isPromptModeLocked(project, pendingShotIds = []) {
  const shot = selectedShot(project);
  return (
    !shot ||
    pendingShotIds.includes(shot.id) ||
    isPersonReplacementGenerationTaskActive(
      resolvePersonReplacementImageGenerationState(project.workspace, shot.id)
    )
  );
}
/**
 * 下拉里的四个模式。顺序即展示顺序；测试模式只在开发者开关打开时出现。
 * 每个模式都带一句「什么时候该用它」，比只写模式名有用得多。
 */
function modeOptions() {
  return [
    {
      mode: PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
      label: '指定替换',
      tooltip: '适合只替换部分人物：框选并绑定需要替换的人物，其余人物保持原样。',
    },
    {
      mode: PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
      label: '全部替换',
      tooltip: '适合一次替换画面中的所有人物：请检查人物框齐全并全部绑定。',
    },
    {
      mode: PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
      label: '手动模式',
      tooltip:
        '适合自行描述替换效果：请填写完整提示词，可输入 @ 引用素材；不会自动补充提示词或使用 AI 增强。',
    },
    ...(isPersonReplacementTestModeAvailable()
      ? [
          {
            mode: PERSON_REPLACEMENT_PROMPT_MODE_TEST,
            label: '测试模式',
            tooltip: '仅限开发者测试：适合对比带人物框的原图对替换效果的影响。',
          },
        ]
      : []),
  ];
}
export function isPersonReplacementManualPromptMode(data) {
  return selectedShot(data)?.replacementPromptMode === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL;
}
export const PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP =
  '手动模式仅使用你填写的提示词，不执行 AI 提示词增强。切回替换模式后恢复增强设置。';
export function renderPersonReplacementPromptModeControl(
  project,
  { pendingShotIds: pendingShotIds = [] } = {}
) {
  // 下拉而不是「点一下换一个」的按钮：四个模式循环切换需要点三下才能回到原处，
  // 而且当前处于哪一档只能靠按钮文字猜。
  const currentMode = normalizePersonReplacementPromptMode(
    selectedShot(project)?.replacementPromptMode
  );
  return (
    '<div class="person-replacement-prompt-mode-options" role="group" aria-label="当前片段的替换模式"><select data-person-replacement-action="toggle-prompt-mode" aria-label="当前片段的替换模式" ' +
    (isPromptModeLocked(project, pendingShotIds) ? 'disabled' : '') +
    '>' +
    modeOptions()
      .map(
        ({ mode, label, tooltip }) =>
          '<option value="' +
          mode +
          '" data-tooltip="仅对当前选中的片段生效。' +
          tooltip +
          '" ' +
          (currentMode === mode ? 'selected' : '') +
          '>' +
          label +
          '</option>'
      )
      .join('') +
    '</select></div>'
  );
}
function syncModeTooltip(trigger, option) {
  trigger?.setAttribute?.(
    'data-tooltip-right',
    option?.dataset?.tooltip || '请选择当前片段的替换模式。'
  );
  // 手动模式额外给两个示例属性，提示浮层据此展示格式与例子；切走要摘掉。
  for (const [attribute, value] of [
    ['data-tooltip-example', MANUAL_MODE_EXAMPLE],
    ['data-tooltip-format', MANUAL_MODE_FORMAT],
  ]) {
    if (option?.value === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL)
      trigger?.setAttribute?.(attribute, value);
    else trigger?.removeAttribute?.(attribute);
  }
}
export function bindPersonReplacementPromptModeSelect(root) {
  const container = root?.querySelector?.('.person-replacement-prompt-mode-options');
  if (!container?.ownerDocument?.defaultView) return null;
  const select = container.querySelector('select'),
    workspaceBinding = bindWorkspaceSelects(container),
    sync = () => {
      workspaceBinding.sync();
      // 自定义下拉的可视 trigger 是另一个元素，tooltip 得挂在它上面。
      syncModeTooltip(
        container.querySelector('.story-replication-select-trigger'),
        select.selectedOptions[0]
      );
    };
  for (const optionEl of container.querySelectorAll('[role="option"]')) {
    syncModeTooltip(
      optionEl,
      [...select.options].find((option) => option.value === optionEl.dataset.value)
    );
  }
  modeBindings.set(select, { sync });
  sync();
  return {
    sync: sync,
    destroy() {
      (modeBindings.delete(select), workspaceBinding.destroy());
    },
  };
}
function syncModeSelect(select, project) {
  const mode = normalizePersonReplacementPromptMode(selectedShot(project)?.replacementPromptMode);
  select.value = mode;
  // 只改 value 不会刷新自定义 trigger 的文字和 tooltip。
  modeBindings.get(select)?.sync();
}
export function syncPersonReplacementPromptModeControl(root, project, pendingShotIds = []) {
  const selects =
    root?.querySelectorAll?.('[data-person-replacement-action="toggle-prompt-mode"]') || [];
  if (!selects.length) return;
  const locked = isPromptModeLocked(project, pendingShotIds);
  (selects.forEach((select) => {
    ((select.disabled = locked), syncModeSelect(select, project));
  }),
    syncPersonReplacementPromptReferenceInputs(
      root,
      project,
      buildPersonReplacementPromptPackage({ project: project, shot: selectedShot(project) || {} })
    ),
    // 手动模式下提示词框要给出格式示例，否则用户不知道该怎么写。
    root
      ?.querySelector?.('[data-person-replacement-field="image-prompt"]')
      ?.setAttribute?.(
        'data-placeholder',
        isPersonReplacementManualPromptMode(project)
          ? PERSON_REPLACEMENT_MANUAL_PROMPT_EXAMPLE
          : '描述替换效果，输入 @ 引用左侧素材图'
      ));
  const enhancementButton = root?.querySelector?.(
    '[data-person-replacement-action="toggle-prompt-enhancement"]'
  );
  if (enhancementButton) {
    const manual = isPersonReplacementManualPromptMode(project);
    ((enhancementButton.disabled = manual || locked),
      enhancementButton.setAttribute(
        'aria-pressed',
        String(!manual && project.settings?.replacementPromptEnhancementEnabled === true)
      ),
      enhancementButton.setAttribute(
        'data-tooltip',
        manual
          ? PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP
          : enhancementButton.getAttribute('data-auto-tooltip') ||
              '使用画布 Agent 当前模型补充替换提示词。'
      ));
  }
}
export function applyPersonReplacementPromptControlAction(
  project,
  action,
  element,
  pendingShotIds = []
) {
  if (element.disabled) return null;
  if (action === 'toggle-prompt-enhancement') {
    if (isPersonReplacementManualPromptMode(project)) return null;
    const replacementPromptEnhancementEnabled =
      project.settings.replacementPromptEnhancementEnabled !== true;
    return (
      element.setAttribute?.('aria-pressed', String(replacementPromptEnhancementEnabled)),
      {
        patch: {
          settings: {
            ...project.settings,
            replacementPromptEnhancementEnabled: replacementPromptEnhancementEnabled,
          },
        },
        reason: 'image-prompt-enhancement',
      }
    );
  }
  if (action !== 'toggle-prompt-mode' || isPromptModeLocked(project, pendingShotIds)) return null;
  // 下拉直接给出目标模式，不再按「下一档」推算。
  const shot = selectedShot(project),
    nextMode = element.value;
  if (
    !modeOptions().some((option) => option.mode === nextMode) ||
    nextMode === normalizePersonReplacementPromptMode(shot.replacementPromptMode)
  )
    return null;
  const nextShot = { ...shot, replacementPromptMode: nextMode },
    shots = project.shots.map((entry) => (entry.id === shot.id ? nextShot : entry));
  return (
    syncModeSelect(element, { ...project, shots: shots }),
    { patch: { shots: shots }, reason: 'image-prompt-mode' }
  );
}
