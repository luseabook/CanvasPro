import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentPlanLifecycle } from './agentPlanLifecycle.js';
import { QWEN_IMAGE_EDIT_MODEL_ID, resolveModelExecution } from '../../manifests/index.js';

const REAL_LABEL = resolveModelExecution(QWEN_IMAGE_EDIT_MODEL_ID, {})?.modelManifest?.displayName;

function makeLifecycle({
  nodes = {},
  edges = {},
  selectedNodeIds = [],
  locale = 'zh-CN',
  formatText = null,
  isSafeAction = () => true,
} = {}) {
  const state = { nodes, edges, selectedNodeIds };
  const seen = [];
  const lifecycle = createAgentPlanLifecycle({
    readCanvasState: () => state,
    localeProvider: () => locale,
    formatText:
      formatText ??
      ((key) => {
        seen.push(key);
        return `<${key}>`;
      }),
    isSafeAction,
  });
  return { lifecycle, state, seen };
}

function makeNode(overrides = {}) {
  return { id: 'n1', type: 'ai-image', name: '海报', ...overrides };
}

test('计划生命周期：readCanvasState 与 isSafeAction 缺一即抛 TypeError，公开面冻结 4 键', () => {
  assert.throws(() => createAgentPlanLifecycle({}), TypeError);
  assert.throws(
    () => createAgentPlanLifecycle({ readCanvasState: () => ({}) }),
    /readCanvasState and isSafeAction are required/,
  );
  assert.throws(() => createAgentPlanLifecycle({ isSafeAction: () => true }), /\[agentPlanLifecycle\]/);
  const { lifecycle } = makeLifecycle({});
  assert.deepEqual(Object.keys(lifecycle), ['describe', 'partition', 'recover', 'review']);
  assert.equal(Object.isFrozen(lifecycle), true);
});

test('动作描述：命令名映射为文案 key，未列入表的命令原样返回，node.create 再按节点种类细分', () => {
  const { lifecycle } = makeLifecycle({});
  const plan = {
    actions: [
      { type: 'node.create', args: { type: 'ai-image' } },
      { type: 'node.create', args: { type: 'ai-video' } },
      { type: 'node.create', args: { type: 'ai-audio' } },
      { type: 'node.create', args: { type: 'ai-text' } },
      { type: 'node.create', args: { type: 'source-text' } },
      { type: 'node.create', args: {} },
      { type: 'node.setPrompt' },
      { type: 'node.appendPrompt' },
      { type: 'node.setParams' },
      { type: 'graph.connect' },
      { type: 'layout.align' },
      { type: 'layout.arrangeRow' },
      { type: 'layout.arrangeColumn' },
      { type: 'layout.arrangeGrid' },
      { type: 'generation.run' },
      { type: 'generation.runBatch' },
      { type: 'node.delete' },
      { type: 'media.resetSize' },
    ],
  };
  const reviewed = lifecycle.review(plan);
  assert.deepEqual(
    reviewed.confirmationSummary.pendingActions.map((item) => item.label),
    [
      '<nodeCreateImage>',
      '<nodeCreateVideo>',
      '<nodeCreateAudio>',
      '<nodeCreateText>',
      '<nodeCreateText>',
      '<nodeCreate>',
      '<nodeSetPrompt>',
      '<nodeSetPrompt>',
      '<nodeSetParams>',
      '<graphConnect>',
      '<layoutAlign>',
      '<layoutArrangeRow>',
      '<layoutArrangeColumn>',
      '<layoutArrangeGrid>',
      '<generationRun>',
      '<generationRunBatch>',
      '<nodeDelete>',
      'media.resetSize',
    ],
  );
  // 描述项固定 4 键，args 为解析后的对象
  const first = reviewed.confirmationSummary.pendingActions[0];
  assert.deepEqual(Object.keys(first), ['type', 'label', 'args', 'promptSummary']);
  assert.deepEqual(first.args, { type: 'ai-image' });
});

