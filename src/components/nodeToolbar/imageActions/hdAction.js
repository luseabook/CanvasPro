import { t } from '../../../i18n/index.js';
import { createToolbarActionPopupAnchorPositionGetter } from '../actionMenu.js';
const IMAGE_HD_LEGACY_MODEL_LABEL = 'RH高清放大';
function imageHdText(value, item = {}) {
  return t('nodeToolbar.imageHd.' + value, item);
}
function uniqueList(list) {
  return Array.from(new Set(list.map((item2) => String(item2 || '').trim()).filter(Boolean)));
}
function imageHdOutputText({ resolution: resolution = '', status: status = '', error: error = '' } = {}) {
  const outputText = imageHdText('outputText', {
      model: imageHdText('modelLabel'),
      prompt: imageHdText('promptLabel'),
      resolution: resolution,
    }),
    outputText2 = status
      ? imageHdText('outputTextWithStatus', { outputText: outputText, status: status })
      : outputText;
  return error ? imageHdText('outputTextWithError', { outputText: outputText2, error: error }) : outputText2;
}
export function bindImageHdAction(key) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      getNodeData: getNodeData,
      _hdTaskMachine: _hdTaskMachine,
      _hdState: _hdState,
      store: store,
      submitTask: submitTask,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      runRunninghubWorkflow: runRunninghubWorkflow,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputImages: processInputImages,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      saveRemoteImageResultLocally: saveRemoteImageResultLocally,
      extractFirstImageUrl: extractFirstImageUrl,
      resolveApiInputRatioBasis: resolveApiInputRatioBasis,
      resolveFinalResultDisplaySize: resolveFinalResultDisplaySize,
      createToolbarCancelledError: createToolbarCancelledError,
      isToolbarCancelledError: isToolbarCancelledError,
      createLocalSaveFailureError: createLocalSaveFailureError,
      isLocalSaveFailure: isLocalSaveFailure,
      throwIfToolbarTaskCancelled: throwIfToolbarTaskCancelled,
      cancelRunningHubRemoteTaskQuietly: cancelRunningHubRemoteTaskQuietly,
      focusToolbarTaskNodes: focusToolbarTaskNodes,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
      buildClearedImageMediaFields: buildClearedImageMediaFields,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
    } = key,
    button = toolbarEl.querySelector('.act-hd');
  button &&
    (_hdTaskMachine.bindButton(button),
    bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () =>
        findRunningHubToolbarTaskForNode(nodeId, {
          models: ['runninghub/2012862147813974018'],
          taskTypes: ['image-hd'],
          outputTextIncludes: uniqueList([IMAGE_HD_LEGACY_MODEL_LABEL, imageHdText('modelLabel')]),
        }),
      cancelTask: async (index) => {
        try {
          if (_hdState.active && String(_hdState.outNodeId || '') === index.outId)
            try {
              await _hdTaskMachine.cancel();
            } catch (result) {
              console.warn('[ImageHD] cancel request failed:', result);
            }
          return await cancelRunningHubResultTask(index, {
            name: imageHdText('cancelledName'),
            outputText: imageHdOutputText({ status: imageHdText('status.cancelled') }),
            notifyMessage: imageHdText('cancelledToast'),
          });
        } finally {
          _hdState.active && String(_hdState.outNodeId || '') === index.outId && _hdTaskMachine.reset(button);
        }
      },
      cancelTooltip: imageHdText('cancelTooltip'),
    }),
    button.addEventListener('click', (event) => {
      (event.stopPropagation(), event.preventDefault());
      if (_hdState.active) {
        (async () => {
          let data = null;
          try {
            const options = _hdState.outNodeId
              ? {
                  outId: _hdState.outNodeId,
                  targetNodeId: _hdState.outNodeId,
                  taskId: _hdState.taskId,
                  apiKey: _hdState.apiKey,
                  sourceNodeId: nodeId,
                }
              : null;
            options
              ? await cancelRunningHubResultTask(options, {
                  name: imageHdText('cancelledName'),
                  outputText: imageHdOutputText({ status: imageHdText('status.cancelled') }),
                  notifyMessage: imageHdText('cancelledToast'),
                })
              : (await _hdTaskMachine.cancel(), window.showToast?.(imageHdText('taskCancelled'), 'info'));
          } catch (target) {
            data = target;
          }
          try {
            data && console.warn('[ImageHD] cancel request failed:', data);
          } finally {
            _hdTaskMachine.reset(button);
          }
        })();
        return;
      }
      const el = document.querySelector('.v2-hd-popup');
      if (el) {
        const source = el.__v2HdAnchorBtn && el.__v2HdAnchorBtn === button,
          handler = typeof el.__v2HdClose === 'function' ? el.__v2HdClose : () => el.remove();
        handler();
        if (source) return;
      }
      const el2 = document.createElement('div');
      ((el2.className = 'v2-hd-popup node-toolbar-action-menu'), (el2.__v2HdAnchorBtn = button));
      const run = createToolbarActionPopupAnchorPositionGetter(button),
        left = run();
      Object.assign(el2.style, {
        position: 'fixed',
        left: left.left + 'px',
        top: left.top + 'px',
        transform: 'translate(-50%, calc(-100% + 10px))',
        opacity: '0',
        pointerEvents: 'none',
      });
      const el3 = document.createElement('div');
      ((el3.className = 'node-toolbar-action-menu-title'),
        (el3.textContent = imageHdText('choosePlan')),
        el2.appendChild(el3));
      const list2 = [0x500, 0x780, 0xa00],
        handler2 = () => {
          const el4 = document.createElement('div');
          el4.className = 'node-toolbar-action-menu-item';
          const el5 = document.createElement('div');
          el5.className = 'node-toolbar-action-menu-icon';
          const next = document.createElement('img');
          ((next.className = 'node-toolbar-action-provider-logo'),
            (next.src = 'images/RH.png'),
            (next.alt = 'runninghub'),
            el5.appendChild(next),
            el4.appendChild(el5));
          const el6 = document.createElement('div');
          el6.className = 'node-toolbar-action-menu-body';
          const el7 = document.createElement('span');
          ((el7.className = 'node-toolbar-action-menu-item-title'),
            (el7.textContent = imageHdText('modelLabel')),
            el6.appendChild(el7));
          const el8 = document.createElement('span');
          ((el8.className = 'node-toolbar-action-menu-item-desc'),
            (el8.textContent = imageHdText('modelDesc')),
            el6.appendChild(el8),
            el4.appendChild(el6));
          const el9 = document.createElement('div');
          ((el9.className = 'node-toolbar-action-caret'), (el9.innerHTML = '&gt;'), el4.appendChild(el9));
          let el10 = null,
            setTimeout2 = 0,
            setTimeout3 = 0,
            requestAnimationFrame2 = 0,
            value2 = null;
          const run2 = () => {
              if (setTimeout2) clearTimeout(setTimeout2);
              setTimeout2 = 0;
              if (setTimeout3) clearTimeout(setTimeout3);
              setTimeout3 = 0;
              if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
              ((requestAnimationFrame2 = 0),
                value2 && (document.removeEventListener('pointerdown', value2), (value2 = null)));
            },
            handler3 = () => {
              if (!el10) return;
              const el11 = el10;
              el10 = null;
              if (el2.__v2HdSubmenuEl === el11) el2.__v2HdSubmenuEl = null;
              (el4.classList.remove('is-open'), run2());
              if (document.body.contains(el11)) el11.remove();
            },
            handler4 = () => {
              if (setTimeout3) clearTimeout(setTimeout3);
              setTimeout3 = 0;
            },
            handler5 = () => {
              (handler4(), (setTimeout3 = setTimeout(() => handler3(), 160)));
            },
            handler6 = () => {
              if (el10 && document.body.contains(el10)) return el10;
              const el12 = document.querySelector('.v2-hd-submenu');
              if (el12) el12.remove();
              ((el10 = document.createElement('div')),
                (el10.className = 'v2-hd-submenu node-toolbar-action-submenu'),
                (el2.__v2HdSubmenuEl = el10),
                el4.classList.add('is-open'),
                Object.assign(el10.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' }));
              const current = () => {
                if (!el10 || !document.body.contains(el10) || !document.body.contains(el4)) {
                  if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
                  requestAnimationFrame2 = 0;
                  return;
                }
                const box = el4.getBoundingClientRect();
                if (box.width <= 0 || box.height <= 0) {
                  requestAnimationFrame2 = requestAnimationFrame(current);
                  return;
                }
                const entry = 12,
                  record = 8,
                  payload = el10.offsetWidth || 180,
                  handle = box.right + entry,
                  state = box.left - payload - entry,
                  config = window.innerWidth - payload - record,
                  scope = handle <= config ? handle : Math.max(record, state);
                ((el10.style.left = scope + 'px'),
                  (el10.style.top = box.top + 'px'),
                  (requestAnimationFrame2 = requestAnimationFrame(current)));
              };
              ((requestAnimationFrame2 = requestAnimationFrame(current)),
                el10.addEventListener('pointerenter', (input) => {
                  if (input.pointerType !== 'mouse') return;
                  handler4();
                }),
                el10.addEventListener('pointerleave', (output) => {
                  if (output.pointerType !== 'mouse') return;
                  handler5();
                }));
              const el13 = document.createElement('div');
              return (
                (el13.className = 'node-toolbar-action-menu-title'),
                (el13.textContent = imageHdText('chooseResolution')),
                el10.appendChild(el13),
                list2.forEach((item3) => {
                  const el14 = document.createElement('div');
                  ((el14.className = 'node-toolbar-action-menu-item node-toolbar-action-submenu-item'),
                    (el14.textContent = item3),
                    el14.addEventListener('click', async (event2) => {
                      (event2.stopPropagation(), handler3(), handler7());
                      const resolution2 = item3,
                        value3 = nodeId,
                        el15 = button.querySelector('svg');
                      if (el15) el15.classList.add('v2-spinning');
                      const abortController = new AbortController();
                      let taskId = '',
                        apiKey = '',
                        width = null,
                        imageUrl = '',
                        thumbUrl = '',
                        localPath = '';
                      try {
                        const value4 = getNodeData(),
                          value5 =
                            value4?.localPath ||
                            (value4?.images && value4.images[value4.mainImageIndex || 0]?.localPath),
                          imgUrl = value5 ? '/' + value5 : value4?.src || value4?.sourceUrl;
                        if (!imgUrl) {
                          window.showToast?.(imageHdText('noProcessableImage'), 'error');
                          return;
                        }
                        await ensureConfig();
                        const value6 = getProviderConfig('runninghubwf');
                        apiKey = String(value6?.apiKey || '').trim();
                        if (!apiKey) {
                          window.showToast?.(imageHdText('apiKeyMissing'), 'error');
                          return;
                        }
                        const sourceNodeId = store.getState().nodes[value3] || value4;
                        if (!sourceNodeId) {
                          window.showToast?.(imageHdText('sourceNodeMissing'), 'error');
                          return;
                        }
                        const inputBasis = await resolveApiInputRatioBasis(sourceNodeId, imgUrl),
                          { width: width2, height: height } = calcDisplaySizeByMedia(
                            inputBasis.width,
                            inputBasis.height,
                          ),
                          { x: x, y: y } = calcSafeSpawnPosNearNode(
                            store.getState().nodes,
                            sourceNodeId,
                            width2,
                            height,
                          ),
                          workflowId = '2012862147813974018',
                          modelId = 'runninghub/' + workflowId,
                          id = 'source-image-hd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                          outputText3 = imageHdOutputText({ resolution: resolution2 }),
                          response = await submitTask(
                            {
                              sourceNodeId: sourceNodeId.id,
                              trigger: 'toolbar',
                              taskType: 'image-hd',
                              provider: 'runninghubwf',
                              adapterType: 'workflow',
                              modelId: modelId,
                              executionId: 'runninghub.image-hd',
                              payload: {
                                apiKey: apiKey,
                                imgUrl: imgUrl,
                                inputBasis: inputBasis,
                                selectedResolution: resolution2,
                                outputText: outputText3,
                              },
                              cancellable: true,
                              resumable: true,
                              onTaskChange: notifyImageToolbarTaskChange,
                              createTargetNode: ({
                                startedAt: startedAt,
                                startPatch: startPatch,
                                protocolPatch: protocolPatch,
                              }) =>
                                buildSourceMediaNodePayload({
                                  id: id,
                                  type: 'source-image',
                                  x: x,
                                  y: y,
                                  width: width2,
                                  height: height,
                                  needsAutoResize: false,
                                  name: imageHdText('processingName'),
                                  src: '',
                                  outputText: outputText3,
                                  localPath: '',
                                  fileName: 'hd_' + Date.now() + '.jpg',
                                  provider: 'runninghubwf',
                                  model: modelId,
                                  rhTaskUseOpenapiQuery: false,
                                  ...startPatch,
                                  ...protocolPatch,
                                  generationStartTime: startedAt,
                                  rhTaskStartedAt: startedAt,
                                }),
                              submit: async (value7, outNodeId) => {
                                (focusToolbarTaskNodes(sourceNodeId.id, outNodeId.targetNodeId),
                                  _hdTaskMachine.activate({
                                    button: button,
                                    apiKey: apiKey,
                                    abortController: abortController,
                                    outNodeId: outNodeId.targetNodeId,
                                  }));
                                const list3 = await processInputImages([value7.imgUrl], apiKey, {
                                  applyInputQualityProfile: true,
                                  provider: 'runninghub',
                                });
                                if (list3.length === 0) throw new Error(imageHdText('uploadEmpty'));
                                const fieldValue = String(list3[0] || '').trim();
                                if (!fieldValue) throw new Error(imageHdText('uploadFailed'));
                                throwIfToolbarTaskCancelled(outNodeId.targetNodeId);
                                const value8 = await runRunninghubWorkflow(
                                  {
                                    apiKey: apiKey,
                                    workflowId: workflowId,
                                    addMetadata: false,
                                    nodeInfoList: [
                                      { nodeId: '416', fieldName: 'image', fieldValue: fieldValue },
                                      { nodeId: '413', fieldName: 'value', fieldValue: resolution2 },
                                    ],
                                    instanceType: 'default',
                                    usePersonalQueue: 'false',
                                  },
                                  { signal: abortController.signal },
                                );
                                taskId = String(value8?.data?.taskId || value8?.taskId || '').trim();
                                if (!taskId) throw new Error(imageHdText('taskIdMissing'));
                                (_hdTaskMachine.setTaskId(taskId), outNodeId.onTaskId(taskId));
                                if (
                                  _hdTaskMachine.isCancelled() ||
                                  isRunningHubToolbarTaskCancelled(outNodeId.targetNodeId)
                                ) {
                                  await cancelRunningHubRemoteTaskQuietly({
                                    apiKey: apiKey,
                                    taskId: taskId,
                                    label: 'ImageHD',
                                  });
                                  throw createToolbarCancelledError();
                                }
                                return { taskId: taskId };
                              },
                              poll: async ({
                                taskId: taskId2,
                                signal: signal,
                                targetNodeId: targetNodeId,
                              }) => {
                                if (
                                  _hdTaskMachine.isCancelled() ||
                                  isRunningHubToolbarTaskCancelled(targetNodeId)
                                )
                                  throw createToolbarCancelledError();
                                const value9 = await resumeRunninghubWorkflowTask(
                                  { apiKey: apiKey, taskId: taskId2 },
                                  { signal: signal, taskKind: 'image' },
                                );
                                if (
                                  _hdTaskMachine.isCancelled() ||
                                  isRunningHubToolbarTaskCancelled(targetNodeId)
                                )
                                  throw createToolbarCancelledError();
                                const resultUrl = extractFirstImageUrl(value9);
                                if (!resultUrl) throw new Error(imageHdText('missingResultImage'));
                                return { resultUrl: resultUrl };
                              },
                              cancel: ({ taskId: taskId3 }) =>
                                cancelRunningHubRemoteTaskQuietly({
                                  apiKey: apiKey,
                                  taskId: taskId3,
                                  label: 'ImageHD',
                                }),
                              resultBuilder: async (value10, startedAt2) => {
                                const imageUrl2 = String(value10?.resultUrl || '').trim();
                                if (!imageUrl2) throw new Error(imageHdText('missingResultImage'));
                                imageUrl = imageUrl2;
                                let args = null;
                                try {
                                  args = await saveRemoteImageResultLocally(imageUrl2, {
                                    projectId: window.currentProjectId || 'default_v2_project',
                                    includeSrc: true,
                                  });
                                } catch (value11) {
                                  console.error('保存图片失败:', value11);
                                }
                                ((localPath = args?.localPath || ''),
                                  (thumbUrl = args?.thumbUrl || imageUrl2));
                                if (!localPath) throw createLocalSaveFailureError();
                                return (
                                  (width = await resolveFinalResultDisplaySize(inputBasis, {
                                    localPath: localPath,
                                    imageUrl: imageUrl2,
                                    sourceUrl: imageUrl2,
                                    thumbUrl: thumbUrl,
                                    src: thumbUrl || imageUrl2,
                                  })),
                                  {
                                    name: imageHdText('resultName'),
                                    ...buildImageGenerationResultPatch(args.fields, {
                                      startedAt: startedAt2.startedAt,
                                    }),
                                    ...args.fields,
                                    fileName: 'hd_' + Date.now() + '.jpg',
                                    width: width.width,
                                    height: width.height,
                                    outputText: outputText3,
                                  }
                                );
                              },
                              failureBuilder: async (error2, startedAt3) => {
                                const error3 =
                                  error2 instanceof Error
                                    ? error2.message
                                    : String(error2 || imageHdText('unknownError'));
                                if (isLocalSaveFailure(error2))
                                  return (
                                    (width ||= await resolveFinalResultDisplaySize(inputBasis, {
                                      localPath: localPath,
                                      imageUrl: imageUrl,
                                      sourceUrl: imageUrl,
                                      thumbUrl: thumbUrl,
                                      src: thumbUrl || imageUrl,
                                    })),
                                    {
                                      name: imageHdText('resultName'),
                                      ...buildClearedImageMediaFields(),
                                      width: width.width,
                                      height: width.height,
                                      outputText: outputText3,
                                      ...buildImageGenerationFailurePatch({
                                        error: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                                        startedAt: startedAt3.startedAt,
                                      }),
                                      rhStatusMessage: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                                    }
                                  );
                                return {
                                  name: imageHdText('failedName'),
                                  ...buildImageGenerationFailurePatch({
                                    error: error3,
                                    startedAt: startedAt3.startedAt,
                                  }),
                                  outputText: imageHdText('outputTextWithError', {
                                    outputText: outputText3,
                                    error: error3,
                                  }),
                                };
                              },
                              cancelledBuilder: () => ({
                                name: imageHdText('cancelledName'),
                                outputText: imageHdOutputText({ status: imageHdText('status.cancelled') }),
                              }),
                            },
                            { abortController: abortController },
                          );
                        if (response.status === 'success')
                          window.showToast?.(imageHdText('successToast'), 'success');
                        else {
                          if (response.status === 'failed') {
                            if (isLocalSaveFailure(response.error))
                              window.showToast?.('⚠️ ' + IMAGE_LOCAL_SAVE_FAILURE_MESSAGE, 'warn');
                            else {
                              const error4 =
                                response.error instanceof Error
                                  ? response.error.message
                                  : String(response.error || imageHdText('unknownError'));
                              window.showToast?.(imageHdText('failedWithError', { error: error4 }), 'error');
                            }
                          } else
                            response.status === 'cancelled' &&
                              window.showToast?.(imageHdText('cancelledToast'), 'info');
                        }
                      } catch (error5) {
                        const error6 = error5 instanceof Error ? error5.message : String(error5 || '');
                        isToolbarCancelledError(error5)
                          ? window.showToast?.(imageHdText('cancelledToast'), 'info')
                          : (console.error('RH高清放大失败:', error5),
                            window.showToast?.(imageHdText('failedWithError', { error: error6 }), 'error'));
                      } finally {
                        if (el15) el15.classList.remove('v2-spinning');
                        _hdTaskMachine.reset(button);
                      }
                    }),
                    el10.appendChild(el14));
                }),
                document.body.appendChild(el10),
                el10.offsetHeight,
                (el10.style.opacity = '1'),
                (el10.style.pointerEvents = 'auto'),
                (value2 = (event3) => {
                  if (!el10) return;
                  if (!el10.contains(event3.target) && !el4.contains(event3.target)) handler3();
                }),
                document.addEventListener('pointerdown', value2),
                el10
              );
            };
          ((el4.__v2LastPointerType = 'mouse'),
            el4.addEventListener('pointerdown', (value12) => {
              el4.__v2LastPointerType = value12.pointerType || 'mouse';
            }));
          const run3 = () => {
            handler4();
            if (setTimeout2) clearTimeout(setTimeout2);
            setTimeout2 = setTimeout(() => handler6(), 60);
          };
          return (
            el4.addEventListener('pointerenter', (value13) => {
              if (value13.pointerType !== 'mouse') return;
              run3();
            }),
            el4.addEventListener('pointerleave', (value14) => {
              if (value14.pointerType !== 'mouse') return;
              handler5();
            }),
            el4.addEventListener('click', (event4) => {
              event4.stopPropagation();
              if (el4.__v2LastPointerType === 'touch') {
                if (el10 && document.body.contains(el10)) handler3();
                else handler6();
                return;
              }
              handler6();
            }),
            el4
          );
        };
      (el2.appendChild(handler2()),
        document.body.appendChild(el2),
        el2.offsetHeight,
        (el2.style.pointerEvents = 'auto'),
        (el2.style.opacity = '1'),
        (el2.style.transform = 'translate(-50%, -100%)'));
      let requestAnimationFrame3 = 0,
        value15 = null;
      const run4 = () => {
          if (requestAnimationFrame3) cancelAnimationFrame(requestAnimationFrame3);
          ((requestAnimationFrame3 = 0),
            value15 && (document.removeEventListener('pointerdown', value15), (value15 = null)));
        },
        handler7 = () => {
          if (el2.__v2HdClosing) return;
          ((el2.__v2HdClosing = true),
            run4(),
            (el2.style.opacity = '0'),
            (el2.style.pointerEvents = 'none'),
            (el2.style.transform = 'translate(-50%, calc(-100% + 10px))'),
            setTimeout(() => el2.remove(), 250));
        };
      el2.__v2HdClose = handler7;
      const value16 = () => {
        if (!document.body.contains(el2) || !document.body.contains(button)) {
          run4();
          return;
        }
        if (!run.hasVisibleAnchor()) {
          requestAnimationFrame3 = requestAnimationFrame(value16);
          return;
        }
        const box2 = run();
        ((el2.style.left = box2.left + 'px'),
          (el2.style.top = box2.top + 'px'),
          (requestAnimationFrame3 = requestAnimationFrame(value16)));
      };
      ((requestAnimationFrame3 = requestAnimationFrame(value16)),
        (value15 = (event5) => {
          if (el2.__v2HdClosing) return;
          const value17 = el2.__v2HdSubmenuEl,
            enabled = el2.contains(event5.target),
            enabled2 = value17 && value17.contains(event5.target);
          if (!enabled && !enabled2 && event5.target !== button) handler7();
        }),
        setTimeout(() => document.addEventListener('pointerdown', value15), 10));
    }));
}
