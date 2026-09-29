import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import {
  createStoryClipGenerationController,
  getRecoverableStoryClipVideoTask,
} from './storyClipGeneration.js';
import { deriveStoryEpisodeStatus } from './storyPlanningData.js';
import { resolveModelExecution } from '../../manifests/index.js';
function normalizeText(_0x51a7fe) {
  return String(_0x51a7fe ?? '')['trim']();
}
export function createStoryClipVideoTaskWorkspaceController({
  state: _0xbf1570,
  activeControllers: _0x472ea8,
  createProjectToken: _0x5e587f,
  createProjectTokenForData: _0x341d22,
  isProjectTaskLive: _0x2c6e3f,
  isProjectTaskCurrent: _0x4c5de2,
  registerProjectData: _0x3adca8,
  startBackgroundTask: _0x1475c4,
  updateBackgroundTask: _0x5f0f9b,
  finishBackgroundTask: _0x4ca3bb,
  syncProjectEntry: _0x5de417,
  restoreProjectTaskState: _0x2e6b68,
  schedulePersistence: _0x4973a4,
  refreshEpisodeCard: _0xa55d13,
  refreshClipGeneration: _0x26bba7,
  render: _0x4a1b03,
  showTaskResultToast: _0x4bcc40,
  showNavigableTaskResultToast: _0x228c6f,
  getWorkspaceDestroyed: getWorkspaceDestroyed = () => ![],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    !_0xbf1570 ||
    !(_0x472ea8 instanceof Map) ||
    typeof _0x5e587f !== 'function' ||
    typeof _0x341d22 !== 'function' ||
    typeof _0x2c6e3f !== 'function' ||
    typeof _0x4c5de2 !== 'function' ||
    typeof _0x3adca8 !== 'function' ||
    typeof _0x1475c4 !== 'function' ||
    typeof _0x5f0f9b !== 'function' ||
    typeof _0x4ca3bb !== 'function' ||
    typeof _0x5de417 !== 'function' ||
    typeof _0x2e6b68 !== 'function' ||
    typeof _0x4973a4 !== 'function' ||
    typeof _0xa55d13 !== 'function' ||
    typeof _0x26bba7 !== 'function' ||
    typeof _0x4a1b03 !== 'function'
  )
    throw new TypeError('Story clip video tasks require project, persistence, and presentation adapters.');
  const _0xb096bc = () => getWorkspaceDestroyed() === !![],
    _0x2c80c3 = (_0x14196f, _0x48a44a, _0x184a5b, _0x38ee32 = _0xbf1570['data']) => {
      const _0x2cb2e2 = _0x38ee32?.['episodes']?.['find']((_0x5e719d) => _0x5e719d['id'] === _0x14196f),
        _0x423994 = _0x2cb2e2?.['clips']?.['findIndex']((_0xcafce6) => _0xcafce6['id'] === _0x48a44a) ?? -0x1;
      if (!_0x2cb2e2 || _0x423994 < 0x0 || !_0x184a5b) return ![];
      return (
        (_0x2cb2e2['clips'][_0x423994] = _0x184a5b),
        (_0x2cb2e2['status'] = deriveStoryEpisodeStatus(_0x2cb2e2['clips'])),
        !![]
      );
    },
    _0x41b8cb = (_0x476d39, _0x574912, _0x1f4ee5) =>
      [_0x476d39, _0x574912, _0x1f4ee5]['map'](normalizeText)['join'](':'),
    _0x55d8da = (_0x375dd6, _0x2a925f, _0x55c075, _0x381e52, { batch: batch = null } = {}) => {
      const _0x978db0 =
          _0x381e52?.['generation'] && typeof _0x381e52['generation'] === 'object'
            ? _0x381e52['generation']
            : {},
        _0x5f5644 = normalizeText(_0x978db0['status'])['toLowerCase']();
      if (!_0x5f5644 || _0x5f5644 === 'idle') return null;
      const _0x346a32 = buildStoryBackgroundTaskId('clip-video', { episodeId: _0x2a925f, clipId: _0x55c075 }),
        _0x4e9fd9 = {
          type: 'clip-video',
          scope: { episodeId: _0x2a925f, clipId: _0x55c075 },
          label: '生成片段视频',
          message: normalizeText(_0x978db0['error']) || '正在等待视频生成结果',
          status: _0x5f5644,
          resumable: Boolean(normalizeText(_0x978db0['taskId'])),
          remoteTaskId: _0x978db0['taskId'],
          modelId: _0x978db0['modelId'] || _0x381e52?.['modelId'],
          provider: _0x978db0['provider'] || _0x381e52?.['provider'],
          providerProfileId: _0x978db0['providerProfileId'],
          executionId: _0x978db0['executionId'],
        };
      if (batch) _0x4e9fd9['batch'] = batch;
      const _0x326e08 = getStoryBackgroundTasks(_0x375dd6['data'])['find'](
        (_0x546452) => _0x546452['id'] === _0x346a32,
      );
      if (['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](_0x5f5644))
        return _0x326e08
          ? _0x5f0f9b(_0x375dd6, _0x346a32, _0x4e9fd9)
          : _0x1475c4(_0x375dd6, { id: _0x346a32, ..._0x4e9fd9 });
      if (!_0x326e08) return null;
      if (['success', 'succeeded', 'completed', 'done']['includes'](_0x5f5644))
        return _0x4ca3bb(_0x375dd6, _0x346a32, { status: 'succeeded', message: '片段视频生成完成' });
      if (['cancelled', 'canceled']['includes'](_0x5f5644))
        return _0x4ca3bb(_0x375dd6, _0x346a32, { status: 'cancelled', message: '片段视频任务已取消' });
      if (['failed', 'error']['includes'](_0x5f5644))
        return _0x4ca3bb(_0x375dd6, _0x346a32, {
          status: 'failed',
          message: '片段视频生成失败',
          error: _0x978db0['error'] || '片段视频生成失败。',
        });
      return null;
    },
    _0x343c4d = (_0x103c85, _0x5760e4, _0x387c6c, _0x5c6051 = null, _0x37f065 = null) => {
      const _0x4a9770 = _0x103c85['data'];
      return createStoryClipGenerationController({
        getClip: () => {
          const _0x405841 = _0x4a9770?.['episodes']?.['find']((_0x3285f8) => _0x3285f8['id'] === _0x5760e4);
          return _0x405841?.['clips']?.['find']((_0x173cd6) => _0x173cd6['id'] === _0x387c6c) || _0x5c6051;
        },
        updateClip: (_0x56e121) => {
          if (!_0x2c6e3f(_0x103c85)) return;
          (_0x2c80c3(_0x5760e4, _0x387c6c, _0x56e121, _0x4a9770),
            _0x55d8da(_0x103c85, _0x5760e4, _0x387c6c, _0x56e121, { batch: _0x37f065 }),
            _0x5de417(_0x103c85),
            _0x4973a4({ immediate: !![] }));
          if (!_0x4c5de2(_0x103c85)) return;
          _0x2e6b68(_0x4a9770);
          if (_0xbf1570['view'] === 'project' && _0xbf1570['step'] === 0x3) {
            _0xa55d13(_0x5760e4);
            return;
          }
          if (
            _0xbf1570['view'] === 'episode' &&
            normalizeText(_0xbf1570['selectedEpisodeId']) === normalizeText(_0x5760e4) &&
            _0xbf1570['selectedClipId'] === _0x387c6c
          ) {
            if (!_0x26bba7()) _0x4a1b03();
          }
        },
      });
    },
    _0x20fa09 = async (_0x2cf750, _0x4f0e19 = 0x3a98) => {
      const _0x29bec3 = Date['now']();
      while (!_0xb096bc()) {
        const _0x2b4257 = resolveModelExecution(_0x2cf750['modelId'], {
          providerHint: _0x2cf750['provider'],
        });
        if (_0x2b4257?.['modelManifest'] && _0x2b4257?.['executionManifest']) return !![];
        if (Date['now']() - _0x29bec3 >= _0x4f0e19) return ![];
        await new Promise((_0x35b557) => windowObject['setTimeout'](_0x35b557, 0xfa));
      }
      return ![];
    },
    _0x1e92a3 = async ({
      episodeId: _0x3a7d51,
      clipId: _0xffe980,
      recovery: _0x51c191,
      projectToken: projectToken = _0x5e587f(_0xbf1570),
    }) => {
      _0x3adca8(projectToken);
      const _0x5e1247 = _0x41b8cb(projectToken['projectId'], _0x3a7d51, _0xffe980);
      if (_0x472ea8['has'](_0x5e1247) || _0xb096bc()) return ![];
      const _0xc6dfdf = await _0x20fa09(_0x51c191);
      if (!_0x2c6e3f(projectToken) || _0x472ea8['has'](_0x5e1247)) return ![];
      if (!_0xc6dfdf) {
        const _0x4d8e03 = projectToken['data']?.['episodes']?.['find'](
            (_0x138df1) => _0x138df1['id'] === _0x3a7d51,
          ),
          _0xcb94bd = _0x4d8e03?.['clips']?.['find']((_0x229ba3) => _0x229ba3['id'] === _0xffe980);
        if (_0xcb94bd) {
          const _0x5607a0 = {
            ..._0xcb94bd,
            generation: {
              ..._0xcb94bd['generation'],
              status: 'failed',
              error: '视频模型缺少 manifest 或 execution manifest：' + _0x51c191['modelId'],
            },
          };
          (_0x2c80c3(_0x3a7d51, _0xffe980, _0x5607a0, projectToken['data']),
            _0x55d8da(projectToken, _0x3a7d51, _0xffe980, _0x5607a0),
            _0x4973a4({ immediate: !![] }));
          if (_0x4c5de2(projectToken)) {
            _0x2e6b68(projectToken['data']);
            if (_0xbf1570['view'] === 'project' && _0xbf1570['step'] === 0x3) _0xa55d13(_0x3a7d51);
            else
              _0xbf1570['view'] === 'episode' &&
                normalizeText(_0xbf1570['selectedEpisodeId']) === normalizeText(_0x3a7d51) &&
                _0x4a1b03();
          }
        }
        return ![];
      }
      const _0x31fc88 = projectToken['data']?.['episodes']?.['find'](
          (_0x29c651) => _0x29c651['id'] === _0x3a7d51,
        ),
        _0x2dcbc2 = _0x31fc88?.['clips']?.['find']((_0x3d56e3) => _0x3d56e3['id'] === _0xffe980);
      if (!_0x2dcbc2 || !getRecoverableStoryClipVideoTask(_0x2dcbc2)) return ![];
      const _0x30c2c1 = _0x343c4d(projectToken, _0x3a7d51, _0xffe980, _0x2dcbc2);
      _0x472ea8['set'](_0x5e1247, _0x30c2c1);
      try {
        const _0x1f09f3 = await _0x30c2c1['resume']({
          projectId: projectToken['projectId'],
          episodeId: _0x3a7d51,
          taskId: _0x51c191['taskId'],
          modelId: _0x51c191['modelId'],
          provider: _0x51c191['provider'],
          providerProfileId: _0x51c191['providerProfileId'],
          executionId: _0x51c191['executionId'],
          startedAt: _0x51c191['startedAt'],
        });
        if (!_0x2c6e3f(projectToken)) return ![];
        return (
          _0x1f09f3?.['status'] === 'success' &&
            _0x228c6f?.('片段视频任务已恢复并生成完成。', 'success', projectToken, {
              episodeId: _0x3a7d51,
              clipId: _0xffe980,
            }),
          _0x4973a4({ immediate: !![] }),
          _0x1f09f3?.['status'] === 'success' || _0x1f09f3?.['status'] === 'pending'
        );
      } catch (_0x4ad3ee) {
        if (!_0x2c6e3f(projectToken)) return ![];
        const _0x307411 = projectToken['data']?.['episodes']?.['find'](
            (_0x24d358) => _0x24d358['id'] === _0x3a7d51,
          ),
          _0x462738 = _0x307411?.['clips']?.['find']((_0x1e5798) => _0x1e5798['id'] === _0xffe980);
        if (_0x462738) {
          const _0x4b876d = {
            ..._0x462738,
            generation: {
              ..._0x462738['generation'],
              status: 'failed',
              error: _0x4ad3ee?.['message'] || '片段视频任务恢复失败。',
            },
          };
          (_0x2c80c3(_0x3a7d51, _0xffe980, _0x4b876d, projectToken['data']),
            _0x55d8da(projectToken, _0x3a7d51, _0xffe980, _0x4b876d),
            _0x4973a4({ immediate: !![] }));
        }
        return (
          _0x4bcc40?.(_0x4ad3ee?.['message'] || '片段视频任务恢复失败。', 'error', {
            episodeId: _0x3a7d51,
            clipId: _0xffe980,
            taskId: _0x51c191['taskId'],
            error: _0x4ad3ee,
          }),
          ![]
        );
      } finally {
        _0x472ea8['get'](_0x5e1247) === _0x30c2c1 && _0x472ea8['delete'](_0x5e1247);
        if (_0x4c5de2(projectToken)) {
          _0x2e6b68(projectToken['data']);
          if (_0xbf1570['view'] === 'project' && _0xbf1570['step'] === 0x3) _0xa55d13(_0x3a7d51);
          else
            _0xbf1570['view'] === 'episode' &&
              normalizeText(_0xbf1570['selectedEpisodeId']) === normalizeText(_0x3a7d51) &&
              _0x4a1b03();
        }
      }
    },
    _0x155bdf = (_0x371db1 = _0xbf1570['data']) => {
      const _0x146da3 = _0x341d22(_0x371db1),
        _0x2b0a25 = [];
      for (const _0x1915fe of _0x371db1?.['episodes'] || []) {
        for (const _0x285af4 of _0x1915fe?.['clips'] || []) {
          const _0x4cf9e4 = getRecoverableStoryClipVideoTask(_0x285af4);
          if (!_0x4cf9e4) continue;
          _0x2b0a25['push']({ episodeId: _0x1915fe['id'], clipId: _0x285af4['id'], recovery: _0x4cf9e4 });
        }
      }
      return (
        _0x2b0a25['forEach']((_0x4f0946) => {
          void _0x1e92a3({ ..._0x4f0946, projectToken: _0x146da3 });
        }),
        _0x2b0a25['length']
      );
    };
  return Object['freeze']({
    createGenerationController: _0x343c4d,
    getGenerationKey: _0x41b8cb,
    replaceClip: _0x2c80c3,
    resumeTask: _0x1e92a3,
    resumeTasks: _0x155bdf,
    syncBackgroundTask: _0x55d8da,
    waitForRecoveryManifest: _0x20fa09,
  });
}
