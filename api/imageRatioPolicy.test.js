import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllowedRatiosForProviderModel,
  normalizeRatioLabelText,
  parseRatioLabel,
  pickClosestRatio,
  pickClosestRatioForProviderModel,
  resolveAdaptiveSourceSize,
  resolveProviderRatioPayload,
} from './imageRatioPolicy.js';
const GPT_IMAGE_2_RATIO_LABELS = [
    '1:1',
    '3:2',
    '2:3',
    '4:3',
    '3:4',
    '5:4',
    '4:5',
    '16:9',
    '9:16',
    '2:1',
    '1:2',
    '21:9',
    '9:21',
  ],
  GPT_IMAGE_2_4K_RATIO_LABELS = ['16:9', '9:16', '2:1', '1:2', '21:9', '9:21'],
  GRSAI_GPT_IMAGE_2_RATIO_LABELS = [
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    '3:4',
    '3:2',
    '2:3',
    '5:4',
    '4:5',
    '21:9',
    '9:21',
    '1:3',
    '3:1',
    '2:1',
    '1:2',
  ],
  GRSAI_GPT_IMAGE_2_1K_RATIO_LABELS = [
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    '3:4',
    '3:2',
    '2:3',
    '5:4',
    '4:5',
    '21:9',
    '9:21',
    '1:2',
    '2:1',
  ],
  QWEN_IMAGE_RATIO_LABELS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'];
