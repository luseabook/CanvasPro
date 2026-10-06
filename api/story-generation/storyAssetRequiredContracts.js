import { getStorySceneIdentityKey } from '../utils/storySceneIdentity.js';
const STORY_ASSET_KINDS = Object.freeze(['character', 'scene', 'prop']);
function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function normalizeStringArray(list = []) {
  return [...new Set((Array.isArray(list) ? list : []).map(normalizeText).filter(Boolean))];
}
function normalizeAssetName(item = '') {
  return normalizeText(item)
    .normalize('NFKC')
    .replace(/[（(][^（）()]{0,30}[）)]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase();
}
function createCharacterAliases(key = '') {
  const assetName = normalizeAssetName(key);
  if (!assetName) return [];
  const index = assetName.replace(
    /^(?:房东|编辑|医生|护士|警察|老师|老板|经理|店员|保安|司机|队长|主任|主管)/u,
    '',
  );
  return [...new Set([assetName, index].filter(Boolean))];
}
function assetNamesMatch(result, data = '', options = '') {
  if (result === 'scene') {
    const list2 = getStorySceneIdentityKey(data),
      list3 = getStorySceneIdentityKey(options);
    return Boolean(
      list2 && list3 && (list2 === list3 || list2.includes(list3) || list3.includes(list2)),
    );
  }
  if (result === 'character') {
    const list4 = createCharacterAliases(data),
      list5 = createCharacterAliases(options);
    return list4.some((target) => list5.includes(target));
  }
  return normalizeAssetName(data) === normalizeAssetName(options);
}
function assetNamesMatchExactly(source, next = '', current = '') {
  if (source === 'scene')
    return Boolean(
      getStorySceneIdentityKey(next) && getStorySceneIdentityKey(next) === getStorySceneIdentityKey(current),
    );
  return normalizeAssetName(next) === normalizeAssetName(current);
}
function normalizeStoryAssetCharacterRole(entry = '') {
  const text = normalizeText(entry).toLowerCase();
  if (/^(?:主角|protagonist|lead|hero)$/iu.test(text)) return '主角';
  if (/^(?:反派|antagonist|villain)$/iu.test(text)) return '反派';
  if (/^(?:路人|extra|passerby)$/iu.test(text)) return '路人';
  return '配角';
}
export function createStoryAssetRequiredContractsByKind({
  project: project = {},
  requirementEvidence: requirementEvidence = {},
  sourceScenes: sourceScenes = [],
  requiredAssetNamesByKind: requiredAssetNamesByKind = {},
} = {}) {
  const list6 = Array.isArray(project?.characters) ? project.characters : [],
    map = new Map(
      (Array.isArray(sourceScenes) ? sourceScenes : []).map((record) => [
        normalizeText(record?.ref),
        normalizeText(record?.episodeRef),
      ]),
    ),
    list7 = Array.isArray(requirementEvidence?.hardRequired)
      ? requirementEvidence.hardRequired
      : [];
  return Object.fromEntries(
    STORY_ASSET_KINDS.map((payload) => [
      payload,
      normalizeStringArray(requiredAssetNamesByKind?.[payload]).map((name) => {
        const list8 = list7.filter((handle) => handle?.kind === payload),
          list9 = list8.filter((error) => assetNamesMatchExactly(payload, error?.name, name)),
          list10 = list9.length
            ? list9
            : list8.filter((error2) => assetNamesMatch(payload, error2?.name, name)),
          sourceSceneRefs = normalizeStringArray(
            list10.flatMap((state) =>
              state?.hardSourceSceneRefs?.length
                ? state.hardSourceSceneRefs
                : state?.sourceSceneRefs || [],
            ),
          ),
          sourceChapterIds = normalizeStringArray(sourceSceneRefs.map((config) => map.get(config))),
          scope =
            payload === 'character'
              ? list6.find((error3) => assetNamesMatchExactly('character', error3?.name, name))
              : null,
          fixedTraits = normalizeText(
            Array.isArray(scope?.fixedTraits)
              ? scope.fixedTraits.join('、')
              : scope?.fixedTraits,
          ).slice(0, 160);
        return {
          name: name,
          sourceSceneRefs: sourceSceneRefs,
          sourceChapterIds: sourceChapterIds,
          ...(payload === 'character'
            ? {
                role: normalizeStoryAssetCharacterRole(scope?.roleType || scope?.role),
                ...(fixedTraits ? { fixedTraits: fixedTraits } : {}),
              }
            : {}),
        };
      }),
    ]),
  );
}
export function lockStoryAssetRequiredSourceChapterIds(args = {}, input = {}, output = {}) {
  return {
    ...args,
    assets: (Array.isArray(args?.assets) ? args.assets : []).map((error4) => {
      const text2 = normalizeText(error4?.kind),
        list11 = [
          ...(Array.isArray(input?.[text2]) ? input[text2] : []),
          ...(Array.isArray(output?.[text2]) ? output[text2] : []),
        ],
        list12 = list11.filter((error5) =>
          assetNamesMatchExactly(text2, error4?.name, error5?.name),
        ),
        list13 = list12.length
          ? list12
          : list11.filter((error6) => assetNamesMatch(text2, error4?.name, error6?.name)),
        value2 = new Set(list13.map((error7) => getStorySceneIdentityKey(error7?.name))),
        list14 = text2 === 'scene' && !list12.length && value2.size > 1 ? [] : list13;
      if (!list14.length) return error4;
      const sourceChapterIds2 = normalizeStringArray(
        list14.flatMap((value3) => value3.sourceChapterIds || []),
      );
      if (!sourceChapterIds2.length) return error4;
      const role =
        text2 === 'character'
          ? list14.map((value4) => normalizeText(value4?.role)).find((value5) =>
              ['主角', '配角', '反派', '路人'].includes(value5),
            )
          : '';
      return {
        ...error4,
        ...(role ? { role: role } : {}),
        sourceChapterIds: sourceChapterIds2,
        appearances: (Array.isArray(error4?.appearances) ? error4.appearances : []).map(
          (args2) => ({ ...args2, sourceChapterIds: sourceChapterIds2 }),
        ),
      };
    }),
  };
}
