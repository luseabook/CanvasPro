import test from 'node:test';
import assert from 'node:assert/strict';

function makeElement(tag) {
  return {
    tagName: tag,
    className: '',
    textContent: '',
    hidden: false,
    disabled: false,
    value: '',
    type: '',
    placeholder: '',
    maxLength: 0,
    children: [],
    attrs: {},
    focused: 0,
    setAttribute(key, value) {
      this.attrs[key] = String(value);
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    focus() {
      this.focused += 1;
    },
  };
}

// 本模块只在 createElement 路径上取用 document，不触碰富文本清洗，因此整文件注入假 DOM 是安全的。
globalThis.document = { createElement: (tag) => makeElement(tag) };

const { createAgentSkillEditor } = await import('./agentSkillEditor.js');
const text = (key) => 'T:' + key;
const open = () => createAgentSkillEditor({ text });
const controls = (ed) => [1, 2, 3, 4, 5].map((i) => ed.element.children[i].children[1]);

test('createAgentSkillEditor：返回接口与元素树分区固定，且默认隐藏', () => {
  const ed = open();
  assert.deepEqual(Object.keys(ed), [
    'element',
    'saveButton',
    'cancelButton',
    'open',
    'close',
    'refreshText',
    'readDefinition',
    'setError',
    'setBusy',
  ]);
  assert.equal(ed.element.className, 'agent-skill-editor');
  assert.equal(ed.element.hidden, true);
  assert.deepEqual(
    ed.element.children.map((c) => c.className),
    [
      'agent-skill-editor-heading',
      'agent-custom-field agent-skill-editor-field agent-skill-editor-name',
      'agent-custom-field agent-skill-editor-field agent-skill-editor-title',
      'agent-custom-field agent-skill-editor-field agent-skill-editor-description',
      'agent-custom-field agent-skill-editor-field agent-skill-editor-triggers',
      'agent-custom-field agent-skill-editor-field agent-skill-editor-instructions',
      'agent-skill-editor-error',
      'agent-skill-editor-actions',
    ],
  );
});

test('createAgentSkillEditor：字段控件类型与 maxLength 上限冻结', () => {
  const ed = open();
  assert.deepEqual(
    controls(ed).map((c) => [c.tagName, c.type, c.maxLength]),
    [
      ['input', 'text', 64],
      ['input', 'text', 120],
      ['textarea', '', 600],
      ['input', 'text', 2000],
      ['textarea', '', 24576],
    ],
  );
  assert.deepEqual(
    controls(ed).map((c) => c.placeholder),
    ['T:skillNamePlaceholder', '', '', 'T:skillTriggersPlaceholder', ''],
  );
});

test('createAgentSkillEditor：open(null) 走创建态，文案由注入的 text() 全量刷新', () => {
  const ed = open();
  ed.open(null);
  assert.equal(ed.element.hidden, false);
  assert.equal(ed.element.children[0].textContent, 'T:skillEditorCreateTitle');
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((i) => ed.element.children[i].children[0].textContent),
    [
      'T:skillNameLabel',
      'T:skillTitleLabel',
      'T:skillDescriptionLabel',
      'T:skillTriggersLabel',
      'T:skillInstructionsLabel',
    ],
  );
  assert.equal(ed.cancelButton.textContent, 'T:skillEditorCancel');
  assert.equal(ed.saveButton.children[0].textContent, 'T:skillSave');
  assert.equal(ed.saveButton.children[1].className, 'agent-skill-operation-spinner');
  const [name] = controls(ed);
  assert.deepEqual([name.disabled, name.attrs['aria-disabled'], name.focused], [false, 'false', 1]);
});

test('createAgentSkillEditor：open(definition) 走编辑态，id 锁死且焦点落到标题框', () => {
  const ed = open();
  ed.open({ id: 'cat-fact', title: 'Cats', description: 'd', triggers: ['a', 'b'], instructions: 'i' });
  const [name, title] = controls(ed);
  assert.equal(ed.element.children[0].textContent, 'T:skillEditorEditTitle');
  assert.deepEqual(
    [name.value, name.disabled, name.attrs['aria-disabled'], name.focused],
    ['cat-fact', true, 'true', 0],
  );
  assert.deepEqual([title.value, title.focused], ['Cats', 1]);
  assert.equal(controls(ed)[3].value, 'a, b');
  assert.equal(controls(ed)[2].value, 'd');
});

test('createAgentSkillEditor：triggers 非数组渲染为空串，缺字段一律填空', () => {
  const ed = open();
  ed.open({ id: 'x', triggers: 'not-array' });
  assert.deepEqual(
    controls(ed).map((c) => c.value),
    ['x', '', '', '', ''],
  );
  ed.open({ id: 'y', triggers: null });
  assert.equal(controls(ed)[3].value, '');
});

test('createAgentSkillEditor：close() 只隐藏不清空，重开保留上次输入', () => {
  const ed = open();
  ed.open({ id: 'keep-me', description: 'd', instructions: 'i' });
  ed.close();
  assert.equal(ed.element.hidden, true);
  assert.equal(controls(ed)[0].value, 'keep-me');
  ed.open({ id: 'keep-me', description: 'd', instructions: 'i' });
  assert.equal(ed.element.hidden, false);
});

