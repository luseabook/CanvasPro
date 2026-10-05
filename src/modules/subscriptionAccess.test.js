import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VIP_GATE_MODEL_ID,
  RH_VIDEO_HD_VIP_MODEL_ID,
  RH_VIDEO_HD_VIP_AI_APP_MODEL_ID,
  RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID,
  RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID,
  DREAMINA_VIDEO_VIP_MODEL_ID,
  SUBSCRIPTION_GATE_MANIFESTS,
  resolveVipGateModelId,
  isVipModel,
  isModelAllowed,
} from './subscriptionAccess.js';
(test('subscription access: VIP gate 清单来自共享 manifest', () => {
  (assert.deepEqual(
    SUBSCRIPTION_GATE_MANIFESTS.map((gate) => gate.key).sort(),
    [
      'runninghubVideoV54',
      'runninghubVideoBerniniV1',
      'runninghubVideoScail2V1',
      'runninghubVideoScailV2',
      'runninghubVideoHd',
      'runninghubCommercialDigitalHuman',
      'runninghubAdvancedVoiceClone',
      'dreaminaVideoVip',
      'audioVoiceStudio',
      'replacementStudio',
      'replicationStudio',
      'runninghubAiApp',
      'binghuoVideo',
      'customProvider',
    ].sort(),
  ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (event) =>
          event.key === 'dreaminaVideoVip' &&
          event.modelId === DREAMINA_VIDEO_VIP_MODEL_ID &&
          event.providers.includes('dreamina'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (event2) =>
          event2.key === 'runninghubAdvancedVoiceClone' &&
          event2.modelId === RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID &&
          event2.aliases.includes('advanced_voice_clone'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (event3) =>
          event3.key === 'runninghubCommercialDigitalHuman' &&
          event3.modelId === 'runninghub/2055639633148563458' &&
          event3.aliases.includes('commercial_digital_human'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (event4) =>
          event4.key === 'runninghubVideoScail2V1' &&
          event4.modelId === 'runninghub/2064961300823896065' &&
          event4.aliases.includes('video_edit_v54') &&
          event4.aliases.includes('ai-app/2064961300823896065'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (event5) =>
          event5.key === 'runninghubVideoScailV2' &&
          event5.modelId === 'runninghub/2065463417577762818' &&
          event5.aliases.includes('video_edit_v54') &&
          event5.aliases.includes('ai-app/2065463417577762818'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.every((item) =>
        item.legacyAliases.every((el) => el.value && el.deleteWhen),
      ),
    ));
}),
  test('subscription access: dreamina 模型统一映射到即梦视频 VIP gate model', () => {
    (assert.equal(resolveVipGateModelId('dreamina/seedance2.0fast'), DREAMINA_VIDEO_VIP_MODEL_ID),
      assert.equal(resolveVipGateModelId('whatever', 'dreamina'), DREAMINA_VIDEO_VIP_MODEL_ID));
  }),
  test('subscription access: BERNINI V1 复用 V5.4 授权别名但保持独立 gate model', () => {
    const value = 'runninghub/2062515720147259393';
    (assert.equal(resolveVipGateModelId(value), value),
      assert.equal(resolveVipGateModelId('2062515720147259393'), '2062515720147259393'),
      assert.equal(resolveVipGateModelId('ai-app/2062515720147259393'), value),
      assert.equal(isVipModel(value), true),
      assert.equal(isModelAllowed(value, { status: 'none', entitledModelKeys: ['video_edit_v54'] }), false),
      assert.equal(isModelAllowed(value, { status: 'active', entitledModelKeys: ['video_edit_v54'] }), true));
  }),
  test('subscription access: Scail V1 reuses V5.4 aliases with independent gate model', () => {
    const key = 'runninghub/2064961300823896065';
    (assert.equal(resolveVipGateModelId(key), key),
      assert.equal(resolveVipGateModelId('2064961300823896065'), '2064961300823896065'),
      assert.equal(resolveVipGateModelId('ai-app/2064961300823896065'), key),
      assert.equal(isVipModel(key), true),
      assert.equal(isModelAllowed(key, { status: 'none', entitledModelKeys: ['video_edit_v54'] }), false),
      assert.equal(isModelAllowed(key, { status: 'active', entitledModelKeys: ['video_edit_v54'] }), true));
  }),
  test('subscription access: Scail V2 reuses V5.4 aliases with independent gate model', () => {
    const index = 'runninghub/2065463417577762818';
    (assert.equal(resolveVipGateModelId(index), index),
      assert.equal(resolveVipGateModelId('2065463417577762818'), '2065463417577762818'),
      assert.equal(resolveVipGateModelId('ai-app/2065463417577762818'), index),
      assert.equal(isVipModel(index), true),
      assert.equal(isModelAllowed(index, { status: 'none', entitledModelKeys: ['video_edit_v54'] }), false),
      assert.equal(isModelAllowed(index, { status: 'active', entitledModelKeys: ['video_edit_v54'] }), true));
  }),
  test('subscription access: runninghub 模型维持原有 gate model', () => {
    (assert.equal(resolveVipGateModelId(DEFAULT_VIP_GATE_MODEL_ID), DEFAULT_VIP_GATE_MODEL_ID),
      assert.equal(resolveVipGateModelId('2041741496667348994'), DEFAULT_VIP_GATE_MODEL_ID),
      assert.equal(isVipModel(DEFAULT_VIP_GATE_MODEL_ID), true),
      assert.equal(isVipModel('2041741496667348994'), true));
  }),
  test('subscription access: 视频高清 ai-app 算作 VIP 模型', () => {
    (assert.equal(isVipModel(RH_VIDEO_HD_VIP_MODEL_ID), true),
      assert.equal(isVipModel(RH_VIDEO_HD_VIP_AI_APP_MODEL_ID), true),
      assert.equal(
        isModelAllowed(RH_VIDEO_HD_VIP_MODEL_ID, {
          status: 'none',
          entitledModelIds: [RH_VIDEO_HD_VIP_MODEL_ID],
        }),
        false,
      ),
      assert.equal(
        isModelAllowed(RH_VIDEO_HD_VIP_MODEL_ID, {
          status: 'active',
          entitledModelIds: [RH_VIDEO_HD_VIP_AI_APP_MODEL_ID],
        }),
        true,
      ));
  }),
  test('subscription access: 进阶声音克隆 ai-app 和 workflow key 算作 VIP 模型', () => {
    (assert.equal(isVipModel(RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID), true),
      assert.equal(isVipModel(RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID), true),
      assert.equal(isVipModel('advanced_voice_clone'), true),
      assert.equal(
        isModelAllowed(RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID, {
          status: 'active',
          entitledModelIds: [RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID],
        }),
        true,
      ),
      assert.equal(
        isModelAllowed('advanced_voice_clone', {
          status: 'active',
          entitledModelKeys: ['advanced_voice_clone'],
        }),
        true,
      ));
  }),
  test('subscription access: 漫画转真人不再进入 VIP gate', () => {
    const result = 'runninghub/1994718111704158209',
      data = 'ai-app/1994718111704158209',
      options = 'runninghub/1994711386552999938';
    (assert.equal(
      SUBSCRIPTION_GATE_MANIFESTS.some((event6) => event6.key === 'runninghubAnimeReal'),
      false,
    ),
      assert.equal(resolveVipGateModelId(result), result),
      assert.equal(resolveVipGateModelId(data), data),
      assert.equal(resolveVipGateModelId(options), options),
      assert.equal(isVipModel(result), false),
      assert.equal(isVipModel(data), false),
      assert.equal(isVipModel(options), false),
      assert.equal(isModelAllowed(result, { status: 'none', entitledModelIds: [] }), true));
  }),
  test('subscription access: 即梦模型授权判定读取 dreamina/video_vip', () => {
    const target = {
      status: 'active',
      entitledModelIds: [DREAMINA_VIDEO_VIP_MODEL_ID],
      entitledModelKeys: [],
    };
    (assert.equal(isModelAllowed('dreamina/seedance2.0_vip', target, 'dreamina'), true),
      assert.equal(isModelAllowed('dreamina/seedance2.0fast', target, 'dreamina'), true));
    const source = {
      status: 'active',
      entitledModelIds: [DEFAULT_VIP_GATE_MODEL_ID],
      entitledModelKeys: [],
    };
    assert.equal(isModelAllowed('dreamina/seedance2.0fast', source, 'dreamina'), false);
  }),
  test('subscription access: 即梦模型授权支持 key alias', () => {
    const next = { status: 'active', entitledModelIds: [], entitledModelKeys: ['dreamina_video_vip'] };
    assert.equal(isModelAllowed('dreamina/3.5pro', next), true);
  }));
