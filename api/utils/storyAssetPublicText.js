function normalizeText(_0x4385ee) {
  return typeof _0x4385ee === 'string' ? _0x4385ee['trim']() : '';
}
const STORY_ASSET_FALLBACK_DIAGNOSTIC_PATTERN =
    /模型细化结果不完整，已使用剧本证据建立基础可生成设定。[。]?/gu,
  STORY_ASSET_CLIENT_INSTRUCTION_PATTERN =
    /(?:背景由客户端统一添加|由客户端统一添加背景|客户端(?:会|将)?统一添加背景)[。.!！]?/gu,
  STORY_ASSET_INTERNAL_EVIDENCE_PATTERN =
    /(?:PP-UIE(?:\s+(?:local\s+candidate|candidate|evidence))?|candidateAssets(?:\s+internal\s+clue)?|本地候选|候选资产|召回候选|召回线索|证据原文)\s*[：:]?[^。\r\n；;]*/giu;
export function stripStoryAssetInternalEvidenceMetadata(_0x8fb150) {
  return normalizeText(_0x8fb150)
    ['replace'](/PP-UIE\s*本地候选：[^\r\n]*(?:\r?\n\s*证据原文：)?/giu, '')
    ['replace'](/证据原文：/gu, '')
    ['replace'](STORY_ASSET_INTERNAL_EVIDENCE_PATTERN, '')
    ['replace'](STORY_ASSET_FALLBACK_DIAGNOSTIC_PATTERN, '')
    ['replace'](/[ \t]+\n/gu, '\x0a')
    ['replace'](/\n{3,}/gu, '\x0a\x0a')
    ['trim']();
}
export function sanitizeStoryAssetPublicDescriptionText(_0x1688fb) {
  return stripStoryAssetInternalEvidenceMetadata(_0x1688fb)
    ['replace'](STORY_ASSET_INTERNAL_EVIDENCE_PATTERN, '')
    ['replace'](/(^|[\r\n])(?:剧本事实|视觉补全)：\s*(?=$|[\r\n])/gu, '$1')
    ['replace'](/\n{3,}/gu, '\x0a\x0a')
    ['trim']();
}
export function sanitizeStoryAssetPublicPromptText(_0x238138) {
  return normalizeText(_0x238138)
    ['replace'](/保留原视频的视觉风格[、，,\s]*场景和道具[。.!！；;，,]?/gu, '')
    ['replace'](
      /依据原片可见外观记录角色、场景与道具[，,、\s]*不替换人物[，,、\s]*不翻译对白[，,、\s]*/gu,
      '',
    )
    ['replace'](STORY_ASSET_INTERNAL_EVIDENCE_PATTERN, '')
    ['replace'](/PP-UIE\s*本地候选：[^\r\n]*/giu, '')
    ['replace'](/(?:^|[\r\n])\s*(?:candidateAssets|候选资产|召回候选|召回线索)\s*[：:][^\r\n]*/giu, '\x0a')
    ['replace'](/(?:^|[\r\n])\s*证据原文：[^\r\n]*/gu, '\x0a')
    ['replace'](/证据原文：[^\r\n]*/gu, '')
    ['replace'](STORY_ASSET_FALLBACK_DIAGNOSTIC_PATTERN, '')
    ['replace'](STORY_ASSET_CLIENT_INSTRUCTION_PATTERN, '')
    ['replace'](/(^|[\r\n，；])(?:剧本事实|视觉补全)：\s*/gu, '$1')
    ['replace'](/[，；]\s*([，；。])/gu, '$1')
    ['replace'](/[，,；;]\s*([。.!！]|$)/gu, '$1')
    ['replace'](/[ \t]+\n/gu, '\x0a')
    ['replace'](/\n{2,}/gu, '\x0a')
    ['trim']();
}
