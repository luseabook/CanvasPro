function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export const STORY_HOME_REWRITE_SOURCE_HINT = '参考剧本会原样保留；AI 将按要求生成新的故事蓝图与世界观。';
export function hasStoryHomeReferenceScript(options = {}) {
  return Boolean(normalizeText(options['scriptFileName']) && normalizeText(options['scriptText']));
}
export function canStartStoryHomeGeneration(options2 = {}) {
  if (options2['homeTab'] === 'collaborate') return false;
  if (options2['homeTab'] === 'replication') return Boolean(options2['replicationSourceFiles']?.['length']);
  if (options2['isParsingDocument']) return false;
  if (options2['homeTab'] === 'upload') return Boolean(normalizeText(options2['scriptFileName']));
  const enabled = Boolean(normalizeText(options2['scriptFileName']));
  return Boolean(normalizeText(options2['idea'])) && (!enabled || hasStoryHomeReferenceScript(options2));
}
export function resolveStoryHomeGenerationMode(options3 = {}) {
  return options3['homeTab'] === 'generate' && hasStoryHomeReferenceScript(options3)
    ? 'rewrite'
    : options3['homeTab'];
}
export function clearStoryHomeReferenceScript(options4 = {}) {
  ((options4['scriptFileName'] = ''),
    (options4['scriptText'] = ''),
    (options4['scriptCharacterCount'] = null));
  if (options4['hasCreatedProject'] !== true && options4['data']?.['project'])
    options4['data']['project']['sourceDocument'] = null;
}
// Attaching a file on the 快速创作 tab already runs the rewrite pipeline, so uploading a
// novel only needs to land the text there with a usable instruction pre-filled. Without this
// the user had to write the adaptation prompt themselves.
export function buildNovelAdaptationInstruction({
  episodeCount: episodeCount,
  sceneMaxSeconds: sceneMaxSeconds,
} = {}) {
  const count = Number(episodeCount),
    count2 = Number(sceneMaxSeconds),
    item = Number['isFinite'](count) && count > 0 ? '改编为 ' + Math['trunc'](count) + ' 集' : '改编为分集',
    key =
      Number['isFinite'](count2) && count2 > 0 ? '，单个场景不超过 ' + Math['trunc'](count2) + ' 秒' : '';
  return (
    '把这部小说' +
    item +
    '竖屏短剧剧本' +
    key +
    '。保留主线与关键人物，按场景拆分，每场标注地点、出场人物和时长；删除与主线无关的支线，补齐可直接拍摄的对白。'
  );
}
export function getStoryHomeSummaryTaskCopy(index = 'generate') {
  if (index === 'rewrite')
    return {
      label: '改写剧本蓝图',
      message: '正在根据参考剧本和改写要求生成故事蓝图',
      status: '正在根据参考剧本和改写要求生成故事蓝图...',
    };
  return {
    label: '生成剧本摘要',
    message: '正在根据原始创意生成剧本摘要',
    status: '正在根据原始创意生成剧本摘要...',
  };
}
function getStoryHomeDocumentDropZone(el) {
  return el?.['closest']?.('[data-story-rewrite-drop], [data-story-script-drop]') || null;
}
export function handleStoryHomeDocumentDragOver(event) {
  const el2 = getStoryHomeDocumentDropZone(event?.['target']);
  if (!el2) return false;
  (event['preventDefault']?.(), event['stopPropagation']?.());
  if (event['dataTransfer']) event['dataTransfer']['dropEffect'] = 'copy';
  return (el2['classList']?.['add']?.('is-dragover'), true);
}
export function handleStoryHomeDocumentDragLeave(event2) {
  const el3 = getStoryHomeDocumentDropZone(event2?.['target']);
  if (!el3 || el3['contains']?.(event2['relatedTarget'])) return false;
  return (el3['classList']?.['remove']?.('is-dragover'), true);
}
export async function handleStoryHomeDocumentDrop(event3, handler) {
  const el4 = getStoryHomeDocumentDropZone(event3?.['target']);
  if (!el4) return false;
  (event3['preventDefault']?.(),
    event3['stopPropagation']?.(),
    el4['classList']?.['remove']?.('is-dragover'));
  const result = event3['dataTransfer']?.['files']?.[0];
  if (result && typeof handler === 'function') await handler(result);
  return true;
}
