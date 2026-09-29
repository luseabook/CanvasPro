import { buildPersonReplacementLocationGuide } from './personReplacementLocationGuide.js';
import { buildPersonReplacementAnnotatedSource } from './personReplacementAnnotatedSource.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
export async function materializePersonReplacementGuide({
  entry: _0x501a59,
  project: _0x755db2,
  adapter: _0x5981c1,
  canReuseCanvas: _0x1c9fa2,
  previousNodes: _0x25e8a5,
  canvasId: _0x231e24,
  saveOutputBlob: _0x5107e8,
  buildNodeData: _0x2c9568,
  createLocationGuide: createLocationGuide = buildPersonReplacementLocationGuide,
}) {
  const _0x3b8757 = _0x501a59['data'],
    _0xcf6f78 = _0x3b8757['personReplacementBinding'],
    _0x167a26 = _0xcf6f78['annotatedSource'] || _0xcf6f78['locationGuide'],
    _0x2925a3 = JSON['stringify']({ version: 0x1, ..._0x167a26 }),
    _0x175e17 = _0x25e8a5[_0x501a59['key']];
  let _0x3d1ee7 = '',
    _0x500d5a = {};
  if (
    _0x1c9fa2 &&
    _0x175e17 &&
    _0x5981c1['getNode'] &&
    (await _0x5981c1['nodeExists'](_0x175e17, _0x231e24))
  ) {
    const _0x36c713 = await _0x5981c1['getNode'](_0x175e17, _0x231e24);
    _0x36c713?.['personReplacementBinding']?.['locationGuideSignature'] === _0x2925a3 &&
      ((_0x3d1ee7 = normalizeLocalPath(_0x36c713['originalLocalPath'] || _0x36c713['localPath'])),
      (_0x500d5a = _0x36c713));
  }
  if (!_0x3d1ee7) {
    if (typeof _0x5107e8 !== 'function') throw new Error('人物定位图本地保存服务不可用');
    const _0xfaf765 = await (
      _0xcf6f78['annotatedSource'] ? buildPersonReplacementAnnotatedSource : createLocationGuide
    )(_0x167a26);
    if (!_0xfaf765?.['dataUrl']?.['startsWith']('data:image/png;base64,'))
      throw new Error('人物定位图 PNG 导出失败');
    const _0xa3ae4c = Uint8Array['from'](atob(_0xfaf765['dataUrl']['split'](',')[0x1]), (_0x2e3f59) =>
        _0x2e3f59['charCodeAt'](0x0),
      ),
      _0x35a103 = await _0x5107e8(new Blob([_0xa3ae4c], { type: 'image/png' }), {
        ext: 'png',
        subDir: 'person-replacement-guides',
        kind: 'image',
      });
    ((_0x3d1ee7 = normalizeLocalPath(
      _0x35a103?.['originalLocalPath'] ||
        _0x35a103?.['localPath'] ||
        _0x35a103?.['path'] ||
        _0x35a103?.['url'],
    )),
      (_0x500d5a = _0x35a103));
    if (!_0x3d1ee7) throw new Error('人物定位图保存后未返回本地路径');
  }
  _0x501a59['data'] = {
    ..._0x3b8757,
    ..._0x2c9568({
      project: _0x755db2,
      imageRef: _0x3d1ee7,
      results: [{ ..._0x500d5a, localPath: _0x3d1ee7 }],
      name: _0x3b8757['name'],
      type: _0x3b8757['type'],
      binding: { ..._0xcf6f78, locationGuideSignature: _0x2925a3 },
    }),
    imageWidth: _0x3b8757['imageWidth'],
    imageHeight: _0x3b8757['imageHeight'],
  };
}
