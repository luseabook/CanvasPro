import { listModelManifests } from '../../manifests/index.js';
const DEFAULT_RESULT_LIMIT = 0x6,
  MAX_RESULT_LIMIT = 0xc;
export function normalizeAgentSearchText(value) {
  return String(value || '')
    ['normalize']('NFKC')
    ['trim']()
    ['toLowerCase']();
}
export function normalizeAgentSearchKey(item) {
  return normalizeAgentSearchText(item)['replace'](/[\s\-_.:/|,，。()（）\[\]【】]+/g, '');
}
function normalizeStringArray(list) {
  return Array['isArray'](list)
    ? [...new Set(list['map']((key) => String(key || '')['trim']())['filter'](Boolean))]
    : [];
}
function normalizeLimit(index) {
  const result = Number(index);
  if (!Number['isFinite'](result)) return DEFAULT_RESULT_LIMIT;
  return Math['max'](0x1, Math['min'](MAX_RESULT_LIMIT, Math['trunc'](result)));
}
function collectSearchTokens(data) {
  return normalizeAgentSearchText(data)
    ['split'](/[\s,，。:：/|]+/)
    ['map']((options) => options['trim']())
    ['filter']((list2) => list2['length'] >= 0x2);
}
function scoreHaystack(target, source, list3 = []) {
  const list4 = normalizeAgentSearchText(target);
  if (!list4) return 0x1;
  const list5 = normalizeAgentSearchKey(list4);
  let next = 0x0;
  for (const list6 of list3['map'](normalizeAgentSearchText)['filter'](Boolean)) {
    if (list6 === list4) next += 0x3e8;
    else {
      if (list4['includes'](list6) || list6['includes'](list4)) next += 0xdc;
    }
    const list7 = normalizeAgentSearchKey(list6);
    if (list5 && list7 === list5) next += 0x384;
    else
      list5['length'] >= 0x3 &&
        list7 &&
        (list5['includes'](list7) || list7['includes'](list5)) &&
        (next += 0xc8);
  }
  const list8 = normalizeAgentSearchText(source);
  if (list8['includes'](list4)) next += 0xb4;
  const list9 = normalizeAgentSearchKey(list8);
  if (list5['length'] >= 0x3 && list9['includes'](list5)) next += 0xa0;
  for (const current of collectSearchTokens(list4)) {
    if (list8['includes'](current)) next += 0x1e;
  }
  return next;
}
function summarizeCommand(options2 = {}) {
  return {
    commandId: String(options2['id'] || ''),
    description: String(options2['description'] || ''),
    riskLevel: String(options2['riskLevel'] || 'safe'),
    reads: normalizeStringArray(options2['capabilitySchema']?.['reads']),
    writes: normalizeStringArray(options2['capabilitySchema']?.['writes']),
    argNames: Object['keys'](options2['argsSchema']?.['properties'] || {}),
  };
}
export function searchAgentCommands({
  commandRegistry: commandRegistry,
  query: query = '',
  limit: limit,
} = {}) {
  const list10 = typeof commandRegistry?.['list'] === 'function' ? commandRegistry['list']() : [],
    totalMatched = list10['map']((entry, index2) => {
      const summary = summarizeCommand(entry),
        record = [
          summary['commandId'],
          summary['description'],
          ...summary['reads'],
          ...summary['writes'],
          ...summary['argNames'],
        ]['join']('\x20');
      return {
        summary: summary,
        index: index2,
        score: scoreHaystack(query, record, [summary['commandId']]),
      };
    })
      ['filter']((payload) => payload['score'] > 0x0)
      ['sort']((handle, state) => state['score'] - handle['score'] || handle['index'] - state['index']),
    commandIds = totalMatched['slice'](0x0, normalizeLimit(limit));
  return {
    query: String(query || '')['trim'](),
    commandIds: commandIds['map']((config) => config['summary']['commandId']),
    commands: commandIds['map']((scope) => scope['summary']),
    totalMatched: totalMatched['length'],
  };
}
export function describeAgentCommand({ commandRegistry: commandRegistry2, commandId: commandId = '' } = {}) {
  const commandId2 = String(commandId || '')['trim'](),
    commandId3 = commandRegistry2?.['get']?.(commandId2) || null;
  if (!commandId3)
    return {
      found: ![],
      commandId: commandId2,
      errorCode: 'AGENT_COMMAND_NOT_FOUND',
      message: 'Canvas\x20command\x20is\x20not\x20registered:\x20' + commandId2,
    };
  return {
    found: !![],
    commandId: commandId3['id'],
    description: String(commandId3['description'] || ''),
    riskLevel: String(commandId3['riskLevel'] || 'safe'),
    argsSchema: commandId3['argsSchema'],
    capabilitySchema: commandId3['capabilitySchema'],
    returnSchema: commandId3['returnSchema'],
    returnAliasFields: normalizeStringArray(commandId3['returnSchema']?.['aliasFields']),
  };
}
function summarizeInputSlots(minItems = {}) {
  if (!minItems || typeof minItems !== 'object' || Array['isArray'](minItems)) return {};
  const fixedSlots = (Array['isArray'](minItems['fixedSlots']) ? minItems['fixedSlots'] : [])
    ['map']((required = {}) => ({
      id: String(required['id'] || required['slotId'] || ''),
      kind: String(required['kind'] || required['type'] || ''),
      required: required['required'] === !![],
      ...(required['showWhen'] ? { showWhen: required['showWhen'] } : {}),
    }))
    ['filter']((input) => input['id']);
  return {
    ...(fixedSlots['length'] > 0x0 ? { fixedSlots: fixedSlots } : {}),
    ...(Array['isArray'](minItems['allowedKinds'])
      ? { allowedKinds: normalizeStringArray(minItems['allowedKinds']) }
      : {}),
    ...(minItems['minByKind'] && typeof minItems['minByKind'] === 'object'
      ? { minByKind: { ...minItems['minByKind'] } }
      : {}),
    ...(minItems['maxByKind'] && typeof minItems['maxByKind'] === 'object'
      ? { maxByKind: { ...minItems['maxByKind'] } }
      : {}),
    ...(minItems['minItems'] != null ? { minItems: minItems['minItems'] } : {}),
    ...(minItems['maxItems'] != null ? { maxItems: minItems['maxItems'] } : {}),
    ...(minItems['accepts'] ? { accepts: minItems['accepts'] } : {}),
  };
}
function modelAcceptsInputKind(options3 = {}, output = '') {
  const agentSearchText = normalizeAgentSearchText(output);
  if (!agentSearchText) return !![];
  const map = new Set(normalizeStringArray(options3['allowedKinds'])['map'](normalizeAgentSearchText));
  if (map['has'](agentSearchText)) return !![];
  if (Number(options3['maxByKind']?.[agentSearchText]) > 0x0) return !![];
  if (Number(options3['minByKind']?.[agentSearchText]) > 0x0) return !![];
  return (options3['fixedSlots'] || [])['some'](
    (value2) => normalizeAgentSearchText(value2['kind']) === agentSearchText,
  );
}
function summarizeModelField(required2 = {}) {
  const value3 = {
    id: String(required2['id'] || required2['key'] || ''),
    type: String(required2['type'] || ''),
    required: required2['required'] === !![],
  };
  for (const value4 of ['label', 'default', 'min', 'max', 'step', 'placeholder', 'showWhen']) {
    if (required2[value4] !== undefined) value3[value4] = required2[value4];
  }
  return (
    Array['isArray'](required2['options']) &&
      (value3['options'] = required2['options']['slice'](0x0, 0x3c)['map']((value5) => {
        if (!value5 || typeof value5 !== 'object') return value5;
        return {
          value: value5['value'],
          ...(value5['label'] !== undefined ? { label: value5['label'] } : {}),
        };
      })),
    value3
  );
}
function summarizeModel(options4 = {}) {
  const fieldCount = (
    Array['isArray'](options4['uiSchema']?.['fields']) ? options4['uiSchema']['fields'] : []
  )
    ['map'](summarizeModelField)
    ['filter']((value6) => value6['id']);
  return {
    modelId: String(options4['modelId'] || ''),
    provider: String(options4['provider'] || ''),
    kind: String(options4['kind'] || ''),
    displayName: String(options4['displayName'] || options4['modelId'] || ''),
    description: String(options4['description'] || ''),
    adapterType: String(options4['adapterType'] || ''),
    inputSlots: summarizeInputSlots(options4['inputSlots']),
    fieldCount: fieldCount['length'],
    uiSchema: { fields: fieldCount },
  };
}
export function searchAgentModels({
  query: query = '',
  kind: kind = '',
  provider: provider = '',
  inputKinds: inputKinds = [],
  limit: limit2,
} = {}) {
  const agentSearchText2 = normalizeAgentSearchText(kind),
    agentSearchText3 = normalizeAgentSearchText(provider),
    args = new Set(normalizeStringArray(inputKinds)['map'](normalizeAgentSearchText)),
    totalMatched2 = listModelManifests()
      ['map']((value7, index3) => {
        const summary2 = summarizeModel(value7),
          value8 = [...args]['every']((value9) => modelAcceptsInputKind(summary2['inputSlots'], value9)),
          score =
            (!agentSearchText2 || normalizeAgentSearchText(summary2['kind']) === agentSearchText2) &&
            (!agentSearchText3 || normalizeAgentSearchText(summary2['provider']) === agentSearchText3) &&
            (args['size'] === 0x0 || value8),
          value10 = [
            summary2['modelId'],
            summary2['provider'],
            summary2['kind'],
            summary2['displayName'],
            summary2['description'],
            ...summary2['uiSchema']['fields']['map']((value11) => value11['id']),
          ]['join']('\x20');
        return {
          summary: summary2,
          index: index3,
          score: score ? scoreHaystack(query, value10, [summary2['modelId'], summary2['displayName']]) : 0x0,
        };
      })
      ['filter']((value12) => value12['score'] > 0x0)
      ['sort'](
        (value13, value14) => value14['score'] - value13['score'] || value13['index'] - value14['index'],
      ),
    modelIds = totalMatched2['slice'](0x0, normalizeLimit(limit2));
  return {
    query: String(query || '')['trim'](),
    modelIds: modelIds['map']((value15) => value15['summary']['modelId']),
    models: modelIds['map']((value16) => value16['summary']),
    totalMatched: totalMatched2['length'],
  };
}
