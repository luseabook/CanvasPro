import { isStorySeedance25PromptMode } from '../../src/domain/storyGeneration/promptModes.js';
import { normalizeStringArray, normalizeText } from '../utils/storyGenerationValues.js';
const STORY_EPISODE_SCENE_SPATIAL_ANCHOR_MAX_CHARACTERS = 0x320;
function buildStoryEpisodeSceneSpatialAnchor(options = {}, value = null) {
  const item = [value?.['description'], value?.['prompt'], options?.['description']]
    ['map'](normalizeText)
    ['filter'](Boolean);
  return [...new Set(item)]['join']('；')['slice'](0x0, STORY_EPISODE_SCENE_SPATIAL_ANCHOR_MAX_CHARACTERS);
}
export function createStoryEpisodeSplitCompactSceneCatalog(
  list = [],
  { includeSpatialAnchors: includeSpatialAnchors = ![] } = {},
) {
  const list2 = [];
  return (
    (Array['isArray'](list) ? list : [])
      ['filter']((key) => normalizeText(key?.['kind']) === 'scene')
      ['forEach']((index) => {
        const result = Array['isArray'](index?.['appearances'])
            ? index['appearances']['filter']((data) => normalizeText(data?.['ref']))
            : [],
          target =
            result['find'](
              (source) => normalizeText(source?.['ref']) === normalizeText(index?.['baseAppearanceRef']),
            ) ||
            result[0x0] ||
            null,
          args = includeSpatialAnchors ? buildStoryEpisodeSceneSpatialAnchor(index, target) : '';
        list2['push']({
          code: 's' + (list2['length'] + 0x1),
          name: normalizeText(index?.['name']),
          ...(args ? { spatialAnchor: args } : {}),
          assetName: normalizeText(index?.['name']),
          ref: normalizeText(target?.['ref']) || normalizeText(index?.['ref']),
          assetRef: normalizeText(index?.['ref']),
          kind: 'scene',
          sourceSceneRefs: normalizeStringArray(index?.['sourceSceneRefs']),
        });
      }),
    list2
  );
}
export function createStoryEpisodeSplitPromptSceneCatalog(list3 = [], next = '') {
  return createStoryEpisodeSplitCompactSceneCatalog(list3, {
    includeSpatialAnchors: isStorySeedance25PromptMode(next),
  })['map'](({ code: code, name: name, spatialAnchor: spatialAnchor }) => ({
    code: code,
    name: name,
    ...(spatialAnchor ? { spatialAnchor: spatialAnchor } : {}),
  }));
}
