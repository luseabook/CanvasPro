import {
  appendToolbarActionMenuTitle,
  createRunningHubActionIcon,
  createToolbarActionDescription,
  createToolbarActionMenuBody,
  createToolbarActionMenuItem,
  createToolbarActionTitle,
  createToolbarActionTitleRow,
  createToolbarActionVipBadge,
  createToolbarActionPopupAnchorPositionGetter,
} from '../actionMenu.js';
import { t } from '../../../i18n/index.js';
const VIDEO_HD_LEGACY_PROMPT_LABEL = '高清修复视频';
function videoHdText(value, item = {}) {
  return t('nodeToolbar.videoHd.' + value, item);
}
function uniqueList(list) {
  return Array.from(new Set(list.map((item2) => String(item2 || '').trim()).filter(Boolean)));
}
function videoHdOptionTitle(event) {
  return videoHdText('options.' + event.key + '.title');
}
function videoHdOptionDesc(event2) {
  return videoHdText('options.' + event2.key + '.desc');
}
function videoHdOutputText(key, { status: status = '', error: error = '' } = {}) {
  const outputText = videoHdText('outputText', {
      model: videoHdOptionTitle(key),
      prompt: videoHdText('promptLabel'),
    }),
    outputText2 = status
      ? videoHdText('outputTextWithStatus', { outputText: outputText, status: status })
      : outputText;
  return error ? videoHdText('outputTextWithError', { outputText: outputText2, error: error }) : outputText2;
}
export function bindVideoHdAction(index) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      store: store,
      submitTask: submitTask,
      createRunningHubTaskStateMachine: createRunningHubTaskStateMachine,
      runRunninghubAiApp: runRunninghubAiApp,
      runRunninghubWorkflow: runRunninghubWorkflow,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputVideos: processInputVideos,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
      buildCanvasLocalVideoFields: buildCanvasLocalVideoFields,
      buildVideoGenerationFailurePatch: buildVideoGenerationFailurePatch,
      buildVideoGenerationResultPatch: buildVideoGenerationResultPatch,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      notifyRunningHubToolbarTasksChanged: notifyRunningHubToolbarTasksChanged,
      RH_VIDEO_HD_BASIC_WORKFLOW_ID: RH_VIDEO_HD_BASIC_WORKFLOW_ID,
      RH_VIDEO_HD_VIP_MODEL_ID: RH_VIDEO_HD_VIP_MODEL_ID,
      RH_VIDEO_HD_VIP_APP_ID: RH_VIDEO_HD_VIP_APP_ID,
      VIDEO_HD_STANDARD_INSTANCE_TYPE: VIDEO_HD_STANDARD_INSTANCE_TYPE,
      VIDEO_HD_VIP_INSTANCE_TYPE: VIDEO_HD_VIP_INSTANCE_TYPE,
      _getCurrentVideoUrl: _getCurrentVideoUrl,
      _ensureVideoHdDurationAllowed: _ensureVideoHdDurationAllowed,
      _ensureVideoHdVipAllowed: _ensureVideoHdVipAllowed,
      _extractFirstUrl: _extractFirstUrl,
      _saveRemoteVideoResult: _saveRemoteVideoResult,
    } = index,
    result = createRunningHubTaskStateMachine(),
    outId = result.state,
    button = toolbarEl.querySelector('.act-hd');
  button &&
    (result.bindButton(button),
    bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () =>
        findRunningHubToolbarTaskForNode(nodeData.id, {
          models: [RH_VIDEO_HD_VIP_MODEL_ID, 'runninghub/' + RH_VIDEO_HD_BASIC_WORKFLOW_ID],
          taskTypes: ['video-hd'],
          outputTextIncludes: uniqueList([VIDEO_HD_LEGACY_PROMPT_LABEL, videoHdText('promptLabel')]),
        }),
      cancelTask: async (data) => {
        try {
          if (outId.active && String(outId.outNodeId || '') === data.outId)
            try {
              await result.cancel();
            } catch (options) {
              console.warn('[VideoHD] cancel request failed:', options);
            }
          return await cancelRunningHubResultTask(data, {
            name: videoHdText('cancelledName'),
            outputText: videoHdText('cancelledOutput', {
              model: videoHdText('modelFallback'),
              prompt: videoHdText('promptLabel'),
              status: videoHdText('status.cancelled'),
            }),
            notifyMessage: videoHdText('cancelledToast'),
          });
        } finally {
          outId.active && String(outId.outNodeId || '') === data.outId && result.reset(button);
        }
      },
      cancelTooltip: videoHdText('cancelTooltip'),
    }),
    button.addEventListener('click', (event3) => {
      (event3.stopPropagation(), event3.preventDefault());
      if (outId.active) {
        (async () => {
          let target = null;
          try {
            const source = outId.outNodeId
              ? {
                  outId: outId.outNodeId,
                  targetNodeId: outId.outNodeId,
                  taskId: outId.taskId,
                  apiKey: outId.apiKey,
                  sourceNodeId: nodeData.id,
                }
              : null;
            source
              ? await cancelRunningHubResultTask(source, {
                  name: videoHdText('cancelledName'),
                  outputText: videoHdText('cancelledOutput', {
                    model: videoHdText('modelFallback'),
                    prompt: videoHdText('promptLabel'),
                    status: videoHdText('status.cancelled'),
                  }),
                  notifyMessage: videoHdText('cancelledToast'),
                })
              : (await result.cancel(), window.showToast?.(videoHdText('taskCancelled'), 'info'));
          } catch (next) {
            target = next;
          }
          try {
            target && console.warn('[VideoHD] cancel request failed:', target);
          } finally {
            result.reset(button);
          }
        })();
        return;
      }
      const el = document.querySelector('.v2-hd-popup');
      if (el) {
        const current = el.__v2HdAnchorBtn && el.__v2HdAnchorBtn === button,
          handler = typeof el.__v2HdClose === 'function' ? el.__v2HdClose : () => el.remove();
        handler();
        if (current) return;
      }
      const el2 = document.createElement('div');
      ((el2.className = 'v2-hd-popup node-toolbar-action-menu'), (el2.__v2HdAnchorBtn = button));
      const run = createToolbarActionPopupAnchorPositionGetter(button),
        left = run();
      (Object.assign(el2.style, {
        position: 'fixed',
        left: left.left + 'px',
        top: left.top + 'px',
        transform: 'translate(-50%, calc(-100% + 10px))',
        opacity: '0',
        pointerEvents: 'none',
      }),
        appendToolbarActionMenuTitle(el2, videoHdText('choosePlan')));
      let run2 = () => {},
        requestAnimationFrame2 = 0;
      const run3 = () => {
        if (!document.body.contains(el2)) {
          run2();
          return;
        }
        if (el2.__v2HdClosing) return;
        ((el2.__v2HdClosing = true),
          run2(),
          (el2.style.opacity = '0'),
          (el2.style.pointerEvents = 'none'),
          (el2.style.transform = 'translate(-50%, calc(-100% + 10px))'));
        const entry = () => {
          el2.removeEventListener('transitionend', entry);
          if (document.body.contains(el2)) el2.remove();
        };
        (el2.addEventListener('transitionend', entry), window.setTimeout(entry, 0x118));
      };
      el2.__v2HdClose = run3;
      const list2 = [
          {
            key: 'sharp',
            vip: true,
            model: RH_VIDEO_HD_VIP_MODEL_ID,
            appId: RH_VIDEO_HD_VIP_APP_ID,
            index: '1',
            instanceType: VIDEO_HD_VIP_INSTANCE_TYPE,
            useOpenapiQuery: true,
          },
          {
            key: 'quality',
            vip: true,
            model: RH_VIDEO_HD_VIP_MODEL_ID,
            appId: RH_VIDEO_HD_VIP_APP_ID,
            index: '0',
            instanceType: VIDEO_HD_VIP_INSTANCE_TYPE,
            useOpenapiQuery: true,
          },
          {
            key: 'basic',
            vip: false,
            model: 'runninghub/' + RH_VIDEO_HD_BASIC_WORKFLOW_ID,
            workflowId: RH_VIDEO_HD_BASIC_WORKFLOW_ID,
            instanceType: VIDEO_HD_STANDARD_INSTANCE_TYPE,
            useOpenapiQuery: false,
          },
        ],
        handler2 = (modelId) => {
          const el3 = createToolbarActionMenuItem();
          el3.appendChild(createRunningHubActionIcon());
          const el4 = createToolbarActionMenuBody(),
            el5 = createToolbarActionTitleRow(),
            toolbarActionTitle = createToolbarActionTitle(videoHdOptionTitle(modelId));
          return (
            el5.appendChild(toolbarActionTitle),
            modelId.vip && el5.appendChild(createToolbarActionVipBadge()),
            el4.appendChild(el5),
            el4.appendChild(createToolbarActionDescription(videoHdOptionDesc(modelId))),
            el3.appendChild(el4),
            el3.addEventListener('click', async (event4) => {
              (event4.stopPropagation(), run3());
              let id = null;
              const startedAt = Date.now(),
                abortController = new AbortController();
              try {
                const sourceNodeId = store.getState().nodes?.[nodeData.id];
                if (!sourceNodeId) {
                  window.showToast?.(videoHdText('sourceNodeMissing'), 'error');
                  return;
                }
                const inputVideoUrl = _getCurrentVideoUrl();
                if (!inputVideoUrl) {
                  window.showToast?.(videoHdText('noProcessableVideo'), 'error');
                  return;
                }
                if (!(await _ensureVideoHdDurationAllowed(inputVideoUrl))) return;
                if (
                  modelId.vip &&
                  !(await _ensureVideoHdVipAllowed(modelId.model, () => {
                    el3.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                  }))
                )
                  return;
                await ensureConfig();
                const record = getProviderConfig('runninghubwf'),
                  apiKey = String(record?.apiKey || '').trim();
                if (!apiKey) {
                  window.showToast?.(videoHdText('apiKeyMissing'), 'error');
                  return;
                }
                const payload = sourceNodeId.width || 0x12c,
                  handle = sourceNodeId.height || 0x12c,
                  { width: width, height: height } = getAutoMediaSizeByShortSide(payload, handle),
                  { x: x, y: y } = calcSafeSpawnPosNearNode(
                    store.getState().nodes,
                    sourceNodeId,
                    width,
                    height,
                  );
                id = 'source-video-hd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
                const instanceType =
                    modelId.instanceType === VIDEO_HD_VIP_INSTANCE_TYPE
                      ? VIDEO_HD_VIP_INSTANCE_TYPE
                      : VIDEO_HD_STANDARD_INSTANCE_TYPE,
                  response = await submitTask(
                    {
                      sourceNodeId: sourceNodeId.id,
                      trigger: 'toolbar',
                      taskType: 'video-hd',
                      provider: 'runninghubwf',
                      adapterType: 'workflow',
                      modelId: modelId.model,
                      executionId: modelId.appId
                        ? 'runninghub.ai-app.' + modelId.appId
                        : 'runninghub.workflow.' + modelId.workflowId,
                      payload: {
                        apiKey: apiKey,
                        inputVideoUrl: inputVideoUrl,
                        option: modelId,
                        instanceType: instanceType,
                      },
                      cancellable: true,
                      resumable: true,
                      pauseOnAbort: 'afterTaskId',
                      onTaskChange: ({ sourceNodeId: sourceNodeId2, targetNodeId: targetNodeId }) =>
                        notifyRunningHubToolbarTasksChanged({
                          sourceNodeId: sourceNodeId2,
                          outId: targetNodeId,
                        }),
                      createTargetNode: ({ startPatch: startPatch, protocolPatch: protocolPatch }) =>
                        buildSourceMediaNodePayload({
                          id: id,
                          type: 'source-video',
                          x: x,
                          y: y,
                          width: width,
                          height: height,
                          name: videoHdText('processingName'),
                          src: '',
                          localPath: '',
                          fileName: 'hd_' + Date.now() + '.mp4',
                          ...startPatch,
                          provider: 'runninghubwf',
                          model: modelId.model,
                          rhTaskUseOpenapiQuery: modelId.useOpenapiQuery === true,
                          ...protocolPatch,
                          outputText: videoHdOutputText(modelId),
                        }),
                      cancel: async ({ taskId: taskId }) => {
                        if (!apiKey || !taskId) return;
                        await cancelRunningHubResultTask(
                          {
                            outId: id,
                            taskId: taskId,
                            sourceNodeId: sourceNodeId.id,
                            apiKey: apiKey,
                          },
                          {
                            name: videoHdText('cancelledName'),
                            outputText: videoHdText('cancelledOutput', {
                              model: videoHdText('modelFallback'),
                              prompt: videoHdText('promptLabel'),
                              status: videoHdText('status.cancelled'),
                            }),
                            notify: false,
                          },
                        );
                      },
                      submit: async (state, outNodeId) => {
                        (result.activate({
                          button: button,
                          apiKey: apiKey,
                          abortController: abortController,
                          outNodeId: outNodeId.targetNodeId,
                        }),
                          store.setSelectedNodes([outNodeId.targetNodeId]));
                        typeof window.v2FocusOnNodes === 'function'
                          ? window.v2FocusOnNodes([sourceNodeId.id, outNodeId.targetNodeId])
                          : window.v2FocusOnNode?.(outNodeId.targetNodeId);
                        window.showToast?.(videoHdText('uploading'), 'info');
                        const config = await processInputVideos([state.inputVideoUrl], apiKey),
                          fieldValue = config[0];
                        if (!fieldValue) throw new Error(videoHdText('uploadNoDownloadUrl'));
                        if (isRunningHubToolbarTaskCancelled(outNodeId.targetNodeId))
                          throw new Error('CANCELLED');
                        window.showToast?.(videoHdText('processingToast'), 'info');
                        const nodeInfoList = modelId.appId
                            ? [
                                {
                                  nodeId: '10',
                                  fieldName: 'index',
                                  fieldValue: modelId.index,
                                  description: 'index',
                                },
                                {
                                  nodeId: '12',
                                  fieldName: 'video',
                                  fieldValue: fieldValue,
                                  description: 'video',
                                },
                              ]
                            : [{ nodeId: '9', fieldName: 'video', fieldValue: fieldValue }],
                          scope = modelId.appId
                            ? await runRunninghubAiApp(
                                {
                                  apiKey: apiKey,
                                  appId: modelId.appId,
                                  nodeInfoList: nodeInfoList,
                                  instanceType: instanceType,
                                  usePersonalQueue: 'false',
                                },
                                { signal: outNodeId.signal },
                              )
                            : await runRunninghubWorkflow(
                                {
                                  apiKey: apiKey,
                                  workflowId: modelId.workflowId,
                                  addMetadata: false,
                                  nodeInfoList: nodeInfoList,
                                  instanceType: instanceType,
                                  usePersonalQueue: 'false',
                                },
                                { signal: outNodeId.signal },
                              ),
                          taskId2 = String(
                            scope?.data?.taskId ||
                              scope?.data?.task_id ||
                              scope?.taskId ||
                              scope?.task_id ||
                              '',
                          ).trim();
                        if (!taskId2) throw new Error(videoHdText('taskIdMissing'));
                        (result.setTaskId(taskId2), outNodeId.onTaskId?.(taskId2));
                        if (
                          result.isCancelled() ||
                          isRunningHubToolbarTaskCancelled(outNodeId.targetNodeId)
                        ) {
                          await cancelRunningHubResultTask(
                            {
                              outId: outNodeId.targetNodeId,
                              taskId: taskId2,
                              sourceNodeId: sourceNodeId.id,
                              apiKey: apiKey,
                            },
                            {
                              name: videoHdText('cancelledName'),
                              outputText: videoHdText('cancelledOutput', {
                                model: videoHdText('modelFallback'),
                                prompt: videoHdText('promptLabel'),
                                status: videoHdText('status.cancelled'),
                              }),
                              notify: false,
                            },
                          );
                          throw new Error('CANCELLED');
                        }
                        return { taskId: taskId2 };
                      },
                      poll: async ({ taskId: taskId3, signal: signal, targetNodeId: targetNodeId2 }) => {
                        if (result.isCancelled() || isRunningHubToolbarTaskCancelled(targetNodeId2))
                          throw new Error('CANCELLED');
                        const input = await resumeRunninghubWorkflowTask(
                            { apiKey: apiKey, taskId: taskId3 },
                            {
                              signal: signal,
                              useOpenapiQuery: modelId.useOpenapiQuery === true,
                              taskKind: 'video',
                            },
                          ),
                          resultUrl = _extractFirstUrl(input);
                        if (!resultUrl) throw new Error(videoHdText('missingOutputUrl'));
                        if (isRunningHubToolbarTaskCancelled(targetNodeId2)) throw new Error('CANCELLED');
                        let localPath = '';
                        try {
                          localPath = await _saveRemoteVideoResult(resultUrl);
                        } catch {
                          throw new Error(videoHdText('localSaveFailed'));
                        }
                        if (isRunningHubToolbarTaskCancelled(targetNodeId2)) throw new Error('CANCELLED');
                        if (!localPath) throw new Error(videoHdText('localSaveFailed'));
                        return {
                          resultUrl: resultUrl,
                          localVideoFields: buildCanvasLocalVideoFields({
                            localPath: localPath,
                            videoUrl: resultUrl,
                          }),
                        };
                      },
                      resultBuilder: ({ localVideoFields: localVideoFields }) => {
                        const duration =
                          Date.now() - Number(store.getState().nodes?.[id]?.generationStartTime || startedAt);
                        return {
                          name: videoHdText('resultName'),
                          ...buildVideoGenerationResultPatch(localVideoFields, { duration: duration }),
                          ...localVideoFields,
                          fileName: 'hd_' + Date.now() + '.mp4',
                          outputText: videoHdOutputText(modelId),
                        };
                      },
                      failureBuilder: (error2) => {
                        const name = error2 instanceof Error ? error2.message : String(error2 || ''),
                          duration2 =
                            Date.now() -
                            Number(store.getState().nodes?.[id]?.generationStartTime || startedAt);
                        return {
                          name:
                            name === videoHdText('localSaveFailed')
                              ? videoHdText('resultName')
                              : videoHdText('failedName'),
                          ...buildVideoGenerationFailurePatch({ error: name, duration: duration2 }),
                          ...(name === videoHdText('localSaveFailed')
                            ? {
                                src: '',
                                videoUrl: '',
                                localPath: '',
                                thumbUrl: '',
                                videoMetaSrc: '',
                                fileName: 'hd_' + Date.now() + '.mp4',
                                rhStatusMessage: name,
                              }
                            : {}),
                          outputText:
                            name === videoHdText('localSaveFailed')
                              ? videoHdOutputText(modelId)
                              : videoHdOutputText(modelId, { error: name }),
                        };
                      },
                      cancelledBuilder: () => ({
                        name: videoHdText('cancelledName'),
                        outputText: videoHdOutputText(modelId, { status: videoHdText('status.cancelled') }),
                      }),
                    },
                    { store: store, abortController: abortController, startedAt: startedAt },
                  );
                if (response.status === 'success')
                  (window._triggerLocalCacheSave?.(),
                    window.showToast?.(videoHdText('successToast'), 'success'));
                else {
                  if (response.status === 'cancelled')
                    !outId.cancelRequested && window.showToast?.(videoHdText('taskCancelled'), 'info');
                  else {
                    if (response.status === 'failed') {
                      const error3 =
                        response.error instanceof Error
                          ? response.error.message
                          : String(response.error || '');
                      window.showToast?.(videoHdText('failedWithError', { error: error3 }), 'error');
                    }
                  }
                }
              } catch (error4) {
                const error5 = error4 instanceof Error ? error4.message : String(error4 || ''),
                  output =
                    outId.cancelRequested ||
                    result.isCancelled() ||
                    error5 === 'CANCELLED' ||
                    error5 === videoHdText('taskCancelled') ||
                    error5 === '任务已取消' ||
                    error5.includes('aborted');
                output
                  ? !outId.cancelRequested && window.showToast?.(videoHdText('taskCancelled'), 'info')
                  : window.showToast?.(videoHdText('failedWithError', { error: error5 }), 'error');
              } finally {
                result.reset(button);
              }
            }),
            el3
          );
        };
      (list2.forEach((item3) => {
        el2.appendChild(handler2(item3));
      }),
        document.body.appendChild(el2),
        el2.offsetHeight,
        (el2.style.pointerEvents = 'auto'),
        (el2.style.opacity = '1'),
        (el2.style.transform = 'translate(-50%, -100%)'));
      let value2 = null;
      run2 = () => {
        (requestAnimationFrame2 &&
          (cancelAnimationFrame(requestAnimationFrame2), (requestAnimationFrame2 = 0)),
          value2 && (document.removeEventListener('pointerdown', value2, true), (value2 = null)));
      };
      const value3 = () => {
        if (!document.body.contains(el2) || !document.body.contains(button)) {
          run2();
          return;
        }
        if (!run.hasVisibleAnchor()) {
          requestAnimationFrame2 = requestAnimationFrame(value3);
          return;
        }
        const box = run();
        ((el2.style.left = box.left + 'px'),
          (el2.style.top = box.top + 'px'),
          (requestAnimationFrame2 = requestAnimationFrame(value3)));
      };
      ((requestAnimationFrame2 = requestAnimationFrame(value3)),
        (value2 = (event5) => {
          if (el2.__v2HdClosing) return;
          !el2.contains(event5.target) && !button.contains(event5.target) && run3();
        }),
        document.addEventListener('pointerdown', value2, true));
    }));
}