test('动作描述：promptSummary 先剥标签再压空白，超 60 字符截到 57 加省略号', () => {
  const { lifecycle } = makeLifecycle({});
  const reviewed = lifecycle.review({
    actions: [
      { type: 'node.setPrompt', args: { prompt: '<b>一只</b>\n\n猫' } },
      { type: 'node.setPrompt', args: { text: '纯文本走 text 字段' } },
      { type: 'node.setPrompt', args: { prompt: 'x'.repeat(61) } },
      { type: 'node.setPrompt', args: { prompt: 'y'.repeat(60) } },
      { type: 'node.setPrompt', args: {} },
    ],
  });
  const summaries = reviewed.confirmationSummary.pendingActions.map((item) => item.promptSummary);
  assert.equal(summaries[0], '一只 猫');
  // prompt 优先于 text
  assert.equal(summaries[1], '纯文本走 text 字段');
  assert.equal(summaries[2], 'x'.repeat(57) + '...');
  assert.equal(summaries[3], 'y'.repeat(60));
  assert.equal(summaries[4], '');
});

test('作用域解析：$ 前缀整体命中才替换，顶层键须自有属性，路径断裂回落原串', () => {
  const { lifecycle } = makeLifecycle({});
  const scope = {
    node: { id: 'n9', tags: ['a', 'b'], empty: '' },
    list: [{ name: 'first' }],
    zero: 0,
  };
  const reviewed = lifecycle.review({
    scope,
    actions: [
      { type: 'x', args: { a: '$node.id', b: '$node.tags.1', c: '$node.empty' } },
      { type: 'x', args: { d: '$list.0.name', e: '$zero', f: '$node.missing.deep' } },
      { type: 'x', args: { g: '$unknown.key', h: '$node', i: 'plain $node.id tail' } },
      { type: 'x', args: { j: [' $node.id ', { k: '$node.id' }], l: '$.bad', m: 'node.id' } },
    ],
  });
  const groups = reviewed.confirmationSummary.pendingActions.map((item) => item.args);
  assert.deepEqual(groups[0], { a: 'n9', b: 'b', c: '' });
  // 路径段取不到 ⇒ 整个原串回落；顶层键非自有属性同理。命中即返回值，falsy（0 / ''）也算取到
  assert.deepEqual(groups[1], { d: 'first', e: 0, f: '$node.missing.deep' });
  assert.deepEqual(groups[2], {
    g: '$unknown.key',
    h: { id: 'n9', tags: ['a', 'b'], empty: '' },
    i: 'plain $node.id tail',
  });
  // 数组与对象递归解析；`$` 后须是标识符，否则当字面量
  assert.deepEqual(groups[3], { j: ['n9', { k: 'n9' }], l: '$.bad', m: 'node.id' });
});

test('确认摘要：completedActions 与 pendingActions 分开映射，缺省为空数组，plan 其余字段透传', () => {
  const { lifecycle } = makeLifecycle({});
  const plan = {
    reply: '好的',
    intent: 'create',
    preExecutedActions: [{ type: 'node.create', args: { type: 'ai-text' } }],
    actions: [{ type: 'node.delete' }],
  };
  const reviewed = lifecycle.review(plan);
  assert.deepEqual(
    reviewed.confirmationSummary.completedActions.map((item) => item.type),
    ['node.create'],
  );
  assert.deepEqual(
    reviewed.confirmationSummary.pendingActions.map((item) => item.type),
    ['node.delete'],
  );
  assert.equal(reviewed.confirmationSummary.cancelNotice, '<cancelNotice>');
  // 展开透传 ⇒ 原字段与 confirmationSummary 并存，且 plan 未被就地改写
  assert.equal(reviewed.reply, '好的');
  assert.equal(reviewed.intent, 'create');
  assert.equal(plan.confirmationSummary, undefined);
  assert.equal(reviewed.confirmationSummary.generation, null);
  assert.deepEqual(lifecycle.review({}).confirmationSummary.pendingActions, []);
});

