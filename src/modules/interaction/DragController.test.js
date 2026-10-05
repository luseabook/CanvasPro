import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDragController } from './DragController.js';
import { getPerfProbeSnapshot, resetPerfProbeData, setPerfProbeEnabled } from '../perf/perfProbe.js';
function isNodeType(enabled, list) {
  if (!enabled) return false;
  if (Array.isArray(list)) return list.includes(enabled.type);
  return enabled.type === list;
}
function identityScreenToWorld(x, y) {
  return { x: x, y: y };
}
(test('DragController: 提取分镜会使用统一资源取图并把源格清为空态', () => {
  const draggedCellData = {
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: {
      'sb-1': {
        id: 'sb-1',
        type: 'storyboard',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        cols: 1,
        rows: 1,
        cells: [
          {
            id: 'cell-1',
            thumbLocalPath: 'output/thumb.webp',
            thumbUrl: 'data:image/png;base64,abc',
            thumbId: 'thumb-1',
            sourceId: 'source-1',
            isEmpty: false,
            extra: 'keep',
          },
        ],
      },
    },
  };
  let value = null,
    item = null,
    key = null;
  const store = {
      getStateRaw() {
        return draggedCellData;
      },
      batch(handler) {
        handler();
      },
      addNode(index) {
        value = index;
      },
      setSelectedNodes(result) {
        item = result;
      },
      updateNodeData(nodeId, patch) {
        key = { nodeId: nodeId, patch: patch };
      },
    },
    dragController = createDragController({
      store: store,
      isNodeType: isNodeType,
      getShortcuts() {
        return {};
      },
      hitTestNode() {
        return null;
      },
      screenToWorld: identityScreenToWorld,
      generateId(data) {
        return data + '-generated';
      },
      cloneNodesWithEdges() {
        return {};
      },
      commit() {},
    }),
    options = dragController.finishDraggingCell(
      {
        targetNodeId: 'sb-1',
        sourceCellIndex: 0,
        draggedCellData: draggedCellData.nodes['sb-1'].cells[0],
        ghostEl: null,
        sourceCellEl: null,
        lastHoverNodeId: null,
      },
      180,
      180,
    );
  (assert.deepEqual(options, { didAct: true, committed: true }),
    assert.equal(value?.src, '/output/thumb.webp'),
    assert.equal(value?.localPath, 'output/thumb.webp'),
    assert.deepEqual(item, ['source-image-generated']),
    assert.deepEqual(key, {
      nodeId: 'sb-1',
      patch: {
        cells: [
          {
            id: 'cell-1',
            thumbLocalPath: null,
            thumbUrl: '',
            thumbId: null,
            sourceId: null,
            sourceLocalPath: null,
            sourceUrl: '',
            sourceWidth: null,
            sourceHeight: null,
            storyboardSourceCrop: false,
            storyboardPiece: false,
            storyboardLockedCell: false,
            residualImageLocalPath: 'output/thumb.webp',
            residualImageUrl: 'data:image/png;base64,abc',
            residualImageWidth: null,
            residualImageHeight: null,
            residualImageMode: 'cell',
            isEmpty: true,
            extra: 'keep',
            col: 0,
            row: 0,
            url: '',
            localPath: null,
            originalLocalPath: null,
            displayLocalPath: null,
          },
        ],
      },
    }));
}),
  test('DragController: 自定义分割线和宫格间距拖出时按真实宫格区域裁切源图', () => {
    const target = globalThis.document,
      source = globalThis.window,
      draggedCellData2 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [1] },
            cells: [
              {
                id: 'cell-1',
                localPath: 'output/old-unadjusted.jpg',
                sourceLocalPath: 'output/source.jpg',
                sourceUrl: '/output/source.jpg',
                sourceWidth: 400,
                sourceHeight: 800,
                isEmpty: false,
              },
              { id: 'cell-2', isEmpty: true },
            ],
          },
        },
      };
    let box = null,
      next = null,
      current = null,
      list2 = null;
    const entry = { complete: true, naturalWidth: 400, naturalHeight: 800 },
      box2 = {
        width: 0,
        height: 0,
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: '',
            drawImage(...args) {
              list2 = args;
            },
          };
        },
        toDataURL(record, payload) {
          return (
            assert.equal(record, 'image/jpeg'),
            assert.equal(payload, 0.9),
            'data:image/jpeg;base64,current-crop'
          );
        },
      };
    try {
      (delete globalThis.window,
        (globalThis.document = {
          getElementById(handle) {
            return (
              assert.equal(handle, 'cell-sb-1-0'),
              {
                querySelector(state) {
                  return (assert.equal(state, 'img.storyboard-cell-img--source-crop'), entry);
                },
              }
            );
          },
          createElement(config) {
            return (assert.equal(config, 'canvas'), box2);
          },
        }));
      const store2 = {
          getStateRaw() {
            return draggedCellData2;
          },
          batch(handler2) {
            handler2();
          },
          addNode(scope) {
            box = scope;
          },
          setSelectedNodes(input) {
            next = input;
          },
          updateNodeData(nodeId2, patch2) {
            current = { nodeId: nodeId2, patch: patch2 };
          },
        },
        dragController2 = createDragController({
          store: store2,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(output) {
            return output + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value2 = dragController2.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData2.nodes['sb-1'].cells[0],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          500,
          500,
        );
      (assert.deepEqual(value2, { didAct: true, committed: true }),
        assert.deepEqual(list2?.slice(1), [0, 0, 280, 800, 0, 0, 280, 800]),
        assert.equal(box2.width, 280),
        assert.equal(box2.height, 800),
        assert.equal(box?.src, ''),
        assert.equal(box?.capturePreviewUrl, 'data:image/jpeg;base64,current-crop'),
        assert.equal(box?.localPath, ''),
        assert.equal(box?.width, 288),
        assert.equal(box?.height, 823),
        assert.equal(box?.originalWidth, 280),
        assert.equal(box?.originalHeight, 800),
        assert.equal(box?.sourceLocalPath, null),
        assert.equal(box?.sourceUrl, ''),
        assert.equal(box?.sourceWidth, null),
        assert.equal(box?.sourceHeight, null),
        assert.equal(box?.storyboardSourceCrop, false),
        assert.equal(box?.storyboardExtractedCell, true),
        assert.equal(box?.storyboardSourceIndex, 0),
        assert.equal(box?.storyboardSourceNodeId, 'sb-1'),
        assert.equal(box?.storyboardSourceLocalPath, 'output/source.jpg'),
        assert.equal(box?.storyboardSourceUrl, ''),
        assert.deepEqual(next, ['source-image-generated']),
        assert.equal(current?.nodeId, 'sb-1'),
        assert.equal(current?.patch?.cells?.[0]?.isEmpty, true),
        assert.equal(current?.patch?.cells?.[0]?.sourceLocalPath, null),
        assert.equal(current?.patch?.cells?.[0]?.sourceUrl, ''),
        (box = null),
        (list2 = null),
        (globalThis.document.getElementById = () => null));
      const value3 = dragController2.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: draggedCellData2.nodes['sb-1'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        520,
        520,
      );
      (assert.deepEqual(value3, { didAct: true, committed: true }),
        assert.deepEqual(list2?.slice(1), [0, 0, 280, 800, 0, 0, 280, 800]),
        assert.equal(box?.src, ''),
        assert.equal(box?.capturePreviewUrl, 'data:image/jpeg;base64,current-crop'),
        assert.equal(box?.localPath, ''),
        assert.equal(box?.storyboardExtractedCell, true),
        assert.equal(box?.storyboardSourceIndex, 0),
        assert.equal(box?.storyboardSourceNodeId, 'sb-1'));
    } finally {
      (target === undefined ? delete globalThis.document : (globalThis.document = target),
        source === undefined ? delete globalThis.window : (globalThis.window = source));
    }
  }),
  test('DragController: 已锁定宫格源图未就绪时拖出会回退到当前预览', () => {
    const value4 = globalThis.document,
      value5 = globalThis.window,
      draggedCellData3 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            storyboardSourceLocalPath: 'output/full-source.jpg',
            cells: [
              { id: 'cell-empty', isEmpty: true, url: '' },
              {
                id: 'cell-locked',
                capturePreviewUrl: 'data:image/jpeg;base64,locked-current',
                storyboardPiece: true,
                storyboardLockedCell: true,
                storyboardSourceIndex: 0,
                isEmpty: false,
              },
            ],
          },
        },
      };
    let value6 = null,
      value7 = null,
      value8 = null;
    try {
      (delete globalThis.document, delete globalThis.window);
      const store3 = {
          getStateRaw() {
            return draggedCellData3;
          },
          batch(handler3) {
            handler3();
          },
          addNode(value9) {
            value6 = value9;
          },
          setSelectedNodes(value10) {
            value8 = value10;
          },
          updateNodeData(nodeId3, patch3) {
            value7 = { nodeId: nodeId3, patch: patch3 };
          },
        },
        dragController3 = createDragController({
          store: store3,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value11) {
            return value11 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value12 = dragController3.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 1,
            draggedCellData: draggedCellData3.nodes['sb-1'].cells[1],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          500,
          500,
        );
      (assert.deepEqual(value12, { didAct: true, committed: true }),
        assert.equal(value6?.src, ''),
        assert.equal(value6?.capturePreviewUrl, 'data:image/jpeg;base64,locked-current'),
        assert.equal(value6?.localPath, ''),
        assert.equal(value6?.storyboardExtractedCell, true),
        assert.equal(value6?.storyboardSourceIndex, 0),
        assert.equal(value6?.storyboardSourceNodeId, 'sb-1'),
        assert.equal(value6?.storyboardSourceLocalPath, 'output/full-source.jpg'),
        assert.deepEqual(value8, ['source-image-generated']),
        assert.equal(value7?.nodeId, 'sb-1'),
        assert.equal(value7?.patch?.cells?.[1]?.isEmpty, true));
    } finally {
      if (value4 === undefined) delete globalThis.document;
      else globalThis.document = value4;
      if (value5 === undefined) delete globalThis.window;
      else globalThis.window = value5;
    }
  }),
  test('DragController: 宫格内交换后再拖出仍使用交换后的格子预览', () => {
    const value13 = globalThis.document,
      value14 = globalThis.window,
      draggedCellData4 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            storyboardSourceLocalPath: 'output/full-source.jpg',
            cells: [
              {
                id: 'cell-a',
                capturePreviewUrl: 'data:image/jpeg;base64,cell-a',
                storyboardPiece: true,
                storyboardLockedCell: true,
                storyboardSourceIndex: 0,
                isEmpty: false,
              },
              { id: 'cell-empty', isEmpty: true, url: '' },
            ],
          },
        },
      },
      list3 = [],
      list4 = [];
    try {
      (delete globalThis.document,
        (globalThis.window = {
          v2Renderer: {
            nodeInstances: new Map([
              [
                'sb-1',
                {
                  applyImmediateCellSwap() {
                    return { ok: false, revert() {} };
                  },
                  highlightCell() {},
                },
              ],
            ]),
            flushNodes() {
              return true;
            },
          },
        }));
      const store4 = {
          getStateRaw() {
            return draggedCellData4;
          },
          updateNodeData(nodeId4, patch4) {
            (list4.push({ nodeId: nodeId4, patch: patch4 }),
              (draggedCellData4.nodes[nodeId4] = { ...draggedCellData4.nodes[nodeId4], ...patch4 }));
          },
          batch(handler4) {
            handler4();
          },
          addNode(value15) {
            list3.push(value15);
          },
          setSelectedNodes() {},
        },
        dragController4 = createDragController({
          store: store4,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value16) {
            return value16 + '-generated-' + list3.length;
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value17 = dragController4.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData4.nodes['sb-1'].cells[0],
            ghostEl: { remove() {} },
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (assert.deepEqual(value17, { didAct: true, committed: true }),
        assert.equal(draggedCellData4.nodes['sb-1'].cells[1].id, 'cell-a'),
        assert.equal(
          draggedCellData4.nodes['sb-1'].cells[1].capturePreviewUrl,
          'data:image/jpeg;base64,cell-a',
        ));
      const value18 = dragController4.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 1,
          draggedCellData: draggedCellData4.nodes['sb-1'].cells[1],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        500,
        500,
      );
      (assert.deepEqual(value18, { didAct: true, committed: true }),
        assert.equal(list3.length, 1),
        assert.equal(list3[0].src, ''),
        assert.equal(list3[0].capturePreviewUrl, 'data:image/jpeg;base64,cell-a'),
        assert.equal(draggedCellData4.nodes['sb-1'].cells[1].isEmpty, true),
        assert.equal(list4.length, 2));
    } finally {
      if (value13 === undefined) delete globalThis.document;
      else globalThis.document = value13;
      if (value14 === undefined) delete globalThis.window;
      else globalThis.window = value14;
    }
  }),
  test('DragController: 拖出分镜时 ghost 预览按真实宫格区域裁切', () => {
    const value19 = globalThis.document,
      value20 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            isEditing: true,
            gridLayout: { columns: [1.5, 0.5], rows: [1] },
            cells: [
              {
                id: 'cell-1',
                sourceLocalPath: 'output/source.jpg',
                sourceUrl: '/output/source.jpg',
                isEmpty: false,
              },
              { id: 'cell-2', isEmpty: true },
            ],
          },
        },
      };
    let el = null,
      list5 = null;
    const value21 = {
        complete: true,
        naturalWidth: 400,
        naturalHeight: 800,
        currentSrc: '/output/source.jpg',
        src: '/output/source.jpg',
        classList: {
          contains(value22) {
            return value22 === 'storyboard-cell-img--source-crop';
          },
        },
        getAttribute(value23) {
          return value23 === 'src' ? '/output/source.jpg' : '';
        },
        cloneNode() {
          throw new Error('ghost should use real crop instead of cloning preview img');
        },
      },
      box3 = {
        width: 0,
        height: 0,
        style: {},
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: '',
            drawImage(...args2) {
              list5 = args2;
            },
          };
        },
        toDataURL() {
          return 'data:image/jpeg;base64,ghost-crop';
        },
      },
      createElement2 = (value24) => {
        if (value24 === 'canvas') return box3;
        return {
          tagName: String(value24).toUpperCase(),
          className: '',
          style: {},
          children: [],
          attrs: {},
          classList: {
            add() {},
            remove() {},
            contains() {
              return false;
            },
          },
          setAttribute(value25, value26) {
            this.attrs[value25] = value26;
            if (value25 === 'src') this.src = value26;
          },
          getAttribute(value27) {
            return this.attrs[value27] || '';
          },
          appendChild(value28) {
            return (this.children.push(value28), value28);
          },
          remove() {},
        };
      };
    try {
      globalThis.document = {
        body: {
          appendChild(value29) {
            return ((el = value29), value29);
          },
          classList: { add() {}, remove() {} },
        },
        getElementById(value30) {
          return (
            assert.equal(value30, 'cell-sb-1-0'),
            {
              querySelector(value31) {
                return (
                  assert.equal(
                    ['.storyboard-cell-img', 'img.storyboard-cell-img--source-crop'].includes(value31),
                    true,
                  ),
                  value21
                );
              },
            }
          );
        },
        createElement: createElement2,
      };
      const dragController5 = createDragController({
          store: {
            getStateRaw() {
              return value20;
            },
          },
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return 'sb-1';
          },
          screenToWorld: identityScreenToWorld,
          generateId(value32) {
            return value32 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value33 = { classList: { add() {}, remove() {} } },
        value34 = {},
        value35 = dragController5.tryStartNodeDrag(value34, 50, 50, 50, 50, false, {
          target: {
            closest(value36) {
              return value36 === '.sb-cell' ? value33 : null;
            },
          },
        });
      (assert.equal(value35, true),
        assert.equal(value34.ghostEl, el),
        assert.equal(el.style.width, '288px'),
        assert.equal(el.style.height, '823px'),
        assert.equal(el.style.transform, 'translate(50px, 50px) translate(-50%, -50%)'),
        assert.deepEqual(list5?.slice(1), [0, 0, 280, 800, 0, 0, 280, 800]),
        assert.equal(box3.width, 280),
        assert.equal(box3.height, 800),
        assert.equal(el.children[0].attrs.src, 'data:image/jpeg;base64,ghost-crop'),
        assert.equal(el.children[0].style.objectFit, 'contain'));
    } finally {
      value19 === undefined ? delete globalThis.document : (globalThis.document = value19);
    }
  }),
  test('DragController: 提取图片放回宫格使用已裁好的图，不再保留源图裁切上下文', () => {
    const value37 = globalThis.document,
      value38 = globalThis.window,
      value39 = globalThis.requestAnimationFrame,
      value40 = globalThis.setTimeout,
      args3 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['n1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: 'n1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: '/output/extracted.jpg',
            localPath: 'output/extracted.jpg',
            sourceLocalPath: 'output/full-source.jpg',
            sourceUrl: '/output/full-source.jpg',
            sourceWidth: 400,
            sourceHeight: 800,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            isEditing: true,
            cells: [
              {
                id: 'cell-empty',
                isEmpty: true,
                url: '',
                residualImageLocalPath: 'output/full-source.jpg',
                residualImageUrl: '/output/full-source.jpg',
                residualImageWidth: 400,
                residualImageHeight: 800,
                residualImageMode: 'source',
              },
              { id: 'cell-right', isEmpty: true, url: '' },
            ],
          },
        },
      },
      list6 = [];
    let value41 = null,
      value42 = null,
      value43 = null,
      value44 = 0;
    function createElement3(value45) {
      const value46 = {
        tagName: String(value45).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100,
        className: '',
        appendChild(value47) {
          return (this.children.push(value47), value47);
        },
        setAttribute(value48, value49) {
          this[value48] = String(value49);
        },
        getAttribute(value50) {
          return this[value50] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return (list6.push(value46), value46);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(value51) {
            if (value51 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: '/output/extracted.jpg',
                  src: '/output/extracted.jpg',
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(value52) {
              return (list6.push(value52), value52);
            },
          },
          createElement: createElement3,
          getElementById(value53) {
            if (value53 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 400,
                  getAttribute(value54) {
                    return value54 === 'src' ? '/output/extracted.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (handler5) => {
          return (handler5(), 1);
        }),
        (globalThis.setTimeout = (handler6) => {
          return (handler6(), 1);
        }));
      const store5 = {
          getStateRaw() {
            return args3;
          },
          updateNodeData(nodeId5, patch5) {
            ((value41 = { nodeId: nodeId5, patch: patch5 }),
              (args3.nodes[nodeId5] = { ...args3.nodes[nodeId5], ...patch5 }));
          },
          setSelectedNodes(args4) {
            ((value42 = args4), (args3.selectedNodeIds = [...args4]));
          },
          deleteNodes(value55) {
            value43 = value55;
          },
          moveNodes() {},
          batch(handler7) {
            handler7();
          },
          groupNodes() {},
        },
        dragController6 = createDragController({
          store: store5,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value56) {
            return value56 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value44 += 1;
          },
        }),
        value57 = dragController6.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(value57, { earlyCommit: true, didAct: true }),
        assert.equal(value41?.nodeId, 'sb-1'),
        assert.deepEqual(value41?.patch?.cells?.[0], {
          id: 'cell-generated',
          url: '',
          localPath: 'output/extracted.jpg',
          originalLocalPath: null,
          displayLocalPath: '',
          thumbUrl: '',
          thumbLocalPath: null,
          thumbId: null,
          capturePreviewUrl: '',
          fileName: '',
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          sourceId: null,
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 0,
          residualImageLocalPath: 'output/full-source.jpg',
          residualImageUrl: '/output/full-source.jpg',
          residualImageWidth: 400,
          residualImageHeight: 800,
          residualImageMode: 'source',
          sourceLocalPath: null,
          sourceUrl: '',
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 0,
          row: 0,
        }),
        assert.deepEqual(value42, []),
        assert.deepEqual(value43, ['n1']),
        assert.equal(value44, 1));
    } finally {
      if (value37 === undefined) delete globalThis.document;
      else globalThis.document = value37;
      if (value38 === undefined) delete globalThis.window;
      else globalThis.window = value38;
      if (value39 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value39;
      if (value40 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = value40;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 图片放回宫格后立刻刷新并清理拖拽残影', () => {
    const value58 = globalThis.document,
      value59 = globalThis.window,
      value60 = globalThis.requestAnimationFrame,
      value61 = globalThis.setTimeout,
      args5 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['n1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: 'n1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: '/output/extracted.jpg',
            localPath: 'output/extracted.jpg',
            storyboardExtractedCell: true,
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            isEditing: true,
            cells: [
              { id: 'cell-empty', isEmpty: true, url: '' },
              { id: 'cell-right', isEmpty: true, url: '' },
            ],
          },
        },
      },
      list7 = [],
      list8 = [];
    let el2 = null,
      value62 = null,
      value63 = null,
      value64 = null,
      value65 = null,
      value66 = 0,
      value67 = 0;
    function createElement4(value68) {
      const value69 = {
        tagName: String(value68).toUpperCase(),
        style: {},
        children: [],
        className: '',
        complete: true,
        naturalWidth: 120,
        naturalHeight: 240,
        appendChild(value70) {
          return (this.children.push(value70), value70);
        },
        setAttribute(value71, value72) {
          this[value71] = String(value72);
        },
        getAttribute(value73) {
          return this[value73] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {
          this.removed = true;
        },
      };
      return value69;
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(value74) {
            if (value74 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: '/output/extracted.jpg',
                  src: '/output/extracted.jpg',
                };
              },
            };
          },
          flushNodes(value75) {
            return ((value65 = value75), true);
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(value76) {
              return (value76.className === 'v2-ghost-image' && (el2 = value76), value76);
            },
          },
          createElement: createElement4,
          getElementById() {
            value67 += 1;
            throw new Error('storyboard drop ghost should not wait for cell image');
          },
        }),
        (globalThis.requestAnimationFrame = (value77) => {
          return (list7.push(value77), list7.length);
        }),
        (globalThis.setTimeout = (callback, delay = 0) => {
          return (list8.push({ callback: callback, delay: delay }), list8.length);
        }));
      const store6 = {
          getStateRaw() {
            return args5;
          },
          updateNodeData(nodeId6, patch6) {
            ((value62 = { nodeId: nodeId6, patch: patch6 }),
              (args5.nodes[nodeId6] = { ...args5.nodes[nodeId6], ...patch6 }));
          },
          setSelectedNodes(args6) {
            ((value63 = args6), (args5.selectedNodeIds = [...args6]));
          },
          deleteNodes(value78) {
            value64 = value78;
            for (const value79 of value78) {
              delete args5.nodes[value79];
            }
          },
          moveNodes() {},
          batch(handler8) {
            handler8();
          },
          groupNodes() {},
        },
        dragController7 = createDragController({
          store: store6,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value80) {
            return value80 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value66 += 1;
          },
        }),
        value81 = dragController7.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(value81, { earlyCommit: true, didAct: true }),
        assert.equal(value62?.nodeId, 'sb-1'),
        assert.deepEqual(value65, ['sb-1']),
        assert.deepEqual(value63, []),
        assert.deepEqual(value64, ['n1']),
        assert.equal(args5.nodes.n1, undefined),
        assert.equal(value67, 0),
        assert.ok(el2),
        assert.equal(el2.removed, undefined),
        assert.equal(el2.style.opacity, '0'),
        assert.match(el2.style.transition, /opacity 0s/),
        assert.equal(list8.length, 1),
        assert.equal(list8[0].delay, 0),
        list8.shift().callback(),
        assert.equal(el2.removed, true),
        assert.equal(value66, 0),
        assert.equal(list7.length, 2));
      while (list7.length) {
        list7.shift()();
      }
      (assert.equal(value67, 0),
        assert.equal(list8.length, 1),
        assert.equal(list8[0].delay, 0),
        list8.shift().callback(),
        assert.equal(value66, 1));
    } finally {
      if (value58 === undefined) delete globalThis.document;
      else globalThis.document = value58;
      if (value59 === undefined) delete globalThis.window;
      else globalThis.window = value59;
      if (value60 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value60;
      if (value61 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = value61;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: source-only image drop into storyboard does not write source fallback', () => {
    const value82 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: ['n1'],
      edges: {},
      ui: { snapGuidesEnabled: false },
      _parentToChildren: {},
      nodes: {
        n1: {
          id: 'n1',
          type: 'source-image',
          x: 0,
          y: 0,
          width: 120,
          height: 240,
          src: '',
          localPath: null,
          sourceLocalPath: 'output/full-source.jpg',
          sourceUrl: '/output/full-source.jpg',
          storyboardSourceCrop: true,
          storyboardExtractedCell: true,
        },
        'sb-1': {
          id: 'sb-1',
          type: 'storyboard',
          x: 100,
          y: 0,
          width: 100,
          height: 100,
          cols: 1,
          rows: 1,
          isEditing: true,
          cells: [{ id: 'cell-empty', isEmpty: true, url: '' }],
        },
      },
    };
    let value83 = false,
      value84 = false,
      value85 = false,
      value86 = false;
    const store7 = {
        getStateRaw() {
          return value82;
        },
        updateNodeData() {
          value83 = true;
        },
        setSelectedNodes() {
          value85 = true;
        },
        deleteNodes() {
          value84 = true;
        },
        moveNodes() {},
        batch(handler9) {
          handler9();
        },
        groupNodes() {},
      },
      dragController8 = createDragController({
        store: store7,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(value87) {
          return value87 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {
          value86 = true;
        },
      }),
      value88 = dragController8.finishDraggingNodes(createNodeDragContext(), 125, 50);
    (assert.deepEqual(value88, { earlyCommit: false, didAct: false }),
      assert.equal(value83, false),
      assert.equal(value84, false),
      assert.equal(value85, false),
      assert.equal(value86, false));
  }),
  test('DragController: 放入宫格时使用拖拽节点当前可见图，不用源图兜底', () => {
    const value89 = globalThis.document,
      value90 = globalThis.window,
      value91 = globalThis.requestAnimationFrame,
      value92 = globalThis.setTimeout,
      args7 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['n1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: 'n1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: '',
            localPath: null,
            sourceLocalPath: 'output/full-source.jpg',
            sourceUrl: '/output/full-source.jpg',
            sourceWidth: 400,
            sourceHeight: 800,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
            storyboardSourceIndex: 2,
            storyboardSourceNodeId: 'sb-old',
            storyboardSourceLocalPath: 'output/full-source.jpg',
            storyboardSourceUrl: '',
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            isEditing: true,
            cells: [{ id: 'cell-empty', isEmpty: true, url: '' }],
          },
        },
      };
    let value93 = null,
      value94 = null,
      value95 = null,
      value96 = 0;
    function createElement5(value97) {
      const value98 = {
        tagName: String(value97).toUpperCase(),
        style: {},
        children: [],
        className: '',
        appendChild(value99) {
          return (this.children.push(value99), value99);
        },
        setAttribute(value100, value101) {
          this[value100] = String(value101);
        },
        getAttribute(value102) {
          return this[value102] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return value98;
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(value103) {
            if (value103 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: '/output/current-visible.jpg',
                  src: '/output/current-visible.jpg',
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(value104) {
              return value104;
            },
          },
          createElement: createElement5,
          getElementById(value105) {
            if (value105 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  getAttribute(value106) {
                    return value106 === 'src' ? '/output/current-visible.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (handler10) => {
          return (handler10(), 1);
        }),
        (globalThis.setTimeout = (handler11) => {
          return (handler11(), 1);
        }));
      const store8 = {
          getStateRaw() {
            return args7;
          },
          updateNodeData(nodeId7, patch7) {
            ((value93 = { nodeId: nodeId7, patch: patch7 }),
              (args7.nodes[nodeId7] = { ...args7.nodes[nodeId7], ...patch7 }));
          },
          setSelectedNodes(args8) {
            ((value94 = args8), (args7.selectedNodeIds = [...args8]));
          },
          deleteNodes(value107) {
            value95 = value107;
          },
          moveNodes() {},
          batch(handler12) {
            handler12();
          },
          groupNodes() {},
        },
        dragController9 = createDragController({
          store: store8,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value108) {
            return value108 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value96 += 1;
          },
        }),
        value109 = dragController9.finishDraggingNodes(createNodeDragContext(), 125, 50);
      assert.deepEqual(value109, { earlyCommit: true, didAct: true });
      const value110 = value93?.patch?.cells?.[0];
      (assert.equal(value93?.nodeId, 'sb-1'),
        assert.equal(value110?.localPath, 'output/current-visible.jpg'),
        assert.equal(value110?.sourceLocalPath, null),
        assert.equal(value110?.sourceUrl, ''),
        assert.equal(value110?.storyboardSourceCrop, false),
        assert.equal(value110?.storyboardPiece, false),
        assert.equal(value110?.storyboardSourceIndex, 2),
        assert.equal(value110?.storyboardExtractedCell, true),
        assert.deepEqual(value94, []),
        assert.deepEqual(value95, ['n1']),
        assert.equal(value96, 1));
    } finally {
      if (value89 === undefined) delete globalThis.document;
      else globalThis.document = value89;
      if (value90 === undefined) delete globalThis.window;
      else globalThis.window = value90;
      if (value91 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value91;
      if (value92 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = value92;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 临时预览格拖出会落盘回填图片节点', async () => {
    const capturePreviewUrl = 'data:image/png,storyboard-preview',
      draggedCellData5 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: [],
        edges: {},
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            cells: [
              {
                id: 'cell-preview',
                capturePreviewUrl: capturePreviewUrl,
                imageWidth: 80,
                imageHeight: 40,
                isEmpty: false,
              },
            ],
          },
        },
      },
      list9 = [];
    let value111 = null,
      value112 = 0;
    const store9 = {
        getStateRaw() {
          return draggedCellData5;
        },
        batch(handler13) {
          handler13();
        },
        addNode(value113) {
          ((value111 = value113), (draggedCellData5.nodes[value113.id] = value113));
        },
        setSelectedNodes(value114) {
          draggedCellData5.selectedNodeIds = value114;
        },
        updateNodeData(nodeId8, patch8) {
          (list9.push({ nodeId: nodeId8, patch: patch8 }),
            (draggedCellData5.nodes[nodeId8] = { ...draggedCellData5.nodes[nodeId8], ...patch8 }));
        },
      },
      dragController10 = createDragController({
        store: store9,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(value115) {
          return value115 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
        async saveOutputBlobImpl() {
          return (
            (value112 += 1),
            {
              localPath: 'output/persisted-preview.png',
              url: '/output/persisted-preview.png',
              originalWidth: 80,
              originalHeight: 40,
              filename: 'persisted-preview.png',
            }
          );
        },
      }),
      value116 = dragController10.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: draggedCellData5.nodes['sb-1'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        300,
        50,
      );
    (await flushAsyncWork(),
      assert.deepEqual(value116, { didAct: true, committed: true }),
      assert.equal(value111?.id, 'source-image-generated'),
      assert.equal(value111?.src, ''),
      assert.equal(value111?.capturePreviewUrl, capturePreviewUrl),
      assert.equal(value112, 1),
      assert.equal(draggedCellData5.nodes['source-image-generated'].src, '/output/persisted-preview.png'),
      assert.equal(
        draggedCellData5.nodes['source-image-generated'].localPath,
        'output/persisted-preview.png',
      ),
      assert.equal(draggedCellData5.nodes['source-image-generated'].capturePreviewUrl, ''),
      assert.equal(draggedCellData5.nodes['source-image-generated'].imageWidth, 80),
      assert.equal(draggedCellData5.nodes['sb-1'].cells[0].isEmpty, true),
      assert.equal(
        list9.some((item2) => item2.nodeId === 'source-image-generated'),
        true,
      ));
  }),
  test('DragController: 临时预览图放回宫格会落盘回填 cell', async () => {
    const value117 = globalThis.document,
      value118 = globalThis.window,
      value119 = globalThis.requestAnimationFrame,
      value120 = globalThis.setTimeout,
      capturePreviewUrl2 = 'data:image/png,returned-preview',
      args9 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['n1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: 'n1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 60,
            src: '',
            localPath: null,
            capturePreviewUrl: capturePreviewUrl2,
            imageWidth: 80,
            imageHeight: 40,
            storyboardExtractedCell: true,
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            isEditing: true,
            cells: [{ id: 'cell-empty', isEmpty: true, url: '' }],
          },
        },
      };
    let value121 = 0;
    function createElement6(value122) {
      return {
        tagName: String(value122).toUpperCase(),
        style: {},
        children: [],
        className: '',
        appendChild(value123) {
          return (this.children.push(value123), value123);
        },
        setAttribute(value124, value125) {
          this[value124] = String(value125);
        },
        getAttribute(value126) {
          return this[value126] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(value127) {
            if (value127 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 80,
                  naturalHeight: 40,
                  currentSrc: capturePreviewUrl2,
                  src: capturePreviewUrl2,
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(value128) {
              return value128;
            },
          },
          createElement: createElement6,
          getElementById(value129) {
            if (value129 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 80,
                  getAttribute(value130) {
                    return value130 === 'src' ? capturePreviewUrl2 : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (handler14) => {
          return (handler14(), 1);
        }),
        (globalThis.setTimeout = (handler15) => {
          return (handler15(), 1);
        }));
      const store10 = {
          getStateRaw() {
            return args9;
          },
          updateNodeData(value131, args10) {
            args9.nodes[value131] = { ...args9.nodes[value131], ...args10 };
          },
          setSelectedNodes(args11) {
            args9.selectedNodeIds = [...args11];
          },
          deleteNodes(value132) {
            for (const value133 of value132) delete args9.nodes[value133];
          },
          moveNodes() {},
          batch(handler16) {
            handler16();
          },
          groupNodes() {},
        },
        dragController11 = createDragController({
          store: store10,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value134) {
            return value134 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
          async saveOutputBlobImpl() {
            return (
              (value121 += 1),
              {
                localPath: 'output/returned-preview.png',
                url: '/output/returned-preview.png',
                originalWidth: 80,
                originalHeight: 40,
                filename: 'returned-preview.png',
              }
            );
          },
        }),
        value135 = dragController11.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (await flushAsyncWork(),
        assert.deepEqual(value135, { earlyCommit: true, didAct: true }),
        assert.equal(value121, 1));
      const value136 = args9.nodes['sb-1'].cells[0];
      (assert.equal(value136.localPath, 'output/returned-preview.png'),
        assert.equal(value136.capturePreviewUrl, ''),
        assert.equal(value136.sourceLocalPath, null),
        assert.equal(value136.sourceUrl, ''),
        assert.equal(value136.storyboardSourceCrop, false),
        assert.equal(value136.storyboardPiece, false),
        assert.equal(value136.imageWidth, 80));
    } finally {
      if (value117 === undefined) delete globalThis.document;
      else globalThis.document = value117;
      if (value118 === undefined) delete globalThis.window;
      else globalThis.window = value118;
      if (value119 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value119;
      if (value120 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = value120;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 提取图片放回自定义槽位使用当前线位命中', () => {
    const value137 = globalThis.document,
      value138 = globalThis.window,
      value139 = globalThis.requestAnimationFrame,
      value140 = globalThis.setTimeout,
      args12 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['n1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: 'n1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 65,
            height: 140,
            src: '/output/extracted-custom.jpg',
            localPath: 'output/extracted-custom.jpg',
            sourceLocalPath: 'output/full-source.jpg',
            sourceUrl: '/output/full-source.jpg',
            sourceWidth: 300,
            sourceHeight: 200,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            isEditing: true,
            cells: [
              { id: 'cell-0', localPath: 'output/a.png', isEmpty: false },
              { id: 'cell-1', localPath: 'output/b.png', isEmpty: false },
              { id: 'cell-2', localPath: 'output/c.png', isEmpty: false },
              {
                id: 'cell-empty',
                isEmpty: true,
                url: '',
                residualImageLocalPath: 'output/full-source.jpg',
                residualImageUrl: '/output/full-source.jpg',
                residualImageWidth: 300,
                residualImageHeight: 200,
                residualImageMode: 'source',
              },
            ],
          },
        },
      },
      list10 = [];
    let value141 = null,
      value142 = null,
      value143 = null,
      value144 = 0;
    function createElement7(value145) {
      const value146 = {
        tagName: String(value145).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: '',
        appendChild(value147) {
          return (this.children.push(value147), value147);
        },
        setAttribute(value148, value149) {
          this[value148] = String(value149);
        },
        getAttribute(value150) {
          return this[value150] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return (list10.push(value146), value146);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(value151) {
            if (value151 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 65,
                  naturalHeight: 140,
                  currentSrc: '/output/extracted-custom.jpg',
                  src: '/output/extracted-custom.jpg',
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(value152) {
              return (list10.push(value152), value152);
            },
          },
          createElement: createElement7,
          getElementById(value153) {
            if (value153 !== 'cell-sb-1-3') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 65,
                  getAttribute(value154) {
                    return value154 === 'src' ? '/output/extracted-custom.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (handler17) => {
          return (handler17(), 1);
        }),
        (globalThis.setTimeout = (handler18) => {
          return (handler18(), 1);
        }));
      const store11 = {
          getStateRaw() {
            return args12;
          },
          updateNodeData(nodeId9, patch9) {
            ((value141 = { nodeId: nodeId9, patch: patch9 }),
              (args12.nodes[nodeId9] = { ...args12.nodes[nodeId9], ...patch9 }));
          },
          setSelectedNodes(args13) {
            ((value142 = args13), (args12.selectedNodeIds = [...args13]));
          },
          deleteNodes(value155) {
            value143 = value155;
          },
          moveNodes() {},
          batch(handler19) {
            handler19();
          },
          groupNodes() {},
        },
        dragController12 = createDragController({
          store: store11,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value156) {
            return value156 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value144 += 1;
          },
        }),
        value157 = dragController12.finishDraggingNodes(createNodeDragContext(), 350, 80);
      (assert.deepEqual(value157, { earlyCommit: true, didAct: true }),
        assert.equal(value141?.nodeId, 'sb-1'),
        assert.equal(value141?.patch?.cells?.[1]?.id, 'cell-1'),
        assert.deepEqual(value141?.patch?.cells?.[3], {
          id: 'cell-generated',
          url: '',
          localPath: 'output/extracted-custom.jpg',
          originalLocalPath: null,
          displayLocalPath: '',
          thumbUrl: '',
          thumbLocalPath: null,
          thumbId: null,
          capturePreviewUrl: '',
          fileName: '',
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          sourceId: null,
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 0,
          residualImageLocalPath: 'output/full-source.jpg',
          residualImageUrl: '/output/full-source.jpg',
          residualImageWidth: 300,
          residualImageHeight: 200,
          residualImageMode: 'source',
          sourceLocalPath: null,
          sourceUrl: '',
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 1,
          row: 1,
        }),
        assert.deepEqual(value142, []),
        assert.deepEqual(value143, ['n1']),
        assert.equal(value144, 1));
    } finally {
      if (value137 === undefined) delete globalThis.document;
      else globalThis.document = value137;
      if (value138 === undefined) delete globalThis.window;
      else globalThis.window = value138;
      if (value139 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value139;
      if (value140 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = value140;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 临时裁切图未落盘时放回宫格保留当前裁切预览', () => {
    const value158 = globalThis.document,
      value159 = globalThis.window,
      value160 = globalThis.requestAnimationFrame,
      value161 = globalThis.setTimeout,
      src = 'data:image/jpeg;base64/current-crop',
      args14 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['n1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: 'n1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: src,
            localPath: '',
            capturePreviewUrl: src,
            sourceLocalPath: 'output/full-source.jpg',
            sourceUrl: '/output/full-source.jpg',
            sourceWidth: 400,
            sourceHeight: 800,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            isEditing: true,
            cells: [
              { id: 'cell-empty', isEmpty: true, url: '' },
              { id: 'cell-right', isEmpty: true, url: '' },
            ],
          },
        },
      },
      list11 = [];
    let value162 = null,
      value163 = null;
    function createElement8(value164) {
      const value165 = {
        tagName: String(value164).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: '',
        appendChild(value166) {
          return (this.children.push(value166), value166);
        },
        setAttribute(value167, value168) {
          this[value167] = String(value168);
        },
        getAttribute(value169) {
          return this[value169] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return (list11.push(value165), value165);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(value170) {
            if (value170 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: src,
                  src: src,
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(value171) {
              return (list11.push(value171), value171);
            },
          },
          createElement: createElement8,
          getElementById(value172) {
            if (value172 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  getAttribute(value173) {
                    return value173 === 'src' ? src : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (handler20) => {
          return (handler20(), 1);
        }),
        (globalThis.setTimeout = (handler21) => {
          return (handler21(), 1);
        }));
      const store12 = {
          getStateRaw() {
            return args14;
          },
          updateNodeData(nodeId10, patch10) {
            ((value162 = { nodeId: nodeId10, patch: patch10 }),
              (args14.nodes[nodeId10] = { ...args14.nodes[nodeId10], ...patch10 }));
          },
          setSelectedNodes(args15) {
            args14.selectedNodeIds = [...args15];
          },
          deleteNodes(value174) {
            value163 = value174;
          },
          moveNodes() {},
          batch(handler22) {
            handler22();
          },
          groupNodes() {},
        },
        dragController13 = createDragController({
          store: store12,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value175) {
            return value175 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value176 = dragController13.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(value176, { earlyCommit: true, didAct: true }),
        assert.equal(value162?.nodeId, 'sb-1'),
        assert.deepEqual(value162?.patch?.cells?.[0], {
          id: 'cell-generated',
          url: '',
          localPath: null,
          originalLocalPath: null,
          displayLocalPath: '',
          capturePreviewUrl: src,
          fileName: '',
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 0,
          thumbUrl: '',
          thumbLocalPath: null,
          thumbId: null,
          sourceId: null,
          sourceLocalPath: null,
          sourceUrl: '',
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 0,
          row: 0,
        }),
        assert.deepEqual(value163, ['n1']));
    } finally {
      if (value158 === undefined) delete globalThis.document;
      else globalThis.document = value158;
      if (value159 === undefined) delete globalThis.window;
      else globalThis.window = value159;
      if (value160 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value160;
      if (value161 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = value161;
      delete globalThis.v2Renderer;
    }
  }));
function createClassList() {
  const map = new Set();
  return {
    add(...list12) {
      list12.forEach((item3) => map.add(String(item3)));
    },
    remove(...list13) {
      list13.forEach((item4) => map.delete(String(item4)));
    },
    toggle(value177, value178) {
      if (value178 === true) return (map.add(String(value177)), true);
      if (value178 === false) return (map.delete(String(value177)), false);
      if (map.has(String(value177))) return (map.delete(String(value177)), false);
      return (map.add(String(value177)), true);
    },
    contains(value179) {
      return map.has(String(value179));
    },
  };
}
function createPathRecorder(list14, id, kind) {
  return {
    setAttribute(name, value180) {
      list14.push({ id: id, kind: kind, name: name, value: value180 });
    },
  };
}
function createAttrRecorder() {
  const map2 = new Map();
  return {
    setAttribute(value181, value182) {
      map2.set(value181, value182);
    },
    getAttribute(value183) {
      return map2.has(value183) ? map2.get(value183) : null;
    },
    removeAttribute(value184) {
      map2.delete(value184);
    },
  };
}
test('DragController: 多选拖拽从全景、注释、宫格节点发起时保留整组选区', () => {
  const value185 = globalThis.window,
    value186 = globalThis.document,
    value187 = [
      { nodeId: 'scene-1', type: 'panorama-scene' },
      { nodeId: 'pano-1', type: 'panorama-360' },
      { nodeId: 'comment-1', type: 'comment-note' },
      { nodeId: 'storyboard-1', type: 'storyboard' },
    ];
  try {
    ((globalThis.document = {
      body: { classList: createClassList() },
      getElementById() {
        return null;
      },
    }),
      (globalThis.window = {
        v2Renderer: {
          getMountedWrapper() {
            return null;
          },
        },
        _clearSnapGuideLines() {},
      }));
    for (const id2 of value187) {
      const selectedNodeIds = ['source-1', id2.nodeId, 'ai-1'],
        value188 = {
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: {
            'source-1': { id: 'source-1', type: 'source-image', x: 0, y: 0, width: 100, height: 100 },
            [id2.nodeId]: {
              id: id2.nodeId,
              type: id2.type,
              x: 200,
              y: 0,
              width: 120,
              height: 90,
            },
            'ai-1': { id: 'ai-1', type: 'ai-text', x: 400, y: 0, width: 100, height: 100 },
          },
          edges: {},
          selectedNodeIds: selectedNodeIds,
          ui: { snapGuidesEnabled: false },
          _parentToChildren: {},
        },
        list15 = [],
        list16 = [],
        store13 = {
          getStateRaw() {
            return value188;
          },
          setSelectedNodes(args16) {
            (list15.push([...args16]), (value188.selectedNodeIds = [...args16]));
          },
          moveNodes(args17, dx, dy) {
            list16.push({ ids: [...args17], dx: dx, dy: dy });
          },
          updateNodePosition() {
            throw new Error('multi-selected drag should move the selected set');
          },
          batch(handler23) {
            handler23();
          },
          groupNodes() {},
        },
        dragController14 = createDragController({
          store: store13,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return id2.nodeId;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value189) {
            return value189 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value190 = { isDragging: false, pendingDx: 0, pendingDy: 0, hasMoved: false };
      (assert.equal(dragController14.tryStartNodeDrag(value190, 200, 0, 200, 0, false, {}), true),
        assert.deepEqual(list15, []),
        dragController14.updateDraggingNodes(value190, 215, 12, 215, 12, 215, 12, value188));
      const value191 = dragController14.finishDraggingNodes(value190, 215, 12);
      (assert.deepEqual(value191, { earlyCommit: false, didAct: true }),
        assert.deepEqual(list16, [{ ids: selectedNodeIds, dx: 15, dy: 12 }]),
        assert.deepEqual(value188.selectedNodeIds, selectedNodeIds));
    }
  } finally {
    if (typeof value185 === 'undefined') delete globalThis.window;
    else globalThis.window = value185;
    if (typeof value186 === 'undefined') delete globalThis.document;
    else globalThis.document = value186;
  }
});
function createDragEdgeState({ zoom: zoom = 0.3, edgeCount: edgeCount = 6 } = {}) {
  const nodes = { n1: { id: 'n1', type: 'ai-image', x: 0, y: 0, width: 260, height: 100 } },
    edges = {};
  for (let y2 = 1; y2 <= edgeCount; y2 += 1) {
    const id3 = 'n' + (y2 + 1);
    ((nodes[id3] = {
      id: id3,
      type: 'ai-text',
      x: 500 + y2 * 20,
      y: y2 * 120,
      width: 260,
      height: 100,
    }),
      (edges['e' + y2] = { id: 'e' + y2, sourceId: 'n1', targetId: id3 }));
  }
  return {
    viewport: { x: 0, y: 0, zoom: zoom },
    nodes: nodes,
    edges: edges,
    selectedNodeIds: ['n1'],
    ui: { snapGuidesEnabled: false },
    _parentToChildren: {},
  };
}
function createDragEdgeHarness(value192) {
  const value193 = globalThis.window,
    value194 = globalThis.document,
    value195 = globalThis.requestAnimationFrame,
    value196 = globalThis.cancelAnimationFrame,
    value197 = globalThis.innerWidth,
    value198 = globalThis.innerHeight,
    records = [],
    wrappers = new Map();
  Object.keys(value192.nodes).forEach((item5) => {
    wrappers.set(item5, { style: {}, classList: createClassList(), isConnected: true });
  });
  const edgeDomCache = new Map();
  Object.keys(value192.edges).forEach((item6) => {
    edgeDomCache.set(item6, {
      groupEl: createAttrRecorder(),
      hoverPath: createPathRecorder(records, item6, 'hover'),
      pathEl: createPathRecorder(records, item6, 'main'),
    });
  });
  const list17 = [];
  let id4 = 0;
  return (
    (globalThis.window = globalThis),
    (globalThis.innerWidth = 1600),
    (globalThis.innerHeight = 1200),
    (globalThis.document = {
      body: { classList: createClassList() },
      getElementById() {
        return null;
      },
    }),
    (globalThis.requestAnimationFrame = (callback2) => {
      return ((id4 += 1), list17.push({ id: id4, callback: callback2, canceled: false }), id4);
    }),
    (globalThis.cancelAnimationFrame = (value199) => {
      const value200 = list17.find((item7) => item7.id === value199);
      if (value200) value200.canceled = true;
    }),
    (globalThis.v2Renderer = {
      getMountedWrapper(value201) {
        return wrappers.get(value201) || null;
      },
      getEdgeIdsForNode(value202) {
        return Object.values(value192.edges)
          .filter((item8) => item8.sourceId === value202 || item8.targetId === value202)
          .map((item9) => item9.id);
      },
    }),
    (globalThis._edgeDomCache = edgeDomCache),
    (globalThis._v2MinimapDotMap = new Map()),
    (globalThis._v2MinimapScale = 0),
    (globalThis._clearSnapGuideLines = () => {}),
    {
      records: records,
      wrappers: wrappers,
      edgeDomCache: edgeDomCache,
      pendingRafCount() {
        return list17.filter((enabled2) => !enabled2.canceled).length;
      },
      runRaf() {
        const list18 = list17.splice(0);
        list18.forEach((enabled3) => {
          if (!enabled3.canceled) enabled3.callback();
        });
      },
      restore() {
        if (typeof value193 === 'undefined') delete globalThis.window;
        else globalThis.window = value193;
        if (typeof value194 === 'undefined') delete globalThis.document;
        else globalThis.document = value194;
        typeof value195 === 'undefined'
          ? delete globalThis.requestAnimationFrame
          : (globalThis.requestAnimationFrame = value195);
        typeof value196 === 'undefined'
          ? delete globalThis.cancelAnimationFrame
          : (globalThis.cancelAnimationFrame = value196);
        if (typeof value197 === 'undefined') delete globalThis.innerWidth;
        else globalThis.innerWidth = value197;
        if (typeof value198 === 'undefined') delete globalThis.innerHeight;
        else globalThis.innerHeight = value198;
        (delete globalThis.v2Renderer,
          delete globalThis._edgeDomCache,
          delete globalThis._v2MinimapDotMap,
          delete globalThis._v2MinimapScale,
          delete globalThis._clearSnapGuideLines);
      },
    }
  );
}
function createNodeDragController(value203) {
  const store14 = {
    getStateRaw() {
      return value203;
    },
    updateNodePosition(value204, value205, value206) {
      ((value203.nodes[value204].x += value205), (value203.nodes[value204].y += value206));
    },
    moveNodes(list19, value207, value208) {
      list19.forEach((item10) => {
        ((value203.nodes[item10].x += value207), (value203.nodes[item10].y += value208));
      });
    },
    batch(handler24) {
      handler24();
    },
    groupNodes() {},
  };
  return createDragController({
    store: store14,
    isNodeType: isNodeType,
    getShortcuts() {
      return {};
    },
    hitTestNode() {
      return null;
    },
    screenToWorld: identityScreenToWorld,
    generateId(value209) {
      return value209 + '-generated';
    },
    cloneNodesWithEdges() {
      return {};
    },
    commit() {},
  });
}
function createNodeDragContext() {
  return {
    dragSource: 'node',
    targetNodeId: 'n1',
    lastWorldX: 0,
    lastWorldY: 0,
    pendingDx: 0,
    pendingDy: 0,
    hasMoved: false,
    wasSelectedOnDown: true,
    titleDragActivated: false,
  };
}
async function flushAsyncWork(value210 = 8) {
  for (let value211 = 0; value211 < value210; value211 += 1) {
    await Promise.resolve();
  }
}
(test('DragController: grid snap aligns the dragged node origin to the canvas grid', () => {
  const value212 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: { n1: { id: 'n1', type: 'ai-image', x: 13, y: 17, width: 100, height: 80 } },
      edges: {},
      selectedNodeIds: ['n1'],
      ui: { snapGuidesEnabled: false },
      _parentToChildren: {},
    },
    ctx = createDragEdgeHarness(value212),
    value213 = globalThis.v2SnapToGrid;
  try {
    globalThis.v2SnapToGrid = true;
    const nodeDragController = createNodeDragController(value212),
      nodeDragContext = createNodeDragContext();
    (nodeDragController.updateDraggingNodes(nodeDragContext, 21, 22, 21, 22, 21, 22, value212),
      assert.equal(nodeDragContext.pendingDx, 27),
      assert.equal(nodeDragContext.pendingDy, 23),
      assert.equal(ctx.wrappers.get('n1').style.transform, 'translate(40px, 40px)'));
    const value214 = nodeDragController.finishDraggingNodes(nodeDragContext, 21, 22);
    (assert.deepEqual(value214, { earlyCommit: false, didAct: true }),
      assert.equal(value212.nodes.n1.x, 40),
      assert.equal(value212.nodes.n1.y, 40));
  } finally {
    if (typeof value213 === 'undefined') delete globalThis.v2SnapToGrid;
    else globalThis.v2SnapToGrid = value213;
    ctx.restore();
  }
}),
  test('DragController: grid snap aligns the multi-select bounds to the canvas grid', () => {
    const value215 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          n1: { id: 'n1', type: 'ai-image', x: 13, y: 17, width: 100, height: 80 },
          n2: { id: 'n2', type: 'ai-text', x: 55, y: 70, width: 100, height: 80 },
        },
        edges: {},
        selectedNodeIds: ['n1', 'n2'],
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
      },
      ctx2 = createDragEdgeHarness(value215),
      value216 = globalThis.v2SnapToGrid;
    try {
      globalThis.v2SnapToGrid = true;
      const nodeDragController2 = createNodeDragController(value215),
        nodeDragContext2 = createNodeDragContext();
      (nodeDragController2.updateDraggingNodes(nodeDragContext2, 21, 22, 21, 22, 21, 22, value215),
        assert.equal(nodeDragContext2.pendingDx, 27),
        assert.equal(nodeDragContext2.pendingDy, 23),
        assert.equal(ctx2.wrappers.get('n1').style.transform, 'translate(40px, 40px)'),
        assert.equal(ctx2.wrappers.get('n2').style.transform, 'translate(82px, 93px)'));
      const value217 = nodeDragController2.finishDraggingNodes(nodeDragContext2, 21, 22);
      (assert.deepEqual(value217, { earlyCommit: false, didAct: true }),
        assert.equal(value215.nodes.n1.x, 40),
        assert.equal(value215.nodes.n1.y, 40),
        assert.equal(value215.nodes.n2.x, 82),
        assert.equal(value215.nodes.n2.y, 93));
    } finally {
      if (typeof value216 === 'undefined') delete globalThis.v2SnapToGrid;
      else globalThis.v2SnapToGrid = value216;
      ctx2.restore();
    }
  }),
  test('DragController: 目标缩放区间内 3 条叠线拖拽会合并连线重绘到 RAF', () => {
    const dragEdgeState = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      ctx3 = createDragEdgeHarness(dragEdgeState);
    try {
      const nodeDragController3 = createNodeDragController(dragEdgeState),
        nodeDragContext3 = createNodeDragContext();
      (nodeDragController3.updateDraggingNodes(nodeDragContext3, 10, 0, 10, 0, 10, 0, dragEdgeState),
        nodeDragController3.updateDraggingNodes(nodeDragContext3, 20, 0, 20, 0, 20, 0, dragEdgeState),
        assert.equal(ctx3.records.length, 0),
        assert.equal(ctx3.pendingRafCount(), 1),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), true),
        ctx3.runRaf(),
        assert.equal(ctx3.records.length, 3),
        assert.equal(
          ctx3.records.every((item11) => item11.kind === 'main'),
          true,
        ),
        assert.match(ctx3.records[0].value, /^M 280 50 C /));
    } finally {
      ctx3.restore();
    }
  }),
  test('DragController: dense canvas skips live snap guides during node drag', () => {
    const run = (value218) => {
        const nodes2 = {
          n1: { id: 'n1', type: 'ai-image', x: 0, y: 0, width: 100, height: 80 },
          n2: { id: 'n2', type: 'source-text', x: 112, y: 0, width: 80, height: 80 },
        };
        for (let value219 = 0; value219 < value218; value219 += 1) {
          nodes2['dense_' + value219] = {
            id: 'dense_' + value219,
            type: 'source-text',
            x: 1000 + value219 * 8,
            y: 1000 + value219 * 8,
            width: 80,
            height: 60,
          };
        }
        return {
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: nodes2,
          edges: {},
          selectedNodeIds: ['n1'],
          ui: { snapGuidesEnabled: true },
          _parentToChildren: {},
        };
      },
      value220 = run(0),
      ctx4 = createDragEdgeHarness(value220);
    try {
      const nodeDragController4 = createNodeDragController(value220),
        nodeDragContext4 = createNodeDragContext();
      (nodeDragController4.updateDraggingNodes(nodeDragContext4, 10, 0, 10, 0, 10, 0, value220),
        assert.equal(nodeDragContext4.pendingDx, 12));
    } finally {
      ctx4.restore();
    }
    const value221 = run(180),
      ctx5 = createDragEdgeHarness(value221);
    try {
      const nodeDragController5 = createNodeDragController(value221),
        nodeDragContext5 = createNodeDragContext();
      (nodeDragController5.updateDraggingNodes(nodeDragContext5, 10, 0, 10, 0, 10, 0, value221),
        assert.equal(nodeDragContext5.pendingDx, 10));
    } finally {
      ctx5.restore();
    }
  }),
  test('DragController: records partial edge redraw samples during connected node drag', () => {
    const dragEdgeState2 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      ctx6 = createDragEdgeHarness(dragEdgeState2);
    try {
      (resetPerfProbeData(), setPerfProbeEnabled(true));
      const nodeDragController6 = createNodeDragController(dragEdgeState2),
        nodeDragContext6 = createNodeDragContext();
      (nodeDragController6.updateDraggingNodes(nodeDragContext6, 10, 0, 10, 0, 10, 0, dragEdgeState2),
        ctx6.runRaf());
      const list20 = getPerfProbeSnapshot().edgeRedrawSamples,
        value222 = list20[list20.length - 1];
      (assert.equal(value222.mode, 'partial'),
        assert.equal(value222.reason, 'drag-controller'),
        assert.equal(value222.edgeCount, 3),
        assert.equal(value222.visibleEdgeCount, 3),
        assert.equal(value222.updatedCount, 3),
        assert.equal(value222.cacheSize, 3));
    } finally {
      (setPerfProbeEnabled(false), resetPerfProbeData(), ctx6.restore());
    }
  }),
  test('DragController: 目标缩放区间内 3 条叠线拖拽会跳过小位移边重绘', () => {
    const dragEdgeState3 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      ctx7 = createDragEdgeHarness(dragEdgeState3);
    try {
      const nodeDragController7 = createNodeDragController(dragEdgeState3),
        nodeDragContext7 = createNodeDragContext();
      (nodeDragController7.updateDraggingNodes(nodeDragContext7, 20, 0, 20, 0, 20, 0, dragEdgeState3),
        ctx7.runRaf(),
        assert.equal(ctx7.records.length, 3),
        nodeDragController7.updateDraggingNodes(nodeDragContext7, 21, 0, 21, 0, 21, 0, dragEdgeState3),
        assert.equal(ctx7.wrappers.get('n1').style.transform, 'translate(21px, 0px)'),
        ctx7.runRaf(),
        assert.equal(ctx7.records.length, 3));
    } finally {
      ctx7.restore();
    }
  }),
  test('DragController: 叠线拖拽结束会 flush 最后一帧并移除轻量化 class', () => {
    const dragEdgeState4 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      ctx8 = createDragEdgeHarness(dragEdgeState4);
    try {
      const nodeDragController8 = createNodeDragController(dragEdgeState4),
        nodeDragContext8 = createNodeDragContext();
      (nodeDragController8.updateDraggingNodes(nodeDragContext8, 10, 0, 10, 0, 10, 0, dragEdgeState4),
        assert.equal(ctx8.records.length, 0),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), true));
      const value223 = nodeDragController8.finishDraggingNodes(nodeDragContext8, 10, 0);
      (assert.deepEqual(value223, { earlyCommit: false, didAct: true }),
        assert.equal(ctx8.records.length, 6),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), false),
        ctx8.runRaf(),
        assert.equal(ctx8.records.length, 6));
    } finally {
      ctx8.restore();
    }
  }),
  test('DragController: 非目标缩放区间或低于 3 条线时保持同步边更新', () => {
    const list21 = [
      createDragEdgeState({ zoom: 0.5, edgeCount: 6 }),
      createDragEdgeState({ zoom: 0.2, edgeCount: 6 }),
      createDragEdgeState({ zoom: 0.3, edgeCount: 2 }),
    ];
    list21.forEach((item12) => {
      const ctx9 = createDragEdgeHarness(item12);
      try {
        const nodeDragController9 = createNodeDragController(item12),
          nodeDragContext9 = createNodeDragContext();
        (nodeDragController9.updateDraggingNodes(nodeDragContext9, 10, 0, 10, 0, 10, 0, item12),
          assert.equal(ctx9.records.length, Object.keys(item12.edges).length * 2),
          assert.equal(ctx9.pendingRafCount(), 0),
          assert.equal(document.body.classList.contains('is-edge-interaction-lite'), false));
      } finally {
        ctx9.restore();
      }
    });
  }),
  test('DragController: 全局总边数达到阈值时单条受影响边也进入轻量模式', () => {
    const dragEdgeState5 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 });
    ((dragEdgeState5.edges.e2 = { id: 'e2', sourceId: 'n3', targetId: 'n4' }),
      (dragEdgeState5.edges.e3 = { id: 'e3', sourceId: 'n4', targetId: 'n3' }));
    const ctx10 = createDragEdgeHarness(dragEdgeState5);
    try {
      const nodeDragController10 = createNodeDragController(dragEdgeState5),
        nodeDragContext10 = createNodeDragContext();
      (nodeDragController10.updateDraggingNodes(nodeDragContext10, 10, 0, 10, 0, 10, 0, dragEdgeState5),
        assert.equal(ctx10.records.length, 0),
        assert.equal(ctx10.pendingRafCount(), 1),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), true),
        ctx10.runRaf(),
        assert.equal(ctx10.records.length, 1),
        assert.equal(ctx10.records[0].id, 'e1'),
        assert.equal(ctx10.records[0].kind, 'main'));
    } finally {
      ctx10.restore();
    }
  }),
  test('DragController: group drag translates internal edges without path recalculation', () => {
    const value224 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          group: { id: 'group', type: 'group', x: 0, y: 0, width: 240, height: 160 },
          n1: { id: 'n1', type: 'ai-image', parentId: 'group', x: 10, y: 20, width: 80, height: 60 },
          n2: { id: 'n2', type: 'ai-text', parentId: 'group', x: 120, y: 20, width: 80, height: 60 },
        },
        edges: { e1: { id: 'e1', sourceId: 'n1', targetId: 'n2' } },
        selectedNodeIds: ['group'],
        ui: { snapGuidesEnabled: true },
        _parentToChildren: { group: new Set(['n1', 'n2']) },
      },
      ctx11 = createDragEdgeHarness(value224),
      store15 = {
        getStateRaw() {
          return value224;
        },
        moveNodes(value225, value226, value227) {
          const list22 = new Set(value225);
          for (const value228 of value225) {
            const enabled4 = value224._parentToChildren[value228];
            if (!enabled4) continue;
            for (const value229 of enabled4) list22.add(value229);
          }
          list22.forEach((item13) => {
            ((value224.nodes[item13].x += value226), (value224.nodes[item13].y += value227));
          });
        },
        updateNodePosition() {
          throw new Error('group drag should use moveNodes');
        },
        batch(handler25) {
          handler25();
        },
        groupNodes() {},
      };
    try {
      const dragController15 = createDragController({
          store: store15,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value230) {
            return value230 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value231 = { ...createNodeDragContext(), targetNodeId: 'group' };
      (dragController15.updateDraggingNodes(value231, 20, 0, 20, 0, 20, 0, value224),
        assert.equal(ctx11.records.length, 0),
        assert.equal(ctx11.edgeDomCache.get('e1').groupEl.getAttribute('transform'), 'translate(20 0)'));
      const value232 = dragController15.finishDraggingNodes(value231, 20, 0);
      (assert.deepEqual(value232, { earlyCommit: false, didAct: true }),
        assert.equal(ctx11.edgeDomCache.get('e1').groupEl.getAttribute('transform'), null),
        assert.equal(value224.nodes.group.x, 20),
        assert.equal(value224.nodes.n1.x, 30),
        assert.equal(value224.nodes.n2.x, 140));
    } finally {
      ctx11.restore();
    }
  }),
  test('DragController: 宫格间拖拽在分隔线位置会沿用统一命中规则', () => {
    const draggedCellData6 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: {
        'sb-source': {
          id: 'sb-source',
          type: 'storyboard',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          cols: 1,
          rows: 1,
          cells: [
            {
              id: 'cell-src',
              localPath: 'output/source.png',
              thumbLocalPath: 'output/source-thumb.webp',
              thumbId: 'thumb-1',
              sourceId: 'source-1',
              isEmpty: false,
            },
          ],
        },
        'sb-target': {
          id: 'sb-target',
          type: 'storyboard',
          x: 200,
          y: 0,
          width: 100,
          height: 100,
          cols: 2,
          rows: 1,
          cells: [
            { id: 'cell-left', isEmpty: true, url: '' },
            { id: 'cell-right', isEmpty: true, url: '' },
          ],
        },
      },
    };
    let value233 = null;
    const store16 = {
        getStateRaw() {
          return draggedCellData6;
        },
        updateNodesData(value234) {
          value233 = value234;
        },
        updateNodeData() {
          throw new Error('updateNodeData should not be called in cross-storyboard move');
        },
      },
      dragController16 = createDragController({
        store: store16,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(value235) {
          return value235 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      }),
      value236 = dragController16.finishDraggingCell(
        {
          targetNodeId: 'sb-source',
          sourceCellIndex: 0,
          draggedCellData: draggedCellData6.nodes['sb-source'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        250,
        25,
      );
    (assert.deepEqual(value236, { didAct: true, committed: true }),
      assert.equal(value233['sb-target'].cells[0].id, 'cell-src'),
      assert.equal(value233['sb-target'].cells[0].localPath, 'output/source.png'),
      assert.equal(value233['sb-target'].cells[1].id, 'cell-right'),
      assert.deepEqual(value233['sb-source'].cells[0], {
        id: 'cell-src',
        localPath: null,
        originalLocalPath: null,
        displayLocalPath: null,
        thumbLocalPath: null,
        thumbId: null,
        sourceId: null,
        sourceLocalPath: null,
        sourceUrl: '',
        sourceWidth: null,
        sourceHeight: null,
        storyboardSourceCrop: false,
        storyboardPiece: false,
        storyboardLockedCell: false,
        residualImageLocalPath: 'output/source.png',
        residualImageUrl: '',
        residualImageWidth: null,
        residualImageHeight: null,
        residualImageMode: 'cell',
        isEmpty: true,
        col: 0,
        row: 0,
        url: '',
        thumbUrl: '',
      }));
  }),
  test('DragController: 子宫格互换使用显示快照写入 Store', () => {
    const value237 = globalThis.window,
      draggedCellData7 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-source': {
            id: 'sb-source',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            cells: [
              {
                id: 'cell-src',
                localPath: 'output/source.png',
                thumbLocalPath: 'output/source-thumb.webp',
                isEmpty: false,
              },
            ],
          },
          'sb-target': {
            id: 'sb-target',
            type: 'storyboard',
            x: 200,
            y: 0,
            width: 100,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: 'cell-left', isEmpty: true, url: '' },
              { id: 'cell-right', isEmpty: true, url: '' },
            ],
          },
        },
      };
    let value238 = null,
      value239 = null;
    const ghostEl = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-source',
            {
              applyImmediateCellSwap() {
                throw new Error('cross-storyboard move should not preview swap');
              },
            },
          ],
        ]),
        flushNodes(value240) {
          return ((value239 = value240), true);
        },
      },
    };
    const store17 = {
      getStateRaw() {
        return draggedCellData7;
      },
      updateNodesData(value241) {
        value238 = value241;
      },
      updateNodeData() {
        throw new Error('updateNodeData should not be called for cross-storyboard move');
      },
    };
    try {
      const dragController17 = createDragController({
          store: store17,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value242) {
            return value242 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value243 = dragController17.finishDraggingCell(
          {
            targetNodeId: 'sb-source',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData7.nodes['sb-source'].cells[0],
            ghostEl: ghostEl,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          25,
        );
      (assert.deepEqual(value243, { didAct: true, committed: true }),
        assert.equal(value238['sb-target'].cells[0].id, 'cell-src'),
        assert.equal(value238['sb-target'].cells[0].localPath, 'output/source.png'),
        assert.equal(value238['sb-target'].cells[0].sourceLocalPath, null),
        assert.equal(value238['sb-target'].cells[0].sourceUrl, ''),
        assert.equal(value238['sb-source'].cells[0].isEmpty, true),
        assert.deepEqual(value239, ['sb-source', 'sb-target']),
        assert.equal(ghostEl.removed, true));
    } finally {
      if (typeof value237 === 'undefined') delete globalThis.window;
      else globalThis.window = value237;
    }
  }),
  test('DragController: 源图像拖入拼图空槽会填充槽位', () => {
    const value244 = globalThis.window,
      value245 = globalThis.document,
      value246 = globalThis.requestAnimationFrame,
      value247 = globalThis.setTimeout,
      args18 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['img-1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          'img-1': {
            id: 'img-1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            localPath: 'output/a.jpg',
            name: 'A',
          },
          'collage-1': {
            id: 'collage-1',
            type: 'collage',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            items: [
              { id: 'slot-0', x: 0, y: 0, width: 50, height: 100 },
              { id: 'slot-1', x: 50, y: 0, width: 50, height: 100, url: '/b.jpg' },
            ],
          },
        },
      };
    let value248 = null,
      value249 = null,
      value250 = null,
      value251 = 0,
      list23 = null;
    const store18 = {
      getStateRaw() {
        return args18;
      },
      updateNodeData(nodeId11, patch11) {
        ((value248 = { nodeId: nodeId11, patch: patch11 }),
          (args18.nodes[nodeId11] = { ...args18.nodes[nodeId11], ...patch11 }));
      },
      setSelectedNodes(value252) {
        ((value249 = value252), (args18.selectedNodeIds = value252));
      },
      deleteNodes(value253) {
        value250 = value253;
      },
      batch(handler26) {
        handler26();
      },
      groupNodes() {},
    };
    try {
      const value254 = {
          complete: true,
          naturalWidth: 120,
          naturalHeight: 240,
          currentSrc: '/output/a.jpg',
          src: '/output/a.jpg',
        },
        value255 = {
          complete: true,
          naturalWidth: 120,
          naturalHeight: 240,
          getAttribute(value256) {
            return value256 === 'src' ? '/output/a.jpg' : '';
          },
        };
      function createElement9(value257) {
        return {
          tagName: String(value257).toUpperCase(),
          style: {},
          children: [],
          appendChild(value258) {
            return (this.children.push(value258), value258);
          },
          remove() {
            this.removed = true;
          },
          setAttribute(value259, value260) {
            this[value259] = String(value260);
          },
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(...args19) {
                list23 = args19;
              },
            };
          },
        };
      }
      ((globalThis.window = {
        v2Renderer: {
          nodeInstances: new Map(),
          getMountedWrapper(value261) {
            if (value261 !== 'img-1') return null;
            return {
              querySelector(value262) {
                return value262 === 'img' ? value254 : null;
              },
            };
          },
        },
      }),
        (globalThis.document = {
          body: {
            appendChild(value263) {
              return value263;
            },
          },
          createElement: createElement9,
          querySelector(list24) {
            if (list24.includes('collage-item'))
              return {
                querySelector() {
                  return value255;
                },
              };
            return null;
          },
          getElementById(value264) {
            if (value264 !== 'collage-1') return null;
            return {
              querySelector(list25) {
                if (!list25.includes('collage-item')) return null;
                return {
                  querySelector() {
                    return value255;
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (handler27) => {
          return (handler27(), 1);
        }),
        (globalThis.setTimeout = (handler28) => {
          return (handler28(), 1);
        }));
      const dragController18 = createDragController({
          store: store18,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return 'img-1';
          },
          screenToWorld: identityScreenToWorld,
          generateId(value265) {
            return value265 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value251 += 1;
          },
        }),
        value266 = dragController18.finishDraggingNodes(
          { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
          125,
          125,
        );
      (assert.deepEqual(value266, { earlyCommit: true, didAct: true }),
        assert.equal(value248.nodeId, 'collage-1'),
        assert.equal(value248.patch.items[0].id, 'collage-item-generated'),
        assert.equal(value248.patch.items[0].url, '/output/a.jpg'),
        assert.equal(value248.patch.items[0].localPath, 'output/a.jpg'),
        assert.equal(value248.patch.items[0].sourceNodeId, 'img-1'),
        assert.equal(value248.patch.items[0].sourceDisplayWidth, 120),
        assert.equal(value248.patch.items[0].sourceDisplayHeight, 240),
        assert.equal(list23.length, 9),
        assert.equal(list23[0], value254),
        assert.equal(list23[5], 0),
        assert.equal(list23[6], 0),
        assert.equal(list23[7] > 0, true),
        assert.equal(list23[8] > 0, true),
        assert.notEqual(list23[3], value254.naturalWidth),
        assert.deepEqual(value249, ['collage-1']),
        assert.deepEqual(value250, ['img-1']),
        assert.equal(value251, 1));
    } finally {
      if (typeof value244 === 'undefined') delete globalThis.window;
      else globalThis.window = value244;
      if (typeof value245 === 'undefined') delete globalThis.document;
      else globalThis.document = value245;
      if (typeof value246 === 'undefined') delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value246;
      if (typeof value247 === 'undefined') delete globalThis.setTimeout;
      else globalThis.setTimeout = value247;
    }
  }),
  test('DragController: source-only image drop into collage does not write source fallback', () => {
    const value267 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: ['img-1'],
      edges: {},
      ui: { snapGuidesEnabled: false },
      _parentToChildren: {},
      nodes: {
        'img-1': {
          id: 'img-1',
          type: 'source-image',
          x: 0,
          y: 0,
          width: 120,
          height: 240,
          src: '',
          localPath: null,
          sourceLocalPath: 'output/full-source.jpg',
          sourceUrl: '/output/full-source.jpg',
        },
        'collage-1': {
          id: 'collage-1',
          type: 'collage',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          items: [{ id: 'slot-0', x: 0, y: 0, width: 100, height: 100 }],
        },
      },
    };
    let value268 = false,
      value269 = false,
      value270 = false,
      value271 = false;
    const store19 = {
        getStateRaw() {
          return value267;
        },
        updateNodeData() {
          value268 = true;
        },
        setSelectedNodes() {
          value270 = true;
        },
        deleteNodes() {
          value269 = true;
        },
        batch(handler29) {
          handler29();
        },
        groupNodes() {},
      },
      dragController19 = createDragController({
        store: store19,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return 'img-1';
        },
        screenToWorld: identityScreenToWorld,
        generateId(value272) {
          return value272 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {
          value271 = true;
        },
      }),
      value273 = dragController19.finishDraggingNodes(
        { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
        125,
        125,
      );
    (assert.deepEqual(value273, { earlyCommit: false, didAct: false }),
      assert.equal(value268, false),
      assert.equal(value269, false),
      assert.equal(value270, false),
      assert.equal(value271, false));
  }),
  test('DragController: collage drop uses current visible image and clears source context', () => {
    const value274 = globalThis.window,
      value275 = globalThis.requestAnimationFrame,
      args20 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['img-1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          'img-1': {
            id: 'img-1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 60,
            src: '',
            localPath: null,
            sourceLocalPath: 'output/full-source.jpg',
            sourceUrl: '/output/full-source.jpg',
            sourceWidth: 400,
            sourceHeight: 300,
            imageWidth: 80,
            imageHeight: 40,
            name: 'Visible',
          },
          'collage-1': {
            id: 'collage-1',
            type: 'collage',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            items: [{ id: 'slot-0', x: 0, y: 0, width: 100, height: 100 }],
          },
        },
      };
    let value276 = null,
      value277 = null,
      value278 = null,
      value279 = 0;
    const store20 = {
      getStateRaw() {
        return args20;
      },
      updateNodeData(nodeId12, patch12) {
        ((value276 = { nodeId: nodeId12, patch: patch12 }),
          (args20.nodes[nodeId12] = { ...args20.nodes[nodeId12], ...patch12 }));
      },
      setSelectedNodes(value280) {
        ((value277 = value280), (args20.selectedNodeIds = value280));
      },
      deleteNodes(value281) {
        value278 = value281;
      },
      batch(handler30) {
        handler30();
      },
      groupNodes() {},
    };
    try {
      ((globalThis.window = {
        v2Renderer: {
          nodeInstances: new Map(),
          getMountedWrapper(value282) {
            if (value282 !== 'img-1') return null;
            return {
              querySelector(value283) {
                if (value283 !== 'img') return null;
                return {
                  complete: true,
                  naturalWidth: 80,
                  naturalHeight: 40,
                  currentSrc: '/output/current-visible.jpg',
                  src: '/output/current-visible.jpg',
                };
              },
            };
          },
        },
      }),
        (globalThis.requestAnimationFrame = (handler31) => {
          return (handler31(), 1);
        }));
      const dragController20 = createDragController({
          store: store20,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return 'img-1';
          },
          screenToWorld: identityScreenToWorld,
          generateId(value284) {
            return value284 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value279 += 1;
          },
        }),
        value285 = dragController20.finishDraggingNodes(
          { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
          125,
          125,
        );
      assert.deepEqual(value285, { earlyCommit: true, didAct: true });
      const response = value276?.patch?.items?.[0];
      (assert.equal(value276?.nodeId, 'collage-1'),
        assert.equal(response?.url, '/output/current-visible.jpg'),
        assert.equal(response?.localPath, 'output/current-visible.jpg'),
        assert.equal(response?.sourceLocalPath, ''),
        assert.equal(response?.sourceUrl, ''),
        assert.equal(response?.sourceWidth, null),
        assert.equal(response?.sourceHeight, null),
        assert.equal(response?.imageWidth, 80),
        assert.equal(response?.imageHeight, 40),
        assert.deepEqual(value277, ['collage-1']),
        assert.deepEqual(value278, ['img-1']),
        assert.equal(value279, 1));
    } finally {
      if (typeof value274 === 'undefined') delete globalThis.window;
      else globalThis.window = value274;
      if (typeof value275 === 'undefined') delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value275;
    }
  }),
  test('DragController: 拼图编辑态允许源图像替换已占用槽位', () => {
    const value286 = globalThis.window,
      value287 = globalThis.requestAnimationFrame,
      value288 = globalThis.setTimeout,
      args21 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['img-1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          'img-1': {
            id: 'img-1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 80,
            height: 80,
            localPath: 'output/a.jpg',
            name: 'A',
          },
          'collage-1': {
            id: 'collage-1',
            type: 'collage',
            isEditing: true,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            items: [
              { id: 'slot-0', x: 0, y: 0, width: 50, height: 100 },
              { id: 'slot-1', x: 50, y: 0, width: 50, height: 100, url: '/b.jpg' },
            ],
          },
        },
      };
    let value289 = null,
      value290 = null,
      value291 = null,
      value292 = 0;
    const store21 = {
      getStateRaw() {
        return args21;
      },
      updateNodeData(nodeId13, patch13) {
        ((value289 = { nodeId: nodeId13, patch: patch13 }),
          (args21.nodes[nodeId13] = { ...args21.nodes[nodeId13], ...patch13 }));
      },
      setSelectedNodes(value293) {
        ((value290 = value293), (args21.selectedNodeIds = value293));
      },
      deleteNodes(value294) {
        value291 = value294;
      },
      batch(handler32) {
        handler32();
      },
      groupNodes() {},
    };
    try {
      ((globalThis.window = { v2Renderer: { nodeInstances: new Map() } }),
        (globalThis.requestAnimationFrame = (handler33) => {
          return (handler33(), 1);
        }),
        (globalThis.setTimeout = (handler34) => {
          return (handler34(), 1);
        }));
      const dragController21 = createDragController({
          store: store21,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return 'img-1';
          },
          screenToWorld: identityScreenToWorld,
          generateId(value295) {
            return value295 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value292 += 1;
          },
        }),
        value296 = dragController21.finishDraggingNodes(
          { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
          175,
          125,
        );
      (assert.deepEqual(value296, { earlyCommit: true, didAct: true }),
        assert.equal(value289.nodeId, 'collage-1'),
        assert.equal(value289.patch.items[1].id, 'collage-item-generated'),
        assert.equal(value289.patch.items[1].url, '/output/a.jpg'),
        assert.equal(value289.patch.items[1].localPath, 'output/a.jpg'),
        assert.equal(value289.patch.items[1].sourceNodeId, 'img-1'),
        assert.equal(value289.patch.items[1].sourceDisplayWidth, 80),
        assert.equal(value289.patch.items[1].sourceDisplayHeight, 80),
        assert.deepEqual(value290, ['collage-1']),
        assert.deepEqual(value291, ['img-1']),
        assert.equal(value292, 1));
    } finally {
      if (typeof value286 === 'undefined') delete globalThis.window;
      else globalThis.window = value286;
      if (typeof value287 === 'undefined') delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value287;
      if (typeof value288 === 'undefined') delete globalThis.setTimeout;
      else globalThis.setTimeout = value288;
    }
  }),
  test('DragController: 同一宫格互换会先视觉交换再提交 Store', () => {
    const value297 = globalThis.window,
      draggedCellData8 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: 'cell-a', localPath: 'output/a.png', isEmpty: false },
              { id: 'cell-b', localPath: 'output/b.png', isEmpty: false },
            ],
          },
        },
      },
      list26 = [];
    let value298 = null,
      value299 = null,
      value300 = false;
    const ghostEl2 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-1',
            {
              applyImmediateCellSwap(value301, value302) {
                return (
                  list26.push('visual'),
                  assert.equal(value301, 0),
                  assert.equal(value302, 1),
                  {
                    ok: true,
                    revert() {
                      value300 = true;
                    },
                  }
                );
              },
            },
          ],
        ]),
        flushNodes(value303) {
          return (list26.push('flush'), (value299 = value303), true);
        },
      },
    };
    const store22 = {
      getStateRaw() {
        return draggedCellData8;
      },
      updateNodeData(nodeId14, patch14) {
        (list26.push('store'),
          assert.equal(ghostEl2.removed, true),
          (value298 = { nodeId: nodeId14, patch: patch14 }));
      },
      updateNodesData() {
        throw new Error('updateNodesData should not be called for same-storyboard move');
      },
    };
    try {
      const dragController22 = createDragController({
          store: store22,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value304) {
            return value304 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value305 = dragController22.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData8.nodes['sb-1'].cells[0],
            ghostEl: ghostEl2,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          25,
        );
      (assert.deepEqual(value305, { didAct: true, committed: true }),
        assert.deepEqual(list26, ['visual', 'store', 'flush']),
        assert.equal(value298.nodeId, 'sb-1'),
        assert.equal(value298.patch.cells[0].id, 'cell-b'),
        assert.equal(value298.patch.cells[1].id, 'cell-a'),
        assert.deepEqual(value299, ['sb-1']),
        assert.equal(ghostEl2.removed, true),
        assert.equal(value300, false));
    } finally {
      if (typeof value297 === 'undefined') delete globalThis.window;
      else globalThis.window = value297;
    }
  }),
  test('DragController: storyboard cell drop in transparent gap swaps nearest cell', () => {
    const value306 = globalThis.window,
      draggedCellData9 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [1] },
            cells: [
              { id: 'cell-a', localPath: 'output/a.png', isEmpty: false },
              { id: 'cell-b', localPath: 'output/b.png', isEmpty: false },
            ],
          },
        },
      };
    let value307 = null,
      value308 = null,
      value309 = null;
    const ghostEl3 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-1',
            {
              applyImmediateCellSwap(value310, value311) {
                return (
                  (value307 = [value310, value311]),
                  {
                    ok: true,
                    revert() {
                      throw new Error('gap swap preview should not be reverted');
                    },
                  }
                );
              },
            },
          ],
        ]),
        flushNodes(value312) {
          return ((value309 = value312), true);
        },
      },
    };
    const store23 = {
      getStateRaw() {
        return draggedCellData9;
      },
      updateNodeData(nodeId15, patch15) {
        value308 = { nodeId: nodeId15, patch: patch15 };
      },
      batch() {
        throw new Error('gap drop should resolve to a storyboard cell');
      },
    };
    try {
      const dragController23 = createDragController({
          store: store23,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value313) {
            return value313 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value314 = dragController23.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData9.nodes['sb-1'].cells[0],
            ghostEl: ghostEl3,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          155,
          50,
        );
      (assert.deepEqual(value314, { didAct: true, committed: true }),
        assert.deepEqual(value307, [0, 1]),
        assert.equal(value308.nodeId, 'sb-1'),
        assert.equal(value308.patch.cells[0].id, 'cell-b'),
        assert.equal(value308.patch.cells[1].id, 'cell-a'),
        assert.deepEqual(value309, ['sb-1']),
        assert.equal(ghostEl3.removed, true));
    } finally {
      if (typeof value306 === 'undefined') delete globalThis.window;
      else globalThis.window = value306;
    }
  }),
  test('DragController: storyboard cell pointerup miss reuses last hovered cell', () => {
    const value315 = globalThis.window,
      draggedCellData10 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: 'cell-a', localPath: 'output/a.png', isEmpty: false },
              { id: 'cell-b', localPath: 'output/b.png', isEmpty: false },
            ],
          },
        },
      };
    let value316 = null,
      value317 = null,
      value318 = null;
    const ghostEl4 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-1',
            {
              applyImmediateCellSwap(value319, value320) {
                return ((value316 = [value319, value320]), { ok: true, revert() {} });
              },
            },
          ],
        ]),
        flushNodes(value321) {
          return ((value318 = value321), true);
        },
      },
    };
    const store24 = {
      getStateRaw() {
        return draggedCellData10;
      },
      updateNodeData(nodeId16, patch16) {
        value317 = { nodeId: nodeId16, patch: patch16 };
      },
      batch() {
        throw new Error('near miss should recover to hovered storyboard cell');
      },
    };
    try {
      const dragController24 = createDragController({
          store: store24,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value322) {
            return value322 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value323 = dragController24.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData10.nodes['sb-1'].cells[0],
            ghostEl: ghostEl4,
            sourceCellEl: null,
            lastHoverNodeId: 'sb-1',
            lastHoverCellIndex: 1,
            lastHoverKind: 'storyboard',
          },
          206,
          50,
        );
      (assert.deepEqual(value323, { didAct: true, committed: true }),
        assert.deepEqual(value316, [0, 1]),
        assert.equal(value317.nodeId, 'sb-1'),
        assert.equal(value317.patch.cells[0].id, 'cell-b'),
        assert.equal(value317.patch.cells[1].id, 'cell-a'),
        assert.deepEqual(value318, ['sb-1']),
        assert.equal(ghostEl4.removed, true));
    } finally {
      if (typeof value315 === 'undefined') delete globalThis.window;
      else globalThis.window = value315;
    }
  }),
  test('DragController: storyboard cell swap locks current grid pixels', () => {
    const value324 = globalThis.window,
      value325 = globalThis.document,
      draggedCellData11 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            cells: [
              {
                id: 'cell-a',
                localPath: 'output/a-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 200,
                sourceHeight: 100,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: 'cell-b',
                localPath: 'output/b-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 200,
                sourceHeight: 100,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
            ],
          },
        },
      },
      list27 = [],
      value326 = {
        complete: true,
        naturalWidth: 200,
        naturalHeight: 100,
        currentSrc: '/output/full.png',
        src: '/output/full.png',
        getAttribute(value327) {
          return value327 === 'src' ? '/output/full.png' : '';
        },
      };
    globalThis.document = {
      getElementById(value328) {
        if (value328 !== 'cell-sb-1-0' && value328 !== 'cell-sb-1-1') return null;
        return {
          querySelector(value329) {
            return value329 === 'img.storyboard-cell-img--source-crop' ? value326 : null;
          },
        };
      },
      createElement(value330) {
        if (value330 !== 'canvas') return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(...args22) {
                list27.push(args22);
              },
            };
          },
          toDataURL() {
            return 'data:image/jpeg;base64,' + this.width + 'x' + this.height;
          },
        };
      },
    };
    let value331 = null,
      value332 = false,
      value333 = null;
    const ghostEl5 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-1',
            {
              applyImmediateCellSwap() {
                return { ok: true, revert() {} };
              },
            },
          ],
        ]),
        flushNodes(value334) {
          return ((value333 = value334), true);
        },
      },
    };
    const store25 = {
      getStateRaw() {
        return draggedCellData11;
      },
      updateNodeData(nodeId17, patch17) {
        ((value331 = { nodeId: nodeId17, patch: patch17 }),
          (draggedCellData11.nodes[nodeId17] = { ...draggedCellData11.nodes[nodeId17], ...patch17 }));
      },
      swapStoryboardCells() {
        return ((value332 = true), true);
      },
    };
    try {
      const dragController25 = createDragController({
          store: store25,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value335) {
            return value335 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value336 = dragController25.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData11.nodes['sb-1'].cells[0],
            ghostEl: ghostEl5,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (assert.deepEqual(value336, { didAct: true, committed: true }),
        assert.equal(value332, false),
        assert.deepEqual(value333, ['sb-1']),
        assert.equal(ghostEl5.removed, true),
        assert.equal(value331.nodeId, 'sb-1'),
        assert.equal(value331.patch.cells[0].id, 'cell-b'),
        assert.equal(value331.patch.cells[1].id, 'cell-a'),
        assert.equal(value331.patch.cells[0].localPath, null),
        assert.equal(value331.patch.cells[1].localPath, null),
        assert.equal(value331.patch.cells[0].storyboardLockedCell, true),
        assert.equal(value331.patch.cells[1].storyboardLockedCell, true),
        assert.equal(value331.patch.cells[0].sourceLocalPath, null),
        assert.equal(value331.patch.cells[1].sourceLocalPath, null),
        assert.equal(value331.patch.cells[0].sourceUrl, ''),
        assert.equal(value331.patch.cells[1].sourceUrl, ''),
        assert.equal(value331.patch.cells[0].storyboardSourceCrop, false),
        assert.equal(value331.patch.cells[1].storyboardSourceCrop, false),
        assert.equal(value331.patch.cells[0].storyboardExtractedCell, false),
        assert.equal(value331.patch.cells[1].storyboardExtractedCell, false),
        assert.equal(value331.patch.cells[0].capturePreviewUrl, 'data:image/jpeg;base64,90x100'),
        assert.equal(value331.patch.cells[1].capturePreviewUrl, 'data:image/jpeg;base64,90x100'),
        assert.equal(list27.length, 2),
        assert.deepEqual(list27[0].slice(1, 5), [0, 0, 90, 100]),
        assert.deepEqual(list27[1].slice(1, 5), [110, 0, 90, 100]));
    } finally {
      if (typeof value324 === 'undefined') delete globalThis.window;
      else globalThis.window = value324;
      if (typeof value325 === 'undefined') delete globalThis.document;
      else globalThis.document = value325;
    }
  }),
  test('DragController: storyboard cell swap locks custom grid and gap pixels', () => {
    const value337 = globalThis.window,
      value338 = globalThis.document,
      draggedCellData12 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            cells: [
              {
                id: 'cell-a',
                localPath: 'output/a-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: 'cell-b',
                localPath: 'output/b-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: 'cell-c',
                localPath: 'output/c-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: 'cell-d',
                localPath: 'output/d-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
            ],
          },
        },
      },
      list28 = [],
      value339 = {
        complete: true,
        naturalWidth: 300,
        naturalHeight: 200,
        currentSrc: '/output/full.png',
        src: '/output/full.png',
        getAttribute(value340) {
          return value340 === 'src' ? '/output/full.png' : '';
        },
      };
    globalThis.document = {
      getElementById(value341) {
        if (!/^cell-sb-1-[0-3]$/.test(value341)) return null;
        return {
          querySelector(value342) {
            return value342 === 'img.storyboard-cell-img--source-crop' ? value339 : null;
          },
        };
      },
      createElement(value343) {
        if (value343 !== 'canvas') return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(...args23) {
                list28.push(args23);
              },
            };
          },
          toDataURL() {
            return 'data:image/jpeg;base64,' + this.width + 'x' + this.height;
          },
        };
      },
    };
    let value344 = null,
      value345 = false;
    const ghostEl6 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-1',
            {
              applyImmediateCellSwap() {
                return { ok: true, revert() {} };
              },
            },
          ],
        ]),
        flushNodes() {
          return true;
        },
      },
    };
    const store26 = {
      getStateRaw() {
        return draggedCellData12;
      },
      updateNodeData(nodeId18, patch18) {
        ((value344 = { nodeId: nodeId18, patch: patch18 }),
          (draggedCellData12.nodes[nodeId18] = { ...draggedCellData12.nodes[nodeId18], ...patch18 }));
      },
      swapStoryboardCells() {
        return ((value345 = true), true);
      },
    };
    try {
      const dragController26 = createDragController({
          store: store26,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value346) {
            return value346 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value347 = dragController26.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData12.nodes['sb-1'].cells[0],
            ghostEl: ghostEl6,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (assert.deepEqual(value347, { didAct: true, committed: true }),
        assert.equal(value345, false),
        assert.equal(ghostEl6.removed, true),
        assert.equal(value344.nodeId, 'sb-1'),
        assert.equal(value344.patch.cells[0].id, 'cell-d'),
        assert.equal(value344.patch.cells[3].id, 'cell-a'),
        assert.equal(value344.patch.cells[0].capturePreviewUrl, 'data:image/jpeg;base64,65x140'),
        assert.equal(value344.patch.cells[3].capturePreviewUrl, 'data:image/jpeg;base64,215x40'),
        assert.deepEqual(list28[0].slice(1, 5), [0, 0, 215, 40]),
        assert.deepEqual(list28[1].slice(1, 5), [235, 60, 65, 140]));
    } finally {
      if (typeof value337 === 'undefined') delete globalThis.window;
      else globalThis.window = value337;
      if (typeof value338 === 'undefined') delete globalThis.document;
      else globalThis.document = value338;
    }
  }),
  test('DragController: storyboard swap locks node-level puzzle source pieces', () => {
    const value348 = globalThis.window,
      value349 = globalThis.document,
      draggedCellData13 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-node-source': {
            id: 'sb-node-source',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            storyboardSourceLocalPath: 'output/full-node.png',
            storyboardSourceWidth: 300,
            storyboardSourceHeight: 200,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            cells: [
              {
                id: 'piece-a',
                localPath: 'output/a-old.png',
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
              {
                id: 'piece-b',
                localPath: 'output/b-old.png',
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
              {
                id: 'piece-c',
                localPath: 'output/c-old.png',
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
              {
                id: 'piece-d',
                localPath: 'output/d-old.png',
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
            ],
          },
        },
      },
      list29 = [],
      value350 = {
        complete: true,
        naturalWidth: 300,
        naturalHeight: 200,
        currentSrc: '/output/full-node.png',
        src: '/output/full-node.png',
        getAttribute(value351) {
          return value351 === 'src' ? '/output/full-node.png' : '';
        },
      };
    globalThis.document = {
      getElementById(value352) {
        if (/^cell-sb-node-source-[0-3]$/.test(value352))
          return {
            querySelector() {
              return null;
            },
          };
        if (value352 === 'sb-node-sb-node-source')
          return {
            querySelector(value353) {
              return value353 === '.storyboard-source-backdrop' ? value350 : null;
            },
          };
        return null;
      },
      createElement(value354) {
        if (value354 !== 'canvas') return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(...args24) {
                list29.push(args24);
              },
            };
          },
          toDataURL() {
            return 'data:image/jpeg;base64,' + this.width + 'x' + this.height;
          },
        };
      },
    };
    let value355 = null,
      value356 = false;
    const ghostEl7 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-node-source',
            {
              applyImmediateCellSwap() {
                return { ok: true, revert() {} };
              },
            },
          ],
        ]),
        flushNodes() {
          return true;
        },
      },
    };
    const store27 = {
      getStateRaw() {
        return draggedCellData13;
      },
      updateNodeData(nodeId19, patch19) {
        ((value355 = { nodeId: nodeId19, patch: patch19 }),
          (draggedCellData13.nodes[nodeId19] = { ...draggedCellData13.nodes[nodeId19], ...patch19 }));
      },
      swapStoryboardCells() {
        return ((value356 = true), true);
      },
    };
    try {
      const dragController27 = createDragController({
          store: store27,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value357) {
            return value357 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value358 = dragController27.finishDraggingCell(
          {
            targetNodeId: 'sb-node-source',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData13.nodes['sb-node-source'].cells[0],
            ghostEl: ghostEl7,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (assert.deepEqual(value358, { didAct: true, committed: true }),
        assert.equal(value356, false),
        assert.equal(ghostEl7.removed, true),
        assert.equal(value355.nodeId, 'sb-node-source'),
        assert.equal(value355.patch.cells[0].id, 'piece-d'),
        assert.equal(value355.patch.cells[3].id, 'piece-a'),
        assert.equal(value355.patch.cells[0].capturePreviewUrl, 'data:image/jpeg;base64,65x140'),
        assert.equal(value355.patch.cells[3].capturePreviewUrl, 'data:image/jpeg;base64,215x40'),
        assert.deepEqual(list29[0].slice(1, 5), [0, 0, 215, 40]),
        assert.deepEqual(list29[1].slice(1, 5), [235, 60, 65, 140]));
    } finally {
      if (typeof value348 === 'undefined') delete globalThis.window;
      else globalThis.window = value348;
      if (typeof value349 === 'undefined') delete globalThis.document;
      else globalThis.document = value349;
    }
  }),
  test('DragController: source-backed storyboard source missing uses actual visible asset', () => {
    const value359 = globalThis.window,
      value360 = globalThis.document,
      draggedCellData14 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            cells: [
              {
                id: 'cell-a',
                localPath: 'output/a-stale-original-grid.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              { id: 'cell-b', localPath: 'output/b.png', isEmpty: false },
              { id: 'cell-c', localPath: 'output/c.png', isEmpty: false },
              { id: 'cell-d', localPath: 'output/d.png', isEmpty: false },
            ],
          },
        },
      };
    let value361 = false,
      value362 = false,
      value363 = false,
      value364 = false;
    const ghostEl8 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    ((globalThis.document = {
      getElementById() {
        return null;
      },
      createElement(value365) {
        if (value365 !== 'canvas') return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return null;
          },
        };
      },
    }),
      (globalThis.window = {
        v2Renderer: {
          nodeInstances: new Map([
            [
              'sb-1',
              {
                applyImmediateCellSwap() {
                  return {
                    ok: true,
                    revert() {
                      value361 = true;
                    },
                  };
                },
              },
            ],
          ]),
          flushNodes() {
            return ((value364 = true), true);
          },
        },
      }));
    const store28 = {
      getStateRaw() {
        return draggedCellData14;
      },
      updateNodeData() {
        value363 = true;
      },
      swapStoryboardCells() {
        return ((value362 = true), true);
      },
    };
    try {
      const dragController28 = createDragController({
          store: store28,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value366) {
            return value366 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value367 = dragController28.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData14.nodes['sb-1'].cells[0],
            ghostEl: ghostEl8,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (assert.deepEqual(value367, { didAct: true, committed: true }),
        assert.equal(value362, false),
        assert.equal(value363, true),
        assert.equal(value364, true),
        assert.equal(value361, false),
        assert.equal(ghostEl8.removed, true));
    } finally {
      if (typeof value359 === 'undefined') delete globalThis.window;
      else globalThis.window = value359;
      if (typeof value360 === 'undefined') delete globalThis.document;
      else globalThis.document = value360;
    }
  }),
  test('DragController: 同一宫格视觉互换后 Store 失败会回滚', () => {
    const value368 = globalThis.window,
      draggedCellData15 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: 'cell-a', localPath: 'output/a.png', isEmpty: false },
              { id: 'cell-b', localPath: 'output/b.png', isEmpty: false },
            ],
          },
        },
      };
    let value369 = false,
      value370 = false;
    const ghostEl9 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    globalThis.window = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            'sb-1',
            {
              applyImmediateCellSwap() {
                return {
                  ok: true,
                  revert() {
                    value369 = true;
                  },
                };
              },
            },
          ],
        ]),
        flushNodes() {
          return ((value370 = true), true);
        },
      },
    };
    const store29 = {
      getStateRaw() {
        return draggedCellData15;
      },
      swapStoryboardCells() {
        return false;
      },
    };
    try {
      const dragController29 = createDragController({
          store: store29,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value371) {
            return value371 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value372 = dragController29.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData15.nodes['sb-1'].cells[0],
            ghostEl: ghostEl9,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          25,
        );
      (assert.deepEqual(value372, { didAct: false, committed: false }),
        assert.equal(ghostEl9.removed, true),
        assert.equal(value369, true),
        assert.equal(value370, false));
    } finally {
      if (typeof value368 === 'undefined') delete globalThis.window;
      else globalThis.window = value368;
    }
  }),
  test('DragController: 同源提取图放回宫格优先保留实际显示图', () => {
    const value373 = globalThis.document,
      value374 = globalThis.window,
      value375 = globalThis.requestAnimationFrame,
      value376 = globalThis.setTimeout,
      args25 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ['n1'],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: 'n1',
            type: 'source-image',
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: '/output/extracted.jpg',
            localPath: 'output/extracted.jpg',
            storyboardExtractedCell: true,
            storyboardSourceIndex: 1,
            storyboardSourceNodeId: 'sb-1',
            storyboardSourceLocalPath: 'output/full-source.jpg',
            storyboardSourceUrl: '',
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            isEditing: true,
            storyboardSourceLocalPath: 'output/full-source.jpg',
            storyboardSourceWidth: 400,
            storyboardSourceHeight: 800,
            cells: [
              {
                id: 'cell-empty',
                isEmpty: true,
                url: '',
                residualImageLocalPath: 'output/full-source.jpg',
                residualImageUrl: '/output/full-source.jpg',
                residualImageWidth: 400,
                residualImageHeight: 800,
                residualImageMode: 'source',
              },
              { id: 'cell-right', isEmpty: true, url: '' },
            ],
          },
        },
      },
      list30 = [];
    let value377 = null,
      value378 = null,
      value379 = null,
      value380 = 0;
    function createElement10(value381) {
      const value382 = {
        tagName: String(value381).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: '',
        appendChild(value383) {
          return (this.children.push(value383), value383);
        },
        setAttribute(value384, value385) {
          this[value384] = String(value385);
        },
        getAttribute(value386) {
          return this[value386] || '';
        },
        getContext() {
          return { drawImage() {} };
        },
        toDataURL() {
          return 'data:image/png;base64,ghost';
        },
        remove() {
          this.removed = true;
        },
      };
      return (list30.push(value382), value382);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(value387) {
            if (value387 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: '/output/extracted.jpg',
                  src: '/output/extracted.jpg',
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(value388) {
              return (list30.push(value388), value388);
            },
          },
          createElement: createElement10,
          getElementById(value389) {
            if (value389 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: false,
                  naturalWidth: 0,
                  getAttribute(value390) {
                    return value390 === 'src' ? '/output/extracted.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (handler35) => {
          return (handler35(), 1);
        }),
        (globalThis.setTimeout = (handler36) => {
          return (handler36(), 1);
        }));
      const store30 = {
          getStateRaw() {
            return args25;
          },
          updateNodeData(nodeId20, patch20) {
            ((value377 = { nodeId: nodeId20, patch: patch20 }),
              (args25.nodes[nodeId20] = { ...args25.nodes[nodeId20], ...patch20 }));
          },
          setSelectedNodes(args26) {
            ((value378 = args26), (args25.selectedNodeIds = [...args26]));
          },
          deleteNodes(value391) {
            value379 = value391;
          },
          moveNodes() {},
          batch(handler37) {
            handler37();
          },
          groupNodes() {},
        },
        dragController30 = createDragController({
          store: store30,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value392) {
            return value392 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            value380 += 1;
          },
        }),
        value393 = dragController30.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(value393, { earlyCommit: true, didAct: true }),
        assert.equal(value377?.nodeId, 'sb-1'),
        assert.deepEqual(value377?.patch?.cells?.[0], {
          id: 'cell-generated',
          url: '',
          localPath: 'output/extracted.jpg',
          originalLocalPath: null,
          displayLocalPath: '',
          thumbUrl: '',
          thumbLocalPath: null,
          thumbId: null,
          capturePreviewUrl: '',
          fileName: '',
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          sourceId: null,
          residualImageLocalPath: 'output/full-source.jpg',
          residualImageUrl: '/output/full-source.jpg',
          residualImageWidth: 400,
          residualImageHeight: 800,
          residualImageMode: 'source',
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 1,
          sourceLocalPath: null,
          sourceUrl: '',
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 0,
          row: 0,
        }),
        assert.deepEqual(value378, []),
        assert.deepEqual(value379, ['n1']),
        assert.equal(value380, 1));
      const value394 = list30.find((item14) => item14.className === 'v2-ghost-image');
      assert.equal(value394?.removed, true);
    } finally {
      if (value373 === undefined) delete globalThis.document;
      else globalThis.document = value373;
      if (value374 === undefined) delete globalThis.window;
      else globalThis.window = value374;
      if (value375 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = value375;
      if (value376 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = value376;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 放回的提取图再次移格会冻结实际图快照', () => {
    const draggedCellData16 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
      edges: {},
      nodes: {
        'sb-1': {
          id: 'sb-1',
          type: 'storyboard',
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          cols: 2,
          rows: 1,
          cells: [
            {
              id: 'cell-returned',
              url: '',
              localPath: 'output/extracted.jpg',
              storyboardExtractedCell: true,
              storyboardSourceIndex: 1,
              sourceLocalPath: null,
              sourceUrl: '',
              storyboardSourceCrop: false,
              isEmpty: false,
              col: 0,
              row: 0,
            },
            { id: 'cell-empty', url: '', isEmpty: true, col: 1, row: 0 },
          ],
        },
      },
    };
    let value395 = null;
    const ghostEl10 = {
        remove() {
          this.removed = true;
        },
      },
      store31 = {
        getStateRaw() {
          return draggedCellData16;
        },
        updateNodeData(nodeId21, patch21) {
          ((value395 = { nodeId: nodeId21, patch: patch21 }),
            (draggedCellData16.nodes[nodeId21] = { ...draggedCellData16.nodes[nodeId21], ...patch21 }));
        },
      },
      dragController31 = createDragController({
        store: store31,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(value396) {
          return value396 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      }),
      value397 = dragController31.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: draggedCellData16.nodes['sb-1'].cells[0],
          ghostEl: ghostEl10,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        150,
        50,
      );
    (assert.deepEqual(value397, { didAct: true, committed: true }),
      assert.equal(value395.nodeId, 'sb-1'),
      assert.equal(draggedCellData16.nodes['sb-1'].cells[1].localPath, 'output/extracted.jpg'),
      assert.equal(draggedCellData16.nodes['sb-1'].cells[1].sourceLocalPath, null),
      assert.equal(draggedCellData16.nodes['sb-1'].cells[1].sourceUrl, ''),
      assert.equal(draggedCellData16.nodes['sb-1'].cells[1].storyboardSourceCrop, false),
      assert.equal(draggedCellData16.nodes['sb-1'].cells[1].storyboardPiece, false),
      assert.equal(ghostEl10.removed, true));
  }),
  test('DragController: 多轮交换后拖出仍使用当前显示图', () => {
    const draggedCellData17 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
      edges: {},
      nodes: {
        'sb-1': {
          id: 'sb-1',
          type: 'storyboard',
          x: 0,
          y: 0,
          width: 300,
          height: 100,
          cols: 3,
          rows: 1,
          cells: [
            { id: 'cell-a', localPath: 'output/a.png', isEmpty: false },
            { id: 'cell-b', localPath: 'output/b.png', isEmpty: false },
            { id: 'cell-c', url: '', isEmpty: true },
          ],
        },
      },
    };
    let value398 = null;
    const store32 = {
        getStateRaw() {
          return draggedCellData17;
        },
        updateNodeData(value399, args27) {
          draggedCellData17.nodes[value399] = { ...draggedCellData17.nodes[value399], ...args27 };
        },
        batch(handler38) {
          handler38();
        },
        addNode(value400) {
          ((value398 = value400), (draggedCellData17.nodes[value400.id] = value400));
        },
        setSelectedNodes(value401) {
          draggedCellData17.selectedNodeIds = value401;
        },
      },
      dragController32 = createDragController({
        store: store32,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(value402) {
          return value402 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      });
    (assert.deepEqual(
      dragController32.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: draggedCellData17.nodes['sb-1'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        150,
        50,
      ),
      { didAct: true, committed: true },
    ),
      assert.equal(draggedCellData17.nodes['sb-1'].cells[1].localPath, 'output/a.png'),
      assert.deepEqual(
        dragController32.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 1,
            draggedCellData: draggedCellData17.nodes['sb-1'].cells[1],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          50,
        ),
        { didAct: true, committed: true },
      ),
      assert.equal(draggedCellData17.nodes['sb-1'].cells[2].localPath, 'output/a.png'),
      assert.equal(draggedCellData17.nodes['sb-1'].cells[2].sourceLocalPath, null),
      assert.equal(draggedCellData17.nodes['sb-1'].cells[2].storyboardPiece, false),
      assert.deepEqual(
        dragController32.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 2,
            draggedCellData: draggedCellData17.nodes['sb-1'].cells[2],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          500,
          50,
        ),
        { didAct: true, committed: true },
      ),
      assert.equal(value398?.src, '/output/a.png'),
      assert.equal(value398?.localPath, 'output/a.png'),
      assert.equal(draggedCellData17.nodes['sb-1'].cells[2].isEmpty, true));
  }),
  test('DragController: source crop without visible image no-ops before visual swap', () => {
    const value403 = globalThis.window,
      value404 = globalThis.document,
      draggedCellData18 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: 'cell-live', sourceUrl: '/output/full.png', storyboardSourceCrop: true, isEmpty: false },
              { id: 'cell-target', localPath: 'output/target.png', isEmpty: false },
            ],
          },
        },
      };
    let value405 = false,
      value406 = false;
    const ghostEl11 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    ((globalThis.document = {
      getElementById() {
        return null;
      },
    }),
      (globalThis.window = {
        v2Renderer: {
          nodeInstances: new Map([
            [
              'sb-1',
              {
                applyImmediateCellSwap() {
                  return ((value405 = true), { ok: true, revert() {} });
                },
              },
            ],
          ]),
        },
      }));
    const store33 = {
      getStateRaw() {
        return draggedCellData18;
      },
      updateNodeData() {
        value406 = true;
      },
    };
    try {
      const dragController33 = createDragController({
          store: store33,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(value407) {
            return value407 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        value408 = dragController33.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: draggedCellData18.nodes['sb-1'].cells[0],
            ghostEl: ghostEl11,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (assert.deepEqual(value408, { didAct: false, committed: false }),
        assert.equal(value405, false),
        assert.equal(value406, false),
        assert.equal(ghostEl11.removed, true));
    } finally {
      if (typeof value403 === 'undefined') delete globalThis.window;
      else globalThis.window = value403;
      if (typeof value404 === 'undefined') delete globalThis.document;
      else globalThis.document = value404;
    }
  }));
