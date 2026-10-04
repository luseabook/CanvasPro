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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function resolveGeneratedImages(item) {
  const imageGenerationResult = normalizeImageGenerationResult(item),
    list = getSuccessfulImageGenerationItems(imageGenerationResult)
      ['map']((response) => ({
        ...response,
        localPath:
          [
            response['localPath'],
            response['originalLocalPath'],
            response['displayLocalPath'],
            response['imageUrl'],
            response['url'],
          ]
            ['map'](normalizeLocalPath)
            ['find'](Boolean) || '',
      }))
      ['filter']((key) => key['localPath']);
  if (!list['length'])
    throw new Error(
      normalizeText(
        imageGenerationResult['items'][0x0]?.['localSaveError'] || imageGenerationResult?.['localSaveError'],
      ) ||
        getImageGenerationResultError(imageGenerationResult) ||
        '图像生成结果缺少可用图片',
    );
  return list;
}
function resolveDefaultPromptRequest({ shot: shot, promptPackage: promptPackage2 }) {
  const savedPrompt2 = normalizeText(shot?.['imagePrompt']);
  return {
    savedPrompt: savedPrompt2,
    requestPrompt: composePersonReplacementImagePrompt(promptPackage2, savedPrompt2),
    promptAssetRefs: [],
  };
}
async function resumePersonReplacementImageTask(index, providerHint, result = {}) {
  const modelExecution =
      resolveModelExecution(providerHint?.['model']) ||
      resolveModelExecution(providerHint?.['model'], { providerHint: providerHint?.['provider'] }),
    text = normalizeText(modelExecution?.['modelManifest']?.['provider'] || providerHint?.['provider']);
  if (text === 'dreamina') return resumeDreaminaImageTask(index, providerHint, result);
  if (
    text === 'runninghub' ||
    text === 'runninghubwf' ||
    modelExecution?.['executionManifest']?.['adapterType'] === 'workflow'
  )
    return resumeRunningHubImageTask(index, providerHint, result);
  return resumeAsyncImageTask(index, providerHint, result);
}
export function createPersonReplacementImageTaskRuntime({
  getProject: getProject,
  getProjectById: getProjectById = null,
  commitProject: commitProject,
  commitProjectById: commitProjectById = null,
  generateImage: generateImage,
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
  const map = new Map(),
    map2 = new Map();
  let data = ![];
  const currentProject = (options = '') => {
      const text2 = normalizeText(options);
      return text2 && typeof getProjectById === 'function' ? getProjectById(text2) : getProject?.();
    },
    handler = (target) =>
      typeof commitProjectById === 'function'
        ? commitProjectById(target?.['id'], target)
        : commitProject?.(target),
    handler2 = ({
      currentProject: currentProject2,
      projectId: projectId2,
      shotId: shotId2,
      requestId: requestId,
    }) => {
      if (data || currentProject2?.['id'] !== projectId2) return null;
      const personReplacementImageGenerationState = resolvePersonReplacementImageGenerationState(
        currentProject2['workspace'],
        shotId2,
      );
      if (personReplacementImageGenerationState['requestId'] !== requestId) return null;
      const project = handler({
        ...currentProject2,
        workspace: updatePersonReplacementImageGenerationState(currentProject2['workspace'], {
          status: 'idle',
          shotId: shotId2,
          error: '',
        }),
      });
      return (
        showToast('生成期间检测框或生成设置已变化，旧结果未应用，请重新生成。', 'warn'),
        { project: project, ok: ![], stale: !![], shotId: shotId2 }
      );
    },
    acceptUploadedResult = ({
      shotId: shotId = '',
      imageRef: imageRef = '',
      fileName: fileName = '',
      createdAt: createdAt = now(),
      expectedProjectId: expectedProjectId = '',
      expectedShotRevision: expectedShotRevision = '',
    } = {}) => {
      if (data) return null;
      const project2 = getProject?.(),
        selectedShotId = normalizeText(shotId),
        imageUrl = normalizeText(imageRef),
        text3 = normalizeText(expectedProjectId),
        text4 = normalizeText(expectedShotRevision);
      if (!text3 || project2?.['id'] !== text3) return null;
      const shot2 = project2?.['shots']?.['find']?.((source) => source['id'] === selectedShotId);
      if (!shot2 || !imageUrl) return null;
      if (
        !text4 ||
        createPersonReplacementImageGenerationMappingRevision({ project: project2, shot: shot2 }) !== text4
      )
        return null;
      const replacementImage = appendPersonReplacementImageResult(shot2, {
        imageUrl: imageUrl,
        source: 'upload',
        fileName: normalizeText(fileName) || '上传替换图片',
        userPrompt: normalizeText(shot2['imagePrompt']),
        createdAt: createdAt,
      });
      return commitProject?.({
        ...project2,
        shots: project2['shots']['map']((args) =>
          args['id'] === selectedShotId
            ? { ...args, replacementImage: replacementImage, replacementImageRef: imageUrl, error: '' }
            : args,
        ),
        workspace: { ...project2['workspace'], selectedShotId: selectedShotId },
      });
    },
    handler3 = ({
      project: project3,
      shot: shot3,
      promptPackage: promptPackage = buildPersonReplacementPromptPackage({
        project: project3,
        shot: shot3,
      }),
      promptEnhancement: promptEnhancement = null,
      sourceImageSize: sourceImageSize,
      taskIdentity: taskIdentity = {},
    }) => {
      const promptPackage3 = promptEnhancement
          ? applyPersonReplacementPromptEnhancement(promptPackage, promptEnhancement)
          : promptPackage,
        {
          savedPrompt: savedPrompt = '',
          requestPrompt: requestPrompt = promptPackage3['prompt'],
          promptAssetRefs: promptAssetRefs = [],
        } = resolvePromptRequest({ project: project3, shot: shot3, promptPackage: promptPackage3 }) || {},
        modelId =
          normalizeText(taskIdentity['modelId']) ||
          project3['settings']?.['replacementImageModelId'] ||
          PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
        provider = resolvePersonReplacementImageGenerationParams({
          modelId: modelId,
          provider:
            normalizeText(taskIdentity['provider']) || project3['settings']?.['replacementImageProvider'],
          generationParams: project3['settings']?.['replacementImageGenerationParams'],
          sourceImageSize: sourceImageSize,
          shot: shot3,
        }),
        payload = buildCharacterAssetImageGenerationPayload({
          prompt: requestPrompt,
          modelId: modelId,
          provider: provider['provider'],
          providerProfileId:
            normalizeText(taskIdentity['providerProfileId']) ||
            project3['settings']?.['replacementImageProviderProfileId'],
          generationParams: provider['generationParams'],
          referenceImageUrls: [
            ...promptPackage3['referenceImages']
              ['filter']((next) => !promptPackage3['annotatedSource'] || next['role'] !== 'source-keyframe')
              ['map']((current) => current['ref']),
            ...(Array['isArray'](promptAssetRefs) ? promptAssetRefs : [])['map'](
              (response2) => response2?.['url'],
            ),
          ],
        });
      if (promptPackage3['annotatedSource'])
        payload['inputUrls']['unshift'](promptPackage3['referenceImages'][0x0]['ref']);
      return (
        (payload['adaptiveSource'] = provider['adaptiveSource']),
        (payload['resolvedRatioLabel'] = provider['resolvedAspectRatio']),
        {
          modelId: modelId,
          payload: payload,
          promptPackage: promptPackage3,
          ratioResolution: provider,
          requestPrompt: requestPrompt,
          savedPrompt: savedPrompt,
        }
      );
    },
    handler4 = ({
      currentProject: currentProject3,
      currentShot: currentShot,
      requestRevision: requestRevision2,
      savedPrompt: savedPrompt3,
      promptEnhancement: promptEnhancement = null,
      sourceImageSize: sourceImageSize2,
      taskIdentity: taskIdentity = {},
    }) => {
      try {
        const payload2 = handler3({
          project: currentProject3,
          shot: { ...currentShot, imagePrompt: savedPrompt3 },
          sourceImageSize: sourceImageSize2,
          taskIdentity: taskIdentity,
          promptEnhancement: promptEnhancement,
        });
        return (
          createPersonReplacementImageGenerationRequestRevision({
            project: currentProject3,
            shot: currentShot,
            payload: payload2['payload'],
            sourceImageSize: sourceImageSize2,
          }) === requestRevision2
        );
      } catch {
        return ![];
      }
    },
    handler5 = ({
      projectId: projectId3,
      shotId: shotId3,
      requestId: requestId2,
      requestRevision: requestRevision = '',
      savedPrompt: savedPrompt = '',
      promptEnhancement: promptEnhancement = null,
      sourceImageSize: sourceImageSize3,
      taskIdentity: taskIdentity = {},
    } = {}) => {
      if (data) return ![];
      const currentProject4 = currentProject(projectId3);
      if (normalizeText(currentProject4?.['id']) !== normalizeText(projectId3)) return ![];
      const currentShot2 = currentProject4?.['shots']?.['find']?.(
        (entry) => normalizeText(entry?.['id']) === normalizeText(shotId3),
      );
      if (!currentShot2) return ![];
      const personReplacementImageGenerationState2 = resolvePersonReplacementImageGenerationState(
        currentProject4['workspace'],
        shotId3,
      );
      if (normalizeText(personReplacementImageGenerationState2['requestId']) !== normalizeText(requestId2))
        return ![];
      return (
        !requestRevision ||
        handler4({
          currentProject: currentProject4,
          currentShot: currentShot2,
          requestRevision: requestRevision,
          savedPrompt: savedPrompt,
          promptEnhancement: promptEnhancement,
          sourceImageSize: sourceImageSize3,
          taskIdentity: taskIdentity,
        })
      );
    },
    handler6 = (shotId4, args2 = {}, { persistIdentity: persistIdentity = ![] } = {}) => {
      if (!handler5(shotId4)) return ![];
      const args3 = currentProject(shotId4['projectId']),
        args4 = resolvePersonReplacementImageGenerationState(args3['workspace'], shotId4['shotId']),
        record = {
          ...args4,
          ...args2,
          shotId: shotId4['shotId'],
          requestId: shotId4['requestId'],
        },
        enabled =
          Object['keys'](record)['some']((handle) => !Object['is'](record[handle], args4[handle])) ||
          Object['keys'](args4)['some']((state) => !Object['hasOwn'](record, state));
      if (!enabled) return !![];
      return (
        handler({
          ...args3,
          workspace: updatePersonReplacementImageGenerationState(args3['workspace'], record),
        }),
        persistIdentity &&
          normalizeText(record['taskId']) &&
          hasPersonReplacementGenerationTaskIdentityChanged(args4, record) &&
          void Promise['resolve'](persistNow())['catch'](() => {}),
        !![]
      );
    },
    generate = async ({
      projectId: projectId4 = '',
      shotId: shotId = '',
      sourceImageSize: sourceImageSize4,
      notifyCompletion: notifyCompletion2 = !![],
      recoveryTask: recoveryTask = null,
    } = {}) => {
      if (data) return null;
      const project4 = currentProject(projectId4),
        shotId5 = normalizeText(shotId),
        shot4 = project4?.['shots']?.['find']?.((config) => config['id'] === shotId5),
        args5 = getRecoverablePersonReplacementImageTask(
          project4?.['workspace']?.['imageGenerationsByShotId']?.[shotId5],
        ),
        taskIdentity2 = recoveryTask ? { ...args5, ...recoveryTask } : null;
      if (!taskIdentity2 && args5) return null;
      if (
        !project4?.['id'] ||
        !shot4 ||
        (taskIdentity2 ? typeof resumeImageTask !== 'function' : typeof generateImage !== 'function')
      )
        return null;
      let promptPackage4 = buildPersonReplacementPromptPackage({ project: project4, shot: shot4 });
      const error = buildPersonReplacementImageGate({
        project: project4,
        shot: shot4,
        promptPackage: promptPackage4,
        recovering: Boolean(taskIdentity2),
      });
      if (!error['eligible']) return (showToast(error['message'], 'warn'), null);
      if (!taskIdentity2 && error['enforceImageLimit'])
        try {
          const inputUrls = handler3({
              project: project4,
              shot: shot4,
              promptPackage: promptPackage4,
              sourceImageSize: sourceImageSize4,
            }),
            error2 = buildPersonReplacementImageGate({
              project: project4,
              shot: shot4,
              promptPackage: promptPackage4,
              inputUrls: inputUrls['payload']['inputUrls'],
              modelId: inputUrls['modelId'],
            });
          if (!error2['eligible']) return (showToast(error2['message'], 'warn'), null);
        } catch (error3) {
          return (showToast(error3?.['message'] || '无法校验生成输入', 'warn'), null);
        }
      const scope = project4['id'] + ':image:' + shotId5;
      if (map['has'](scope)) return null;
      const projectId5 = project4['id'],
        requestId3 = normalizeText(taskIdentity2?.['requestId']) || normalizeText(createRequestId()),
        abortController = new AbortController(),
        promptEnhancement2 = {
          projectId: projectId5,
          requestId: requestId3,
          shotId: shotId5,
          abortController: abortController,
          taskId: normalizeText(taskIdentity2?.['taskId']),
          taskIdentity: taskIdentity2 || {},
          promptEnhancement: null,
        };
      map['set'](scope, promptEnhancement2);
      const personReplacementImageGenerationMappingRevision =
        createPersonReplacementImageGenerationMappingRevision({
          project: project4,
          shot: shot4,
        });
      let requestRevision3 = '',
        savedPrompt4 = '';
      handler({
        ...project4,
        workspace: updatePersonReplacementImageGenerationState(project4['workspace'], {
          status: 'running',
          shotId: shotId5,
          requestId: requestId3,
          ...(taskIdentity2 || {}),
          error: '',
        }),
      });
      try {
        if (promptPackage4['annotatedSource'] && !taskIdentity2) {
          const annotatedSource = await createAnnotatedSource({
            ...promptPackage4['annotatedSource'],
            signal: abortController['signal'],
          });
          promptPackage4 = applyPersonReplacementAnnotatedSource(promptPackage4, annotatedSource);
          if (abortController['signal']['aborted'] || data) return null;
        }
        if (promptPackage4['locationGuide'] && !taskIdentity2) {
          const locationGuide = await createLocationGuide({
            ...promptPackage4['locationGuide'],
            signal: abortController['signal'],
          });
          promptPackage4 = applyPersonReplacementLocationGuide(promptPackage4, locationGuide);
          if (abortController['signal']['aborted'] || data) return null;
        }
        let promptEnhancement3 = error['manual'] ? null : taskIdentity2?.['promptEnhancement'] || null;
        if (
          !error['manual'] &&
          !promptEnhancement3 &&
          project4['settings']?.['replacementPromptEnhancementEnabled'] === !![]
        ) {
          if (typeof enhancePrompt !== 'function') throw new Error('AI 提示词增强服务尚未初始化');
          const input = getPromptEnhancementModel?.() || {},
            output = JSON['stringify']({
              mappingRevision: usesSourceDescriptions(promptPackage4)
                ? sourceDescriptionIdentity(promptPackage4)
                : personReplacementImageGenerationMappingRevision,
              modelId: normalizeText(input['modelId']),
              provider: normalizeText(input['provider']),
              providerProfileId: normalizeText(input['providerProfileId']),
            });
          promptEnhancement3 = map2['get'](output);
          if (!promptEnhancement3) {
            const args6 = await enhancePrompt({
              project: project4,
              promptPackage: promptPackage4,
              shot: shot4,
              signal: abortController['signal'],
            });
            promptEnhancement3 = { ...args6, createdAt: normalizeText(args6?.['createdAt']) || now() };
            if (!normalizeText(promptEnhancement3['prompt']))
              throw new Error('AI 提示词增强未返回可用提示词');
            map2['set'](output, promptEnhancement3);
          }
          (usesSourceDescriptions(promptPackage4) &&
            promptEnhancement3['analysis']?.['kind'] === 'source-descriptions-v1' &&
            (promptEnhancement3 = {
              ...promptEnhancement3,
              prompt: compileSourceDescriptions(promptPackage4, promptEnhancement3['analysis']),
            }),
            (promptEnhancement2['promptEnhancement'] = promptEnhancement3),
            handler6(promptEnhancement2, {
              status: 'running',
              promptEnhancement: promptEnhancement3,
              error: '',
            }));
        }
        const {
          modelId: modelId2,
          payload: payload3,
          ratioResolution: ratioResolution,
          requestPrompt: requestPrompt2,
          savedPrompt: savedPrompt5,
        } = handler3({
          project: project4,
          shot: shot4,
          promptPackage: promptPackage4,
          promptEnhancement: promptEnhancement3,
          sourceImageSize: sourceImageSize4,
          taskIdentity: taskIdentity2 || {},
        });
        if (error['manual'] && !normalizeText(requestPrompt2)) throw new Error('手动模式请先填写提示词。');
        ((savedPrompt4 = savedPrompt5),
          (requestRevision3 = createPersonReplacementImageGenerationRequestRevision({
            project: project4,
            shot: shot4,
            payload: payload3,
            sourceImageSize: sourceImageSize4,
          })),
          Object['assign'](promptEnhancement2, {
            requestRevision: requestRevision3,
            savedPrompt: savedPrompt5,
            promptEnhancement: promptEnhancement3,
            sourceImageSize: sourceImageSize4,
          }));
        const modelExecution2 =
            resolveModelExecution(modelId2) ||
            resolveModelExecution(modelId2, { providerHint: ratioResolution['provider'] }),
          startedAt = Number(taskIdentity2?.['startedAt']) || Date['now'](),
          args7 = {
            taskId: normalizeText(taskIdentity2?.['taskId']),
            modelId: modelId2,
            provider: ratioResolution['provider'],
            providerProfileId: payload3['providerProfileId'],
            executionId:
              normalizeText(taskIdentity2?.['executionId']) ||
              normalizeText(modelExecution2?.['executionManifest']?.['id']),
            startedAt: startedAt,
            useOpenapiQuery: taskIdentity2?.['useOpenapiQuery'] === !![],
          },
          handler7 = (taskId, meta = {}) => {
            const args8 = resolvePersonReplacementImageGenerationState(
                currentProject(projectId5)?.['workspace'],
                shotId5,
              ),
              args9 = projectPersonReplacementGenerationTaskIdentity({
                taskId: taskId,
                meta: meta,
                defaults: { ...args7, ...args8 },
              });
            if (!args9['taskId']) return;
            ((promptEnhancement2['taskId'] = args9['taskId']),
              handler6(
                promptEnhancement2,
                { status: 'running', ...args9, error: '' },
                { persistIdentity: !![] },
              ));
          },
          value2 = {
            signal: abortController['signal'],
            useOpenapiQuery: taskIdentity2?.['useOpenapiQuery'] === !![],
            onTaskId: (value3) => handler7(value3),
            onTaskMeta: (options2 = {}) => handler7(options2['taskId'], options2),
            onRunningHubWorkflowQueueChange: (response3 = {}) => {
              const status =
                normalizeText(response3['status'])['toLowerCase']() === 'queued' ? 'queued' : 'running';
              handler6(promptEnhancement2, { status: status, error: '' });
            },
          },
          project5 = currentProject(projectId5),
          shot5 = project5?.['shots']?.['find']((value4) => value4['id'] === shotId5);
        if (
          abortController['signal']['aborted'] ||
          createPersonReplacementImageGenerationMappingRevision({ project: project5, shot: shot5 }) !==
            personReplacementImageGenerationMappingRevision ||
          !handler5({
            projectId: projectId5,
            shotId: shotId5,
            requestId: requestId3,
            requestRevision: requestRevision3,
            savedPrompt: savedPrompt5,
            promptEnhancement: promptEnhancement3,
            sourceImageSize: sourceImageSize4,
            taskIdentity: taskIdentity2 || {},
          })
        )
          return handler2({
            currentProject: currentProject(projectId5),
            projectId: projectId5,
            shotId: shotId5,
            requestId: requestId3,
          });
        const value5 = taskIdentity2
          ? await resumeImageTask(taskIdentity2['taskId'], payload3, value2)
          : await generateImage(payload3, value2);
        if (data) return null;
        const map3 = resolveGeneratedImages(value5),
          replacementImageRef = map3[0x0]['localPath'],
          currentProject5 = currentProject(projectId5);
        if (currentProject5?.['id'] !== projectId5) return null;
        const currentShot3 = currentProject5['shots']?.['find']?.((value6) => value6['id'] === shotId5);
        if (!currentShot3) return null;
        const personReplacementImageGenerationState3 = resolvePersonReplacementImageGenerationState(
          currentProject5['workspace'],
          shotId5,
        );
        if (personReplacementImageGenerationState3['requestId'] !== requestId3) return null;
        if (
          !handler4({
            currentProject: currentProject5,
            currentShot: currentShot3,
            requestRevision: requestRevision3,
            savedPrompt: savedPrompt5,
            promptEnhancement: promptEnhancement3,
            sourceImageSize: sourceImageSize4,
            taskIdentity: taskIdentity2 || {},
          })
        )
          return handler2({
            currentProject: currentProject5,
            projectId: projectId5,
            shotId: shotId5,
            requestId: requestId3,
          });
        let replacementImage2 = currentShot3['replacementImage'];
        const createdAt2 = now();
        let value7 = 0x0;
        for (const [count, imageUrl2] of map3['entries']()) {
          replacementImage2 = appendPersonReplacementImageResult(
            { replacementImage: replacementImage2 },
            {
              ...imageUrl2,
              imageUrl: imageUrl2['localPath'],
              prompt: requestPrompt2,
              userPrompt: savedPrompt5,
              modelId: modelId2,
              provider: ratioResolution['provider'],
              ...(promptEnhancement3 ? { promptEnhancement: promptEnhancement3 } : {}),
              createdAt: createdAt2,
            },
          );
          if (count === 0x0) value7 = replacementImage2['activeIndex'];
        }
        replacementImage2['activeIndex'] = value7;
        const imagePrompt = normalizeText(currentShot3['imagePrompt']) !== normalizeText(savedPrompt5),
          value8 = handler({
            ...currentProject5,
            shots: currentProject5['shots']['map']((args10) =>
              args10['id'] === shotId5
                ? {
                    ...args10,
                    replacementImage: replacementImage2,
                    replacementImageRef: replacementImageRef,
                    error: '',
                    imagePrompt: imagePrompt ? currentShot3['imagePrompt'] : savedPrompt5,
                  }
                : args10,
            ),
            workspace: updatePersonReplacementImageGenerationState(currentProject5['workspace'], {
              status: 'succeeded',
              shotId: shotId5,
              requestId: requestId3,
              error: '',
            }),
          });
        let enabled2 = !![];
        try {
          await persistNow();
        } catch {
          enabled2 = ![];
        }
        if (data) return null;
        const project6 = currentProject(projectId5);
        if (project6?.['id'] !== projectId5) return null;
        const enabled3 = project6['shots']?.['find']?.((value9) => value9['id'] === shotId5);
        if (!enabled3) return null;
        const personReplacementImageGenerationState4 = resolvePersonReplacementImageGenerationState(
          project6['workspace'],
          shotId5,
        );
        if (personReplacementImageGenerationState4['requestId'] !== requestId3) return null;
        return (
          (!enabled2 || notifyCompletion2 === ![]) &&
            showToast(
              enabled2 ? '替换首帧已生成。' : '替换首帧已生成，项目数据正在重试保存，请暂时不要刷新。',
              enabled2 ? 'success' : 'warn',
            ),
          notifyCompletion2 !== ![] &&
            notifyCompletion({ kind: 'image', mediaRef: replacementImageRef, projectId: projectId5 }),
          { project: project6 || value8, ok: !![], shotId: shotId5 }
        );
      } catch (error4) {
        if (data) return null;
        const currentProject6 = currentProject(projectId5);
        if (currentProject6?.['id'] !== projectId5) return null;
        const currentShot4 = currentProject6['shots']?.['find']?.((value10) => value10['id'] === shotId5);
        if (!currentShot4) return null;
        const personReplacementImageGenerationState5 = resolvePersonReplacementImageGenerationState(
          currentProject6['workspace'],
          shotId5,
        );
        if (personReplacementImageGenerationState5['requestId'] !== requestId3) return null;
        const value11 = requestRevision3
          ? !handler4({
              currentProject: currentProject6,
              currentShot: currentShot4,
              requestRevision: requestRevision3,
              savedPrompt: savedPrompt4,
              promptEnhancement: promptEnhancement2['promptEnhancement'],
              sourceImageSize: sourceImageSize4,
              taskIdentity: taskIdentity2 || {},
            })
          : createPersonReplacementImageGenerationMappingRevision({
              project: currentProject6,
              shot: currentShot4,
            }) !== personReplacementImageGenerationMappingRevision;
        if (value11)
          return handler2({
            currentProject: currentProject6,
            projectId: projectId5,
            shotId: shotId5,
            requestId: requestId3,
          });
        const error5 = error4?.['getUserMessage']?.() || error4?.['message'] || '替换首帧生成失败',
          project7 = handler({
            ...currentProject6,
            workspace: updatePersonReplacementImageGenerationState(currentProject6['workspace'], {
              status: 'failed',
              shotId: shotId5,
              requestId: requestId3,
              error: error5,
            }),
          });
        return { project: project7, ok: ![], shotId: shotId5, error: error5 };
      } finally {
        map['delete'](scope);
      }
    },
    resume = async ({
      projectId: projectId6 = '',
      shotId: shotId = '',
      notifyCompletion: notifyCompletion = !![],
    } = {}) => {
      const shotId6 = normalizeText(shotId),
        projectId7 = currentProject(projectId6),
        recoveryTask2 = getRecoverablePersonReplacementImageTask(
          projectId7?.['workspace']?.['imageGenerationsByShotId']?.[shotId6],
        );
      if (!recoveryTask2 || data) return null;
      return generate({
        projectId: projectId7?.['id'],
        shotId: shotId6,
        notifyCompletion: notifyCompletion,
        recoveryTask: recoveryTask2,
      });
    },
    cancel = ({ projectId: projectId8 = '', shotId: shotId7 } = {}) => {
      const shotId8 = normalizeText(shotId7),
        args11 = currentProject(projectId8),
        text5 = normalizeText(args11?.['id']),
        value12 = text5 + ':image:' + shotId8,
        enabled4 = map['get'](value12);
      if (!enabled4 || data) return null;
      (map['delete'](value12), enabled4['abortController']?.['abort']?.());
      const personReplacementImageGenerationState6 = resolvePersonReplacementImageGenerationState(
        args11?.['workspace'],
        shotId8,
      );
      if (
        normalizeText(personReplacementImageGenerationState6['requestId']) !==
        normalizeText(enabled4['requestId'])
      )
        return { ok: !![], shotId: shotId8 };
      const project8 = handler({
        ...args11,
        workspace: updatePersonReplacementImageGenerationState(args11['workspace'], {
          status: 'idle',
          shotId: shotId8,
          error: '',
        }),
      });
      return { ok: !![], shotId: shotId8, project: project8 };
    },
    resumeRecoverable = async () => {
      if (data) return [];
      const value13 = getProject?.(),
        text6 = normalizeText(value13?.['id']),
        list2 = Object['entries'](value13?.['workspace']?.['imageGenerationsByShotId'] || {})['flatMap'](
          ([value14, value15]) =>
            getRecoverablePersonReplacementImageTask(value15) ? [normalizeText(value14)] : [],
        ),
        value16 = await Promise['allSettled'](list2['map']((shotId9) => resume({ shotId: shotId9 })));
      if (data || !currentProject(text6)) return [];
      return value16;
    },
    destroy = () => {
      if (data) return null;
      data = !![];
      const args12 = getProject?.();
      let workspace = args12?.['workspace'],
        enabled5 = ![];
      args12?.['id'] &&
        map['forEach']((shotId10) => {
          if (shotId10['projectId'] !== args12['id']) return;
          const response4 = resolvePersonReplacementImageGenerationState(workspace, shotId10['shotId']);
          if (response4['requestId'] !== shotId10['requestId']) return;
          shotId10['abortController']?.['abort']?.();
          if (getRecoverablePersonReplacementImageTask(response4)) return;
          if (response4['status'] !== 'running') return;
          ((workspace = updatePersonReplacementImageGenerationState(workspace, {
            status: 'idle',
            shotId: shotId10['shotId'],
            error: '',
          })),
            (enabled5 = !![]));
        });
      (map['clear'](), map2['clear']());
      if (!enabled5) return null;
      return commitProject?.({ ...args12, workspace: workspace });
    };
  return Object['freeze']({
    preview: ({ projectId: projectId = '', shotId: shotId11, sourceImageSize: sourceImageSize5 } = {}) => {
      const project9 = currentProject(projectId),
        shot6 = project9?.['shots']?.['find']((value17) => value17['id'] === shotId11);
      if (!shot6) throw new Error('请先选择镜头');
      const promptPackage5 = buildPersonReplacementPromptPackage({ project: project9, shot: shot6 });
      if (promptPackage5['annotatedSource']) {
        const error6 = buildPersonReplacementImageGate({
          project: project9,
          shot: shot6,
          promptPackage: promptPackage5,
        });
        if (!error6['eligible']) throw new Error(error6['message']);
        return createAnnotatedSource(promptPackage5['annotatedSource'])['then']((value18) =>
          handler3({
            project: project9,
            shot: shot6,
            sourceImageSize: sourceImageSize5,
            promptPackage: applyPersonReplacementAnnotatedSource(promptPackage5, value18),
          }),
        );
      }
      return handler3({ project: project9, shot: shot6, sourceImageSize: sourceImageSize5 });
    },
    acceptUploadedResult: acceptUploadedResult,
    cancel: cancel,
    destroy: destroy,
    generate: generate,
    resume: resume,
    resumeRecoverable: resumeRecoverable,
    hasActiveTasks: () => map['size'] > 0x0,
    hasActiveTasksForProject: (value19) => {
      const text7 = normalizeText(value19);
      return Boolean(text7) && [...map['values']()]['some']((value20) => value20['projectId'] === text7);
    },
  });
}
