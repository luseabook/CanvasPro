import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../core/stores/appStore.js';
import { DEFAULT_LOCALE, setLocale } from '../../i18n/index.js';
import {
  applyWorkflowToCanvas,
  calcWorkflowCenterOffset,
  collectWorkflowGroupNodeIds,
  createWorkflowFromCanvas,
  remapWorkflowNodeIds,
  sliceCanvasStateForWorkflow,
  updateWorkflowFromCanvas,
} from './workflowCanvas.js';
import {
  WORKFLOW_SNAPSHOT_COVER_ID,
  createWorkflowSnapshotCoverCandidate,
  extractWorkflowCoverCandidates,
  isSvgDataImageCover,
} from './workflowCovers.js';
import { buildWorkflowContentPreviewItems, buildWorkflowSourceSummary } from './workflowPreview.js';
import { filterWorkflows } from './workflowSelectors.js';
const CSS_HASH = String.fromCharCode(35),
  CSS_RGBA_FUNCTION = 'rgba';
test.afterEach(() => {
  setLocale(DEFAULT_LOCALE, { persist: false, notify: false });
});
function cssHexColor(_0x1b39ee) {
  return '' + CSS_HASH + _0x1b39ee;
}
function cssRgbaColor(_0x2c0408, _0x168530, _0x3e147d, _0x4a3de7) {
  return CSS_RGBA_FUNCTION + '(' + _0x2c0408 + ', ' + _0x168530 + ', ' + _0x3e147d + ', ' + _0x4a3de7 + ')';
}
function escapeRegexText(_0x19fb64) {
  return String(_0x19fb64).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function assertSvgContains(_0x488bcb, _0x1b50dd) {
  assert.match(_0x488bcb, new RegExp(escapeRegexText(_0x1b50dd)));
}
function sampleCanvas() {
  return {
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 60 },
      { id: 'b', type: 'ai-image', parentId: 'a', x: 160, y: 40, width: 120, height: 80 },
    ],
    edges: [{ id: 'e1', sourceId: 'a', targetId: 'b' }],
    viewport: { x: 10, y: 20, zoom: 1.2 },
  };
}
(test('workflow: createWorkflowFromCanvas trims and limits metadata', () => {
  const _0x2ca906 = createWorkflowFromCanvas(sampleCanvas(), {
    name: '  ' + 'n'.repeat(60) + '  ',
    note: 'x'.repeat(0x190),
    tags: ['tag', ' tag ', 'LONG_TAG_VALUE', 'B', 'C', 'D', 'E'],
    cover: '/cover.png',
  });
  (assert.equal(_0x2ca906.name.length, 50),
    assert.equal(_0x2ca906.note.length, 0x12c),
    assert.deepEqual(_0x2ca906.tags, ['tag', 'LONG_TAG_VAL', 'B', 'C', 'D']),
    assert.equal(_0x2ca906.cover, '/cover.png'),
    assert.equal(_0x2ca906.workflowData.nodes.length, 2),
    assert.equal(_0x2ca906.workflowData.edges.length, 1),
    assert.equal('scope' in _0x2ca906, false));
}),
  test('workflow: createWorkflowFromCanvas syncs single root group name to workflow name', () => {
    const _0x42194e = createWorkflowFromCanvas(
      {
        nodes: [
          { id: 'g', type: 'group', name: '旧组名', x: 0, y: 0 },
          { id: 'image-1', type: 'ai-image', parentId: 'g', x: 20, y: 20 },
        ],
        edges: [],
      },
      { name: '123' },
    );
    (assert.equal(_0x42194e.name, '123'),
      assert.equal(_0x42194e.workflowData.nodes.find((_0x55974d) => _0x55974d.id === 'g').name, '123'));
  }),
  test('workflow: updateWorkflowFromCanvas preserves identity and refreshes content', () => {
    const _0x4d9d9d = createWorkflowFromCanvas(sampleCanvas(), {
        id: 'workflow-1',
        name: 'Old',
        tags: ['old'],
      }),
      _0x541509 = updateWorkflowFromCanvas(
        _0x4d9d9d.id,
        { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        { existingWorkflow: _0x4d9d9d, name: 'New', tags: ['new'] },
      );
    (assert.equal(_0x541509.id, 'workflow-1'),
      assert.equal(_0x541509.createdAt, _0x4d9d9d.createdAt),
      assert.equal(_0x541509.name, 'New'),
      assert.deepEqual(_0x541509.tags, ['new']),
      assert.equal(_0x541509.nodeCount, 0),
      assert.equal('scope' in _0x541509, false));
  }),
  test('workflow: updateWorkflowFromCanvas syncs single root group name to workflow name', () => {
    const _0x54d5d4 = updateWorkflowFromCanvas(
      'workflow-1',
      {
        nodes: [
          { id: 'g', type: 'group', name: '旧组名', x: 0, y: 0 },
          { id: 'text-1', type: 'source-text', parentId: 'g', x: 10, y: 10 },
        ],
        edges: [],
      },
      { name: '新工作流名' },
    );
    assert.equal(_0x54d5d4.workflowData.nodes.find((_0xe6132) => _0xe6132.id === 'g').name, '新工作流名');
  }),
  test('workflow: filterWorkflows searches name tags and note', () => {
    const _0x3f6059 = [
      { id: '1', name: 'Alpha', tags: ['draw'], note: '', updatedAt: 100 },
      { id: '2', name: 'Mine', tags: ['Scene'], note: 'step by step', updatedAt: 0x12c },
      { id: '3', name: 'Other', tags: [], note: 'nothing', updatedAt: 200 },
    ];
    (assert.deepEqual(
      filterWorkflows(_0x3f6059, 'scene').map((_0x5536f5) => _0x5536f5.id),
      ['2'],
    ),
      assert.deepEqual(
        filterWorkflows(_0x3f6059, 'draw').map((_0x4cc534) => _0x4cc534.id),
        ['1'],
      ),
      assert.deepEqual(
        filterWorkflows(_0x3f6059, '').map((_0x2dc14e) => _0x2dc14e.id),
        ['2', '3', '1'],
      ));
  }),
  test('workflow: extractWorkflowCoverCandidates uses stable node thumbnails', () => {
    const _0x170514 = extractWorkflowCoverCandidates({
      n1: { id: 'n1', name: 'A', localPath: 'data/uploads/a.png' },
      n2: { id: 'n2', name: 'B', images: [{ imageUrl: '/b.png' }] },
      n3: { id: 'n3', name: 'C', thumbUrl: '/b.png' },
    });
    (assert.equal(_0x170514.length, 2),
      assert.equal(_0x170514[0].src, '/data/uploads/a.png'),
      assert.equal(_0x170514[1].src, '/b.png'));
  }),
  test('workflow: extractWorkflowCoverCandidates prefers generated output covers', () => {
    const _0x314493 = extractWorkflowCoverCandidates([
      { id: 'input', type: 'source-image', name: '参考图', imageUrl: '/input.png' },
      { id: 'output', type: 'ai-image', name: '生成图', imageUrl: '/output.png' },
      { id: 'video', type: 'ai-video', name: '生成视频', coverUrl: '/video.png' },
    ]);
    assert.deepEqual(
      _0x314493.map((_0x35eeed) => _0x35eeed.src),
      ['/output.png', '/video.png', '/input.png'],
    );
  }),
  test('workflow: createWorkflowSnapshotCoverCandidate renders workflow style cover', () => {
    const _0xe272a3 = createWorkflowSnapshotCoverCandidate(sampleCanvas(), { title: '组合' });
    (assert.equal(_0xe272a3.id, WORKFLOW_SNAPSHOT_COVER_ID),
      assert.equal(_0xe272a3.label, '工作流快照'),
      assert.match(_0xe272a3.src, /^data:image\/svg\+xml;charset=utf-8,/),
      assert.equal(isSvgDataImageCover(_0xe272a3.src), true));
    const _0x157192 = decodeURIComponent(_0xe272a3.src.split(',')[1]);
    (assert.match(_0x157192, /aria-label="workflow snapshot"/),
      assert.match(_0x157192, /stroke="url\(#frameGlow\)"/),
      assert.match(_0x157192, />2 节点 · 1 连线</));
  }),
  test('workflow: createWorkflowSnapshotCoverCandidate uses root group color theme', () => {
    const _0x2e5e7a = createWorkflowSnapshotCoverCandidate({
        nodes: [
          { id: 'g', type: 'group', color: 'var(--red)', x: 0, y: 0, width: 0x168, height: 220 },
          { id: 'text-1', type: 'source-text', parentId: 'g', x: 32, y: 48, width: 120, height: 72 },
        ],
        edges: [],
      }),
      _0x259f70 = decodeURIComponent(_0x2e5e7a.src.split(',')[1]),
      _0x34675b = cssHexColor('ef4444'),
      _0x28e75e = cssRgbaColor(239, 68, 68, 0.6);
    (assertSvgContains(_0x259f70, '<stop offset="0" stop-color="' + _0x34675b + '"/>'),
      assertSvgContains(_0x259f70, '<stop offset="1" stop-color="' + _0x28e75e + '"/>'),
      assertSvgContains(_0x259f70, '<circle cx="320" cy="50" r="9" fill="' + _0x34675b + '"'),
      assertSvgContains(_0x259f70, 'stroke="' + _0x34675b + '" stroke-width="1" opacity="0.9"'));
  }),
  test('workflow: remapWorkflowNodeIds remaps nodes edges and parentId', () => {
    const {
      nodes: _0x3b3d34,
      edges: _0x459ea4,
      idMap: _0x45ee11,
    } = remapWorkflowNodeIds(
      [
        { id: 'g', type: 'group', x: 0, y: 0 },
        { id: 'c', type: 'text', parentId: 'g', x: 10, y: 10 },
      ],
      [
        { id: 'e1', sourceId: 'g', targetId: 'c' },
        { id: 'bad', sourceId: 'missing', targetId: 'c' },
      ],
    );
    (assert.equal(_0x3b3d34.length, 2),
      assert.notEqual(_0x3b3d34[0].id, 'g'),
      assert.equal(_0x3b3d34[1].parentId, _0x45ee11.g),
      assert.equal(_0x459ea4.length, 1),
      assert.equal(_0x459ea4[0].sourceId, _0x45ee11.g),
      assert.equal(_0x459ea4[0].targetId, _0x45ee11.c));
  }),
  test('workflow: collectWorkflowGroupNodeIds collects group and descendants only', () => {
    const _0xf3893c = collectWorkflowGroupNodeIds(
      {
        g: { id: 'g', type: 'group' },
        a: { id: 'a', parentId: 'g' },
        b: { id: 'b', parentId: 'a' },
        x: { id: 'x' },
      },
      'g',
    );
    assert.deepEqual([..._0xf3893c].sort(), ['a', 'b', 'g']);
  }),
  test('workflow: sliceCanvasStateForWorkflow keeps only selected group nodes and internal edges', () => {
    const _0x703f38 = sliceCanvasStateForWorkflow(
      {
        nodes: [
          { id: 'g', type: 'group', x: 0, y: 0 },
          { id: 'a', type: 'text', parentId: 'g', x: 10, y: 10 },
          { id: 'b', type: 'ai-image', parentId: 'a', x: 30, y: 10 },
          { id: 'x', type: 'text', x: 200, y: 200 },
        ],
        edges: [
          { id: 'e1', sourceId: 'a', targetId: 'b' },
          { id: 'e2', sourceId: 'a', targetId: 'x' },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
      {
        g: { id: 'g', type: 'group' },
        a: { id: 'a', parentId: 'g' },
        b: { id: 'b', parentId: 'a' },
        x: { id: 'x' },
      },
      'g',
    );
    (assert.deepEqual(
      _0x703f38.nodes.map((_0xf2760e) => _0xf2760e.id),
      ['g', 'a', 'b'],
    ),
      assert.deepEqual(
        _0x703f38.edges.map((_0x4263d0) => _0x4263d0.id),
        ['e1'],
      ));
  }),
  test('workflow: calcWorkflowCenterOffset aligns bbox center', () => {
    const _0x250bd7 = calcWorkflowCenterOffset([{ id: 'a', x: 0, y: 0, width: 100, height: 100 }], {
      x: 0x12c,
      y: 0x190,
    });
    assert.deepEqual(_0x250bd7, { dx: 250, dy: 0x15e });
  }),
  test('workflow: applyWorkflowToCanvas keeps relative layout', () => {
    const _0x46e902 = createWorkflowFromCanvas(sampleCanvas(), { name: 'Apply' }),
      _0x533eec = applyWorkflowToCanvas(_0x46e902, { x: 0x1f4, y: 0x1f4 });
    (assert.equal(_0x533eec.nodes.length, 2), assert.equal(_0x533eec.edges.length, 1));
    const _0x34b625 = _0x533eec.nodes[1].x - _0x533eec.nodes[0].x,
      _0x57e346 = _0x533eec.nodes[1].y - _0x533eec.nodes[0].y;
    (assert.equal(_0x34b625, 160), assert.equal(_0x57e346, 40));
  }),
  test('workflow: applyWorkflowToCanvas names single root group after workflow name', () => {
    const _0x4f6269 = {
        name: '导入后的组名',
        workflowData: {
          nodes: [
            { id: 'g', type: 'group', name: '历史旧名', x: 0, y: 0 },
            { id: 'image-1', type: 'ai-image', parentId: 'g', x: 20, y: 20 },
          ],
          edges: [],
        },
      },
      _0x2eb4d5 = applyWorkflowToCanvas(_0x4f6269, { x: 100, y: 100 }),
      _0xb14b4f = _0x2eb4d5.nodes.find((_0x26d64a) => _0x26d64a.type === 'group');
    assert.equal(_0xb14b4f.name, '导入后的组名');
  }),
  test('workflow: applyWorkflowToCanvas does not rename multiple root groups', () => {
    const _0x3b4f15 = {
        name: '不要覆盖多个组',
        workflowData: {
          nodes: [
            { id: 'g1', type: 'group', name: '组1', x: 0, y: 0 },
            { id: 'g2', type: 'group', name: '组2', x: 200, y: 0 },
          ],
          edges: [],
        },
      },
      _0x5f334d = applyWorkflowToCanvas(_0x3b4f15, { x: 100, y: 100 });
    assert.deepEqual(
      _0x5f334d.nodes
        .filter((_0x6fc07b) => _0x6fc07b.type === 'group')
        .map((_0x123d8a) => _0x123d8a.name)
        .sort(),
      ['组1', '组2'],
    );
  }),
  test('workflow: buildWorkflowContentPreviewItems shows node content and skips wrapper group', () => {
    const _0x54c91f = buildWorkflowContentPreviewItems({
      workflowData: {
        nodes: [
          { id: 'group-1', type: 'group', name: '流程组', x: 0, y: 0 },
          { id: 'text-1', type: 'source-text', name: '脚本', content: '  第一段文案  ', x: 120, y: 10 },
          {
            id: 'image-1',
            type: 'ai-image',
            prompt: '<p>海边人物特写</p>',
            thumbUrl: '/covers/a.png',
            x: 10,
            y: 20,
          },
        ],
      },
    });
    (assert.equal(_0x54c91f.length, 2),
      assert.equal(_0x54c91f[0].id, 'text-1'),
      assert.equal(_0x54c91f[0].typeLabel, '文本'),
      assert.equal(_0x54c91f[0].title, '脚本'),
      assert.equal(_0x54c91f[0].summary, '第一段文案'),
      assert.equal(_0x54c91f[1].id, 'image-1'),
      assert.equal(_0x54c91f[1].typeLabel, 'AI 图片'),
      assert.equal(_0x54c91f[1].summary, '海边人物特写'),
      assert.equal(_0x54c91f[1].thumbSrc, '/covers/a.png'));
  }),
  test('workflow: buildWorkflowSourceSummary describes source and suggests metadata', () => {
    const _0xbf8e61 = buildWorkflowSourceSummary(
      {
        nodes: [
          { id: 'group-1', type: 'group', name: '商品图批处理' },
          { id: 'text-1', type: 'source-text', name: '提示词', text: '产品棚拍' },
          { id: 'image-1', type: 'ai-image', name: '主图输出', thumbUrl: '/covers/a.png' },
        ],
        edges: [{ id: 'e1', sourceId: 'text-1', targetId: 'image-1' }],
      },
      { sourceGroupId: 'group-1', sourceName: '商品图批处理' },
    );
    (assert.equal(_0xbf8e61.sourceLabel, '当前节点组'),
      assert.equal(_0xbf8e61.nodeCount, 3),
      assert.equal(_0xbf8e61.contentNodeCount, 2),
      assert.equal(_0xbf8e61.edgeCount, 1),
      assert.equal(_0xbf8e61.suggestedName, '商品图批处理工作流'),
      assert.deepEqual(_0xbf8e61.suggestedTags, ['文本', '图片']),
      assert.equal(_0xbf8e61.typeSummary, '文本 1 · AI 图片 1'));
  }),
  test('workflow: preview summaries and cover labels follow active locale', () => {
    setLocale('en-US', { persist: false, notify: false });
    const _0x40514c = buildWorkflowContentPreviewItems({
      workflowData: {
        nodes: [
          { id: 'group-1', type: 'group', name: 'Batch', x: 0, y: 0 },
          { id: 'image-1', type: 'ai-image', thumbUrl: '/covers/a.png', x: 10, y: 20 },
        ],
      },
    });
    (assert.equal(_0x40514c[0].typeLabel, 'AI Image'),
      assert.equal(_0x40514c[0].placeholderLabel, 'Image'),
      assert.equal(_0x40514c[0].summary, 'Contains Image content'));
    const _0x1e55f8 = buildWorkflowSourceSummary(
      {
        nodes: [
          { id: 'group-1', type: 'group', name: 'Batch' },
          { id: 'text-1', type: 'source-text', name: 'Prompt', text: 'Product photo' },
          { id: 'image-1', type: 'ai-image', name: 'Output', thumbUrl: '/covers/a.png' },
        ],
        edges: [{ id: 'e1', sourceId: 'text-1', targetId: 'image-1' }],
      },
      { sourceGroupId: 'group-1', sourceName: 'Batch' },
    );
    (assert.equal(_0x1e55f8.sourceLabel, 'Current group'),
      assert.equal(_0x1e55f8.suggestedName, 'Batch workflow'),
      assert.deepEqual(_0x1e55f8.suggestedTags, ['Text', 'Image']),
      assert.match(_0x1e55f8.typeSummary, /AI Image 1/),
      assert.match(_0x1e55f8.typeSummary, /Text 1/));
    const _0x333161 = createWorkflowSnapshotCoverCandidate(sampleCanvas());
    assert.equal(_0x333161.label, 'Workflow snapshot');
    const _0x27620b = decodeURIComponent(_0x333161.src.split(',')[1]);
    assert.match(_0x27620b, />Nodes 2 · Connections 1</);
  }),
  test('store: workflow slice manages list and modal state', () => {
    const _0x43c8d4 = createStore();
    (_0x43c8d4.setWorkflows([{ id: 'w1', name: 'one' }]),
      _0x43c8d4.upsertWorkflow({ id: 'w2', name: 'two' }),
      _0x43c8d4.updateWorkflowLocal('w1', { name: 'one updated' }),
      _0x43c8d4.markWorkflowUsed('w2', 123),
      _0x43c8d4.openWorkflowModal({ tab: 'update', sourceGroupId: 'group-1' }),
      _0x43c8d4.setWorkflowDraft({ name: 'draft', tags: ['a'] }),
      _0x43c8d4.closeWorkflowModal());
    const _0x4984ee = _0x43c8d4.getState();
    (assert.equal(_0x4984ee.workflows.items.length, 2),
      assert.equal(_0x4984ee.workflows.items.find((_0x519035) => _0x519035.id === 'w1').name, 'one updated'),
      assert.equal(_0x4984ee.workflows.items.find((_0x4d3aef) => _0x4d3aef.id === 'w2').lastUsedAt, 123),
      assert.equal(_0x4984ee.workflowUi.modalOpen, false),
      assert.equal(_0x4984ee.workflowUi.draft.name, ''),
      assert.equal(_0x4984ee.workflowUi.sourceGroupId, null),
      assert.equal('activeScope' in _0x4984ee.workflowUi, false));
  }));