test('createAgentSkillEditor：readDefinition 产出小写 id、去空白正文与多分隔符触发词', () => {
  const ed = open();
  ed.open(null);
  const [name, title, description, triggers, instructions] = controls(ed);
  name.value = '  Mixed-Case-Id  ';
  title.value = '  Ti  ';
  description.value = '  De  ';
  triggers.value = 'a，b\nc , , d';
  instructions.value = '  In  ';
  assert.deepEqual(ed.readDefinition(), {
    ok: true,
    definition: {
      mode: 'create',
      id: 'mixed-case-id',
      title: 'Ti',
      description: 'De',
      triggers: ['a', 'b', 'c', 'd'],
      instructions: 'In',
    },
  });
});

test('createAgentSkillEditor：id 合法集为 [a-z0-9] 开头、总长 1..64，大写输入被静默小写后放行', () => {
  const ed = open();
  const results = {};
  for (const [name, id] of [
    ['upper', 'UPPER'],
    ['64 chars', 'a' + 'b'.repeat(63)],
    ['65 chars', 'a' + 'b'.repeat(64)],
    ['leading dash', '-lead'],
    ['digits ok', '9x-1'],
    ['empty', ''],
    ['underscore', 'a_b'],
    ['space inside', 'a b'],
  ]) {
    ed.open({ id, description: 'd', instructions: 'i' });
    const r = ed.readDefinition();
    results[name] = [r.ok, r.definition?.id];
  }
  assert.deepEqual(results, {
    upper: [true, 'upper'],
    '64 chars': [true, 'a' + 'b'.repeat(63)],
    '65 chars': [false, undefined],
    'leading dash': [false, undefined],
    'digits ok': [true, '9x-1'],
    empty: [false, undefined],
    underscore: [false, undefined],
    'space inside': [false, undefined],
  });
});

test('createAgentSkillEditor：描述与指令任一为空即整体失败，两者皆缺时仍聚焦描述框', () => {
  const ed = open();
  const [, , description, , instructions] = controls(ed);
  ed.open({ id: 'ok-id', description: '', instructions: 'i' });
  let r = ed.readDefinition();
  assert.deepEqual([r.ok, r.message], [false, 'T:skillValidationRequired']);
  assert.equal(r.focus, description);
  ed.open({ id: 'ok-id', description: 'd', instructions: '' });
  assert.equal(ed.readDefinition().focus, instructions);
  ed.open({ id: 'ok-id' });
  assert.equal(ed.readDefinition().focus, description);
  ed.open({ id: 'bad id', description: '', instructions: '' });
  assert.equal(ed.readDefinition().message, 'T:skillValidationName');
});

test('createAgentSkillEditor：标题与触发词非必填，mode 跟随当前态', () => {
  const ed = open();
  ed.open({ id: 'ok', description: 'd', instructions: 'i', triggers: [] });
  assert.deepEqual(ed.readDefinition(), {
    ok: true,
    definition: { mode: 'update', id: 'ok', title: '', description: 'd', triggers: [], instructions: 'i' },
  });
  ed.open(null);
  assert.deepEqual(
    controls(ed).map((c) => c.value),
    ['', '', '', '', ''],
  );
  assert.equal(ed.readDefinition().ok, false);
  controls(ed)[2].value = 'd';
  controls(ed)[4].value = 'i';
  controls(ed)[0].value = 'new-skill';
  const created = ed.readDefinition();
  assert.deepEqual([created.ok, created.definition.mode, created.definition.triggers], [true, 'create', []]);
});

test('createAgentSkillEditor：错误条 role=alert，写入即显示、清空或重开即隐藏', () => {
  const ed = open();
  const box = ed.element.children[6];
  assert.equal(box.attrs.role, 'alert');
  assert.equal(box.hidden, true);
  ed.setError('boom');
  assert.deepEqual([box.textContent, box.hidden], ['boom', false]);
  ed.setError('');
  assert.equal(box.hidden, true);
  ed.setError('boom');
  ed.open({ id: 'x', description: 'd', instructions: 'i' });
  assert.equal(box.hidden, true);
});

test('createAgentSkillEditor：setBusy 只锁取消按钮，保存按钮与 spinner 不受影响', () => {
  const ed = open();
  ed.setBusy(true);
  assert.deepEqual([ed.cancelButton.disabled, ed.cancelButton.attrs['aria-disabled']], [true, 'true']);
  assert.equal(ed.saveButton.disabled, false);
  ed.setBusy(false);
  assert.deepEqual([ed.cancelButton.disabled, ed.cancelButton.attrs['aria-disabled']], [false, 'false']);
});

test('createAgentSkillEditor：text() 缺省或传成非函数时构造即抛 TypeError（必填但未校验）', () => {
  assert.throws(() => createAgentSkillEditor({}), TypeError);
  assert.throws(() => createAgentSkillEditor(), TypeError);
  assert.throws(() => createAgentSkillEditor({ text: undefined }), TypeError);
  assert.throws(() => createAgentSkillEditor({ text: 'not-a-function' }), TypeError);
});

test('createAgentSkillEditor：refreshText 只重刷文案，不重置模式与已填内容', () => {
  const ed = open();
  ed.open({ id: 'x', description: 'd', instructions: 'i' });
  ed.refreshText();
  assert.equal(ed.element.children[0].textContent, 'T:skillEditorEditTitle');
  assert.deepEqual([controls(ed)[0].value, controls(ed)[0].disabled], ['x', true]);
  assert.equal(ed.element.hidden, false);
});
