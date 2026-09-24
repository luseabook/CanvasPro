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
    this.scrollIntoViewCount = 0;
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
  get id() {
    return this.attrs.id || '';
  }
  set id(value) {
    this.attrs.id = String(value);
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
  scrollIntoView() {
    this.scrollIntoViewCount += 1;
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

const { createAgentSkillPicker } = await import('./agentSkillPicker.js');

const text = (key) => 'T:' + key;
const installed = (id, extra = {}) => ({ id, source: 'installed', enabled: true, ...extra });

function make(registrySkills = [], over = {}) {
  const registry = {
    listSkills: () => registrySkills.map((skill) => ({ ...skill })),
    ...(over.registry || {}),
  };
  const selected = [];
  const trigger = over.slashTrigger === undefined ? new El('button') : over.slashTrigger;
  const picker = createAgentSkillPicker({
    registry,
    text,
    onSelect: (skill) => selected.push(skill),
    slashTrigger: trigger,
  });
  return { picker, menu: picker.menu, selected, registry, trigger };
}

const items = (menu) => menu.querySelectorAll('[data-agent-skill-pick]');

test('createAgentSkillPicker：返回接口固定，菜单带 listbox 语义并挂到触发器', () => {
  const { picker, menu, trigger } = make();
  assert.deepEqual(Object.keys(picker), [
    'element',
    'menu',
    'render',
    'refreshText',
    'openSlash',
    'moveActive',
    'chooseActive',
    'destroy',
  ]);
  assert.equal(picker.refreshText, picker.render);
  assert.equal(menu.attrs.role, 'listbox');
  assert.equal(menu.attrs.id, 'agent-skill-picker-menu');
  assert.equal(menu.id, 'agent-skill-picker-menu');
  assert.equal(menu.agentPopoverTrigger, trigger);
  assert.equal(trigger.attrs['aria-haspopup'], 'listbox');
  assert.equal(trigger.attrs['aria-controls'], 'agent-skill-picker-menu');
  assert.equal(menu.parentNode, picker.element);
  assert.equal(picker.element.className, 'agent-skill-picker');
  assert.equal(menu.classes.has('agent-floating-menu'), true);
  assert.equal(menu.classes.has('agent-skill-picker-menu'), true);
});

test('列表只呈现 installed 且未显式禁用的技能', () => {
  const { menu } = make([
    installed('a', { title: 'A', description: 'd' }),
    { id: 'built', source: 'built-in', enabled: true },
    { id: 'off', source: 'installed', enabled: false },
    { id: 'undefined-flag', source: 'installed' },
  ]);
  assert.deepEqual(
    items(menu).map((node) => node.dataset.agentSkillPick),
    ['a', 'undefined-flag'],
  );
  // 缺 listSkills / 返回非数组时按空列表处理。
  const empty = createAgentSkillPicker({ registry: {}, text, onSelect: () => {} });
  assert.deepEqual(empty.menu.children.length, 1);
  assert.equal(empty.menu.children[0].classes.has('agent-skill-picker-empty'), true);
});

test('条目文案回落与选中态由 id 与 active 索引共同决定', () => {
  const { menu } = make([installed('a', { title: '甲', description: '说明甲' }), installed('b')]);
  const [first, second] = items(menu);
  assert.equal(first.querySelector('.agent-skill-picker-item-title').textContent, '甲');
  assert.equal(first.querySelector('.agent-skill-picker-item-desc').textContent, '说明甲');
  assert.equal(second.querySelector('.agent-skill-picker-item-title').textContent, 'b');
  assert.equal(second.querySelector('.agent-skill-picker-item-desc').textContent, '$b');
  assert.equal(second.querySelectorAll('.agent-skill-picker-item-desc').length, 1);
  assert.deepEqual(
    [first, second].map((node) => [node.attrs.role, node.attrs['aria-selected'], node.classes.has('active')]),
    [
      ['option', 'false', false],
      ['option', 'false', false],
    ],
  );
});

test('无描述技能仍带 desc 节点；描述为空串走 $id 回落', () => {
  const { menu } = make([installed('x', { description: '' })]);
  assert.equal(items(menu)[0].querySelector('.agent-skill-picker-item-desc').textContent, '$x');
});

test('空列表提示取自 text(skillPickerEmpty)', () => {
  const { menu } = make([]);
  const empty = menu.querySelector('.agent-skill-picker-empty');
  assert.equal(empty.textContent, 'T:skillPickerEmpty');
  assert.equal(empty.classes.has('agent-custom-empty'), true);
});

test('openSlash：查询串 trim、重置选中项，并按 id/标题/描述大小写不敏感过滤', () => {
  const { picker, menu } = make([
    installed('alpha', { title: '生成图片', description: 'gen' }),
    installed('beta', { title: 'Bee', description: '别的' }),
  ]);
  picker.moveActive(1);
  assert.equal(items(menu)[0].classes.has('active'), true);
  picker.openSlash('  BEE  ');
  assert.deepEqual(
    items(menu).map((node) => node.dataset.agentSkillPick),
    ['beta'],
  );
  assert.equal(items(menu)[0].classes.has('active'), false);
  picker.openSlash('GEN');
  assert.deepEqual(
    items(menu).map((node) => node.dataset.agentSkillPick),
    ['alpha'],
  );
  picker.openSlash('匹配不到');
  assert.equal(menu.children[0].classes.has('agent-skill-picker-empty'), true);
  picker.openSlash();
  assert.equal(items(menu).length, 2);
});

test('moveActive：无条目返回 false，有条目按方向回环并同步 aria-selected', () => {
  const { picker, menu } = make([installed('a'), installed('b'), installed('c')]);
  assert.equal(picker.moveActive(1), true);
  assert.deepEqual(
    items(menu).map((node) => [node.classes.has('active'), node.attrs['aria-selected']]),
    [
      [true, 'true'],
      [false, 'false'],
      [false, 'false'],
    ],
  );
  picker.moveActive(1);
  picker.moveActive(1);
  assert.equal(items(menu)[2].classes.has('active'), true);
  // 末尾再前进回环到首项。
  picker.moveActive(1);
  assert.equal(items(menu)[0].classes.has('active'), true);
  // 未选中任何项时后退直接落到末项。
  picker.openSlash('');
  assert.equal(picker.moveActive(-1), true);
  assert.equal(items(menu)[2].classes.has('active'), true);
  assert.equal(items(menu)[2].scrollIntoViewCount, 1);
  // 端口现状（未打补丁）：步进用 Number()，可解析的数字字符串照样生效。
  picker.openSlash('');
  assert.equal(picker.moveActive('-1'), true);
  assert.equal(items(menu)[2].classes.has('active'), true);
  // 真正非数值的步进按正数处理（Number('x') < 0 为 false）。
  picker.openSlash('');
  assert.equal(picker.moveActive('x'), true);
  assert.equal(items(menu)[0].classes.has('active'), true);
  const empty = createAgentSkillPicker({ registry: { listSkills: () => [] }, text });
  assert.equal(empty.moveActive(1), false);
});

test('chooseActive：首次步进落在首项，未选中回落首项，技能消失则返回 false', () => {
  const skills = [installed('a'), installed('b')];
  const { picker, selected, registry } = make(skills);
  assert.equal(picker.chooseActive(), true);
  assert.deepEqual(
    selected.map((s) => s.id),
    ['a'],
  );
  // 尚无选中项时，第一次 moveActive 只是把游标放到首项，因此再次选择仍是 a。
  picker.moveActive(1);
  assert.equal(picker.chooseActive(), true);
  assert.deepEqual(
    selected.map((s) => s.id),
    ['a', 'a'],
  );
  picker.moveActive(1);
  assert.equal(picker.chooseActive(), true);
  assert.deepEqual(
    selected.map((s) => s.id),
    ['a', 'a', 'b'],
  );
  // 列表被外部改动后 active id 找不到对应技能：返回 false 且不回调。
  registry.listSkills = () => [];
  assert.equal(picker.chooseActive(), false);
  assert.equal(selected.length, 3);
});

test('点击委托：命中条目回调技能，禁用与未知 id 不回调', () => {
  const { picker, menu, selected } = make([installed('a', { title: 'A' }), installed('b')]);
  const first = items(menu)[0];
  let prevented = 0;
  let stopped = 0;
  menu.dispatch('click', {
    target: first,
    preventDefault: () => (prevented += 1),
    stopPropagation: () => (stopped += 1),
  });
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.deepEqual(
    selected.map((s) => s.id),
    ['a'],
  );
  first.disabled = true;
  menu.dispatch('click', { target: first });
  assert.equal(selected.length, 1);
  // 未命中 data 属性时静默返回，且不调用 preventDefault。
  let prevented2 = 0;
  menu.dispatch('click', {
    target: new El('div'),
    preventDefault: () => (prevented2 += 1),
  });
  assert.equal(prevented2, 0);
  assert.equal(selected.length, 1);
});

test('点击委托按最近祖先匹配，嵌套 copy 节点同样可点', () => {
  const { menu, selected } = make([installed('a')]);
  const copy = items(menu)[0].querySelector('.agent-skill-picker-item-copy');
  menu.dispatch('click', { target: copy });
  assert.deepEqual(
    selected.map((s) => s.id),
    ['a'],
  );
});

test('wheel 由 createAgentScrollableWheelHandler 接管并按 scrollHeight 夹取 scrollTop', () => {
  const { menu } = make([installed('a')]);
  menu.scrollHeight = 400;
  menu.clientHeight = 100;
  let prevented = 0;
  menu.dispatch('wheel', { deltaY: 30, preventDefault: () => (prevented += 1) });
  // 可滚范围 = scrollHeight - clientHeight = 300，deltaMode 默认按 1 倍步长。
  assert.equal(menu.scrollTop, 30);
  assert.equal(prevented, 1);
  menu.dispatch('wheel', { deltaY: 100 });
  assert.equal(menu.scrollTop, 130);
  menu.dispatch('wheel', { deltaY: 9999 });
  assert.equal(menu.scrollTop, 300);
  // 已在边界时不再调用 preventDefault。
  let preventedAtEdge = 0;
  menu.dispatch('wheel', {
    deltaY: 10,
    preventDefault: () => (preventedAtEdge += 1),
  });
  assert.equal(preventedAtEdge, 0);
  assert.equal(menu.scrollTop, 300);
});

test('destroy：摘掉 click 与 wheel 监听，界面数据保留', () => {
  const { picker, menu, selected } = make([installed('a')]);
  picker.destroy();
  menu.dispatch('click', { target: items(menu)[0] });
  menu.scrollHeight = 400;
  menu.clientHeight = 100;
  menu.dispatch('wheel', { deltaY: 30 });
  assert.equal(selected.length, 0);
  assert.equal(menu.scrollTop, 0);
  assert.equal(items(menu).length, 1);
});

test('registry.listSkills 抛错时不做兜底：构造期首渲染即抛出（端口无 try/catch）', () => {
  const registry = {
    listSkills: () => {
      throw new Error('boom');
    },
  };
  assert.throws(() => createAgentSkillPicker({ registry, text }), /boom/);
});
