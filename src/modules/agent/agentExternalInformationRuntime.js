import {
  compactAgentExternalInformationForPrompt,
  createAgentExternalInformationRequests,
} from './agentExternalInformation.js';
export function createAgentExternalInformationRuntime({
  toolRegistry: _0x9131ac,
  sessionStore: _0x1c2f3e,
} = {}) {
  function _0x4f2f94(_0x5a6aa0 = {}) {
    (_0x1c2f3e?.['recordTrace']?.(_0x5a6aa0),
      _0x1c2f3e?.['recordRunEvent']?.({
        runId: _0x1c2f3e?.['getCurrentRun']?.()?.['id'] || '',
        type: _0x5a6aa0['type'],
        status: _0x5a6aa0['status'],
        commandId: _0x5a6aa0['toolId'],
        ok: _0x5a6aa0['ok'],
        errorCode: _0x5a6aa0['errorCode'],
        message: _0x5a6aa0['message'],
      }));
  }
  async function _0x4a70a7({
    message: _0x12c88a,
    documentFiles: documentFiles = [],
    signal: signal = null,
  } = {}) {
    const _0x25201d = createAgentExternalInformationRequests({
      message: _0x12c88a,
      documentFiles: documentFiles,
    });
    if (!_0x25201d) return null;
    const _0x23c418 = [...new Set(_0x25201d['requests']['map']((_0x43c555) => _0x43c555['toolId']))],
      _0x266e06 = _0x23c418['length'] === 0x1 ? _0x23c418[0x0] : 'external-information.batch';
    _0x4f2f94({
      type: 'external_tool.selected',
      status: 'running',
      toolId: _0x266e06,
      toolIds: _0x23c418,
      sourceCount: _0x25201d['requests']['length'],
    });
    const _0x409fe0 = _0x23c418['find']((_0x8e89e5) => !_0x9131ac?.['has']?.(_0x8e89e5));
    if (_0x409fe0) {
      const _0x126e16 = new Error('当前运行环境不支持读取该外部信息。');
      ((_0x126e16['code'] = 'EXTERNAL_TOOL_UNAVAILABLE'),
        _0x4f2f94({
          type: 'external_tool.completed',
          status: 'failed',
          toolId: _0x409fe0,
          ok: ![],
          errorCode: _0x126e16['code'],
          message: _0x126e16['message'],
        }));
      throw _0x126e16;
    }
    const _0x1c582e = await Promise['all'](
        _0x25201d['requests']['map']((_0x19f88d) =>
          _0x9131ac['execute']({ toolId: _0x19f88d['toolId'], args: _0x19f88d['args'], signal: signal }),
        ),
      ),
      _0xe401b1 = _0x1c582e['find']((_0x5d45f0) => _0x5d45f0['ok'] !== !![]);
    if (_0xe401b1) {
      const _0x1ccc7a = new Error(_0xe401b1['message'] || '外部信息读取失败。');
      ((_0x1ccc7a['code'] = _0xe401b1['errorCode'] || 'EXTERNAL_INFORMATION_READ_FAILED'),
        _0x4f2f94({
          type: 'external_tool.completed',
          status: _0xe401b1['status'] || 'failed',
          toolId: _0xe401b1['toolId'] || _0x266e06,
          ok: ![],
          errorCode: _0x1ccc7a['code'],
          message: _0x1ccc7a['message'],
        }));
      throw _0x1ccc7a;
    }
    const _0x370c65 = _0x1c582e['map']((_0x3616c2, _0x34900e) => {
        const _0x367487 = _0x3616c2['result'] || {},
          _0x214e5d = _0x367487['source'] || _0x367487;
        return {
          ..._0x214e5d,
          sourceId: _0x25201d['requests'][_0x34900e]['sourceKind'] + '-' + (_0x34900e + 0x1),
          toolId: _0x25201d['requests'][_0x34900e]['toolId'],
          ...(_0x25201d['requests'][_0x34900e]['sourceKind'] === 'url'
            ? { requestedUrl: _0x25201d['requests'][_0x34900e]['args']['url'] }
            : {}),
        };
      }),
      _0x23f08d = {
        reason: _0x25201d['reason'],
        sources: compactAgentExternalInformationForPrompt({ sources: _0x370c65 }),
      };
    return (
      _0x4f2f94({
        type: 'external_tool.completed',
        status: 'success',
        toolId: _0x266e06,
        toolIds: _0x23c418,
        ok: !![],
        sourceCount: _0x23f08d['sources']['length'],
      }),
      _0x23f08d
    );
  }
  return { prepare: _0x4a70a7 };
}
