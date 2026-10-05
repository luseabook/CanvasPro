import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reviewElement,
  reviewTime,
  colorMemberName,
  appendMentionText,
  reviewAvatar,
  reviewSendButton,
} from './collaborationReviewDom.js';

// Minimal DOM adapter for the public helpers. Real MemberColor, icon factory and
// icon catalog remain imported. This is not browser layout, CSS or HTML parsing.
function documentAdapter(over = {}) {
  const log = { elements: [], textNodes: [], replacements: [], htmlWrites: 0 };
  const withDataset = 'dataset' in over ? over.dataset : true;
  function textNode(value) {
    const node = { nodeType: 3, data: String(value) };
    Object.defineProperty(node, 'textContent', { get: () => node.data });
    log.textNodes.push(node);
    return node;
  }
  function element(tag, namespaceURI = null) {
    const attrs = new Map();
    const properties = new Map();
    const node = {
      nodeType: 1,
      localName: namespaceURI ? tag : String(tag).toLowerCase(),
      namespaceURI,
      className: '',
      childNodes: [],
      attrs,
      style: {
        setProperty(name, value) {
          properties.set(name, String(value));
        },
        getPropertyValue(name) {
          return properties.get(name) || '';
        },
      },
      append(...values) {
        for (const value of values) this.childNodes.push(value?.nodeType ? value : textNode(value));
      },
      appendChild(child) {
        this.append(child);
        return child;
      },
      replaceChildren(...values) {
        log.replacements.push({ node: this, values });
        this.childNodes = [];
        this.append(...values);
      },
      setAttribute(name, value) {
        attrs.set(name, String(value));
      },
      getAttribute(name) {
        return attrs.get(name) ?? null;
      },
    };
    if (node.localName === 'button') node.type = 'submit';
    if (withDataset) node.dataset = {};
    node.classList = {
      add(...names) {
        node.className = [...new Set([...node.className.split(/\s+/).filter(Boolean), ...names])].join(' ');
      },
      contains(name) {
        return node.className.split(/\s+/).includes(name);
      },
    };
    Object.defineProperties(node, {
      children: { get: () => node.childNodes.filter((child) => child.nodeType === 1) },
      textContent: {
        get: () => node.childNodes.map((child) => child.textContent).join(''),
        set(value) {
          node.childNodes = value == null || value === '' ? [] : [textNode(value)];
        },
      },
      innerHTML: {
        set() {
          log.htmlWrites++;
          throw new Error('HTML parsing must not be used');
        },
      },
    });
    log.elements.push(node);
    return node;
  }
  const document = { createElement: (tag) => element(tag), createTextNode: textNode };
  if ('svg' in over ? over.svg : true) document.createElementNS = (ns, tag) => element(tag, ns);
  return { document, log };
}

function installDocument(t, over = {}) {
  const fixture = documentAdapter(over);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    writable: true,
    value: fixture.document,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return fixture;
}

const ann = { id: 'ann', name: 'Ann', colorIndex: 0 };
const bob = { id: 'bob', name: 'Bob', colorIndex: 1 };
const mentionLabels = (host) => host.children.map((child) => child.textContent);
const memberColor = (node) => node.style.getPropertyValue('--member-color');
const hostElement = () => reviewElement('div');

function assertSendIcon(icon) {
  assert.equal(icon.localName, 'svg');
  assert.equal(icon.namespaceURI, 'http://www.w3.org/2000/svg');
  assert.deepEqual(Object.fromEntries(icon.attrs), {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    'data-context-menu-icon': 'send',
  });
  assert.deepEqual(
    icon.children.map((child) => [child.localName, child.getAttribute('d')]),
    [
      ['path', 'm22 2-7 20-4-9-9-4 20-7Z'],
      ['path', 'M22 2 11 13'],
    ],
  );
  assert.ok(icon.children.every((child) => child.namespaceURI === icon.namespaceURI));
}

