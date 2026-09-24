import test from 'node:test';
import assert from 'node:assert/strict';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { agentPanelText, formatAgentPanelText } from './agentPanelText.js';
import { formatAgentAssistantMarkdown } from './agentAssistantMarkdown.js';

/* 假 DOM：只实现本件（与其依赖的滚动/流式呈现）实际用到的 API。
   注意：document.createElement 存在但 template.content 不存在，故 sanitizeRichTextHtml() 走「真实 DOM 分支」时
   解析结果为空串 —— 本文件因此**不断言 Markdown 的 HTML 产物**，只断言类名、文本与结构。 */
function matchSelector(node, selector) {
  const m = /^\.([\w-]+)(?::not\(\.([\w-]+)\))?$/.exec(selector);
  if (!m) throw new Error('unsupported selector: ' + selector);
  return node.classes.has(m[1]) && !(m[2] && node.classes.has(m[2]));
}
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.handlers = {};
    this.classes = new Set();
    this.dataset = {};
    this.textContent = '';
    this.hidden = false;
    this.scrollHeight = 0;
    this.clientHeight = 0;
    this.scrollTop = 0;
    this.style = {};
    const self = this;
    this.classList = {
      add: (c) => self.classes.add(c),
      remove: (c) => self.classes.delete(c),
      contains: (c) => self.classes.has(c),
      toggle: (c, force) => {
        const on = force === undefined ? !self.classes.has(c) : !!force;
        if (on) self.classes.add(c);
        else self.classes.delete(c);
        return on;
      },
      *[Symbol.iterator]() {
        yield* self.classes;
      },
    };
  }
  get className() {
    return [...this.classes].join(' ');
  }
  set className(value) {
    this.classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(value) {
    this._innerHTML = String(value);
  }
  setAttribute(key, value) {
    this.attrs[key] = String(value);
  }
  getAttribute(key) {
    return key in this.attrs ? this.attrs[key] : null;
  }
  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }
  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }
  replaceChildren(...nodes) {
    this.children = [];
    for (const node of nodes) this.appendChild(node);
  }
  insertBefore(node, ref) {
    node.parentNode = this;
    const index = this.children.indexOf(ref);
    if (index < 0) this.children.push(node);
    else this.children.splice(index, 0, node);
    return node;
  }
  remove() {
    const parent = this.parentNode;
    if (!parent) return;
    const index = parent.children.indexOf(this);
    if (index >= 0) parent.children.splice(index, 1);
    this.parentNode = null;
  }
  addEventListener(type, fn) {
    (this.handlers[type] ||= []).push(fn);
  }
  dispatch(type, event = {}) {
    return [...(this.handlers[type] || [])].map((fn) =>
      fn({ type, target: this, preventDefault() {}, stopPropagation() {}, ...event }),
    );
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
  querySelector(selector) {
    return this.descendants().find((node) => matchSelector(node, selector)) || null;
  }
  querySelectorAll(selector) {
    return this.descendants().filter((node) => matchSelector(node, selector));
  }
}
globalThis.document = {
  createElement: (tag) => new El(tag),
  createTextNode: (text) => ({ nodeType: 0x3, textContent: String(text) }),
};

const {
  AGENT_CONVERSATION_INPUT_REF_LIMIT,
  normalizeAgentRenderableMediaUrl,
  formatAgentAssistantMarkdown: reexportedMarkdownFormatter,
  createAgentConversationPresentation,
} = await import('./agentConversationPresentation.js');

const messages = () => new El('div');
const steps = () => new El('div');

function make(over = {}) {
  const defaults = {
    messagesEl: messages(),
    runStepsEl: steps(),
    sessionStore: null,
    getHistory: () => [],
    onCopy: null,
    onImagePreview: null,
    copyIconHtml: '',
    onMessagesChanged: null,
    onConversationInvalidated: null,
  };
  const merged = {};
  for (const key of Object.keys(defaults)) merged[key] = key in over ? over[key] : defaults[key];
  return createAgentConversationPresentation(merged);
}

function makeStore(history = []) {
  const calls = { subscribe: [], stream: [], unsubscribes: 0 };
  return {
    calls,
    history,
    subscribe(fn) {
      calls.subscribe.push(fn);
      return () => {
        calls.unsubscribes += 1;
      };
    },
    subscribeAssistantStream(fn) {
      calls.stream.push(fn);
      return () => {
        calls.unsubscribes += 1;
      };
    },
  };
}

