const number = (value, item, key, index) =>
  Number['isFinite'](Number(value)) ? Math['max'](key, Math['min'](index, Number(value))) : item;
export function normalizeDirectorSceneSettings(labels = {}) {
  const enabled = labels['panorama'] || {};
  return {
    screenshots: (Array['isArray'](labels['screenshots']) ? labels['screenshots'] : [])
      ['slice'](-0x64)
      ['filter']((result) => typeof result?.['assetId'] === 'string')
      ['map']((assetId) => ({
        assetId: assetId['assetId'],
        name: String(assetId['name'] || '镜头截图')['slice'](0x0, 0x78),
        shotId: String(assetId['shotId'] || ''),
        time: number(assetId['time'], 0x0, 0x0, 0xe10),
        width: number(assetId['width'], 0x780, 0x1, 0x4000),
        height: number(assetId['height'], 0x438, 0x1, 0x4000),
      })),
    displayMode: ['solid', 'transparent', 'clay']['includes'](labels['displayMode'])
      ? labels['displayMode']
      : 'solid',
    labels: labels['labels'] === !![],
    groundVisible: labels['groundVisible'] !== ![],
    groundHeight: number(labels['groundHeight'], 0x0, -0x3e8, 0x3e8),
    groundOpacity: number(labels['groundOpacity'], 0x1, 0x0, 0x1),
    panorama: {
      enabled: enabled['enabled'] === !![],
      assetId: String(enabled['assetId'] || ''),
      radius: number(enabled['radius'], 0x64, 0x5, 0x7d0),
      rotation: [0x0, 0x1, 0x2]['map']((data) =>
        number(enabled['rotation']?.[data], 0x0, -Math['PI'] * 0x2, Math['PI'] * 0x2),
      ),
      history: (Array['isArray'](enabled['history']) ? enabled['history'] : [])
        ['slice'](-0x32)
        ['filter']((options) => typeof options?.['assetId'] === 'string')
        ['map']((assetId2) => ({
          assetId: assetId2['assetId'],
          name: String(assetId2['name'] || '全景图')['slice'](0x0, 0x78),
        })),
    },
  };
}
