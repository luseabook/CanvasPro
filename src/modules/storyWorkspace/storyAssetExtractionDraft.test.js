import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStoryAssetPaidRerunChoiceDescriptor,
  createStoryAssetPaidRerunChoiceGate,
  getStoryAssetExperimentalDraftDisplay,
  getStoryAssetModelChangeRerunKinds,
  getStoryAssetPaidRerunBlockedBatches,
  getStoryAssetPaidRerunBlockedLanes,
  isStoryAssetLocalQualityRevalidationDraft,
  isStoryAssetPlannedContinuationDraft,
} from './storyAssetExtractionDraft.js';

test('blocked lanes come from kind states and the paid quality review', () => {
  assert.deepEqual(getStoryAssetPaidRerunBlockedLanes(), []);
  const draft = {
    kindStates: {
      prop: { status: ' blocked-incompatible ' },
      character: { status: 'failed', errorType: 'ambiguous-submission' },
      scene: { status: 'authoritative-source-changed' },
    },
  };
  assert.deepEqual(getStoryAssetPaidRerunBlockedLanes(draft), [
    {
      kind: 'character',
      label: '角色',
      status: 'blocked-ambiguous-submission',
      reason: '请求已提交，但计费状态不明确',
    },
    {
      kind: 'scene',
      label: '场景',
      status: 'blocked-source-changed',
      reason: '权威剧本正文已变化，旧付费结果不能安全复用',
    },
    { kind: 'prop', label: '道具', status: 'blocked-incompatible', reason: '付费结果与当前合同不兼容' },
  ]);
  const quality = {
    kindStates: { scene: { status: 'blocked-paid-response' }, character: { status: 7 } },
    qualityReview: { recoveryMode: 'paid-rerun-required', kinds: ['character', ' prop ', 'music', 3] },
  };
  assert.deepEqual(
    getStoryAssetPaidRerunBlockedLanes(quality).map((lane) => [lane.kind, lane.status]),
    [
      ['character', 'blocked-quality-rerun'],
      ['scene', 'blocked-paid-response'],
      ['prop', 'blocked-quality-rerun'],
    ],
  );
  const notRequired = { qualityReview: { recoveryMode: 'local', kinds: ['character'] }, kindStates: [] };
  assert.deepEqual(getStoryAssetPaidRerunBlockedLanes(notRequired), []);
});

test('model-change reruns need a blocked paid response that was already repaired', () => {
  const draft = {
    kindStates: {
      character: { status: 'blocked-paid-response', repairCount: '2' },
      scene: { status: 'blocked-paid-response', repairCount: 0.9 },
      prop: { status: 'blocked-incompatible', repairCount: 3 },
    },
  };
  assert.deepEqual(getStoryAssetModelChangeRerunKinds(draft), ['character']);
  assert.deepEqual(getStoryAssetModelChangeRerunKinds(null), []);
});

test('blocked batches are sorted by key and labelled by stage', () => {
  const draft = {
    batchSubmissionRecords: {
      'b-2': { status: 'submitted', stage: 'detail', kinds: ['scene', ' scene ', '', 5] },
      'b-1': { status: 'response-received', stage: 'inventory', batchId: 'inv-1' },
      'b-3': { status: 'response-received', rawResponse: '{"assets":[]}' },
      '  ': { status: 'blocked-incompatible', batchKey: 'fallback-key', stage: 'repair' },
      'b-4': { status: 'blocked-source-changed', stage: 'other' },
      'b-5': { status: 'succeeded' },
    },
  };
  assert.deepEqual(getStoryAssetPaidRerunBlockedBatches(draft), [
    {
      batchKey: 'fallback-key',
      batchId: 'fallback-key',
      stage: 'repair',
      kinds: [],
      status: 'blocked-incompatible',
      label: '归并批次 fallback-key',
      reason: '付费结果与当前合同不兼容',
    },
    {
      batchKey: 'b-1',
      batchId: 'inv-1',
      stage: 'inventory',
      kinds: [],
      status: 'blocked-paid-response',
      label: '清单批次 inv-1',
      reason: '已收到付费响应，但本地没有可复验的完整原始结果',
    },
    {
      batchKey: 'b-2',
      batchId: 'b-2',
      stage: 'detail',
      kinds: ['scene'],
      status: 'blocked-ambiguous-submission',
      label: '提示词批次 b-2',
      reason: '请求已提交，但计费状态不明确',
    },
    {
      batchKey: 'b-4',
      batchId: 'b-4',
      stage: 'other',
      kinds: [],
      status: 'blocked-source-changed',
      label: '素材批次 b-4',
      reason: '权威剧本正文已变化，旧付费结果不能安全复用',
    },
  ]);
  assert.deepEqual(
    getStoryAssetPaidRerunBlockedBatches({ batchSubmissionRecords: [{ status: 'submitted' }] }),
    [],
  );
});

