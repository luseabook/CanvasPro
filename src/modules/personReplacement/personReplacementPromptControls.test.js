import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPersonReplacementPromptControlAction,
  isPersonReplacementManualPromptMode,
  renderPersonReplacementPromptModeControl,
  PERSON_REPLACEMENT_MANUAL_PROMPT_EXAMPLE,
} from './personReplacementPromptControls.js';
import { PERSON_REPLACEMENT_PROMPT_MODE_MANUAL } from './personReplacementPromptMode.js';

const project = (mode, extra = {}) => ({
  shots: [{ id: 'shot-1', replacementPromptMode: mode, ...extra }],
  workspace: { selectedShotId: 'shot-1' },
  settings: {},
});

/** 只实现 execute 需要的字段：disabled / value / setAttribute。 */
function selectElement(value, { disabled = false } = {}) {
  const attributes = {};
  return {
    value: value,
    disabled: disabled,
    setAttribute(name, next) {
      attributes[name] = String(next);
    },
    getAttribute(name) {
      return Object.hasOwn(attributes, name) ? attributes[name] : null;
    },
  };
}

test('personReplacementPromptControls: 模式渲染成下拉，四个档位带各自说明', () => {
  const html = renderPersonReplacementPromptModeControl(project('regular'));
  assert.match(html, /class="person-replacement-prompt-mode-options"/);
  assert.match(html, /<select data-person-replacement-action="toggle-prompt-mode"/);
  assert.match(html, /<option value="positioning"[^>]*>指定替换<\/option>/);
  assert.match(html, /<option value="regular"[^>]*selected[^>]*>全部替换<\/option>/);
  assert.match(html, /<option value="manual"[^>]*>手动模式<\/option>/);
  assert.doesNotMatch(html, /测试模式/, '非开发者模式不出现测试档');
  assert.match(html, /data-tooltip="仅对当前选中的片段生效。/, '每档都要带作用范围说明');
});

test('personReplacementPromptControls: 没有片段时下拉整体禁用', () => {
  const empty = { shots: [], workspace: {} };
  assert.match(renderPersonReplacementPromptModeControl(empty), /<select[^>]*disabled/);
});

test('personReplacementPromptControls: 选中某个模式后按该值写回片段', () => {
  const element = selectElement('manual');
  const outcome = applyPersonReplacementPromptControlAction(
    project('regular'),
    'toggle-prompt-mode',
    element
  );
  assert.equal(outcome.reason, 'image-prompt-mode');
  assert.equal(outcome.patch.shots[0].replacementPromptMode, 'manual', '下拉直接给出目标模式');
  assert.equal(
    isPersonReplacementManualPromptMode(outcome.patch),
    true,
    '切到手动后手动模式判定要跟上'
  );
});

test('personReplacementPromptControls: 非法值、未变化、禁用三种情况都不产生补丁', () => {
  assert.equal(
    applyPersonReplacementPromptControlAction(
      project('regular'),
      'toggle-prompt-mode',
      selectElement('nope')
    ),
    null,
    '不在选项里的值不能写进状态'
  );
  assert.equal(
    applyPersonReplacementPromptControlAction(
      project('regular'),
      'toggle-prompt-mode',
      selectElement('regular')
    ),
    null,
    '选回当前值不该触发更新'
  );
  assert.equal(
    applyPersonReplacementPromptControlAction(
      project('regular'),
      'toggle-prompt-mode',
      selectElement('manual', { disabled: true })
    ),
    null,
    '生成中禁用的下拉不能改状态'
  );
});

test('personReplacementPromptControls: 手动模式提示词示例可被直接复用', () => {
  assert.match(PERSON_REPLACEMENT_MANUAL_PROMPT_EXAMPLE, /把图片1/);
  assert.match(PERSON_REPLACEMENT_MANUAL_PROMPT_EXAMPLE, /\n/, '示例要同时给格式和例子（含换行）');
  assert.equal(
    isPersonReplacementManualPromptMode(project(PERSON_REPLACEMENT_PROMPT_MODE_MANUAL)),
    true
  );
  assert.equal(isPersonReplacementManualPromptMode(project('regular')), false);
});
