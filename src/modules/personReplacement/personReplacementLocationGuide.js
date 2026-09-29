import {
  buildPersonReplacementLocationGuideSvg,
  resolvePersonReplacementLocationGuidePreview,
} from './personReplacementLocationGuideSvg.js';
export function loadPersonReplacementGuideImage(_0x380f1b, _0x233ca2) {
  return new Promise((_0x532002, _0x3ddf4a) => {
    if (typeof globalThis['Image'] !== 'function') {
      _0x3ddf4a(new Error('当前环境无法制作人物定位图'));
      return;
    }
    const _0x3d4bef = new Image(),
      _0x13b94d = (_0x4e15e8) => {
        (clearTimeout(_0x3b1851),
          _0x233ca2?.['removeEventListener']('abort', _0x1741a7),
          (_0x3d4bef['onload'] = null),
          (_0x3d4bef['onerror'] = null));
        if (_0x4e15e8) ((_0x3d4bef['src'] = ''), _0x3ddf4a(_0x4e15e8));
        else _0x532002(_0x3d4bef);
      },
      _0x1741a7 = () => _0x13b94d(new DOMException('人物定位图制作已取消', 'AbortError')),
      _0x3b1851 = setTimeout(() => _0x13b94d(new Error('人物定位示意图加载超时')), 0x7530);
    ((_0x3d4bef['crossOrigin'] = 'anonymous'),
      (_0x3d4bef['onload'] = () => _0x13b94d()),
      (_0x3d4bef['onerror'] = () => _0x13b94d(new Error('无法加载人物定位示意图，未提交人物替换'))),
      _0x233ca2?.['addEventListener']('abort', _0x1741a7, { once: !![] }));
    if (_0x233ca2?.['aborted']) {
      _0x1741a7();
      return;
    }
    _0x3d4bef['src'] = _0x380f1b;
  });
}
export async function buildPersonReplacementLocationGuide({
  frame: frame = {},
  people: people = [],
  signal: _0x446cad,
} = {}) {
  if (!people['length']) throw new Error('人物定位图缺少绑定人物');
  const _0x4e12cc = buildPersonReplacementLocationGuideSvg({ frame: frame, people: people }),
    _0x43387d = await loadPersonReplacementGuideImage(
      resolvePersonReplacementLocationGuidePreview(_0x4e12cc['dataUrl']),
      _0x446cad,
    ),
    _0x39f871 = document['createElement']('canvas');
  ((_0x39f871['width'] = _0x4e12cc['width']), (_0x39f871['height'] = _0x4e12cc['height']));
  try {
    const _0x28f54a = _0x39f871['getContext']('2d');
    if (!_0x28f54a) throw new Error('无法绘制人物定位图');
    _0x28f54a['drawImage'](_0x43387d, 0x0, 0x0);
    const _0x3ec21a = _0x39f871['toDataURL']('image/png');
    if (!_0x3ec21a['startsWith']('data:image/png;base64,')) throw new Error('人物定位图 PNG 导出失败');
    return { ..._0x4e12cc, dataUrl: _0x3ec21a };
  } finally {
    ((_0x39f871['width'] = 0x0), (_0x39f871['height'] = 0x0));
  }
}
export function applyPersonReplacementLocationGuide(_0x406b1a, _0x22960) {
  if (!_0x406b1a['locationGuide']) return _0x406b1a;
  if (!_0x22960?.['dataUrl']?.['startsWith']('data:image/png;base64,'))
    throw new Error('人物定位图未生成，已停止提交，避免仅凭文字替换');
  return {
    ..._0x406b1a,
    referenceImages: _0x406b1a['referenceImages']['map']((_0x446a8e) =>
      _0x446a8e['role'] === 'person-location-guide' ? { ..._0x446a8e, ref: _0x22960['dataUrl'] } : _0x446a8e,
    ),
  };
}
