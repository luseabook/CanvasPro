import { normalizePositiveNumber, normalizeText } from '../utils/storyGenerationValues.js';
import { parseStrictJson } from '../utils/strictJson.js';
import { getResultText } from './storyTextRequest.js';
import { invokeStoryGenerationRequest } from './storyInvocationEvidence.js';
const MAX_NATURAL_SPOKEN_UNITS_PER_SECOND = 5;
function countSpokenUnits(value) {
  const text = normalizeText(value),
    item = (text['match'](/[\p{Script=Han}]/gu) || [])['length'],
    key = (text['match'](/[A-Za-z0-9]+/g) || [])['length'];
  return item + key;
}
function extractSceneSpokenText(index) {
  return normalizeText(index)
    ['split'](/\r?\n/u)
    ['map']((result) => result['trim']())
    ['filter'](Boolean)
    ['flatMap']((list) => {
      const count = [list['indexOf']('：'), list['indexOf'](':')]
        ['filter']((count2) => count2 >= 0)
        ['reduce']((data, options) => Math['min'](data, options), Number['POSITIVE_INFINITY']);
      if (count < 0 || count > 24) return [];
      const target = list['slice'](0, count)['trim']();
      if (/字幕|屏幕|文字|音效/u['test'](target)) return [];
      const args = list['slice'](count + 1)['trim']();
      if (!args) return [];
      const list2 = [...args['matchAll'](/[“"]([^”"]+)[”"]/gu)]['map']((source) => source[1]);
      if (list2['length']) return list2;
      return /^(旁白|VO|OS|画外音)$/iu['test'](target) ? [args] : [];
    })
    ['join']('\n');
}
export function createStoryEpisodeScriptRuntimeGuidance(options2 = {}) {
  const outlineEstimateSeconds = normalizePositiveNumber(
    options2?.['estimatedDurationSeconds'] || options2?.['durationSeconds'],
  );
  return {
    basis: 'episode-outline-and-current-story-content',
    outlineEstimateSeconds: outlineEstimateSeconds || null,
    enforcement: outlineEstimateSeconds ? 'adaptation-budget' : 'content-density',
    rules: [
      outlineEstimateSeconds
        ? '大纲预计时长是当前分集的改编预算；优先保留核心事件、选择、冲突和结果，压缩说明性内容，不得把小说正文逐句影视化后突破预算。'
        : '没有预计时长时，仍须按有效剧情密度精炼改编，不得逐句搬运描述性正文。',
      '对白必须按角色语气自然说完，动作、反应、停顿和场面调度必须留出真实可拍时间。',
      '不得用重复对白、重复动作、解释性复述或无剧情作用的停顿扩充体量。',
      '允许删除或合并不推动剧情的环境描写、心理复述、背景说明和过场；不得删除本集核心因果、关键选择、冲突结果与指定结尾。',
    ],
  };
}
export function inspectStoryEpisodeScriptTiming(options3 = {}, next = {}) {
  const outlineEstimateSeconds2 = normalizePositiveNumber(
      next?.['estimatedDurationSeconds'] || next?.['durationSeconds'],
    ),
    current = (Array['isArray'](options3?.['scenes']) ? options3['scenes'] : [])
      ['map']((dom) => extractSceneSpokenText(dom?.['body']))
      ['filter'](Boolean)
      ['join']('\n'),
    spokenUnits = countSpokenUnits(current),
    minimumSpokenDurationSeconds = spokenUnits
      ? Number((spokenUnits / MAX_NATURAL_SPOKEN_UNITS_PER_SECOND)['toFixed'](1))
      : 0;
  return {
    status: 'observed',
    outlineEstimateSeconds: outlineEstimateSeconds2,
    spokenUnits: spokenUnits,
    minimumSpokenDurationSeconds: minimumSpokenDurationSeconds,
    reason: spokenUnits
      ? '本集可配音文本按每秒 ' +
        MAX_NATURAL_SPOKEN_UNITS_PER_SECOND +
        ' 字/词的快速自然语速，至少需要 ' +
        minimumSpokenDurationSeconds +
        ' 秒；这只是对白下限，不包含动作、反应、停顿和场面调度。'
      : '本集没有可可靠提取的对白或旁白，完整时长由独立审查根据动作与表演内容估算。',
  };
}
export function resolveStoryEpisodeSplitTimingBudget(options4 = {}) {
  const enabled = options4?.['script']?.['timingReview'];
  if (!enabled || enabled['verdict'] === 'timing_uncertain') return null;
  const minimum = normalizePositiveNumber(enabled?.['reasonableRangeSeconds']?.['minimum']),
    maximum = normalizePositiveNumber(enabled?.['reasonableRangeSeconds']?.['maximum']);
  if (!minimum || !maximum || minimum > maximum) return null;
  const positiveNumber = normalizePositiveNumber(enabled?.['naturalDurationSeconds']),
    targetDurationSeconds =
      positiveNumber && positiveNumber >= minimum && positiveNumber <= maximum
        ? positiveNumber
        : Number(((minimum + maximum) / 2)['toFixed'](1)),
    minimum2 = Number((minimum * 0.8)['toFixed'](1)),
    maximum2 = Number((maximum * 1.2)['toFixed'](1)),
    sceneTimings = (Array['isArray'](enabled?.['sceneTimings']) ? enabled['sceneTimings'] : [])
      ['map']((entry) => ({
        sceneRef: normalizeText(entry?.['sceneRef']),
        spokenSeconds: normalizeNonNegativeTimingNumber(entry?.['spokenSeconds']),
        nonOverlappingActionSeconds: normalizeNonNegativeTimingNumber(entry?.['nonOverlappingActionSeconds']),
        pauseAndTransitionSeconds: normalizeNonNegativeTimingNumber(entry?.['pauseAndTransitionSeconds']),
        concurrentActionNotes: normalizeText(entry?.['concurrentActionNotes']),
        totalSeconds: normalizePositiveNumber(entry?.['totalSeconds']),
        basis: normalizeText(entry?.['basis']),
      }))
      ['filter']((record) => record['sceneRef'] && record['totalSeconds']);
  return {
    basis: 'independent-script-timing-review',
    targetDurationSeconds: targetDurationSeconds,
    reasonableRangeSeconds: { minimum: minimum, maximum: maximum },
    allowedProductionRangeSeconds: { minimum: minimum2, maximum: maximum2 },
    sceneTimings: sceneTimings,
  };
}
export function assertStoryEpisodeSplitTiming(options5 = {}, payload = {}) {
  const storyEpisodeSplitTimingBudget = resolveStoryEpisodeSplitTimingBudget(payload);
  if (!storyEpisodeSplitTimingBudget) return options5;
  const { minimum: minimum3, maximum: maximum3 } = storyEpisodeSplitTimingBudget['reasonableRangeSeconds'],
    totalDurationSeconds =
      normalizePositiveNumber(options5?.['totalDurationSeconds']) ||
      (Array['isArray'](options5?.['clips']) ? options5['clips'] : [])['reduce'](
        (handle, state) => handle + (normalizePositiveNumber(state?.['durationSec']) || 0),
        0,
      ),
    { minimum: minimum4, maximum: maximum4 } = storyEpisodeSplitTimingBudget['allowedProductionRangeSeconds'];
  if (totalDurationSeconds >= minimum4 && totalDurationSeconds <= maximum4) return options5;
  const error = new Error(
    '分镜总时长 ' +
      totalDurationSeconds +
      ' 秒偏离本集正文独立审时区间 ' +
      minimum3 +
      '-' +
      maximum3 +
      ' 秒（允许制作浮动 ' +
      minimum4 +
      '-' +
      maximum4 +
      ' 秒），本次结果未通过。',
  );
  ((error['code'] = 'STORY_EPISODE_SPLIT_TIMING_MISMATCH'),
    (error['timing'] = {
      totalDurationSeconds: totalDurationSeconds,
      reasonableRangeSeconds: { minimum: minimum3, maximum: maximum3 },
      allowedRangeSeconds: { minimum: minimum4, maximum: maximum4 },
    }));
  throw error;
}
function buildStoryEpisodeScriptTimingReviewPrompt({
  episode: episode = {},
  script: script = {},
  priorReview: priorReview = null,
} = {}) {
  return JSON['stringify']({
    task: 'review_story_episode_script_timing',
    schemaVersion: 2,
    reviewMode: priorReview ? 'challenge_previous_review' : 'independent',
    episode: {
      number: Math['max'](1, Math['trunc'](Number(episode?.['number']) || 1)),
      title: normalizeText(episode?.['title']),
      synopsis: normalizeText(episode?.['synopsis']),
      hook: normalizeText(episode?.['hook']),
    },
    script: script,
    ...(priorReview ? { previousReview: priorReview } : {}),
    criteria: [
      '独立估算整集自然表演时长，必须包含对白、动作、人物反应、停顿、走位、场面调度和必要镜头建立时间。',
      '允许对白与动作真实同步发生，但不得假设所有动作都能与对白重叠，也不得靠不自然的高速口播压缩。',
      '输入中没有目标集长或大纲预计秒数；只根据当前正文测量，不猜测、不服从任何外部时长目标。',
      '必须为 script.scenes 的每一场按原 ref 输出 sceneTimings。spokenSeconds 只计自然说完对白/旁白的时间；nonOverlappingActionSeconds 只计不能与对白同步完成的动作和反应；pauseAndTransitionSeconds 只计必要停顿、场景建立和转场；能与对白同步的动作写入 concurrentActionNotes，不得再次加进总时长。',
      '每场 totalSeconds 必须约等于 spokenSeconds + nonOverlappingActionSeconds + pauseAndTransitionSeconds；naturalDurationSeconds 必须约等于全部场次 totalSeconds 之和。',
      '若正文自身存在可定位的重复解释、同义对白或重复动作，verdict=needs_revision。',
      ...(priorReview
        ? [
            'previousReview 只是待质疑的第一次结论和逐场账本，不是事实；逐场重新核算，不得直接沿用它的数字。',
            '重点检查第一次审查是否把可与对白同步的表情、取放物品、查看屏幕、走位或环境反应重复累加，也不得反过来把必须顺序发生的等待、移动和操作全部重叠。',
            '在各场 basis、concurrentActionNotes、reason 或 findings 中明确说明同意或推翻第一次账本的具体计时依据。',
          ]
        : []),
      '审查只测量和诊断，不改写正文，不输出压缩稿，不按固定字数、场次数量或镜头数量裁决。只返回严格 JSON。',
    ],
    outputContract:
      "verdict('pass'|'needs_revision'),naturalDurationSeconds,reasonableRangeSeconds{minimum,maximum},sceneTimings[{sceneRef,spokenSeconds,nonOverlappingActionSeconds,pauseAndTransitionSeconds,concurrentActionNotes,totalSeconds,basis}],reason,findings string[]",
  });
}
function normalizeTimingReviewFinding(config) {
  if (config === null || config === undefined) return '';
  if (typeof config !== 'object' || Array['isArray'](config)) return normalizeText(config);
  const text2 = normalizeText(config['sceneRef'] || config['scene'] || config['location'] || config['ref']),
    text3 = normalizeText(config['issue'] || config['problem'] || config['description'] || config['reason']),
    text4 = normalizeText(config['evidence'] || config['example'] || config['quote']),
    text5 = normalizeText(config['suggestion'] || config['recommendation'] || config['action']),
    list3 = [
      text2 ? '[' + text2 + ']' : '',
      text3,
      text4 ? '证据：' + text4 : '',
      text5 ? '建议：' + text5 : '',
    ]['filter'](Boolean);
  if (list3['length']) return list3['join'](' ');
  try {
    return normalizeText(JSON['stringify'](config));
  } catch {
    return '';
  }
}
function normalizeNonNegativeTimingNumber(scope) {
  const count3 = Number(scope);
  if (!Number['isFinite'](count3) || count3 < 0) return null;
  return Number(count3['toFixed'](1));
}
function normalizeStoryEpisodeSceneTimings(options6 = {}, input = {}, output = 0) {
  const list4 = Array['isArray'](input?.['scenes']) ? input['scenes'] : [];
  if (!list4['length']) return [];
  if (!Array['isArray'](options6?.['sceneTimings']) || options6['sceneTimings']['length'] !== list4['length'])
    throw new Error('时长审查 Agent 未返回覆盖全部场次的逐场时长账本。');
  const list5 = list4['map']((value2, value3) => {
      const text6 = normalizeText(value2?.['ref'] || value2?.['sceneRef'] || 'scene-' + (value3 + 1)),
        value4 = options6['sceneTimings'][value3] || {},
        sceneRef = normalizeText(value4?.['sceneRef']);
      if (sceneRef !== text6)
        throw new Error('时长审查 Agent 的逐场账本顺序或场次引用无效：应为 ' + text6 + '。');
      const spokenSeconds = normalizeNonNegativeTimingNumber(value4?.['spokenSeconds']),
        nonOverlappingActionSeconds = normalizeNonNegativeTimingNumber(
          value4?.['nonOverlappingActionSeconds'],
        ),
        pauseAndTransitionSeconds = normalizeNonNegativeTimingNumber(value4?.['pauseAndTransitionSeconds']),
        totalSeconds = normalizePositiveNumber(value4?.['totalSeconds']),
        basis = normalizeText(value4?.['basis']);
      if (
        spokenSeconds === null ||
        nonOverlappingActionSeconds === null ||
        pauseAndTransitionSeconds === null ||
        !totalSeconds ||
        !basis
      )
        throw new Error('时长审查 Agent 的 ' + text6 + ' 逐场账本不完整。');
      const value5 = spokenSeconds + nonOverlappingActionSeconds + pauseAndTransitionSeconds,
        value6 = Math['max'](2, totalSeconds * 0.05);
      if (Math['abs'](value5 - totalSeconds) > value6)
        throw new Error('时长审查 Agent 的 ' + text6 + ' 分项时间无法合计到本场总时长。');
      return {
        sceneRef: sceneRef,
        spokenSeconds: spokenSeconds,
        nonOverlappingActionSeconds: nonOverlappingActionSeconds,
        pauseAndTransitionSeconds: pauseAndTransitionSeconds,
        concurrentActionNotes: normalizeText(value4?.['concurrentActionNotes']),
        totalSeconds: totalSeconds,
        basis: basis,
      };
    }),
    value7 = list5['reduce']((value8, value9) => value8 + value9['totalSeconds'], 0),
    value10 = Math['max'](5, output * 0.05);
  if (Math['abs'](value7 - output) > value10)
    throw new Error('时长审查 Agent 的逐场总计与整集自然时长不一致。');
  return list5;
}
export async function requestStoryEpisodeScriptTimingReview({
  request: request,
  requestPayload: requestPayload = {},
  episode: episode = {},
  script: script = {},
  onInvocation: onInvocation = null,
  attempt: attempt = 1,
  phase: phase = 'timing-review',
  priorReview: priorReview = null,
} = {}) {
  const invokeStoryGenerationRequest2 = await invokeStoryGenerationRequest({
      request: request,
      requestPayload: {
        ...requestPayload,
        prompt: buildStoryEpisodeScriptTimingReviewPrompt({
          episode: episode,
          script: script,
          priorReview: priorReview,
        }),
        systemPrompt:
          '你是短剧分集剧本的独立时长审查员。只测量自然表演时长并诊断可定位的问题；不得改写、压缩或输出替代正文，不按固定字数或固定集长套模板。只返回严格 JSON。',
        temperature: 0.1,
        thinking: { type: 'disabled' },
        maxOutputTokens: 8192,
      },
      stepId: phase,
      attempt: attempt,
      onInvocation: onInvocation,
      serializeResponse: getResultText,
    }),
    strictJson = parseStrictJson(
      getResultText(invokeStoryGenerationRequest2),
      '时长审查 Agent 未返回有效 JSON。',
    ),
    verdict = ['pass', 'needs_revision']['includes'](strictJson?.['verdict'])
      ? strictJson['verdict']
      : 'needs_revision',
    naturalDurationSeconds = normalizePositiveNumber(strictJson?.['naturalDurationSeconds']);
  if (!naturalDurationSeconds) throw new Error('时长审查 Agent 未返回有效自然时长。');
  const minimum5 = normalizePositiveNumber(strictJson?.['reasonableRangeSeconds']?.['minimum']),
    maximum5 = normalizePositiveNumber(strictJson?.['reasonableRangeSeconds']?.['maximum']);
  if (!minimum5 || !maximum5 || minimum5 > naturalDurationSeconds || maximum5 < naturalDurationSeconds)
    throw new Error('时长审查 Agent 返回的自然时长区间无效。');
  let reason = normalizeText(strictJson?.['reason']),
    findings = Array['isArray'](strictJson?.['findings'])
      ? strictJson['findings']['map'](normalizeTimingReviewFinding)['filter'](Boolean)['slice'](0, 12)
      : [];
  if (verdict !== 'pass' && (!reason || !findings['length']))
    throw new Error('时长审查 Agent 的问题结论缺少可定位证据。');
  const sceneTimings2 = normalizeStoryEpisodeSceneTimings(strictJson, script, naturalDurationSeconds);
  return {
    verdict: verdict,
    naturalDurationSeconds: naturalDurationSeconds,
    reasonableRangeSeconds: { minimum: minimum5, maximum: maximum5 },
    sceneTimings: sceneTimings2,
    reason: reason,
    findings: findings,
  };
}
function isOutlineEstimateOutsideReview(enabled2, value11 = {}) {
  if (!enabled2) return ![];
  const positiveNumber2 = normalizePositiveNumber(value11?.['reasonableRangeSeconds']?.['minimum']),
    positiveNumber3 = normalizePositiveNumber(value11?.['reasonableRangeSeconds']?.['maximum']);
  return !!positiveNumber2 && !!positiveNumber3 && (enabled2 < positiveNumber2 || enabled2 > positiveNumber3);
}
function mergeTimingReviewFindings(...args2) {
  return [...new Set(args2['flat']()['map'](normalizeTimingReviewFinding)['filter'](Boolean))]['slice'](
    0,
    12,
  );
}
export function preserveStoryEpisodeScriptWithoutTimingReview(args3, value12, error2 = null) {
  const outlineEstimateSeconds3 = inspectStoryEpisodeScriptTiming(args3, value12),
    reason2 = normalizeText(error2?.['message'] || error2);
  return {
    ...args3,
    timingReview: {
      verdict: 'timing_uncertain',
      naturalDurationSeconds: null,
      reasonableRangeSeconds: null,
      sceneTimings: [],
      reason: reason2
        ? '时长审查未完成，已保留正文，不再阻塞本集。原因：' + reason2
        : '时长审查未完成，已保留正文，不再阻塞本集。',
      findings: [],
      reviewPasses: 0,
      reviewAgreement: 'review-unavailable',
      outlineEstimateSeconds: outlineEstimateSeconds3['outlineEstimateSeconds'] || null,
      outlineEstimateMismatch: ![],
      spokenUnits: outlineEstimateSeconds3['spokenUnits'],
      minimumSpokenDurationSeconds: outlineEstimateSeconds3['minimumSpokenDurationSeconds'],
    },
  };
}
export async function ensureStoryEpisodeScriptTiming({
  scriptResult: scriptResult,
  episode: episode2,
  review: review,
} = {}) {
  try {
    const outlineEstimateSeconds4 = inspectStoryEpisodeScriptTiming(scriptResult, episode2),
      previousReview = await review(scriptResult, 'timing-review', null),
      value13 =
        outlineEstimateSeconds4['minimumSpokenDurationSeconds'] > 0 &&
        previousReview['reasonableRangeSeconds']['maximum'] <
          outlineEstimateSeconds4['minimumSpokenDurationSeconds'],
      reviewPasses = previousReview['verdict'] !== 'pass' || value13;
    let args4 = previousReview,
      reviewAgreement = 'single-pass';
    if (reviewPasses) {
      const args5 = await review(scriptResult, 'timing-recheck', previousReview),
        value14 = previousReview['reasonableRangeSeconds'],
        value15 = args5['reasonableRangeSeconds'],
        value16 =
          Math['max'](value14['minimum'], value15['minimum']) <=
          Math['min'](value14['maximum'], value15['maximum']),
        enabled3 =
          outlineEstimateSeconds4['minimumSpokenDurationSeconds'] > 0 &&
          value15['maximum'] < outlineEstimateSeconds4['minimumSpokenDurationSeconds'];
      if (value16 && !enabled3) {
        const reason3 = previousReview['verdict'] === args5['verdict'],
          value17 = previousReview['verdict'] === 'needs_revision' || args5['verdict'] === 'needs_revision';
        ((args4 = value17
          ? {
              ...args5,
              verdict: 'needs_revision',
              reason: reason3
                ? args5['reason']
                : '两次审查对正文质量结论不一致；保留已定位的具体问题，正文不会自动改写。第二次审查：' +
                  args5['reason'],
              findings: mergeTimingReviewFindings(previousReview['findings'], args5['findings']),
            }
          : args5),
          (reviewAgreement = reason3 ? 'overlapping-ranges' : 'quality-disagreement'));
      } else
        value16
          ? ((args4 = {
              ...args5,
              verdict: 'timing_uncertain',
              reason:
                '两次模型审时均低于对白本身至少需要的 ' +
                outlineEstimateSeconds4['minimumSpokenDurationSeconds'] +
                ' 秒。当前只标记时长不确定，不改写正文，也不据此限制后续分镜。',
              findings: [...args5['findings'], outlineEstimateSeconds4['reason']]['slice'](0, 12),
            }),
            (reviewAgreement = 'below-spoken-floor'))
          : ((args4 = {
              ...args5,
              verdict: 'timing_uncertain',
              reason:
                '两次独立审时区间不重叠：第一次 ' +
                value14['minimum'] +
                '-' +
                value14['maximum'] +
                ' 秒，第二次 ' +
                value15['minimum'] +
                '-' +
                value15['maximum'] +
                ' 秒。当前只标记时长不确定，不改写正文，也不据此限制后续分镜。',
              findings: [...args5['findings'], '第一次审时：' + previousReview['reason']]['slice'](0, 12),
            }),
            (reviewAgreement = 'conflicting-ranges'));
    }
    const outlineEstimateMismatch =
      args4['verdict'] === 'pass' &&
      isOutlineEstimateOutsideReview(outlineEstimateSeconds4['outlineEstimateSeconds'], args4);
    return {
      ...scriptResult,
      timingReview: {
        ...args4,
        reviewPasses: reviewPasses ? 2 : 1,
        reviewAgreement: reviewAgreement,
        ...(reviewPasses ? { previousReview: previousReview } : {}),
        outlineEstimateSeconds: outlineEstimateSeconds4['outlineEstimateSeconds'] || null,
        outlineEstimateMismatch: outlineEstimateMismatch,
        spokenUnits: outlineEstimateSeconds4['spokenUnits'],
        minimumSpokenDurationSeconds: outlineEstimateSeconds4['minimumSpokenDurationSeconds'],
      },
    };
  } catch (value18) {
    return preserveStoryEpisodeScriptWithoutTimingReview(scriptResult, episode2, value18);
  }
}
