import { normalizePositiveNumber, normalizeText } from '../utils/storyGenerationValues.js';
import { parseStrictJson } from '../utils/strictJson.js';
import { getResultText } from './storyTextRequest.js';
import { invokeStoryGenerationRequest } from './storyInvocationEvidence.js';
const MAX_NATURAL_SPOKEN_UNITS_PER_SECOND = 0x5;
function countSpokenUnits(_0x33e7ca) {
  const _0x53d6fe = normalizeText(_0x33e7ca),
    _0xb73875 = (_0x53d6fe['match'](/[\p{Script=Han}]/gu) || [])['length'],
    _0x1fe886 = (_0x53d6fe['match'](/[A-Za-z0-9]+/g) || [])['length'];
  return _0xb73875 + _0x1fe886;
}
function extractSceneSpokenText(_0x3a2a49) {
  return normalizeText(_0x3a2a49)
    ['split'](/\r?\n/u)
    ['map']((_0x20782) => _0x20782['trim']())
    ['filter'](Boolean)
    ['flatMap']((_0x3a007e) => {
      const _0x5c0029 = [_0x3a007e['indexOf']('：'), _0x3a007e['indexOf'](':')]
        ['filter']((_0x4eae7e) => _0x4eae7e >= 0x0)
        ['reduce']((_0x277e53, _0x5b9155) => Math['min'](_0x277e53, _0x5b9155), Number['POSITIVE_INFINITY']);
      if (_0x5c0029 < 0x0 || _0x5c0029 > 0x18) return [];
      const _0x283dde = _0x3a007e['slice'](0x0, _0x5c0029)['trim']();
      if (/字幕|屏幕|文字|音效/u['test'](_0x283dde)) return [];
      const _0x54d5f6 = _0x3a007e['slice'](_0x5c0029 + 0x1)['trim']();
      if (!_0x54d5f6) return [];
      const _0x13a4ce = [..._0x54d5f6['matchAll'](/[“"]([^”"]+)[”"]/gu)]['map'](
        (_0xe3a4dd) => _0xe3a4dd[0x1],
      );
      if (_0x13a4ce['length']) return _0x13a4ce;
      return /^(旁白|VO|OS|画外音)$/iu['test'](_0x283dde) ? [_0x54d5f6] : [];
    })
    ['join']('\x0a');
}
export function createStoryEpisodeScriptRuntimeGuidance(_0x4564ee = {}) {
  const _0x1c1fee = normalizePositiveNumber(
    _0x4564ee?.['estimatedDurationSeconds'] || _0x4564ee?.['durationSeconds'],
  );
  return {
    basis: 'episode-outline-and-current-story-content',
    outlineEstimateSeconds: _0x1c1fee || null,
    enforcement: _0x1c1fee ? 'adaptation-budget' : 'content-density',
    rules: [
      _0x1c1fee
        ? '大纲预计时长是当前分集的改编预算；优先保留核心事件、选择、冲突和结果，压缩说明性内容，不得把小说正文逐句影视化后突破预算。'
        : '没有预计时长时，仍须按有效剧情密度精炼改编，不得逐句搬运描述性正文。',
      '对白必须按角色语气自然说完，动作、反应、停顿和场面调度必须留出真实可拍时间。',
      '不得用重复对白、重复动作、解释性复述或无剧情作用的停顿扩充体量。',
      '允许删除或合并不推动剧情的环境描写、心理复述、背景说明和过场；不得删除本集核心因果、关键选择、冲突结果与指定结尾。',
    ],
  };
}
export function inspectStoryEpisodeScriptTiming(_0x525569 = {}, _0x214b76 = {}) {
  const _0x13422f = normalizePositiveNumber(
      _0x214b76?.['estimatedDurationSeconds'] || _0x214b76?.['durationSeconds'],
    ),
    _0x39e5ca = (Array['isArray'](_0x525569?.['scenes']) ? _0x525569['scenes'] : [])
      ['map']((_0x170d9b) => extractSceneSpokenText(_0x170d9b?.['body']))
      ['filter'](Boolean)
      ['join']('\x0a'),
    _0x53aafc = countSpokenUnits(_0x39e5ca),
    _0xc9086f = _0x53aafc ? Number((_0x53aafc / MAX_NATURAL_SPOKEN_UNITS_PER_SECOND)['toFixed'](0x1)) : 0x0;
  return {
    status: 'observed',
    outlineEstimateSeconds: _0x13422f,
    spokenUnits: _0x53aafc,
    minimumSpokenDurationSeconds: _0xc9086f,
    reason: _0x53aafc
      ? '本集可配音文本按每秒 ' +
        MAX_NATURAL_SPOKEN_UNITS_PER_SECOND +
        ' 字/词的快速自然语速，至少需要 ' +
        _0xc9086f +
        ' 秒；这只是对白下限，不包含动作、反应、停顿和场面调度。'
      : '本集没有可可靠提取的对白或旁白，完整时长由独立审查根据动作与表演内容估算。',
  };
}
export function resolveStoryEpisodeSplitTimingBudget(_0x2578b2 = {}) {
  const _0x547366 = _0x2578b2?.['script']?.['timingReview'];
  if (!_0x547366 || _0x547366['verdict'] === 'timing_uncertain') return null;
  const _0x179556 = normalizePositiveNumber(_0x547366?.['reasonableRangeSeconds']?.['minimum']),
    _0x485afd = normalizePositiveNumber(_0x547366?.['reasonableRangeSeconds']?.['maximum']);
  if (!_0x179556 || !_0x485afd || _0x179556 > _0x485afd) return null;
  const _0x13ec4f = normalizePositiveNumber(_0x547366?.['naturalDurationSeconds']),
    _0x5e46ae =
      _0x13ec4f && _0x13ec4f >= _0x179556 && _0x13ec4f <= _0x485afd
        ? _0x13ec4f
        : Number(((_0x179556 + _0x485afd) / 0x2)['toFixed'](0x1)),
    _0x2b0586 = Number((_0x179556 * 0.8)['toFixed'](0x1)),
    _0x5053c9 = Number((_0x485afd * 1.2)['toFixed'](0x1)),
    _0x3892f2 = (Array['isArray'](_0x547366?.['sceneTimings']) ? _0x547366['sceneTimings'] : [])
      ['map']((_0x102df3) => ({
        sceneRef: normalizeText(_0x102df3?.['sceneRef']),
        spokenSeconds: normalizeNonNegativeTimingNumber(_0x102df3?.['spokenSeconds']),
        nonOverlappingActionSeconds: normalizeNonNegativeTimingNumber(
          _0x102df3?.['nonOverlappingActionSeconds'],
        ),
        pauseAndTransitionSeconds: normalizeNonNegativeTimingNumber(_0x102df3?.['pauseAndTransitionSeconds']),
        concurrentActionNotes: normalizeText(_0x102df3?.['concurrentActionNotes']),
        totalSeconds: normalizePositiveNumber(_0x102df3?.['totalSeconds']),
        basis: normalizeText(_0x102df3?.['basis']),
      }))
      ['filter']((_0x598e6c) => _0x598e6c['sceneRef'] && _0x598e6c['totalSeconds']);
  return {
    basis: 'independent-script-timing-review',
    targetDurationSeconds: _0x5e46ae,
    reasonableRangeSeconds: { minimum: _0x179556, maximum: _0x485afd },
    allowedProductionRangeSeconds: { minimum: _0x2b0586, maximum: _0x5053c9 },
    sceneTimings: _0x3892f2,
  };
}
export function assertStoryEpisodeSplitTiming(_0x420b27 = {}, _0x2ca70e = {}) {
  const _0x23686a = resolveStoryEpisodeSplitTimingBudget(_0x2ca70e);
  if (!_0x23686a) return _0x420b27;
  const { minimum: _0x30efe3, maximum: _0xdbdc9c } = _0x23686a['reasonableRangeSeconds'],
    _0x3bee6a =
      normalizePositiveNumber(_0x420b27?.['totalDurationSeconds']) ||
      (Array['isArray'](_0x420b27?.['clips']) ? _0x420b27['clips'] : [])['reduce'](
        (_0x607786, _0x468a7c) => _0x607786 + (normalizePositiveNumber(_0x468a7c?.['durationSec']) || 0x0),
        0x0,
      ),
    { minimum: _0x5e18e1, maximum: _0x1b0b4a } = _0x23686a['allowedProductionRangeSeconds'];
  if (_0x3bee6a >= _0x5e18e1 && _0x3bee6a <= _0x1b0b4a) return _0x420b27;
  const _0x548d0f = new Error(
    '分镜总时长 ' +
      _0x3bee6a +
      ' 秒偏离本集正文独立审时区间 ' +
      _0x30efe3 +
      '-' +
      _0xdbdc9c +
      ' 秒（允许制作浮动 ' +
      _0x5e18e1 +
      '-' +
      _0x1b0b4a +
      ' 秒），本次结果未通过。',
  );
  ((_0x548d0f['code'] = 'STORY_EPISODE_SPLIT_TIMING_MISMATCH'),
    (_0x548d0f['timing'] = {
      totalDurationSeconds: _0x3bee6a,
      reasonableRangeSeconds: { minimum: _0x30efe3, maximum: _0xdbdc9c },
      allowedRangeSeconds: { minimum: _0x5e18e1, maximum: _0x1b0b4a },
    }));
  throw _0x548d0f;
}
function buildStoryEpisodeScriptTimingReviewPrompt({
  episode: episode = {},
  script: script = {},
  priorReview: priorReview = null,
} = {}) {
  return JSON['stringify']({
    task: 'review_story_episode_script_timing',
    schemaVersion: 0x2,
    reviewMode: priorReview ? 'challenge_previous_review' : 'independent',
    episode: {
      number: Math['max'](0x1, Math['trunc'](Number(episode?.['number']) || 0x1)),
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
function normalizeTimingReviewFinding(_0x3f67ea) {
  if (_0x3f67ea === null || _0x3f67ea === undefined) return '';
  if (typeof _0x3f67ea !== 'object' || Array['isArray'](_0x3f67ea)) return normalizeText(_0x3f67ea);
  const _0x53bb22 = normalizeText(
      _0x3f67ea['sceneRef'] || _0x3f67ea['scene'] || _0x3f67ea['location'] || _0x3f67ea['ref'],
    ),
    _0x56f0d8 = normalizeText(
      _0x3f67ea['issue'] || _0x3f67ea['problem'] || _0x3f67ea['description'] || _0x3f67ea['reason'],
    ),
    _0x17378c = normalizeText(_0x3f67ea['evidence'] || _0x3f67ea['example'] || _0x3f67ea['quote']),
    _0x28bb64 = normalizeText(_0x3f67ea['suggestion'] || _0x3f67ea['recommendation'] || _0x3f67ea['action']),
    _0x4ec292 = [
      _0x53bb22 ? '[' + _0x53bb22 + ']' : '',
      _0x56f0d8,
      _0x17378c ? '证据：' + _0x17378c : '',
      _0x28bb64 ? '建议：' + _0x28bb64 : '',
    ]['filter'](Boolean);
  if (_0x4ec292['length']) return _0x4ec292['join']('\x20');
  try {
    return normalizeText(JSON['stringify'](_0x3f67ea));
  } catch {
    return '';
  }
}
function normalizeNonNegativeTimingNumber(_0x3a00a6) {
  const _0x8eeeac = Number(_0x3a00a6);
  if (!Number['isFinite'](_0x8eeeac) || _0x8eeeac < 0x0) return null;
  return Number(_0x8eeeac['toFixed'](0x1));
}
function normalizeStoryEpisodeSceneTimings(_0xadf1be = {}, _0x3bb849 = {}, _0x2a782c = 0x0) {
  const _0xc59df7 = Array['isArray'](_0x3bb849?.['scenes']) ? _0x3bb849['scenes'] : [];
  if (!_0xc59df7['length']) return [];
  if (
    !Array['isArray'](_0xadf1be?.['sceneTimings']) ||
    _0xadf1be['sceneTimings']['length'] !== _0xc59df7['length']
  )
    throw new Error('时长审查 Agent 未返回覆盖全部场次的逐场时长账本。');
  const _0x1cf0bc = _0xc59df7['map']((_0x155f31, _0x7afd1d) => {
      const _0x40e746 = normalizeText(
          _0x155f31?.['ref'] || _0x155f31?.['sceneRef'] || 'scene-' + (_0x7afd1d + 0x1),
        ),
        _0x946fe6 = _0xadf1be['sceneTimings'][_0x7afd1d] || {},
        _0x3e9948 = normalizeText(_0x946fe6?.['sceneRef']);
      if (_0x3e9948 !== _0x40e746)
        throw new Error('时长审查\x20Agent\x20的逐场账本顺序或场次引用无效：应为\x20' + _0x40e746 + '。');
      const _0x52accc = normalizeNonNegativeTimingNumber(_0x946fe6?.['spokenSeconds']),
        _0xf33bfb = normalizeNonNegativeTimingNumber(_0x946fe6?.['nonOverlappingActionSeconds']),
        _0x5c2363 = normalizeNonNegativeTimingNumber(_0x946fe6?.['pauseAndTransitionSeconds']),
        _0x2ed281 = normalizePositiveNumber(_0x946fe6?.['totalSeconds']),
        _0x3beb7a = normalizeText(_0x946fe6?.['basis']);
      if (_0x52accc === null || _0xf33bfb === null || _0x5c2363 === null || !_0x2ed281 || !_0x3beb7a)
        throw new Error('时长审查 Agent 的 ' + _0x40e746 + ' 逐场账本不完整。');
      const _0x103dd6 = _0x52accc + _0xf33bfb + _0x5c2363,
        _0x176031 = Math['max'](0x2, _0x2ed281 * 0.05);
      if (Math['abs'](_0x103dd6 - _0x2ed281) > _0x176031)
        throw new Error('时长审查 Agent 的 ' + _0x40e746 + '\x20分项时间无法合计到本场总时长。');
      return {
        sceneRef: _0x3e9948,
        spokenSeconds: _0x52accc,
        nonOverlappingActionSeconds: _0xf33bfb,
        pauseAndTransitionSeconds: _0x5c2363,
        concurrentActionNotes: normalizeText(_0x946fe6?.['concurrentActionNotes']),
        totalSeconds: _0x2ed281,
        basis: _0x3beb7a,
      };
    }),
    _0x1a2f4d = _0x1cf0bc['reduce']((_0x382f48, _0x43108b) => _0x382f48 + _0x43108b['totalSeconds'], 0x0),
    _0x24705c = Math['max'](0x5, _0x2a782c * 0.05);
  if (Math['abs'](_0x1a2f4d - _0x2a782c) > _0x24705c)
    throw new Error('时长审查 Agent 的逐场总计与整集自然时长不一致。');
  return _0x1cf0bc;
}
export async function requestStoryEpisodeScriptTimingReview({
  request: _0x594f4b,
  requestPayload: requestPayload = {},
  episode: episode = {},
  script: script = {},
  onInvocation: onInvocation = null,
  attempt: attempt = 0x1,
  phase: phase = 'timing-review',
  priorReview: priorReview = null,
} = {}) {
  const _0x1fd99a = await invokeStoryGenerationRequest({
      request: _0x594f4b,
      requestPayload: {
        ...requestPayload,
        prompt: buildStoryEpisodeScriptTimingReviewPrompt({
          episode: episode,
          script: script,
          priorReview: priorReview,
        }),
        systemPrompt:
          '你是短剧分集剧本的独立时长审查员。只测量自然表演时长并诊断可定位的问题；不得改写、压缩或输出替代正文，不按固定字数或固定集长套模板。只返回严格\x20JSON。',
        temperature: 0.1,
        thinking: { type: 'disabled' },
        maxOutputTokens: 0x2000,
      },
      stepId: phase,
      attempt: attempt,
      onInvocation: onInvocation,
      serializeResponse: getResultText,
    }),
    _0x29def7 = parseStrictJson(getResultText(_0x1fd99a), '时长审查 Agent 未返回有效 JSON。'),
    _0x3ba8f4 = ['pass', 'needs_revision']['includes'](_0x29def7?.['verdict'])
      ? _0x29def7['verdict']
      : 'needs_revision',
    _0x268692 = normalizePositiveNumber(_0x29def7?.['naturalDurationSeconds']);
  if (!_0x268692) throw new Error('时长审查 Agent 未返回有效自然时长。');
  const _0x4a109e = normalizePositiveNumber(_0x29def7?.['reasonableRangeSeconds']?.['minimum']),
    _0x29d7cd = normalizePositiveNumber(_0x29def7?.['reasonableRangeSeconds']?.['maximum']);
  if (!_0x4a109e || !_0x29d7cd || _0x4a109e > _0x268692 || _0x29d7cd < _0x268692)
    throw new Error('时长审查 Agent 返回的自然时长区间无效。');
  let _0x64beab = normalizeText(_0x29def7?.['reason']),
    _0x361ac6 = Array['isArray'](_0x29def7?.['findings'])
      ? _0x29def7['findings']['map'](normalizeTimingReviewFinding)['filter'](Boolean)['slice'](0x0, 0xc)
      : [];
  if (_0x3ba8f4 !== 'pass' && (!_0x64beab || !_0x361ac6['length']))
    throw new Error('时长审查 Agent 的问题结论缺少可定位证据。');
  const _0x3602dc = normalizeStoryEpisodeSceneTimings(_0x29def7, script, _0x268692);
  return {
    verdict: _0x3ba8f4,
    naturalDurationSeconds: _0x268692,
    reasonableRangeSeconds: { minimum: _0x4a109e, maximum: _0x29d7cd },
    sceneTimings: _0x3602dc,
    reason: _0x64beab,
    findings: _0x361ac6,
  };
}
function isOutlineEstimateOutsideReview(_0x7671cd, _0x478272 = {}) {
  if (!_0x7671cd) return ![];
  const _0x3615bc = normalizePositiveNumber(_0x478272?.['reasonableRangeSeconds']?.['minimum']),
    _0x2e304c = normalizePositiveNumber(_0x478272?.['reasonableRangeSeconds']?.['maximum']);
  return !!_0x3615bc && !!_0x2e304c && (_0x7671cd < _0x3615bc || _0x7671cd > _0x2e304c);
}
function mergeTimingReviewFindings(..._0x530742) {
  return [...new Set(_0x530742['flat']()['map'](normalizeTimingReviewFinding)['filter'](Boolean))]['slice'](
    0x0,
    0xc,
  );
}
export function preserveStoryEpisodeScriptWithoutTimingReview(_0x221204, _0x5746f6, _0x581ab5 = null) {
  const _0x191265 = inspectStoryEpisodeScriptTiming(_0x221204, _0x5746f6),
    _0x16440c = normalizeText(_0x581ab5?.['message'] || _0x581ab5);
  return {
    ..._0x221204,
    timingReview: {
      verdict: 'timing_uncertain',
      naturalDurationSeconds: null,
      reasonableRangeSeconds: null,
      sceneTimings: [],
      reason: _0x16440c
        ? '时长审查未完成，已保留正文，不再阻塞本集。原因：' + _0x16440c
        : '时长审查未完成，已保留正文，不再阻塞本集。',
      findings: [],
      reviewPasses: 0x0,
      reviewAgreement: 'review-unavailable',
      outlineEstimateSeconds: _0x191265['outlineEstimateSeconds'] || null,
      outlineEstimateMismatch: ![],
      spokenUnits: _0x191265['spokenUnits'],
      minimumSpokenDurationSeconds: _0x191265['minimumSpokenDurationSeconds'],
    },
  };
}
export async function ensureStoryEpisodeScriptTiming({
  scriptResult: _0x4151d3,
  episode: _0x2bfbdf,
  review: _0xbb8872,
} = {}) {
  try {
    const _0x3b1e0c = inspectStoryEpisodeScriptTiming(_0x4151d3, _0x2bfbdf),
      _0x359e08 = await _0xbb8872(_0x4151d3, 'timing-review', null),
      _0x4a8273 =
        _0x3b1e0c['minimumSpokenDurationSeconds'] > 0x0 &&
        _0x359e08['reasonableRangeSeconds']['maximum'] < _0x3b1e0c['minimumSpokenDurationSeconds'],
      _0xe49648 = _0x359e08['verdict'] !== 'pass' || _0x4a8273;
    let _0x271636 = _0x359e08,
      _0x241cbc = 'single-pass';
    if (_0xe49648) {
      const _0x79a8d0 = await _0xbb8872(_0x4151d3, 'timing-recheck', _0x359e08),
        _0x45d879 = _0x359e08['reasonableRangeSeconds'],
        _0x3758c5 = _0x79a8d0['reasonableRangeSeconds'],
        _0x10bffd =
          Math['max'](_0x45d879['minimum'], _0x3758c5['minimum']) <=
          Math['min'](_0x45d879['maximum'], _0x3758c5['maximum']),
        _0x569f31 =
          _0x3b1e0c['minimumSpokenDurationSeconds'] > 0x0 &&
          _0x3758c5['maximum'] < _0x3b1e0c['minimumSpokenDurationSeconds'];
      if (_0x10bffd && !_0x569f31) {
        const _0x5bbf3e = _0x359e08['verdict'] === _0x79a8d0['verdict'],
          _0x25109c = _0x359e08['verdict'] === 'needs_revision' || _0x79a8d0['verdict'] === 'needs_revision';
        ((_0x271636 = _0x25109c
          ? {
              ..._0x79a8d0,
              verdict: 'needs_revision',
              reason: _0x5bbf3e
                ? _0x79a8d0['reason']
                : '两次审查对正文质量结论不一致；保留已定位的具体问题，正文不会自动改写。第二次审查：' +
                  _0x79a8d0['reason'],
              findings: mergeTimingReviewFindings(_0x359e08['findings'], _0x79a8d0['findings']),
            }
          : _0x79a8d0),
          (_0x241cbc = _0x5bbf3e ? 'overlapping-ranges' : 'quality-disagreement'));
      } else
        _0x10bffd
          ? ((_0x271636 = {
              ..._0x79a8d0,
              verdict: 'timing_uncertain',
              reason:
                '两次模型审时均低于对白本身至少需要的 ' +
                _0x3b1e0c['minimumSpokenDurationSeconds'] +
                ' 秒。当前只标记时长不确定，不改写正文，也不据此限制后续分镜。',
              findings: [..._0x79a8d0['findings'], _0x3b1e0c['reason']]['slice'](0x0, 0xc),
            }),
            (_0x241cbc = 'below-spoken-floor'))
          : ((_0x271636 = {
              ..._0x79a8d0,
              verdict: 'timing_uncertain',
              reason:
                '两次独立审时区间不重叠：第一次 ' +
                _0x45d879['minimum'] +
                '-' +
                _0x45d879['maximum'] +
                ' 秒，第二次 ' +
                _0x3758c5['minimum'] +
                '-' +
                _0x3758c5['maximum'] +
                ' 秒。当前只标记时长不确定，不改写正文，也不据此限制后续分镜。',
              findings: [..._0x79a8d0['findings'], '第一次审时：' + _0x359e08['reason']]['slice'](0x0, 0xc),
            }),
            (_0x241cbc = 'conflicting-ranges'));
    }
    const _0x4198c5 =
      _0x271636['verdict'] === 'pass' &&
      isOutlineEstimateOutsideReview(_0x3b1e0c['outlineEstimateSeconds'], _0x271636);
    return {
      ..._0x4151d3,
      timingReview: {
        ..._0x271636,
        reviewPasses: _0xe49648 ? 0x2 : 0x1,
        reviewAgreement: _0x241cbc,
        ...(_0xe49648 ? { previousReview: _0x359e08 } : {}),
        outlineEstimateSeconds: _0x3b1e0c['outlineEstimateSeconds'] || null,
        outlineEstimateMismatch: _0x4198c5,
        spokenUnits: _0x3b1e0c['spokenUnits'],
        minimumSpokenDurationSeconds: _0x3b1e0c['minimumSpokenDurationSeconds'],
      },
    };
  } catch (_0x6d1a79) {
    return preserveStoryEpisodeScriptWithoutTimingReview(_0x4151d3, _0x2bfbdf, _0x6d1a79);
  }
}
