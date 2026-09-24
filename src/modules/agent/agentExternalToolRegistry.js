import {
  AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
  createAgentDocumentSource,
  validateAgentDocumentFile,
} from './agentDocumentInput.js';
const TOOL_ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$/;
function normalizeToolDefinition(_0x5068eb = {}) {
  const _0x445a77 = String(_0x5068eb['id'] || '')
    ['trim']()
    ['toLowerCase']();
  if (!TOOL_ID_PATTERN['test'](_0x445a77))
    throw new TypeError('Invalid Agent external tool id: ' + (_0x445a77 || '<empty>'));
  if (typeof _0x5068eb['execute'] !== 'function')
    throw new TypeError('Agent\x20external\x20tool\x20' + _0x445a77 + '\x20must\x20provide\x20execute()');
  return Object['freeze']({
    id: _0x445a77,
    title: String(_0x5068eb['title'] || _0x445a77)
      ['trim']()
      ['slice'](0x0, 0x78),
    description: String(_0x5068eb['description'] || '')
      ['trim']()
      ['slice'](0x0, 0x1f4),
    inputSchema:
      _0x5068eb['inputSchema'] && typeof _0x5068eb['inputSchema'] === 'object'
        ? structuredClone(_0x5068eb['inputSchema'])
        : { type: 'object', properties: {}, additionalProperties: ![] },
    riskLevel: 'read_only',
    trust: String(_0x5068eb['trust'] || 'untrusted_external')['trim'](),
    execute: _0x5068eb['execute'],
    validate: typeof _0x5068eb['validate'] === 'function' ? _0x5068eb['validate'] : null,
  });
}
function normalizeToolError(_0x15bf9c, _0x4edbda = 'EXTERNAL_TOOL_FAILED') {
  return {
    errorCode: String(_0x15bf9c?.['code'] || _0x15bf9c?.['errorCode'] || _0x4edbda)['trim'](),
    message: String(_0x15bf9c?.['message'] || 'External tool failed.')['trim'](),
  };
}
function executeWithSignal(_0x1ca903, _0x4ecae2, _0x13bc67) {
  if (!_0x13bc67?.['addEventListener'])
    return Promise['resolve'](_0x1ca903(_0x4ecae2, { signal: _0x13bc67 }));
  return new Promise((_0x25bf83, _0x4a4e45) => {
    const _0x1964f5 = () => {
      const _0x210600 = new Error('External tool request was cancelled.');
      ((_0x210600['code'] = 'EXTERNAL_TOOL_ABORTED'), _0x4a4e45(_0x210600));
    };
    (_0x13bc67['addEventListener']('abort', _0x1964f5, { once: !![] }),
      Promise['resolve']()
        ['then'](() => _0x1ca903(_0x4ecae2, { signal: _0x13bc67 }))
        ['then'](
          (_0x38c821) => {
            (_0x13bc67['removeEventListener']('abort', _0x1964f5), _0x25bf83(_0x38c821));
          },
          (_0x18c442) => {
            (_0x13bc67['removeEventListener']('abort', _0x1964f5), _0x4a4e45(_0x18c442));
          },
        ));
  });
}
export function createAgentExternalToolRegistry({ tools: tools = [] } = {}) {
  const _0x4c80c2 = new Map();
  function _0x5d21c3(_0x4661cf) {
    const _0x5b319e = normalizeToolDefinition(_0x4661cf);
    if (_0x4c80c2['has'](_0x5b319e['id']))
      throw new Error('Agent external tool already registered: ' + _0x5b319e['id']);
    return (_0x4c80c2['set'](_0x5b319e['id'], _0x5b319e), _0x5b319e['id']);
  }
  for (const _0xbd77b1 of Array['isArray'](tools) ? tools : []) _0x5d21c3(_0xbd77b1);
  return {
    register: _0x5d21c3,
    has(_0x48b96d) {
      return _0x4c80c2['has'](
        String(_0x48b96d || '')
          ['trim']()
          ['toLowerCase'](),
      );
    },
    get(_0x1e372a) {
      return (
        _0x4c80c2['get'](
          String(_0x1e372a || '')
            ['trim']()
            ['toLowerCase'](),
        ) || null
      );
    },
    list() {
      return [..._0x4c80c2['values']()]['map']((_0x4235d2) => ({
        id: _0x4235d2['id'],
        title: _0x4235d2['title'],
        description: _0x4235d2['description'],
        inputSchema: structuredClone(_0x4235d2['inputSchema']),
        riskLevel: _0x4235d2['riskLevel'],
        trust: _0x4235d2['trust'],
      }));
    },
    async execute({ toolId: _0xe35e98, args: args = {}, signal: signal = null } = {}) {
      const _0x347124 = _0x4c80c2['get'](
        String(_0xe35e98 || '')
          ['trim']()
          ['toLowerCase'](),
      );
      if (!_0x347124)
        return {
          ok: ![],
          status: 'failed',
          toolId: String(_0xe35e98 || ''),
          errorCode: 'EXTERNAL_TOOL_NOT_FOUND',
          message: 'External tool is not registered.',
        };
      if (signal?.['aborted'])
        return {
          ok: ![],
          status: 'cancelled',
          toolId: _0x347124['id'],
          errorCode: 'EXTERNAL_TOOL_ABORTED',
          message: 'External\x20tool\x20request\x20was\x20cancelled.',
        };
      try {
        const _0x1b8e20 = _0x347124['validate']?.(args);
        if (_0x1b8e20 === ![] || _0x1b8e20?.['ok'] === ![])
          return {
            ok: ![],
            status: 'failed',
            toolId: _0x347124['id'],
            errorCode: String(_0x1b8e20?.['errorCode'] || 'INVALID_EXTERNAL_TOOL_INPUT'),
            message: String(_0x1b8e20?.['message'] || 'External\x20tool\x20input\x20is\x20invalid.'),
          };
        const _0x3683b9 = await executeWithSignal(_0x347124['execute'], args, signal);
        if (_0x3683b9?.['success'] === ![] || _0x3683b9?.['ok'] === ![])
          return {
            ok: ![],
            status: 'failed',
            toolId: _0x347124['id'],
            errorCode: String(_0x3683b9['errorCode'] || 'EXTERNAL_TOOL_FAILED'),
            message: String(_0x3683b9['message'] || _0x3683b9['error'] || 'External tool failed.'),
          };
        return { ok: !![], status: 'success', toolId: _0x347124['id'], result: _0x3683b9 };
      } catch (_0x1cfaec) {
        return {
          ok: ![],
          status: signal?.['aborted'] ? 'cancelled' : 'failed',
          toolId: _0x347124['id'],
          ...normalizeToolError(
            _0x1cfaec,
            signal?.['aborted'] ? 'EXTERNAL_TOOL_ABORTED' : 'EXTERNAL_TOOL_FAILED',
          ),
        };
      }
    },
  };
}
export function createDefaultAgentExternalToolRegistry({
  readUrl: _0x2f2f5a,
  readDocument: _0x49cac2,
  validateDocument: _0x189cfe,
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
        validate(_0x137ec7 = {}) {
          return String(_0x137ec7['url'] || '')['trim']()
            ? !![]
            : { ok: ![], errorCode: 'URL_REQUIRED', message: 'URL is required.' };
        },
        execute(_0x16d441) {
          if (typeof _0x2f2f5a !== 'function')
            return {
              success: ![],
              errorCode: 'URL_READER_UNAVAILABLE',
              message: 'URL reading is unavailable in this runtime.',
            };
          return _0x2f2f5a({ url: _0x16d441['url'] });
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
        validate(_0x5cfa8a = {}) {
          const _0x24f319 = validateAgentDocumentFile(_0x5cfa8a['file'], _0x189cfe);
          return _0x24f319['ok']
            ? !![]
            : { ok: ![], errorCode: 'DOCUMENT_FILE_INVALID', message: _0x24f319['error'] };
        },
        async execute(_0x1762a2, { signal: _0x3b32d8 } = {}) {
          if (typeof _0x49cac2 !== 'function')
            return {
              success: ![],
              errorCode: 'DOCUMENT_READER_UNAVAILABLE',
              message: '文档读取在当前运行环境中不可用。',
            };
          const _0x163b2a = await _0x49cac2(_0x1762a2['file'], { signal: _0x3b32d8 });
          return { success: !![], source: createAgentDocumentSource(_0x163b2a, _0x1762a2['file']) };
        },
      },
    ],
  });
}
