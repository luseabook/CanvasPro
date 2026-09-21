import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDragController } from './DragController.js';
import { getPerfProbeSnapshot, resetPerfProbeData, setPerfProbeEnabled } from '../perf/perfProbe.js';
function isNodeType(_0x13689d, _0x16130c) {
  if (!_0x13689d) return false;
  if (Array.isArray(_0x16130c)) return _0x16130c.includes(_0x13689d.type);
  return _0x13689d.type === _0x16130c;
}
function identityScreenToWorld(_0x50fb25, _0x761a77) {
  return { x: _0x50fb25, y: _0x761a77 };
}
(test('DragController: 提取分镜会使用统一资源取图并把源格清为空态', () => {
  const _0x2292fd = {
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
  let _0x52f091 = null,
    _0x1fbd86 = null,
    _0x3c3220 = null;
  const _0x4187f0 = {
      getStateRaw() {
        return _0x2292fd;
      },
      batch(_0x23c548) {
        _0x23c548();
      },
      addNode(_0x10e510) {
        _0x52f091 = _0x10e510;
      },
      setSelectedNodes(_0x892b9b) {
        _0x1fbd86 = _0x892b9b;
      },
      updateNodeData(_0x35360a, _0x782477) {
        _0x3c3220 = { nodeId: _0x35360a, patch: _0x782477 };
      },
    },
    _0x3d0e8c = createDragController({
      store: _0x4187f0,
      isNodeType: isNodeType,
      getShortcuts() {
        return {};
      },
      hitTestNode() {
        return null;
      },
      screenToWorld: identityScreenToWorld,
      generateId(_0x52b640) {
        return _0x52b640 + '-generated';
      },
      cloneNodesWithEdges() {
        return {};
      },
      commit() {},
    }),
    _0x36d09e = _0x3d0e8c.finishDraggingCell(
      {
        targetNodeId: 'sb-1',
        sourceCellIndex: 0,
        draggedCellData: _0x2292fd.nodes['sb-1'].cells[0],
        ghostEl: null,
        sourceCellEl: null,
        lastHoverNodeId: null,
      },
      180,
      180,
    );
  (assert.deepEqual(_0x36d09e, { didAct: true, committed: true }),
    assert.equal(_0x52f091?.src, '/output/thumb.webp'),
    assert.equal(_0x52f091?.localPath, 'output/thumb.webp'),
    assert.deepEqual(_0x1fbd86, ['source-image-generated']),
    assert.deepEqual(_0x3c3220, {
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
    const _0x46ca90 = globalThis.document,
      _0x4ce140 = globalThis.window,
      _0x4f1a61 = {
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
                sourceWidth: 0x190,
                sourceHeight: 0x320,
                isEmpty: false,
              },
              { id: 'cell-2', isEmpty: true },
            ],
          },
        },
      };
    let _0x1ca482 = null,
      _0x2d6064 = null,
      _0xd7e04c = null,
      _0x47eed4 = null;
    const _0x4dea32 = { complete: true, naturalWidth: 0x190, naturalHeight: 0x320 },
      _0x3d8a2a = {
        width: 0,
        height: 0,
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: '',
            drawImage(..._0x1df235) {
              _0x47eed4 = _0x1df235;
            },
          };
        },
        toDataURL(_0x2e9883, _0x4a85b0) {
          return (
            assert.equal(_0x2e9883, 'image/jpeg'),
            assert.equal(_0x4a85b0, 0.9),
            'data:image/jpeg;base64,current-crop'
          );
        },
      };
    try {
      (delete globalThis.window,
        (globalThis.document = {
          getElementById(_0x47e2c0) {
            return (
              assert.equal(_0x47e2c0, 'cell-sb-1-0'),
              {
                querySelector(_0x43d5bf) {
                  return (assert.equal(_0x43d5bf, 'img.storyboard-cell-img--source-crop'), _0x4dea32);
                },
              }
            );
          },
          createElement(_0x3e0e84) {
            return (assert.equal(_0x3e0e84, 'canvas'), _0x3d8a2a);
          },
        }));
      const _0x39cc98 = {
          getStateRaw() {
            return _0x4f1a61;
          },
          batch(_0x43f7b9) {
            _0x43f7b9();
          },
          addNode(_0x420dd7) {
            _0x1ca482 = _0x420dd7;
          },
          setSelectedNodes(_0x1752f4) {
            _0x2d6064 = _0x1752f4;
          },
          updateNodeData(_0x138d91, _0x44690b) {
            _0xd7e04c = { nodeId: _0x138d91, patch: _0x44690b };
          },
        },
        _0x49fbf8 = createDragController({
          store: _0x39cc98,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x275998) {
            return _0x275998 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x211506 = _0x49fbf8.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0x4f1a61.nodes['sb-1'].cells[0],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          0x1f4,
          0x1f4,
        );
      (assert.deepEqual(_0x211506, { didAct: true, committed: true }),
        assert.deepEqual(_0x47eed4?.slice(1), [0, 0, 0x118, 0x320, 0, 0, 0x118, 0x320]),
        assert.equal(_0x3d8a2a.width, 0x118),
        assert.equal(_0x3d8a2a.height, 0x320),
        assert.equal(_0x1ca482?.src, ''),
        assert.equal(_0x1ca482?.capturePreviewUrl, 'data:image/jpeg;base64,current-crop'),
        assert.equal(_0x1ca482?.localPath, ''),
        assert.equal(_0x1ca482?.width, 0x120),
        assert.equal(_0x1ca482?.height, 0x337),
        assert.equal(_0x1ca482?.originalWidth, 0x118),
        assert.equal(_0x1ca482?.originalHeight, 0x320),
        assert.equal(_0x1ca482?.sourceLocalPath, null),
        assert.equal(_0x1ca482?.sourceUrl, ''),
        assert.equal(_0x1ca482?.sourceWidth, null),
        assert.equal(_0x1ca482?.sourceHeight, null),
        assert.equal(_0x1ca482?.storyboardSourceCrop, false),
        assert.equal(_0x1ca482?.storyboardExtractedCell, true),
        assert.equal(_0x1ca482?.storyboardSourceIndex, 0),
        assert.equal(_0x1ca482?.storyboardSourceNodeId, 'sb-1'),
        assert.equal(_0x1ca482?.storyboardSourceLocalPath, 'output/source.jpg'),
        assert.equal(_0x1ca482?.storyboardSourceUrl, ''),
        assert.deepEqual(_0x2d6064, ['source-image-generated']),
        assert.equal(_0xd7e04c?.nodeId, 'sb-1'),
        assert.equal(_0xd7e04c?.patch?.cells?.[0]?.isEmpty, true),
        assert.equal(_0xd7e04c?.patch?.cells?.[0]?.sourceLocalPath, null),
        assert.equal(_0xd7e04c?.patch?.cells?.[0]?.sourceUrl, ''),
        (_0x1ca482 = null),
        (_0x47eed4 = null),
        (globalThis.document.getElementById = () => null));
      const _0x35368e = _0x49fbf8.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: _0x4f1a61.nodes['sb-1'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        0x208,
        0x208,
      );
      (assert.deepEqual(_0x35368e, { didAct: true, committed: true }),
        assert.deepEqual(_0x47eed4?.slice(1), [0, 0, 0x118, 0x320, 0, 0, 0x118, 0x320]),
        assert.equal(_0x1ca482?.src, ''),
        assert.equal(_0x1ca482?.capturePreviewUrl, 'data:image/jpeg;base64,current-crop'),
        assert.equal(_0x1ca482?.localPath, ''),
        assert.equal(_0x1ca482?.storyboardExtractedCell, true),
        assert.equal(_0x1ca482?.storyboardSourceIndex, 0),
        assert.equal(_0x1ca482?.storyboardSourceNodeId, 'sb-1'));
    } finally {
      (_0x46ca90 === undefined ? delete globalThis.document : (globalThis.document = _0x46ca90),
        _0x4ce140 === undefined ? delete globalThis.window : (globalThis.window = _0x4ce140));
    }
  }),
  test('DragController: 已锁定宫格源图未就绪时拖出会回退到当前预览', () => {
    const _0x43bc50 = globalThis.document,
      _0x98a701 = globalThis.window,
      _0x4a141f = {
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
    let _0x2a8f85 = null,
      _0x23d14e = null,
      _0x48a18b = null;
    try {
      (delete globalThis.document, delete globalThis.window);
      const _0x15c3da = {
          getStateRaw() {
            return _0x4a141f;
          },
          batch(_0x3b1a23) {
            _0x3b1a23();
          },
          addNode(_0x1a68de) {
            _0x2a8f85 = _0x1a68de;
          },
          setSelectedNodes(_0x4d2ac6) {
            _0x48a18b = _0x4d2ac6;
          },
          updateNodeData(_0x3e0cf5, _0x33f809) {
            _0x23d14e = { nodeId: _0x3e0cf5, patch: _0x33f809 };
          },
        },
        _0x2445d6 = createDragController({
          store: _0x15c3da,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0xd14748) {
            return _0xd14748 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x272522 = _0x2445d6.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 1,
            draggedCellData: _0x4a141f.nodes['sb-1'].cells[1],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          0x1f4,
          0x1f4,
        );
      (assert.deepEqual(_0x272522, { didAct: true, committed: true }),
        assert.equal(_0x2a8f85?.src, ''),
        assert.equal(_0x2a8f85?.capturePreviewUrl, 'data:image/jpeg;base64,locked-current'),
        assert.equal(_0x2a8f85?.localPath, ''),
        assert.equal(_0x2a8f85?.storyboardExtractedCell, true),
        assert.equal(_0x2a8f85?.storyboardSourceIndex, 0),
        assert.equal(_0x2a8f85?.storyboardSourceNodeId, 'sb-1'),
        assert.equal(_0x2a8f85?.storyboardSourceLocalPath, 'output/full-source.jpg'),
        assert.deepEqual(_0x48a18b, ['source-image-generated']),
        assert.equal(_0x23d14e?.nodeId, 'sb-1'),
        assert.equal(_0x23d14e?.patch?.cells?.[1]?.isEmpty, true));
    } finally {
      if (_0x43bc50 === undefined) delete globalThis.document;
      else globalThis.document = _0x43bc50;
      if (_0x98a701 === undefined) delete globalThis.window;
      else globalThis.window = _0x98a701;
    }
  }),
  test('DragController: 宫格内交换后再拖出仍使用交换后的格子预览', () => {
    const _0x443807 = globalThis.document,
      _0x4cfdd4 = globalThis.window,
      _0xb0f3a4 = {
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
      _0x4a786b = [],
      _0x9b3905 = [];
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
      const _0x128578 = {
          getStateRaw() {
            return _0xb0f3a4;
          },
          updateNodeData(_0x49971b, _0x36da55) {
            (_0x9b3905.push({ nodeId: _0x49971b, patch: _0x36da55 }),
              (_0xb0f3a4.nodes[_0x49971b] = { ..._0xb0f3a4.nodes[_0x49971b], ..._0x36da55 }));
          },
          batch(_0x59d7f4) {
            _0x59d7f4();
          },
          addNode(_0x277ab6) {
            _0x4a786b.push(_0x277ab6);
          },
          setSelectedNodes() {},
        },
        _0x2ad956 = createDragController({
          store: _0x128578,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x208875) {
            return _0x208875 + '-generated-' + _0x4a786b.length;
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x44e449 = _0x2ad956.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0xb0f3a4.nodes['sb-1'].cells[0],
            ghostEl: { remove() {} },
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (assert.deepEqual(_0x44e449, { didAct: true, committed: true }),
        assert.equal(_0xb0f3a4.nodes['sb-1'].cells[1].id, 'cell-a'),
        assert.equal(_0xb0f3a4.nodes['sb-1'].cells[1].capturePreviewUrl, 'data:image/jpeg;base64,cell-a'));
      const _0x3a1124 = _0x2ad956.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 1,
          draggedCellData: _0xb0f3a4.nodes['sb-1'].cells[1],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        0x1f4,
        0x1f4,
      );
      (assert.deepEqual(_0x3a1124, { didAct: true, committed: true }),
        assert.equal(_0x4a786b.length, 1),
        assert.equal(_0x4a786b[0].src, ''),
        assert.equal(_0x4a786b[0].capturePreviewUrl, 'data:image/jpeg;base64,cell-a'),
        assert.equal(_0xb0f3a4.nodes['sb-1'].cells[1].isEmpty, true),
        assert.equal(_0x9b3905.length, 2));
    } finally {
      if (_0x443807 === undefined) delete globalThis.document;
      else globalThis.document = _0x443807;
      if (_0x4cfdd4 === undefined) delete globalThis.window;
      else globalThis.window = _0x4cfdd4;
    }
  }),
  test('DragController: 拖出分镜时 ghost 预览按真实宫格区域裁切', () => {
    const _0x47d790 = globalThis.document,
      _0x454f09 = {
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
    let _0x1e7e6b = null,
      _0x326f7f = null;
    const _0x76bb0f = {
        complete: true,
        naturalWidth: 0x190,
        naturalHeight: 0x320,
        currentSrc: '/output/source.jpg',
        src: '/output/source.jpg',
        classList: {
          contains(_0x5e1b4f) {
            return _0x5e1b4f === 'storyboard-cell-img--source-crop';
          },
        },
        getAttribute(_0xd74278) {
          return _0xd74278 === 'src' ? '/output/source.jpg' : '';
        },
        cloneNode() {
          throw new Error('ghost should use real crop instead of cloning preview img');
        },
      },
      _0x8c8d3c = {
        width: 0,
        height: 0,
        style: {},
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: '',
            drawImage(..._0x17c7a8) {
              _0x326f7f = _0x17c7a8;
            },
          };
        },
        toDataURL() {
          return 'data:image/jpeg;base64,ghost-crop';
        },
      },
      _0x56bbdd = (_0x1a34ee) => {
        if (_0x1a34ee === 'canvas') return _0x8c8d3c;
        return {
          tagName: String(_0x1a34ee).toUpperCase(),
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
          setAttribute(_0x4310e4, _0x485402) {
            this.attrs[_0x4310e4] = _0x485402;
            if (_0x4310e4 === 'src') this.src = _0x485402;
          },
          getAttribute(_0x6da1b1) {
            return this.attrs[_0x6da1b1] || '';
          },
          appendChild(_0x14936b) {
            return (this.children.push(_0x14936b), _0x14936b);
          },
          remove() {},
        };
      };
    try {
      globalThis.document = {
        body: {
          appendChild(_0x2d41db) {
            return ((_0x1e7e6b = _0x2d41db), _0x2d41db);
          },
          classList: { add() {}, remove() {} },
        },
        getElementById(_0x1ec349) {
          return (
            assert.equal(_0x1ec349, 'cell-sb-1-0'),
            {
              querySelector(_0x4fe1b8) {
                return (
                  assert.equal(
                    ['.storyboard-cell-img', 'img.storyboard-cell-img--source-crop'].includes(_0x4fe1b8),
                    true,
                  ),
                  _0x76bb0f
                );
              },
            }
          );
        },
        createElement: _0x56bbdd,
      };
      const _0x133791 = createDragController({
          store: {
            getStateRaw() {
              return _0x454f09;
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
          generateId(_0x47f756) {
            return _0x47f756 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x6a1654 = { classList: { add() {}, remove() {} } },
        _0x31595d = {},
        _0x46c8c4 = _0x133791.tryStartNodeDrag(_0x31595d, 50, 50, 50, 50, false, {
          target: {
            closest(_0x5c066f) {
              return _0x5c066f === '.sb-cell' ? _0x6a1654 : null;
            },
          },
        });
      (assert.equal(_0x46c8c4, true),
        assert.equal(_0x31595d.ghostEl, _0x1e7e6b),
        assert.equal(_0x1e7e6b.style.width, '288px'),
        assert.equal(_0x1e7e6b.style.height, '823px'),
        assert.equal(_0x1e7e6b.style.transform, 'translate(50px, 50px) translate(-50%, -50%)'),
        assert.deepEqual(_0x326f7f?.slice(1), [0, 0, 0x118, 0x320, 0, 0, 0x118, 0x320]),
        assert.equal(_0x8c8d3c.width, 0x118),
        assert.equal(_0x8c8d3c.height, 0x320),
        assert.equal(_0x1e7e6b.children[0].attrs.src, 'data:image/jpeg;base64,ghost-crop'),
        assert.equal(_0x1e7e6b.children[0].style.objectFit, 'contain'));
    } finally {
      _0x47d790 === undefined ? delete globalThis.document : (globalThis.document = _0x47d790);
    }
  }),
  test('DragController: 提取图片放回宫格使用已裁好的图，不再保留源图裁切上下文', () => {
    const _0x2f1dba = globalThis.document,
      _0x485396 = globalThis.window,
      _0x23cb1d = globalThis.requestAnimationFrame,
      _0x41974f = globalThis.setTimeout,
      _0x2c050d = {
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
            sourceWidth: 0x190,
            sourceHeight: 0x320,
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
                residualImageWidth: 0x190,
                residualImageHeight: 0x320,
                residualImageMode: 'source',
              },
              { id: 'cell-right', isEmpty: true, url: '' },
            ],
          },
        },
      },
      _0x228086 = [];
    let _0xbd9a9c = null,
      _0x174cc8 = null,
      _0x4eab60 = null,
      _0x1e100a = 0;
    function _0x2c9243(_0x1ed50f) {
      const _0x3ce11c = {
        tagName: String(_0x1ed50f).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100,
        className: '',
        appendChild(_0x34f138) {
          return (this.children.push(_0x34f138), _0x34f138);
        },
        setAttribute(_0x508aad, _0x5ca014) {
          this[_0x508aad] = String(_0x5ca014);
        },
        getAttribute(_0x3aceef) {
          return this[_0x3aceef] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return (_0x228086.push(_0x3ce11c), _0x3ce11c);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(_0x245665) {
            if (_0x245665 !== 'n1') return null;
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
            appendChild(_0x19438c) {
              return (_0x228086.push(_0x19438c), _0x19438c);
            },
          },
          createElement: _0x2c9243,
          getElementById(_0x742697) {
            if (_0x742697 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 0x190,
                  getAttribute(_0x3c5f27) {
                    return _0x3c5f27 === 'src' ? '/output/extracted.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (_0x4d3ab4) => {
          return (_0x4d3ab4(), 1);
        }),
        (globalThis.setTimeout = (_0x2c5c1d) => {
          return (_0x2c5c1d(), 1);
        }));
      const _0x4ab54e = {
          getStateRaw() {
            return _0x2c050d;
          },
          updateNodeData(_0x2d890e, _0x108eaf) {
            ((_0xbd9a9c = { nodeId: _0x2d890e, patch: _0x108eaf }),
              (_0x2c050d.nodes[_0x2d890e] = { ..._0x2c050d.nodes[_0x2d890e], ..._0x108eaf }));
          },
          setSelectedNodes(_0x26ab39) {
            ((_0x174cc8 = _0x26ab39), (_0x2c050d.selectedNodeIds = [..._0x26ab39]));
          },
          deleteNodes(_0xad7c61) {
            _0x4eab60 = _0xad7c61;
          },
          moveNodes() {},
          batch(_0x2bb2e0) {
            _0x2bb2e0();
          },
          groupNodes() {},
        },
        _0x1b8d1b = createDragController({
          store: _0x4ab54e,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x223315) {
            return _0x223315 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x1e100a += 1;
          },
        }),
        _0xbe043d = _0x1b8d1b.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(_0xbe043d, { earlyCommit: true, didAct: true }),
        assert.equal(_0xbd9a9c?.nodeId, 'sb-1'),
        assert.deepEqual(_0xbd9a9c?.patch?.cells?.[0], {
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
          residualImageWidth: 0x190,
          residualImageHeight: 0x320,
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
        assert.deepEqual(_0x174cc8, []),
        assert.deepEqual(_0x4eab60, ['n1']),
        assert.equal(_0x1e100a, 1));
    } finally {
      if (_0x2f1dba === undefined) delete globalThis.document;
      else globalThis.document = _0x2f1dba;
      if (_0x485396 === undefined) delete globalThis.window;
      else globalThis.window = _0x485396;
      if (_0x23cb1d === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x23cb1d;
      if (_0x41974f === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = _0x41974f;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 图片放回宫格后立刻刷新并清理拖拽残影', () => {
    const _0x168509 = globalThis.document,
      _0x3ca469 = globalThis.window,
      _0xc917d3 = globalThis.requestAnimationFrame,
      _0xbecc73 = globalThis.setTimeout,
      _0x3d1c08 = {
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
      _0x5784a4 = [],
      _0x5e18f1 = [];
    let _0x1cbb4b = null,
      _0x4fc79e = null,
      _0x13c51d = null,
      _0x21e39d = null,
      _0x2a712a = null,
      _0x346c7b = 0,
      _0x1f97ca = 0;
    function _0x4b4270(_0x3137ae) {
      const _0x1b6b8b = {
        tagName: String(_0x3137ae).toUpperCase(),
        style: {},
        children: [],
        className: '',
        complete: true,
        naturalWidth: 120,
        naturalHeight: 240,
        appendChild(_0x558ba9) {
          return (this.children.push(_0x558ba9), _0x558ba9);
        },
        setAttribute(_0x2d7cf5, _0x25d3f4) {
          this[_0x2d7cf5] = String(_0x25d3f4);
        },
        getAttribute(_0x3b4b87) {
          return this[_0x3b4b87] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {
          this.removed = true;
        },
      };
      return _0x1b6b8b;
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(_0x569707) {
            if (_0x569707 !== 'n1') return null;
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
          flushNodes(_0x5afdd7) {
            return ((_0x2a712a = _0x5afdd7), true);
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(_0xda0dcd) {
              return (_0xda0dcd.className === 'v2-ghost-image' && (_0x1cbb4b = _0xda0dcd), _0xda0dcd);
            },
          },
          createElement: _0x4b4270,
          getElementById() {
            _0x1f97ca += 1;
            throw new Error('storyboard drop ghost should not wait for cell image');
          },
        }),
        (globalThis.requestAnimationFrame = (_0x31295d) => {
          return (_0x5784a4.push(_0x31295d), _0x5784a4.length);
        }),
        (globalThis.setTimeout = (_0x3faf38, _0x5686fc = 0) => {
          return (_0x5e18f1.push({ callback: _0x3faf38, delay: _0x5686fc }), _0x5e18f1.length);
        }));
      const _0x3f4697 = {
          getStateRaw() {
            return _0x3d1c08;
          },
          updateNodeData(_0x5b9a55, _0x22adc1) {
            ((_0x4fc79e = { nodeId: _0x5b9a55, patch: _0x22adc1 }),
              (_0x3d1c08.nodes[_0x5b9a55] = { ..._0x3d1c08.nodes[_0x5b9a55], ..._0x22adc1 }));
          },
          setSelectedNodes(_0xaa0226) {
            ((_0x13c51d = _0xaa0226), (_0x3d1c08.selectedNodeIds = [..._0xaa0226]));
          },
          deleteNodes(_0x1921f8) {
            _0x21e39d = _0x1921f8;
            for (const _0x27cc4a of _0x1921f8) {
              delete _0x3d1c08.nodes[_0x27cc4a];
            }
          },
          moveNodes() {},
          batch(_0x323808) {
            _0x323808();
          },
          groupNodes() {},
        },
        _0x158c7d = createDragController({
          store: _0x3f4697,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x1b7215) {
            return _0x1b7215 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x346c7b += 1;
          },
        }),
        _0x27b391 = _0x158c7d.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(_0x27b391, { earlyCommit: true, didAct: true }),
        assert.equal(_0x4fc79e?.nodeId, 'sb-1'),
        assert.deepEqual(_0x2a712a, ['sb-1']),
        assert.deepEqual(_0x13c51d, []),
        assert.deepEqual(_0x21e39d, ['n1']),
        assert.equal(_0x3d1c08.nodes.n1, undefined),
        assert.equal(_0x1f97ca, 0),
        assert.ok(_0x1cbb4b),
        assert.equal(_0x1cbb4b.removed, undefined),
        assert.equal(_0x1cbb4b.style.opacity, '0'),
        assert.match(_0x1cbb4b.style.transition, /opacity 0s/),
        assert.equal(_0x5e18f1.length, 1),
        assert.equal(_0x5e18f1[0].delay, 0),
        _0x5e18f1.shift().callback(),
        assert.equal(_0x1cbb4b.removed, true),
        assert.equal(_0x346c7b, 0),
        assert.equal(_0x5784a4.length, 2));
      while (_0x5784a4.length) {
        _0x5784a4.shift()();
      }
      (assert.equal(_0x1f97ca, 0),
        assert.equal(_0x5e18f1.length, 1),
        assert.equal(_0x5e18f1[0].delay, 0),
        _0x5e18f1.shift().callback(),
        assert.equal(_0x346c7b, 1));
    } finally {
      if (_0x168509 === undefined) delete globalThis.document;
      else globalThis.document = _0x168509;
      if (_0x3ca469 === undefined) delete globalThis.window;
      else globalThis.window = _0x3ca469;
      if (_0xc917d3 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0xc917d3;
      if (_0xbecc73 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = _0xbecc73;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: source-only image drop into storyboard does not write source fallback', () => {
    const _0x239f91 = {
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
    let _0x501037 = false,
      _0x373539 = false,
      _0x406e73 = false,
      _0x3e8d24 = false;
    const _0x158ea1 = {
        getStateRaw() {
          return _0x239f91;
        },
        updateNodeData() {
          _0x501037 = true;
        },
        setSelectedNodes() {
          _0x406e73 = true;
        },
        deleteNodes() {
          _0x373539 = true;
        },
        moveNodes() {},
        batch(_0x4b956f) {
          _0x4b956f();
        },
        groupNodes() {},
      },
      _0x14e9bf = createDragController({
        store: _0x158ea1,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(_0x47bdac) {
          return _0x47bdac + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {
          _0x3e8d24 = true;
        },
      }),
      _0x37dcbc = _0x14e9bf.finishDraggingNodes(createNodeDragContext(), 125, 50);
    (assert.deepEqual(_0x37dcbc, { earlyCommit: false, didAct: false }),
      assert.equal(_0x501037, false),
      assert.equal(_0x373539, false),
      assert.equal(_0x406e73, false),
      assert.equal(_0x3e8d24, false));
  }),
  test('DragController: 放入宫格时使用拖拽节点当前可见图，不用源图兜底', () => {
    const _0x2b4073 = globalThis.document,
      _0x5c0abd = globalThis.window,
      _0x23f6e9 = globalThis.requestAnimationFrame,
      _0x505dc0 = globalThis.setTimeout,
      _0x22cec3 = {
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
            sourceWidth: 0x190,
            sourceHeight: 0x320,
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
    let _0x2ce6b7 = null,
      _0x5df9d1 = null,
      _0x13cc5c = null,
      _0x2d2736 = 0;
    function _0x568947(_0x2708ea) {
      const _0x285206 = {
        tagName: String(_0x2708ea).toUpperCase(),
        style: {},
        children: [],
        className: '',
        appendChild(_0x37046d) {
          return (this.children.push(_0x37046d), _0x37046d);
        },
        setAttribute(_0x3c4820, _0x5771fd) {
          this[_0x3c4820] = String(_0x5771fd);
        },
        getAttribute(_0x23ec07) {
          return this[_0x23ec07] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return _0x285206;
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(_0x5edcc2) {
            if (_0x5edcc2 !== 'n1') return null;
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
            appendChild(_0x3d5938) {
              return _0x3d5938;
            },
          },
          createElement: _0x568947,
          getElementById(_0x1f900b) {
            if (_0x1f900b !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  getAttribute(_0x409ba4) {
                    return _0x409ba4 === 'src' ? '/output/current-visible.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (_0x3db350) => {
          return (_0x3db350(), 1);
        }),
        (globalThis.setTimeout = (_0x2f53e9) => {
          return (_0x2f53e9(), 1);
        }));
      const _0x26a722 = {
          getStateRaw() {
            return _0x22cec3;
          },
          updateNodeData(_0x57d00a, _0x5d5518) {
            ((_0x2ce6b7 = { nodeId: _0x57d00a, patch: _0x5d5518 }),
              (_0x22cec3.nodes[_0x57d00a] = { ..._0x22cec3.nodes[_0x57d00a], ..._0x5d5518 }));
          },
          setSelectedNodes(_0x410132) {
            ((_0x5df9d1 = _0x410132), (_0x22cec3.selectedNodeIds = [..._0x410132]));
          },
          deleteNodes(_0x1206b3) {
            _0x13cc5c = _0x1206b3;
          },
          moveNodes() {},
          batch(_0x511bbb) {
            _0x511bbb();
          },
          groupNodes() {},
        },
        _0x40d3e4 = createDragController({
          store: _0x26a722,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x2ae7e9) {
            return _0x2ae7e9 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x2d2736 += 1;
          },
        }),
        _0x1b97e3 = _0x40d3e4.finishDraggingNodes(createNodeDragContext(), 125, 50);
      assert.deepEqual(_0x1b97e3, { earlyCommit: true, didAct: true });
      const _0x125ead = _0x2ce6b7?.patch?.cells?.[0];
      (assert.equal(_0x2ce6b7?.nodeId, 'sb-1'),
        assert.equal(_0x125ead?.localPath, 'output/current-visible.jpg'),
        assert.equal(_0x125ead?.sourceLocalPath, null),
        assert.equal(_0x125ead?.sourceUrl, ''),
        assert.equal(_0x125ead?.storyboardSourceCrop, false),
        assert.equal(_0x125ead?.storyboardPiece, false),
        assert.equal(_0x125ead?.storyboardSourceIndex, 2),
        assert.equal(_0x125ead?.storyboardExtractedCell, true),
        assert.deepEqual(_0x5df9d1, []),
        assert.deepEqual(_0x13cc5c, ['n1']),
        assert.equal(_0x2d2736, 1));
    } finally {
      if (_0x2b4073 === undefined) delete globalThis.document;
      else globalThis.document = _0x2b4073;
      if (_0x5c0abd === undefined) delete globalThis.window;
      else globalThis.window = _0x5c0abd;
      if (_0x23f6e9 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x23f6e9;
      if (_0x505dc0 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = _0x505dc0;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 临时预览格拖出会落盘回填图片节点', async () => {
    const _0x363982 = 'data:image/png,storyboard-preview',
      _0x582d51 = {
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
                capturePreviewUrl: _0x363982,
                imageWidth: 80,
                imageHeight: 40,
                isEmpty: false,
              },
            ],
          },
        },
      },
      _0x4466be = [];
    let _0x5bcfb4 = null,
      _0x215058 = 0;
    const _0x534d60 = {
        getStateRaw() {
          return _0x582d51;
        },
        batch(_0x945b71) {
          _0x945b71();
        },
        addNode(_0x1fad8e) {
          ((_0x5bcfb4 = _0x1fad8e), (_0x582d51.nodes[_0x1fad8e.id] = _0x1fad8e));
        },
        setSelectedNodes(_0x5945df) {
          _0x582d51.selectedNodeIds = _0x5945df;
        },
        updateNodeData(_0x27ca8e, _0x3b9f96) {
          (_0x4466be.push({ nodeId: _0x27ca8e, patch: _0x3b9f96 }),
            (_0x582d51.nodes[_0x27ca8e] = { ..._0x582d51.nodes[_0x27ca8e], ..._0x3b9f96 }));
        },
      },
      _0x505dbc = createDragController({
        store: _0x534d60,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(_0x3e0ba3) {
          return _0x3e0ba3 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
        async saveOutputBlobImpl() {
          return (
            (_0x215058 += 1),
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
      _0x3895ca = _0x505dbc.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: _0x582d51.nodes['sb-1'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        0x12c,
        50,
      );
    (await flushAsyncWork(),
      assert.deepEqual(_0x3895ca, { didAct: true, committed: true }),
      assert.equal(_0x5bcfb4?.id, 'source-image-generated'),
      assert.equal(_0x5bcfb4?.src, ''),
      assert.equal(_0x5bcfb4?.capturePreviewUrl, _0x363982),
      assert.equal(_0x215058, 1),
      assert.equal(_0x582d51.nodes['source-image-generated'].src, '/output/persisted-preview.png'),
      assert.equal(_0x582d51.nodes['source-image-generated'].localPath, 'output/persisted-preview.png'),
      assert.equal(_0x582d51.nodes['source-image-generated'].capturePreviewUrl, ''),
      assert.equal(_0x582d51.nodes['source-image-generated'].imageWidth, 80),
      assert.equal(_0x582d51.nodes['sb-1'].cells[0].isEmpty, true),
      assert.equal(
        _0x4466be.some((_0x524370) => _0x524370.nodeId === 'source-image-generated'),
        true,
      ));
  }),
  test('DragController: 临时预览图放回宫格会落盘回填 cell', async () => {
    const _0x125c10 = globalThis.document,
      _0x97e6c0 = globalThis.window,
      _0x21dca1 = globalThis.requestAnimationFrame,
      _0x554dff = globalThis.setTimeout,
      _0x350208 = 'data:image/png,returned-preview',
      _0x432c0b = {
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
            capturePreviewUrl: _0x350208,
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
    let _0x1dd289 = 0;
    function _0x56df5c(_0x182929) {
      return {
        tagName: String(_0x182929).toUpperCase(),
        style: {},
        children: [],
        className: '',
        appendChild(_0x2a7e28) {
          return (this.children.push(_0x2a7e28), _0x2a7e28);
        },
        setAttribute(_0x6f6711, _0x15b894) {
          this[_0x6f6711] = String(_0x15b894);
        },
        getAttribute(_0x2fd3d4) {
          return this[_0x2fd3d4] || '';
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
          getMountedWrapper(_0x534cd8) {
            if (_0x534cd8 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 80,
                  naturalHeight: 40,
                  currentSrc: _0x350208,
                  src: _0x350208,
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(_0x2f4e8c) {
              return _0x2f4e8c;
            },
          },
          createElement: _0x56df5c,
          getElementById(_0x290857) {
            if (_0x290857 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 80,
                  getAttribute(_0x549ad6) {
                    return _0x549ad6 === 'src' ? _0x350208 : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (_0x2c2a8e) => {
          return (_0x2c2a8e(), 1);
        }),
        (globalThis.setTimeout = (_0x26be3c) => {
          return (_0x26be3c(), 1);
        }));
      const _0x3de14e = {
          getStateRaw() {
            return _0x432c0b;
          },
          updateNodeData(_0x34d991, _0x5892f0) {
            _0x432c0b.nodes[_0x34d991] = { ..._0x432c0b.nodes[_0x34d991], ..._0x5892f0 };
          },
          setSelectedNodes(_0xb85431) {
            _0x432c0b.selectedNodeIds = [..._0xb85431];
          },
          deleteNodes(_0x4c4cad) {
            for (const _0xce4f15 of _0x4c4cad) delete _0x432c0b.nodes[_0xce4f15];
          },
          moveNodes() {},
          batch(_0x2ff8c7) {
            _0x2ff8c7();
          },
          groupNodes() {},
        },
        _0x4cac75 = createDragController({
          store: _0x3de14e,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x333906) {
            return _0x333906 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
          async saveOutputBlobImpl() {
            return (
              (_0x1dd289 += 1),
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
        _0x4bc634 = _0x4cac75.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (await flushAsyncWork(),
        assert.deepEqual(_0x4bc634, { earlyCommit: true, didAct: true }),
        assert.equal(_0x1dd289, 1));
      const _0x2ff7bc = _0x432c0b.nodes['sb-1'].cells[0];
      (assert.equal(_0x2ff7bc.localPath, 'output/returned-preview.png'),
        assert.equal(_0x2ff7bc.capturePreviewUrl, ''),
        assert.equal(_0x2ff7bc.sourceLocalPath, null),
        assert.equal(_0x2ff7bc.sourceUrl, ''),
        assert.equal(_0x2ff7bc.storyboardSourceCrop, false),
        assert.equal(_0x2ff7bc.storyboardPiece, false),
        assert.equal(_0x2ff7bc.imageWidth, 80));
    } finally {
      if (_0x125c10 === undefined) delete globalThis.document;
      else globalThis.document = _0x125c10;
      if (_0x97e6c0 === undefined) delete globalThis.window;
      else globalThis.window = _0x97e6c0;
      if (_0x21dca1 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x21dca1;
      if (_0x554dff === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = _0x554dff;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 提取图片放回自定义槽位使用当前线位命中', () => {
    const _0x2ffac4 = globalThis.document,
      _0x39b4e9 = globalThis.window,
      _0x1b2c0d = globalThis.requestAnimationFrame,
      _0xec5e1 = globalThis.setTimeout,
      _0x124194 = {
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
            sourceWidth: 0x12c,
            sourceHeight: 200,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
          },
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 100,
            y: 0,
            width: 0x12c,
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
                residualImageWidth: 0x12c,
                residualImageHeight: 200,
                residualImageMode: 'source',
              },
            ],
          },
        },
      },
      _0x56832b = [];
    let _0x57ec77 = null,
      _0x4bd72c = null,
      _0x1fad7a = null,
      _0x597cbf = 0;
    function _0x5df194(_0x27f320) {
      const _0x1b306e = {
        tagName: String(_0x27f320).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: '',
        appendChild(_0x22d696) {
          return (this.children.push(_0x22d696), _0x22d696);
        },
        setAttribute(_0x172022, _0x5ec76d) {
          this[_0x172022] = String(_0x5ec76d);
        },
        getAttribute(_0x428859) {
          return this[_0x428859] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return (_0x56832b.push(_0x1b306e), _0x1b306e);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(_0x1e8573) {
            if (_0x1e8573 !== 'n1') return null;
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
            appendChild(_0x2a43a4) {
              return (_0x56832b.push(_0x2a43a4), _0x2a43a4);
            },
          },
          createElement: _0x5df194,
          getElementById(_0xf548e7) {
            if (_0xf548e7 !== 'cell-sb-1-3') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 65,
                  getAttribute(_0x382787) {
                    return _0x382787 === 'src' ? '/output/extracted-custom.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (_0xca437d) => {
          return (_0xca437d(), 1);
        }),
        (globalThis.setTimeout = (_0x2c9f1f) => {
          return (_0x2c9f1f(), 1);
        }));
      const _0x98483 = {
          getStateRaw() {
            return _0x124194;
          },
          updateNodeData(_0x239e78, _0x652558) {
            ((_0x57ec77 = { nodeId: _0x239e78, patch: _0x652558 }),
              (_0x124194.nodes[_0x239e78] = { ..._0x124194.nodes[_0x239e78], ..._0x652558 }));
          },
          setSelectedNodes(_0x34ffa3) {
            ((_0x4bd72c = _0x34ffa3), (_0x124194.selectedNodeIds = [..._0x34ffa3]));
          },
          deleteNodes(_0x2b3c80) {
            _0x1fad7a = _0x2b3c80;
          },
          moveNodes() {},
          batch(_0x1b3da2) {
            _0x1b3da2();
          },
          groupNodes() {},
        },
        _0x2fbd7b = createDragController({
          store: _0x98483,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x39d601) {
            return _0x39d601 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x597cbf += 1;
          },
        }),
        _0x4da5ee = _0x2fbd7b.finishDraggingNodes(createNodeDragContext(), 0x15e, 80);
      (assert.deepEqual(_0x4da5ee, { earlyCommit: true, didAct: true }),
        assert.equal(_0x57ec77?.nodeId, 'sb-1'),
        assert.equal(_0x57ec77?.patch?.cells?.[1]?.id, 'cell-1'),
        assert.deepEqual(_0x57ec77?.patch?.cells?.[3], {
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
          residualImageWidth: 0x12c,
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
        assert.deepEqual(_0x4bd72c, []),
        assert.deepEqual(_0x1fad7a, ['n1']),
        assert.equal(_0x597cbf, 1));
    } finally {
      if (_0x2ffac4 === undefined) delete globalThis.document;
      else globalThis.document = _0x2ffac4;
      if (_0x39b4e9 === undefined) delete globalThis.window;
      else globalThis.window = _0x39b4e9;
      if (_0x1b2c0d === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x1b2c0d;
      if (_0xec5e1 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = _0xec5e1;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 临时裁切图未落盘时放回宫格保留当前裁切预览', () => {
    const _0xfec2e4 = globalThis.document,
      _0x3e9be0 = globalThis.window,
      _0x477dac = globalThis.requestAnimationFrame,
      _0x288641 = globalThis.setTimeout,
      _0x149ca0 = 'data:image/jpeg;base64/current-crop',
      _0x18733d = {
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
            src: _0x149ca0,
            localPath: '',
            capturePreviewUrl: _0x149ca0,
            sourceLocalPath: 'output/full-source.jpg',
            sourceUrl: '/output/full-source.jpg',
            sourceWidth: 0x190,
            sourceHeight: 0x320,
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
      _0xb546e5 = [];
    let _0x7c45b2 = null,
      _0x15e749 = null;
    function _0x5a0fb5(_0x463e6e) {
      const _0x2623ed = {
        tagName: String(_0x463e6e).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: '',
        appendChild(_0x563608) {
          return (this.children.push(_0x563608), _0x563608);
        },
        setAttribute(_0x12f406, _0x291780) {
          this[_0x12f406] = String(_0x291780);
        },
        getAttribute(_0x276bbf) {
          return this[_0x276bbf] || '';
        },
        getContext() {
          return { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} };
        },
        remove() {},
      };
      return (_0xb546e5.push(_0x2623ed), _0x2623ed);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(_0x285a08) {
            if (_0x285a08 !== 'n1') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: _0x149ca0,
                  src: _0x149ca0,
                };
              },
            };
          },
        }),
        (globalThis.document = {
          body: {
            classList: createClassList(),
            appendChild(_0x256488) {
              return (_0xb546e5.push(_0x256488), _0x256488);
            },
          },
          createElement: _0x5a0fb5,
          getElementById(_0x5e0c47) {
            if (_0x5e0c47 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  getAttribute(_0x2dcf73) {
                    return _0x2dcf73 === 'src' ? _0x149ca0 : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (_0x3f7d32) => {
          return (_0x3f7d32(), 1);
        }),
        (globalThis.setTimeout = (_0x5336c7) => {
          return (_0x5336c7(), 1);
        }));
      const _0x4b5ece = {
          getStateRaw() {
            return _0x18733d;
          },
          updateNodeData(_0x20b775, _0x2e910e) {
            ((_0x7c45b2 = { nodeId: _0x20b775, patch: _0x2e910e }),
              (_0x18733d.nodes[_0x20b775] = { ..._0x18733d.nodes[_0x20b775], ..._0x2e910e }));
          },
          setSelectedNodes(_0x89c7c6) {
            _0x18733d.selectedNodeIds = [..._0x89c7c6];
          },
          deleteNodes(_0x513118) {
            _0x15e749 = _0x513118;
          },
          moveNodes() {},
          batch(_0x1b25eb) {
            _0x1b25eb();
          },
          groupNodes() {},
        },
        _0x4208e0 = createDragController({
          store: _0x4b5ece,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x2f68fe) {
            return _0x2f68fe + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x18e3ba = _0x4208e0.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(_0x18e3ba, { earlyCommit: true, didAct: true }),
        assert.equal(_0x7c45b2?.nodeId, 'sb-1'),
        assert.deepEqual(_0x7c45b2?.patch?.cells?.[0], {
          id: 'cell-generated',
          url: '',
          localPath: null,
          originalLocalPath: null,
          displayLocalPath: '',
          capturePreviewUrl: _0x149ca0,
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
        assert.deepEqual(_0x15e749, ['n1']));
    } finally {
      if (_0xfec2e4 === undefined) delete globalThis.document;
      else globalThis.document = _0xfec2e4;
      if (_0x3e9be0 === undefined) delete globalThis.window;
      else globalThis.window = _0x3e9be0;
      if (_0x477dac === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x477dac;
      if (_0x288641 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = _0x288641;
      delete globalThis.v2Renderer;
    }
  }));
function createClassList() {
  const _0x22a2c6 = new Set();
  return {
    add(..._0x1a3283) {
      _0x1a3283.forEach((_0x5358e8) => _0x22a2c6.add(String(_0x5358e8)));
    },
    remove(..._0x3d5122) {
      _0x3d5122.forEach((_0x19dbac) => _0x22a2c6.delete(String(_0x19dbac)));
    },
    toggle(_0x4971f8, _0x1d4dd7) {
      if (_0x1d4dd7 === true) return (_0x22a2c6.add(String(_0x4971f8)), true);
      if (_0x1d4dd7 === false) return (_0x22a2c6.delete(String(_0x4971f8)), false);
      if (_0x22a2c6.has(String(_0x4971f8))) return (_0x22a2c6.delete(String(_0x4971f8)), false);
      return (_0x22a2c6.add(String(_0x4971f8)), true);
    },
    contains(_0x2978d0) {
      return _0x22a2c6.has(String(_0x2978d0));
    },
  };
}
function createPathRecorder(_0x1683c2, _0x40391e, _0x5378af) {
  return {
    setAttribute(_0x8b1bd2, _0x31f525) {
      _0x1683c2.push({ id: _0x40391e, kind: _0x5378af, name: _0x8b1bd2, value: _0x31f525 });
    },
  };
}
function createAttrRecorder() {
  const _0x7876b1 = new Map();
  return {
    setAttribute(_0x434377, _0x3fb11d) {
      _0x7876b1.set(_0x434377, _0x3fb11d);
    },
    getAttribute(_0x4954dc) {
      return _0x7876b1.has(_0x4954dc) ? _0x7876b1.get(_0x4954dc) : null;
    },
    removeAttribute(_0x38e7ad) {
      _0x7876b1.delete(_0x38e7ad);
    },
  };
}
test('DragController: 多选拖拽从全景、注释、宫格节点发起时保留整组选区', () => {
  const _0x18fbc2 = globalThis.window,
    _0x47301f = globalThis.document,
    _0x451fec = [
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
    for (const _0x1b35da of _0x451fec) {
      const _0x2e3443 = ['source-1', _0x1b35da.nodeId, 'ai-1'],
        _0x35e18b = {
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: {
            'source-1': { id: 'source-1', type: 'source-image', x: 0, y: 0, width: 100, height: 100 },
            [_0x1b35da.nodeId]: {
              id: _0x1b35da.nodeId,
              type: _0x1b35da.type,
              x: 200,
              y: 0,
              width: 120,
              height: 90,
            },
            'ai-1': { id: 'ai-1', type: 'ai-text', x: 0x190, y: 0, width: 100, height: 100 },
          },
          edges: {},
          selectedNodeIds: _0x2e3443,
          ui: { snapGuidesEnabled: false },
          _parentToChildren: {},
        },
        _0x4f9445 = [],
        _0x2e16a8 = [],
        _0x4a03ea = {
          getStateRaw() {
            return _0x35e18b;
          },
          setSelectedNodes(_0x34cb20) {
            (_0x4f9445.push([..._0x34cb20]), (_0x35e18b.selectedNodeIds = [..._0x34cb20]));
          },
          moveNodes(_0x1a8c1f, _0x4a9d08, _0x1eb8d6) {
            _0x2e16a8.push({ ids: [..._0x1a8c1f], dx: _0x4a9d08, dy: _0x1eb8d6 });
          },
          updateNodePosition() {
            throw new Error('multi-selected drag should move the selected set');
          },
          batch(_0x3e17f3) {
            _0x3e17f3();
          },
          groupNodes() {},
        },
        _0x5d6d77 = createDragController({
          store: _0x4a03ea,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return _0x1b35da.nodeId;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0xaddf49) {
            return _0xaddf49 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x2db65c = { isDragging: false, pendingDx: 0, pendingDy: 0, hasMoved: false };
      (assert.equal(_0x5d6d77.tryStartNodeDrag(_0x2db65c, 200, 0, 200, 0, false, {}), true),
        assert.deepEqual(_0x4f9445, []),
        _0x5d6d77.updateDraggingNodes(_0x2db65c, 215, 12, 215, 12, 215, 12, _0x35e18b));
      const _0x3ce1ac = _0x5d6d77.finishDraggingNodes(_0x2db65c, 215, 12);
      (assert.deepEqual(_0x3ce1ac, { earlyCommit: false, didAct: true }),
        assert.deepEqual(_0x2e16a8, [{ ids: _0x2e3443, dx: 15, dy: 12 }]),
        assert.deepEqual(_0x35e18b.selectedNodeIds, _0x2e3443));
    }
  } finally {
    if (typeof _0x18fbc2 === 'undefined') delete globalThis.window;
    else globalThis.window = _0x18fbc2;
    if (typeof _0x47301f === 'undefined') delete globalThis.document;
    else globalThis.document = _0x47301f;
  }
});
function createDragEdgeState({ zoom: zoom = 0.3, edgeCount: edgeCount = 6 } = {}) {
  const _0x1a1038 = { n1: { id: 'n1', type: 'ai-image', x: 0, y: 0, width: 0x104, height: 100 } },
    _0x1aadf2 = {};
  for (let _0xbd37b7 = 1; _0xbd37b7 <= edgeCount; _0xbd37b7 += 1) {
    const _0x5277fe = 'n' + (_0xbd37b7 + 1);
    ((_0x1a1038[_0x5277fe] = {
      id: _0x5277fe,
      type: 'ai-text',
      x: 0x1f4 + _0xbd37b7 * 20,
      y: _0xbd37b7 * 120,
      width: 0x104,
      height: 100,
    }),
      (_0x1aadf2['e' + _0xbd37b7] = { id: 'e' + _0xbd37b7, sourceId: 'n1', targetId: _0x5277fe }));
  }
  return {
    viewport: { x: 0, y: 0, zoom: zoom },
    nodes: _0x1a1038,
    edges: _0x1aadf2,
    selectedNodeIds: ['n1'],
    ui: { snapGuidesEnabled: false },
    _parentToChildren: {},
  };
}
function createDragEdgeHarness(_0x94bed3) {
  const _0x171f63 = globalThis.window,
    _0x3d5ef3 = globalThis.document,
    _0x243d4e = globalThis.requestAnimationFrame,
    _0x35c3c0 = globalThis.cancelAnimationFrame,
    _0x26ee3b = globalThis.innerWidth,
    _0x4d9071 = globalThis.innerHeight,
    _0x85ba4e = [],
    _0x3db952 = new Map();
  Object.keys(_0x94bed3.nodes).forEach((_0x581aa2) => {
    _0x3db952.set(_0x581aa2, { style: {}, classList: createClassList(), isConnected: true });
  });
  const _0x185b38 = new Map();
  Object.keys(_0x94bed3.edges).forEach((_0x19ee56) => {
    _0x185b38.set(_0x19ee56, {
      groupEl: createAttrRecorder(),
      hoverPath: createPathRecorder(_0x85ba4e, _0x19ee56, 'hover'),
      pathEl: createPathRecorder(_0x85ba4e, _0x19ee56, 'main'),
    });
  });
  const _0xd8a91f = [];
  let _0x54cd5b = 0;
  return (
    (globalThis.window = globalThis),
    (globalThis.innerWidth = 0x640),
    (globalThis.innerHeight = 0x4b0),
    (globalThis.document = {
      body: { classList: createClassList() },
      getElementById() {
        return null;
      },
    }),
    (globalThis.requestAnimationFrame = (_0x47e617) => {
      return (
        (_0x54cd5b += 1),
        _0xd8a91f.push({ id: _0x54cd5b, callback: _0x47e617, canceled: false }),
        _0x54cd5b
      );
    }),
    (globalThis.cancelAnimationFrame = (_0x170fef) => {
      const _0x22c92c = _0xd8a91f.find((_0x3c5d6a) => _0x3c5d6a.id === _0x170fef);
      if (_0x22c92c) _0x22c92c.canceled = true;
    }),
    (globalThis.v2Renderer = {
      getMountedWrapper(_0x34cabb) {
        return _0x3db952.get(_0x34cabb) || null;
      },
      getEdgeIdsForNode(_0x8885f0) {
        return Object.values(_0x94bed3.edges)
          .filter((_0x580a05) => _0x580a05.sourceId === _0x8885f0 || _0x580a05.targetId === _0x8885f0)
          .map((_0xba8f47) => _0xba8f47.id);
      },
    }),
    (globalThis._edgeDomCache = _0x185b38),
    (globalThis._v2MinimapDotMap = new Map()),
    (globalThis._v2MinimapScale = 0),
    (globalThis._clearSnapGuideLines = () => {}),
    {
      records: _0x85ba4e,
      wrappers: _0x3db952,
      edgeDomCache: _0x185b38,
      pendingRafCount() {
        return _0xd8a91f.filter((_0x3fe6c8) => !_0x3fe6c8.canceled).length;
      },
      runRaf() {
        const _0x5185c8 = _0xd8a91f.splice(0);
        _0x5185c8.forEach((_0x56cc09) => {
          if (!_0x56cc09.canceled) _0x56cc09.callback();
        });
      },
      restore() {
        if (typeof _0x171f63 === 'undefined') delete globalThis.window;
        else globalThis.window = _0x171f63;
        if (typeof _0x3d5ef3 === 'undefined') delete globalThis.document;
        else globalThis.document = _0x3d5ef3;
        typeof _0x243d4e === 'undefined'
          ? delete globalThis.requestAnimationFrame
          : (globalThis.requestAnimationFrame = _0x243d4e);
        typeof _0x35c3c0 === 'undefined'
          ? delete globalThis.cancelAnimationFrame
          : (globalThis.cancelAnimationFrame = _0x35c3c0);
        if (typeof _0x26ee3b === 'undefined') delete globalThis.innerWidth;
        else globalThis.innerWidth = _0x26ee3b;
        if (typeof _0x4d9071 === 'undefined') delete globalThis.innerHeight;
        else globalThis.innerHeight = _0x4d9071;
        (delete globalThis.v2Renderer,
          delete globalThis._edgeDomCache,
          delete globalThis._v2MinimapDotMap,
          delete globalThis._v2MinimapScale,
          delete globalThis._clearSnapGuideLines);
      },
    }
  );
}
function createNodeDragController(_0x46dd8d) {
  const _0x332572 = {
    getStateRaw() {
      return _0x46dd8d;
    },
    updateNodePosition(_0x22484c, _0x5d43c8, _0x34e5a4) {
      ((_0x46dd8d.nodes[_0x22484c].x += _0x5d43c8), (_0x46dd8d.nodes[_0x22484c].y += _0x34e5a4));
    },
    moveNodes(_0x279749, _0x5cec69, _0x2f97be) {
      _0x279749.forEach((_0x453214) => {
        ((_0x46dd8d.nodes[_0x453214].x += _0x5cec69), (_0x46dd8d.nodes[_0x453214].y += _0x2f97be));
      });
    },
    batch(_0x52bfbf) {
      _0x52bfbf();
    },
    groupNodes() {},
  };
  return createDragController({
    store: _0x332572,
    isNodeType: isNodeType,
    getShortcuts() {
      return {};
    },
    hitTestNode() {
      return null;
    },
    screenToWorld: identityScreenToWorld,
    generateId(_0x1d3632) {
      return _0x1d3632 + '-generated';
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
async function flushAsyncWork(_0x226424 = 8) {
  for (let _0x4cc9d6 = 0; _0x4cc9d6 < _0x226424; _0x4cc9d6 += 1) {
    await Promise.resolve();
  }
}
(test('DragController: grid snap aligns the dragged node origin to the canvas grid', () => {
  const _0x5e1804 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: { n1: { id: 'n1', type: 'ai-image', x: 13, y: 17, width: 100, height: 80 } },
      edges: {},
      selectedNodeIds: ['n1'],
      ui: { snapGuidesEnabled: false },
      _parentToChildren: {},
    },
    _0x177c12 = createDragEdgeHarness(_0x5e1804),
    _0x3cd404 = globalThis.v2SnapToGrid;
  try {
    globalThis.v2SnapToGrid = true;
    const _0x873478 = createNodeDragController(_0x5e1804),
      _0x37dc74 = createNodeDragContext();
    (_0x873478.updateDraggingNodes(_0x37dc74, 21, 22, 21, 22, 21, 22, _0x5e1804),
      assert.equal(_0x37dc74.pendingDx, 27),
      assert.equal(_0x37dc74.pendingDy, 23),
      assert.equal(_0x177c12.wrappers.get('n1').style.transform, 'translate(40px, 40px)'));
    const _0x95b28b = _0x873478.finishDraggingNodes(_0x37dc74, 21, 22);
    (assert.deepEqual(_0x95b28b, { earlyCommit: false, didAct: true }),
      assert.equal(_0x5e1804.nodes.n1.x, 40),
      assert.equal(_0x5e1804.nodes.n1.y, 40));
  } finally {
    if (typeof _0x3cd404 === 'undefined') delete globalThis.v2SnapToGrid;
    else globalThis.v2SnapToGrid = _0x3cd404;
    _0x177c12.restore();
  }
}),
  test('DragController: grid snap aligns the multi-select bounds to the canvas grid', () => {
    const _0x408302 = {
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
      _0x1aa2c7 = createDragEdgeHarness(_0x408302),
      _0x3ef18f = globalThis.v2SnapToGrid;
    try {
      globalThis.v2SnapToGrid = true;
      const _0x188730 = createNodeDragController(_0x408302),
        _0x26368d = createNodeDragContext();
      (_0x188730.updateDraggingNodes(_0x26368d, 21, 22, 21, 22, 21, 22, _0x408302),
        assert.equal(_0x26368d.pendingDx, 27),
        assert.equal(_0x26368d.pendingDy, 23),
        assert.equal(_0x1aa2c7.wrappers.get('n1').style.transform, 'translate(40px, 40px)'),
        assert.equal(_0x1aa2c7.wrappers.get('n2').style.transform, 'translate(82px, 93px)'));
      const _0x3ce149 = _0x188730.finishDraggingNodes(_0x26368d, 21, 22);
      (assert.deepEqual(_0x3ce149, { earlyCommit: false, didAct: true }),
        assert.equal(_0x408302.nodes.n1.x, 40),
        assert.equal(_0x408302.nodes.n1.y, 40),
        assert.equal(_0x408302.nodes.n2.x, 82),
        assert.equal(_0x408302.nodes.n2.y, 93));
    } finally {
      if (typeof _0x3ef18f === 'undefined') delete globalThis.v2SnapToGrid;
      else globalThis.v2SnapToGrid = _0x3ef18f;
      _0x1aa2c7.restore();
    }
  }),
  test('DragController: 目标缩放区间内 3 条叠线拖拽会合并连线重绘到 RAF', () => {
    const _0x4cc76c = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      _0x4d38f8 = createDragEdgeHarness(_0x4cc76c);
    try {
      const _0x15417c = createNodeDragController(_0x4cc76c),
        _0x5d5287 = createNodeDragContext();
      (_0x15417c.updateDraggingNodes(_0x5d5287, 10, 0, 10, 0, 10, 0, _0x4cc76c),
        _0x15417c.updateDraggingNodes(_0x5d5287, 20, 0, 20, 0, 20, 0, _0x4cc76c),
        assert.equal(_0x4d38f8.records.length, 0),
        assert.equal(_0x4d38f8.pendingRafCount(), 1),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), true),
        _0x4d38f8.runRaf(),
        assert.equal(_0x4d38f8.records.length, 3),
        assert.equal(
          _0x4d38f8.records.every((_0x4924da) => _0x4924da.kind === 'main'),
          true,
        ),
        assert.match(_0x4d38f8.records[0].value, /^M 280 50 C /));
    } finally {
      _0x4d38f8.restore();
    }
  }),
  test('DragController: dense canvas skips live snap guides during node drag', () => {
    const _0x15ce72 = (_0x578c9a) => {
        const _0x1cf5be = {
          n1: { id: 'n1', type: 'ai-image', x: 0, y: 0, width: 100, height: 80 },
          n2: { id: 'n2', type: 'source-text', x: 112, y: 0, width: 80, height: 80 },
        };
        for (let _0xba5980 = 0; _0xba5980 < _0x578c9a; _0xba5980 += 1) {
          _0x1cf5be['dense_' + _0xba5980] = {
            id: 'dense_' + _0xba5980,
            type: 'source-text',
            x: 0x3e8 + _0xba5980 * 8,
            y: 0x3e8 + _0xba5980 * 8,
            width: 80,
            height: 60,
          };
        }
        return {
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: _0x1cf5be,
          edges: {},
          selectedNodeIds: ['n1'],
          ui: { snapGuidesEnabled: true },
          _parentToChildren: {},
        };
      },
      _0x352f97 = _0x15ce72(0),
      _0x47e256 = createDragEdgeHarness(_0x352f97);
    try {
      const _0x333ec6 = createNodeDragController(_0x352f97),
        _0xefa25b = createNodeDragContext();
      (_0x333ec6.updateDraggingNodes(_0xefa25b, 10, 0, 10, 0, 10, 0, _0x352f97),
        assert.equal(_0xefa25b.pendingDx, 12));
    } finally {
      _0x47e256.restore();
    }
    const _0x35e858 = _0x15ce72(180),
      _0x32103e = createDragEdgeHarness(_0x35e858);
    try {
      const _0x29a84d = createNodeDragController(_0x35e858),
        _0x5c7087 = createNodeDragContext();
      (_0x29a84d.updateDraggingNodes(_0x5c7087, 10, 0, 10, 0, 10, 0, _0x35e858),
        assert.equal(_0x5c7087.pendingDx, 10));
    } finally {
      _0x32103e.restore();
    }
  }),
  test('DragController: records partial edge redraw samples during connected node drag', () => {
    const _0x4aa35a = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      _0x494a4d = createDragEdgeHarness(_0x4aa35a);
    try {
      (resetPerfProbeData(), setPerfProbeEnabled(true));
      const _0x38b8d8 = createNodeDragController(_0x4aa35a),
        _0x30a622 = createNodeDragContext();
      (_0x38b8d8.updateDraggingNodes(_0x30a622, 10, 0, 10, 0, 10, 0, _0x4aa35a), _0x494a4d.runRaf());
      const _0x3a0052 = getPerfProbeSnapshot().edgeRedrawSamples,
        _0x4e470a = _0x3a0052[_0x3a0052.length - 1];
      (assert.equal(_0x4e470a.mode, 'partial'),
        assert.equal(_0x4e470a.reason, 'drag-controller'),
        assert.equal(_0x4e470a.edgeCount, 3),
        assert.equal(_0x4e470a.visibleEdgeCount, 3),
        assert.equal(_0x4e470a.updatedCount, 3),
        assert.equal(_0x4e470a.cacheSize, 3));
    } finally {
      (setPerfProbeEnabled(false), resetPerfProbeData(), _0x494a4d.restore());
    }
  }),
  test('DragController: 目标缩放区间内 3 条叠线拖拽会跳过小位移边重绘', () => {
    const _0x2202d7 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      _0x2cfaf2 = createDragEdgeHarness(_0x2202d7);
    try {
      const _0x36c58c = createNodeDragController(_0x2202d7),
        _0x5db3dd = createNodeDragContext();
      (_0x36c58c.updateDraggingNodes(_0x5db3dd, 20, 0, 20, 0, 20, 0, _0x2202d7),
        _0x2cfaf2.runRaf(),
        assert.equal(_0x2cfaf2.records.length, 3),
        _0x36c58c.updateDraggingNodes(_0x5db3dd, 21, 0, 21, 0, 21, 0, _0x2202d7),
        assert.equal(_0x2cfaf2.wrappers.get('n1').style.transform, 'translate(21px, 0px)'),
        _0x2cfaf2.runRaf(),
        assert.equal(_0x2cfaf2.records.length, 3));
    } finally {
      _0x2cfaf2.restore();
    }
  }),
  test('DragController: 叠线拖拽结束会 flush 最后一帧并移除轻量化 class', () => {
    const _0x2c9e82 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      _0x20f80f = createDragEdgeHarness(_0x2c9e82);
    try {
      const _0x3d7e84 = createNodeDragController(_0x2c9e82),
        _0x2ed0f6 = createNodeDragContext();
      (_0x3d7e84.updateDraggingNodes(_0x2ed0f6, 10, 0, 10, 0, 10, 0, _0x2c9e82),
        assert.equal(_0x20f80f.records.length, 0),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), true));
      const _0x6018c3 = _0x3d7e84.finishDraggingNodes(_0x2ed0f6, 10, 0);
      (assert.deepEqual(_0x6018c3, { earlyCommit: false, didAct: true }),
        assert.equal(_0x20f80f.records.length, 6),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), false),
        _0x20f80f.runRaf(),
        assert.equal(_0x20f80f.records.length, 6));
    } finally {
      _0x20f80f.restore();
    }
  }),
  test('DragController: 非目标缩放区间或低于 3 条线时保持同步边更新', () => {
    const _0x5e561b = [
      createDragEdgeState({ zoom: 0.5, edgeCount: 6 }),
      createDragEdgeState({ zoom: 0.2, edgeCount: 6 }),
      createDragEdgeState({ zoom: 0.3, edgeCount: 2 }),
    ];
    _0x5e561b.forEach((_0x19755b) => {
      const _0x368467 = createDragEdgeHarness(_0x19755b);
      try {
        const _0x16f090 = createNodeDragController(_0x19755b),
          _0x26083d = createNodeDragContext();
        (_0x16f090.updateDraggingNodes(_0x26083d, 10, 0, 10, 0, 10, 0, _0x19755b),
          assert.equal(_0x368467.records.length, Object.keys(_0x19755b.edges).length * 2),
          assert.equal(_0x368467.pendingRafCount(), 0),
          assert.equal(document.body.classList.contains('is-edge-interaction-lite'), false));
      } finally {
        _0x368467.restore();
      }
    });
  }),
  test('DragController: 全局总边数达到阈值时单条受影响边也进入轻量模式', () => {
    const _0x2d347b = createDragEdgeState({ zoom: 0.3, edgeCount: 3 });
    ((_0x2d347b.edges.e2 = { id: 'e2', sourceId: 'n3', targetId: 'n4' }),
      (_0x2d347b.edges.e3 = { id: 'e3', sourceId: 'n4', targetId: 'n3' }));
    const _0x3c9424 = createDragEdgeHarness(_0x2d347b);
    try {
      const _0x4e284b = createNodeDragController(_0x2d347b),
        _0x333b96 = createNodeDragContext();
      (_0x4e284b.updateDraggingNodes(_0x333b96, 10, 0, 10, 0, 10, 0, _0x2d347b),
        assert.equal(_0x3c9424.records.length, 0),
        assert.equal(_0x3c9424.pendingRafCount(), 1),
        assert.equal(document.body.classList.contains('is-edge-interaction-lite'), true),
        _0x3c9424.runRaf(),
        assert.equal(_0x3c9424.records.length, 1),
        assert.equal(_0x3c9424.records[0].id, 'e1'),
        assert.equal(_0x3c9424.records[0].kind, 'main'));
    } finally {
      _0x3c9424.restore();
    }
  }),
  test('DragController: group drag translates internal edges without path recalculation', () => {
    const _0x2ecbd2 = {
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
      _0x2155c3 = createDragEdgeHarness(_0x2ecbd2),
      _0x3fdee8 = {
        getStateRaw() {
          return _0x2ecbd2;
        },
        moveNodes(_0x4bd455, _0xfa1d89, _0x305987) {
          const _0x1c584e = new Set(_0x4bd455);
          for (const _0x56ef0c of _0x4bd455) {
            const _0x322da6 = _0x2ecbd2._parentToChildren[_0x56ef0c];
            if (!_0x322da6) continue;
            for (const _0x33f552 of _0x322da6) _0x1c584e.add(_0x33f552);
          }
          _0x1c584e.forEach((_0x1f6755) => {
            ((_0x2ecbd2.nodes[_0x1f6755].x += _0xfa1d89), (_0x2ecbd2.nodes[_0x1f6755].y += _0x305987));
          });
        },
        updateNodePosition() {
          throw new Error('group drag should use moveNodes');
        },
        batch(_0x243342) {
          _0x243342();
        },
        groupNodes() {},
      };
    try {
      const _0x5805f2 = createDragController({
          store: _0x3fdee8,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x20a7ec) {
            return _0x20a7ec + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x235bc9 = { ...createNodeDragContext(), targetNodeId: 'group' };
      (_0x5805f2.updateDraggingNodes(_0x235bc9, 20, 0, 20, 0, 20, 0, _0x2ecbd2),
        assert.equal(_0x2155c3.records.length, 0),
        assert.equal(_0x2155c3.edgeDomCache.get('e1').groupEl.getAttribute('transform'), 'translate(20 0)'));
      const _0xa58ddd = _0x5805f2.finishDraggingNodes(_0x235bc9, 20, 0);
      (assert.deepEqual(_0xa58ddd, { earlyCommit: false, didAct: true }),
        assert.equal(_0x2155c3.edgeDomCache.get('e1').groupEl.getAttribute('transform'), null),
        assert.equal(_0x2ecbd2.nodes.group.x, 20),
        assert.equal(_0x2ecbd2.nodes.n1.x, 30),
        assert.equal(_0x2ecbd2.nodes.n2.x, 140));
    } finally {
      _0x2155c3.restore();
    }
  }),
  test('DragController: 宫格间拖拽在分隔线位置会沿用统一命中规则', () => {
    const _0x2613e4 = {
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
    let _0x438c3a = null;
    const _0x161cb6 = {
        getStateRaw() {
          return _0x2613e4;
        },
        updateNodesData(_0x150425) {
          _0x438c3a = _0x150425;
        },
        updateNodeData() {
          throw new Error('updateNodeData should not be called in cross-storyboard move');
        },
      },
      _0x1cbd00 = createDragController({
        store: _0x161cb6,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(_0x4ade7b) {
          return _0x4ade7b + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      }),
      _0x74fe3e = _0x1cbd00.finishDraggingCell(
        {
          targetNodeId: 'sb-source',
          sourceCellIndex: 0,
          draggedCellData: _0x2613e4.nodes['sb-source'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        250,
        25,
      );
    (assert.deepEqual(_0x74fe3e, { didAct: true, committed: true }),
      assert.equal(_0x438c3a['sb-target'].cells[0].id, 'cell-src'),
      assert.equal(_0x438c3a['sb-target'].cells[0].localPath, 'output/source.png'),
      assert.equal(_0x438c3a['sb-target'].cells[1].id, 'cell-right'),
      assert.deepEqual(_0x438c3a['sb-source'].cells[0], {
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
    const _0x3672d5 = globalThis.window,
      _0x135bf0 = {
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
    let _0x34709a = null,
      _0xcd647d = null;
    const _0x586a18 = {
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
        flushNodes(_0x1334a6) {
          return ((_0xcd647d = _0x1334a6), true);
        },
      },
    };
    const _0x14458e = {
      getStateRaw() {
        return _0x135bf0;
      },
      updateNodesData(_0x19604a) {
        _0x34709a = _0x19604a;
      },
      updateNodeData() {
        throw new Error('updateNodeData should not be called for cross-storyboard move');
      },
    };
    try {
      const _0x4b62e1 = createDragController({
          store: _0x14458e,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x55b0c4) {
            return _0x55b0c4 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x34cb87 = _0x4b62e1.finishDraggingCell(
          {
            targetNodeId: 'sb-source',
            sourceCellIndex: 0,
            draggedCellData: _0x135bf0.nodes['sb-source'].cells[0],
            ghostEl: _0x586a18,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          25,
        );
      (assert.deepEqual(_0x34cb87, { didAct: true, committed: true }),
        assert.equal(_0x34709a['sb-target'].cells[0].id, 'cell-src'),
        assert.equal(_0x34709a['sb-target'].cells[0].localPath, 'output/source.png'),
        assert.equal(_0x34709a['sb-target'].cells[0].sourceLocalPath, null),
        assert.equal(_0x34709a['sb-target'].cells[0].sourceUrl, ''),
        assert.equal(_0x34709a['sb-source'].cells[0].isEmpty, true),
        assert.deepEqual(_0xcd647d, ['sb-source', 'sb-target']),
        assert.equal(_0x586a18.removed, true));
    } finally {
      if (typeof _0x3672d5 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x3672d5;
    }
  }),
  test('DragController: 源图像拖入拼图空槽会填充槽位', () => {
    const _0x6c0bc0 = globalThis.window,
      _0x52c6b7 = globalThis.document,
      _0x5d781d = globalThis.requestAnimationFrame,
      _0x48747e = globalThis.setTimeout,
      _0x59529d = {
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
    let _0x483bb8 = null,
      _0x3b355c = null,
      _0x3535ec = null,
      _0x2647cb = 0,
      _0x4d5ebe = null;
    const _0x2e163e = {
      getStateRaw() {
        return _0x59529d;
      },
      updateNodeData(_0x2055b2, _0x54ad13) {
        ((_0x483bb8 = { nodeId: _0x2055b2, patch: _0x54ad13 }),
          (_0x59529d.nodes[_0x2055b2] = { ..._0x59529d.nodes[_0x2055b2], ..._0x54ad13 }));
      },
      setSelectedNodes(_0xafe0b6) {
        ((_0x3b355c = _0xafe0b6), (_0x59529d.selectedNodeIds = _0xafe0b6));
      },
      deleteNodes(_0x14ca41) {
        _0x3535ec = _0x14ca41;
      },
      batch(_0x188523) {
        _0x188523();
      },
      groupNodes() {},
    };
    try {
      const _0x5ef53c = {
          complete: true,
          naturalWidth: 120,
          naturalHeight: 240,
          currentSrc: '/output/a.jpg',
          src: '/output/a.jpg',
        },
        _0x4a5df9 = {
          complete: true,
          naturalWidth: 120,
          naturalHeight: 240,
          getAttribute(_0x300dd1) {
            return _0x300dd1 === 'src' ? '/output/a.jpg' : '';
          },
        };
      function _0x3d20de(_0x232144) {
        return {
          tagName: String(_0x232144).toUpperCase(),
          style: {},
          children: [],
          appendChild(_0x8bc6e3) {
            return (this.children.push(_0x8bc6e3), _0x8bc6e3);
          },
          remove() {
            this.removed = true;
          },
          setAttribute(_0x3de0a3, _0x2166e) {
            this[_0x3de0a3] = String(_0x2166e);
          },
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(..._0x443562) {
                _0x4d5ebe = _0x443562;
              },
            };
          },
        };
      }
      ((globalThis.window = {
        v2Renderer: {
          nodeInstances: new Map(),
          getMountedWrapper(_0x5b40dc) {
            if (_0x5b40dc !== 'img-1') return null;
            return {
              querySelector(_0x1f153c) {
                return _0x1f153c === 'img' ? _0x5ef53c : null;
              },
            };
          },
        },
      }),
        (globalThis.document = {
          body: {
            appendChild(_0x4a89d9) {
              return _0x4a89d9;
            },
          },
          createElement: _0x3d20de,
          querySelector(_0x441b20) {
            if (_0x441b20.includes('collage-item'))
              return {
                querySelector() {
                  return _0x4a5df9;
                },
              };
            return null;
          },
          getElementById(_0x53877e) {
            if (_0x53877e !== 'collage-1') return null;
            return {
              querySelector(_0x4a9d4b) {
                if (!_0x4a9d4b.includes('collage-item')) return null;
                return {
                  querySelector() {
                    return _0x4a5df9;
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (_0x35d174) => {
          return (_0x35d174(), 1);
        }),
        (globalThis.setTimeout = (_0x45fb7e) => {
          return (_0x45fb7e(), 1);
        }));
      const _0x1b8f15 = createDragController({
          store: _0x2e163e,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return 'img-1';
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x13e2a4) {
            return _0x13e2a4 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x2647cb += 1;
          },
        }),
        _0x17f724 = _0x1b8f15.finishDraggingNodes(
          { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
          125,
          125,
        );
      (assert.deepEqual(_0x17f724, { earlyCommit: true, didAct: true }),
        assert.equal(_0x483bb8.nodeId, 'collage-1'),
        assert.equal(_0x483bb8.patch.items[0].id, 'collage-item-generated'),
        assert.equal(_0x483bb8.patch.items[0].url, '/output/a.jpg'),
        assert.equal(_0x483bb8.patch.items[0].localPath, 'output/a.jpg'),
        assert.equal(_0x483bb8.patch.items[0].sourceNodeId, 'img-1'),
        assert.equal(_0x483bb8.patch.items[0].sourceDisplayWidth, 120),
        assert.equal(_0x483bb8.patch.items[0].sourceDisplayHeight, 240),
        assert.equal(_0x4d5ebe.length, 9),
        assert.equal(_0x4d5ebe[0], _0x5ef53c),
        assert.equal(_0x4d5ebe[5], 0),
        assert.equal(_0x4d5ebe[6], 0),
        assert.equal(_0x4d5ebe[7] > 0, true),
        assert.equal(_0x4d5ebe[8] > 0, true),
        assert.notEqual(_0x4d5ebe[3], _0x5ef53c.naturalWidth),
        assert.deepEqual(_0x3b355c, ['collage-1']),
        assert.deepEqual(_0x3535ec, ['img-1']),
        assert.equal(_0x2647cb, 1));
    } finally {
      if (typeof _0x6c0bc0 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x6c0bc0;
      if (typeof _0x52c6b7 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x52c6b7;
      if (typeof _0x5d781d === 'undefined') delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x5d781d;
      if (typeof _0x48747e === 'undefined') delete globalThis.setTimeout;
      else globalThis.setTimeout = _0x48747e;
    }
  }),
  test('DragController: source-only image drop into collage does not write source fallback', () => {
    const _0x40e233 = {
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
    let _0x455cfa = false,
      _0x35132a = false,
      _0x4785e6 = false,
      _0x3d2f8c = false;
    const _0x33a14f = {
        getStateRaw() {
          return _0x40e233;
        },
        updateNodeData() {
          _0x455cfa = true;
        },
        setSelectedNodes() {
          _0x4785e6 = true;
        },
        deleteNodes() {
          _0x35132a = true;
        },
        batch(_0x1b3021) {
          _0x1b3021();
        },
        groupNodes() {},
      },
      _0x15826b = createDragController({
        store: _0x33a14f,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return 'img-1';
        },
        screenToWorld: identityScreenToWorld,
        generateId(_0x494e63) {
          return _0x494e63 + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {
          _0x3d2f8c = true;
        },
      }),
      _0x4f5c5b = _0x15826b.finishDraggingNodes(
        { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
        125,
        125,
      );
    (assert.deepEqual(_0x4f5c5b, { earlyCommit: false, didAct: false }),
      assert.equal(_0x455cfa, false),
      assert.equal(_0x35132a, false),
      assert.equal(_0x4785e6, false),
      assert.equal(_0x3d2f8c, false));
  }),
  test('DragController: collage drop uses current visible image and clears source context', () => {
    const _0x483209 = globalThis.window,
      _0x4b8d6a = globalThis.requestAnimationFrame,
      _0x26e4bc = {
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
            sourceWidth: 0x190,
            sourceHeight: 0x12c,
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
    let _0x2aafc3 = null,
      _0x3553da = null,
      _0x568625 = null,
      _0x170a29 = 0;
    const _0x5582a0 = {
      getStateRaw() {
        return _0x26e4bc;
      },
      updateNodeData(_0x3aaa56, _0x2e4027) {
        ((_0x2aafc3 = { nodeId: _0x3aaa56, patch: _0x2e4027 }),
          (_0x26e4bc.nodes[_0x3aaa56] = { ..._0x26e4bc.nodes[_0x3aaa56], ..._0x2e4027 }));
      },
      setSelectedNodes(_0x3f8e1e) {
        ((_0x3553da = _0x3f8e1e), (_0x26e4bc.selectedNodeIds = _0x3f8e1e));
      },
      deleteNodes(_0x104542) {
        _0x568625 = _0x104542;
      },
      batch(_0x23bdf5) {
        _0x23bdf5();
      },
      groupNodes() {},
    };
    try {
      ((globalThis.window = {
        v2Renderer: {
          nodeInstances: new Map(),
          getMountedWrapper(_0x25dd61) {
            if (_0x25dd61 !== 'img-1') return null;
            return {
              querySelector(_0x674e94) {
                if (_0x674e94 !== 'img') return null;
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
        (globalThis.requestAnimationFrame = (_0x37e7c1) => {
          return (_0x37e7c1(), 1);
        }));
      const _0x2e6346 = createDragController({
          store: _0x5582a0,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return 'img-1';
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x32a229) {
            return _0x32a229 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x170a29 += 1;
          },
        }),
        _0x52698a = _0x2e6346.finishDraggingNodes(
          { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
          125,
          125,
        );
      assert.deepEqual(_0x52698a, { earlyCommit: true, didAct: true });
      const _0x3a05ed = _0x2aafc3?.patch?.items?.[0];
      (assert.equal(_0x2aafc3?.nodeId, 'collage-1'),
        assert.equal(_0x3a05ed?.url, '/output/current-visible.jpg'),
        assert.equal(_0x3a05ed?.localPath, 'output/current-visible.jpg'),
        assert.equal(_0x3a05ed?.sourceLocalPath, ''),
        assert.equal(_0x3a05ed?.sourceUrl, ''),
        assert.equal(_0x3a05ed?.sourceWidth, null),
        assert.equal(_0x3a05ed?.sourceHeight, null),
        assert.equal(_0x3a05ed?.imageWidth, 80),
        assert.equal(_0x3a05ed?.imageHeight, 40),
        assert.deepEqual(_0x3553da, ['collage-1']),
        assert.deepEqual(_0x568625, ['img-1']),
        assert.equal(_0x170a29, 1));
    } finally {
      if (typeof _0x483209 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x483209;
      if (typeof _0x4b8d6a === 'undefined') delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x4b8d6a;
    }
  }),
  test('DragController: 拼图编辑态允许源图像替换已占用槽位', () => {
    const _0x55b1bf = globalThis.window,
      _0x46254a = globalThis.requestAnimationFrame,
      _0x544024 = globalThis.setTimeout,
      _0x49bedf = {
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
    let _0x28e126 = null,
      _0xfd4472 = null,
      _0x28bb3f = null,
      _0x4a6220 = 0;
    const _0x48197a = {
      getStateRaw() {
        return _0x49bedf;
      },
      updateNodeData(_0x21b989, _0x5a4db5) {
        ((_0x28e126 = { nodeId: _0x21b989, patch: _0x5a4db5 }),
          (_0x49bedf.nodes[_0x21b989] = { ..._0x49bedf.nodes[_0x21b989], ..._0x5a4db5 }));
      },
      setSelectedNodes(_0x29b729) {
        ((_0xfd4472 = _0x29b729), (_0x49bedf.selectedNodeIds = _0x29b729));
      },
      deleteNodes(_0x49a727) {
        _0x28bb3f = _0x49a727;
      },
      batch(_0x54629d) {
        _0x54629d();
      },
      groupNodes() {},
    };
    try {
      ((globalThis.window = { v2Renderer: { nodeInstances: new Map() } }),
        (globalThis.requestAnimationFrame = (_0x41d9d8) => {
          return (_0x41d9d8(), 1);
        }),
        (globalThis.setTimeout = (_0x2e3cd1) => {
          return (_0x2e3cd1(), 1);
        }));
      const _0x3d30ff = createDragController({
          store: _0x48197a,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return 'img-1';
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x5766c2) {
            return _0x5766c2 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x4a6220 += 1;
          },
        }),
        _0x2d5bbd = _0x3d30ff.finishDraggingNodes(
          { targetNodeId: 'img-1', pendingDx: 0, pendingDy: 0 },
          175,
          125,
        );
      (assert.deepEqual(_0x2d5bbd, { earlyCommit: true, didAct: true }),
        assert.equal(_0x28e126.nodeId, 'collage-1'),
        assert.equal(_0x28e126.patch.items[1].id, 'collage-item-generated'),
        assert.equal(_0x28e126.patch.items[1].url, '/output/a.jpg'),
        assert.equal(_0x28e126.patch.items[1].localPath, 'output/a.jpg'),
        assert.equal(_0x28e126.patch.items[1].sourceNodeId, 'img-1'),
        assert.equal(_0x28e126.patch.items[1].sourceDisplayWidth, 80),
        assert.equal(_0x28e126.patch.items[1].sourceDisplayHeight, 80),
        assert.deepEqual(_0xfd4472, ['collage-1']),
        assert.deepEqual(_0x28bb3f, ['img-1']),
        assert.equal(_0x4a6220, 1));
    } finally {
      if (typeof _0x55b1bf === 'undefined') delete globalThis.window;
      else globalThis.window = _0x55b1bf;
      if (typeof _0x46254a === 'undefined') delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x46254a;
      if (typeof _0x544024 === 'undefined') delete globalThis.setTimeout;
      else globalThis.setTimeout = _0x544024;
    }
  }),
  test('DragController: 同一宫格互换会先视觉交换再提交 Store', () => {
    const _0x4f21f0 = globalThis.window,
      _0x204eb5 = {
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
      _0x1177ea = [];
    let _0x38134f = null,
      _0x5877f4 = null,
      _0x43d161 = false;
    const _0x3452c5 = {
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
              applyImmediateCellSwap(_0x52e165, _0x25b784) {
                return (
                  _0x1177ea.push('visual'),
                  assert.equal(_0x52e165, 0),
                  assert.equal(_0x25b784, 1),
                  {
                    ok: true,
                    revert() {
                      _0x43d161 = true;
                    },
                  }
                );
              },
            },
          ],
        ]),
        flushNodes(_0x85df) {
          return (_0x1177ea.push('flush'), (_0x5877f4 = _0x85df), true);
        },
      },
    };
    const _0x5cb7e6 = {
      getStateRaw() {
        return _0x204eb5;
      },
      updateNodeData(_0x20bfbd, _0x2aad78) {
        (_0x1177ea.push('store'),
          assert.equal(_0x3452c5.removed, true),
          (_0x38134f = { nodeId: _0x20bfbd, patch: _0x2aad78 }));
      },
      updateNodesData() {
        throw new Error('updateNodesData should not be called for same-storyboard move');
      },
    };
    try {
      const _0x13ca64 = createDragController({
          store: _0x5cb7e6,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x207282) {
            return _0x207282 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x151a90 = _0x13ca64.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0x204eb5.nodes['sb-1'].cells[0],
            ghostEl: _0x3452c5,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          25,
        );
      (assert.deepEqual(_0x151a90, { didAct: true, committed: true }),
        assert.deepEqual(_0x1177ea, ['visual', 'store', 'flush']),
        assert.equal(_0x38134f.nodeId, 'sb-1'),
        assert.equal(_0x38134f.patch.cells[0].id, 'cell-b'),
        assert.equal(_0x38134f.patch.cells[1].id, 'cell-a'),
        assert.deepEqual(_0x5877f4, ['sb-1']),
        assert.equal(_0x3452c5.removed, true),
        assert.equal(_0x43d161, false));
    } finally {
      if (typeof _0x4f21f0 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x4f21f0;
    }
  }),
  test('DragController: storyboard cell drop in transparent gap swaps nearest cell', () => {
    const _0x31c8b7 = globalThis.window,
      _0xdc5760 = {
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
    let _0x15f6f9 = null,
      _0x5e9bea = null,
      _0x235be1 = null;
    const _0x1a9720 = {
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
              applyImmediateCellSwap(_0x59d034, _0x36dbca) {
                return (
                  (_0x15f6f9 = [_0x59d034, _0x36dbca]),
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
        flushNodes(_0x3986e1) {
          return ((_0x235be1 = _0x3986e1), true);
        },
      },
    };
    const _0x12c3d0 = {
      getStateRaw() {
        return _0xdc5760;
      },
      updateNodeData(_0x49153d, _0xc723bd) {
        _0x5e9bea = { nodeId: _0x49153d, patch: _0xc723bd };
      },
      batch() {
        throw new Error('gap drop should resolve to a storyboard cell');
      },
    };
    try {
      const _0x4570e6 = createDragController({
          store: _0x12c3d0,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x5c0577) {
            return _0x5c0577 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x5d39db = _0x4570e6.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0xdc5760.nodes['sb-1'].cells[0],
            ghostEl: _0x1a9720,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          155,
          50,
        );
      (assert.deepEqual(_0x5d39db, { didAct: true, committed: true }),
        assert.deepEqual(_0x15f6f9, [0, 1]),
        assert.equal(_0x5e9bea.nodeId, 'sb-1'),
        assert.equal(_0x5e9bea.patch.cells[0].id, 'cell-b'),
        assert.equal(_0x5e9bea.patch.cells[1].id, 'cell-a'),
        assert.deepEqual(_0x235be1, ['sb-1']),
        assert.equal(_0x1a9720.removed, true));
    } finally {
      if (typeof _0x31c8b7 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x31c8b7;
    }
  }),
  test('DragController: storyboard cell pointerup miss reuses last hovered cell', () => {
    const _0x1c43b6 = globalThis.window,
      _0x26ea6a = {
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
    let _0x126e5a = null,
      _0x48825e = null,
      _0x1d3639 = null;
    const _0xadd9d6 = {
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
              applyImmediateCellSwap(_0x2843d7, _0x5c96cb) {
                return ((_0x126e5a = [_0x2843d7, _0x5c96cb]), { ok: true, revert() {} });
              },
            },
          ],
        ]),
        flushNodes(_0xb68b6c) {
          return ((_0x1d3639 = _0xb68b6c), true);
        },
      },
    };
    const _0xfd4588 = {
      getStateRaw() {
        return _0x26ea6a;
      },
      updateNodeData(_0x376539, _0x1f6216) {
        _0x48825e = { nodeId: _0x376539, patch: _0x1f6216 };
      },
      batch() {
        throw new Error('near miss should recover to hovered storyboard cell');
      },
    };
    try {
      const _0x147bf9 = createDragController({
          store: _0xfd4588,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x4b761e) {
            return _0x4b761e + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x4e6f5e = _0x147bf9.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0x26ea6a.nodes['sb-1'].cells[0],
            ghostEl: _0xadd9d6,
            sourceCellEl: null,
            lastHoverNodeId: 'sb-1',
            lastHoverCellIndex: 1,
            lastHoverKind: 'storyboard',
          },
          206,
          50,
        );
      (assert.deepEqual(_0x4e6f5e, { didAct: true, committed: true }),
        assert.deepEqual(_0x126e5a, [0, 1]),
        assert.equal(_0x48825e.nodeId, 'sb-1'),
        assert.equal(_0x48825e.patch.cells[0].id, 'cell-b'),
        assert.equal(_0x48825e.patch.cells[1].id, 'cell-a'),
        assert.deepEqual(_0x1d3639, ['sb-1']),
        assert.equal(_0xadd9d6.removed, true));
    } finally {
      if (typeof _0x1c43b6 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x1c43b6;
    }
  }),
  test('DragController: storyboard cell swap locks current grid pixels', () => {
    const _0x2b7aeb = globalThis.window,
      _0x136bfb = globalThis.document,
      _0x91d23e = {
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
      _0xf12c97 = [],
      _0x2e00b2 = {
        complete: true,
        naturalWidth: 200,
        naturalHeight: 100,
        currentSrc: '/output/full.png',
        src: '/output/full.png',
        getAttribute(_0x24e291) {
          return _0x24e291 === 'src' ? '/output/full.png' : '';
        },
      };
    globalThis.document = {
      getElementById(_0x24820a) {
        if (_0x24820a !== 'cell-sb-1-0' && _0x24820a !== 'cell-sb-1-1') return null;
        return {
          querySelector(_0x289b2d) {
            return _0x289b2d === 'img.storyboard-cell-img--source-crop' ? _0x2e00b2 : null;
          },
        };
      },
      createElement(_0x4c8a52) {
        if (_0x4c8a52 !== 'canvas') return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(..._0x27fa93) {
                _0xf12c97.push(_0x27fa93);
              },
            };
          },
          toDataURL() {
            return 'data:image/jpeg;base64,' + this.width + 'x' + this.height;
          },
        };
      },
    };
    let _0xc47454 = null,
      _0x2d00ca = false,
      _0x64a26c = null;
    const _0x5e6bbc = {
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
        flushNodes(_0x4747cd) {
          return ((_0x64a26c = _0x4747cd), true);
        },
      },
    };
    const _0x3667cf = {
      getStateRaw() {
        return _0x91d23e;
      },
      updateNodeData(_0x588f60, _0x1c60d2) {
        ((_0xc47454 = { nodeId: _0x588f60, patch: _0x1c60d2 }),
          (_0x91d23e.nodes[_0x588f60] = { ..._0x91d23e.nodes[_0x588f60], ..._0x1c60d2 }));
      },
      swapStoryboardCells() {
        return ((_0x2d00ca = true), true);
      },
    };
    try {
      const _0x4ac3fe = createDragController({
          store: _0x3667cf,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x5d6d51) {
            return _0x5d6d51 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0xc0be3b = _0x4ac3fe.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0x91d23e.nodes['sb-1'].cells[0],
            ghostEl: _0x5e6bbc,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (assert.deepEqual(_0xc0be3b, { didAct: true, committed: true }),
        assert.equal(_0x2d00ca, false),
        assert.deepEqual(_0x64a26c, ['sb-1']),
        assert.equal(_0x5e6bbc.removed, true),
        assert.equal(_0xc47454.nodeId, 'sb-1'),
        assert.equal(_0xc47454.patch.cells[0].id, 'cell-b'),
        assert.equal(_0xc47454.patch.cells[1].id, 'cell-a'),
        assert.equal(_0xc47454.patch.cells[0].localPath, null),
        assert.equal(_0xc47454.patch.cells[1].localPath, null),
        assert.equal(_0xc47454.patch.cells[0].storyboardLockedCell, true),
        assert.equal(_0xc47454.patch.cells[1].storyboardLockedCell, true),
        assert.equal(_0xc47454.patch.cells[0].sourceLocalPath, null),
        assert.equal(_0xc47454.patch.cells[1].sourceLocalPath, null),
        assert.equal(_0xc47454.patch.cells[0].sourceUrl, ''),
        assert.equal(_0xc47454.patch.cells[1].sourceUrl, ''),
        assert.equal(_0xc47454.patch.cells[0].storyboardSourceCrop, false),
        assert.equal(_0xc47454.patch.cells[1].storyboardSourceCrop, false),
        assert.equal(_0xc47454.patch.cells[0].storyboardExtractedCell, false),
        assert.equal(_0xc47454.patch.cells[1].storyboardExtractedCell, false),
        assert.equal(_0xc47454.patch.cells[0].capturePreviewUrl, 'data:image/jpeg;base64,90x100'),
        assert.equal(_0xc47454.patch.cells[1].capturePreviewUrl, 'data:image/jpeg;base64,90x100'),
        assert.equal(_0xf12c97.length, 2),
        assert.deepEqual(_0xf12c97[0].slice(1, 5), [0, 0, 90, 100]),
        assert.deepEqual(_0xf12c97[1].slice(1, 5), [110, 0, 90, 100]));
    } finally {
      if (typeof _0x2b7aeb === 'undefined') delete globalThis.window;
      else globalThis.window = _0x2b7aeb;
      if (typeof _0x136bfb === 'undefined') delete globalThis.document;
      else globalThis.document = _0x136bfb;
    }
  }),
  test('DragController: storyboard cell swap locks custom grid and gap pixels', () => {
    const _0x1ebe96 = globalThis.window,
      _0x4f844e = globalThis.document,
      _0xa4f1a0 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 0x12c,
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
                sourceWidth: 0x12c,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: 'cell-b',
                localPath: 'output/b-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 0x12c,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: 'cell-c',
                localPath: 'output/c-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 0x12c,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: 'cell-d',
                localPath: 'output/d-stale.png',
                sourceUrl: '/output/full.png',
                sourceWidth: 0x12c,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
            ],
          },
        },
      },
      _0x502d78 = [],
      _0x107693 = {
        complete: true,
        naturalWidth: 0x12c,
        naturalHeight: 200,
        currentSrc: '/output/full.png',
        src: '/output/full.png',
        getAttribute(_0x4959c0) {
          return _0x4959c0 === 'src' ? '/output/full.png' : '';
        },
      };
    globalThis.document = {
      getElementById(_0x10d357) {
        if (!/^cell-sb-1-[0-3]$/.test(_0x10d357)) return null;
        return {
          querySelector(_0x265c62) {
            return _0x265c62 === 'img.storyboard-cell-img--source-crop' ? _0x107693 : null;
          },
        };
      },
      createElement(_0x15e6df) {
        if (_0x15e6df !== 'canvas') return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(..._0x3ab2cd) {
                _0x502d78.push(_0x3ab2cd);
              },
            };
          },
          toDataURL() {
            return 'data:image/jpeg;base64,' + this.width + 'x' + this.height;
          },
        };
      },
    };
    let _0x591de9 = null,
      _0x878857 = false;
    const _0xc77e80 = {
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
    const _0x2fa291 = {
      getStateRaw() {
        return _0xa4f1a0;
      },
      updateNodeData(_0x5a2506, _0x52e199) {
        ((_0x591de9 = { nodeId: _0x5a2506, patch: _0x52e199 }),
          (_0xa4f1a0.nodes[_0x5a2506] = { ..._0xa4f1a0.nodes[_0x5a2506], ..._0x52e199 }));
      },
      swapStoryboardCells() {
        return ((_0x878857 = true), true);
      },
    };
    try {
      const _0x3bfde2 = createDragController({
          store: _0x2fa291,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x4c7cc0) {
            return _0x4c7cc0 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x1f58b5 = _0x3bfde2.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0xa4f1a0.nodes['sb-1'].cells[0],
            ghostEl: _0xc77e80,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (assert.deepEqual(_0x1f58b5, { didAct: true, committed: true }),
        assert.equal(_0x878857, false),
        assert.equal(_0xc77e80.removed, true),
        assert.equal(_0x591de9.nodeId, 'sb-1'),
        assert.equal(_0x591de9.patch.cells[0].id, 'cell-d'),
        assert.equal(_0x591de9.patch.cells[3].id, 'cell-a'),
        assert.equal(_0x591de9.patch.cells[0].capturePreviewUrl, 'data:image/jpeg;base64,65x140'),
        assert.equal(_0x591de9.patch.cells[3].capturePreviewUrl, 'data:image/jpeg;base64,215x40'),
        assert.deepEqual(_0x502d78[0].slice(1, 5), [0, 0, 215, 40]),
        assert.deepEqual(_0x502d78[1].slice(1, 5), [235, 60, 65, 140]));
    } finally {
      if (typeof _0x1ebe96 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x1ebe96;
      if (typeof _0x4f844e === 'undefined') delete globalThis.document;
      else globalThis.document = _0x4f844e;
    }
  }),
  test('DragController: storyboard swap locks node-level puzzle source pieces', () => {
    const _0xf0e5d1 = globalThis.window,
      _0x6d5148 = globalThis.document,
      _0x278fb9 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-node-source': {
            id: 'sb-node-source',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 0x12c,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            storyboardSourceLocalPath: 'output/full-node.png',
            storyboardSourceWidth: 0x12c,
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
      _0x2185d4 = [],
      _0x4036ef = {
        complete: true,
        naturalWidth: 0x12c,
        naturalHeight: 200,
        currentSrc: '/output/full-node.png',
        src: '/output/full-node.png',
        getAttribute(_0x515813) {
          return _0x515813 === 'src' ? '/output/full-node.png' : '';
        },
      };
    globalThis.document = {
      getElementById(_0x1e0e9d) {
        if (/^cell-sb-node-source-[0-3]$/.test(_0x1e0e9d))
          return {
            querySelector() {
              return null;
            },
          };
        if (_0x1e0e9d === 'sb-node-sb-node-source')
          return {
            querySelector(_0x59c734) {
              return _0x59c734 === '.storyboard-source-backdrop' ? _0x4036ef : null;
            },
          };
        return null;
      },
      createElement(_0x571af6) {
        if (_0x571af6 !== 'canvas') return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: '',
              drawImage(..._0x3fe17c) {
                _0x2185d4.push(_0x3fe17c);
              },
            };
          },
          toDataURL() {
            return 'data:image/jpeg;base64,' + this.width + 'x' + this.height;
          },
        };
      },
    };
    let _0x3d258d = null,
      _0xddf20e = false;
    const _0x4c2a32 = {
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
    const _0x46755b = {
      getStateRaw() {
        return _0x278fb9;
      },
      updateNodeData(_0x587fb6, _0x615c4) {
        ((_0x3d258d = { nodeId: _0x587fb6, patch: _0x615c4 }),
          (_0x278fb9.nodes[_0x587fb6] = { ..._0x278fb9.nodes[_0x587fb6], ..._0x615c4 }));
      },
      swapStoryboardCells() {
        return ((_0xddf20e = true), true);
      },
    };
    try {
      const _0x5a05f4 = createDragController({
          store: _0x46755b,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x3ae8a9) {
            return _0x3ae8a9 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x4c7f2c = _0x5a05f4.finishDraggingCell(
          {
            targetNodeId: 'sb-node-source',
            sourceCellIndex: 0,
            draggedCellData: _0x278fb9.nodes['sb-node-source'].cells[0],
            ghostEl: _0x4c2a32,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (assert.deepEqual(_0x4c7f2c, { didAct: true, committed: true }),
        assert.equal(_0xddf20e, false),
        assert.equal(_0x4c2a32.removed, true),
        assert.equal(_0x3d258d.nodeId, 'sb-node-source'),
        assert.equal(_0x3d258d.patch.cells[0].id, 'piece-d'),
        assert.equal(_0x3d258d.patch.cells[3].id, 'piece-a'),
        assert.equal(_0x3d258d.patch.cells[0].capturePreviewUrl, 'data:image/jpeg;base64,65x140'),
        assert.equal(_0x3d258d.patch.cells[3].capturePreviewUrl, 'data:image/jpeg;base64,215x40'),
        assert.deepEqual(_0x2185d4[0].slice(1, 5), [0, 0, 215, 40]),
        assert.deepEqual(_0x2185d4[1].slice(1, 5), [235, 60, 65, 140]));
    } finally {
      if (typeof _0xf0e5d1 === 'undefined') delete globalThis.window;
      else globalThis.window = _0xf0e5d1;
      if (typeof _0x6d5148 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x6d5148;
    }
  }),
  test('DragController: source-backed storyboard source missing uses actual visible asset', () => {
    const _0x4cd40b = globalThis.window,
      _0x722306 = globalThis.document,
      _0x22fc49 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          'sb-1': {
            id: 'sb-1',
            type: 'storyboard',
            x: 0,
            y: 0,
            width: 0x12c,
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
                sourceWidth: 0x12c,
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
    let _0x34875b = false,
      _0xa0aced = false,
      _0x4319ca = false,
      _0x28429d = false;
    const _0x2eeaa1 = {
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    ((globalThis.document = {
      getElementById() {
        return null;
      },
      createElement(_0x4869e7) {
        if (_0x4869e7 !== 'canvas') return { style: {} };
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
                      _0x34875b = true;
                    },
                  };
                },
              },
            ],
          ]),
          flushNodes() {
            return ((_0x28429d = true), true);
          },
        },
      }));
    const _0x261ad6 = {
      getStateRaw() {
        return _0x22fc49;
      },
      updateNodeData() {
        _0x4319ca = true;
      },
      swapStoryboardCells() {
        return ((_0xa0aced = true), true);
      },
    };
    try {
      const _0xf924c2 = createDragController({
          store: _0x261ad6,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x47ecd5) {
            return _0x47ecd5 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x3e7e70 = _0xf924c2.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0x22fc49.nodes['sb-1'].cells[0],
            ghostEl: _0x2eeaa1,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (assert.deepEqual(_0x3e7e70, { didAct: true, committed: true }),
        assert.equal(_0xa0aced, false),
        assert.equal(_0x4319ca, true),
        assert.equal(_0x28429d, true),
        assert.equal(_0x34875b, false),
        assert.equal(_0x2eeaa1.removed, true));
    } finally {
      if (typeof _0x4cd40b === 'undefined') delete globalThis.window;
      else globalThis.window = _0x4cd40b;
      if (typeof _0x722306 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x722306;
    }
  }),
  test('DragController: 同一宫格视觉互换后 Store 失败会回滚', () => {
    const _0x4d9582 = globalThis.window,
      _0x2f1005 = {
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
    let _0x121335 = false,
      _0x32d2f4 = false;
    const _0x3ef2e5 = {
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
                    _0x121335 = true;
                  },
                };
              },
            },
          ],
        ]),
        flushNodes() {
          return ((_0x32d2f4 = true), true);
        },
      },
    };
    const _0x3b0f2d = {
      getStateRaw() {
        return _0x2f1005;
      },
      swapStoryboardCells() {
        return false;
      },
    };
    try {
      const _0x13aec0 = createDragController({
          store: _0x3b0f2d,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x1e504b) {
            return _0x1e504b + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x5e5f9e = _0x13aec0.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0x2f1005.nodes['sb-1'].cells[0],
            ghostEl: _0x3ef2e5,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          25,
        );
      (assert.deepEqual(_0x5e5f9e, { didAct: false, committed: false }),
        assert.equal(_0x3ef2e5.removed, true),
        assert.equal(_0x121335, true),
        assert.equal(_0x32d2f4, false));
    } finally {
      if (typeof _0x4d9582 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x4d9582;
    }
  }),
  test('DragController: 同源提取图放回宫格优先保留实际显示图', () => {
    const _0x23dbe2 = globalThis.document,
      _0xc402f4 = globalThis.window,
      _0x151fc4 = globalThis.requestAnimationFrame,
      _0xbe2b94 = globalThis.setTimeout,
      _0x27c9c0 = {
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
            storyboardSourceWidth: 0x190,
            storyboardSourceHeight: 0x320,
            cells: [
              {
                id: 'cell-empty',
                isEmpty: true,
                url: '',
                residualImageLocalPath: 'output/full-source.jpg',
                residualImageUrl: '/output/full-source.jpg',
                residualImageWidth: 0x190,
                residualImageHeight: 0x320,
                residualImageMode: 'source',
              },
              { id: 'cell-right', isEmpty: true, url: '' },
            ],
          },
        },
      },
      _0x3cdb3d = [];
    let _0x3d88fd = null,
      _0x57dc84 = null,
      _0x32d79b = null,
      _0x99cad = 0;
    function _0x4b5a48(_0x5d9e9b) {
      const _0x56be90 = {
        tagName: String(_0x5d9e9b).toUpperCase(),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: '',
        appendChild(_0x619150) {
          return (this.children.push(_0x619150), _0x619150);
        },
        setAttribute(_0x2a470c, _0x559da1) {
          this[_0x2a470c] = String(_0x559da1);
        },
        getAttribute(_0x3564f3) {
          return this[_0x3564f3] || '';
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
      return (_0x3cdb3d.push(_0x56be90), _0x56be90);
    }
    try {
      ((globalThis.window = globalThis),
        (globalThis.v2Renderer = {
          getMountedWrapper(_0x5b181b) {
            if (_0x5b181b !== 'n1') return null;
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
            appendChild(_0x4ce8ed) {
              return (_0x3cdb3d.push(_0x4ce8ed), _0x4ce8ed);
            },
          },
          createElement: _0x4b5a48,
          getElementById(_0x197666) {
            if (_0x197666 !== 'cell-sb-1-0') return null;
            return {
              querySelector() {
                return {
                  complete: false,
                  naturalWidth: 0,
                  getAttribute(_0x5c55a6) {
                    return _0x5c55a6 === 'src' ? '/output/extracted.jpg' : '';
                  },
                };
              },
            };
          },
        }),
        (globalThis.requestAnimationFrame = (_0x5762a1) => {
          return (_0x5762a1(), 1);
        }),
        (globalThis.setTimeout = (_0x1c1aa5) => {
          return (_0x1c1aa5(), 1);
        }));
      const _0x1ae414 = {
          getStateRaw() {
            return _0x27c9c0;
          },
          updateNodeData(_0x35ae7a, _0x4dabdb) {
            ((_0x3d88fd = { nodeId: _0x35ae7a, patch: _0x4dabdb }),
              (_0x27c9c0.nodes[_0x35ae7a] = { ..._0x27c9c0.nodes[_0x35ae7a], ..._0x4dabdb }));
          },
          setSelectedNodes(_0x3d6616) {
            ((_0x57dc84 = _0x3d6616), (_0x27c9c0.selectedNodeIds = [..._0x3d6616]));
          },
          deleteNodes(_0x321917) {
            _0x32d79b = _0x321917;
          },
          moveNodes() {},
          batch(_0x5eb5e7) {
            _0x5eb5e7();
          },
          groupNodes() {},
        },
        _0xb899b3 = createDragController({
          store: _0x1ae414,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x24611e) {
            return _0x24611e + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            _0x99cad += 1;
          },
        }),
        _0x3eef7e = _0xb899b3.finishDraggingNodes(createNodeDragContext(), 125, 50);
      (assert.deepEqual(_0x3eef7e, { earlyCommit: true, didAct: true }),
        assert.equal(_0x3d88fd?.nodeId, 'sb-1'),
        assert.deepEqual(_0x3d88fd?.patch?.cells?.[0], {
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
          residualImageWidth: 0x190,
          residualImageHeight: 0x320,
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
        assert.deepEqual(_0x57dc84, []),
        assert.deepEqual(_0x32d79b, ['n1']),
        assert.equal(_0x99cad, 1));
      const _0x2a8406 = _0x3cdb3d.find((_0x4cb3e8) => _0x4cb3e8.className === 'v2-ghost-image');
      assert.equal(_0x2a8406?.removed, true);
    } finally {
      if (_0x23dbe2 === undefined) delete globalThis.document;
      else globalThis.document = _0x23dbe2;
      if (_0xc402f4 === undefined) delete globalThis.window;
      else globalThis.window = _0xc402f4;
      if (_0x151fc4 === undefined) delete globalThis.requestAnimationFrame;
      else globalThis.requestAnimationFrame = _0x151fc4;
      if (_0xbe2b94 === undefined) delete globalThis.setTimeout;
      else globalThis.setTimeout = _0xbe2b94;
      delete globalThis.v2Renderer;
    }
  }),
  test('DragController: 放回的提取图再次移格会冻结实际图快照', () => {
    const _0x4d080c = {
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
    let _0x3203f0 = null;
    const _0x9e5257 = {
        remove() {
          this.removed = true;
        },
      },
      _0x117c1a = {
        getStateRaw() {
          return _0x4d080c;
        },
        updateNodeData(_0x504d03, _0x558d62) {
          ((_0x3203f0 = { nodeId: _0x504d03, patch: _0x558d62 }),
            (_0x4d080c.nodes[_0x504d03] = { ..._0x4d080c.nodes[_0x504d03], ..._0x558d62 }));
        },
      },
      _0x6a2fe7 = createDragController({
        store: _0x117c1a,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(_0x5499ce) {
          return _0x5499ce + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      }),
      _0x3ce54b = _0x6a2fe7.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: _0x4d080c.nodes['sb-1'].cells[0],
          ghostEl: _0x9e5257,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        150,
        50,
      );
    (assert.deepEqual(_0x3ce54b, { didAct: true, committed: true }),
      assert.equal(_0x3203f0.nodeId, 'sb-1'),
      assert.equal(_0x4d080c.nodes['sb-1'].cells[1].localPath, 'output/extracted.jpg'),
      assert.equal(_0x4d080c.nodes['sb-1'].cells[1].sourceLocalPath, null),
      assert.equal(_0x4d080c.nodes['sb-1'].cells[1].sourceUrl, ''),
      assert.equal(_0x4d080c.nodes['sb-1'].cells[1].storyboardSourceCrop, false),
      assert.equal(_0x4d080c.nodes['sb-1'].cells[1].storyboardPiece, false),
      assert.equal(_0x9e5257.removed, true));
  }),
  test('DragController: 多轮交换后拖出仍使用当前显示图', () => {
    const _0x5de33b = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
      edges: {},
      nodes: {
        'sb-1': {
          id: 'sb-1',
          type: 'storyboard',
          x: 0,
          y: 0,
          width: 0x12c,
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
    let _0x1dd365 = null;
    const _0x307086 = {
        getStateRaw() {
          return _0x5de33b;
        },
        updateNodeData(_0x196e4e, _0x5e678c) {
          _0x5de33b.nodes[_0x196e4e] = { ..._0x5de33b.nodes[_0x196e4e], ..._0x5e678c };
        },
        batch(_0x24139c) {
          _0x24139c();
        },
        addNode(_0x52b678) {
          ((_0x1dd365 = _0x52b678), (_0x5de33b.nodes[_0x52b678.id] = _0x52b678));
        },
        setSelectedNodes(_0x79bd68) {
          _0x5de33b.selectedNodeIds = _0x79bd68;
        },
      },
      _0x120bb5 = createDragController({
        store: _0x307086,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(_0x19245f) {
          return _0x19245f + '-generated';
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      });
    (assert.deepEqual(
      _0x120bb5.finishDraggingCell(
        {
          targetNodeId: 'sb-1',
          sourceCellIndex: 0,
          draggedCellData: _0x5de33b.nodes['sb-1'].cells[0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        150,
        50,
      ),
      { didAct: true, committed: true },
    ),
      assert.equal(_0x5de33b.nodes['sb-1'].cells[1].localPath, 'output/a.png'),
      assert.deepEqual(
        _0x120bb5.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 1,
            draggedCellData: _0x5de33b.nodes['sb-1'].cells[1],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          50,
        ),
        { didAct: true, committed: true },
      ),
      assert.equal(_0x5de33b.nodes['sb-1'].cells[2].localPath, 'output/a.png'),
      assert.equal(_0x5de33b.nodes['sb-1'].cells[2].sourceLocalPath, null),
      assert.equal(_0x5de33b.nodes['sb-1'].cells[2].storyboardPiece, false),
      assert.deepEqual(
        _0x120bb5.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 2,
            draggedCellData: _0x5de33b.nodes['sb-1'].cells[2],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          0x1f4,
          50,
        ),
        { didAct: true, committed: true },
      ),
      assert.equal(_0x1dd365?.src, '/output/a.png'),
      assert.equal(_0x1dd365?.localPath, 'output/a.png'),
      assert.equal(_0x5de33b.nodes['sb-1'].cells[2].isEmpty, true));
  }),
  test('DragController: source crop without visible image no-ops before visual swap', () => {
    const _0x19afce = globalThis.window,
      _0x4995bd = globalThis.document,
      _0x31451f = {
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
    let _0x461318 = false,
      _0x288ce6 = false;
    const _0x21651d = {
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
                  return ((_0x461318 = true), { ok: true, revert() {} });
                },
              },
            ],
          ]),
        },
      }));
    const _0x360cb9 = {
      getStateRaw() {
        return _0x31451f;
      },
      updateNodeData() {
        _0x288ce6 = true;
      },
    };
    try {
      const _0x291473 = createDragController({
          store: _0x360cb9,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(_0x1af160) {
            return _0x1af160 + '-generated';
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        _0x58e141 = _0x291473.finishDraggingCell(
          {
            targetNodeId: 'sb-1',
            sourceCellIndex: 0,
            draggedCellData: _0x31451f.nodes['sb-1'].cells[0],
            ghostEl: _0x21651d,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (assert.deepEqual(_0x58e141, { didAct: false, committed: false }),
        assert.equal(_0x461318, false),
        assert.equal(_0x288ce6, false),
        assert.equal(_0x21651d.removed, true));
    } finally {
      if (typeof _0x19afce === 'undefined') delete globalThis.window;
      else globalThis.window = _0x19afce;
      if (typeof _0x4995bd === 'undefined') delete globalThis.document;
      else globalThis.document = _0x4995bd;
    }
  }));
