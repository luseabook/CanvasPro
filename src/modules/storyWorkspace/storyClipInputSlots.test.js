import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryClipInputSlotViewModel,
  normalizeStoryClipInputs,
  updateStoryClipInput,
} from './storyClipInputSlots.js';

// 视图模型直接读本仓 src/manifests 的真实模型声明（不注入替身），用到的三个模型：
//   apimart/veo3-fast：允许 text/image，图片最多 3 张，固定槽 firstFrame、lastFrame
//   runninghub/1971148165531475969：允许 text/image/video，图片、视频各 1 且必填，固定槽 refImage、sourceVideo
//   volcengine/seedream-5.0：图片模型

test('normalizeStoryClipInputs：非对象输入得到三类空数组', () => {
  const empty = { image: [], video: [], audio: [] };
  assert.deepEqual(normalizeStoryClipInputs(), empty);
  assert.deepEqual(normalizeStoryClipInputs(null), empty);
  assert.deepEqual(normalizeStoryClipInputs(['x']), empty);
});

test('normalizeStoryClipInputs：单数键优先，缺失时读复数键；单个值包成数组，假值当空', () => {
  const inputs = normalizeStoryClipInputs({
    image: 'https://x/a.png',
    images: ['ignored'],
    videos: [{ videoUrl: 'https://x/v.mp4' }],
    audio: '',
  });
  assert.deepEqual(inputs.image, [{ url: 'https://x/a.png', kind: 'image', slotId: '', order: 0 }]);
  assert.deepEqual(inputs.video, [
    { videoUrl: 'https://x/v.mp4', kind: 'video', url: 'https://x/v.mp4', slotId: '', order: 0 },
  ]);
  assert.deepEqual(inputs.audio, []);
});

test('normalizeStoryClipInputs：url 依次取 url/localUrl/imageUrl/videoUrl/audioUrl/localPath，槽位取 slotId 或 refSlot', () => {
  const { image } = normalizeStoryClipInputs({
    image: [
      { localPath: ' data/uploads/a.png ', refSlot: ' firstFrame ', extra: 1 },
      { url: '', localUrl: '/local/b.png', slotId: 'lastFrame', refSlot: 'ignored', order: '7' },
      { order: null },
      5,
    ],
  });
  assert.deepEqual(image[0], {
    localPath: ' data/uploads/a.png ',
    refSlot: ' firstFrame ',
    extra: 1,
    kind: 'image',
    url: 'data/uploads/a.png',
    slotId: 'firstFrame',
    order: 0,
  });
  assert.equal(image[1].url, '/local/b.png');
  assert.equal(image[1].slotId, 'lastFrame');
  assert.equal(image[1].order, 7);
  // Number(null) 是 0，属于有限数，所以 order 为 0 而不是下标 2（冻结行为）
  assert.equal(image[2].order, 0);
  assert.deepEqual(image[3], { kind: 'image', url: '', slotId: '', order: 3 });
});

test('buildStoryClipInputSlotViewModel：模型不存在、为空或不是视频模型时报缺 manifest', () => {
  assert.throws(() => buildStoryClipInputSlotViewModel({ modelId: 'no-such-model' }), {
    message: '视频模型缺少 manifest：no-such-model',
  });
  assert.throws(() => buildStoryClipInputSlotViewModel(), { message: '视频模型缺少 manifest：(empty)' });
  assert.throws(() => buildStoryClipInputSlotViewModel({ modelId: 'volcengine/seedream-5.0' }), {
    message: '视频模型缺少 manifest：volcengine/seedream-5.0',
  });
});

test('buildStoryClipInputSlotViewModel：按 allowedKinds 出分组，固定槽在前、其余按「类型 序号」补齐到上限', () => {
  const view = buildStoryClipInputSlotViewModel({ modelId: 'apimart/veo3-fast' });
  assert.equal(view.modelId, 'apimart/veo3-fast');
  assert.equal(view.provider, 'apimart');
  assert.equal(view.displayName, 'VEO3');
  assert.deepEqual(
    view.groups.map((group) => [group.kind, group.label, group.min, group.max]),
    [['image', '图片', 0, 3]],
  );
  assert.deepEqual(
    view.slots.map((slot) => [slot.id, slot.label, slot.index, slot.fixed, slot.required, slot.input]),
    [
      ['firstFrame', '首帧图', 0, true, false, null],
      ['lastFrame', '尾帧图', 1, true, false, null],
      ['image-3', '图片 3', 2, false, false, null],
    ],
  );
});

test('buildStoryClipInputSlotViewModel：分组按 image/video/audio 顺序，必填来自固定槽或 minByKind', () => {
  const view = buildStoryClipInputSlotViewModel({ modelId: 'runninghub/1971148165531475969' });
  assert.deepEqual(
    view.groups.map((group) => [group.kind, group.min, group.max]),
    [
      ['image', 1, 1],
      ['video', 1, 1],
    ],
  );
  assert.deepEqual(
    view.slots.map((slot) => [slot.id, slot.kind, slot.label, slot.required]),
    [
      ['refImage', 'image', '参考图', true],
      ['sourceVideo', 'video', '源视频', true],
    ],
  );
});

