import {
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { buildCharacterAssetImageGenerationPayload } from '../characterAssets/characterAssetImageGeneration.js';
import { PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID } from './personReplacementProject.js';
import { resolveModelExecution } from '../../manifests/index.js';
import { buildPersonReplacementImageGate } from './personReplacementImageGate.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { applyPersonReplacementPromptEnhancement } from './personReplacementPromptEnhancement.js';
import {
  appendPersonReplacementImageResult,
  createPersonReplacementImageGenerationMappingRevision,
  createPersonReplacementImageGenerationRequestRevision,
  getRecoverablePersonReplacementImageTask,
  resolvePersonReplacementImageGenerationParams,
  resolvePersonReplacementImageGenerationState,
  updatePersonReplacementImageGenerationState,
} from './personReplacementImageGeneration.js';
import {
  hasPersonReplacementGenerationTaskIdentityChanged,
  projectPersonReplacementGenerationTaskIdentity,
} from './personReplacementGenerationTaskIdentity.js';
import {
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from '../../../api/aiImageApi.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import {
  compileSourceDescriptions,
  sourceDescriptionIdentity,
  usesSourceDescriptions,
} from './personReplacementSourceDescriptions.js';
import { composePersonReplacementImagePrompt } from './personReplacementPromptMode.js';
import {
  buildPersonReplacementLocationGuide,
  applyPersonReplacementLocationGuide,
} from './personReplacementLocationGuide.js';
import {
  buildPersonReplacementAnnotatedSource,
  applyPersonReplacementAnnotatedSource,
} from './personReplacementAnnotatedSource.js';
function normalizeText(_0x42096f) {
  return String(_0x42096f ?? '')['trim']();
}
function resolveGeneratedImages(_0x2df08f) {
  const _0x47ddca = normalizeImageGenerationResult(_0x2df08f),
    _0x184ecb = getSuccessfulImageGenerationItems(_0x47ddca)
      ['map']((_0x580e26) => ({
        ..._0x580e26,
        localPath:
          [
            _0x580e26['localPath'],
            _0x580e26['originalLocalPath'],
            _0x580e26['displayLocalPath'],
            _0x580e26['imageUrl'],
            _0x580e26['url'],
          ]
            ['map'](normalizeLocalPath)
            ['find'](Boolean) || '',
      }))
      ['filter']((_0x1b7597) => _0x1b7597['localPath']);
  if (!_0x184ecb['length'])
    throw new Error(
      normalizeText(_0x47ddca['items'][0x0]?.['localSaveError'] || _0x47ddca?.['localSaveError']) ||
        getImageGenerationResultError(_0x47ddca) ||
        '图像生成结果缺少可用图片',
    );
  return _0x184ecb;
}
function resolveDefaultPromptRequest({ shot: _0x49b284, promptPackage: _0xcff728 }) {
  const _0x27f4f0 = normalizeText(_0x49b284?.['imagePrompt']);
  return {
    savedPrompt: _0x27f4f0,
    requestPrompt: composePersonReplacementImagePrompt(_0xcff728, _0x27f4f0),
    promptAssetRefs: [],
  };
}
async function resumePersonReplacementImageTask(_0x1f4d5e, _0x51b45a, _0x3175a0 = {}) {
  const _0x98dece =
      resolveModelExecution(_0x51b45a?.['model']) ||
      resolveModelExecution(_0x51b45a?.['model'], { providerHint: _0x51b45a?.['provider'] }),
    _0xb97ac = normalizeText(_0x98dece?.['modelManifest']?.['provider'] || _0x51b45a?.['provider']);
  if (_0xb97ac === 'dreamina') return resumeDreaminaImageTask(_0x1f4d5e, _0x51b45a, _0x3175a0);
  if (
    _0xb97ac === 'runninghub' ||
    _0xb97ac === 'runninghubwf' ||
    _0x98dece?.['executionManifest']?.['adapterType'] === 'workflow'
  )
    return resumeRunningHubImageTask(_0x1f4d5e, _0x51b45a, _0x3175a0);
  return resumeAsyncImageTask(_0x1f4d5e, _0x51b45a, _0x3175a0);
}
export function createPersonReplacementImageTaskRuntime({
  getProject: _0x397ed7,
  getProjectById: getProjectById = null,
  commitProject: _0x444fbf,
  commitProjectById: commitProjectById = null,
  generateImage: _0xeaf778,
  enhancePrompt: enhancePrompt = null,
  createLocationGuide: createLocationGuide = buildPersonReplacementLocationGuide,
  createAnnotatedSource: createAnnotatedSource = buildPersonReplacementAnnotatedSource,
  getPromptEnhancementModel: getPromptEnhancementModel = () => ({}),
  resumeImageTask: resumeImageTask = resumePersonReplacementImageTask,
  createRequestId: createRequestId = () => globalThis['crypto']?.['randomUUID']?.() || '' + Date['now'](),
  showToast: showToast = () => {},
  resolvePromptRequest: resolvePromptRequest = resolveDefaultPromptRequest,
  now: now = () => new Date()['toISOString'](),
  notifyCompletion: notifyCompletion = () => {},
  persistNow: persistNow = () => Promise['resolve'](null),
} = {}) {
  const _0x3805cf = new Map(),
    _0x162f67 = new Map();
  let _0x24ed12 = ![];
  const _0x2f4d03 = (_0x2eaecf = '') => {
      const _0x1a8a18 = normalizeText(_0x2eaecf);
      return _0x1a8a18 && typeof getProjectById === 'function' ? getProjectById(_0x1a8a18) : _0x397ed7?.();
    },
    _0x5c4dfc = (_0x10f5bc) =>
      typeof commitProjectById === 'function'
        ? commitProjectById(_0x10f5bc?.['id'], _0x10f5bc)
        : _0x444fbf?.(_0x10f5bc),
    _0x4a054e = ({
      currentProject: _0x143871,
      projectId: _0x2fe125,
      shotId: _0x3981f8,
      requestId: _0x5c6bcf,
    }) => {
      if (_0x24ed12 || _0x143871?.['id'] !== _0x2fe125) return null;
      const _0x47d0b0 = resolvePersonReplacementImageGenerationState(_0x143871['workspace'], _0x3981f8);
      if (_0x47d0b0['requestId'] !== _0x5c6bcf) return null;
      const _0x4f71ee = _0x5c4dfc({
        ..._0x143871,
        workspace: updatePersonReplacementImageGenerationState(_0x143871['workspace'], {
          status: 'idle',
          shotId: _0x3981f8,
          error: '',
        }),
      });
      return (
        showToast('生成期间检测框或生成设置已变化，旧结果未应用，请重新生成。', 'warn'),
        { project: _0x4f71ee, ok: ![], stale: !![], shotId: _0x3981f8 }
      );
    },
    _0x36f5e9 = ({
      shotId: shotId = '',
      imageRef: imageRef = '',
      fileName: fileName = '',
      createdAt: createdAt = now(),
      expectedProjectId: expectedProjectId = '',
      expectedShotRevision: expectedShotRevision = '',
    } = {}) => {
      if (_0x24ed12) return null;
      const _0x4176ab = _0x397ed7?.(),
        _0x54858d = normalizeText(shotId),
        _0x16a4f5 = normalizeText(imageRef),
        _0x2a9d32 = normalizeText(expectedProjectId),
        _0x305d61 = normalizeText(expectedShotRevision);
      if (!_0x2a9d32 || _0x4176ab?.['id'] !== _0x2a9d32) return null;
      const _0x1ffc35 = _0x4176ab?.['shots']?.['find']?.((_0x497b83) => _0x497b83['id'] === _0x54858d);
      if (!_0x1ffc35 || !_0x16a4f5) return null;
      if (
        !_0x305d61 ||
        createPersonReplacementImageGenerationMappingRevision({ project: _0x4176ab, shot: _0x1ffc35 }) !==
          _0x305d61
      )
        return null;
      const _0x5819e5 = appendPersonReplacementImageResult(_0x1ffc35, {
        imageUrl: _0x16a4f5,
        source: 'upload',
        fileName: normalizeText(fileName) || '上传替换图片',
        userPrompt: normalizeText(_0x1ffc35['imagePrompt']),
        createdAt: createdAt,
      });
      return _0x444fbf?.({
        ..._0x4176ab,
        shots: _0x4176ab['shots']['map']((_0x46f378) =>
          _0x46f378['id'] === _0x54858d
            ? { ..._0x46f378, replacementImage: _0x5819e5, replacementImageRef: _0x16a4f5, error: '' }
            : _0x46f378,
        ),
        workspace: { ..._0x4176ab['workspace'], selectedShotId: _0x54858d },
      });
    },
    _0x3504d2 = ({
      project: _0x59ef9c,
      shot: _0x3a7d9e,
      promptPackage: promptPackage = buildPersonReplacementPromptPackage({
        project: _0x59ef9c,
        shot: _0x3a7d9e,
      }),
      promptEnhancement: promptEnhancement = null,
      sourceImageSize: _0x4e23af,
      taskIdentity: taskIdentity = {},
    }) => {
      const _0x35ca26 = promptEnhancement
          ? applyPersonReplacementPromptEnhancement(promptPackage, promptEnhancement)
          : promptPackage,
        {
          savedPrompt: savedPrompt = '',
          requestPrompt: requestPrompt = _0x35ca26['prompt'],
          promptAssetRefs: promptAssetRefs = [],
        } = resolvePromptRequest({ project: _0x59ef9c, shot: _0x3a7d9e, promptPackage: _0x35ca26 }) || {},
        _0x3cc450 =
          normalizeText(taskIdentity['modelId']) ||
          _0x59ef9c['settings']?.['replacementImageModelId'] ||
          PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
        _0x82b31d = resolvePersonReplacementImageGenerationParams({
          modelId: _0x3cc450,
          provider:
            normalizeText(taskIdentity['provider']) || _0x59ef9c['settings']?.['replacementImageProvider'],
          generationParams: _0x59ef9c['settings']?.['replacementImageGenerationParams'],
          sourceImageSize: _0x4e23af,
          shot: _0x3a7d9e,
        }),
        _0x4fd50d = buildCharacterAssetImageGenerationPayload({
          prompt: requestPrompt,
          modelId: _0x3cc450,
          provider: _0x82b31d['provider'],
          providerProfileId:
            normalizeText(taskIdentity['providerProfileId']) ||
            _0x59ef9c['settings']?.['replacementImageProviderProfileId'],
          generationParams: _0x82b31d['generationParams'],
          referenceImageUrls: [
            ..._0x35ca26['referenceImages']
              ['filter'](
                (_0x2065a6) => !_0x35ca26['annotatedSource'] || _0x2065a6['role'] !== 'source-keyframe',
              )
              ['map']((_0xef83aa) => _0xef83aa['ref']),
            ...(Array['isArray'](promptAssetRefs) ? promptAssetRefs : [])['map'](
              (_0x156b2f) => _0x156b2f?.['url'],
            ),
          ],
        });
      if (_0x35ca26['annotatedSource'])
        _0x4fd50d['inputUrls']['unshift'](_0x35ca26['referenceImages'][0x0]['ref']);
      return (
        (_0x4fd50d['adaptiveSource'] = _0x82b31d['adaptiveSource']),
        (_0x4fd50d['resolvedRatioLabel'] = _0x82b31d['resolvedAspectRatio']),
        {
          modelId: _0x3cc450,
          payload: _0x4fd50d,
          promptPackage: _0x35ca26,
          ratioResolution: _0x82b31d,
          requestPrompt: requestPrompt,
          savedPrompt: savedPrompt,
        }
      );
    },
    _0x4b38f4 = ({
      currentProject: _0x128080,
      currentShot: _0x50eba3,
      requestRevision: _0x130270,
      savedPrompt: _0x432518,
      promptEnhancement: promptEnhancement = null,
      sourceImageSize: _0xab4914,
      taskIdentity: taskIdentity = {},
    }) => {
      try {
        const _0x40a8d1 = _0x3504d2({
          project: _0x128080,
          shot: { ..._0x50eba3, imagePrompt: _0x432518 },
          sourceImageSize: _0xab4914,
          taskIdentity: taskIdentity,
          promptEnhancement: promptEnhancement,
        });
        return (
          createPersonReplacementImageGenerationRequestRevision({
            project: _0x128080,
            shot: _0x50eba3,
            payload: _0x40a8d1['payload'],
            sourceImageSize: _0xab4914,
          }) === _0x130270
        );
      } catch {
        return ![];
      }
    },
    _0x1a74cd = ({
      projectId: _0x2eed03,
      shotId: _0x112f9f,
      requestId: _0x2be1e6,
      requestRevision: requestRevision = '',
      savedPrompt: savedPrompt = '',
      promptEnhancement: promptEnhancement = null,
      sourceImageSize: _0x113155,
      taskIdentity: taskIdentity = {},
    } = {}) => {
      if (_0x24ed12) return ![];
      const _0x318722 = _0x2f4d03(_0x2eed03);
      if (normalizeText(_0x318722?.['id']) !== normalizeText(_0x2eed03)) return ![];
      const _0x4070fa = _0x318722?.['shots']?.['find']?.(
        (_0x37aed9) => normalizeText(_0x37aed9?.['id']) === normalizeText(_0x112f9f),
      );
      if (!_0x4070fa) return ![];
      const _0x4d861b = resolvePersonReplacementImageGenerationState(_0x318722['workspace'], _0x112f9f);
      if (normalizeText(_0x4d861b['requestId']) !== normalizeText(_0x2be1e6)) return ![];
      return (
        !requestRevision ||
        _0x4b38f4({
          currentProject: _0x318722,
          currentShot: _0x4070fa,
          requestRevision: requestRevision,
          savedPrompt: savedPrompt,
          promptEnhancement: promptEnhancement,
          sourceImageSize: _0x113155,
          taskIdentity: taskIdentity,
        })
      );
    },
    _0x3f5caa = (_0x2adec5, _0x3dd709 = {}, { persistIdentity: persistIdentity = ![] } = {}) => {
      if (!_0x1a74cd(_0x2adec5)) return ![];
      const _0x1effbe = _0x2f4d03(_0x2adec5['projectId']),
        _0x32c57f = resolvePersonReplacementImageGenerationState(_0x1effbe['workspace'], _0x2adec5['shotId']),
        _0x3927ef = {
          ..._0x32c57f,
          ..._0x3dd709,
          shotId: _0x2adec5['shotId'],
          requestId: _0x2adec5['requestId'],
        },
        _0x3a8ccf =
          Object['keys'](_0x3927ef)['some'](
            (_0x5e4674) => !Object['is'](_0x3927ef[_0x5e4674], _0x32c57f[_0x5e4674]),
          ) || Object['keys'](_0x32c57f)['some']((_0x5a8a8d) => !Object['hasOwn'](_0x3927ef, _0x5a8a8d));
      if (!_0x3a8ccf) return !![];
      return (
        _0x5c4dfc({
          ..._0x1effbe,
          workspace: updatePersonReplacementImageGenerationState(_0x1effbe['workspace'], _0x3927ef),
        }),
        persistIdentity &&
          normalizeText(_0x3927ef['taskId']) &&
          hasPersonReplacementGenerationTaskIdentityChanged(_0x32c57f, _0x3927ef) &&
          void Promise['resolve'](persistNow())['catch'](() => {}),
        !![]
      );
    },
    _0x1d0a33 = async ({
      projectId: _0x49a944 = '',
      shotId: shotId = '',
      sourceImageSize: _0x3f2b86,
      notifyCompletion: _0x14703e = !![],
      recoveryTask: recoveryTask = null,
    } = {}) => {
      if (_0x24ed12) return null;
      const _0x1ce6db = _0x2f4d03(_0x49a944),
        _0xb5e29e = normalizeText(shotId),
        _0x46f50b = _0x1ce6db?.['shots']?.['find']?.((_0x2d9f22) => _0x2d9f22['id'] === _0xb5e29e),
        _0x48f05a = getRecoverablePersonReplacementImageTask(
          _0x1ce6db?.['workspace']?.['imageGenerationsByShotId']?.[_0xb5e29e],
        ),
        _0x115a10 = recoveryTask ? { ..._0x48f05a, ...recoveryTask } : null;
      if (!_0x115a10 && _0x48f05a) return null;
      if (
        !_0x1ce6db?.['id'] ||
        !_0x46f50b ||
        (_0x115a10 ? typeof resumeImageTask !== 'function' : typeof _0xeaf778 !== 'function')
      )
        return null;
      let _0x62da6e = buildPersonReplacementPromptPackage({ project: _0x1ce6db, shot: _0x46f50b });
      const _0x156585 = buildPersonReplacementImageGate({
        project: _0x1ce6db,
        shot: _0x46f50b,
        promptPackage: _0x62da6e,
        recovering: Boolean(_0x115a10),
      });
      if (!_0x156585['eligible']) return (showToast(_0x156585['message'], 'warn'), null);
      if (!_0x115a10 && _0x156585['enforceImageLimit'])
        try {
          const _0x1e2cae = _0x3504d2({
              project: _0x1ce6db,
              shot: _0x46f50b,
              promptPackage: _0x62da6e,
              sourceImageSize: _0x3f2b86,
            }),
            _0x570a3d = buildPersonReplacementImageGate({
              project: _0x1ce6db,
              shot: _0x46f50b,
              promptPackage: _0x62da6e,
              inputUrls: _0x1e2cae['payload']['inputUrls'],
              modelId: _0x1e2cae['modelId'],
            });
          if (!_0x570a3d['eligible']) return (showToast(_0x570a3d['message'], 'warn'), null);
        } catch (_0x2e10b1) {
          return (showToast(_0x2e10b1?.['message'] || '无法校验生成输入', 'warn'), null);
        }
      const _0x3178e7 = _0x1ce6db['id'] + ':image:' + _0xb5e29e;
      if (_0x3805cf['has'](_0x3178e7)) return null;
      const _0x72b92d = _0x1ce6db['id'],
        _0x37bb96 = normalizeText(_0x115a10?.['requestId']) || normalizeText(createRequestId()),
        _0x2628c1 = new AbortController(),
        _0x526a5e = {
          projectId: _0x72b92d,
          requestId: _0x37bb96,
          shotId: _0xb5e29e,
          abortController: _0x2628c1,
          taskId: normalizeText(_0x115a10?.['taskId']),
          taskIdentity: _0x115a10 || {},
          promptEnhancement: null,
        };
      _0x3805cf['set'](_0x3178e7, _0x526a5e);
      const _0x2b7326 = createPersonReplacementImageGenerationMappingRevision({
        project: _0x1ce6db,
        shot: _0x46f50b,
      });
      let _0x1d8738 = '',
        _0x49edac = '';
      _0x5c4dfc({
        ..._0x1ce6db,
        workspace: updatePersonReplacementImageGenerationState(_0x1ce6db['workspace'], {
          status: 'running',
          shotId: _0xb5e29e,
          requestId: _0x37bb96,
          ...(_0x115a10 || {}),
          error: '',
        }),
      });
      try {
        if (_0x62da6e['annotatedSource'] && !_0x115a10) {
          const _0x341857 = await createAnnotatedSource({
            ..._0x62da6e['annotatedSource'],
            signal: _0x2628c1['signal'],
          });
          _0x62da6e = applyPersonReplacementAnnotatedSource(_0x62da6e, _0x341857);
          if (_0x2628c1['signal']['aborted'] || _0x24ed12) return null;
        }
        if (_0x62da6e['locationGuide'] && !_0x115a10) {
          const _0x56eb5b = await createLocationGuide({
            ..._0x62da6e['locationGuide'],
            signal: _0x2628c1['signal'],
          });
          _0x62da6e = applyPersonReplacementLocationGuide(_0x62da6e, _0x56eb5b);
          if (_0x2628c1['signal']['aborted'] || _0x24ed12) return null;
        }
        let _0x8ee2e9 = _0x156585['manual'] ? null : _0x115a10?.['promptEnhancement'] || null;
        if (
          !_0x156585['manual'] &&
          !_0x8ee2e9 &&
          _0x1ce6db['settings']?.['replacementPromptEnhancementEnabled'] === !![]
        ) {
          if (typeof enhancePrompt !== 'function') throw new Error('AI 提示词增强服务尚未初始化');
          const _0x1ff54b = getPromptEnhancementModel?.() || {},
            _0x2b1223 = JSON['stringify']({
              mappingRevision: usesSourceDescriptions(_0x62da6e)
                ? sourceDescriptionIdentity(_0x62da6e)
                : _0x2b7326,
              modelId: normalizeText(_0x1ff54b['modelId']),
              provider: normalizeText(_0x1ff54b['provider']),
              providerProfileId: normalizeText(_0x1ff54b['providerProfileId']),
            });
          _0x8ee2e9 = _0x162f67['get'](_0x2b1223);
          if (!_0x8ee2e9) {
            const _0x59d6d5 = await enhancePrompt({
              project: _0x1ce6db,
              promptPackage: _0x62da6e,
              shot: _0x46f50b,
              signal: _0x2628c1['signal'],
            });
            _0x8ee2e9 = { ..._0x59d6d5, createdAt: normalizeText(_0x59d6d5?.['createdAt']) || now() };
            if (!normalizeText(_0x8ee2e9['prompt'])) throw new Error('AI 提示词增强未返回可用提示词');
            _0x162f67['set'](_0x2b1223, _0x8ee2e9);
          }
          (usesSourceDescriptions(_0x62da6e) &&
            _0x8ee2e9['analysis']?.['kind'] === 'source-descriptions-v1' &&
            (_0x8ee2e9 = {
              ..._0x8ee2e9,
              prompt: compileSourceDescriptions(_0x62da6e, _0x8ee2e9['analysis']),
            }),
            (_0x526a5e['promptEnhancement'] = _0x8ee2e9),
            _0x3f5caa(_0x526a5e, { status: 'running', promptEnhancement: _0x8ee2e9, error: '' }));
        }
        const {
          modelId: _0x474795,
          payload: _0x5521d5,
          ratioResolution: _0x1e584f,
          requestPrompt: _0x5e37c9,
          savedPrompt: _0x4b7aaf,
        } = _0x3504d2({
          project: _0x1ce6db,
          shot: _0x46f50b,
          promptPackage: _0x62da6e,
          promptEnhancement: _0x8ee2e9,
          sourceImageSize: _0x3f2b86,
          taskIdentity: _0x115a10 || {},
        });
        if (_0x156585['manual'] && !normalizeText(_0x5e37c9)) throw new Error('手动模式请先填写提示词。');
        ((_0x49edac = _0x4b7aaf),
          (_0x1d8738 = createPersonReplacementImageGenerationRequestRevision({
            project: _0x1ce6db,
            shot: _0x46f50b,
            payload: _0x5521d5,
            sourceImageSize: _0x3f2b86,
          })),
          Object['assign'](_0x526a5e, {
            requestRevision: _0x1d8738,
            savedPrompt: _0x4b7aaf,
            promptEnhancement: _0x8ee2e9,
            sourceImageSize: _0x3f2b86,
          }));
        const _0x51d374 =
            resolveModelExecution(_0x474795) ||
            resolveModelExecution(_0x474795, { providerHint: _0x1e584f['provider'] }),
          _0x6d157c = Number(_0x115a10?.['startedAt']) || Date['now'](),
          _0x3101ef = {
            taskId: normalizeText(_0x115a10?.['taskId']),
            modelId: _0x474795,
            provider: _0x1e584f['provider'],
            providerProfileId: _0x5521d5['providerProfileId'],
            executionId:
              normalizeText(_0x115a10?.['executionId']) ||
              normalizeText(_0x51d374?.['executionManifest']?.['id']),
            startedAt: _0x6d157c,
            useOpenapiQuery: _0x115a10?.['useOpenapiQuery'] === !![],
          },
          _0xbbac7d = (_0x570a49, _0x2a1bf0 = {}) => {
            const _0x597c0 = resolvePersonReplacementImageGenerationState(
                _0x2f4d03(_0x72b92d)?.['workspace'],
                _0xb5e29e,
              ),
              _0x33c2d9 = projectPersonReplacementGenerationTaskIdentity({
                taskId: _0x570a49,
                meta: _0x2a1bf0,
                defaults: { ..._0x3101ef, ..._0x597c0 },
              });
            if (!_0x33c2d9['taskId']) return;
            ((_0x526a5e['taskId'] = _0x33c2d9['taskId']),
              _0x3f5caa(
                _0x526a5e,
                { status: 'running', ..._0x33c2d9, error: '' },
                { persistIdentity: !![] },
              ));
          },
          _0x10e229 = {
            signal: _0x2628c1['signal'],
            useOpenapiQuery: _0x115a10?.['useOpenapiQuery'] === !![],
            onTaskId: (_0x448fe4) => _0xbbac7d(_0x448fe4),
            onTaskMeta: (_0x4ccc47 = {}) => _0xbbac7d(_0x4ccc47['taskId'], _0x4ccc47),
            onRunningHubWorkflowQueueChange: (_0x201ee5 = {}) => {
              const _0x43fa20 =
                normalizeText(_0x201ee5['status'])['toLowerCase']() === 'queued' ? 'queued' : 'running';
              _0x3f5caa(_0x526a5e, { status: _0x43fa20, error: '' });
            },
          },
          _0x2b5a57 = _0x2f4d03(_0x72b92d),
          _0xf1cecc = _0x2b5a57?.['shots']?.['find']((_0x52e439) => _0x52e439['id'] === _0xb5e29e);
        if (
          _0x2628c1['signal']['aborted'] ||
          createPersonReplacementImageGenerationMappingRevision({ project: _0x2b5a57, shot: _0xf1cecc }) !==
            _0x2b7326 ||
          !_0x1a74cd({
            projectId: _0x72b92d,
            shotId: _0xb5e29e,
            requestId: _0x37bb96,
            requestRevision: _0x1d8738,
            savedPrompt: _0x4b7aaf,
            promptEnhancement: _0x8ee2e9,
            sourceImageSize: _0x3f2b86,
            taskIdentity: _0x115a10 || {},
          })
        )
          return _0x4a054e({
            currentProject: _0x2f4d03(_0x72b92d),
            projectId: _0x72b92d,
            shotId: _0xb5e29e,
            requestId: _0x37bb96,
          });
        const _0xe7d8e0 = _0x115a10
          ? await resumeImageTask(_0x115a10['taskId'], _0x5521d5, _0x10e229)
          : await _0xeaf778(_0x5521d5, _0x10e229);
        if (_0x24ed12) return null;
        const _0x181d47 = resolveGeneratedImages(_0xe7d8e0),
          _0x4bce57 = _0x181d47[0x0]['localPath'],
          _0x400ec7 = _0x2f4d03(_0x72b92d);
        if (_0x400ec7?.['id'] !== _0x72b92d) return null;
        const _0x1311d0 = _0x400ec7['shots']?.['find']?.((_0x469971) => _0x469971['id'] === _0xb5e29e);
        if (!_0x1311d0) return null;
        const _0x4be3a6 = resolvePersonReplacementImageGenerationState(_0x400ec7['workspace'], _0xb5e29e);
        if (_0x4be3a6['requestId'] !== _0x37bb96) return null;
        if (
          !_0x4b38f4({
            currentProject: _0x400ec7,
            currentShot: _0x1311d0,
            requestRevision: _0x1d8738,
            savedPrompt: _0x4b7aaf,
            promptEnhancement: _0x8ee2e9,
            sourceImageSize: _0x3f2b86,
            taskIdentity: _0x115a10 || {},
          })
        )
          return _0x4a054e({
            currentProject: _0x400ec7,
            projectId: _0x72b92d,
            shotId: _0xb5e29e,
            requestId: _0x37bb96,
          });
        let _0x2b581b = _0x1311d0['replacementImage'];
        const _0x33114e = now();
        let _0x3b11de = 0x0;
        for (const [_0x1c5cb7, _0x4683a7] of _0x181d47['entries']()) {
          _0x2b581b = appendPersonReplacementImageResult(
            { replacementImage: _0x2b581b },
            {
              ..._0x4683a7,
              imageUrl: _0x4683a7['localPath'],
              prompt: _0x5e37c9,
              userPrompt: _0x4b7aaf,
              modelId: _0x474795,
              provider: _0x1e584f['provider'],
              ...(_0x8ee2e9 ? { promptEnhancement: _0x8ee2e9 } : {}),
              createdAt: _0x33114e,
            },
          );
          if (_0x1c5cb7 === 0x0) _0x3b11de = _0x2b581b['activeIndex'];
        }
        _0x2b581b['activeIndex'] = _0x3b11de;
        const _0x20ac21 = normalizeText(_0x1311d0['imagePrompt']) !== normalizeText(_0x4b7aaf),
          _0x25cfec = _0x5c4dfc({
            ..._0x400ec7,
            shots: _0x400ec7['shots']['map']((_0x193737) =>
              _0x193737['id'] === _0xb5e29e
                ? {
                    ..._0x193737,
                    replacementImage: _0x2b581b,
                    replacementImageRef: _0x4bce57,
                    error: '',
                    imagePrompt: _0x20ac21 ? _0x1311d0['imagePrompt'] : _0x4b7aaf,
                  }
                : _0x193737,
            ),
            workspace: updatePersonReplacementImageGenerationState(_0x400ec7['workspace'], {
              status: 'succeeded',
              shotId: _0xb5e29e,
              requestId: _0x37bb96,
              error: '',
            }),
          });
        let _0x44527d = !![];
        try {
          await persistNow();
        } catch {
          _0x44527d = ![];
        }
        if (_0x24ed12) return null;
        const _0x3d537d = _0x2f4d03(_0x72b92d);
        if (_0x3d537d?.['id'] !== _0x72b92d) return null;
        const _0x27288a = _0x3d537d['shots']?.['find']?.((_0x22a7e8) => _0x22a7e8['id'] === _0xb5e29e);
        if (!_0x27288a) return null;
        const _0x217718 = resolvePersonReplacementImageGenerationState(_0x3d537d['workspace'], _0xb5e29e);
        if (_0x217718['requestId'] !== _0x37bb96) return null;
        return (
          (!_0x44527d || _0x14703e === ![]) &&
            showToast(
              _0x44527d ? '替换首帧已生成。' : '替换首帧已生成，项目数据正在重试保存，请暂时不要刷新。',
              _0x44527d ? 'success' : 'warn',
            ),
          _0x14703e !== ![] && notifyCompletion({ kind: 'image', mediaRef: _0x4bce57, projectId: _0x72b92d }),
          { project: _0x3d537d || _0x25cfec, ok: !![], shotId: _0xb5e29e }
        );
      } catch (_0x254891) {
        if (_0x24ed12) return null;
        const _0x4a35bb = _0x2f4d03(_0x72b92d);
        if (_0x4a35bb?.['id'] !== _0x72b92d) return null;
        const _0x37cf13 = _0x4a35bb['shots']?.['find']?.((_0x1bac4d) => _0x1bac4d['id'] === _0xb5e29e);
        if (!_0x37cf13) return null;
        const _0x40ba4e = resolvePersonReplacementImageGenerationState(_0x4a35bb['workspace'], _0xb5e29e);
        if (_0x40ba4e['requestId'] !== _0x37bb96) return null;
        const _0xebd3e9 = _0x1d8738
          ? !_0x4b38f4({
              currentProject: _0x4a35bb,
              currentShot: _0x37cf13,
              requestRevision: _0x1d8738,
              savedPrompt: _0x49edac,
              promptEnhancement: _0x526a5e['promptEnhancement'],
              sourceImageSize: _0x3f2b86,
              taskIdentity: _0x115a10 || {},
            })
          : createPersonReplacementImageGenerationMappingRevision({ project: _0x4a35bb, shot: _0x37cf13 }) !==
            _0x2b7326;
        if (_0xebd3e9)
          return _0x4a054e({
            currentProject: _0x4a35bb,
            projectId: _0x72b92d,
            shotId: _0xb5e29e,
            requestId: _0x37bb96,
          });
        const _0x2fef5f = _0x254891?.['getUserMessage']?.() || _0x254891?.['message'] || '替换首帧生成失败',
          _0x563ef7 = _0x5c4dfc({
            ..._0x4a35bb,
            workspace: updatePersonReplacementImageGenerationState(_0x4a35bb['workspace'], {
              status: 'failed',
              shotId: _0xb5e29e,
              requestId: _0x37bb96,
              error: _0x2fef5f,
            }),
          });
        return { project: _0x563ef7, ok: ![], shotId: _0xb5e29e, error: _0x2fef5f };
      } finally {
        _0x3805cf['delete'](_0x3178e7);
      }
    },
    _0x2e19ca = async ({
      projectId: _0x57e8f9 = '',
      shotId: shotId = '',
      notifyCompletion: notifyCompletion = !![],
    } = {}) => {
      const _0x187b25 = normalizeText(shotId),
        _0x18f4a0 = _0x2f4d03(_0x57e8f9),
        _0x5c2785 = getRecoverablePersonReplacementImageTask(
          _0x18f4a0?.['workspace']?.['imageGenerationsByShotId']?.[_0x187b25],
        );
      if (!_0x5c2785 || _0x24ed12) return null;
      return _0x1d0a33({
        projectId: _0x18f4a0?.['id'],
        shotId: _0x187b25,
        notifyCompletion: notifyCompletion,
        recoveryTask: _0x5c2785,
      });
    },
    _0x469966 = ({ projectId: _0x41d319 = '', shotId: _0x55eac4 } = {}) => {
      const _0x8f6430 = normalizeText(_0x55eac4),
        _0x2c2887 = _0x2f4d03(_0x41d319),
        _0x1bf83e = normalizeText(_0x2c2887?.['id']),
        _0xb246a2 = _0x1bf83e + ':image:' + _0x8f6430,
        _0x291afb = _0x3805cf['get'](_0xb246a2);
      if (!_0x291afb || _0x24ed12) return null;
      (_0x3805cf['delete'](_0xb246a2), _0x291afb['abortController']?.['abort']?.());
      const _0x4bb49c = resolvePersonReplacementImageGenerationState(_0x2c2887?.['workspace'], _0x8f6430);
      if (normalizeText(_0x4bb49c['requestId']) !== normalizeText(_0x291afb['requestId']))
        return { ok: !![], shotId: _0x8f6430 };
      const _0xbe4af2 = _0x5c4dfc({
        ..._0x2c2887,
        workspace: updatePersonReplacementImageGenerationState(_0x2c2887['workspace'], {
          status: 'idle',
          shotId: _0x8f6430,
          error: '',
        }),
      });
      return { ok: !![], shotId: _0x8f6430, project: _0xbe4af2 };
    },
    _0x2fa94c = async () => {
      if (_0x24ed12) return [];
      const _0x481f7d = _0x397ed7?.(),
        _0x5b31c0 = normalizeText(_0x481f7d?.['id']),
        _0x1198ae = Object['entries'](_0x481f7d?.['workspace']?.['imageGenerationsByShotId'] || {})[
          'flatMap'
        ](([_0x5d0523, _0x37f992]) =>
          getRecoverablePersonReplacementImageTask(_0x37f992) ? [normalizeText(_0x5d0523)] : [],
        ),
        _0xd46809 = await Promise['allSettled'](
          _0x1198ae['map']((_0x3540e5) => _0x2e19ca({ shotId: _0x3540e5 })),
        );
      if (_0x24ed12 || !_0x2f4d03(_0x5b31c0)) return [];
      return _0xd46809;
    },
    _0x8473e3 = () => {
      if (_0x24ed12) return null;
      _0x24ed12 = !![];
      const _0x4770fc = _0x397ed7?.();
      let _0x277685 = _0x4770fc?.['workspace'],
        _0x500acf = ![];
      _0x4770fc?.['id'] &&
        _0x3805cf['forEach']((_0x2d45c1) => {
          if (_0x2d45c1['projectId'] !== _0x4770fc['id']) return;
          const _0x4091d8 = resolvePersonReplacementImageGenerationState(_0x277685, _0x2d45c1['shotId']);
          if (_0x4091d8['requestId'] !== _0x2d45c1['requestId']) return;
          _0x2d45c1['abortController']?.['abort']?.();
          if (getRecoverablePersonReplacementImageTask(_0x4091d8)) return;
          if (_0x4091d8['status'] !== 'running') return;
          ((_0x277685 = updatePersonReplacementImageGenerationState(_0x277685, {
            status: 'idle',
            shotId: _0x2d45c1['shotId'],
            error: '',
          })),
            (_0x500acf = !![]));
        });
      (_0x3805cf['clear'](), _0x162f67['clear']());
      if (!_0x500acf) return null;
      return _0x444fbf?.({ ..._0x4770fc, workspace: _0x277685 });
    };
  return Object['freeze']({
    preview: ({ projectId: projectId = '', shotId: _0x525985, sourceImageSize: _0xb122b0 } = {}) => {
      const _0x26b5c0 = _0x2f4d03(projectId),
        _0x5c8fa4 = _0x26b5c0?.['shots']?.['find']((_0x125c9f) => _0x125c9f['id'] === _0x525985);
      if (!_0x5c8fa4) throw new Error('请先选择镜头');
      const _0x5d676c = buildPersonReplacementPromptPackage({ project: _0x26b5c0, shot: _0x5c8fa4 });
      if (_0x5d676c['annotatedSource']) {
        const _0x4ee0ad = buildPersonReplacementImageGate({
          project: _0x26b5c0,
          shot: _0x5c8fa4,
          promptPackage: _0x5d676c,
        });
        if (!_0x4ee0ad['eligible']) throw new Error(_0x4ee0ad['message']);
        return createAnnotatedSource(_0x5d676c['annotatedSource'])['then']((_0x8da74e) =>
          _0x3504d2({
            project: _0x26b5c0,
            shot: _0x5c8fa4,
            sourceImageSize: _0xb122b0,
            promptPackage: applyPersonReplacementAnnotatedSource(_0x5d676c, _0x8da74e),
          }),
        );
      }
      return _0x3504d2({ project: _0x26b5c0, shot: _0x5c8fa4, sourceImageSize: _0xb122b0 });
    },
    acceptUploadedResult: _0x36f5e9,
    cancel: _0x469966,
    destroy: _0x8473e3,
    generate: _0x1d0a33,
    resume: _0x2e19ca,
    resumeRecoverable: _0x2fa94c,
    hasActiveTasks: () => _0x3805cf['size'] > 0x0,
    hasActiveTasksForProject: (_0x554047) => {
      const _0x3dc469 = normalizeText(_0x554047);
      return (
        Boolean(_0x3dc469) &&
        [..._0x3805cf['values']()]['some']((_0x452367) => _0x452367['projectId'] === _0x3dc469)
      );
    },
  });
}
