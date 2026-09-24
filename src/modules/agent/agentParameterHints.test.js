import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAgentDuplicateCountHint,
  extractAgentParameterHints,
  buildSupportedAgentParamsFromHints,
  isAgentEditableParamField,
} from './agentParameterHints.js';

test('副本数量提示：中文动词、量词与英文子句三类模式各取首个命中', () => {
  assert.equal(extractAgentDuplicateCountHint('把这个节点复制3份'), 3);
  assert.equal(extractAgentDuplicateCountHint('克隆两个副本'), 2);
  assert.equal(extractAgentDuplicateCountHint('拷贝 5 个'), 5);
  assert.equal(extractAgentDuplicateCountHint('please duplicate 4 copies'), 4);
  assert.equal(extractAgentDuplicateCountHint('make 2 copies of it'), 2);
  assert.equal(extractAgentDuplicateCountHint(''), undefined);
  assert.equal(extractAgentDuplicateCountHint('复制这个节点'), undefined);
});

test('副本数量提示：中文十进制与「两」映射，越界与非整数一律 undefined', () => {
  assert.equal(extractAgentDuplicateCountHint('复制十份'), 10);
  assert.equal(extractAgentDuplicateCountHint('复制二十三份'), undefined);
  assert.equal(extractAgentDuplicateCountHint('复制十二份'), 12);
  assert.equal(extractAgentDuplicateCountHint('复制 0 份'), undefined);
  assert.equal(extractAgentDuplicateCountHint('复制 12 份'), 12);
  assert.equal(extractAgentDuplicateCountHint('复制 13 份'), undefined);
  assert.equal(extractAgentDuplicateCountHint('复制一百份'), undefined);
});

test('尺寸提示：三种乘号写法都识别，比例按最大公约数约简，分辨率取高', () => {
  const landscape = extractAgentParameterHints('做一张 1920x1080 的图');
  assert.deepEqual(landscape.params, {
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    resolution: '1080p',
  });
  assert.deepEqual(landscape.requestedParamIds, ['width', 'height', 'aspectRatio', 'resolution']);
  assert.equal(landscape.hasHints, true);
  assert.deepEqual(extractAgentParameterHints('1080 × 1920').params, {
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    resolution: '1920p',
  });
  assert.deepEqual(extractAgentParameterHints('尺寸 1280*720').params.aspectRatio, '16:9');
  assert.equal(extractAgentParameterHints('随便画点什么').hasHints, false);
  assert.deepEqual(extractAgentParameterHints('随便画点什么'), {
    params: {},
    requestedParamIds: [],
    hasHints: false,
  });
});

test('尺寸提示：位数不在 3–5 内不算尺寸，比例段也不参与约简', () => {
  assert.deepEqual(extractAgentParameterHints('64x32 太小').params, {});
  assert.deepEqual(extractAgentParameterHints('12345x12345').params.width, 12345);
});

test('比例提示：命中常用表才采纳，非常用比例被丢弃后回落到关键词或尺寸推导', () => {
  assert.equal(extractAgentParameterHints('画个 4:3 的图').params.aspectRatio, '4:3');
  assert.equal(extractAgentParameterHints('画个 9：16 的图').params.aspectRatio, '9:16');
  assert.equal(extractAgentParameterHints('画个 2比3 的图').params.aspectRatio, '2:3');
  // 5:3 不在常用表内 ⇒ 丢弃，且文本无关键词 ⇒ 回落尺寸（此处无尺寸）⇒ 空
  assert.equal('aspectRatio' in extractAgentParameterHints('画个 5:3 的图').params, false);
  // 显式比例优先于关键词
  assert.equal(extractAgentParameterHints('竖版的 16:9 海报').params.aspectRatio, '16:9');
  assert.equal(extractAgentParameterHints('来个横版封面').params.aspectRatio, '16:9');
  assert.equal(extractAgentParameterHints('portrait 的图').params.aspectRatio, '9:16');
  assert.equal(extractAgentParameterHints('方图一张').params.aspectRatio, '1:1');
  // 关键词判定在尺寸之后，故无显式比例时可用尺寸推导
  assert.equal(extractAgentParameterHints('1920x1080 竖版').params.aspectRatio, '9:16');
});

