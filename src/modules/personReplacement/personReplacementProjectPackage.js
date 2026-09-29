import {
  getPersonReplacementProjectTaskSummary,
  normalizeReplacementStudioApplicationProject,
  settleInterruptedReplacementStudioProjectTasks,
} from './personReplacementProjectSession.js';
export const PERSON_REPLACEMENT_PROJECT_PACKAGE_PAYLOAD_VERSION = 0x1;
const TRANSIENT_TASK_ID_FIELDS = new Set(['requestId', 'taskId', 'remoteTaskId']);
function normalizeText(_0x3c6c34) {
  return String(_0x3c6c34 ?? '')['trim']();
}
function cloneForPackage(_0x27ac89, { stripTaskIds: stripTaskIds = ![] } = {}) {
  return JSON['parse'](
    JSON['stringify'](_0x27ac89, (_0x400041, _0x364e71) => {
      if (typeof _0x364e71 === 'string' && _0x364e71['startsWith']('blob:')) return '';
      if (stripTaskIds && TRANSIENT_TASK_ID_FIELDS['has'](_0x400041)) return '';
      return _0x364e71;
    }),
  );
}
export function canCollectPersonReplacementProject(_0x7c063b = {}) {
  return (
    Boolean(normalizeText(_0x7c063b?.['id'])) &&
    getPersonReplacementProjectTaskSummary(_0x7c063b)['activeCount'] === 0x0
  );
}
export function createPersonReplacementProjectPackagePayload(_0x3f8bed = {}) {
  if (!normalizeText(_0x3f8bed?.['id'])) throw new Error('人物替换项目不存在。');
  if (!canCollectPersonReplacementProject(_0x3f8bed)) throw new Error('项目仍有任务处理中，请完成后再收集。');
  return {
    payloadVersion: PERSON_REPLACEMENT_PROJECT_PACKAGE_PAYLOAD_VERSION,
    feature: 'person-replacement',
    project: cloneForPackage(normalizeReplacementStudioApplicationProject(_0x3f8bed, _0x3f8bed), {
      stripTaskIds: !![],
    }),
  };
}
export function createImportedPersonReplacementProject(
  _0x26136d = {},
  { projectId: _0x2deeab, now: now = new Date()['toISOString']() } = {},
) {
  if (
    Number(_0x26136d?.['payloadVersion']) !== PERSON_REPLACEMENT_PROJECT_PACKAGE_PAYLOAD_VERSION ||
    _0x26136d?.['feature'] !== 'person-replacement' ||
    !_0x26136d?.['project']
  )
    throw new Error('无效的人物替换项目包内容。');
  const _0x370147 = normalizeReplacementStudioApplicationProject(
      cloneForPackage(_0x26136d['project'], { stripTaskIds: !![] }),
      {},
    ),
    _0x2fe845 = normalizeText(_0x2deeab);
  if (!_0x2fe845) throw new Error('导入项目缺少新的项目标识。');
  const _0x10e863 = normalizeText(_0x370147['title']) || '未命名人物替换项目',
    _0x51a51 = normalizeReplacementStudioApplicationProject(
      {
        ..._0x370147,
        id: _0x2fe845,
        title: _0x10e863 + '\x20-\x20导入',
        archivedAt: 0x0,
        createdAt: now,
        updatedAt: now,
        output: { ...(_0x370147['output'] || {}), canvasBinding: {} },
        workspace: {
          ...(_0x370147['workspace'] || {}),
          view: 'home',
          openProjectMenuId: '',
          pendingDeleteProjectId: '',
        },
      },
      {},
    ),
    _0x32e59c = settleInterruptedReplacementStudioProjectTasks(_0x51a51, {
      preserveRecoverableTasks: ![],
      message: '导入项目不会继续原项目中的任务，请重试。',
    })['project'];
  return cloneForPackage(_0x32e59c, { stripTaskIds: !![] });
}
