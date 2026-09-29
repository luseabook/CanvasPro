import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_STEPS,
  PERSON_REPLACEMENT_STEP_GATE_REASONS,
  getPersonReplacementAccessibleStep,
  getPersonReplacementStepCompletion,
  getPersonReplacementStepGate,
} from './personReplacementWorkflow.js';

test('workflow: 步骤与门禁原因常量保持稳定且冻结', () => {
  assert.deepEqual(PERSON_REPLACEMENT_STEPS, [
    { id: 1, key: 'asset-settings', label: '素材设定' },
    { id: 2, key: 'image-replacement', label: '图像替换' },
    { id: 3, key: 'video-replacement', label: '视频替换' },
    { id: 4, key: 'voice-clone', label: '声音克隆' },
    { id: 5, key: 'composite-preview', label: '合成视频' },
  ]);
  assert.ok(Object.isFrozen(PERSON_REPLACEMENT_STEPS));
  for (const step of PERSON_REPLACEMENT_STEPS) assert.ok(Object.isFrozen(step));
  assert.deepEqual(PERSON_REPLACEMENT_STEP_GATE_REASONS, {
    ASSET_SETTINGS_INCOMPLETE: 'asset-settings-incomplete',
    IMAGE_REPLACEMENT_INCOMPLETE: 'image-replacement-incomplete',
  });
  assert.ok(Object.isFrozen(PERSON_REPLACEMENT_STEP_GATE_REASONS));
});

test('workflow: 人物或场景有基础图且带 id 才算素材设定完成', () => {
  assert.deepEqual(getPersonReplacementStepCompletion(), {
    assetSettingsComplete: false,
    imageReplacementComplete: false,
  });
  assert.deepEqual(getPersonReplacementStepCompletion({ characters: 'bad', scenes: 'bad', shots: 'bad' }), {
    assetSettingsComplete: false,
    imageReplacementComplete: false,
  });
  assert.equal(
    getPersonReplacementStepCompletion({ characters: [{ id: 'c1', imageRefs: ['a'] }] })
      .assetSettingsComplete,
    true,
  );
  assert.equal(
    getPersonReplacementStepCompletion({
      characters: [{ id: 'c1', appearances: [{ id: 'base', imageUrl: 'u' }] }],
    }).assetSettingsComplete,
    true,
  );
  assert.equal(
    getPersonReplacementStepCompletion({ characters: [{ id: 'c1', referenceImages: [{ url: 'u' }] }] })
      .assetSettingsComplete,
    true,
  );
  assert.equal(
    getPersonReplacementStepCompletion({ scenes: [{ id: 's1', imageRef: 'u' }] }).assetSettingsComplete,
    true,
  );
  assert.equal(
    getPersonReplacementStepCompletion({ characters: [{ id: 'c1' }] }).assetSettingsComplete,
    false,
  );
  assert.equal(
    getPersonReplacementStepCompletion({ characters: [{ imageRefs: ['a'] }] }).assetSettingsComplete,
    false,
  );
  assert.equal(
    getPersonReplacementStepCompletion({ scenes: [{ imageRef: 'u' }] }).assetSettingsComplete,
    false,
  );
});

test('workflow: 图像替换通过人物映射、直绑或场景引用完成', () => {
  const base = {
    characters: [{ id: 'target-img', imageRefs: ['a'] }, { id: 'target-no-img' }],
    scenes: [{ id: 'scene-img', imageRef: 's' }, { id: 'scene-no-img' }],
    mappings: [
      { sourceCharacterId: 'src1', targetCharacterId: 'target-img' },
      { sourceCharacterId: 'src2', targetCharacterId: 'target-no-img' },
      { sourceCharacterId: '', targetCharacterId: 'target-img' },
      { sourceCharacterId: 'src3', targetCharacterId: '' },
    ],
    shots: [],
  };
  const complete = (shots) => getPersonReplacementStepCompletion({ ...base, shots }).imageReplacementComplete;

  assert.equal(complete([{ people: [{ sourceCharacterId: 'src1' }] }]), true);
  assert.equal(complete([{ people: [{ sourceCharacterId: 'src2' }] }]), false);
  assert.equal(complete([{ people: [{ targetCharacterId: 'target-img' }] }]), true);
  assert.equal(complete([{ people: [{ targetCharacterId: 'target-no-img' }] }]), false);
  assert.equal(complete([{ people: [{ sourceCharacterId: 'src1', projectMappingDisabled: true }] }]), false);
  assert.equal(complete([{ sceneReference: { sceneId: 'scene-img' } }]), true);
  assert.equal(complete([{ sceneReference: { sceneId: 'scene-no-img' } }]), false);
  assert.equal(complete([{ people: [{ sourceCharacterId: 'unknown' }] }]), false);
  assert.equal(complete([{ people: [{ sourceCharacterId: 'src3' }] }]), false);
  assert.equal(complete([]), false);
});

