import {
  compactAgentExternalInformationForPrompt,
  createAgentExternalInformationRequests,
} from './agentExternalInformation.js';
export function createAgentExternalInformationRuntime({
  toolRegistry: toolRegistry,
  sessionStore: sessionStore,
} = {}) {
  function run(type = {}) {
    (sessionStore?.recordTrace?.(type),
      sessionStore?.recordRunEvent?.({
        runId: sessionStore?.getCurrentRun?.()?.id || '',
        type: type.type,
        status: type.status,
        commandId: type.toolId,
        ok: type.ok,
        errorCode: type.errorCode,
        message: type.message,
      }));
  }
  async function prepare({
    message: message,
    documentFiles: documentFiles = [],
    signal: signal = null,
  } = {}) {
    const sourceCount = createAgentExternalInformationRequests({
      message: message,
      documentFiles: documentFiles,
    });
    if (!sourceCount) return null;
    const toolIds = [...new Set(sourceCount.requests.map((value) => value.toolId))],
      toolId = toolIds.length === 1 ? toolIds[0] : 'external-information.batch';
    run({
      type: 'external_tool.selected',
      status: 'running',
      toolId: toolId,
      toolIds: toolIds,
      sourceCount: sourceCount.requests.length,
    });
    const toolId2 = toolIds.find((item) => !toolRegistry?.has?.(item));
    if (toolId2) {
      const errorCode = new Error('当前运行环境不支持读取该外部信息。');
      ((errorCode.code = 'EXTERNAL_TOOL_UNAVAILABLE'),
        run({
          type: 'external_tool.completed',
          status: 'failed',
          toolId: toolId2,
          ok: false,
          errorCode: errorCode.code,
          message: errorCode.message,
        }));
      throw errorCode;
    }
    const list = await Promise.all(
        sourceCount.requests.map((toolId3) =>
          toolRegistry.execute({ toolId: toolId3.toolId, args: toolId3.args, signal: signal }),
        ),
      ),
      status = list.find((response) => response.ok !== true);
    if (status) {
      const errorCode2 = new Error(status.message || '外部信息读取失败。');
      ((errorCode2.code = status.errorCode || 'EXTERNAL_INFORMATION_READ_FAILED'),
        run({
          type: 'external_tool.completed',
          status: status.status || 'failed',
          toolId: status.toolId || toolId,
          ok: false,
          errorCode: errorCode2.code,
          message: errorCode2.message,
        }));
      throw errorCode2;
    }
    const sources = list.map((key, index) => {
        const result = key.result || {},
          args = result.source || result;
        return {
          ...args,
          sourceId: sourceCount.requests[index].sourceKind + '-' + (index + 1),
          toolId: sourceCount.requests[index].toolId,
          ...(sourceCount.requests[index].sourceKind === 'url'
            ? { requestedUrl: sourceCount.requests[index].args.url }
            : {}),
        };
      }),
      sourceCount2 = {
        reason: sourceCount.reason,
        sources: compactAgentExternalInformationForPrompt({ sources: sources }),
      };
    return (
      run({
        type: 'external_tool.completed',
        status: 'success',
        toolId: toolId,
        toolIds: toolIds,
        ok: true,
        sourceCount: sourceCount2.sources.length,
      }),
      sourceCount2
    );
  }
  return { prepare: prepare };
}
