import { createCanvasCommandError } from './commandRegistry.js';
import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
const PROMPT_NODE_TYPES = new Set(['ai-text', 'ai-image', 'ai-video', 'ai-audio', 'storyboard-script']);
function getState(value) {
  return value.store?.getStateRaw?.() || value.store?.getState?.() || {};
}
function getNode(item, key) {
  const index = String(key || '').trim();
  return index ? getState(item).nodes?.[index] || null : null;
}
function joinPromptHtml(result, data) {
  const sanitizePromptHtmlForCommit2 = sanitizePromptHtmlForCommit(String(result || '')),
    sanitizePromptHtmlForCommit3 = sanitizePromptHtmlForCommit(String(data || ''));
  if (!sanitizePromptHtmlForCommit2) return sanitizePromptHtmlForCommit3;
  if (!sanitizePromptHtmlForCommit3) return sanitizePromptHtmlForCommit2;
  return sanitizePromptHtmlForCommit(sanitizePromptHtmlForCommit2 + '<br>' + sanitizePromptHtmlForCommit3);
}
export function registerPromptCommands(options) {
  function run({ id: id, defaultMode: defaultMode, description: description }) {
    options.register({
      id: id,
      description: description,
      riskLevel: 'safe',
      argsSchema: {
        required: ['nodeId', 'text'],
        properties: {
          nodeId: { type: 'string' },
          text: { type: 'string' },
          mode: { type: 'string', enum: ['replace', 'append'] },
        },
        defaults: { mode: defaultMode || 'replace' },
      },
      capabilitySchema: { reads: ['nodes'], writes: ['nodes'] },
      returnSchema: { aliasFields: ['nodeId', 'prompt', 'mode'] },
      validate(response = {}, target = {}) {
        const nodeId = String(response.nodeId || '').trim();
        if (!nodeId) return { ok: false, errorCode: 'MISSING_NODE_ID', message: id + ' requires nodeId.' };
        const node = getNode(target, nodeId);
        if (!node)
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId };
        if (!PROMPT_NODE_TYPES.has(String(node.type || '').trim()))
          return {
            ok: false,
            errorCode: 'PROMPT_UNSUPPORTED_NODE',
            message: 'Canvas node does not support prompts: ' + nodeId,
          };
        const mode = defaultMode || (response.mode === 'append' ? 'append' : 'replace');
        if (!Object.prototype.hasOwnProperty.call(response, 'text'))
          return { ok: false, errorCode: 'MISSING_PROMPT_TEXT', message: id + ' requires text.' };
        return { args: { nodeId: nodeId, text: String(response.text || ''), mode: mode } };
      },
      execute(nodeId2, store) {
        const node2 = getNode(store, nodeId2.nodeId);
        if (!node2)
          throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + nodeId2.nodeId, {
            nodeId: nodeId2.nodeId,
          });
        const prompt =
          nodeId2.mode === 'append'
            ? joinPromptHtml(node2.prompt, nodeId2.text)
            : sanitizePromptHtmlForCommit(nodeId2.text);
        return (
          store.store?.updateNodeData?.(nodeId2.nodeId, { prompt: prompt }),
          store.commit?.(),
          { nodeId: nodeId2.nodeId, prompt: prompt, mode: nodeId2.mode }
        );
      },
    });
  }
  (run({ id: 'node.setPrompt', riskLevel: 'safe', description: 'Set a generation node prompt.' }),
    run({
      id: 'node.appendPrompt',
      defaultMode: 'append',
      description: 'Append to a generation node prompt.',
    }));
}
