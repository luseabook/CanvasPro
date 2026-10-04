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
  const error = parseError('unknown', { message: '余额不足' }, 0x190);
  (assert.ok(error instanceof ApiError),
    assert.equal(error.type, ErrorType.INSUFFICIENT_BALANCE),
    assert.equal(error.retryable, false));
}),
  test('errors: parseError 通用解析-鉴权失败', () => {
    const error2 = parseError('unknown', { message: 'bad' }, 0x191);
    (assert.ok(error2 instanceof ApiError),
      assert.equal(error2.type, ErrorType.AUTH_ERROR),
      assert.equal(error2.retryable, false));
  }),
  test('errors: parseError 通用解析-限流', () => {
    const error3 = parseError('unknown', { message: 'rate limit' }, 0x1ad);
    (assert.ok(error3 instanceof ApiError),
      assert.equal(error3.type, ErrorType.RATE_LIMIT),
      assert.equal(error3.retryable, true));
  }),
  test('errors: parseError 通用解析-内容过滤', () => {
    const error4 = parseError('unknown', { message: 'safety filtered' }, 0x190);
    (assert.ok(error4 instanceof ApiError),
      assert.equal(error4.type, ErrorType.CONTENT_FILTERED),
      assert.equal(error4.retryable, false));
  }),
  test('errors: parseError 通用解析-HTTP 500', () => {
    const error5 = parseError('unknown', { message: 'server error' }, 0x1f4);
    (assert.ok(error5 instanceof ApiError),
      assert.equal(error5.type, ErrorType.SERVER_ERROR),
      assert.equal(error5.retryable, true));
  }),
  test('errors: parseError 通用解析不会把对象错误显示为 [object Object]', () => {
    const error6 = parseError('agnes', { error: { message: 'invalid api key', code: 0x191 } }, 0x191);
    (assert.ok(error6 instanceof ApiError),
      assert.equal(error6.type, ErrorType.AUTH_ERROR),
      assert.match(error6.getUserMessage(), /invalid api key/),
      assert.doesNotMatch(error6.getUserMessage(), /\[object Object\]/));
  }),
  test('errors: parseError Agnes 映射官方 HTTP 错误码', () => {
    const error7 = parseError('agnes', { message: 'Invalid request. Check request parameters' }, 0x190);
    (assert.ok(error7 instanceof ApiError),
      assert.equal(error7.type, ErrorType.INVALID_PARAMS),
      assert.equal(error7.retryable, false));
    const error8 = parseError('agnes', { error: { message: 'Unauthorized. Check your API key' } }, 0x191);
    (assert.ok(error8 instanceof ApiError),
      assert.equal(error8.type, ErrorType.AUTH_ERROR),
      assert.match(error8.getUserMessage(), /\[Agnes AI\]/),
      assert.match(error8.getUserMessage(), /Unauthorized/));
    const error9 = parseError('agnes', { message: 'Task not found' }, 0x194);
    (assert.ok(error9 instanceof ApiError),
      assert.equal(error9.type, ErrorType.INVALID_PARAMS),
      assert.equal(error9.retryable, false));
    const error10 = parseError('agnes', { message: 'Service busy. Retry later' }, 0x1f7);
    (assert.ok(error10 instanceof ApiError),
      assert.equal(error10.type, ErrorType.SERVICE_UNAVAILABLE),
      assert.equal(error10.retryable, true));
  }),
  test('errors: parseTaskError 通用检测', () => {
    const error11 = parseTaskError('grsai', { status: 'failed', message: 'x' });
    (assert.ok(error11 instanceof ApiError),
      assert.equal(error11.type, ErrorType.TASK_FAILED),
      assert.ok(String(error11.message).includes('x')));
  }),
  test('errors: parseTaskError 通用检测支持对象 error.message', () => {
    const error12 = parseTaskError('agnes', {
      status: 'failed',
      error: { message: 'content policy rejected' },
    });
    (assert.ok(error12 instanceof ApiError),
      assert.equal(error12.type, ErrorType.TASK_FAILED),
      assert.match(error12.message, /content policy rejected/),
      assert.doesNotMatch(error12.message, /\[object Object\]/));
  }),
  test('errors: parseTaskError Agnes 失败任务提取可读原因', () => {
    const error13 = parseTaskError('agnes', {
      status: 'failed',
      error: { message: 'render failed because source image expired' },
    });
    (assert.ok(error13 instanceof ApiError),
      assert.equal(error13.type, ErrorType.TASK_FAILED),
      assert.match(error13.getUserMessage(), /\[Agnes AI\]/),
      assert.match(error13.message, /source image expired/),
      assert.doesNotMatch(error13.message, /\[object Object\]/));
  }),
  test('errors: parseTaskError grsai 优先展示 error 字段', () => {
    const error14 = parseTaskError('grsai', {
      status: 'failed',
      failure_reason: 'error',
      error: 'The image format is incorrect. Please check if there are any issues with the image format',
    });
    (assert.ok(error14 instanceof ApiError),
      assert.equal(error14.type, ErrorType.TASK_FAILED),
      assert.ok(String(error14.message).includes('The image format is incorrect')));
  }),
  test('errors: parseTaskError grsai 在 pending + sensitive 时识别为内容违规', () => {
    const taskError = parseTaskError('grsai', {
      status: 'pending',
      message: 'The input or output was flagged as sensitive. Please try again with different inputs.',
    });
    (assert.ok(taskError instanceof ApiError), assert.equal(taskError.type, ErrorType.CONTENT_FILTERED));
  }),
  test('errors: parseTaskError apimart 提取任务失败中的 error.message', () => {
    const error15 = parseTaskError('apimart', {
      status: 'failed',
      error: { code: 0x190, message: 'Seedance request rejected', type: 'invalid_request' },
    });
    (assert.ok(error15 instanceof ApiError),
      assert.equal(error15.type, ErrorType.TASK_FAILED),
      assert.ok(String(error15.message).includes('Seedance request rejected')));
  }),
  test('errors: parseTaskError apimart 识别取消任务为终态失败', () => {
    const error16 = parseTaskError('apimart', { status: 'cancelled' });
    (assert.ok(error16 instanceof ApiError),
      assert.equal(error16.type, ErrorType.TASK_FAILED),
      assert.ok(String(error16.message).includes('任务已取消')));
  }),
  test('errors: parseNetworkError - timeout / dns / network', () => {
    const networkError = parseNetworkError('grsai', { name: 'AbortError', message: '' }, 1);
    assert.equal(networkError.type, ErrorType.TIMEOUT);
    const networkError2 = parseNetworkError('grsai', new Error('getaddrinfo ENOTFOUND x'));
    assert.equal(networkError2.type, ErrorType.DNS_ERROR);
    const networkError3 = parseNetworkError('grsai', new Error('Failed to fetch'));
    assert.equal(networkError3.type, ErrorType.NETWORK_ERROR);
  }),
  test('errors: parseBatchErrors 会标记 batchIndex', () => {
    const list = parseBatchErrors('grsai', [
      { success: false, error: '余额不足', status: 0x190 },
      { success: true },
      { success: false, error: { message: 'rate limit' }, status: 0x1ad },
    ]);
    (assert.equal(list.length, 2), assert.equal(list[0].batchIndex, 0), assert.equal(list[1].batchIndex, 2));
  }),
  test('errors: runninghub(模型API) 使用模型专用错误码映射', () => {
    const error17 = parseError('runninghub', { code: 0x5f0 }, 200);
    (assert.ok(error17 instanceof ApiError),
      assert.equal(error17.type, ErrorType.RATE_LIMIT),
      assert.equal(error17.code, 0x5f0),
      assert.equal(error17.retryable, true));
  }),
  test('errors: runninghubwf(工作流) 保持原错误码映射', () => {
    const error18 = parseError('runninghubwf', { code: 0x32a }, 200);
    (assert.ok(error18 instanceof ApiError),
      assert.equal(error18.type, ErrorType.INVALID_PARAMS),
      assert.equal(error18.code, 0x32a));
  }),
  test('errors: runninghubwf 失败信息追加 failedReason 节点详情', () => {
    const error19 = parseTaskError('runninghubwf', {
      taskId: '2053162957067722754',
      status: 'FAILED',
      errorCode: '805',
      errorMessage: '工作流运行失败',
      failedReason: { node_id: '992', exception_message: 'Porn' },
    });
    (assert.ok(error19 instanceof ApiError),
      assert.equal(error19.type, ErrorType.TASK_FAILED),
      assert.match(error19.message, /生成任务失败: 工作流运行失败/),
      assert.match(error19.message, /node_id: 992/),
      assert.match(error19.message, /exception_message: Porn/));
  }),
  test('errors: runninghubwf 数组快照失败也追加 failedReason 节点详情', () => {
    const error20 = parseError(
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
    (assert.ok(error20 instanceof ApiError),
      assert.equal(error20.type, ErrorType.TASK_FAILED),
      assert.match(error20.message, /生成任务失败: 工作流运行失败/),
      assert.match(error20.message, /node_id: 992/),
      assert.match(error20.message, /exception_message: Porn/));
  }),
  test('errors: runninghubwf 失败信息支持直接节点详情字段', () => {
    const error21 = parseTaskError('runninghubwf', {
      taskId: '2053162957067722754',
      status: 'FAILED',
      errorMessage: '工作流运行失败',
      node_id: '101',
      exception_message: 'node crashed',
    });
    (assert.ok(error21 instanceof ApiError),
      assert.equal(error21.type, ErrorType.TASK_FAILED),
      assert.match(error21.message, /node_id: 101/),
      assert.match(error21.message, /exception_message: node crashed/));
  }),
  test('errors: runninghubwf 失败信息支持字符串 failedReason', () => {
    const error22 = parseTaskError('runninghubwf', {
      taskId: '2053162957067722754',
      status: 'FAILED',
      errorMessage: '工作流运行失败',
      failedReason: JSON.stringify({ node_id: '102', exception_message: 'bad input' }),
    });
    (assert.ok(error22 instanceof ApiError),
      assert.equal(error22.type, ErrorType.TASK_FAILED),
      assert.match(error22.message, /node_id: 102/),
      assert.match(error22.message, /exception_message: bad input/));
  }),
  test('errors: runninghub(模型API) parseTaskError 支持 data/errorCode=1501', () => {
    const taskError2 = parseTaskError('runninghub', {
      data: { status: 'FAILED', errorCode: '1501', errorMessage: 'CONTENT_SECURITY_AUDIT_FAILED' },
    });
    (assert.ok(taskError2 instanceof ApiError),
      assert.equal(taskError2.type, ErrorType.CONTENT_FILTERED),
      assert.equal(taskError2.code, 0x5dd));
  }),
  test('errors: runninghub(模型API) parseTaskError 支持 results[0].errorCode=1501', () => {
    const taskError3 = parseTaskError('runninghub', { status: 'FAILED', results: [{ errorCode: '1501' }] });
    (assert.ok(taskError3 instanceof ApiError),
      assert.equal(taskError3.type, ErrorType.CONTENT_FILTERED),
      assert.equal(taskError3.code, 0x5dd));
  }),
  test('errors: runninghub(模型API) parseTaskError 对 submitted/pending 不应误判失败', () => {
    const taskError4 = parseTaskError('runninghub', { status: 'submitted' }),
      taskError5 = parseTaskError('runninghub', { status: 'pending' });
    (assert.equal(taskError4, null), assert.equal(taskError5, null));
  }));
