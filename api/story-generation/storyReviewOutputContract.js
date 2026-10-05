import { parseStrictJson } from '../utils/strictJson.js';
import { getResultText } from './storyTextRequest.js';
const text = (value) => String(value || '')['trim']();
function normalizeAssessment(verdict, clipRef) {
  if (verdict['issues'] != null && !Array['isArray'](verdict['issues']))
    throw new Error('片段 ' + clipRef + ' 的 issues 必须是数组。');
  const issues = (verdict['issues'] || [])
    ['map']((item) => ({
      code: text(item?.['code']) || 'other',
      reason: text(item?.['reason']),
      repairInstruction: text(item?.['repairInstruction']),
    }))
    ['filter']((key) => key['reason'] || key['repairInstruction']);
  if (
    !['pass', 'repair']['includes'](verdict['verdict']) ||
    (verdict['verdict'] === 'repair' && !issues['length'])
  )
    throw new Error('片段 ' + clipRef + ' 的审片结论无效，不能视为通过。');
  if (verdict['verdict'] === 'pass' && (verdict['issues'] || [])['length'])
    throw new Error('片段 ' + clipRef + ' 的审片结论与问题列表矛盾。');
  return { clipRef: clipRef, verdict: verdict['verdict'], issues: issues };
}
function inspectResponse(
  index,
  { episodeRef: episodeRef, batchRef: batchRef, refs: refs, repair: repair = ![] },
) {
  const result = repair ? '修复' : '审片',
    strictJson = parseStrictJson(getResultText(index), result + ' Agent 未返回有效 JSON。');
  for (const [data, options] of Object['entries']({
    episodeRef: episodeRef,
    ...(repair ? {} : { batchRef: batchRef }),
  })) {
    if (!text(strictJson?.[data])) throw new Error(result + '结果缺少 ' + data + '。');
    if (text(strictJson[data]) !== options)
      throw new Error(result + '结果与当前' + (data === 'episodeRef' ? '分集' : '批次') + '不一致。');
  }
  const target = repair ? 'repairs' : 'assessments',
    source = repair ? 'sourceClipRef' : 'clipRef';
  if (!Array['isArray'](strictJson[target])) throw new Error(result + '结果缺少 ' + target + ' 数组。');
  const map = new Map();
  for (const next of strictJson[target]) {
    const text2 = text(next?.[source]);
    if (!refs['includes'](text2)) {
      if (repair) continue;
      throw new Error(result + '结果包含当前批次之外的片段 ' + (text2 || '（空引用）') + '。');
    }
    map['set'](text2, (map['get'](text2) || 0) + 1);
  }
  const accepted2 = {},
    errors2 = [];
  for (const sourceClipRef of refs) {
    if (!map['has'](sourceClipRef)) {
      errors2['push'](result + '结果遗漏片段 ' + sourceClipRef + '。');
      continue;
    }
    if (map['get'](sourceClipRef) > 1) {
      errors2['push'](result + '结果包含重复片段引用 ' + sourceClipRef + '。');
      continue;
    }
    const clips = strictJson[target]['find']((current) => text(current?.[source]) === sourceClipRef);
    try {
      if (repair) {
        if (!Array['isArray'](clips['clips']) || !clips['clips']['length'])
          throw new Error('片段 ' + sourceClipRef + ' 的修复结果缺少 clips。');
        accepted2[sourceClipRef] = { sourceClipRef: sourceClipRef, clips: clips['clips'] };
      } else accepted2[sourceClipRef] = normalizeAssessment(clips, sourceClipRef);
    } catch (error) {
      errors2['push'](error['message']);
    }
  }
  return { accepted: accepted2, errors: errors2 };
}
export function parseReviewResponse(
  entry,
  { episodeRef: episodeRef2, batchRef: batchRef2, clipRefs: clipRefs },
) {
  const inspectResponse2 = inspectResponse(entry, {
    episodeRef: episodeRef2,
    batchRef: batchRef2,
    refs: clipRefs,
  });
  if (inspectResponse2['errors']['length']) throw new Error(inspectResponse2['errors']['join']('；'));
  return clipRefs['map']((record) => inspectResponse2['accepted'][record]);
}
export function parseRepairResponse(payload, { episodeRef: episodeRef3, failedClipRefs: failedClipRefs }) {
  const inspectResponse3 = inspectResponse(payload, {
    episodeRef: episodeRef3,
    refs: failedClipRefs,
    repair: !![],
  });
  if (inspectResponse3['errors']['length']) throw new Error(inspectResponse3['errors']['join']('；'));
  return new Map(failedClipRefs['map']((handle) => [handle, inspectResponse3['accepted'][handle]['clips']]));
}
function buildOutputTemplate(episodeRef4, assessments, enabled) {
  if (!enabled)
    return {
      episodeRef: episodeRef4['episodeRef'],
      batchRef: episodeRef4['batchRef'],
      assessments: assessments['map']((clipRef2) => ({
        clipRef: clipRef2,
        verdict: 'pass 或 repair（必须逐项实际评估）',
        issues: [
          { code: '问题代码；通过时 issues 为 []', reason: '具体问题', repairInstruction: '修改动作' },
        ],
      })),
    };
  return {
    episodeRef: episodeRef4['episodeRef'],
    repairs: assessments['map']((sourceClipRef2) => ({
      sourceClipRef: sourceClipRef2,
      clips: [
        {
          ...(episodeRef4['failedClips']['find']((state) => state['clip']['ref'] === sourceClipRef2)?.[
            'clip'
          ] || {}),
          ref: sourceClipRef2 + '-part-1',
        },
      ],
    })),
  };
}
export async function requestStoryReviewOutput({
  payload: payload2,
  stepId: stepId,
  key: key2,
  draft: draft,
  invoke: invoke,
  checkpoint: checkpoint,
  onProgress: onProgress,
}) {
  const failedClips = JSON['parse'](payload2['prompt']),
    repair2 = failedClips['task'] === 'repair_story_episode_split_quality',
    list = (repair2 ? failedClips['failedClips']['map']((config) => config['clip']) : failedClips['clips'])[
      'map'
    ]((scope) => scope['ref']),
    input = repair2 ? 'repairs' : 'assessments',
    errors3 = draft['protocolProgress']?.[key2] || { accepted: {}, attempt: 0, errors: [] };
  ((draft['protocolProgress'] ||= {}), (draft['protocolProgress'][key2] = errors3));
  for (let count = 0; count < 3; count += 1) {
    const requiredClipRefs = list['filter']((output) => !errors3['accepted'][output]);
    if (!requiredClipRefs['length']) break;
    if (errors3['errors']['length'])
      onProgress?.({
        stage: 'reviewing-episode-split-quality',
        message:
          '正在补全' +
          (repair2 ? '修复' : '审片') +
          '返回格式，剩余 ' +
          requiredClipRefs['length'] +
          ' 个片段（本轮 ' +
          (count + 1) +
          '/3）',
      });
    const value2 = {
        ...failedClips,
        ...(repair2
          ? {
              failedClips: failedClips['failedClips']['filter']((value3) =>
                requiredClipRefs['includes'](value3['clip']['ref']),
              ),
            }
          : {
              clips: failedClips['clips']['filter']((value4) => requiredClipRefs['includes'](value4['ref'])),
            }),
        requiredClipRefs: requiredClipRefs,
        outputTemplate: buildOutputTemplate(failedClips, requiredClipRefs, repair2),
        outputInstructions:
          '返回完整 JSON 对象，逐字保留 episodeRef 和 batchRef（审片时）。每个 requiredClipRefs 恰好返回一项。不得用顶层 passed/status/verdict 替代逐片段结果。模板字段必须填入实际判断或修复后的内容。',
        ...(errors3['errors']['length']
          ? {
              protocolCorrection: {
                errors: errors3['errors'],
                instruction: '仅补全当前缺失或无效条目的协议；已接收条目不要重复返回。审片不得重写分镜。',
              },
            }
          : {}),
      },
      value5 = await invoke(
        { ...payload2, prompt: JSON['stringify'](value2) },
        stepId + ':protocol-' + errors3['attempt'],
      );
    errors3['attempt'] += 1;
    try {
      const inspectResponse4 = inspectResponse(value5, {
        episodeRef: failedClips['episodeRef'],
        batchRef: failedClips['batchRef'],
        refs: requiredClipRefs,
        repair: repair2,
      });
      (Object['assign'](errors3['accepted'], inspectResponse4['accepted']),
        (errors3['errors'] = inspectResponse4['errors']));
    } catch (error2) {
      errors3['errors'] = [error2['message']];
    }
    await checkpoint();
  }
  const list2 = list['filter']((value6) => !errors3['accepted'][value6]);
  if (list2['length']) {
    const error3 = new Error(
      '审片协议补全达到本轮上限，未解决片段 ' +
        list2['join']('、') +
        '：' +
        errors3['errors']['join']('；'),
    );
    error3['code'] = 'STORY_REVIEW_PROTOCOL';
    throw error3;
  }
  return (
    delete draft['protocolProgress'][key2],
    await checkpoint(),
    {
      text: JSON['stringify']({
        episodeRef: failedClips['episodeRef'],
        ...(repair2 ? {} : { batchRef: failedClips['batchRef'] }),
        [input]: list['map']((value7) => errors3['accepted'][value7]),
      }),
    }
  );
}
