const number = (value, item, key, index) =>
  Number.isFinite(Number(value)) ? Math.max(key, Math.min(index, Number(value))) : item;
export function normalizeDirectorSceneSettings(labels = {}) {
  const enabled = labels.panorama || {};
  return {
    screenshots: (Array.isArray(labels.screenshots) ? labels.screenshots : [])
      .slice(-100)
      .filter((result) => typeof result?.assetId === 'string')
      .map((assetId) => ({
        assetId: assetId.assetId,
        name: String(assetId.name || '镜头截图').slice(0, 120),
        shotId: String(assetId.shotId || ''),
        time: number(assetId.time, 0, 0, 3600),
        width: number(assetId.width, 1920, 1, 16384),
        height: number(assetId.height, 1080, 1, 16384),
      })),
    displayMode: ['solid', 'transparent', 'clay'].includes(labels.displayMode)
      ? labels.displayMode
      : 'solid',
    labels: labels.labels === true,
    groundVisible: labels.groundVisible !== false,
    groundHeight: number(labels.groundHeight, 0, -1000, 1000),
    groundOpacity: number(labels.groundOpacity, 1, 0, 1),
    panorama: {
      enabled: enabled.enabled === true,
      assetId: String(enabled.assetId || ''),
      radius: number(enabled.radius, 100, 5, 2000),
      rotation: [0, 1, 2].map((data) =>
        number(enabled.rotation?.[data], 0, -Math.PI * 2, Math.PI * 2),
      ),
      history: (Array.isArray(enabled.history) ? enabled.history : [])
        .slice(-50)
        .filter((options) => typeof options?.assetId === 'string')
        .map((assetId2) => ({
          assetId: assetId2.assetId,
          name: String(assetId2.name || '全景图').slice(0, 120),
        })),
    },
  };
}
