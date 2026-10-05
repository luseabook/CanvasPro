function normalizeJsonText(value) {
  return typeof value === 'string' ? value['trim']()['replace'](/^\uFEFF/u, '') : '';
}
function extractBalancedJsonContainer(list, item) {
  const key = list[item];
  if (key !== '{' && key !== '[') return '';
  const list2 = [key];
  let index = ![],
    result = ![];
  for (let data = item + 1; data < list['length']; data += 1) {
    const options = list[data];
    if (index) {
      if (result) result = ![];
      else {
        if (options === '\\') result = !![];
        else {
          if (options === '"') index = ![];
        }
      }
      continue;
    }
    if (options === '"') {
      index = !![];
      continue;
    }
    if (options === '{' || options === '[') {
      list2['push'](options);
      continue;
    }
    if (options !== '}' && options !== ']') continue;
    const target = options === '}' ? '{' : '[';
    if (list2['at'](-1) !== target) return '';
    list2['pop']();
    if (!list2['length']) return list['slice'](item, data + 1);
  }
  return '';
}
function collectJsonCandidates(list3) {
  const list4 = [],
    handler = (source) => {
      const jsonText = normalizeJsonText(source)['replace'](/;$/u, '')['trim']();
      if (jsonText && !list4['includes'](jsonText)) list4['push'](jsonText);
    };
  handler(list3);
  const next = /```(?:json)?[ \t]*\r?\n?([\s\S]*?)```/giu;
  let current = next['exec'](list3);
  while (current) {
    (handler(current[1]), (current = next['exec'](list3)));
  }
  for (let entry = 0; entry < list3['length']; entry += 1) {
    if (list3[entry] !== '{' && list3[entry] !== '[') continue;
    const extractBalancedJsonContainer2 = extractBalancedJsonContainer(list3, entry);
    if (extractBalancedJsonContainer2) handler(extractBalancedJsonContainer2);
  }
  return list4;
}
export function parseStrictJson(record, payload = 'Agent 未返回结果。') {
  if (record && typeof record === 'object' && !Array['isArray'](record)) return record;
  const list5 = normalizeJsonText(record);
  if (!list5) throw new Error(payload);
  let error = null;
  for (const handle of collectJsonCandidates(list5)) {
    try {
      return JSON['parse'](handle);
    } catch (state) {
      error = state;
    }
  }
  const error2 = new Error('Agent 未返回有效的 JSON。');
  ((error2['code'] = 'AGENT_INVALID_JSON'),
    (error2['parseCause'] = normalizeJsonText(error?.['message'])),
    (error2['responsePreview'] = list5['slice'](0, 800)));
  throw error2;
}
export function extractCompleteJsonArrayItems(config, scope) {
  const list6 = normalizeJsonText(config),
    jsonText2 = normalizeJsonText(scope);
  if (!list6 || !jsonText2) return [];
  const list7 = '"' + jsonText2 + '"',
    count = list6['indexOf'](list7);
  if (count < 0) return [];
  const count2 = list6['indexOf'](':', count + list7['length']),
    count3 = count2 >= 0 ? list6['indexOf']('[', count2 + 1) : -1;
  if (count3 < 0) return [];
  const list8 = [];
  let input = count3 + 1;
  while (input < list6['length']) {
    while (input < list6['length'] && /[\s,]/u['test'](list6[input])) input += 1;
    if (list6[input] === ']') break;
    if (list6[input] !== '{' && list6[input] !== '[') break;
    const list9 = extractBalancedJsonContainer(list6, input);
    if (!list9) break;
    try {
      list8['push'](JSON['parse'](list9));
    } catch {
      break;
    }
    input += list9['length'];
  }
  return list8;
}
export function extractJsonStringProperty(output, value2) {
  const jsonText3 = normalizeJsonText(output),
    jsonText4 = normalizeJsonText(value2);
  if (!jsonText3 || !jsonText4) return '';
  const value3 = jsonText4['replace'](/[.*+?^${}()|[\]\\]/gu, '\\$&'),
    enabled = jsonText3['match'](
      new RegExp('"' + value3 + '"\\s*:\\s*("(?:\\\\.|[^"\\\\])*")', 'u'),
    );
  if (!enabled) return '';
  try {
    return JSON['parse'](enabled[1]);
  } catch {
    return '';
  }
}
