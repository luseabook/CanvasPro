export async function resolveOutputWithLocalization(_0x3dedb3, _0x89f249, _0x278dcb = {}) {
  if (_0x278dcb?.['deferOutputLocalization'] === !![])
    throw new Error('生成结果必须先保存到本地，禁止延迟本地化');
  if (typeof _0x89f249 !== 'function') throw new Error('生成结果缺少本地落盘步骤');
  return await _0x89f249();
}
