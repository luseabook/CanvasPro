import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonReplacementCompositeMediaResidency } from './personReplacementCompositeMediaResidency.js';

function makeMediaElement() {
  const calls = { pause: 0, removeAttribute: [], setAttribute: [] };
  const element = {
    className: 'placeholder',
    dataset: {},
    preload: '',
    muted: false,
    currentTime: 99,
    calls,
    pause: () => {
      calls.pause += 1;
    },
    removeAttribute: (name) => {
      calls.removeAttribute.push(name);
    },
    setAttribute: (name, value) => {
      calls.setAttribute.push([name, value]);
    },
  };
  return element;
}

function makeController() {
  const controller = {
    destroyCount: 0,
    destroy() {
      controller.destroyCount += 1;
    },
  };
  return controller;
}

test('compositeMediaResidency: 工厂返回冻结的 10 个方法', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: ' p1 ' });
  assert.equal(Object.isFrozen(residency), true);
  assert.deepEqual(Object.keys(residency).sort(), [
    'adopt',
    'dispose',
    'evict',
    'forget',
    'handoff',
    'has',
    'nextSequence',
    'peek',
    'retain',
    'switchProject',
  ]);
  for (const name of Object.keys(residency)) assert.equal(typeof residency[name], 'function', name);
});

test('compositeMediaResidency: retain 校验 role/sourceUrl/videoEl/controller 与项目归属', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: 'p1' });
  const base = {
    role: 'r',
    sourceUrl: 'u',
    videoEl: makeMediaElement(),
    controller: makeController(),
    projectId: 'p1',
  };
  assert.equal(residency.retain(), false, 'retain() 空入参');
  assert.equal(residency.retain({}), false, 'retain({})');
  const invalid = [
    { role: '' },
    { role: '   ' },
    { sourceUrl: '' },
    { sourceUrl: '   ' },
    { videoEl: null },
    { controller: null },
    { controller: null, preserveVisibleElement: 1 },
    { controller: null, preserveVisibleElement: 'true' },
    { projectId: 'p2' },
    { projectId: ' p2 ' },
    { projectId: 0 },
  ];
  for (const over of invalid) {
    assert.equal(residency.retain({ ...base, ...over }), false, 'retain ' + JSON.stringify(over));
  }
  assert.equal(residency.has('r'), false, '无效入参未落库');
  assert.equal(residency.peek('r'), null);

  assert.equal(residency.retain({ ...base, projectId: '' }), true, '空 projectId 回落工厂值');
  assert.equal(residency.has(' r '), true);
  assert.equal(
    residency.retain({
      role: 'r2',
      sourceUrl: 'u2',
      videoEl: makeMediaElement(),
      preserveVisibleElement: true,
    }),
    true,
    'preserveVisibleElement 严格 true 可无 controller',
  );
  assert.equal(
    residency.retain({ role: 0, sourceUrl: 0, videoEl: makeMediaElement(), controller: makeController() }),
    true,
    '数字 0 归一成 "0"',
  );
  assert.equal(residency.has(0), true);
  assert.equal(residency.peek(0).role, '0');

  const empty = createPersonReplacementCompositeMediaResidency();
  assert.equal(
    empty.retain({ role: 'r', sourceUrl: 'u', videoEl: makeMediaElement(), controller: makeController() }),
    true,
    '空工厂 projectId 受理空入参 projectId',
  );
  assert.equal(
    empty.retain({
      role: 'r',
      sourceUrl: 'u',
      videoEl: makeMediaElement(),
      controller: makeController(),
      projectId: 'x',
    }),
    false,
  );
});

test('compositeMediaResidency: retain 幂等，换源时先释放旧记录且同一对象只释放一次', () => {
  const released = [];
  const residency = createPersonReplacementCompositeMediaResidency({
    projectId: 'p1',
    releaseMedia: (record) => {
      released.push(record);
    },
  });
  const e1 = makeMediaElement();
  const c1 = makeController();
  const entry = { role: 'r', sourceUrl: 'u1', videoEl: e1, controller: c1 };
  assert.equal(residency.retain(entry), true);
  assert.equal('projectId' in entry, false, '入参未被补写 projectId');
  assert.equal('role' in entry, true);
  const rec1 = residency.peek('r');
  assert.equal(rec1.projectId, 'p1');
  assert.equal(rec1.videoEl, e1);
  assert.equal(rec1.controller, c1);
  assert.equal(residency.retain(entry), true, '同对象重复 retain');
  assert.equal(
    residency.retain({ role: 'r', sourceUrl: 'u1', videoEl: e1, controller: c1 }),
    true,
    '等价入参重复 retain',
  );
  assert.deepEqual(released, []);
  assert.equal(c1.destroyCount, 0);

  const e2 = makeMediaElement();
  const c2 = makeController();
  assert.equal(residency.retain({ role: 'r', sourceUrl: 'u2', videoEl: e2, controller: c2 }), true);
  assert.deepEqual(released, [rec1], '释放的正是被替换的记录');
  assert.equal(c1.destroyCount, 1);
  assert.equal(residency.peek('r').videoEl, e2);
  assert.equal(residency.peek('r').sourceUrl, 'u2');

  assert.equal(residency.retain({ role: 'r', sourceUrl: 'u3', videoEl: e1, controller: c1 }), true);
  assert.equal(released.length, 2);
  assert.equal(c2.destroyCount, 1);
  assert.equal(c1.destroyCount, 1, '同一 controller 只销毁一次');
  assert.equal(residency.peek('r').videoEl, e1);
});

