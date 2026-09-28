import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCommentThreads } from './collaborationCommentThreads.js';
import { collaborationMemberColor } from './collaborationMemberColor.js';

// Minimal tree/event-registration adapter, not browser layout or event dispatch.
// ReviewDom, MemberColor and the transitive icon modules are real imports.
function documentAdapter() {
  const log = { tags: [], replacements: [], scroll: [], htmlWrites: 0 };
  const text = (value) => ({ nodeType: 3, textContent: String(value), parentNode: null });
  function createElement(tag) {
    let scroll = 0;
    const properties = new Map(),
      attributes = new Map();
    const node = {
      nodeType: 1,
      localName: tag.toLowerCase(),
      className: '',
      childNodes: [],
      parentNode: null,
      listeners: new Map(),
      style: {
        setProperty(k, v) {
          properties.set(k, String(v));
        },
        getPropertyValue(k) {
          return properties.get(k) || '';
        },
      },
      setAttribute(k, v) {
        attributes.set(k, String(v));
      },
      getAttribute(k) {
        return attributes.get(k) ?? null;
      },
      append(...values) {
        for (const value of values) {
          const child = value?.nodeType ? value : text(value);
          if (child.parentNode)
            child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
          child.parentNode = this;
          this.childNodes.push(child);
        }
      },
      replaceChildren(...values) {
        log.replacements.push(this);
        for (const child of this.childNodes) child.parentNode = null;
        this.childNodes = [];
        scroll = 0;
        this.append(...values);
      },
      insertBefore(child, before) {
        if (before === null) {
          this.append(child);
          return child;
        }
        assert.ok(this.childNodes.includes(before), 'reference node must belong to parent');
        if (child.parentNode)
          child.parentNode.childNodes.splice(child.parentNode.childNodes.indexOf(child), 1);
        this.childNodes.splice(this.childNodes.indexOf(before), 0, child);
        child.parentNode = this;
        return child;
      },
      addEventListener(type, listener) {
        if (!this.listeners.has(type)) this.listeners.set(type, []);
        this.listeners.get(type).push(listener);
      },
    };
    if (node.localName === 'button') node.type = 'submit';
    const classes = () => node.className.split(/\s+/).filter(Boolean);
    node.classList = {
      add(...names) {
        node.className = [...new Set([...classes(), ...names])].join(' ');
      },
      contains(name) {
        return classes().includes(name);
      },
      toggle(name, force) {
        const set = new Set(classes()),
          enabled = arguments.length === 2 ? !!force : !set.has(name);
        if (enabled) set.add(name);
        else set.delete(name);
        node.className = [...set].join(' ');
        return enabled;
      },
    };
    Object.defineProperties(node, {
      children: { get: () => node.childNodes.filter((child) => child.nodeType === 1) },
      firstChild: { get: () => node.childNodes[0] || null },
      textContent: {
        get: () => node.childNodes.map((child) => child.textContent).join(''),
        set(value) {
          node.childNodes = [];
          if (value != null && value !== '') node.append(text(value));
        },
      },
      scrollTop: {
        get: () => scroll,
        set(value) {
          scroll = value;
          log.scroll.push({ node, value, children: node.children.length });
        },
      },
      innerHTML: {
        set() {
          log.htmlWrites++;
          throw new Error('HTML parsing not supported or expected');
        },
      },
    });
    log.tags.push(node.localName);
    return node;
  }
  return { document: { createElement, createTextNode: text }, log };
}

