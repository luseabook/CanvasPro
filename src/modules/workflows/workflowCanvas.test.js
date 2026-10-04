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
function cssHexColor(value) {
  return '' + CSS_HASH + value;
}
function cssRgbaColor(item, key, index, result) {
  return CSS_RGBA_FUNCTION + '(' + item + ', ' + key + ', ' + index + ', ' + result + ')';
}
function escapeRegexText(data) {
  return String(data).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function assertSvgContains(options, target) {
  assert.match(options, new RegExp(escapeRegexText(target)));
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
  const error = createWorkflowFromCanvas(sampleCanvas(), {
    name: '  ' + 'n'.repeat(60) + '  ',
    note: 'x'.repeat(0x190),
    tags: ['tag', ' tag ', 'LONG_TAG_VALUE', 'B', 'C', 'D', 'E'],
    cover: '/cover.png',
  });
  (assert.equal(error.name.length, 50),
    assert.equal(error.note.length, 0x12c),
    assert.deepEqual(error.tags, ['tag', 'LONG_TAG_VAL', 'B', 'C', 'D']),
    assert.equal(error.cover, '/cover.png'),
    assert.equal(error.workflowData.nodes.length, 2),
    assert.equal(error.workflowData.edges.length, 1),
    assert.equal('scope' in error, false));
}),
  test('workflow: createWorkflowFromCanvas syncs single root group name to workflow name', () => {
    const error2 = createWorkflowFromCanvas(
      {
        nodes: [
          { id: 'g', type: 'group', name: '旧组名', x: 0, y: 0 },
          { id: 'image-1', type: 'ai-image', parentId: 'g', x: 20, y: 20 },
        ],
        edges: [],
      },
      { name: '123' },
    );
    (assert.equal(error2.name, '123'),
      assert.equal(error2.workflowData.nodes.find((item2) => item2.id === 'g').name, '123'));
  }),
  test('workflow: updateWorkflowFromCanvas preserves identity and refreshes content', () => {
    const existingWorkflow = createWorkflowFromCanvas(sampleCanvas(), {
        id: 'workflow-1',
        name: 'Old',
        tags: ['old'],
      }),
      error3 = updateWorkflowFromCanvas(
        existingWorkflow.id,
        { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        { existingWorkflow: existingWorkflow, name: 'New', tags: ['new'] },
      );
    (assert.equal(error3.id, 'workflow-1'),
      assert.equal(error3.createdAt, existingWorkflow.createdAt),
      assert.equal(error3.name, 'New'),
      assert.deepEqual(error3.tags, ['new']),
      assert.equal(error3.nodeCount, 0),
      assert.equal('scope' in error3, false));
  }),
  test('workflow: updateWorkflowFromCanvas syncs single root group name to workflow name', () => {
    const updateWorkflowFromCanvas2 = updateWorkflowFromCanvas(
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
    assert.equal(
      updateWorkflowFromCanvas2.workflowData.nodes.find((item3) => item3.id === 'g').name,
      '新工作流名',
    );
  }),
  test('workflow: filterWorkflows searches name tags and note', () => {
    const source = [
      { id: '1', name: 'Alpha', tags: ['draw'], note: '', updatedAt: 100 },
      { id: '2', name: 'Mine', tags: ['Scene'], note: 'step by step', updatedAt: 0x12c },
      { id: '3', name: 'Other', tags: [], note: 'nothing', updatedAt: 200 },
    ];
    (assert.deepEqual(
      filterWorkflows(source, 'scene').map((item4) => item4.id),
      ['2'],
    ),
      assert.deepEqual(
        filterWorkflows(source, 'draw').map((item5) => item5.id),
        ['1'],
      ),
      assert.deepEqual(
        filterWorkflows(source, '').map((item6) => item6.id),
        ['2', '3', '1'],
      ));
  }),
  test('workflow: extractWorkflowCoverCandidates uses stable node thumbnails', () => {
    const list = extractWorkflowCoverCandidates({
      n1: { id: 'n1', name: 'A', localPath: 'data/uploads/a.png' },
      n2: { id: 'n2', name: 'B', images: [{ imageUrl: '/b.png' }] },
      n3: { id: 'n3', name: 'C', thumbUrl: '/b.png' },
    });
    (assert.equal(list.length, 2),
      assert.equal(list[0].src, '/data/uploads/a.png'),
      assert.equal(list[1].src, '/b.png'));
  }),
  test('workflow: extractWorkflowCoverCandidates prefers generated output covers', () => {
    const list2 = extractWorkflowCoverCandidates([
      { id: 'input', type: 'source-image', name: '参考图', imageUrl: '/input.png' },
      { id: 'output', type: 'ai-image', name: '生成图', imageUrl: '/output.png' },
      { id: 'video', type: 'ai-video', name: '生成视频', coverUrl: '/video.png' },
    ]);
    assert.deepEqual(
      list2.map((item7) => item7.src),
      ['/output.png', '/video.png', '/input.png'],
    );
  }),
  test('workflow: createWorkflowSnapshotCoverCandidate renders workflow style cover', () => {
    const workflowSnapshotCoverCandidate = createWorkflowSnapshotCoverCandidate(sampleCanvas(), {
      title: '组合',
    });
    (assert.equal(workflowSnapshotCoverCandidate.id, WORKFLOW_SNAPSHOT_COVER_ID),
      assert.equal(workflowSnapshotCoverCandidate.label, '工作流快照'),
      assert.match(workflowSnapshotCoverCandidate.src, /^data:image\/svg\+xml;charset=utf-8,/),
      assert.equal(isSvgDataImageCover(workflowSnapshotCoverCandidate.src), true));
    const decodeURIComponent2 = decodeURIComponent(workflowSnapshotCoverCandidate.src.split(',')[1]);
    (assert.match(decodeURIComponent2, /aria-label="workflow snapshot"/),
      assert.match(decodeURIComponent2, /stroke="url\(#frameGlow\)"/),
      assert.match(decodeURIComponent2, />2 节点 · 1 连线</));
  }),
  test('workflow: createWorkflowSnapshotCoverCandidate uses root group color theme', () => {
    const workflowSnapshotCoverCandidate2 = createWorkflowSnapshotCoverCandidate({
        nodes: [
          { id: 'g', type: 'group', color: 'var(--red)', x: 0, y: 0, width: 0x168, height: 220 },
          { id: 'text-1', type: 'source-text', parentId: 'g', x: 32, y: 48, width: 120, height: 72 },
        ],
        edges: [],
      }),
      decodeURIComponent3 = decodeURIComponent(workflowSnapshotCoverCandidate2.src.split(',')[1]),
      cssHexColor2 = cssHexColor('ef4444'),
      cssRgbaColor2 = cssRgbaColor(239, 68, 68, 0.6);
    (assertSvgContains(decodeURIComponent3, '<stop offset="0" stop-color="' + cssHexColor2 + '"/>'),
      assertSvgContains(decodeURIComponent3, '<stop offset="1" stop-color="' + cssRgbaColor2 + '"/>'),
      assertSvgContains(decodeURIComponent3, '<circle cx="320" cy="50" r="9" fill="' + cssHexColor2 + '"'),
      assertSvgContains(decodeURIComponent3, 'stroke="' + cssHexColor2 + '" stroke-width="1" opacity="0.9"'));
  }),
  test('workflow: remapWorkflowNodeIds remaps nodes edges and parentId', () => {
    const {
      nodes: nodes,
      edges: edges,
      idMap: idMap,
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
    (assert.equal(nodes.length, 2),
      assert.notEqual(nodes[0].id, 'g'),
      assert.equal(nodes[1].parentId, idMap.g),
      assert.equal(edges.length, 1),
      assert.equal(edges[0].sourceId, idMap.g),
      assert.equal(edges[0].targetId, idMap.c));
  }),
  test('workflow: collectWorkflowGroupNodeIds collects group and descendants only', () => {
    const args = collectWorkflowGroupNodeIds(
      {
        g: { id: 'g', type: 'group' },
        a: { id: 'a', parentId: 'g' },
        b: { id: 'b', parentId: 'a' },
        x: { id: 'x' },
      },
      'g',
    );
    assert.deepEqual([...args].sort(), ['a', 'b', 'g']);
  }),
  test('workflow: sliceCanvasStateForWorkflow keeps only selected group nodes and internal edges', () => {
    const sliceCanvasStateForWorkflow2 = sliceCanvasStateForWorkflow(
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
      sliceCanvasStateForWorkflow2.nodes.map((item8) => item8.id),
      ['g', 'a', 'b'],
    ),
      assert.deepEqual(
        sliceCanvasStateForWorkflow2.edges.map((item9) => item9.id),
        ['e1'],
      ));
  }),
  test('workflow: calcWorkflowCenterOffset aligns bbox center', () => {
    const calcWorkflowCenterOffset2 = calcWorkflowCenterOffset(
      [{ id: 'a', x: 0, y: 0, width: 100, height: 100 }],
      {
        x: 0x12c,
        y: 0x190,
      },
    );
    assert.deepEqual(calcWorkflowCenterOffset2, { dx: 250, dy: 0x15e });
  }),
  test('workflow: applyWorkflowToCanvas keeps relative layout', () => {
    const workflowFromCanvas = createWorkflowFromCanvas(sampleCanvas(), { name: 'Apply' }),
      canvas = applyWorkflowToCanvas(workflowFromCanvas, { x: 0x1f4, y: 0x1f4 });
    (assert.equal(canvas.nodes.length, 2), assert.equal(canvas.edges.length, 1));
    const next = canvas.nodes[1].x - canvas.nodes[0].x,
      current = canvas.nodes[1].y - canvas.nodes[0].y;
    (assert.equal(next, 160), assert.equal(current, 40));
  }),
  test('workflow: applyWorkflowToCanvas names single root group after workflow name', () => {
    const entry = {
        name: '导入后的组名',
        workflowData: {
          nodes: [
            { id: 'g', type: 'group', name: '历史旧名', x: 0, y: 0 },
            { id: 'image-1', type: 'ai-image', parentId: 'g', x: 20, y: 20 },
          ],
          edges: [],
        },
      },
      canvas2 = applyWorkflowToCanvas(entry, { x: 100, y: 100 }),
      error4 = canvas2.nodes.find((item10) => item10.type === 'group');
    assert.equal(error4.name, '导入后的组名');
  }),
  test('workflow: applyWorkflowToCanvas does not rename multiple root groups', () => {
    const record = {
        name: '不要覆盖多个组',
        workflowData: {
          nodes: [
            { id: 'g1', type: 'group', name: '组1', x: 0, y: 0 },
            { id: 'g2', type: 'group', name: '组2', x: 200, y: 0 },
          ],
          edges: [],
        },
      },
      canvas3 = applyWorkflowToCanvas(record, { x: 100, y: 100 });
    assert.deepEqual(
      canvas3.nodes
        .filter((item11) => item11.type === 'group')
        .map((error5) => error5.name)
        .sort(),
      ['组1', '组2'],
    );
  }),
  test('workflow: buildWorkflowContentPreviewItems shows node content and skips wrapper group', () => {
    const list3 = buildWorkflowContentPreviewItems({
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
    (assert.equal(list3.length, 2),
      assert.equal(list3[0].id, 'text-1'),
      assert.equal(list3[0].typeLabel, '文本'),
      assert.equal(list3[0].title, '脚本'),
      assert.equal(list3[0].summary, '第一段文案'),
      assert.equal(list3[1].id, 'image-1'),
      assert.equal(list3[1].typeLabel, 'AI 图片'),
      assert.equal(list3[1].summary, '海边人物特写'),
      assert.equal(list3[1].thumbSrc, '/covers/a.png'));
  }),
  test('workflow: buildWorkflowSourceSummary describes source and suggests metadata', () => {
    const workflowSourceSummary = buildWorkflowSourceSummary(
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
    (assert.equal(workflowSourceSummary.sourceLabel, '当前节点组'),
      assert.equal(workflowSourceSummary.nodeCount, 3),
      assert.equal(workflowSourceSummary.contentNodeCount, 2),
      assert.equal(workflowSourceSummary.edgeCount, 1),
      assert.equal(workflowSourceSummary.suggestedName, '商品图批处理工作流'),
      assert.deepEqual(workflowSourceSummary.suggestedTags, ['文本', '图片']),
      assert.equal(workflowSourceSummary.typeSummary, '文本 1 · AI 图片 1'));
  }),
  test('workflow: preview summaries and cover labels follow active locale', () => {
    setLocale('en-US', { persist: false, notify: false });
    const workflowContentPreviewItems = buildWorkflowContentPreviewItems({
      workflowData: {
        nodes: [
          { id: 'group-1', type: 'group', name: 'Batch', x: 0, y: 0 },
          { id: 'image-1', type: 'ai-image', thumbUrl: '/covers/a.png', x: 10, y: 20 },
        ],
      },
    });
    (assert.equal(workflowContentPreviewItems[0].typeLabel, 'AI Image'),
      assert.equal(workflowContentPreviewItems[0].placeholderLabel, 'Image'),
      assert.equal(workflowContentPreviewItems[0].summary, 'Contains Image content'));
    const workflowSourceSummary2 = buildWorkflowSourceSummary(
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
    (assert.equal(workflowSourceSummary2.sourceLabel, 'Current group'),
      assert.equal(workflowSourceSummary2.suggestedName, 'Batch workflow'),
      assert.deepEqual(workflowSourceSummary2.suggestedTags, ['Text', 'Image']),
      assert.match(workflowSourceSummary2.typeSummary, /AI Image 1/),
      assert.match(workflowSourceSummary2.typeSummary, /Text 1/));
    const workflowSnapshotCoverCandidate3 = createWorkflowSnapshotCoverCandidate(sampleCanvas());
    assert.equal(workflowSnapshotCoverCandidate3.label, 'Workflow snapshot');
    const decodeURIComponent4 = decodeURIComponent(workflowSnapshotCoverCandidate3.src.split(',')[1]);
    assert.match(decodeURIComponent4, />Nodes 2 · Connections 1</);
  }),
  test('store: workflow slice manages list and modal state', () => {
    const store = createStore();
    (store.setWorkflows([{ id: 'w1', name: 'one' }]),
      store.upsertWorkflow({ id: 'w2', name: 'two' }),
      store.updateWorkflowLocal('w1', { name: 'one updated' }),
      store.markWorkflowUsed('w2', 123),
      store.openWorkflowModal({ tab: 'update', sourceGroupId: 'group-1' }),
      store.setWorkflowDraft({ name: 'draft', tags: ['a'] }),
      store.closeWorkflowModal());
    const payload = store.getState();
    (assert.equal(payload.workflows.items.length, 2),
      assert.equal(payload.workflows.items.find((item12) => item12.id === 'w1').name, 'one updated'),
      assert.equal(payload.workflows.items.find((item13) => item13.id === 'w2').lastUsedAt, 123),
      assert.equal(payload.workflowUi.modalOpen, false),
      assert.equal(payload.workflowUi.draft.name, ''),
      assert.equal(payload.workflowUi.sourceGroupId, null),
      assert.equal('activeScope' in payload.workflowUi, false));
  }));