test('compositeMediaResidency: has/peek 归一化查询，forget 不释放媒体', () => {
  const released = [];
  const residency = createPersonReplacementCompositeMediaResidency({
    projectId: 'p1',
    releaseMedia: (record) => {
      released.push(record);
    },
  });
  assert.equal(residency.has('r'), false);
  assert.equal(residency.peek('r'), null);
  assert.equal(residency.forget('r'), false);
  assert.equal(
    residency.retain({
      role: ' r ',
      sourceUrl: ' u ',
      videoEl: makeMediaElement(),
      controller: makeController(),
    }),
    true,
  );
  for (const key of ['r', ' r ', '  r  ', 'r\n']) assert.equal(residency.has(key), true, String(key));
  for (const key of [null, undefined, 0, 'x', '']) assert.equal(residency.has(key), false, String(key));
  assert.equal(residency.peek(null), null);
  assert.equal(residency.peek(' r ').role, 'r');
  assert.equal(residency.peek(' r ').sourceUrl, 'u');
  assert.equal(residency.forget(' nope '), false);
  assert.equal(residency.forget(' r '), true);
  assert.equal(residency.has('r'), false);
  assert.equal(residency.peek('r'), null);
  assert.equal(residency.forget('r'), false, '重复 forget');
  assert.deepEqual(released, [], 'forget 不触发媒体释放');
});

test('compositeMediaResidency: evict 归一化取键并释放', () => {
  const released = [];
  const residency = createPersonReplacementCompositeMediaResidency({
    projectId: 'p1',
    releaseMedia: (record) => {
      released.push(record.role);
    },
  });
  assert.equal(residency.evict('r'), false);
  residency.retain({ role: 'r', sourceUrl: 'u', videoEl: makeMediaElement(), controller: makeController() });
  assert.equal(residency.evict(' r '), true);
  assert.deepEqual(released, ['r']);
  assert.equal(residency.has('r'), false);
  assert.equal(residency.evict('r'), false);
});

test('compositeMediaResidency: handoff 需记录存在且 videoEl 一致', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: 'p1' });
  const element = makeMediaElement();
  const controller = makeController();
  const nextController = makeController();
  assert.equal(residency.handoff('r'), false, '无参数');
  assert.equal(residency.handoff('r', { videoEl: element }), false, '缺 controller');
  assert.equal(residency.handoff('r', { videoEl: element, controller }), false, '记录不存在');
  assert.equal(residency.retain({ role: 'r', sourceUrl: 'u', videoEl: element, controller }), true);
  assert.equal(
    residency.handoff(' r ', { videoEl: element }),
    false,
    '记录存在且 videoEl 一致但缺 controller',
  );
  const before = residency.peek('r');
  assert.equal(
    residency.handoff(' r ', { videoEl: makeMediaElement(), controller: nextController }),
    false,
    'videoEl 不一致',
  );
  assert.equal(residency.handoff(' r ', { videoEl: element, controller: nextController }), true);
  const after = residency.peek('r');
  assert.equal(after.controller, nextController);
  assert.equal(after.videoEl, element);
  assert.equal(after.sourceUrl, 'u');
  assert.equal(before.controller, controller, '旧记录对象未被就地改动');
  assert.equal(residency.handoff('r', { controller: nextController }), false, '缺 videoEl');
  assert.equal(residency.handoff('r', {}), false);
  assert.equal(residency.handoff('nope', { videoEl: element, controller: nextController }), false);
});