function comment(over = {}) {
  return {
    id: 'id' in over ? over.id : 't1',
    thread: 'thread' in over ? over.thread : 't1',
    actor: 'actor' in over ? over.actor : 'ann',
    name: 'name' in over ? over.name : 'Historical Ann',
    created: 'created' in over ? over.created : 123,
    body: 'body' in over ? over.body : 'Root body',
    mentions: 'mentions' in over ? over.mentions : [],
    resolved: 'resolved' in over ? over.resolved : false,
  };
}
function fixture(t, over = {}) {
  const { document, log } = documentAdapter();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, writable: true, value: document });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  const list = document.createElement('div'),
    stale = document.createElement('aside');
  stale.textContent = 'Stale';
  list.append(stale);
  list.scrollTop = 'scroll' in over ? over.scroll : 120;
  log.scroll.length = 0;
  const replyCalls = [],
    resolveCalls = [];
  const ctx = {
    document,
    log,
    list,
    stale,
    replyCalls,
    resolveCalls,
    comments: 'comments' in over ? over.comments : [comment()],
    session: {
      state: {
        actorId: 'actorId' in over ? over.actorId : 'ann',
        role: 'role' in over ? over.role : 'member',
        members:
          'members' in over
            ? over.members
            : [
                { id: 'ann', name: 'Ann', colorIndex: 0 },
                { id: 'bob', name: 'Bob', colorIndex: 1 },
              ],
      },
    },
    reply: 'reply' in over ? over.reply : (...args) => replyCalls.push(args),
    resolve: 'resolve' in over ? over.resolve : (...args) => resolveCalls.push(args),
  };
  ctx.render = (comments = ctx.comments) =>
    renderCommentThreads({ list, comments, session: ctx.session, reply: ctx.reply, resolve: ctx.resolve });
  return ctx;
}
const has = (node, name) => node.classList.contains(name);
const threads = (ctx) => ctx.list.children.filter((node) => has(node, 'collaboration-comment-thread'));
const messages = (thread) => thread.children.filter((node) => has(node, 'collaboration-comment-message'));
const actions = (thread) => thread.children.find((node) => has(node, 'collaboration-actions'));
const buttons = (thread) => actions(thread).children.filter((node) => node.localName === 'button');
const labels = (thread) => buttons(thread).map((node) => node.textContent);
const paragraph = (message) => message.children[2].children[0];
const bodies = (thread) => messages(thread).map((node) => paragraph(node).textContent);
const color = (node) => node.style.getPropertyValue('--member-color');
// Invoke the registered listener itself; this is not native DOM dispatch semantics.
function invoke(button) {
  const handlers = button.listeners.get('click');
  assert.equal(handlers.length, 1);
  return handlers[0]({ type: 'click', target: button });
}

test('empty comments replace stale content with the explicit empty state', (t) => {
  const ctx = fixture(t, { comments: [] });
  ctx.render();
  assert.equal(ctx.list.children.length, 1);
  assert.equal(ctx.list.children[0].localName, 'p');
  assert.equal(ctx.list.children[0].className, 'collaboration-subtle');
  assert.equal(ctx.list.textContent, '还没有评论，写下你的建议吧');
  assert.equal(ctx.stale.parentNode, null);
});

test('an orphan-only nonempty array renders neither a thread nor an empty-state message', (t) => {
  const ctx = fixture(t, { comments: [comment({ id: 'reply', thread: 'missing' })] });
  ctx.render();
  assert.deepEqual(ctx.list.childNodes, []);
});

test('roots and matching replies retain input order rather than sorting timestamps', (t) => {
  const a = comment({ created: 900, body: 'A' }),
    b = comment({ id: 't2', thread: 't2', created: 1, body: 'B' });
  const ctx = fixture(t, {
    comments: [
      a,
      comment({ id: 'b1', thread: 't2', body: 'B reply' }),
      b,
      comment({ id: 'a1', body: 'A late', created: 800 }),
      comment({ id: 'a2', body: 'A early', created: 2 }),
    ],
  });
  ctx.render();
  assert.deepEqual(threads(ctx).map(bodies), [
    ['A', 'A late', 'A early'],
    ['B', 'B reply'],
  ]);
});

