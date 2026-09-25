import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStoryEpisodeScriptBatchCancellationRegistry,
  runStoryEpisodeScriptBatchQueue,
} from './storyEpisodeScriptBatchQueue.js';

// 记录每个钩子收到的参数；覆盖项写成 'k' in over ? over.k : 默认值
function createRecorder(over = {}) {
  const events = [];
  return {
    events,
    options: {
      targets: 'targets' in over ? over.targets : ['e1', 'e2', 'e3'],
      batchId: 'batchId' in over ? over.batchId : 'batch-1',
      isLive: 'isLive' in over ? over.isLive : () => true,
      isCancellationRequested: 'isCancellationRequested' in over ? over.isCancellationRequested : () => false,
      beforeTarget: async (info) => {
        events.push(['before', info]);
      },
      runTarget:
        'runTarget' in over
          ? over.runTarget
          : async (target, info) => {
              events.push(['run', target, info]);
              return true;
            },
      afterTarget: async (info) => {
        events.push(['after', info]);
      },
    },
  };
}

test('createStoryEpisodeScriptBatchCancellationRegistry：再导出的取消登记表按批次 id 记录请求', () => {
  const registry = createStoryEpisodeScriptBatchCancellationRegistry();
  assert.equal(registry.isRequested('b1'), false);
  assert.equal(registry.request('  b1  '), true);
  assert.equal(registry.request(''), false);
  assert.equal(registry.isRequested('b1'), true);
  assert.equal(registry.clear('b1'), true);
  assert.equal(registry.isRequested('b1'), false);
  assert.notEqual(createStoryEpisodeScriptBatchCancellationRegistry(), registry);
});

test('runStoryEpisodeScriptBatchQueue：runTarget 不是函数时拒绝', async () => {
  await assert.rejects(runStoryEpisodeScriptBatchQueue(), {
    name: 'TypeError',
    message: 'runTarget 必须是函数。',
  });
  await assert.rejects(runStoryEpisodeScriptBatchQueue({ targets: ['a'], runTarget: 'x' }), TypeError);
});

test('runStoryEpisodeScriptBatchQueue：按顺序跑完全部目标，钩子拿到序号、进度和剩余目标', async () => {
  const { events, options } = createRecorder();
  const result = await runStoryEpisodeScriptBatchQueue(options);
  assert.deepEqual(result, { status: 'completed', completed: 3, cancelled: 0 });
  assert.deepEqual(
    events.map((event) => event[0]),
    ['before', 'run', 'after', 'before', 'run', 'after', 'before', 'run', 'after'],
  );
  assert.deepEqual(events[0][1], {
    target: 'e1',
    index: 0,
    completed: 0,
    total: 3,
    pendingTargets: ['e1', 'e2', 'e3'],
  });
  assert.deepEqual(events[1], ['run', 'e1', { index: 0, completed: 0, total: 3 }]);
  assert.deepEqual(events[2][1], {
    target: 'e1',
    index: 0,
    completed: 1,
    total: 3,
    cancelRequested: false,
    pendingTargets: ['e2', 'e3'],
  });
  assert.deepEqual(events[8][1].pendingTargets, []);
});

test('runStoryEpisodeScriptBatchQueue：目标列表先复制，运行中改原数组不影响本次队列', async () => {
  const targets = ['a', 'b'];
  const seen = [];
  const result = await runStoryEpisodeScriptBatchQueue({
    targets,
    runTarget: async (target) => {
      seen.push(target);
      targets.push('late');
      return true;
    },
  });
  assert.deepEqual(seen, ['a', 'b']);
  assert.equal(result.completed, 2);
});

test('runStoryEpisodeScriptBatchQueue：非数组目标按空队列处理，默认钩子可省略', async () => {
  assert.deepEqual(await runStoryEpisodeScriptBatchQueue({ targets: 'x', runTarget: async () => true }), {
    status: 'completed',
    completed: 0,
    cancelled: 0,
  });
  assert.deepEqual(await runStoryEpisodeScriptBatchQueue({ targets: [1, 2], runTarget: () => 1 }), {
    status: 'completed',
    completed: 2,
    cancelled: 0,
  });
});

test('runStoryEpisodeScriptBatchQueue：开始下一个目标前已失活则中断，不再调用钩子', async () => {
  let live = true;
  const { events, options } = createRecorder({
    isLive: () => live,
    runTarget: async (target) => {
      events.push(['run', target]);
      return true;
    },
  });
  // 第一个目标的 after 钩子里失活：它已计入完成数，第二个目标开始前被拦下
  options.afterTarget = async (info) => {
    events.push(['after', info.target]);
    live = false;
  };
  const result = await runStoryEpisodeScriptBatchQueue(options);
  assert.deepEqual(result, { status: 'interrupted', completed: 1, cancelled: 0 });
  assert.deepEqual(
    events.map((event) => event.slice(0, 2).map((part) => (typeof part === 'object' ? part.target : part))),
    [
      ['before', 'e1'],
      ['run', 'e1'],
      ['after', 'e1'],
    ],
  );
});

test('runStoryEpisodeScriptBatchQueue：runTarget 返回假值或运行后失活都算中断，完成数不加', async () => {
  const falsy = createRecorder({ runTarget: async (target) => target !== 'e2' });
  assert.deepEqual(await runStoryEpisodeScriptBatchQueue(falsy.options), {
    status: 'interrupted',
    completed: 1,
    cancelled: 0,
  });
  assert.equal(falsy.events.filter((event) => event[0] === 'after').length, 1);

  let live = true;
  const dying = createRecorder({
    isLive: () => live,
    runTarget: async () => {
      live = false;
      return true;
    },
  });
  assert.deepEqual(await runStoryEpisodeScriptBatchQueue(dying.options), {
    status: 'interrupted',
    completed: 0,
    cancelled: 0,
  });
  assert.equal(dying.events.filter((event) => event[0] === 'after').length, 0);
});

test('runStoryEpisodeScriptBatchQueue：当前目标跑完后发现取消请求，停止并报告剩余数', async () => {
  const registry = createStoryEpisodeScriptBatchCancellationRegistry();
  const { events, options } = createRecorder({
    batchId: 'b-7',
    isCancellationRequested: (batchId) => registry.isRequested(batchId),
    targets: ['e1', 'e2', 'e3', 'e4'],
    runTarget: async (target) => {
      if (target === 'e2') registry.request('b-7');
      return true;
    },
  });
  const result = await runStoryEpisodeScriptBatchQueue(options);
  assert.deepEqual(result, { status: 'cancelled', completed: 2, cancelled: 2 });
  const lastAfter = events.filter((event) => event[0] === 'after').at(-1)[1];
  assert.deepEqual(lastAfter, {
    target: 'e2',
    index: 1,
    completed: 2,
    total: 4,
    cancelRequested: true,
    pendingTargets: [],
  });
});

test('runStoryEpisodeScriptBatchQueue：最后一个目标后才取消时状态仍是 cancelled，剩余 0', async () => {
  const { options } = createRecorder({
    targets: ['only'],
    isCancellationRequested: (batchId) => batchId === 'batch-1',
  });
  assert.deepEqual(await runStoryEpisodeScriptBatchQueue(options), {
    status: 'cancelled',
    completed: 1,
    cancelled: 0,
  });
});