const taskResult = (taskId, nodeId, status) => ({
  messageType: 'task_result',
  task: { taskId, nodeId, status },
});

test('导出面：常量 12、formatAgentAssistantMarkdown 为同一引用、工厂返回冻结的 10 键对象', () => {
  assert.equal(AGENT_CONVERSATION_INPUT_REF_LIMIT, 0xc);
  assert.equal(reexportedMarkdownFormatter, formatAgentAssistantMarkdown);
  const api = make();
  assert.equal(Object.isFrozen(api), true);
  assert.deepEqual(Object.keys(api).sort(), [
    'acknowledgeSessionState',
    'appendEntry',
    'appendMessage',
    'appendWaiting',
    'destroy',
    'removeWaiting',
    'render',
    'renderMessages',
    'renderRunSteps',
    'setBusy',
  ]);
});

test('工厂：messagesEl 或 runStepsEl 缺失即抛 TypeError（两条各自命中）', () => {
  assert.throws(
    () => createAgentConversationPresentation({ runStepsEl: steps() }),
    /messagesEl and runStepsEl are required/,
  );
  assert.throws(() => createAgentConversationPresentation({ messagesEl: messages() }), TypeError);
  assert.throws(() => createAgentConversationPresentation(), TypeError);
});

test('normalizeAgentRenderableMediaUrl：空串、http(s)、前导斜杠直通', () => {
  assert.equal(normalizeAgentRenderableMediaUrl(''), '');
  assert.equal(normalizeAgentRenderableMediaUrl(null), '');
  assert.equal(normalizeAgentRenderableMediaUrl('   '), '');
  assert.equal(normalizeAgentRenderableMediaUrl(' HTTPS://a/b.png '), 'HTTPS://a/b.png');
  assert.equal(normalizeAgentRenderableMediaUrl('http://a/b.png'), 'http://a/b.png');
  assert.equal(normalizeAgentRenderableMediaUrl('/local/b.png'), '/local/b.png');
});

test('normalizeAgentRenderableMediaUrl：data:image 只在 50000 字符内直通，其余交给 localPathToUrl', () => {
  const small = 'data:image/png;base64,' + 'A'.repeat(0x64);
  assert.equal(normalizeAgentRenderableMediaUrl(small), small);
  const big = 'data:image/png;base64,' + 'A'.repeat(0xc351);
  assert.notEqual(normalizeAgentRenderableMediaUrl(big), big);
  assert.equal(
    normalizeAgentRenderableMediaUrl('C:\\media\\a.png'),
    localPathToUrl('C:\\media\\a.png') || '',
  );
  assert.equal(normalizeAgentRenderableMediaUrl('not a url'), localPathToUrl('not a url') || '');
});

test('用户消息：气泡+页脚结构、时间元素、复制按钮与自定义属性', () => {
  const root = messages();
  let copied = null;
  const api = make({ messagesEl: root, onCopy: (text) => (copied = text), copyIconHtml: 'ICON' });
  const el = api.appendMessage('user', '你好', { ts: 1700000000000 });
  assert.equal(el.className, 'agent-message agent-message--user');
  assert.equal(el.agentMessageContent, '你好');
  assert.equal(el.agentMessageCopyText, '你好');
  const bubble = el.children[0];
  assert.equal(bubble.className, 'agent-message-bubble');
  assert.equal(bubble.children[0].className, 'agent-message-body');
  assert.equal(bubble.children[0].textContent, '你好');
  const footer = el.children[1];
  assert.equal(footer.className, 'agent-message-footer');
  assert.equal(footer.children[0].className, 'agent-message-time');
  assert.match(footer.children[0].getAttribute('datetime'), /^\d{4}-\d{2}-\d{2}T/);
  const button = footer.children[1];
  assert.equal(button.className, 'agent-message-copy-btn');
  assert.equal(button.innerHTML, 'ICON');
  assert.equal(button.getAttribute('aria-label'), agentPanelText('copyMessage'));
  button.dispatch('click');
  assert.equal(copied, '你好');
  assert.equal(root.children.length, 1);
});

test('ts 非法（null/0/NaN）时不生成时间元素，页脚只剩复制按钮', () => {
  const root = messages();
  const api = make({ messagesEl: root });
  const el = api.appendMessage('user', 'x', { ts: null });
  const footer = el.children[1];
  assert.equal(footer.children.length, 1);
  assert.equal(footer.children[0].className, 'agent-message-copy-btn');
});

