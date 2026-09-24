const number = (_0xa996df, _0x42231d, _0x55f352, _0xce699e) =>
  Number['isFinite'](Number(_0xa996df))
    ? Math['max'](_0x55f352, Math['min'](_0xce699e, Number(_0xa996df)))
    : _0x42231d;
export function normalizeDirectorSceneSettings(_0x1b427b = {}) {
  const _0xa86e69 = _0x1b427b['panorama'] || {};
  return {
    screenshots: (Array['isArray'](_0x1b427b['screenshots']) ? _0x1b427b['screenshots'] : [])
      ['slice'](-0x64)
      ['filter']((_0x456cda) => typeof _0x456cda?.['assetId'] === 'string')
      ['map']((_0x14f3a7) => ({
        assetId: _0x14f3a7['assetId'],
        name: String(_0x14f3a7['name'] || '镜头截图')['slice'](0x0, 0x78),
        shotId: String(_0x14f3a7['shotId'] || ''),
        time: number(_0x14f3a7['time'], 0x0, 0x0, 0xe10),
        width: number(_0x14f3a7['width'], 0x780, 0x1, 0x4000),
        height: number(_0x14f3a7['height'], 0x438, 0x1, 0x4000),
      })),
    displayMode: ['solid', 'transparent', 'clay']['includes'](_0x1b427b['displayMode'])
      ? _0x1b427b['displayMode']
      : 'solid',
    labels: _0x1b427b['labels'] === !![],
    groundVisible: _0x1b427b['groundVisible'] !== ![],
    groundHeight: number(_0x1b427b['groundHeight'], 0x0, -0x3e8, 0x3e8),
    groundOpacity: number(_0x1b427b['groundOpacity'], 0x1, 0x0, 0x1),
    panorama: {
      enabled: _0xa86e69['enabled'] === !![],
      assetId: String(_0xa86e69['assetId'] || ''),
      radius: number(_0xa86e69['radius'], 0x64, 0x5, 0x7d0),
      rotation: [0x0, 0x1, 0x2]['map']((_0x10a56e) =>
        number(_0xa86e69['rotation']?.[_0x10a56e], 0x0, -Math['PI'] * 0x2, Math['PI'] * 0x2),
      ),
      history: (Array['isArray'](_0xa86e69['history']) ? _0xa86e69['history'] : [])
        ['slice'](-0x32)
        ['filter']((_0x265c5d) => typeof _0x265c5d?.['assetId'] === 'string')
        ['map']((_0x4e4164) => ({
          assetId: _0x4e4164['assetId'],
          name: String(_0x4e4164['name'] || '全景图')['slice'](0x0, 0x78),
        })),
    },
  };
}
