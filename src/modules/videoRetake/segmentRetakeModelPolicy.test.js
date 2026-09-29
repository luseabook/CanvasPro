import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelsByKind } from '../../manifests/index.js';
import {
  SEGMENT_RETAKE_PHASE_EDITING,
  SEGMENT_RETAKE_PHASE_SUBMITTED,
  applySegmentRetakeSubmitParameterPolicy,
  buildSegmentRetakePhasePatch,
  buildSegmentRetakeSessionClearPatch,
  decorateSegmentRetakeParameterNodeData,
  decorateSegmentRetakeParameterSchemaFields,
  getSegmentRetakeAllowedModelIds,
  getSegmentRetakeAllowedModelIdsForNode,
  getSegmentRetakeParameterPolicy,
  isSegmentRetakeEditing,
  isSegmentRetakeModelSupported,
} from './segmentRetakeModelPolicy.js';

const CAPABLE_VIDEO_MODELS = getModelsByKind('video').filter(
  (manifest) => manifest?.extensions?.segmentRetake?.supported === true,
);

test('segmentRetakeModelPolicy: 两个阶段常量是 editing 与 submitted', () => {
  assert.equal(SEGMENT_RETAKE_PHASE_EDITING, 'editing');
  assert.equal(SEGMENT_RETAKE_PHASE_SUBMITTED, 'submitted');
});

test('segmentRetakeModelPolicy: 参数策略只在节点声明 segmentRetake 且模型带能力时才有值', () => {
  assert.equal(getSegmentRetakeParameterPolicy({}), null);
  assert.equal(getSegmentRetakeParameterPolicy(), null);
  assert.equal(getSegmentRetakeParameterPolicy({ segmentRetake: { model: 'zzz' } }), null);
  assert.equal(getSegmentRetakeParameterPolicy({ segmentRetake: { model: '   ' } }), null);
});

test('segmentRetakeModelPolicy: 当前仓库没有任何视频清单声明 segmentRetake 能力（接线前需补清单扩展）', () => {
  assert.deepEqual(CAPABLE_VIDEO_MODELS, []);
  assert.deepEqual(getSegmentRetakeAllowedModelIds(), []);
  assert.equal(getSegmentRetakeAllowedModelIds().length, CAPABLE_VIDEO_MODELS.length);
  assert.equal(isSegmentRetakeModelSupported('zzz'), false);
  assert.equal(isSegmentRetakeModelSupported(''), false);
  assert.equal(isSegmentRetakeModelSupported(null), false);
});

test('segmentRetakeModelPolicy: 可用模型 id 列表与清单筛选口径一致，且每次都是新数组', () => {
  const first = getSegmentRetakeAllowedModelIds();
  const second = getSegmentRetakeAllowedModelIds();
  assert.deepEqual(first, CAPABLE_VIDEO_MODELS.map((manifest) => manifest.modelId));
  assert.notEqual(first, second);
});

test('segmentRetakeModelPolicy: 节点没开 segmentRetake 时可用模型为空', () => {
  assert.deepEqual(getSegmentRetakeAllowedModelIdsForNode({}), []);
  assert.deepEqual(getSegmentRetakeAllowedModelIdsForNode(), []);
  assert.deepEqual(getSegmentRetakeAllowedModelIdsForNode({ segmentRetake: null }), []);
  assert.deepEqual(
    getSegmentRetakeAllowedModelIdsForNode({ segmentRetake: { phase: SEGMENT_RETAKE_PHASE_EDITING } }),
    getSegmentRetakeAllowedModelIds(),
  );
});

test('segmentRetakeModelPolicy: 只有 editing 阶段算编辑中', () => {
  assert.equal(isSegmentRetakeEditing({ segmentRetake: { phase: 'editing' } }), true);
  assert.equal(isSegmentRetakeEditing({ segmentRetake: { phase: 'submitted' } }), false);
  assert.equal(isSegmentRetakeEditing({ segmentRetake: {} }), false);
  assert.equal(isSegmentRetakeEditing({}), false);
  assert.equal(isSegmentRetakeEditing(), false);
});

test('segmentRetakeModelPolicy: 没有策略时装饰函数原样返回入参', () => {
  const node = { id: 'n1', segmentRetake: { phase: SEGMENT_RETAKE_PHASE_EDITING, model: 'zzz' } };
  assert.equal(decorateSegmentRetakeParameterNodeData(node), node);
  assert.deepEqual(decorateSegmentRetakeParameterNodeData(), {}, '不传参时按空节点处理，返回空对象');
});

test('segmentRetakeModelPolicy: 没有策略时 schema 字段与提交目标都原样返回', () => {
  const fields = { size: { id: 'size' } };
  assert.equal(decorateSegmentRetakeParameterSchemaFields({ segmentRetake: { model: 'zzz' } }, fields), fields);
  assert.equal(decorateSegmentRetakeParameterSchemaFields({}, fields), fields);

  const target = { foo: 1 };
  assert.equal(applySegmentRetakeSubmitParameterPolicy({ segmentRetake: { model: 'zzz' } }, target), target);
  assert.deepEqual(target, { foo: 1 }, '没有策略就不往目标里塞任何字段');
});

test('segmentRetakeModelPolicy: 没开 segmentRetake 时阶段补丁为 null', () => {
  assert.equal(buildSegmentRetakePhasePatch({}, SEGMENT_RETAKE_PHASE_EDITING), null);
  assert.equal(buildSegmentRetakePhasePatch({ segmentRetake: null }, SEGMENT_RETAKE_PHASE_EDITING), null);
});

test('segmentRetakeModelPolicy: 阶段补丁会带上新阶段与原本的字段状态', () => {
  const node = {
    id: 'n1',
    segmentRetake: { phase: SEGMENT_RETAKE_PHASE_SUBMITTED, model: 'zzz' },
    uiSchemaFieldState: { size: { disabled: true } },
  };

  const editing = buildSegmentRetakePhasePatch(node, SEGMENT_RETAKE_PHASE_EDITING);
  assert.deepEqual(editing.segmentRetake, { phase: 'editing', model: 'zzz' });
  assert.deepEqual(editing.uiSchemaFieldState, { size: { disabled: true } });
  assert.equal(Object.hasOwn(editing, 'generationParams'), true, '编辑阶段会把生成参数一并带出');

  const submitted = buildSegmentRetakePhasePatch(node, SEGMENT_RETAKE_PHASE_SUBMITTED);
  assert.deepEqual(submitted.segmentRetake, { phase: 'submitted', model: 'zzz' });
  assert.equal(Object.hasOwn(submitted, 'generationParams'), false, '非编辑阶段不带生成参数');

  assert.equal(node.segmentRetake.phase, SEGMENT_RETAKE_PHASE_SUBMITTED, '原节点不被改动');
});

test('segmentRetakeModelPolicy: 清会话补丁在没开 segmentRetake 时只清字段', () => {
  assert.deepEqual(buildSegmentRetakeSessionClearPatch({}), { segmentRetake: null });
  assert.deepEqual(buildSegmentRetakeSessionClearPatch(), { segmentRetake: null });
});

test('segmentRetakeModelPolicy: 清会话补丁先收尾到 submitted 再清空 session', () => {
  const patch = buildSegmentRetakeSessionClearPatch({
    id: 'n1',
    segmentRetake: { phase: SEGMENT_RETAKE_PHASE_EDITING, model: 'zzz' },
  });
  assert.equal(patch.segmentRetake, null);
  assert.deepEqual(patch.uiSchemaFieldState, undefined);
});
