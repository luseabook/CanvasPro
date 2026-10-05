import { getStoryAssetAppearances, normalizeStoryAssetAppearance } from './storyAssetAppearances.js';
export function removeStoryReplicationCharacterAppearance(args, enabled, value) {
  if (
    args['data']?.['project']?.['sourceMode'] !== 'video-replication' ||
    !['character', 'scene', 'prop']['includes'](enabled?.['kind'])
  )
    return false;
  const list = getStoryAssetAppearances(enabled),
    count = list['findIndex']((item) => item['id'] === value);
  if (count < 0 || (list['length'] === 1 && !list[count]['imageUrl'])) return false;
  const key = list[count];
  return (
    (enabled['appearances'] = list['filter']((index) => index !== key)),
    !enabled['appearances']['length'] &&
      enabled['appearances']['push'](
        normalizeStoryAssetAppearance(
          {
            id: enabled['id'] + '-appearance-' + crypto['randomUUID'](),
            prompt: enabled['prompt'] || key['prompt'],
            description: enabled['description'] || key['description'],
          },
          { assetId: enabled['id'] },
        ),
      ),
    !enabled['appearances']['some']((result) => result['id'] === enabled['baseAppearanceId']) &&
      (enabled['baseAppearanceId'] = enabled['appearances'][0]['id']),
    (args['assetAppearanceIndexes'] = {
      ...args['assetAppearanceIndexes'],
      [enabled['id']]: Math['min'](count, enabled['appearances']['length'] - 1),
    }),
    (args['pendingDeleteAssetAppearanceKey'] = ''),
    true
  );
}
