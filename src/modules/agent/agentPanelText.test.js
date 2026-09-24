import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_PANEL_LOCALES, agentPanelText, formatAgentPanelText } from './agentPanelText.js';
import { AGENT_SKILL_PANEL_TEXT } from './agentSkillPanelText.js';

const PANEL_KEYS = [
  'actionsPrepared',
  'addReference',
  'attachSelected',
  'confirmExecute',
  'diagnosticStep',
  'editableParams',
  'executionModeAuto',
  'gapValue',
  'historyEmpty',
  'inputPlaceholder',
  'materialPickStarted',
  'nodeCreateVideo',
  'placeholderFallback',
  'quickActionGapCheckPrompt',
  'stopRequested',
];

test('面板文案：语言白名单固定为 zh-CN / en-US 且已冻结', () => {
  assert.deepEqual([...AGENT_PANEL_LOCALES], ['zh-CN', 'en-US']);
  assert.ok(Object.isFrozen(AGENT_PANEL_LOCALES));
});

test('面板文案：已知键在两种语言下各自命中，未知键原样返回', () => {
  assert.equal(agentPanelText('confirmExecute', 'zh-CN'), '确认执行');
  assert.equal(agentPanelText('confirmExecute', 'en-US'), 'Confirm execution');
  assert.equal(agentPanelText('definitely-not-a-panel-key', 'zh-CN'), 'definitely-not-a-panel-key');
  assert.equal(agentPanelText('definitely-not-a-panel-key', 'en-US'), 'definitely-not-a-panel-key');
});

test('面板文案：locale 归一只看是否以 en 开头（大小写无关），其余一律落 zh-CN', () => {
  for (const locale of ['en', 'en-US', 'EN-GB', 'en-anything']) {
    assert.equal(agentPanelText('confirmExecute', locale), 'Confirm execution', locale);
  }
  for (const locale of ['zh', 'zh-CN', 'zh-TW', 'fr', '', '   ', 0, false, null, undefined]) {
    assert.equal(agentPanelText('confirmExecute', locale), '确认执行', String(locale));
  }
});

test('面板文案：不传 locale 时跟随 getLocale()，两种语言均可解析', () => {
  const resolved = agentPanelText('confirmExecute');
  assert.ok(['确认执行', 'Confirm execution'].includes(resolved), String(resolved));
});

test('面板文案：继承技能面板文案表（同键同值）', () => {
  const skillKeys = Object.keys(AGENT_SKILL_PANEL_TEXT['zh-CN']);
  assert.ok(skillKeys.length > 0);
  for (const key of skillKeys) {
    assert.equal(agentPanelText(key, 'zh-CN'), AGENT_SKILL_PANEL_TEXT['zh-CN'][key], key);
    assert.notEqual(agentPanelText(key, 'en-US'), key, key);
  }
});

test('面板文案：本批点名的面板键在两种语言下都不回落为键名', () => {
  for (const key of PANEL_KEYS) {
    assert.notEqual(agentPanelText(key, 'zh-CN'), key, key);
    assert.notEqual(agentPanelText(key, 'en-US'), key, key);
  }
});

test('面板文案格式化：{name} 占位符按值替换，null/undefined 替换为空串', () => {
  assert.equal(formatAgentPanelText('diagnosticStep', { step: 3 }, 'zh-CN'), '第 3 步');
  assert.equal(formatAgentPanelText('diagnosticStep', { step: 3 }, 'en-US'), 'Step 3');
  assert.equal(formatAgentPanelText('gapValue', { value: 12 }, 'zh-CN'), '间距 12');
  assert.equal(
    formatAgentPanelText('attachSelected', { count: 2 }, 'en-US'),
    'Added 2 material reference(s).',
  );
  assert.equal(formatAgentPanelText('attachSelected', { count: null }, 'zh-CN'), '已添加  个素材入参。');
  assert.equal(formatAgentPanelText('attachSelected', {}, 'zh-CN'), '已添加  个素材入参。');
});

test('面板文案格式化：0 与 false 是有效值，不会被当成缺失', () => {
  assert.equal(formatAgentPanelText('diagnosticCompleted', { count: 0 }, 'zh-CN'), '已完成 0 步');
  assert.equal(formatAgentPanelText('diagnosticStep', { step: false }, 'en-US'), 'Step false');
});

test('面板文案格式化：未知键与无占位符键都原样输出', () => {
  assert.equal(formatAgentPanelText('unknown-panel-key', { a: 1 }, 'zh-CN'), 'unknown-panel-key');
  assert.equal(formatAgentPanelText('close', { a: 1 }, 'en-US'), 'Close');
});
