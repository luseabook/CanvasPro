import { getPersonReplacementCharacterBaseImageRef } from './personReplacementProject.js';
export const PERSON_REPLACEMENT_STEPS = Object['freeze']([
  Object['freeze']({ id: 0x1, key: 'asset-settings', label: '素材设定' }),
  Object['freeze']({ id: 0x2, key: 'image-replacement', label: '图像替换' }),
  Object['freeze']({ id: 0x3, key: 'video-replacement', label: '视频替换' }),
  Object['freeze']({ id: 0x4, key: 'voice-clone', label: '声音克隆' }),
  Object['freeze']({ id: 0x5, key: 'composite-preview', label: '合成视频' }),
]);
export const PERSON_REPLACEMENT_STEP_GATE_REASONS = Object['freeze']({
  ASSET_SETTINGS_INCOMPLETE: 'asset-settings-incomplete',
  IMAGE_REPLACEMENT_INCOMPLETE: 'image-replacement-incomplete',
});
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function clamp(item, key, index, result = key) {
  const data = Number(item);
  return Number['isFinite'](data) ? Math['min'](index, Math['max'](key, data)) : result;
}
export function getPersonReplacementStepCompletion(options = {}) {
  const assetSettingsComplete = new Set(
      (Array['isArray'](options['characters']) ? options['characters'] : [])
        ['filter']((target) => getPersonReplacementCharacterBaseImageRef(target))
        ['map']((source) => normalizeText(source['id']))
        ['filter'](Boolean),
    ),
    map = new Set(
      (Array['isArray'](options['scenes']) ? options['scenes'] : [])
        ['filter']((next) => getPersonReplacementCharacterBaseImageRef(next))
        ['map']((current) => normalizeText(current['id']))
        ['filter'](Boolean),
    ),
    map2 = new Map(
      (Array['isArray'](options['mappings']) ? options['mappings'] : [])
        ['map']((entry) => [
          normalizeText(entry?.['sourceCharacterId']),
          normalizeText(entry?.['targetCharacterId']),
        ])
        ['filter'](([record, payload]) => record && assetSettingsComplete['has'](payload)),
    ),
    imageReplacementComplete = (Array['isArray'](options['shots']) ? options['shots'] : [])['some'](
      (handle) =>
        (Array['isArray'](handle?.['people']) ? handle['people'] : [])['some']((state) => {
          const text = normalizeText(state?.['targetCharacterId']),
            config =
              text ||
              (state?.['projectMappingDisabled'] === !![]
                ? ''
                : map2['get'](normalizeText(state?.['sourceCharacterId']))) ||
              '';
          return assetSettingsComplete['has'](config);
        }),
    ),
    scope = (Array['isArray'](options['shots']) ? options['shots'] : [])['some']((input) =>
      map['has'](normalizeText(input?.['sceneReference']?.['sceneId'])),
    );
  return {
    assetSettingsComplete: assetSettingsComplete['size'] > 0x0 || map['size'] > 0x0,
    imageReplacementComplete: imageReplacementComplete || scope,
  };
}
export function getPersonReplacementStepGate(
  output,
  value2,
  personReplacementStepCompletion = getPersonReplacementStepCompletion(output),
) {
  const count = Math['trunc'](clamp(value2, 0x1, 0x5, 0x1));
  if (count <= 0x1) return { allowed: !![], reason: '', message: '' };
  if (!personReplacementStepCompletion['assetSettingsComplete'])
    return {
      allowed: ![],
      reason: PERSON_REPLACEMENT_STEP_GATE_REASONS['ASSET_SETTINGS_INCOMPLETE'],
      message: '请先在素材设定上传至少一张人物或场景图片',
    };
  if (count <= 0x3) return { allowed: !![], reason: '', message: '' };
  if (!personReplacementStepCompletion['imageReplacementComplete'])
    return {
      allowed: ![],
      reason: PERSON_REPLACEMENT_STEP_GATE_REASONS['IMAGE_REPLACEMENT_INCOMPLETE'],
      message: '请先在图像替换中绑定人物或场景',
    };
  return { allowed: !![], reason: '', message: '' };
}
export function getPersonReplacementAccessibleStep(value3, value4) {
  const value5 = Math['trunc'](clamp(value4, 0x1, 0x5, 0x1)),
    personReplacementStepCompletion2 = getPersonReplacementStepCompletion(value3);
  if (!personReplacementStepCompletion2['assetSettingsComplete']) return 0x1;
  if (!personReplacementStepCompletion2['imageReplacementComplete']) return Math['min'](value5, 0x3);
  return value5;
}
