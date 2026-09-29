import { loadPersonReplacementGuideImage } from './personReplacementLocationGuide.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
export async function buildSourceEvidence(_0x48405a, { signal: _0x2a9c88 } = {}) {
  const _0x59abdb = _0x48405a['referenceImages']?.['find'](
    (_0x58b944) => _0x58b944['role'] === 'source-keyframe',
  )?.['ref'];
  if (!_0x59abdb) throw new Error('原人物识别缺少原图');
  const _0x15a835 = await loadPersonReplacementGuideImage(localPathToUrl(_0x59abdb) || _0x59abdb, _0x2a9c88),
    _0x2748bf = getComputedStyle(document['documentElement']),
    _0x2a916a = (_0x114277) => {
      const _0x56e1ab = _0x2748bf['getPropertyValue'](_0x114277)['trim']();
      if (!_0x56e1ab) throw new Error('人物识别颜色未初始化：' + _0x114277);
      return _0x56e1ab;
    },
    _0x58eef8 = _0x2a916a('--canvas-black'),
    _0xf34071 = _0x2a916a('--canvas-white'),
    _0x58e252 = [];
  for (const { markerLabel: _0x2f231b, bbox: _0x14a9ca } of _0x48405a['bindings']) {
    if (_0x2a9c88?.['aborted']) throw new DOMException('原人物识别已取消', 'AbortError');
    const { x: _0xca5650, y: _0xe9da, width: _0x40dc78, height: _0x2952ed } = _0x14a9ca || {};
    if (
      ![_0xca5650, _0xe9da, _0x40dc78, _0x2952ed]['every'](Number['isFinite']) ||
      _0xca5650 < 0x0 ||
      _0xe9da < 0x0 ||
      _0x40dc78 <= 0x0 ||
      _0x2952ed <= 0x0 ||
      _0xca5650 + _0x40dc78 > 1.001 ||
      _0xe9da + _0x2952ed > 1.001
    )
      throw new Error('人物' + _0x2f231b + '选框无效，请重新框选');
    const _0x42408b = document['createElement']('canvas');
    ((_0x42408b['width'] = 0x640), (_0x42408b['height'] = 0x320));
    try {
      const _0xe7807a = _0x42408b['getContext']('2d');
      if (!_0xe7807a || !_0x15a835['naturalWidth'] || !_0x15a835['naturalHeight'])
        throw new Error('无法绘制原人物识别图');
      ((_0xe7807a['fillStyle'] = _0x58eef8),
        _0xe7807a['fillRect'](0x0, 0x0, _0x42408b['width'], _0x42408b['height']),
        (_0xe7807a['fillStyle'] = _0xf34071),
        (_0xe7807a['font'] = 'bold 32px Arial'),
        _0xe7807a['fillText'](_0x2f231b + ' | FULL FRAME', 0x14, 0x2d),
        _0xe7807a['fillText'](_0x2f231b + ' | BOX CROP', 0x438, 0x2d));
      const _0x376c07 = Math['min'](0x410 / _0x15a835['naturalWidth'], 0x2bc / _0x15a835['naturalHeight']),
        _0x2f93c9 = _0x15a835['naturalWidth'] * _0x376c07,
        _0x170acd = _0x15a835['naturalHeight'] * _0x376c07,
        _0x2adf2b = 0x14,
        _0x382718 = 0x50 + (0x2bc - _0x170acd) / 0x2;
      (_0xe7807a['drawImage'](_0x15a835, _0x2adf2b, _0x382718, _0x2f93c9, _0x170acd),
        (_0xe7807a['strokeStyle'] = _0xf34071),
        (_0xe7807a['lineWidth'] = 0x4),
        _0xe7807a['strokeRect'](
          _0x2adf2b + _0xca5650 * _0x2f93c9,
          _0x382718 + _0xe9da * _0x170acd,
          _0x40dc78 * _0x2f93c9,
          _0x2952ed * _0x170acd,
        ));
      const _0x207197 = Math['min'](_0x40dc78, 0x1 - _0xca5650) * _0x15a835['naturalWidth'],
        _0x4f6394 = Math['min'](_0x2952ed, 0x1 - _0xe9da) * _0x15a835['naturalHeight'],
        _0x1cc3aa = Math['min'](0x1f4 / _0x207197, 0x2bc / _0x4f6394);
      _0xe7807a['drawImage'](
        _0x15a835,
        _0xca5650 * _0x15a835['naturalWidth'],
        _0xe9da * _0x15a835['naturalHeight'],
        _0x207197,
        _0x4f6394,
        0x438 + (0x1f4 - _0x207197 * _0x1cc3aa) / 0x2,
        0x50 + (0x2bc - _0x4f6394 * _0x1cc3aa) / 0x2,
        _0x207197 * _0x1cc3aa,
        _0x4f6394 * _0x1cc3aa,
      );
      const _0x2ce81f = _0x42408b['toDataURL']('image/png');
      if (!_0x2ce81f['startsWith']('data:image/png;base64,')) throw new Error('原人物识别图导出失败');
      _0x58e252['push'](_0x2ce81f);
    } finally {
      ((_0x42408b['width'] = 0x0), (_0x42408b['height'] = 0x0));
    }
  }
  return _0x58e252;
}
