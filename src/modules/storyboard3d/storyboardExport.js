export const STORYBOARD_EXPORT_ASPECT_RATIOS = Object['freeze']({
  '16:9': 0x10 / 0x9,
  '9:16': 0x9 / 0x10,
  '1:1': 0x1,
  '2.39:1': 2.39,
  '4:3': 0x4 / 0x3,
  '3:4': 0x3 / 0x4,
  '3:2': 0x3 / 0x2,
  '2:3': 0x2 / 0x3,
  '21:9': 0x15 / 0x9,
});
export const STORYBOARD_EXPORT_RESOLUTIONS = Object['freeze']({
  '720p': 0x2d0,
  '1080p': 0x438,
  '2K': 0x5a0,
  '4K': 0x870,
});
const DEFAULT_PALETTE = Object['freeze']({
  background: '#0b0c10',
  cellBackground: '#171922',
  text: '#f4f6fb',
  mutedText: '#9ba3b4',
  line: '#42485a',
  guide: 'rgba(255,255,255,0.38)',
});
function toPositiveInteger(
  _0x1925c6,
  _0x28f329,
  { min: min = 0x1, max: max = Number['MAX_SAFE_INTEGER'] } = {},
) {
  const _0x684f37 = Math['round'](Number(_0x1925c6));
  if (!Number['isFinite'](_0x684f37)) return _0x28f329;
  return Math['min'](max, Math['max'](min, _0x684f37));
}
function normalizeAspectRatio(_0x7843cb) {
  const _0x26c5b1 = String(_0x7843cb || '16:9');
  if (Object['hasOwn'](STORYBOARD_EXPORT_ASPECT_RATIOS, _0x26c5b1))
    return { key: _0x26c5b1, value: STORYBOARD_EXPORT_ASPECT_RATIOS[_0x26c5b1] };
  const _0x57b4cd = Number(_0x7843cb);
  if (Number['isFinite'](_0x57b4cd) && _0x57b4cd > 0x0) return { key: _0x57b4cd + ':1', value: _0x57b4cd };
  return { key: '16:9', value: STORYBOARD_EXPORT_ASPECT_RATIOS['16:9'] };
}
export function resolveStoryboardExportDimensions({
  aspectRatio: aspectRatio = '16:9',
  resolution: resolution = '1080p',
} = {}) {
  const _0x574a95 = normalizeAspectRatio(aspectRatio),
    _0xa91053 =
      STORYBOARD_EXPORT_RESOLUTIONS[resolution] ||
      toPositiveInteger(resolution, STORYBOARD_EXPORT_RESOLUTIONS['1080p'], { min: 0xf0, max: 0x10e0 }),
    _0x29e755 = _0x574a95['value'] >= 0x1 ? Math['round'](_0xa91053 * _0x574a95['value']) : _0xa91053,
    _0x2c9bef = _0x574a95['value'] >= 0x1 ? _0xa91053 : Math['round'](_0xa91053 / _0x574a95['value']);
  return {
    aspectRatio: _0x574a95['key'],
    ratio: _0x574a95['value'],
    resolution: String(resolution),
    width: _0x29e755,
    height: _0x2c9bef,
  };
}
export function calculateStoryboardGridLayout({
  count: _0x2bdf19,
  columns: columns = 0x3,
  frameWidth: _0x360ce5,
  frameHeight: _0xab10f,
  metadataHeight: metadataHeight = 0xa0,
  gap: gap = 0x18,
  padding: padding = 0x20,
  maxSide: maxSide = 0x4000,
  maxPixels: maxPixels = 0x7270e00,
} = {}) {
  const _0x29d60b = toPositiveInteger(_0x2bdf19, 0x1, { max: 0x3e8 }),
    _0x44c622 = toPositiveInteger(columns, 0x3, { max: _0x29d60b }),
    _0x2b8ccb = Math['ceil'](_0x29d60b / _0x44c622),
    _0x18b9ee = toPositiveInteger(_0x360ce5, 0x780, { min: 0x40, max: 0x2000 }),
    _0x295fba = toPositiveInteger(_0xab10f, 0x438, { min: 0x40, max: 0x2000 }),
    _0x283a43 = toPositiveInteger(metadataHeight, 0xa0, { min: 0x0, max: 0x320 }),
    _0x12e9ac = toPositiveInteger(gap, 0x18, { min: 0x0, max: 0x100 }),
    _0x2d13aa = toPositiveInteger(padding, 0x20, { min: 0x0, max: 0x200 }),
    _0x1b1c33 = _0x295fba + _0x283a43,
    _0x1f6c90 = _0x2d13aa * 0x2 + _0x44c622 * _0x18b9ee + Math['max'](0x0, _0x44c622 - 0x1) * _0x12e9ac,
    _0x1c29f5 = _0x2d13aa * 0x2 + _0x2b8ccb * _0x1b1c33 + Math['max'](0x0, _0x2b8ccb - 0x1) * _0x12e9ac;
  if (_0x1f6c90 > maxSide || _0x1c29f5 > maxSide || _0x1f6c90 * _0x1c29f5 > maxPixels)
    throw new RangeError(
      'Storyboard export is too large (' + _0x1f6c90 + '×' + _0x1c29f5 + '). Reduce resolution or grid size.',
    );
  return {
    count: _0x29d60b,
    columns: _0x44c622,
    rows: _0x2b8ccb,
    cellWidth: _0x18b9ee,
    cellHeight: _0x1b1c33,
    frameWidth: _0x18b9ee,
    frameHeight: _0x295fba,
    metadataHeight: _0x283a43,
    gap: _0x12e9ac,
    padding: _0x2d13aa,
    width: _0x1f6c90,
    height: _0x1c29f5,
    getCellRect(_0x71d299) {
      const _0x2976ce = toPositiveInteger(Number(_0x71d299) + 0x1, 0x1, { max: _0x29d60b }) - 0x1,
        _0x239e10 = _0x2976ce % _0x44c622,
        _0x4be85c = Math['floor'](_0x2976ce / _0x44c622);
      return {
        x: _0x2d13aa + _0x239e10 * (_0x18b9ee + _0x12e9ac),
        y: _0x2d13aa + _0x4be85c * (_0x1b1c33 + _0x12e9ac),
        width: _0x18b9ee,
        height: _0x1b1c33,
        frameHeight: _0x295fba,
        metadataHeight: _0x283a43,
      };
    },
  };
}
function createDefaultCanvas(
  _0x16e554,
  _0x324f75,
  { documentObject: documentObject = globalThis['document'] } = {},
) {
  const _0x389b32 = globalThis['OffscreenCanvas'];
  if (typeof _0x389b32 === 'function') return new _0x389b32(_0x16e554, _0x324f75);
  const _0x27ceb4 = documentObject?.['createElement']?.('canvas');
  if (!_0x27ceb4) throw new Error('Canvas export is unavailable in this runtime.');
  return ((_0x27ceb4['width'] = _0x16e554), (_0x27ceb4['height'] = _0x324f75), _0x27ceb4);
}
async function canvasToBlob(_0x350aba, { mimeType: mimeType = 'image/png', quality: quality = 0.92 } = {}) {
  if (typeof _0x350aba?.['convertToBlob'] === 'function')
    return _0x350aba['convertToBlob']({ type: mimeType, quality: quality });
  if (typeof _0x350aba?.['toBlob'] === 'function')
    return new Promise((_0x182831, _0x14bfbf) => {
      _0x350aba['toBlob'](
        (_0x28e351) => (_0x28e351 ? _0x182831(_0x28e351) : _0x14bfbf(new Error('Canvas encoding failed.'))),
        mimeType,
        quality,
      );
    });
  throw new Error('Canvas blob encoding is unavailable in this runtime.');
}
function getFrameSize(_0x4e5a43) {
  const _0x44ee7e = _0x4e5a43?.['image'] || _0x4e5a43;
  return {
    source: _0x44ee7e,
    width: Number(
      _0x4e5a43?.['width'] ||
        _0x44ee7e?.['videoWidth'] ||
        _0x44ee7e?.['naturalWidth'] ||
        _0x44ee7e?.['width'] ||
        0x0,
    ),
    height: Number(
      _0x4e5a43?.['height'] ||
        _0x44ee7e?.['videoHeight'] ||
        _0x44ee7e?.['naturalHeight'] ||
        _0x44ee7e?.['height'] ||
        0x0,
    ),
  };
}
function drawFrameCover(_0x685840, _0x1c8eee, _0x447d7d, _0x3ed3ef) {
  ((_0x685840['fillStyle'] = _0x3ed3ef['cellBackground']),
    _0x685840['fillRect'](_0x447d7d['x'], _0x447d7d['y'], _0x447d7d['width'], _0x447d7d['height']));
  const { source: _0x17ed78, width: _0x498df0, height: _0x1af91f } = getFrameSize(_0x1c8eee);
  if (!_0x17ed78 || _0x498df0 <= 0x0 || _0x1af91f <= 0x0) return;
  const _0x2fe1dd = _0x498df0 / _0x1af91f,
    _0xcacc28 = _0x447d7d['width'] / _0x447d7d['height'];
  let _0x253a9f = 0x0,
    _0xc89bcf = 0x0,
    _0x299a77 = _0x498df0,
    _0x12d0b1 = _0x1af91f;
  if (_0x2fe1dd > _0xcacc28)
    ((_0x299a77 = _0x1af91f * _0xcacc28), (_0x253a9f = (_0x498df0 - _0x299a77) / 0x2));
  else
    _0x2fe1dd < _0xcacc28 &&
      ((_0x12d0b1 = _0x498df0 / _0xcacc28), (_0xc89bcf = (_0x1af91f - _0x12d0b1) / 0x2));
  _0x685840['drawImage'](
    _0x17ed78,
    _0x253a9f,
    _0xc89bcf,
    _0x299a77,
    _0x12d0b1,
    _0x447d7d['x'],
    _0x447d7d['y'],
    _0x447d7d['width'],
    _0x447d7d['height'],
  );
}
function drawThirdsGuide(_0x508961, _0x44b1a7, _0x37285a) {
  (_0x508961['save'](),
    (_0x508961['strokeStyle'] = _0x37285a['guide']),
    (_0x508961['lineWidth'] = Math['max'](0x1, Math['round'](_0x44b1a7['width'] / 0x3c0))),
    _0x508961['beginPath']());
  for (const _0x9a722f of [0x1 / 0x3, 0x2 / 0x3]) {
    (_0x508961['moveTo'](_0x44b1a7['x'] + _0x44b1a7['width'] * _0x9a722f, _0x44b1a7['y']),
      _0x508961['lineTo'](
        _0x44b1a7['x'] + _0x44b1a7['width'] * _0x9a722f,
        _0x44b1a7['y'] + _0x44b1a7['height'],
      ),
      _0x508961['moveTo'](_0x44b1a7['x'], _0x44b1a7['y'] + _0x44b1a7['height'] * _0x9a722f),
      _0x508961['lineTo'](
        _0x44b1a7['x'] + _0x44b1a7['width'],
        _0x44b1a7['y'] + _0x44b1a7['height'] * _0x9a722f,
      ));
  }
  (_0x508961['stroke'](), _0x508961['restore']());
}
function buildShotMetaLines(_0x160e71, _0xbc81, _0x3319c7) {
  const _0x54c344 = _0x160e71?.['camera'] || {},
    _0x2fb751 = [];
  _0x3319c7['includeShotNumber'] !== ![] &&
    _0x2fb751['push'](
      'SHOT ' + String(_0xbc81 + 0x1)['padStart'](0x2, '0') + ' · ' + (_0x160e71?.['shotSize'] || 'MED'),
    );
  const _0x70c842 = [
    _0x3319c7['includeShotAngle'] !== ![] ? _0x160e71?.['shotAngle'] : '',
    _0x3319c7['includeFocalLength'] !== ![] && _0x54c344['focalLength']
      ? _0x54c344['focalLength'] + 'mm'
      : '',
  ]
    ['filter'](Boolean)
    ['join'](' · ');
  if (_0x70c842) _0x2fb751['push'](_0x70c842);
  return (
    _0x3319c7['includeDescription'] !== ![] &&
      _0x160e71?.['description'] &&
      _0x2fb751['push'](String(_0x160e71['description'])),
    _0x2fb751
  );
}
function drawMetadata(_0x3934bf, _0x45999c, _0x1dae44, _0x233f3e, _0x582731, _0x1f5f73) {
  if (_0x233f3e['metadataHeight'] <= 0x0) return;
  const _0x33d273 = _0x233f3e['y'] + _0x233f3e['frameHeight'];
  ((_0x3934bf['fillStyle'] = _0x1f5f73['cellBackground']),
    _0x3934bf['fillRect'](_0x233f3e['x'], _0x33d273, _0x233f3e['width'], _0x233f3e['metadataHeight']),
    (_0x3934bf['fillStyle'] = _0x1f5f73['text']));
  const _0x40ff6c = Math['max'](0x12, Math['round'](_0x233f3e['width'] / 0x2a)),
    _0x398b0f = Math['round'](_0x40ff6c * 1.35);
  ((_0x3934bf['font'] = '600\x20' + _0x40ff6c + 'px\x20system-ui,\x20sans-serif'),
    (_0x3934bf['textBaseline'] = 'top'));
  const _0x3f0b36 = buildShotMetaLines(_0x45999c, _0x1dae44, _0x582731);
  _0x3f0b36['slice'](0x0, 0x3)['forEach']((_0x336191, _0x143eaf) => {
    _0x143eaf > 0x0 &&
      ((_0x3934bf['fillStyle'] = _0x1f5f73['mutedText']),
      (_0x3934bf['font'] =
        '400 ' + Math['max'](0x10, Math['round'](_0x40ff6c * 0.78)) + 'px system-ui, sans-serif'));
    const _0x3bd754 = Math['max'](
        0xc,
        Math['floor'](_0x233f3e['width'] / Math['max'](0xc, _0x40ff6c * 0.55)),
      ),
      _0x14a2bb = String(_0x336191)['slice'](0x0, _0x3bd754);
    _0x3934bf['fillText'](
      _0x14a2bb,
      _0x233f3e['x'] + _0x40ff6c,
      _0x33d273 + _0x40ff6c + _0x143eaf * _0x398b0f,
    );
  });
}
export async function renderStoryboardGrid({
  shots: shots = [],
  renderFrame: _0x1abb67,
  aspectRatio: aspectRatio = '16:9',
  resolution: resolution = '1080p',
  columns: columns = 0x3,
  metadataHeight: _0x115330,
  gap: _0x474f1c,
  padding: _0x45b2fd,
  includeThirds: includeThirds = ![],
  includeShotNumber: includeShotNumber = !![],
  includeShotAngle: includeShotAngle = !![],
  includeFocalLength: includeFocalLength = !![],
  includeDescription: includeDescription = !![],
  mimeType: mimeType = 'image/png',
  quality: quality = 0.92,
  palette: palette = DEFAULT_PALETTE,
  canvasFactory: canvasFactory = createDefaultCanvas,
  onProgress: _0x2312c5,
} = {}) {
  if (!Array['isArray'](shots) || shots['length'] === 0x0 || !shots['some'](Boolean))
    throw new Error('At least one shot is required for storyboard export.');
  if (typeof _0x1abb67 !== 'function') throw new TypeError('renderFrame must be a function.');
  const _0x4aadc1 = resolveStoryboardExportDimensions({ aspectRatio: aspectRatio, resolution: resolution }),
    _0x2d7baa = calculateStoryboardGridLayout({
      count: shots['length'],
      columns: columns,
      frameWidth: _0x4aadc1['width'],
      frameHeight: _0x4aadc1['height'],
      metadataHeight:
        _0x115330 ??
        Math['max'](0x60, Math['round'](Math['min'](_0x4aadc1['width'], _0x4aadc1['height']) * 0.15)),
      gap: _0x474f1c,
      padding: _0x45b2fd,
    }),
    _0x47b0f6 = canvasFactory(_0x2d7baa['width'], _0x2d7baa['height']),
    _0x53b676 = _0x47b0f6?.['getContext']?.('2d');
  if (!_0x53b676) throw new Error('2D\x20canvas\x20context\x20is\x20unavailable.');
  const _0x4be904 = { ...DEFAULT_PALETTE, ...(palette || {}) };
  ((_0x53b676['fillStyle'] = _0x4be904['background']),
    _0x53b676['fillRect'](0x0, 0x0, _0x2d7baa['width'], _0x2d7baa['height']));
  for (let _0x930404 = 0x0; _0x930404 < shots['length']; _0x930404 += 0x1) {
    const _0x319eb8 = shots[_0x930404];
    _0x2312c5?.({
      stage: 'rendering',
      current: _0x930404 + 0x1,
      total: shots['length'],
      shotId: _0x319eb8?.['id'],
    });
    const _0x5cd642 = _0x2d7baa['getCellRect'](_0x930404),
      _0x129962 = {
        x: _0x5cd642['x'],
        y: _0x5cd642['y'],
        width: _0x5cd642['width'],
        height: _0x5cd642['frameHeight'],
      };
    if (!_0x319eb8) {
      ((_0x53b676['fillStyle'] = _0x4be904['cellBackground']),
        _0x53b676['fillRect'](_0x5cd642['x'], _0x5cd642['y'], _0x5cd642['width'], _0x5cd642['height']));
      continue;
    }
    const _0x49ee82 = await _0x1abb67(_0x319eb8, {
      width: _0x4aadc1['width'],
      height: _0x4aadc1['height'],
      index: _0x930404,
      total: shots['length'],
    });
    drawFrameCover(_0x53b676, _0x49ee82, _0x129962, _0x4be904);
    if (includeThirds) drawThirdsGuide(_0x53b676, _0x129962, _0x4be904);
    (drawMetadata(
      _0x53b676,
      _0x319eb8,
      _0x930404,
      _0x5cd642,
      {
        includeShotNumber: includeShotNumber,
        includeShotAngle: includeShotAngle,
        includeFocalLength: includeFocalLength,
        includeDescription: includeDescription,
      },
      _0x4be904,
    ),
      _0x49ee82?.['close']?.(),
      _0x49ee82?.['image']?.['close']?.());
  }
  _0x2312c5?.({ stage: 'encoding', current: shots['length'], total: shots['length'] });
  const _0x5d54ad = await canvasToBlob(_0x47b0f6, { mimeType: mimeType, quality: quality });
  return (
    _0x2312c5?.({ stage: 'complete', current: shots['length'], total: shots['length'] }),
    {
      blob: _0x5d54ad,
      mimeType: mimeType,
      width: _0x2d7baa['width'],
      height: _0x2d7baa['height'],
      layout: _0x2d7baa,
      frame: _0x4aadc1,
    }
  );
}
export async function renderStoryboardSequence({
  shots: shots = [],
  renderFrame: _0x18a254,
  ..._0x4730f7
} = {}) {
  if (!Array['isArray'](shots) || shots['length'] === 0x0)
    throw new Error('At\x20least\x20one\x20shot\x20is\x20required\x20for\x20storyboard\x20export.');
  const _0x9509e3 = [];
  for (let _0x24788d = 0x0; _0x24788d < shots['length']; _0x24788d += 0x1) {
    const _0x49c638 = shots[_0x24788d],
      _0x45b611 = await renderStoryboardGrid({
        ..._0x4730f7,
        shots: [_0x49c638],
        columns: 0x1,
        renderFrame: (_0x47f8bf, _0x3a7ac4) =>
          _0x18a254(_0x47f8bf, { ..._0x3a7ac4, index: _0x24788d, total: shots['length'] }),
        onProgress: (_0x2afcaa) =>
          _0x4730f7['onProgress']?.({
            ..._0x2afcaa,
            current: _0x24788d + (_0x2afcaa['stage'] === 'complete' ? 0x1 : 0x0),
            total: shots['length'],
            shotId: _0x49c638?.['id'],
          }),
      });
    _0x9509e3['push']({ ..._0x45b611, shotId: _0x49c638?.['id'] || '', index: _0x24788d });
  }
  return _0x9509e3;
}
