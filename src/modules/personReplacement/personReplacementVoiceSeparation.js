import {
  cancelRunningHubAudioTask,
  resumeAudioSeparationTask,
  runAudioSeparation,
} from '../../../api/aiAudioApi.js';
import { resolveRunningHubWorkflowAccess } from '../../../api/configApi.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { saveRemoteAudioLocallyDetailed } from '../../services/projectService.js';
import {
  createPersonReplacementVoiceSeparationRevision,
  isPersonReplacementVoiceSeparationActive,
  normalizePersonReplacementVoiceSeparationState,
  resolvePersonReplacementVoiceSeparationState,
  updatePersonReplacementVoiceSeparationState,
} from './personReplacementVoiceSeparationState.js';
function normalizeText(_0x5d63aa) {
  return String(_0x5d63aa ?? '')['trim']();
}
function cloneJson(_0x48d898) {
  return _0x48d898 && typeof _0x48d898 === 'object' ? JSON['parse'](JSON['stringify'](_0x48d898)) : _0x48d898;
}
function createRequestId() {
  const _0x51117a = globalThis['crypto']?.['randomUUID']?.();
  return (
    'replacement-voice-separation-' +
    (_0x51117a || Date['now']() + '-' + Math['round'](Math['random']() * 0x186a0))
  );
}
function resolveSeparationResultUrls(_0x547937 = {}) {
  const _0x1dbf53 = Array['isArray'](_0x547937?.['audios']) ? _0x547937['audios'] : [],
    _0x5f1811 = normalizeText(
      _0x547937['vocalsAudioUrl'] ||
        _0x1dbf53['find']((_0x263b61) => normalizeText(_0x263b61?.['role'])['toLowerCase']() === 'vocals')?.[
          'audioUrl'
        ] ||
        _0x1dbf53[0x0]?.['audioUrl'],
    ),
    _0x47342c = normalizeText(
      _0x547937['backgroundAudioUrl'] ||
        _0x1dbf53['find'](
          (_0x5f43ce) => normalizeText(_0x5f43ce?.['role'])['toLowerCase']() === 'background',
        )?.['audioUrl'] ||
        _0x1dbf53[0x1]?.['audioUrl'],
    );
  if (!_0x5f1811 || !_0x47342c) throw new Error('人声分离完成，但返回结果缺少人声或背景声音频');
  return { vocalsAudioUrl: _0x5f1811, backgroundAudioUrl: _0x47342c };
}
async function persistSeparatedAudio(_0x3f3cee, _0x2f02a8, _0x1070d3 = {}) {
  const _0x2c101f = await _0x2f02a8(_0x3f3cee, _0x1070d3),
    _0x2eca59 = normalizeLocalPath(pickResultLocalPath(_0x2c101f)),
    _0x570ada = normalizeText(
      _0x2c101f?.['localUrl'] || _0x2c101f?.['audioUrl'] || localPathToUrl(_0x2eca59),
    );
  if (!_0x2eca59 || !_0x570ada) throw new Error('清晰人声已生成，但保存到本地失败');
  return { localPath: _0x2eca59, localUrl: _0x570ada };
}
async function cancelRemoteSeparationTask({
  taskId: _0x485365,
  providerProfileId: providerProfileId = '',
} = {}) {
  const _0x54c560 = await resolveRunningHubWorkflowAccess(providerProfileId);
  if (!_0x54c560?.['apiKey']) throw new Error('未配置\x20RunningHub\x20API\x20Key，无法取消远端任务');
  return cancelRunningHubAudioTask({
    apiKey: _0x54c560['apiKey'],
    taskId: _0x485365,
    providerProfileId: providerProfileId || _0x54c560['providerProfileId'],
  });
}
export function createPersonReplacementVoiceSeparationRuntime({
  getProject: _0x24b976,
  setProject: _0x3659fd,
  runSeparation: runSeparation = runAudioSeparation,
  resumeSeparation: resumeSeparation = resumeAudioSeparationTask,
  cancelSeparation: cancelSeparation = cancelRemoteSeparationTask,
  saveAudio: saveAudio = saveRemoteAudioLocallyDetailed,
  persistNow: persistNow = async () => {},
  onStateChange: onStateChange = () => {},
  showToast: showToast = () => {},
  now: now = () => new Date()['toISOString'](),
  createId: createId = createRequestId,
} = {}) {
  if (typeof _0x24b976 !== 'function' || typeof _0x3659fd !== 'function')
    throw new TypeError('Voice separation runtime requires project access');
  let _0x1a2f49 = ![];
  const _0x5cd7c2 = new Map(),
    _0x3f9382 = (_0x16d943, _0x30719b) => normalizeText(_0x16d943) + ':' + normalizeText(_0x30719b),
    _0x23aa5e = (_0x111887, _0x564651) =>
      (Array['isArray'](_0x111887?.['sources']) ? _0x111887['sources'] : [])['find'](
        (_0x1f92d4) => normalizeText(_0x1f92d4?.['id']) === normalizeText(_0x564651),
      ),
    _0x286116 = ({
      projectId: _0x39465f,
      sourceId: _0x1a86c5,
      requestId: _0x1457b7,
      inputRevision: _0x1c2236,
    }) => {
      const _0x53f09a = _0x24b976(),
        _0x30c85e = _0x23aa5e(_0x53f09a, _0x1a86c5),
        _0x218480 = resolvePersonReplacementVoiceSeparationState(_0x53f09a, _0x1a86c5);
      return (
        !_0x1a2f49 &&
        normalizeText(_0x53f09a?.['id']) === normalizeText(_0x39465f) &&
        normalizeText(_0x218480['requestId']) === normalizeText(_0x1457b7) &&
        createPersonReplacementVoiceSeparationRevision({ project: _0x53f09a, source: _0x30c85e }) ===
          _0x1c2236
      );
    },
    _0x557c48 = (_0x8f125c, _0x5cc0d1 = {}, { persistIdentity: persistIdentity = ![] } = {}) => {
      if (!_0x286116(_0x8f125c)) return null;
      const _0x1f0fd8 = _0x24b976(),
        _0x57b99b = resolvePersonReplacementVoiceSeparationState(_0x1f0fd8, _0x8f125c['sourceId']),
        _0x21b0ea = normalizePersonReplacementVoiceSeparationState({
          ..._0x57b99b,
          ..._0x5cc0d1,
          sourceId: _0x8f125c['sourceId'],
          requestId: _0x8f125c['requestId'],
          inputRevision: _0x8f125c['inputRevision'],
        }),
        _0x9a15cd = _0x3659fd(
          { ..._0x1f0fd8, audio: updatePersonReplacementVoiceSeparationState(_0x1f0fd8['audio'], _0x21b0ea) },
          { renderWorkspace: ![] },
        );
      return (
        onStateChange({
          sourceId: _0x8f125c['sourceId'],
          state: cloneJson(_0x21b0ea),
          project: cloneJson(_0x9a15cd || _0x24b976()),
        }),
        persistIdentity &&
          _0x21b0ea['taskId'] !== _0x57b99b['taskId'] &&
          void Promise['resolve'](persistNow())['catch'](() => {}),
        _0x21b0ea
      );
    },
    _0x1b8998 = ({
      project: _0x1d445d,
      source: _0x1f5dbb,
      requestId: _0x579cf5,
      inputRevision: _0x1979a1,
    }) => {
      const _0x2fe28f = resolvePersonReplacementVoiceSeparationState(_0x1d445d, _0x1f5dbb['id']),
        _0x24c570 = normalizePersonReplacementVoiceSeparationState({
          ..._0x2fe28f,
          sourceId: _0x1f5dbb['id'],
          status: 'submitting',
          requestId: _0x579cf5,
          inputRevision: _0x1979a1,
          taskId: '',
          providerProfileId: '',
          startedAt: now(),
          completedAt: '',
          error: '',
        }),
        _0x25c523 = _0x3659fd(
          { ..._0x1d445d, audio: updatePersonReplacementVoiceSeparationState(_0x1d445d['audio'], _0x24c570) },
          { renderWorkspace: ![] },
        );
      return (
        onStateChange({
          sourceId: _0x1f5dbb['id'],
          state: cloneJson(_0x24c570),
          project: cloneJson(_0x25c523 || _0x24b976()),
        }),
        _0x24c570
      );
    },
    _0x4a12ad = async ({
      projectId: _0x863924,
      sourceId: _0x4a1540,
      sourceVideoRef: _0x9e4e0c,
      requestId: _0x29f893,
      inputRevision: _0x3c3675,
      taskId: taskId = '',
      providerProfileId: providerProfileId = '',
      resume: resume = ![],
      runtime: _0x4f827f,
    }) => {
      const _0x3174d = {
        projectId: _0x863924,
        sourceId: _0x4a1540,
        requestId: _0x29f893,
        inputRevision: _0x3c3675,
      };
      try {
        const _0x3bde8f = resume
            ? await resumeSeparation(
                taskId,
                { providerProfileId: providerProfileId },
                { signal: _0x4f827f['abortController']['signal'], pollImmediately: !![] },
              )
            : await runSeparation(
                { audioUrl: localPathToUrl(_0x9e4e0c) || _0x9e4e0c },
                {
                  signal: _0x4f827f['abortController']['signal'],
                  onTaskMeta: (_0x480d8f = {}) => {
                    ((_0x4f827f['taskId'] = normalizeText(_0x480d8f['taskId'])),
                      (_0x4f827f['providerProfileId'] = normalizeText(_0x480d8f['providerProfileId'])),
                      _0x557c48(
                        _0x3174d,
                        {
                          status: 'running',
                          taskId: _0x4f827f['taskId'],
                          providerProfileId: _0x4f827f['providerProfileId'],
                        },
                        { persistIdentity: !![] },
                      ));
                  },
                  onTaskId: (_0x1fdcfc) => {
                    ((_0x4f827f['taskId'] = normalizeText(_0x1fdcfc)),
                      _0x557c48(
                        _0x3174d,
                        { status: 'running', taskId: _0x4f827f['taskId'] },
                        { persistIdentity: !![] },
                      ));
                  },
                },
              ),
          _0x5de0d0 = resolveSeparationResultUrls(_0x3bde8f);
        if (!_0x286116(_0x3174d)) return null;
        const [_0x2a166f, _0x292ca7] = await Promise['all']([
          persistSeparatedAudio(_0x5de0d0['vocalsAudioUrl'], saveAudio, {
            signal: _0x4f827f['abortController']['signal'],
          }),
          persistSeparatedAudio(_0x5de0d0['backgroundAudioUrl'], saveAudio, {
            signal: _0x4f827f['abortController']['signal'],
          }),
        ]);
        if (!_0x286116(_0x3174d)) return null;
        const _0x2b0754 = _0x557c48(_0x3174d, {
          status: 'succeeded',
          taskId: normalizeText(_0x3bde8f?.['taskId'] || _0x4f827f['taskId']),
          providerProfileId: _0x4f827f['providerProfileId'] || providerProfileId,
          completedAt: now(),
          vocalsAudioRef: _0x2a166f['localPath'],
          vocalsAudioUrl: _0x2a166f['localUrl'],
          backgroundAudioRef: _0x292ca7['localPath'],
          backgroundAudioUrl: _0x292ca7['localUrl'],
          error: '',
        });
        try {
          await persistNow();
        } catch {}
        return (showToast('清晰人声提取完成，已自动用于声音克隆。', 'success'), _0x2b0754);
      } catch (_0x459101) {
        if (_0x4f827f['abortController']['signal']['aborted'] || _0x1a2f49) return null;
        const _0x42949f = normalizeText(_0x459101?.['message'] || _0x459101) || '清晰人声提取失败',
          _0x54e1a1 = _0x557c48(_0x3174d, { status: 'failed', completedAt: now(), error: _0x42949f });
        return (showToast('清晰人声提取失败：' + _0x42949f, 'error'), _0x54e1a1);
      } finally {
        const _0x4f581e = _0x3f9382(_0x863924, _0x4a1540);
        if (_0x5cd7c2['get'](_0x4f581e) === _0x4f827f) _0x5cd7c2['delete'](_0x4f581e);
      }
    },
    _0x1a16c4 = ({ project: _0x3fc9e6, source: _0x2cfe0d, state: _0x2b6c56, resume: resume = ![] }) => {
      const _0x599701 = normalizeText(_0x3fc9e6['id']),
        _0x6b248a = normalizeText(_0x2cfe0d['id']),
        _0x489311 = _0x3f9382(_0x599701, _0x6b248a),
        _0x633e69 = _0x5cd7c2['get'](_0x489311);
      if (_0x633e69?.['promise']) return _0x633e69['promise'];
      const _0x323e72 = {
        abortController: new AbortController(),
        taskId: normalizeText(_0x2b6c56['taskId']),
        providerProfileId: normalizeText(_0x2b6c56['providerProfileId']),
        promise: null,
      };
      return (
        (_0x323e72['promise'] = _0x4a12ad({
          projectId: _0x599701,
          sourceId: _0x6b248a,
          sourceVideoRef: _0x2cfe0d['videoRef'],
          requestId: _0x2b6c56['requestId'],
          inputRevision: _0x2b6c56['inputRevision'],
          taskId: _0x2b6c56['taskId'],
          providerProfileId: _0x2b6c56['providerProfileId'],
          resume: resume,
          runtime: _0x323e72,
        })),
        _0x5cd7c2['set'](_0x489311, _0x323e72),
        _0x323e72['promise']
      );
    },
    _0x2eed14 = (_0xead9f = '') => {
      if (_0x1a2f49) return Promise['resolve'](null);
      const _0x104d10 = _0x24b976(),
        _0x49b7ff = _0x23aa5e(_0x104d10, _0xead9f);
      if (!_0x49b7ff?.['videoRef'])
        return (showToast('原始视频不可用，无法提取清晰人声。', 'warn'), Promise['resolve'](null));
      const _0x1c7bf8 = resolvePersonReplacementVoiceSeparationState(_0x104d10, _0x49b7ff['id']);
      if (isPersonReplacementVoiceSeparationActive(_0x1c7bf8)) return _0x73f76d(_0x49b7ff['id']);
      const _0xe4bcc0 = normalizeText(createId()),
        _0x27bd92 = createPersonReplacementVoiceSeparationRevision({ project: _0x104d10, source: _0x49b7ff }),
        _0x3c28fd = _0x1b8998({
          project: _0x104d10,
          source: _0x49b7ff,
          requestId: _0xe4bcc0,
          inputRevision: _0x27bd92,
        });
      return (
        showToast('正在从原始视频中提取清晰人声…', 'info'),
        _0x1a16c4({ project: _0x24b976(), source: _0x49b7ff, state: _0x3c28fd })
      );
    },
    _0x73f76d = (_0x43430f = '') => {
      if (_0x1a2f49) return Promise['resolve'](null);
      const _0x2701c1 = _0x24b976(),
        _0x1dc2ee = _0x23aa5e(_0x2701c1, _0x43430f),
        _0x24c981 = resolvePersonReplacementVoiceSeparationState(_0x2701c1, _0x43430f);
      if (!_0x1dc2ee?.['videoRef'] || !isPersonReplacementVoiceSeparationActive(_0x24c981))
        return Promise['resolve'](null);
      const _0x1c3904 = createPersonReplacementVoiceSeparationRevision({
        project: _0x2701c1,
        source: _0x1dc2ee,
      });
      if (!_0x24c981['taskId'] || _0x24c981['inputRevision'] !== _0x1c3904) {
        const _0x24570e = Boolean(_0x24c981['inputRevision'] && _0x24c981['inputRevision'] !== _0x1c3904),
          _0x36028f = normalizePersonReplacementVoiceSeparationState({
            ..._0x24c981,
            status: 'failed',
            inputRevision: _0x1c3904,
            taskId: '',
            providerProfileId: '',
            completedAt: now(),
            error: '人声提取任务已中断，请重新提取。',
            ...(_0x24570e
              ? { vocalsAudioRef: '', vocalsAudioUrl: '', backgroundAudioRef: '', backgroundAudioUrl: '' }
              : {}),
          }),
          _0x55990b = _0x3659fd(
            {
              ..._0x2701c1,
              audio: updatePersonReplacementVoiceSeparationState(_0x2701c1['audio'], _0x36028f),
            },
            { renderWorkspace: ![] },
          );
        return (
          onStateChange({
            sourceId: _0x1dc2ee['id'],
            state: cloneJson(_0x36028f),
            project: cloneJson(_0x55990b || _0x24b976()),
          }),
          Promise['resolve'](null)
        );
      }
      return _0x1a16c4({ project: _0x2701c1, source: _0x1dc2ee, state: _0x24c981, resume: !![] });
    },
    _0x5f07c8 = async (_0xf1b0df = '') => {
      if (_0x1a2f49) return ![];
      const _0x1fe3ff = _0x24b976(),
        _0x2f5d44 = _0x23aa5e(_0x1fe3ff, _0xf1b0df),
        _0x210d41 = resolvePersonReplacementVoiceSeparationState(_0x1fe3ff, _0xf1b0df);
      if (!_0x2f5d44 || !isPersonReplacementVoiceSeparationActive(_0x210d41)) return ![];
      const _0x237ee8 = {
          projectId: _0x1fe3ff['id'],
          sourceId: _0x2f5d44['id'],
          requestId: _0x210d41['requestId'],
          inputRevision: _0x210d41['inputRevision'],
        },
        _0x30ea82 = _0x3f9382(_0x1fe3ff['id'], _0x2f5d44['id']),
        _0x20b775 = _0x5cd7c2['get'](_0x30ea82);
      (_0x20b775?.['abortController']?.['abort']?.(),
        _0x5cd7c2['delete'](_0x30ea82),
        _0x557c48(_0x237ee8, { status: 'cancelled', completedAt: now(), error: '' }));
      const _0x48185b = normalizeText(_0x210d41['taskId'] || _0x20b775?.['taskId']);
      if (_0x48185b)
        try {
          await cancelSeparation({
            taskId: _0x48185b,
            providerProfileId: _0x210d41['providerProfileId'] || _0x20b775?.['providerProfileId'] || '',
          });
        } catch (_0x2ca341) {
          console['warn']('[replacementStudio]\x20voice\x20separation\x20cancel\x20failed', _0x2ca341);
          const _0x2d8371 = '已停止本地等待，但云端任务取消失败，可能仍在运行。请到任务平台确认状态。';
          return (_0x557c48(_0x237ee8, { error: _0x2d8371 }), showToast(_0x2d8371, 'warn'), !![]);
        }
      return (showToast('已取消清晰人声提取。', 'info'), !![]);
    };
  return Object['freeze']({
    extract: _0x2eed14,
    resume: _0x73f76d,
    cancel: _0x5f07c8,
    destroy() {
      if (_0x1a2f49) return;
      ((_0x1a2f49 = !![]),
        _0x5cd7c2['forEach']((_0x4a0774) => _0x4a0774['abortController']?.['abort']?.()),
        _0x5cd7c2['clear']());
    },
  });
}
