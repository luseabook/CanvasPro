import { getResultText } from './storyTextRequest.js';
export async function requestStoryReviewRepairs({
  failedClips: _0x55cb37,
  buildPrompt: _0x5e1bfc,
  invoke: _0x4789bc,
  parseResponse: _0x196c64,
  stepId: _0x56306f,
  systemPrompt: _0x10114b,
}) {
  const _0x4a208f = new Map(),
    _0xf0f9f2 = 0x2;
  for (let _0x4907fd = 0x0; _0x4907fd < _0x55cb37['length']; _0x4907fd += _0xf0f9f2) {
    const _0x487d19 = _0x55cb37['slice'](_0x4907fd, _0x4907fd + _0xf0f9f2),
      _0x505845 =
        _0x55cb37['length'] > _0xf0f9f2 ? _0x56306f + ':chunk-' + (_0x4907fd / _0xf0f9f2 + 0x1) : _0x56306f,
      _0x221ff4 = await _0x4789bc({ prompt: _0x5e1bfc(_0x487d19), systemPrompt: _0x10114b }, _0x505845);
    for (const [_0x15488c, _0xe46009] of _0x196c64(
      _0x221ff4,
      _0x487d19['map']((_0x4960c1) => _0x4960c1['ref']),
    ))
      _0x4a208f['set'](_0x15488c, _0xe46009);
  }
  return _0x4a208f;
}
export async function invokeCheckpointedStoryReview({
  draft: _0x6806a6,
  key: _0x1130ac,
  invoke: _0x4704c2,
  checkpoint: _0x4c8c97,
}) {
  const _0xc32dfe = _0x6806a6['responses']?.[_0x1130ac];
  if (typeof _0xc32dfe === 'string') return { text: _0xc32dfe };
  try {
    const _0x4b63b5 = await _0x4704c2();
    return (
      (_0x6806a6['responses'] = { ...(_0x6806a6['responses'] || {}), [_0x1130ac]: getResultText(_0x4b63b5) }),
      await _0x4c8c97(),
      _0x4b63b5
    );
  } catch (_0x52e01c) {
    ((_0x6806a6['status'] = 'failed_retryable'),
      (_0x52e01c['storyReviewInterrupted'] = !![]),
      await _0x4c8c97());
    throw _0x52e01c;
  }
}
export function assertStoryReviewResolved(_0x236808, _0x49bf4c) {
  if (!_0x49bf4c['size']) return;
  ((_0x236808['status'] = 'failed_retryable'),
    (_0x236808['completedClips'] = null),
    (_0x236808['responses'] = {}));
  for (const _0x473d65 of _0x236808['batches']) {
    _0x473d65['clipRefs']['some']((_0x261e6a) => _0x49bf4c['has'](_0x261e6a)) &&
      (_0x473d65['status'] = Array['isArray'](_0x473d65['assessments']) ? 'reviewed' : 'pending');
  }
  throw new Error(
    '片段 ' + [..._0x49bf4c]['join']('、') + ' 尚未通过审片，已保留进度，可继续处理；未提交未通过的结果。',
  );
}
