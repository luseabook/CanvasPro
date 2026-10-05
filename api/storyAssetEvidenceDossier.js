export const STORY_ASSET_EVIDENCE_DOSSIER_MAX_SCENES = 6;
export const STORY_ASSET_EVIDENCE_DOSSIER_MAX_CHARACTERS = 2400;
const CANDIDATE_KEY_BY_KIND = Object['freeze']({
  character: 'character',
  scene: 'scene',
  prop: 'prop',
});
function normalizeText(value) {
  return typeof value === 'string' ? value['trim']() : '';
}
function normalizeStringArray(item) {
  return [...new Set((Array['isArray'](item) ? item : [])['map'](normalizeText)['filter'](Boolean))];
}
function createAssetNameAliases(error = {}) {
  const args = normalizeText(error?.['name']);
  if (!args) return [];
  const text = normalizeText(args['split'](/[_（(]/u)[0]),
    args2 = [...args['matchAll'](/[（(]([^（）()\r\n]+)[）)]/gu)]['map']((key) => normalizeText(key[1]));
  return normalizeStringArray([args, text, ...args2]);
}
function sceneMentionsAsset(dom = {}, index = {}, list = []) {
  const result = CANDIDATE_KEY_BY_KIND[normalizeText(index?.['kind'])],
    list2 = normalizeStringArray(dom?.['localEntityCandidates']?.[result]),
    data = list2['some']((list3) =>
      list['some']((list4) => list3 === list4 || list3['includes'](list4) || list4['includes'](list3)),
    );
  if (data) return true;
  const list5 = normalizeText(dom?.['heading']) + '\n' + normalizeText(dom?.['body']);
  return list['some']((options) => list5['includes'](options));
}
function buildPrioritizedSceneRefs(options2 = {}, list6 = []) {
  const map = new Set(list6['map']((target) => normalizeText(target?.['ref']))),
    list7 = normalizeStringArray(options2?.['sourceSceneRefs'])['filter']((source) => map['has'](source)),
    assetNameAliases = createAssetNameAliases(options2),
    list8 = [],
    handler = (next) => {
      const text2 = normalizeText(next);
      if (text2 && map['has'](text2) && !list8['includes'](text2)) list8['push'](text2);
    };
  return (
    (Array['isArray'](options2?.['appearances']) ? options2['appearances'] : [])['forEach']((current) => {
      const stringArray = normalizeStringArray(current?.['sourceSceneRefs']);
      (handler(stringArray[0]), handler(stringArray['at'](-1)));
    }),
    handler(list7[0]),
    handler(list7['at'](-1)),
    list6['filter'](
      (entry) =>
        list7['includes'](normalizeText(entry?.['ref'])) &&
        sceneMentionsAsset(entry, options2, assetNameAliases),
    )['forEach']((record) => handler(record['ref'])),
    list7['forEach'](handler),
    list8
  );
}
function compactEvidenceExcerpt(payload, list9 = [], handle = 600) {
  const list10 = normalizeText(payload),
    state = Math['max'](160, Math['trunc'](Number(handle) || 0));
  if ([...list10]['length'] <= state) return list10;
  const list11 = '证据原文：',
    count = list10['indexOf'](list11),
    config = count >= 0 ? count + list11['length'] : 0,
    list12 = list10['slice'](config),
    scope = list9['map']((input) => list12['indexOf'](input))['find']((count2) => count2 >= 0);
  if (Number['isInteger'](scope)) {
    const output = Math['floor'](state * 0.38),
      value2 = config + scope,
      value3 = Math['max'](0, value2 - output),
      value4 = Math['min'](list10['length'], value3 + state);
    return list10['slice'](Math['max'](0, value4 - state), value4);
  }
  const list13 = '\n……\n',
    value5 = Math['max'](1, state - list13['length']),
    value6 = Math['floor'](value5 * 0.7),
    value7 = value5 - value6;
  return '' + list10['slice'](0, value6) + list13 + list10['slice'](-value7);
}
export function createStoryAssetEvidenceDossiers(
  list14 = [],
  value8 = [],
  {
    maxScenes: maxScenes = STORY_ASSET_EVIDENCE_DOSSIER_MAX_SCENES,
    maxCharacters: maxCharacters = STORY_ASSET_EVIDENCE_DOSSIER_MAX_CHARACTERS,
    includeSourceMappings: includeSourceMappings = true,
  } = {},
) {
  const list15 = Array['isArray'](value8) ? value8 : [],
    map2 = new Map(list15['map']((value9) => [normalizeText(value9?.['ref']), value9])),
    value10 = Math['max'](1, Math['trunc'](Number(maxScenes) || 0)),
    value11 = Math['max'](600, Math['trunc'](Number(maxCharacters) || 0));
  return (Array['isArray'](list14) ? list14 : [])['map']((error2) => {
    const assetNameAliases2 = createAssetNameAliases(error2),
      list16 = buildPrioritizedSceneRefs(error2, list15)['slice'](0, value10),
      value12 = Math['max'](
        240,
        Math['min'](900, Math['floor'](value11 / Math['max'](1, list16['length']))),
      );
    let count3 = value11;
    const evidence = list16['flatMap']((sourceSceneRef) => {
      if (count3 <= 0) return [];
      const dom2 = map2['get'](sourceSceneRef);
      if (!dom2) return [];
      const body = compactEvidenceExcerpt(dom2['body'], assetNameAliases2, Math['min'](value12, count3));
      if (!body) return [];
      return (
        (count3 -= [...body]['length']),
        [
          {
            sourceSceneRef: sourceSceneRef,
            sourceEpisodeRef: normalizeText(dom2?.['episodeRef']),
            episodeNumber: Math['max'](1, Math['trunc'](Number(dom2?.['episodeNumber']) || 1)),
            heading: normalizeText(dom2?.['heading']),
            body: body,
          },
        ]
      );
    });
    return {
      assetRef: normalizeText(error2?.['ref']),
      kind: normalizeText(error2?.['kind']),
      name: normalizeText(error2?.['name']),
      role: normalizeText(error2?.['role']),
      ...(includeSourceMappings
        ? {
            sourceEpisodeRefs: normalizeStringArray(error2?.['sourceEpisodeRefs']),
            sourceSceneRefs: normalizeStringArray(error2?.['sourceSceneRefs']),
          }
        : {}),
      inventoryHints: {
        description: normalizeText(error2?.['description']),
        appearances: (Array['isArray'](error2?.['appearances']) ? error2['appearances'] : [])['map'](
          (error3) => ({
            ref: normalizeText(error3?.['ref']),
            name: normalizeText(error3?.['name']),
            description: normalizeText(error3?.['description']),
            sourceSceneRefs: normalizeStringArray(error3?.['sourceSceneRefs']),
          }),
        ),
      },
      evidence: evidence,
    };
  });
}
