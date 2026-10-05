import { getStoryBackgroundTaskSummary } from './storyBackgroundTasks.js';
import { duplicateStoryProjectEntry } from './storyProjectSession.js';
export const STORY_PROJECT_PACKAGE_PAYLOAD_VERSION = 1;
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneForPackage(item) {
  return JSON['parse'](
    JSON['stringify'](item, (key, index) =>
      typeof index === 'string' && index['startsWith']('blob:') ? '' : index,
    ),
  );
}
export function canCollectStoryProject(options = {}) {
  return (
    Boolean(options?.['data']?.['project']) &&
    getStoryBackgroundTaskSummary(options['data'])['activeCount'] === 0
  );
}
export function createStoryProjectPackagePayload(enabled = {}) {
  if (!enabled?.['data']?.['project']) throw new Error('剧本项目不存在。');
  if (!canCollectStoryProject(enabled)) throw new Error('项目仍有任务处理中，请完成后再收集。');
  return {
    payloadVersion: STORY_PROJECT_PACKAGE_PAYLOAD_VERSION,
    feature: 'story',
    project: cloneForPackage(enabled),
  };
}
export function createImportedStoryProjectEntry(
  enabled2 = {},
  { projectId: projectId, now: now = Date['now']() } = {},
) {
  if (
    Number(enabled2?.['payloadVersion']) !== STORY_PROJECT_PACKAGE_PAYLOAD_VERSION ||
    enabled2?.['feature'] !== 'story' ||
    !enabled2?.['project']?.['data']?.['project']
  )
    throw new Error('无效的剧本项目包内容。');
  const cloneForPackage2 = cloneForPackage(enabled2['project']),
    duplicateStoryProjectEntry2 = duplicateStoryProjectEntry(cloneForPackage2, {
      projectId: projectId,
      now: now,
    });
  if (!duplicateStoryProjectEntry2?.['data']?.['project']) throw new Error('剧本项目内容无法导入。');
  const text =
      normalizeText(cloneForPackage2['data']['project']['title'] || cloneForPackage2['title']) ||
      '未命名故事',
    result = text + ' - 导入';
  return (
    (duplicateStoryProjectEntry2['title'] = result),
    (duplicateStoryProjectEntry2['data']['project']['title'] = result),
    (duplicateStoryProjectEntry2['createdAt'] = Number(now) || Date['now']()),
    (duplicateStoryProjectEntry2['updatedAt'] = Number(now) || Date['now']()),
    (duplicateStoryProjectEntry2['archivedAt'] = 0),
    (duplicateStoryProjectEntry2['projectTitleEdited'] = true),
    duplicateStoryProjectEntry2
  );
}