test('分辨率提示：词表命中后规范化，高清类词固定 1080p，否则回落尺寸高度', () => {
  assert.equal(extractAgentParameterHints('导出 1080P 版本').params.resolution, '1080p');
  assert.equal(extractAgentParameterHints('画个 4K 的').params.resolution, '4K');
  assert.equal(extractAgentParameterHints('画个 2K 的').params.resolution, '2K');
  // 词表要求数字与单位紧邻，中间有空格即整段落空
  assert.equal('resolution' in extractAgentParameterHints('画个 2 k 的').params, false);
  assert.equal(extractAgentParameterHints('要高清的').params.resolution, '1080p');
  assert.equal(extractAgentParameterHints('高画质海报').params.resolution, '1080p');
  // 无分辨率词但带尺寸：resolution 由尺寸高度推导（端口现状）
  assert.equal(extractAgentParameterHints('1280x720').params.resolution, '720p');
  assert.equal('resolution' in extractAgentParameterHints('随便画').params, false);
});

test('时长与批量提示：秒数支持小数与英文单位，批量须命中量词搭配', () => {
  assert.equal(extractAgentParameterHints('生成 8 秒视频').params.duration, 8);
  assert.equal(extractAgentParameterHints('a 0.5s clip').params.duration, 0.5);
  assert.equal(extractAgentParameterHints('15 seconds later').params.duration, 15);
  assert.equal('duration' in extractAgentParameterHints('2 分钟视频').params, false);
  assert.equal(extractAgentParameterHints('批量生成 4 张图').params.batchSize, 4);
  assert.equal(extractAgentParameterHints('出 3 幅海报').params.batchSize, 3);
  assert.equal(extractAgentParameterHints('生成 10 images').params.batchSize, 10);
  assert.equal('batchSize' in extractAgentParameterHints('生成一批图').params, false);
});

test('提示聚合：requestedParamIds 按固定顺序出现，hasHints 只看参数是否为空', () => {
  const all = extractAgentParameterHints('批量生成 4 张 16:9 的 4K 图，时长 6 秒');
  assert.deepEqual(all.params, {
    aspectRatio: '16:9',
    resolution: '4K',
    duration: 6,
    batchSize: 4,
  });
  assert.deepEqual(all.requestedParamIds, ['aspectRatio', 'resolution', 'duration', 'batchSize']);
  assert.deepEqual(extractAgentParameterHints(undefined).params, {});
});

test('参数落地：按 displayRole / id / 标签依次归类，一个字段只吃一个参数', () => {
  const schema = {
    uiSchema: {
      fields: [
        { id: 'ratio', displayRole: 'aspectRatio' },
        { id: 'resolution' },
        { id: 'duration' },
        { id: 'max_images' },
        { id: 'width' },
        { id: 'height' },
      ],
    },
  };
  const hints = extractAgentParameterHints('1920x1080 高清 6 秒 批量 4 张');
  const applied = buildSupportedAgentParamsFromHints(schema, hints);
  assert.deepEqual(applied.params, {
    ratio: '16:9',
    resolution: '1080p',
    duration: 6,
    max_images: 4,
    width: 1920,
    height: 1080,
  });
  assert.deepEqual(applied.appliedParamIds, [
    'ratio',
    'resolution',
    'duration',
    'max_images',
    'width',
    'height',
  ]);
  // 六个 canonical 参数名全部被某个字段接住，故 unsupportedParamIds 为空
  assert.deepEqual(applied.unsupportedParamIds, []);
});

