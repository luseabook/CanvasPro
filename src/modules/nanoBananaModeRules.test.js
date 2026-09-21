import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNanoBananaModeLabel,
  getNanoBananaModeOptions,
  getNanoBananaSelectionFromModel,
  NANO_BANANA_FAMILIES,
  NANO_BANANA_MODES,
  resolveNanoBananaModelBySelection,
} from './nanoBananaModeRules.js';
(test('nanoBananaModeRules: RunningHub 模型映射为家族 + 版本模式', () => {
  const _0x52ccdf = [
    {
      model: 'runninghub-model/rhart-image-v1',
      family: NANO_BANANA_FAMILIES.NANOBANANA,
      mode: NANO_BANANA_MODES.NORMAL,
      label: '低价版',
      resolved: 'runninghub-model/rhart-image-v1',
    },
    {
      model: 'runninghub-model/rhart-image-v1-official',
      family: NANO_BANANA_FAMILIES.NANOBANANA,
      mode: NANO_BANANA_MODES.OFFICIAL,
      label: '官方版',
      resolved: 'runninghub-model/rhart-image-v1-official',
    },
    {
      model: 'runninghub-model/rhart-image-n-pro-official',
      family: NANO_BANANA_FAMILIES.NANOBANANA_PRO,
      mode: NANO_BANANA_MODES.OFFICIAL,
      label: '官方版',
      resolved: 'runninghub-model/rhart-image-n-pro-official',
    },
    {
      model: 'runninghub-model/rhart-image-n-g31-flash',
      family: NANO_BANANA_FAMILIES.NANOBANANA_2,
      mode: NANO_BANANA_MODES.NORMAL,
      label: '低价版',
      resolved: 'runninghub-model/rhart-image-n-g31-flash',
    },
  ];
  for (const _0x46a1b8 of _0x52ccdf) {
    const _0x58d4f4 = getNanoBananaSelectionFromModel(_0x46a1b8.model, '2K', 'runninghub');
    (assert.equal(_0x58d4f4.provider, 'runninghub'),
      assert.equal(_0x58d4f4.family, _0x46a1b8.family),
      assert.equal(_0x58d4f4.mode, _0x46a1b8.mode),
      assert.equal(_0x58d4f4.model, _0x46a1b8.resolved),
      assert.equal(getNanoBananaModeLabel(_0x46a1b8.family, _0x46a1b8.mode, 'runninghub'), _0x46a1b8.label));
  }
}),
  test('nanoBananaModeRules: RunningHub 三个家族都支持低价版和官方版解析', () => {
    const _0x3208f0 = [
      [
        NANO_BANANA_FAMILIES.NANOBANANA,
        'runninghub-model/rhart-image-v1',
        'runninghub-model/rhart-image-v1-official',
      ],
      [
        NANO_BANANA_FAMILIES.NANOBANANA_PRO,
        'runninghub-model/rhart-image-n-pro',
        'runninghub-model/rhart-image-n-pro-official',
      ],
      [
        NANO_BANANA_FAMILIES.NANOBANANA_2,
        'runninghub-model/rhart-image-n-g31-flash',
        'runninghub-model/rhart-image-n-g31-flash-official',
      ],
    ];
    for (const [_0x10ac34, _0xf2b6aa, _0x2ad0ad] of _0x3208f0) {
      (assert.equal(
        resolveNanoBananaModelBySelection({
          family: _0x10ac34,
          mode: NANO_BANANA_MODES.NORMAL,
          provider: 'runninghub',
        }),
        _0xf2b6aa,
      ),
        assert.equal(
          resolveNanoBananaModelBySelection({
            family: _0x10ac34,
            mode: NANO_BANANA_MODES.OFFICIAL,
            provider: 'runninghub',
          }),
          _0x2ad0ad,
        ));
    }
    assert.deepEqual(
      getNanoBananaModeOptions(NANO_BANANA_FAMILIES.NANOBANANA_PRO, 'runninghub').map(
        (_0x47fb99) => _0x47fb99.label,
      ),
      ['低价版', '官方版'],
    );
  }),
  test('nanoBananaModeRules: RunningHub GPT image 2 supports cheap and official modes', () => {
    const _0x5da089 = getNanoBananaSelectionFromModel('runninghub-model/rhart-image-g-2', '2K', 'runninghub');
    (assert.equal(_0x5da089.provider, 'runninghub'),
      assert.equal(_0x5da089.family, NANO_BANANA_FAMILIES.GPT_IMAGE_2),
      assert.equal(_0x5da089.mode, NANO_BANANA_MODES.NORMAL),
      assert.equal(_0x5da089.model, 'runninghub-model/rhart-image-g-2'));
    const _0x5970d3 = getNanoBananaSelectionFromModel(
      'runninghub-model/rhart-image-g-2-official',
      '2K',
      'runninghub',
    );
    (assert.equal(_0x5970d3.provider, 'runninghub'),
      assert.equal(_0x5970d3.family, NANO_BANANA_FAMILIES.GPT_IMAGE_2),
      assert.equal(_0x5970d3.mode, NANO_BANANA_MODES.OFFICIAL),
      assert.equal(_0x5970d3.model, 'runninghub-model/rhart-image-g-2-official'),
      assert.equal(
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES.GPT_IMAGE_2,
          mode: NANO_BANANA_MODES.NORMAL,
          provider: 'runninghub',
        }),
        'runninghub-model/rhart-image-g-2',
      ),
      assert.equal(
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES.GPT_IMAGE_2,
          mode: NANO_BANANA_MODES.OFFICIAL,
          provider: 'runninghub',
        }),
        'runninghub-model/rhart-image-g-2-official',
      ),
      assert.deepEqual(
        getNanoBananaModeOptions(NANO_BANANA_FAMILIES.GPT_IMAGE_2, 'runninghub').map(
          (_0x208d67) => _0x208d67.mode,
        ),
        [NANO_BANANA_MODES.NORMAL, NANO_BANANA_MODES.OFFICIAL],
      ));
  }),
  test('nanoBananaModeRules: GRSAI 模式映射保持原行为', () => {
    (assert.equal(
      resolveNanoBananaModelBySelection({
        family: NANO_BANANA_FAMILIES.NANOBANANA_PRO,
        mode: NANO_BANANA_MODES.VIP,
        imageSize: '4K',
      }),
      'nano-banana-pro-4k-vip',
    ),
      assert.equal(
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES.NANOBANANA_PRO,
          mode: NANO_BANANA_MODES.VIP,
          imageSize: '2K',
        }),
        'nano-banana-pro-vip',
      ),
      assert.equal(
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES.NANOBANANA_2,
          mode: NANO_BANANA_MODES.CL,
          imageSize: '2K',
        }),
        'nano-banana-2-cl',
      ),
      assert.equal(
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES.NANOBANANA_2,
          mode: NANO_BANANA_MODES.CL,
          imageSize: '4K',
        }),
        'nano-banana-2-4k-cl',
      ),
      assert.equal(
        getNanoBananaModeLabel(NANO_BANANA_FAMILIES.NANOBANANA_PRO, NANO_BANANA_MODES.NORMAL),
        '常规',
      ),
      assert.equal(
        resolveNanoBananaModelBySelection({
          family: NANO_BANANA_FAMILIES.NANOBANANA_PRO,
          mode: NANO_BANANA_MODES.VIP,
          imageSize: '3K',
        }),
        'nano-banana-pro-vip',
      ),
      assert.deepEqual(
        getNanoBananaModeOptions(NANO_BANANA_FAMILIES.NANOBANANA_PRO).map((_0x4abf2d) => _0x4abf2d.mode),
        [NANO_BANANA_MODES.NORMAL, NANO_BANANA_MODES.VT, NANO_BANANA_MODES.CL, NANO_BANANA_MODES.VIP],
      ));
  }));
