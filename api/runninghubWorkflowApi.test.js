import test from 'node:test';
import assert from 'node:assert/strict';
import {
  queryRunninghubWorkflow,
  runRunninghubAiApp,
  runRunninghubWorkflow,
  resumeRunninghubWorkflowTask,
} from './runninghubWorkflowApi.js';
function makeJsonResponse(_0x5df19f, _0x142571 = 200) {
  return {
    ok: _0x142571 >= 200 && _0x142571 < 0x12c,
    status: _0x142571,
    headers: {
      get(_0x45a0ff) {
        return String(_0x45a0ff || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => _0x5df19f,
    text: async () => JSON.stringify(_0x5df19f),
  };
}
(test('runninghubWorkflowApi: queryRunninghubWorkflow 透传 query 接口', async () => {
  const _0x1e55c0 = globalThis.fetch;
  try {
    globalThis.fetch = async (_0x38c290, _0x8ccc27 = {}) => {
      if (String(_0x38c290) !== '/api/v2/runninghubwf/query')
        throw new Error('unexpected url: ' + String(_0x38c290));
      const _0x31d60b = JSON.parse(String(_0x8ccc27.body || '{}'));
      return (
        assert.equal(_0x31d60b.taskId, 'task-1'),
        makeJsonResponse({ code: 0, data: [{ url: 'https://cdn.example.com/v.mp4' }] })
      );
    };
    const _0x1e71cc = await queryRunninghubWorkflow({ apiKey: 'k', taskId: 'task-1' });
    assert.equal(_0x1e71cc.code, 0);
  } finally {
    globalThis.fetch = _0x1e55c0;
  }
}),
  test('runninghubWorkflowApi: runRunninghubWorkflow 通过 header 传递 installId 且不污染远端 payload', async () => {
    const _0x4bd587 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x5f2675, _0x1d30d3 = {}) => {
        (assert.equal(String(_0x5f2675), '/api/v2/runninghubwf/run'),
          assert.equal(_0x1d30d3.headers?.['X-AIC-Install-Id'], 'install-wf-1'));
        const _0x5bb03a = JSON.parse(String(_0x1d30d3.body || '{}'));
        return (
          assert.equal(_0x5bb03a.workflowId, 'vip-flow'),
          assert.equal(Object.hasOwn(_0x5bb03a, 'installId'), false),
          makeJsonResponse({ code: 0, data: { taskId: 'task-wf-1' } })
        );
      };
      const _0x43c29a = await runRunninghubWorkflow({
        apiKey: 'k',
        installId: 'install-wf-1',
        workflowId: 'vip-flow',
        nodeInfoList: [],
      });
      assert.equal(_0x43c29a.data.taskId, 'task-wf-1');
    } finally {
      globalThis.fetch = _0x4bd587;
    }
  }),
  test('runninghubWorkflowApi: runRunninghubAiApp 可从 window.__aicInstallId 透传授权 installId', async () => {
    const _0x465d74 = globalThis.fetch,
      _0x5c9e61 = globalThis.window;
    try {
      ((globalThis.window = { __aicInstallId: 'install-window-1' }),
        (globalThis.fetch = async (_0x5d8c4f, _0x3924e2 = {}) => {
          return (
            assert.equal(String(_0x5d8c4f), '/api/v2/proxy/image'),
            assert.equal(_0x3924e2.headers?.['X-AIC-Install-Id'], 'install-window-1'),
            makeJsonResponse({ task_id: 'task-window-1' })
          );
        }));
      const _0x465110 = await runRunninghubAiApp({
        apiKey: 'k',
        appId: '2047787809091620866',
        nodeInfoList: [],
      });
      assert.equal(_0x465110.task_id, 'task-window-1');
    } finally {
      ((globalThis.fetch = _0x465d74), (globalThis.window = _0x5c9e61));
    }
  }),
  test('runninghubWorkflowApi: runRunninghubAiApp 通过代理提交 ai-app', async () => {
    const _0x338b0f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x117417, _0x40e89b = {}) => {
        assert.equal(String(_0x117417), '/api/v2/proxy/image');
        const _0x28b0f0 = JSON.parse(String(_0x40e89b.body || '{}'));
        return (
          assert.equal(_0x40e89b.headers?.['X-AIC-Install-Id'], 'install-tool-1'),
          assert.equal(
            _0x28b0f0.apiUrl,
            'https://www.runninghub.cn/openapi/v2/run/ai-app/2047784060881211393',
          ),
          assert.equal(_0x28b0f0.apiKey, 'k'),
          assert.equal(_0x28b0f0.instanceType, 'default'),
          assert.equal(_0x28b0f0.usePersonalQueue, 'false'),
          assert.equal(Object.hasOwn(_0x28b0f0, 'appId'), false),
          assert.equal(Object.hasOwn(_0x28b0f0, 'workflowId'), false),
          assert.equal(Object.hasOwn(_0x28b0f0, 'installId'), false),
          assert.deepEqual(_0x28b0f0.nodeInfoList, [
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
      const _0x731e79 = await runRunninghubAiApp({
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
      assert.equal(_0x731e79.task_id, 'task-frame-1');
    } finally {
      globalThis.fetch = _0x338b0f;
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 可从 pending 轮询到成功', async () => {
    const _0x2558c9 = globalThis.fetch,
      _0x3d94b2 = globalThis.setTimeout;
    let _0x175b4b = 0;
    try {
      ((globalThis.setTimeout = (_0x1eca5d, _0xee7169, ..._0x4e0c96) =>
        _0x3d94b2(_0x1eca5d, Number(_0xee7169) > 0x1388 ? Number(_0xee7169) : 0, ..._0x4e0c96)),
        (globalThis.fetch = async (_0x3fba88) => {
          if (String(_0x3fba88) !== '/api/v2/runninghubwf/query')
            throw new Error('unexpected url: ' + String(_0x3fba88));
          _0x175b4b += 1;
          if (_0x175b4b === 1) return makeJsonResponse({ code: 0x324, msg: '排队中' });
          return makeJsonResponse({ code: 0, data: [{ url: 'https://cdn.example.com/final.mp4' }] });
        }));
      const _0x33eb1c = await resumeRunninghubWorkflowTask({ apiKey: 'k', taskId: 'task-2' });
      (assert.equal(_0x33eb1c.code, 0),
        assert.ok(Array.isArray(_0x33eb1c.data)),
        assert.equal(_0x175b4b >= 2, true));
    } finally {
      ((globalThis.fetch = _0x2558c9), (globalThis.setTimeout = _0x3d94b2));
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 支持 openapi query', async () => {
    const _0x512f59 = globalThis.fetch,
      _0x25e527 = globalThis.setTimeout,
      _0x64096 = [];
    try {
      ((globalThis.setTimeout = (_0xa31729, _0x2747d5, ..._0x729655) =>
        _0x25e527(_0xa31729, Number(_0x2747d5) > 0x1388 ? Number(_0x2747d5) : 0, ..._0x729655)),
        (globalThis.fetch = async (_0x3af709, _0x297b1b = {}) => {
          assert.equal(String(_0x3af709), '/api/v2/proxy/image');
          const _0x2d455b = JSON.parse(String(_0x297b1b.body || '{}'));
          (_0x64096.push(_0x2d455b),
            assert.equal(_0x2d455b.apiUrl, 'https://www.runninghub.cn/openapi/v2/query'),
            assert.equal(_0x2d455b.apiKey, 'k'),
            assert.equal(_0x2d455b.taskId, 'task-frame-2'));
          if (_0x64096.length === 1) return makeJsonResponse({ status: 'RUNNING' });
          return makeJsonResponse({
            status: 'COMPLETED',
            results: [{ videoUrl: 'https://cdn.example.com/frame.mp4' }],
          });
        }));
      const _0x45cc86 = await resumeRunninghubWorkflowTask(
        { apiKey: 'k', taskId: 'task-frame-2' },
        { useOpenapiQuery: true },
      );
      (assert.equal(_0x45cc86.status, 'COMPLETED'),
        assert.equal(_0x45cc86.results[0].videoUrl, 'https://cdn.example.com/frame.mp4'),
        assert.equal(_0x64096.length >= 2, true));
    } finally {
      ((globalThis.fetch = _0x512f59), (globalThis.setTimeout = _0x25e527));
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 遇到失败态会抛错', async () => {
    const _0x4e705a = globalThis.fetch,
      _0x5dba4c = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x3bae3f, _0x58e91a, ..._0x1a0391) =>
        _0x5dba4c(_0x3bae3f, Number(_0x58e91a) > 0x1388 ? Number(_0x58e91a) : 0, ..._0x1a0391)),
        (globalThis.fetch = async (_0x3b85fe) => {
          if (String(_0x3b85fe) !== '/api/v2/runninghubwf/query')
            throw new Error('unexpected url: ' + String(_0x3b85fe));
          return makeJsonResponse({ code: 0, data: { status: 'FAILED', message: '执行失败' } });
        }),
        await assert.rejects(
          () => resumeRunninghubWorkflowTask({ apiKey: 'k', taskId: 'task-3' }),
          (_0x1a27f) => String(_0x1a27f?.message || '').includes('执行失败'),
        ));
    } finally {
      ((globalThis.fetch = _0x4e705a), (globalThis.setTimeout = _0x5dba4c));
    }
  }),
  test('runninghubWorkflowApi: resumeRunninghubWorkflowTask 支持 abort', async () => {
    const _0x41f7d0 = globalThis.fetch,
      _0x419557 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x4cfc31, _0x58e0cb, ..._0x8ce170) =>
        _0x419557(_0x4cfc31, Number(_0x58e0cb) > 0x1388 ? Number(_0x58e0cb) : 0, ..._0x8ce170)),
        (globalThis.fetch = async (_0x548ffd) => {
          if (String(_0x548ffd) !== '/api/v2/runninghubwf/query')
            throw new Error('unexpected url: ' + String(_0x548ffd));
          return makeJsonResponse({ code: 0x324, msg: '排队中' });
        }));
      const _0x544513 = new AbortController();
      (setTimeout(() => _0x544513.abort(), 0),
        await assert.rejects(
          () => resumeRunninghubWorkflowTask({ apiKey: 'k', taskId: 'task-4' }, { signal: _0x544513.signal }),
          (_0x3533ba) => _0x3533ba?.message === 'CANCELLED',
        ));
    } finally {
      ((globalThis.fetch = _0x41f7d0), (globalThis.setTimeout = _0x419557));
    }
  }));