test('workflow: 步骤门禁按素材与绑定进度放行或拦截', () => {
  const empty = {};
  const assetOnly = { characters: [{ id: 'c1', imageRefs: ['a'] }] };
  const ready = {
    characters: [{ id: 'target', imageRefs: ['a'] }],
    shots: [{ people: [{ targetCharacterId: 'target' }] }],
  };

  assert.deepEqual(getPersonReplacementStepGate(empty, 1), { allowed: true, reason: '', message: '' });
  assert.deepEqual(getPersonReplacementStepGate(empty, 2), {
    allowed: false,
    reason: PERSON_REPLACEMENT_STEP_GATE_REASONS.ASSET_SETTINGS_INCOMPLETE,
    message: '请先在素材设定上传至少一张人物或场景图片',
  });
  assert.deepEqual(getPersonReplacementStepGate(assetOnly, 3), { allowed: true, reason: '', message: '' });
  assert.deepEqual(getPersonReplacementStepGate(assetOnly, 4), {
    allowed: false,
    reason: PERSON_REPLACEMENT_STEP_GATE_REASONS.IMAGE_REPLACEMENT_INCOMPLETE,
    message: '请先在图像替换中绑定人物或场景',
  });
  assert.deepEqual(getPersonReplacementStepGate(ready, 5), { allowed: true, reason: '', message: '' });

  assert.deepEqual(getPersonReplacementStepGate(empty, 0), { allowed: true, reason: '', message: '' });
  assert.deepEqual(getPersonReplacementStepGate(empty, 'abc'), { allowed: true, reason: '', message: '' });
  assert.deepEqual(getPersonReplacementStepGate(empty, 2.9), {
    allowed: false,
    reason: PERSON_REPLACEMENT_STEP_GATE_REASONS.ASSET_SETTINGS_INCOMPLETE,
    message: '请先在素材设定上传至少一张人物或场景图片',
  });
  assert.deepEqual(
    getPersonReplacementStepGate(empty, 5, { assetSettingsComplete: true, imageReplacementComplete: true }),
    { allowed: true, reason: '', message: '' },
  );
  assert.deepEqual(
    getPersonReplacementStepGate(empty, 99, { assetSettingsComplete: true, imageReplacementComplete: true }),
    { allowed: true, reason: '', message: '' },
  );
});

test('workflow: 可访问步骤随素材与绑定进度收敛并夹取到 1..5', () => {
  const empty = {};
  const assetOnly = { characters: [{ id: 'c1', imageRefs: ['a'] }] };
  const ready = {
    characters: [{ id: 'target', imageRefs: ['a'] }],
    shots: [{ people: [{ targetCharacterId: 'target' }] }],
  };

  assert.equal(getPersonReplacementAccessibleStep(empty, 5), 1);
  assert.equal(getPersonReplacementAccessibleStep(empty, 'abc'), 1);
  assert.equal(getPersonReplacementAccessibleStep(assetOnly, 5), 3);
  assert.equal(getPersonReplacementAccessibleStep(assetOnly, 2), 2);
  assert.equal(getPersonReplacementAccessibleStep(assetOnly, 99), 3);
  assert.equal(getPersonReplacementAccessibleStep(ready, 5), 5);
  assert.equal(getPersonReplacementAccessibleStep(ready, 0), 1);
  assert.equal(getPersonReplacementAccessibleStep(ready, 2.9), 2);
});
