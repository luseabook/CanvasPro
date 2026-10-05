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
function normalizeText(value) {
  return typeof value === 'string' ? value['trim']() : '';
}
function normalizeStoryAssetPaidRerunBlockStatus(response = {}) {
  const text = normalizeText(response?.['status']);
  if (STORY_ASSET_PAID_RERUN_BLOCK_REASONS[text]) return text;
  if (text === 'ambiguous-submission' || normalizeText(response?.['errorType']) === 'ambiguous-submission')
    return 'blocked-ambiguous-submission';
  if (
    text === 'authoritative-source-changed' ||
    normalizeText(response?.['errorType']) === 'authoritative-source-changed'
  )
    return 'blocked-source-changed';
  return '';
}
function getStoryAssetQualityPaidRerunKinds(options = {}) {
  const enabled = options?.['qualityReview'];
  if (
    !enabled ||
    typeof enabled !== 'object' ||
    normalizeText(enabled['recoveryMode']) !== 'paid-rerun-required'
  )
    return new Set();
  return new Set(
    (Array['isArray'](enabled['kinds']) ? enabled['kinds'] : [])
      ['map'](normalizeText)
      ['filter']((item) => STORY_ASSET_KINDS['includes'](item)),
  );
}
export function getStoryAssetPaidRerunBlockedLanes(options2 = {}) {
  const key =
      options2?.['kindStates'] && typeof options2['kindStates'] === 'object' ? options2['kindStates'] : {},
    map = getStoryAssetQualityPaidRerunKinds(options2);
  return STORY_ASSET_KINDS['flatMap']((kind) => {
    const status =
      normalizeStoryAssetPaidRerunBlockStatus(key[kind]) || (map['has'](kind) ? 'blocked-quality-rerun' : '');
    if (!status) return [];
    return [
      {
        kind: kind,
        label: STORY_ASSET_KIND_LABELS[kind],
        status: status,
        reason: STORY_ASSET_PAID_RERUN_BLOCK_REASONS[status],
      },
    ];
  });
}
export function getStoryAssetModelChangeRerunKinds(options3 = {}) {
  const index =
    options3?.['kindStates'] && typeof options3['kindStates'] === 'object' ? options3['kindStates'] : {};
  return STORY_ASSET_KINDS['filter']((result) => {
    const data = index[result] || {};
    return (
      normalizeStoryAssetPaidRerunBlockStatus(data) === 'blocked-paid-response' &&
      Math['max'](0, Math['trunc'](Number(data['repairCount']) || 0)) > 0
    );
  });
}
function normalizeStoryAssetPaidBatchBlockStatus(response2 = {}) {
  const text2 = normalizeText(response2?.['status']);
  if (['blocked-paid-response', 'blocked-incompatible', 'blocked-source-changed']['includes'](text2))
    return text2;
  if (['submitted', 'ambiguous', 'blocked-ambiguous', 'blocked-ambiguous-submission']['includes'](text2))
    return 'blocked-ambiguous-submission';
  if (text2 === 'response-received' && !normalizeText(response2?.['rawResponse']))
    return 'blocked-paid-response';
  return '';
}
function getStoryAssetBatchStageLabel(target = '') {
  if (target === 'inventory') return '清单批次';
  if (target === 'detail') return '提示词批次';
  if (target === 'repair') return '归并批次';
  return '素材批次';
}
export function getStoryAssetPaidRerunBlockedBatches(options4 = {}) {
  const source =
    options4?.['batchSubmissionRecords'] &&
    typeof options4['batchSubmissionRecords'] === 'object' &&
    !Array['isArray'](options4['batchSubmissionRecords'])
      ? options4['batchSubmissionRecords']
      : {};
  return Object['entries'](source)
    ['sort'](([next], [current]) => next['localeCompare'](current))
    ['flatMap'](([entry, response3]) => {
      const batchKey = normalizeText(entry) || normalizeText(response3?.['batchKey']),
        status2 = normalizeStoryAssetPaidBatchBlockStatus(response3);
      if (!batchKey || !status2) return [];
      const stage = normalizeText(response3?.['stage']),
        batchId = normalizeText(response3?.['batchId']) || batchKey;
      return [
        {
          batchKey: batchKey,
          batchId: batchId,
          stage: stage,
          kinds: Array['isArray'](response3?.['kinds'])
            ? [...new Set(response3['kinds']['map'](normalizeText)['filter'](Boolean))]
            : [],
          status: status2,
          label: getStoryAssetBatchStageLabel(stage) + ' ' + batchId,
          reason:
            normalizeText(response3?.['status']) === 'response-received'
              ? STORY_ASSET_EMPTY_PAID_RESPONSE_REASON
              : STORY_ASSET_PAID_RERUN_BLOCK_REASONS[status2],
        },
      ];
    });
}
function canLocallyRevalidateStoryAssetLane(record, response4) {
  return Boolean(
    response4?.['status'] === 'blocked-paid-response' &&
    normalizeText(record?.['rawResponsesByKind']?.[response4['kind']]),
  );
}
function canLocallyRevalidateStoryAssetBatch(payload, response5) {
  const handle = payload?.['batchSubmissionRecords']?.[response5?.['batchKey']];
  return Boolean(response5?.['status'] === 'blocked-paid-response' && normalizeText(handle?.['rawResponse']));
}
function canLocallyRevalidateEveryStoryAssetBlocker(state, list, list2) {
  const config = list['length'] + list2['length'];
  return Boolean(
    config &&
    list['every']((scope) => canLocallyRevalidateStoryAssetLane(state, scope)) &&
    list2['every']((input) => canLocallyRevalidateStoryAssetBatch(state, input)),
  );
}
export function createStoryAssetPaidRerunChoiceDescriptor(
  list3 = [],
  output = [],
  { allowLocalRevalidate: allowLocalRevalidate = ![] } = {},
) {
  const list4 = Array['isArray'](list3) ? list3 : [],
    title = Array['isArray'](output) ? output : [],
    value2 = list4['map'](
      (value3) => normalizeText(value3?.['label']) + '：' + normalizeText(value3?.['reason']),
    )
      ['filter']((value4) => value4 !== '：')
      ['join']('；'),
    value5 = title['map'](
      (value6) => normalizeText(value6?.['label']) + '：' + normalizeText(value6?.['reason']),
    )
      ['filter']((value7) => value7 !== '：')
      ['join']('；'),
    value8 = list4['length'] + title['length'],
    value9 = title['length'] ? value8 + ' 项' : list4['length'] + ' 路';
  return {
    title: title['length'] ? '处理已阻断的素材批次' : '处理已阻断的素材线路',
    message: [
      value2,
      value5,
      allowLocalRevalidate ? '免费本地重校验不会调用 API' : '以上阻断项没有可安全复验的完整本地结果',
      '确认重跑将仅重新调用以上 ' +
        value9 +
        ' API，可能再次计费；' +
        (title['length'] ? '成功线路和批次' : '成功线路') +
        '会直接复用，原始结果会保留',
    ]
      ['filter'](Boolean)
      ['join']('。'),
    choices: [
      { label: '取消', value: null, autofocus: !![] },
      ...(allowLocalRevalidate ? [{ label: '免费本地重校验', value: 'local-revalidate' }] : []),
      { label: '确认仅重跑 ' + value9, value: 'paid-rerun', primary: !![] },
    ],
  };
}
export function createStoryAssetPaidRerunChoiceGate() {
  let value10 = ![];
  return async function run({
    draft: draft = {},
    requestChoice: requestChoice,
    isCurrent: isCurrent = () => !![],
  } = {}) {
    const blockedLanes = getStoryAssetPaidRerunBlockedLanes(draft),
      blockedBatches = getStoryAssetPaidRerunBlockedBatches(draft);
    if (!blockedLanes['length'] && !blockedBatches['length'])
      return {
        action: 'not-blocked',
        blockedLanes: blockedLanes,
        blockedBatches: blockedBatches,
        paidRerunAuthorization: null,
      };
    if (value10)
      return {
        action: 'busy',
        blockedLanes: blockedLanes,
        blockedBatches: blockedBatches,
        paidRerunAuthorization: null,
      };
    value10 = !![];
    try {
      const allowLocalRevalidate2 = canLocallyRevalidateEveryStoryAssetBlocker(
          draft,
          blockedLanes,
          blockedBatches,
        ),
        action =
          typeof requestChoice === 'function'
            ? await requestChoice(
                createStoryAssetPaidRerunChoiceDescriptor(blockedLanes, blockedBatches, {
                  allowLocalRevalidate: allowLocalRevalidate2,
                }),
              )
            : null;
      if (typeof isCurrent === 'function' && !isCurrent())
        return {
          action: 'stale',
          blockedLanes: blockedLanes,
          blockedBatches: blockedBatches,
          paidRerunAuthorization: null,
        };
      if (action === 'local-revalidate' && allowLocalRevalidate2)
        return {
          action: action,
          blockedLanes: blockedLanes,
          blockedBatches: blockedBatches,
          paidRerunAuthorization: null,
        };
      if (action === 'paid-rerun')
        return {
          action: action,
          blockedLanes: blockedLanes,
          blockedBatches: blockedBatches,
          paidRerunAuthorization: {
            confirmed: !![],
            ...(blockedLanes['length']
              ? { authorizedKinds: blockedLanes['map']((value11) => value11['kind']) }
              : {}),
            ...(blockedBatches['length']
              ? { authorizedBatchIds: blockedBatches['map']((value12) => value12['batchKey']) }
              : {}),
          },
        };
      return {
        action: 'cancelled',
        blockedLanes: blockedLanes,
        blockedBatches: blockedBatches,
        paidRerunAuthorization: null,
      };
    } finally {
      value10 = ![];
    }
  };
}
function getStoryAssetEvidenceProgress(options5 = {}) {
  const text3 = normalizeText(options5?.['progress']?.['stage'] || options5?.['phase']),
    value13 = Math['max'](0, Math['trunc'](Number(options5?.['progress']?.['current']) || 0)),
    value14 = Math['max'](0, Math['trunc'](Number(options5?.['progress']?.['total']) || 0)),
    list5 = Array['isArray'](options5?.['inventory']?.['assets']) ? options5['inventory']['assets'] : [],
    list6 = Array['isArray'](options5?.['completedAssets']) ? options5['completedAssets'] : [],
    stage2 = ['inventory', 'repair']['includes'](text3),
    total = stage2 && value14 ? value14 : list5['length'] || value14,
    completed = Math['min'](total, stage2 ? value13 : Math['max'](list6['length'], value13));
  return {
    stage: stage2 ? 'inventory' : 'detail',
    completed: completed,
    total: total,
    remaining: Math['max'](0, total - completed),
  };
}
export function isStoryAssetPlannedContinuationDraft(response6 = {}) {
  if (!/^evidence-batched-api-v\d+$/u['test'](normalizeText(response6?.['strategy']))) return ![];
  if (normalizeText(response6?.['status']) !== 'partial') return ![];
  if (Array['isArray'](response6?.['failures']) && response6['failures']['length']) return ![];
  if (
    getStoryAssetPaidRerunBlockedLanes(response6)['length'] ||
    getStoryAssetPaidRerunBlockedBatches(response6)['length']
  )
    return ![];
  return getStoryAssetEvidenceProgress(response6)['remaining'] > 0;
}
function getStoryAssetExtractionErrorLabel(value15 = '') {
  if (value15 === 'auth') return '认证失败';
  if (value15 === 'timeout') return '超时';
  if (value15 === 'rate-limit') return '限流';
  if (value15 === 'length') return '输出截断';
  if (value15 === 'call-limit') return '达到调用上限';
  if (value15 === 'validation') return '结果校验失败';
  if (value15 === 'invalid-json') return '格式错误';
  if (value15 === 'local-model') return '本地模型不可用';
  return '请求失败';
}
export function getStoryAssetExperimentalDraftDisplay(response7 = {}) {
  if (response7?.['strategy'] === 'local-pp-uie-v1') {
    const failureCount = Array['isArray'](response7?.['failures']) ? response7['failures'] : [],
      text4 = normalizeText(response7?.['progress']?.['message']),
      value16 = failureCount['slice'](0, 3)
        ['map']((value17) => {
          const text5 = normalizeText(value17?.['batchId']);
          return (
            '本地扫描' +
            (text5 ? ' ' + text5 : '') +
            '：' +
            getStoryAssetExtractionErrorLabel(normalizeText(value17?.['errorType']))
          );
        })
        ['join'](' · '),
      retryCount = normalizeText(response7?.['status']),
      hasProgress = Boolean(text4 || value16 || ['in-progress', 'failed']['includes'](retryCount));
    return {
      hasProgress: hasProgress,
      failureCount: failureCount['length'],
      retryCount: retryCount === 'completed' ? 0 : 1,
      summary: [text4, value16]['filter'](Boolean)['join'](' · '),
      actionLabel: retryCount === 'completed' ? '开发测试' : '继续开发测试',
    };
  }
  if (response7?.['strategy'] === 'inventory-only-v4') {
    const list7 = Array['isArray'](response7?.['failures']) ? response7['failures'] : [],
      value18 = new Set(
        list7['map'](
          (value19) => normalizeText(value19?.['batchId']) || JSON['stringify'](value19?.['assetRefs'] || []),
        ),
      ),
      text6 = normalizeText(response7?.['progress']?.['message']),
      summary = list7['slice'](0, 3)
        ['map']((value20) => {
          const value21 = value20?.['stage'] === 'repair' ? '归并校验' : '清单',
            text7 = normalizeText(value20?.['batchLabel'] || value20?.['batchId']);
          return (
            '' +
            value21 +
            (text7 ? ' ' + text7 : '') +
            '：' +
            getStoryAssetExtractionErrorLabel(normalizeText(value20?.['errorType']))
          );
        })
        ['join'](' · '),
      failureCount2 = value18['size'],
      text8 = normalizeText(response7?.['status']),
      hasProgress2 = Boolean(text6 || summary || ['in-progress', 'partial', 'failed']['includes'](text8));
    return {
      hasProgress: hasProgress2,
      failureCount: failureCount2,
      retryCount: failureCount2 || (text8 === 'completed' ? 0 : 1),
      summary: summary || text6,
      actionLabel: failureCount2
        ? '重试未完成窗口（' + failureCount2 + '）'
        : text8 === 'completed'
          ? '提取角色、场景与道具'
          : '继续素材提取',
    };
  }
  if (/^evidence-batched-api-v\d+$/u['test'](normalizeText(response7?.['strategy']))) {
    const {
        stage: stage3,
        completed: completed2,
        total: total2,
        remaining: remaining,
      } = getStoryAssetEvidenceProgress(response7),
      failureCount3 = Array['isArray'](response7?.['failures']) ? response7['failures'] : [],
      retryCount2 =
        getStoryAssetPaidRerunBlockedLanes(response7)['length'] +
        getStoryAssetPaidRerunBlockedBatches(response7)['length'],
      value22 = failureCount3[0],
      text9 =
        normalizeText(value22?.['errorType']) === 'incomplete-output' ||
        /资产细化结果必须与当前批次资产数量完全一致|缺少\s*\d+\s*个资产结果/u['test'](
          normalizeText(value22?.['errorMessage']),
        ),
      value23 = /角色 role 只能是主角、配角、反派或路人/u['test'](normalizeText(value22?.['errorMessage'])),
      text10 = normalizeText(response7?.['progress']?.['message']),
      summary2 = total2
        ? (stage3 === 'inventory' ? '清单：已覆盖' : '素材：已完成') +
          ' ' +
          completed2 +
          '/' +
          total2 +
          ' ' +
          (stage3 === 'inventory' ? '场' : '个') +
          (remaining
            ? ' · 剩余 ' + remaining + ' ' + (stage3 === 'inventory' ? '场' : '个') + '待继续'
            : '') +
          (text9
            ? ' · 上批输出不完整，未自动重试'
            : value23
              ? ' · 上批被旧角色分类规则拦截，现已修复'
              : normalizeText(value22?.['errorType']) === 'validation'
                ? ' · 上批结果校验未通过，未自动重试'
                : '')
        : text10;
    return {
      hasProgress: Boolean(retryCount2 || summary2 || text10),
      failureCount: failureCount3['length'],
      retryCount: retryCount2 || remaining,
      summary: summary2 || text10,
      actionLabel: retryCount2
        ? '处理已阻断（' + retryCount2 + '）'
        : remaining
          ? '继续剩余 ' + remaining + ' ' + (stage3 === 'inventory' ? '场' : '个')
          : normalizeText(response7?.['status']) === 'completed'
            ? '提取角色、场景与道具'
            : '继续素材提取',
    };
  }
  const value24 =
      response7?.['kindStates'] && typeof response7['kindStates'] === 'object' ? response7['kindStates'] : {},
    list8 = getStoryAssetPaidRerunBlockedLanes(response7),
    map2 = new Map(list8['map']((value25) => [value25['kind'], value25])),
    list9 = STORY_ASSET_KIND_DISPLAY['map'](({ kind: kind2, label: label }) => {
      const response8 = value24[kind2] || {},
        status3 = normalizeText(response8['status']),
        status4 = map2['get'](kind2);
      if (status4) return { kind: kind2, status: status4['status'], text: label + '：' + status4['reason'] };
      if (status3 === 'succeeded')
        return {
          kind: kind2,
          status: status3,
          text: label + '：成功 ' + Math['max'](0, Number(response8['assetCount']) || 0) + ' 个',
        };
      if (status3 === 'failed')
        return {
          kind: kind2,
          status: status3,
          text: label + '：' + getStoryAssetExtractionErrorLabel(normalizeText(response8['errorType'])),
        };
      if (status3 === 'running') return { kind: kind2, status: status3, text: label + '：处理中' };
      if (status3 === 'pending') return { kind: kind2, status: status3, text: label + '：待处理' };
      return { kind: kind2, status: '', text: '' };
    }),
    list10 = list9['filter']((response9) => response9['text']),
    failureCount4 = list9['filter']((response10) => response10['status'] === 'failed')['length'],
    retryCount3 = list9['filter'](
      (response11) => response11['status'] && response11['status'] !== 'succeeded',
    )['length'],
    value26 = list8['length'],
    modelChangeKinds = getStoryAssetModelChangeRerunKinds(response7),
    actionLabel = modelChangeKinds['length'] > 0,
    value27 = STORY_ASSET_KIND_DISPLAY['filter'](({ kind: kind3 }) => modelChangeKinds['includes'](kind3))
      ['map'](({ label: label2 }) => label2)
      ['join']('、'),
    value28 = STORY_ASSET_KIND_DISPLAY['filter'](
      ({ kind: kind4 }) => normalizeText(value24[kind4]?.['status']) === 'succeeded',
    )
      ['map'](({ label: label3 }) => label3)
      ['join']('、'),
    value29 = actionLabel
      ? value27 +
        '自动纠错后仍未返回合格结果；建议切换文本模型后仅重试' +
        value27 +
        (value28 ? '，' + value28 + '结果已保留' : '')
      : '',
    isStoryAssetLocalQualityRevalidationDraft2 = isStoryAssetLocalQualityRevalidationDraft(response7),
    value30 = isStoryAssetLocalQualityRevalidationDraft2 ? '付费提取结果已保留，待按最新规则本地复验' : '';
  return {
    hasProgress: Boolean(value30 || list10['length']),
    failureCount: failureCount4,
    retryCount: retryCount3,
    summary: [value30, ...list10['map']((response12) => response12['text']), value29]
      ['filter'](Boolean)
      ['join'](' · '),
    actionLabel:
      actionLabel && value26 === modelChangeKinds['length']
        ? '换模型后仅重试' + value27
        : value26
          ? '处理已阻断（' + value26 + '）'
          : isStoryAssetLocalQualityRevalidationDraft2
            ? '重新校验（不调用 API）'
            : failureCount4
              ? '重试失败项（' + failureCount4 + '）'
              : retryCount3
                ? '继续提取（' + retryCount3 + '）'
                : '提取角色、场景与道具',
    ...(actionLabel ? { needsModelChange: !![], modelChangeKinds: modelChangeKinds } : {}),
  };
}
export function isStoryAssetLocalQualityRevalidationDraft(enabled2 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return ![];
  if (enabled2['qualityReview'] && typeof enabled2['qualityReview'] === 'object')
    return normalizeText(enabled2['qualityReview']['recoveryMode']) !== 'paid-rerun-required';
  const value31 =
      enabled2['kindStates'] && typeof enabled2['kindStates'] === 'object' ? enabled2['kindStates'] : {},
    value32 =
      enabled2['assetsByKind'] && typeof enabled2['assetsByKind'] === 'object'
        ? enabled2['assetsByKind']
        : {};
  let value33 = ![];
  const value34 = STORY_ASSET_KINDS['every']((value35) => {
    const response13 = value31[value35] || {};
    if (normalizeText(response13['status']) === 'succeeded') return !![];
    const text11 =
      normalizeText(response13['status']) === 'failed' &&
      normalizeText(response13['errorType']) === 'validation' &&
      Array['isArray'](value32[value35]);
    if (text11) value33 = !![];
    return text11;
  });
  return value33 && value34;
}
