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
function videoHdText(_0x2c0a0c, _0x4a30f4 = {}) {
  return t('nodeToolbar.videoHd.' + _0x2c0a0c, _0x4a30f4);
}
function uniqueList(_0x52ab5f) {
  return Array.from(new Set(_0x52ab5f.map((_0x354ef3) => String(_0x354ef3 || '').trim()).filter(Boolean)));
}
function videoHdOptionTitle(_0x43003f) {
  return videoHdText('options.' + _0x43003f.key + '.title');
}
function videoHdOptionDesc(_0x29533c) {
  return videoHdText('options.' + _0x29533c.key + '.desc');
}
function videoHdOutputText(_0x539d74, { status: status = '', error: error = '' } = {}) {
  const _0x10b575 = videoHdText('outputText', {
      model: videoHdOptionTitle(_0x539d74),
      prompt: videoHdText('promptLabel'),
    }),
    _0x196eaf = status
      ? videoHdText('outputTextWithStatus', { outputText: _0x10b575, status: status })
      : _0x10b575;
  return error ? videoHdText('outputTextWithError', { outputText: _0x196eaf, error: error }) : _0x196eaf;
}
export function bindVideoHdAction(_0xba715e) {
  const {
      toolbarEl: _0x4e3a49,
      nodeData: _0x1073ea,
      store: _0x257380,
      submitTask: _0x565079,
      createRunningHubTaskStateMachine: _0xc50d7c,
      runRunninghubAiApp: _0x51e3dc,
      runRunninghubWorkflow: _0x39745b,
      resumeRunninghubWorkflowTask: _0x14c4a8,
      processInputVideos: _0x21be3d,
      getProviderConfig: _0x5de75d,
      ensureConfig: _0x33fec9,
      calcSafeSpawnPosNearNode: _0x24c195,
      buildSourceMediaNodePayload: _0x417966,
      getAutoMediaSizeByShortSide: _0x4445af,
      buildCanvasLocalVideoFields: _0x3b0cab,
      buildVideoGenerationFailurePatch: _0x20fb34,
      buildVideoGenerationResultPatch: _0x1461ca,
      bindRunningHubToolbarTaskButton: _0x84703e,
      cancelRunningHubResultTask: _0x285ab0,
      findRunningHubToolbarTaskForNode: _0x59e5cb,
      isRunningHubToolbarTaskCancelled: _0x5c15a7,
      notifyRunningHubToolbarTasksChanged: _0x3ba3c4,
      RH_VIDEO_HD_BASIC_WORKFLOW_ID: _0x17c833,
      RH_VIDEO_HD_VIP_MODEL_ID: _0x49a401,
      RH_VIDEO_HD_VIP_APP_ID: _0x435c3e,
      VIDEO_HD_STANDARD_INSTANCE_TYPE: _0xa6f31,
      VIDEO_HD_VIP_INSTANCE_TYPE: _0x4ad97b,
      _getCurrentVideoUrl: _0x1195af,
      _ensureVideoHdDurationAllowed: _0x438372,
      _ensureVideoHdVipAllowed: _0x220e83,
      _extractFirstUrl: _0xbeb8e6,
      _saveRemoteVideoResult: _0x2ebd4a,
    } = _0xba715e,
    _0x2c8860 = _0xc50d7c(),
    _0x3ecfb5 = _0x2c8860.state,
    _0x6f76f6 = _0x4e3a49.querySelector('.act-hd');
  _0x6f76f6 &&
    (_0x2c8860.bindButton(_0x6f76f6),
    _0x84703e({
      button: _0x6f76f6,
      getTask: () =>
        _0x59e5cb(_0x1073ea.id, {
          models: [_0x49a401, 'runninghub/' + _0x17c833],
          taskTypes: ['video-hd'],
          outputTextIncludes: uniqueList([VIDEO_HD_LEGACY_PROMPT_LABEL, videoHdText('promptLabel')]),
        }),
      cancelTask: async (_0x2a6a20) => {
        try {
          if (_0x3ecfb5.active && String(_0x3ecfb5.outNodeId || '') === _0x2a6a20.outId)
            try {
              await _0x2c8860.cancel();
            } catch (_0xdd181b) {
              console.warn('[VideoHD] cancel request failed:', _0xdd181b);
            }
          return await _0x285ab0(_0x2a6a20, {
            name: videoHdText('cancelledName'),
            outputText: videoHdText('cancelledOutput', {
              model: videoHdText('modelFallback'),
              prompt: videoHdText('promptLabel'),
              status: videoHdText('status.cancelled'),
            }),
            notifyMessage: videoHdText('cancelledToast'),
          });
        } finally {
          _0x3ecfb5.active &&
            String(_0x3ecfb5.outNodeId || '') === _0x2a6a20.outId &&
            _0x2c8860.reset(_0x6f76f6);
        }
      },
      cancelTooltip: videoHdText('cancelTooltip'),
    }),
    _0x6f76f6.addEventListener('click', (_0x5b5ba1) => {
      (_0x5b5ba1.stopPropagation(), _0x5b5ba1.preventDefault());
      if (_0x3ecfb5.active) {
        (async () => {
          let _0x33b992 = null;
          try {
            const _0x1ddfb7 = _0x3ecfb5.outNodeId
              ? {
                  outId: _0x3ecfb5.outNodeId,
                  targetNodeId: _0x3ecfb5.outNodeId,
                  taskId: _0x3ecfb5.taskId,
                  apiKey: _0x3ecfb5.apiKey,
                  sourceNodeId: _0x1073ea.id,
                }
              : null;
            _0x1ddfb7
              ? await _0x285ab0(_0x1ddfb7, {
                  name: videoHdText('cancelledName'),
                  outputText: videoHdText('cancelledOutput', {
                    model: videoHdText('modelFallback'),
                    prompt: videoHdText('promptLabel'),
                    status: videoHdText('status.cancelled'),
                  }),
                  notifyMessage: videoHdText('cancelledToast'),
                })
              : (await _0x2c8860.cancel(), window.showToast?.(videoHdText('taskCancelled'), 'info'));
          } catch (_0x4e7608) {
            _0x33b992 = _0x4e7608;
          }
          try {
            _0x33b992 && console.warn('[VideoHD] cancel request failed:', _0x33b992);
          } finally {
            _0x2c8860.reset(_0x6f76f6);
          }
        })();
        return;
      }
      const _0x35f0b5 = document.querySelector('.v2-hd-popup');
      if (_0x35f0b5) {
        const _0x273062 = _0x35f0b5.__v2HdAnchorBtn && _0x35f0b5.__v2HdAnchorBtn === _0x6f76f6,
          _0x5dab9f =
            typeof _0x35f0b5.__v2HdClose === 'function' ? _0x35f0b5.__v2HdClose : () => _0x35f0b5.remove();
        _0x5dab9f();
        if (_0x273062) return;
      }
      const _0x300e48 = document.createElement('div');
      ((_0x300e48.className = 'v2-hd-popup node-toolbar-action-menu'),
        (_0x300e48.__v2HdAnchorBtn = _0x6f76f6));
      const _0x162890 = createToolbarActionPopupAnchorPositionGetter(_0x6f76f6),
        _0x11b86e = _0x162890();
      (Object.assign(_0x300e48.style, {
        position: 'fixed',
        left: _0x11b86e.left + 'px',
        top: _0x11b86e.top + 'px',
        transform: 'translate(-50%, calc(-100% + 10px))',
        opacity: '0',
        pointerEvents: 'none',
      }),
        appendToolbarActionMenuTitle(_0x300e48, videoHdText('choosePlan')));
      let _0xfffd61 = () => {},
        _0x40880f = 0;
      const _0x342991 = () => {
        if (!document.body.contains(_0x300e48)) {
          _0xfffd61();
          return;
        }
        if (_0x300e48.__v2HdClosing) return;
        ((_0x300e48.__v2HdClosing = true),
          _0xfffd61(),
          (_0x300e48.style.opacity = '0'),
          (_0x300e48.style.pointerEvents = 'none'),
          (_0x300e48.style.transform = 'translate(-50%, calc(-100% + 10px))'));
        const _0x1056e6 = () => {
          _0x300e48.removeEventListener('transitionend', _0x1056e6);
          if (document.body.contains(_0x300e48)) _0x300e48.remove();
        };
        (_0x300e48.addEventListener('transitionend', _0x1056e6), window.setTimeout(_0x1056e6, 0x118));
      };
      _0x300e48.__v2HdClose = _0x342991;
      const _0x15d673 = [
          {
            key: 'sharp',
            vip: true,
            model: _0x49a401,
            appId: _0x435c3e,
            index: '1',
            instanceType: _0x4ad97b,
            useOpenapiQuery: true,
          },
          {
            key: 'quality',
            vip: true,
            model: _0x49a401,
            appId: _0x435c3e,
            index: '0',
            instanceType: _0x4ad97b,
            useOpenapiQuery: true,
          },
          {
            key: 'basic',
            vip: false,
            model: 'runninghub/' + _0x17c833,
            workflowId: _0x17c833,
            instanceType: _0xa6f31,
            useOpenapiQuery: false,
          },
        ],
        _0x23cf64 = (_0xb882e2) => {
          const _0x3eba03 = createToolbarActionMenuItem();
          _0x3eba03.appendChild(createRunningHubActionIcon());
          const _0xce621d = createToolbarActionMenuBody(),
            _0x2f60fa = createToolbarActionTitleRow(),
            _0xcb3f44 = createToolbarActionTitle(videoHdOptionTitle(_0xb882e2));
          return (
            _0x2f60fa.appendChild(_0xcb3f44),
            _0xb882e2.vip && _0x2f60fa.appendChild(createToolbarActionVipBadge()),
            _0xce621d.appendChild(_0x2f60fa),
            _0xce621d.appendChild(createToolbarActionDescription(videoHdOptionDesc(_0xb882e2))),
            _0x3eba03.appendChild(_0xce621d),
            _0x3eba03.addEventListener('click', async (_0x3b3de9) => {
              (_0x3b3de9.stopPropagation(), _0x342991());
              let _0x2f8bf0 = null;
              const _0x573111 = Date.now(),
                _0x4aec71 = new AbortController();
              try {
                const _0xfd2a0e = _0x257380.getState().nodes?.[_0x1073ea.id];
                if (!_0xfd2a0e) {
                  window.showToast?.(videoHdText('sourceNodeMissing'), 'error');
                  return;
                }
                const _0x536ba7 = _0x1195af();
                if (!_0x536ba7) {
                  window.showToast?.(videoHdText('noProcessableVideo'), 'error');
                  return;
                }
                if (!(await _0x438372(_0x536ba7))) return;
                if (
                  _0xb882e2.vip &&
                  !(await _0x220e83(_0xb882e2.model, () => {
                    _0x3eba03.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                  }))
                )
                  return;
                await _0x33fec9();
                const _0x208c99 = _0x5de75d('runninghubwf'),
                  _0x16dc51 = String(_0x208c99?.apiKey || '').trim();
                if (!_0x16dc51) {
                  window.showToast?.(videoHdText('apiKeyMissing'), 'error');
                  return;
                }
                const _0x4222d5 = _0xfd2a0e.width || 0x12c,
                  _0x542a46 = _0xfd2a0e.height || 0x12c,
                  { width: _0x2cabe2, height: _0x462551 } = _0x4445af(_0x4222d5, _0x542a46),
                  { x: _0x4e544c, y: _0x3d384d } = _0x24c195(
                    _0x257380.getState().nodes,
                    _0xfd2a0e,
                    _0x2cabe2,
                    _0x462551,
                  );
                _0x2f8bf0 = 'source-video-hd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
                const _0x341e63 = _0xb882e2.instanceType === _0x4ad97b ? _0x4ad97b : _0xa6f31,
                  _0x238347 = await _0x565079(
                    {
                      sourceNodeId: _0xfd2a0e.id,
                      trigger: 'toolbar',
                      taskType: 'video-hd',
                      provider: 'runninghubwf',
                      adapterType: 'workflow',
                      modelId: _0xb882e2.model,
                      executionId: _0xb882e2.appId
                        ? 'runninghub.ai-app.' + _0xb882e2.appId
                        : 'runninghub.workflow.' + _0xb882e2.workflowId,
                      payload: {
                        apiKey: _0x16dc51,
                        inputVideoUrl: _0x536ba7,
                        option: _0xb882e2,
                        instanceType: _0x341e63,
                      },
                      cancellable: true,
                      resumable: true,
                      pauseOnAbort: 'afterTaskId',
                      onTaskChange: ({ sourceNodeId: _0xeba493, targetNodeId: _0xa7152a }) =>
                        _0x3ba3c4({ sourceNodeId: _0xeba493, outId: _0xa7152a }),
                      createTargetNode: ({ startPatch: _0x59ce81, protocolPatch: _0x15f8a1 }) =>
                        _0x417966({
                          id: _0x2f8bf0,
                          type: 'source-video',
                          x: _0x4e544c,
                          y: _0x3d384d,
                          width: _0x2cabe2,
                          height: _0x462551,
                          name: videoHdText('processingName'),
                          src: '',
                          localPath: '',
                          fileName: 'hd_' + Date.now() + '.mp4',
                          ..._0x59ce81,
                          provider: 'runninghubwf',
                          model: _0xb882e2.model,
                          rhTaskUseOpenapiQuery: _0xb882e2.useOpenapiQuery === true,
                          ..._0x15f8a1,
                          outputText: videoHdOutputText(_0xb882e2),
                        }),
                      cancel: async ({ taskId: _0x11104a }) => {
                        if (!_0x16dc51 || !_0x11104a) return;
                        await _0x285ab0(
                          {
                            outId: _0x2f8bf0,
                            taskId: _0x11104a,
                            sourceNodeId: _0xfd2a0e.id,
                            apiKey: _0x16dc51,
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
                      submit: async (_0x487e72, _0x4648b9) => {
                        (_0x2c8860.activate({
                          button: _0x6f76f6,
                          apiKey: _0x16dc51,
                          abortController: _0x4aec71,
                          outNodeId: _0x4648b9.targetNodeId,
                        }),
                          _0x257380.setSelectedNodes([_0x4648b9.targetNodeId]));
                        typeof window.v2FocusOnNodes === 'function'
                          ? window.v2FocusOnNodes([_0xfd2a0e.id, _0x4648b9.targetNodeId])
                          : window.v2FocusOnNode?.(_0x4648b9.targetNodeId);
                        window.showToast?.(videoHdText('uploading'), 'info');
                        const _0x504e7e = await _0x21be3d([_0x487e72.inputVideoUrl], _0x16dc51),
                          _0x539171 = _0x504e7e[0];
                        if (!_0x539171) throw new Error(videoHdText('uploadNoDownloadUrl'));
                        if (_0x5c15a7(_0x4648b9.targetNodeId)) throw new Error('CANCELLED');
                        window.showToast?.(videoHdText('processingToast'), 'info');
                        const _0x28c3e1 = _0xb882e2.appId
                            ? [
                                {
                                  nodeId: '10',
                                  fieldName: 'index',
                                  fieldValue: _0xb882e2.index,
                                  description: 'index',
                                },
                                {
                                  nodeId: '12',
                                  fieldName: 'video',
                                  fieldValue: _0x539171,
                                  description: 'video',
                                },
                              ]
                            : [{ nodeId: '9', fieldName: 'video', fieldValue: _0x539171 }],
                          _0x3b55af = _0xb882e2.appId
                            ? await _0x51e3dc(
                                {
                                  apiKey: _0x16dc51,
                                  appId: _0xb882e2.appId,
                                  nodeInfoList: _0x28c3e1,
                                  instanceType: _0x341e63,
                                  usePersonalQueue: 'false',
                                },
                                { signal: _0x4648b9.signal },
                              )
                            : await _0x39745b(
                                {
                                  apiKey: _0x16dc51,
                                  workflowId: _0xb882e2.workflowId,
                                  addMetadata: false,
                                  nodeInfoList: _0x28c3e1,
                                  instanceType: _0x341e63,
                                  usePersonalQueue: 'false',
                                },
                                { signal: _0x4648b9.signal },
                              ),
                          _0x7b11e2 = String(
                            _0x3b55af?.data?.taskId ||
                              _0x3b55af?.data?.task_id ||
                              _0x3b55af?.taskId ||
                              _0x3b55af?.task_id ||
                              '',
                          ).trim();
                        if (!_0x7b11e2) throw new Error(videoHdText('taskIdMissing'));
                        (_0x2c8860.setTaskId(_0x7b11e2), _0x4648b9.onTaskId?.(_0x7b11e2));
                        if (_0x2c8860.isCancelled() || _0x5c15a7(_0x4648b9.targetNodeId)) {
                          await _0x285ab0(
                            {
                              outId: _0x4648b9.targetNodeId,
                              taskId: _0x7b11e2,
                              sourceNodeId: _0xfd2a0e.id,
                              apiKey: _0x16dc51,
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
                        return { taskId: _0x7b11e2 };
                      },
                      poll: async ({ taskId: _0x12be20, signal: _0x2f8605, targetNodeId: _0x526b12 }) => {
                        if (_0x2c8860.isCancelled() || _0x5c15a7(_0x526b12)) throw new Error('CANCELLED');
                        const _0x4caa48 = await _0x14c4a8(
                            { apiKey: _0x16dc51, taskId: _0x12be20 },
                            {
                              signal: _0x2f8605,
                              useOpenapiQuery: _0xb882e2.useOpenapiQuery === true,
                              taskKind: 'video',
                            },
                          ),
                          _0x37d59c = _0xbeb8e6(_0x4caa48);
                        if (!_0x37d59c) throw new Error(videoHdText('missingOutputUrl'));
                        if (_0x5c15a7(_0x526b12)) throw new Error('CANCELLED');
                        let _0x371e43 = '';
                        try {
                          _0x371e43 = await _0x2ebd4a(_0x37d59c);
                        } catch {
                          throw new Error(videoHdText('localSaveFailed'));
                        }
                        if (_0x5c15a7(_0x526b12)) throw new Error('CANCELLED');
                        if (!_0x371e43) throw new Error(videoHdText('localSaveFailed'));
                        return {
                          resultUrl: _0x37d59c,
                          localVideoFields: _0x3b0cab({ localPath: _0x371e43, videoUrl: _0x37d59c }),
                        };
                      },
                      resultBuilder: ({ localVideoFields: _0x54c357 }) => {
                        const _0x227242 =
                          Date.now() -
                          Number(_0x257380.getState().nodes?.[_0x2f8bf0]?.generationStartTime || _0x573111);
                        return {
                          name: videoHdText('resultName'),
                          ..._0x1461ca(_0x54c357, { duration: _0x227242 }),
                          ..._0x54c357,
                          fileName: 'hd_' + Date.now() + '.mp4',
                          outputText: videoHdOutputText(_0xb882e2),
                        };
                      },
                      failureBuilder: (_0x1f14a9) => {
                        const _0x2a59f1 =
                            _0x1f14a9 instanceof Error ? _0x1f14a9.message : String(_0x1f14a9 || ''),
                          _0x59e7c7 =
                            Date.now() -
                            Number(_0x257380.getState().nodes?.[_0x2f8bf0]?.generationStartTime || _0x573111);
                        return {
                          name:
                            _0x2a59f1 === videoHdText('localSaveFailed')
                              ? videoHdText('resultName')
                              : videoHdText('failedName'),
                          ..._0x20fb34({ error: _0x2a59f1, duration: _0x59e7c7 }),
                          ...(_0x2a59f1 === videoHdText('localSaveFailed')
                            ? {
                                src: '',
                                videoUrl: '',
                                localPath: '',
                                thumbUrl: '',
                                videoMetaSrc: '',
                                fileName: 'hd_' + Date.now() + '.mp4',
                                rhStatusMessage: _0x2a59f1,
                              }
                            : {}),
                          outputText:
                            _0x2a59f1 === videoHdText('localSaveFailed')
                              ? videoHdOutputText(_0xb882e2)
                              : videoHdOutputText(_0xb882e2, { error: _0x2a59f1 }),
                        };
                      },
                      cancelledBuilder: () => ({
                        name: videoHdText('cancelledName'),
                        outputText: videoHdOutputText(_0xb882e2, { status: videoHdText('status.cancelled') }),
                      }),
                    },
                    { store: _0x257380, abortController: _0x4aec71, startedAt: _0x573111 },
                  );
                if (_0x238347.status === 'success')
                  (window._triggerLocalCacheSave?.(),
                    window.showToast?.(videoHdText('successToast'), 'success'));
                else {
                  if (_0x238347.status === 'cancelled')
                    !_0x3ecfb5.cancelRequested && window.showToast?.(videoHdText('taskCancelled'), 'info');
                  else {
                    if (_0x238347.status === 'failed') {
                      const _0x488a5f =
                        _0x238347.error instanceof Error
                          ? _0x238347.error.message
                          : String(_0x238347.error || '');
                      window.showToast?.(videoHdText('failedWithError', { error: _0x488a5f }), 'error');
                    }
                  }
                }
              } catch (_0x3d4f30) {
                const _0x39d2bd = _0x3d4f30 instanceof Error ? _0x3d4f30.message : String(_0x3d4f30 || ''),
                  _0x22fd13 =
                    _0x3ecfb5.cancelRequested ||
                    _0x2c8860.isCancelled() ||
                    _0x39d2bd === 'CANCELLED' ||
                    _0x39d2bd === videoHdText('taskCancelled') ||
                    _0x39d2bd === '任务已取消' ||
                    _0x39d2bd.includes('aborted');
                _0x22fd13
                  ? !_0x3ecfb5.cancelRequested && window.showToast?.(videoHdText('taskCancelled'), 'info')
                  : window.showToast?.(videoHdText('failedWithError', { error: _0x39d2bd }), 'error');
              } finally {
                _0x2c8860.reset(_0x6f76f6);
              }
            }),
            _0x3eba03
          );
        };
      (_0x15d673.forEach((_0x241dde) => {
        _0x300e48.appendChild(_0x23cf64(_0x241dde));
      }),
        document.body.appendChild(_0x300e48),
        _0x300e48.offsetHeight,
        (_0x300e48.style.pointerEvents = 'auto'),
        (_0x300e48.style.opacity = '1'),
        (_0x300e48.style.transform = 'translate(-50%, -100%)'));
      let _0x15207d = null;
      _0xfffd61 = () => {
        (_0x40880f && (cancelAnimationFrame(_0x40880f), (_0x40880f = 0)),
          _0x15207d && (document.removeEventListener('pointerdown', _0x15207d, true), (_0x15207d = null)));
      };
      const _0x26c873 = () => {
        if (!document.body.contains(_0x300e48) || !document.body.contains(_0x6f76f6)) {
          _0xfffd61();
          return;
        }
        if (!_0x162890.hasVisibleAnchor()) {
          _0x40880f = requestAnimationFrame(_0x26c873);
          return;
        }
        const _0x488f4e = _0x162890();
        ((_0x300e48.style.left = _0x488f4e.left + 'px'),
          (_0x300e48.style.top = _0x488f4e.top + 'px'),
          (_0x40880f = requestAnimationFrame(_0x26c873)));
      };
      ((_0x40880f = requestAnimationFrame(_0x26c873)),
        (_0x15207d = (_0x5afe5c) => {
          if (_0x300e48.__v2HdClosing) return;
          !_0x300e48.contains(_0x5afe5c.target) && !_0x6f76f6.contains(_0x5afe5c.target) && _0x342991();
        }),
        document.addEventListener('pointerdown', _0x15207d, true));
    }));
}