test('确认摘要：显式 debugTraceSummary 数组原样采用，否则由轨迹归并且最多 6 条', () => {
  const { lifecycle } = makeLifecycle({});
  const explicit = lifecycle.review(
    {},
    { debugTraceSummary: ['甲'], debugTrace: [{ type: 'params_filtered' }] },
  );
  assert.deepEqual(explicit.confirmationSummary.debugTraceSummary, ['甲']);
  const trace = [
    {
      type: 'contextual_default_applied',
      field: 'model',
      reason: 'requested model was available in context',
    },
    { type: 'contextual_default_applied', field: 'params', reason: 'ignored' },
    { type: 'params_filtered', removedParamIds: ['a', 'b'] },
    { type: 'params_filtered', removedParamIds: [] },
    { type: 'confirmation_required', reason: 'node delete requires confirmation' },
    { type: 'confirmation_required', reason: 'unlisted reason' },
    { type: 'parameter_hints_model_applied' },
    { type: 'parameter_hints_applied' },
    { type: 'parameter_hints_unsupported' },
    { type: 'unknown_trace' },
  ];
  const summary = lifecycle.review({}, { debugTrace: trace }).confirmationSummary.debugTraceSummary;
  assert.deepEqual(summary, [
    '模型选择：已使用上下文中的请求模型。',
    '参数检查：已自动忽略当前模型不支持的设置。',
    '参数检查：当前设置均受所选模型支持。',
    '确认原因：删除节点需要确认。',
    '确认原因：unlisted reason。',
    '参数识别：已选择支持你指定设置的模型。',
  ]);
  assert.equal(summary.length, 6);
  // 未知 reason 兜底文案，且空轨迹出空数组
  const reasonless = lifecycle.review({}, { debugTrace: [{ type: 'confirmation_required' }] });
  assert.deepEqual(reasonless.confirmationSummary.debugTraceSummary, ['确认原因：需要确认。']);
  assert.deepEqual(lifecycle.review({}, { debugTrace: [] }).confirmationSummary.debugTraceSummary, []);
  assert.deepEqual(lifecycle.review({}, { debugTrace: null }).confirmationSummary.debugTraceSummary, []);
});

test('生成摘要：计划里没有生成命令时整段为 null', () => {
  const { lifecycle } = makeLifecycle({});
  assert.equal(lifecycle.review({ actions: [{ type: 'node.create' }] }).confirmationSummary.generation, null);
  assert.equal(lifecycle.review({}).confirmationSummary.generation, null);
});

test('生成摘要：取首个生成命令，run 用 nodeId、runBatch 用 nodeIds 并给出批量数', () => {
  const { lifecycle, seen } = makeLifecycle({ nodes: { n1: makeNode() } });
  const single = lifecycle.review({
    actions: [
      { type: 'node.create' },
      { type: 'generation.run', args: { nodeId: ' n1 ' } },
      { type: 'generation.runBatch', args: { nodeIds: ['n1', '', 'n2'] } },
    ],
  }).confirmationSummary.generation;
  assert.equal(single.nodeId, 'n1');
  assert.deepEqual(single.nodeIds, ['n1']);
  assert.equal(single.batchSize, 1);
  const batch = lifecycle.review({
    actions: [{ type: 'generation.runBatch', args: { nodeIds: ['n1', 'missing', ''] } }],
  }).confirmationSummary.generation;
  assert.equal(batch.batchSize, 2);
  assert.equal(batch.nodeId, 'n1');
  // 找不到生成节点时 nodeId 为空串、批次为 0，模型回落文案 key
  const empty = lifecycle.review({ actions: [{ type: 'generation.run' }] }).confirmationSummary.generation;
  assert.equal(empty.nodeId, '');
  assert.equal(empty.batchSize, 0);
  assert.equal(empty.model, '');
  assert.equal(empty.modelLabel, '<defaultModel>');
  assert.equal(seen.includes('defaultModel'), true);
  // 非数组 nodeIds 视作空
  assert.equal(
    lifecycle.review({ actions: [{ type: 'generation.runBatch', args: { nodeIds: 'n1' } }] })
      .confirmationSummary.generation.batchSize,
    0,
  );
});

test('生成摘要：节点字段决定模型与提示词，未知模型时 resolveModelExecution 返回 null', () => {
  const { lifecycle } = makeLifecycle({
    nodes: {
      n1: makeNode({ model: 'no-such-model', provider: 'acme', prompt: '一只猫' }),
      n2: makeNode({ id: 'n2', model: 'm2', storyboardScript: { prompt: '分镜里的提示词' } }),
    },
  });
  const run = (nodeId) =>
    lifecycle.review({ actions: [{ type: 'generation.run', args: { nodeId } }] }).confirmationSummary
      .generation;
  const first = run('n1');
  assert.equal(first.model, 'no-such-model');
  assert.equal(first.modelLabel, 'no-such-model');
  assert.equal(first.provider, 'acme');
  assert.equal(first.promptSummary, '一只猫');
  assert.deepEqual(first.editableParams, []);
  // 节点无 prompt 时回落 storyboardScript.prompt；provider 缺失则取空串
  assert.equal(run('n2').promptSummary, '分镜里的提示词');
  assert.equal(run('n2').modelLabel, 'm2');
  assert.equal(run('n2').provider, '');
  // 节点不存在时不会抛错
  assert.equal(run('ghost').promptSummary, '');
});

