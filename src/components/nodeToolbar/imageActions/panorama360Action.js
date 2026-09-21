import { t } from '../../../i18n/index.js';
const PANORAMA360_LEGACY_LABELS = Object.freeze(['360°全景图', '360全景图']);
function panorama360Text(_0x489151, _0x4b8264 = {}) {
  return t('nodeToolbar.panorama360.' + _0x489151, _0x4b8264);
}
function uniqueList(_0xfe0d7) {
  return Array.from(new Set(_0xfe0d7.map((_0x4de574) => String(_0x4de574 || '').trim()).filter(Boolean)));
}
function panorama360OutputText({ status: status = '', error: error = '' } = {}) {
  const _0x378ae4 = panorama360Text('outputText', { model: panorama360Text('modelLabel') }),
    _0x294689 = status
      ? panorama360Text('outputTextWithStatus', { outputText: _0x378ae4, status: status })
      : _0x378ae4;
  return error ? panorama360Text('outputTextWithError', { outputText: _0x294689, error: error }) : _0x294689;
}
export function bindImagePanorama360Action(_0x2923d4) {
  const {
      toolbarEl: _0x1e064b,
      nodeId: _0xb58a4d,
      getNodeData: _0x424913,
      store: _0x5602a9,
      submitTask: _0x3a36bb,
      buildSourceMediaNodePayload: _0x10c465,
      resolveCanvasImagePreviewUrl: _0x5119e3,
      localPathToUrl: _0x456e3e,
      buildImageGenerationFailurePatch: _0xfd4fb7,
      buildImageGenerationResultPatch: _0x12d939,
      calcDisplaySizeByMedia: _0x15b55c,
      resumeRunningHubImageTask: _0x154c75,
      runRunninghubAiApp: _0x414923,
      processInputImages: _0x3f4697,
      getProviderConfig: _0x56813d,
      ensureConfig: _0x17310e,
      calcSafeSpawnPosNearNode: _0x3242e3,
      bindRunningHubToolbarTaskButton: _0x459c7e,
      cancelRunningHubResultTask: _0x1f50e7,
      findRunningHubToolbarTaskForNode: _0x317546,
      isRunningHubToolbarTaskCancelled: _0x1f97ed,
      buildToolbarImageFields: _0x4e0689,
      saveOutputImageResult: _0x57f6a1,
      extractFirstImageUrl: _0xd181ef,
      parseRhCode: _0x3258a3,
      parseRhTaskId: _0xa592d0,
      resolveApiInputRatioBasis: _0x1cf718,
      resolveFinalResultDisplaySize: _0x2460f0,
      createToolbarCancelledError: _0x45f12a,
      isToolbarCancelledError: _0x1175c6,
      createLocalSaveFailureError: _0x33a1d9,
      isLocalSaveFailure: _0x1ada18,
      throwIfToolbarTaskCancelled: _0x1f2e11,
      cancelRunningHubRemoteTaskQuietly: _0x317d23,
      focusToolbarTaskNodes: _0x118579,
      notifyImageToolbarTaskChange: _0x439123,
      buildClearedImageMediaFields: _0x25abf1,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: _0x275621,
    } = _0x2923d4,
    _0x28b5e8 = _0x1e064b.querySelector('.act-panorama-360');
  if (_0x28b5e8) {
    const _0x527c39 = '2044874075721441281',
      _0x4b985c = 'runninghub/' + _0x527c39,
      _0x1f239d = '147';
    let _0x47b72e = false;
    const _0x249483 = (_0x458c3b) => {
      ((_0x47b72e = !!_0x458c3b), (_0x28b5e8.style.opacity = _0x458c3b ? '0.65' : '1'));
      const _0x521d80 = _0x28b5e8.querySelector('svg');
      if (_0x521d80) {
        if (_0x458c3b) _0x521d80.classList.add('v2-spinning');
        else _0x521d80.classList.remove('v2-spinning');
      }
    };
    (_0x459c7e({
      button: _0x28b5e8,
      getTask: () =>
        _0x317546(_0xb58a4d, {
          models: [_0x4b985c],
          taskTypes: ['image-panorama-360'],
          outputTextIncludes: uniqueList([...PANORAMA360_LEGACY_LABELS, panorama360Text('modelLabel')]),
          nameIncludes: uniqueList([...PANORAMA360_LEGACY_LABELS, panorama360Text('resultName')]),
        }),
      cancelTask: (_0x3e4328) =>
        _0x1f50e7(_0x3e4328, {
          name: panorama360Text('cancelledName'),
          outputText: panorama360OutputText({ status: panorama360Text('status.cancelled') }),
          notifyMessage: panorama360Text('cancelledToast'),
        }),
      cancelTooltip: panorama360Text('cancelTooltip'),
    }),
      _0x28b5e8.addEventListener('click', (_0x156d2f) => {
        (_0x156d2f.stopPropagation(), _0x156d2f.preventDefault());
        if (_0x47b72e) {
          window.showToast?.(panorama360Text('busy'), 'info');
          return;
        }
        void (async () => {
          let _0x50ca51 = null,
            _0x23b11c = '',
            _0x5aefd2 = '',
            _0x182ace = '',
            _0x5997d2 = null;
          try {
            _0x249483(true);
            const _0x402bae = _0x424913() || {},
              _0x2c99c3 =
                _0x402bae?.localPath ||
                (_0x402bae?.images && _0x402bae.images[_0x402bae.mainImageIndex || 0]?.localPath),
              _0x46068d = _0x456e3e(_0x2c99c3) || _0x5119e3(_0x402bae);
            if (!_0x46068d) {
              window.showToast?.(panorama360Text('noProcessableImage'), 'error');
              return;
            }
            await _0x17310e();
            const _0x40a4b8 = _0x56813d('runninghubwf'),
              _0x29b956 = String(_0x40a4b8?.apiKey || '').trim();
            if (!_0x29b956) {
              window.showToast?.(panorama360Text('apiKeyMissing'), 'error');
              return;
            }
            const _0x4cb49e = _0x5602a9.getState().nodes[_0xb58a4d] || _0x402bae;
            if (!_0x4cb49e) {
              window.showToast?.(panorama360Text('sourceNodeMissing'), 'error');
              return;
            }
            const _0x5592c1 = await _0x1cf718(_0x4cb49e, _0x46068d),
              { width: _0x2d80cf, height: _0x1a26e0 } = _0x15b55c(_0x5592c1.width, _0x5592c1.height),
              { x: _0x7a7436, y: _0x421a52 } = _0x3242e3(
                _0x5602a9.getState().nodes,
                _0x4cb49e,
                _0x2d80cf,
                _0x1a26e0,
              ),
              _0x1e2c76 =
                'source-image-panorama-360-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              _0x2ba124 = panorama360OutputText(),
              _0x5c362a = await _0x3a36bb({
                sourceNodeId: _0x4cb49e.id,
                trigger: 'toolbar',
                taskType: 'image-panorama-360',
                provider: 'runninghubwf',
                adapterType: 'workflow',
                modelId: _0x4b985c,
                executionId: 'runninghub.image-panorama-360',
                payload: {
                  apiKey: _0x29b956,
                  imgUrl: _0x46068d,
                  inputBasis: _0x5592c1,
                  outputText: _0x2ba124,
                },
                cancellable: true,
                resumable: true,
                onTaskChange: _0x439123,
                createTargetNode: ({
                  startedAt: _0x50277d,
                  startPatch: _0xd65d8a,
                  protocolPatch: _0xdcc0cf,
                }) =>
                  _0x10c465({
                    id: _0x1e2c76,
                    type: 'source-image',
                    x: _0x7a7436,
                    y: _0x421a52,
                    width: _0x2d80cf,
                    height: _0x1a26e0,
                    needsAutoResize: false,
                    name: panorama360Text('processingName'),
                    src: '',
                    outputText: _0x2ba124,
                    localPath: '',
                    fileName: 'panorama_360_' + Date.now() + '.png',
                    provider: 'runninghubwf',
                    model: _0x4b985c,
                    rhTaskUseOpenapiQuery: true,
                    ..._0xd65d8a,
                    ..._0xdcc0cf,
                    generationStartTime: _0x50277d,
                    rhTaskStartedAt: _0x50277d,
                  }),
                submit: async (_0x4fec0b, _0x1404fb) => {
                  _0x118579(_0x4cb49e.id, _0x1404fb.targetNodeId);
                  const _0x4058ba = await _0x3f4697([_0x4fec0b.imgUrl], _0x29b956, {
                      applyInputQualityProfile: true,
                      provider: 'runninghub',
                    }),
                    _0x29ee95 = String(_0x4058ba?.[0] || '').trim();
                  if (!_0x29ee95) throw new Error(panorama360Text('uploadFailed'));
                  _0x1f2e11(_0x1404fb.targetNodeId);
                  const _0x43b497 = await _0x414923(
                      {
                        apiKey: _0x29b956,
                        appId: _0x527c39,
                        nodeInfoList: [
                          {
                            nodeId: _0x1f239d,
                            fieldName: 'image',
                            fieldValue: _0x29ee95,
                            description: 'image',
                          },
                        ],
                        instanceType: 'default',
                        usePersonalQueue: 'false',
                      },
                      { signal: _0x1404fb.signal },
                    ),
                    _0x122907 = _0x3258a3(_0x43b497);
                  if (_0x122907 !== null && _0x122907 !== 0)
                    throw new Error(
                      String(_0x43b497?.msg || _0x43b497?.message || panorama360Text('createTaskFailed')),
                    );
                  const _0x313fcc = _0xa592d0(_0x43b497);
                  if (_0x313fcc) _0x1404fb.onTaskId(_0x313fcc);
                  if (_0x1f97ed(_0x1404fb.targetNodeId)) {
                    await _0x317d23({ apiKey: _0x29b956, taskId: _0x313fcc, label: 'Panorama360' });
                    throw _0x45f12a();
                  }
                  return _0x313fcc ? { taskId: _0x313fcc } : { result: { resultUrl: _0xd181ef(_0x43b497) } };
                },
                poll: async ({ taskId: _0x51648a, targetNodeId: _0x47b262 }) => {
                  const _0x196957 = await _0x154c75(
                    _0x51648a,
                    { provider: 'runninghubwf', model: _0x4b985c, apiKey: _0x29b956 },
                    { useOpenapiQuery: true, softTimeout: true },
                  );
                  if (_0x196957?.pending) return _0x196957;
                  _0x1f2e11(_0x47b262);
                  const _0x2c483f =
                    _0x196957?.isBatch && Array.isArray(_0x196957.images) ? _0x196957.images[0] : _0x196957;
                  if (!_0x2c483f || _0x2c483f.error)
                    throw new Error(String(_0x2c483f?.error || panorama360Text('missingResultImage')));
                  const _0xfbaf5f = String(
                    _0x2c483f.sourceUrl || _0x2c483f.imageUrl || _0x2c483f.thumbUrl || _0x2c483f.src || '',
                  ).trim();
                  if (!_0xfbaf5f) throw new Error(panorama360Text('missingResultImage'));
                  return { resultUrl: _0xfbaf5f, resumedImage: _0x2c483f };
                },
                cancel: ({ taskId: _0x129c39 }) =>
                  _0x317d23({ apiKey: _0x29b956, taskId: _0x129c39, label: 'Panorama360' }),
                resultBuilder: async (_0x266bcd, _0x2a05db) => {
                  const _0x26eb96 = String(_0x266bcd?.resultUrl || '').trim();
                  if (!_0x26eb96) throw new Error(panorama360Text('missingResultImage'));
                  ((_0x23b11c = _0x26eb96), (_0x5997d2 = _0x266bcd?.resumedImage || null));
                  let _0x39aee9;
                  try {
                    _0x39aee9 = await _0x57f6a1(_0x26eb96, {
                      resumedImage: _0x5997d2,
                      ext: 'png',
                      includeSrc: true,
                      taskKey: _0x2a05db.taskId ? 'runninghubwf:image:' + _0x2a05db.taskId : '',
                    });
                  } catch (_0x1a7716) {
                    (console.warn('[Panorama360] saveOutputFromUrlToServer failed:', _0x1a7716),
                      (_0x39aee9 = {
                        localPath: '',
                        thumbUrl: _0x26eb96,
                        fields: _0x4e0689({
                          localPath: '',
                          resultUrl: _0x26eb96,
                          thumbUrl: _0x26eb96,
                          includeSrc: true,
                        }),
                      }));
                  }
                  ((_0x5aefd2 = _0x39aee9.thumbUrl || _0x26eb96), (_0x182ace = _0x39aee9.localPath || ''));
                  const _0xc283d7 = _0x39aee9.fields;
                  _0x50ca51 = await _0x2460f0(_0x5592c1, {
                    localPath: _0x182ace,
                    imageUrl: _0x5aefd2 || _0x26eb96,
                    sourceUrl: _0x26eb96,
                    thumbUrl: _0x5aefd2,
                    src: _0x5aefd2 || _0x26eb96,
                  });
                  if (!_0x182ace) throw _0x33a1d9();
                  return {
                    name: panorama360Text('resultName'),
                    ..._0x12d939(_0xc283d7, { startedAt: _0x2a05db.startedAt }),
                    ..._0xc283d7,
                    sourceUrl: _0x26eb96 || _0xc283d7.sourceUrl || '',
                    fileName:
                      _0x5997d2?.fileName || _0xc283d7.fileName || 'panorama_360_' + Date.now() + '.png',
                    width: _0x50ca51.width,
                    height: _0x50ca51.height,
                    outputText: _0x2ba124,
                  };
                },
                failureBuilder: async (_0x500a6b, _0xf26619) => {
                  const _0x125027 =
                    _0x500a6b instanceof Error
                      ? _0x500a6b.message
                      : String(_0x500a6b || panorama360Text('unknownError'));
                  if (_0x1ada18(_0x500a6b))
                    return (
                      (_0x50ca51 ||= await _0x2460f0(_0x5592c1, {
                        localPath: _0x182ace,
                        imageUrl: _0x5aefd2 || _0x23b11c,
                        sourceUrl: _0x23b11c,
                        thumbUrl: _0x5aefd2,
                        src: _0x5aefd2 || _0x23b11c,
                      })),
                      {
                        name: panorama360Text('resultName'),
                        ..._0x25abf1(),
                        fileName: 'panorama_360_' + Date.now() + '.png',
                        width: _0x50ca51.width,
                        height: _0x50ca51.height,
                        outputText: _0x2ba124,
                        ..._0xfd4fb7({ error: _0x275621, startedAt: _0xf26619.startedAt }),
                        rhStatusMessage: _0x275621,
                      }
                    );
                  return {
                    name: panorama360Text('failedName'),
                    ..._0xfd4fb7({ error: _0x125027, startedAt: _0xf26619.startedAt }),
                    outputText: panorama360Text('outputTextWithError', {
                      outputText: _0x2ba124,
                      error: _0x125027,
                    }),
                  };
                },
                cancelledBuilder: () => ({
                  name: panorama360Text('cancelledName'),
                  outputText: panorama360OutputText({ status: panorama360Text('status.cancelled') }),
                }),
              });
            if (_0x5c362a.status === 'success')
              window.showToast?.(panorama360Text('successToast'), 'success');
            else {
              if (_0x5c362a.status === 'pending') window.showToast?.(panorama360Text('pendingToast'), 'info');
              else {
                if (_0x5c362a.status === 'failed') {
                  if (_0x1ada18(_0x5c362a.error)) window.showToast?.('⚠️ ' + _0x275621, 'warn');
                  else {
                    const _0x1e644d =
                      _0x5c362a.error instanceof Error
                        ? _0x5c362a.error.message
                        : String(_0x5c362a.error || panorama360Text('unknownError'));
                    window.showToast?.(panorama360Text('failedWithError', { error: _0x1e644d }), 'error');
                  }
                } else
                  _0x5c362a.status === 'cancelled' &&
                    window.showToast?.(panorama360Text('cancelledToast'), 'info');
              }
            }
          } catch (_0x58d766) {
            const _0x293344 =
              _0x58d766 instanceof Error
                ? _0x58d766.message
                : String(_0x58d766 || panorama360Text('unknownError'));
            if (_0x1175c6(_0x58d766)) {
              window.showToast?.(panorama360Text('cancelledToast'), 'info');
              return;
            }
            window.showToast?.(panorama360Text('failedWithError', { error: _0x293344 }), 'error');
          } finally {
            _0x249483(false);
          }
        })();
      }));
  }
}
