import { normalizeStoryAssetReference } from './storyAssetExtractionResult.js';
export function resolveStoryGenerationAssetRef(_0xed9790 = {}, _0x192e28 = 0x0) {
  return normalizeStoryAssetReference(
    _0xed9790['ref'] || _0xed9790['planningRef'] || _0xed9790['id'],
    'asset-' + (_0x192e28 + 0x1),
  );
}
export function resolveStoryGenerationAppearanceRef(_0x295c97) {
  return normalizeStoryAssetReference(
    _0x295c97?.['planningRef'] || _0x295c97?.['ref'] || _0x295c97?.['id'],
    '',
  );
}
export function normalizeStoryGenerationAssetReferences(_0x51aacd = []) {
  return (Array['isArray'](_0x51aacd) ? _0x51aacd : [])['map']((_0x5811e7, _0x394858) => ({
    ..._0x5811e7,
    ref: resolveStoryGenerationAssetRef(_0x5811e7, _0x394858),
    appearances: (Array['isArray'](_0x5811e7['appearances']) ? _0x5811e7['appearances'] : [])['map'](
      (_0x36bcc1) => ({ ..._0x36bcc1, ref: resolveStoryGenerationAppearanceRef(_0x36bcc1) }),
    ),
  }));
}
export const STORY_ASSET_REFERENCE_RULES = [
  'assetRef 必须逐字使用 assets 中的 ref；appearanceRef 必须逐字使用该资产 appearances 中的 ref，不能使用其他资产的形象。',
  '某资产 appearances 为空时，保留其 assetRef，appearanceRef 必须是空字符串；这表示没有指定参考形象，不是引用遗漏。禁止拼接 -base、-appearance 或根据名称编造 ID。',
  '某资产有可用形象时，按当前剧情从给出的 appearances 中选择；保留已有有效引用，不根据出现时段猜测或新增形象 ID。',
];
export function buildStoryAssetReferenceContract(_0xd06786 = []) {
  return _0xd06786['map']((_0xf6ec95) => ({
    assetRef: String(_0xf6ec95['ref'] || ''),
    allowedAppearanceRefs: _0xf6ec95['appearances']?.['length']
      ? _0xf6ec95['appearances']['map']((_0x185155) => String(_0x185155['ref'] || ''))
      : [''],
  }));
}
