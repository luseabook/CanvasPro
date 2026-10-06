import { buildCanvasLocalImageFields } from '../src/services/canvasMediaLocalService.js';
import { needsImageDerivatives } from '../src/services/imageDerivativeService.js';
import { createOperationError } from '../src/utils/operationError.js';
async function ensureDerivatives(value) {
  const { ensureLocalImageDerivatives: ensureLocalImageDerivatives } =
    await import('../src/services/projectService.js');
  return ensureLocalImageDerivatives(value);
}
export async function prepareImageGenerationMedia(args, { ensure: ensure = ensureDerivatives } = {}) {
  const map = new Map(),
    handler = async (args2) => {
      if (!args2 || args2.error) return args2;
      let args3 = buildCanvasLocalImageFields(args2);
      if (!args3.localPath) throw new Error('图片结果缺少已落盘的原图路径');
      if (needsImageDerivatives(args3)) {
        const item = args3.originalLocalPath || args3.localPath;
        let response;
        try {
          if (!map.has(item))
            map.set(
              item,
              Promise.resolve().then(() => ensure(item)),
            );
          response = await map.get(item);
        } catch (error) {
          if (error?.name === 'AbortError') throw error;
          throw createOperationError(
            '图片已保存，但显示图和缩略图准备失败',
            error,
            '派生图生成服务未返回原因，请重试',
          );
        }
        if (response?.success === false)
          throw createOperationError(
            '图片已保存，但显示图和缩略图准备失败',
            response,
            '派生图生成服务返回失败，请重试',
          );
        args3 = buildCanvasLocalImageFields({ ...args3, ...response });
        if (args3.originalLocalPath !== item || needsImageDerivatives(args3)) {
          const list = [
              ['显示图', args3.displayLocalPath],
              ['缩略图', args3.thumbLocalPath],
            ]
              .filter(([, enabled]) => !enabled || enabled === item)
              .map(([key]) => key),
            index =
              args3.originalLocalPath !== item
                ? '返回的原图路径与源图不一致，请重试'
                : list.join('、') + '缺失或仍指向原图，请重新生成派生图';
          throw createOperationError('图片已保存，但显示图和缩略图准备失败', response?.error, index);
        }
      }
      return { ...args2, ...args3 };
    };
  if (Array.isArray(args?.images))
    return { ...args, images: await Promise.all(args.images.map(handler)) };
  return handler(args);
}
