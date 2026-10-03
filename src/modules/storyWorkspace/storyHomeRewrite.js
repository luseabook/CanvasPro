function normalizeText(_0x268933) {
  return String(_0x268933 ?? '')['trim']();
}
export const STORY_HOME_REWRITE_SOURCE_HINT = '参考剧本会原样保留；AI 将按要求生成新的故事蓝图与世界观。';
export function hasStoryHomeReferenceScript(_0x3f3682 = {}) {
  return Boolean(normalizeText(_0x3f3682['scriptFileName']) && normalizeText(_0x3f3682['scriptText']));
}
export function canStartStoryHomeGeneration(_0x22fca5 = {}) {
  if (_0x22fca5['homeTab'] === 'collaborate') return ![];
  if (_0x22fca5['homeTab'] === 'replication') return Boolean(_0x22fca5['replicationSourceFiles']?.['length']);
  if (_0x22fca5['isParsingDocument']) return ![];
  if (_0x22fca5['homeTab'] === 'upload') return Boolean(normalizeText(_0x22fca5['scriptFileName']));
  const _0x42ed00 = Boolean(normalizeText(_0x22fca5['scriptFileName']));
  return Boolean(normalizeText(_0x22fca5['idea'])) && (!_0x42ed00 || hasStoryHomeReferenceScript(_0x22fca5));
}
export function resolveStoryHomeGenerationMode(_0x74b8e2 = {}) {
  return _0x74b8e2['homeTab'] === 'generate' && hasStoryHomeReferenceScript(_0x74b8e2)
    ? 'rewrite'
    : _0x74b8e2['homeTab'];
}
export function clearStoryHomeReferenceScript(_0x30e2da = {}) {
  ((_0x30e2da['scriptFileName'] = ''),
    (_0x30e2da['scriptText'] = ''),
    (_0x30e2da['scriptCharacterCount'] = null));
  if (_0x30e2da['hasCreatedProject'] !== !![] && _0x30e2da['data']?.['project'])
    _0x30e2da['data']['project']['sourceDocument'] = null;
}
// Attaching a file on the 快速创作 tab already runs the rewrite pipeline, so uploading a
// novel only needs to land the text there with a usable instruction pre-filled. Without this
// the user had to write the adaptation prompt themselves.
export function buildNovelAdaptationInstruction({ episodeCount: episodeCount, sceneMaxSeconds: sceneMaxSeconds } = {}) {
  const _0x3ad1e8 = Number(episodeCount),
    _0x4f3c25 = Number(sceneMaxSeconds),
    _0x2c8e91 =
      Number['isFinite'](_0x3ad1e8) && _0x3ad1e8 > 0x0
        ? '改编为 ' + Math['trunc'](_0x3ad1e8) + ' 集'
        : '改编为分集',
    _0x5540b1 =
      Number['isFinite'](_0x4f3c25) && _0x4f3c25 > 0x0
        ? '，单个场景不超过 ' + Math['trunc'](_0x4f3c25) + ' 秒'
        : '';
  return (
    '把这部小说' +
    _0x2c8e91 +
    '竖屏短剧剧本' +
    _0x5540b1 +
    '。保留主线与关键人物，按场景拆分，每场标注地点、出场人物和时长；删除与主线无关的支线，补齐可直接拍摄的对白。'
  );
}
export function getStoryHomeSummaryTaskCopy(_0x5af706 = 'generate') {
  if (_0x5af706 === 'rewrite')
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
function getStoryHomeDocumentDropZone(_0x4d5c84) {
  return _0x4d5c84?.['closest']?.('[data-story-rewrite-drop],\x20[data-story-script-drop]') || null;
}
export function handleStoryHomeDocumentDragOver(_0x5d6674) {
  const _0x2652b7 = getStoryHomeDocumentDropZone(_0x5d6674?.['target']);
  if (!_0x2652b7) return ![];
  (_0x5d6674['preventDefault']?.(), _0x5d6674['stopPropagation']?.());
  if (_0x5d6674['dataTransfer']) _0x5d6674['dataTransfer']['dropEffect'] = 'copy';
  return (_0x2652b7['classList']?.['add']?.('is-dragover'), !![]);
}
export function handleStoryHomeDocumentDragLeave(_0x53675e) {
  const _0x3daa4c = getStoryHomeDocumentDropZone(_0x53675e?.['target']);
  if (!_0x3daa4c || _0x3daa4c['contains']?.(_0x53675e['relatedTarget'])) return ![];
  return (_0x3daa4c['classList']?.['remove']?.('is-dragover'), !![]);
}
export async function handleStoryHomeDocumentDrop(_0x244fc1, _0x71c0e8) {
  const _0xb8df32 = getStoryHomeDocumentDropZone(_0x244fc1?.['target']);
  if (!_0xb8df32) return ![];
  (_0x244fc1['preventDefault']?.(),
    _0x244fc1['stopPropagation']?.(),
    _0xb8df32['classList']?.['remove']?.('is-dragover'));
  const _0x50be26 = _0x244fc1['dataTransfer']?.['files']?.[0x0];
  if (_0x50be26 && typeof _0x71c0e8 === 'function') await _0x71c0e8(_0x50be26);
  return !![];
}