test('生成摘要：参数为节点 generationParams 与命令 options.params 浅合并，后者优先', () => {
  const { lifecycle } = makeLifecycle({
    nodes: { n1: makeNode({ generationParams: { aspectRatio: '1:1', duration: 5 } }) },
  });
  const generation = lifecycle.review({
    actions: [
      { type: 'generation.run', args: { nodeId: 'n1', options: { params: { duration: 9, seed: 3 } } } },
    ],
  }).confirmationSummary.generation;
  assert.deepEqual(generation.params, { aspectRatio: '1:1', duration: 9, seed: 3 });
  // options.params 非对象时只保留节点参数
  assert.deepEqual(
    lifecycle.review({ actions: [{ type: 'generation.run', args: { nodeId: 'n1', options: {} } }] })
      .confirmationSummary.generation.params,
    { aspectRatio: '1:1', duration: 5 },
  );
  // 两侧都不是对象 ⇒ 空对象
  assert.deepEqual(
    lifecycle.review({ actions: [{ type: 'generation.run', args: { nodeId: 'ghost' } }] }).confirmationSummary
      .generation.params,
    {},
  );
});

test('生成摘要：可编辑参数取自真实模型 uiSchema，只留可编辑字段并翻译标签', () => {
  const { lifecycle } = makeLifecycle({
    nodes: { n1: makeNode({ model: QWEN_IMAGE_EDIT_MODEL_ID }) },
  });
  const generation = lifecycle.review({
    actions: [
      { type: 'generation.run', args: { nodeId: 'n1', options: { params: { aspectRatio: '2:3' } } } },
    ],
  }).confirmationSummary.generation;
  assert.equal(generation.modelLabel, REAL_LABEL);
  assert.equal(generation.model, QWEN_IMAGE_EDIT_MODEL_ID);
  const ids = generation.editableParams.map((item) => item.id);
  assert.equal(ids.includes('aspectRatio'), true);
  const field = generation.editableParams.find((item) => item.id === 'aspectRatio');
  // 值取自合并后的参数（自有属性），options 归一为 {value,label,selectedLabel,disabled}
  assert.equal(field.value, '2:3');
  assert.equal(typeof field.label, 'string');
  assert.equal(field.type, 'segmented');
  assert.deepEqual(Object.keys(field), [
    'id',
    'label',
    'type',
    'displayRole',
    'placement',
    'value',
    'options',
    'min',
    'max',
    'step',
  ]);
  for (const option of field.options) {
    assert.deepEqual(Object.keys(option), ['value', 'label', 'selectedLabel', 'disabled']);
    assert.equal(option.value === '' || option.value === undefined, false);
    assert.equal(String(option.label).trim() === '', false);
  }
});

test('输入源摘要：按 targetId 反查上游，选中且为图片时换文案，无上游给占位', () => {
  const { lifecycle } = makeLifecycle({
    nodes: {
      up1: { id: 'up1', type: 'ai-image', name: '参考图' },
      up2: { id: 'up2', type: 'ai-text', name: '文案' },
      up3: { id: 'up3', type: 'source-image' },
    },
    edges: {
      e1: { sourceId: 'up1', targetId: 'n1' },
      e2: { sourceId: 'up2', targetId: 'n1' },
      e3: { sourceId: 'up3', targetId: 'n1' },
      e4: { sourceId: 'ghost', targetId: 'n1' },
      e5: { sourceId: 'up2', targetId: 'other' },
    },
    selectedNodeIds: ['up1', 'up3'],
  });
  const review = (nodeId) =>
    lifecycle.review({ actions: [{ type: 'generation.run', args: { nodeId } }] }).confirmationSummary
      .generation.inputSource;
  // 选中且为图片的上游用图片文案，名称缺失回落 id；非图片上游用通用文案
  assert.equal(review('n1'), '<selectedImageInput>：参考图，<inputNode>：文案，<selectedImageInput>：up3');
  assert.equal(review('up2'), '<noInputSource>');
});