test('助手消息：无气泡无页脚，正文与复制按钮直挂根节点并加 rich 类', () => {
  const root = messages();
  const api = make({ messagesEl: root });
  const el = api.appendMessage('assistant', '回答', {});
  assert.equal(el.children.length, 2);
  assert.equal(el.children[0].className, 'agent-message-body');
  assert.equal(el.children[0].textContent, '回答');
  assert.equal(el.children[1].className, 'agent-message-copy-btn');
  assert.equal(el.classList.contains('agent-message--rich'), true);
  assert.equal(el.querySelector('.agent-message-bubble'), null);
  assert.equal(el.querySelector('.agent-message-footer'), null);
});

test('角色归一：除严格 "user" 外一律按 assistant 处理（含 undefined 与 USER 大写）', () => {
  const api = make();
  assert.equal(api.appendMessage('USER', 'a').classes.has('agent-message--user'), false);
  assert.equal(api.appendMessage(undefined, 'a').classes.has('agent-message--assistant'), true);
  assert.equal(api.appendMessage(null, 'a').classes.has('agent-message--assistant'), true);
});

test('类名片段归一：小写、下划线转连字符、非法字符折叠；text 与空片段不追加', () => {
  const api = make();
  assert.equal(
    api.appendMessage('user', 'a', { messageType: 'Task_Result' }).className,
    'agent-message agent-message--user agent-message--task-result',
  );
  assert.equal(
    api.appendMessage('user', 'a', { messageType: 'text' }).className,
    'agent-message agent-message--user',
  );
  assert.equal(
    api.appendMessage('user', 'a', { messageType: 'A B!!C' }).className,
    'agent-message agent-message--user agent-message--a-b-c',
  );
  assert.equal(
    api.appendMessage('user', 'a', { status: 'running' }).className,
    'agent-message agent-message--user agent-message--status-running',
  );
});

test('appendEntry：content 回落 status、messageType 回落 type、缺省字段全部落空值', () => {
  const root = messages();
  const api = make({ messagesEl: root });
  const el = api.appendEntry({ role: 'assistant', status: '生成中', type: 'run_notice' });
  assert.equal(el.children[0].textContent, '生成中');
  assert.equal(el.classes.has('agent-message--run-notice'), true);
  assert.equal(el.classes.has('agent-message--status-生成中'), false); // 非 ASCII 片段被折叠后仍非空 → 见下行
  const plain = api.appendEntry({ role: 'user', content: 'c' });
  assert.equal(plain.className, 'agent-message agent-message--user');
});

test('renderMessages：整表重建、非数组视为空、逐条沿用同一渲染路径', () => {
  const root = messages();
  const api = make({ messagesEl: root });
  api.appendMessage('user', '先前的', {});
  api.renderMessages([
    { role: 'user', content: '一', ts: null },
    { role: 'assistant', status: '二', messageType: 'task_result' },
  ]);
  assert.equal(root.children.length, 2);
  assert.equal(root.children[0].children[0].children[0].textContent, '一');
  assert.equal(root.children[1].classes.has('agent-message--task-result'), true);
  api.renderMessages('不是数组');
  assert.equal(root.children.length, 0);
  api.renderMessages();
  assert.equal(root.children.length, 0);
});

test('onMessagesChanged：每次增删后带 hasMessages 上报', () => {
  const root = messages();
  const seen = [];
  const api = make({ messagesEl: root, onMessagesChanged: (state) => seen.push(state) });
  api.appendMessage('user', 'a', {});
  api.renderMessages([]);
  api.appendWaiting();
  assert.deepEqual(seen, [{ hasMessages: true }, { hasMessages: false }, { hasMessages: true }]);
});

test('输入引用：无 nodeId/id 的条目被丢弃、超过 12 条截断、role=list', () => {
  const api = make();
  const refs = Array.from({ length: 0xf }, (_0, i) => ({ nodeId: 'n' + i, label: 'L' + i }));
  const el = api.appendMessage('user', 'a', { inputRefs: refs });
  const wrap = el.querySelector('.agent-message-input-refs');
  assert.equal(wrap.children.length, AGENT_CONVERSATION_INPUT_REF_LIMIT);
  assert.equal(wrap.getAttribute('role'), 'list');
  assert.equal(el.children[0].children.length, 2);
  assert.equal(el.children[0].children[1], wrap);
  const empty = make().appendMessage('user', 'a', { inputRefs: [{ label: 'x' }, null] });
  assert.equal(empty.children.length, 2);
  assert.equal(empty.querySelector('.agent-message-input-refs'), null);
  assert.equal(make().appendMessage('user', 'a', { inputRefs: 'not array' }).children.length, 2);
});

