import { get, post } from './requester.js';
const ROOT = '/api/v2/comfyui/';
export function getComfyConnections(options = {}) {
  return get(ROOT + 'connections', { provider: 'local', retries: 0, ...options });
}
export function callComfy(operation, connection, data = {}, options = {}) {
  return post(ROOT + operation, { ...connection, ...data }, {
    provider: 'local', retries: 0, timeout: 210000, ...options,
  });
}
export async function uploadComfyImage(connection, file, options = {}) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) throw new Error('仅支持 8MB 以内的 PNG/JPEG/WebP 图片');
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
  if (options.signal?.aborted) throw new Error('操作已停止');
  return callComfy('upload', connection, { base64, mimeType: file.type }, options);
}
