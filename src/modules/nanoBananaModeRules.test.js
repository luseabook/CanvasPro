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
  const value = [
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
  for (const item of value) {
    const nanoBananaSelectionFromModel = getNanoBananaSelectionFromModel(item.model, '2K', 'runninghub');
    (assert.equal(nanoBananaSelectionFromModel.provider, 'runninghub'),
      assert.equal(nanoBananaSelectionFromModel.family, item.family),
      assert.equal(nanoBananaSelectionFromModel.mode, item.mode),
      assert.equal(nanoBananaSelectionFromModel.model, item.resolved),
      assert.equal(getNanoBananaModeLabel(item.family, item.mode, 'runninghub'), item.label));
  }
}),
  test('nanoBananaModeRules: RunningHub 三个家族都支持低价版和官方版解析', () => {
    const key = [
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
    for (const [family, index, result] of key) {
      (assert.equal(
        resolveNanoBananaModelBySelection({
          family: family,
          mode: NANO_BANANA_MODES.NORMAL,
          provider: 'runninghub',
        }),
        index,
      ),
        assert.equal(
          resolveNanoBananaModelBySelection({
            family: family,
            mode: NANO_BANANA_MODES.OFFICIAL,
            provider: 'runninghub',
          }),
          result,
        ));
    }
    assert.deepEqual(
      getNanoBananaModeOptions(NANO_BANANA_FAMILIES.NANOBANANA_PRO, 'runninghub').map((item2) => item2.label),
      ['低价版', '官方版'],
    );
  }),
  test('nanoBananaModeRules: RunningHub GPT image 2 supports cheap and official modes', () => {
    const nanoBananaSelectionFromModel2 = getNanoBananaSelectionFromModel(
      'runninghub-model/rhart-image-g-2',
      '2K',
      'runninghub',
    );
    (assert.equal(nanoBananaSelectionFromModel2.provider, 'runninghub'),
      assert.equal(nanoBananaSelectionFromModel2.family, NANO_BANANA_FAMILIES.GPT_IMAGE_2),
      assert.equal(nanoBananaSelectionFromModel2.mode, NANO_BANANA_MODES.NORMAL),
      assert.equal(nanoBananaSelectionFromModel2.model, 'runninghub-model/rhart-image-g-2'));
    const nanoBananaSelectionFromModel3 = getNanoBananaSelectionFromModel(
      'runninghub-model/rhart-image-g-2-official',
      '2K',
      'runninghub',
    );
    (assert.equal(nanoBananaSelectionFromModel3.provider, 'runninghub'),
      assert.equal(nanoBananaSelectionFromModel3.family, NANO_BANANA_FAMILIES.GPT_IMAGE_2),
      assert.equal(nanoBananaSelectionFromModel3.mode, NANO_BANANA_MODES.OFFICIAL),
      assert.equal(nanoBananaSelectionFromModel3.model, 'runninghub-model/rhart-image-g-2-official'),
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
        getNanoBananaModeOptions(NANO_BANANA_FAMILIES.GPT_IMAGE_2, 'runninghub').map((item3) => item3.mode),
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
        getNanoBananaModeOptions(NANO_BANANA_FAMILIES.NANOBANANA_PRO).map((item4) => item4.mode),
        [NANO_BANANA_MODES.NORMAL, NANO_BANANA_MODES.VT, NANO_BANANA_MODES.CL, NANO_BANANA_MODES.VIP],
      ));
  }));
