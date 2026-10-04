import {
  getPersonReplacementProjectTaskSummary,
  normalizeReplacementStudioApplicationProject,
  settleInterruptedReplacementStudioProjectTasks,
} from './personReplacementProjectSession.js';
export const PERSON_REPLACEMENT_PROJECT_PACKAGE_PAYLOAD_VERSION = 0x1;
const TRANSIENT_TASK_ID_FIELDS = new Set(['requestId', 'taskId', 'remoteTaskId']);
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneForPackage(item, { stripTaskIds: stripTaskIds = ![] } = {}) {
  return JSON['parse'](
    JSON['stringify'](item, (key, index) => {
      if (typeof index === 'string' && index['startsWith']('blob:')) return '';
      if (stripTaskIds && TRANSIENT_TASK_ID_FIELDS['has'](key)) return '';
      return index;
    }),
  );
}
export function canCollectPersonReplacementProject(options = {}) {
  return (
    Boolean(normalizeText(options?.['id'])) &&
    getPersonReplacementProjectTaskSummary(options)['activeCount'] === 0x0
  );
}
export function createPersonReplacementProjectPackagePayload(options2 = {}) {
  if (!normalizeText(options2?.['id'])) throw new Error('人物替换项目不存在。');
  if (!canCollectPersonReplacementProject(options2)) throw new Error('项目仍有任务处理中，请完成后再收集。');
  return {
    payloadVersion: PERSON_REPLACEMENT_PROJECT_PACKAGE_PAYLOAD_VERSION,
    feature: 'person-replacement',
    project: cloneForPackage(normalizeReplacementStudioApplicationProject(options2, options2), {
      stripTaskIds: !![],
    }),
  };
}
export function createImportedPersonReplacementProject(
  enabled = {},
  { projectId: projectId, now: now = new Date()['toISOString']() } = {},
) {
  if (
    Number(enabled?.['payloadVersion']) !== PERSON_REPLACEMENT_PROJECT_PACKAGE_PAYLOAD_VERSION ||
    enabled?.['feature'] !== 'person-replacement' ||
    !enabled?.['project']
  )
    throw new Error('无效的人物替换项目包内容。');
  const args = normalizeReplacementStudioApplicationProject(
      cloneForPackage(enabled['project'], { stripTaskIds: !![] }),
      {},
    ),
    id = normalizeText(projectId);
  if (!id) throw new Error('导入项目缺少新的项目标识。');
  const title = normalizeText(args['title']) || '未命名人物替换项目',
    replacementStudioApplicationProject = normalizeReplacementStudioApplicationProject(
      {
        ...args,
        id: id,
        title: title + '\x20-\x20导入',
        archivedAt: 0x0,
        createdAt: now,
        updatedAt: now,
        output: { ...(args['output'] || {}), canvasBinding: {} },
        workspace: {
          ...(args['workspace'] || {}),
          view: 'home',
          openProjectMenuId: '',
          pendingDeleteProjectId: '',
        },
      },
      {},
    ),
    settleInterruptedReplacementStudioProjectTasks2 = settleInterruptedReplacementStudioProjectTasks(
      replacementStudioApplicationProject,
      {
        preserveRecoverableTasks: ![],
        message: '导入项目不会继续原项目中的任务，请重试。',
      },
    )['project'];
  return cloneForPackage(settleInterruptedReplacementStudioProjectTasks2, { stripTaskIds: !![] });
}