(test('imageRatioPolicy: nearest ratio mapping works for landscape', () => {
  (assert.equal(pickClosestRatio(15, 9), '16:9'), assert.equal(pickClosestRatio(17, 9), '16:9'));
}),
  test('imageRatioPolicy: normalizes full-width ratio separators', () => {
    (assert.equal(normalizeRatioLabelText('16 ﹕ 9'), '16:9'),
      assert.deepEqual(parseRatioLabel('16：9'), { w: 16, h: 9, label: '16:9' }),
      assert.deepEqual(parseRatioLabel('16∶9'), { w: 16, h: 9, label: '16:9' }),
      assert.deepEqual(parseRatioLabel('16 ﹕ 9'), { w: 16, h: 9, label: '16:9' }));
  }),
  test('imageRatioPolicy: nearest ratio mapping works for portrait and invalid sizes', () => {
    (assert.equal(pickClosestRatio(700, 1300), '9:16'), assert.equal(pickClosestRatio(0, 0), '1:1'));
  }),
  test('imageRatioPolicy: adaptive source prefers display > input > fallback', () => {
    const adaptiveSourceSize = resolveAdaptiveSourceSize({
      displayWidth: 1600,
      displayHeight: 900,
      inputWidth: 800,
      inputHeight: 1200,
    });
    assert.deepEqual(adaptiveSourceSize, { width: 1600, height: 900, source: 'display' });
    const adaptiveSourceSize2 = resolveAdaptiveSourceSize({
      displayWidth: 0,
      displayHeight: 0,
      inputWidth: 800,
      inputHeight: 1200,
    });
    assert.deepEqual(adaptiveSourceSize2, { width: 800, height: 1200, source: 'input-media' });
    const adaptiveSourceSize3 = resolveAdaptiveSourceSize({});
    assert.deepEqual(adaptiveSourceSize3, { width: 1, height: 1, source: 'fallback' });
  }),
  test('imageRatioPolicy: provider payload supports dimensions and none', () => {
    const providerRatioPayload = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/seedream-v4.5',
      ratioLabel: '15:9',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload.ratioCapability, 'dimensions'),
      assert.equal(providerRatioPayload.resolvedRatioLabel, '16:9'),
      assert.ok(Number.isInteger(providerRatioPayload.params.width)),
      assert.ok(Number.isInteger(providerRatioPayload.params.height)));
    const providerRatioPayload2 = resolveProviderRatioPayload({
      provider: 'runninghubwf',
      model: 'runninghub/1994718111704158209',
      ratioLabel: '16:9',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload2.ratioCapability, 'none'),
      assert.equal(providerRatioPayload2.suppressAspectRatio, true),
      assert.deepEqual(providerRatioPayload2.params, {}));
    const providerRatioPayload3 = resolveProviderRatioPayload({
      provider: 'runninghubwf',
      model: 'runninghub/2050306122774532097',
      ratioLabel: '16:9',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload3.ratioCapability, 'dimensions'),
      assert.equal(providerRatioPayload3.resolvedRatioLabel, '16:9'),
      assert.ok(Number.isInteger(providerRatioPayload3.params.width)),
      assert.ok(Number.isInteger(providerRatioPayload3.params.height)));
  }),
  test('imageRatioPolicy: apimart seedream ratio allowlist follows model rules', () => {
    const list = getAllowedRatiosForProviderModel('apimart', 'apimart/seedream-4.5').map(
      (item) => item.label,
    );
    (assert.ok(list.includes('9:21')),
      assert.equal(list.includes('5:4'), false),
      assert.equal(list.includes('4:5'), false));
    const list2 = getAllowedRatiosForProviderModel('apimart', 'apimart/seedream-5.0-lite').map(
      (item2) => item2.label,
    );
    (assert.equal(list2.includes('9:21'), false),
      assert.equal(list2.includes('5:4'), false),
      assert.equal(list2.includes('4:5'), false));
  }),
  test('imageRatioPolicy: apimart seedream falls back from unsupported 5:4 ratio', () => {
    const providerRatioPayload4 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/seedream-4.5',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload4.ratioCapability, 'size'),
      assert.equal(providerRatioPayload4.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart qwen-image-2.0 uses documented ratios only', () => {
    const allowedRatiosForProviderModel = getAllowedRatiosForProviderModel(
      'apimart',
      'apimart/qwen-image-2.0',
      '2K',
    ).map((item3) => item3.label);
    assert.deepEqual(allowedRatiosForProviderModel, QWEN_IMAGE_RATIO_LABELS);
    const providerRatioPayload5 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/qwen-image-2.0',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload5.ratioCapability, 'size'),
      assert.equal(providerRatioPayload5.resolvedRatioLabel, '4:3'),
      assert.equal(providerRatioPayload5.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart z-image-turbo uses documented ratios only', () => {
    const allowedRatiosForProviderModel2 = getAllowedRatiosForProviderModel(
      'apimart',
      'apimart/z-image-turbo',
      '2K',
    ).map((item4) => item4.label);
    assert.deepEqual(allowedRatiosForProviderModel2, QWEN_IMAGE_RATIO_LABELS);
    const providerRatioPayload6 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/z-image-turbo',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload6.ratioCapability, 'size'),
      assert.equal(providerRatioPayload6.resolvedRatioLabel, '4:3'),
      assert.equal(providerRatioPayload6.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart wan2.7-image uses documented ratios only', () => {
    const allowedRatiosForProviderModel3 = getAllowedRatiosForProviderModel(
      'apimart',
      'apimart/wan2.7-image',
      '2K',
    ).map((item5) => item5.label);
    assert.deepEqual(allowedRatiosForProviderModel3, QWEN_IMAGE_RATIO_LABELS);
    const providerRatioPayload7 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/wan2.7-image',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload7.ratioCapability, 'size'),
      assert.equal(providerRatioPayload7.resolvedRatioLabel, '4:3'),
      assert.equal(providerRatioPayload7.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart gpt-image-2 supports documented ratios outside 4K', () => {
    const allowedRatiosForProviderModel4 = getAllowedRatiosForProviderModel(
      'apimart',
      'apimart/gpt-image-2',
      '2K',
    ).map((item6) => item6.label);
    assert.deepEqual(allowedRatiosForProviderModel4, GPT_IMAGE_2_RATIO_LABELS);
  }),
  test('imageRatioPolicy: grsai gpt-image-2 supports official 2K/4K ratios', () => {
    for (const value of ['gpt-image-2', 'grsai/gpt-image-2', 'gpt-image-2-vip', 'grsai/gpt-image-2-vip']) {
      const allowedRatiosForProviderModel5 = getAllowedRatiosForProviderModel('grsai', value, '2K').map(
        (item7) => item7.label,
      );
      assert.deepEqual(allowedRatiosForProviderModel5, GRSAI_GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test('imageRatioPolicy: grsai gpt-image-2 1K only keeps official 1K pixel ratios', () => {
    const allowedRatiosForProviderModel6 = getAllowedRatiosForProviderModel('grsai', 'gpt-image-2', '1K').map(
      (item8) => item8.label,
    );
    assert.deepEqual(allowedRatiosForProviderModel6, GRSAI_GPT_IMAGE_2_1K_RATIO_LABELS);
  }),
  test('imageRatioPolicy: runninghub gpt-image-2 supports documented ratios', () => {
    for (const key of ['runninghub-model/rhart-image-g-2', 'runninghub-model/rhart-image-g-2-official']) {
      const allowedRatiosForProviderModel7 = getAllowedRatiosForProviderModel('runninghub', key, '2K').map(
        (item9) => item9.label,
      );
      assert.deepEqual(allowedRatiosForProviderModel7, GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test('imageRatioPolicy: runninghub official gpt-image-2 4K only allows supported ratios', () => {
    const allowedRatiosForProviderModel8 = getAllowedRatiosForProviderModel(
      'runninghub',
      'runninghub-model/rhart-image-g-2-official',
      '4K',
    ).map((item10) => item10.label);
    assert.deepEqual(allowedRatiosForProviderModel8, GPT_IMAGE_2_4K_RATIO_LABELS);
  }),
  test('imageRatioPolicy: runninghub gpt-image-2 falls back to nearest documented ratio', () => {
    const providerRatioPayload8 = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/rhart-image-g-2-official',
      ratioLabel: '1:8',
      imageSize: '4K',
    });
    (assert.equal(providerRatioPayload8.ratioCapability, 'aspectRatio'),
      assert.equal(providerRatioPayload8.resolvedRatioLabel, '9:21'),
      assert.equal(providerRatioPayload8.params.aspectRatio, '9:21'));
  }),
  test('imageRatioPolicy: runninghub official gpt-image-2 4K falls back by direction', () => {
    (assert.equal(
      pickClosestRatioForProviderModel({
        provider: 'runninghub',
        model: 'runninghub-model/rhart-image-g-2-official',
        ratioLabel: '1:1',
        imageSize: '4K',
      }),
      '16:9',
    ),
      assert.equal(
        resolveProviderRatioPayload({
          provider: 'runninghub',
          model: 'runninghub-model/rhart-image-g-2-official',
          ratioLabel: '5:4',
          imageSize: '4K',
        }).params.aspectRatio,
        '16:9',
      ));
  }),
  test('imageRatioPolicy: grsai gpt-image-2 falls back to nearest documented ratio', () => {
    const providerRatioPayload9 = resolveProviderRatioPayload({
      provider: 'grsai',
      model: 'gpt-image-2',
      ratioLabel: '1:8',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload9.ratioCapability, 'aspectRatio'),
      assert.equal(providerRatioPayload9.resolvedRatioLabel, '1:3'),
      assert.equal(providerRatioPayload9.params.aspectRatio, '1:3'));
  }),
  test('imageRatioPolicy: apimart gpt-image-2 4K only allows supported ratios', () => {
    const allowedRatiosForProviderModel9 = getAllowedRatiosForProviderModel(
      'apimart',
      'apimart/gpt-image-2',
      '4K',
    ).map((item11) => item11.label);
    assert.deepEqual(allowedRatiosForProviderModel9, GPT_IMAGE_2_4K_RATIO_LABELS);
  }),
  test('imageRatioPolicy: apimart gpt-image-2 4K falls back by direction', () => {
    (assert.equal(
      pickClosestRatioForProviderModel({
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        ratioLabel: '1:1',
        imageSize: '4K',
      }),
      '16:9',
    ),
      assert.equal(
        pickClosestRatioForProviderModel({
          provider: 'apimart',
          model: 'apimart/gpt-image-2',
          ratioLabel: '4:5',
          imageSize: '4K',
        }),
        '9:16',
      ),
      assert.equal(
        resolveProviderRatioPayload({
          provider: 'apimart',
          model: 'apimart/gpt-image-2',
          ratioLabel: '5:4',
          imageSize: '4K',
        }).params.size,
        '16:9',
      ));
  }),
  test('imageRatioPolicy: grsai gpt-image-2 4K follows official GRSAI ratios', () => {
    for (const index of ['gpt-image-2', 'grsai/gpt-image-2-vip']) {
      const allowedRatiosForProviderModel10 = getAllowedRatiosForProviderModel('grsai', index, '4K').map(
        (item12) => item12.label,
      );
      assert.deepEqual(allowedRatiosForProviderModel10, GRSAI_GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test('imageRatioPolicy: grsai gpt-image-2 4K falls back within official ratios', () => {
    (assert.equal(
      pickClosestRatioForProviderModel({
        provider: 'grsai',
        model: 'gpt-image-2',
        ratioLabel: '1:1',
        imageSize: '4K',
      }),
      '1:1',
    ),
      assert.equal(
        pickClosestRatioForProviderModel({
          provider: 'grsai',
          model: 'gpt-image-2-vip',
          ratioLabel: '4:5',
          imageSize: '4K',
        }),
        '4:5',
      ),
      assert.equal(
        resolveProviderRatioPayload({
          provider: 'grsai',
          model: 'gpt-image-2',
          ratioLabel: '5:4',
          imageSize: '4K',
        }).params.aspectRatio,
        '5:4',
      ));
  }),
  test('imageRatioPolicy: nano-banana-2 允许扩展纵横比', () => {
    const list3 = getAllowedRatiosForProviderModel('grsai', 'nano-banana-2').map((item13) => item13.label);
    (assert.ok(list3.includes('1:4')),
      assert.ok(list3.includes('4:1')),
      assert.ok(list3.includes('1:8')),
      assert.ok(list3.includes('8:1')));
    const list4 = getAllowedRatiosForProviderModel('apimart', 'apimart/nano-banana-2').map(
      (item14) => item14.label,
    );
    (assert.ok(list4.includes('1:4')),
      assert.ok(list4.includes('4:1')),
      assert.ok(list4.includes('1:8')),
      assert.ok(list4.includes('8:1')));
    const list5 = getAllowedRatiosForProviderModel('grsai', 'nano-banana').map((item15) => item15.label);
    (assert.equal(list5.includes('1:4'), false), assert.equal(list5.includes('4:1'), false));
  }),
  test('imageRatioPolicy: 从 nano2 切走后非常规比例按最近值回落', () => {
    const providerRatioPayload10 = resolveProviderRatioPayload({
      provider: 'grsai',
      model: 'nano-banana',
      ratioLabel: '1:4',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload10.resolvedRatioLabel, '9:16'),
      assert.equal(providerRatioPayload10.params.aspectRatio, '9:16'));
    const providerRatioPayload11 = resolveProviderRatioPayload({
      provider: 'grsai',
      model: 'nano-banana',
      ratioLabel: '8:1',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload11.resolvedRatioLabel, '21:9'),
      assert.equal(providerRatioPayload11.params.aspectRatio, '21:9'));
  }),
  test('imageRatioPolicy: apimart nano-banana-2 透传扩展比例为 size', () => {
    const providerRatioPayload12 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/nano-banana-2',
      ratioLabel: '1:8',
      imageSize: '2K',
    });
    (assert.equal(providerRatioPayload12.ratioCapability, 'size'),
      assert.equal(providerRatioPayload12.resolvedRatioLabel, '1:8'),
      assert.equal(providerRatioPayload12.params.size, '1:8'));
  }));
