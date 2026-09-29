import { t } from '../../../i18n/index.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../../manifests/index.js';
import { buildRunningHubNodeInfoListFromManifest } from '../../../../api/adapters/RunningHubWorkflowMappingAdapter.js';
import { resolveRunningHubWorkflowResourceId } from '../../../../api/adapters/RunningHubAdapter.js';
import { showProviderApiKeyMissingToast } from '../../../modules/providerApiKeyMissingToast.js';
export function imageHdText(_0x5562f3, _0x11256a = {}) {
  return t('nodeToolbar.imageHd.' + _0x5562f3, _0x11256a);
}
export function imageHdOutputText({
  model: model = imageHdText('modelLabel'),
  resolution: resolution = '',
  status: status = '',
  error: error = '',
} = {}) {
  const _0x206741 = imageHdText('outputText', {
      model: model,
      prompt: imageHdText('promptLabel'),
      resolution: resolution,
    }),
    _0x40e3d5 = status
      ? imageHdText('outputTextWithStatus', { outputText: _0x206741, status: status })
      : _0x206741;
  return error ? imageHdText('outputTextWithError', { outputText: _0x40e3d5, error: error }) : _0x40e3d5;
}
export async function submitImageHdTask(_0x4b7488, _0x3c59d7, _0x220e9b) {
  const {
      toolbarEl: _0x1c5e60,
      nodeId: _0x115224,
      getNodeData: _0x212092,
      _hdTaskMachine: _0x4e74be,
      store: _0x5005ce,
      submitTask: _0x1dbf85,
      buildSourceMediaNodePayload: _0x43ef64,
      buildImageGenerationFailurePatch: _0x9bb564,
      buildImageGenerationResultPatch: _0x4a46f6,
      calcDisplaySizeByMedia: _0x3b9b55,
      runRunninghubWorkflow: _0xd363fc,
      runRunninghubAiApp: _0x4b3224,
      resumeRunninghubWorkflowTask: _0x28230f,
      processInputImages: _0x1f2e2d,
      parseRhTaskId: _0x3b0767,
      getProviderConfig: _0x48fd3a,
      ensureConfig: _0x11874e,
      calcSafeSpawnPosNearNode: _0x55254d,
      isRunningHubToolbarTaskCancelled: _0x141c64,
      saveRemoteImageResultLocally: _0x1b998e,
      extractFirstImageUrl: _0x2dc754,
      resolveApiInputRatioBasis: _0xa805af,
      resolveFinalResultDisplaySize: _0x2b00bb,
      createToolbarCancelledError: _0x5d6dd2,
      isToolbarCancelledError: _0x52b706,
      createLocalSaveFailureError: _0x51de47,
      isLocalSaveFailure: _0x3ac6a3,
      throwIfToolbarTaskCancelled: _0xfa8747,
      cancelRunningHubRemoteTaskQuietly: _0x3f48ea,
      selectToolbarTaskNode: _0x54dffb,
      notifyImageToolbarTaskChange: _0x217952,
      buildClearedImageMediaFields: _0x2ec7f8,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: _0x2f6f14,
    } = _0x4b7488,
    _0x3cce18 = resolveModelExecution(_0x3c59d7['modelId']);
  if (!_0x3cce18) throw new Error('高清工作流配置缺失');
  const { modelManifest: _0x4f51df, executionManifest: _0x4bb97d } = _0x3cce18,
    _0x19247a = { 'runninghub-task-create': _0xd363fc, 'openapi-v2-ai-app': _0x4b3224 }[
      _0x4bb97d['submitMode']
    ];
  if (!_0x19247a) throw new Error('不支持的高清提交方式：' + _0x4bb97d['submitMode']);
  const _0x3f6fd9 = _0x4bb97d['queryMode'] === 'openapi-v2-query',
    _0x55c2a0 = sanitizeModelUiSchemaParams(_0x4f51df['modelId'], _0x3c59d7['generationParams']),
    _0x8d31bb = _0x55c2a0['rhResolution'],
    _0xc32b5a = _0x1c5e60['querySelector']('.act-hd'),
    _0x57db92 = _0x115224,
    _0x54df90 = _0xc32b5a['querySelector']('svg');
  if (_0x54df90) _0x54df90['classList']['add']('v2-spinning');
  const _0x472cc6 = new AbortController();
  let _0x178a5d = '',
    _0x43ce8d = '',
    _0x389d2a = '',
    _0x242031 = '',
    _0x36d1aa = null,
    _0x4df4bd = '',
    _0x10d49d = '',
    _0x3ece55 = '';
  try {
    const _0x4f5dc2 = _0x212092(),
      _0x17d057 = _0x4f5dc2?.['images']?.[_0x4f5dc2['mainImageIndex'] || 0x0] || _0x4f5dc2,
      _0x242888 = _0x17d057?.['originalLocalPath'] || _0x17d057?.['localPath'],
      _0x3b5903 = _0x242888
        ? '/' + _0x242888
        : _0x17d057?.['sourceUrl'] || _0x17d057?.['imageUrl'] || _0x17d057?.['src'];
    if (!_0x3b5903) {
      window['showToast']?.(imageHdText('noProcessableImage'), 'error');
      return;
    }
    await _0x11874e();
    if (!_0x220e9b()) return;
    const _0x4152f1 = _0x48fd3a(_0x3c59d7['providerProfileId'] || _0x4f51df['provider']);
    ((_0x43ce8d = String(_0x4152f1?.['apiKey'] || '')['trim']()),
      (_0x389d2a = String(_0x3c59d7['providerProfileId'] || _0x4152f1?.['providerProfileId'] || '')[
        'trim'
      ]()),
      (_0x242031 = String(_0x4152f1?.['apiUrl'] || '')['trim']()));
    if (!_0x43ce8d) {
      showProviderApiKeyMissingToast(imageHdText('apiKeyMissing'), {
        providerId: _0x389d2a || 'runninghubwf',
        type: 'error',
      });
      return;
    }
    const _0x593dfd = _0x5005ce['getState']()['nodes'][_0x57db92] || _0x4f5dc2;
    if (!_0x593dfd) {
      window['showToast']?.(imageHdText('sourceNodeMissing'), 'error');
      return;
    }
    const _0x983ccc = await _0xa805af(_0x593dfd, _0x3b5903),
      { width: _0x2134a7, height: _0x148af9 } = _0x3b9b55(_0x983ccc['width'], _0x983ccc['height']),
      { x: _0x506c77, y: _0x253f03 } = _0x55254d(
        _0x5005ce['getState']()['nodes'],
        _0x593dfd,
        _0x2134a7,
        _0x148af9,
      );
    if (!_0x220e9b()) return;
    const _0x17dada = resolveRunningHubWorkflowResourceId(_0x4bb97d, { providerProfileId: _0x389d2a }),
      _0x49caba = _0x4f51df['modelId'],
      _0x6ed2ae =
        'source-image-hd-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x6),
      _0x19b3f9 = imageHdOutputText({ model: _0x4f51df['displayName'], resolution: _0x8d31bb }),
      _0x5b8a44 = await _0x1dbf85(
        {
          sourceNodeId: _0x593dfd['id'],
          trigger: 'toolbar',
          taskType: 'image-hd',
          provider: 'runninghubwf',
          adapterType: 'workflow',
          modelId: _0x49caba,
          executionId: _0x4bb97d['id'],
          payload: {
            apiKey: _0x43ce8d,
            providerProfileId: _0x389d2a,
            runningHubApiUrl: _0x242031,
            imgUrl: _0x3b5903,
            inputBasis: _0x983ccc,
            generationParams: _0x55c2a0,
            outputText: _0x19b3f9,
          },
          cancellable: !![],
          resumable: !![],
          onTaskChange: _0x217952,
          createTargetNode: ({ startedAt: _0x24a8f9, startPatch: _0x34d7cb, protocolPatch: _0x3e357b }) =>
            _0x43ef64({
              id: _0x6ed2ae,
              type: 'source-image',
              x: _0x506c77,
              y: _0x253f03,
              width: _0x2134a7,
              height: _0x148af9,
              needsAutoResize: ![],
              name: imageHdText('processingName'),
              src: '',
              outputText: _0x19b3f9,
              localPath: '',
              fileName: 'hd_' + Date['now']() + '.jpg',
              provider: 'runninghubwf',
              model: _0x49caba,
              rhTaskUseOpenapiQuery: _0x3f6fd9,
              ..._0x34d7cb,
              ..._0x3e357b,
              generationStartTime: _0x24a8f9,
              rhTaskStartedAt: _0x24a8f9,
            }),
          submit: async (_0x5e2cc8, _0x45f2d6) => {
            (_0x54dffb(_0x45f2d6['targetNodeId']),
              _0x4e74be['activate']({
                button: _0xc32b5a,
                apiKey: _0x43ce8d,
                providerProfileId: _0x389d2a,
                abortController: _0x472cc6,
                outNodeId: _0x45f2d6['targetNodeId'],
              }));
            const _0x4714c1 = await _0x1f2e2d([_0x5e2cc8['imgUrl']], _0x5e2cc8['apiKey'], {
              applyInputQualityProfile: !![],
              provider: 'runninghub',
              apiUrl: _0x5e2cc8['runningHubApiUrl'],
            });
            if (_0x4714c1['length'] === 0x0) throw new Error(imageHdText('uploadEmpty'));
            const _0x22bdef = String(_0x4714c1[0x0] || '')['trim']();
            if (!_0x22bdef) throw new Error(imageHdText('uploadFailed'));
            _0xfa8747(_0x45f2d6['targetNodeId']);
            const _0x3eeda3 = await _0x19247a(
              {
                apiKey: _0x5e2cc8['apiKey'],
                providerProfileId: _0x5e2cc8['providerProfileId'],
                runningHubApiUrl: _0x5e2cc8['runningHubApiUrl'],
                workflowId: _0x17dada,
                addMetadata: ![],
                nodeInfoList: await buildRunningHubNodeInfoListFromManifest({
                  mapping: _0x4bb97d['mapping'],
                  payload: _0x5e2cc8,
                  sourceResolvers: { imageInput: () => _0x22bdef },
                }),
                instanceType: _0x5e2cc8['generationParams'][_0x4bb97d['instanceType']['field']],
                usePersonalQueue: 'false',
              },
              {
                signal: _0x472cc6['signal'],
                runningHubWorkflowQueueLease: _0x45f2d6['runningHubWorkflowQueueLease'],
              },
            );
            _0x178a5d = _0x3b0767(_0x3eeda3);
            if (!_0x178a5d) throw new Error(imageHdText('taskIdMissing'));
            (_0x4e74be['setTaskId'](_0x178a5d), _0x45f2d6['onTaskId'](_0x178a5d));
            if (_0x4e74be['isCancelled']() || _0x141c64(_0x45f2d6['targetNodeId'])) {
              await _0x3f48ea({
                apiKey: _0x5e2cc8['apiKey'],
                taskId: _0x178a5d,
                label: 'ImageHD',
                providerProfileId: _0x5e2cc8['providerProfileId'],
              });
              throw _0x5d6dd2();
            }
            return { taskId: _0x178a5d };
          },
          poll: async ({ taskId: _0x3c12ef, signal: _0x527d57, targetNodeId: _0x18548e }) => {
            if (_0x4e74be['isCancelled']() || _0x141c64(_0x18548e)) throw _0x5d6dd2();
            const _0x40d0a8 = await _0x28230f(
              {
                apiKey: _0x43ce8d,
                taskId: _0x3c12ef,
                providerProfileId: _0x389d2a,
                runningHubApiUrl: _0x242031,
              },
              { signal: _0x527d57, taskKind: 'image', useOpenapiQuery: _0x3f6fd9 },
            );
            if (_0x4e74be['isCancelled']() || _0x141c64(_0x18548e)) throw _0x5d6dd2();
            const _0x540cab = _0x2dc754(_0x40d0a8);
            if (!_0x540cab) throw new Error(imageHdText('missingResultImage'));
            return { resultUrl: _0x540cab };
          },
          cancel: ({ taskId: _0x32417e }) =>
            _0x3f48ea({
              apiKey: _0x43ce8d,
              taskId: _0x32417e,
              label: 'ImageHD',
              providerProfileId: _0x389d2a,
            }),
          resultBuilder: async (_0x4c427f, _0x5548e6) => {
            const _0x2f8963 = String(_0x4c427f?.['resultUrl'] || '')['trim']();
            if (!_0x2f8963) throw new Error(imageHdText('missingResultImage'));
            _0x4df4bd = _0x2f8963;
            let _0x2b13b2 = null;
            try {
              _0x2b13b2 = await _0x1b998e(_0x2f8963, {
                projectId: window['currentProjectId'] || 'default_v2_project',
                includeSrc: !![],
              });
            } catch (_0x590323) {
              console['error']('保存图片失败:', _0x590323);
            }
            ((_0x3ece55 = _0x2b13b2?.['localPath'] || ''),
              (_0x10d49d = _0x2b13b2?.['thumbUrl'] || _0x2f8963));
            if (!_0x3ece55) throw _0x51de47();
            return (
              (_0x36d1aa = await _0x2b00bb(_0x983ccc, {
                localPath: _0x3ece55,
                imageUrl: _0x2f8963,
                sourceUrl: _0x2f8963,
                thumbUrl: _0x10d49d,
                src: _0x10d49d || _0x2f8963,
              })),
              {
                name: imageHdText('resultName'),
                ..._0x4a46f6(_0x2b13b2['fields'], { startedAt: _0x5548e6['startedAt'] }),
                ..._0x2b13b2['fields'],
                fileName: 'hd_' + Date['now']() + '.jpg',
                width: _0x36d1aa['width'],
                height: _0x36d1aa['height'],
                outputText: _0x19b3f9,
              }
            );
          },
          failureBuilder: async (_0x42e62a, _0x312056) => {
            const _0x347068 =
              _0x42e62a instanceof Error
                ? _0x42e62a['message']
                : String(_0x42e62a || imageHdText('unknownError'));
            if (_0x3ac6a3(_0x42e62a))
              return (
                (_0x36d1aa ||= await _0x2b00bb(_0x983ccc, {
                  localPath: _0x3ece55,
                  imageUrl: _0x4df4bd,
                  sourceUrl: _0x4df4bd,
                  thumbUrl: _0x10d49d,
                  src: _0x10d49d || _0x4df4bd,
                })),
                {
                  name: imageHdText('resultName'),
                  ..._0x2ec7f8(),
                  width: _0x36d1aa['width'],
                  height: _0x36d1aa['height'],
                  outputText: _0x19b3f9,
                  ..._0x9bb564({ error: _0x2f6f14, startedAt: _0x312056['startedAt'] }),
                  rhStatusMessage: _0x2f6f14,
                }
              );
            return {
              name: imageHdText('failedName'),
              ..._0x9bb564({ error: _0x347068, startedAt: _0x312056['startedAt'] }),
              outputText: imageHdText('outputTextWithError', { outputText: _0x19b3f9, error: _0x347068 }),
            };
          },
          cancelledBuilder: () => ({
            name: imageHdText('cancelledName'),
            outputText: imageHdOutputText({
              model: _0x4f51df['displayName'],
              resolution: _0x8d31bb,
              status: imageHdText('status.cancelled'),
            }),
          }),
        },
        { abortController: _0x472cc6, store: _0x5005ce, isTargetCurrent: _0x220e9b },
      );
    if (_0x5b8a44['status'] === 'success') window['showToast']?.(imageHdText('successToast'), 'success');
    else {
      if (_0x5b8a44['status'] === 'failed') {
        if (_0x3ac6a3(_0x5b8a44['error'])) window['showToast']?.('⚠️ ' + _0x2f6f14, 'warn');
        else {
          const _0x19e039 =
            _0x5b8a44['error'] instanceof Error
              ? _0x5b8a44['error']['message']
              : String(_0x5b8a44['error'] || imageHdText('unknownError'));
          window['showToast']?.(imageHdText('failedWithError', { error: _0x19e039 }), 'error');
        }
      } else
        _0x5b8a44['status'] === 'cancelled' && window['showToast']?.(imageHdText('cancelledToast'), 'info');
    }
  } catch (_0x379597) {
    const _0x7ec3b9 = _0x379597 instanceof Error ? _0x379597['message'] : String(_0x379597 || '');
    _0x52b706(_0x379597)
      ? window['showToast']?.(imageHdText('cancelledToast'), 'info')
      : (console['error']('RH高清放大失败:', _0x379597),
        window['showToast']?.(imageHdText('failedWithError', { error: _0x7ec3b9 }), 'error'));
  } finally {
    if (_0x54df90) _0x54df90['classList']['remove']('v2-spinning');
    _0x4e74be['reset'](_0xc32b5a);
  }
}