test('the rerun descriptor summarises lanes and batches', () => {
  const lanes = [
    { label: '角色', reason: '付费结果未通过本地校验' },
    { label: '', reason: '' },
  ];
  // 端口行为：空标签的项不进说明文字，但仍计入「重跑 N 路」
  assert.deepEqual(createStoryAssetPaidRerunChoiceDescriptor(lanes), {
    title: '处理已阻断的素材线路',
    message:
      '角色：付费结果未通过本地校验。以上阻断项没有可安全复验的完整本地结果。确认重跑将仅重新调用以上 2 路 API，可能再次计费；成功线路会直接复用，原始结果会保留',
    choices: [
      { label: '取消', value: null, autofocus: true },
      { label: '确认仅重跑 2 路', value: 'paid-rerun', primary: true },
    ],
  });
  const batches = [{ label: '清单批次 inv-1', reason: '请求已提交，但计费状态不明确' }];
  const mixed = createStoryAssetPaidRerunChoiceDescriptor(lanes.slice(0, 1), batches, {
    allowLocalRevalidate: true,
  });
  assert.equal(mixed.title, '处理已阻断的素材批次');
  assert.equal(
    mixed.message,
    '角色：付费结果未通过本地校验。清单批次 inv-1：请求已提交，但计费状态不明确。免费本地重校验不会调用 API。确认重跑将仅重新调用以上 2 项 API，可能再次计费；成功线路和批次会直接复用，原始结果会保留',
  );
  assert.deepEqual(
    mixed.choices.map((choice) => [choice.label, choice.value]),
    [
      ['取消', null],
      ['免费本地重校验', 'local-revalidate'],
      ['确认仅重跑 2 项', 'paid-rerun'],
    ],
  );
  assert.equal(createStoryAssetPaidRerunChoiceDescriptor('x', null).choices[1].label, '确认仅重跑 0 路');
});

const blockedDraft = () => ({
  kindStates: { character: { status: 'blocked-paid-response' } },
  rawResponsesByKind: { character: '{"assets":[]}' },
  batchSubmissionRecords: { 'b-1': { status: 'blocked-paid-response', rawResponse: '{}' } },
});

test('the gate reports drafts without blockers', async () => {
  const gate = createStoryAssetPaidRerunChoiceGate();
  let asked = 0;
  assert.deepEqual(await gate({ draft: {}, requestChoice: () => (asked += 1) }), {
    action: 'not-blocked',
    blockedLanes: [],
    blockedBatches: [],
    paidRerunAuthorization: null,
  });
  assert.equal(asked, 0);
  assert.equal((await gate()).action, 'not-blocked');
});

test('a paid rerun choice authorizes exactly the blocked kinds and batches', async () => {
  const gate = createStoryAssetPaidRerunChoiceGate();
  const offered = [];
  const result = await gate({
    draft: blockedDraft(),
    requestChoice: async (descriptor) => (offered.push(descriptor), 'paid-rerun'),
  });
  assert.equal(offered[0].choices[1].value, 'local-revalidate');
  assert.equal(result.action, 'paid-rerun');
  assert.deepEqual(result.paidRerunAuthorization, {
    confirmed: true,
    authorizedKinds: ['character'],
    authorizedBatchIds: ['b-1'],
  });
  const lanesOnly = await gate({
    draft: { kindStates: { scene: { status: 'blocked-incompatible' } } },
    requestChoice: () => 'paid-rerun',
  });
  assert.deepEqual(lanesOnly.paidRerunAuthorization, { confirmed: true, authorizedKinds: ['scene'] });
});

