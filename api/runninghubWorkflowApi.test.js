import test from 'node:test';
import assert from 'node:assert/strict';
import {
  queryRunninghubWorkflow,
  runRunninghubAiApp,
  runRunninghubWorkflow,
  resumeRunninghubWorkflowTask,
} from './runninghubWorkflowApi.js';
function makeJsonResponse(value, ok = 200) {
  return {
    ok: ok >= 200 && ok < 300,
    status: ok,
    headers: {
      get(item) {
        return String(item || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => value,
    text: async () => JSON.stringify(value),
  };
}
(test('runninghubWorkflowApi: queryRunninghubWorkflow 透传 query 接口', async () => {
  const key = globalThis.fetch;
  try {
    globalThis.fetch = async (index, dom = {}) => {
      if (String(index) !== '/api/v2/runninghubwf/query') throw new Error('unexpected url: ' + String(index));
      const result = JSON.parse(String(dom.body || '{}'));
      return (
        assert.equal(result.taskId, 'task-1'),
        makeJsonResponse({ code: 0, data: [{ url: 'https://cdn.example.com/v.mp4' }] })
      );
    };
    const queryRunninghubWorkflow2 = await queryRunninghubWorkflow({ apiKey: 'k', taskId: 'task-1' });
    assert.equal(queryRunninghubWorkflow2.code, 0);
  } finally {
    globalThis.fetch = key;
  }
}),
  test('runninghubWorkflowApi: runRunninghubWorkflow 通过 header 传递 installId 且不污染远端 payload', async () => {
    const data = globalThis.fetch;
    try {
      globalThis.fetch = async (options, dom2 = {}) => {
        (assert.equal(String(options), '/api/v2/runninghubwf/run'),
          assert.equal(dom2.headers?.['X-AIC-Install-Id'], 'install-wf-1'));
        const target = JSON.parse(String(dom2.body || '{}'));
        return (
          assert.equal(target.workflowId, 'vip-flow'),
          assert.equal(Object.hasOwn(target, 'installId'), false),
          makeJsonResponse({ code: 0, data: { taskId: 'task-wf-1' } })
        );
      };
      const runRunninghubWorkflow2 = await runRunninghubWorkflow({
        apiKey: 'k',
        installId: 'install-wf-1',
        workflowId: 'vip-flow',
        nodeInfoList: [],
      });
      assert.equal(runRunninghubWorkflow2.data.taskId, 'task-wf-1');
    } finally {
      globalThis.fetch = data;
    }
  }),
  test('runninghubWorkflowApi: runRunninghubAiApp 可从 window.__aicInstallId 透传授权 installId', async () => {
    const source = globalThis.fetch,
      next = globalThis.window;
    try {
      ((globalThis.window = { __aicInstallId: 'install-window-1' }),
        (globalThis.fetch = async (current, response = {}) => {
          return (
            assert.equal(String(current), '/api/v2/proxy/image'),
            assert.equal(response.headers?.['X-AIC-Install-Id'], 'install-window-1'),
            makeJsonResponse({ task_id: 'task-window-1' })
          );
        }));
      const runRunninghubAiApp2 = await runRunninghubAiApp({
        apiKey: 'k',
        appId: '2047787809091620866',
        nodeInfoList: [],
      });
      assert.equal(runRunninghubAiApp2.task_id, 'task-window-1');
    } finally {
      ((globalThis.fetch = source), (globalThis.window = next));
    }
  }),
  test('runninghubWorkflowApi: runRunninghubAiApp 通过代理提交 ai-app', async () => {
    const entry = globalThis.fetch;
    try {
      globalThis.fetch = async (record, dom3 = {}) => {
        assert.equal(String(record), '/api/v2/proxy/image');
        const payload = JSON.parse(String(dom3.body || '{}'));
        return (
          assert.equal(dom3.headers?.['X-AIC-Install-Id'], 'install-tool-1'),
          assert.equal(payload.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2047784060881211393'),
          assert.equal(payload.apiKey, 'k'),
          assert.equal(payload.instanceType, 'default'),
          assert.equal(payload.usePersonalQueue, 'false'),
          assert.equal(Object.hasOwn(payload, 'appId'), false),
          assert.equal(Object.hasOwn(payload, 'workflowId'), false),
          assert.equal(Object.hasOwn(payload, 'installId'), false),
          assert.deepEqual(payload.nodeInfoList, [
            {
              nodeId: '4',
              fieldName: 'video',
              fieldValue: 'https://www.runninghub.cn/uploaded.mp4',
              description: 'video',
            },
          ]),
          makeJsonResponse({ task_id: 'task-frame-1', status: 'submitted' })
        );
      };
      const runRunninghubAiApp3 = await runRunninghubAiApp({
        apiKey: 'k',
        installId: 'install-tool-1',
        appId: '2047784060881211393',
        nodeInfoList: [
          {
            nodeId: '4',
            fieldName: 'video',
            fieldValue: 'https://www.runninghub.cn/uploaded.mp4',
            description: 'video',
          },
        ],
        instanceType: 'default',
        usePersonalQueue: 'false',
      });
      assert.equal(runRunninghubAiApp3.task_id, 'task-frame-1');
    } finally {
      globalThis.fetch = entry;
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 可从 pending 轮询到成功', async () => {
    const handle = globalThis.fetch,
      handler = globalThis.setTimeout;
    let count = 0;
    try {
      ((globalThis.setTimeout = (state, config, ...args) =>
        handler(state, Number(config) > 5000 ? Number(config) : 0, ...args)),
        (globalThis.fetch = async (scope) => {
          if (String(scope) !== '/api/v2/runninghubwf/query')
            throw new Error('unexpected url: ' + String(scope));
          count += 1;
          if (count === 1) return makeJsonResponse({ code: 804, msg: '排队中' });
          return makeJsonResponse({ code: 0, data: [{ url: 'https://cdn.example.com/final.mp4' }] });
        }));
      const resumeRunninghubWorkflowTask2 = await resumeRunninghubWorkflowTask({
        apiKey: 'k',
        taskId: 'task-2',
      });
      (assert.equal(resumeRunninghubWorkflowTask2.code, 0),
        assert.ok(Array.isArray(resumeRunninghubWorkflowTask2.data)),
        assert.equal(count >= 2, true));
    } finally {
      ((globalThis.fetch = handle), (globalThis.setTimeout = handler));
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 支持 openapi query', async () => {
    const input = globalThis.fetch,
      handler2 = globalThis.setTimeout,
      list = [];
    try {
      ((globalThis.setTimeout = (output, value2, ...args2) =>
        handler2(output, Number(value2) > 5000 ? Number(value2) : 0, ...args2)),
        (globalThis.fetch = async (value3, dom4 = {}) => {
          assert.equal(String(value3), '/api/v2/proxy/image');
          const value4 = JSON.parse(String(dom4.body || '{}'));
          (list.push(value4),
            assert.equal(value4.apiUrl, 'https://www.runninghub.cn/openapi/v2/query'),
            assert.equal(value4.apiKey, 'k'),
            assert.equal(value4.taskId, 'task-frame-2'));
          if (list.length === 1) return makeJsonResponse({ status: 'RUNNING' });
          return makeJsonResponse({
            status: 'COMPLETED',
            results: [{ videoUrl: 'https://cdn.example.com/frame.mp4' }],
          });
        }));
      const response2 = await resumeRunninghubWorkflowTask(
        { apiKey: 'k', taskId: 'task-frame-2' },
        { useOpenapiQuery: true },
      );
      (assert.equal(response2.status, 'COMPLETED'),
        assert.equal(response2.results[0].videoUrl, 'https://cdn.example.com/frame.mp4'),
        assert.equal(list.length >= 2, true));
    } finally {
      ((globalThis.fetch = input), (globalThis.setTimeout = handler2));
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 遇到失败态会抛错', async () => {
    const value5 = globalThis.fetch,
      handler3 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value6, value7, ...args3) =>
        handler3(value6, Number(value7) > 5000 ? Number(value7) : 0, ...args3)),
        (globalThis.fetch = async (value8) => {
          if (String(value8) !== '/api/v2/runninghubwf/query')
            throw new Error('unexpected url: ' + String(value8));
          return makeJsonResponse({ code: 0, data: { status: 'FAILED', message: '执行失败' } });
        }),
        await assert.rejects(
          () => resumeRunninghubWorkflowTask({ apiKey: 'k', taskId: 'task-3' }),
          (error) => String(error?.message || '').includes('执行失败'),
        ));
    } finally {
      ((globalThis.fetch = value5), (globalThis.setTimeout = handler3));
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 支持 abort', async () => {
    const value9 = globalThis.fetch,
      handler4 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value10, value11, ...args4) =>
        handler4(value10, Number(value11) > 5000 ? Number(value11) : 0, ...args4)),
        (globalThis.fetch = async (value12) => {
          if (String(value12) !== '/api/v2/runninghubwf/query')
            throw new Error('unexpected url: ' + String(value12));
          return makeJsonResponse({ code: 804, msg: '排队中' });
        }));
      const signal = new AbortController();
      (setTimeout(() => signal.abort(), 0),
        await assert.rejects(
          () => resumeRunninghubWorkflowTask({ apiKey: 'k', taskId: 'task-4' }, { signal: signal.signal }),
          (error2) => error2?.message === 'CANCELLED',
        ));
    } finally {
      ((globalThis.fetch = value9), (globalThis.setTimeout = handler4));
    }
  }));
