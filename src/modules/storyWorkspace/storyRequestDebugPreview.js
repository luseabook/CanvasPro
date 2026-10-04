import { openDebugRequestWindow, closeDebugRequestWindow } from '../debugRequestWindow.js';
import { maskDebugPayloadSecrets } from '../../utils/debugRequestMasking.js';
import { buildDebugJsonPreview } from '../../utils/debugImagePreview.js';
const STORY_REQUEST_CAPTURE_CODE = 'STORY_REQUEST_DEBUG_CAPTURED';
function cloneSerializableValue(value) {
  return JSON['parse'](JSON['stringify'](value));
}
function countCharacters(item = '') {
  return [...String(item || '')]['length'];
}
function parsePromptObject(key = '') {
  try {
    const index = JSON['parse'](String(key || ''));
    return index && typeof index === 'object' ? index : null;
  } catch {
    return null;
  }
}
function formatPromptForPreview(result = '') {
  const promptObject = parsePromptObject(result);
  return promptObject ? JSON['stringify'](promptObject, null, 0x2) : String(result || '');
}
function getPromptSectionCharacters(enabled) {
  if (!enabled || typeof enabled !== 'object') return {};
  return Object['fromEntries'](
    Object['entries'](enabled)['map'](([data, options]) => [
      data,
      countCharacters(JSON['stringify'](options)),
    ]),
  );
}
export async function captureStoryRequestPayload(handler) {
  if (typeof handler !== 'function') throw new TypeError('调试请求缺少可执行的生成操作。');
  let cloneSerializableValue2 = null;
  const async2 = async (options2 = {}) => {
    if (!cloneSerializableValue2) cloneSerializableValue2 = cloneSerializableValue(options2);
    const error = new Error('调试请求已在发送前截获。');
    error['code'] = STORY_REQUEST_CAPTURE_CODE;
    throw error;
  };
  try {
    await handler(async2);
  } catch (target) {
    if (cloneSerializableValue2) return cloneSerializableValue2;
    throw target;
  }
  if (cloneSerializableValue2) return cloneSerializableValue2;
  throw new Error('生成操作没有构造出可调试的 API 请求。');
}
export function buildStoryRequestDebugPreviewModel(
  options3 = {},
  { title: title = '剧本工作室请求调试', subtitle: subtitle = '' } = {},
) {
  const maskDebugPayloadSecrets2 = maskDebugPayloadSecrets(cloneSerializableValue(options3 || {})),
    source = String(maskDebugPayloadSecrets2?.['prompt'] || ''),
    content = String(maskDebugPayloadSecrets2?.['systemPrompt'] || ''),
    promptObject2 = parsePromptObject(source),
    task = String(promptObject2?.['task'] || ''),
    batchIndex = Math['max'](0x0, Math['trunc'](Number(promptObject2?.['batch']?.['index']) || 0x0)),
    batchTotal = Math['max'](0x0, Math['trunc'](Number(promptObject2?.['batch']?.['total']) || 0x0)),
    clipCount = Array['isArray'](promptObject2?.['batch']?.['clipPlans'])
      ? promptObject2['batch']['clipPlans']['length']
      : 0x0;
  return {
    title: title,
    subtitle: subtitle,
    task: task,
    batchIndex: batchIndex,
    batchTotal: batchTotal,
    clipCount: clipCount,
    model: String(maskDebugPayloadSecrets2?.['model'] || ''),
    provider: String(maskDebugPayloadSecrets2?.['provider'] || ''),
    structuredOutputName: String(maskDebugPayloadSecrets2?.['structuredOutput']?.['name'] || ''),
    metrics: {
      promptCharacters: countCharacters(source),
      systemPromptCharacters: countCharacters(content),
      requestCharacters: countCharacters(JSON['stringify'](maskDebugPayloadSecrets2)),
    },
    promptSectionCharacters: getPromptSectionCharacters(promptObject2),
    tabs: [
      { id: 'prompt', label: '用户提示词', content: formatPromptForPreview(source) },
      { id: 'system', label: '系统提示词', content: content },
      { id: 'request', label: '完整请求参数', ...buildDebugJsonPreview(maskDebugPayloadSecrets2) },
      {
        id: 'sections',
        label: '区块字符统计',
        content: JSON['stringify'](
          Object['fromEntries'](
            Object['entries'](getPromptSectionCharacters(promptObject2))['sort'](
              (next, current) => current[0x1] - next[0x1],
            ),
          ),
          null,
          0x2,
        ),
      },
    ],
  };
}
export function closeStoryRequestDebugPreview(entry = globalThis['document']) {
  closeDebugRequestWindow(entry);
}
export function openStoryRequestDebugPreview(args = {}) {
  if (args['preparePayload'])
    return openDebugRequestWindow({
      ...args,
      prepare: async () => ({
        tabs: buildStoryRequestDebugPreviewModel(await args['preparePayload'](), args)['tabs'],
      }),
    });
  const tabs = buildStoryRequestDebugPreviewModel(args['payload'], args);
  return openDebugRequestWindow({ ...args, tabs: tabs['tabs'] });
}
