import test from 'node:test';
import assert from 'node:assert/strict';
import { bindRefThumbFixedSlotDrag, bindRefThumbOrderDrag } from './refThumbDragController.js';
class FakeClassList {
  constructor(value) {
    this.owner = value;
  }
  ['_tokens']() {
    return String(this.owner.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['contains'](item) {
    return this._tokens().includes(String(item || ''));
  }
  ['add'](...list) {
    const key = new Set(this._tokens());
    (list.forEach((item2) => key.add(String(item2 || ''))),
      (this.owner.className = Array.from(key).join(' ')));
  }
  ['remove'](...list2) {
    const map = new Set(list2.map((item3) => String(item3 || '')));
    this.owner.className = this._tokens()
      .filter((item4) => !map.has(item4))
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
    const list3 = this.parentNode.children,
      count = list3.indexOf(this);
    return count >= 0 ? list3[count + 1] || null : null;
  }
  ['appendChild'](el) {
    if (el.parentNode) el.remove();
    return (this.children.push(el), (el.parentNode = this), (el.parentElement = this), el);
  }
  ['insertBefore'](el2, index) {
    if (el2.parentNode) el2.remove();
    const count2 = index ? this.children.indexOf(index) : -1;
    if (count2 >= 0) this.children.splice(count2, 0, el2);
    else this.children.push(el2);
    return ((el2.parentNode = this), (el2.parentElement = this), el2);
  }
  ['remove']() {
    if (!this.parentNode) return;
    const list4 = this.parentNode.children,
      count3 = list4.indexOf(this);
    if (count3 >= 0) list4.splice(count3, 1);
    ((this.parentNode = null), (this.parentElement = null));
  }
  ['setAttribute'](result, data) {
    this.attributes[String(result)] = String(data);
  }
  ['getAttribute'](options) {
    return this.attributes[String(options)];
  }
  ['addEventListener'](target, source) {
    if (!this.listeners.has(target)) this.listeners.set(target, []);
    this.listeners.get(target).push(source);
  }
  ['dispatch'](next, current) {
    for (const run of this.listeners.get(next) || []) {
      run(current);
    }
  }
  ['matches'](entry) {
    if (entry === '.ref-thumb-container') return this.classList.contains('ref-thumb-container');
    if (entry === '.ref-thumb-wrap') return this.classList.contains('ref-thumb-wrap');
    if (entry === '[data-slot]') return !!this.dataset.slot;
    return false;
  }
  ['closest'](record) {
    let payload = this;
    while (payload) {
      if (payload.matches(record)) return payload;
      payload = payload.parentElement;
    }
    return null;
  }
  ['querySelector'](handle) {
    return this.querySelectorAll(handle)[0] || null;
  }
  ['querySelectorAll'](state) {
    const list5 = [],
      item5 = (el3) => {
        if (matchesFakeSelector(el3, state)) list5.push(el3);
        el3.children.forEach(item5);
      };
    return (this.children.forEach(item5), list5);
  }
  ['getBoundingClientRect']() {
    const config = this.parentNode ? this.parentNode.children.indexOf(this) : 0;
    return { left: Math.max(0, config) * 100, top: 0, width: 100, height: 40 };
  }
}
function matchesFakeSelector(el4, scope) {
  if (scope === '.ref-thumb-wrap') return el4.classList.contains('ref-thumb-wrap');
  if (scope === '.ref-thumb-container') return el4.classList.contains('ref-thumb-container');
  if (scope === '.ref-thumb-wrap.is-drop-allow')
    return el4.classList.contains('ref-thumb-wrap') && el4.classList.contains('is-drop-allow');
  if (scope === '[data-slot]') return !!el4.dataset.slot;
  return false;
}
function createThumb(edgeId, className2 = {}) {
  return new FakeElement({
    className: className2.className || 'ref-thumb-wrap',
    dataset: {
      edgeId: edgeId,
      sourceId: className2.sourceId || 'src-' + edgeId,
      slot: className2.slot || '',
      kind: className2.kind || '',
      refOrigin: className2.refOrigin || '',
      refKey: className2.refKey || '',
      assetId: className2.assetId || '',
    },
    tagName: className2.tagName || 'div',
  });
}
function createEvent(target2, clientX = 0) {
  return {
    target: target2,
    clientX: clientX,
    dataTransfer: {
      effectAllowed: '',
      dropEffect: '',
      data: {},
      setData(input, output) {
        this.data[input] = output;
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
function createStore({ edges: edges, nodes: nodes = {}, incoming: incoming }) {
  const calls = [];
  return {
    calls: calls,
    getState() {
      return { edges: edges, nodes: nodes };
    },
    getIncomingEdges() {
      return incoming || Object.values(edges);
    },
    updateEdgesBatch(removeIds, addedEdges) {
      calls.push({ removeIds: removeIds, addedEdges: addedEdges });
    },
  };
}
(test('refThumbDragController: order drag commits DOM order once', () => {
  const container = new FakeElement({ className: 'ref-thumb-container' }),
    store = createThumb('e1'),
    thumb = createThumb('e2'),
    store2 = createThumb('e3');
  (container.appendChild(store), container.appendChild(thumb), container.appendChild(store2));
  const edges2 = {
      e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
      e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      e3: { id: 'e3', sourceId: 's3', targetId: 'target' },
    },
    store3 = createStore({ edges: edges2 }),
    owner = {};
  (bindRefThumbOrderDrag({ owner: owner, container: container, store: store3, nodeId: 'target' }),
    store2.dispatch('dragstart', createEvent(store2)),
    store.dispatch('dragover', createEvent(store, 0)),
    store2.dispatch('dragend', createEvent(store2)),
    assert.equal(store3.calls.length, 1),
    assert.deepEqual(store3.calls[0].removeIds, ['e1', 'e2', 'e3']),
    assert.deepEqual(
      store3.calls[0].addedEdges.map((item6) => item6.id),
      ['e3', 'e1', 'e2'],
    ),
    assert.equal(owner._isDraggingSorting, false));
}),
  test('refThumbDragController: unchanged order does not commit', () => {
    const container2 = new FakeElement({ className: 'ref-thumb-container' }),
      store4 = createThumb('e1'),
      thumb2 = createThumb('e2');
    (container2.appendChild(store4), container2.appendChild(thumb2));
    const edges3 = {
        e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
        e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      },
      store5 = createStore({ edges: edges3 });
    (bindRefThumbOrderDrag({ owner: {}, container: container2, store: store5, nodeId: 'target' }),
      store4.dispatch('dragstart', createEvent(store4)),
      store4.dispatch('dragend', createEvent(store4)),
      assert.equal(store5.calls.length, 0));
  }),
  test('refThumbDragController: incrementally bound thumbs share drag state', () => {
    const container3 = new FakeElement({ className: 'ref-thumb-container' }),
      store6 = createThumb('e1');
    container3.appendChild(store6);
    const edges4 = {
        e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
        e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      },
      store7 = createStore({ edges: edges4 });
    bindRefThumbOrderDrag({ owner: {}, container: container3, store: store7, nodeId: 'target' });
    const store8 = createThumb('e2');
    (container3.appendChild(store8),
      bindRefThumbOrderDrag({ owner: {}, container: container3, store: store7, nodeId: 'target' }),
      store6.dispatch('dragstart', createEvent(store6)),
      store8.dispatch('dragover', createEvent(store8, 999)),
      store6.dispatch('dragend', createEvent(store6)),
      assert.deepEqual(
        container3.children.map((el5) => el5.dataset.edgeId),
        ['e2', 'e1'],
      ),
      assert.equal(store7.calls.length, 1),
      assert.deepEqual(
        store7.calls[0].addedEdges.map((item7) => item7.id),
        ['e2', 'e1'],
      ));
  }),
  test('refThumbDragController: asset and empty refs do not participate in order', () => {
    const container4 = new FakeElement({ className: 'ref-thumb-container' }),
      store9 = createThumb('e1'),
      el6 = createThumb('', { refOrigin: 'asset', assetId: 'asset-1' }),
      el7 = createThumb(''),
      store10 = createThumb('e2');
    (container4.appendChild(store9),
      container4.appendChild(el6),
      container4.appendChild(el7),
      container4.appendChild(store10));
    const edges5 = {
        e1: { id: 'e1', sourceId: 's1', targetId: 'target' },
        e2: { id: 'e2', sourceId: 's2', targetId: 'target' },
      },
      store11 = createStore({ edges: edges5 });
    (bindRefThumbOrderDrag({ owner: {}, container: container4, store: store11, nodeId: 'target' }),
      assert.equal(el6.dataset.dragBound, undefined),
      assert.equal(el7.dataset.dragBound, undefined),
      store10.dispatch('dragstart', createEvent(store10)),
      store9.dispatch('dragover', createEvent(store9, 0)),
      store10.dispatch('dragend', createEvent(store10)),
      assert.equal(store11.calls.length, 1),
      assert.deepEqual(store11.calls[0].removeIds, ['e1', 'e2']),
      assert.deepEqual(
        store11.calls[0].addedEdges.map((item8) => item8.id),
        ['e2', 'e1'],
      ));
  }),
  test('refThumbDragController: group shared refs reorder backing group input edges', () => {
    const container5 = new FakeElement({ className: 'ref-thumb-container' }),
      store12 = createThumb('groupEdgeA', { sourceId: 's1' }),
      store13 = createThumb('groupEdgeB', { sourceId: 's2' });
    (container5.appendChild(store12), container5.appendChild(store13));
    const edges6 = {
        groupEdgeA: { id: 'groupEdgeA', sourceId: 's1', targetId: 'group' },
        groupEdgeB: { id: 'groupEdgeB', sourceId: 's2', targetId: 'group' },
      },
      incoming2 = [
        { ...edges6.groupEdgeA, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
        { ...edges6.groupEdgeB, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
      ],
      store14 = createStore({ edges: edges6, incoming: incoming2 });
    (bindRefThumbOrderDrag({ owner: {}, container: container5, store: store14, nodeId: 'target' }),
      assert.equal(store12.getAttribute('draggable'), 'true'),
      assert.equal(store13.getAttribute('draggable'), 'true'),
      store13.dispatch('dragstart', createEvent(store13)),
      store12.dispatch('dragover', createEvent(store12, 0)),
      store13.dispatch('dragend', createEvent(store13)),
      assert.equal(store14.calls.length, 1),
      assert.deepEqual(store14.calls[0].removeIds, ['groupEdgeA', 'groupEdgeB']),
      assert.deepEqual(
        store14.calls[0].addedEdges.map((item9) => [item9.id, item9.targetId]),
        [
          ['groupEdgeB', 'group'],
          ['groupEdgeA', 'group'],
        ],
      ));
  }),
  test('refThumbDragController: fixed slot refs do not participate in free order', () => {
    const container6 = new FakeElement({ className: 'ref-thumb-container' }),
      el8 = createThumb('e1', { slot: 'sourceVideo', sourceId: 'videoA' }),
      el9 = createThumb('e2', { slot: 'refImage', sourceId: 'imageB' });
    (el8.setAttribute('draggable', 'true'),
      el9.setAttribute('draggable', 'true'),
      container6.appendChild(el8),
      container6.appendChild(el9));
    const edges7 = {
        e1: { id: 'e1', sourceId: 'videoA', targetId: 'target', refSlot: 'sourceVideo' },
        e2: { id: 'e2', sourceId: 'imageB', targetId: 'target', refSlot: 'refImage' },
      },
      store15 = createStore({ edges: edges7 });
    (bindRefThumbOrderDrag({ owner: {}, container: container6, store: store15, nodeId: 'target' }),
      assert.equal(el8.dataset.dragBound, undefined),
      assert.equal(el9.dataset.dragBound, undefined),
      assert.equal(el8.getAttribute('draggable'), 'true'),
      assert.equal(el9.getAttribute('draggable'), 'true'),
      el9.dispatch('dragstart', createEvent(el9)),
      el8.dispatch('dragover', createEvent(el8, 0)),
      el9.dispatch('dragend', createEvent(el9)),
      assert.deepEqual(
        container6.children.map((el10) => el10.dataset.edgeId),
        ['e1', 'e2'],
      ),
      assert.equal(store15.calls.length, 0));
  }),
  test('refThumbDragController: group output refs persist source order on base edge', () => {
    const container7 = new FakeElement({ className: 'ref-thumb-container' }),
      id = 'groupEdge::group-output::image-1',
      id2 = 'groupEdge::group-output::image-2',
      store16 = createThumb(id, { sourceId: 'image-1' }),
      store17 = createThumb(id2, { sourceId: 'image-2' });
    (container7.appendChild(store16), container7.appendChild(store17));
    const edges8 = {
        groupEdge: { id: 'groupEdge', sourceId: 'group', targetId: 'target', isGroupOutputLink: true },
      },
      incoming3 = [
        {
          ...edges8.groupEdge,
          id: id,
          sourceId: 'image-1',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
        {
          ...edges8.groupEdge,
          id: id2,
          sourceId: 'image-2',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
      ],
      store18 = createStore({ edges: edges8, incoming: incoming3 });
    (bindRefThumbOrderDrag({ owner: {}, container: container7, store: store18, nodeId: 'target' }),
      assert.equal(store16.getAttribute('draggable'), 'true'),
      assert.equal(store17.getAttribute('draggable'), 'true'),
      store17.dispatch('dragstart', createEvent(store17)),
      store16.dispatch('dragover', createEvent(store16, 0)),
      store17.dispatch('dragend', createEvent(store17)),
      assert.deepEqual(
        container7.children.map((el11) => el11.dataset.edgeId),
        [id2, id],
      ),
      assert.equal(store18.calls.length, 1),
      assert.deepEqual(store18.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        store18.calls[0].addedEdges.map((item10) => item10.id),
        ['groupEdge'],
      ),
      assert.deepEqual(store18.calls[0].addedEdges[0].groupOutputSourceOrder, ['image-2', 'image-1']));
  }),
  test('refThumbDragController: shared group output refs persist source order per target', () => {
    const container8 = new FakeElement({ className: 'ref-thumb-container' }),
      id3 = 'groupEdge::group-output::image-1',
      id4 = 'groupEdge::group-output::image-2',
      store19 = createThumb(id3, { sourceId: 'image-1' }),
      store20 = createThumb(id4, { sourceId: 'image-2' });
    (container8.appendChild(store19), container8.appendChild(store20));
    const edges9 = {
        groupEdge: { id: 'groupEdge', sourceId: 'groupA', targetId: 'groupB', isGroupOutputLink: true },
      },
      incoming4 = [
        {
          ...edges9.groupEdge,
          id: id3,
          sourceId: 'image-1',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
        {
          ...edges9.groupEdge,
          id: id4,
          sourceId: 'image-2',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
      ],
      store21 = createStore({ edges: edges9, incoming: incoming4 });
    (bindRefThumbOrderDrag({ owner: {}, container: container8, store: store21, nodeId: 'target' }),
      assert.equal(store19.getAttribute('draggable'), 'true'),
      assert.equal(store20.getAttribute('draggable'), 'true'),
      store20.dispatch('dragstart', createEvent(store20)),
      store19.dispatch('dragover', createEvent(store19, 0)),
      store20.dispatch('dragend', createEvent(store20)),
      assert.deepEqual(
        container8.children.map((el12) => el12.dataset.edgeId),
        [id4, id3],
      ),
      assert.equal(store21.calls.length, 1),
      assert.deepEqual(store21.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        store21.calls[0].addedEdges.map((item11) => item11.id),
        ['groupEdge'],
      ),
      assert.equal(store21.calls[0].addedEdges[0].groupOutputSourceOrder, undefined),
      assert.deepEqual(store21.calls[0].addedEdges[0].groupOutputSourceOrderByTarget, {
        target: ['image-2', 'image-1'],
      }));
  }),
  test('refThumbDragController: shared group output order keeps sibling targets isolated', () => {
    const container9 = new FakeElement({ className: 'ref-thumb-container' }),
      id5 = 'groupEdge::group-output::image-1',
      id6 = 'groupEdge::group-output::image-2',
      store22 = createThumb(id5, { sourceId: 'image-1' }),
      store23 = createThumb(id6, { sourceId: 'image-2' });
    (container9.appendChild(store22), container9.appendChild(store23));
    const edges10 = {
        groupEdge: {
          id: 'groupEdge',
          sourceId: 'groupA',
          targetId: 'groupB',
          isGroupOutputLink: true,
          groupOutputSourceOrderByTarget: { nodeB: ['image-1', 'image-2'] },
        },
      },
      incoming5 = [
        {
          ...edges10.groupEdge,
          id: id5,
          sourceId: 'image-1',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'nodeA',
        },
        {
          ...edges10.groupEdge,
          id: id6,
          sourceId: 'image-2',
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: 'groupB',
          outputGroupId: 'groupA',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'nodeA',
        },
      ],
      store24 = createStore({ edges: edges10, incoming: incoming5 });
    (bindRefThumbOrderDrag({ owner: {}, container: container9, store: store24, nodeId: 'nodeA' }),
      store23.dispatch('dragstart', createEvent(store23)),
      store22.dispatch('dragover', createEvent(store22, 0)),
      store23.dispatch('dragend', createEvent(store23)),
      assert.equal(store24.calls.length, 1),
      assert.deepEqual(store24.calls[0].addedEdges[0].groupOutputSourceOrderByTarget, {
        nodeA: ['image-2', 'image-1'],
        nodeB: ['image-1', 'image-2'],
      }));
  }),
  test('refThumbDragController: fixed slot swap exchanges refSlot', () => {
    const container10 = new FakeElement({ className: 'ref-thumb-container' }),
      thumb3 = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      thumb4 = createThumb('e2', { slot: 'slotB', sourceId: 'audioB' });
    (container10.appendChild(thumb3), container10.appendChild(thumb4));
    const edges11 = {
        e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' },
        e2: { id: 'e2', sourceId: 'audioB', targetId: 'target', refSlot: 'slotB' },
      },
      nodes2 = { audioA: { type: 'source-audio' }, audioB: { type: 'ai-audio' } },
      store25 = createStore({ edges: edges11, nodes: nodes2 }),
      owner2 = {};
    (bindRefThumbFixedSlotDrag({
      owner: owner2,
      container: container10,
      store: store25,
      nodeId: 'target',
      acceptMap: { slotA: 'audio', slotB: 'audio' },
    }),
      container10.dispatch('dragstart', createEvent(thumb3)),
      container10.dispatch('drop', createEvent(thumb4)),
      assert.equal(store25.calls.length, 1),
      assert.deepEqual(store25.calls[0].removeIds, ['e1', 'e2']),
      assert.deepEqual(
        store25.calls[0].addedEdges.map((item12) => [item12.id, item12.refSlot]),
        [
          ['e1', 'slotB'],
          ['e2', 'slotA'],
        ],
      ),
      assert.equal(owner2._fixedSlotDrag, null));
  }),
  test('refThumbDragController: fixed slot drag still works when order binding also runs', () => {
    const container11 = new FakeElement({ className: 'ref-thumb-container' }),
      thumb5 = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      thumb6 = createThumb('e2', { slot: 'slotB', sourceId: 'audioB' });
    (container11.appendChild(thumb5), container11.appendChild(thumb6));
    const edges12 = {
        e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' },
        e2: { id: 'e2', sourceId: 'audioB', targetId: 'target', refSlot: 'slotB' },
      },
      nodes3 = { audioA: { type: 'source-audio' }, audioB: { type: 'ai-audio' } },
      store26 = createStore({ edges: edges12, nodes: nodes3 }),
      owner3 = {};
    (bindRefThumbOrderDrag({ owner: owner3, container: container11, store: store26, nodeId: 'target' }),
      bindRefThumbFixedSlotDrag({
        owner: owner3,
        container: container11,
        store: store26,
        nodeId: 'target',
        acceptMap: { slotA: 'audio', slotB: 'audio' },
      }),
      container11.dispatch('dragstart', createEvent(thumb5)),
      container11.dispatch('drop', createEvent(thumb6)),
      assert.equal(store26.calls.length, 1),
      assert.deepEqual(store26.calls[0].removeIds, ['e1', 'e2']),
      assert.deepEqual(
        store26.calls[0].addedEdges.map((item13) => [item13.id, item13.refSlot]),
        [
          ['e1', 'slotB'],
          ['e2', 'slotA'],
        ],
      ));
  }),
  test('refThumbDragController: fixed image slots swap refSlot', () => {
    const container12 = new FakeElement({ className: 'ref-thumb-container' }),
      el13 = createThumb('e1', { slot: 'replaceTarget', kind: 'image', sourceId: 'imageA' }),
      el14 = createThumb('e2', { slot: 'replacedImage', kind: 'image', sourceId: 'imageB' });
    (container12.appendChild(el13), container12.appendChild(el14));
    const edges13 = {
        e1: { id: 'e1', sourceId: 'imageA', targetId: 'target', refSlot: 'replaceTarget' },
        e2: { id: 'e2', sourceId: 'imageB', targetId: 'target', refSlot: 'replacedImage' },
      },
      nodes4 = { imageA: { type: 'source-image' }, imageB: { type: 'ai-image' } },
      store27 = createStore({ edges: edges13, nodes: nodes4 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: container12,
      store: store27,
      nodeId: 'target',
      acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
    }),
      container12.dispatch('dragstart', createEvent(el13)),
      container12.dispatch('dragover', createEvent(el14)),
      assert.deepEqual(
        container12.children.map((el15) => el15.dataset.edgeId),
        ['e1', 'e2'],
      ),
      assert.equal(String(el13.style.transform || ''), ''),
      assert.equal(String(el14.style.transform || ''), ''),
      container12.dispatch('drop', createEvent(el14)),
      assert.equal(store27.calls.length, 1),
      assert.deepEqual(
        store27.calls[0].addedEdges.map((item14) => [item14.id, item14.refSlot]),
        [
          ['e1', 'replacedImage'],
          ['e2', 'replaceTarget'],
        ],
      ));
  }),
  test('refThumbDragController: fixed slot drop to empty slot moves one edge', () => {
    const container13 = new FakeElement({ className: 'ref-thumb-container' }),
      thumb7 = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      thumb8 = createThumb('', { slot: 'slotB', tagName: 'button' });
    (container13.appendChild(thumb7), container13.appendChild(thumb8));
    const edges14 = { e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' } },
      nodes5 = { audioA: { type: 'source-audio' } },
      store28 = createStore({ edges: edges14, nodes: nodes5 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: container13,
      store: store28,
      nodeId: 'target',
      acceptMap: { slotA: 'audio', slotB: 'audio' },
    }),
      container13.dispatch('dragstart', createEvent(thumb7)),
      container13.dispatch('dragover', createEvent(thumb8)),
      assert.deepEqual(
        container13.children.map((el16) => el16.dataset.edgeId || ''),
        ['e1', ''],
      ),
      container13.dispatch('drop', createEvent(thumb8)),
      assert.equal(store28.calls.length, 1),
      assert.deepEqual(store28.calls[0].removeIds, ['e1']),
      assert.deepEqual(
        store28.calls[0].addedEdges.map((item15) => [item15.id, item15.refSlot]),
        [['e1', 'slotB']],
      ));
  }),
  test('refThumbDragController: fixed slot rejects type mismatch and invalid edges', () => {
    const container14 = new FakeElement({ className: 'ref-thumb-container' }),
      thumb9 = createThumb('imageEdge', { slot: 'imageSlot', sourceId: 'img' }),
      thumb10 = createThumb('', { slot: 'audioSlot', tagName: 'button' }),
      thumb11 = createThumb('otherEdge', { slot: 'imageSlot', sourceId: 'img2' }),
      thumb12 = createThumb('groupEdge', { slot: 'imageSlot', sourceId: 'img3' });
    (container14.appendChild(thumb9),
      container14.appendChild(thumb10),
      container14.appendChild(thumb11),
      container14.appendChild(thumb12));
    const edges15 = {
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
      nodes6 = {
        img: { type: 'source-image' },
        img2: { type: 'source-image' },
        img3: { type: 'source-image' },
      },
      store29 = createStore({ edges: edges15, nodes: nodes6 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: container14,
      store: store29,
      nodeId: 'target',
      acceptMap: { imageSlot: 'image', audioSlot: 'audio' },
    }),
      container14.dispatch('dragstart', createEvent(thumb9)),
      container14.dispatch('drop', createEvent(thumb10)),
      container14.dispatch('dragstart', createEvent(thumb11)),
      container14.dispatch('drop', createEvent(thumb10)),
      container14.dispatch('dragstart', createEvent(thumb12)),
      container14.dispatch('drop', createEvent(thumb10)),
      assert.equal(store29.calls.length, 0));
  }),
  test('refThumbDragController: fixed slot group shared edge moves backing group input ref', () => {
    const container15 = new FakeElement({ className: 'ref-thumb-container' }),
      thumb13 = createThumb('groupEdge', { slot: 'imageSlot', sourceId: 'img' }),
      thumb14 = createThumb('', { slot: 'otherImageSlot', tagName: 'button' });
    (container15.appendChild(thumb13), container15.appendChild(thumb14));
    const edges16 = {
        groupEdge: { id: 'groupEdge', sourceId: 'img', targetId: 'group', refSlot: 'imageSlot' },
      },
      incoming6 = [{ ...edges16.groupEdge, isGroupShared: true, effectiveTargetId: 'target' }],
      owner4 = {},
      store30 = createStore({
        edges: edges16,
        incoming: incoming6,
        nodes: { img: { type: 'source-image' } },
      });
    (bindRefThumbFixedSlotDrag({
      owner: owner4,
      container: container15,
      store: store30,
      nodeId: 'target',
      acceptMap: { imageSlot: 'image', otherImageSlot: 'image' },
    }),
      container15.dispatch('dragstart', createEvent(thumb13)),
      container15.dispatch('drop', createEvent(thumb14)),
      assert.equal(owner4._fixedSlotDrag, null),
      assert.equal(store30.calls.length, 1),
      assert.deepEqual(store30.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        store30.calls[0].addedEdges.map((item16) => [
          item16.id,
          item16.targetId,
          item16.refSlot,
          item16.isGroupShared,
        ]),
        [['groupEdge', 'group', 'otherImageSlot', undefined]],
      ));
  }),
  test('refThumbDragController: fixed slot group shared refs swap backing group input refs', () => {
    const container16 = new FakeElement({ className: 'ref-thumb-container' }),
      thumb15 = createThumb('groupEdgeA', { slot: 'replaceTarget', sourceId: 'imageA' }),
      thumb16 = createThumb('groupEdgeB', { slot: 'replacedImage', sourceId: 'imageB' });
    (container16.appendChild(thumb15), container16.appendChild(thumb16));
    const edges17 = {
        groupEdgeA: { id: 'groupEdgeA', sourceId: 'imageA', targetId: 'group' },
        groupEdgeB: { id: 'groupEdgeB', sourceId: 'imageB', targetId: 'group' },
      },
      incoming7 = [
        { ...edges17.groupEdgeA, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
        { ...edges17.groupEdgeB, isGroupShared: true, sharedGroupId: 'group', effectiveTargetId: 'target' },
      ],
      owner5 = {},
      store31 = createStore({
        edges: edges17,
        incoming: incoming7,
        nodes: { imageA: { type: 'source-image' }, imageB: { type: 'ai-image' } },
      });
    (bindRefThumbFixedSlotDrag({
      owner: owner5,
      container: container16,
      store: store31,
      nodeId: 'target',
      acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
    }),
      container16.dispatch('dragstart', createEvent(thumb15)),
      container16.dispatch('drop', createEvent(thumb16)),
      assert.equal(store31.calls.length, 1),
      assert.deepEqual(store31.calls[0].removeIds, ['groupEdgeA', 'groupEdgeB']),
      assert.deepEqual(
        store31.calls[0].addedEdges.map((item17) => [item17.id, item17.targetId, item17.refSlot]),
        [
          ['groupEdgeA', 'group', 'replacedImage'],
          ['groupEdgeB', 'group', 'replaceTarget'],
        ],
      ));
  }),
  test('refThumbDragController: fixed slot group output refs swap by source order', () => {
    const container17 = new FakeElement({ className: 'ref-thumb-container' }),
      id7 = 'groupEdge::group-output::imageA',
      id8 = 'groupEdge::group-output::imageB',
      thumb17 = createThumb(id7, { slot: 'replaceTarget', sourceId: 'imageA' }),
      thumb18 = createThumb(id8, { slot: 'replacedImage', sourceId: 'imageB' });
    (container17.appendChild(thumb17), container17.appendChild(thumb18));
    const edges18 = {
        groupEdge: { id: 'groupEdge', sourceId: 'group', targetId: 'target', isGroupOutputLink: true },
      },
      incoming8 = [
        {
          ...edges18.groupEdge,
          id: id7,
          sourceId: 'imageA',
          refSlot: 'replaceTarget',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
        {
          ...edges18.groupEdge,
          id: id8,
          sourceId: 'imageB',
          refSlot: 'replacedImage',
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: 'target',
        },
      ],
      owner6 = {},
      store32 = createStore({
        edges: edges18,
        incoming: incoming8,
        nodes: { imageA: { type: 'source-image' }, imageB: { type: 'ai-image' } },
      });
    (bindRefThumbFixedSlotDrag({
      owner: owner6,
      container: container17,
      store: store32,
      nodeId: 'target',
      acceptMap: { replaceTarget: 'image', replacedImage: 'image' },
    }),
      container17.dispatch('dragstart', createEvent(thumb17)),
      container17.dispatch('drop', createEvent(thumb18)),
      assert.equal(store32.calls.length, 1),
      assert.deepEqual(store32.calls[0].removeIds, ['groupEdge']),
      assert.deepEqual(
        store32.calls[0].addedEdges.map((item18) => [item18.id, item18.groupOutputSourceOrder]),
        [['groupEdge', ['imageB', 'imageA']]],
      ));
  }),
  test('refThumbDragController: fixed slot binding refreshes accept map', () => {
    const container18 = new FakeElement({ className: 'ref-thumb-container' }),
      thumb19 = createThumb('e1', { slot: 'slotA', sourceId: 'audioA' }),
      thumb20 = createThumb('', { slot: 'slotB', tagName: 'button' });
    (container18.appendChild(thumb19), container18.appendChild(thumb20));
    const edges19 = { e1: { id: 'e1', sourceId: 'audioA', targetId: 'target', refSlot: 'slotA' } },
      nodes7 = { audioA: { type: 'source-audio' } },
      store33 = createStore({ edges: edges19, nodes: nodes7 }),
      owner7 = {};
    (bindRefThumbFixedSlotDrag({
      owner: owner7,
      container: container18,
      store: store33,
      nodeId: 'target',
      acceptMap: { slotA: 'audio', slotB: 'image' },
    }),
      bindRefThumbFixedSlotDrag({
        owner: owner7,
        container: container18,
        store: store33,
        nodeId: 'target',
        acceptMap: { slotA: 'audio', slotB: 'audio' },
      }),
      container18.dispatch('dragstart', createEvent(thumb19)),
      container18.dispatch('drop', createEvent(thumb20)),
      assert.equal(store33.calls.length, 1),
      assert.deepEqual(
        store33.calls[0].addedEdges.map((item19) => [item19.id, item19.refSlot]),
        [['e1', 'slotB']],
      ));
  }));
