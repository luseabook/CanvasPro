import { buildCanvasLocalImageFields } from '../src/services/canvasMediaLocalService.js';
import { needsImageDerivatives } from '../src/services/imageDerivativeService.js';
import { createOperationError } from '../src/utils/operationError.js';
async function ensureDerivatives(_0x545162) {
  const { ensureLocalImageDerivatives: _0x5e19aa } = await import('../src/services/projectService.js');
  return _0x5e19aa(_0x545162);
}
export async function prepareImageGenerationMedia(_0x13a510, { ensure: ensure = ensureDerivatives } = {}) {
  const _0x445a72 = new Map(),
    _0x337732 = async (_0x19fc8c) => {
      if (!_0x19fc8c || _0x19fc8c['error']) return _0x19fc8c;
      let _0x417c02 = buildCanvasLocalImageFields(_0x19fc8c);
      if (!_0x417c02['localPath']) throw new Error('图片结果缺少已落盘的原图路径');
      if (needsImageDerivatives(_0x417c02)) {
        const _0x3ff14e = _0x417c02['originalLocalPath'] || _0x417c02['localPath'];
        let _0x2b34c2;
        try {
          if (!_0x445a72['has'](_0x3ff14e))
            _0x445a72['set'](
              _0x3ff14e,
              Promise['resolve']()['then'](() => ensure(_0x3ff14e)),
            );
          _0x2b34c2 = await _0x445a72['get'](_0x3ff14e);
        } catch (_0x38a709) {
          if (_0x38a709?.['name'] === 'AbortError') throw _0x38a709;
          throw createOperationError(
            '图片已保存，但显示图和缩略图准备失败',
            _0x38a709,
            '派生图生成服务未返回原因，请重试',
          );
        }
        if (_0x2b34c2?.['success'] === ![])
          throw createOperationError(
            '图片已保存，但显示图和缩略图准备失败',
            _0x2b34c2,
            '派生图生成服务返回失败，请重试',
          );
        _0x417c02 = buildCanvasLocalImageFields({ ..._0x417c02, ..._0x2b34c2 });
        if (_0x417c02['originalLocalPath'] !== _0x3ff14e || needsImageDerivatives(_0x417c02)) {
          const _0x1e162a = [
              ['显示图', _0x417c02['displayLocalPath']],
              ['缩略图', _0x417c02['thumbLocalPath']],
            ]
              ['filter'](([, _0x51b62c]) => !_0x51b62c || _0x51b62c === _0x3ff14e)
              ['map'](([_0x145326]) => _0x145326),
            _0x543fd0 =
              _0x417c02['originalLocalPath'] !== _0x3ff14e
                ? '返回的原图路径与源图不一致，请重试'
                : _0x1e162a['join']('、') + '缺失或仍指向原图，请重新生成派生图';
          throw createOperationError('图片已保存，但显示图和缩略图准备失败', _0x2b34c2?.['error'], _0x543fd0);
        }
      }
      return { ..._0x19fc8c, ..._0x417c02 };
    };
  if (Array['isArray'](_0x13a510?.['images']))
    return { ..._0x13a510, images: await Promise['all'](_0x13a510['images']['map'](_0x337732)) };
  return _0x337732(_0x13a510);
}
