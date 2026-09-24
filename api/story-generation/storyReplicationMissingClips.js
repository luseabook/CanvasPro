import { getResultText } from './storyTextRequest.js';
import { parseStrictJson } from '../utils/strictJson.js';
export async function completeReplicationMissingClips(_0x4542f5, _0x51d6d9, _0xa2667d) {
  let _0x44c10a, _0x55aaf0;
  try {
    ((_0x44c10a = JSON['parse'](_0x51d6d9['prompt'])),
      (_0x55aaf0 = parseStrictJson(getResultText(_0x4542f5))));
  } catch {
    return _0x4542f5;
  }
  const _0x1cec04 = _0x44c10a['sourceVideoEvidence']?.['segmentPlan'];
  if (!_0x1cec04?.['length'] || !Array['isArray'](_0x55aaf0['clips']) || !_0x55aaf0['clips']['length'])
    return _0x4542f5;
  const _0x19b7c0 = new Set(_0x1cec04['map']((_0x17f400) => _0x17f400['ref'])),
    _0x14b95f = new Map();
  for (const _0x1e4e37 of _0x55aaf0['clips']) {
    if (!_0x19b7c0['has'](_0x1e4e37['ref']) || _0x14b95f['has'](_0x1e4e37['ref'])) return _0x4542f5;
    _0x14b95f['set'](_0x1e4e37['ref'], _0x1e4e37);
  }
  const _0x1ffda5 = _0x1cec04['filter']((_0x527a31) => !_0x14b95f['has'](_0x527a31['ref']));
  if (!_0x1ffda5['length']) return _0x4542f5;
  const _0x51b6de = new Set(_0x1ffda5['map']((_0x6d93d) => _0x6d93d['ref'])),
    _0x332bc3 = structuredClone(_0x51d6d9);
  ((_0x44c10a['task'] = 'complete_missing_replication_clips'),
    (_0x44c10a['sourceVideoEvidence']['segmentPlan'] = _0x1ffda5));
  if (_0x44c10a['timingContract']?.['clips'])
    _0x44c10a['timingContract']['clips'] = _0x44c10a['timingContract']['clips']['filter']((_0x20a573) =>
      _0x51b6de['has'](_0x20a573['ref']),
    );
  ((_0x44c10a['requirements'] = [
    ...(_0x44c10a['requirements'] || []),
    '上次只返回了\x20' +
      [..._0x14b95f['keys']()]['join']('、') +
      '。本次只补齐 ' +
      [..._0x51b6de]['join']('、') +
      '，每个编号恰好一次；已返回片段由程序保留，不要重写或返回。原片时间、人声原文与素材沿用现有证据，不重新分析。',
  ]),
    (_0x332bc3['prompt'] = JSON['stringify'](_0x44c10a)));
  const _0x1cde50 = _0x332bc3['structuredOutput']?.['schema']?.['properties']?.['clips'];
  _0x1cde50 &&
    ((_0x1cde50['minItems'] = _0x1ffda5['length']),
    (_0x1cde50['maxItems'] = _0x1ffda5['length']),
    (_0x1cde50['items']['properties']['ref'] = { type: 'string', enum: [..._0x51b6de] }));
  const _0x4d8158 = (_0x4cf72a) =>
    Object['assign'](new Error(_0x4cf72a), {
      code: 'REPLICATION_MISSING_CLIPS',
      partialResponse: _0x4542f5,
      missingClipRefs: [..._0x51b6de],
    });
  let _0x3ed495;
  try {
    _0x3ed495 = parseStrictJson(getResultText(await _0xa2667d(_0x332bc3)));
  } catch (_0x579f6b) {
    throw Object['assign'](_0x4d8158('缺失片段补生成未完成，已返回片段保留：' + _0x579f6b['message']), {
      cause: _0x579f6b,
    });
  }
  if (!Array['isArray'](_0x3ed495['clips']) || _0x3ed495['clips']['length'] !== _0x1ffda5['length'])
    throw _0x4d8158('一次补生成后仍缺少片段，已返回内容保留，未继续重试。');
  const _0x140bb2 = new Map();
  for (const _0x1e86cb of _0x3ed495['clips']) {
    if (!_0x51b6de['has'](_0x1e86cb['ref']) || _0x140bb2['has'](_0x1e86cb['ref']))
      throw _0x4d8158('补生成包含重复或非缺失片段编号，未覆盖已返回内容。');
    _0x140bb2['set'](_0x1e86cb['ref'], _0x1e86cb);
  }
  const _0x25cc32 = JSON['stringify']({
    ..._0x55aaf0,
    clips: _0x1cec04['map'](
      (_0x311fd8) => _0x14b95f['get'](_0x311fd8['ref']) || _0x140bb2['get'](_0x311fd8['ref']),
    ),
  });
  return typeof _0x4542f5 === 'string' ? _0x25cc32 : { ..._0x4542f5, text: _0x25cc32 };
}
