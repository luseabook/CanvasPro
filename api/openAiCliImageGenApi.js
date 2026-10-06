import { generateImageWithCliProvider } from './cliProviderApi.js';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
import { buildCanvasLocalImageFields } from '../src/services/canvasMediaLocalService.js';
import { localPathToUrl, normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { getModelManifest, sanitizeModelUiSchemaParams } from '../src/manifests/index.js';
function resolveImageParameters(args, value) {
  const modelManifest = getModelManifest(args?.model);
  if (!modelManifest || modelManifest.executionId !== value?.id)
    throw new Error('OpenAI CLI 图片模型与执行配置不匹配');
  return sanitizeModelUiSchemaParams(modelManifest.modelId, {
    ...args,
    ...args.generationParams,
  });
}
function buildImagePrompt(item, key, index) {
  const list = index?.extensions?.promptFields;
  if (!Array.isArray(list)) throw new Error('OpenAI CLI 图片执行配置缺少 promptFields');
  const args2 = list.flatMap(({ field: field, template: template, omitValues: omitValues = [] }) => {
    const result = key[field];
    if (result === undefined) throw new Error('OpenAI CLI 图片参数缺少 ' + field);
    return omitValues.includes(result) ? [] : [template.replace('{value}', String(result))];
  });
  return [item, ...args2].filter(Boolean).join('\n\n');
}
function resolveCliProvider(options = {}) {
  const enabled = String(options?.extensions?.cliProvider || '')
    .trim()
    .toLowerCase();
  if (!enabled) throw new Error('OpenAI CLI 图片执行配置缺少 cliProvider');
  return enabled;
}
function resolveReferenceInputUrls(options2 = {}) {
  const list2 = Array.isArray(options2?.inputUrls) ? options2.inputUrls : [],
    list3 = Array.from(new Set(list2.map((data) => String(data || '').trim()).filter(Boolean))),
    modelManifest2 = getModelManifest(options2.model)?.inputSlots?.maxByKind?.image;
  if (list3.length > modelManifest2)
    throw new Error(
      'OpenAI CLI 最多支持 ' +
        modelManifest2 +
        ' 张参考图，当前共 ' +
        list3.length +
        ' 张，请减少图片后再生成。',
    );
  return list3;
}
export function buildOpenAiCliImageSubmitRequest(options3 = {}, target = '', source = {}) {
  const imageParameters = resolveImageParameters(options3, source),
    inputUrls = resolveReferenceInputUrls(options3);
  return {
    url: '/api/v2/cli-providers/generate-image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      provider: resolveCliProvider(source),
      prompt: buildImagePrompt(
        String(target || options3?.prompt || '').trim(),
        imageParameters,
        source,
      ),
      ...(inputUrls.length > 0 ? { inputUrls: inputUrls } : {}),
    },
  };
}
async function materializeEditingImage(enabled2) {
  if (!enabled2.startsWith('blob:')) return enabled2;
  const response = await fetch(enabled2);
  if (!response.ok) throw new Error('OpenAI CLI 编辑参考图读取失败');
  const next = await response.blob();
  if (next.type !== 'image/png' || next.size > 20 * 1024 * 1024)
    throw new Error('OpenAI CLI 临时编辑参考图仅支持不超过 20 MB 的 PNG');
  const list4 = new Uint8Array(await next.arrayBuffer()),
    list5 = [];
  for (let current = 0; current < list4.length; current += 32768) {
    list5.push(String.fromCharCode(...list4.subarray(current, current + 32768)));
  }
  return 'data:image/png;base64,' + btoa(list5.join(''));
}
export async function runOpenAiCliImageGeneration(timeoutMs = {}, entry = {}) {
  const prompt = applyCameraAngleToPrompt(timeoutMs?.prompt, timeoutMs?.cameraAngle).trim();
  if (!prompt) throw new Error('OpenAI CLI 图像生成需要提示词');
  const imageParameters2 = resolveImageParameters(timeoutMs, entry),
    dom = buildOpenAiCliImageSubmitRequest(timeoutMs, prompt, entry),
    record = { ...dom.body, timeoutMs: timeoutMs?.timeoutMs };
  if (record.inputUrls)
    record.inputUrls = await Promise.all(record.inputUrls.map(materializeEditingImage));
  const count = imageParameters2.batchSize,
    list6 = [];
  let payload;
  for (let handle = 0; handle < count; handle += 1) {
    try {
      const generateImageWithCliProvider2 = await generateImageWithCliProvider(record);
      list6.push(...normalizeImageResults(generateImageWithCliProvider2));
    } catch (error) {
      if (count === 1) throw error;
      ((payload ??= error), list6.push({ error: error.message, status: 'failed', retryable: false }));
    }
  }
  if (list6.every((response2) => response2.status === 'failed'))
    throw payload || new Error('OpenAI CLI 图像生成没有可用输出');
  return list6;
}
function normalizeImageResults(state) {
  const list7 = Array.isArray(state?.images) ? state.images : [];
  if (!list7.length) throw new Error('OpenAI CLI 图像生成完成，但没有可用输出');
  return list7.map((response3) => {
    const localPath = normalizeLocalPath(
        response3?.localPath || response3?.imageUrl || response3?.url,
      ),
      url = localPathToUrl(localPath);
    if (!localPath || !url) throw new Error('OpenAI CLI 返回了不安全的本地图片路径');
    return {
      sourceId: null,
      thumbId: null,
      ...buildCanvasLocalImageFields({ ...response3, localPath: localPath }),
    };
  });
}