test('a reply appearing before its root is still rendered after that root and action row', (t) => {
  const ctx = fixture(t, { comments: [comment({ id: 'reply', body: 'Before root' }), comment()] });
  ctx.render();
  const thread = threads(ctx)[0];
  assert.deepEqual(bodies(thread), ['Root body', 'Before root']);
  assert.equal(thread.children[1], actions(thread));
  assert.equal(thread.children[2], messages(thread)[1]);
});

test('thread identifiers use strict equality without string-number coercion', (t) => {
  const ctx = fixture(t, {
    comments: [
      comment({ id: 1, thread: 1 }),
      comment({ id: 'yes', thread: 1, body: 'yes' }),
      comment({ id: 'no', thread: '1', body: 'no' }),
      comment({ id: '2', thread: 2 }),
    ],
  });
  ctx.render();
  assert.equal(threads(ctx).length, 1);
  assert.deepEqual(bodies(threads(ctx)[0]), ['Root body', 'yes']);
});

test('duplicate roots are not deduplicated and same-ID records are not treated as replies', (t) => {
  const ctx = fixture(t, {
    comments: [
      comment({ body: 'first' }),
      comment({ body: 'duplicate' }),
      comment({ id: 'r', body: 'reply' }),
    ],
  });
  ctx.render();
  assert.deepEqual(threads(ctx).map(bodies), [
    ['first', 'reply'],
    ['duplicate', 'reply'],
  ]);
});

test('rerender replaces the previous tree and reflects changed body content', (t) => {
  const ctx = fixture(t);
  ctx.render();
  const old = threads(ctx)[0];
  ctx.comments[0].body = 'New';
  ctx.render();
  assert.notEqual(threads(ctx)[0], old);
  assert.equal(old.parentNode, null);
  assert.deepEqual(bodies(threads(ctx)[0]), ['New']);
  assert.equal(ctx.log.replacements.filter((node) => node === ctx.list).length, 2);
});

test('rendering does not mutate comments, mentions, members or session state', (t) => {
  const ctx = fixture(t, { comments: [comment({ body: '@Bob', mentions: ['bob'] }), comment({ id: 'r' })] });
  const before = structuredClone({ comments: ctx.comments, state: ctx.session.state });
  ctx.render();
  assert.deepEqual({ comments: ctx.comments, state: ctx.session.state }, before);
});

test('thread resolved styling and labels follow root truthiness', (t) => {
  const ctx = fixture(t);
  for (const resolved of [true, 1, 'false', {}, false, 0, '', null, undefined]) {
    ctx.render([comment({ resolved })]);
    const thread = threads(ctx)[0];
    assert.equal(has(thread, 'is-resolved'), !!resolved);
    assert.deepEqual(labels(thread), resolved ? ['重新打开'] : ['回复', '标记解决']);
    if (resolved) assert.equal(actions(thread).children[0].textContent, '已解决');
  }
});

test('only reply messages get the reply class and reply resolved flags do not resolve a thread', (t) => {
  const ctx = fixture(t, { comments: [comment(), comment({ id: 'r', resolved: true })] });
  ctx.render();
  const thread = threads(ctx)[0];
  assert.deepEqual(
    messages(thread).map((node) => has(node, 'is-reply')),
    [false, true],
  );
  assert.equal(has(thread, 'is-resolved'), false);
  assert.deepEqual(labels(thread), ['回复', '标记解决']);
});

test('mentioned styling follows actor IDs even when body text contains no inline mention', (t) => {
  const ctx = fixture(t, {
    comments: [comment({ mentions: ['ann'] }), comment({ id: 'r', body: '@Ann', mentions: [] })],
  });
  ctx.render();
  const rendered = messages(threads(ctx)[0]);
  assert.deepEqual(
    rendered.map((node) => has(node, 'is-mentioned')),
    [true, false],
  );
  assert.ok(rendered.every((node) => paragraph(node).children.length === 0));
});

