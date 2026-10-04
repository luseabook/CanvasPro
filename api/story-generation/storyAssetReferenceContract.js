import { normalizeStoryAssetReference } from './storyAssetExtractionResult.js';
export function resolveStoryGenerationAssetRef(options = {}, value = 0x0) {
  return normalizeStoryAssetReference(
    options['ref'] || options['planningRef'] || options['id'],
    'asset-' + (value + 0x1),
  );
}
export function resolveStoryGenerationAppearanceRef(item) {
  return normalizeStoryAssetReference(item?.['planningRef'] || item?.['ref'] || item?.['id'], '');
}
export function normalizeStoryGenerationAssetReferences(list = []) {
  return (Array['isArray'](list) ? list : [])['map']((args, key) => ({
    ...args,
    ref: resolveStoryGenerationAssetRef(args, key),
    appearances: (Array['isArray'](args['appearances']) ? args['appearances'] : [])['map']((args2) => ({
      ...args2,
      ref: resolveStoryGenerationAppearanceRef(args2),
    })),
  }));
}
export const STORY_ASSET_REFERENCE_RULES = [
  'assetRef 必须逐字使用 assets 中的 ref；appearanceRef 必须逐字使用该资产 appearances 中的 ref，不能使用其他资产的形象。',
  '某资产 appearances 为空时，保留其 assetRef，appearanceRef 必须是空字符串；这表示没有指定参考形象，不是引用遗漏。禁止拼接 -base、-appearance 或根据名称编造 ID。',
  '某资产有可用形象时，按当前剧情从给出的 appearances 中选择；保留已有有效引用，不根据出现时段猜测或新增形象 ID。',
];
export function buildStoryAssetReferenceContract(list2 = []) {
  return list2['map']((allowedAppearanceRefs) => ({
    assetRef: String(allowedAppearanceRefs['ref'] || ''),
    allowedAppearanceRefs: allowedAppearanceRefs['appearances']?.['length']
      ? allowedAppearanceRefs['appearances']['map']((index) => String(index['ref'] || ''))
      : [''],
  }));
}
