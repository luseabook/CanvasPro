import { translateManifestText } from '../../i18n/manifestText.js';
import { resolveModelExecution } from '../../manifests/index.js';
import { isAgentEditableParamField } from './agentParameterHints.js';
function stripMarkup(value) {
  return String(value || '')
    ['replace'](/<[^>]*>/g, ' ')
    ['replace'](/\s+/g, ' ')
    ['trim']();
}
function truncateText(item, key = 80) {
  const list = stripMarkup(item);
  return list['length'] <= key ? list : list['slice'](0, Math['max'](0, key - 3)) + '...';
}
function getPlainObject(index) {
  return index && typeof index === 'object' && !Array['isArray'](index) ? index : {};
}
function readPathSegment(result, data) {
  if (result == null) return undefined;
  if (Array['isArray'](result) && /^\d+$/['test'](data)) return result[Number(data)];
  return result?.[data];
}
function resolveScopedExpression(options, target = {}) {
  const source = String(options || '')
      ['trim']()
      ['split']('.')
      ['map']((next) => next['trim']())
      ['filter'](Boolean),
    enabled = source['shift']();
  if (!enabled || !Object['prototype']['hasOwnProperty']['call'](target, enabled)) return { ok: ![] };
  let value2 = target[enabled];
  for (const current of source) {
    value2 = readPathSegment(value2, current);
    if (value2 === undefined) return { ok: ![] };
  }
  return { ok: !![], value: value2 };
}
function resolveScopedValue(list2, entry = {}) {
  if (typeof list2 === 'string') {
    const enabled2 = /^\$([A-Za-z_][A-Za-z0-9_]*(?:\.(?:[A-Za-z_][A-Za-z0-9_]*|\d+))*)$/['exec'](
      list2['trim'](),
    );
    if (!enabled2) return list2;
    const el = resolveScopedExpression(enabled2[1], entry);
    return el['ok'] ? el['value'] : list2;
  }
  if (Array['isArray'](list2)) return list2['map']((record) => resolveScopedValue(record, entry));
  if (list2 && typeof list2 === 'object') {
    const payload = {};
    for (const [handle, state] of Object['entries'](list2)) {
      payload[handle] = resolveScopedValue(state, entry);
    }
    return payload;
  }
  return list2;
}
function resolveActionArgs(options2 = {}, config = {}) {
  return resolveScopedValue(options2['args'] || {}, config);
}
function formatTraceReason(scope = '') {
  const input = String(scope || ''),
    output = {
      'selected image has compatible image-to-video model':
        '已根据选中图片选择兼容的图生视频模型',
      'requested model was available in context': '已使用上下文中的请求模型',
      'target model uiSchema does not declare removed params':
        '已移除目标模型不支持的参数',
      'generation run requires confirmation': '生成执行需要确认',
      'existing node connection change requires confirmation': '修改已有节点连接需要确认',
      'existing node prompt change requires confirmation': '修改已有节点 Prompt 需要确认',
      'existing node generation params change requires confirmation':
        '修改已有节点参数需要确认',
      'existing node model change requires confirmation': '修改已有节点模型需要确认',
      'existing input slot change requires confirmation': '修改已有输入槽需要确认',
      'node delete requires confirmation': '删除节点需要确认',
      'large batch requires confirmation': '批量操作数量较多，需要确认',
      'planner requested confirmation': '规划器要求确认',
      'action risk requires confirmation': '动作风险要求确认',
      'command risk requires confirmation': '命令风险要求确认',
    };
  return output[input] || input || '需要确认';
}
function summarizeDebugTraceForConfirmation(list3 = []) {
  if (!Array['isArray'](list3) || list3['length'] === 0) return [];
  const list4 = [];
  for (const value3 of list3) {
    value3?.['type'] === 'contextual_default_applied' &&
      value3['field'] === 'model' &&
      list4['push']('模型选择：' + formatTraceReason(value3['reason']) + '。');
    if (value3?.['type'] === 'params_filtered') {
      const count = Array['isArray'](value3['removedParamIds']) ? value3['removedParamIds']['length'] : 0;
      list4['push'](
        count > 0 ? '参数检查：已自动忽略当前模型不支持的设置。' : '参数检查：当前设置均受所选模型支持。',
      );
    }
    (value3?.['type'] === 'confirmation_required' &&
      list4['push']('确认原因：' + formatTraceReason(value3['reason']) + '。'),
      value3?.['type'] === 'parameter_hints_model_applied' &&
        list4['push']('参数识别：已选择支持你指定设置的模型。'),
      value3?.['type'] === 'parameter_hints_applied' && list4['push']('参数识别：已应用你指定的生成设置。'),
      value3?.['type'] === 'parameter_hints_unsupported' &&
        list4['push']('参数识别：部分生成设置不受当前模型支持，已忽略。'));
  }
  return list4['slice'](0, 6);
}
export function createAgentPlanLifecycle({
  readCanvasState: readCanvasState,
  localeProvider: localeProvider,
  formatText: formatText,
  isSafeAction: isSafeAction,
} = {}) {
  if (typeof readCanvasState !== 'function' || typeof isSafeAction !== 'function')
    throw new TypeError('[agentPlanLifecycle] readCanvasState and isSafeAction are required');
  function run() {
    return localeProvider?.() || 'zh-CN';
  }
  function cancelNotice(value4) {
    return typeof formatText === 'function' ? formatText(value4) : value4;
  }
  function run2(state2 = {}, value5 = '') {
    const value6 = String(value5 || '')['trim']();
    return value6 ? state2['nodes']?.[value6] || null : null;
  }
  function run3(value7) {
    const value8 = String(value7 || '');
    if (value8 === 'ai-image') return cancelNotice('nodeCreateImage');
    if (value8 === 'ai-video') return cancelNotice('nodeCreateVideo');
    if (value8 === 'ai-audio') return cancelNotice('nodeCreateAudio');
    if (value8 === 'ai-text' || value8 === 'source-text') return cancelNotice('nodeCreateText');
    return cancelNotice('nodeCreate');
  }
  function label(value9, value10 = {}) {
    const value11 = String(value9 || '');
    if (value11 === 'node.create') return run3(value10['type']);
    if (value11 === 'node.setPrompt' || value11 === 'node.appendPrompt') return cancelNotice('nodeSetPrompt');
    if (value11 === 'node.setParams') return cancelNotice('nodeSetParams');
    if (value11 === 'graph.connect') return cancelNotice('graphConnect');
    if (value11 === 'layout.align') return cancelNotice('layoutAlign');
    if (value11 === 'layout.arrangeRow') return cancelNotice('layoutArrangeRow');
    if (value11 === 'layout.arrangeColumn') return cancelNotice('layoutArrangeColumn');
    if (value11 === 'layout.arrangeGrid') return cancelNotice('layoutArrangeGrid');
    if (value11 === 'generation.run') return cancelNotice('generationRun');
    if (value11 === 'generation.runBatch') return cancelNotice('generationRunBatch');
    if (value11 === 'node.delete') return cancelNotice('nodeDelete');
    return value11;
  }
  function failedAction(options3 = {}, value12 = {}) {
    const args = resolveActionArgs(options3, value12);
    return {
      type: String(options3['type'] || ''),
      label: label(options3['type'], args),
      args: args,
      promptSummary: truncateText(args['prompt'] || args['text'] || '', 60),
    };
  }
  function inputSource(state3 = {}, value13 = '') {
    const list5 = Object['values'](state3['edges'] || {})['filter'](
        (value14) => String(value14?.['targetId'] || '') === String(value13 || ''),
      ),
      map = new Set((state3['selectedNodeIds'] || [])['map']((value15) => String(value15 || ''))),
      list6 = list5['map']((value16) => {
        const error = run2(state3, value16['sourceId']);
        if (!error) return '';
        const value17 = String(error['name'] || error['id'] || value16['sourceId']),
          value18 = ['ai-image', 'source-image']['includes'](String(error['type'] || '')),
          value19 =
            map['has'](String(error['id'] || '')) && value18
              ? cancelNotice('selectedImageInput')
              : cancelNotice('inputNode');
        return value19 + '：' + value17;
      })['filter'](Boolean);
    return list6['join']('，') || cancelNotice('noInputSource');
  }
  function options4(options5 = {}) {
    if (!Array['isArray'](options5['options'])) return [];
    const locale = run();
    return options5['options']
      ['map']((disabled) => {
        const value20 =
            disabled && typeof disabled === 'object' && !Array['isArray'](disabled)
              ? (disabled['value'] ?? disabled['id'] ?? disabled['label'] ?? '')
              : disabled,
          value21 =
            disabled && typeof disabled === 'object' && !Array['isArray'](disabled)
              ? (disabled['label'] ?? disabled['selectedLabel'])
              : disabled,
          value22 =
            disabled && typeof disabled === 'object' && !Array['isArray'](disabled)
              ? (disabled['displayLabel'] ?? disabled['selectedLabel'] ?? disabled['label'])
              : disabled;
        return {
          value: value20,
          label: translateManifestText(value21, { locale: locale }),
          selectedLabel: translateManifestText(value22, { locale: locale }),
          disabled: disabled?.['disabled'] === !![],
        };
      })
      ['filter'](
        (el2) => el2['value'] !== undefined && el2['value'] !== '' && String(el2['label'] || '')['trim'](),
      );
  }
  function editableParams(options6 = {}, value23 = {}) {
    const locale2 = run(),
      list7 = Array['isArray'](options6?.['uiSchema']?.['fields']) ? options6['uiSchema']['fields'] : [];
    return list7['filter']((value24) => isAgentEditableParamField(value24, value23))
      ['map']((min) => {
        const id = String(min['id'] || '')['trim'](),
          label2 = translateManifestText(min['label'], { locale: locale2 });
        if (!label2) return null;
        return {
          id: id,
          label: label2,
          type: String(min['type'] || 'text'),
          displayRole: String(min['displayRole'] || ''),
          placement: String(min['placement'] || ''),
          value: Object['prototype']['hasOwnProperty']['call'](value23, id)
            ? value23[id]
            : min['defaultValue'],
          options: options4(min),
          min: min['min'],
          max: min['max'],
          step: min['step'],
        };
      })
      ['filter'](Boolean);
  }
  function generation(options7 = {}) {
    const value25 = options7['scope'] || {},
      enabled3 = (options7['actions'] || [])['find']((value26) =>
        ['generation.run', 'generation.runBatch']['includes'](value26?.['type']),
      );
    if (!enabled3) return null;
    const actionArgs = resolveActionArgs(enabled3, value25),
      nodeIds =
        enabled3['type'] === 'generation.runBatch'
          ? (Array['isArray'](actionArgs['nodeIds']) ? actionArgs['nodeIds'] : [])
              ['map']((value27) => String(value27 || '')['trim']())
              ['filter'](Boolean)
          : [String(actionArgs['nodeId'] || '')['trim']()]['filter'](Boolean),
      nodeId = nodeIds[0] || '',
      value28 = readCanvasState(),
      providerHint = run2(value28, nodeId) || {},
      modelExecution = resolveModelExecution(providerHint['model'], {
        providerHint: providerHint['provider'],
      }),
      modelLabel = modelExecution?.['modelManifest'] || null,
      params = {
        ...getPlainObject(providerHint['generationParams']),
        ...getPlainObject(actionArgs['options']?.['params']),
      };
    return {
      nodeId: nodeId,
      nodeIds: nodeIds,
      batchSize: nodeIds['length'],
      model: String(providerHint['model'] || ''),
      modelLabel:
        modelLabel?.['displayName'] ||
        modelLabel?.['title'] ||
        providerHint['model'] ||
        cancelNotice('defaultModel'),
      provider: String(providerHint['provider'] || modelLabel?.['provider'] || ''),
      promptSummary: truncateText(
        providerHint['prompt'] || providerHint['storyboardScript']?.['prompt'] || '',
        120,
      ),
      params: params,
      editableParams: editableParams(modelLabel, params),
      inputSource: inputSource(value28, nodeId),
    };
  }
  function review(
    args2 = {},
    { debugTrace: debugTrace = [], debugTraceSummary: debugTraceSummary = null } = {},
  ) {
    const value29 = args2['scope'] || {};
    return {
      ...args2,
      confirmationSummary: {
        completedActions: (args2['preExecutedActions'] || [])['map']((value30) =>
          failedAction(value30, value29),
        ),
        pendingActions: (args2['actions'] || [])['map']((value31) => failedAction(value31, value29)),
        generation: generation(args2),
        debugTraceSummary: Array['isArray'](debugTraceSummary)
          ? debugTraceSummary
          : summarizeDebugTraceForConfirmation(debugTrace),
        cancelNotice: cancelNotice('cancelNotice'),
      },
    };
  }
  function recover(errorCode = {}, retryPlan = {}) {
    const count2 = Number(errorCode['raw']?.['result']?.['failedIndex']),
      enabled4 =
        Number['isFinite'](count2) && count2 >= 0
          ? retryPlan['actions']?.[count2] || null
          : retryPlan['actions']?.['find']((value32) => value32?.['type'] === 'generation.run') || null;
    if (!enabled4) return { recovery: null, retryPlan: retryPlan };
    const recovery2 = {
      errorCode: errorCode['errorCode'] || errorCode['raw']?.['errorCode'] || '',
      failedAction: failedAction(enabled4, retryPlan['scope'] || {}),
      options: [
        { id: 'retry', label: cancelNotice('retry') },
        { id: 'editPrompt', label: cancelNotice('editPrompt') },
        { id: 'changeModel', label: cancelNotice('changeModel') },
        { id: 'keepPrepared', label: cancelNotice('keepPrepared') },
      ],
    };
    if (!Number['isFinite'](count2) || count2 < 0 || count2 >= retryPlan['actions']['length'])
      return { recovery: recovery2, retryPlan: retryPlan };
    const value33 = errorCode['raw']?.['result']?.['aliases'];
    return {
      recovery: recovery2,
      retryPlan: {
        ...retryPlan,
        actions: retryPlan['actions']['slice'](count2),
        preExecutedActions: [
          ...(Array['isArray'](retryPlan['preExecutedActions']) ? retryPlan['preExecutedActions'] : []),
          ...retryPlan['actions']['slice'](0, count2),
        ],
        scope: {
          ...(retryPlan['scope'] && typeof retryPlan['scope'] === 'object' ? retryPlan['scope'] : {}),
          ...(value33 && typeof value33 === 'object' ? value33 : {}),
        },
      },
    };
  }
  function describe({ plan: plan = null, recovery: recovery = null } = {}) {
    if (recovery) {
      const value34 = recovery['failedAction']?.['label'] || recovery['failedAction']?.['type'] || '';
      return truncateText(value34 ? '失败动作：' + value34 : '上次生成失败，可重新规划。', 240);
    }
    const value35 = plan?.['confirmationSummary'] || {},
      list8 = Array['isArray'](value35['pendingActions']) ? value35['pendingActions'] : [],
      list9 = Array['isArray'](value35['completedActions']) ? value35['completedActions'] : [],
      list10 = list8['map']((value36) => value36?.['label'] || value36?.['type'] || '')
        ['filter'](Boolean)
        ['slice'](0, 3),
      list11 = [];
    if (list9['length']) list11['push']('已准备 ' + list9['length'] + ' 步');
    if (list10['length']) list11['push']('待确认：' + list10['join']('，'));
    if (value35['generation']?.['modelLabel']) list11['push']('模型：' + value35['generation']['modelLabel']);
    return (
      value35['generation']?.['promptSummary'] &&
        list11['push']('Prompt：' + value35['generation']['promptSummary']),
      truncateText(list11['join']('；') || plan?.['reply'] || '', 240)
    );
  }
  function partition(options8 = {}) {
    const pending = Array['isArray'](options8['actions']) ? options8['actions'] : [],
      count3 = pending['findIndex']((value37) => !isSafeAction(value37));
    if (count3 <= 0) return { prefix: [], pending: pending };
    return { prefix: pending['slice'](0, count3), pending: pending['slice'](count3) };
  }
  return Object['freeze']({
    describe: describe,
    partition: partition,
    recover: recover,
    review: review,
  });
}
