export const STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT = 100;
const MIN_CANDIDATE_LIMIT = 20,
  MAX_CANDIDATE_LIMIT = 120;
function normalizeText(value) {
  return String(value || '')
    ['normalize']('NFKC')
    ['trim']()
    ['toLocaleLowerCase']();
}
function createSearchTokens(item) {
  const text = normalizeText(item),
    key = new Set(text['match'](/[a-z0-9]+/g) || []);
  for (const list of text['match'](/[\p{Script=Han}]+/gu) || []) {
    if (list['length'] <= 4) key['add'](list);
    for (const index of [2, 3, 4]) {
      for (let result = 0; result <= list['length'] - index; result += 1) {
        key['add'](list['slice'](result, result + index));
      }
    }
  }
  return key;
}
function normalizeAssetFields(error = {}) {
  const tags = [
    ...(Array['isArray'](error['tags']) ? error['tags'] : []),
    ...(Array['isArray'](error['keywords']) ? error['keywords'] : []),
  ]
    ['map'](normalizeText)
    ['filter'](Boolean);
  return {
    id: normalizeText(error['id'] || error['familyId']),
    name: normalizeText(error['name']),
    category: normalizeText(error['category']),
    tags: tags,
    familyId: normalizeText(error['familyId'] || error['source']?.['familyId']),
  };
}
function countTokenMatches(map, enabled) {
  if (!enabled) return 0;
  const list2 = createSearchTokens(enabled);
  let data = 0;
  return (
    list2['forEach']((options) => {
      if (map['has'](options)) data += 1;
    }),
    data
  );
}
function scoreAsset(target, list3, source) {
  const error2 = normalizeAssetFields(target);
  let next = 0;
  if (list3 && error2['name'] === list3) next += 240;
  if (list3['length'] >= 2 && error2['name']['includes'](list3)) next += 160;
  if (error2['name']['length'] >= 2 && list3['includes'](error2['name'])) next += 120;
  return (
    list3['length'] >= 2 && error2['tags']['some']((list4) => list4['includes'](list3)) && (next += 140),
    (next += countTokenMatches(source, error2['name']) * 28),
    (next += error2['tags']['reduce'](
      (current, entry) => current + countTokenMatches(source, entry) * 22,
      0,
    )),
    (next += countTokenMatches(source, error2['category']) * 10),
    (next += countTokenMatches(source, error2['familyId']) * 8),
    (next += countTokenMatches(source, error2['id']) * 6),
    next
  );
}
function interleaveFallbackAssets(list5) {
  const map2 = new Map();
  list5['forEach']((record) => {
    const assetFields = normalizeAssetFields(record['asset']),
      payload =
        assetFields['category'] ||
        normalizeText(record['asset']?.['sourcePack'] || record['asset']?.['source']?.['packId']) ||
        'other';
    if (!map2['has'](payload)) map2['set'](payload, []);
    map2['get'](payload)['push'](record);
  });
  const list6 = [...map2['values']()],
    list7 = [];
  while (list6['length'] > 0) {
    for (let count = list6['length'] - 1; count >= 0; count -= 1) {
      const handle = list6[count]['shift']();
      if (handle) list7['push'](handle);
      if (list6[count]['length'] === 0) list6['splice'](count, 1);
    }
  }
  return list7;
}
export function selectRelevantStoryboard3DAssets(
  list8 = [],
  state = '',
  { limit: limit = STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT } = {},
) {
  const text2 = normalizeText(state),
    searchTokens = createSearchTokens(text2),
    config = Math['max'](
      MIN_CANDIDATE_LIMIT,
      Math['min'](
        MAX_CANDIDATE_LIMIT,
        Math['floor'](Number(limit) || STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT),
      ),
    ),
    map3 = new Set(),
    list9 = (Array['isArray'](list8) ? list8 : [])
      ['map']((asset, index2) => ({
        asset: asset,
        index: index2,
        key: normalizeText(asset?.['id'] || asset?.['familyId']),
        score: scoreAsset(asset, text2, searchTokens),
      }))
      ['filter']((event) => {
        if (!event['key'] || map3['has'](event['key'])) return false;
        return (map3['add'](event['key']), true);
      });
  if (list9['length'] <= config) return list9['map']((scope) => scope['asset']);
  const args = list9['filter']((input) => input['score'] > 0)['sort'](
      (output, value2) => value2['score'] - output['score'] || output['index'] - value2['index'],
    ),
    args2 = interleaveFallbackAssets(list9['filter']((value3) => value3['score'] <= 0));
  return [...args, ...args2]['slice'](0, config)['map']((value4) => value4['asset']);
}