test('参数落地：标签命中同样归类，id 为空的字段直接跳过', () => {
  const schema = {
    uiSchema: {
      fields: [
        { id: '', displayRole: 'aspectRatio' },
        { id: 'size', label: '输出尺寸' },
        { id: 'sec', label: '时长（秒）', displayRole: 'Duration' },
        { id: 'count', label: '生成数量' },
        { id: 'style', label: '画风' },
      ],
    },
  };
  const applied = buildSupportedAgentParamsFromHints(schema, {
    params: { resolution: '1080p', duration: 5, batchSize: 3, aspectRatio: '1:1' },
    requestedParamIds: ['resolution', 'duration', 'batchSize', 'aspectRatio'],
  });
  assert.deepEqual(applied.params, { size: '1080p', sec: 5, count: 3 });
  assert.deepEqual(applied.unsupportedParamIds, ['aspectRatio']);
});

test('参数落地：有 options 的字段只接受表内值，归一化按 value 或 id 或 label 匹配', () => {
  const schema = {
    uiSchema: {
      fields: [
        { id: 'aspectRatio', options: [{ value: '16:9' }, { id: 'portrait', label: '竖版 9:16' }, '1:1'] },
        { id: 'resolution', options: [{ label: '720P' }, { label: '1080P' }] },
      ],
    },
  };
  const ok = buildSupportedAgentParamsFromHints(schema, {
    params: { aspectRatio: '竖版 9:16', resolution: '1080p' },
    requestedParamIds: ['aspectRatio', 'resolution'],
  });
  assert.deepEqual(ok.params, { aspectRatio: 'portrait', resolution: '1080P' });
  assert.deepEqual(ok.appliedParamIds, ['aspectRatio', 'resolution']);
  assert.deepEqual(ok.unsupportedParamIds, []);
  const rejected = buildSupportedAgentParamsFromHints(schema, {
    params: { aspectRatio: '5:4', resolution: '4K' },
    requestedParamIds: ['aspectRatio', 'resolution'],
  });
  assert.deepEqual(rejected.params, {});
  assert.deepEqual(rejected.unsupportedParamIds, ['aspectRatio', 'resolution']);
  // normalizeOptionText 只归一空白/英文逗号/×，全角冒号不参与匹配 ⇒ 同一标签写法即落空
  const fullwidth = buildSupportedAgentParamsFromHints(schema, {
    params: { aspectRatio: '竖版 9：16' },
    requestedParamIds: ['aspectRatio'],
  });
  assert.deepEqual(fullwidth.params, {});
  assert.deepEqual(fullwidth.unsupportedParamIds, ['aspectRatio']);
});

test('参数落地：batchSize 有 options 且未命中时整段跳过，无 options 时原样写入且重复归类字段都吃到值', () => {
  const withOptions = {
    uiSchema: {
      fields: [
        { id: 'batchSize', options: [{ value: 1 }, { value: 2 }] },
        { id: 'seed', label: '随机种子' },
      ],
    },
  };
  const skipped = buildSupportedAgentParamsFromHints(withOptions, {
    params: { batchSize: 7, width: 1024 },
    requestedParamIds: ['batchSize', 'width'],
  });
  assert.deepEqual(skipped.params, {});
  assert.deepEqual(skipped.appliedParamIds, []);
  assert.deepEqual(skipped.unsupportedParamIds, ['batchSize', 'width']);
  const noOptions = { uiSchema: { fields: [{ id: 'batchSize' }, { id: 'max_images' }] } };
  const applied = buildSupportedAgentParamsFromHints(noOptions, {
    params: { batchSize: 7 },
    requestedParamIds: ['batchSize'],
  });
  // 两个字段都归为 batch 类，同一值被写入两次（端口现状）
  assert.deepEqual(applied.params, { batchSize: 7, max_images: 7 });
  assert.deepEqual(applied.unsupportedParamIds, []);
});

