import { post } from './apiBase.js';
export async function cancelRunningHubTask({ apiKey: apiKey, taskId: taskId }) {
  try {
    const response = await post(
      '/api/v2/runninghubwf/cancel',
      { apiKey: apiKey, taskId: taskId },
      60 * 1000,
    );
    if (!response.success) {
      if (
        response.error &&
        (response.error.includes('<') ||
          response.error.includes('DOCTYPE') ||
          response.error.includes('html'))
      )
        throw new Error('取消失败：服务器返回了非预期的响应格式');
      throw new Error(response.error || '取消失败');
    }
    return response.data;
  } catch (error) {
    if (
      error.message &&
      error.message.includes('Unexpected token') &&
      (error.message.includes('DOCTYPE') || error.message.includes('<'))
    )
      throw new Error('取消失败：服务器返回了非预期的响应格式');
    if (error.name === 'AbortError' || error.message.includes('signal is aborted'))
      throw new Error('取消操作已执行');
    throw error;
  }
}
