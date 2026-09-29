import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_VOICE_BATCH_AUDIO_PICK_ID,
  createAudioVoicePanelPickSession,
  isAudioVoiceAudioNode,
  isAudioVoiceSourceNode,
  isAudioVoiceVideoNode,
  resolveAudioVoiceSelectionTargetIds,
} from './audioVoicePanelPickSession.js';

function classListTarget() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    style: { setProperty() {}, removeProperty() {} },
  };
}

function createHarness(overrides = {}) {
  const toasts = [];
  const state = { nodes: overrides.nodes || {}, pickConnectMode: null };
  const calls = { audioTargetUiSync: [], audioPickState: [], applied: [], loads: [], sourceUiSync: 0 };
  const segments = overrides.segments || [];
  const session = createAudioVoicePanelPickSession({
    panel: classListTarget(),
    noticeElement: overrides.noticeElement ?? null,
    store: {
      getStateRaw: () => state,
      setPickConnectMode: (value) => {
        state.pickConnectMode = value;
      },
    },
    documentObject: {
      documentElement: classListTarget(),
      body: classListTarget(),
      getElementById: () => null,
      addEventListener() {},
      removeEventListener() {},
    },
    windowObject: {
      showToast: (text, level) => toasts.push([text, level]),
    },
    getSegments: () => segments,
    getSelectedSegmentIds: () => overrides.selectedSegmentIds || new Set(),
    doesSegmentSupportAudioReference: overrides.doesSegmentSupportAudioReference || (() => true),
    loadSourceNode: (node, options) => calls.loads.push([node, options]),
    applyAudioReference:
      overrides.applyAudioReference || ((node, ids) => ({ applied: true, appliedIds: ids, reason: '' })),
    syncSourceUi: () => {
      calls.sourceUiSync += 1;
    },
    syncAudioTargetUi: (ids) => calls.audioTargetUiSync.push([...ids]),
    onAudioPickStateChange: (payload) => calls.audioPickState.push(payload),
    getConnectCursor: () => 'cursor-value',
  });
  return { session, toasts, state, calls, segments, panel: null };
}

test('audioVoicePanelPickSession: 节点类型判定与批量哨兵 id', () => {
  assert.equal(AUDIO_VOICE_BATCH_AUDIO_PICK_ID, '__audioVoiceSelectedSegments__');
  for (const type of ['source-video', 'ai-video', 'video']) assert.equal(isAudioVoiceVideoNode({ type }), true);
  assert.equal(isAudioVoiceVideoNode({ type: ' source-video ' }), true);
  assert.equal(isAudioVoiceVideoNode({ type: 'source-audio' }), false);
  for (const type of ['source-audio', 'ai-audio', 'audio']) assert.equal(isAudioVoiceAudioNode({ type }), true);
  assert.equal(isAudioVoiceAudioNode({ type: 'video' }), false);
  assert.equal(isAudioVoiceSourceNode({ type: 'ai-video' }), true);
  assert.equal(isAudioVoiceSourceNode({ type: 'ai-audio' }), true);
  assert.equal(isAudioVoiceSourceNode({ type: 'ai-image' }), false);
  assert.equal(isAudioVoiceVideoNode(), false);
});

test('audioVoicePanelPickSession: 目标解析支持单句、批量哨兵与选中并集', () => {
  const segments = [{ id: 's1' }, { id: 's2' }, { id: 's3' }];
  assert.deepEqual(resolveAudioVoiceSelectionTargetIds('', [], segments), []);
  assert.deepEqual(resolveAudioVoiceSelectionTargetIds('s2', [], segments), ['s2']);
  assert.deepEqual(resolveAudioVoiceSelectionTargetIds('nope', [], segments), []);
  assert.deepEqual(
    resolveAudioVoiceSelectionTargetIds(AUDIO_VOICE_BATCH_AUDIO_PICK_ID, new Set(['s1', 's3']), segments),
    ['s1', 's3'],
  );
  assert.deepEqual(
    resolveAudioVoiceSelectionTargetIds('s2', new Set(['s2', 's3']), segments),
    ['s2', 's3'],
    '点中的句子在选中集合里且不止一句时按批量处理',
  );
  assert.deepEqual(
    resolveAudioVoiceSelectionTargetIds('s1', new Set(['s2', 's3']), segments),
    ['s1'],
    '点中的句子不在选中集合里就只处理它自己',
  );
  assert.deepEqual(resolveAudioVoiceSelectionTargetIds('s1', new Set(['s1']), segments), ['s1']);
  assert.deepEqual(
    resolveAudioVoiceSelectionTargetIds('custom-batch', ['s1'], segments, { batchId: 'custom-batch' }),
    ['s1'],
  );
});

test('audioVoicePanelPickSession: 初始快照为空，非法入参不改变状态', () => {
  const { session, toasts, calls } = createHarness();
  assert.deepEqual(session.getSnapshot(), { sourceActive: false, audioSegmentId: '', audioTargetSegmentIds: [] });
  assert.equal(session.startAudioPick(''), undefined);
  assert.equal(session.startAudioPick('   '), undefined);
  assert.equal(session.selectAudioReference({}, {}).reason, 'not-picking');
  assert.deepEqual(calls.audioPickState, []);
  assert.deepEqual(toasts, []);
});

