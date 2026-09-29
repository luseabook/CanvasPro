import { worldToScreen } from '../../core/math.js';
import { readNodeGeometryPreview } from '../../core/nodeGeometryPreview.js';
export function drawCollaborationMediaStatus({
  state: _0x401631,
  nodes: _0x51acd9,
  viewport: _0x3cbbdb,
  bounds: _0x501f03,
  entryFor: _0x1fc584,
  getSession: _0x193ade,
  documentObject: _0x2cb691,
}) {
  for (const _0x164390 of _0x401631?.['mediaNodes'] || []) {
    if (!_0x164390['failed']) continue;
    const _0x2f1d2d = readNodeGeometryPreview(_0x164390['id'], _0x51acd9[_0x164390['id']]);
    if (!_0x2f1d2d || !_0x2f1d2d['width'] || !_0x2f1d2d['height']) continue;
    const _0x245e03 = worldToScreen(_0x2f1d2d['x'], _0x2f1d2d['y'], _0x3cbbdb),
      _0x3d7b2f = _0x2f1d2d['width'] * _0x3cbbdb['zoom'],
      _0x5aa99c = _0x2f1d2d['height'] * _0x3cbbdb['zoom'];
    if (
      _0x245e03['x'] + _0x3d7b2f < _0x501f03['left'] ||
      _0x245e03['x'] > _0x501f03['left'] + _0x501f03['width'] ||
      _0x245e03['y'] + _0x5aa99c < _0x501f03['top'] ||
      _0x245e03['y'] > _0x501f03['top'] + _0x501f03['height']
    )
      continue;
    const _0xc76269 = _0x1fc584('media:' + _0x164390['id'], 'collaboration-media-status');
    if (!_0xc76269['firstChild']) {
      const _0x317c02 = _0x2cb691['createElement']('span'),
        _0x4ffb3d = _0x2cb691['createElement']('button');
      ((_0x4ffb3d['type'] = 'button'),
        (_0x4ffb3d['textContent'] = '重试'),
        _0x4ffb3d['addEventListener']('click', (_0x595a26) => {
          (_0x595a26['stopPropagation'](), _0x193ade()?.['retryMedia'](_0xc76269['dataset']['nodeId']));
        }),
        _0xc76269['append'](_0x317c02, _0x4ffb3d),
        _0xc76269['setAttribute']('role', 'status'));
    }
    ((_0xc76269['dataset']['nodeId'] = _0x164390['id']),
      _0xc76269['classList']['toggle']('is-failed', _0x164390['failed']),
      (_0xc76269['firstChild']['textContent'] = _0x164390['message']
        ? '素材准备失败：' + _0x164390['message']
        : '素材准备失败'),
      (_0xc76269['lastChild']['hidden'] = !_0x164390['retry']),
      _0xc76269['lastChild']['setAttribute']('aria-label', '重试 ' + (_0x2f1d2d['name'] || '素材')),
      (_0xc76269['title'] =
        _0x164390['failed'] && !_0x164390['retry']
          ? '请添加此素材的成员重试'
          : _0xc76269['firstChild']['textContent']),
      (_0xc76269['style']['transform'] = 'translate(' + _0x245e03['x'] + 'px,\x20' + _0x245e03['y'] + 'px)'),
      (_0xc76269['style']['maxWidth'] = _0x3d7b2f + 'px'));
  }
}
