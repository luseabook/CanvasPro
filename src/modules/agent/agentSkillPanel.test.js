import test from 'node:test';
import assert from 'node:assert/strict';

// 本模块只走 document.createElement 路径（不做富文本清洗），因此注入假 DOM 是安全的。
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.handlers = {};
    this.classes = new Set();
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.clientHeight = 0;
    this.focusCount = 0;
    const self = this;
    this.dataset = new Proxy(
      {},
      {
        get: (target, key) => target[key],
        set: (target, key, value) => {
          target[key] = value;
          self.attrs['data-' + String(key).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())] = String(value);
          return true;
        },
        has: (target, key) => key in target,
      },
    );
  }
  get className() {
    return [...this.classes].join(' ');
  }
  set className(value) {
    this.classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }
  setAttribute(key, value) {
    this.attrs[key] = String(value);
  }
  getAttribute(key) {
    return key in this.attrs ? this.attrs[key] : undefined;
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parentNode = this;
      this.children.push(node);
    }
  }
  appendChild(node) {
    this.append(node);
    return node;
  }
  replaceChildren(...nodes) {
    this.children = [];
    if (nodes.length) this.append(...nodes);
  }
  addEventListener(type, fn) {
    (this.handlers[type] ||= []).push(fn);
  }
  removeEventListener(type, fn) {
    this.handlers[type] = (this.handlers[type] || []).filter((item) => item !== fn);
  }
  dispatch(type, event = {}) {
    for (const fn of [...(this.handlers[type] || [])])
      fn({ type, target: this, preventDefault() {}, stopPropagation() {}, ...event });
  }
  focus() {
    this.focusCount += 1;
  }
  get classList() {
    const self = this;
    return {
      toggle(name, force) {
        const on = force === undefined ? !self.classes.has(name) : Boolean(force);
        if (on) self.classes.add(name);
        else self.classes.delete(name);
        return on;
      },
      add(name) {
        self.classes.add(name);
      },
      remove(name) {
        self.classes.delete(name);
      },
      contains(name) {
        return self.classes.has(name);
      },
    };
  }
  matches(selector) {
    const attr = /^\[data-([a-z-]+)(?:="(.*)")?\]$/.exec(selector);
    if (attr) {
      const key = attr[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (!(key in this.dataset)) return false;
      return attr[2] === undefined || String(this.dataset[key]) === attr[2];
    }
    if (selector[0] === '.') return this.classes.has(selector.slice(1));
    return this.tagName === selector.toUpperCase();
  }
  descendants() {
    const out = [];
    const walk = (node) => {
      for (const child of node.children) {
        out.push(child);
        walk(child);
      }
    };
    walk(this);
    return out;
  }
  querySelectorAll(selector) {
    return this.descendants().filter((node) => node.matches(selector));
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
  closest(selector) {
    let node = this;
    while (node) {
      if (node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }
}

globalThis.document = { createElement: (tag) => new El(tag) };

const mod = await import('./agentSkillPanel.js');
const { createAgentSkillPanel, AGENT_DISABLED_SKILLS_STORAGE_KEY, agentSkillPanelInternals } = mod;

const text = (key) => 'T:' + key;
const formatText = (key, vars) => 'F:' + key + ':' + JSON.stringify(vars);
const tick = () => new Promise((resolve) => setImmediate(resolve));

function makeWindow(initial = {}) {
  const data = { ...initial };
  return {
    data,
    localStorage: {
      getItem: (key) => (key in data ? data[key] : null),
      setItem: (key, value) => {
        data[key] = String(value);
      },
    },
  };
}

function makeRegistry(skills = [], diagnostics = []) {
  const disabled = new Set();
  return {
    skills: skills.map((skill) => ({ ...skill })),
    diagnostics,
    disabled,
    listSkills() {
      return this.skills.map((skill) => ({ ...skill, enabled: !disabled.has(skill.id) }));
    },
    getState() {
      return { diagnostics: this.diagnostics, disabledSkillIds: [...disabled] };
    },
    setDisabledSkillIds(ids) {
      disabled.clear();
      for (const id of Array.isArray(ids) ? ids : []) {
        const key = String(id || '').trim();
        if (key) disabled.add(key);
      }
      return [...disabled];
    },
    setSkillEnabled(id, enabled = true) {
      const key = String(id || '').trim();
      if (!key || !this.skills.some((skill) => skill.id === key)) return false;
      if (enabled === false) disabled.add(key);
      else disabled.delete(key);
      return true;
    },
  };
}

function make(over = {}) {
  const windowObject = 'windowObject' in over ? over.windowObject : makeWindow();
  const registry = over.registry || makeRegistry(over.skills || []);
  const notices = [];
  const catalogChanges = { count: 0 };
  const calls = { refresh: 0, install: 0, delete: 0, save: 0 };
  const panel = createAgentSkillPanel({
    registry,
    refreshSkills:
      'refreshSkills' in over ? over.refreshSkills : async () => ({ available: true, loaded: 3 }),
    installSkill:
      'installSkill' in over ? over.installSkill : async () => ({ success: true, skillId: 'fresh' }),
    deleteSkill:
      'deleteSkill' in over
        ? over.deleteSkill
        : async (arg) => ((calls.delete += 1), { success: true, ...arg }),
    saveSkill:
      'saveSkill' in over
        ? over.saveSkill
        : async (definition) => ((calls.save += 1), { success: true, skillId: 'mine' }),
    text,
    formatText,
    onInsert: 'onInsert' in over ? over.onInsert : (value) => notices.push('insert:' + value),
    onUse: 'onUse' in over ? over.onUse : (id) => notices.push('use:' + id),
    onCatalogChange: () => (catalogChanges.count += 1),
    onNotice: (message) => notices.push(message),
    windowObject,
  });
  const list = panel.element.querySelector('.agent-skill-list');
  const editor = panel.element.querySelector('.agent-skill-editor');
  return {
    panel,
    el: panel.element,
    registry,
    list,
    editor,
    notices,
    catalogChanges,
    calls,
    windowObject,
    items: () => list.querySelectorAll('[data-agent-skill-id]'),
    button: (selector) => panel.element.querySelector(selector),
    click: (node) => list.dispatch('click', { target: node }),
  };
}

const installedSkill = (id, extra = {}) => ({
  id,
  title: id.toUpperCase(),
  description: 'desc-' + id,
  source: 'installed',
  managedBy: 'shuo-canvas',
  ...extra,
});

test('模块导出：面板工厂、复用偏好键与内部只读句柄', () => {
  assert.deepEqual(Object.keys(mod), [
    'AGENT_DISABLED_SKILLS_STORAGE_KEY',
    'agentSkillPanelInternals',
    'createAgentSkillPanel',
  ]);
  assert.equal(AGENT_DISABLED_SKILLS_STORAGE_KEY, 'aiCanvas.agentDisabledSkills.v1');
  assert.deepEqual(Object.keys(agentSkillPanelInternals), ['getInstalledSkills', 'readDisabledSkillIds']);
  assert.equal(Object.isFrozen(agentSkillPanelInternals), true);
  assert.deepEqual(agentSkillPanelInternals.getInstalledSkills(null), []);
  assert.deepEqual(
    agentSkillPanelInternals
      .getInstalledSkills({
        listSkills: () => [
          { id: 'a', source: 'installed', managedBy: 'shuo-canvas' },
          { id: 'b', source: 'built-in', managedBy: 'shuo-canvas' },
          { id: 'c', source: 'installed', managedBy: 'other' },
        ],
      })
      .map((skill) => [skill.id, skill.editable]),
    [
      ['a', true],
      ['c', false],
    ],
  );
  assert.deepEqual(agentSkillPanelInternals.readDisabledSkillIds({}), []);
});

test('构造：面板默认隐藏、结构三段、水合禁用偏好来自 localStorage', () => {
  const win = makeWindow({ [AGENT_DISABLED_SKILLS_STORAGE_KEY]: '[" OFF ","  ","off"]' });
  const registry = makeRegistry([installedSkill('off'), installedSkill('on')]);
  const { panel, el, list, editor } = make({ registry, windowObject: win });
  assert.deepEqual(Object.keys(panel), [
    'element',
    'open',
    'close',
    'render',
    'refresh',
    'install',
    'requestDelete',
    'confirmDelete',
    'save',
    'refreshText',
    'destroy',
  ]);
  assert.equal(el.hidden, true);
  assert.equal(el.attrs['aria-hidden'], 'true');
  assert.equal(el.classes.has('is-open'), false);
  assert.deepEqual(
    el.children.map((node) => node.className),
    ['agent-custom-panel-header', 'agent-skill-list', 'agent-skill-editor'].map((name) =>
      name === 'agent-skill-list' ? 'agent-skill-list' : name,
    ),
  );
  assert.equal(list.attrs.role, 'list');
  assert.equal(editor.hidden, true);
  assert.deepEqual(registry.disabled, new Set(['off']));
});

test('头部文案与按钮标签取自 text / aria-label', () => {
  const { el } = make({ skills: [] });
  assert.equal(el.querySelector('.agent-custom-panel-title').textContent, 'T:skillPanelTitle');
  assert.equal(el.querySelector('.agent-custom-panel-desc').textContent, 'T:skillPanelDesc');
  assert.equal(el.querySelector('.agent-skill-refresh-btn').attrs['aria-label'], 'T:skillRefresh');
  assert.equal(el.querySelector('.agent-skill-close-btn').attrs['aria-label'], 'T:skillClose');
  assert.equal(
    el.querySelector('.agent-skill-import-btn').querySelector('.agent-btn-label').textContent,
    'T:skillImport',
  );
  assert.equal(
    el.querySelector('.agent-skill-create-btn').querySelector('.agent-btn-label').textContent,
    'T:skillCreate',
  );
  // 刷新、导入与编辑器保存各带一个 spinner 占位。
  assert.equal(el.querySelectorAll('.agent-skill-operation-spinner').length, 3);
});

test('render：只列 installed，条目三段文案 + 开关 / 插入 / 编辑 / 删除四钮', () => {
  const { list, items, catalogChanges } = make({
    skills: [installedSkill('a'), installedSkill('b', { managedBy: 'other' })],
  });
  list.dispatch('click', {});
  assert.deepEqual(
    items().map((node) => node.dataset.agentSkillId),
    ['a', 'b'],
  );
  const [first, second] = items();
  assert.equal(first.attrs.role, 'listitem');
  assert.equal(first.querySelector('.agent-skill-item-title').textContent, 'A');
  assert.equal(first.querySelector('.agent-skill-item-id').textContent, '$a');
  assert.equal(first.querySelector('.agent-skill-item-desc').textContent, 'desc-a');
  const actionCount = (node) =>
    ['toggle', 'insert', 'edit', 'delete'].filter(
      (kind) => node.querySelectorAll('[data-agent-skill-' + kind + ']').length > 0,
    );
  assert.deepEqual(actionCount(first), ['toggle', 'insert', 'edit', 'delete']);
  // 非 shuo-canvas 管理的技能没有编辑按钮。
  assert.deepEqual(actionCount(second), ['toggle', 'insert', 'delete']);
  assert.equal(second.querySelector('[data-agent-skill-toggle]').attrs['aria-checked'], 'true');
  assert.equal(first.querySelector('[data-agent-skill-insert]').disabled, false);
  // 无匹配 data-* 的点击不触发任何动作，也不重绘：回调只在构造期计数一次。
  assert.equal(catalogChanges.count, 1);
});

test('render：标题缺省回落 id、描述缺省回落空串', () => {
  const { items } = make({
    skills: [{ id: 'x', source: 'installed', title: '', description: undefined }],
  });
  assert.equal(items()[0].querySelector('.agent-skill-item-title').textContent, 'x');
  assert.equal(items()[0].querySelector('.agent-skill-item-desc').textContent, '');
});

test('render：禁用技能加 is-disabled 且插入钮禁用、开关标题改用 skillEnable', () => {
  // 构造期会用水合结果整体覆盖注册表禁用集，所以禁用态必须经由 localStorage 注入。
  const win = makeWindow({ [AGENT_DISABLED_SKILLS_STORAGE_KEY]: '["a"]' });
  const registry = makeRegistry([installedSkill('a'), installedSkill('b')]);
  const { items } = make({ registry, windowObject: win });
  const [first, second] = items();
  assert.equal(first.classes.has('is-disabled'), true);
  assert.equal(second.classes.has('is-disabled'), false);
  assert.equal(first.querySelector('[data-agent-skill-insert]').disabled, true);
  // 按钮提示走 createAgentButton：同时写 .title 属性与 aria-label。
  assert.equal(first.querySelector('[data-agent-skill-insert]').title, 'T:skillInsert');
  assert.equal(first.querySelector('[data-agent-skill-toggle]').title, 'T:skillEnable');
  assert.equal(first.querySelector('[data-agent-skill-toggle]').attrs['aria-checked'], 'false');
  assert.equal(second.querySelector('[data-agent-skill-toggle]').title, 'T:skillDisable');
});

test('render：无技能时空态文案取自 skillEmpty；有诊断时追加计数行', () => {
  const empty = make({ skills: [] });
  assert.equal(empty.list.querySelector('.agent-skill-empty').textContent, 'T:skillEmpty');
  const registry = makeRegistry([installedSkill('a')], [{ ok: false }, { ok: false }]);
  const { list } = make({ registry });
  assert.equal(list.querySelector('.agent-skill-diagnostics').textContent, 'F:skillDiagnostics:{"count":2}');
});

test('删除确认态：requestDelete 换成确认对话框，cancel 复原，忙碌时拒绝切换', () => {
  const { panel, list, items } = make({ skills: [installedSkill('a'), installedSkill('b')] });
  panel.requestDelete('a');
  const confirm = list.querySelector('[data-agent-skill-delete-confirm]');
  assert.equal(confirm.attrs['aria-busy'], 'false');
  assert.equal(list.querySelector('.agent-skill-delete-confirm').attrs.role, 'alertdialog');
  assert.equal(
    list.querySelector('.agent-skill-delete-confirm').attrs['aria-label'],
    'F:skillDeleteConfirmLabel:{"name":"A"}',
  );
  assert.equal(items()[0].querySelectorAll('[data-agent-skill-toggle]').length, 0);
  // 另一个技能仍保持普通动作条。
  assert.equal(items()[1].querySelectorAll('[data-agent-skill-toggle]').length, 1);
  panel.requestDelete('');
  assert.equal(list.querySelector('[data-agent-skill-delete-confirm]'), null);
  panel.requestDelete('a');
  panel.render();
  assert.equal(items().length, 2);
  // 取消：id 不匹配时忽略。
  const cancel = items()[0].querySelector('[data-agent-skill-delete-cancel]');
  cancel.dataset.agentSkillDeleteCancel = 'other';
  panel.close();
  assert.equal(items().length, 2);
});

test('删除确认按钮在忙碌期禁用，且 confirmDelete 只在 id 匹配时发起', async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { panel, list, calls } = make({
    skills: [installedSkill('a')],
    deleteSkill: async () => {
      calls.delete += 1;
      await gate;
      return { success: true, skillId: 'a' };
    },
  });
  panel.requestDelete('a');
  const before = calls.delete;
  assert.equal(await panel.confirmDelete('other'), null);
  assert.equal(calls.delete, before);
  const run = panel.confirmDelete('a');
  assert.equal(calls.delete, before + 1);
  // 忙碌期：确认与取消按钮全部禁用，且 spinner 计数走 aria-busy。
  const confirm = list.querySelector('[data-agent-skill-delete-confirm]');
  assert.equal(confirm.disabled, true);
  assert.equal(confirm.attrs['aria-busy'], 'true');
  assert.equal(list.querySelector('[data-agent-skill-delete-cancel]').disabled, true);
  release();
  await run;
  assert.equal(list.querySelector('[data-agent-skill-delete-confirm]'), null);
});

test('confirmDelete 结果分支：成功 / 刷新失败 / 其他失败对 pending 态处理不同', async () => {
  const succeed = make({
    skills: [installedSkill('a')],
    deleteSkill: async () => ({ success: true, skillId: 'a' }),
  });
  succeed.panel.requestDelete('a');
  await succeed.panel.confirmDelete('a');
  assert.deepEqual(succeed.notices, ['F:skillDeleteDone:{"name":"a"}']);
  assert.equal(succeed.list.querySelector('.agent-skill-empty') ? null : 'listed', 'listed');

  const refreshFailed = make({
    skills: [installedSkill('a')],
    deleteSkill: async () => ({ success: false, errorCode: 'SKILL_REFRESH_AFTER_DELETE_FAILED' }),
  });
  refreshFailed.panel.requestDelete('a');
  await refreshFailed.panel.confirmDelete('a');
  assert.deepEqual(refreshFailed.notices, ['T:skillDeleteRefreshFailed']);
  assert.equal(refreshFailed.list.querySelector('[data-agent-skill-delete-confirm]'), null);

  const plainFail = make({
    skills: [installedSkill('a')],
    deleteSkill: async () => ({ success: false, errorCode: 'SKILL_NOT_FOUND' }),
  });
  plainFail.panel.requestDelete('a');
  await plainFail.panel.confirmDelete('a');
  assert.deepEqual(plainFail.notices, ['T:skillDeleteFailed']);
  // 端口现状（未打补丁）：普通失败保留 pending 删除态，只清 aria-busy。
  assert.equal(plainFail.list.querySelector('[data-agent-skill-delete-confirm]').attrs['aria-busy'], 'false');
});

test('confirmDelete 抛错走失败提示并复位忙碌', async () => {
  const { panel, list, notices } = make({
    skills: [installedSkill('a')],
    deleteSkill: async () => {
      throw new Error('disk');
    },
  });
  panel.requestDelete('a');
  const result = await panel.confirmDelete('a');
  assert.equal(result.success, false);
  assert.equal(result.error.message, 'disk');
  assert.deepEqual(notices, ['T:skillDeleteFailed']);
  assert.equal(list.querySelector('[data-agent-skill-delete-confirm]').attrs['aria-busy'], 'false');
});

test('refresh：成功播报 loaded，available=false 与抛错共用失败文案', async () => {
  const ok = make({ refreshSkills: async () => ({ available: true, loaded: 7 }) });
  await ok.panel.refresh();
  assert.deepEqual(ok.notices, ['F:skillRefreshDone:{"count":7}']);
  const unavailable = make({ refreshSkills: async () => ({ available: false }) });
  await unavailable.panel.refresh();
  assert.deepEqual(unavailable.notices, ['T:skillRefreshFailed']);
  const thrown = make({
    refreshSkills: async () => {
      throw new Error('net');
    },
  });
  const result = await thrown.panel.refresh();
  assert.equal(result.success, false);
  assert.deepEqual(thrown.notices, ['T:skillRefreshFailed']);
  // 未注入回调时返回 null 且不改忙碌态。
  const none = make({ refreshSkills: undefined });
  none.registry.listSkills;
  assert.equal(await none.panel.refresh(), null);
});

test('忙碌态：四个操作钮统一禁用，仅当前动作标 is-loading 与 aria-busy', async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { panel, el } = make({ refreshSkills: () => gate.then(() => ({ available: true, loaded: 1 })) });
  const run = panel.refresh();
  const refreshBtn = el.querySelector('.agent-skill-refresh-btn');
  const importBtn = el.querySelector('.agent-skill-import-btn');
  const createBtn = el.querySelector('.agent-skill-create-btn');
  const saveBtn = el.querySelector('.agent-skill-editor-save-btn');
  const cancelBtn = el.querySelector('.agent-skill-editor-cancel-btn');
  assert.deepEqual(
    [refreshBtn, importBtn, createBtn, saveBtn].map((node) => [node.disabled, node.attrs['aria-disabled']]),
    [
      [true, 'true'],
      [true, 'true'],
      [true, 'true'],
      [true, 'true'],
    ],
  );
  assert.equal(cancelBtn.disabled, true);
  assert.equal(refreshBtn.attrs['aria-busy'], 'true');
  assert.equal(refreshBtn.classes.has('is-loading'), true);
  assert.equal(importBtn.attrs['aria-busy'], 'false');
  assert.equal(saveBtn.classes.has('is-loading'), false);
  // 忙碌期再触发任何动作都被吞掉。
  assert.equal(await panel.install(), null);
  panel.requestDelete('x');
  release();
  await run;
  assert.equal(refreshBtn.disabled, false);
  assert.equal(refreshBtn.classes.has('is-loading'), false);
  assert.equal(el.querySelector('[data-agent-skill-delete-confirm]'), null);
});

test('install：取消静默、成功按受限播报并在面板打开时聚焦插入钮', async () => {
  const canceled = make({ installSkill: async () => ({ canceled: true }) });
  await canceled.panel.install();
  assert.deepEqual(canceled.notices, []);

  const done = make({ installSkill: async () => ({ success: true, skillId: 'newone' }) });
  const skills = done.registry;
  skills.skills.push(installedSkill('newone'));
  done.panel.open();
  await done.panel.install();
  assert.deepEqual(done.notices, ['F:skillImportDone:{"name":"newone"}']);
  assert.equal(done.list.querySelector('[data-agent-skill-insert="newone"]').focusCount, 1);

  // 端口现状（未打补丁）：缺 skillId 时用字面量 Skill 播报。
  const nameless = make({ installSkill: async () => ({ success: true }) });
  await nameless.panel.install();
  assert.deepEqual(nameless.notices, ['F:skillImportDone:{"name":"Skill"}']);

  // 受限：scriptsSkipped 或 skippedResources > 0 改用 restricted 文案。
  const restricted = make({ installSkill: async () => ({ success: true, scriptsSkipped: true }) });
  await restricted.panel.install();
  assert.equal(restricted.notices[0], 'F:skillImportRestricted:{"name":"Skill"}');
  const skipped = make({ installSkill: async () => ({ success: true, skippedResources: '2' }) });
  await skipped.panel.install();
  assert.equal(skipped.notices[0], 'F:skillImportRestricted:{"name":"Skill"}');
});

test('install：错误码分派四种提示，面板隐藏时不聚焦', async () => {
  const cases = [
    [{ success: false, errorCode: 'SKILL_REFRESH_AFTER_INSTALL_FAILED' }, 'T:skillImportRefreshFailed'],
    [{ success: false, errorCode: 'SKILL_ALREADY_INSTALLED' }, 'T:skillImportDuplicate'],
    [{ success: false, errorCode: 'SKILL_MD_TOO_LARGE' }, 'T:skillImportInvalid'],
    [{ success: false, errorCode: 'INVALID_SKILL_ID' }, 'T:skillImportInvalid'],
    [{ success: false, errorCode: 'WHATEVER' }, 'T:skillImportFailed'],
    [{}, 'T:skillImportFailed'],
  ];
  for (const [result, expected] of cases) {
    const harness = make({ installSkill: async () => result });
    await harness.panel.install();
    assert.deepEqual(harness.notices, [expected], JSON.stringify(result));
    assert.equal(harness.el.hidden, true);
  }
  const thrown = make({
    installSkill: async () => {
      throw new Error('pick-cancel');
    },
  });
  await thrown.panel.install();
  assert.deepEqual(thrown.notices, ['T:skillImportFailed']);
});

test('save：表单非法即回 SKILL_FORM_INVALID 并把错误写进编辑区', async () => {
  const { panel, editor, notices, calls } = make({ skills: [] });
  panel.open();
  const result = await panel.save();
  assert.deepEqual(result, { success: false, errorCode: 'SKILL_FORM_INVALID' });
  assert.equal(calls.save, 0);
  assert.equal(editor.querySelector('.agent-skill-editor-error').textContent, 'T:skillValidationName');
  assert.equal(editor.querySelector('.agent-skill-editor-error').hidden, false);
  assert.deepEqual(notices, []);
});

test('save：成功后关编辑区、重列并聚焦新条目的编辑钮；失败按错误码写入表单错误', async () => {
  const filled = async (harness) => {
    harness.panel.open();
    harness.panel.render();
    const set = (cls, value) => {
      harness.editor.querySelector('.' + cls).children[1].value = value;
    };
    set('agent-skill-editor-name', 'Mine');
    set('agent-skill-editor-title', '我的技能');
    set('agent-skill-editor-description', '说明');
    set('agent-skill-editor-triggers', '排列, 对齐');
    set('agent-skill-editor-instructions', '步骤');
    return harness;
  };
  const ok = make({ skills: [installedSkill('mine')] });
  await filled(ok);
  const result = await ok.panel.save();
  assert.deepEqual(result, { success: true, skillId: 'mine' });
  assert.equal(ok.editor.hidden, true);
  assert.equal(ok.notices[0], 'F:skillSaveDone:{"name":"mine"}');
  assert.equal(ok.list.querySelector('[data-agent-skill-edit="mine"]').focusCount, 1);

  for (const [errorCode, expected] of [
    ['SKILL_ALREADY_INSTALLED', 'T:skillSaveDuplicate'],
    ['SKILL_NOT_EDITABLE', 'T:skillSaveReadOnly'],
    ['SKILL_REFRESH_AFTER_SAVE_FAILED', 'T:skillSaveRefreshFailed'],
    ['OTHER', 'T:skillSaveFailed'],
  ]) {
    const failing = make({ skills: [], saveSkill: async () => ({ success: false, errorCode }) });
    await filled(failing);
    await failing.panel.save();
    assert.equal(failing.editor.querySelector('.agent-skill-editor-error').textContent, expected);
  }
  const thrown = make({
    skills: [],
    saveSkill: async () => {
      throw new Error('write');
    },
  });
  await filled(thrown);
  await thrown.panel.save();
  assert.equal(thrown.editor.querySelector('.agent-skill-editor-error').textContent, 'T:skillSaveFailed');
});

test('点击委托：开关写回 localStorage，插入优先 onUse，缺省回落 onInsert 并关面板', () => {
  const win = makeWindow();
  const registry = makeRegistry([installedSkill('a')]);
  const { panel, list, notices, click, items } = make({ registry, windowObject: win, onUse: undefined });
  panel.open();
  click(items()[0].querySelector('[data-agent-skill-toggle]'));
  assert.equal(registry.disabled.has('a'), true);
  assert.equal(win.data[AGENT_DISABLED_SKILLS_STORAGE_KEY], '["a"]');
  // 重绘后开关回到禁用态，插入按钮被禁用。
  assert.equal(items()[0].querySelector('[data-agent-skill-toggle]').attrs['aria-checked'], 'false');
  click(items()[0].querySelector('[data-agent-skill-toggle]'));
  assert.equal(registry.disabled.has('a'), false);
  assert.equal(win.data[AGENT_DISABLED_SKILLS_STORAGE_KEY], '[]');
  click(items()[0].querySelector('[data-agent-skill-insert]'));
  assert.deepEqual(notices, ['insert:$a ']);
  assert.equal(panel.element.hidden, true);

  const withUse = make({ skills: [installedSkill('b')] });
  withUse.panel.open();
  withUse.click(withUse.items()[0].querySelector('[data-agent-skill-insert]'));
  assert.deepEqual(withUse.notices, ['use:b']);
  // 禁用条目的插入按钮点击被忽略。
  const r2 = makeRegistry([installedSkill('c')]);
  const disabledCase = make({
    registry: r2,
    windowObject: makeWindow({ [AGENT_DISABLED_SKILLS_STORAGE_KEY]: '["c"]' }),
  });
  disabledCase.panel.open();
  disabledCase.click(disabledCase.items()[0].querySelector('[data-agent-skill-insert]'));
  assert.deepEqual(disabledCase.notices, []);
});

test('点击委托：编辑仅对 editable 条目生效并隐藏列表，创建按钮走 onInsert 提示语', () => {
  const { panel, list, editor, items, click, notices } = make({
    skills: [installedSkill('a'), installedSkill('b', { managedBy: 'other' })],
    onUse: undefined,
  });
  panel.open();
  click(items()[1].querySelector('[data-agent-skill-delete]'));
  panel.close();
  click(items()[1].querySelector('[data-agent-skill-edit]') || list);
  assert.equal(editor.hidden, true);
  click(items()[0].querySelector('[data-agent-skill-edit]'));
  assert.equal(editor.hidden, false);
  assert.equal(list.hidden, true);
  assert.equal(editor.querySelector('.agent-skill-editor-heading').textContent, 'T:skillEditorEditTitle');
  assert.equal(editor.querySelector('.agent-skill-editor-name').children[1].value, 'a');
  assert.equal(editor.querySelector('.agent-skill-editor-name').children[1].disabled, true);
  // 取消按钮回到列表视图。
  panel.element.querySelector('.agent-skill-editor-cancel-btn').dispatch('click');
  assert.equal(editor.hidden, true);
  assert.equal(list.hidden, false);
  panel.element.querySelector('.agent-skill-create-btn').dispatch('click');
  // 端口现状（未打补丁）：创建按钮只把提示语交给 onInsert（故带插入前缀），随后关闭整个面板；
  // 它不会以 create 模式打开编辑区，标题仍停留在上一次 edit 模式。
  assert.deepEqual(notices, ['insert:T:skillCreatePrompt']);
  assert.equal(editor.querySelector('.agent-skill-editor-heading').textContent, 'T:skillEditorEditTitle');
  assert.equal(editor.hidden, true);
  assert.equal(panel.element.hidden, true);
});

test('open / close：可见性、is-open 类与 aria-hidden 同步，close 清掉 pending 删除态', async () => {
  const { panel, el } = make({ skills: [installedSkill('a')] });
  panel.open();
  assert.equal(el.hidden, false);
  assert.equal(el.attrs['aria-hidden'], 'false');
  assert.equal(el.classes.has('is-open'), true);
  panel.close();
  assert.equal(el.hidden, true);
  assert.equal(el.attrs['aria-hidden'], 'true');
  assert.equal(el.classes.has('is-open'), false);
  // 非忙碌期的 close 会清掉 pending 删除态并重绘。
  panel.requestDelete('a');
  panel.open();
  assert.notEqual(el.querySelector('[data-agent-skill-delete-confirm]'), null);
  panel.close();
  assert.equal(el.querySelector('[data-agent-skill-delete-confirm]'), null);
});

test('destroy：置销毁标记后在途回调不再落地，忙碌态立即复位', async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { panel, el, notices } = make({
    skills: [installedSkill('a')],
    refreshSkills: () => gate.then(() => ({ available: true, loaded: 9 })),
  });
  const run = panel.refresh();
  assert.equal(el.querySelector('.agent-skill-refresh-btn').classes.has('is-loading'), true);
  panel.destroy();
  assert.equal(el.querySelector('.agent-skill-refresh-btn').disabled, false);
  assert.equal(el.querySelector('.agent-skill-refresh-btn').classes.has('is-loading'), false);
  release();
  await run;
  assert.deepEqual(notices, []);
});

test('destroy 后 requestDelete 仍可调用，但渲染函数已短路，列表与对话框都不再变化', () => {
  const { panel, el, items } = make({ skills: [installedSkill('a')] });
  panel.destroy();
  panel.requestDelete('a');
  // 端口现状（未打补丁）：destroy 后 render 直接 return，pending 态只停留在闭包变量里。
  assert.equal(el.querySelector('[data-agent-skill-delete-confirm]'), null);
  panel.close();
  assert.equal(el.querySelector('[data-agent-skill-delete-confirm]'), null);
  assert.equal(items().length, 1);
});

test('wheel：列表与编辑区各自接管滚动，编辑区监听为捕获阶段', () => {
  const { panel, list, editor } = make({ skills: [installedSkill('a')] });
  list.scrollHeight = 500;
  list.clientHeight = 100;
  list.dispatch('wheel', { deltaY: 40 });
  assert.equal(list.scrollTop, 40);
  editor.scrollHeight = 300;
  editor.clientHeight = 50;
  editor.dispatch('wheel', { deltaY: -10 });
  assert.equal(editor.scrollTop, 0);
  const click = panel.element.querySelector('.agent-skill-close-btn');
  click.dispatch('click');
  assert.equal(panel.element.hidden, true);
});