test('mention membership does not coerce numeric actor IDs', (t) => {
  const ctx = fixture(t, {
    actorId: '7',
    comments: [comment({ mentions: [7] }), comment({ id: 'r', mentions: ['7'] })],
  });
  ctx.render();
  assert.deepEqual(
    messages(threads(ctx)[0]).map((node) => has(node, 'is-mentioned')),
    [false, true],
  );
});

test('real ReviewDom highlights only allowed member names and preserves Unicode boundary behavior', (t) => {
  const body = '🙂 @Bob, @Ann @Bob中 @Bob𐐀';
  const ctx = fixture(t, { comments: [comment({ body, mentions: ['bob'] })] });
  ctx.render();
  const p = paragraph(messages(threads(ctx)[0])[0]);
  assert.equal(p.textContent, body);
  assert.deepEqual(
    p.children.map((node) => node.textContent),
    ['@Bob', '@Bob'],
  );
  assert.ok(
    p.children.every((node) => color(node) === 'var(--green)' && has(node, 'collaboration-member-name')),
  );
});

test('HTML-like message text and names are written as plain text', (t) => {
  const name = '<img src=x onerror="notExecuted()">',
    body = '<script>notExecuted()</script> & text';
  const ctx = fixture(t, { members: [{ id: 'ann', name, colorIndex: 0 }], comments: [comment({ body })] });
  ctx.render();
  const message = messages(threads(ctx)[0])[0];
  assert.equal(message.children[1].firstChild.textContent, name);
  assert.equal(paragraph(message).textContent, body);
  assert.equal(paragraph(message).children.length, 0);
  assert.equal(ctx.log.htmlWrites, 0);
  assert.ok(!ctx.log.tags.includes('img') && !ctx.log.tags.includes('script'));
});

test('current member name, avatar and color override the historical comment name', (t) => {
  const ctx = fixture(t);
  ctx.render();
  const message = messages(threads(ctx)[0])[0],
    author = message.children[1].firstChild;
  assert.equal(author.localName, 'strong');
  assert.equal(author.textContent, 'Ann');
  assert.equal(color(author), 'var(--blue)');
  assert.ok(has(author, 'collaboration-member-name'));
  assert.equal(message.children[0].textContent, 'A');
  assert.equal(message.children[0].getAttribute('aria-hidden'), 'true');
  assert.equal(color(message.children[0]), 'var(--blue)');
});

test('departed members use historical names and the real actor-ID color fallback', (t) => {
  const ctx = fixture(t, { comments: [comment({ actor: 'gone', name: '🦊Guest' })] });
  ctx.render();
  const message = messages(threads(ctx)[0])[0];
  assert.equal(message.children[1].firstChild.textContent, '🦊Guest');
  assert.equal(message.children[0].textContent, '🦊');
  assert.equal(color(message.children[0]), collaborationMemberColor({ id: 'gone' }));
  assert.equal(color(message.children[1].firstChild), color(message.children[0]));
});

test('empty current names fall back in the header but the existing member avatar uses its own fallback', (t) => {
  const ctx = fixture(t, { members: [{ id: 'ann', name: '', colorIndex: 1 }] });
  ctx.render();
  const message = messages(threads(ctx)[0])[0];
  assert.equal(message.children[1].firstChild.textContent, 'Historical Ann');
  assert.equal(message.children[0].textContent, '成');
  assert.equal(color(message.children[0]), 'var(--green)');
});

test('duplicate member IDs use the last mapped name but the first member for avatar and color', (t) => {
  const ctx = fixture(t, {
    members: [
      { id: 'ann', name: 'First', colorIndex: 0 },
      { id: 'ann', name: 'Last', colorIndex: 1 },
    ],
  });
  ctx.render();
  const message = messages(threads(ctx)[0])[0];
  assert.equal(message.children[1].firstChild.textContent, 'Last');
  assert.equal(message.children[0].textContent, 'F');
  assert.equal(color(message.children[1].firstChild), 'var(--blue)');
});

