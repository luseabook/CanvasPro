import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_SKILL_PANEL_TEXT } from './agentSkillPanelText.js';

const ZH = AGENT_SKILL_PANEL_TEXT['zh-CN'];
const EN = AGENT_SKILL_PANEL_TEXT['en-US'];

function keysWith(table, token) {
  return Object.entries(table)
    .filter(([, value]) => value.includes(token))
    .map(([key]) => key)
    .sort();
}

test('表结构与冻结性：两语言键集完全相同', () => {
  assert.deepEqual(Object.keys(AGENT_SKILL_PANEL_TEXT), ['zh-CN', 'en-US']);
  const zhKeys = Object.keys(ZH).sort();
  assert.deepEqual(Object.keys(EN).sort(), zhKeys);
  assert.ok(zhKeys.length >= 50);
  assert.equal(new Set(zhKeys).size, zhKeys.length);
});

test('三层对象皆冻结，且改写抛 TypeError', () => {
  assert.equal(Object.isFrozen(AGENT_SKILL_PANEL_TEXT), true);
  assert.equal(Object.isFrozen(ZH), true);
  assert.equal(Object.isFrozen(EN), true);
  assert.throws(() => {
    ZH.skillSave = 'x';
  }, TypeError);
  assert.throws(() => {
    AGENT_SKILL_PANEL_TEXT['de-DE'] = {};
  }, TypeError);
  assert.equal(ZH.skillSave, '保存');
});

test('全部值为非空字符串且不含 NBSP 等异形空格', () => {
  for (const table of [ZH, EN])
    for (const [key, value] of Object.entries(table)) {
      assert.equal(typeof value, 'string', key);
      assert.ok(value.trim().length > 0, key);
      assert.ok(!value.includes('\xa0'), key);
      assert.ok(!value.includes('\t'), key);
    }
});

test('占位符 {count} / {name} 在两语言中落在同名键上', () => {
  assert.deepEqual(keysWith(ZH, '{count}'), keysWith(EN, '{count}'));
  assert.deepEqual(keysWith(ZH, '{name}'), keysWith(EN, '{name}'));
  assert.deepEqual(keysWith(ZH, '{count}'), ['skillDiagnostics', 'skillRefreshDone']);
  assert.deepEqual(
    keysWith(ZH, '{name}'),
    [
      'skillDeleteConfirmLabel',
      'skillDeleteDone',
      'skillImportDone',
      'skillImportRestricted',
      'skillSaveDone',
    ].sort(),
  );
});

test('中文关键文案取值', () => {
  assert.equal(ZH.skillPanelTitle, 'Skills');
  assert.equal(ZH.skillPickerAuto, '自动匹配');
  assert.equal(ZH.skillInsert, '使用');
  assert.ok(ZH.skillEmpty.includes('SKILL.md'));
  assert.equal(ZH.skillEditorCreateTitle, '新建 Skill');
  assert.ok(ZH.skillValidationName.includes('64'));
  assert.ok(ZH.skillImportRestricted.includes('scripts'));
});

test('英文关键文案取值与中英差异', () => {
  assert.equal(
    EN.skillPanelDesc,
    'Create Skills through Agent conversation; import, enable, edit, or delete them here.',
  );
  assert.equal(EN.skillPickerAuto, 'Automatic');
  assert.equal(EN.skillSaveReadOnly, 'This external Skill can only be edited in its folder.');
  assert.notEqual(ZH.skillDeleteFailed, EN.skillDeleteFailed);
  assert.ok(EN.skillEmpty.includes('SKILL.md'));
});

test('面板/选择器/导入/删除/编辑器五组键齐备', () => {
  for (const key of [
    'skillPanelTitle',
    'skillPickerDefault',
    'skillImportInvalid',
    'skillDeleteConfirm',
    'skillEditorEditTitle',
  ]) {
    assert.ok(key in ZH, key);
    assert.ok(key in EN, key);
  }
});
