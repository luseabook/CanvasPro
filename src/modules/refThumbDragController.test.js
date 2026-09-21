import test from 'node:test';
import assert from 'node:assert/strict';
import { bindRefThumbFixedSlotDrag, bindRefThumbOrderDrag } from './refThumbDragController.js';
class FakeClassList {
  constructor(_0x271570) {
    this.owner = _0x271570;
  }
  ['_tokens']() {
    return String(this.owner.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['contains'](_0x1bd022) {
    return this._tokens().includes(String(_0x1bd022 || ''));
  }
  ['add'](..._0x41a96a) {
    const _0x4efcd6 = new Set(this._tokens());
    (_0x41a96a.forEach((_0x3305b9) => _0x4efcd6.add(String(_0x3305b9 || ''))),
      (this.owner.className = Array.from(_0x4efcd6).join(' ')));
  }
  ['remove'](..._0x2d8ccd) {
    const _0x34623b = new Set(_0x2d8ccd.map((_0x109de1) => String(_0x109de1 || '')));
    this.owner.className = this._tokens()
      .filter((_0x402520) => !_0x34623b.has(_0x402520))
      .join(' ');
  }
}
class FakeElement {
  constructor({ className: className = '', dataset: dataset = {}, tagName: tagName = 'div' } = {}) {
    ((this.tagName = String(tagName || 'div').toUpperCase()),
      (this.className = className),
      (this.dataset = { ...dataset }),
      (this.style = {}),
      (this.attributes = {}),
      (this.children = []),
      (this.parentNode = null),
      (this.parentElement = null),
      (this.listeners = new Map()),
      (this.classList = new FakeClassList(this)));
  }
  get ['nextSibling']() {
    if (!this.parentNode) return null;
    const _0x445ddb = this.parentNode.children,
      _0x39b6d6 = _0x445ddb.indexOf(this);
    return _0x39b6d6 >= 0 ? _0x445ddb[_0x39b6d6 + 1] || null : null;
  }
  ['appendChild'](_0x3399af) {
    if (_0x3399af.parentNode) _0x3399af.remove();
    return (
      this.children.push(_0x3399af),
      (_0x3399af.parentNode = this),
      (_0x3399af.parentElement = this),
      _0x3399af
    );
  }
  ['insertBefore'](_0x3e4378, _0x3983ec) {
    if (_0x3e4378.parentNode) _0x3e4378.remove();
    const _0x2d7969 = _0x3983ec ? this.children.indexOf(_0x3983ec) : -1;
    if (_0x2d7969 >= 0) this.children.splice(_0x2d7969, 0, _0x3e4378);
    else this.children.push(_0x3e4378);
    return ((_0x3e4378.parentNode = this), (_0x3e4378.parentElement = this), _0x3e4378);
  }
  ['remove']() {
    if (!this.parentNode) return;
    const _0x7a858 = this.parentNode.children,
      _0x20f820 = _0x7a858.indexOf(this);
    if (_0x20f820 >= 0) _0x7a858.splice(_0x20f820, 1);
    ((this.parentNode = null), (this.parentElement = null));
  }
  ['setAttribute'](_0x4b43cd, _0x15673d) {
    this.attributes[String(_0x4b43cd)] = String(_0x15673d);
  }
  ['getAttribute'](_0x544f24) {
    return this.attributes[String(_0x544f24)];
  }
  ['addEventListener'](_0x5b78af, _0x3becea) {
    if (!this.listeners.has(_0x5b78af)) this.listeners.set(_0x5b78af, []);
    this.listeners.get(_0x5b78af).push(_0x3becea);
  }
  ['dispatch'](_0x34ec07, _0x494634) {
    for (const _0x4cc945 of this.listeners.get(_0x34ec07) || []) {
      _0x4cc945(_0x494634);
    }
  }
  ['matches'](_0x4ac0f5) {
    if (_0x4ac0f5 === '.ref-thumb-container') return this.classList.contains('ref-thumb-container');
    if (_0x4ac0f5 === '.ref-thumb-wrap') return this.classList.contains('ref-thumb-wrap');
    if (_0x4ac0f5 === '[data-slot]') return !!this.dataset.slot;
    return false;
  }
  ['closest'](_0x36577b) {
    let _0x598f0e = this;
    while (_0x598f0e) {
      if (_0x598f0e.matches(_0x36577b)) return _0x598f0e;
      _0x598f0e = _0x598f0e.parentElement;
    }
    return null;
  }
  ['querySelector'](_0x5ca955) {
    return this.querySelectorAll(_0x5ca955)[0] || null;
  }
  ['querySelectorAll'](_0x3c7676) {
    const _0x385381 = [],
      _0x16a16c = (_0xac0c5) => {
        if (matchesFakeSelector(_0xac0c5, _0x3c7676)) _0x385381.push(_0xac0c5);
        _0xac0c5.children.forEach(_0x16a16c);
      };
    return (this.children.forEach(_0x16a16c), _0x385381);
  }
  ['getBoundingClientRect']() {
    const _0x2839ef = this.parentNode ? this.parentNode.children.indexOf(this) : 0;
    return { left: Math.max(0, _0x2839ef) * 100, top: 0, width: 100, height: 40 };
  }
}
function matchesFakeSelector(_0x3e49ab, _0x53f70f) {
  if (_0x53f70f === '.ref-thumb-wrap') return _0x3e49ab.classList.contains('ref-thumb-wrap');
  if (_0x53f70f === '.ref-thumb-container') return _0x3e49ab.classList.contains('ref-thumb-container');
  if (_0x53f70f === '.ref-thumb-wrap.is-drop-allow')
    return _0x3e49ab.classList.contains('ref-thumb-wrap') && _0x3e49ab.classList.contains('is-drop-allow');
  if (_0x53f70f === '[data-slot]') return !!_0x3e49ab.dataset.slot;
  return false;
}
function createThumb(_0x2bc21d, _0x575003 = {}) {
  return new FakeElement({
    className: _0x575003.className || 'ref-thumb-wrap',
    dataset: {
      edgeId: _0x2bc21d,
      sourceId: _0x575003.sourceId || 'src-' + _0x2bc21d,
      slot: _0x575003.slot || '',
      kind: _0x575003.kind || '',
      refOrigin: _0x575003.refOrigin || '',
      refKey: _0x575003.refKey || '',
      assetId: _0x575003.assetId || '',
    },
    tagName: _0x575003.tagName || 'div',
  });
}
function createEvent(_0x2e9a9a, _0x200f09 = 0) {
  return {
    target: _0x2e9a9a,
    clientX: _0x200f09,
    dataTransfer: {
      effectAllowed: '',
      dropEffect: '',
      data: {},
      setData(_0x1f9c2e, _0x1a8233) {
        this.data[_0x1f9c2e] = _0x1a8233;
      },
    },
    defaultPrevented: false,
    stopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.stopped = true;
    },
  };
}
function createStore({ edges: _0x22fa3e, nodes: nodes = {}, incoming: _0x30d620 }) {
  const _0x40bd32 = [];
  return {
    calls: _0x40bd32,
    getState() {
      return { edges: _0x22fa3e, nodes: nodes };
    },
    getIncomingEdges() {
      return _0x30d620 || Object.values(_0x22fa3e);
    },
    updateEdgesBatch(_0xd7b6d0, _0xae5f2d) {
      _0x40bd32.push({ removeIds: _0xd7b6d0, addedEdges: _0xae5f2d });
    },
  };
}
(test('refThumbDragController: order drag commits DOM order once', () => {
  const _0x1873a4 = new FakeElement({ className: 'ref-thumb-container' }),
    _0x25e123 = createThumb('e1'),
    _0x161e8d = createThumb('e2'),
    _0x55d159 = createThumb('e3');
  (_0x1873a4.appendChild(_0x25e123), _0x1873a4.appendChild(_0x161e8d), _0x1873a4.appendChild(_0x55d159));
  const _0x3ee7b6 = {
      e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
      e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      e3: { id: 'e3', sourceId: 's3', targetId: 'target' },
    },
    _0xcca943 = createStore({ edges: _0x3ee7b6 }),
    _0x854c25 = {};
  (bindRefThumbOrderDrag({ owner: _0x854c25, container: _0x1873a4, store: _0xcca943, nodeId: 'target' }),
    _0x55d159.dispatch('dragstart', createEvent(_0x55d159)),
    _0x25e123.dispatch('dragover', createEvent(_0x25e123, 0)),
    _0x55d159.dispatch('dragend', createEvent(_0x55d159)),
    assert.equal(_0xcca943.calls.length, 1),
    assert.deepEqual(_0xcca943.calls[0].removeIds, ['e1', 'e2', 'e3']),
    assert.deepEqual(
      _0xcca943.calls[0].addedEdges.map((_0xe5aea5) => _0xe5aea5.id),
      ['e3', 'e1', 'e2'],
    ),
    assert.equal(_0x854c25._isDraggingSorting, false));
}),
  test('refThumbDragController: unchanged order does not commit', () => {
    const _0x54fce8 = new FakeElement({ className: 'ref-thumb-container' }),
      _0xb39059 = createThumb('e1'),
      _0x42f1ac = createThumb('e2');
    (_0x54fce8.appendChild(_0xb39059), _0x54fce8.appendChild(_0x42f1ac));
    const _0x424268 = {
        e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
        e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      },
      _0x5d837a = createStore({ edges: _0x424268 });
    (bindRefThumbOrderDrag({ owner: {}, container: _0x54fce8, store: _0x5d837a, nodeId: 'target' }),
      _0xb39059.dispatch('dragstart', createEvent(_0xb39059)),
      _0xb39059.dispatch('dragend', createEvent(_0xb39059)),
      assert.equal(_0x5d837a.calls.length, 0));
  }),
  test('refThumbDragController: incrementally bound thumbs share drag state', () => {
    const _0x403080 = new FakeElement({ className: 'ref-thumb-container' }),
      _0x1558d5 = createThumb('e1');
    _0x403080.appendChild(_0x1558d5);
    const _0x537f47 = {
        e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
        e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      },
      _0x192b08 = createStore({ edges: _0x537f47 });
    bindRefThumbOrderDrag({ owner: {}, container: _0x403080, store: _0x192b08, nodeId: 'target' });
    const _0x2043c7 = createThumb('e2');
    (_0x403080.appendChild(_0x2043c7),
      bindRefThumbOrderDrag({ owner: {}, container: _0x403080, store: _0x192b08, nodeId: 'target' }),
      _0x1558d5.dispatch('dragstart', createEvent(_0x1558d5)),
      _0x2043c7.dispatch('dragover', createEvent(_0x2043c7, 0x3e7)),
      _0x1558d5.dispatch('dragend', createEvent(_0x1558d5)),
      assert.deepEqual(
        _0x403080.children.map((_0x2f4185) => _0x2f4185.dataset.edgeId),
        ['e2', 'e1'],
      ),
      assert.equal(_0x192b08.calls.length, 1),
      assert.deepEqual(
        _0x192b08.calls[0].addedEdges.map((_0x3bc335) => _0x3bc335.id),
        ['e2', 'e1'],
      ));
  }),
  test('refThumbDragController: asset and empty refs do not participate in order', () => {
    const _0x1881e7 = new FakeElement({ className: 'ref-thumb-container' }),
      _0x522f5c = createThumb('e1'),
      _0x37edb3 = createThumb('', { refOrigin: 'asset', assetId: 'asset-1' }),
      _0x1b7050 = createThumb(''),
      _0x3a73da = createThumb('e2');
    (_0x1881e7.appendChild(_0x522f5c),
      _0x1881e7.appendChild(_0x37edb3),
      _0x1881e7.appendChild(_0x1b7050),
      _0x1881e7.appendChild(_0x3a73da));
    const _0xbdb979 = {
        e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
        e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      },
      _0x3ecbe8 = createStore({ edges: _0xbdb979 });
    (bindRefThumbOrderDrag({ owner: {}, container: _0x1881e7, store: _0x3ecbe8, nodeId: 'target' }),
      assert.equal(_0x37edb3.dataset.dragBound, undefined),
      assert.equal(_0x1b7050.dataset.dragBound, undefined),
      _0x3a73da.dispatch('dragstart', createEvent(_0x3a73da)),
      _0x522f5c.dispatch('dragover', createEvent(_0x522f5c, 0)),
      _0x3a73da.dispatch('dragend', createEvent(_0x3a73da)),
      assert.equal(_0x3ecbe8.calls.length, 1),
      assert.deepEqual(_0x3ecbe8.calls[0].removeIds, ['e1', 'e2']),
      assert.deepEqual(
        _0x3ecbe8.calls[0].addedEdges.map((_0x16e70c) => _0x16e70c.id),
        ['e2', 'e1'],
      ));
  }),
  test('refThumbDragController: group shared refs reorder backing group input edges', () => {
    const _0x39e060 = new FakeElement({ className: 'ref-thumb-container' }),
      _0x5d5d1b = createThumb('groupEdgeA', { sourceId: 's1' }),
      _0x15e7e6 = createThumb('groupEdgeB', { sourceId: 's2' });
    (_0x39e060.appendChild(_0x5d5d1b), _0x39e060.appendChild(_0x15e7e6));
    const _0x37a298 = {
        groupEdgeA: { id: 'groupEdgeA', sourceId: 's1', targetId: 'group' },
        groupEdgeB: { id: 'groupEdgeB', sourceId: 's2', targetId: 'group' },
      },
      _0x458aa1 = [
        { ..._0x37a298.groupEdgeA, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
        { ..._0x37a298.groupEdgeB, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
      ],
      _0x197b8c = createStore({ edges: _0x37a298, incoming: _0x458aa1 });
    (bindRefThumbOrderDrag({ owner: {}, container: _0x39e060, store: _0x197b8c, nodeId: 'target' }),
      assert.equal(_0x5d5d1b.getAttribute('draggable'), 'true'),
      assert.equal(_0x15e7e6.getAttribute('draggable'), 'true'),
      _0x15e7e6.dispatch('dragstart', createEvent(_0x15e7e6)),
      _0x5d5d1b.dispatch('dragover', createEvent(_0x5d5d1b, 0)),
      _0x15e7e6.dispatch('dragend', createEvent(_0x15e7e6)),
      assert.equal(_0x197b8c.calls.length, 1),
      assert.deepEqual(_0x197b8c.calls[0].removeIds, ['groupEdgeA', 'groupEdgeB']),
      assert.deepEqual(
        _0x197b8c.calls[0].addedEdges.map((_0xbccab) => [_0xbccab.id, _0xbccab.targetId]),
        [
          ['groupEdgeB', 'group'],
          ['groupEdgeA', 'group'],
        ],
      ));
  }),
  test('refThumbDragController: fixed slot refs do not participate in free order', () => {
    const _0x5d545b = new FakeElement({ className: 'ref-thumb-container' }),
      _0x2c8f1e = createThumb('e1', { slot: 'sourceVideo', sourceId: 'videoA' }),
      _0x4e76a0 = createThumb('e2', { slot: 'refImage', sourceId: 'imageB' });
    (_0x2c8f1e.setAttribute('draggable', 'true'),
      _0x4e76a0.setAttribute('draggable', 'true'),
      _0x5d545b.appendChild(_0x2c8f1e),
      _0x5d545b.appendChild(_0x4e76a0));
    const _0x132da1 = {
        e1: { id: 'e1', sourceId: 'videoA', targetId: 'target', refSlot: 'sourceVideo' },
        e2: { id: 'e2', sourceId: 'imageB', targetId: 'target', refSlot: 'refImage' },
      },
      _0x4d1b2e = createStore({ edges: _0x132da1 });
    (bindRefThumbOrderDrag({ owner: {}, container: _0x5d545b, store: _0x4d1b2e, nodeId: 'target' }),
      assert.equal(_0x2c8f1e.dataset.dragBound, undefined),
      assert.equal(_0x4e76a0.dataset.dragBound, undefined),
      assert.equal(_0x2c8f1e.getAttribute('draggable'), 'true'),
      assert.equal(_0x4e76a0.getAttribute('draggable'), 'true'),
      _0x4e76a0.dispatch('dragstart', createEvent(_0x4e76a0)),
      _0x2c8f1e.dispatch('dragover', createEvent(_0x2c8f1e, 0)),
      _0x4e76a0.dispatch('dragend', createEvent(_0x4e76a0)),
      assert.deepEqual(
        _0x5d545b.children.map((_0x559a68) => _0x559a68.dataset.edgeId),
        ['e1', 'e2'],
      ),
      assert.equal(_0x4d1b2e.calls.length, 0));
  }),
  test('refThumbDragController: group output refs persist source order on base edge', () => {
    const _0x21d152 = new FakeElement({ className: 'ref-thumb-container' }),
      _0x1ca0cf = 'groupEdge::group-output::image-1',
      _0xfb552b = 'groupEdge::group-output::image-2',
      _0x58db67 = createThumb(_0x1ca0cf, { sourceId: 'image-1' }),
      _0x4b48ea = createThumb(_0xfb552b, { sourceId: 'image-2' });
    (_0x21d152.appendChild(_0x58db67), _0x21d152.appendChild(_0x4b48ea));
    const _0x5c0a32 = {
        groupEdge: { id: 'groupEdge', sourceId: 'group', targetId: 'target', isGroupOutputLink: true },
      },
      _0x2cd16f = [
        {
          ..._0x5c0a32.groupEdge,
          id: _0x1ca0cf,
          sourceId: 'image-1',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
        {
          ..._0x5c0a32.groupEdge,
          id: _0xfb552b,
          sourceId: 'image-2',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
      ],
      _0x3cf566 = createStore({ edges: _0x5c0a32, incoming: _0x2cd16f });
    (bindRefThumbOrderDrag({ owner: {}, container: _0x21d152, store: _0x3cf566, nodeId: 'target' }),
      assert.equal(_0x58db67.getAttribute('draggable'), 'true'),
      assert.equal(_0x4b48ea.getAttribute('draggable'), 'true'),
      _0x4b48ea.dispatch('dragstart', createEvent(_0x4b48ea)),
      _0x58db67.dispatch('dragover', createEvent(_0x58db67, 0)),
      _0x4b48ea.dispatch('dragend', createEvent(_0x4b48ea)),
      assert.deepEqual(
        _0x21d152.children.map((_0x415257) => _0x415257.dataset.edgeId),
        [_0xfb552b, _0x1ca0cf],
      ),
      assert.equal(_0x3cf566.calls.length, 1),
      assert.deepEqual(_0x3cf566.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        _0x3cf566.calls[0].addedEdges.map((_0x373a5d) => _0x373a5d.id),
        ['groupEdge'],
      ),
      assert.deepEqual(_0x3cf566.calls[0].addedEdges[0].groupOutputSourceOrder, ['image-2', 'image-1']));
  }),
  test('refThumbDragController: shared group output refs persist source order per target', () => {
    const _0x46a8b1 = new FakeElement({ className: 'ref-thumb-container' }),
      _0xbf6a3f = 'groupEdge::group-output::image-1',
      _0x2865ee = 'groupEdge::group-output::image-2',
      _0xb72a0a = createThumb(_0xbf6a3f, { sourceId: 'image-1' }),
      _0x40bad4 = createThumb(_0x2865ee, { sourceId: 'image-2' });
    (_0x46a8b1.appendChild(_0xb72a0a), _0x46a8b1.appendChild(_0x40bad4));
    const _0xca52b5 = {
        groupEdge: { id: 'groupEdge', sourceId: 'groupA', targetId: 'groupB', isGroupOutputLink: true },
      },
      _0x59e33d = [
        {
          ..._0xca52b5.groupEdge,
          id: _0xbf6a3f,
          sourceId: 'image-1',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
        {
          ..._0xca52b5.groupEdge,
          id: _0x2865ee,
          sourceId: 'image-2',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
      ],
      _0x4605f7 = createStore({ edges: _0xca52b5, incoming: _0x59e33d });
    (bindRefThumbOrderDrag({ owner: {}, container: _0x46a8b1, store: _0x4605f7, nodeId: 'target' }),
      assert.equal(_0xb72a0a.getAttribute('draggable'), 'true'),
      assert.equal(_0x40bad4.getAttribute('draggable'), 'true'),
      _0x40bad4.dispatch('dragstart', createEvent(_0x40bad4)),
      _0xb72a0a.dispatch('dragover', createEvent(_0xb72a0a, 0)),
      _0x40bad4.dispatch('dragend', createEvent(_0x40bad4)),
      assert.deepEqual(
        _0x46a8b1.children.map((_0x26b384) => _0x26b384.dataset.edgeId),
        [_0x2865ee, _0xbf6a3f],
      ),
      assert.equal(_0x4605f7.calls.length, 1),
      assert.deepEqual(_0x4605f7.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        _0x4605f7.calls[0].addedEdges.map((_0x5b71c5) => _0x5b71c5.id),
        ['groupEdge'],
      ),
      assert.equal(_0x4605f7.calls[0].addedEdges[0].groupOutputSourceOrder, undefined),
      assert.deepEqual(_0x4605f7.calls[0].addedEdges[0].groupOutputSourceOrderByTarget, {
        target: ['image-2', 'image-1'],
      }));
  }),
  test('refThumbDragController: shared group output order keeps sibling targets isolated', () => {
    const _0x23aedc = new FakeElement({ className: 'ref-thumb-container' }),
      _0x40236e = 'groupEdge::group-output::image-1',
      _0x1b2ac1 = 'groupEdge::group-output::image-2',
      _0xba9b48 = createThumb(_0x40236e, { sourceId: 'image-1' }),
      _0x5bd0f7 = createThumb(_0x1b2ac1, { sourceId: 'image-2' });
    (_0x23aedc.appendChild(_0xba9b48), _0x23aedc.appendChild(_0x5bd0f7));
    const _0x266ebd = {
        groupEdge: {
          id: 'groupEdge',
          sourceId: 'groupA',
          targetId: 'groupB',
          isGroupOutputLink: true,
          groupOutputSourceOrderByTarget: { nodeB: ['image-1', 'image-2'] },
        },
      },
      _0xb5fe34 = [
        {
          ..._0x266ebd.groupEdge,
          id: _0x40236e,
          sourceId: 'image-1',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'nodeA',
        },
        {
          ..._0x266ebd.groupEdge,
          id: _0x1b2ac1,
          sourceId: 'image-2',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'nodeA',
        },
      ],
      _0xb6792d = createStore({ edges: _0x266ebd, incoming: _0xb5fe34 });
    (bindRefThumbOrderDrag({ owner: {}, container: _0x23aedc, store: _0xb6792d, nodeId: 'nodeA' }),
      _0x5bd0f7.dispatch('dragstart', createEvent(_0x5bd0f7)),
      _0xba9b48.dispatch('dragover', createEvent(_0xba9b48, 0)),
      _0x5bd0f7.dispatch('dragend', createEvent(_0x5bd0f7)),
      assert.equal(_0xb6792d.calls.length, 1),
      assert.deepEqual(_0xb6792d.calls[0].addedEdges[0].groupOutputSourceOrderByTarget, {
        nodeA: ['image-2', 'image-1'],
        nodeB: ['image-1', 'image-2'],
      }));
  }),
  test('refThumbDragController: fixed slot swap exchanges refSlot', () => {
    const _0x128ae1 = new FakeElement({ className: 'ref-thumb-container' }),
      _0x17f5d5 = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      _0x162494 = createThumb('e2', { slot: 'slotB', sourceId: 'audioB' });
    (_0x128ae1.appendChild(_0x17f5d5), _0x128ae1.appendChild(_0x162494));
    const _0x1892ab = {
        e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' },
        e2: { id: 'e2', sourceId: 'audioB', targetId: 'target', refSlot: 'slotB' },
      },
      _0x35fd4e = { audioA: { type: 'source-audio' }, audioB: { type: 'ai-audio' } },
      _0x7b2d98 = createStore({ edges: _0x1892ab, nodes: _0x35fd4e }),
      _0xfac60b = {};
    (bindRefThumbFixedSlotDrag({
      owner: _0xfac60b,
      container: _0x128ae1,
      store: _0x7b2d98,
      nodeId: 'target',
      acceptMap: { slotA: 'audio', slotB: 'audio' },
    }),
      _0x128ae1.dispatch('dragstart', createEvent(_0x17f5d5)),
      _0x128ae1.dispatch('drop', createEvent(_0x162494)),
      assert.equal(_0x7b2d98.calls.length, 1),
      assert.deepEqual(_0x7b2d98.calls[0].removeIds, ['e1', 'e2']),
      assert.deepEqual(
        _0x7b2d98.calls[0].addedEdges.map((_0x5dc32b) => [_0x5dc32b.id, _0x5dc32b.refSlot]),
        [
          ['e1', 'slotB'],
          ['e2', 'slotA'],
        ],
      ),
      assert.equal(_0xfac60b._fixedSlotDrag, null));
  }),
  test('refThumbDragController: fixed slot drag still works when order binding also runs', () => {
    const _0x4198d8 = new FakeElement({ className: 'ref-thumb-container' }),
      _0x58f74c = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      _0x477783 = createThumb('e2', { slot: 'slotB', sourceId: 'audioB' });
    (_0x4198d8.appendChild(_0x58f74c), _0x4198d8.appendChild(_0x477783));
    const _0x20fa6d = {
        e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' },
        e2: { id: 'e2', sourceId: 'audioB', targetId: 'target', refSlot: 'slotB' },
      },
      _0xb36851 = { audioA: { type: 'source-audio' }, audioB: { type: 'ai-audio' } },
      _0x27a2d3 = createStore({ edges: _0x20fa6d, nodes: _0xb36851 }),
      _0x3a3718 = {};
    (bindRefThumbOrderDrag({ owner: _0x3a3718, container: _0x4198d8, store: _0x27a2d3, nodeId: 'target' }),
      bindRefThumbFixedSlotDrag({
        owner: _0x3a3718,
        container: _0x4198d8,
        store: _0x27a2d3,
        nodeId: 'target',
        acceptMap: { slotA: 'audio', slotB: 'audio' },
      }),
      _0x4198d8.dispatch('dragstart', createEvent(_0x58f74c)),
      _0x4198d8.dispatch('drop', createEvent(_0x477783)),
      assert.equal(_0x27a2d3.calls.length, 1),
      assert.deepEqual(_0x27a2d3.calls[0].removeIds, ['e1', 'e2']),
      assert.deepEqual(
        _0x27a2d3.calls[0].addedEdges.map((_0x16ce8a) => [_0x16ce8a.id, _0x16ce8a.refSlot]),
        [
          ['e1', 'slotB'],
          ['e2', 'slotA'],
        ],
      ));
  }),
  test('refThumbDragController: fixed image slots swap refSlot', () => {
    const _0x41ea0e = new FakeElement({ className: 'ref-thumb-container' }),
      _0x573045 = createThumb('e1', { slot: 'replaceTarget', kind: 'image', sourceId: 'imageA' }),
      _0x3162ae = createThumb('e2', { slot: 'replacedImage', kind: 'image', sourceId: 'imageB' });
    (_0x41ea0e.appendChild(_0x573045), _0x41ea0e.appendChild(_0x3162ae));
    const _0x51fe62 = {
        e1: { id: 'e1', sourceId: 'imageA', targetId: 'target', refSlot: 'replaceTarget' },
        e2: { id: 'e2', sourceId: 'imageB', targetId: 'target', refSlot: 'replacedImage' },
      },
      _0x223aa7 = { imageA: { type: 'source-image' }, imageB: { type: 'ai-image' } },
      _0x17d5c8 = createStore({ edges: _0x51fe62, nodes: _0x223aa7 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: _0x41ea0e,
      store: _0x17d5c8,
      nodeId: 'target',
      acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
    }),
      _0x41ea0e.dispatch('dragstart', createEvent(_0x573045)),
      _0x41ea0e.dispatch('dragover', createEvent(_0x3162ae)),
      assert.deepEqual(
        _0x41ea0e.children.map((_0x4a2341) => _0x4a2341.dataset.edgeId),
        ['e1', 'e2'],
      ),
      assert.equal(String(_0x573045.style.transform || ''), ''),
      assert.equal(String(_0x3162ae.style.transform || ''), ''),
      _0x41ea0e.dispatch('drop', createEvent(_0x3162ae)),
      assert.equal(_0x17d5c8.calls.length, 1),
      assert.deepEqual(
        _0x17d5c8.calls[0].addedEdges.map((_0x1f2f05) => [_0x1f2f05.id, _0x1f2f05.refSlot]),
        [
          ['e1', 'replacedImage'],
          ['e2', 'replaceTarget'],
        ],
      ));
  }),
  test('refThumbDragController: fixed slot drop to empty slot moves one edge', () => {
    const _0x2d9f3e = new FakeElement({ className: 'ref-thumb-container' }),
      _0x472666 = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      _0xf65eb4 = createThumb('', { slot: 'slotB', tagName: 'button' });
    (_0x2d9f3e.appendChild(_0x472666), _0x2d9f3e.appendChild(_0xf65eb4));
    const _0x5219a3 = { e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' } },
      _0x31da9f = { audioA: { type: 'source-audio' } },
      _0x94de63 = createStore({ edges: _0x5219a3, nodes: _0x31da9f });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: _0x2d9f3e,
      store: _0x94de63,
      nodeId: 'target',
      acceptMap: { slotA: 'audio', slotB: 'audio' },
    }),
      _0x2d9f3e.dispatch('dragstart', createEvent(_0x472666)),
      _0x2d9f3e.dispatch('dragover', createEvent(_0xf65eb4)),
      assert.deepEqual(
        _0x2d9f3e.children.map((_0x14663a) => _0x14663a.dataset.edgeId || ''),
        ['e1', ''],
      ),
      _0x2d9f3e.dispatch('drop', createEvent(_0xf65eb4)),
      assert.equal(_0x94de63.calls.length, 1),
      assert.deepEqual(_0x94de63.calls[0].removeIds, ['e1']),
      assert.deepEqual(
        _0x94de63.calls[0].addedEdges.map((_0xd1519a) => [_0xd1519a.id, _0xd1519a.refSlot]),
        [['e1', 'slotB']],
      ));
  }),
  test('refThumbDragController: fixed slot rejects type mismatch and invalid edges', () => {
    const _0xaedb0d = new FakeElement({ className: 'ref-thumb-container' }),
      _0x25d4ba = createThumb('imageEdge', { slot: 'imageSlot', sourceId: 'img' }),
      _0x175606 = createThumb('', { slot: 'audioSlot', tagName: 'button' }),
      _0x426a00 = createThumb('otherEdge', { slot: 'imageSlot', sourceId: 'img2' }),
      _0x28a8b7 = createThumb('groupEdge', { slot: 'imageSlot', sourceId: 'img3' });
    (_0xaedb0d.appendChild(_0x25d4ba),
      _0xaedb0d.appendChild(_0x175606),
      _0xaedb0d.appendChild(_0x426a00),
      _0xaedb0d.appendChild(_0x28a8b7));
    const _0x2ba3b3 = {
        imageEdge: { id: 'imageEdge', sourceId: 'img', targetId: 'target', refSlot: 'imageSlot' },
        otherEdge: { id: 'otherEdge', sourceId: 'img2', targetId: 'other', refSlot: 'imageSlot' },
        groupEdge: {
          id: 'groupEdge',
          sourceId: 'img3',
          targetId: 'target',
          refSlot: 'imageSlot',
          isGroupShared: true,
        },
      },
      _0x722da8 = {
        img: { type: 'source-image' },
        img2: { type: 'source-image' },
        img3: { type: 'source-image' },
      },
      _0x3ba26f = createStore({ edges: _0x2ba3b3, nodes: _0x722da8 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: _0xaedb0d,
      store: _0x3ba26f,
      nodeId: 'target',
      acceptMap: { imageSlot: 'image', audioSlot: 'audio' },
    }),
      _0xaedb0d.dispatch('dragstart', createEvent(_0x25d4ba)),
      _0xaedb0d.dispatch('drop', createEvent(_0x175606)),
      _0xaedb0d.dispatch('dragstart', createEvent(_0x426a00)),
      _0xaedb0d.dispatch('drop', createEvent(_0x175606)),
      _0xaedb0d.dispatch('dragstart', createEvent(_0x28a8b7)),
      _0xaedb0d.dispatch('drop', createEvent(_0x175606)),
      assert.equal(_0x3ba26f.calls.length, 0));
  }),
  test('refThumbDragController: fixed slot group shared edge moves backing group input ref', () => {
    const _0x1e54d3 = new FakeElement({ className: 'ref-thumb-container' }),
      _0x1fef6d = createThumb('groupEdge', { slot: 'imageSlot', sourceId: 'img' }),
      _0x5ab823 = createThumb('', { slot: 'otherImageSlot', tagName: 'button' });
    (_0x1e54d3.appendChild(_0x1fef6d), _0x1e54d3.appendChild(_0x5ab823));
    const _0x6d76c = {
        groupEdge: { id: 'groupEdge', sourceId: 'img', targetId: 'group', refSlot: 'imageSlot' },
      },
      _0x27bfa0 = [{ ..._0x6d76c.groupEdge, isGroupShared: true, effectiveTargetId: 'target' }],
      _0x94ab20 = {},
      _0x2642ef = createStore({
        edges: _0x6d76c,
        incoming: _0x27bfa0,
        nodes: { img: { type: 'source-image' } },
      });
    (bindRefThumbFixedSlotDrag({
      owner: _0x94ab20,
      container: _0x1e54d3,
      store: _0x2642ef,
      nodeId: 'target',
      acceptMap: { imageSlot: 'image', otherImageSlot: 'image' },
    }),
      _0x1e54d3.dispatch('dragstart', createEvent(_0x1fef6d)),
      _0x1e54d3.dispatch('drop', createEvent(_0x5ab823)),
      assert.equal(_0x94ab20._fixedSlotDrag, null),
      assert.equal(_0x2642ef.calls.length, 1),
      assert.deepEqual(_0x2642ef.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        _0x2642ef.calls[0].addedEdges.map((_0x1f6a54) => [
          _0x1f6a54.id,
          _0x1f6a54.targetId,
          _0x1f6a54.refSlot,
          _0x1f6a54.isGroupShared,
        ]),
        [['groupEdge', 'group', 'otherImageSlot', undefined]],
      ));
  }),
  test('refThumbDragController: fixed slot group shared refs swap backing group input refs', () => {
    const _0x322d4b = new FakeElement({ className: 'ref-thumb-container' }),
      _0x4ac807 = createThumb('groupEdgeA', { slot: 'replaceTarget', sourceId: 'imageA' }),
      _0x1d00bd = createThumb('groupEdgeB', { slot: 'replacedImage', sourceId: 'imageB' });
    (_0x322d4b.appendChild(_0x4ac807), _0x322d4b.appendChild(_0x1d00bd));
    const _0x4c7e0d = {
        groupEdgeA: { id: 'groupEdgeA', sourceId: 'imageA', targetId: 'group' },
        groupEdgeB: { id: 'groupEdgeB', sourceId: 'imageB', targetId: 'group' },
      },
      _0x378616 = [
        { ..._0x4c7e0d.groupEdgeA, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
        { ..._0x4c7e0d.groupEdgeB, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
      ],
      _0x2a91f6 = {},
      _0x404802 = createStore({
        edges: _0x4c7e0d,
        incoming: _0x378616,
        nodes: { imageA: { type: 'source-image' }, imageB: { type: 'ai-image' } },
      });
    (bindRefThumbFixedSlotDrag({
      owner: _0x2a91f6,
      container: _0x322d4b,
      store: _0x404802,
      nodeId: 'target',
      acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
    }),
      _0x322d4b.dispatch('dragstart', createEvent(_0x4ac807)),
      _0x322d4b.dispatch('drop', createEvent(_0x1d00bd)),
      assert.equal(_0x404802.calls.length, 1),
      assert.deepEqual(_0x404802.calls[0].removeIds, ['groupEdgeA', 'groupEdgeB']),
      assert.deepEqual(
        _0x404802.calls[0].addedEdges.map((_0x1ad643) => [
          _0x1ad643.id,
          _0x1ad643.targetId,
          _0x1ad643.refSlot,
        ]),
        [
          ['groupEdgeA', 'group', 'replacedImage'],
          ['groupEdgeB', 'group', 'replaceTarget'],
        ],
      ));
  }),
  test('refThumbDragController: fixed slot group output refs swap by source order', () => {
    const _0x1f404a = new FakeElement({ className: 'ref-thumb-container' }),
      _0x322528 = 'groupEdge::group-output::imageA',
      _0xb35b98 = 'groupEdge::group-output::imageB',
      _0x18e1c3 = createThumb(_0x322528, { slot: 'replaceTarget', sourceId: 'imageA' }),
      _0x9b8746 = createThumb(_0xb35b98, { slot: 'replacedImage', sourceId: 'imageB' });
    (_0x1f404a.appendChild(_0x18e1c3), _0x1f404a.appendChild(_0x9b8746));
    const _0xca3145 = {
        groupEdge: { id: 'groupEdge', sourceId: 'group', targetId: 'target', isGroupOutputLink: true },
      },
      _0x1e9000 = [
        {
          ..._0xca3145.groupEdge,
          id: _0x322528,
          sourceId: 'imageA',
          refSlot: 'replaceTarget',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
        {
          ..._0xca3145.groupEdge,
          id: _0xb35b98,
          sourceId: 'imageB',
          refSlot: 'replacedImage',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
      ],
      _0x52fc42 = {},
      _0x835b9f = createStore({
        edges: _0xca3145,
        incoming: _0x1e9000,
        nodes: { imageA: { type: 'source-image' }, imageB: { type: 'ai-image' } },
      });
    (bindRefThumbFixedSlotDrag({
      owner: _0x52fc42,
      container: _0x1f404a,
      store: _0x835b9f,
      nodeId: 'target',
      acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
    }),
      _0x1f404a.dispatch('dragstart', createEvent(_0x18e1c3)),
      _0x1f404a.dispatch('drop', createEvent(_0x9b8746)),
      assert.equal(_0x835b9f.calls.length, 1),
      assert.deepEqual(_0x835b9f.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        _0x835b9f.calls[0].addedEdges.map((_0x418ad5) => [_0x418ad5.id, _0x418ad5.groupOutputSourceOrder]),
        [['groupEdge', ['imageB', 'imageA']]],
      ));
  }),
  test('refThumbDragController: fixed slot binding refreshes accept map', () => {
    const _0x5cb67e = new FakeElement({ className: 'ref-thumb-container' }),
      _0xc02fbc = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      _0x6aa989 = createThumb('', { slot: 'slotB', tagName: 'button' });
    (_0x5cb67e.appendChild(_0xc02fbc), _0x5cb67e.appendChild(_0x6aa989));
    const _0xbd1c4e = { e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' } },
      _0x3f6ff9 = { audioA: { type: 'source-audio' } },
      _0x5a33bd = createStore({ edges: _0xbd1c4e, nodes: _0x3f6ff9 }),
      _0x505001 = {};
    (bindRefThumbFixedSlotDrag({
      owner: _0x505001,
      container: _0x5cb67e,
      store: _0x5a33bd,
      nodeId: 'target',
      acceptMap: { slotA: 'audio', slotB: 'image' },
    }),
      bindRefThumbFixedSlotDrag({
        owner: _0x505001,
        container: _0x5cb67e,
        store: _0x5a33bd,
        nodeId: 'target',
        acceptMap: { slotA: 'audio', slotB: 'audio' },
      }),
      _0x5cb67e.dispatch('dragstart', createEvent(_0xc02fbc)),
      _0x5cb67e.dispatch('drop', createEvent(_0x6aa989)),
      assert.equal(_0x5a33bd.calls.length, 1),
      assert.deepEqual(
        _0x5a33bd.calls[0].addedEdges.map((_0x13d116) => [_0x13d116.id, _0x13d116.refSlot]),
        [['e1', 'slotB']],
      ));
  }));