test('输入引用：有缩略图走 img，否则用 kind 前三字母大写兜底；名称缺失回落 id', () => {
  const api = make();
  const withThumb = api.appendMessage('user', 'a', {
    inputRefs: [{ nodeId: 'id-1', thumbUrl: '/t.png', label: '甲', kind: 'image' }],
  });
  const thumb = withThumb.querySelector('.agent-message-input-ref-thumb');
  assert.equal(thumb.src, '/t.png');
  assert.equal(thumb.alt, '甲');
  assert.equal(thumb.draggable, false);
  assert.equal(withThumb.querySelector('.agent-message-input-ref-fallback'), null);
  const fallback = api.appendMessage('user', 'a', { inputRefs: [{ id: 'id-2', kind: 'video' }] });
  const chip = fallback.querySelector('.agent-message-input-ref');
  assert.equal(chip.dataset.inputRefId, 'id-2');
  assert.equal(chip.getAttribute('role'), 'listitem');
  assert.equal(chip.title, 'id-2');
  assert.equal(chip.children[0].textContent, 'VID');
  assert.equal(chip.children[0].getAttribute('aria-hidden'), 'true');
  // label/name 皆缺时回落 id，故名称节点仍存在
  assert.equal(chip.children[1].className, 'agent-message-input-ref-name');
  assert.equal(chip.children[1].textContent, 'id-2');
  const longKind = api.appendMessage('user', 'a', { inputRefs: [{ id: 'id-3', kind: 'document' }] });
  assert.equal(longKind.querySelector('.agent-message-input-ref-fallback').textContent, 'DOC');
});

test('任务图片媒体：无 media 或非 image 不建网格；单项无 is-multiple 类', () => {
  const api = make();
  const plain = api.appendMessage('user', 'a', { task: { nodeId: 'n1' } });
  assert.equal(plain.querySelector('.agent-message-media-grid'), null);
  const other = api.appendMessage('user', 'a', { task: { media: { kind: 'video', items: [{}] } } });
  assert.equal(other.querySelector('.agent-message-media-grid'), null);
  const single = api.appendMessage('user', 'a', {
    task: { nodeId: 'n1', media: { kind: 'image', items: [{ url: '/a.png', name: '甲' }] } },
  });
  const grid = single.querySelector('.agent-message-media-grid');
  assert.equal(grid.classList.contains('is-multiple'), false);
  assert.equal(grid.children.length, 1);
  const card = grid.children[0];
  assert.equal(card.type, 'button');
  assert.equal(card.title, agentPanelText('imageResultOpen'));
  assert.equal(card.getAttribute('aria-label'), '甲');
  assert.equal(card.dataset.imageUrl, '/a.png');
  assert.equal(card.dataset.imageName, '甲');
  assert.equal(card.children[0].src, '/a.png');
  assert.equal(card.children[1].textContent, '甲');
});

test('任务图片媒体：items 缺失时把 media 自身当单项；多项时 is-multiple 且名称带序号', () => {
  const api = make();
  const bare = api.appendMessage('user', 'a', { task: { media: { kind: 'image', url: '/solo.png' } } });
  assert.equal(bare.querySelector('.agent-message-media-grid').children.length, 1);
  const many = api.appendMessage('user', 'a', {
    task: {
      nodeId: 'node-x',
      media: {
        kind: 'image',
        items: [{ url: '/a.png' }, { url: '/b.png', thumbUrl: '/tb.png', name: '乙' }],
      },
    },
  });
  const grid = many.querySelector('.agent-message-media-grid');
  assert.equal(grid.classList.contains('is-multiple'), true);
  assert.equal(grid.children[0].children[1].textContent, 'node-x 1'); // name 回落 task.nodeId，多项时附序号
  assert.equal(grid.children[0].dataset.imageName, 'node-x');
  assert.equal(grid.children[1].children[1].textContent, '乙 2');
  assert.equal(grid.children[1].children[0].src, '/tb.png');
});

test('任务图片媒体：url/thumbUrl 经归一化且互为兜底，两者皆空的条目被过滤', () => {
  const api = make();
  const el = api.appendMessage('user', 'a', {
    task: {
      media: {
        kind: 'image',
        items: [{ thumbUrl: '/only-thumb.png' }, { name: '无名' }, null],
      },
    },
  });
  const grid = el.querySelector('.agent-message-media-grid');
  assert.equal(grid.children.length, 1);
  assert.equal(grid.children[0].children[0].src, '/only-thumb.png');
  assert.equal(grid.children[0].dataset.imageUrl, '/only-thumb.png');
});

