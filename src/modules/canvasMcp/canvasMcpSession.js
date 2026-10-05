import {
  buildCanvasMcpTools,
  canExposeCanvasCommand,
  describeCanvasMcpModels,
  sanitizeMcpResult,
} from './canvasMcpTools.js';
export function createCanvasMcpSession({
  request: request,
  registry: registry,
  execute: execute,
  getBinding: getBinding,
  listModels: listModels,
  onChange: onChange = () => {},
  owner: owner = crypto['randomUUID'](),
}) {
  let value = null,
    value2 = null,
    item = 0,
    enabled = ![],
    promise = Promise['resolve']();
  const run = (key) => !enabled && value === key && key['binding'] === getBinding();
  async function disable(reason = '') {
    item += 1;
    const sessionId = value;
    ((value = null),
      (value2 = null),
      sessionId?.['controller']['abort'](),
      onChange({ enabled: ![], reason: reason }));
    if (sessionId)
      try {
        await request({ action: 'disable', owner: owner, sessionId: sessionId['id'] });
      } catch {}
  }
  async function run2(sessionId2, requestId) {
    let result;
    if (!run(sessionId2)) return;
    try {
      if (requestId['name'] === 'canvas_models')
        result = { ok: !![], result: describeCanvasMcpModels(listModels(), requestId['arguments']) };
      else {
        const index = sessionId2['commandIds']['get'](requestId['name']),
          enabled2 = registry['list']()['find']((data) => data['id'] === index);
        if (!enabled2 || !canExposeCanvasCommand(enabled2, sessionId2))
          throw new Error('Unauthorized canvas command');
        result = await execute(index, requestId['arguments']);
      }
      result = sanitizeMcpResult(result);
      if (JSON['stringify'](result)['length'] > 250000)
        result = {
          ok: ![],
          errorCode: 'RESULT_TOO_LARGE',
          message: 'Operation may have succeeded. Inspect individual node summaries instead of resubmitting.',
        };
    } catch (message) {
      result = {
        ok: ![],
        errorCode: 'CANVAS_COMMAND_FAILED',
        message: message['message'] || String(message),
      };
    }
    if (!run(sessionId2)) return;
    for (let count = 0; count < 2; count += 1) {
      try {
        await request(
          {
            action: 'complete',
            owner: owner,
            sessionId: sessionId2['id'],
            requestId: requestId['requestId'],
            result: result,
          },
          sessionId2['controller']['signal'],
        );
        return;
      } catch (error) {
        if (!run(sessionId2)) return;
        if (count === 1) await disable(error['message']);
      }
    }
  }
  async function run3(sessionId3) {
    while (run(sessionId3)) {
      try {
        const enabled3 = await request(
          { action: 'poll', owner: owner, sessionId: sessionId3['id'], binding: sessionId3['binding'] },
          sessionId3['controller']['signal'],
        );
        if (!run(sessionId3)) break;
        if (!enabled3['request']) continue;
        const error2 = enabled3['request'],
          options = sessionId3['tools']['find']((error3) => error3['name'] === error2['name']);
        options?.['annotations']?.['readOnlyHint'] ||
        sessionId3['commandIds']['get'](error2['name']) === 'generation.cancel'
          ? void run2(sessionId3, error2)
          : (promise = promise['then'](() => run2(sessionId3, error2)));
      } catch (error4) {
        if (value === sessionId3) await disable(error4['message']);
        return;
      }
    }
    if (value === sessionId3) await disable('canvasChanged');
  }
  return {
    async enable({ allowGeneration: allowGeneration = ![] } = {}) {
      await disable();
      if (enabled) return null;
      const target = item,
        binding = getBinding();
      if (!binding) throw new Error('Open a canvas before connecting');
      const tools = buildCanvasMcpTools(registry, { allowGeneration: allowGeneration });
      value2 = binding;
      let sessionId4;
      try {
        sessionId4 = await request({
          action: 'enable',
          owner: owner,
          binding: binding,
          tools: tools['tools'],
          allowGeneration: allowGeneration,
        });
      } finally {
        if (target === item) value2 = null;
      }
      if (enabled || target !== item || binding !== getBinding())
        return (await request({ action: 'disable', owner: owner, sessionId: sessionId4['id'] }), null);
      return (
        (value = { ...sessionId4, ...tools, controller: new AbortController() }),
        (promise = Promise['resolve']()),
        onChange({
          enabled: !![],
          url: sessionId4['url'],
          token: sessionId4['token'],
          binding: binding,
          toolCount: tools['tools']['length'] + 1,
        }),
        void run3(value),
        sessionId4
      );
    },
    disable: disable,
    checkBinding() {
      if ((value && !run(value)) || (value2 && value2 !== getBinding())) void disable('canvasChanged');
    },
    async destroy() {
      ((enabled = !![]), await disable());
    },
  };
}
