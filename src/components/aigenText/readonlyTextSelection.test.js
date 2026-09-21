import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindReadonlyTextSelection, hasActiveReadonlyTextSelection } from './readonlyTextSelection.js';
const __dirname = dirname(fileURLToPath(import.meta.url)),
  nodeTypesCss = readFileSync(join(__dirname, '../../../styles/node-types.css'), 'utf8');
function createClassList() {
  const _0x51a8c3 = new Set();
  return {
    add(..._0x25d8f7) {
      _0x25d8f7.forEach((_0x286e35) => _0x51a8c3.add(String(_0x286e35 || '')));
    },
    remove(..._0xe3ddfa) {
      _0xe3ddfa.forEach((_0x26d04f) => _0x51a8c3.delete(String(_0x26d04f || '')));
    },
    contains(_0x341ca6) {
      return _0x51a8c3.has(String(_0x341ca6 || ''));
    },
  };
}
function createFakeEvent(_0x4caf2b = {}) {
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
    ..._0x4caf2b,
  };
}
function createFakeSelectionDom() {
  const _0x34b08f = {},
    _0x24bba4 = new Map(),
    _0x4b2d65 = new Map(),
    _0xe5e7d6 = { classList: createClassList() },
    _0x3a44da = {
      body: _0xe5e7d6,
      defaultView: { getSelection: () => ({ removeAllRanges() {}, setBaseAndExtent() {} }) },
      addEventListener(_0x202402, _0x473525) {
        const _0xdfa97a = _0x24bba4.get(_0x202402) || [];
        (_0xdfa97a.push(_0x473525), _0x24bba4.set(_0x202402, _0xdfa97a));
      },
      removeEventListener(_0xfbf5, _0x32a582) {
        const _0x552bf7 = _0x24bba4.get(_0xfbf5) || [];
        _0x24bba4.set(
          _0xfbf5,
          _0x552bf7.filter((_0x407228) => _0x407228 !== _0x32a582),
        );
      },
      caretRangeFromPoint() {
        return { startContainer: _0x34b08f, startOffset: 0 };
      },
    },
    _0x2eac97 = {
      ownerDocument: _0x3a44da,
      classList: createClassList(),
      addEventListener(_0x302cae, _0x41a185) {
        const _0x3958eb = _0x4b2d65.get(_0x302cae) || [];
        (_0x3958eb.push(_0x41a185), _0x4b2d65.set(_0x302cae, _0x3958eb));
      },
      removeEventListener(_0xa06852, _0x67e5b8) {
        const _0x53dd08 = _0x4b2d65.get(_0xa06852) || [];
        _0x4b2d65.set(
          _0xa06852,
          _0x53dd08.filter((_0x48a08) => _0x48a08 !== _0x67e5b8),
        );
      },
      contains(_0x34d235) {
        return _0x34d235 === _0x2eac97 || _0x34d235 === _0x34b08f;
      },
      dispatch(_0x18f3a5, _0xeb9e3f) {
        for (const _0x3232a8 of _0x4b2d65.get(_0x18f3a5) || []) _0x3232a8(_0xeb9e3f);
      },
    };
  return {
    doc: _0x3a44da,
    el: _0x2eac97,
    dispatchDocument(_0x277738, _0x2174e5) {
      for (const _0x3a4730 of _0x24bba4.get(_0x277738) || []) _0x3a4730(_0x2174e5);
    },
  };
}
(test('readonly text selection activates on double click, not plain pointerdown', () => {
  const { el: _0x2daca3, doc: _0x4715b0, dispatchDocument: _0x4297e3 } = createFakeSelectionDom();
  let _0x41a665 = 0,
    _0x5e883f = 0;
  const _0x302872 = bindReadonlyTextSelection(_0x2daca3, {
      onActivate: () => {
        _0x41a665 += 1;
      },
      onDeactivate: () => {
        _0x5e883f += 1;
      },
    }),
    _0x18dec2 = createFakeEvent({ target: _0x2daca3 });
  (_0x2daca3.dispatch('pointerdown', _0x18dec2),
    assert.equal(_0x18dec2.defaultPrevented, false),
    assert.equal(_0x18dec2.propagationStopped, false),
    assert.equal(_0x2daca3.classList.contains('is-text-selection-active'), false));
  const _0x48d5e9 = createFakeEvent({ target: _0x2daca3 });
  (_0x2daca3.dispatch('dblclick', _0x48d5e9),
    assert.equal(_0x48d5e9.defaultPrevented, true),
    assert.equal(_0x48d5e9.propagationStopped, true),
    assert.equal(_0x41a665, 1),
    assert.equal(_0x2daca3.classList.contains('is-text-selection-active'), true));
  const _0x4527c1 = createFakeEvent({ target: _0x2daca3 });
  (_0x2daca3.dispatch('pointerdown', _0x4527c1),
    assert.equal(_0x4527c1.defaultPrevented, true),
    assert.equal(_0x4527c1.propagationStopped, true),
    assert.equal(_0x4715b0.body.classList.contains('is-aigen-text-selecting'), true),
    _0x4297e3('pointerdown', createFakeEvent({ target: {} })),
    assert.equal(_0x5e883f, 1),
    assert.equal(_0x2daca3.classList.contains('is-text-selection-active'), false),
    assert.equal(_0x4715b0.body.classList.contains('is-aigen-text-selecting'), false),
    _0x302872());
}),
  test('readonly text selection detects active non-empty output selection', () => {
    const _0x18c6ef = {
        nodeType: 1,
        classList: {
          contains(_0x28edbd) {
            return _0x28edbd === 'aigen-text-output' || _0x28edbd === 'is-text-selection-active';
          },
        },
        parentElement: null,
        contains(_0x119b5f) {
          return _0x119b5f === _0x18c6ef || _0x119b5f === _0xa9e417;
        },
      },
      _0xa9e417 = { nodeType: 3, parentElement: _0x18c6ef },
      _0x4a88dc = {
        querySelectorAll(_0x4b7ce5) {
          return _0x4b7ce5 === '.aigen-text-output.is-text-selection-active' ? [_0x18c6ef] : [];
        },
        getSelection() {
          return {
            isCollapsed: false,
            rangeCount: 1,
            toString: () => 'selected output',
            getRangeAt: () => ({
              commonAncestorContainer: _0xa9e417,
              startContainer: _0xa9e417,
              endContainer: _0xa9e417,
              intersectsNode(_0x31e92) {
                return _0x31e92 === _0x18c6ef;
              },
            }),
          };
        },
      };
    assert.equal(hasActiveReadonlyTextSelection(_0x4a88dc), true);
  }),
  test('readonly text selection ignores collapsed or inactive selections', () => {
    const _0x50d532 = {
        nodeType: 1,
        classList: {
          contains(_0x10979d) {
            return _0x10979d === 'aigen-text-output';
          },
        },
        parentElement: null,
      },
      _0x22ca17 = { nodeType: 3, parentElement: _0x50d532 },
      _0x56a278 = {
        querySelectorAll: () => [],
        getSelection() {
          return {
            isCollapsed: false,
            rangeCount: 1,
            toString: () => 'selected output',
            getRangeAt: () => ({
              commonAncestorContainer: _0x22ca17,
              startContainer: _0x22ca17,
              endContainer: _0x22ca17,
            }),
          };
        },
      };
    (assert.equal(hasActiveReadonlyTextSelection(_0x56a278), false),
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