test('图片卡片点击：preventDefault/stopPropagation 后回调 (url, name||nodeId)', () => {
  const seen = [];
  const api = make({ onImagePreview: (...args) => seen.push(args) });
  const el = api.appendMessage('user', 'a', {
    task: { nodeId: 'n9', media: { kind: 'image', items: [{ url: '/full.png' }] } },
  });
  el.querySelector('.agent-message-media-card').dispatch('click');
  assert.deepEqual(seen, [['/full.png', 'n9']]);
});

test('复制文本拼装：正文 + 节点名 + 逐张图片（多张时带序号），空正文只留媒体行', () => {
  const api = make();
  const el = api.appendMessage('user', '正文', {
    task: {
      nodeId: 'fallback-name',
      media: { kind: 'image', items: [{ url: '/a.png' }, { url: '/b.png' }] },
    },
  });
  const lines = el.agentMessageCopyText.split('\x0a');
  assert.equal(lines[0], '正文');
  assert.equal(
    lines[1],
    agentPanelText('copyMessageNodeLabel') + agentPanelText('copyMessageSeparator') + 'fallback-name',
  );
  assert.equal(
    lines[2],
    agentPanelText('copyMessageImageLabel') + '1' + agentPanelText('copyMessageSeparator') + '/a.png',
  );
  assert.equal(
    lines[3],
    agentPanelText('copyMessageImageLabel') + '2' + agentPanelText('copyMessageSeparator') + '/b.png',
  );
  assert.equal(lines.length, 4);
  const single = api.appendMessage('user', '只一张', {
    task: { media: { kind: 'image', name: '命名', items: [{ url: '/c.png' }] } },
  });
  const singleLines = single.agentMessageCopyText.split('\x0a');
  assert.equal(
    singleLines[2],
    agentPanelText('copyMessageImageLabel') + agentPanelText('copyMessageSeparator') + '/c.png',
  );
  const empty = api.appendMessage('user', '   ', { task: { nodeId: 'only-name' } });
  // 正文被 trim 掉，但节点名行仍在 ⇒ 复制文本非空
  assert.equal(
    empty.agentMessageCopyText,
    agentPanelText('copyMessageNodeLabel') + agentPanelText('copyMessageSeparator') + 'only-name',
  );
});

test('诊断块：null 与非对象不建；无 summary 不建；有 summary 才出标题/阶段/meta', () => {
  const api = make();
  assert.equal(api.appendMessage('user', 'a', { diagnostic: null }).querySelector('.agent-diagnostic'), null);
  assert.equal(
    api.appendMessage('user', 'a', { diagnostic: 'str' }).querySelector('.agent-diagnostic'),
    null,
  );
  assert.equal(
    api.appendMessage('user', 'a', { diagnostic: { phase: 'p' } }).querySelector('.agent-diagnostic'),
    null,
  );
  const el = api.appendMessage('user', 'a', {
    diagnostic: { summary: '出错了', phaseLabel: '生成阶段', step: 3, completedSteps: 1 },
  });
  const section = el.querySelector('.agent-diagnostic');
  assert.equal(section.hidden, false);
  assert.equal(section.getAttribute('aria-label'), agentPanelText('diagnosticTitle'));
  const header = section.children[0];
  assert.equal(header.children[0].textContent, agentPanelText('diagnosticTitle'));
  assert.equal(header.children[1].textContent, '生成阶段');
  assert.equal(section.children[1].textContent, '出错了');
  const meta = section.children[2];
  assert.equal(meta.children[0].textContent, formatAgentPanelText('diagnosticStep', { step: 3 }));
  assert.equal(meta.children[1].textContent, formatAgentPanelText('diagnosticCompleted', { count: 1 }));
  assert.equal(section.children[3].className, 'agent-diagnostic-toggle');
  assert.equal(section.children[4].className, 'agent-diagnostic-detail');
});