test('audioVoicePanelPickSession: 没有可用目标句子时提示先选句子', () => {
  const { session, toasts } = createHarness();
  session.startAudioPick('s1');
  assert.deepEqual(toasts, [['toasts.selectSentenceForVoice', 'warn']]);
  assert.deepEqual(session.getSnapshot(), { sourceActive: false, audioSegmentId: '', audioTargetSegmentIds: [] });
});

test('audioVoicePanelPickSession: 不支持参考音频的句子给出专门提示', () => {
  const { session, toasts } = createHarness({
    segments: [{ id: 's1' }],
    doesSegmentSupportAudioReference: () => false,
  });
  session.startAudioPick('s1');
  assert.deepEqual(toasts, [['toasts.voiceCloneUnsupported', 'warn']]);
  assert.equal(session.canSelectAudioReference({ segmentId: 's1' }), false);
});

test('audioVoicePanelPickSession: 进入音频选择态会同步 UI 并广播状态', () => {
  const { session, toasts, calls } = createHarness({ segments: [{ id: 's1' }, { id: 's2' }] });
  assert.equal(session.canSelectAudioReference({ segmentId: 's1' }), true);
  session.startAudioPick('s1');
  assert.deepEqual(calls.audioTargetUiSync, [['s1']]);
  assert.deepEqual(calls.audioPickState, [{ active: true, segmentId: 's1', targetSegmentIds: ['s1'] }]);
  assert.equal(calls.sourceUiSync, 0, '音频选择不动源节点那一半的 UI');
  assert.deepEqual(toasts, [['toasts.audioPickStarted', 'info']]);
  assert.deepEqual(session.getSnapshot(), { sourceActive: false, audioSegmentId: 's1', audioTargetSegmentIds: ['s1'] });

  session.startAudioPick('s1');
  assert.deepEqual(session.getSnapshot().audioSegmentId, '', '再次点击同一句等于取消');
  assert.equal(toasts[toasts.length - 1][0], 'toasts.audioPickCancelled');
  assert.deepEqual(calls.audioPickState[1], { active: false, segmentId: '', targetSegmentIds: [] });
});

test('audioVoicePanelPickSession: 批量选择把选中集合带进目标列表并给出批量文案', () => {
  const { session, toasts, calls } = createHarness({
    segments: [{ id: 's1' }, { id: 's2' }],
    selectedSegmentIds: new Set(['s1', 's2']),
  });
  session.startAudioPick(AUDIO_VOICE_BATCH_AUDIO_PICK_ID);
  assert.deepEqual(calls.audioTargetUiSync, [['s1', 's2']]);
  const applied = session.selectAudioReference({ id: 'audio-1' });
  assert.deepEqual(applied, { applied: true, reason: '', appliedIds: ['s1', 's2'] });
  assert.deepEqual(toasts[toasts.length - 1], ['toasts.audioPickBatchSelected', 'success']);
  assert.equal(session.getSnapshot().audioSegmentId, '', '应用成功后退出选择态');
});

test('audioVoicePanelPickSession: 应用失败按回调给的原因返回，不误报成功', () => {
  const { session, toasts } = createHarness({
    segments: [{ id: 's1' }],
    applyAudioReference: () => ({ applied: false, appliedIds: [], reason: 'invalid' }),
  });
  session.startAudioPick('s1');
  assert.deepEqual(session.selectAudioReference({}, {}), { applied: false, reason: 'invalid', appliedIds: [] });
  assert.equal(session.getSnapshot().audioSegmentId, 's1', '失败后仍停留在选择态');
  assert.equal(toasts.filter(([text]) => text === 'toasts.audioPickSelected').length, 0);
});

test('audioVoicePanelPickSession: 应用时可顺带切换目标句子', () => {
  const { session, calls } = createHarness({ segments: [{ id: 's1' }, { id: 's2' }] });
  session.startAudioPick('s1');
  const applied = session.selectAudioReference({}, { segmentId: 's2' });
  assert.deepEqual(applied.appliedIds, ['s2']);
  assert.equal(calls.audioTargetUiSync[calls.audioTargetUiSync.length - 1][0], 's2');
});

test('audioVoicePanelPickSession: 源节点选择进入时会关掉另一种连线模式，再次点击即取消', () => {
  const { session, toasts, state } = createHarness();
  state.pickConnectMode = { active: true };
  session.startSourcePick();
  assert.deepEqual(toasts, [['toasts.sourcePickStarted', 'info']]);
  assert.deepEqual(state.pickConnectMode, { active: false }, '进入选择前先关掉另一种连线模式');

  session.startSourcePick();
  assert.equal(toasts.length, 2, '选择中再次点击等于取消，会提示一次');
  assert.equal(toasts[toasts.length - 1][0], 'toasts.sourcePickCancelled');

  session.stopAll();
  assert.equal(toasts.length, 2, 'stopAll 是静默收尾，不弹提示');
  session.stopAll();
  assert.equal(toasts.length, 2, '重复 stopAll 无副作用');

  session.startSourcePick({ toggle: false });
  assert.equal(toasts[toasts.length - 1][0], 'toasts.sourcePickStarted');
  assert.equal(toasts.length, 3);
  session.startSourcePick({ toggle: false });
  assert.equal(toasts.length, 3, 'toggle:false 时不会提示取消');

  session.destroy();
  assert.deepEqual(session.getSnapshot(), { sourceActive: false, audioSegmentId: '', audioTargetSegmentIds: [] });
  session.destroy();
});
