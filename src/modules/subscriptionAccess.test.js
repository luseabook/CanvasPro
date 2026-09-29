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
  (assert.equal(SUBSCRIPTION_GATE_MANIFESTS.length, 9),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (_0xe6774c) =>
          _0xe6774c.key === 'dreaminaVideoVip' &&
          _0xe6774c.modelId === DREAMINA_VIDEO_VIP_MODEL_ID &&
          _0xe6774c.providers.includes('dreamina'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (_0x45dd88) =>
          _0x45dd88.key === 'runninghubAdvancedVoiceClone' &&
          _0x45dd88.modelId === RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID &&
          _0x45dd88.aliases.includes('advanced_voice_clone'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (_0x240298) =>
          _0x240298.key === 'runninghubCommercialDigitalHuman' &&
          _0x240298.modelId === 'runninghub/2055639633148563458' &&
          _0x240298.aliases.includes('commercial_digital_human'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (_0x27ef2e) =>
          _0x27ef2e.key === 'runninghubVideoScail2V1' &&
          _0x27ef2e.modelId === 'runninghub/2064961300823896065' &&
          _0x27ef2e.aliases.includes('video_edit_v54') &&
          _0x27ef2e.aliases.includes('ai-app/2064961300823896065'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.some(
        (_0x1f1c02) =>
          _0x1f1c02.key === 'runninghubVideoScailV2' &&
          _0x1f1c02.modelId === 'runninghub/2065463417577762818' &&
          _0x1f1c02.aliases.includes('video_edit_v54') &&
          _0x1f1c02.aliases.includes('ai-app/2065463417577762818'),
      ),
    ),
    assert.ok(
      SUBSCRIPTION_GATE_MANIFESTS.every((_0x81e874) =>
        _0x81e874.legacyAliases.every((_0x1b3828) => _0x1b3828.value && _0x1b3828.deleteWhen),
      ),
    ));
}),
  test('subscription access: dreamina 模型统一映射到即梦视频 VIP gate model', () => {
    (assert.equal(resolveVipGateModelId('dreamina/seedance2.0fast'), DREAMINA_VIDEO_VIP_MODEL_ID),
      assert.equal(resolveVipGateModelId('whatever', 'dreamina'), DREAMINA_VIDEO_VIP_MODEL_ID));
  }),
  test('subscription access: BERNINI V1 复用 V5.4 授权别名但保持独立 gate model', () => {
    const _0x1015e1 = 'runninghub/2062515720147259393';
    (assert.equal(resolveVipGateModelId(_0x1015e1), _0x1015e1),
      assert.equal(resolveVipGateModelId('2062515720147259393'), '2062515720147259393'),
      assert.equal(resolveVipGateModelId('ai-app/2062515720147259393'), _0x1015e1),
      assert.equal(isVipModel(_0x1015e1), true),
      assert.equal(
        isModelAllowed(_0x1015e1, { status: 'none', entitledModelKeys: ['video_edit_v54'] }),
        false,
      ),
      assert.equal(
        isModelAllowed(_0x1015e1, { status: 'active', entitledModelKeys: ['video_edit_v54'] }),
        true,
      ));
  }),
  test('subscription access: Scail V1 reuses V5.4 aliases with independent gate model', () => {
    const _0x5b2420 = 'runninghub/2064961300823896065';
    (assert.equal(resolveVipGateModelId(_0x5b2420), _0x5b2420),
      assert.equal(resolveVipGateModelId('2064961300823896065'), '2064961300823896065'),
      assert.equal(resolveVipGateModelId('ai-app/2064961300823896065'), _0x5b2420),
      assert.equal(isVipModel(_0x5b2420), true),
      assert.equal(
        isModelAllowed(_0x5b2420, { status: 'none', entitledModelKeys: ['video_edit_v54'] }),
        false,
      ),
      assert.equal(
        isModelAllowed(_0x5b2420, { status: 'active', entitledModelKeys: ['video_edit_v54'] }),
        true,
      ));
  }),
  test('subscription access: Scail V2 reuses V5.4 aliases with independent gate model', () => {
    const _0x41f2a2 = 'runninghub/2065463417577762818';
    (assert.equal(resolveVipGateModelId(_0x41f2a2), _0x41f2a2),
      assert.equal(resolveVipGateModelId('2065463417577762818'), '2065463417577762818'),
      assert.equal(resolveVipGateModelId('ai-app/2065463417577762818'), _0x41f2a2),
      assert.equal(isVipModel(_0x41f2a2), true),
      assert.equal(
        isModelAllowed(_0x41f2a2, { status: 'none', entitledModelKeys: ['video_edit_v54'] }),
        false,
      ),
      assert.equal(
        isModelAllowed(_0x41f2a2, { status: 'active', entitledModelKeys: ['video_edit_v54'] }),
        true,
      ));
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
    const _0x4b69da = 'runninghub/1994718111704158209',
      _0x59bf7f = 'ai-app/1994718111704158209',
      _0x2d3ecb = 'runninghub/1994711386552999938';
    (assert.equal(
      SUBSCRIPTION_GATE_MANIFESTS.some((_0x3e3808) => _0x3e3808.key === 'runninghubAnimeReal'),
      false,
    ),
      assert.equal(resolveVipGateModelId(_0x4b69da), _0x4b69da),
      assert.equal(resolveVipGateModelId(_0x59bf7f), _0x59bf7f),
      assert.equal(resolveVipGateModelId(_0x2d3ecb), _0x2d3ecb),
      assert.equal(isVipModel(_0x4b69da), false),
      assert.equal(isVipModel(_0x59bf7f), false),
      assert.equal(isVipModel(_0x2d3ecb), false),
      assert.equal(isModelAllowed(_0x4b69da, { status: 'none', entitledModelIds: [] }), true));
  }),
  test('subscription access: 即梦模型授权判定读取 dreamina/video_vip', () => {
    const _0x185e71 = {
      status: 'active',
      entitledModelIds: [DREAMINA_VIDEO_VIP_MODEL_ID],
      entitledModelKeys: [],
    };
    (assert.equal(isModelAllowed('dreamina/seedance2.0_vip', _0x185e71, 'dreamina'), true),
      assert.equal(isModelAllowed('dreamina/seedance2.0fast', _0x185e71, 'dreamina'), true));
    const _0x446782 = {
      status: 'active',
      entitledModelIds: [DEFAULT_VIP_GATE_MODEL_ID],
      entitledModelKeys: [],
    };
    assert.equal(isModelAllowed('dreamina/seedance2.0fast', _0x446782, 'dreamina'), false);
  }),
  test('subscription access: 即梦模型授权支持 key alias', () => {
    const _0x258162 = { status: 'active', entitledModelIds: [], entitledModelKeys: ['dreamina_video_vip'] };
    assert.equal(isModelAllowed('dreamina/3.5pro', _0x258162), true);
  }));
