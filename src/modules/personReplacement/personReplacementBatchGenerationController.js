import { createTaskBatchCancellationController, runTaskBatchQueue } from '../../core/taskBatchExecution.js';
function normalizeText(_0x2953b9) {
  return String(_0x2953b9 ?? '')['trim']();
}
function isSameShotSelection(_0x7b508f, _0x4956b3) {
  return (
    _0x7b508f['length'] === _0x4956b3['size'] &&
    _0x7b508f['every']((_0xb43718) => _0x4956b3['has'](_0xb43718))
  );
}
export function createPersonReplacementBatchGenerationController({
  getProject: _0x16c16c,
  buildImagePresentation: _0x166c2d,
  getCharacterAppearance: _0x59db49,
  runRequest: _0x72d9d4,
  requestRender: _0x5b7fa4,
  refreshShotSelectionControls: _0x589168,
  resolveCharacterImageBatchConcurrency: _0x204ad0,
  onGenerateReplacementImageRequested: _0x480f74,
  onCancelReplacementImageRequested: _0x148774,
  onGenerateReplacementVideoRequested: _0x466aca,
  onCancelReplacementVideoRequested: _0x2c5564,
  onGenerateCharacterImageRequested: _0x33692e,
  onGenerationBatchCompleted: _0x1ec746,
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof _0x16c16c !== 'function' ||
    typeof _0x166c2d !== 'function' ||
    typeof _0x59db49 !== 'function' ||
    typeof _0x72d9d4 !== 'function' ||
    typeof _0x5b7fa4 !== 'function' ||
    typeof _0x589168 !== 'function' ||
    typeof _0x204ad0 !== 'function'
  )
    throw new TypeError(
      'Person\x20replacement\x20batch\x20generation\x20requires\x20project\x20and\x20task\x20adapters.',
    );
  const _0x269be6 = new Map();
  let _0x247d35 = 0x0,
    _0xe83061 = ![],
    _0x53c80e = '',
    _0x58f48a = new Set(),
    _0xbb7e4 = new Set(),
    _0x40da9f = null;
  const _0x201cc7 = () => {
      if (!_0x589168()) _0x5b7fa4();
    },
    _0x248a6c = () => {
      const _0x2b9540 = _0x16c16c();
      return new Set(
        Array['isArray'](_0x2b9540['workspace']['selectedShotIds'])
          ? _0x2b9540['workspace']['selectedShotIds']['map'](normalizeText)['filter'](Boolean)
          : [],
      );
    },
    _0x3460ca = () => {
      const _0x2b3c36 = _0x16c16c(),
        _0x27e3f2 = normalizeText(_0x2b3c36['id']),
        _0x21d70c = _0x2b3c36['workspace']['step'] === 0x3 ? 'video' : 'image',
        _0x3a2b55 = _0x248a6c();
      if (!_0x27e3f2 || !_0x3a2b55['size']) return null;
      return (
        [..._0x269be6['values']()]['find'](
          (_0x28d737) =>
            _0x28d737['projectId'] === _0x27e3f2 &&
            _0x28d737['kind'] === _0x21d70c &&
            isSameShotSelection(_0x28d737['targetShotIds'], _0x3a2b55),
        ) || null
      );
    },
    _0x294847 = () => {
      const _0xc53faf = _0x16c16c(),
        _0x40228d = normalizeText(_0xc53faf['id']),
        _0x23a360 = _0xc53faf['workspace']['step'] === 0x3 ? 'video' : 'image';
      return [
        ...new Set(
          [..._0x269be6['values']()]
            ['filter']((_0xe0330c) => _0xe0330c['projectId'] === _0x40228d && _0xe0330c['kind'] === _0x23a360)
            ['flatMap']((_0x57a1a4) => [..._0x57a1a4['generatingShotIds']]),
        ),
      ];
    },
    _0x272c34 = () => {
      const _0x3c8a8a = _0x3460ca();
      return {
        active: Boolean(_0x3c8a8a),
        label: _0x3c8a8a?.['label'] || '',
        generatingShotIds: _0x294847(),
        cancelRequested: _0x3c8a8a?.['cancellation']?.['isRequested']?.() === !![],
      };
    },
    _0x37c236 = () => ({
      active: _0xe83061,
      label: _0x53c80e,
      generatingCharacterIds: [..._0x58f48a],
      cancelRequested: _0x40da9f?.['isRequested']?.() === !![],
    }),
    _0x50dbcb = () => Boolean(_0x3460ca()),
    _0x8ff8e3 = (_0x8960cf = 'image') => {
      const _0x25c6bc = _0x16c16c(),
        _0x2ab65d = [
          ...new Set(_0x25c6bc['workspace']['selectedShotIds']['map'](normalizeText)['filter'](Boolean)),
        ];
      if (!_0x2ab65d['length']) return ![];
      const _0x5eb16f = normalizeText(_0x25c6bc['workspace']['selectedShotId']),
        _0xd4446d = _0x2ab65d['includes'](_0x5eb16f)
          ? [_0x5eb16f, ..._0x2ab65d['filter']((_0x33945d) => _0x33945d !== _0x5eb16f)]
          : _0x2ab65d,
        _0x293513 = _0x8960cf === 'video',
        _0x33a3ca = normalizeText(_0x25c6bc['id']),
        _0x5c2819 = [..._0x269be6['values']()]['find'](
          (_0x5c735a) =>
            _0x5c735a['projectId'] === _0x33a3ca &&
            _0x5c735a['kind'] === _0x8960cf &&
            isSameShotSelection(_0x5c735a['targetShotIds'], new Set(_0xd4446d)),
        );
      if (_0x5c2819) return ![];
      const _0x6072f4 = _0x293513
        ? []
        : _0xd4446d['map']((_0x5a1fc5) =>
            _0x25c6bc['shots']['find']((_0x46d7b7) => _0x46d7b7['id'] === _0x5a1fc5),
          )['filter']((_0x4b2f14) => {
            if (!_0x4b2f14) return ![];
            const _0x4c9652 = _0x166c2d({
              ..._0x25c6bc,
              workspace: { ..._0x25c6bc['workspace'], selectedShotId: normalizeText(_0x4b2f14['id']) },
            });
            return (
              !_0x4c9652['gate']['sceneOnly'] && _0x4c9652['gate']['duplicateRoleLabels']['length'] > 0x0
            );
          });
      if (_0x6072f4['length'])
        return (
          windowObject?.['showToast']?.(
            '有\x20' + _0x6072f4['length'] + '\x20个镜头存在重复角色名，请先修改红色框中的角色。',
            'warn',
          ),
          ![]
        );
      const _0x459f44 = _0x293513 ? _0x466aca : _0x480f74,
        _0x263a6a = _0x293513 ? '批量生成视频' : '批量生成',
        _0xfbcd31 = createTaskBatchCancellationController(),
        _0x2b9fcf = 'shot-batch-' + ++_0x247d35,
        _0x4d3ab1 = {
          id: _0x2b9fcf,
          projectId: _0x33a3ca,
          kind: _0x293513 ? 'video' : 'image',
          targetShotIds: _0xd4446d,
          generatingShotIds: new Set(_0xd4446d),
          activeShotIds: new Set(),
          cancellation: _0xfbcd31,
          label: _0x263a6a + ' 0/' + _0xd4446d['length'],
        };
      (_0x269be6['set'](_0x2b9fcf, _0x4d3ab1), _0x201cc7());
      let _0x5cff9 = 0x0;
      return (
        void runTaskBatchQueue({
          targets: _0xd4446d,
          concurrency: _0xd4446d['length'],
          shouldStop: _0xfbcd31['isRequested'],
          onTargetStart: ({ target: _0x3797c2 }) => {
            _0x4d3ab1['activeShotIds']['add'](_0x3797c2);
          },
          runTarget: (_0x37bedd) =>
            _0x72d9d4(
              _0x459f44,
              { projectId: _0x33a3ca, shotId: _0x37bedd, notifyCompletion: ![] },
              {},
              { applyCallbackResult: !_0x293513 },
            ),
          onTargetSettled: ({ target: _0x13bbb2 }) => {
            (_0x4d3ab1['activeShotIds']['delete'](_0x13bbb2),
              _0x4d3ab1['generatingShotIds']['delete'](_0x13bbb2),
              (_0x5cff9 += 0x1),
              (_0x4d3ab1['label'] = _0xfbcd31['isRequested']()
                ? '正在停止批量生成 · 已结束 ' + _0x5cff9 + '/' + _0xd4446d['length']
                : _0x263a6a + '\x20' + _0x5cff9 + '/' + _0xd4446d['length']),
              _0x201cc7());
          },
        })
          ['then']((_0xb95fd3) => {
            const _0x468519 = _0xb95fd3['filter']((_0x4595d1) => _0x4595d1['status'] !== 'cancelled'),
              _0x5dda49 = _0x468519['filter'](
                (_0x1a8ce3) => _0x1a8ce3['status'] === 'fulfilled' && _0x1a8ce3['value']?.['ok'] === !![],
              )['length'];
            _0x72d9d4(
              _0x1ec746,
              {
                kind: _0x293513 ? 'video' : 'image',
                projectId: _0x33a3ca,
                shotIds: _0xd4446d,
                totalCount: _0x468519['length'],
                successCount: _0x5dda49,
                failureCount: _0x468519['length'] - _0x5dda49,
                ...(_0xb95fd3['length'] > _0x468519['length']
                  ? { cancelledCount: _0xb95fd3['length'] - _0x468519['length'] }
                  : {}),
              },
              {},
              { applyCallbackResult: ![] },
            );
          })
          ['finally'](() => {
            if (_0x269be6['get'](_0x2b9fcf) !== _0x4d3ab1) return;
            (_0x269be6['delete'](_0x2b9fcf), _0x201cc7());
          }),
        !![]
      );
    },
    _0x193bb4 = () => {
      const _0xd32b1a = _0x3460ca(),
        _0x2e958e = _0xd32b1a?.['cancellation'];
      if (!_0xd32b1a || !_0x2e958e?.['request']?.()) return ![];
      const _0x99967 = [..._0xd32b1a['activeShotIds']];
      ((_0xd32b1a['generatingShotIds'] = new Set(_0x99967)),
        (_0xd32b1a['label'] = '正在停止批量生成'),
        _0x201cc7());
      const _0x2dc78b = _0xd32b1a['kind'] === 'video' ? _0x2c5564 : _0x148774;
      return (
        void Promise['allSettled'](
          _0x99967['map']((_0x261ec0) =>
            Promise['resolve'](
              _0x72d9d4(
                _0x2dc78b,
                { projectId: _0xd32b1a['projectId'], shotId: _0x261ec0 },
                {},
                { applyCallbackResult: ![] },
              ),
            ),
          ),
        ),
        !![]
      );
    },
    _0x5a79b8 = () => {
      if (_0xe83061) return ![];
      const _0x9c910 = _0x16c16c(),
        _0x5aa8c0 = [
          ...new Set(
            _0x9c910['workspace']['selectedAssetIds']
              ['map'](normalizeText)
              ['filter'](
                (_0x57fde5) =>
                  _0x57fde5 && _0x9c910['characters']['some']((_0x61ad39) => _0x61ad39['id'] === _0x57fde5),
              ),
          ),
        ];
      if (!_0x5aa8c0['length']) return ![];
      const _0x255bbb = createTaskBatchCancellationController();
      ((_0x40da9f = _0x255bbb),
        (_0xe83061 = !![]),
        (_0x58f48a = new Set(_0x5aa8c0)),
        (_0xbb7e4 = new Set()),
        (_0x53c80e = '批量生成 0/' + _0x5aa8c0['length']),
        _0x5b7fa4());
      let _0x29b695 = 0x0;
      const _0x4ce9b5 = _0x204ad0({
        targetCount: _0x5aa8c0['length'],
        modelId: _0x9c910['settings']['characterImageModelId'],
        provider: _0x9c910['settings']['characterImageProvider'],
        providerProfileId: _0x9c910['settings']['characterImageProviderProfileId'],
      });
      return (
        void runTaskBatchQueue({
          targets: _0x5aa8c0,
          concurrency: _0x4ce9b5,
          shouldStop: _0x255bbb['isRequested'],
          onTargetStart: ({ target: _0x422aa7 }) => {
            _0xbb7e4['add'](_0x422aa7);
          },
          runTarget: (_0x5b8296) => {
            const _0x485386 = _0x16c16c(),
              _0xca6af8 = _0x485386['characters']['find']((_0x43572c) => _0x43572c['id'] === _0x5b8296);
            return _0x72d9d4(_0x33692e, {
              characterId: _0x5b8296,
              appearanceId: _0x59db49(_0xca6af8)?.['id'],
              prompt: _0xca6af8?.['description'],
              promptPresetId: _0x485386['workspace']['assetPromptPresetId'],
              modelId: _0x485386['settings']['characterImageModelId'],
              provider: _0x485386['settings']['characterImageProvider'],
              providerProfileId: _0x485386['settings']['characterImageProviderProfileId'],
              generationParams: _0x485386['settings']['characterImageGenerationParams'],
              notifyCompletion: ![],
            });
          },
          onTargetSettled: ({ target: _0x2f49f4 }) => {
            (_0xbb7e4['delete'](_0x2f49f4),
              _0x58f48a['delete'](_0x2f49f4),
              (_0x29b695 += 0x1),
              (_0x53c80e = _0x255bbb['isRequested']()
                ? '已取消后续生成 · 正在完成 ' + _0xbb7e4['size'] + '\x20项'
                : '批量生成 ' + _0x29b695 + '/' + _0x5aa8c0['length']),
              _0x5b7fa4());
          },
        })
          ['then']((_0x3ca329) => {
            const _0xf300d3 = _0x3ca329['filter']((_0x3224b7) => _0x3224b7['status'] !== 'cancelled'),
              _0x251f91 = _0xf300d3['filter'](
                (_0xdf617) => _0xdf617['status'] === 'fulfilled' && _0xdf617['value']?.['ok'] === !![],
              )['length'];
            _0x72d9d4(
              _0x1ec746,
              {
                kind: 'asset',
                characterIds: _0x5aa8c0,
                totalCount: _0xf300d3['length'],
                successCount: _0x251f91,
                failureCount: _0xf300d3['length'] - _0x251f91,
                ...(_0x3ca329['length'] > _0xf300d3['length']
                  ? { cancelledCount: _0x3ca329['length'] - _0xf300d3['length'] }
                  : {}),
              },
              {},
              { applyCallbackResult: ![] },
            );
          })
          ['finally'](() => {
            if (_0x40da9f !== _0x255bbb) return;
            ((_0xe83061 = ![]),
              (_0x53c80e = ''),
              (_0x58f48a = new Set()),
              (_0xbb7e4 = new Set()),
              (_0x40da9f = null),
              _0x5b7fa4());
          }),
        !![]
      );
    },
    _0x4a818c = () => {
      const _0x5cd2eb = _0x40da9f;
      if (!_0xe83061 || !_0x5cd2eb?.['request']?.()) return ![];
      return (
        (_0x58f48a = new Set(_0xbb7e4)),
        (_0x53c80e = _0xbb7e4['size']
          ? '已取消后续生成\x20·\x20正在完成\x20' + _0xbb7e4['size'] + '\x20项'
          : '已取消后续生成'),
        _0x5b7fa4(),
        !![]
      );
    },
    _0x5bebde = () => {
      (_0x269be6['forEach']((_0x4bcd09) => _0x4bcd09['cancellation']?.['request']?.()),
        _0x40da9f?.['request']?.());
    };
  return Object['freeze']({
    cancelAssetBatch: _0x4a818c,
    cancelShotBatch: _0x193bb4,
    destroy: _0x5bebde,
    getAssetRenderState: _0x37c236,
    getMatchingShotSession: _0x3460ca,
    getShotRenderState: _0x272c34,
    isShotBatchForCurrentProject: _0x50dbcb,
    runAssetBatch: _0x5a79b8,
    runShotBatch: _0x8ff8e3,
  });
}
