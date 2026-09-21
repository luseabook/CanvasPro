import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APIMART_DREAMINA_VIDEO_MODEL_OPTIONS,
  DREAMINA_VIDEO_ALLOWED_RATIOS,
  buildDreaminaStyleVideoNodeNormalizationPatch,
  buildDreaminaVideoNodeNormalizationPatch,
  ensureDreaminaVideoModelForTask,
  getDreaminaStyleVideoAllowedModels,
  getDreaminaStyleVideoDurationRange,
  getDreaminaStyleVideoResolutionOptions,
  getDreaminaVideoDurationRange,
  getDreaminaVideoRouteDisplayName,
  getDreaminaVideoTaskDisplayName,
  getDreaminaVideoResolutionOptions,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaVideoResolution,
  resolveDreaminaStyleVideoCounterpartModel,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  isDreaminaVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaVideoModel,
  normalizeDreaminaVideoRouteMode,
  pickClosestDreaminaVideoAdaptiveRatio,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from './dreaminaVideoModelHelper.js';
import { getModelsByKind, sanitizeModelUiSchemaParams } from '../manifests/index.js';
import { setLocale } from '../i18n/index.js';
const DREAMINA_ADAPTIVE_RATIO = '自适应';
(test('dreamina helper: 兼容旧模型与旧模式字段', () => {
  const _0x5b19fa = buildDreaminaVideoNodeNormalizationPatch({
    provider: 'dreamina',
    model: 'dreamina/text2video',
    mode: '首尾帧',
    aspectRatio: '自适应',
  });
  (assert.equal(_0x5b19fa.model, 'dreamina/seedance2.0fast'),
    assert.equal(_0x5b19fa.dreaminaRouteMode, 'frames2video'));
}),
  test('dreamina helper: 兼容旧 seedance 模型值', () => {
    (assert.equal(isDreaminaVideoModel('seedance-2.0-fast'), true),
      assert.equal(normalizeDreaminaVideoModel('seedance-2.0-fast'), 'dreamina/seedance2.0fast'),
      assert.equal(normalizeDreaminaVideoModel('seedance-2.0'), 'dreamina/seedance2.0'));
  }),
  test('dreamina helper: 兼容 image2video 下划线模型别名', () => {
    (assert.equal(normalizeDreaminaVideoModel('dreamina/3.0_fast', 'dreamina'), 'dreamina/3.0fast'),
      assert.equal(normalizeDreaminaVideoModel('dreamina/3.0_pro', 'dreamina'), 'dreamina/3.0pro'),
      assert.equal(normalizeDreaminaVideoModel('dreamina/3.5_pro', 'dreamina'), 'dreamina/3.5pro'));
  }),
  test('dreamina helper: 显式模式下任务解析正确', () => {
    (assert.equal(
      resolveDreaminaVideoTaskType({
        routeMode: normalizeDreaminaVideoRouteMode('multimodal2video'),
        imageCount: 0,
        videoCount: 0,
        audioCount: 0,
      }),
      'text2video',
    ),
      assert.equal(
        resolveDreaminaVideoTaskType({
          routeMode: 'frames2video',
          imageCount: 1,
          videoCount: 0,
          audioCount: 0,
        }),
        'image2video',
      ),
      assert.equal(
        resolveDreaminaVideoTaskType({
          routeMode: 'frames2video',
          imageCount: 2,
          videoCount: 0,
          audioCount: 0,
        }),
        'frames2video',
      ));
  }),
  test('dreamina helper: 模型与时长/分辨率矩阵正确', () => {
    const _0x1e4746 = ensureDreaminaVideoModelForTask('multimodal2video', 'dreamina/3.5pro', 'dreamina');
    (assert.equal(_0x1e4746, 'dreamina/seedance2.0fast'),
      assert.deepEqual(getDreaminaVideoResolutionOptions('image2video', 'dreamina/3.0pro', 'dreamina'), [
        '1080p',
      ]),
      assert.deepEqual(getDreaminaVideoResolutionOptions('frames2video', 'dreamina/3.5pro', 'dreamina'), [
        '720p',
        '1080p',
      ]),
      assert.deepEqual(
        getDreaminaVideoResolutionOptions('multimodal2video', 'dreamina/seedance2.0_vip', 'dreamina'),
        ['720p', '1080p'],
      ),
      assert.equal(
        normalizeDreaminaVideoResolution('multimodal2video', 'dreamina/seedance2.0_vip', '1080p', 'dreamina'),
        '1080p',
      ),
      assert.deepEqual(
        getDreaminaVideoResolutionOptions('multimodal2video', 'dreamina/seedance2.0', 'dreamina'),
        ['720p'],
      ),
      assert.deepEqual(
        getDreaminaVideoResolutionOptions('multimodal2video', 'dreamina/seedance2.0fast_vip', 'dreamina'),
        ['720p'],
      ),
      assert.deepEqual(getDreaminaVideoDurationRange('image2video', 'dreamina/3.5pro', 'dreamina'), {
        min: 4,
        max: 12,
        step: 1,
      }));
  }),
  test('dreamina helper: 首尾帧单图回退 image2video 时保留当前可用模型', () => {
    const _0x2d8700 = resolveDreaminaVideoTaskType({
      routeMode: 'frames2video',
      imageCount: 1,
      videoCount: 0,
      audioCount: 0,
    });
    (assert.equal(_0x2d8700, 'image2video'),
      assert.equal(ensureDreaminaVideoModelForTask(_0x2d8700, 'dreamina/3.0', 'dreamina'), 'dreamina/3.0'),
      assert.equal(
        ensureDreaminaVideoModelForTask(_0x2d8700, 'dreamina/3.5pro', 'dreamina'),
        'dreamina/3.5pro',
      ),
      assert.equal(
        ensureDreaminaVideoModelForTask(_0x2d8700, 'dreamina/seedance2.0fast', 'dreamina'),
        'dreamina/seedance2.0fast',
      ));
  }),
  test('dreamina helper: 路由禁用态和非法组合会给出明确结果', () => {
    (assert.equal(isDreaminaVideoRouteModeEnabled('multiframe2video'), false),
      assert.equal(
        validateDreaminaVideoRouteSelection({
          routeMode: 'multimodal2video',
          taskType: 'multimodal2video',
          imageCount: 0,
          videoCount: 0,
          audioCount: 1,
        }),
        '全能参考至少需要 1 张图片或 1 个视频，音频不能单独使用',
      ),
      assert.equal(
        validateDreaminaVideoRouteSelection({
          routeMode: 'frames2video',
          taskType: 'frames2video',
          imageCount: 3,
          videoCount: 0,
          audioCount: 0,
        }),
        '首尾帧模式最多支持 2 张图片',
      ));
  }),
  test('dreamina helper: route labels and validation reasons follow locale', () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      (assert.equal(getDreaminaVideoRouteDisplayName('frames2video'), 'First/last frames'),
        assert.equal(getDreaminaVideoTaskDisplayName('text2video'), 'Text to video'),
        assert.equal(
          validateDreaminaVideoRouteSelection({
            routeMode: 'multimodal2video',
            taskType: 'multimodal2video',
            imageCount: 0,
            videoCount: 0,
            audioCount: 1,
          }),
          'All-purpose reference needs at least 1 image or 1 video; audio cannot be used alone',
        ));
    } finally {
      setLocale('zh-CN', { persist: false, notify: false });
    }
  }),
  test('dreamina helper: 自适应比例会贴近即梦支持比例', () => {
    (assert.equal(pickClosestDreaminaVideoAdaptiveRatio(0x780, 0x438)?.label, '16:9'),
      assert.equal(pickClosestDreaminaVideoAdaptiveRatio(0x438, 0x780)?.label, '9:16'),
      assert.equal(pickClosestDreaminaVideoAdaptiveRatio(0, 0)?.label, '1:1'));
  }),
  test('dreamina helper: 节点归一化阶段保留自适应', () => {
    const _0x5686bc = buildDreaminaVideoNodeNormalizationPatch({
      provider: 'dreamina',
      model: 'dreamina/seedance2.0fast',
      dreaminaRouteMode: 'multimodal2video',
      aspectRatio: '自适应',
    });
    assert.equal(_0x5686bc, null);
  }),
  test('dreamina helper: APIMart Seedance UI 名称和 1.0/1.5 能力矩阵', () => {
    (assert.equal(
      APIMART_DREAMINA_VIDEO_MODEL_OPTIONS.some((_0x301859) => _0x301859.title.includes('Doubao')),
      false,
    ),
      assert.equal(
        normalizeDreaminaStyleVideoModel('apimart/seedance-1.5-pro', 'apimart'),
        'apimart/doubao-seedance-1-5-pro',
      ));
    const _0x3cb183 = getDreaminaStyleVideoAllowedModels('frames2video', 'apimart').map(
      (_0x2b1c22) => _0x2b1c22.model,
    );
    (assert.equal(_0x3cb183.includes('apimart/doubao-seedance-1-0-pro-fast'), false),
      assert.equal(_0x3cb183.includes('apimart/doubao-seedance-1-0-pro-quality'), true),
      assert.deepEqual(
        getDreaminaStyleVideoDurationRange('text2video', 'apimart/doubao-seedance-1-0-pro-fast', 'apimart'),
        { min: 2, max: 12, step: 1 },
      ),
      assert.deepEqual(
        getDreaminaStyleVideoDurationRange('text2video', 'apimart/doubao-seedance-1-5-pro', 'apimart'),
        { min: 4, max: 12, step: 1 },
      ));
  }),
  test('dreamina helper: APIMart Seedance 兼容通用 schema 的分辨率大小写', () => {
    (assert.equal(
      normalizeDreaminaStyleVideoResolution(
        'text2video',
        'apimart/doubao-seedance-2.0-fast',
        '720P',
        'apimart',
      ),
      '720p',
    ),
      assert.equal(
        normalizeDreaminaStyleVideoResolution(
          'text2video',
          'apimart/doubao-seedance-2.0',
          '1080P',
          'apimart',
        ),
        '1080p',
      ));
    const _0x2c6d29 = buildDreaminaStyleVideoNodeNormalizationPatch({
      provider: 'apimart',
      model: 'apimart/doubao-seedance-2.0-fast',
      dreaminaRouteMode: 'multimodal2video',
      aspectRatio: '自适应',
      resolution: '720P',
      duration: 5,
    });
    assert.equal(_0x2c6d29?.resolution, '720p');
  }),
  test('dreamina helper: dreamina-style schema roundtrips copied params', () => {
    const _0x1bbb60 = getModelsByKind('video').filter(
      (_0x4945fe) => _0x4945fe.extensions?.dreaminaStyleVideo,
    );
    assert.ok(_0x1bbb60.length > 0);
    for (const _0x44db53 of _0x1bbb60) {
      const _0x4fcf0c = _0x44db53.provider,
        _0x243397 = _0x44db53.extensions.dreaminaStyleVideo.taskTypes || [];
      for (const _0xf5ea50 of _0x243397) {
        const _0x27d133 = getDreaminaStyleVideoResolutionOptions(_0xf5ea50, _0x44db53.modelId, _0x4fcf0c);
        for (const _0x418a45 of _0x27d133) {
          const _0x4ced2d = sanitizeModelUiSchemaParams(
            _0x44db53.modelId,
            {
              dreaminaRouteMode: _0xf5ea50,
              resolution: _0x418a45,
              aspectRatio: DREAMINA_ADAPTIVE_RATIO,
              duration: 5,
            },
            { includeDefaults: false },
          );
          assert.equal(
            normalizeDreaminaStyleVideoResolution(
              _0xf5ea50,
              _0x44db53.modelId,
              _0x4ced2d.resolution,
              _0x4fcf0c,
            ),
            _0x418a45,
            _0x44db53.modelId + ' ' + _0xf5ea50 + ' should preserve ' + _0x418a45,
          );
        }
      }
      for (const _0xf13c55 of [DREAMINA_ADAPTIVE_RATIO, ...DREAMINA_VIDEO_ALLOWED_RATIOS]) {
        const _0x3e84e2 = sanitizeModelUiSchemaParams(
          _0x44db53.modelId,
          { aspectRatio: _0xf13c55 },
          { includeDefaults: false },
        );
        assert.equal(
          normalizeDreaminaVideoAspectRatio(_0x3e84e2.aspectRatio, { preserveAdaptive: true }),
          _0xf13c55,
          _0x44db53.modelId + ' should preserve aspectRatio ' + _0xf13c55,
        );
      }
    }
  }),
  test('dreamina helper: Seedance counterpart models come from manifest extensions', () => {
    (assert.equal(
      resolveDreaminaStyleVideoCounterpartModel('apimart/doubao-seedance-2.0-fast-face', 'dreamina', {
        taskType: 'multimodal2video',
      }),
      'dreamina/seedance2.0fast',
    ),
      assert.equal(
        resolveDreaminaStyleVideoCounterpartModel('apimart/doubao-seedance-2.0', 'dreamina', {
          taskType: 'multimodal2video',
        }),
        'dreamina/seedance2.0',
      ),
      assert.equal(
        resolveDreaminaStyleVideoCounterpartModel('dreamina/seedance2.0_vip', 'apimart', {
          taskType: 'multimodal2video',
        }),
        'apimart/doubao-seedance-2.0',
      ));
  }));
