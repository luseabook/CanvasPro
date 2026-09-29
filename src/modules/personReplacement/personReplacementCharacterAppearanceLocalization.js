import {
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
function normalizeText(_0x21d496) {
  return String(_0x21d496 ?? '')['trim']();
}
export function getFirstSuccessfulImageRef(_0x2ca659) {
  const _0x575b42 = normalizeImageGenerationResult(_0x2ca659),
    _0x45723d = getSuccessfulImageGenerationItems(_0x575b42)[0x0],
    _0x948557 =
      [
        _0x45723d?.['localPath'],
        _0x45723d?.['originalLocalPath'],
        _0x45723d?.['displayLocalPath'],
        _0x45723d?.['imageUrl'],
        _0x45723d?.['url'],
        typeof _0x45723d === 'string' ? _0x45723d : '',
      ]
        ['map'](normalizeLocalPath)
        ['find'](Boolean) || '';
  if (!_0x948557)
    throw new Error(
      normalizeText(_0x45723d?.['localSaveError'] || _0x575b42?.['localSaveError']) ||
        getImageGenerationResultError(_0x575b42) ||
        '图像生成结果缺少可用图片',
    );
  return _0x948557;
}
