import { withReplicationRequestPolicy } from './storyRequestPolicy.js';
import { STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS } from './storyAssetHybridBudget.js';
import {
  STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION,
  createStoryAssetPromptContracts,
} from './storyAssetExtractionRequest.js';
const STORY_ASSET_DETAILED_DRAFT_STRATEGY = 'kind-detailed-parallel-v1';
function cloneStoryAssetDetailedExtractionValue(enabled) {
  if (!enabled || typeof enabled !== 'object') return null;
  try {
    return JSON.parse(JSON.stringify(enabled));
  } catch {
    return null;
  }
}
function classifyStoryAssetDetailedExtractionError(error, handler) {
  const value = handler(error?.message || error),
    list = handler(error?.type || error?.code).toUpperCase();
  if (list.includes('TIMEOUT') || /超时|timeout/iu.test(value)) return 'timeout';
  if (
    list.includes('DNS') ||
    list.includes('ENOTFOUND') ||
    list.includes('EAI_AGAIN') ||
    /dns|name\s+resolution|getaddrinfo|域名解析/iu.test(value)
  )
    return 'dns-error';
  if (
    list.includes('NETWORK') ||
    /fetch\s+failed|failed\s+to\s+fetch|network\s+(?:error|failure)|网络(?:错误|异常|失败)/iu.test(value)
  )
    return 'network-error';
  if (
    list.includes('ECONNRESET') ||
    list.includes('ECONNABORTED') ||
    list.includes('UND_ERR_SOCKET') ||
    /connection\s*(?:reset|closed|aborted)|socket\s*hang\s*up|连接(?:被)?重置|连接中断/iu.test(value)
  )
    return 'connection-reset';
  if (list.includes('RATE') || /限流|rate.?limit|429/iu.test(value)) return 'rate-limit';
  if (/too\s+many\s+states|schema\s+(?:constraint|complexity)|constraint[^.]*schema/iu.test(value))
    return 'schema-complexity';
  if (list.includes('LENGTH') || /截断|token|length/iu.test(value)) return 'length';
  if (list.includes('JSON') || /JSON|返回格式|没有可用/u.test(value)) return 'invalid-json';
  return 'request-error';
}
function isStoryAssetConfirmedUnchargedRejection(response) {
  const item = Number(response?.status ?? response?.statusCode);
  return [400, 401, 403, 404, 409, 422, 429].includes(item);
}
function isStoryAssetPaidRerunAuthorized(enabled2, key) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  const list2 = Array.isArray(enabled2.authorizedKinds) ? enabled2.authorizedKinds : [];
  return enabled2.confirmed === true && list2.includes(key);
}
function archiveStoryAssetPaidLane(responseMode2, index, reason) {
  const result =
    responseMode2.paidResponseHistoryByKind &&
    typeof responseMode2.paidResponseHistoryByKind === 'object'
      ? responseMode2.paidResponseHistoryByKind
      : {};
  responseMode2.paidResponseHistoryByKind = result;
  const list3 = Array.isArray(result[index]) ? result[index] : [];
  (list3.push({
    archivedAt: Date.now(),
    reason: reason,
    rawResponse: Object.hasOwn(responseMode2.rawResponsesByKind || {}, index)
      ? responseMode2.rawResponsesByKind[index]
      : '',
    responseMode: responseMode2.rawResponseModesByKind?.[index] || '',
    contractSnapshot: cloneStoryAssetDetailedExtractionValue(
      responseMode2.rawResponseContractSnapshotsByKind?.[index],
    ),
    decisions: cloneStoryAssetDetailedExtractionValue(responseMode2.decisionsByKind?.[index]),
    assets: cloneStoryAssetDetailedExtractionValue(responseMode2.assetsByKind?.[index]) || [],
    submissionState: cloneStoryAssetDetailedExtractionValue(responseMode2.submissionStatesByKind?.[index]),
    kindState: cloneStoryAssetDetailedExtractionValue(responseMode2.kindStates?.[index]),
  }),
    (result[index] = list3));
}
function clearStoryAssetPaidLane(data, options, target) {
  (archiveStoryAssetPaidLane(data, options, target),
    (data.assetsByKind[options] = []),
    delete data.rawResponsesByKind[options],
    delete data.rawResponseModesByKind[options],
    delete data.rawResponseContractSnapshotsByKind[options],
    delete data.paidResponseReceivedByKind[options],
    delete data.decisionsByKind[options],
    delete data.submissionStatesByKind[options]);
}
function makeUniqueStoryAssetExtractionRef(source, next, map, handler2) {
  const current = handler2(source, next);
  if (!map.has(current)) return (map.add(current), current);
  let entry = 2,
    record = next + '-' + entry;
  while (map.has(record)) {
    ((entry += 1), (record = next + '-' + entry));
  }
  return (map.add(record), record);
}
export function createParallelStoryAssetExtractor({
  schemaVersion: schemaVersion,
  assetKinds: assetKinds,
  generateText: generateText,
  normalizeText: normalizeText,
  getResultText: getResultText,
  normalizeStoryProjectInput: normalizeStoryProjectInput,
  normalizeAssetReference: normalizeAssetReference,
  parseStoryAssetExtractionResult: parseStoryAssetExtractionResult,
  parseStoryAssetCompactExtractionResult: parseStoryAssetCompactExtractionResult,
  extractStoryAssets: extractStoryAssets,
} = {}) {
  function run(payload) {
    const list4 = JSON.stringify(payload);
    let handle = 0x811c9dc5;
    for (let state = 0; state < list4.length; state += 1) {
      ((handle ^= list4.charCodeAt(state)), (handle = Math.imul(handle, 0x1000193)));
    }
    return (
      schemaVersion + '-' + (handle >>> 0).toString(16).padStart(8, '0') + '-' + list4.length
    );
  }
  function run2({
    project: project = {},
    aspectRatio: aspectRatio = '',
    visualStyle: visualStyle = '',
    requiredAssetNamesByKind: requiredAssetNamesByKind = null,
    compactOutput: compactOutput = false,
    compactOutputByKind: compactOutputByKind = null,
  } = {}) {
    const title = normalizeStoryProjectInput(project);
    return run({
      title: title.title,
      chapters: title.chapters,
      aspectRatio: normalizeText(aspectRatio) || title.aspectRatio,
      visualStyle: normalizeText(visualStyle) || title.visualStyle,
      extractionStrategy: STORY_ASSET_DETAILED_DRAFT_STRATEGY,
      extractionKinds: assetKinds,
      compactOutputByKind:
        compactOutputByKind && typeof compactOutputByKind === 'object'
          ? compactOutputByKind
          : Object.fromEntries(assetKinds.map((config) => [config, Boolean(compactOutput)])),
      ...(requiredAssetNamesByKind ? { requiredAssetNamesByKind: requiredAssetNamesByKind } : {}),
    });
  }
  function run3(
    kind,
    {
      requiredAssetNamesByKind: requiredAssetNamesByKind = null,
      requiredAssetsByKind: requiredAssetsByKind = null,
      candidateAssetsByKind: candidateAssetsByKind = null,
      responseMode: responseMode = 'verbose',
    } = {},
  ) {
    const requiredNames = (list5 = []) =>
      (Array.isArray(list5) ? list5 : []).map((error2) => ({
        name: normalizeText(error2 && typeof error2 === 'object' ? error2.name : error2),
        sourceSceneRefs: Array.isArray(error2?.sourceSceneRefs)
          ? error2.sourceSceneRefs.map(normalizeText).filter(Boolean)
          : [],
        sourceChapterIds: Array.isArray(error2?.sourceChapterIds)
          ? error2.sourceChapterIds.map(normalizeText).filter(Boolean)
          : [],
        role: normalizeText(error2?.role),
        fixedTraits: normalizeText(error2?.fixedTraits),
      }));
    return run({
      kind: kind,
      responseMode: responseMode,
      ...(responseMode === 'compact'
        ? { responseSchemaVersion: STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION }
        : {}),
      requiredNames: requiredNames(requiredAssetNamesByKind?.[kind]),
      requiredContracts: requiredNames(requiredAssetsByKind?.[kind]),
      candidateContracts: requiredNames(candidateAssetsByKind?.[kind]),
    });
  }
  function run4(
    kind2,
    {
      requiredAssetNamesByKind: requiredAssetNamesByKind = null,
      requiredAssetsByKind: requiredAssetsByKind = null,
      candidateAssetsByKind: candidateAssetsByKind = null,
      responseMode: responseMode = 'verbose',
    } = {},
  ) {
    const storyAssetPromptContracts = createStoryAssetPromptContracts(
      [kind2],
      requiredAssetNamesByKind,
      candidateAssetsByKind,
      requiredAssetsByKind,
      { includeClientKeys: responseMode === 'compact' },
    ).payload;
    return {
      kind: kind2,
      responseMode: responseMode,
      responseSchemaVersion: responseMode === 'compact' ? STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION : 1,
      requiredAssets:
        cloneStoryAssetDetailedExtractionValue(storyAssetPromptContracts.requiredAssets || []) || [],
      candidateAssets:
        cloneStoryAssetDetailedExtractionValue(storyAssetPromptContracts.candidateAssets || []) || [],
    };
  }
  function run5(scope) {
    const input = getResultText(scope);
    if (typeof input === 'string') return input.trim();
    try {
      return JSON.stringify(input);
    } catch {
      return '';
    }
  }
  return async function run6({
    project: project = {},
    model: model = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    aspectRatio: aspectRatio = '',
    visualStyle: visualStyle = '',
    requiredAssetNamesByKind: requiredAssetNamesByKind = null,
    requiredAssetsByKind: requiredAssetsByKind = null,
    candidateAssetsByKind: candidateAssetsByKind = null,
    resumeRequiredAssetNamesByKindAliases: resumeRequiredAssetNamesByKindAliases = [],
    resumeSourceAliases: resumeSourceAliases = [],
    resumeSourceFingerprintAliases: resumeSourceFingerprintAliases = [],
    allowSavedPaidResultContractRevalidation: allowSavedPaidResultContractRevalidation = false,
    allowOversizedPrompt: allowOversizedPrompt = true,
    automaticRecovery: automaticRecovery = false,
    structuredOutputFallback: structuredOutputFallback = 'prompt',
    compactOutput: compactOutput = false,
    compactOutputByKind: compactOutputByKind = null,
    maxOutputTokens: maxOutputTokens = STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
    request: request = generateText,
    onProgress: onProgress = null,
    onCheckpoint: onCheckpoint = null,
    resumeDraft: resumeDraft = null,
    paidRerunAuthorization: paidRerunAuthorization = null,
  } = {}) {
    request = withReplicationRequestPolicy(request, project);
    const total = [...assetKinds],
      output = { character: '角色', scene: '场景', prop: '道具' },
      responseMode3 = Object.fromEntries(
        total.map((value2) => [
          value2,
          compactOutputByKind && typeof compactOutputByKind === 'object'
            ? compactOutputByKind[value2] === 'compact'
            : Boolean(compactOutput),
        ]),
      ),
      contractFingerprintsByKind = Object.fromEntries(
        total.map((value3) => [
          value3,
          run3(value3, {
            requiredAssetNamesByKind: requiredAssetNamesByKind,
            requiredAssetsByKind: requiredAssetsByKind,
            candidateAssetsByKind: candidateAssetsByKind,
            responseMode: responseMode3[value3] ? 'compact' : 'verbose',
          }),
        ]),
      ),
      contractSnapshotByKind = Object.fromEntries(
        total.map((value4) => [
          value4,
          run4(value4, {
            requiredAssetNamesByKind: requiredAssetNamesByKind,
            requiredAssetsByKind: requiredAssetsByKind,
            candidateAssetsByKind: candidateAssetsByKind,
            responseMode: responseMode3[value4] ? 'compact' : 'verbose',
          }),
        ]),
      ),
      value5 = normalizeStoryProjectInput(project),
      chapterIds = value5.chapters.map((value6) => value6.id),
      sourceFingerprint = run2({
        project: project,
        aspectRatio: aspectRatio,
        visualStyle: visualStyle,
        requiredAssetNamesByKind: requiredAssetNamesByKind,
        compactOutput: compactOutput,
        compactOutputByKind: responseMode3,
      }),
      map2 = new Set([
        sourceFingerprint,
        ...(Array.isArray(resumeRequiredAssetNamesByKindAliases)
          ? resumeRequiredAssetNamesByKindAliases.map((requiredAssetNamesByKind2) =>
              run2({
                project: project,
                aspectRatio: aspectRatio,
                visualStyle: visualStyle,
                requiredAssetNamesByKind: requiredAssetNamesByKind2,
                compactOutput: compactOutput,
                compactOutputByKind: responseMode3,
              }),
            )
          : []),
        ...(Array.isArray(resumeSourceAliases)
          ? resumeSourceAliases.map((project2) =>
              run2({
                project: project2?.project || project,
                aspectRatio: aspectRatio,
                visualStyle: visualStyle,
                requiredAssetNamesByKind: project2?.requiredAssetNamesByKind ?? requiredAssetNamesByKind,
                compactOutput: compactOutput,
                compactOutputByKind: responseMode3,
              }),
            )
          : []),
        ...(Array.isArray(resumeSourceFingerprintAliases)
          ? resumeSourceFingerprintAliases.map(normalizeText).filter(Boolean)
          : []),
      ]),
      cloneStoryAssetDetailedExtractionValue2 = cloneStoryAssetDetailedExtractionValue(resumeDraft),
      value7 = cloneStoryAssetDetailedExtractionValue2?.strategy === STORY_ASSET_DETAILED_DRAFT_STRATEGY,
      enabled3 = cloneStoryAssetDetailedExtractionValue2?.schemaVersion === schemaVersion,
      enabled4 = map2.has(normalizeText(cloneStoryAssetDetailedExtractionValue2?.sourceFingerprint)),
      enabled5 = value7 && enabled3 && enabled4,
      value8 = Boolean(
        value7 &&
        total.some(
          (value9) =>
            cloneStoryAssetDetailedExtractionValue2?.paidResponseReceivedByKind?.[value9] ||
            Object.hasOwn(cloneStoryAssetDetailedExtractionValue2?.rawResponsesByKind || {}, value9) ||
            Math.max(
              0,
              Math.trunc(
                Number(cloneStoryAssetDetailedExtractionValue2?.kindStates?.[value9]?.requestCount) ||
                  0,
              ),
            ) > 0 ||
            [
              'submitted',
              'ambiguous',
              'response-received',
              'blocked-paid-response',
              'blocked-ambiguous-submission',
              'blocked-incompatible',
              'validated',
            ].includes(
              normalizeText(
                cloneStoryAssetDetailedExtractionValue2?.submissionStatesByKind?.[value9]?.status,
              ),
            ) ||
            (Array.isArray(cloneStoryAssetDetailedExtractionValue2?.assetsByKind?.[value9]) &&
              cloneStoryAssetDetailedExtractionValue2.assetsByKind[value9].length > 0),
        ),
      ),
      value10 = Boolean(!enabled5 && value8),
      errorMessage = Boolean(value10 && (!enabled3 || !enabled4)),
      kindStates = Object.fromEntries(
        total.map((kind3) => [
          kind3,
          {
            kind: kind3,
            status: 'pending',
            attempt: 0,
            requestCount: 0,
            repairCount: 0,
            assetCount: 0,
            errorType: '',
            errorMessage: '',
            startedAt: 0,
            finishedAt: 0,
          },
        ]),
      );
    let current2 =
      enabled5 || value10
        ? cloneStoryAssetDetailedExtractionValue2
        : {
            strategy: STORY_ASSET_DETAILED_DRAFT_STRATEGY,
            schemaVersion: schemaVersion,
            sourceFingerprint: sourceFingerprint,
            status: 'pending',
            assetsByKind: Object.fromEntries(total.map((value11) => [value11, []])),
            rawResponsesByKind: {},
            rawResponseModesByKind: {},
            rawResponseContractSnapshotsByKind: {},
            paidResponseReceivedByKind: {},
            paidResponseHistoryByKind: {},
            submissionStatesByKind: {},
            decisionsByKind: {},
            contractFingerprintsByKind: contractFingerprintsByKind,
            contractSnapshotByKind: contractSnapshotByKind,
            kindStates: kindStates,
            completedKinds: [],
            completedAssets: [],
            failures: [],
            totalRequestCount: 0,
          };
    current2.strategy = STORY_ASSET_DETAILED_DRAFT_STRATEGY;
    !errorMessage &&
      ((current2.schemaVersion = schemaVersion), (current2.sourceFingerprint = sourceFingerprint));
    ((current2.assetsByKind =
      current2.assetsByKind && typeof current2.assetsByKind === 'object'
        ? current2.assetsByKind
        : {}),
      (current2.rawResponsesByKind =
        current2.rawResponsesByKind && typeof current2.rawResponsesByKind === 'object'
          ? current2.rawResponsesByKind
          : {}),
      (current2.rawResponseModesByKind =
        current2.rawResponseModesByKind && typeof current2.rawResponseModesByKind === 'object'
          ? current2.rawResponseModesByKind
          : {}),
      (current2.rawResponseContractSnapshotsByKind =
        current2.rawResponseContractSnapshotsByKind &&
        typeof current2.rawResponseContractSnapshotsByKind === 'object'
          ? current2.rawResponseContractSnapshotsByKind
          : {}),
      (current2.paidResponseReceivedByKind =
        current2.paidResponseReceivedByKind && typeof current2.paidResponseReceivedByKind === 'object'
          ? current2.paidResponseReceivedByKind
          : {}),
      (current2.paidResponseHistoryByKind =
        current2.paidResponseHistoryByKind && typeof current2.paidResponseHistoryByKind === 'object'
          ? current2.paidResponseHistoryByKind
          : {}),
      (current2.submissionStatesByKind =
        current2.submissionStatesByKind && typeof current2.submissionStatesByKind === 'object'
          ? current2.submissionStatesByKind
          : {}),
      (current2.decisionsByKind =
        current2.decisionsByKind && typeof current2.decisionsByKind === 'object'
          ? current2.decisionsByKind
          : {}));
    const args =
      current2.contractFingerprintsByKind && typeof current2.contractFingerprintsByKind === 'object'
        ? current2.contractFingerprintsByKind
        : {};
    ((current2.contractFingerprintsByKind = { ...args }),
      (current2.contractSnapshotByKind =
        current2.contractSnapshotByKind && typeof current2.contractSnapshotByKind === 'object'
          ? current2.contractSnapshotByKind
          : {}),
      (current2.requestedContractSnapshotByKind =
        cloneStoryAssetDetailedExtractionValue(contractSnapshotByKind)),
      (current2.responseMode =
        new Set(Object.values(responseMode3)).size === 1
          ? Object.values(responseMode3)[0]
            ? 'compact'
            : 'verbose'
          : 'mixed'),
      (current2.kindStates =
        current2.kindStates && typeof current2.kindStates === 'object' ? current2.kindStates : {}));
    for (const kind4 of total) {
      if (!Array.isArray(current2.assetsByKind[kind4])) current2.assetsByKind[kind4] = [];
      const response2 = current2.kindStates[kind4] || {},
        value12 = normalizeText(args[kind4]),
        value13 = Boolean((enabled5 || value10) && value12 && value12 !== contractFingerprintsByKind[kind4]),
        value14 = Boolean(
          (enabled5 || value10) &&
          Object.hasOwn(current2.rawResponsesByKind, kind4) &&
          normalizeText(current2.rawResponseModesByKind[kind4] || response2?.responseMode) ===
            'compact' &&
          !current2.rawResponseContractSnapshotsByKind[kind4],
        ),
        enabled6 = Boolean(
          current2.paidResponseReceivedByKind[kind4] ||
          Object.hasOwn(current2.rawResponsesByKind, kind4) ||
          [
            'submitted',
            'ambiguous',
            'response-received',
            'blocked-paid-response',
            'blocked-ambiguous-submission',
            'blocked-incompatible',
            'validated',
          ].includes(normalizeText(current2.submissionStatesByKind[kind4]?.status)) ||
          Math.max(0, Math.trunc(Number(response2?.requestCount) || 0)) > 0 ||
          current2.assetsByKind[kind4].length,
        ),
        isStoryAssetPaidRerunAuthorized2 = isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, kind4);
      let enabled7 = false;
      const enabled8 = Boolean(enabled6 && response2?.status === 'blocked-quality-rerun'),
        value15 = Boolean(
          enabled6 &&
          !enabled8 &&
          (errorMessage ||
            response2?.status === 'blocked-incompatible' ||
            (value13 && !allowSavedPaidResultContractRevalidation) ||
            value14),
        );
      if ((enabled5 || value10) && enabled8 && !isStoryAssetPaidRerunAuthorized2) {
        current2.kindStates[kind4] = {
          ...response2,
          kind: kind4,
          status: 'blocked-quality-rerun',
          errorType: 'quality-rerun-required',
          errorMessage: '已付费结果未通过当前视觉质量合同；需要用户明确授权后才能重新请求。',
          responseMode: responseMode3[kind4] ? 'compact' : 'verbose',
        };
        continue;
      }
      (enabled5 || value10) &&
        enabled8 &&
        isStoryAssetPaidRerunAuthorized2 &&
        (clearStoryAssetPaidLane(current2, kind4, 'authorized-quality-rerun'),
        (current2.kindStates[kind4] = {
          ...response2,
          status: 'pending',
          assetCount: 0,
          errorType: '',
          errorMessage: '',
          finishedAt: 0,
        }),
        (enabled7 = true));
      if ((enabled5 || value10) && value15 && !isStoryAssetPaidRerunAuthorized2) {
        current2.kindStates[kind4] = {
          ...response2,
          kind: kind4,
          status: 'blocked-incompatible',
          errorType: 'contract-incompatible',
          errorMessage: errorMessage
            ? '已付费结果的剧本来源或草稿版本与当前请求不兼容，需要用户明确授权后才能重新请求。'
            : value13
              ? '已付费结果的资产合同版本与当前合同不兼容，需要用户明确授权后才能重新请求。'
              : '已付费紧凑结果缺少其原始合同快照，无法安全绑定，需要用户明确授权后才能重新请求。',
          responseMode: responseMode3[kind4] ? 'compact' : 'verbose',
        };
        continue;
      }
      (enabled5 || value10) &&
        (value15 ||
          (!enabled6 && errorMessage) ||
          (value13 && !allowSavedPaidResultContractRevalidation) ||
          value14) &&
        (isStoryAssetPaidRerunAuthorized2 || !enabled6) &&
        (enabled6
          ? clearStoryAssetPaidLane(
              current2,
              kind4,
              errorMessage
                ? 'authorized-source-or-schema-change-rerun'
                : value13
                  ? 'authorized-contract-upgrade-rerun'
                  : 'authorized-missing-contract-snapshot-rerun',
            )
          : ((current2.assetsByKind[kind4] = []),
            delete current2.rawResponsesByKind[kind4],
            delete current2.rawResponseModesByKind[kind4],
            delete current2.rawResponseContractSnapshotsByKind[kind4],
            delete current2.paidResponseReceivedByKind[kind4],
            delete current2.decisionsByKind[kind4],
            delete current2.submissionStatesByKind[kind4]),
        (current2.kindStates[kind4] = {
          ...response2,
          status: 'pending',
          assetCount: 0,
          errorType: '',
          errorMessage: '',
          finishedAt: 0,
        }),
        (enabled7 = true));
      const value16 = normalizeText(current2.submissionStatesByKind[kind4]?.status),
        value17 = normalizeText(response2?.errorType),
        value18 =
          !enabled7 &&
          Boolean(
            value16 === 'submitted' ||
            value16 === 'ambiguous' ||
            response2?.status === 'blocked-ambiguous-submission' ||
            (!current2.rawResponsesByKind[kind4] &&
              Math.max(0, Math.trunc(Number(response2?.requestCount) || 0)) > 0 &&
              (response2?.status === 'running' ||
                (response2?.status === 'failed' &&
                  ['timeout', 'connection-reset'].includes(value17)))),
          );
      if ((enabled5 || value10) && value18 && !isStoryAssetPaidRerunAuthorized2) {
        current2.kindStates[kind4] = {
          ...response2,
          kind: kind4,
          status: 'blocked-ambiguous-submission',
          errorType: 'ambiguous-submission',
          errorMessage: '请求已提交但未确认是否计费成功；需要用户明确授权后才能重新请求。',
          responseMode: responseMode3[kind4] ? 'compact' : 'verbose',
          finishedAt: Number(response2?.finishedAt) || Date.now(),
        };
        continue;
      }
      ((enabled5 || value10) &&
        value18 &&
        isStoryAssetPaidRerunAuthorized2 &&
        (clearStoryAssetPaidLane(current2, kind4, 'authorized-ambiguous-submission-rerun'),
        (current2.kindStates[kind4] = {
          ...response2,
          status: 'pending',
          assetCount: 0,
          errorType: '',
          errorMessage: '',
          finishedAt: 0,
        })),
        (current2.contractFingerprintsByKind[kind4] = contractFingerprintsByKind[kind4]),
        (current2.contractSnapshotByKind[kind4] = cloneStoryAssetDetailedExtractionValue(
          contractSnapshotByKind[kind4],
        )),
        (current2.kindStates[kind4] = {
          ...kindStates[kind4],
          ...(current2.kindStates[kind4] || {}),
          kind: kind4,
          responseMode: responseMode3[kind4] ? 'compact' : 'verbose',
        }));
    }
    ((current2.schemaVersion = schemaVersion), (current2.sourceFingerprint = sourceFingerprint));
    let promise = Promise.resolve();
    const run7 = async (message = '') => {
        ((current2.completedKinds = total.filter(
          (value19) => current2.kindStates[value19]?.status === 'succeeded',
        )),
          (current2.completedAssets = total.flatMap(
            (value20) => current2.assetsByKind[value20] || [],
          )),
          (current2.failures = total.flatMap((kind5) => {
            const response3 = current2.kindStates[kind5];
            return response3?.status === 'failed' ||
              String(response3?.status || '').startsWith('blocked-')
              ? [
                  {
                    stage: 'kind',
                    kind: kind5,
                    errorType: normalizeText(response3.errorType),
                    errorMessage: normalizeText(response3.errorMessage),
                  },
                ]
              : [];
          })),
          (current2.progress = {
            stage: 'kind',
            current: current2.completedKinds.length,
            total: total.length,
            message: message,
          }),
          (current2.updatedAt = Date.now()));
        const cloneStoryAssetDetailedExtractionValue3 = cloneStoryAssetDetailedExtractionValue(current2);
        (typeof onCheckpoint === 'function' &&
          ((promise = promise.then(() => onCheckpoint(cloneStoryAssetDetailedExtractionValue3))),
          await promise),
          onProgress?.({
            stage: 'extracting-assets-parallel',
            current: current2.completedKinds.length,
            total: total.length,
            message: message,
          }));
      },
      handler3 = async (args2, value21, value22) => {
        ((current2.status = 'blocked'), await run7(value22));
        const error3 = new Error(value22);
        ((error3.type = value21),
          (error3.blockedKinds = [...args2]),
          (error3.assetExtractionDraft = cloneStoryAssetDetailedExtractionValue(current2)));
        throw error3;
      };
    onProgress?.({
      stage: 'extracting-assets-parallel',
      current: total.filter((value23) => current2.kindStates[value23]?.status === 'succeeded').length,
      total: total.length,
      message: '正在并行提取角色、场景与道具',
    });
    const list6 = total.filter(
      (value24) => current2.kindStates[value24]?.status === 'blocked-quality-rerun',
    );
    list6.length &&
      (await handler3(
        list6,
        'ASSET_VISUAL_QUALITY_RERUN_REQUIRED',
        '已付费的' +
          list6.map((value25) => output[value25]).join('、') +
          '结果未通过视觉质量合同；未自动重新请求。',
      ));
    const list7 = total.filter(
      (value26) => current2.kindStates[value26]?.status === 'blocked-incompatible',
    );
    list7.length &&
      (await handler3(
        list7,
        'ASSET_CONTRACT_INCOMPATIBLE',
        '已付费的' +
          list7.map((value27) => output[value27]).join('、') +
          '结果与当前合同不兼容；未自动重新请求。',
      ));
    const list8 = total.filter(
      (value28) => current2.kindStates[value28]?.status === 'blocked-ambiguous-submission',
    );
    list8.length &&
      (await handler3(
        list8,
        'ASSET_SUBMISSION_AMBIGUOUS',
        list8.map((value29) => output[value29]).join('、') + '请求的计费状态不明确；未自动重新请求。',
      ));
    ((current2.status = 'in-progress'), await run7('正在并行提取角色、场景与道具'));
    for (const value30 of total) {
      if (current2.kindStates[value30]?.status === 'succeeded') continue;
      const enabled9 = normalizeText(current2.rawResponsesByKind[value30]);
      if (!enabled9) {
        if (
          current2.paidResponseReceivedByKind[value30] &&
          !isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, value30)
        )
          current2.kindStates[value30] = {
            ...current2.kindStates[value30],
            status: 'blocked-paid-response',
            assetCount: 0,
            errorType: 'paid-result-validation',
            errorMessage: '已付费请求返回空内容；已停止自动重新请求。',
            finishedAt: Date.now(),
          };
        else
          current2.paidResponseReceivedByKind[value30] &&
            isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, value30) &&
            (clearStoryAssetPaidLane(current2, value30, 'authorized-empty-paid-response-rerun'),
            (current2.kindStates[value30] = {
              ...current2.kindStates[value30],
              status: 'pending',
              assetCount: 0,
              errorType: '',
              errorMessage: '',
              finishedAt: 0,
            }));
        continue;
      }
      try {
        const value31 = normalizeText(
            current2.rawResponseModesByKind[value30] ||
              current2.kindStates[value30]?.responseMode ||
              current2.responseMode,
          ),
          assetCount =
            value31 === 'compact'
              ? parseStoryAssetCompactExtractionResult(enabled9, {
                  assetKinds: [value30],
                  chapterIds: chapterIds,
                  contractSnapshot: current2.rawResponseContractSnapshotsByKind[value30],
                })
              : parseStoryAssetExtractionResult(enabled9, {
                  chapterIds: chapterIds,
                  allowedKinds: [value30],
                  allowEmptyResult:
                    Array.isArray(requiredAssetNamesByKind?.[value30]) &&
                    requiredAssetNamesByKind[value30].length === 0,
                });
        ((current2.assetsByKind[value30] = assetCount.assets),
          Array.isArray(assetCount?.decisions) &&
            (current2.decisionsByKind[value30] = cloneStoryAssetDetailedExtractionValue(
              assetCount.decisions,
            )),
          (current2.contractFingerprintsByKind[value30] = contractFingerprintsByKind[value30]),
          (current2.contractSnapshotByKind[value30] = cloneStoryAssetDetailedExtractionValue(
            contractSnapshotByKind[value30],
          )),
          (current2.kindStates[value30] = {
            ...current2.kindStates[value30],
            status: 'succeeded',
            assetCount: assetCount.assets.length,
            errorType: '',
            errorMessage: '',
            finishedAt: Date.now(),
          }),
          (current2.submissionStatesByKind[value30] = {
            ...current2.submissionStatesByKind[value30],
            status: 'validated',
            validatedAt: Date.now(),
          }),
          await run7(output[value30] + '已从上次付费结果恢复：' + assetCount.assets.length + ' 个'));
      } catch (error4) {
        if (isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, value30)) {
          (clearStoryAssetPaidLane(current2, value30, 'authorized-invalid-paid-response-rerun'),
            (current2.kindStates[value30] = {
              ...current2.kindStates[value30],
              status: 'pending',
              assetCount: 0,
              errorType: '',
              errorMessage: '',
              finishedAt: 0,
            }));
          continue;
        }
        current2.kindStates[value30] = {
          ...current2.kindStates[value30],
          status: 'blocked-paid-response',
          assetCount: 0,
          errorType: 'paid-result-validation',
          errorMessage: normalizeText(error4?.message || error4),
          finishedAt: Date.now(),
        };
      }
    }
    const list9 = total.filter(
      (value32) => current2.kindStates[value32]?.status === 'blocked-paid-response',
    );
    list9.length &&
      (await handler3(
        list9,
        'ASSET_PAID_RESULT_BLOCKED',
        '已付费的' +
          list9.map((value33) => output[value33]).join('、') +
          '结果未通过合同校验；已保留原始返回且未自动重新请求。',
      ));
    const list10 = total.filter((value34) => current2.kindStates[value34]?.status !== 'succeeded'),
      list11 = await Promise.allSettled(
        list10.map(async (value35) => {
          const value36 =
            responseMode3[value35] &&
            Array.isArray(requiredAssetNamesByKind?.[value35]) &&
            requiredAssetNamesByKind[value35].length === 0 &&
            (!Array.isArray(candidateAssetsByKind?.[value35]) ||
              candidateAssetsByKind[value35].length === 0);
          if (value36)
            return (
              (current2.assetsByKind[value35] = []),
              (current2.kindStates[value35] = {
                ...current2.kindStates[value35],
                status: 'succeeded',
                assetCount: 0,
                errorType: '',
                errorMessage: '',
                finishedAt: Date.now(),
              }),
              await run7(output[value35] + '无待提取资产，已在本地完成'),
              { schemaVersion: schemaVersion, assets: [] }
            );
          const compactOutput2 = responseMode3[value35],
            startedAt = Date.now();
          ((current2.kindStates[value35] = {
            ...current2.kindStates[value35],
            status: 'running',
            attempt:
              Math.max(0, Math.trunc(Number(current2.kindStates[value35]?.attempt) || 0)) +
              1,
            assetCount: 0,
            errorType: '',
            errorMessage: '',
            startedAt: startedAt,
            finishedAt: 0,
          }),
            await run7(
              '正在提取' +
                output[value35] +
                '；已完成 ' +
                current2.completedKinds.length +
                '/' +
                total.length,
            ));
          let count = 0;
          try {
            const assetCount2 = await extractStoryAssets({
              project: project,
              model: model,
              provider: provider,
              providerProfileId: providerProfileId,
              aspectRatio: aspectRatio,
              visualStyle: visualStyle,
              assetKinds: [value35],
              requiredAssetNamesByKind: requiredAssetNamesByKind,
              requiredAssetsByKind: requiredAssetsByKind,
              candidateAssetsByKind: candidateAssetsByKind,
              compactOutput: compactOutput2,
              allowOversizedPrompt: allowOversizedPrompt,
              automaticRecovery: automaticRecovery,
              structuredOutputFallback: structuredOutputFallback,
              maxOutputTokens: maxOutputTokens,
              onProgress: ({ stage: stage, message: message2 } = {}) => {
                onProgress?.({
                  stage: normalizeText(stage) || 'extracting-assets-parallel',
                  current: current2.completedKinds.length,
                  total: total.length,
                  message: normalizeText(message2),
                });
              },
              request: async (value37) => {
                ((count += 1),
                  (current2.totalRequestCount =
                    Math.max(0, Math.trunc(Number(current2.totalRequestCount) || 0)) + 1),
                  (current2.kindStates[value35].requestCount =
                    Math.max(
                      0,
                      Math.trunc(Number(current2.kindStates[value35]?.requestCount) || 0),
                    ) + 1));
                count > 1 &&
                  (current2.kindStates[value35].repairCount =
                    Math.max(
                      0,
                      Math.trunc(Number(current2.kindStates[value35]?.repairCount) || 0),
                    ) + 1);
                ((current2.submissionStatesByKind[value35] = {
                  status: 'submitted',
                  submittedAt: Date.now(),
                  requestCount: current2.kindStates[value35].requestCount,
                  responseMode: compactOutput2 ? 'compact' : 'verbose',
                  contractSnapshot: cloneStoryAssetDetailedExtractionValue(contractSnapshotByKind[value35]),
                }),
                  await run7(
                    count > 1
                      ? '正在提交' + output[value35] + '自动纠错请求（1/1）'
                      : '正在提交' + output[value35] + '提取请求',
                  ));
                const request2 = await request(value37),
                  enabled10 = run5(request2);
                ((current2.paidResponseReceivedByKind[value35] = true),
                  (current2.rawResponsesByKind[value35] = enabled10),
                  (current2.rawResponseModesByKind[value35] = compactOutput2 ? 'compact' : 'verbose'),
                  (current2.rawResponseContractSnapshotsByKind[value35] =
                    cloneStoryAssetDetailedExtractionValue(contractSnapshotByKind[value35])),
                  (current2.submissionStatesByKind[value35] = {
                    ...current2.submissionStatesByKind[value35],
                    status: 'response-received',
                    responseReceivedAt: Date.now(),
                  }));
                if (!enabled10) {
                  ((current2.kindStates[value35] = {
                    ...current2.kindStates[value35],
                    status: 'blocked-paid-response',
                    assetCount: 0,
                    errorType: 'empty-paid-response',
                    errorMessage: '已付费请求返回空内容；已停止自动重新请求。',
                    finishedAt: Date.now(),
                  }),
                    (current2.submissionStatesByKind[value35] = {
                      ...current2.submissionStatesByKind[value35],
                      status: 'blocked-paid-response',
                      blockedAt: Date.now(),
                      errorType: 'empty-paid-response',
                    }),
                    await run7(output[value35] + '付费请求返回空内容；已阻断且未自动重试'));
                  const error5 = new Error(
                    output[value35] + '付费请求返回空内容；需要明确授权后才能重新请求。',
                  );
                  error5.type = 'ASSET_PAID_RESULT_BLOCKED';
                  throw error5;
                }
                return (await run7(output[value35] + '请求已完成，正在校验付费结果'), request2);
              },
            });
            return (
              (current2.assetsByKind[value35] = assetCount2.assets),
              Array.isArray(assetCount2?.decisions)
                ? (current2.decisionsByKind[value35] = cloneStoryAssetDetailedExtractionValue(
                    assetCount2.decisions,
                  ))
                : delete current2.decisionsByKind[value35],
              (current2.contractFingerprintsByKind[value35] = contractFingerprintsByKind[value35]),
              (current2.contractSnapshotByKind[value35] = cloneStoryAssetDetailedExtractionValue(
                contractSnapshotByKind[value35],
              )),
              (current2.kindStates[value35] = {
                ...current2.kindStates[value35],
                status: 'succeeded',
                assetCount: assetCount2.assets.length,
                errorType: '',
                errorMessage: '',
                finishedAt: Date.now(),
              }),
              (current2.submissionStatesByKind[value35] = {
                ...current2.submissionStatesByKind[value35],
                status: 'validated',
                validatedAt: Date.now(),
              }),
              await run7(output[value35] + '完成：' + assetCount2.assets.length + ' 个'),
              assetCount2
            );
          } catch (error6) {
            const value38 = normalizeText(current2.submissionStatesByKind[value35]?.status),
              status = value38 === 'response-received',
              errorType = Boolean(
                error6?.type === 'ASSET_PAID_RESULT_BLOCKED' || value38 === 'blocked-paid-response',
              ),
              errorType2 = classifyStoryAssetDetailedExtractionError(error6, normalizeText),
              enabled11 = Boolean(
                !status && !errorType && count > 0 && isStoryAssetConfirmedUnchargedRejection(error6),
              ),
              status2 = Boolean(!status && !errorType && count > 0 && !enabled11);
            count > 0 &&
              !status &&
              !errorType &&
              (current2.submissionStatesByKind[value35] = {
                ...current2.submissionStatesByKind[value35],
                status: status2 ? 'ambiguous' : 'rejected-confirmed',
                failedAt: Date.now(),
                errorType: errorType2,
                errorMessage: normalizeText(error6?.message || error6),
              });
            ((current2.kindStates[value35] = {
              ...current2.kindStates[value35],
              status:
                status || errorType
                  ? 'blocked-paid-response'
                  : status2
                    ? 'blocked-ambiguous-submission'
                    : 'failed',
              assetCount: 0,
              errorType: errorType
                ? normalizeText(current2.kindStates[value35]?.errorType) || 'paid-result-validation'
                : status
                  ? 'paid-result-validation'
                  : status2
                    ? 'ambiguous-submission'
                    : errorType2,
              errorMessage: normalizeText(error6?.message || error6),
              finishedAt: Date.now(),
            }),
              await run7(output[value35] + '提取失败；已保留其他付费结果'));
            throw error6;
          }
        }),
      ),
      count2 = list11.findIndex((response4) => response4.status === 'rejected');
    if (count2 >= 0) {
      const list12 = total.filter(
          (value39) => current2.kindStates[value39]?.status === 'blocked-paid-response',
        ),
        list13 = total.filter(
          (value40) => current2.kindStates[value40]?.status === 'blocked-ambiguous-submission',
        ),
        list14 = [...list12, ...list13];
      ((current2.status = list14.length
        ? 'blocked'
        : current2.completedKinds.length
          ? 'partial'
          : 'failed'),
        await run7(
          list14.length
            ? list14.map((value41) => output[value41]).join('、') + '已进入付费保护状态；未自动重新请求'
            : '已保留 ' +
                current2.completedKinds.length +
                '/' +
                total.length +
                ' 路付费结果；仅需重试失败项',
        ));
      const error7 = list11[count2].reason,
        value42 = list10[count2],
        error8 = new Error(
          output[value42] + '提取失败：' + (normalizeText(error7?.message) || '模型请求失败'),
        );
      if (list12.length)
        ((error8.type = 'ASSET_PAID_RESULT_BLOCKED'), (error8.blockedKinds = list12));
      else
        list13.length &&
          ((error8.type = 'ASSET_SUBMISSION_AMBIGUOUS'), (error8.blockedKinds = list13));
      ((error8.cause = error7),
        (error8.assetExtractionDraft = cloneStoryAssetDetailedExtractionValue(current2)));
      throw error8;
    }
    const value43 = new Set(),
      value44 = new Set(),
      assets = total.flatMap((value45) =>
        (current2.assetsByKind[value45] || []).map((appearances, value46) => {
          const ref = makeUniqueStoryAssetExtractionRef(
            appearances.ref,
            value45 + '-' + (value46 + 1),
            value43,
            normalizeAssetReference,
          );
          return {
            ...appearances,
            ref: ref,
            appearances: appearances.appearances.map((args3, value47) => ({
              ...args3,
              ref: makeUniqueStoryAssetExtractionRef(
                args3.ref,
                ref + '-appearance-' + (value47 + 1),
                value44,
                normalizeAssetReference,
              ),
            })),
          };
        }),
      );
    return (
      (current2.status = 'completed'),
      await run7('资产提取完成：' + assets.length + ' 个'),
      { schemaVersion: schemaVersion, extractionStrategy: 'kind-detailed-parallel', assets: assets }
    );
  };
}
