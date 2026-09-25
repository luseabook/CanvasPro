const STORY_ASSET_KINDS = Object['freeze'](['character', 'scene', 'prop']),
  STORY_ASSET_KIND_LABELS = Object['freeze']({ character: '角色', scene: '场景', prop: '道具' }),
  STORY_ASSET_PAID_RERUN_BLOCK_REASONS = Object['freeze']({
    'blocked-paid-response': '付费结果未通过本地校验',
    'blocked-quality-rerun': '付费结果未通过公开质量校验，需调用 API 重新提取',
    'blocked-incompatible': '付费结果与当前合同不兼容',
    'blocked-ambiguous-submission': '请求已提交，但计费状态不明确',
    'blocked-source-changed': '权威剧本正文已变化，旧付费结果不能安全复用',
  }),
  STORY_ASSET_EMPTY_PAID_RESPONSE_REASON = '已收到付费响应，但本地没有可复验的完整原始结果',
  STORY_ASSET_KIND_DISPLAY = Object['freeze']([
    { kind: 'character', label: '角色' },
    { kind: 'scene', label: '场景' },
    { kind: 'prop', label: '道具' },
  ]);
function normalizeText(_0x4fde29) {
  return typeof _0x4fde29 === 'string' ? _0x4fde29['trim']() : '';
}
function normalizeStoryAssetPaidRerunBlockStatus(_0x413cb7 = {}) {
  const _0x1234fd = normalizeText(_0x413cb7?.['status']);
  if (STORY_ASSET_PAID_RERUN_BLOCK_REASONS[_0x1234fd]) return _0x1234fd;
  if (
    _0x1234fd === 'ambiguous-submission' ||
    normalizeText(_0x413cb7?.['errorType']) === 'ambiguous-submission'
  )
    return 'blocked-ambiguous-submission';
  if (
    _0x1234fd === 'authoritative-source-changed' ||
    normalizeText(_0x413cb7?.['errorType']) === 'authoritative-source-changed'
  )
    return 'blocked-source-changed';
  return '';
}
function getStoryAssetQualityPaidRerunKinds(_0x294271 = {}) {
  const _0x379118 = _0x294271?.['qualityReview'];
  if (
    !_0x379118 ||
    typeof _0x379118 !== 'object' ||
    normalizeText(_0x379118['recoveryMode']) !== 'paid-rerun-required'
  )
    return new Set();
  return new Set(
    (Array['isArray'](_0x379118['kinds']) ? _0x379118['kinds'] : [])
      ['map'](normalizeText)
      ['filter']((_0x117961) => STORY_ASSET_KINDS['includes'](_0x117961)),
  );
}
export function getStoryAssetPaidRerunBlockedLanes(_0x57f474 = {}) {
  const _0x33addf =
      _0x57f474?.['kindStates'] && typeof _0x57f474['kindStates'] === 'object' ? _0x57f474['kindStates'] : {},
    _0x50cae3 = getStoryAssetQualityPaidRerunKinds(_0x57f474);
  return STORY_ASSET_KINDS['flatMap']((_0x16b5f8) => {
    const _0x312bc1 =
      normalizeStoryAssetPaidRerunBlockStatus(_0x33addf[_0x16b5f8]) ||
      (_0x50cae3['has'](_0x16b5f8) ? 'blocked-quality-rerun' : '');
    if (!_0x312bc1) return [];
    return [
      {
        kind: _0x16b5f8,
        label: STORY_ASSET_KIND_LABELS[_0x16b5f8],
        status: _0x312bc1,
        reason: STORY_ASSET_PAID_RERUN_BLOCK_REASONS[_0x312bc1],
      },
    ];
  });
}
export function getStoryAssetModelChangeRerunKinds(_0x128dac = {}) {
  const _0x591bd7 =
    _0x128dac?.['kindStates'] && typeof _0x128dac['kindStates'] === 'object' ? _0x128dac['kindStates'] : {};
  return STORY_ASSET_KINDS['filter']((_0x41a58f) => {
    const _0x422292 = _0x591bd7[_0x41a58f] || {};
    return (
      normalizeStoryAssetPaidRerunBlockStatus(_0x422292) === 'blocked-paid-response' &&
      Math['max'](0x0, Math['trunc'](Number(_0x422292['repairCount']) || 0x0)) > 0x0
    );
  });
}
function normalizeStoryAssetPaidBatchBlockStatus(_0xad7308 = {}) {
  const _0x5b261e = normalizeText(_0xad7308?.['status']);
  if (['blocked-paid-response', 'blocked-incompatible', 'blocked-source-changed']['includes'](_0x5b261e))
    return _0x5b261e;
  if (['submitted', 'ambiguous', 'blocked-ambiguous', 'blocked-ambiguous-submission']['includes'](_0x5b261e))
    return 'blocked-ambiguous-submission';
  if (_0x5b261e === 'response-received' && !normalizeText(_0xad7308?.['rawResponse']))
    return 'blocked-paid-response';
  return '';
}
function getStoryAssetBatchStageLabel(_0x3e544c = '') {
  if (_0x3e544c === 'inventory') return '清单批次';
  if (_0x3e544c === 'detail') return '提示词批次';
  if (_0x3e544c === 'repair') return '归并批次';
  return '素材批次';
}
export function getStoryAssetPaidRerunBlockedBatches(_0x55f768 = {}) {
  const _0x4203b0 =
    _0x55f768?.['batchSubmissionRecords'] &&
    typeof _0x55f768['batchSubmissionRecords'] === 'object' &&
    !Array['isArray'](_0x55f768['batchSubmissionRecords'])
      ? _0x55f768['batchSubmissionRecords']
      : {};
  return Object['entries'](_0x4203b0)
    ['sort'](([_0x36f553], [_0xac0cae]) => _0x36f553['localeCompare'](_0xac0cae))
    ['flatMap'](([_0x318f83, _0x172ec4]) => {
      const _0x5c5cc7 = normalizeText(_0x318f83) || normalizeText(_0x172ec4?.['batchKey']),
        _0x867a2 = normalizeStoryAssetPaidBatchBlockStatus(_0x172ec4);
      if (!_0x5c5cc7 || !_0x867a2) return [];
      const _0xde0e9d = normalizeText(_0x172ec4?.['stage']),
        _0x2e33c9 = normalizeText(_0x172ec4?.['batchId']) || _0x5c5cc7;
      return [
        {
          batchKey: _0x5c5cc7,
          batchId: _0x2e33c9,
          stage: _0xde0e9d,
          kinds: Array['isArray'](_0x172ec4?.['kinds'])
            ? [...new Set(_0x172ec4['kinds']['map'](normalizeText)['filter'](Boolean))]
            : [],
          status: _0x867a2,
          label: getStoryAssetBatchStageLabel(_0xde0e9d) + '\x20' + _0x2e33c9,
          reason:
            normalizeText(_0x172ec4?.['status']) === 'response-received'
              ? STORY_ASSET_EMPTY_PAID_RESPONSE_REASON
              : STORY_ASSET_PAID_RERUN_BLOCK_REASONS[_0x867a2],
        },
      ];
    });
}
function canLocallyRevalidateStoryAssetLane(_0xbec7d2, _0x433de3) {
  return Boolean(
    _0x433de3?.['status'] === 'blocked-paid-response' &&
    normalizeText(_0xbec7d2?.['rawResponsesByKind']?.[_0x433de3['kind']]),
  );
}
function canLocallyRevalidateStoryAssetBatch(_0x382068, _0x233acd) {
  const _0x38eb6b = _0x382068?.['batchSubmissionRecords']?.[_0x233acd?.['batchKey']];
  return Boolean(
    _0x233acd?.['status'] === 'blocked-paid-response' && normalizeText(_0x38eb6b?.['rawResponse']),
  );
}
function canLocallyRevalidateEveryStoryAssetBlocker(_0x4a98c5, _0x583520, _0x57fe3a) {
  const _0x83c3dd = _0x583520['length'] + _0x57fe3a['length'];
  return Boolean(
    _0x83c3dd &&
    _0x583520['every']((_0x20f714) => canLocallyRevalidateStoryAssetLane(_0x4a98c5, _0x20f714)) &&
    _0x57fe3a['every']((_0x122c0f) => canLocallyRevalidateStoryAssetBatch(_0x4a98c5, _0x122c0f)),
  );
}
export function createStoryAssetPaidRerunChoiceDescriptor(
  _0x2f216f = [],
  _0x326411 = [],
  { allowLocalRevalidate: allowLocalRevalidate = ![] } = {},
) {
  const _0x281c4b = Array['isArray'](_0x2f216f) ? _0x2f216f : [],
    _0x168595 = Array['isArray'](_0x326411) ? _0x326411 : [],
    _0x5b55ce = _0x281c4b['map'](
      (_0xd37323) => normalizeText(_0xd37323?.['label']) + '：' + normalizeText(_0xd37323?.['reason']),
    )
      ['filter']((_0x51f72d) => _0x51f72d !== '：')
      ['join']('；'),
    _0x20094e = _0x168595['map'](
      (_0x484cab) => normalizeText(_0x484cab?.['label']) + '：' + normalizeText(_0x484cab?.['reason']),
    )
      ['filter']((_0x2c4ec6) => _0x2c4ec6 !== '：')
      ['join']('；'),
    _0x5f23a2 = _0x281c4b['length'] + _0x168595['length'],
    _0x243ddd = _0x168595['length'] ? _0x5f23a2 + '\x20项' : _0x281c4b['length'] + '\x20路';
  return {
    title: _0x168595['length'] ? '处理已阻断的素材批次' : '处理已阻断的素材线路',
    message: [
      _0x5b55ce,
      _0x20094e,
      allowLocalRevalidate ? '免费本地重校验不会调用\x20API' : '以上阻断项没有可安全复验的完整本地结果',
      '确认重跑将仅重新调用以上\x20' +
        _0x243ddd +
        ' API，可能再次计费；' +
        (_0x168595['length'] ? '成功线路和批次' : '成功线路') +
        '会直接复用，原始结果会保留',
    ]
      ['filter'](Boolean)
      ['join']('。'),
    choices: [
      { label: '取消', value: null, autofocus: !![] },
      ...(allowLocalRevalidate ? [{ label: '免费本地重校验', value: 'local-revalidate' }] : []),
      { label: '确认仅重跑 ' + _0x243ddd, value: 'paid-rerun', primary: !![] },
    ],
  };
}
export function createStoryAssetPaidRerunChoiceGate() {
  let _0x5284f9 = ![];
  return async function _0x1ba520({
    draft: draft = {},
    requestChoice: _0x2c8f13,
    isCurrent: isCurrent = () => !![],
  } = {}) {
    const _0x220f51 = getStoryAssetPaidRerunBlockedLanes(draft),
      _0x58fea8 = getStoryAssetPaidRerunBlockedBatches(draft);
    if (!_0x220f51['length'] && !_0x58fea8['length'])
      return {
        action: 'not-blocked',
        blockedLanes: _0x220f51,
        blockedBatches: _0x58fea8,
        paidRerunAuthorization: null,
      };
    if (_0x5284f9)
      return {
        action: 'busy',
        blockedLanes: _0x220f51,
        blockedBatches: _0x58fea8,
        paidRerunAuthorization: null,
      };
    _0x5284f9 = !![];
    try {
      const _0x501c71 = canLocallyRevalidateEveryStoryAssetBlocker(draft, _0x220f51, _0x58fea8),
        _0x240134 =
          typeof _0x2c8f13 === 'function'
            ? await _0x2c8f13(
                createStoryAssetPaidRerunChoiceDescriptor(_0x220f51, _0x58fea8, {
                  allowLocalRevalidate: _0x501c71,
                }),
              )
            : null;
      if (typeof isCurrent === 'function' && !isCurrent())
        return {
          action: 'stale',
          blockedLanes: _0x220f51,
          blockedBatches: _0x58fea8,
          paidRerunAuthorization: null,
        };
      if (_0x240134 === 'local-revalidate' && _0x501c71)
        return {
          action: _0x240134,
          blockedLanes: _0x220f51,
          blockedBatches: _0x58fea8,
          paidRerunAuthorization: null,
        };
      if (_0x240134 === 'paid-rerun')
        return {
          action: _0x240134,
          blockedLanes: _0x220f51,
          blockedBatches: _0x58fea8,
          paidRerunAuthorization: {
            confirmed: !![],
            ...(_0x220f51['length']
              ? { authorizedKinds: _0x220f51['map']((_0x3b8a32) => _0x3b8a32['kind']) }
              : {}),
            ...(_0x58fea8['length']
              ? { authorizedBatchIds: _0x58fea8['map']((_0x227ad7) => _0x227ad7['batchKey']) }
              : {}),
          },
        };
      return {
        action: 'cancelled',
        blockedLanes: _0x220f51,
        blockedBatches: _0x58fea8,
        paidRerunAuthorization: null,
      };
    } finally {
      _0x5284f9 = ![];
    }
  };
}
function getStoryAssetEvidenceProgress(_0x3af851 = {}) {
  const _0xfff02c = normalizeText(_0x3af851?.['progress']?.['stage'] || _0x3af851?.['phase']),
    _0xa6d2ad = Math['max'](0x0, Math['trunc'](Number(_0x3af851?.['progress']?.['current']) || 0x0)),
    _0x44e6ce = Math['max'](0x0, Math['trunc'](Number(_0x3af851?.['progress']?.['total']) || 0x0)),
    _0x1cee6f = Array['isArray'](_0x3af851?.['inventory']?.['assets'])
      ? _0x3af851['inventory']['assets']
      : [],
    _0x2d416a = Array['isArray'](_0x3af851?.['completedAssets']) ? _0x3af851['completedAssets'] : [],
    _0x446140 = ['inventory', 'repair']['includes'](_0xfff02c),
    _0x4dad76 = _0x446140 && _0x44e6ce ? _0x44e6ce : _0x1cee6f['length'] || _0x44e6ce,
    _0x5b0b09 = Math['min'](_0x4dad76, _0x446140 ? _0xa6d2ad : Math['max'](_0x2d416a['length'], _0xa6d2ad));
  return {
    stage: _0x446140 ? 'inventory' : 'detail',
    completed: _0x5b0b09,
    total: _0x4dad76,
    remaining: Math['max'](0x0, _0x4dad76 - _0x5b0b09),
  };
}
export function isStoryAssetPlannedContinuationDraft(_0x5a2b9b = {}) {
  if (!/^evidence-batched-api-v\d+$/u['test'](normalizeText(_0x5a2b9b?.['strategy']))) return ![];
  if (normalizeText(_0x5a2b9b?.['status']) !== 'partial') return ![];
  if (Array['isArray'](_0x5a2b9b?.['failures']) && _0x5a2b9b['failures']['length']) return ![];
  if (
    getStoryAssetPaidRerunBlockedLanes(_0x5a2b9b)['length'] ||
    getStoryAssetPaidRerunBlockedBatches(_0x5a2b9b)['length']
  )
    return ![];
  return getStoryAssetEvidenceProgress(_0x5a2b9b)['remaining'] > 0x0;
}
function getStoryAssetExtractionErrorLabel(_0x42e4b4 = '') {
  if (_0x42e4b4 === 'auth') return '认证失败';
  if (_0x42e4b4 === 'timeout') return '超时';
  if (_0x42e4b4 === 'rate-limit') return '限流';
  if (_0x42e4b4 === 'length') return '输出截断';
  if (_0x42e4b4 === 'call-limit') return '达到调用上限';
  if (_0x42e4b4 === 'validation') return '结果校验失败';
  if (_0x42e4b4 === 'invalid-json') return '格式错误';
  if (_0x42e4b4 === 'local-model') return '本地模型不可用';
  return '请求失败';
}
export function getStoryAssetExperimentalDraftDisplay(_0x2e6122 = {}) {
  if (_0x2e6122?.['strategy'] === 'local-pp-uie-v1') {
    const _0x29d94c = Array['isArray'](_0x2e6122?.['failures']) ? _0x2e6122['failures'] : [],
      _0x3a1946 = normalizeText(_0x2e6122?.['progress']?.['message']),
      _0x27a4d7 = _0x29d94c['slice'](0x0, 0x3)
        ['map']((_0x4f08b5) => {
          const _0x275741 = normalizeText(_0x4f08b5?.['batchId']);
          return (
            '本地扫描' +
            (_0x275741 ? '\x20' + _0x275741 : '') +
            '：' +
            getStoryAssetExtractionErrorLabel(normalizeText(_0x4f08b5?.['errorType']))
          );
        })
        ['join'](' · '),
      _0x715824 = normalizeText(_0x2e6122?.['status']),
      _0x571745 = Boolean(_0x3a1946 || _0x27a4d7 || ['in-progress', 'failed']['includes'](_0x715824));
    return {
      hasProgress: _0x571745,
      failureCount: _0x29d94c['length'],
      retryCount: _0x715824 === 'completed' ? 0x0 : 0x1,
      summary: [_0x3a1946, _0x27a4d7]['filter'](Boolean)['join'](' · '),
      actionLabel: _0x715824 === 'completed' ? '开发测试' : '继续开发测试',
    };
  }
  if (_0x2e6122?.['strategy'] === 'inventory-only-v4') {
    const _0x495b12 = Array['isArray'](_0x2e6122?.['failures']) ? _0x2e6122['failures'] : [],
      _0x4dad6d = new Set(
        _0x495b12['map'](
          (_0x92af78) =>
            normalizeText(_0x92af78?.['batchId']) || JSON['stringify'](_0x92af78?.['assetRefs'] || []),
        ),
      ),
      _0x4918d9 = normalizeText(_0x2e6122?.['progress']?.['message']),
      _0x2520a2 = _0x495b12['slice'](0x0, 0x3)
        ['map']((_0x3252ff) => {
          const _0x33b301 = _0x3252ff?.['stage'] === 'repair' ? '归并校验' : '清单',
            _0x511a7e = normalizeText(_0x3252ff?.['batchLabel'] || _0x3252ff?.['batchId']);
          return (
            '' +
            _0x33b301 +
            (_0x511a7e ? '\x20' + _0x511a7e : '') +
            '：' +
            getStoryAssetExtractionErrorLabel(normalizeText(_0x3252ff?.['errorType']))
          );
        })
        ['join'](' · '),
      _0x165d58 = _0x4dad6d['size'],
      _0x2af95c = normalizeText(_0x2e6122?.['status']),
      _0xdd7c4f = Boolean(
        _0x4918d9 || _0x2520a2 || ['in-progress', 'partial', 'failed']['includes'](_0x2af95c),
      );
    return {
      hasProgress: _0xdd7c4f,
      failureCount: _0x165d58,
      retryCount: _0x165d58 || (_0x2af95c === 'completed' ? 0x0 : 0x1),
      summary: _0x2520a2 || _0x4918d9,
      actionLabel: _0x165d58
        ? '重试未完成窗口（' + _0x165d58 + '）'
        : _0x2af95c === 'completed'
          ? '提取角色、场景与道具'
          : '继续素材提取',
    };
  }
  if (/^evidence-batched-api-v\d+$/u['test'](normalizeText(_0x2e6122?.['strategy']))) {
    const {
        stage: _0x5ab0da,
        completed: _0x3a3c1a,
        total: _0x2b149b,
        remaining: _0x466f3e,
      } = getStoryAssetEvidenceProgress(_0x2e6122),
      _0x209dec = Array['isArray'](_0x2e6122?.['failures']) ? _0x2e6122['failures'] : [],
      _0x46760a =
        getStoryAssetPaidRerunBlockedLanes(_0x2e6122)['length'] +
        getStoryAssetPaidRerunBlockedBatches(_0x2e6122)['length'],
      _0x45c2af = _0x209dec[0x0],
      _0x4d8127 =
        normalizeText(_0x45c2af?.['errorType']) === 'incomplete-output' ||
        /资产细化结果必须与当前批次资产数量完全一致|缺少\s*\d+\s*个资产结果/u['test'](
          normalizeText(_0x45c2af?.['errorMessage']),
        ),
      _0x3c8da3 = /角色 role 只能是主角、配角、反派或路人/u['test'](
        normalizeText(_0x45c2af?.['errorMessage']),
      ),
      _0x32e1a0 = normalizeText(_0x2e6122?.['progress']?.['message']),
      _0x4725e8 = _0x2b149b
        ? (_0x5ab0da === 'inventory' ? '清单：已覆盖' : '素材：已完成') +
          '\x20' +
          _0x3a3c1a +
          '/' +
          _0x2b149b +
          '\x20' +
          (_0x5ab0da === 'inventory' ? '场' : '个') +
          (_0x466f3e
            ? ' · 剩余 ' + _0x466f3e + '\x20' + (_0x5ab0da === 'inventory' ? '场' : '个') + '待继续'
            : '') +
          (_0x4d8127
            ? ' · 上批输出不完整，未自动重试'
            : _0x3c8da3
              ? ' · 上批被旧角色分类规则拦截，现已修复'
              : normalizeText(_0x45c2af?.['errorType']) === 'validation'
                ? ' · 上批结果校验未通过，未自动重试'
                : '')
        : _0x32e1a0;
    return {
      hasProgress: Boolean(_0x46760a || _0x4725e8 || _0x32e1a0),
      failureCount: _0x209dec['length'],
      retryCount: _0x46760a || _0x466f3e,
      summary: _0x4725e8 || _0x32e1a0,
      actionLabel: _0x46760a
        ? '处理已阻断（' + _0x46760a + '）'
        : _0x466f3e
          ? '继续剩余 ' + _0x466f3e + '\x20' + (_0x5ab0da === 'inventory' ? '场' : '个')
          : normalizeText(_0x2e6122?.['status']) === 'completed'
            ? '提取角色、场景与道具'
            : '继续素材提取',
    };
  }
  const _0x2c0529 =
      _0x2e6122?.['kindStates'] && typeof _0x2e6122['kindStates'] === 'object' ? _0x2e6122['kindStates'] : {},
    _0x2a816c = getStoryAssetPaidRerunBlockedLanes(_0x2e6122),
    _0x2f8f1f = new Map(_0x2a816c['map']((_0xa8820d) => [_0xa8820d['kind'], _0xa8820d])),
    _0x1ea773 = STORY_ASSET_KIND_DISPLAY['map'](({ kind: _0x3abefa, label: _0xf6b4b1 }) => {
      const _0xe68aa6 = _0x2c0529[_0x3abefa] || {},
        _0xa279eb = normalizeText(_0xe68aa6['status']),
        _0xd63090 = _0x2f8f1f['get'](_0x3abefa);
      if (_0xd63090)
        return { kind: _0x3abefa, status: _0xd63090['status'], text: _0xf6b4b1 + '：' + _0xd63090['reason'] };
      if (_0xa279eb === 'succeeded')
        return {
          kind: _0x3abefa,
          status: _0xa279eb,
          text:
            _0xf6b4b1 + '：成功\x20' + Math['max'](0x0, Number(_0xe68aa6['assetCount']) || 0x0) + '\x20个',
        };
      if (_0xa279eb === 'failed')
        return {
          kind: _0x3abefa,
          status: _0xa279eb,
          text: _0xf6b4b1 + '：' + getStoryAssetExtractionErrorLabel(normalizeText(_0xe68aa6['errorType'])),
        };
      if (_0xa279eb === 'running')
        return { kind: _0x3abefa, status: _0xa279eb, text: _0xf6b4b1 + '：处理中' };
      if (_0xa279eb === 'pending')
        return { kind: _0x3abefa, status: _0xa279eb, text: _0xf6b4b1 + '：待处理' };
      return { kind: _0x3abefa, status: '', text: '' };
    }),
    _0x4abf98 = _0x1ea773['filter']((_0x41a6ba) => _0x41a6ba['text']),
    _0xc28ac3 = _0x1ea773['filter']((_0x33b1f0) => _0x33b1f0['status'] === 'failed')['length'],
    _0x17646e = _0x1ea773['filter'](
      (_0xeab6ab) => _0xeab6ab['status'] && _0xeab6ab['status'] !== 'succeeded',
    )['length'],
    _0x56f9e2 = _0x2a816c['length'],
    _0x443778 = getStoryAssetModelChangeRerunKinds(_0x2e6122),
    _0x1fe91c = _0x443778['length'] > 0x0,
    _0x16c6a5 = STORY_ASSET_KIND_DISPLAY['filter'](({ kind: _0x2c8b78 }) => _0x443778['includes'](_0x2c8b78))
      ['map'](({ label: _0x5588a9 }) => _0x5588a9)
      ['join']('、'),
    _0x450725 = STORY_ASSET_KIND_DISPLAY['filter'](
      ({ kind: _0x228b21 }) => normalizeText(_0x2c0529[_0x228b21]?.['status']) === 'succeeded',
    )
      ['map'](({ label: _0x18ce51 }) => _0x18ce51)
      ['join']('、'),
    _0x5df2d8 = _0x1fe91c
      ? _0x16c6a5 +
        '自动纠错后仍未返回合格结果；建议切换文本模型后仅重试' +
        _0x16c6a5 +
        (_0x450725 ? '，' + _0x450725 + '结果已保留' : '')
      : '',
    _0x1fe8cc = isStoryAssetLocalQualityRevalidationDraft(_0x2e6122),
    _0x1b0aa8 = _0x1fe8cc ? '付费提取结果已保留，待按最新规则本地复验' : '';
  return {
    hasProgress: Boolean(_0x1b0aa8 || _0x4abf98['length']),
    failureCount: _0xc28ac3,
    retryCount: _0x17646e,
    summary: [_0x1b0aa8, ..._0x4abf98['map']((_0x1684a3) => _0x1684a3['text']), _0x5df2d8]
      ['filter'](Boolean)
      ['join'](' · '),
    actionLabel:
      _0x1fe91c && _0x56f9e2 === _0x443778['length']
        ? '换模型后仅重试' + _0x16c6a5
        : _0x56f9e2
          ? '处理已阻断（' + _0x56f9e2 + '）'
          : _0x1fe8cc
            ? '重新校验（不调用 API）'
            : _0xc28ac3
              ? '重试失败项（' + _0xc28ac3 + '）'
              : _0x17646e
                ? '继续提取（' + _0x17646e + '）'
                : '提取角色、场景与道具',
    ...(_0x1fe91c ? { needsModelChange: !![], modelChangeKinds: _0x443778 } : {}),
  };
}
export function isStoryAssetLocalQualityRevalidationDraft(_0x4f868d = {}) {
  if (!_0x4f868d || typeof _0x4f868d !== 'object') return ![];
  if (_0x4f868d['qualityReview'] && typeof _0x4f868d['qualityReview'] === 'object')
    return normalizeText(_0x4f868d['qualityReview']['recoveryMode']) !== 'paid-rerun-required';
  const _0x2d03ab =
      _0x4f868d['kindStates'] && typeof _0x4f868d['kindStates'] === 'object' ? _0x4f868d['kindStates'] : {},
    _0x2247a9 =
      _0x4f868d['assetsByKind'] && typeof _0x4f868d['assetsByKind'] === 'object'
        ? _0x4f868d['assetsByKind']
        : {};
  let _0x7e6343 = ![];
  const _0x53c349 = STORY_ASSET_KINDS['every']((_0x252072) => {
    const _0x37fcc6 = _0x2d03ab[_0x252072] || {};
    if (normalizeText(_0x37fcc6['status']) === 'succeeded') return !![];
    const _0x17a9c7 =
      normalizeText(_0x37fcc6['status']) === 'failed' &&
      normalizeText(_0x37fcc6['errorType']) === 'validation' &&
      Array['isArray'](_0x2247a9[_0x252072]);
    if (_0x17a9c7) _0x7e6343 = !![];
    return _0x17a9c7;
  });
  return _0x7e6343 && _0x53c349;
}
