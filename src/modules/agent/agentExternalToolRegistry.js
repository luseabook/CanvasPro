import {
  AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
  createAgentDocumentSource,
  validateAgentDocumentFile,
} from './agentDocumentInput.js';
const TOOL_ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$/;
function normalizeToolDefinition(inputSchema = {}) {
  const id = String(inputSchema.id || '')
    .trim()
    .toLowerCase();
  if (!TOOL_ID_PATTERN.test(id))
    throw new TypeError('Invalid Agent external tool id: ' + (id || '<empty>'));
  if (typeof inputSchema.execute !== 'function')
    throw new TypeError('Agent external tool ' + id + ' must provide execute()');
  return Object.freeze({
    id: id,
    title: String(inputSchema.title || id)
      .trim()
      .slice(0, 120),
    description: String(inputSchema.description || '')
      .trim()
      .slice(0, 500),
    inputSchema:
      inputSchema.inputSchema && typeof inputSchema.inputSchema === 'object'
        ? structuredClone(inputSchema.inputSchema)
        : { type: 'object', properties: {}, additionalProperties: false },
    riskLevel: 'read_only',
    trust: String(inputSchema.trust || 'untrusted_external').trim(),
    execute: inputSchema.execute,
    validate: typeof inputSchema.validate === 'function' ? inputSchema.validate : null,
  });
}
function normalizeToolError(error, value = 'EXTERNAL_TOOL_FAILED') {
  return {
    errorCode: String(error?.code || error?.errorCode || value).trim(),
    message: String(error?.message || 'External tool failed.').trim(),
  };
}
function executeWithSignal(handler, item, signal2) {
  if (!signal2?.addEventListener) return Promise.resolve(handler(item, { signal: signal2 }));
  return new Promise((handler2, handler3) => {
    const key = () => {
      const error2 = new Error('External tool request was cancelled.');
      ((error2.code = 'EXTERNAL_TOOL_ABORTED'), handler3(error2));
    };
    (signal2.addEventListener('abort', key, { once: true }),
      Promise.resolve()
        .then(() => handler(item, { signal: signal2 }))
        .then(
          (index) => {
            (signal2.removeEventListener('abort', key), handler2(index));
          },
          (result) => {
            (signal2.removeEventListener('abort', key), handler3(result));
          },
        ));
  });
}
export function createAgentExternalToolRegistry({ tools: tools = [] } = {}) {
  const map = new Map();
  function register(data) {
    const toolDefinition = normalizeToolDefinition(data);
    if (map.has(toolDefinition.id))
      throw new Error('Agent external tool already registered: ' + toolDefinition.id);
    return (map.set(toolDefinition.id, toolDefinition), toolDefinition.id);
  }
  for (const options of Array.isArray(tools) ? tools : []) register(options);
  return {
    register: register,
    has(target) {
      return map.has(
        String(target || '')
          .trim()
          .toLowerCase(),
      );
    },
    get(source) {
      return (
        map.get(
          String(source || '')
            .trim()
            .toLowerCase(),
        ) || null
      );
    },
    list() {
      return [...map.values()].map((id2) => ({
        id: id2.id,
        title: id2.title,
        description: id2.description,
        inputSchema: structuredClone(id2.inputSchema),
        riskLevel: id2.riskLevel,
        trust: id2.trust,
      }));
    },
    async execute({ toolId: toolId, args: args = {}, signal: signal = null } = {}) {
      const toolId2 = map.get(
        String(toolId || '')
          .trim()
          .toLowerCase(),
      );
      if (!toolId2)
        return {
          ok: false,
          status: 'failed',
          toolId: String(toolId || ''),
          errorCode: 'EXTERNAL_TOOL_NOT_FOUND',
          message: 'External tool is not registered.',
        };
      if (signal?.aborted)
        return {
          ok: false,
          status: 'cancelled',
          toolId: toolId2.id,
          errorCode: 'EXTERNAL_TOOL_ABORTED',
          message: 'External tool request was cancelled.',
        };
      try {
        const error3 = toolId2.validate?.(args);
        if (error3 === false || error3?.ok === false)
          return {
            ok: false,
            status: 'failed',
            toolId: toolId2.id,
            errorCode: String(error3?.errorCode || 'INVALID_EXTERNAL_TOOL_INPUT'),
            message: String(error3?.message || 'External tool input is invalid.'),
          };
        const result2 = await executeWithSignal(toolId2.execute, args, signal);
        if (result2?.success === false || result2?.ok === false)
          return {
            ok: false,
            status: 'failed',
            toolId: toolId2.id,
            errorCode: String(result2.errorCode || 'EXTERNAL_TOOL_FAILED'),
            message: String(result2.message || result2.error || 'External tool failed.'),
          };
        return { ok: true, status: 'success', toolId: toolId2.id, result: result2 };
      } catch (next) {
        return {
          ok: false,
          status: signal?.aborted ? 'cancelled' : 'failed',
          toolId: toolId2.id,
          ...normalizeToolError(next, signal?.aborted ? 'EXTERNAL_TOOL_ABORTED' : 'EXTERNAL_TOOL_FAILED'),
        };
      }
    },
  };
}
export function createDefaultAgentExternalToolRegistry({
  readUrl: readUrl,
  readDocument: readDocument,
  validateDocument: validateDocument,
} = {}) {
  return createAgentExternalToolRegistry({
    tools: [
      {
        id: 'web.read_url',
        title: 'Read URL',
        description: 'Read bounded text content from one public HTTP or HTTPS URL.',
        trust: 'untrusted_external',
        inputSchema: {
          type: 'object',
          properties: { url: { type: 'string', format: 'uri' } },
          required: ['url'],
          additionalProperties: false,
        },
        validate(response = {}) {
          return String(response.url || '').trim()
            ? true
            : { ok: false, errorCode: 'URL_REQUIRED', message: 'URL is required.' };
        },
        execute(url) {
          if (typeof readUrl !== 'function')
            return {
              success: false,
              errorCode: 'URL_READER_UNAVAILABLE',
              message: 'URL reading is unavailable in this runtime.',
            };
          return readUrl({ url: url.url });
        },
      },
      {
        id: AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
        title: 'Read document',
        description:
          'Extract bounded text from one attached TXT, DOCX, or text-based PDF file.',
        trust: 'untrusted_external',
        inputSchema: {
          type: 'object',
          properties: { file: { type: 'object' } },
          required: ['file'],
          additionalProperties: false,
        },
        validate(options2 = {}) {
          const message = validateAgentDocumentFile(options2.file, validateDocument);
          return message.ok
            ? true
            : { ok: false, errorCode: 'DOCUMENT_FILE_INVALID', message: message.error };
        },
        async execute(current, { signal: signal3 } = {}) {
          if (typeof readDocument !== 'function')
            return {
              success: false,
              errorCode: 'DOCUMENT_READER_UNAVAILABLE',
              message: '文档读取在当前运行环境中不可用。',
            };
          const entry = await readDocument(current.file, { signal: signal3 });
          return { success: true, source: createAgentDocumentSource(entry, current.file) };
        },
      },
    ],
  });
}