test('local revalidation is offered only when every blocker has a stored raw response', async () => {
  const gate = createStoryAssetPaidRerunChoiceGate();
  const local = await gate({ draft: blockedDraft(), requestChoice: () => 'local-revalidate' });
  assert.deepEqual([local.action, local.paidRerunAuthorization], ['local-revalidate', null]);
  const missingRaw = blockedDraft();
  missingRaw.batchSubmissionRecords['b-1'].rawResponse = '  ';
  const offered = [];
  const result = await gate({
    draft: missingRaw,
    requestChoice: (descriptor) => (
      offered.push(descriptor.choices.map((choice) => choice.value)),
      'local-revalidate'
    ),
  });
  assert.deepEqual(offered, [[null, 'paid-rerun']]);
  assert.deepEqual([result.action, result.paidRerunAuthorization], ['cancelled', null]);
});

test('stale answers and missing choosers do not authorize anything', async () => {
  const gate = createStoryAssetPaidRerunChoiceGate();
  const stale = await gate({
    draft: blockedDraft(),
    requestChoice: () => 'paid-rerun',
    isCurrent: () => false,
  });
  assert.deepEqual([stale.action, stale.paidRerunAuthorization], ['stale', null]);
  const noChooser = await gate({ draft: blockedDraft() });
  assert.equal(noChooser.action, 'cancelled');
  assert.deepEqual(
    noChooser.blockedLanes.map((lane) => lane.kind),
    ['character'],
  );
  assert.deepEqual(
    noChooser.blockedBatches.map((batch) => batch.batchKey),
    ['b-1'],
  );
  const notAFunction = await gate({
    draft: blockedDraft(),
    requestChoice: () => 'paid-rerun',
    isCurrent: 'yes',
  });
  assert.equal(notAFunction.action, 'paid-rerun');
});

test('the gate is busy while a choice is pending and recovers after errors', async () => {
  const gate = createStoryAssetPaidRerunChoiceGate();
  let answer;
  const pending = gate({
    draft: blockedDraft(),
    requestChoice: () => new Promise((resolve) => (answer = resolve)),
  });
  const busy = await gate({ draft: blockedDraft(), requestChoice: () => 'paid-rerun' });
  assert.deepEqual([busy.action, busy.paidRerunAuthorization], ['busy', null]);
  answer(null);
  assert.equal((await pending).action, 'cancelled');
  await assert.rejects(
    gate({
      draft: blockedDraft(),
      requestChoice: () => {
        throw new Error('dialog failed');
      },
    }),
    { message: 'dialog failed' },
  );
  assert.equal(
    (await gate({ draft: blockedDraft(), requestChoice: () => 'paid-rerun' })).action,
    'paid-rerun',
  );
});

const evidenceDraft = (overrides = {}) => ({
  strategy: 'evidence-batched-api-v3',
  status: 'partial',
  progress: { stage: 'detail', current: 2, total: 5 },
  inventory: { assets: [{}, {}, {}, {}] },
  completedAssets: [{}, {}, {}],
  ...overrides,
});

test('planned continuation drafts are partial evidence runs with work left', () => {
  const planned = (overrides) => isStoryAssetPlannedContinuationDraft(evidenceDraft(overrides));
  assert.equal(planned(), true);
  assert.equal(planned({ completedAssets: [{}, {}, {}, {}] }), false);
  assert.equal(planned({ strategy: 'evidence-batched-api-vx' }), false);
  assert.equal(planned({ status: 'completed' }), false);
  assert.equal(planned({ failures: [{}] }), false);
  assert.equal(planned({ kindStates: { prop: { status: 'blocked-incompatible' } } }), false);
  assert.equal(planned({ batchSubmissionRecords: { b: { status: 'submitted' } } }), false);
  assert.equal(planned({ progress: { stage: 'inventory', current: 3, total: 3 } }), false);
  assert.equal(planned({ progress: { stage: 'repair', current: 1, total: 3 } }), true);
  assert.equal(isStoryAssetPlannedContinuationDraft(), false);
});

test('local scan drafts describe their progress and first failures', () => {
  const display = getStoryAssetExperimentalDraftDisplay({
    strategy: 'local-pp-uie-v1',
    status: 'failed',
    progress: { message: ' 扫描到第 3 段 ' },
    failures: [
      { batchId: 'w1', errorType: 'timeout' },
      { errorType: 'local-model' },
      { batchId: 'w3', errorType: 'weird' },
      { batchId: 'w4', errorType: 'auth' },
    ],
  });
  assert.deepEqual(display, {
    hasProgress: true,
    failureCount: 4,
    retryCount: 1,
    summary: '扫描到第 3 段 · 本地扫描 w1：超时 · 本地扫描：本地模型不可用 · 本地扫描 w3：请求失败',
    actionLabel: '继续开发测试',
  });
  assert.deepEqual(
    getStoryAssetExperimentalDraftDisplay({ strategy: 'local-pp-uie-v1', status: 'completed' }),
    {
      hasProgress: false,
      failureCount: 0,
      retryCount: 0,
      summary: '',
      actionLabel: '开发测试',
    },
  );
});

