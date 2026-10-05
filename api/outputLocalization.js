export async function resolveOutputWithLocalization(value, handler, item = {}) {
  if (item?.['deferOutputLocalization'] === true) throw new Error('生成结果必须先保存到本地，禁止延迟本地化');
  if (typeof handler !== 'function') throw new Error('生成结果缺少本地落盘步骤');
  return await handler();
}