test('输入源摘要：selectedNodeIds 缺失与非图片选中都拿不到图片文案', () => {
  const { lifecycle } = makeLifecycle({
    nodes: { up: { id: 'up', type: 'ai-text', name: '文本' } },
    edges: { e: { sourceId: 'up', targetId: 'n1' } },
    selectedNodeIds: undefined,
  });
  const review = () =>
    lifecycle.review({ actions: [{ type: 'generation.run', args: { nodeId: 'n1' } }] }).confirmationSummary
      .generation.inputSource;
  assert.equal(review(), '<inputNode>：文本');
});

test('描述文案：有 recovery 时只报失败动作，标签缺失回落类型再回落固定句', () => {
  const { lifecycle } = makeLifecycle({});
  assert.equal(
    lifecycle.describe({ recovery: { failedAction: { label: '删除节点', type: 'node.delete' } } }),
    '失败动作：删除节点',
  );
  assert.equal(
    lifecycle.describe({ recovery: { failedAction: { type: 'node.delete' } } }),
    '失败动作：node.delete',
  );
  assert.equal(lifecycle.describe({ recovery: {} }), '上次生成失败，可重新规划。');
  // 兜底句也要过 truncateText ⇒ 尖括号包裹的标签被当标记剥掉，端口现状
  assert.equal(lifecycle.describe({ recovery: { failedAction: { label: '<nodeDelete>' } } }), '失败动作：');
  assert.equal(
    lifecycle.describe({ recovery: { failedAction: { label: '<b>粗</b>体' } } }),
    '失败动作： 粗 体',
  );
  assert.equal(lifecycle.describe({ recovery: null }), '');
  assert.equal(lifecycle.describe(), '');
});

test('描述文案：按 已准备 / 待确认（最多 3 项）/ 模型 / Prompt 拼句，全空回落 plan.reply', () => {
  const { lifecycle } = makeLifecycle({});
  const plan = {
    reply: '兜底回复',
    confirmationSummary: {
      completedActions: [{ label: 'a' }, { label: 'b' }],
      pendingActions: [{ label: 'p1' }, { label: 'p2' }, { label: 'p3' }, { label: 'p4' }],
      generation: { modelLabel: '模型甲', promptSummary: '提示词甲' },
    },
  };
  assert.equal(
    lifecycle.describe({ plan }),
    '已准备 2 步；待确认：p1，p2，p3；模型：模型甲；Prompt：提示词甲',
  );
  assert.equal(
    lifecycle.describe({
      plan: { reply: 'r', confirmationSummary: { pendingActions: [{ type: 't1' }, null] } },
    }),
    '待确认：t1',
  );
  assert.equal(lifecycle.describe({ plan: { reply: 'r', confirmationSummary: {} } }), 'r');
  assert.equal(lifecycle.describe({ plan: { confirmationSummary: null } }), '');
  // 非数组的两个动作列表按空处理
  assert.equal(
    lifecycle.describe({ plan: { confirmationSummary: { pendingActions: 'x' }, reply: 'z' } }),
    'z',
  );
});

test('恢复：failedIndex 有效时切分重试计划并把 aliases 并进 scope', () => {
  const { lifecycle } = makeLifecycle({});
  const plan = {
    actions: [{ type: 'node.create' }, { type: 'generation.run' }, { type: 'node.delete' }],
    preExecutedActions: [{ type: 'layout.align' }],
    scope: { keep: 1 },
  };
  const failure = {
    errorCode: 'TOP',
    raw: { result: { failedIndex: 1, aliases: { keep: 2, added: 3 } } },
  };
  const { recovery, retryPlan } = lifecycle.recover(failure, plan);
  assert.equal(recovery.errorCode, 'TOP');
  assert.deepEqual(recovery.failedAction, {
    type: 'generation.run',
    label: '<generationRun>',
    args: {},
    promptSummary: '',
  });
  assert.deepEqual(recovery.options, [
    { id: 'retry', label: '<retry>' },
    { id: 'editPrompt', label: '<editPrompt>' },
    { id: 'changeModel', label: '<changeModel>' },
    { id: 'keepPrepared', label: '<keepPrepared>' },
  ]);
  assert.deepEqual(
    retryPlan.actions.map((item) => item.type),
    ['generation.run', 'node.delete'],
  );
  assert.deepEqual(
    retryPlan.preExecutedActions.map((item) => item.type),
    ['layout.align', 'node.create'],
  );
  assert.deepEqual(retryPlan.scope, { keep: 2, added: 3 });
});