test('inventory-only drafts count failed windows once', () => {
  const display = getStoryAssetExperimentalDraftDisplay({
    strategy: 'inventory-only-v4',
    status: 'partial',
    progress: { message: '清单进行中' },
    failures: [
      { batchId: 'w1', batchLabel: '第 1 窗', errorType: 'rate-limit' },
      { batchId: 'w1', errorType: 'rate-limit' },
      { stage: 'repair', assetRefs: ['a', 'b'], errorType: 'invalid-json' },
      { stage: 'repair', assetRefs: ['a', 'b'], errorType: 'length' },
    ],
  });
  assert.deepEqual(display, {
    hasProgress: true,
    failureCount: 2,
    retryCount: 2,
    summary: '清单 第 1 窗：限流 · 清单 w1：限流 · 归并校验：格式错误',
    actionLabel: '重试未完成窗口（2）',
  });
  assert.deepEqual(
    getStoryAssetExperimentalDraftDisplay({ strategy: 'inventory-only-v4', status: 'completed' }),
    {
      hasProgress: false,
      failureCount: 0,
      retryCount: 0,
      summary: '',
      actionLabel: '提取角色、场景与道具',
    },
  );
  assert.deepEqual(
    getStoryAssetExperimentalDraftDisplay({ strategy: 'inventory-only-v4', progress: { message: '等待' } }),
    {
      hasProgress: true,
      failureCount: 0,
      retryCount: 1,
      summary: '等待',
      actionLabel: '继续素材提取',
    },
  );
});

test('evidence drafts show coverage, remaining work and why the last batch stopped', () => {
  const inventory = getStoryAssetExperimentalDraftDisplay(
    evidenceDraft({
      progress: { stage: 'inventory', current: 2, total: 5 },
      failures: [{ errorType: 'incomplete-output' }],
    }),
  );
  assert.deepEqual(inventory, {
    hasProgress: true,
    failureCount: 1,
    retryCount: 3,
    summary: '清单：已覆盖 2/5 场 · 剩余 3 场待继续 · 上批输出不完整，未自动重试',
    actionLabel: '继续剩余 3 场',
  });
  const oldRole = getStoryAssetExperimentalDraftDisplay(
    evidenceDraft({ failures: [{ errorMessage: '角色 role 只能是主角、配角、反派或路人' }] }),
  );
  assert.equal(oldRole.summary, '素材：已完成 3/4 个 · 剩余 1 个待继续 · 上批被旧角色分类规则拦截，现已修复');
  assert.equal(oldRole.actionLabel, '继续剩余 1 个');
  const missing = getStoryAssetExperimentalDraftDisplay(
    evidenceDraft({ failures: [{ errorMessage: '缺少 2 个资产结果' }] }),
  );
  assert.match(missing.summary, / · 上批输出不完整，未自动重试$/);
  const validation = getStoryAssetExperimentalDraftDisplay(
    evidenceDraft({
      completedAssets: [{}, {}, {}, {}],
      status: 'completed',
      failures: [{ errorType: 'validation' }],
    }),
  );
  assert.deepEqual(
    [validation.summary, validation.retryCount, validation.actionLabel],
    ['素材：已完成 4/4 个 · 上批结果校验未通过，未自动重试', 0, '提取角色、场景与道具'],
  );
  const blocked = getStoryAssetExperimentalDraftDisplay(
    evidenceDraft({
      kindStates: { prop: { status: 'blocked-incompatible' } },
      batchSubmissionRecords: { b: { status: 'submitted' } },
    }),
  );
  assert.deepEqual([blocked.retryCount, blocked.actionLabel], [2, '处理已阻断（2）']);
  assert.deepEqual(
    getStoryAssetExperimentalDraftDisplay({
      strategy: 'evidence-batched-api-v1',
      progress: { message: '准备中' },
    }),
    { hasProgress: true, failureCount: 0, retryCount: 0, summary: '准备中', actionLabel: '继续素材提取' },
  );
});

