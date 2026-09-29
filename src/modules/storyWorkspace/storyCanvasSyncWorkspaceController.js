import { normalizeStoryClipFrames, upsertStoryClipFrame } from './storyClipFrames.js';
function normalizeText(_0x28b150) {
  return String(_0x28b150 ?? '')['trim']();
}
function requireFunctions(_0xab2f16, _0x3f5434) {
  for (const [_0x3f17f9, _0x482761] of Object['entries'](_0x3f5434)) {
    if (typeof _0x482761 !== 'function') throw new TypeError(_0xab2f16 + ' requires ' + _0x3f17f9 + '.');
  }
}
function createCanvasBinding(_0x509ccb = {}) {
  const _0x2ce08b = _0x509ccb['binding'] || _0x509ccb['canvasBinding'] || {};
  return {
    ..._0x2ce08b,
    canvasId: _0x2ce08b['canvasId'] || _0x509ccb['canvasId'],
    nodes: { ...(_0x2ce08b['nodes'] || {}) },
    ...(_0x2ce08b['layout'] ? { layout: { ..._0x2ce08b['layout'] } } : {}),
  };
}
export function createStoryCanvasSyncWorkspaceController({
  state: _0x39e836,
  root: _0x391c56,
  workspaceShell: _0x47a889,
  loadingElement: _0x542195,
  documentObject: documentObject = globalThis['document'],
  operations: operations = {},
  projectTasks: projectTasks = {},
  persistence: persistence = {},
  presentation: presentation = {},
  getSelectedEpisode: _0x4b0335,
  getProjectCanvasEpisodes: _0x412c2b,
  resolveClipGenerationSettings: _0x558f9c,
} = {}) {
  if (!_0x39e836 || typeof _0x39e836 !== 'object')
    throw new TypeError('Story canvas sync requires workspace state.');
  (requireFunctions('Story\x20canvas\x20sync\x20project\x20tasks', {
    createToken: projectTasks['createToken'],
    isCurrent: projectTasks['isCurrent'],
    isLive: projectTasks['isLive'],
    syncEntry: projectTasks['syncEntry'],
  }),
    requireFunctions('Story\x20canvas\x20sync\x20persistence', { schedule: persistence['schedule'] }),
    requireFunctions('Story canvas sync presentation', {
      closeMenu: presentation['closeMenu'],
      handleMediaNodeChanges: presentation['handleMediaNodeChanges'],
      refreshEpisodeRail: presentation['refreshEpisodeRail'],
      refreshToolbar: presentation['refreshToolbar'],
      requestWorkspaceMode: presentation['requestWorkspaceMode'],
      showToast: presentation['showToast'],
    }),
    requireFunctions('Story\x20canvas\x20sync\x20projection', {
      getProjectCanvasEpisodes: _0x412c2b,
      getSelectedEpisode: _0x4b0335,
      resolveClipGenerationSettings: _0x558f9c,
    }));
  const _0x36a526 = new Map();
  let _0x2f9981 = null,
    _0x1442a7 = null,
    _0x488e07 = '';
  function _0x7edf9({
    pending: pending = ![],
    scope: scope = '',
    captureFocus: captureFocus = ![],
    refreshToolbar: refreshToolbar = !![],
  } = {}) {
    const _0x32b1ab = _0x39e836['canvasSyncPending'] === !![];
    pending &&
      captureFocus &&
      !_0x32b1ab &&
      ((_0x1442a7 = documentObject?.['activeElement'] || null),
      (_0x488e07 = _0x1442a7?.['closest']?.('.story-canvas-sync-menu-wrap:not(.story-clip-export-menu-wrap)')
        ? '.story-canvas-sync-menu-wrap:not(.story-clip-export-menu-wrap) [data-story-action="toggle-canvas-sync-menu"]'
        : ''));
    ((_0x39e836['canvasSyncPending'] = pending === !![]),
      (_0x39e836['canvasSyncScope'] = _0x39e836['canvasSyncPending'] ? normalizeText(scope) : ''),
      presentation['closeMenu'](),
      _0x391c56?.['classList']?.['toggle']?.('is-canvas-sync-pending', _0x39e836['canvasSyncPending']),
      _0x391c56?.['setAttribute']?.('aria-busy', _0x39e836['canvasSyncPending'] ? 'true' : 'false'));
    if (_0x47a889) {
      _0x47a889['inert'] = _0x39e836['canvasSyncPending'];
      if (_0x39e836['canvasSyncPending']) _0x47a889['setAttribute']?.('inert', '');
      else _0x47a889['removeAttribute']?.('inert');
    }
    _0x542195 &&
      ((_0x542195['hidden'] = !_0x39e836['canvasSyncPending']),
      _0x542195['setAttribute']?.('aria-hidden', _0x39e836['canvasSyncPending'] ? 'false' : 'true'));
    if (refreshToolbar) presentation['refreshToolbar']();
    if (_0x39e836['canvasSyncPending']) {
      if (captureFocus && !_0x32b1ab)
        try {
          _0x542195?.['focus']?.({ preventScroll: !![] });
        } catch {
          _0x542195?.['focus']?.();
        }
      return;
    }
    const _0x383dc4 = _0x1442a7?.['isConnected']
      ? _0x1442a7
      : _0x488e07
        ? _0x391c56?.['querySelector']?.(_0x488e07)
        : null;
    ((_0x1442a7 = null), (_0x488e07 = ''));
    if (_0x383dc4?.['isConnected'] && !_0x391c56?.['hidden'])
      try {
        _0x383dc4['focus']?.({ preventScroll: !![] });
      } catch {
        _0x383dc4['focus']?.();
      }
  }
  async function _0x23e025(_0x1d3882, _0x25205f) {
    if (
      typeof operations['syncClipFrame'] !== 'function' ||
      !normalizeText(_0x1d3882?.['data']?.['project']?.['canvasBinding']?.['canvasId']) ||
      !_0x25205f
    )
      return ![];
    try {
      const _0x24c515 = await operations['syncClipFrame']({
        project: _0x1d3882['data']['project'],
        frame: _0x25205f,
      });
      if (!_0x24c515?.['synced'] || !projectTasks['isLive'](_0x1d3882)) return ![];
      const _0x335c46 = normalizeStoryClipFrames(_0x1d3882['data']['clipFrames'])['find'](
        (_0x1a0a7d) => _0x1a0a7d['id'] === _0x25205f['id'],
      );
      if (!_0x335c46) return ![];
      return (
        (_0x1d3882['data']['clipFrames'] = upsertStoryClipFrame(_0x1d3882['data']['clipFrames'], {
          ..._0x335c46,
          ..._0x24c515['frame'],
        })),
        projectTasks['syncEntry'](_0x1d3882),
        persistence['schedule']({ immediate: !![] }),
        projectTasks['isCurrent'](_0x1d3882) &&
          _0x39e836['view'] === 'episode' &&
          presentation['refreshEpisodeRail']({ refreshContent: !![] }),
        !![]
      );
    } catch (_0xa8062d) {
      return (
        globalThis['console']?.['warn']?.('[storyWorkspace]\x20片段帧同步到项目画布失败', _0xa8062d),
        projectTasks['isCurrent'](_0x1d3882) &&
          presentation['showToast'](_0xa8062d?.['message'] || '片段帧同步到项目画布失败。', 'warning'),
        ![]
      );
    }
  }
  async function _0x2d3389(_0x21ba9b, { episodeId: episodeId = '' } = {}) {
    const _0x154670 = normalizeText(episodeId),
      _0x9f88b0 = normalizeStoryClipFrames(_0x21ba9b?.['data']?.['clipFrames'])['filter'](
        (_0x57d91f) =>
          !normalizeText(_0x57d91f['canvasNodeId']) &&
          _0x57d91f['captureSavePending'] !== !![] &&
          _0x57d91f['isTransient'] !== !![] &&
          (!_0x154670 || normalizeText(_0x57d91f['episodeId']) === _0x154670),
      );
    for (const _0x3c6745 of _0x9f88b0) {
      if (!projectTasks['isLive'](_0x21ba9b)) return ![];
      if (!(await _0x23e025(_0x21ba9b, _0x3c6745))) return ![];
    }
    return !![];
  }
  function _0x33eb54(_0x6ce720, _0xf3883b, _0x11a965) {
    ((_0x6ce720['data']['project']['canvasBinding'] = createCanvasBinding(_0xf3883b)),
      presentation['handleMediaNodeChanges']({ canvasId: _0xf3883b['canvasId'], nodes: _0x11a965 }),
      projectTasks['syncEntry'](_0x6ce720),
      persistence['schedule']({ immediate: !![] }));
  }
  function _0x5b8b9c(_0x1d7f2c, _0x183c64, _0x330293) {
    const _0x1eedc1 = _0x36a526['get'](_0x1d7f2c['projectId']);
    if (_0x1eedc1?.['promise']) return _0x1eedc1['promise'];
    _0x7edf9({ pending: !![], scope: _0x183c64, captureFocus: !![] });
    const _0x43a925 = Promise['resolve']()['then'](_0x330293);
    return (
      _0x36a526['set'](_0x1d7f2c['projectId'], { scope: _0x183c64, promise: _0x43a925 }),
      (_0x2f9981 = _0x43a925),
      void _0x43a925['finally'](() => {
        (_0x36a526['get'](_0x1d7f2c['projectId'])?.['promise'] === _0x43a925 &&
          _0x36a526['delete'](_0x1d7f2c['projectId']),
          _0x2f9981 === _0x43a925 && ((_0x2f9981 = null), _0x7edf9({ pending: ![] })));
      }),
      _0x43a925
    );
  }
  async function _0x542dd5() {
    const _0x14c046 = projectTasks['createToken'](),
      _0x4e4718 = _0x4b0335(_0x14c046['data']);
    if (!_0x4e4718) return ![];
    const _0x193bf3 = _0x36a526['get'](_0x14c046['projectId']);
    if (_0x193bf3?.['promise']) return _0x193bf3['promise'];
    if (typeof operations['createEpisodeCanvas'] !== 'function')
      return (presentation['showToast']('项目关联画布服务尚未初始化。', 'error'), ![]);
    return _0x5b8b9c(_0x14c046, 'episode', async () => {
      try {
        const _0x4466d4 = await operations['createEpisodeCanvas']({
          project: _0x14c046['data']['project'],
          episode: _0x4e4718,
          modelId: _0x14c046['modelSettings']['models']['video'],
          provider: _0x14c046['modelSettings']['videoProvider'],
          generationParams: _0x14c046['modelSettings']['videoGenerationParams'],
          resolveClipGenerationSettings: (_0x302a2c) => _0x558f9c(_0x302a2c, _0x14c046),
        });
        if (!projectTasks['isLive'](_0x14c046)) return ![];
        _0x33eb54(_0x14c046, _0x4466d4, Array['isArray'](_0x4466d4['nodes']) ? _0x4466d4['nodes'] : []);
        const _0x46c315 = await _0x2d3389(_0x14c046, { episodeId: _0x4e4718['id'] });
        if (!_0x46c315) return ![];
        return (
          projectTasks['syncEntry'](_0x14c046),
          persistence['schedule']({ immediate: !![] }),
          projectTasks['isCurrent'](_0x14c046) &&
            (presentation['requestWorkspaceMode']('canvas'),
            presentation['showToast'](
              _0x4466d4['reused'] ? '已同步本集到项目关联画布。' : '已创建项目关联画布并同步本集。',
              'success',
            )),
          !![]
        );
      } catch (_0x1af98d) {
        return (
          projectTasks['isCurrent'](_0x14c046) &&
            presentation['showToast'](_0x1af98d?.['message'] || '分集加入画布失败。', 'error'),
          ![]
        );
      }
    });
  }
  async function _0x86cf3a() {
    const _0xca05c8 = projectTasks['createToken'](),
      _0x459cd0 = _0x412c2b(_0xca05c8['data']['episodes'], _0x39e836['selectedEpisodeId']),
      _0x5a979d = _0x459cd0[0x0];
    if (!_0x5a979d) return ![];
    const _0xc6809d = _0x36a526['get'](_0xca05c8['projectId']);
    if (_0xc6809d?.['promise']) return _0xc6809d['promise'];
    if (typeof operations['createProjectCanvas'] !== 'function')
      return (presentation['showToast']('项目画布服务尚未初始化。', 'error'), ![]);
    return _0x5b8b9c(_0xca05c8, 'project', async () => {
      try {
        const _0x48a68c = await operations['createProjectCanvas']({
          project: _0xca05c8['data']['project'],
          assets: _0xca05c8['data']['assets'],
          episodes: _0x459cd0,
          imageModelId: _0xca05c8['modelSettings']['models']['image'],
          imageProvider: _0xca05c8['modelSettings']['imageProvider'],
          imageGenerationParams: _0xca05c8['modelSettings']['imageGenerationParams'],
          videoModelId: _0xca05c8['modelSettings']['models']['video'],
          videoProvider: _0xca05c8['modelSettings']['videoProvider'],
          videoGenerationParams: _0xca05c8['modelSettings']['videoGenerationParams'],
        });
        if (!projectTasks['isLive'](_0xca05c8)) return ![];
        _0x33eb54(
          _0xca05c8,
          _0x48a68c,
          Array['isArray'](_0x48a68c['nodes'])
            ? _0x48a68c['nodes']['map']((_0x57c764) => _0x57c764?.['node'])['filter'](Boolean)
            : [],
        );
        const _0x2cbc64 = await _0x2d3389(_0xca05c8, { episodeId: _0x5a979d['id'] });
        if (!_0x2cbc64) return ![];
        return (
          projectTasks['syncEntry'](_0xca05c8),
          persistence['schedule']({ immediate: !![] }),
          projectTasks['isCurrent'](_0xca05c8) &&
            (presentation['requestWorkspaceMode']('canvas'),
            presentation['showToast'](
              _0x48a68c['reused']
                ? '项目画布已同步：更新 ' +
                    (_0x48a68c['updatedCount'] || 0x0) +
                    '\x20项，新增\x20' +
                    (_0x48a68c['createdCount'] || 0x0) +
                    ' 项。'
                : '已创建项目画布，加入 ' + (_0x48a68c['createdCount'] || 0x0) + ' 项内容。',
              'success',
            )),
          !![]
        );
      } catch (_0x28bb00) {
        return (
          projectTasks['isCurrent'](_0xca05c8) &&
            presentation['showToast'](_0x28bb00?.['message'] || '项目同步到画布失败。', 'error'),
          ![]
        );
      }
    });
  }
  function _0x3dd752() {
    ((_0x2f9981 = null), _0x36a526['clear'](), _0x7edf9({ pending: ![], refreshToolbar: ![] }));
  }
  return Object['freeze']({
    addProject: _0x86cf3a,
    addSelectedEpisode: _0x542dd5,
    destroy: _0x3dd752,
    syncFrame: _0x23e025,
  });
}
