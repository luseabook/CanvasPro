import { RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID, resolveModelExecution } from '../../../manifests/index.js';
import { t } from '../../../i18n/index.js';
function frameInterpolationText(_0x22e3e1, _0x1a6ca1 = {}) {
  return t('nodeToolbar.videoFrameInterpolation.' + _0x22e3e1, _0x1a6ca1);
}
function uniqueList(_0x59cf64) {
  return Array.from(new Set(_0x59cf64.map((_0x5ec9aa) => String(_0x5ec9aa || '').trim()).filter(Boolean)));
}
function getFrameTaskOutputText(_0x4ea6ca, { error: error = '' } = {}) {
  const _0x3d71cc = frameInterpolationText('outputText', {
    model: frameInterpolationText('modelLabel'),
    status: _0x4ea6ca,
  });
  return error
    ? frameInterpolationText('outputTextWithError', { outputText: _0x3d71cc, error: error })
    : _0x3d71cc;
}
function getFrameTaskOutputTextIncludes(_0x2eef38) {
  return uniqueList([
    ...(_0x2eef38?.toolbarTaskOutputTextIncludes || []),
    frameInterpolationText('modelLabel'),
  ]);
}
function getVideoFrameInterpolationConfig() {
  const _0x9265b3 = resolveModelExecution(RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID),
    _0xf08b03 = _0x9265b3?.modelManifest?.extensions?.videoFrameInterpolation || null,
    _0x89d2a7 = _0x9265b3?.executionManifest?.mapping?.sourceVideoNode || null,
    _0x179e54 = String(
      _0x9265b3?.executionManifest?.appId || _0x9265b3?.executionManifest?.workflowId || '',
    ).trim(),
    _0xfe6a8 = String(_0xf08b03?.taskType || '').trim();
  if (!_0x9265b3 || !_0xf08b03 || !_0x89d2a7 || !_0x179e54 || !_0xfe6a8)
    throw new Error('Video frame interpolation manifest extension missing');
  return {
    modelId: _0x9265b3.modelManifest.modelId,
    provider: _0x9265b3.modelManifest.provider,
    adapterType: _0x9265b3.modelManifest.adapterType,
    executionId: _0x9265b3.executionManifest.id,
    appId: _0x179e54,
    taskType: _0xfe6a8,
    toolbarTaskOutputTextIncludes: Array.isArray(_0xf08b03.toolbarTaskOutputTextIncludes)
      ? _0xf08b03.toolbarTaskOutputTextIncludes
          .map((_0x56d4b3) => String(_0x56d4b3 || '').trim())
          .filter(Boolean)
      : [],
    sourceVideoNode: _0x89d2a7,
    instanceType: _0x9265b3.executionManifest.instanceType?.defaultValue || 'default',
  };
}
export function bindVideoFrameInterpolationAction(_0x3dbb2e) {
  const {
      toolbarEl: _0x159e15,
      nodeData: _0x217bf5,
      store: _0xb4d852,
      submitTask: _0x34cbd9,
      createRunningHubTaskStateMachine: _0x5dc9ab,
      runRunninghubAiApp: _0x2b980d,
      resumeRunninghubWorkflowTask: _0x119576,
      processInputVideos: _0x42c654,
      getProviderConfig: _0x28cd67,
      ensureConfig: _0x277bd5,
      calcSafeSpawnPosNearNode: _0x2cc767,
      buildSourceMediaNodePayload: _0xe594c2,
      getAutoMediaSizeByShortSide: _0xa4495e,
      buildCanvasLocalVideoFields: _0x34d163,
      buildVideoGenerationFailurePatch: _0x2f1a23,
      buildVideoGenerationResultPatch: _0x32a7a4,
      bindRunningHubToolbarTaskButton: _0x20f378,
      cancelRunningHubResultTask: _0x39c3a5,
      findRunningHubToolbarTaskForNode: _0x9bed62,
      isRunningHubToolbarTaskCancelled: _0x43fd9d,
      notifyRunningHubToolbarTasksChanged: _0xcfa116,
      _getCurrentVideoUrl: _0x1a16e9,
      _ensureVideoHdDurationAllowed: _0x13f1d2,
      _extractFirstUrl: _0x271060,
      _saveRemoteVideoResult: _0x217eb0,
    } = _0x3dbb2e,
    _0x1e238f = getVideoFrameInterpolationConfig(),
    _0x316162 = _0x5dc9ab(),
    _0x304556 = _0x316162.state,
    _0x4d3f3b = _0x159e15.querySelector('.act-replace');
  _0x4d3f3b &&
    (_0x316162.bindButton(_0x4d3f3b),
    _0x20f378({
      button: _0x4d3f3b,
      getTask: () =>
        _0x9bed62(_0x217bf5.id, {
          models: [_0x1e238f.modelId],
          taskTypes: [_0x1e238f.taskType],
          outputTextIncludes: getFrameTaskOutputTextIncludes(_0x1e238f),
        }),
      cancelTask: async (_0x15a30f) => {
        try {
          if (_0x304556.active && String(_0x304556.outNodeId || '') === _0x15a30f.outId)
            try {
              await _0x316162.cancel();
            } catch (_0x52855e) {
              console.warn('[VideoFrameInterpolation] cancel request failed:', _0x52855e);
            }
          return await _0x39c3a5(_0x15a30f, {
            name: frameInterpolationText('cancelledName'),
            outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
            notifyMessage: frameInterpolationText('cancelledToast'),
          });
        } finally {
          _0x304556.active &&
            String(_0x304556.outNodeId || '') === _0x15a30f.outId &&
            _0x316162.reset(_0x4d3f3b);
        }
      },
      cancelTooltip: frameInterpolationText('cancelTooltip'),
    }),
    _0x4d3f3b.addEventListener('click', (_0x4bcdb1) => {
      (_0x4bcdb1.stopPropagation(), _0x4bcdb1.preventDefault());
      if (_0x304556.active) {
        (async () => {
          let _0x56e61b = null;
          try {
            const _0xea01e1 = _0x304556.outNodeId
              ? {
                  outId: _0x304556.outNodeId,
                  targetNodeId: _0x304556.outNodeId,
                  taskId: _0x304556.taskId,
                  apiKey: _0x304556.apiKey,
                  sourceNodeId: _0x217bf5.id,
                }
              : null;
            _0xea01e1
              ? await _0x39c3a5(_0xea01e1, {
                  name: frameInterpolationText('cancelledName'),
                  outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
                  notifyMessage: frameInterpolationText('cancelledToast'),
                })
              : (await _0x316162.cancel(),
                window.showToast?.(frameInterpolationText('taskCancelled'), 'info'));
          } catch (_0x26960d) {
            _0x56e61b = _0x26960d;
          }
          try {
            _0x56e61b && console.warn('[VideoFrameInterpolation] cancel request failed:', _0x56e61b);
          } finally {
            _0x316162.reset(_0x4d3f3b);
          }
        })();
        return;
      }
      (async () => {
        let _0x25275c = null;
        const _0x12f270 = Date.now(),
          _0x42a173 = new AbortController();
        try {
          const _0x2a2a39 = _0xb4d852.getState().nodes?.[_0x217bf5.id];
          if (!_0x2a2a39) {
            window.showToast?.(frameInterpolationText('sourceNodeMissing'), 'error');
            return;
          }
          const _0x20cce5 = _0x1a16e9();
          if (!_0x20cce5) {
            window.showToast?.(frameInterpolationText('noProcessableVideo'), 'error');
            return;
          }
          if (!(await _0x13f1d2(_0x20cce5))) return;
          await _0x277bd5();
          const _0x19a1f6 = _0x28cd67('runninghubwf'),
            _0x126f9e = String(_0x19a1f6?.apiKey || '').trim();
          if (!_0x126f9e) {
            window.showToast?.(frameInterpolationText('apiKeyMissing'), 'error');
            return;
          }
          const _0x1dc537 = _0x2a2a39.width || 0x12c,
            _0x1c7360 = _0x2a2a39.height || 0x12c,
            { width: _0x2720d3, height: _0x284581 } = _0xa4495e(_0x1dc537, _0x1c7360),
            { x: _0x293b5b, y: _0x300445 } = _0x2cc767(
              _0xb4d852.getState().nodes,
              _0x2a2a39,
              _0x2720d3,
              _0x284581,
            );
          _0x25275c = 'source-video-frame-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
          const _0x56e716 = await _0x34cbd9(
            {
              sourceNodeId: _0x2a2a39.id,
              trigger: 'toolbar',
              taskType: _0x1e238f.taskType,
              provider: _0x1e238f.provider,
              adapterType: _0x1e238f.adapterType,
              modelId: _0x1e238f.modelId,
              executionId: _0x1e238f.executionId,
              payload: { apiKey: _0x126f9e, inputVideoUrl: _0x20cce5, appId: _0x1e238f.appId },
              cancellable: true,
              resumable: true,
              pauseOnAbort: 'afterTaskId',
              onTaskChange: ({ sourceNodeId: _0x15fffc, targetNodeId: _0x400380 }) =>
                _0xcfa116({ sourceNodeId: _0x15fffc, outId: _0x400380 }),
              createTargetNode: ({ startPatch: _0x3bf036, protocolPatch: _0x15ef1b }) =>
                _0xe594c2({
                  id: _0x25275c,
                  type: 'source-video',
                  x: _0x293b5b,
                  y: _0x300445,
                  width: _0x2720d3,
                  height: _0x284581,
                  name: frameInterpolationText('processingName'),
                  src: '',
                  localPath: '',
                  fileName: 'frame_' + Date.now() + '.mp4',
                  ..._0x3bf036,
                  provider: _0x1e238f.provider,
                  model: _0x1e238f.modelId,
                  rhTaskUseOpenapiQuery: true,
                  ..._0x15ef1b,
                  outputText: getFrameTaskOutputText(frameInterpolationText('status.processing')),
                }),
              cancel: async ({ taskId: _0x49379b }) => {
                if (!_0x126f9e || !_0x49379b) return;
                await _0x39c3a5(
                  { outId: _0x25275c, taskId: _0x49379b, sourceNodeId: _0x2a2a39.id, apiKey: _0x126f9e },
                  {
                    name: frameInterpolationText('cancelledName'),
                    outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
                    notify: false,
                  },
                );
              },
              submit: async (_0x4d661e, _0x2568b5) => {
                (_0x316162.activate({
                  button: _0x4d3f3b,
                  apiKey: _0x126f9e,
                  abortController: _0x42a173,
                  outNodeId: _0x2568b5.targetNodeId,
                }),
                  _0xb4d852.setSelectedNodes([_0x2568b5.targetNodeId]));
                typeof window.v2FocusOnNodes === 'function'
                  ? window.v2FocusOnNodes([_0x2a2a39.id, _0x2568b5.targetNodeId])
                  : window.v2FocusOnNode?.(_0x2568b5.targetNodeId);
                window.showToast?.(frameInterpolationText('uploading'), 'info');
                const _0x1e96bb = await _0x42c654([_0x4d661e.inputVideoUrl], _0x126f9e),
                  _0x54bb03 = _0x1e96bb[0];
                if (!_0x54bb03) throw new Error(frameInterpolationText('uploadNoDownloadUrl'));
                if (_0x43fd9d(_0x2568b5.targetNodeId)) throw new Error('CANCELLED');
                window.showToast?.(frameInterpolationText('processingToast'), 'info');
                const _0x575740 = await _0x2b980d(
                    {
                      apiKey: _0x126f9e,
                      appId: _0x4d661e.appId,
                      nodeInfoList: [
                        {
                          nodeId: String(_0x1e238f.sourceVideoNode.nodeId || ''),
                          fieldName: String(_0x1e238f.sourceVideoNode.fieldName || ''),
                          fieldValue: _0x54bb03,
                          description: String(
                            _0x1e238f.sourceVideoNode.description ||
                              _0x1e238f.sourceVideoNode.fieldName ||
                              'video',
                          ),
                        },
                      ],
                      instanceType: _0x1e238f.instanceType,
                      usePersonalQueue: 'false',
                    },
                    { signal: _0x2568b5.signal },
                  ),
                  _0x935526 = String(
                    _0x575740?.data?.taskId ||
                      _0x575740?.data?.task_id ||
                      _0x575740?.taskId ||
                      _0x575740?.task_id ||
                      '',
                  ).trim();
                if (!_0x935526) throw new Error(frameInterpolationText('taskIdMissing'));
                (_0x316162.setTaskId(_0x935526), _0x2568b5.onTaskId?.(_0x935526));
                if (_0x316162.isCancelled() || _0x43fd9d(_0x2568b5.targetNodeId)) {
                  await _0x39c3a5(
                    {
                      outId: _0x2568b5.targetNodeId,
                      taskId: _0x935526,
                      sourceNodeId: _0x2a2a39.id,
                      apiKey: _0x126f9e,
                    },
                    {
                      name: frameInterpolationText('cancelledName'),
                      outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
                      notify: false,
                    },
                  );
                  throw new Error('CANCELLED');
                }
                return { taskId: _0x935526 };
              },
              poll: async ({ taskId: _0x3cee2a, signal: _0xcf23a3, targetNodeId: _0x314c70 }) => {
                const _0x1b0b6b = await _0x119576(
                  { apiKey: _0x126f9e, taskId: _0x3cee2a },
                  { signal: _0xcf23a3, useOpenapiQuery: true },
                );
                if (_0x43fd9d(_0x314c70)) throw new Error('CANCELLED');
                const _0x1551ca = _0x271060(_0x1b0b6b);
                if (!_0x1551ca) throw new Error(frameInterpolationText('missingOutputUrl'));
                const _0x473de1 = await _0x217eb0(_0x1551ca);
                if (_0x43fd9d(_0x314c70)) throw new Error('CANCELLED');
                if (!_0x473de1) throw new Error(frameInterpolationText('localSaveFailed'));
                return {
                  resultUrl: _0x1551ca,
                  localVideoFields: _0x34d163({ localPath: _0x473de1, videoUrl: _0x1551ca }),
                };
              },
              resultBuilder: ({ localVideoFields: _0x4bcb5d }) => {
                const _0x2e0df0 =
                  Date.now() -
                  Number(_0xb4d852.getState().nodes?.[_0x25275c]?.generationStartTime || _0x12f270);
                return {
                  name: frameInterpolationText('resultName'),
                  ..._0x32a7a4(_0x4bcb5d, { duration: _0x2e0df0 }),
                  ..._0x4bcb5d,
                  fileName: 'frame_' + Date.now() + '.mp4',
                  outputText: getFrameTaskOutputText(frameInterpolationText('status.complete')),
                };
              },
              failureBuilder: (_0x57d98e) => {
                const _0x4bb6ee = _0x57d98e instanceof Error ? _0x57d98e.message : String(_0x57d98e || ''),
                  _0x4c5897 =
                    Date.now() -
                    Number(_0xb4d852.getState().nodes?.[_0x25275c]?.generationStartTime || _0x12f270);
                return {
                  name:
                    _0x4bb6ee === frameInterpolationText('localSaveFailed')
                      ? frameInterpolationText('resultName')
                      : frameInterpolationText('failedName'),
                  ..._0x2f1a23({ error: _0x4bb6ee, duration: _0x4c5897 }),
                  ...(_0x4bb6ee === frameInterpolationText('localSaveFailed')
                    ? {
                        src: '',
                        videoUrl: '',
                        localPath: '',
                        thumbUrl: '',
                        videoMetaSrc: '',
                        fileName: 'frame_' + Date.now() + '.mp4',
                        rhStatusMessage: _0x4bb6ee,
                      }
                    : {}),
                  outputText:
                    _0x4bb6ee === frameInterpolationText('localSaveFailed')
                      ? getFrameTaskOutputText(frameInterpolationText('status.failed'))
                      : getFrameTaskOutputText(frameInterpolationText('status.failed'), { error: _0x4bb6ee }),
                };
              },
              cancelledBuilder: () => ({
                name: frameInterpolationText('cancelledName'),
                outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
              }),
            },
            { store: _0xb4d852, abortController: _0x42a173, startedAt: _0x12f270 },
          );
          if (_0x56e716.status === 'success')
            (window._triggerLocalCacheSave?.(),
              window.showToast?.(frameInterpolationText('successToast'), 'success'));
          else {
            if (_0x56e716.status === 'cancelled')
              !_0x304556.cancelRequested &&
                window.showToast?.(frameInterpolationText('taskCancelled'), 'info');
            else {
              if (_0x56e716.status === 'failed') {
                const _0x12676a =
                  _0x56e716.error instanceof Error ? _0x56e716.error.message : String(_0x56e716.error || '');
                window.showToast?.(frameInterpolationText('failedWithError', { error: _0x12676a }), 'error');
              }
            }
          }
        } catch (_0x1121e3) {
          const _0x4a7cf9 = _0x1121e3 instanceof Error ? _0x1121e3.message : String(_0x1121e3 || ''),
            _0x361b76 =
              _0x304556.cancelRequested ||
              _0x316162.isCancelled() ||
              _0x4a7cf9 === 'CANCELLED' ||
              _0x4a7cf9 === frameInterpolationText('taskCancelled') ||
              _0x4a7cf9 === '任务已取消' ||
              _0x4a7cf9.includes('aborted');
          _0x361b76
            ? !_0x304556.cancelRequested &&
              window.showToast?.(frameInterpolationText('taskCancelled'), 'info')
            : window.showToast?.(frameInterpolationText('failedWithError', { error: _0x4a7cf9 }), 'error');
        } finally {
          _0x316162.reset(_0x4d3f3b);
        }
      })();
    }));
}
