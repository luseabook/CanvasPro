import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseError,
  parseTaskError,
  parseNetworkError,
  parseBatchErrors,
  ApiError,
  ErrorType,
} from './index.js';
(test('errors: parseError 通用解析-余额不足', () => {
  const _0x4a82c0 = parseError('unknown', { message: '余额不足' }, 0x190);
  (assert.ok(_0x4a82c0 instanceof ApiError),
    assert.equal(_0x4a82c0.type, ErrorType.INSUFFICIENT_BALANCE),
    assert.equal(_0x4a82c0.retryable, false));
}),
  test('errors: parseError 通用解析-鉴权失败', () => {
    const _0x19223f = parseError('unknown', { message: 'bad' }, 0x191);
    (assert.ok(_0x19223f instanceof ApiError),
      assert.equal(_0x19223f.type, ErrorType.AUTH_ERROR),
      assert.equal(_0x19223f.retryable, false));
  }),
  test('errors: parseError 通用解析-限流', () => {
    const _0x1090b7 = parseError('unknown', { message: 'rate limit' }, 0x1ad);
    (assert.ok(_0x1090b7 instanceof ApiError),
      assert.equal(_0x1090b7.type, ErrorType.RATE_LIMIT),
      assert.equal(_0x1090b7.retryable, true));
  }),
  test('errors: parseError 通用解析-内容过滤', () => {
    const _0x25156a = parseError('unknown', { message: 'safety filtered' }, 0x190);
    (assert.ok(_0x25156a instanceof ApiError),
      assert.equal(_0x25156a.type, ErrorType.CONTENT_FILTERED),
      assert.equal(_0x25156a.retryable, false));
  }),
  test('errors: parseError 通用解析-HTTP 500', () => {
    const _0x4c752a = parseError('unknown', { message: 'server error' }, 0x1f4);
    (assert.ok(_0x4c752a instanceof ApiError),
      assert.equal(_0x4c752a.type, ErrorType.SERVER_ERROR),
      assert.equal(_0x4c752a.retryable, true));
  }),
  test('errors: parseError 通用解析不会把对象错误显示为 [object Object]', () => {
    const _0x467280 = parseError('agnes', { error: { message: 'invalid api key', code: 0x191 } }, 0x191);
    (assert.ok(_0x467280 instanceof ApiError),
      assert.equal(_0x467280.type, ErrorType.AUTH_ERROR),
      assert.match(_0x467280.getUserMessage(), /invalid api key/),
      assert.doesNotMatch(_0x467280.getUserMessage(), /\[object Object\]/));
  }),
  test('errors: parseError Agnes 映射官方 HTTP 错误码', () => {
    const _0x5d0857 = parseError('agnes', { message: 'Invalid request. Check request parameters' }, 0x190);
    (assert.ok(_0x5d0857 instanceof ApiError),
      assert.equal(_0x5d0857.type, ErrorType.INVALID_PARAMS),
      assert.equal(_0x5d0857.retryable, false));
    const _0x1d4528 = parseError('agnes', { error: { message: 'Unauthorized. Check your API key' } }, 0x191);
    (assert.ok(_0x1d4528 instanceof ApiError),
      assert.equal(_0x1d4528.type, ErrorType.AUTH_ERROR),
      assert.match(_0x1d4528.getUserMessage(), /\[Agnes AI\]/),
      assert.match(_0x1d4528.getUserMessage(), /Unauthorized/));
    const _0x13e8e3 = parseError('agnes', { message: 'Task not found' }, 0x194);
    (assert.ok(_0x13e8e3 instanceof ApiError),
      assert.equal(_0x13e8e3.type, ErrorType.INVALID_PARAMS),
      assert.equal(_0x13e8e3.retryable, false));
    const _0x40f627 = parseError('agnes', { message: 'Service busy. Retry later' }, 0x1f7);
    (assert.ok(_0x40f627 instanceof ApiError),
      assert.equal(_0x40f627.type, ErrorType.SERVICE_UNAVAILABLE),
      assert.equal(_0x40f627.retryable, true));
  }),
  test('errors: parseTaskError 通用检测', () => {
    const _0x5bde1f = parseTaskError('grsai', { status: 'failed', message: 'x' });
    (assert.ok(_0x5bde1f instanceof ApiError),
      assert.equal(_0x5bde1f.type, ErrorType.TASK_FAILED),
      assert.ok(String(_0x5bde1f.message).includes('x')));
  }),
  test('errors: parseTaskError 通用检测支持对象 error.message', () => {
    const _0x4b0893 = parseTaskError('agnes', {
      status: 'failed',
      error: { message: 'content policy rejected' },
    });
    (assert.ok(_0x4b0893 instanceof ApiError),
      assert.equal(_0x4b0893.type, ErrorType.TASK_FAILED),
      assert.match(_0x4b0893.message, /content policy rejected/),
      assert.doesNotMatch(_0x4b0893.message, /\[object Object\]/));
  }),
  test('errors: parseTaskError Agnes 失败任务提取可读原因', () => {
    const _0x6995 = parseTaskError('agnes', {
      status: 'failed',
      error: { message: 'render failed because source image expired' },
    });
    (assert.ok(_0x6995 instanceof ApiError),
      assert.equal(_0x6995.type, ErrorType.TASK_FAILED),
      assert.match(_0x6995.getUserMessage(), /\[Agnes AI\]/),
      assert.match(_0x6995.message, /source image expired/),
      assert.doesNotMatch(_0x6995.message, /\[object Object\]/));
  }),
  test('errors: parseTaskError grsai 优先展示 error 字段', () => {
    const _0x43a169 = parseTaskError('grsai', {
      status: 'failed',
      failure_reason: 'error',
      error: 'The image format is incorrect. Please check if there are any issues with the image format',
    });
    (assert.ok(_0x43a169 instanceof ApiError),
      assert.equal(_0x43a169.type, ErrorType.TASK_FAILED),
      assert.ok(String(_0x43a169.message).includes('The image format is incorrect')));
  }),
  test('errors: parseTaskError grsai 在 pending + sensitive 时识别为内容违规', () => {
    const _0x30c910 = parseTaskError('grsai', {
      status: 'pending',
      message: 'The input or output was flagged as sensitive. Please try again with different inputs.',
    });
    (assert.ok(_0x30c910 instanceof ApiError), assert.equal(_0x30c910.type, ErrorType.CONTENT_FILTERED));
  }),
  test('errors: parseTaskError apimart 提取任务失败中的 error.message', () => {
    const _0x1165ec = parseTaskError('apimart', {
      status: 'failed',
      error: { code: 0x190, message: 'Seedance request rejected', type: 'invalid_request' },
    });
    (assert.ok(_0x1165ec instanceof ApiError),
      assert.equal(_0x1165ec.type, ErrorType.TASK_FAILED),
      assert.ok(String(_0x1165ec.message).includes('Seedance request rejected')));
  }),
  test('errors: parseTaskError apimart 识别取消任务为终态失败', () => {
    const _0x5e6b40 = parseTaskError('apimart', { status: 'cancelled' });
    (assert.ok(_0x5e6b40 instanceof ApiError),
      assert.equal(_0x5e6b40.type, ErrorType.TASK_FAILED),
      assert.ok(String(_0x5e6b40.message).includes('任务已取消')));
  }),
  test('errors: parseNetworkError - timeout / dns / network', () => {
    const _0x5c5695 = parseNetworkError('grsai', { name: 'AbortError', message: '' }, 1);
    assert.equal(_0x5c5695.type, ErrorType.TIMEOUT);
    const _0x4d7aff = parseNetworkError('grsai', new Error('getaddrinfo ENOTFOUND x'));
    assert.equal(_0x4d7aff.type, ErrorType.DNS_ERROR);
    const _0x4bf809 = parseNetworkError('grsai', new Error('Failed to fetch'));
    assert.equal(_0x4bf809.type, ErrorType.NETWORK_ERROR);
  }),
  test('errors: parseBatchErrors 会标记 batchIndex', () => {
    const _0x141cf1 = parseBatchErrors('grsai', [
      { success: false, error: '余额不足', status: 0x190 },
      { success: true },
      { success: false, error: { message: 'rate limit' }, status: 0x1ad },
    ]);
    (assert.equal(_0x141cf1.length, 2),
      assert.equal(_0x141cf1[0].batchIndex, 0),
      assert.equal(_0x141cf1[1].batchIndex, 2));
  }),
  test('errors: runninghub(模型API) 使用模型专用错误码映射', () => {
    const _0x3de760 = parseError('runninghub', { code: 0x5f0 }, 200);
    (assert.ok(_0x3de760 instanceof ApiError),
      assert.equal(_0x3de760.type, ErrorType.RATE_LIMIT),
      assert.equal(_0x3de760.code, 0x5f0),
      assert.equal(_0x3de760.retryable, true));
  }),
  test('errors: runninghubwf(工作流) 保持原错误码映射', () => {
    const _0xd14e91 = parseError('runninghubwf', { code: 0x32a }, 200);
    (assert.ok(_0xd14e91 instanceof ApiError),
      assert.equal(_0xd14e91.type, ErrorType.INVALID_PARAMS),
      assert.equal(_0xd14e91.code, 0x32a));
  }),
  test('errors: runninghubwf 失败信息追加 failedReason 节点详情', () => {
    const _0x39f857 = parseTaskError('runninghubwf', {
      taskId: '2053162957067722754',
      status: 'FAILED',
      errorCode: '805',
      errorMessage: '工作流运行失败',
      failedReason: { node_id: '992', exception_message: 'Porn' },
    });
    (assert.ok(_0x39f857 instanceof ApiError),
      assert.equal(_0x39f857.type, ErrorType.TASK_FAILED),
      assert.match(_0x39f857.message, /生成任务失败: 工作流运行失败/),
      assert.match(_0x39f857.message, /node_id: 992/),
      assert.match(_0x39f857.message, /exception_message: Porn/));
  }),
  test('errors: runninghubwf 数组快照失败也追加 failedReason 节点详情', () => {
    const _0x4da2e5 = parseError(
      'runninghubwf',
      {
        code: 0,
        data: [
          {
            status: 'FAILED',
            errorMessage: '工作流运行失败',
            failedReason: { node_id: '992', exception_message: 'Porn' },
          },
        ],
      },
      200,
    );
    (assert.ok(_0x4da2e5 instanceof ApiError),
      assert.equal(_0x4da2e5.type, ErrorType.TASK_FAILED),
      assert.match(_0x4da2e5.message, /生成任务失败: 工作流运行失败/),
      assert.match(_0x4da2e5.message, /node_id: 992/),
      assert.match(_0x4da2e5.message, /exception_message: Porn/));
  }),
  test('errors: runninghubwf 失败信息支持直接节点详情字段', () => {
    const _0xe77c4f = parseTaskError('runninghubwf', {
      taskId: '2053162957067722754',
      status: 'FAILED',
      errorMessage: '工作流运行失败',
      node_id: '101',
      exception_message: 'node crashed',
    });
    (assert.ok(_0xe77c4f instanceof ApiError),
      assert.equal(_0xe77c4f.type, ErrorType.TASK_FAILED),
      assert.match(_0xe77c4f.message, /node_id: 101/),
      assert.match(_0xe77c4f.message, /exception_message: node crashed/));
  }),
  test('errors: runninghubwf 失败信息支持字符串 failedReason', () => {
    const _0x2a4a04 = parseTaskError('runninghubwf', {
      taskId: '2053162957067722754',
      status: 'FAILED',
      errorMessage: '工作流运行失败',
      failedReason: JSON.stringify({ node_id: '102', exception_message: 'bad input' }),
    });
    (assert.ok(_0x2a4a04 instanceof ApiError),
      assert.equal(_0x2a4a04.type, ErrorType.TASK_FAILED),
      assert.match(_0x2a4a04.message, /node_id: 102/),
      assert.match(_0x2a4a04.message, /exception_message: bad input/));
  }),
  test('errors: runninghub(模型API) parseTaskError 支持 data/errorCode=1501', () => {
    const _0x3a08b4 = parseTaskError('runninghub', {
      data: { status: 'FAILED', errorCode: '1501', errorMessage: 'CONTENT_SECURITY_AUDIT_FAILED' },
    });
    (assert.ok(_0x3a08b4 instanceof ApiError),
      assert.equal(_0x3a08b4.type, ErrorType.CONTENT_FILTERED),
      assert.equal(_0x3a08b4.code, 0x5dd));
  }),
  test('errors: runninghub(模型API) parseTaskError 支持 results[0].errorCode=1501', () => {
    const _0x3e8acc = parseTaskError('runninghub', { status: 'FAILED', results: [{ errorCode: '1501' }] });
    (assert.ok(_0x3e8acc instanceof ApiError),
      assert.equal(_0x3e8acc.type, ErrorType.CONTENT_FILTERED),
      assert.equal(_0x3e8acc.code, 0x5dd));
  }),
  test('errors: runninghub(模型API) parseTaskError 对 submitted/pending 不应误判失败', () => {
    const _0x10ec42 = parseTaskError('runninghub', { status: 'submitted' }),
      _0x1a527c = parseTaskError('runninghub', { status: 'pending' });
    (assert.equal(_0x10ec42, null), assert.equal(_0x1a527c, null));
  }));