test('恢复：无有效索引时按首个生成命令定位且不切计划，errorCode 可来自 raw', () => {
  const { lifecycle } = makeLifecycle({});
  const plan = { actions: [{ type: 'node.create' }, { type: 'generation.run' }], scope: {} };
  for (const failedIndex of [undefined, -1, 'x']) {
    const { recovery, retryPlan } = lifecycle.recover(
      { raw: { result: { failedIndex }, errorCode: 'FROM_RAW' } },
      plan,
    );
    assert.equal(recovery.failedAction.type, 'generation.run', String(failedIndex));
    assert.equal(recovery.errorCode, 'FROM_RAW');
    assert.equal(retryPlan, plan);
  }
  // 越界索引 ⇒ 定位阶段就取不到动作，后面的「索引越界不切计划」分支为死代码，端口现状
  const overflow = lifecycle.recover({ raw: { result: { failedIndex: 7 } } }, plan);
  assert.equal(overflow.recovery, null);
  assert.equal(overflow.retryPlan, plan);
  // 既无索引也非生成命令 ⇒ recovery 为 null 且计划原样返回
  const none = lifecycle.recover({}, { actions: [{ type: 'node.create' }] });
  assert.equal(none.recovery, null);
  assert.deepEqual(none.retryPlan.actions, [{ type: 'node.create' }]);
  assert.equal(lifecycle.recover({}, {}).recovery, null);
});

test('恢复：索引合法但计划缺 preExecutedActions 或 scope 时按空补齐', () => {
  const { lifecycle } = makeLifecycle({});
  const { retryPlan } = lifecycle.recover(
    { raw: { result: { failedIndex: 1, aliases: 'nope' } } },
    { actions: [{ type: 'node.create' }, { type: 'node.delete' }] },
  );
  assert.deepEqual(
    retryPlan.actions.map((item) => item.type),
    ['node.delete'],
  );
  assert.deepEqual(
    retryPlan.preExecutedActions.map((item) => item.type),
    ['node.create'],
  );
  assert.deepEqual(retryPlan.scope, {});
  // 数组同样过 `typeof === 'object'` 闸门 ⇒ 被展开成数字键，端口现状
  assert.deepEqual(
    lifecycle.recover(
      { raw: { result: { failedIndex: 1, aliases: ['x'] } } },
      {
        actions: [{ type: 'node.create' }, { type: 'node.delete' }],
      },
    ).retryPlan.scope,
    { 0: 'x' },
  );
});

test('分区：首个不安全动作之前为 prefix，全部安全或首项即不安全时 prefix 为空', () => {
  const { lifecycle } = makeLifecycle({
    isSafeAction: (action) => action?.type !== 'generation.run',
  });
  const actions = [
    { type: 'node.create' },
    { type: 'layout.align' },
    { type: 'generation.run' },
    { type: 'node.delete' },
  ];
  const split = lifecycle.partition({ actions });
  assert.deepEqual(
    split.prefix.map((item) => item.type),
    ['node.create', 'layout.align'],
  );
  assert.deepEqual(
    split.pending.map((item) => item.type),
    ['generation.run', 'node.delete'],
  );
  const allSafe = makeLifecycle({ isSafeAction: () => true }).lifecycle.partition({ actions });
  assert.deepEqual(allSafe.prefix, []);
  assert.equal(allSafe.pending.length, 4);
  const firstUnsafe = makeLifecycle({
    isSafeAction: (action) => action?.type !== 'node.create',
  }).lifecycle.partition({ actions });
  assert.deepEqual(firstUnsafe.prefix, []);
  assert.equal(firstUnsafe.pending.length, 4);
  assert.deepEqual(lifecycle.partition({}), { prefix: [], pending: [] });
  assert.deepEqual(lifecycle.partition({ actions: 'x' }), { prefix: [], pending: [] });
});

test('分区：isSafeAction 每个动作恰好调用一次并收到原对象', () => {
  const seen = [];
  const { lifecycle } = makeLifecycle({
    isSafeAction: (action) => {
      seen.push(action);
      return true;
    },
  });
  const actions = [{ type: 'a' }, { type: 'b' }];
  const result = lifecycle.partition({ actions });
  assert.deepEqual(seen, actions);
  assert.equal(result.pending, actions);
});
