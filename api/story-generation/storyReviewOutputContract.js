import { parseStrictJson } from '../utils/strictJson.js';
import { getResultText } from './storyTextRequest.js';
const text = (_0xe854a0) => String(_0xe854a0 || '')['trim']();
function normalizeAssessment(_0x1e4e45, _0xa0dcaf) {
  if (_0x1e4e45['issues'] != null && !Array['isArray'](_0x1e4e45['issues']))
    throw new Error('片段\x20' + _0xa0dcaf + ' 的 issues 必须是数组。');
  const _0x6f49f4 = (_0x1e4e45['issues'] || [])
    ['map']((_0x5314ed) => ({
      code: text(_0x5314ed?.['code']) || 'other',
      reason: text(_0x5314ed?.['reason']),
      repairInstruction: text(_0x5314ed?.['repairInstruction']),
    }))
    ['filter']((_0x85a881) => _0x85a881['reason'] || _0x85a881['repairInstruction']);
  if (
    !['pass', 'repair']['includes'](_0x1e4e45['verdict']) ||
    (_0x1e4e45['verdict'] === 'repair' && !_0x6f49f4['length'])
  )
    throw new Error('片段 ' + _0xa0dcaf + ' 的审片结论无效，不能视为通过。');
  if (_0x1e4e45['verdict'] === 'pass' && (_0x1e4e45['issues'] || [])['length'])
    throw new Error('片段\x20' + _0xa0dcaf + ' 的审片结论与问题列表矛盾。');
  return { clipRef: _0xa0dcaf, verdict: _0x1e4e45['verdict'], issues: _0x6f49f4 };
}
function inspectResponse(
  _0x302c90,
  { episodeRef: _0x227d60, batchRef: _0x52ce4f, refs: _0x4f0508, repair: repair = ![] },
) {
  const _0x57c5b8 = repair ? '修复' : '审片',
    _0x10581f = parseStrictJson(getResultText(_0x302c90), _0x57c5b8 + ' Agent 未返回有效 JSON。');
  for (const [_0x5f0a21, _0x810069] of Object['entries']({
    episodeRef: _0x227d60,
    ...(repair ? {} : { batchRef: _0x52ce4f }),
  })) {
    if (!text(_0x10581f?.[_0x5f0a21])) throw new Error(_0x57c5b8 + '结果缺少 ' + _0x5f0a21 + '。');
    if (text(_0x10581f[_0x5f0a21]) !== _0x810069)
      throw new Error(_0x57c5b8 + '结果与当前' + (_0x5f0a21 === 'episodeRef' ? '分集' : '批次') + '不一致。');
  }
  const _0x2b43ba = repair ? 'repairs' : 'assessments',
    _0x205cc0 = repair ? 'sourceClipRef' : 'clipRef';
  if (!Array['isArray'](_0x10581f[_0x2b43ba]))
    throw new Error(_0x57c5b8 + '结果缺少 ' + _0x2b43ba + ' 数组。');
  const _0x984fba = new Map();
  for (const _0x592d3a of _0x10581f[_0x2b43ba]) {
    const _0x15a014 = text(_0x592d3a?.[_0x205cc0]);
    if (!_0x4f0508['includes'](_0x15a014)) {
      if (repair) continue;
      throw new Error(_0x57c5b8 + '结果包含当前批次之外的片段\x20' + (_0x15a014 || '（空引用）') + '。');
    }
    _0x984fba['set'](_0x15a014, (_0x984fba['get'](_0x15a014) || 0x0) + 0x1);
  }
  const _0x173031 = {},
    _0xccfa45 = [];
  for (const _0x2117c8 of _0x4f0508) {
    if (!_0x984fba['has'](_0x2117c8)) {
      _0xccfa45['push'](_0x57c5b8 + '结果遗漏片段 ' + _0x2117c8 + '。');
      continue;
    }
    if (_0x984fba['get'](_0x2117c8) > 0x1) {
      _0xccfa45['push'](_0x57c5b8 + '结果包含重复片段引用 ' + _0x2117c8 + '。');
      continue;
    }
    const _0x406ad4 = _0x10581f[_0x2b43ba]['find']((_0xc1ca31) => text(_0xc1ca31?.[_0x205cc0]) === _0x2117c8);
    try {
      if (repair) {
        if (!Array['isArray'](_0x406ad4['clips']) || !_0x406ad4['clips']['length'])
          throw new Error('片段 ' + _0x2117c8 + ' 的修复结果缺少 clips。');
        _0x173031[_0x2117c8] = { sourceClipRef: _0x2117c8, clips: _0x406ad4['clips'] };
      } else _0x173031[_0x2117c8] = normalizeAssessment(_0x406ad4, _0x2117c8);
    } catch (_0x111812) {
      _0xccfa45['push'](_0x111812['message']);
    }
  }
  return { accepted: _0x173031, errors: _0xccfa45 };
}
export function parseReviewResponse(
  _0x292972,
  { episodeRef: _0x569387, batchRef: _0x5d334f, clipRefs: _0x460655 },
) {
  const _0xfc8d8e = inspectResponse(_0x292972, {
    episodeRef: _0x569387,
    batchRef: _0x5d334f,
    refs: _0x460655,
  });
  if (_0xfc8d8e['errors']['length']) throw new Error(_0xfc8d8e['errors']['join']('；'));
  return _0x460655['map']((_0x123151) => _0xfc8d8e['accepted'][_0x123151]);
}
export function parseRepairResponse(_0x22ede4, { episodeRef: _0x1fb0b7, failedClipRefs: _0x32809f }) {
  const _0x3508a4 = inspectResponse(_0x22ede4, { episodeRef: _0x1fb0b7, refs: _0x32809f, repair: !![] });
  if (_0x3508a4['errors']['length']) throw new Error(_0x3508a4['errors']['join']('；'));
  return new Map(_0x32809f['map']((_0x4fc1dd) => [_0x4fc1dd, _0x3508a4['accepted'][_0x4fc1dd]['clips']]));
}
function buildOutputTemplate(_0x15159c, _0x3b686d, _0x15dcef) {
  if (!_0x15dcef)
    return {
      episodeRef: _0x15159c['episodeRef'],
      batchRef: _0x15159c['batchRef'],
      assessments: _0x3b686d['map']((_0x8e8e7c) => ({
        clipRef: _0x8e8e7c,
        verdict: 'pass 或 repair（必须逐项实际评估）',
        issues: [
          { code: '问题代码；通过时 issues 为 []', reason: '具体问题', repairInstruction: '修改动作' },
        ],
      })),
    };
  return {
    episodeRef: _0x15159c['episodeRef'],
    repairs: _0x3b686d['map']((_0x3d9f88) => ({
      sourceClipRef: _0x3d9f88,
      clips: [
        {
          ...(_0x15159c['failedClips']['find']((_0x31008b) => _0x31008b['clip']['ref'] === _0x3d9f88)?.[
            'clip'
          ] || {}),
          ref: _0x3d9f88 + '-part-1',
        },
      ],
    })),
  };
}
export async function requestStoryReviewOutput({
  payload: _0x2bf0a6,
  stepId: _0x1d380b,
  key: _0x182578,
  draft: _0x4431e2,
  invoke: _0x975185,
  checkpoint: _0xaf59d5,
  onProgress: _0x38a067,
}) {
  const _0x3e447e = JSON['parse'](_0x2bf0a6['prompt']),
    _0x51fe2c = _0x3e447e['task'] === 'repair_story_episode_split_quality',
    _0x292d5d = (
      _0x51fe2c ? _0x3e447e['failedClips']['map']((_0x12688c) => _0x12688c['clip']) : _0x3e447e['clips']
    )['map']((_0x3e6de1) => _0x3e6de1['ref']),
    _0x4671d5 = _0x51fe2c ? 'repairs' : 'assessments',
    _0x52f75b = _0x4431e2['protocolProgress']?.[_0x182578] || { accepted: {}, attempt: 0x0, errors: [] };
  ((_0x4431e2['protocolProgress'] ||= {}), (_0x4431e2['protocolProgress'][_0x182578] = _0x52f75b));
  for (let _0x3f5537 = 0x0; _0x3f5537 < 0x3; _0x3f5537 += 0x1) {
    const _0x2636b9 = _0x292d5d['filter']((_0x181ca9) => !_0x52f75b['accepted'][_0x181ca9]);
    if (!_0x2636b9['length']) break;
    if (_0x52f75b['errors']['length'])
      _0x38a067?.({
        stage: 'reviewing-episode-split-quality',
        message:
          '正在补全' +
          (_0x51fe2c ? '修复' : '审片') +
          '返回格式，剩余 ' +
          _0x2636b9['length'] +
          ' 个片段（本轮 ' +
          (_0x3f5537 + 0x1) +
          '/3）',
      });
    const _0x4139a0 = {
        ..._0x3e447e,
        ...(_0x51fe2c
          ? {
              failedClips: _0x3e447e['failedClips']['filter']((_0x893db9) =>
                _0x2636b9['includes'](_0x893db9['clip']['ref']),
              ),
            }
          : { clips: _0x3e447e['clips']['filter']((_0x1c1524) => _0x2636b9['includes'](_0x1c1524['ref'])) }),
        requiredClipRefs: _0x2636b9,
        outputTemplate: buildOutputTemplate(_0x3e447e, _0x2636b9, _0x51fe2c),
        outputInstructions:
          '返回完整 JSON 对象，逐字保留 episodeRef 和 batchRef（审片时）。每个 requiredClipRefs 恰好返回一项。不得用顶层 passed/status/verdict 替代逐片段结果。模板字段必须填入实际判断或修复后的内容。',
        ...(_0x52f75b['errors']['length']
          ? {
              protocolCorrection: {
                errors: _0x52f75b['errors'],
                instruction: '仅补全当前缺失或无效条目的协议；已接收条目不要重复返回。审片不得重写分镜。',
              },
            }
          : {}),
      },
      _0x5946de = await _0x975185(
        { ..._0x2bf0a6, prompt: JSON['stringify'](_0x4139a0) },
        _0x1d380b + ':protocol-' + _0x52f75b['attempt'],
      );
    _0x52f75b['attempt'] += 0x1;
    try {
      const _0x1c72c7 = inspectResponse(_0x5946de, {
        episodeRef: _0x3e447e['episodeRef'],
        batchRef: _0x3e447e['batchRef'],
        refs: _0x2636b9,
        repair: _0x51fe2c,
      });
      (Object['assign'](_0x52f75b['accepted'], _0x1c72c7['accepted']),
        (_0x52f75b['errors'] = _0x1c72c7['errors']));
    } catch (_0x1fd0c6) {
      _0x52f75b['errors'] = [_0x1fd0c6['message']];
    }
    await _0xaf59d5();
  }
  const _0x5752d4 = _0x292d5d['filter']((_0x19a8cb) => !_0x52f75b['accepted'][_0x19a8cb]);
  if (_0x5752d4['length']) {
    const _0x1247f2 = new Error(
      '审片协议补全达到本轮上限，未解决片段\x20' +
        _0x5752d4['join']('、') +
        '：' +
        _0x52f75b['errors']['join']('；'),
    );
    _0x1247f2['code'] = 'STORY_REVIEW_PROTOCOL';
    throw _0x1247f2;
  }
  return (
    delete _0x4431e2['protocolProgress'][_0x182578],
    await _0xaf59d5(),
    {
      text: JSON['stringify']({
        episodeRef: _0x3e447e['episodeRef'],
        ...(_0x51fe2c ? {} : { batchRef: _0x3e447e['batchRef'] }),
        [_0x4671d5]: _0x292d5d['map']((_0x53db00) => _0x52f75b['accepted'][_0x53db00]),
      }),
    }
  );
}