test('compositeMediaResidency: nextSequence 按归一化键自增且与 retain 无关', () => {
  const residency = createPersonReplacementCompositeMediaResidency();
  assert.equal(residency.nextSequence(' r '), 1);
  assert.equal(residency.nextSequence('r'), 2);
  assert.equal(residency.nextSequence(0), 1);
  assert.equal(residency.nextSequence('0'), 2, '数字 0 与字符串 "0" 同键');
  assert.equal(residency.nextSequence('s'), 1);
  assert.equal(residency.nextSequence(null), 1);
  assert.equal(residency.nextSequence(undefined), 2, '空键继续累加');
  assert.equal(residency.nextSequence(), 3);
  assert.equal(residency.has('r'), false, 'nextSequence 不落库');
});

test('compositeMediaResidency: adopt 需 projectId/role/sourceUrl 三对齐并消费记录', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: 'p1' });
  const element = makeMediaElement();
  assert.equal(residency.adopt(), null);
  assert.equal(residency.adopt({}), null);
  assert.equal(residency.adopt({ renderedVideo: {} }), null, '缺 projectId');
  assert.equal(residency.adopt({ projectId: 'p1', renderedVideo: {} }), null, '缺 role/sourceUrl');
  assert.equal(
    residency.adopt({ projectId: 'p1', role: 'r', sourceUrl: 'u', renderedVideo: {} }),
    null,
    '记录不存在',
  );
  assert.equal(
    residency.retain({ role: 'r', sourceUrl: 'u', videoEl: element, controller: makeController() }),
    true,
  );
  assert.equal(
    residency.adopt({ projectId: 'p2', role: 'r', sourceUrl: 'u', renderedVideo: {} }),
    null,
    'projectId 不符',
  );
  assert.equal(
    residency.adopt({ projectId: 'p1', role: 'r', sourceUrl: 'other', renderedVideo: {} }),
    null,
    'sourceUrl 不符',
  );
  assert.equal(
    residency.adopt({ projectId: 'p1', role: 'nope', sourceUrl: 'u', renderedVideo: {} }),
    null,
    'role 不存在',
  );

  const rendered = { id: 'rendered' };
  const calls = [];
  const record = residency.adopt({
    projectId: ' p1 ',
    role: ' r ',
    sourceUrl: ' u ',
    renderedVideo: rendered,
    adoptMedia: (target, placeholder, meta) => {
      calls.push([target, placeholder, meta]);
    },
  });
  assert.equal(record.videoEl, element);
  assert.equal(record.projectId, 'p1');
  assert.equal(record.role, 'r');
  assert.equal(record.sourceUrl, 'u');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], element);
  assert.equal(calls[0][1], rendered);
  assert.equal(calls[0][2], record);
  assert.equal(residency.has('r'), false, '成功后被消费');
  assert.equal(
    residency.adopt({ projectId: 'p1', role: 'r', sourceUrl: 'u', renderedVideo: rendered }),
    null,
    '已消费',
  );
});

test('compositeMediaResidency: adoptMedia 抛错则不消费记录', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: 'p1' });
  const element = makeMediaElement();
  residency.retain({ role: 'r', sourceUrl: 'u', videoEl: element, controller: makeController() });
  const record = residency.adopt({
    projectId: 'p1',
    role: 'r',
    sourceUrl: 'u',
    renderedVideo: {},
    adoptMedia: () => {
      throw new Error('boom');
    },
  });
  assert.equal(record, null);
  assert.equal(element.calls.pause, 0, '抛错前未触碰视频元素');
  assert.equal(residency.has('r'), true);
});

test('compositeMediaResidency: 默认搬运写 dataset/preload/muted 并替换占位元素', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: 'p1' });
  const element = makeMediaElement();
  const replaced = [];
  const rendered = {
    className: 'rendered-video',
    getAttribute: (name) => (name === 'poster' ? 'poster.png' : null),
    replaceWith: (target) => {
      replaced.push(target);
    },
  };
  residency.retain({ role: 'r', sourceUrl: 'u', videoEl: element, controller: makeController() });
  const record = residency.adopt({ projectId: 'p1', role: 'r', sourceUrl: 'u', renderedVideo: rendered });
  assert.equal(record.videoEl, element);
  assert.equal(element.className, 'rendered-video');
  assert.equal(element.dataset.personReplacementCompareVideo, 'r');
  assert.equal(element.dataset.personReplacementCompareVideoUrl, 'u');
  assert.equal(element.preload, 'auto');
  assert.equal(element.muted, true);
  assert.equal(element.currentTime, 0, '暂停后时针归零');
  assert.equal(element.calls.pause, 1);
  assert.deepEqual(element.calls.removeAttribute, ['aria-hidden', 'tabindex', 'aria-label']);
  assert.deepEqual(element.calls.setAttribute, [
    ['playsinline', ''],
    ['poster', 'poster.png'],
  ]);
  assert.equal(replaced.length, 1);
  assert.equal(replaced[0], element);
  assert.equal(residency.has('r'), false);
});

