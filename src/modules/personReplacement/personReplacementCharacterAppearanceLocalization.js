import {
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function getFirstSuccessfulImageRef(item) {
  const imageGenerationResult = normalizeImageGenerationResult(item),
    response = getSuccessfulImageGenerationItems(imageGenerationResult)[0],
    enabled =
      [
        response?.['localPath'],
        response?.['originalLocalPath'],
        response?.['displayLocalPath'],
        response?.['imageUrl'],
        response?.['url'],
        typeof response === 'string' ? response : '',
      ]
        ['map'](normalizeLocalPath)
        ['find'](Boolean) || '';
  if (!enabled)
    throw new Error(
      normalizeText(response?.['localSaveError'] || imageGenerationResult?.['localSaveError']) ||
        getImageGenerationResultError(imageGenerationResult) ||
        '图像生成结果缺少可用图片',
    );
  return enabled;
}
