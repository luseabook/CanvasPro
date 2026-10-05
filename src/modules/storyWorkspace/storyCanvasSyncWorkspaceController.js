import { normalizeStoryClipFrames, upsertStoryClipFrame } from './storyClipFrames.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function requireFunctions(item, key) {
  for (const [index, result] of Object['entries'](key)) {
    if (typeof result !== 'function') throw new TypeError(item + ' requires ' + index + '.');
  }
}
function createCanvasBinding(options = {}) {
  const canvasId = options['binding'] || options['canvasBinding'] || {};
  return {
    ...canvasId,
    canvasId: canvasId['canvasId'] || options['canvasId'],
    nodes: { ...(canvasId['nodes'] || {}) },
    ...(canvasId['layout'] ? { layout: { ...canvasId['layout'] } } : {}),
  };
}
export function createStoryCanvasSyncWorkspaceController({
  state: state,
  root: root,
  workspaceShell: workspaceShell,
  loadingElement: loadingElement,
  documentObject: documentObject = globalThis['document'],
  operations: operations = {},
  projectTasks: projectTasks = {},
  persistence: persistence = {},
  presentation: presentation = {},
  getSelectedEpisode: getSelectedEpisode,
  getProjectCanvasEpisodes: getProjectCanvasEpisodes,
  resolveClipGenerationSettings: resolveClipGenerationSettings,
} = {}) {
  if (!state || typeof state !== 'object') throw new TypeError('Story canvas sync requires workspace state.');
  (requireFunctions('Story canvas sync project tasks', {
    createToken: projectTasks['createToken'],
    isCurrent: projectTasks['isCurrent'],
    isLive: projectTasks['isLive'],
    syncEntry: projectTasks['syncEntry'],
  }),
    requireFunctions('Story canvas sync persistence', { schedule: persistence['schedule'] }),
    requireFunctions('Story canvas sync presentation', {
      closeMenu: presentation['closeMenu'],
      handleMediaNodeChanges: presentation['handleMediaNodeChanges'],
      refreshEpisodeRail: presentation['refreshEpisodeRail'],
      refreshToolbar: presentation['refreshToolbar'],
      requestWorkspaceMode: presentation['requestWorkspaceMode'],
      showToast: presentation['showToast'],
    }),
    requireFunctions('Story canvas sync projection', {
      getProjectCanvasEpisodes: getProjectCanvasEpisodes,
      getSelectedEpisode: getSelectedEpisode,
      resolveClipGenerationSettings: resolveClipGenerationSettings,
    }));
  const map = new Map();
  let value2 = null,
    el = null,
    data = '';
  function run({
    pending: pending = false,
    scope: scope = '',
    captureFocus: captureFocus = false,
    refreshToolbar: refreshToolbar = true,
  } = {}) {
    const enabled = state['canvasSyncPending'] === true;
    pending &&
      captureFocus &&
      !enabled &&
      ((el = documentObject?.['activeElement'] || null),
      (data = el?.['closest']?.('.story-canvas-sync-menu-wrap:not(.story-clip-export-menu-wrap)')
        ? '.story-canvas-sync-menu-wrap:not(.story-clip-export-menu-wrap) [data-story-action="toggle-canvas-sync-menu"]'
        : ''));
    ((state['canvasSyncPending'] = pending === true),
      (state['canvasSyncScope'] = state['canvasSyncPending'] ? normalizeText(scope) : ''),
      presentation['closeMenu'](),
      root?.['classList']?.['toggle']?.('is-canvas-sync-pending', state['canvasSyncPending']),
      root?.['setAttribute']?.('aria-busy', state['canvasSyncPending'] ? 'true' : 'false'));
    if (workspaceShell) {
      workspaceShell['inert'] = state['canvasSyncPending'];
      if (state['canvasSyncPending']) workspaceShell['setAttribute']?.('inert', '');
      else workspaceShell['removeAttribute']?.('inert');
    }
    loadingElement &&
      ((loadingElement['hidden'] = !state['canvasSyncPending']),
      loadingElement['setAttribute']?.('aria-hidden', state['canvasSyncPending'] ? 'false' : 'true'));
    if (refreshToolbar) presentation['refreshToolbar']();
    if (state['canvasSyncPending']) {
      if (captureFocus && !enabled)
        try {
          loadingElement?.['focus']?.({ preventScroll: true });
        } catch {
          loadingElement?.['focus']?.();
        }
      return;
    }
    const el2 = el?.['isConnected'] ? el : data ? root?.['querySelector']?.(data) : null;
    ((el = null), (data = ''));
    if (el2?.['isConnected'] && !root?.['hidden'])
      try {
        el2['focus']?.({ preventScroll: true });
      } catch {
        el2['focus']?.();
      }
  }
  async function syncFrame(project, frame) {
    if (
      typeof operations['syncClipFrame'] !== 'function' ||
      !normalizeText(project?.['data']?.['project']?.['canvasBinding']?.['canvasId']) ||
      !frame
    )
      return false;
    try {
      const args = await operations['syncClipFrame']({
        project: project['data']['project'],
        frame: frame,
      });
      if (!args?.['synced'] || !projectTasks['isLive'](project)) return false;
      const args2 = normalizeStoryClipFrames(project['data']['clipFrames'])['find'](
        (target) => target['id'] === frame['id'],
      );
      if (!args2) return false;
      return (
        (project['data']['clipFrames'] = upsertStoryClipFrame(project['data']['clipFrames'], {
          ...args2,
          ...args['frame'],
        })),
        projectTasks['syncEntry'](project),
        persistence['schedule']({ immediate: true }),
        projectTasks['isCurrent'](project) &&
          state['view'] === 'episode' &&
          presentation['refreshEpisodeRail']({ refreshContent: true }),
        true
      );
    } catch (error) {
      return (
        globalThis['console']?.['warn']?.('[storyWorkspace] 片段帧同步到项目画布失败', error),
        projectTasks['isCurrent'](project) &&
          presentation['showToast'](error?.['message'] || '片段帧同步到项目画布失败。', 'warning'),
        false
      );
    }
  }
  async function run2(source, { episodeId: episodeId = '' } = {}) {
    const text = normalizeText(episodeId),
      storyClipFrames = normalizeStoryClipFrames(source?.['data']?.['clipFrames'])['filter'](
        (next) =>
          !normalizeText(next['canvasNodeId']) &&
          next['captureSavePending'] !== true &&
          next['isTransient'] !== true &&
          (!text || normalizeText(next['episodeId']) === text),
      );
    for (const current of storyClipFrames) {
      if (!projectTasks['isLive'](source)) return false;
      if (!(await syncFrame(source, current))) return false;
    }
    return true;
  }
  function run3(entry, canvasId2, nodes) {
    ((entry['data']['project']['canvasBinding'] = createCanvasBinding(canvasId2)),
      presentation['handleMediaNodeChanges']({ canvasId: canvasId2['canvasId'], nodes: nodes }),
      projectTasks['syncEntry'](entry),
      persistence['schedule']({ immediate: true }));
  }
  function run4(record, scope2, payload) {
    const handle = map['get'](record['projectId']);
    if (handle?.['promise']) return handle['promise'];
    run({ pending: true, scope: scope2, captureFocus: true });
    const promise = Promise['resolve']()['then'](payload);
    return (
      map['set'](record['projectId'], { scope: scope2, promise: promise }),
      (value2 = promise),
      void promise['finally'](() => {
        (map['get'](record['projectId'])?.['promise'] === promise && map['delete'](record['projectId']),
          value2 === promise && ((value2 = null), run({ pending: false })));
      }),
      promise
    );
  }
  async function addSelectedEpisode() {
    const project2 = projectTasks['createToken'](),
      episode = getSelectedEpisode(project2['data']);
    if (!episode) return false;
    const config = map['get'](project2['projectId']);
    if (config?.['promise']) return config['promise'];
    if (typeof operations['createEpisodeCanvas'] !== 'function')
      return (presentation['showToast']('项目关联画布服务尚未初始化。', 'error'), false);
    return run4(project2, 'episode', async () => {
      try {
        const state2 = await operations['createEpisodeCanvas']({
          project: project2['data']['project'],
          episode: episode,
          modelId: project2['modelSettings']['models']['video'],
          provider: project2['modelSettings']['videoProvider'],
          generationParams: project2['modelSettings']['videoGenerationParams'],
          resolveClipGenerationSettings: (input) => resolveClipGenerationSettings(input, project2),
        });
        if (!projectTasks['isLive'](project2)) return false;
        run3(project2, state2, Array['isArray'](state2['nodes']) ? state2['nodes'] : []);
        const enabled2 = await run2(project2, { episodeId: episode['id'] });
        if (!enabled2) return false;
        return (
          projectTasks['syncEntry'](project2),
          persistence['schedule']({ immediate: true }),
          projectTasks['isCurrent'](project2) &&
            (presentation['requestWorkspaceMode']('canvas'),
            presentation['showToast'](
              state2['reused'] ? '已同步本集到项目关联画布。' : '已创建项目关联画布并同步本集。',
              'success',
            )),
          true
        );
      } catch (error2) {
        return (
          projectTasks['isCurrent'](project2) &&
            presentation['showToast'](error2?.['message'] || '分集加入画布失败。', 'error'),
          false
        );
      }
    });
  }
  async function addProject() {
    const project3 = projectTasks['createToken'](),
      episodes = getProjectCanvasEpisodes(project3['data']['episodes'], state['selectedEpisodeId']),
      episodeId2 = episodes[0];
    if (!episodeId2) return false;
    const output = map['get'](project3['projectId']);
    if (output?.['promise']) return output['promise'];
    if (typeof operations['createProjectCanvas'] !== 'function')
      return (presentation['showToast']('项目画布服务尚未初始化。', 'error'), false);
    return run4(project3, 'project', async () => {
      try {
        const state3 = await operations['createProjectCanvas']({
          project: project3['data']['project'],
          assets: project3['data']['assets'],
          episodes: episodes,
          imageModelId: project3['modelSettings']['models']['image'],
          imageProvider: project3['modelSettings']['imageProvider'],
          imageGenerationParams: project3['modelSettings']['imageGenerationParams'],
          videoModelId: project3['modelSettings']['models']['video'],
          videoProvider: project3['modelSettings']['videoProvider'],
          videoGenerationParams: project3['modelSettings']['videoGenerationParams'],
        });
        if (!projectTasks['isLive'](project3)) return false;
        run3(
          project3,
          state3,
          Array['isArray'](state3['nodes'])
            ? state3['nodes']['map']((value3) => value3?.['node'])['filter'](Boolean)
            : [],
        );
        const enabled3 = await run2(project3, { episodeId: episodeId2['id'] });
        if (!enabled3) return false;
        return (
          projectTasks['syncEntry'](project3),
          persistence['schedule']({ immediate: true }),
          projectTasks['isCurrent'](project3) &&
            (presentation['requestWorkspaceMode']('canvas'),
            presentation['showToast'](
              state3['reused']
                ? '项目画布已同步：更新 ' +
                    (state3['updatedCount'] || 0) +
                    ' 项，新增 ' +
                    (state3['createdCount'] || 0) +
                    ' 项。'
                : '已创建项目画布，加入 ' + (state3['createdCount'] || 0) + ' 项内容。',
              'success',
            )),
          true
        );
      } catch (error3) {
        return (
          projectTasks['isCurrent'](project3) &&
            presentation['showToast'](error3?.['message'] || '项目同步到画布失败。', 'error'),
          false
        );
      }
    });
  }
  function destroy() {
    ((value2 = null), map['clear'](), run({ pending: false, refreshToolbar: false }));
  }
  return Object['freeze']({
    addProject: addProject,
    addSelectedEpisode: addSelectedEpisode,
    destroy: destroy,
    syncFrame: syncFrame,
  });
}
