import {
  finishStoryBackgroundTask,
  startStoryBackgroundTask,
  updateStoryBackgroundTask,
  updateStoryBackgroundTaskBatch,
} from './storyBackgroundTasks.js';
import {
  deriveStoryProjectTaskState,
  reconcileStoryClipVideoBackgroundTasks,
} from './storyProjectTaskState.js';
import {
  advanceStoryProjectSession,
  createStoryProjectTaskToken,
  isStoryProjectTaskTokenCurrent,
  isStoryProjectTaskTokenLive,
} from './storyProjectTaskToken.js';
import { isStoryAssetVoiceLoading } from './storyAssetGenerationState.js';
import { reportStoryTaskCenter } from './storyTaskCenterProjection.js';
import { getProviderConfig } from '../../../api/configApi.js';
function normalizeText(_0x5e473a) {
  return String(_0x5e473a || '')['trim']();
}
function cloneData(_0x9138b3) {
  return JSON['parse'](JSON['stringify'](_0x9138b3));
}
export function createStoryProjectTaskWorkspaceController({
  state: _0x126207,
  activeClipGenerationControllers: _0x210f2b,
  activeBackgroundExecutions: _0x4a2ee4,
  activeBackgroundRecoveries: _0x44f0d9,
  replicationAnalysisPromises: _0x54e39f,
  replicationSourceFileByEpisodeKey: _0x416ab3,
  projectData: _0x4b0ae6,
  getWorkspaceDestroyed: getWorkspaceDestroyed = () => ![],
  stopAssetBreakdownProgress: stopAssetBreakdownProgress = () => {},
  schedulePersistence: schedulePersistence = () => {},
  render: render = () => {},
} = {}) {
  if (!_0x126207 || typeof _0x126207 !== 'object')
    throw new TypeError('Story project tasks require workspace state.');
  for (const [_0x58a10d, _0x4c8d2d] of Object['entries']({
    activeClipGenerationControllers: _0x210f2b,
    activeBackgroundExecutions: _0x4a2ee4,
    activeBackgroundRecoveries: _0x44f0d9,
    replicationAnalysisPromises: _0x54e39f,
    replicationSourceFileByEpisodeKey: _0x416ab3,
    projectData: _0x4b0ae6,
  })) {
    if (!_0x4c8d2d || typeof _0x4c8d2d !== 'object')
      throw new TypeError('Story project tasks require ' + _0x58a10d + '.');
  }
  let _0x33a58c = 0x0;
  const _0x20cf9c = () => getWorkspaceDestroyed() === !![],
    _0x25ff5e = () => {
      (Object['assign'](_0x126207, deriveStoryProjectTaskState()),
        (_0x126207['exportingAssetAppearanceKey'] = ''));
    },
    _0x259bf5 = (_0x5b21da = _0x126207['data']) => {
      (reconcileStoryClipVideoBackgroundTasks(_0x5b21da),
        reportStoryTaskCenter(_0x5b21da),
        _0x25ff5e(),
        Object['assign'](_0x126207, deriveStoryProjectTaskState(_0x5b21da)),
        _0x126207['characterVoiceEditor'] &&
          (_0x126207['characterVoiceEditor']['isGenerating'] = isStoryAssetVoiceLoading(
            _0x126207,
            _0x126207['characterVoiceEditor']['assetId'],
          )));
    },
    _0x3881a0 = (_0x12c936) => {
      const _0x6dc9ff = normalizeText(_0x12c936);
      if (!_0x6dc9ff) return ![];
      for (const [_0x133519, _0x5cde9f] of _0x210f2b) {
        if (!_0x133519['startsWith'](_0x6dc9ff + ':')) continue;
        (_0x5cde9f['pause'](), _0x210f2b['delete'](_0x133519));
      }
      for (const _0x2025c1 of _0x4a2ee4) {
        _0x2025c1['startsWith'](_0x6dc9ff + ':') && _0x4a2ee4['delete'](_0x2025c1);
      }
      for (const _0x4026f5 of _0x44f0d9) {
        _0x4026f5['startsWith'](_0x6dc9ff + ':') && _0x44f0d9['delete'](_0x4026f5);
      }
      _0x54e39f['delete'](_0x6dc9ff);
      for (const _0x3e1ac5 of _0x416ab3['keys']()) {
        _0x3e1ac5['startsWith'](_0x6dc9ff + ':') && _0x416ab3['delete'](_0x3e1ac5);
      }
      return (
        _0x4b0ae6['releaseData'](_0x6dc9ff),
        advanceStoryProjectSession(_0x126207, _0x6dc9ff),
        reportStoryTaskCenter({ project: { id: _0x6dc9ff, backgroundTasks: [] } }),
        !![]
      );
    },
    _0x5a0879 = ({ invalidateCurrentProject: invalidateCurrentProject = ![] } = {}) => {
      const _0x43c5d6 = normalizeText(_0x126207['data']?.['project']?.['id']);
      if (invalidateCurrentProject) _0x3881a0(_0x43c5d6);
      return (
        stopAssetBreakdownProgress({ clearState: !![] }),
        _0x25ff5e(),
        createStoryProjectTaskToken(_0x126207)
      );
    },
    _0xde53a4 = (_0x353b72 = _0x126207['data']) => {
      const _0x509faf = _0x4b0ae6['getEntry'](_0x353b72?.['project']?.['id']),
        _0x234244 = createStoryProjectTaskToken({ ..._0x126207, data: _0x353b72 });
      return (
        (_0x234244['projectTitleEdited'] =
          _0x353b72 === _0x126207['data']
            ? _0x126207['projectTitleEdited'] === !![]
            : _0x509faf?.['projectTitleEdited'] === !![]),
        _0x234244
      );
    },
    _0xaec0c9 = (_0x436a34) => isStoryProjectTaskTokenCurrent(_0x126207, _0x436a34) && !_0x20cf9c(),
    _0x4d6860 = (_0x40dbbc) => isStoryProjectTaskTokenLive(_0x126207, _0x40dbbc) && !_0x20cf9c(),
    _0x2cb2f3 = (_0x753dcf) => _0x4d6860(_0x753dcf) && _0x4b0ae6['registerTaskData'](_0x753dcf),
    _0x35416c = (_0x284f90, _0x5c31db) => {
      const _0x2eea3a = normalizeText(_0x284f90?.['projectId']),
        _0x3c11bc = normalizeText(_0x5c31db);
      return _0x2eea3a && _0x3c11bc ? _0x2eea3a + ':' + _0x3c11bc : '';
    },
    _0x176996 = (_0x39fb00) => _0x4d6860(_0x39fb00) && _0x4b0ae6['syncTaskEntry'](_0x39fb00),
    _0x581500 = (_0x5c308a, { refreshHome: refreshHome = ![] } = {}) => {
      if (!_0x4d6860(_0x5c308a)) return;
      (_0x176996(_0x5c308a),
        reportStoryTaskCenter(_0x5c308a?.['data']),
        schedulePersistence({ immediate: !![] }),
        refreshHome && _0x126207['view'] === 'home' && !_0x20cf9c() && render({ capturePageState: ![] }));
    },
    _0x4c95c4 = (_0x2d3118, _0x5f2295 = {}, { refreshHome: refreshHome = !![] } = {}) => {
      if (!_0x2d3118?.['data']?.['project']) return null;
      _0x2cb2f3(_0x2d3118);
      const _0x1ff40a = startStoryBackgroundTask(_0x2d3118['data'], {
          ..._0x5f2295,
          providerProfileId:
            _0x5f2295['providerProfileId'] ||
            (_0x5f2295['provider'] ? getProviderConfig(_0x5f2295['provider'])?.['providerProfileId'] : ''),
        }),
        _0x4ff5eb = _0x35416c(_0x2d3118, _0x1ff40a?.['id'] || _0x5f2295['id']);
      if (_0x4ff5eb) _0x4a2ee4['add'](_0x4ff5eb);
      return (_0x581500(_0x2d3118, { refreshHome: refreshHome }), _0x1ff40a);
    },
    _0x39f828 = (_0x30aaf8, _0xf4e6a9, _0x2cf4d8 = {}, { refreshHome: refreshHome = !![] } = {}) => {
      if (!_0x30aaf8?.['data']?.['project']) return null;
      const _0x2321db = updateStoryBackgroundTask(_0x30aaf8['data'], _0xf4e6a9, _0x2cf4d8);
      if (_0x2321db) _0x581500(_0x30aaf8, { refreshHome: refreshHome });
      return _0x2321db;
    },
    _0x53289f = (_0x185986, _0xc850bf, _0x584143 = {}) => {
      if (!_0x185986?.['data']?.['project']) return 0x0;
      const _0x339bc8 = updateStoryBackgroundTaskBatch(_0x185986['data'], _0xc850bf, _0x584143);
      if (_0x339bc8) _0x581500(_0x185986, { refreshHome: !![] });
      return _0x339bc8;
    },
    _0x4a0deb = (_0x26ec29, _0x5ad2f4 = {}) => {
      const _0x1c68c9 = normalizeText(_0x126207['data']?.['project']?.['id']) || 'project';
      return (
        (_0x33a58c += 0x1),
        {
          ...cloneData(_0x5ad2f4),
          id: (normalizeText(_0x26ec29) || 'batch') + ':' + _0x1c68c9 + ':' + Date['now']() + ':' + _0x33a58c,
          type: normalizeText(_0x26ec29) || 'batch',
          total: Math['max'](0x0, Math['trunc'](Number(_0x5ad2f4['total']) || 0x0)),
          completed: Math['max'](0x0, Math['trunc'](Number(_0x5ad2f4['completed']) || 0x0)),
          label: normalizeText(_0x5ad2f4['label']),
        }
      );
    },
    _0x52503d = (_0x5d10c7, _0x5aa341, _0x59d86e = {}) => {
      if (!_0x5aa341?.['id']) return null;
      return (
        Object['assign'](_0x5aa341, cloneData(_0x59d86e)),
        _0x53289f(_0x5d10c7, _0x5aa341['id'], _0x5aa341),
        _0x5aa341
      );
    },
    _0x36aafa = (_0x3cb164, _0xd49634, _0x10945a = {}, { refreshHome: refreshHome = !![] } = {}) => {
      if (!_0x3cb164?.['data']?.['project']) return null;
      const _0x3fda1c = finishStoryBackgroundTask(_0x3cb164['data'], _0xd49634, _0x10945a);
      if (_0x3fda1c) _0x581500(_0x3cb164, { refreshHome: refreshHome });
      const _0x1c023b = _0x35416c(_0x3cb164, _0xd49634);
      if (_0x1c023b) _0x4a2ee4['delete'](_0x1c023b);
      return _0x3fda1c;
    };
  return Object['freeze']({
    advanceProjectSession: advanceStoryProjectSession,
    beginSession: _0x5a0879,
    createProjectToken: createStoryProjectTaskToken,
    createTaskBatch: _0x4a0deb,
    createTokenForData: _0xde53a4,
    finishBackgroundTask: _0x36aafa,
    getBackgroundExecutionKey: _0x35416c,
    invalidateRuntime: _0x3881a0,
    isCurrent: _0xaec0c9,
    isLive: _0x4d6860,
    persistChange: _0x581500,
    registerProjectData: _0x2cb2f3,
    resetTaskState: _0x25ff5e,
    restoreTaskState: _0x259bf5,
    startBackgroundTask: _0x4c95c4,
    syncProjectEntry: _0x176996,
    syncTaskBatch: _0x52503d,
    updateBackgroundTask: _0x39f828,
    updateBackgroundTaskBatch: _0x53289f,
  });
}