test('诊断块：phaseLabel 回落 phase；step/completedSteps 越界与非法值被夹取', () => {
  const api = make();
  const el = api.appendMessage('user', 'a', {
    diagnostic: { summary: 's', phase: 'run', step: 0, completedSteps: -3 },
  });
  const header = el.querySelector('.agent-diagnostic').children[0];
  assert.equal(header.children[1].textContent, 'run');
  const meta = el.querySelector('.agent-diagnostic-meta');
  assert.equal(meta.children[0].textContent, formatAgentPanelText('diagnosticStep', { step: 1 }));
  assert.equal(meta.children[1].textContent, formatAgentPanelText('diagnosticCompleted', { count: 0 }));
  const nan = api.appendMessage('user', 'a', {
    diagnostic: { summary: 's', step: 'x', completedSteps: 'y' },
  });
  const nanMeta = nan.querySelector('.agent-diagnostic-meta');
  // Math.max(1, Number('x')) 与 Math.max(0, Number('y')) 都得 NaN，夹取失效并直出文案
  assert.equal(nanMeta.children[0].textContent, '第 NaN 步');
  assert.match(nanMeta.children[1].textContent, /NaN/);
});

test('诊断详情：detail 与 errorCode 各成节点，默认 hidden；切换按钮翻转 hidden/aria-expanded/文案', () => {
  const api = make();
  const el = api.appendMessage('user', 'a', {
    diagnostic: { summary: 's', detail: '堆栈', errorCode: 'E1' },
  });
  const section = el.querySelector('.agent-diagnostic');
  const detail = section.children[4];
  assert.equal(detail.hidden, true);
  const toggle = section.children[3];
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.textContent, agentPanelText('diagnosticDetails'));
  toggle.dispatch('click');
  assert.equal(detail.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.textContent, agentPanelText('diagnosticDetailsHide'));
  assert.equal(detail.children[0].textContent, '堆栈');
  assert.equal(detail.children[1].textContent, formatAgentPanelText('diagnosticErrorCode', { code: 'E1' }));
  toggle.dispatch('click');
  assert.equal(detail.hidden, true);
  assert.equal(toggle.textContent, agentPanelText('diagnosticDetails'));
  const bare = api.appendMessage('user', 'a', { diagnostic: { summary: 's' } });
  assert.equal(bare.querySelector('.agent-diagnostic-detail').children.length, 0);
});

test('等待态：appendWaiting 造三个点并滚到底，removeWaiting 移除后重报', () => {
  const root = messages();
  const api = make({ messagesEl: root });
  api.appendMessage('user', 'q', {});
  const waiting = api.appendWaiting();
  assert.equal(waiting.className, 'agent-message agent-message--assistant agent-message--typing');
  assert.equal(waiting.children[0].textContent, agentPanelText('waiting'));
  assert.equal(waiting.children[1].children.length, 3);
  assert.equal(root.children.length, 2);
  api.removeWaiting(waiting);
  assert.equal(root.children.length, 1);
  assert.equal(waiting.parentNode, null);
  api.removeWaiting(null);
  api.removeWaiting({ parentNode: null });
  assert.equal(root.children.length, 1);
});

test('renderRunSteps：无步骤时隐藏容器，有步骤时重建标题与列表', () => {
  const root = steps();
  const api = make({ runStepsEl: root });
  api.renderRunSteps({});
  assert.equal(root.hidden, true);
  assert.equal(root.children.length, 0);
  api.renderRunSteps({
    currentRun: { id: 'r1', status: 'running' },
    runEvents: [{ runId: 'r1', type: 'step', label: '开始', status: 'completed' }],
  });
  assert.equal(root.hidden, false);
  assert.equal(root.children.length, 2);
  assert.equal(root.children[0].className, 'agent-run-steps-title');
  assert.equal(root.children[1].className, 'agent-run-steps-list');
});

test('会话投影 dataset：ok 为 matched、非 ok 为 mismatch、缺失时删除两个键', () => {
  const root = messages();
  const api = make({ messagesEl: root });
  api.render({
    history: [],
    sessionSnapshot: { sessionProjectionParity: { ok: true, mismatches: ['a', 'b'] } },
  });
  assert.equal(root.dataset.sessionProjection, 'matched');
  assert.equal(root.dataset.sessionProjectionMismatches, 'a,b');
  api.render({ history: [], sessionSnapshot: { sessionProjectionParity: { ok: false } } });
  assert.equal(root.dataset.sessionProjection, 'mismatch');
  assert.equal('sessionProjectionMismatches' in root.dataset, false);
  api.render({ history: [], sessionSnapshot: {} });
  assert.equal('sessionProjection' in root.dataset, false);
  assert.equal(root.children.length, 0);
  api.render();
  assert.equal('sessionProjection' in root.dataset, false);
});

