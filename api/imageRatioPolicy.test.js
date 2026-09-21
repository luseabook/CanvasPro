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
    (assert.equal(pickClosestRatio(0x2bc, 0x514), '9:16'), assert.equal(pickClosestRatio(0, 0), '1:1'));
  }),
  test('imageRatioPolicy: adaptive source prefers display > input > fallback', () => {
    const _0x19b6f7 = resolveAdaptiveSourceSize({
      displayWidth: 0x640,
      displayHeight: 0x384,
      inputWidth: 0x320,
      inputHeight: 0x4b0,
    });
    assert.deepEqual(_0x19b6f7, { width: 0x640, height: 0x384, source: 'display' });
    const _0x18eef3 = resolveAdaptiveSourceSize({
      displayWidth: 0,
      displayHeight: 0,
      inputWidth: 0x320,
      inputHeight: 0x4b0,
    });
    assert.deepEqual(_0x18eef3, { width: 0x320, height: 0x4b0, source: 'input-media' });
    const _0x11f322 = resolveAdaptiveSourceSize({});
    assert.deepEqual(_0x11f322, { width: 1, height: 1, source: 'fallback' });
  }),
  test('imageRatioPolicy: provider payload supports dimensions and none', () => {
    const _0x320282 = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/seedream-v4.5',
      ratioLabel: '15:9',
      imageSize: '2K',
    });
    (assert.equal(_0x320282.ratioCapability, 'dimensions'),
      assert.equal(_0x320282.resolvedRatioLabel, '16:9'),
      assert.ok(Number.isInteger(_0x320282.params.width)),
      assert.ok(Number.isInteger(_0x320282.params.height)));
    const _0x41625b = resolveProviderRatioPayload({
      provider: 'runninghubwf',
      model: 'runninghub/1994718111704158209',
      ratioLabel: '16:9',
      imageSize: '2K',
    });
    (assert.equal(_0x41625b.ratioCapability, 'none'),
      assert.equal(_0x41625b.suppressAspectRatio, true),
      assert.deepEqual(_0x41625b.params, {}));
    const _0x1e75cf = resolveProviderRatioPayload({
      provider: 'runninghubwf',
      model: 'runninghub/2050306122774532097',
      ratioLabel: '16:9',
      imageSize: '2K',
    });
    (assert.equal(_0x1e75cf.ratioCapability, 'dimensions'),
      assert.equal(_0x1e75cf.resolvedRatioLabel, '16:9'),
      assert.ok(Number.isInteger(_0x1e75cf.params.width)),
      assert.ok(Number.isInteger(_0x1e75cf.params.height)));
  }),
  test('imageRatioPolicy: apimart seedream ratio allowlist follows model rules', () => {
    const _0x7299c = getAllowedRatiosForProviderModel('apimart', 'apimart/seedream-4.5').map(
      (_0x1c7a9d) => _0x1c7a9d.label,
    );
    (assert.ok(_0x7299c.includes('9:21')),
      assert.equal(_0x7299c.includes('5:4'), false),
      assert.equal(_0x7299c.includes('4:5'), false));
    const _0x4cf2f6 = getAllowedRatiosForProviderModel('apimart', 'apimart/seedream-5.0-lite').map(
      (_0x2f8712) => _0x2f8712.label,
    );
    (assert.equal(_0x4cf2f6.includes('9:21'), false),
      assert.equal(_0x4cf2f6.includes('5:4'), false),
      assert.equal(_0x4cf2f6.includes('4:5'), false));
  }),
  test('imageRatioPolicy: apimart seedream falls back from unsupported 5:4 ratio', () => {
    const _0x9eb68a = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/seedream-4.5',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(_0x9eb68a.ratioCapability, 'size'), assert.equal(_0x9eb68a.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart qwen-image-2.0 uses documented ratios only', () => {
    const _0x1a5207 = getAllowedRatiosForProviderModel('apimart', 'apimart/qwen-image-2.0', '2K').map(
      (_0x1cc16d) => _0x1cc16d.label,
    );
    assert.deepEqual(_0x1a5207, QWEN_IMAGE_RATIO_LABELS);
    const _0x4e9ea5 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/qwen-image-2.0',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(_0x4e9ea5.ratioCapability, 'size'),
      assert.equal(_0x4e9ea5.resolvedRatioLabel, '4:3'),
      assert.equal(_0x4e9ea5.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart z-image-turbo uses documented ratios only', () => {
    const _0x25a7ee = getAllowedRatiosForProviderModel('apimart', 'apimart/z-image-turbo', '2K').map(
      (_0x185ae2) => _0x185ae2.label,
    );
    assert.deepEqual(_0x25a7ee, QWEN_IMAGE_RATIO_LABELS);
    const _0xbad634 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/z-image-turbo',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(_0xbad634.ratioCapability, 'size'),
      assert.equal(_0xbad634.resolvedRatioLabel, '4:3'),
      assert.equal(_0xbad634.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart wan2.7-image uses documented ratios only', () => {
    const _0x23818f = getAllowedRatiosForProviderModel('apimart', 'apimart/wan2.7-image', '2K').map(
      (_0x47a113) => _0x47a113.label,
    );
    assert.deepEqual(_0x23818f, QWEN_IMAGE_RATIO_LABELS);
    const _0x279cca = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/wan2.7-image',
      ratioLabel: '5:4',
      imageSize: '2K',
    });
    (assert.equal(_0x279cca.ratioCapability, 'size'),
      assert.equal(_0x279cca.resolvedRatioLabel, '4:3'),
      assert.equal(_0x279cca.params.size, '4:3'));
  }),
  test('imageRatioPolicy: apimart gpt-image-2 supports documented ratios outside 4K', () => {
    const _0x288b30 = getAllowedRatiosForProviderModel('apimart', 'apimart/gpt-image-2', '2K').map(
      (_0x1c5f0d) => _0x1c5f0d.label,
    );
    assert.deepEqual(_0x288b30, GPT_IMAGE_2_RATIO_LABELS);
  }),
  test('imageRatioPolicy: grsai gpt-image-2 supports official 2K/4K ratios', () => {
    for (const _0x294131 of [
      'gpt-image-2',
      'grsai/gpt-image-2',
      'gpt-image-2-vip',
      'grsai/gpt-image-2-vip',
    ]) {
      const _0x360609 = getAllowedRatiosForProviderModel('grsai', _0x294131, '2K').map(
        (_0x3d15b8) => _0x3d15b8.label,
      );
      assert.deepEqual(_0x360609, GRSAI_GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test('imageRatioPolicy: grsai gpt-image-2 1K only keeps official 1K pixel ratios', () => {
    const _0x3c8ee6 = getAllowedRatiosForProviderModel('grsai', 'gpt-image-2', '1K').map(
      (_0x4a1150) => _0x4a1150.label,
    );
    assert.deepEqual(_0x3c8ee6, GRSAI_GPT_IMAGE_2_1K_RATIO_LABELS);
  }),
  test('imageRatioPolicy: runninghub gpt-image-2 supports documented ratios', () => {
    for (const _0x33f6d3 of [
      'runninghub-model/rhart-image-g-2',
      'runninghub-model/rhart-image-g-2-official',
    ]) {
      const _0x259d16 = getAllowedRatiosForProviderModel('runninghub', _0x33f6d3, '2K').map(
        (_0x1d2c90) => _0x1d2c90.label,
      );
      assert.deepEqual(_0x259d16, GPT_IMAGE_2_RATIO_LABELS);
    }
  }),
  test('imageRatioPolicy: runninghub official gpt-image-2 4K only allows supported ratios', () => {
    const _0x2df2a6 = getAllowedRatiosForProviderModel(
      'runninghub',
      'runninghub-model/rhart-image-g-2-official',
      '4K',
    ).map((_0x348a52) => _0x348a52.label);
    assert.deepEqual(_0x2df2a6, GPT_IMAGE_2_4K_RATIO_LABELS);
  }),
  test('imageRatioPolicy: runninghub gpt-image-2 falls back to nearest documented ratio', () => {
    const _0x5c420b = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/rhart-image-g-2-official',
      ratioLabel: '1:8',
      imageSize: '4K',
    });
    (assert.equal(_0x5c420b.ratioCapability, 'aspectRatio'),
      assert.equal(_0x5c420b.resolvedRatioLabel, '9:21'),
      assert.equal(_0x5c420b.params.aspectRatio, '9:21'));
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
    const _0x35c41e = resolveProviderRatioPayload({
      provider: 'grsai',
      model: 'gpt-image-2',
      ratioLabel: '1:8',
      imageSize: '2K',
    });
    (assert.equal(_0x35c41e.ratioCapability, 'aspectRatio'),
      assert.equal(_0x35c41e.resolvedRatioLabel, '1:3'),
      assert.equal(_0x35c41e.params.aspectRatio, '1:3'));
  }),
  test('imageRatioPolicy: apimart gpt-image-2 4K only allows supported ratios', () => {
    const _0x52f9b1 = getAllowedRatiosForProviderModel('apimart', 'apimart/gpt-image-2', '4K').map(
      (_0x2399cd) => _0x2399cd.label,
    );
    assert.deepEqual(_0x52f9b1, GPT_IMAGE_2_4K_RATIO_LABELS);
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
    for (const _0x59c732 of ['gpt-image-2', 'grsai/gpt-image-2-vip']) {
      const _0x313f53 = getAllowedRatiosForProviderModel('grsai', _0x59c732, '4K').map(
        (_0x266758) => _0x266758.label,
      );
      assert.deepEqual(_0x313f53, GRSAI_GPT_IMAGE_2_RATIO_LABELS);
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
    const _0x21fb99 = getAllowedRatiosForProviderModel('grsai', 'nano-banana-2').map(
      (_0x4f65d2) => _0x4f65d2.label,
    );
    (assert.ok(_0x21fb99.includes('1:4')),
      assert.ok(_0x21fb99.includes('4:1')),
      assert.ok(_0x21fb99.includes('1:8')),
      assert.ok(_0x21fb99.includes('8:1')));
    const _0x20216d = getAllowedRatiosForProviderModel('apimart', 'apimart/nano-banana-2').map(
      (_0x5b5a20) => _0x5b5a20.label,
    );
    (assert.ok(_0x20216d.includes('1:4')),
      assert.ok(_0x20216d.includes('4:1')),
      assert.ok(_0x20216d.includes('1:8')),
      assert.ok(_0x20216d.includes('8:1')));
    const _0x23d3df = getAllowedRatiosForProviderModel('grsai', 'nano-banana').map(
      (_0x31596d) => _0x31596d.label,
    );
    (assert.equal(_0x23d3df.includes('1:4'), false), assert.equal(_0x23d3df.includes('4:1'), false));
  }),
  test('imageRatioPolicy: 从 nano2 切走后非常规比例按最近值回落', () => {
    const _0xa3a6b8 = resolveProviderRatioPayload({
      provider: 'grsai',
      model: 'nano-banana',
      ratioLabel: '1:4',
      imageSize: '2K',
    });
    (assert.equal(_0xa3a6b8.resolvedRatioLabel, '9:16'), assert.equal(_0xa3a6b8.params.aspectRatio, '9:16'));
    const _0x303832 = resolveProviderRatioPayload({
      provider: 'grsai',
      model: 'nano-banana',
      ratioLabel: '8:1',
      imageSize: '2K',
    });
    (assert.equal(_0x303832.resolvedRatioLabel, '21:9'), assert.equal(_0x303832.params.aspectRatio, '21:9'));
  }),
  test('imageRatioPolicy: apimart nano-banana-2 透传扩展比例为 size', () => {
    const _0x5dc875 = resolveProviderRatioPayload({
      provider: 'apimart',
      model: 'apimart/nano-banana-2',
      ratioLabel: '1:8',
      imageSize: '2K',
    });
    (assert.equal(_0x5dc875.ratioCapability, 'size'),
      assert.equal(_0x5dc875.resolvedRatioLabel, '1:8'),
      assert.equal(_0x5dc875.params.size, '1:8'));
  }));
