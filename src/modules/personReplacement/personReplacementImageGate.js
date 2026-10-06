import { isPersonReplacementSceneOnlyPromptPackage } from './personReplacementPromptCompiler.js';
import { getPersonReplacementDuplicateRoleLabels } from './personReplacementSourceIdentity.js';
import {
  PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
  isPersonReplacementTestModeAvailable,
} from './personReplacementPromptMode.js';
import { getModelManifest } from '../../manifests/index.js';
import { getTargetInputPolicy } from '../modelInputPolicy.js';
import { PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID } from './personReplacementProject.js';
import { getPersonReplacementPromptReferenceReviewMessage } from './personReplacementPromptReferenceReview.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
export function buildPersonReplacementImageGate({
  project: project = {},
  shot: shot = {},
  promptPackage: promptPackage = {},
  inputUrls: inputUrls = null,
  modelId: modelId = '',
  recovering: recovering = false,
} = {}) {
  promptPackage ||= {};
  const value =
      modelId ||
      project.settings?.replacementImageModelId ||
      PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
    modelManifest = getModelManifest(value),
    item = Number(
      getTargetInputPolicy({
        type: 'ai-image',
        model: value,
        provider: project.settings?.replacementImageProvider,
        generationParams: project.settings?.replacementImageGenerationParams,
      }).maxByKind?.image,
    ),
    enabled = promptPackage.referenceImages?.find((key) => key.role === 'source-keyframe'),
    index =
      promptPackage.annotatedSource &&
      !enabled?.originalRef &&
      promptPackage.referenceImages.some(
        (result) =>
          result.role !== 'source-keyframe' &&
          (localPathToUrl(result.ref) || result.ref) ===
            (localPathToUrl(enabled?.ref) || enabled?.ref),
      ),
    data =
      new Set(
        (inputUrls || promptPackage.referenceImages?.map((options) => options.ref) || [])
          .map((target) => String(target || '').trim())
          .filter(Boolean),
      ).size + (index ? 1 : 0),
    source = modelManifest?.extensions?.inputValidation?.rejectImageOverflow === true,
    args = source && Number.isFinite(item) && data > item,
    enabled2 = promptPackage.promptMode === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
    enabled3 = new Set(promptPackage.activePersonIds || []),
    list = enabled2
      ? []
      : getPersonReplacementDuplicateRoleLabels(
          { ...shot, people: (shot.people || []).filter((next) => enabled3.has(next.id)) },
          project,
        ),
    enabled4 = promptPackage.referenceImages?.some((current) => current.role === 'source-keyframe'),
    enabled5 = !enabled2 && isPersonReplacementSceneOnlyPromptPackage(promptPackage),
    args2 = getPersonReplacementPromptReferenceReviewMessage(shot, promptPackage),
    {
      mappedPersonIds: mappedPersonIds = [],
      missingLocatorPersonIds: missingLocatorPersonIds = [],
      unmappedPersonIds: unmappedPersonIds = [],
      unresolvedOrientationPersonIds: unresolvedOrientationPersonIds = [],
      overflowPersonIds: overflowPersonIds = [],
    } = promptPackage,
    entry = [
      ...(promptPackage.promptMode === PERSON_REPLACEMENT_PROMPT_MODE_TEST &&
      !recovering &&
      !isPersonReplacementTestModeAvailable()
        ? ['developer-mode']
        : []),
      ...(args2 ? ['reference-review'] : []),
      ...(!enabled4 ? ['missing-source'] : []),
      ...(args ? ['image-limit'] : []),
      ...(!enabled2 && !enabled5
        ? [
            ...(!enabled3.size || missingLocatorPersonIds.length === enabled3.size
              ? ['missing-person-box']
              : []),
            ...(list.length ? ['duplicate-role'] : []),
            ...(overflowPersonIds.length ? ['person-limit'] : []),
            ...(missingLocatorPersonIds.length ? ['missing-locator'] : []),
            ...(unresolvedOrientationPersonIds.length ? ['missing-orientation'] : []),
            ...(unmappedPersonIds.length ? ['missing-mapping'] : []),
          ]
        : []),
    ],
    record = {
      'developer-mode': '测试模式仅限开发者，请开启开发者模式或切回其他替换模式。',
      'reference-review': args2,
      'image-limit':
        (modelManifest?.displayName || '所选模型') +
        ' 最多支持 ' +
        item +
        ' 张输入图片，当前共 ' +
        data +
        ' 张（包含原图、人物/场景参考图、定位图及 @ 引用），请减少图片后再生成。',
      'missing-source': '请先选择待修改的原图。',
      'duplicate-role': '同一镜头内角色不能重复：' + list.join('、') + '。请修改红色框中的角色名。',
      'person-limit': '单次最多替换 8 个目标人物。',
      'missing-locator': '存在缺少定位框的人物，请切换关键帧或手动补框后再生成。',
      'missing-orientation':
        '还有 ' + unresolvedOrientationPersonIds.length + ' 个人物未确认朝向，请先选择朝向。',
      'missing-mapping': '还有 ' + unmappedPersonIds.length + ' 个人物框未绑定可用的目标形象。',
      'missing-person-box': '请先把至少一个素材形象拖到首帧人物框。',
    };
  return {
    eligible: entry.length === 0,
    manual: enabled2,
    sceneOnly: enabled5,
    enforceImageLimit: source,
    mappingComplete: !enabled2 && mappedPersonIds.length > 0 && entry.length === 0,
    blockers: entry,
    message: record[entry[0]] || '',
    duplicateRoleLabels: list,
    mappedPersonIds: mappedPersonIds,
    missingLocatorPersonIds: missingLocatorPersonIds,
    unmappedPersonIds: unmappedPersonIds,
    unresolvedOrientationPersonIds: unresolvedOrientationPersonIds,
    overflowPersonIds: overflowPersonIds,
  };
}
