function normalizeJsonText(value) {
  return typeof value === 'string' ? value['trim']()['replace'](/^\uFEFF/u, '') : '';
}
function extractBalancedJsonContainer(list, item) {
  const key = list[item];
  if (key !== '{' && key !== '[') return '';
  const list2 = [key];
  let index = ![],
    result = ![];
  for (let data = item + 0x1; data < list['length']; data += 0x1) {
    const options = list[data];
    if (index) {
      if (result) result = ![];
      else {
        if (options === '\x5c') result = !![];
        else {
          if (options === '\x22') index = ![];
        }
      }
      continue;
    }
    if (options === '\x22') {
      index = !![];
      continue;
    }
    if (options === '{' || options === '[') {
      list2['push'](options);
      continue;
    }
    if (options !== '}' && options !== ']') continue;
    const target = options === '}' ? '{' : '[';
    if (list2['at'](-0x1) !== target) return '';
    list2['pop']();
    if (!list2['length']) return list['slice'](item, data + 0x1);
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
    (handler(current[0x1]), (current = next['exec'](list3)));
  }
  for (let entry = 0x0; entry < list3['length']; entry += 0x1) {
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
    (error2['responsePreview'] = list5['slice'](0x0, 0x320)));
  throw error2;
}
export function extractCompleteJsonArrayItems(config, scope) {
  const list6 = normalizeJsonText(config),
    jsonText2 = normalizeJsonText(scope);
  if (!list6 || !jsonText2) return [];
  const list7 = '\x22' + jsonText2 + '\x22',
    count = list6['indexOf'](list7);
  if (count < 0x0) return [];
  const count2 = list6['indexOf'](':', count + list7['length']),
    count3 = count2 >= 0x0 ? list6['indexOf']('[', count2 + 0x1) : -0x1;
  if (count3 < 0x0) return [];
  const list8 = [];
  let input = count3 + 0x1;
  while (input < list6['length']) {
    while (input < list6['length'] && /[\s,]/u['test'](list6[input])) input += 0x1;
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
      new RegExp('\x22' + value3 + '\x22\x5cs*:\x5cs*(\x22(?:\x5c\x5c.|[^\x22\x5c\x5c])*\x22)', 'u'),
    );
  if (!enabled) return '';
  try {
    return JSON['parse'](enabled[0x1]);
  } catch {
    return '';
  }
}