test('time metadata goes through the real seconds-to-local-date ReviewDom helper', (t) => {
  const calls = [];
  t.mock.method(Date.prototype, 'toLocaleString', function (locales, options) {
    calls.push({ ms: this.getTime(), locales, options });
    return `localized:${this.getTime()}`;
  });
  const ctx = fixture(t, { comments: [comment({ created: 1.5 }), comment({ id: 'r', created: 9 })] });
  ctx.render();
  assert.deepEqual(
    calls.map((call) => call.ms),
    [1500, 9000],
  );
  for (const call of calls) {
    assert.deepEqual(call.locales, []);
    assert.deepEqual(call.options, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  const times = messages(threads(ctx)[0]).map((node) => node.children[1].children[1]);
  assert.deepEqual(
    times.map((node) => [node.localName, node.className, node.textContent]),
    [
      ['time', 'collaboration-subtle', 'localized:1500'],
      ['time', 'collaboration-subtle', 'localized:9000'],
    ],
  );
});

test('the root author can resolve even without an owner or admin role', (t) => {
  const ctx = fixture(t, { role: 'viewer' });
  ctx.render();
  assert.deepEqual(labels(threads(ctx)[0]), ['回复', '标记解决']);
  assert.ok(buttons(threads(ctx)[0]).every((node) => node.type === 'button'));
});

test('only exact owner and admin roles grant resolution controls for someone else', (t) => {
  const ctx = fixture(t, { comments: [comment({ actor: 'bob' })] });
  for (const role of ['owner', 'admin', 'member', 'viewer', 'OWNER', 'Admin', undefined]) {
    ctx.session.state.role = role;
    ctx.render();
    assert.deepEqual(
      labels(threads(ctx)[0]),
      role === 'owner' || role === 'admin' ? ['回复', '标记解决'] : ['回复'],
      String(role),
    );
  }
});

test('strict root authorship does not coerce actor ID types', (t) => {
  const ctx = fixture(t, { actorId: '7', comments: [comment({ actor: 7 })] });
  ctx.render();
  assert.deepEqual(labels(threads(ctx)[0]), ['回复']);
});

test('a resolved foreign thread gives ordinary members only the resolved status, no buttons', (t) => {
  const ctx = fixture(t, { comments: [comment({ actor: 'bob', resolved: true })] });
  ctx.render();
  const thread = threads(ctx)[0];
  assert.deepEqual(buttons(thread), []);
  assert.deepEqual(
    actions(thread).children.map((node) => [node.localName, node.textContent]),
    [['span', '已解决']],
  );
});

test('owning a reply does not grant permission to resolve someone else’s root', (t) => {
  const ctx = fixture(t, { comments: [comment({ actor: 'bob' }), comment({ id: 'r', actor: 'ann' })] });
  ctx.render();
  assert.deepEqual(labels(threads(ctx)[0]), ['回复']);
});

test('reply listeners pass the exact root record as the only callback argument', (t) => {
  const ctx = fixture(t, { comments: [comment(), comment({ id: 'r' })] });
  ctx.render();
  invoke(buttons(threads(ctx)[0])[0]);
  assert.equal(ctx.replyCalls.length, 1);
  assert.equal(ctx.replyCalls[0].length, 1);
  assert.equal(ctx.replyCalls[0][0], ctx.comments[0]);
  assert.deepEqual(ctx.resolveCalls, []);
});

test('resolve and reopen listeners pass the exact root and the clicked button', (t) => {
  const ctx = fixture(t);
  for (const resolved of [false, true]) {
    const root = comment({ resolved });
    ctx.render([root]);
    const button = buttons(threads(ctx)[0]).at(-1);
    invoke(button);
    const args = ctx.resolveCalls.at(-1);
    assert.equal(args.length, 2);
    assert.equal(args[0], root);
    assert.equal(args[1], button);
    assert.equal(root.resolved, resolved);
    assert.equal(button.disabled, undefined);
  }
});

test('render-time permission is not rechecked by an already registered callback', (t) => {
  const ctx = fixture(t, { role: 'admin', comments: [comment({ actor: 'bob' })] });
  ctx.render();
  const button = buttons(threads(ctx)[0]).at(-1);
  ctx.session.state.role = 'viewer';
  ctx.session.state.actorId = 'other';
  invoke(button);
  assert.equal(ctx.resolveCalls.length, 1);
});

test('callbacks retain the original root object rather than a snapshot or current array lookup', (t) => {
  const ctx = fixture(t);
  const root = ctx.comments[0];
  ctx.render();
  const button = buttons(threads(ctx)[0])[0];
  root.body = 'Edited later';
  root.resolved = true;
  ctx.comments = [];
  invoke(button);
  assert.equal(ctx.replyCalls[0][0], root);
  assert.equal(ctx.replyCalls[0][0].body, 'Edited later');
});

test('fresh render buttons have one listener each and do not accumulate callback invocations', (t) => {
  const ctx = fixture(t);
  ctx.render();
  const first = buttons(threads(ctx)[0])[0];
  ctx.render();
  const second = buttons(threads(ctx)[0])[0];
  assert.notEqual(second, first);
  invoke(second);
  assert.equal(ctx.replyCalls.length, 1);
});

test('saved scrollTop is written back after the new thread content is appended', (t) => {
  const ctx = fixture(t);
  for (const value of [0, 16.5, 250]) {
    ctx.list.scrollTop = value;
    ctx.log.scroll.length = 0;
    ctx.render();
    assert.equal(ctx.list.scrollTop, value);
    assert.deepEqual(
      ctx.log.scroll.map(({ value, children }) => ({ value, children })),
      [{ value, children: 1 }],
    );
  }
});

test('scrollTop is written back for both empty-state and orphan-only render paths', (t) => {
  const ctx = fixture(t, { scroll: 77 });
  ctx.render([]);
  assert.equal(ctx.list.scrollTop, 77);
  ctx.render([comment({ id: 'orphan', thread: 'missing' })]);
  assert.equal(ctx.list.scrollTop, 77);
});

test('render returns undefined and never invokes action callbacks while building the tree', (t) => {
  const ctx = fixture(t);
  assert.equal(ctx.render(), undefined);
  assert.deepEqual(ctx.replyCalls, []);
  assert.deepEqual(ctx.resolveCalls, []);
  const thread = threads(ctx)[0];
  assert.equal(thread.localName, 'section');
  assert.equal(thread.children.at(-1), actions(thread));
});

test('invalid comment data propagates an error after partial replacement rather than rolling back', (t) => {
  const ctx = fixture(t, { comments: [comment(), comment({ id: 't2', thread: 't2', mentions: undefined })] });
  assert.throws(() => ctx.render(), TypeError);
  assert.equal(ctx.stale.parentNode, null);
  assert.equal(threads(ctx).length, 1);
  assert.deepEqual(bodies(threads(ctx)[0]), ['Root body']);
  assert.equal(ctx.log.scroll.length, 0);
});

test('registered listener closures do not catch callback errors', (t) => {
  const error = new Error('callback failed');
  const ctx = fixture(t, {
    reply: () => {
      throw error;
    },
    resolve: () => {
      throw error;
    },
  });
  ctx.render();
  for (const button of buttons(threads(ctx)[0]))
    assert.throws(
      () => invoke(button),
      (caught) => caught === error,
    );
});

test('registered listener closures return a callback promise without adding UI loading state', async (t) => {
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  const ctx = fixture(t, { resolve: () => pending });
  ctx.render();
  const button = buttons(threads(ctx)[0]).at(-1);
  assert.equal(invoke(button), pending);
  assert.equal(button.disabled, undefined);
  assert.equal(button.textContent, '标记解决');
  assert.equal(ctx.comments[0].resolved, false);
  finish();
  await pending;
});
