import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindReadonlyTextSelection, hasActiveReadonlyTextSelection } from './readonlyTextSelection.js';
const __dirname = dirname(fileURLToPath(import.meta.url)),
  nodeTypesCss = readFileSync(join(__dirname, '../../../styles/node-types.css'), 'utf8');
function createClassList() {
  const map = new Set();
  return {
    add(...list) {
      list.forEach((item) => map.add(String(item || '')));
    },
    remove(...list2) {
      list2.forEach((item2) => map.delete(String(item2 || '')));
    },
    contains(value) {
      return map.has(String(value || ''));
    },
  };
}
function createFakeEvent(args = {}) {
  return {
    button: 0,
    clientX: 10,
    clientY: 10,
    target: null,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
    ...args,
  };
}
function createFakeSelectionDom() {
  const startContainer = {},
    map2 = new Map(),
    map3 = new Map(),
    body = { classList: createClassList() },
    ownerDocument = {
      body: body,
      defaultView: { getSelection: () => ({ removeAllRanges() {}, setBaseAndExtent() {} }) },
      addEventListener(key, index) {
        const list3 = map2.get(key) || [];
        (list3.push(index), map2.set(key, list3));
      },
      removeEventListener(result, data) {
        const list4 = map2.get(result) || [];
        map2.set(
          result,
          list4.filter((item3) => item3 !== data),
        );
      },
      caretRangeFromPoint() {
        return { startContainer: startContainer, startOffset: 0 };
      },
    },
    el = {
      ownerDocument: ownerDocument,
      classList: createClassList(),
      addEventListener(options, target) {
        const list5 = map3.get(options) || [];
        (list5.push(target), map3.set(options, list5));
      },
      removeEventListener(source, next) {
        const list6 = map3.get(source) || [];
        map3.set(
          source,
          list6.filter((item4) => item4 !== next),
        );
      },
      contains(current) {
        return current === el || current === startContainer;
      },
      dispatch(entry, record) {
        for (const run of map3.get(entry) || []) run(record);
      },
    };
  return {
    doc: ownerDocument,
    el: el,
    dispatchDocument(payload, handle) {
      for (const run2 of map2.get(payload) || []) run2(handle);
    },
  };
}
(test('readonly text selection activates on double click, not plain pointerdown', () => {
  const { el: el2, doc: doc, dispatchDocument: dispatchDocument2 } = createFakeSelectionDom();
  let state = 0,
    config = 0;
  const run3 = bindReadonlyTextSelection(el2, {
      onActivate: () => {
        state += 1;
      },
      onDeactivate: () => {
        config += 1;
      },
    }),
    fakeEvent = createFakeEvent({ target: el2 });
  (el2.dispatch('pointerdown', fakeEvent),
    assert.equal(fakeEvent.defaultPrevented, false),
    assert.equal(fakeEvent.propagationStopped, false),
    assert.equal(el2.classList.contains('is-text-selection-active'), false));
  const fakeEvent2 = createFakeEvent({ target: el2 });
  (el2.dispatch('dblclick', fakeEvent2),
    assert.equal(fakeEvent2.defaultPrevented, true),
    assert.equal(fakeEvent2.propagationStopped, true),
    assert.equal(state, 1),
    assert.equal(el2.classList.contains('is-text-selection-active'), true));
  const fakeEvent3 = createFakeEvent({ target: el2 });
  (el2.dispatch('pointerdown', fakeEvent3),
    assert.equal(fakeEvent3.defaultPrevented, true),
    assert.equal(fakeEvent3.propagationStopped, true),
    assert.equal(doc.body.classList.contains('is-aigen-text-selecting'), true),
    dispatchDocument2('pointerdown', createFakeEvent({ target: {} })),
    assert.equal(config, 1),
    assert.equal(el2.classList.contains('is-text-selection-active'), false),
    assert.equal(doc.body.classList.contains('is-aigen-text-selecting'), false),
    run3());
}),
  test('readonly text selection detects active non-empty output selection', () => {
    const parentElement = {
        nodeType: 1,
        classList: {
          contains(scope) {
            return scope === 'aigen-text-output' || scope === 'is-text-selection-active';
          },
        },
        parentElement: null,
        contains(input) {
          return input === parentElement || input === commonAncestorContainer;
        },
      },
      commonAncestorContainer = { nodeType: 3, parentElement: parentElement },
      output = {
        querySelectorAll(value2) {
          return value2 === '.aigen-text-output.is-text-selection-active' ? [parentElement] : [];
        },
        getSelection() {
          return {
            isCollapsed: false,
            rangeCount: 1,
            toString: () => 'selected output',
            getRangeAt: () => ({
              commonAncestorContainer: commonAncestorContainer,
              startContainer: commonAncestorContainer,
              endContainer: commonAncestorContainer,
              intersectsNode(value3) {
                return value3 === parentElement;
              },
            }),
          };
        },
      };
    assert.equal(hasActiveReadonlyTextSelection(output), true);
  }),
  test('readonly text selection ignores collapsed or inactive selections', () => {
    const parentElement2 = {
        nodeType: 1,
        classList: {
          contains(value4) {
            return value4 === 'aigen-text-output';
          },
        },
        parentElement: null,
      },
      commonAncestorContainer2 = { nodeType: 3, parentElement: parentElement2 },
      value5 = {
        querySelectorAll: () => [],
        getSelection() {
          return {
            isCollapsed: false,
            rangeCount: 1,
            toString: () => 'selected output',
            getRangeAt: () => ({
              commonAncestorContainer: commonAncestorContainer2,
              startContainer: commonAncestorContainer2,
              endContainer: commonAncestorContainer2,
            }),
          };
        },
      };
    (assert.equal(hasActiveReadonlyTextSelection(value5), false),
      assert.equal(
        hasActiveReadonlyTextSelection({
          getSelection: () => ({ isCollapsed: true, rangeCount: 0, toString: () => '' }),
        }),
        false,
      ));
  }),
  test('readonly text selection mode brightens text without panel chrome', () => {
    (assert.match(
      nodeTypesCss,
      /\.aigen-text-output\.is-text-selection-active\s*\{[^}]*color:\s*var\(--text-primary\)/s,
    ),
      assert.match(
        nodeTypesCss,
        /\.aigen-text-output\.is-text-selection-active h1,[\s\S]*\.aigen-text-output\.is-text-selection-active strong\s*\{[^}]*color:\s*var\(--text-strong\)/s,
      ),
      assert.doesNotMatch(
        nodeTypesCss,
        /\.aigen-text-output\.is-text-selection-active\s*\{[^}]*box-shadow:/s,
      ));
  }));
