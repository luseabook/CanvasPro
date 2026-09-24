import { isAgentConversationContinuation, isAgentCustomChoiceAnswer } from './agentConversationIntent.js';
function normalizeChoice(_0x185fdd) {
  if (!_0x185fdd || typeof _0x185fdd !== 'object') return null;
  const _0x2caced = String(_0x185fdd['question'] || '')
      ['trim']()
      ['slice'](0x0, 0x258),
    _0x3bd31a = new Set(),
    _0x1b10da = (Array['isArray'](_0x185fdd['options']) ? _0x185fdd['options'] : [])
      ['flatMap']((_0x5906ce) => {
        const _0x5bd036 = String(_0x5906ce?.['id'] || '')
            ['trim']()
            ['slice'](0x0, 0x50),
          _0x30efcf = String(_0x5906ce?.['label'] || '')
            ['trim']()
            ['slice'](0x0, 0xf0);
        if (!_0x5bd036 || !_0x30efcf || _0x3bd31a['has'](_0x5bd036)) return [];
        return (_0x3bd31a['add'](_0x5bd036), [{ id: _0x5bd036, label: _0x30efcf }]);
      })
      ['slice'](0x0, 0x3);
  return _0x2caced && _0x1b10da['length'] >= 0x2 ? { question: _0x2caced, options: _0x1b10da } : null;
}
export function normalizeAgentAssistantContext(_0x1bd0fc) {
  if (!_0x1bd0fc || typeof _0x1bd0fc !== 'object') return null;
  const _0x3a4156 = [
      ...new Set(
        (Array['isArray'](_0x1bd0fc['skillIds']) ? _0x1bd0fc['skillIds'] : [])['filter'](
          (_0x400cb9) => typeof _0x400cb9 === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/['test'](_0x400cb9),
        ),
      ),
    ]['slice'](0x0, 0x2),
    _0x28c76b = normalizeChoice(_0x1bd0fc['choice']);
  return { skillIds: _0x3a4156, ...(_0x28c76b ? { choice: _0x28c76b } : {}) };
}
export function normalizeAgentAssistantReply(_0xbbaf91) {
  let _0x308aad = String(
      typeof _0xbbaf91 === 'string' ? _0xbbaf91 : _0xbbaf91?.['reply'] || _0xbbaf91?.['message'] || '',
    )['trim'](),
    _0x2c5fde = normalizeChoice(_0xbbaf91?.['choice'] || _0xbbaf91);
  const _0x2bda6e = /(?:^|\n)```agent-choice\s*\n([\s\S]*?)\n```\s*$/u['exec'](_0x308aad);
  if (_0x2bda6e) {
    try {
      _0x2c5fde = normalizeChoice(JSON['parse'](_0x2bda6e[0x1]));
    } catch {
      _0x2c5fde = null;
    }
    _0x308aad = _0x308aad['slice'](0x0, _0x2bda6e['index'])['trim']();
  }
  if (_0x2c5fde && !_0x308aad['includes'](_0x2c5fde['question']))
    _0x308aad = [_0x308aad, _0x2c5fde['question']]['filter'](Boolean)['join']('\x0a\x0a');
  return { status: 'chat', reply: _0x308aad, ...(_0x2c5fde || {}) };
}
function latestConversationMessage(_0x4ce711 = []) {
  return (
    _0x4ce711['findLast']((_0x5e9577) => !_0x5e9577['messageType'] || _0x5e9577['messageType'] === 'text') ||
    null
  );
}
export function getAgentPendingAssistantChoice(_0x384ec7 = []) {
  const _0x21efd5 = latestConversationMessage(_0x384ec7);
  if (_0x21efd5?.['role'] !== 'assistant' || _0x21efd5['status'] !== 'chat') return null;
  const _0x4b33e5 = normalizeAgentAssistantContext(_0x21efd5['assistantContext'])?.['choice'];
  if (!_0x4b33e5) return null;
  return {
    ..._0x4b33e5,
    questionId:
      (_0x21efd5['itemId'] || _0x21efd5['turnId'] || _0x21efd5['ts'] + ':' + _0x384ec7['length']) +
      ':' +
      (_0x21efd5['replyVersions']?.['activeIndex'] || 0x0),
    responseChannel: 'assistant.message',
  };
}
export function getAgentContinuationSkillIds(_0x413378, _0x53383a = []) {
  const _0x3bc76e = getAgentPendingAssistantChoice(_0x53383a);
  if (!isAgentConversationContinuation(_0x413378) && !(_0x3bc76e && isAgentCustomChoiceAnswer(_0x413378)))
    return [];
  const _0x5c4026 = latestConversationMessage(_0x53383a);
  return _0x5c4026?.['role'] === 'assistant' && ['chat', 'stopped', 'failed']['includes'](_0x5c4026['status'])
    ? normalizeAgentAssistantContext(_0x5c4026['assistantContext'])?.['skillIds'] || []
    : [];
}