test('buildStoryClipInputSlotViewModel：带 slotId 的输入先占位，重复与未知槽位的输入依次补空槽，多余的丢弃', () => {
  const view = buildStoryClipInputSlotViewModel({
    modelId: 'apimart/veo3-fast',
    inputs: {
      image: [
        { url: 'a', slotId: 'lastFrame' },
        { url: 'b', slotId: 'lastFrame' },
        { url: 'c', slotId: 'unknown' },
        { url: 'd' },
        { url: 'e' },
      ],
    },
  });
  assert.deepEqual(
    view.slots.map((slot) => [slot.id, slot.input?.url ?? null]),
    [
      ['firstFrame', 'b'],
      ['lastFrame', 'a'],
      ['image-3', 'c'],
    ],
  );
  assert.deepEqual(view.groups[0].slots, view.slots);
});

test('buildStoryClipInputSlotViewModel：provider 提示可补全不带前缀的模型 id', () => {
  assert.equal(
    buildStoryClipInputSlotViewModel({ modelId: 'veo3-fast', provider: 'apimart' }).modelId,
    'apimart/veo3-fast',
  );
});

test('buildStoryClipInputSlotViewModel：provider 提示与带前缀 id 不一致时本仓注册表解析不到（世代差异）', () => {
  // 0.7.16 的注册表对带「/」的 id 直接精确命中；本仓 0.4.12 要求提示一致，所以这里会报缺 manifest
  assert.throws(
    () => buildStoryClipInputSlotViewModel({ modelId: 'apimart/veo3-fast', provider: 'runninghub' }),
    {
      message: '视频模型缺少 manifest：apimart/veo3-fast',
    },
  );
});

test('updateStoryClipInput：类型不支持或缺 slotId 时报错', () => {
  assert.throws(() => updateStoryClipInput({}, { kind: 'text', slotId: 'a' }), {
    message: '不支持的片段输入类型：text',
  });
  assert.throws(() => updateStoryClipInput({}, { slotId: 'a' }), {
    message: '不支持的片段输入类型：(empty)',
  });
  assert.throws(() => updateStoryClipInput({}, { kind: 'image', slotId: '  ' }), {
    message: '更新片段输入时缺少 slotId',
  });
});

test('updateStoryClipInput：替换同槽位输入，新值追加到末尾并写上 slotId，不改原对象', () => {
  const clip = {
    id: 'c1',
    inputs: {
      image: [
        { url: 'old', slotId: 'firstFrame' },
        { url: 'keep', slotId: 'lastFrame' },
      ],
      videos: ['v'],
    },
  };
  const next = updateStoryClipInput(clip, {
    kind: 'image',
    slotId: ' firstFrame ',
    value: 'https://x/new.png',
  });
  assert.notEqual(next, clip);
  assert.equal(next.id, 'c1');
  assert.deepEqual(next.inputs.image, [
    { url: 'keep', slotId: 'lastFrame', kind: 'image', order: 1 },
    { url: 'https://x/new.png', kind: 'image', slotId: 'firstFrame', order: 1 },
  ]);
  // 其余类型也被规范化，复数键不再保留
  assert.deepEqual(Object.keys(next.inputs), ['image', 'video', 'audio']);
  assert.deepEqual(next.inputs.video, [{ url: 'v', kind: 'video', slotId: '', order: 0 }]);
  assert.equal(clip.inputs.image[0].url, 'old');
});

test('updateStoryClipInput：index 只移除该位置上没有 slotId 的输入；空值等于清空', () => {
  const clip = { inputs: { image: [{ url: 'free-0' }, { url: 'slotted', slotId: 'x' }, { url: 'free-2' }] } };
  const removedFree = updateStoryClipInput(clip, { kind: 'image', slotId: 'image-1', index: 2, value: null });
  assert.deepEqual(
    removedFree.inputs.image.map((input) => input.url),
    ['free-0', 'slotted'],
  );
  const slottedKept = updateStoryClipInput(clip, { kind: 'image', slotId: 'image-1', index: 1, value: '' });
  assert.deepEqual(
    slottedKept.inputs.image.map((input) => input.url),
    ['free-0', 'slotted', 'free-2'],
  );
  const replaced = updateStoryClipInput(clip, {
    kind: 'image',
    slotId: 'image-1',
    index: '0',
    value: { localPath: 'data/uploads/n.png' },
  });
  assert.deepEqual(
    replaced.inputs.image.map((input) => [input.url, input.slotId, input.order]),
    [
      ['slotted', 'x', 1],
      ['free-2', '', 2],
      ['data/uploads/n.png', 'image-1', 2],
    ],
  );
});