test('compositeMediaResidency: 默认搬运在占位元素不可替换时保留记录', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: 'p1' });
  const element = makeMediaElement();
  residency.retain({ role: 'r', sourceUrl: 'u', videoEl: element, controller: makeController() });
  assert.equal(residency.adopt({ projectId: 'p1', role: 'r', sourceUrl: 'u', renderedVideo: {} }), null);
  assert.equal(element.calls.pause, 0, '抛错前未触碰视频元素');
  assert.equal(residency.has('r'), true);
});

test('compositeMediaResidency: 目标元素即占位元素时无需 replaceWith', () => {
  const residency = createPersonReplacementCompositeMediaResidency({ projectId: 'p1' });
  const element = makeMediaElement();
  residency.retain({ role: 'r', sourceUrl: 'u', videoEl: element, controller: makeController() });
  const record = residency.adopt({ projectId: 'p1', role: 'r', sourceUrl: 'u', renderedVideo: element });
  assert.equal(record.videoEl, element);
  assert.equal(element.dataset.personReplacementCompareVideo, 'r');
  assert.deepEqual(element.calls.setAttribute, [['playsinline', '']]);
  assert.deepEqual(element.calls.removeAttribute, ['aria-hidden', 'tabindex', 'poster', 'aria-label']);
  assert.equal(residency.has('r'), false);
});

test('compositeMediaResidency: switchProject 释放全部记录并切换归属', () => {
  const released = [];
  const residency = createPersonReplacementCompositeMediaResidency({
    projectId: 'p1',
    releaseMedia: (record) => {
      released.push(record.role);
    },
  });
  assert.equal(residency.switchProject(), false);
  assert.equal(residency.switchProject('   '), false);
  assert.equal(residency.switchProject('p1'), false);
  assert.equal(residency.switchProject(' p1 '), false);
  const a = makeMediaElement();
  assert.equal(residency.switchProject('p2'), true, '无记录也能切换');
  assert.deepEqual(released, []);
  residency.retain({ role: 'a', sourceUrl: 'u', videoEl: a, controller: makeController() });
  residency.retain({ role: 'b', sourceUrl: 'u', videoEl: makeMediaElement(), controller: makeController() });
  assert.equal(residency.switchProject(' p3 '), true);
  assert.deepEqual(released.sort(), ['a', 'b']);
  assert.equal(residency.has('a'), false);
  assert.equal(residency.peek('a'), null);
  assert.equal(residency.peek('b'), null);
  assert.equal(
    residency.retain({
      role: 'c',
      sourceUrl: 'u',
      videoEl: makeMediaElement(),
      controller: makeController(),
      projectId: 'p1',
    }),
    false,
    '旧 projectId 不再受理',
  );
  assert.equal(
    residency.retain({
      role: 'c',
      sourceUrl: 'u',
      videoEl: makeMediaElement(),
      controller: makeController(),
      projectId: 'p3',
    }),
    true,
  );
});

test('compositeMediaResidency: dispose 释放并封死写操作，但 nextSequence 仍推进', () => {
  const released = [];
  const residency = createPersonReplacementCompositeMediaResidency({
    projectId: 'p1',
    releaseMedia: (record) => {
      released.push(record.role);
    },
  });
  const element = makeMediaElement();
  const controller = makeController();
  residency.retain({ role: 'a', sourceUrl: 'u', videoEl: element, controller });
  assert.equal(residency.dispose(), undefined);
  assert.deepEqual(released, ['a']);
  assert.equal(controller.destroyCount, 1);
  assert.equal(residency.has('a'), false);
  assert.equal(
    residency.retain({
      role: 'b',
      sourceUrl: 'u',
      videoEl: makeMediaElement(),
      controller: makeController(),
    }),
    false,
    'dispose 后不再受理 retain',
  );
  assert.equal(residency.handoff('a', { videoEl: element, controller }), false);
  assert.equal(residency.adopt({ projectId: 'p1', role: 'a', sourceUrl: 'u', renderedVideo: {} }), null);
  assert.equal(residency.switchProject('p9'), false);
  assert.equal(residency.dispose(), undefined);
  assert.deepEqual(released, ['a'], '重复 dispose 不再释放');
  assert.equal(residency.forget('a'), false);
  assert.equal(residency.evict('a'), false);
  assert.equal(residency.nextSequence('a'), 1, 'dispose 后序号仍可推进');
  assert.equal(residency.nextSequence('a'), 2);
});