test('render：历史整表重建 + 运行步骤 + 投影三件事一次做完', () => {
  const root = messages();
  const runRoot = steps();
  const api = make({ messagesEl: root, runStepsEl: runRoot });
  api.render({
    history: [{ role: 'user', content: 'h1', ts: null }],
    sessionSnapshot: { sessionProjectionParity: { ok: true, mismatches: [] } },
  });
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].children[0].children[0].textContent, 'h1');
  assert.equal(root.dataset.sessionProjection, 'matched');
  assert.equal(runRoot.hidden, true);
});

test('忙碌态与脏标记：acknowledgeSessionState 清 pending，setBusy(false) 时才广播失效', () => {
  const invalidated = [];
  const store = makeStore([]);
  const api = make({
    sessionStore: store,
    onConversationInvalidated: (payload) => invalidated.push(payload),
  });
  const fire = store.calls.subscribe[0];
  fire({}, { type: 'other' }); // 首帧被吞
  assert.deepEqual(invalidated, []);
  api.setBusy(true);
  fire({}, { type: 'run_event' });
  assert.deepEqual(invalidated, []);
  fire({}, { type: 'entry_committed', entry: taskResult('t1', 'n1', 'completed') });
  api.setBusy(false);
  assert.deepEqual(invalidated, [{ historyOnly: true }]);
  api.setBusy(false);
  assert.equal(invalidated.length, 1);
});

test('setBusy(true) 永远直接返回；停止态下 setBusy(false) 不再广播', () => {
  const invalidated = [];
  const store = makeStore([]);
  const api = make({ sessionStore: store, onConversationInvalidated: (p) => invalidated.push(p) });
  const fire = store.calls.subscribe[0];
  api.setBusy(true);
  fire({}, { type: 'history', entry: { role: 'assistant', content: 'c' } });
  api.setBusy(true);
  assert.deepEqual(invalidated, []);
  api.destroy();
  api.setBusy(false);
  assert.deepEqual(invalidated, []);
});

test('acknowledgeSessionState：按 task_result 键移除 pending，非 task_result 与无键条目忽略', () => {
  const invalidated = [];
  const store = makeStore([]);
  const api = make({ sessionStore: store, onConversationInvalidated: (p) => invalidated.push(p) });
  const fire = store.calls.subscribe[0];
  api.setBusy(true);
  fire({}, { type: 'entry', entry: taskResult('t1', 'n1', 'completed') });
  fire({}, { type: 'entry', entry: taskResult('t2', 'n2', 'failed') });
  api.acknowledgeSessionState({
    taskMessages: [taskResult('t1', 'n1', 'completed'), { type: 'text' }, taskResult('', '', '')],
  });
  api.setBusy(false);
  assert.deepEqual(invalidated, [{ historyOnly: true }]);
  api.setBusy(true);
  fire({}, { type: 'entry', entry: taskResult('t3', 'n3', 'completed') });
  api.acknowledgeSessionState({ taskMessages: [taskResult('t3', 'n3', 'completed')] });
  api.setBusy(false);
  assert.equal(invalidated.length, 1);
  api.acknowledgeSessionState({ taskMessages: 'not array' });
  api.setBusy(true);
  fire({}, { type: 'entry', entry: { messageType: 'task_result', status: 'done' } });
  assert.equal(invalidated.length, 1);
});

test('忙碌期订阅：run_event 只重绘步骤、history 条目置脏、task_result 记键', () => {
  const root = messages();
  const runRoot = steps();
  const invalidated = [];
  const store = makeStore([]);
  const api = make({
    messagesEl: root,
    runStepsEl: runRoot,
    sessionStore: store,
    onConversationInvalidated: (p) => invalidated.push(p),
  });
  const fire = store.calls.subscribe[0];
  fire({ currentRun: null, runEvents: [] }, { type: 'other' });
  api.setBusy(true);
  fire(
    {
      currentRun: { id: 'r1', status: 'running' },
      runEvents: [{ runId: 'r1', type: 'step', label: 'L', status: 'completed' }],
    },
    { type: 'run_event' },
  );
  assert.equal(runRoot.hidden, false);
  assert.equal(root.children.length, 0);
  fire({}, { type: 'history', entry: { role: 'assistant', content: '不渲染' } });
  assert.equal(root.children.length, 0);
  api.setBusy(false);
  assert.deepEqual(invalidated, [{ historyOnly: true }]);
});

