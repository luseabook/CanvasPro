import { buildStoryEpisodeCanvasName } from './storyEpisodeCanvas.js';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';
import {
  getStoryVideoEpisodes,
  isStoryWorkspaceStepNavigationDisabled,
} from './storyWorkspaceNavigationTransaction.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function freezeSnapshot(list) {
  if (Array['isArray'](list)) return Object['freeze'](list['map']((item) => freezeSnapshot(item)));
  if (list && typeof list === 'object')
    return Object['freeze'](
      Object['fromEntries'](Object['entries'](list)['map'](([key, index]) => [key, freezeSnapshot(index)])),
    );
  return list;
}
export function getStoryEpisodeToolbarOptions(list2 = [], result = '') {
  const text = normalizeText(result);
  return getStoryVideoEpisodes(list2)['filter'](
    (data) =>
      normalizeText(data?.['id']) !== text &&
      Array['isArray'](data?.['clips']) &&
      data['clips']['length'] > 0,
  );
}
export function getStoryProjectCanvasEpisodes(list3 = [], options = '') {
  const list4 = getStoryVideoEpisodes(list3),
    text2 = normalizeText(options),
    target = list4['find']((source) => normalizeText(source?.['id']) === text2) || list4[0];
  return target ? [target] : [];
}
function projectEpisodeSwitcher(next, current, isCurrentPage) {
  return {
    currentEpisodeId: normalizeText(current?.['id']),
    currentEpisodeName: buildStoryEpisodeCanvasName(current) || '分集详情',
    isCurrentPage: isCurrentPage,
    options: getStoryEpisodeToolbarOptions(next['data']?.['episodes'], current?.['id'])['map']((id) => ({
      id: id['id'],
      name: buildStoryEpisodeCanvasName(id) || '分集详情',
      clipCount: id['clips']['length'],
    })),
  };
}
export function createStoryWorkspaceChromeProjection({ steps: steps = [] } = {}) {
  function steps2(entry, activeStep = entry['step']) {
    const record = entry['data']?.['project']?.['sourceMode'],
      args =
        record === 'upload-original'
          ? steps['map']((args2) => (args2['id'] === 1 ? { ...args2, label: '原始剧本' } : args2))
          : record === 'video-replication'
            ? steps['map']((args3) => ({
                ...args3,
                label: { 1: '原片分析', 2: '素材设定', 3: '视频列表' }[args3['id']] || args3['label'],
              }))
            : steps;
    return {
      activeStep: activeStep,
      items: (isStoryCollaborationProject(entry['data']) ? [{ id: 0, label: '故事构思' }, ...args] : args)[
        'map'
      ]((id2, number) => ({
        id: id2['id'],
        number: number + 1,
        label: id2['label'],
        active: activeStep === id2['id'],
        disabled:
          (id2['id'] === 0 && entry['developerModeAvailable'] !== !![]) ||
          isStoryWorkspaceStepNavigationDisabled(entry['data'], id2['id']),
      })),
    };
  }
  function run(projectLabel = {}) {
    if (projectLabel['view'] === 'episode') {
      const payload = projectLabel['data']?.['episodes']?.['find'](
        (handle) => handle['id'] === projectLabel['selectedEpisodeId'],
      );
      return {
        kind: 'episode',
        projectLabel: projectLabel['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目',
        steps: steps2(projectLabel, 'episode'),
        episodeSwitcher: projectEpisodeSwitcher(projectLabel, payload, !![]),
        canvasSyncPending: projectLabel['canvasSyncPending'] === !![],
      };
    }
    const list5 = getStoryEpisodeToolbarOptions(projectLabel['data']?.['episodes']),
      episodeSwitcher =
        list5['find'](
          (state) => normalizeText(state?.['id']) === normalizeText(projectLabel['selectedEpisodeId']),
        ) ||
        list5[0] ||
        null;
    return {
      kind: 'project',
      collaborationAvailable:
        projectLabel['developerModeAvailable'] === !![] &&
        projectLabel['workspaceSurface'] !== 'replication' &&
        isStoryCollaborationProject(projectLabel['data']),
      projectLabel: projectLabel['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目',
      steps: steps2(projectLabel),
      episodeSwitcher: episodeSwitcher ? projectEpisodeSwitcher(projectLabel, episodeSwitcher, ![]) : null,
    };
  }
  function run2(
    showPrevious = {},
    {
      nextLabel: nextLabel,
      nextAction: nextAction = '',
      isLast: isLast = ![],
      title: title = '',
      hint: hint = '',
      actionsMarkup: actionsMarkup = '',
      leadingActionsMarkup: leadingActionsMarkup = '',
      useDefaultCopy: useDefaultCopy = !![],
    } = {},
  ) {
    const nextAction2 =
        nextAction ||
        (isLast
          ? 'finish-story-workbench'
          : showPrevious['step'] === 1
            ? 'extract-assets'
            : 'open-episode-stage'),
      config =
        showPrevious['data']?.['project']?.['sourceMode'] === 'video-replication' &&
        showPrevious['splittingEpisodeIds']?.['length'] > 0,
      nextLabel2 = Boolean(showPrevious['storyPlanningOperation'] || config),
      scope = config ? '正在生成分段提示词' : showPrevious['storyPlanningStatus'] || nextLabel || '处理中',
      input =
        title ||
        (nextAction === 'plan-episode-outlines'
          ? '剧本摘要已完成'
          : nextAction === 'extract-assets'
            ? '完整分集剧本已全部完成'
            : showPrevious['step'] === 2
              ? '角色、场景和道具设定已应用'
              : '分集结构已建立'),
      output =
        hint ||
        (nextAction === 'plan-episode-outlines'
          ? '下一步将按已设置集数生成分集大纲'
          : nextAction === 'extract-assets'
            ? '下一步沿用现有素材、分镜和视频流程'
            : isLast
              ? '进入分集后可编辑片段并选择视频模型'
              : '可以继续下一步，也可以返回修改');
    return {
      title: useDefaultCopy ? input : title,
      hint: useDefaultCopy ? output : hint,
      actionsMarkup: actionsMarkup,
      leadingActionsMarkup: leadingActionsMarkup,
      showPrevious:
        showPrevious['step'] >
        (showPrevious['developerModeAvailable'] === !![] && isStoryCollaborationProject(showPrevious['data'])
          ? 0
          : 1),
      nextAction: nextAction2,
      nextLabel: nextLabel2 ? scope : nextLabel || '下一步',
      busy: nextLabel2,
    };
  }
  return Object['freeze']({
    projectFooter: (...args4) => freezeSnapshot(run2(...args4)),
    projectToolbar: (...args5) => freezeSnapshot(run(...args5)),
  });
}