test('reviewElement creates the requested element with empty class and text defaults', (t) => {
  const { log } = installDocument(t);
  const node = reviewElement('section');
  assert.equal(node, log.elements[0]);
  assert.equal(node.localName, 'section');
  assert.equal(node.className, '');
  assert.equal(node.textContent, '');
  assert.equal(node.type, undefined);
});

test('reviewElement makes lower-case button tags non-submitting buttons', (t) => {
  installDocument(t);
  const node = reviewElement('button', 'review-action', 'Apply');
  assert.equal(node.type, 'button');
  assert.equal(node.className, 'review-action');
  assert.equal(node.textContent, 'Apply');
});

test('reviewElement special-cases the exact lower-case tag, not BUTTON', (t) => {
  installDocument(t);
  const node = reviewElement('BUTTON');
  assert.equal(node.localName, 'button');
  assert.equal(node.type, 'submit');
});

test('reviewElement treats markup as text rather than HTML', (t) => {
  const { log } = installDocument(t);
  const text = '<img src=x onerror="notExecuted()"> & <b>literal</b>';
  const node = reviewElement('p', 'one two', text);
  assert.equal(node.textContent, text);
  assert.deepEqual(node.children, []);
  assert.equal(log.htmlWrites, 0);
});

test('reviewTime converts seconds to milliseconds and uses the local compact date-time options', (t) => {
  const seen = [];
  t.mock.method(Date.prototype, 'toLocaleString', function (locales, options) {
    seen.push({ milliseconds: this.getTime(), locales, options });
    return `localized-${seen.length}`;
  });
  for (const [index, seconds] of [0, 1700000000, 1.25, -1].entries()) {
    assert.equal(reviewTime(seconds), `localized-${index + 1}`);
  }
  assert.deepEqual(
    seen.map((call) => call.milliseconds),
    [0, 1700000000000, 1250, -1000],
  );
  for (const call of seen) {
    assert.deepEqual(call.locales, []);
    assert.deepEqual(call.options, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
});

test('reviewTime keeps numeric coercion and delegates invalid dates to locale formatting', (t) => {
  const seen = [];
  t.mock.method(Date.prototype, 'toLocaleString', function () {
    seen.push(this.getTime());
    return 'formatted';
  });
  assert.equal(reviewTime('2.5'), 'formatted');
  assert.equal(reviewTime(null), 'formatted');
  assert.equal(reviewTime('not-a-time'), 'formatted');
  assert.deepEqual(seen.slice(0, 2), [2500, 0]);
  assert.ok(Number.isNaN(seen[2]));
});

test('colorMemberName returns the same node and preserves unrelated text, class and style', (t) => {
  installDocument(t);
  const node = reviewElement('span', 'existing', 'Ann');
  node.style.setProperty('--other', 'keep');
  assert.equal(colorMemberName(node, ann), node);
  assert.equal(node.textContent, 'Ann');
  assert.equal(node.className, 'existing collaboration-member-name');
  assert.equal(memberColor(node), 'var(--blue)');
  assert.equal(node.style.getPropertyValue('--other'), 'keep');
});

test('colorMemberName updates the color without duplicating its marker class', (t) => {
  installDocument(t);
  const node = reviewElement('span');
  colorMemberName(node, ann);
  colorMemberName(node, bob);
  assert.equal(node.className, 'collaboration-member-name');
  assert.equal(memberColor(node), 'var(--green)');
});

test('colorMemberName passes the full member record through the real color policy', (t) => {
  installDocument(t);
  const node = reviewElement('span');
  colorMemberName(node, { id: 'same', colorIndex: 8 });
  assert.equal(memberColor(node), 'color-mix(in srgb, var(--blue) 70%, var(--text-primary))');
  colorMemberName(node, { id: 'same', colorIndex: 17 });
  assert.equal(memberColor(node), 'color-mix(in srgb, var(--green) 45%, var(--text-primary))');
});

test('appendMentionText appends ordinary and empty text even without member arguments', (t) => {
  installDocument(t);
  for (const text of ['', 'hello 🙂\n@unknown']) {
    const host = hostElement();
    assert.equal(appendMentionText(host, text), undefined);
    assert.equal(host.textContent, text);
    assert.equal(host.childNodes.length, 1);
    assert.equal(host.childNodes[0].nodeType, 3);
  }
});

test('appendMentionText preserves existing children instead of replacing the host', (t) => {
  installDocument(t);
  const host = hostElement();
  const existing = reviewElement('strong', 'keep', 'prefix ');
  host.append(existing);
  appendMentionText(host, 'hello @Ann!', [ann], ['ann']);
  assert.equal(host.childNodes[0], existing);
  assert.equal(host.textContent, 'prefix hello @Ann!');
  assert.equal(host.children[1].textContent, '@Ann');
});

test('only named members explicitly included in mention IDs are highlighted', (t) => {
  installDocument(t);
  const host = hostElement();
  appendMentionText(
    host,
    '@Ann @Bob @Missing @',
    [ann, bob, { id: 'blank', name: '' }],
    ['bob', 'blank', 'unknown'],
  );
  assert.deepEqual(mentionLabels(host), ['@Bob']);
  assert.equal(memberColor(host.children[0]), 'var(--green)');
  assert.equal(host.textContent, '@Ann @Bob @Missing @');
});

test('default mention IDs do not highlight supplied member names', (t) => {
  installDocument(t);
  const host = hostElement();
  appendMentionText(host, '@Ann @Bob', [ann, bob]);
  assert.deepEqual(host.children, []);
  assert.equal(host.textContent, '@Ann @Bob');
});

test('longer allowed names win over a shorter prefix followed by whitespace', (t) => {
  installDocument(t);
  const host = hostElement();
  const long = { id: 'long', name: 'Ann Lee', colorIndex: 1 };
  appendMentionText(host, '@Ann Lee, @Ann.', [ann, long], ['ann', 'long']);
  assert.deepEqual(mentionLabels(host), ['@Ann Lee', '@Ann']);
  assert.deepEqual(host.children.map(memberColor), ['var(--green)', 'var(--blue)']);
});

test('a longer disallowed name does not prevent matching its allowed shorter prefix', (t) => {
  installDocument(t);
  const host = hostElement();
  appendMentionText(host, '@Ann Lee', [ann, { id: 'long', name: 'Ann Lee' }], ['ann']);
  assert.deepEqual(mentionLabels(host), ['@Ann']);
  assert.equal(host.textContent, '@Ann Lee');
});

test('BMP letters, numbers and underscore prevent a partial-name match on the right', (t) => {
  installDocument(t);
  for (const suffix of ['x', 'é', '中', 'Ж', 'Ω', '５', '١', '_']) {
    const host = hostElement();
    const text = `@Ann${suffix}`;
    appendMentionText(host, text, [ann], ['ann']);
    assert.deepEqual(mentionLabels(host), [], suffix);
    assert.equal(host.textContent, text);
  }
});

test('right boundaries check one UTF-16 code unit, permitting marks and astral letters or numbers', (t) => {
  installDocument(t);
  for (const suffix of [' ', '!', '.', ',', '/', '@', '🙂', '\n', '́', '𐐀', '𝟎', '']) {
    const host = hostElement();
    const text = `@Ann${suffix}`;
    appendMentionText(host, text, [ann], ['ann']);
    assert.deepEqual(mentionLabels(host), ['@Ann'], JSON.stringify(suffix));
    assert.equal(host.textContent, text);
  }
});

test('mentions at the start, middle and end retain surrounding text and repeated names', (t) => {
  installDocument(t);
  const host = hostElement();
  const text = '@Ann said hi to @Bob, then @Ann';
  appendMentionText(host, text, [ann, bob], ['ann', 'bob']);
  assert.deepEqual(mentionLabels(host), ['@Ann', '@Bob', '@Ann']);
  assert.equal(host.textContent, text);
  assert.ok(
    host.children.every(
      (node) => node.localName === 'span' && node.classList.contains('collaboration-member-name'),
    ),
  );
});

test('consecutive mentions preserve the explicit empty text nodes between and around them', (t) => {
  installDocument(t);
  const host = hostElement();
  appendMentionText(host, '@Ann@Bob', [ann, bob], ['ann', 'bob']);
  assert.deepEqual(
    host.childNodes.map((node) => [node.nodeType, node.textContent]),
    [
      [3, ''],
      [1, '@Ann'],
      [3, ''],
      [1, '@Bob'],
      [3, ''],
    ],
  );
});

test('mention names are case-sensitive', (t) => {
  installDocument(t);
  const host = hostElement();
  appendMentionText(host, '@ann @ANN @Ann', [ann], ['ann']);
  assert.deepEqual(mentionLabels(host), ['@Ann']);
  assert.equal(host.textContent, '@ann @ANN @Ann');
});

test('the source intentionally does not require a boundary before the at-sign', (t) => {
  installDocument(t);
  const host = hostElement();
  appendMentionText(host, 'email@Ann.example', [ann], ['ann']);
  assert.deepEqual(mentionLabels(host), ['@Ann']);
  assert.equal(host.textContent, 'email@Ann.example');
});

test('astral characters in both surrounding text and member names remain intact', (t) => {
  installDocument(t);
  const member = { id: 'fox', name: '🦊', colorIndex: 2 };
  const host = hostElement();
  appendMentionText(host, '🙂 @🦊! 结束', [member], ['fox']);
  assert.deepEqual(mentionLabels(host), ['@🦊']);
  assert.equal(host.textContent, '🙂 @🦊! 结束');
  assert.equal(memberColor(host.children[0]), 'var(--purple)');
});

test('equal duplicate names choose the first allowed member in member-array order', (t) => {
  installDocument(t);
  const first = { id: 'a', name: 'Alex', colorIndex: 0 };
  const second = { id: 'b', name: 'Alex', colorIndex: 1 };
  const host = hostElement();
  appendMentionText(host, '@Alex', [first, second], ['b', 'a']);
  assert.deepEqual(mentionLabels(host), ['@Alex']);
  assert.equal(memberColor(host.children[0]), 'var(--blue)');
  const other = hostElement();
  appendMentionText(other, '@Alex', [first, second], ['b']);
  assert.equal(memberColor(other.children[0]), 'var(--green)');
});

test('mention ID matching is strict and does not coerce numbers to strings', (t) => {
  installDocument(t);
  const host = hostElement();
  appendMentionText(host, '@Ann', [{ ...ann, id: '7' }], [7]);
  assert.deepEqual(mentionLabels(host), []);
});

test('member arrays and mention lists are not mutated by sorting or coloring', (t) => {
  installDocument(t);
  const members = [ann, { id: 'long', name: 'Ann Lee', colorIndex: 1 }, bob];
  const ids = ['ann', 'long', 'bob'];
  const before = structuredClone({ members, ids });
  appendMentionText(hostElement(), '@Ann Lee @Bob @Ann', members, ids);
  assert.deepEqual({ members, ids }, before);
});

test('markup in message text and even an allowed nickname stays in text nodes', (t) => {
  const { log } = installDocument(t);
  const name = '<img src=x onerror="notExecuted()">';
  const text = `before @${name} <script>notExecuted()</script> & after`;
  const host = hostElement();
  appendMentionText(host, text, [{ id: 'special', name, colorIndex: 0 }], ['special']);
  assert.deepEqual(mentionLabels(host), [`@${name}`]);
  assert.equal(host.textContent, text);
  assert.deepEqual(
    log.elements.map((node) => node.localName),
    ['div', 'span'],
  );
  assert.equal(log.htmlWrites, 0);
});

test('reviewAvatar creates a decorative colored span without adding the member-name class', (t) => {
  installDocument(t);
  const node = reviewAvatar(bob);
  assert.equal(node.localName, 'span');
  assert.equal(node.className, 'collaboration-message-avatar');
  assert.equal(node.textContent, 'B');
  assert.equal(node.getAttribute('aria-hidden'), 'true');
  assert.equal(memberColor(node), 'var(--green)');
});

test('reviewAvatar uses the first character of the fallback when a name is absent or falsy', (t) => {
  installDocument(t);
  for (const name of [undefined, null, '', false, 0]) {
    const node = reviewAvatar({ id: 'fallback', name, colorIndex: 0 });
    assert.equal(node.textContent, '成');
    assert.equal(memberColor(node), 'var(--blue)');
  }
});

test('reviewAvatar uses a Unicode code point rather than a UTF-16 code unit', (t) => {
  installDocument(t);
  assert.equal(reviewAvatar({ id: 'emoji', name: '🦊Fox' }).textContent, '🦊');
  assert.equal(reviewAvatar({ id: 'han', name: '张三' }).textContent, '张');
});

test('reviewAvatar does not trim names or combine a whole grapheme cluster', (t) => {
  installDocument(t);
  assert.equal(reviewAvatar({ name: ' Ann' }).textContent, ' ');
  assert.equal(reviewAvatar({ name: 'émile' }).textContent, 'e');
  assert.equal(reviewAvatar({ name: '👩‍💻Coder' }).textContent, '👩');
});

test('reviewAvatar forwards non-default color indices to the real color helper', (t) => {
  installDocument(t);
  assert.equal(
    memberColor(reviewAvatar({ id: 'same', name: 'A', colorIndex: 17 })),
    'color-mix(in srgb, var(--green) 45%, var(--text-primary))',
  );
});

test('reviewSendButton replaces old children with the real send SVG and its default label', (t) => {
  const { log } = installDocument(t);
  const button = reviewElement('button', 'send', 'Old text');
  button.append(reviewElement('span', 'old-icon', 'old'));
  assert.equal(reviewSendButton(button), undefined);
  assert.equal(button.getAttribute('aria-label'), '发送');
  assert.equal(button.childNodes.length, 1);
  assert.equal(button.type, 'button');
  assert.equal(button.className, 'send');
  assert.equal(log.replacements.length, 1);
  assertSendIcon(button.children[0]);
  assert.equal(button.children[0].dataset.contextMenuIcon, 'send');
});

test('reviewSendButton changes only its label/content while busy, not disabled or aria-busy', (t) => {
  installDocument(t);
  const button = reviewElement('button');
  button.disabled = false;
  button.setAttribute('aria-busy', 'external');
  reviewSendButton(button, true);
  assert.equal(button.getAttribute('aria-label'), '发送中…');
  assert.equal(button.disabled, false);
  assert.equal(button.getAttribute('aria-busy'), 'external');
  assertSendIcon(button.children[0]);
});

test('reviewSendButton recreates the icon on reset and preserves an externally disabled button', (t) => {
  installDocument(t);
  const button = reviewElement('button');
  button.disabled = true;
  reviewSendButton(button, true);
  const first = button.children[0];
  reviewSendButton(button, false);
  assert.equal(button.getAttribute('aria-label'), '发送');
  assert.equal(button.disabled, true);
  assert.notEqual(button.children[0], first);
  assert.equal(button.children.length, 1);
  assertSendIcon(button.children[0]);
});

test('reviewSendButton uses truthiness for the busy label rather than strict booleans', (t) => {
  installDocument(t);
  const button = reviewElement('button');
  for (const busy of [1, 'busy', {}]) {
    reviewSendButton(button, busy);
    assert.equal(button.getAttribute('aria-label'), '发送中…');
  }
  for (const busy of [0, '', null, undefined]) {
    reviewSendButton(button, busy);
    assert.equal(button.getAttribute('aria-label'), '发送');
  }
});

test('reviewSendButton works with the real icon factory when SVG dataset is absent', (t) => {
  installDocument(t, { dataset: false });
  const button = reviewElement('button');
  reviewSendButton(button);
  assertSendIcon(button.children[0]);
  assert.equal(button.children[0].dataset, undefined);
});

test('without SVG support the helper forwards null to replaceChildren without a fallback icon', (t) => {
  const { log } = installDocument(t, { svg: false });
  const button = reviewElement('button', '', 'Old');
  reviewSendButton(button, true);
  assert.equal(button.getAttribute('aria-label'), '发送中…');
  assert.deepEqual(log.replacements[0].values, [null]);
  assert.deepEqual(button.children, []);
});