test('参数落地：缺省 requestedParamIds 时以 params 键为准，空数组视为「无请求」', () => {
  const schema = { uiSchema: { fields: [{ id: 'resolution' }, { id: 'duration' }] } };
  const inferred = buildSupportedAgentParamsFromHints(schema, { params: { resolution: '4K', duration: 3 } });
  assert.deepEqual(inferred.params, { resolution: '4K', duration: 3 });
  assert.deepEqual(inferred.unsupportedParamIds, []);
  const empty = buildSupportedAgentParamsFromHints(schema, {
    params: { resolution: '4K' },
    requestedParamIds: [],
  });
  assert.deepEqual(empty.params, { resolution: '4K' });
  assert.deepEqual(empty.unsupportedParamIds, []);
  assert.deepEqual(buildSupportedAgentParamsFromHints({}, { params: { resolution: '4K' } }), {
    params: {},
    appliedParamIds: [],
    unsupportedParamIds: ['resolution'],
  });
  assert.deepEqual(buildSupportedAgentParamsFromHints(undefined, undefined), {
    params: {},
    appliedParamIds: [],
    unsupportedParamIds: [],
  });
});

test('参数落地：值为 undefined 或空串的字段直接跳过，空串不算成功应用', () => {
  const schema = { uiSchema: { fields: [{ id: 'resolution' }, { id: 'duration' }] } };
  const applied = buildSupportedAgentParamsFromHints(schema, {
    params: { resolution: '', duration: 0, aspectRatio: '1:1' },
    requestedParamIds: ['resolution', 'duration', 'aspectRatio'],
  });
  assert.deepEqual(applied.params, { duration: 0 });
  assert.deepEqual(applied.unsupportedParamIds, ['resolution', 'aspectRatio']);
});

test('可编辑判定：id 必填、类型白名单外一律不可编辑', () => {
  assert.equal(isAgentEditableParamField({}, {}), false);
  assert.equal(isAgentEditableParamField({ id: '  ', type: 'select' }, {}), false);
  for (const type of ['segmented', 'select', 'slider', 'stepper', 'toggle', 'text']) {
    assert.equal(isAgentEditableParamField({ id: 'weird', type }, {}), false, type);
  }
  // 类型判定只做小写化、不裁剪空格，故 'SELECT' 通过、' Slider ' 落空
  assert.equal(
    isAgentEditableParamField({ id: 'aspectRatio', type: 'SELECT' }, { aspectRatio: '1:1' }),
    true,
  );
  for (const type of [' Slider ', 'number', 'color', '']) {
    assert.equal(isAgentEditableParamField({ id: 'aspectRatio', type }, { aspectRatio: '1:1' }), false, type);
  }
});

test('可编辑判定：现有参数含同名键即放开，否则回落到常用参数名与角色判定', () => {
  assert.equal(isAgentEditableParamField({ id: 'custom', type: 'select' }, { custom: 1 }), true);
  assert.equal(isAgentEditableParamField({ id: 'custom', type: 'select' }, { custom: undefined }), true);
  assert.equal(isAgentEditableParamField({ id: 'custom', type: 'select' }, {}), false);
  for (const id of [
    'aspectRatio',
    'ratio',
    'size',
    'resolution',
    'width',
    'height',
    'duration',
    'batchSize',
    'max_images',
  ]) {
    assert.equal(isAgentEditableParamField({ id, type: 'slider' }, {}), true, id);
  }
  assert.equal(isAgentEditableParamField({ id: 'x', displayRole: 'aspectRatio', type: 'text' }, {}), true);
  // 标签匹配只比对拉丁候选词，中文标签永远不命中（端口现状）
  assert.equal(isAgentEditableParamField({ id: 'x', label: '输出分辨率', type: 'text' }, {}), false);
  assert.equal(isAgentEditableParamField({ id: 'x', label: 'Output Resolution', type: 'text' }, {}), true);
  assert.equal(isAgentEditableParamField({ id: 'x', label: 'MAX_IMAGES', type: 'text' }, {}), true);
  assert.equal(isAgentEditableParamField({ id: 'x', label: 'Seconds', type: 'text' }, {}), false);
  assert.equal(isAgentEditableParamField({ id: 'x', label: 'Clip Duration', type: 'text' }, {}), true);
  assert.equal(isAgentEditableParamField({ id: 'x', label: '提示词', type: 'text' }, {}), false);
  assert.equal(isAgentEditableParamField({ id: 'x', type: 'text' }, null), false);
});