test('kind-state drafts list each lane and pick the most urgent action', () => {
  const display = getStoryAssetExperimentalDraftDisplay({
    kindStates: {
      character: { status: 'succeeded', assetCount: '4' },
      scene: { status: 'failed', errorType: 'call-limit' },
      prop: { status: 'running' },
    },
  });
  assert.deepEqual(display, {
    hasProgress: true,
    failureCount: 1,
    retryCount: 2,
    summary: '角色：成功 4 个 · 场景：达到调用上限 · 道具：处理中',
    actionLabel: '重试失败项（1）',
  });
  assert.equal(
    getStoryAssetExperimentalDraftDisplay({ kindStates: { prop: { status: 'pending' } } }).actionLabel,
    '继续提取（1）',
  );
  assert.deepEqual(getStoryAssetExperimentalDraftDisplay(), {
    hasProgress: false,
    failureCount: 0,
    retryCount: 0,
    summary: '',
    actionLabel: '提取角色、场景与道具',
  });
  const blocked = getStoryAssetExperimentalDraftDisplay({
    kindStates: { scene: { status: 'blocked-incompatible' }, prop: { status: 'failed' } },
  });
  assert.deepEqual(
    [blocked.summary, blocked.failureCount, blocked.retryCount, blocked.actionLabel],
    ['场景：付费结果与当前合同不兼容 · 道具：请求失败', 1, 2, '处理已阻断（1）'],
  );
});

test('repeated repairs ask for a model change before retrying those kinds', () => {
  const display = getStoryAssetExperimentalDraftDisplay({
    kindStates: {
      character: { status: 'succeeded', assetCount: 2 },
      scene: { status: 'blocked-paid-response', repairCount: 2 },
      prop: { status: 'blocked-paid-response', repairCount: 1 },
    },
  });
  assert.equal(display.actionLabel, '换模型后仅重试场景、道具');
  assert.equal(display.needsModelChange, true);
  assert.deepEqual(display.modelChangeKinds, ['scene', 'prop']);
  assert.equal(
    display.summary,
    '角色：成功 2 个 · 场景：付费结果未通过本地校验 · 道具：付费结果未通过本地校验 · 场景、道具自动纠错后仍未返回合格结果；建议切换文本模型后仅重试场景、道具，角色结果已保留',
  );
  const mixed = getStoryAssetExperimentalDraftDisplay({
    kindStates: {
      scene: { status: 'blocked-paid-response', repairCount: 2 },
      prop: { status: 'blocked-incompatible' },
    },
  });
  assert.deepEqual([mixed.actionLabel, mixed.needsModelChange], ['处理已阻断（2）', true]);
});

test('local quality revalidation needs validation failures with stored assets', () => {
  const draft = {
    kindStates: {
      character: { status: 'succeeded' },
      scene: { status: 'failed', errorType: 'validation' },
      prop: { status: 'failed', errorType: 'validation' },
    },
    assetsByKind: { scene: [], prop: [{ id: 'p' }] },
  };
  assert.equal(isStoryAssetLocalQualityRevalidationDraft(draft), true);
  const display = getStoryAssetExperimentalDraftDisplay(draft);
  assert.equal(display.actionLabel, '重新校验（不调用 API）');
  assert.ok(display.summary.startsWith('付费提取结果已保留，待按最新规则本地复验 · '));
  assert.equal(isStoryAssetLocalQualityRevalidationDraft({ ...draft, assetsByKind: { scene: [] } }), false);
  const allSucceeded = {
    character: { status: 'succeeded' },
    scene: { status: 'succeeded' },
    prop: { status: 'succeeded' },
  };
  assert.equal(isStoryAssetLocalQualityRevalidationDraft({ kindStates: allSucceeded }), false);
  // 端口行为：只要带质量复核对象且不要求付费重跑，就算可本地复验
  assert.equal(isStoryAssetLocalQualityRevalidationDraft({ qualityReview: {} }), true);
  assert.equal(
    isStoryAssetLocalQualityRevalidationDraft({ qualityReview: { recoveryMode: 'paid-rerun-required' } }),
    false,
  );
  assert.equal(isStoryAssetLocalQualityRevalidationDraft(null), false);
  assert.equal(isStoryAssetLocalQualityRevalidationDraft('draft'), false);
});
