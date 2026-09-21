import { createCanvasCommandError } from './commandRegistry.js';
import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
const PROMPT_NODE_TYPES = new Set(['ai-text', 'ai-image', 'ai-video', 'ai-audio', 'storyboard-script']);
function getState(_0x545ba7) {
  return _0x545ba7.store?.getStateRaw?.() || _0x545ba7.store?.getState?.() || {};
}
function getNode(_0x226e8a, _0x44eded) {
  const _0x5326e8 = String(_0x44eded || '').trim();
  return _0x5326e8 ? getState(_0x226e8a).nodes?.[_0x5326e8] || null : null;
}
function joinPromptHtml(_0x53415a, _0x131de4) {
  const _0x576ed2 = sanitizePromptHtmlForCommit(String(_0x53415a || '')),
    _0x5d12c6 = sanitizePromptHtmlForCommit(String(_0x131de4 || ''));
  if (!_0x576ed2) return _0x5d12c6;
  if (!_0x5d12c6) return _0x576ed2;
  return sanitizePromptHtmlForCommit(_0x576ed2 + '<br>' + _0x5d12c6);
}
export function registerPromptCommands(_0x28b26e) {
  function _0x546a63({ id: _0x1bb38d, defaultMode: _0x296f52, description: _0x77589f }) {
    _0x28b26e.register({
      id: _0x1bb38d,
      description: _0x77589f,
      riskLevel: 'safe',
      argsSchema: {
        required: ['nodeId', 'text'],
        properties: {
          nodeId: { type: 'string' },
          text: { type: 'string' },
          mode: { type: 'string', enum: ['replace', 'append'] },
        },
        defaults: { mode: _0x296f52 || 'replace' },
      },
      capabilitySchema: { reads: ['nodes'], writes: ['nodes'] },
      returnSchema: { aliasFields: ['nodeId', 'prompt', 'mode'] },
      validate(_0x13ddd8 = {}, _0x3a9e52 = {}) {
        const _0x4b1a25 = String(_0x13ddd8.nodeId || '').trim();
        if (!_0x4b1a25)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: _0x1bb38d + ' requires nodeId.' };
        const _0x24d88d = getNode(_0x3a9e52, _0x4b1a25);
        if (!_0x24d88d)
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + _0x4b1a25 };
        if (!PROMPT_NODE_TYPES.has(String(_0x24d88d.type || '').trim()))
          return {
            ok: false,
            errorCode: 'PROMPT_UNSUPPORTED_NODE',
            message: 'Canvas node does not support prompts: ' + _0x4b1a25,
          };
        const _0x597c56 = _0x296f52 || (_0x13ddd8.mode === 'append' ? 'append' : 'replace');
        if (!Object.prototype.hasOwnProperty.call(_0x13ddd8, 'text'))
          return { ok: false, errorCode: 'MISSING_PROMPT_TEXT', message: _0x1bb38d + ' requires text.' };
        return { args: { nodeId: _0x4b1a25, text: String(_0x13ddd8.text || ''), mode: _0x597c56 } };
      },
      execute(_0x27c7b2, _0x39832b) {
        const _0x57a2bb = getNode(_0x39832b, _0x27c7b2.nodeId);
        if (!_0x57a2bb)
          throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + _0x27c7b2.nodeId, {
            nodeId: _0x27c7b2.nodeId,
          });
        const _0x4927a4 =
          _0x27c7b2.mode === 'append'
            ? joinPromptHtml(_0x57a2bb.prompt, _0x27c7b2.text)
            : sanitizePromptHtmlForCommit(_0x27c7b2.text);
        return (
          _0x39832b.store?.updateNodeData?.(_0x27c7b2.nodeId, { prompt: _0x4927a4 }),
          _0x39832b.commit?.(),
          { nodeId: _0x27c7b2.nodeId, prompt: _0x4927a4, mode: _0x27c7b2.mode }
        );
      },
    });
  }
  (_0x546a63({ id: 'node.setPrompt', riskLevel: 'safe', description: 'Set a generation node prompt.' }),
    _0x546a63({
      id: 'node.appendPrompt',
      defaultMode: 'append',
      description: 'Append to a generation node prompt.',
    }));
}