test('非忙碌期订阅：history 条目即时入列并刷新步骤，其他类型只广播失效', () => {
  const root = messages();
  const store = makeStore([]);
  const invalidated = [];
  const api = make({
    messagesEl: root,
    sessionStore: store,
    onConversationInvalidated: (p) => invalidated.push(p),
  });
  const fire = store.calls.subscribe[0];
  fire({}, { type: 'skip' });
  fire({}, { type: 'history', entry: { role: 'user', content: '即时', ts: null } });
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].children[0].children[0].textContent, '即时');
  fire({}, { type: 'history', entry: null });
  assert.deepEqual(invalidated, [undefined]);
  fire({}, {});
  assert.equal(invalidated.length, 2);
});

test('history_replaced：非忙碌时走流式 reconcile（多余条目被移除、缺失条目被追加）', () => {
  const root = messages();
  const store = makeStore([]);
  const api = make({ messagesEl: root, sessionStore: store, getHistory: () => store.history });
  const fire = store.calls.subscribe[0];
  fire({}, { type: 'skip' });
  api.appendMessage('user', '保留', { ts: null });
  api.appendMessage('assistant', '旧的', {});
  store.history = [
    { role: 'user', content: '保留', ts: null },
    { role: 'user', content: '补上', ts: null },
  ];
  fire({}, { type: 'history_replaced' });
  assert.equal(root.children.length, 2);
  assert.equal(root.children[0].children[0].children[0].textContent, '保留');
  // 对齐是按 DOM 位置逐条覆盖，不是按内容增删：第二条被就地改写
  assert.equal(root.children[1].children[0].textContent, '补上');
  assert.equal(root.children[1].agentMessageCopyText, '补上');
  store.history = [{ role: 'user', content: '只留这条', ts: null }];
  fire({}, { type: 'history_replaced' });
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].children[0].children[0].textContent, '只留这条');
});

test('sessionStore 缺端口时构造不抛错；destroy 幂等地解除两个订阅', () => {
  const store = makeStore([]);
  const api = make({ sessionStore: store });
  assert.equal(store.calls.subscribe.length, 1);
  assert.equal(store.calls.stream.length, 1);
  assert.equal(typeof store.calls.stream[0], 'function');
  api.destroy();
  api.destroy();
  // destroy 不置空退订句柄 ⇒ 二次调用会再退订一遍（共 4 次）
  assert.equal(store.calls.unsubscribes, 4);
  assert.equal(make().appendMessage('user', 'a', {}) instanceof El, true);
});

test('destroy 之后订阅回调被完全吞掉', () => {
  const root = messages();
  const store = makeStore([]);
  const invalidated = [];
  const api = make({
    messagesEl: root,
    sessionStore: store,
    onConversationInvalidated: (p) => invalidated.push(p),
  });
  const fire = store.calls.subscribe[0];
  fire({}, { type: 'skip' });
  api.destroy();
  fire({}, { type: 'history', entry: { role: 'user', content: 'X' } });
  fire({}, { type: 'anything' });
  assert.equal(root.children.length, 0);
  assert.deepEqual(invalidated, []);
});

test('流式 handle：无 start 前置的 end 完全不生效，start→end 才走 reconcile', () => {
  const root = messages();
  const store = makeStore([{ role: 'assistant', content: '落地', itemId: 'i1' }]);
  const settled = [];
  const api = make({
    messagesEl: root,
    sessionStore: store,
    getHistory: () => store.history,
    onMessagesChanged: (s) => settled.push(s),
  });
  const handle = store.calls.stream[0];
  const fire = store.calls.subscribe[0];
  fire({}, { type: 'skip' });
  api.appendMessage('assistant', '在屏', {});
  handle({ type: 'end', runId: 'r0', discard: false, history: store.history });
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].agentMessageContent, '在屏');
  handle({ type: 'start', runId: 'r1', revision: 0 });
  handle({ type: 'end', runId: 'r1', discard: false, history: store.history });
  assert.equal(root.children.length, 1);
  // 助手条目经 updateAgentMessageBody 走 innerHTML 通道；假 DOM 无法解析 HTML ⇒ 归一为空串
  assert.equal(root.children[0].agentMessageContent, '落地');
  assert.equal(root.children[0].dataset.messageId, 'i1');
  assert.equal(root.children[0].querySelector('.agent-message-body').innerHTML, '');
  assert.equal(root.children[0].children[0].textContent, '在屏');
  assert.deepEqual(settled[settled.length - 1], { hasMessages: true });
});
