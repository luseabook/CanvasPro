import { getStoryBackgroundTaskSummary } from './storyBackgroundTasks.js';
import { duplicateStoryProjectEntry } from './storyProjectSession.js';
export const STORY_PROJECT_PACKAGE_PAYLOAD_VERSION = 0x1;
function normalizeText(_0xa4f2e3) {
  return String(_0xa4f2e3 ?? '')['trim']();
}
function cloneForPackage(_0x183c15) {
  return JSON['parse'](
    JSON['stringify'](_0x183c15, (_0x104438, _0x50e9c1) =>
      typeof _0x50e9c1 === 'string' && _0x50e9c1['startsWith']('blob:') ? '' : _0x50e9c1,
    ),
  );
}
export function canCollectStoryProject(_0x5e5204 = {}) {
  return (
    Boolean(_0x5e5204?.['data']?.['project']) &&
    getStoryBackgroundTaskSummary(_0x5e5204['data'])['activeCount'] === 0x0
  );
}
export function createStoryProjectPackagePayload(_0x51eb61 = {}) {
  if (!_0x51eb61?.['data']?.['project']) throw new Error('剧本项目不存在。');
  if (!canCollectStoryProject(_0x51eb61)) throw new Error('项目仍有任务处理中，请完成后再收集。');
  return {
    payloadVersion: STORY_PROJECT_PACKAGE_PAYLOAD_VERSION,
    feature: 'story',
    project: cloneForPackage(_0x51eb61),
  };
}
export function createImportedStoryProjectEntry(
  _0x5d35ee = {},
  { projectId: _0x2974a1, now: now = Date['now']() } = {},
) {
  if (
    Number(_0x5d35ee?.['payloadVersion']) !== STORY_PROJECT_PACKAGE_PAYLOAD_VERSION ||
    _0x5d35ee?.['feature'] !== 'story' ||
    !_0x5d35ee?.['project']?.['data']?.['project']
  )
    throw new Error('无效的剧本项目包内容。');
  const _0x11156e = cloneForPackage(_0x5d35ee['project']),
    _0x24efae = duplicateStoryProjectEntry(_0x11156e, { projectId: _0x2974a1, now: now });
  if (!_0x24efae?.['data']?.['project']) throw new Error('剧本项目内容无法导入。');
  const _0x3a2b8d =
      normalizeText(_0x11156e['data']['project']['title'] || _0x11156e['title']) || '未命名故事',
    _0x2848c1 = _0x3a2b8d + ' - 导入';
  return (
    (_0x24efae['title'] = _0x2848c1),
    (_0x24efae['data']['project']['title'] = _0x2848c1),
    (_0x24efae['createdAt'] = Number(now) || Date['now']()),
    (_0x24efae['updatedAt'] = Number(now) || Date['now']()),
    (_0x24efae['archivedAt'] = 0x0),
    (_0x24efae['projectTitleEdited'] = !![]),
    _0x24efae
  );
}
