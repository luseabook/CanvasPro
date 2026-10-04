import { t } from '../../../i18n/index.js';
import { createToolbarActionPopupAnchorPositionGetter } from '../actionMenu.js';
function autoSubjectText(value, item = {}) {
  return t('nodeToolbar.autoSubject.' + value, item);
}
export function bindImageAutoSubjectAction(key) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      getNodeData: getNodeData,
      store: store,
      submitTask: submitTask,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      resolveCanvasImagePreviewUrl: resolveCanvasImagePreviewUrl,
      localPathToUrl: localPathToUrl,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      runRunninghubAiApp: runRunninghubAiApp,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputImages: processInputImages,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      buildToolbarImageFields: buildToolbarImageFields,
      saveRemoteImageResultLocally: saveRemoteImageResultLocally,
      extractFirstImageUrl: extractFirstImageUrl,
      parseRhCode: parseRhCode,
      parseRhTaskId: parseRhTaskId,
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
    button = toolbarEl.querySelector('.act-auto-subject');
  if (button) {
    const subjectDetectMode = 'rh-matting',
      index = 'RH抠图',
      modelId = 'runninghub/2042329021530247170',
      list = [
        { key: 'transparent', labelKey: 'transparent' },
        { key: 'white', labelKey: 'white' },
        { key: 'black', labelKey: 'black' },
        { key: 'gray', labelKey: 'gray' },
      ],
      model = () => autoSubjectText('modeLabel'),
      handler = (result) => autoSubjectText('backgrounds.' + result),
      handler2 = () => {
        button.dataset.tooltip = autoSubjectText('buttonTooltip');
      };
    (handler2(),
      bindRunningHubToolbarTaskButton({
        button: button,
        getTask: () =>
          findRunningHubToolbarTaskForNode(nodeId, {
            models: [modelId],
            taskTypes: ['image-auto-subject'],
            outputTextIncludes: [index, model()],
          }),
        cancelTask: (data) =>
          cancelRunningHubResultTask(data, {
            name: autoSubjectText('cancelledName'),
            outputText: autoSubjectText('cancelledOutput', { model: model() }),
            notifyMessage: autoSubjectText('cancelledToast'),
          }),
        cancelTooltip: autoSubjectText('cancelTooltip'),
      }));
    let el = null,
      el2 = null,
      el3 = null,
      requestAnimationFrame2 = 0,
      requestAnimationFrame3 = 0,
      setTimeout2 = 0,
      value2 = null,
      value3 = null,
      value4 = null;
    const run = () => {
        if (setTimeout2) clearTimeout(setTimeout2);
        setTimeout2 = 0;
        if (requestAnimationFrame3) cancelAnimationFrame(requestAnimationFrame3);
        ((requestAnimationFrame3 = 0),
          value3 && (document.removeEventListener('pointerdown', value3), (value3 = null)));
      },
      handler3 = () => {
        if (!el2) return;
        const el4 = el2;
        el2 = null;
        if (el3) el3.classList.remove('is-open');
        run();
        if (document.body.contains(el4)) el4.remove();
        if (el3) el3.__v2SubjectSubOpen = false;
      },
      handler4 = () => {
        if (!el2) return;
        el2.querySelectorAll('.v2-subject-bg-item').forEach((el5) => {
          ((el5.__v2IsActive = false), el5.classList.remove('is-active'));
        });
      },
      handler5 = () => {
        if (!el) return;
        const el6 = el;
        ((el = null), (el3 = null), handler3());
        value2 && (document.removeEventListener('pointerdown', value2), (value2 = null));
        value4 && (toolbarEl.removeEventListener('pointerdown', value4, true), (value4 = null));
        if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
        requestAnimationFrame2 = 0;
        if (!document.body.contains(el6)) return;
        ((el6.style.opacity = '0'),
          (el6.style.pointerEvents = 'none'),
          (el6.style.transform = 'translate(-50%, calc(-100% + 10px))'),
          setTimeout(() => {
            if (document.body.contains(el6)) el6.remove();
          }, 250));
      },
      handler6 = () => {
        if (setTimeout2) clearTimeout(setTimeout2);
        setTimeout2 = setTimeout(() => handler3(), 160);
      },
      handler7 = () => {
        if (setTimeout2) clearTimeout(setTimeout2);
        setTimeout2 = 0;
      },
      handler8 = (el7) => {
        if (el2 && document.body.contains(el2)) return (handler4(), el2);
        const el8 = document.querySelector('.v2-subject-submenu');
        if (el8) el8.remove();
        ((el2 = document.createElement('div')),
          (el2.className = 'v2-subject-submenu node-toolbar-action-submenu'),
          el7.classList.add('is-open'),
          Object.assign(el2.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' }));
        const options = () => {
          if (!el2 || !document.body.contains(el2) || !document.body.contains(el7)) {
            if (requestAnimationFrame3) cancelAnimationFrame(requestAnimationFrame3);
            requestAnimationFrame3 = 0;
            return;
          }
          const box = el7.getBoundingClientRect();
          if (box.width <= 0 || box.height <= 0) {
            requestAnimationFrame3 = requestAnimationFrame(options);
            return;
          }
          const target = 12,
            source = 8,
            next = el2.offsetWidth || 180,
            current = box.right + target,
            entry = box.left - next - target,
            record = window.innerWidth - next - source,
            payload = current <= record ? current : Math.max(source, entry);
          ((el2.style.left = payload + 'px'),
            (el2.style.top = box.top + 'px'),
            (el2.style.transform = 'translate(0, 0)'),
            (requestAnimationFrame3 = requestAnimationFrame(options)));
        };
        ((requestAnimationFrame3 = requestAnimationFrame(options)),
          el2.addEventListener('pointerenter', (handle) => {
            if (handle.pointerType !== 'mouse') return;
            handler7();
          }),
          el2.addEventListener('pointerleave', (state) => {
            if (state.pointerType !== 'mouse') return;
            handler6();
          }));
        const el9 = document.createElement('div');
        return (
          (el9.className = 'node-toolbar-action-menu-title'),
          (el9.textContent = autoSubjectText('chooseBackground')),
          el2.appendChild(el9),
          list.forEach((subjectDetectBackground) => {
            const el10 = document.createElement('div');
            ((el10.className =
              'v2-subject-bg-item node-toolbar-action-menu-item node-toolbar-action-submenu-item'),
              (el10.dataset.bgKey = subjectDetectBackground.key),
              (el10.textContent = handler(subjectDetectBackground.key)),
              el10.addEventListener('click', (event) => {
                event.stopPropagation();
                const config = { transparent: 0, white: 1, black: 2, gray: 3 },
                  bgIndex = config[subjectDetectBackground.key];
                if (bgIndex === undefined) {
                  window.showToast?.(autoSubjectText('invalidBackground'), 'error');
                  return;
                }
                (handler3(),
                  handler5(),
                  (async () => {
                    const background = handler(subjectDetectBackground.key),
                      outputText = autoSubjectText('outputText', {
                        model: model(),
                        background: background,
                      });
                    let width = null,
                      imageUrl = '',
                      thumbUrl = '',
                      localPath = '';
                    try {
                      const scope = getNodeData() || {},
                        input =
                          scope?.localPath ||
                          (scope?.images && scope.images[scope.mainImageIndex || 0]?.localPath),
                        imgUrl = localPathToUrl(input) || resolveCanvasImagePreviewUrl(scope);
                      if (!imgUrl) {
                        window.showToast?.(autoSubjectText('noProcessableImage'), 'error');
                        return;
                      }
                      await ensureConfig();
                      const output = getProviderConfig('runninghubwf'),
                        apiKey = String(output?.apiKey || '').trim();
                      if (!apiKey) {
                        window.showToast?.(autoSubjectText('apiKeyMissing'), 'error');
                        return;
                      }
                      const sourceNodeId = store.getState().nodes[nodeId] || scope;
                      if (!sourceNodeId) {
                        window.showToast?.(autoSubjectText('sourceNodeMissing'), 'error');
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
                        id =
                          'source-image-subject-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                        response = await submitTask({
                          sourceNodeId: sourceNodeId.id,
                          trigger: 'toolbar',
                          taskType: 'image-auto-subject',
                          provider: 'runninghubwf',
                          adapterType: 'workflow',
                          modelId: modelId,
                          executionId: 'runninghub.image-auto-subject',
                          payload: {
                            apiKey: apiKey,
                            bgIndex: bgIndex,
                            imgUrl: imgUrl,
                            inputBasis: inputBasis,
                            outputText: outputText,
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
                              name: autoSubjectText('processingName'),
                              src: '',
                              outputText: outputText,
                              localPath: '',
                              fileName: 'subject_' + Date.now() + '.png',
                              provider: 'runninghubwf',
                              model: modelId,
                              rhTaskUseOpenapiQuery: true,
                              ...startPatch,
                              ...protocolPatch,
                              generationStartTime: startedAt,
                              rhTaskStartedAt: startedAt,
                            }),
                          submit: async (value5, signal) => {
                            focusToolbarTaskNodes(sourceNodeId.id, signal.targetNodeId);
                            const value6 = await processInputImages([value5.imgUrl], apiKey, {
                                applyInputQualityProfile: true,
                                provider: 'runninghub',
                              }),
                              fieldValue = String(value6?.[0] || '').trim();
                            if (!fieldValue) throw new Error(autoSubjectText('uploadFailed'));
                            throwIfToolbarTaskCancelled(signal.targetNodeId);
                            const error = await runRunninghubAiApp(
                                {
                                  apiKey: apiKey,
                                  appId: '2042329021530247170',
                                  nodeInfoList: [
                                    {
                                      nodeId: '5',
                                      fieldName: 'image',
                                      fieldValue: fieldValue,
                                      description: '上传图片',
                                    },
                                    {
                                      nodeId: '7',
                                      fieldName: 'index',
                                      fieldValue: bgIndex,
                                      description: '背景颜色',
                                    },
                                  ],
                                  instanceType: 'default',
                                  usePersonalQueue: 'false',
                                },
                                { signal: signal.signal },
                              ),
                              count = parseRhCode(error);
                            if (count !== null && count !== 0)
                              throw new Error(
                                String(error?.msg || error?.message || autoSubjectText('createTaskFailed')),
                              );
                            const taskId = parseRhTaskId(error);
                            if (taskId) signal.onTaskId(taskId);
                            if (isRunningHubToolbarTaskCancelled(signal.targetNodeId)) {
                              await cancelRunningHubRemoteTaskQuietly({
                                apiKey: apiKey,
                                taskId: taskId,
                                label: 'AutoSubject',
                              });
                              throw createToolbarCancelledError();
                            }
                            return taskId
                              ? { taskId: taskId }
                              : { result: { resultUrl: extractFirstImageUrl(error) } };
                          },
                          poll: async ({ taskId: taskId2, signal: signal2, targetNodeId: targetNodeId }) => {
                            const value7 = taskId2
                                ? await resumeRunninghubWorkflowTask(
                                    { apiKey: apiKey, taskId: taskId2 },
                                    { signal: signal2, useOpenapiQuery: true, taskKind: 'image' },
                                  )
                                : null,
                              resultUrl = extractFirstImageUrl(value7);
                            throwIfToolbarTaskCancelled(targetNodeId);
                            if (!resultUrl) throw new Error(autoSubjectText('missingResultImage'));
                            return { resultUrl: resultUrl };
                          },
                          cancel: ({ taskId: taskId3 }) =>
                            cancelRunningHubRemoteTaskQuietly({
                              apiKey: apiKey,
                              taskId: taskId3,
                              label: 'AutoSubject',
                            }),
                          resultBuilder: async (value8, startedAt2) => {
                            const resultUrl2 = String(value8?.resultUrl || '').trim();
                            if (!resultUrl2) throw new Error(autoSubjectText('missingResultImage'));
                            imageUrl = resultUrl2;
                            let args = buildToolbarImageFields({
                              localPath: '',
                              resultUrl: resultUrl2,
                              thumbUrl: resultUrl2,
                            });
                            ((thumbUrl = resultUrl2), (localPath = ''));
                            try {
                              const value9 = await saveRemoteImageResultLocally(resultUrl2, {
                                projectId: window.currentProjectId || 'default_v2_project',
                              });
                              ((args = value9.fields),
                                (thumbUrl = value9.thumbUrl || resultUrl2),
                                (localPath = value9.localPath || ''));
                            } catch (value10) {
                              console.warn('[AutoSubject] saveRemoteImageLocally failed:', value10);
                            }
                            width = await resolveFinalResultDisplaySize(inputBasis, {
                              localPath: localPath,
                              imageUrl: resultUrl2,
                              sourceUrl: resultUrl2,
                              thumbUrl: thumbUrl,
                              src: thumbUrl || resultUrl2,
                            });
                            if (!localPath) throw createLocalSaveFailureError();
                            return (
                              store.updateNodeData(nodeId, {
                                subjectDetectMode: subjectDetectMode,
                                subjectDetectBackground: subjectDetectBackground.key,
                              }),
                              {
                                name: autoSubjectText('resultName'),
                                ...buildImageGenerationResultPatch(args, { startedAt: startedAt2.startedAt }),
                                ...args,
                                fileName: 'subject_' + Date.now() + '.png',
                                width: width.width,
                                height: width.height,
                                outputText: outputText,
                              }
                            );
                          },
                          failureBuilder: async (error2, startedAt3) => {
                            const error3 =
                              error2 instanceof Error
                                ? error2.message
                                : String(error2 || autoSubjectText('unknownError'));
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
                                  name: autoSubjectText('resultName'),
                                  ...buildClearedImageMediaFields(),
                                  fileName: 'subject_' + Date.now() + '.png',
                                  width: width.width,
                                  height: width.height,
                                  outputText: outputText,
                                  ...buildImageGenerationFailurePatch({
                                    error: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                                    startedAt: startedAt3.startedAt,
                                  }),
                                  rhStatusMessage: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                                }
                              );
                            return {
                              name: autoSubjectText('failedName'),
                              ...buildImageGenerationFailurePatch({
                                error: error3,
                                startedAt: startedAt3.startedAt,
                              }),
                              outputText: autoSubjectText('outputTextWithError', {
                                outputText: outputText,
                                error: error3,
                              }),
                            };
                          },
                          cancelledBuilder: () => ({
                            name: autoSubjectText('cancelledName'),
                            outputText: autoSubjectText('cancelledOutput', { model: model() }),
                          }),
                        });
                      handler2();
                      if (response.status === 'success')
                        window.showToast?.(
                          autoSubjectText('completed', { background: background }),
                          'success',
                        );
                      else {
                        if (response.status === 'failed') {
                          if (isLocalSaveFailure(response.error))
                            window.showToast?.('⚠️ ' + IMAGE_LOCAL_SAVE_FAILURE_MESSAGE, 'warn');
                          else {
                            const error4 =
                              response.error instanceof Error
                                ? response.error.message
                                : String(response.error || autoSubjectText('unknownError'));
                            window.showToast?.(
                              autoSubjectText('failedWithError', { error: error4 }),
                              'error',
                            );
                          }
                        } else
                          response.status === 'cancelled' &&
                            window.showToast?.(autoSubjectText('cancelledToast'), 'info');
                      }
                    } catch (error5) {
                      const error6 =
                        error5 instanceof Error
                          ? error5.message
                          : String(error5 || autoSubjectText('unknownError'));
                      if (isToolbarCancelledError(error5)) {
                        window.showToast?.(autoSubjectText('cancelledToast'), 'info');
                        return;
                      }
                      window.showToast?.(autoSubjectText('failedWithError', { error: error6 }), 'error');
                    }
                  })());
              }),
              el2.appendChild(el10));
          }),
          document.body.appendChild(el2),
          handler4(),
          el2.offsetHeight,
          (el2.style.opacity = '1'),
          (el2.style.pointerEvents = 'auto'),
          (value3 = (event2) => {
            if (!el2) return;
            !el2.contains(event2.target) && !el7.contains(event2.target) && handler3();
          }),
          document.addEventListener('pointerdown', value3),
          el2
        );
      },
      handler9 = () => {
        if (el && document.body.contains(el)) return el;
        const el11 = document.querySelector('.v2-hd-popup');
        if (el11) {
          if (typeof el11.__v2HdClose === 'function') el11.__v2HdClose();
          else el11.remove();
        }
        const el12 = document.querySelector('.v2-subject-popup');
        if (el12) {
          if (typeof el12.__v2SubjectClose === 'function') el12.__v2SubjectClose();
          else el12.remove();
        }
        ((el = document.createElement('div')), (el.className = 'v2-subject-popup node-toolbar-action-menu'));
        const run2 = createToolbarActionPopupAnchorPositionGetter(button),
          left = run2();
        Object.assign(el.style, {
          position: 'fixed',
          left: left.left + 'px',
          top: left.top + 'px',
          transform: 'translate(-50%, calc(-100% + 10px))',
          opacity: '0',
          pointerEvents: 'none',
        });
        const el13 = document.createElement('div');
        ((el13.className = 'node-toolbar-action-menu-title'),
          (el13.textContent = autoSubjectText('chooseMode')),
          el.appendChild(el13),
          (el3 = document.createElement('div')),
          (el3.className = 'node-toolbar-action-menu-item'));
        const el14 = document.createElement('div');
        el14.className = 'node-toolbar-action-menu-icon';
        const value11 = document.createElement('img');
        ((value11.className = 'node-toolbar-action-provider-logo'),
          (value11.src = 'images/RH.png'),
          (value11.alt = 'runninghub'),
          el14.appendChild(value11),
          el3.appendChild(el14));
        const el15 = document.createElement('div');
        el15.className = 'node-toolbar-action-menu-body';
        const el16 = document.createElement('span');
        ((el16.className = 'node-toolbar-action-menu-item-title'),
          (el16.textContent = model()),
          el15.appendChild(el16));
        const el17 = document.createElement('span');
        ((el17.className = 'node-toolbar-action-menu-item-desc'),
          (el17.textContent = autoSubjectText('modeDesc')),
          el15.appendChild(el17),
          el3.appendChild(el15));
        const el18 = document.createElement('div');
        ((el18.className = 'node-toolbar-action-caret'),
          (el18.innerHTML = '&gt;'),
          el3.appendChild(el18),
          (el3.__v2LastPointerType = 'mouse'),
          (el3.__v2SubjectSubOpen = false),
          el3.addEventListener('pointerdown', (value12) => {
            el3.__v2LastPointerType = value12.pointerType || 'mouse';
          }),
          el3.addEventListener('click', (event3) => {
            event3.stopPropagation();
            if (el3.__v2LastPointerType === 'touch') {
              el2 && document.body.contains(el2)
                ? handler3()
                : (handler8(el3), (el3.__v2SubjectSubOpen = true));
              return;
            }
            (handler8(el3), (el3.__v2SubjectSubOpen = true));
          }),
          el3.addEventListener('pointerenter', (value13) => {
            if (value13.pointerType !== 'mouse') return;
            (handler7(), handler8(el3), (el3.__v2SubjectSubOpen = true));
          }),
          el3.addEventListener('pointerleave', (value14) => {
            if (value14.pointerType !== 'mouse') return;
            handler6();
          }),
          el.appendChild(el3),
          document.body.appendChild(el),
          el.offsetHeight,
          (el.style.pointerEvents = 'auto'),
          (el.style.opacity = '1'),
          (el.style.transform = 'translate(-50%, -100%)'),
          (el.__v2SubjectClose = handler5));
        const value15 = () => {
          if (!document.body.contains(el) || !document.body.contains(button)) {
            if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
            requestAnimationFrame2 = 0;
            return;
          }
          if (!run2.hasVisibleAnchor()) {
            requestAnimationFrame2 = requestAnimationFrame(value15);
            return;
          }
          const box2 = run2();
          ((el.style.left = box2.left + 'px'),
            (el.style.top = box2.top + 'px'),
            (requestAnimationFrame2 = requestAnimationFrame(value15)));
        };
        return (
          (requestAnimationFrame2 = requestAnimationFrame(value15)),
          (value2 = (event4) => {
            if (!el) return;
            const enabled = el.contains(event4.target),
              enabled2 = el2 && el2.contains(event4.target);
            !enabled && !enabled2 && event4.target !== button && handler5();
          }),
          (value4 = (event5) => {
            if (!el) return;
            const el19 = event5.target?.closest?.('.ftb-btn');
            if (!el19) return;
            if (el19.classList.contains('act-auto-subject')) return;
            handler5();
          }),
          setTimeout(() => {
            value2 && document.addEventListener('pointerdown', value2);
          }, 10),
          value4 && toolbarEl.addEventListener('pointerdown', value4, true),
          el
        );
      };
    button.addEventListener('click', (event6) => {
      (event6.stopPropagation(), event6.preventDefault());
      if (el && document.body.contains(el)) {
        handler5();
        return;
      }
      handler9();
    });
  }
}
