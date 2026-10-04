import {
  AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
  createAgentDocumentSource,
  validateAgentDocumentFile,
} from './agentDocumentInput.js';
const TOOL_ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$/;
function normalizeToolDefinition(inputSchema = {}) {
  const id = String(inputSchema['id'] || '')
    ['trim']()
    ['toLowerCase']();
  if (!TOOL_ID_PATTERN['test'](id))
    throw new TypeError('Invalid Agent external tool id: ' + (id || '<empty>'));
  if (typeof inputSchema['execute'] !== 'function')
    throw new TypeError('Agent\x20external\x20tool\x20' + id + '\x20must\x20provide\x20execute()');
  return Object['freeze']({
    id: id,
    title: String(inputSchema['title'] || id)
      ['trim']()
      ['slice'](0x0, 0x78),
    description: String(inputSchema['description'] || '')
      ['trim']()
      ['slice'](0x0, 0x1f4),
    inputSchema:
      inputSchema['inputSchema'] && typeof inputSchema['inputSchema'] === 'object'
        ? structuredClone(inputSchema['inputSchema'])
        : { type: 'object', properties: {}, additionalProperties: ![] },
    riskLevel: 'read_only',
    trust: String(inputSchema['trust'] || 'untrusted_external')['trim'](),
    execute: inputSchema['execute'],
    validate: typeof inputSchema['validate'] === 'function' ? inputSchema['validate'] : null,
  });
}
function normalizeToolError(error, value = 'EXTERNAL_TOOL_FAILED') {
  return {
    errorCode: String(error?.['code'] || error?.['errorCode'] || value)['trim'](),
    message: String(error?.['message'] || 'External tool failed.')['trim'](),
  };
}
function executeWithSignal(handler, item, signal2) {
  if (!signal2?.['addEventListener']) return Promise['resolve'](handler(item, { signal: signal2 }));
  return new Promise((handler2, handler3) => {
    const key = () => {
      const error2 = new Error('External tool request was cancelled.');
      ((error2['code'] = 'EXTERNAL_TOOL_ABORTED'), handler3(error2));
    };
    (signal2['addEventListener']('abort', key, { once: !![] }),
      Promise['resolve']()
        ['then'](() => handler(item, { signal: signal2 }))
        ['then'](
          (index) => {
            (signal2['removeEventListener']('abort', key), handler2(index));
          },
          (result) => {
            (signal2['removeEventListener']('abort', key), handler3(result));
          },
        ));
  });
}
export function createAgentExternalToolRegistry({ tools: tools = [] } = {}) {
  const map = new Map();
  function register(data) {
    const toolDefinition = normalizeToolDefinition(data);
    if (map['has'](toolDefinition['id']))
      throw new Error('Agent external tool already registered: ' + toolDefinition['id']);
    return (map['set'](toolDefinition['id'], toolDefinition), toolDefinition['id']);
  }
  for (const options of Array['isArray'](tools) ? tools : []) register(options);
  return {
    register: register,
    has(target) {
      return map['has'](
        String(target || '')
          ['trim']()
          ['toLowerCase'](),
      );
    },
    get(source) {
      return (
        map['get'](
          String(source || '')
            ['trim']()
            ['toLowerCase'](),
        ) || null
      );
    },
    list() {
      return [...map['values']()]['map']((id2) => ({
        id: id2['id'],
        title: id2['title'],
        description: id2['description'],
        inputSchema: structuredClone(id2['inputSchema']),
        riskLevel: id2['riskLevel'],
        trust: id2['trust'],
      }));
    },
    async execute({ toolId: toolId, args: args = {}, signal: signal = null } = {}) {
      const toolId2 = map['get'](
        String(toolId || '')
          ['trim']()
          ['toLowerCase'](),
      );
      if (!toolId2)
        return {
          ok: ![],
          status: 'failed',
          toolId: String(toolId || ''),
          errorCode: 'EXTERNAL_TOOL_NOT_FOUND',
          message: 'External tool is not registered.',
        };
      if (signal?.['aborted'])
        return {
          ok: ![],
          status: 'cancelled',
          toolId: toolId2['id'],
          errorCode: 'EXTERNAL_TOOL_ABORTED',
          message: 'External\x20tool\x20request\x20was\x20cancelled.',
        };
      try {
        const error3 = toolId2['validate']?.(args);
        if (error3 === ![] || error3?.['ok'] === ![])
          return {
            ok: ![],
            status: 'failed',
            toolId: toolId2['id'],
            errorCode: String(error3?.['errorCode'] || 'INVALID_EXTERNAL_TOOL_INPUT'),
            message: String(error3?.['message'] || 'External\x20tool\x20input\x20is\x20invalid.'),
          };
        const result2 = await executeWithSignal(toolId2['execute'], args, signal);
        if (result2?.['success'] === ![] || result2?.['ok'] === ![])
          return {
            ok: ![],
            status: 'failed',
            toolId: toolId2['id'],
            errorCode: String(result2['errorCode'] || 'EXTERNAL_TOOL_FAILED'),
            message: String(result2['message'] || result2['error'] || 'External tool failed.'),
          };
        return { ok: !![], status: 'success', toolId: toolId2['id'], result: result2 };
      } catch (next) {
        return {
          ok: ![],
          status: signal?.['aborted'] ? 'cancelled' : 'failed',
          toolId: toolId2['id'],
          ...normalizeToolError(next, signal?.['aborted'] ? 'EXTERNAL_TOOL_ABORTED' : 'EXTERNAL_TOOL_FAILED'),
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
          additionalProperties: ![],
        },
        validate(response = {}) {
          return String(response['url'] || '')['trim']()
            ? !![]
            : { ok: ![], errorCode: 'URL_REQUIRED', message: 'URL is required.' };
        },
        execute(url) {
          if (typeof readUrl !== 'function')
            return {
              success: ![],
              errorCode: 'URL_READER_UNAVAILABLE',
              message: 'URL reading is unavailable in this runtime.',
            };
          return readUrl({ url: url['url'] });
        },
      },
      {
        id: AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
        title: 'Read document',
        description:
          'Extract\x20bounded\x20text\x20from\x20one\x20attached\x20TXT,\x20DOCX,\x20or\x20text-based\x20PDF\x20file.',
        trust: 'untrusted_external',
        inputSchema: {
          type: 'object',
          properties: { file: { type: 'object' } },
          required: ['file'],
          additionalProperties: ![],
        },
        validate(options2 = {}) {
          const message = validateAgentDocumentFile(options2['file'], validateDocument);
          return message['ok']
            ? !![]
            : { ok: ![], errorCode: 'DOCUMENT_FILE_INVALID', message: message['error'] };
        },
        async execute(current, { signal: signal3 } = {}) {
          if (typeof readDocument !== 'function')
            return {
              success: ![],
              errorCode: 'DOCUMENT_READER_UNAVAILABLE',
              message: '文档读取在当前运行环境中不可用。',
            };
          const entry = await readDocument(current['file'], { signal: signal3 });
          return { success: !![], source: createAgentDocumentSource(entry, current['file']) };
        },
      },
    ],
  });
}
