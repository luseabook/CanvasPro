import { buildPersonReplacementVideoRequest } from './personReplacementVideoRequest.js';
import {
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoResultRef,
} from './personReplacementProject.js';
import {
  appendPersonReplacementVideoResults,
  resolvePersonReplacementVideoSlotState,
} from './personReplacementVideoInputs.js';
import {
  isPersonReplacementVideoGenerationActive,
  getRecoverablePersonReplacementVideoTask,
  resolvePersonReplacementVideoGenerationState,
  updatePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';
import {
  hasPersonReplacementGenerationTaskIdentityChanged,
  projectPersonReplacementGenerationTaskIdentity,
} from './personReplacementGenerationTaskIdentity.js';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';
import {
  getSuccessfulVideoGenerationItems,
  getVideoGenerationResultError,
} from '../../components/video-node/videoGenerationResultRenderer.js';
import { resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import {
  cancelRunningHubVideoTask,
  resumeAsyncVideoTask,
  resumeRunningHubVideoTask,
} from '../../../api/aiVideoApi.js';
import { resolveRunningHubWorkflowAccess } from '../../../api/configApi.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
function normalizeText(_0x25bc05) {
  return String(_0x25bc05 ?? '')['trim']();
}
function resolveLocalVideoResultRef(_0x1d6571 = {}) {
  return (
    [
      _0x1d6571?.['localPath'],
      _0x1d6571?.['displayLocalPath'],
      _0x1d6571?.['videoUrl'],
      _0x1d6571?.['url'],
      typeof _0x1d6571 === 'string' ? _0x1d6571 : '',
    ]
      ['map'](normalizeLocalPath)
      ['find'](Boolean) || ''
  );
}
function cloneJson(_0x3382b5) {
  return _0x3382b5 && typeof _0x3382b5 === 'object' ? JSON['parse'](JSON['stringify'](_0x3382b5)) : _0x3382b5;
}
function createRequestId() {
  const _0x4ff415 = globalThis['crypto']?.['randomUUID']?.();
  return (
    'replacement-video-request-' +
    (_0x4ff415 || Date['now']() + '-' + Math['round'](Math['random']() * 0x186a0))
  );
}
function normalizeStableRevisionValue(_0xe3568a) {
  if (Array['isArray'](_0xe3568a)) return _0xe3568a['map'](normalizeStableRevisionValue);
  if (_0xe3568a && typeof _0xe3568a === 'object')
    return Object['fromEntries'](
      Object['entries'](_0xe3568a)
        ['sort'](([_0x216d1e], [_0xaa9fa0]) => _0x216d1e['localeCompare'](_0xaa9fa0))
        ['map'](([_0xf6b5ee, _0x27c9ef]) => [_0xf6b5ee, normalizeStableRevisionValue(_0x27c9ef)]),
    );
  return _0xe3568a;
}
function normalizeSlotRevision(_0x385240 = {}) {
  return normalizeStableRevisionValue(
    Object['fromEntries'](
      Object['entries'](_0x385240 && typeof _0x385240 === 'object' ? _0x385240 : {})['map'](
        ([_0x2ee0ff, _0x28afb9]) => [
          _0x2ee0ff,
          {
            kind: normalizeText(_0x28afb9?.['kind']),
            url: normalizeText(_0x28afb9?.['url']),
            modelId: normalizeText(_0x28afb9?.['modelId']),
          },
        ],
      ),
    ),
  );
}
export function createPersonReplacementVideoGenerationRevision({
  project: project = {},
  shot: shot = {},
  imageInput: imageInput = resolvePersonReplacementVideoImageInput(project, shot),
} = {}) {
  return JSON['stringify']({
    projectId: normalizeText(project?.['id']),
    shotId: normalizeText(shot?.['id']),
    videoRef: normalizeText(shot?.['videoRef']),
    videoIterationReferenceRef: normalizeText(shot?.['videoIterationReferenceRef']),
    videoIterationInputRef: normalizeText(shot?.['videoIterationInputRef']),
    videoPrompt: normalizeText(shot?.['videoPrompt']),
    imageMode: normalizeText(imageInput?.['mode']),
    imageRef: normalizeText(imageInput?.['imageRef']),
    referenceKind: normalizeText(imageInput?.['referenceKind']),
    outputFps: Number(shot?.['outputFps']) || 0x0,
    subjectCount:
      imageInput?.['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
        ? 0x1
        : (Array['isArray'](shot?.['people']) ? shot['people'] : [])['filter']((_0x1d3ed9) =>
            normalizeText(_0x1d3ed9?.['targetCharacterId']),
          )['length'],
    slotEntries: normalizeSlotRevision(shot?.['replacementVideoInputsBySlot']),
  });
}
function resolveImageInputWarning(_0x5494f9 = {}) {
  if (_0x5494f9['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE)
    return normalizeText(_0x5494f9['message']) || '请先在图像替换中为当前片段绑定一个人物参考图。';
  return '请先生成对应的替换首帧。';
}
async function resumePersonReplacementVideoTask(_0x297ff5, _0x277dbf, _0x1ad383 = {}) {
  const _0x257856 =
    resolveModelExecution(_0x277dbf?.['model']) ||
    resolveModelExecution(_0x277dbf?.['model'], { providerHint: _0x277dbf?.['provider'] });
  if (_0x257856?.['executionManifest']?.['adapterType'] === 'workflow')
    return resumeRunningHubVideoTask(_0x297ff5, _0x277dbf, _0x1ad383);
  return resumeAsyncVideoTask(_0x297ff5, _0x277dbf, _0x1ad383);
}
async function cancelPersonReplacementVideoTask({
  taskId: _0x4f64bb,
  providerProfileId: providerProfileId = '',
} = {}) {
  const _0x2e4bc3 = await resolveRunningHubWorkflowAccess(providerProfileId);
  if (!_0x2e4bc3['apiKey']) throw new Error('未配置\x20RunningHub\x20API\x20Key，无法取消远端任务');
  return cancelRunningHubVideoTask({
    apiKey: _0x2e4bc3['apiKey'],
    taskId: _0x4f64bb,
    providerProfileId: providerProfileId || _0x2e4bc3['providerProfileId'],
  });
}
export function createPersonReplacementVideoTaskRuntime({
  getProject: _0x3029cc,
  getProjectById: getProjectById = null,
  setProject: _0x2879c5,
  setProjectById: setProjectById = null,
  runPreparation: _0xeb8c5c,
  generateReplacementVideo: _0x3bd20b,
  resumeReplacementVideo: resumeReplacementVideo = resumePersonReplacementVideoTask,
  cancelReplacementVideo: cancelReplacementVideo = cancelPersonReplacementVideoTask,
  resolveInstallId: resolveInstallId = async () => '',
  persistNow: persistNow = async () => {},
  showToast: showToast = () => {},
  notifyGenerationCompleted: notifyGenerationCompleted = () => {},
  now: now = () => new Date()['toISOString'](),
  createId: createId = createRequestId,
} = {}) {
  if (typeof _0x3029cc !== 'function' || typeof _0x2879c5 !== 'function')
    throw new Error('Person\x20replacement\x20video\x20task\x20runtime\x20requires\x20project\x20access');
  let _0x54bf0d = ![],
    _0x1b7c14 = null,
    _0x25c3a7 = '';
  const _0x4da584 = [],
    _0xc12455 = new Map(),
    _0x560713 = (_0x2c2e14 = '') => {
      const _0x2d721c = normalizeText(_0x2c2e14);
      return _0x2d721c && typeof getProjectById === 'function' ? getProjectById(_0x2d721c) : _0x3029cc();
    },
    _0x3f51ba = (_0x1badfc) =>
      typeof setProjectById === 'function'
        ? setProjectById(_0x1badfc?.['id'], _0x1badfc, { renderWorkspace: ![] })
        : _0x2879c5(_0x1badfc, { renderWorkspace: ![] }),
    _0x5f4cdc = ({
      shotId: shotId = '',
      videoRef: videoRef = '',
      playbackVideoRef: playbackVideoRef = '',
      posterRef: posterRef = '',
      assetId: assetId = '',
      derivativeStatus: derivativeStatus = '',
      videoProxyStatus: videoProxyStatus = '',
      fileName: fileName = '',
      createdAt: createdAt = now(),
      expectedProjectId: expectedProjectId = '',
      expectedShotRevision: expectedShotRevision = '',
    } = {}) => {
      if (_0x54bf0d) return null;
      const _0x48553a = _0x3029cc(),
        _0x1d61d1 = normalizeText(shotId),
        _0xd059d7 = normalizeText(videoRef),
        _0x575c48 = normalizeText(playbackVideoRef) || _0xd059d7;
      if (
        !normalizeText(expectedProjectId) ||
        normalizeText(_0x48553a?.['id']) !== normalizeText(expectedProjectId)
      )
        return null;
      const _0x3930d5 = _0x48553a?.['shots']?.['find'](
        (_0xb2ff5a) => normalizeText(_0xb2ff5a?.['id']) === _0x1d61d1,
      );
      if (!_0x3930d5 || !_0xd059d7) return null;
      if (
        !normalizeText(expectedShotRevision) ||
        createPersonReplacementVideoGenerationRevision({ project: _0x48553a, shot: _0x3930d5 }) !==
          normalizeText(expectedShotRevision)
      )
        return null;
      const _0xaeb05f = appendPersonReplacementVideoResults(_0x3930d5, [
          {
            videoUrl: _0xd059d7,
            localPath: _0xd059d7,
            ...(_0x575c48 !== _0xd059d7 ? { displayLocalPath: _0x575c48 } : {}),
            ...(normalizeText(posterRef)
              ? { thumbnailUrl: normalizeText(posterRef), posterLocalPath: normalizeText(posterRef) }
              : {}),
            ...(normalizeText(assetId) ? { assetId: normalizeText(assetId) } : {}),
            ...(normalizeText(derivativeStatus) ? { derivativeStatus: normalizeText(derivativeStatus) } : {}),
            ...(normalizeText(videoProxyStatus) ? { videoProxyStatus: normalizeText(videoProxyStatus) } : {}),
            source: 'upload',
            fileName: normalizeText(fileName) || '上传替换视频',
            createdAt: createdAt,
          },
        ]),
        _0x2f26d8 = resolvePersonReplacementVideoResultRef(_0xaeb05f['results'][_0xaeb05f['activeIndex']]);
      return _0x3f51ba(
        transitionPersonReplacementOutput(
          {
            ..._0x48553a,
            shots: _0x48553a['shots']['map']((_0x3ee565) =>
              normalizeText(_0x3ee565?.['id']) === _0x1d61d1
                ? {
                    ..._0x3ee565,
                    replacementVideo: _0xaeb05f,
                    resultVideoRef: _0x2f26d8,
                    generationStatus: 'succeeded',
                    error: '',
                  }
                : _0x3ee565,
            ),
            workspace: { ..._0x48553a['workspace'], selectedShotId: _0x1d61d1 },
          },
          { type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'] },
        ),
      );
    },
    _0x56b34f = (
      { projectId: _0x3ef5ba, shotId: _0x3e6030, requestId: _0x492a91, revision: _0x4036ea },
      _0x5e7294 = {},
      { persistIdentity: persistIdentity = ![] } = {},
    ) => {
      if (!_0x1c370b({ projectId: _0x3ef5ba, shotId: _0x3e6030, requestId: _0x492a91, revision: _0x4036ea }))
        return ![];
      const _0x274377 = _0x560713(_0x3ef5ba),
        _0x5453ba = _0x274377['workspace']?.['videoGenerationsByShotId']?.[_0x3e6030] || {},
        _0x42a55c = { ..._0x5453ba, ..._0x5e7294, shotId: _0x3e6030, requestId: _0x492a91 },
        _0x14dad0 =
          Object['keys'](_0x42a55c)['some'](
            (_0x2df525) => !Object['is'](_0x42a55c[_0x2df525], _0x5453ba[_0x2df525]),
          ) || Object['keys'](_0x5453ba)['some']((_0x5ea62a) => !Object['hasOwn'](_0x42a55c, _0x5ea62a));
      if (!_0x14dad0) return !![];
      return (
        _0x3f51ba({
          ..._0x274377,
          shots: _0x274377['shots']['map']((_0x2e3c42) =>
            _0x2e3c42['id'] === _0x3e6030
              ? {
                  ..._0x2e3c42,
                  generationStatus:
                    _0x42a55c['status'] === 'failed'
                      ? 'failed'
                      : _0x42a55c['status'] === 'succeeded'
                        ? 'succeeded'
                        : 'running',
                  ...(_0x42a55c['status'] === 'failed' ? { error: normalizeText(_0x42a55c['error']) } : {}),
                }
              : _0x2e3c42,
          ),
          workspace: updatePersonReplacementVideoGenerationState(_0x274377['workspace'], _0x42a55c),
        }),
        persistIdentity &&
          normalizeText(_0x42a55c['taskId']) &&
          hasPersonReplacementGenerationTaskIdentityChanged(_0x5453ba, _0x42a55c) &&
          void Promise['resolve'](persistNow())['catch'](() => {}),
        !![]
      );
    },
    _0x1c370b = ({ projectId: _0x1d1d82, shotId: _0x1ccacd, requestId: _0x24c056, revision: _0x16efd3 }) => {
      if (_0x54bf0d) return ![];
      const _0x1e1d5e = _0x560713(_0x1d1d82);
      if (normalizeText(_0x1e1d5e?.['id']) !== _0x1d1d82) return ![];
      const _0x4ff1ee = _0x1e1d5e?.['shots']?.['find'](
        (_0x5182c9) => normalizeText(_0x5182c9?.['id']) === _0x1ccacd,
      );
      if (!_0x4ff1ee) return ![];
      const _0xc4a4a9 = _0x1e1d5e['workspace']?.['videoGenerationsByShotId']?.[_0x1ccacd];
      if (normalizeText(_0xc4a4a9?.['requestId']) !== _0x24c056) return ![];
      return (
        createPersonReplacementVideoGenerationRevision({ project: _0x1e1d5e, shot: _0x4ff1ee }) === _0x16efd3
      );
    },
    _0x1837f9 = ({ projectId: _0x12814d, shotId: _0x355bf2, requestId: _0x20f719 }) => {
      if (_0x54bf0d) return ![];
      const _0x5f4480 = _0x560713(_0x12814d);
      if (normalizeText(_0x5f4480?.['id']) !== _0x12814d) return ![];
      const _0x2bd9e0 = _0x5f4480['workspace']?.['videoGenerationsByShotId']?.[_0x355bf2];
      if (
        normalizeText(_0x2bd9e0?.['requestId']) !== _0x20f719 ||
        !['queued', 'submitting', 'running']['includes'](
          normalizeText(_0x2bd9e0?.['status'])['toLowerCase'](),
        )
      )
        return ![];
      return (
        _0x3f51ba({
          ..._0x5f4480,
          shots: _0x5f4480['shots']['map']((_0x405a9c) =>
            _0x405a9c['id'] === _0x355bf2 && _0x405a9c['generationStatus'] === 'running'
              ? { ..._0x405a9c, generationStatus: 'pending' }
              : _0x405a9c,
          ),
          workspace: updatePersonReplacementVideoGenerationState(_0x5f4480['workspace'], {
            status: 'idle',
            shotId: _0x355bf2,
            error: '',
          }),
        }),
        !![]
      );
    },
    _0x5a93c7 = (_0x43e6a5 = '') => ({
      ok: ![],
      stale: !![],
      failures: [],
      project: cloneJson(_0x560713(_0x43e6a5)),
    }),
    _0x437828 = () => {
      if (_0x1b7c14) return _0x1b7c14;
      return (
        (_0x1b7c14 = (async () => {
          while (_0x4da584['length']) {
            const _0x3f5aaa = _0x4da584['shift']();
            _0x25c3a7 = _0x3f5aaa['projectId'];
            if (_0x54bf0d || !_0x560713(_0x3f5aaa['projectId'])) {
              (_0x3f5aaa['resolve'](_0x5a93c7(_0x3f5aaa['projectId'])), (_0x25c3a7 = ''));
              continue;
            }
            try {
              const _0x59d4ca =
                typeof _0xeb8c5c === 'function'
                  ? await _0xeb8c5c({
                      projectId: _0x3f5aaa['projectId'],
                      shotIds: _0x3f5aaa['prepareAll'] ? null : [..._0x3f5aaa['shotIds']],
                      notify: _0x3f5aaa['notify'],
                      renderWorkspace: _0x3f5aaa['renderWorkspace'],
                    })
                  : { ok: !![], failures: [], project: cloneJson(_0x560713(_0x3f5aaa['projectId'])) };
              _0x3f5aaa['resolve'](_0x54bf0d ? _0x5a93c7(_0x3f5aaa['projectId']) : _0x59d4ca);
            } catch (_0x3c0d5e) {
              _0x3f5aaa['reject'](_0x3c0d5e);
            } finally {
              _0x25c3a7 === _0x3f5aaa['projectId'] && (_0x25c3a7 = '');
            }
          }
        })()['finally'](() => {
          _0x1b7c14 = null;
        })),
        _0x1b7c14
      );
    },
    _0x9161bd = (_0x153ccb = {}) => {
      if (_0x54bf0d) return Promise['resolve'](_0x5a93c7(_0x153ccb?.['projectId']));
      const _0x4f26bf = normalizeText(_0x153ccb?.['projectId'] || _0x3029cc()?.['id']),
        _0x36c0da = Array['isArray'](_0x153ccb?.['shotIds'])
          ? _0x153ccb['shotIds']['map'](normalizeText)['filter'](Boolean)
          : [],
        _0xdb4ba6 = _0x4da584['at'](-0x1);
      if (_0xdb4ba6 && _0xdb4ba6['projectId'] === _0x4f26bf) {
        if (!_0x36c0da['length']) _0xdb4ba6['prepareAll'] = !![];
        (_0x36c0da['forEach']((_0xa50f17) => _0xdb4ba6['shotIds']['add'](_0xa50f17)),
          (_0xdb4ba6['notify'] = _0xdb4ba6['notify'] || _0x153ccb?.['notify'] !== ![]),
          (_0xdb4ba6['renderWorkspace'] =
            _0xdb4ba6['renderWorkspace'] || _0x153ccb?.['renderWorkspace'] !== ![]));
        const _0x3b5220 = new Promise((_0x1cbe69, _0x21b066) => {
          _0xdb4ba6['listeners']['push']({ resolve: _0x1cbe69, reject: _0x21b066 });
        });
        return (_0x437828(), _0x3b5220);
      }
      let _0x3ce879, _0x10922a;
      const _0x4f54e9 = new Promise((_0x190b2d, _0x584f1e) => {
          ((_0x3ce879 = _0x190b2d), (_0x10922a = _0x584f1e));
        }),
        _0x257348 = {
          projectId: _0x4f26bf,
          prepareAll: !_0x36c0da['length'],
          shotIds: new Set(_0x36c0da),
          notify: _0x153ccb?.['notify'] !== ![],
          renderWorkspace: _0x153ccb?.['renderWorkspace'] !== ![],
          listeners: [],
          resolve(_0x490b61) {
            (_0x3ce879(_0x490b61),
              this['listeners']['forEach']((_0x4a9d2b) => _0x4a9d2b['resolve'](_0x490b61)));
          },
          reject(_0x1fe25c) {
            (_0x10922a(_0x1fe25c),
              this['listeners']['forEach']((_0x27668a) => _0x27668a['reject'](_0x1fe25c)));
          },
        };
      return (_0x4da584['push'](_0x257348), _0x437828(), _0x4f54e9);
    },
    _0x423c47 = async ({
      projectId: _0x2a8d73 = '',
      shotId: _0x4b3d99,
      notifyCompletion: notifyCompletion = !![],
      recoveryTask: recoveryTask = null,
    } = {}) => {
      const _0x393ecc = normalizeText(_0x4b3d99);
      let _0x439eda = _0x560713(_0x2a8d73),
        _0x2271d0 = _0x439eda?.['shots']?.['find'](
          (_0x3699d8) => normalizeText(_0x3699d8?.['id']) === _0x393ecc,
        );
      if (!_0x2271d0 || _0x54bf0d) return null;
      const _0x539098 = getRecoverablePersonReplacementVideoTask(
          _0x439eda['workspace']?.['videoGenerationsByShotId']?.[_0x393ecc],
        ),
        _0x1061d5 = recoveryTask ? { ..._0x539098, ...recoveryTask } : null;
      if (!_0x1061d5 && _0x539098) return null;
      let _0x550b84 = resolvePersonReplacementVideoImageInput(_0x439eda, _0x2271d0);
      if (_0x550b84['status'] !== 'ready')
        return (showToast(resolveImageInputWarning(_0x550b84), 'warn'), null);
      let _0x504de0 = resolvePersonReplacementVideoSlotState(_0x439eda, _0x2271d0);
      if (!_0x504de0['slotEntries']['sourceVideo']?.['url']) {
        const _0x2b8bc9 = await _0x9161bd({ projectId: _0x439eda?.['id'], shotIds: [_0x393ecc] });
        if (_0x2b8bc9?.['stale'] || _0x54bf0d) return { ok: ![], stale: !![], shotId: _0x393ecc };
        ((_0x439eda = _0x560713(_0x439eda?.['id'])),
          (_0x2271d0 = _0x439eda?.['shots']?.['find'](
            (_0x596236) => normalizeText(_0x596236?.['id']) === _0x393ecc,
          )),
          (_0x504de0 = resolvePersonReplacementVideoSlotState(_0x439eda, _0x2271d0)));
      }
      if (!_0x504de0['slotEntries']['sourceVideo']?.['url'])
        return (showToast(_0x2271d0?.['error'] || '对应镜头尚未完成切片。', 'warn'), null);
      _0x550b84 = resolvePersonReplacementVideoImageInput(_0x439eda, _0x2271d0);
      if (_0x550b84['status'] !== 'ready')
        return (showToast(_0x550b84['message'] || '当前图片入参不可用。', 'warn'), null);
      if (_0x1061d5 ? typeof resumeReplacementVideo !== 'function' : typeof _0x3bd20b !== 'function')
        return (showToast('视频生成服务尚未初始化。', 'error'), null);
      const _0x25c023 = normalizeText(_0x439eda?.['id']),
        _0x38c782 = _0x25c023 + ':video:' + _0x393ecc;
      if (_0xc12455['has'](_0x38c782)) return null;
      const _0x418033 = normalizeText(_0x1061d5?.['requestId']) || normalizeText(createId()),
        _0x44d7d6 = createPersonReplacementVideoGenerationRevision({
          project: _0x439eda,
          shot: _0x2271d0,
          imageInput: _0x550b84,
        }),
        _0x41af71 =
          normalizeText(_0x1061d5?.['modelId']) ||
          _0x439eda['settings']['replacementModelId'] ||
          PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
        _0x7a9fdb =
          resolveModelExecution(_0x41af71) ||
          resolveModelExecution(_0x41af71, { providerHint: _0x1061d5?.['provider'] }),
        _0x14049b =
          normalizeText(_0x1061d5?.['provider']) ||
          normalizeText(_0x7a9fdb?.['modelManifest']?.['provider']) ||
          resolveModelProvider(_0x41af71),
        _0x414ce0 =
          normalizeText(_0x1061d5?.['providerProfileId']) ||
          normalizeText(_0x439eda['settings']['replacementVideoProviderProfileId']),
        _0x539956 =
          normalizeText(_0x1061d5?.['executionId']) ||
          normalizeText(_0x7a9fdb?.['executionManifest']?.['id']),
        _0x24fd4f = Number(_0x1061d5?.['startedAt']) || Date['now'](),
        _0x28122d = new AbortController(),
        _0x23b314 = {
          projectId: _0x25c023,
          shotId: _0x393ecc,
          requestId: _0x418033,
          revision: _0x44d7d6,
          abortController: _0x28122d,
          taskId: normalizeText(_0x1061d5?.['taskId']),
        };
      (_0xc12455['set'](_0x38c782, _0x23b314),
        _0x3f51ba({
          ..._0x439eda,
          workspace: updatePersonReplacementVideoGenerationState(_0x439eda['workspace'], {
            status: _0x1061d5 ? 'running' : 'submitting',
            shotId: _0x393ecc,
            requestId: _0x418033,
            taskId: normalizeText(_0x1061d5?.['taskId']),
            modelId: _0x41af71,
            provider: _0x14049b,
            providerProfileId: _0x414ce0,
            executionId: _0x539956,
            startedAt: _0x24fd4f,
            useOpenapiQuery: _0x1061d5?.['useOpenapiQuery'] === !![],
            error: '',
          }),
          shots: _0x439eda['shots']['map']((_0x2c09ac) =>
            _0x2c09ac['id'] === _0x393ecc ? { ..._0x2c09ac, generationStatus: 'running' } : _0x2c09ac,
          ),
        }));
      try {
        const _0x3d791d = await resolveInstallId(_0x41af71);
        if (
          !_0x1c370b({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033, revision: _0x44d7d6 })
        )
          return (
            _0x1837f9({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033 }),
            { ok: ![], stale: !![], shotId: _0x393ecc }
          );
        const _0x201aa7 = buildPersonReplacementVideoRequest({
            currentProject: _0x439eda,
            shot: _0x2271d0,
            modelId: _0x41af71,
            provider: _0x14049b,
            providerProfileId: _0x414ce0,
            resolvedExecution: _0x7a9fdb,
            installId: _0x3d791d,
            imageInput: _0x550b84,
            slotState: _0x504de0,
          }),
          _0x4af7d3 = (_0x540e63, _0x38bc5e = {}) => {
            const _0x1de8a8 =
                _0x560713(_0x25c023)?.['workspace']?.['videoGenerationsByShotId']?.[_0x393ecc] || {},
              _0x670534 = projectPersonReplacementGenerationTaskIdentity({
                taskId: _0x540e63,
                meta: _0x38bc5e,
                defaults: {
                  modelId: _0x41af71,
                  provider: _0x14049b,
                  providerProfileId: _0x414ce0,
                  executionId: _0x539956,
                  startedAt: _0x24fd4f,
                  ..._0x1de8a8,
                },
              });
            if (!_0x670534['taskId']) return;
            ((_0x23b314['taskId'] = _0x670534['taskId']),
              _0x56b34f(
                _0x23b314,
                { status: 'running', ..._0x670534, error: '' },
                { persistIdentity: !![] },
              ));
          },
          _0x55e1fd = {
            signal: _0x28122d['signal'],
            useOpenapiQuery: _0x1061d5?.['useOpenapiQuery'] === !![],
            onTaskId: (_0x51e592) => _0x4af7d3(_0x51e592),
            onTaskMeta: (_0x55d5b3 = {}) => _0x4af7d3(_0x55d5b3['taskId'], _0x55d5b3),
            onRunningHubWorkflowQueueChange: (_0x36b0f5 = {}) => {
              const _0x7f00b5 =
                normalizeText(_0x36b0f5['status'])['toLowerCase']() === 'queued' ? 'queued' : 'running';
              _0x56b34f(_0x23b314, { status: _0x7f00b5, error: '' });
            },
          },
          _0x36eb0b = _0x1061d5
            ? await resumeReplacementVideo(_0x1061d5['taskId'], _0x201aa7, _0x55e1fd)
            : await _0x3bd20b(_0x201aa7, _0x55e1fd);
        if (
          !_0x1c370b({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033, revision: _0x44d7d6 })
        )
          return (
            _0x1837f9({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033 }),
            { ok: ![], stale: !![], shotId: _0x393ecc }
          );
        const _0x2f0cdd = now(),
          _0x2ff9dc = getSuccessfulVideoGenerationItems(_0x36eb0b),
          _0x3cec39 = _0x2ff9dc['map']((_0x6f5de0) => ({
            ..._0x6f5de0,
            localPath: resolveLocalVideoResultRef(_0x6f5de0),
            createdAt: normalizeText(_0x6f5de0?.['createdAt']) || _0x2f0cdd,
          }))['filter']((_0x16bffa) => _0x16bffa['localPath']);
        if (!_0x3cec39['length'])
          throw new Error(
            _0x2ff9dc['map']((_0x4a0d09) =>
              normalizeText(_0x4a0d09?.['localSaveError'] || _0x4a0d09?.['saveError']),
            )['find'](Boolean) ||
              getVideoGenerationResultError(_0x36eb0b) ||
              '视频生成结果缺少可用地址',
          );
        const _0x18f486 = _0x560713(_0x25c023),
          _0x56d8c4 = _0x18f486['shots']['find']((_0x150dc5) => _0x150dc5['id'] === _0x393ecc),
          _0x107afd = appendPersonReplacementVideoResults(_0x56d8c4, _0x3cec39),
          _0x2b682c = resolvePersonReplacementVideoResultRef(_0x107afd['results'][_0x107afd['activeIndex']]),
          _0x57a803 = {
            ..._0x18f486,
            shots: _0x18f486['shots']['map']((_0x3d90d8) =>
              _0x3d90d8['id'] === _0x393ecc
                ? {
                    ..._0x3d90d8,
                    replacementVideo: _0x107afd,
                    resultVideoRef: _0x2b682c,
                    generationStatus: 'succeeded',
                    error: '',
                  }
                : _0x3d90d8,
            ),
            workspace: updatePersonReplacementVideoGenerationState(_0x18f486['workspace'], {
              status: 'succeeded',
              shotId: _0x393ecc,
              requestId: _0x418033,
              error: '',
            }),
          };
        _0x3f51ba(
          transitionPersonReplacementOutput(_0x57a803, {
            type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'],
          }),
        );
        let _0x16d004 = !![];
        try {
          await persistNow();
        } catch {
          _0x16d004 = ![];
        }
        if (
          !_0x1c370b({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033, revision: _0x44d7d6 })
        )
          return (
            _0x1837f9({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033 }),
            { ok: ![], stale: !![], shotId: _0x393ecc }
          );
        return (
          (!_0x16d004 || notifyCompletion === ![]) &&
            showToast(
              _0x16d004 ? '视频替换已生成。' : '视频替换已生成，项目数据正在重试保存，请暂时不要刷新。',
              _0x16d004 ? 'success' : 'warn',
            ),
          notifyCompletion !== ![] &&
            notifyGenerationCompleted({ kind: 'video', mediaRef: _0x2b682c, projectId: _0x25c023 }),
          { project: cloneJson(_0x560713(_0x25c023)), ok: !![], shotId: _0x393ecc }
        );
      } catch (_0x10e9c4) {
        if (
          !_0x1c370b({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033, revision: _0x44d7d6 })
        )
          return (
            _0x1837f9({ projectId: _0x25c023, shotId: _0x393ecc, requestId: _0x418033 }),
            { ok: ![], stale: !![], shotId: _0x393ecc }
          );
        const _0x4ee93c = _0x10e9c4?.['getUserMessage']?.() || _0x10e9c4?.['message'] || '视频替换生成失败',
          _0x54a7ab = _0x560713(_0x25c023),
          _0x3d0aa8 = _0x3f51ba({
            ..._0x54a7ab,
            shots: _0x54a7ab['shots']['map']((_0x4fbfd2) =>
              _0x4fbfd2['id'] === _0x393ecc
                ? { ..._0x4fbfd2, generationStatus: 'failed', error: _0x4ee93c }
                : _0x4fbfd2,
            ),
            workspace: updatePersonReplacementVideoGenerationState(_0x54a7ab['workspace'], {
              status: 'failed',
              shotId: _0x393ecc,
              requestId: _0x418033,
              error: _0x4ee93c,
            }),
          });
        return { project: cloneJson(_0x3d0aa8), ok: ![], shotId: _0x393ecc, error: _0x4ee93c };
      } finally {
        _0xc12455['get'](_0x38c782)?.['requestId'] === _0x418033 && _0xc12455['delete'](_0x38c782);
      }
    },
    _0x1548e0 = async ({
      projectId: _0x3ab7f9 = '',
      shotId: _0x4def2a,
      notifyCompletion: notifyCompletion = !![],
    } = {}) => {
      const _0x263e6c = normalizeText(_0x4def2a),
        _0x197664 = _0x560713(_0x3ab7f9),
        _0x34785a = getRecoverablePersonReplacementVideoTask(
          _0x197664?.['workspace']?.['videoGenerationsByShotId']?.[_0x263e6c],
        );
      if (!_0x34785a || _0x54bf0d) return null;
      return _0x423c47({
        projectId: _0x197664?.['id'],
        shotId: _0x263e6c,
        notifyCompletion: notifyCompletion,
        recoveryTask: _0x34785a,
      });
    },
    _0x503a1b = async ({ projectId: _0x11a392 = '', shotId: _0x130e6b } = {}) => {
      const _0x1051f2 = normalizeText(_0x130e6b),
        _0x460195 = _0x560713(_0x11a392),
        _0x58ded7 = _0x460195?.['shots']?.['find'](
          (_0x426318) => normalizeText(_0x426318?.['id']) === _0x1051f2,
        ),
        _0xb77be6 = resolvePersonReplacementVideoGenerationState(_0x460195?.['workspace'], _0x1051f2);
      if (!_0x58ded7 || _0x54bf0d || !isPersonReplacementVideoGenerationActive(_0xb77be6)) return null;
      const _0x5a9cf2 = normalizeText(_0x460195['id']) + ':video:' + _0x1051f2,
        _0x1f35d8 = _0xc12455['get'](_0x5a9cf2),
        _0x33ded5 = normalizeText(_0xb77be6['requestId']),
        _0x26cd11 =
          _0x1f35d8 && (!_0x33ded5 || normalizeText(_0x1f35d8['requestId']) === _0x33ded5) ? _0x1f35d8 : null,
        _0x435cfb = normalizeText(_0xb77be6['taskId'] || _0x26cd11?.['taskId']),
        _0x18d4aa = normalizeText(
          _0xb77be6['providerProfileId'] || _0x460195['settings']?.['replacementVideoProviderProfileId'],
        ),
        _0x216228 = Boolean(
          normalizeText(_0x58ded7['resultVideoRef']) ||
          (Array['isArray'](_0x58ded7['replacementVideo']?.['results']) &&
            _0x58ded7['replacementVideo']['results']['length']),
        );
      _0x3f51ba({
        ..._0x460195,
        shots: _0x460195['shots']['map']((_0x32c758) =>
          _0x32c758['id'] === _0x1051f2
            ? { ..._0x32c758, generationStatus: _0x216228 ? 'succeeded' : 'pending', error: '' }
            : _0x32c758,
        ),
        workspace: updatePersonReplacementVideoGenerationState(_0x460195['workspace'], {
          status: 'idle',
          shotId: _0x1051f2,
          error: '',
        }),
      });
      _0x26cd11 && (_0xc12455['delete'](_0x5a9cf2), _0x26cd11['abortController']?.['abort']?.());
      let _0x28e894 = !_0x435cfb;
      if (_0x435cfb && typeof cancelReplacementVideo === 'function')
        try {
          (await cancelReplacementVideo({
            taskId: _0x435cfb,
            providerProfileId: _0x18d4aa,
            modelId: normalizeText(_0xb77be6['modelId']),
            provider: normalizeText(_0xb77be6['provider']),
          }),
            (_0x28e894 = !![]));
        } catch (_0x20a4cc) {
          const _0x580bfd =
            normalizeText(_0x20a4cc?.['getUserMessage']?.() || _0x20a4cc?.['message']) ||
            'RunningHub 远端任务取消失败';
          showToast('已停止本地等待，但' + _0x580bfd, 'warn');
        }
      if (_0x28e894) showToast('视频替换已取消。', 'info');
      return { ok: !![], shotId: _0x1051f2, taskId: _0x435cfb, remoteCancelled: _0x28e894 };
    },
    _0x2233ec = async () => {
      if (_0x54bf0d) return [];
      const _0x3651c9 = _0x3029cc(),
        _0x3018c8 = normalizeText(_0x3651c9?.['id']),
        _0x274468 = Object['entries'](_0x3651c9?.['workspace']?.['videoGenerationsByShotId'] || {})[
          'flatMap'
        ](([_0x492e38, _0x4a4570]) =>
          getRecoverablePersonReplacementVideoTask(_0x4a4570) ? [normalizeText(_0x492e38)] : [],
        ),
        _0x38ab6e = await Promise['allSettled'](
          _0x274468['map']((_0x1184f8) => _0x1548e0({ shotId: _0x1184f8 })),
        );
      if (_0x54bf0d || !_0x560713(_0x3018c8)) return [];
      return _0x38ab6e;
    };
  return {
    acceptUploadedResult: _0x5f4cdc,
    prepare: _0x9161bd,
    generate: _0x423c47,
    cancel: _0x503a1b,
    resume: _0x1548e0,
    resumeRecoverable: _0x2233ec,
    hasActiveTasks: () => Boolean(_0x1b7c14 || _0x4da584['length'] || _0xc12455['size']),
    getActiveGenerationCount: () => _0xc12455['size'],
    hasActiveTasksForProject: (_0x4cc0da) => {
      const _0x54b729 = normalizeText(_0x4cc0da);
      if (!_0x54b729) return ![];
      return (
        _0x4da584['some']((_0x1a0212) => _0x1a0212['projectId'] === _0x54b729) ||
        _0x25c3a7 === _0x54b729 ||
        [..._0xc12455['values']()]['some']((_0x6a2b42) => _0x6a2b42['projectId'] === _0x54b729)
      );
    },
    destroy: () => {
      if (_0x54bf0d) return;
      (_0xc12455['forEach']((_0x45baae) => {
        (_0x45baae['abortController']?.['abort']?.(),
          !normalizeText(_0x45baae['taskId']) && _0x1837f9(_0x45baae));
      }),
        _0xc12455['clear'](),
        _0x4da584['splice'](0x0)['forEach']((_0x12ca8e) => {
          _0x12ca8e['resolve'](_0x5a93c7());
        }),
        (_0x54bf0d = !![]));
    },
  };
}
