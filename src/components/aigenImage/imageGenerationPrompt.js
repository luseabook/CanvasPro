import { resolveAssetMentionRef } from '../../modules/assetMentionRegistry.js';
import { getPromptInputSubmitLabelFromPillNode } from '../../modules/nodePromptShared.js';
function decodeText(value) {
  const item = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: '\xa0' };
  return String(value || '')['replace'](/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (key, list) => {
    if (list[0] !== '#') return item[list['toLowerCase']()] ?? key;
    const count =
      list[1]['toLowerCase']() === 'x' ? parseInt(list['slice'](2), 16) : Number(list['slice'](1));
    return count > 0 && count <= 0x10ffff ? String['fromCodePoint'](count) : '�';
  });
}
export function readStoredImagePromptParts(index) {
  const list2 = [];
  let response = null,
    count2 = 0;
  for (const enabled of String(index || '')['match'](/<!--[^]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/g) ||
    []) {
    if (enabled['startsWith']('<!--')) continue;
    if (!enabled['startsWith']('<')) {
      const text = decodeText(enabled);
      if (response) response['text'] += text;
      else list2['push']({ text: text });
      continue;
    }
    const enabled2 = enabled['match'](/^<\s*(\/?)\s*([\w-]+)/);
    if (!enabled2) continue;
    const result = !!enabled2[1],
      data = enabled2[2]['toLowerCase'](),
      enabled3 = /^(br|img|input|hr|meta|link|wbr)$/['test'](data) || /\/\s*>$/['test'](enabled);
    if (response) {
      if (result) count2 -= 1;
      else {
        if (!enabled3) count2 += 1;
      }
      count2 === 0 &&
        ((response['label'] ||= response['text']['trim']()), list2['push'](response), (response = null));
      continue;
    }
    if (result) continue;
    const nodeId = {};
    for (const options of enabled['matchAll'](/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      nodeId[options[1]['toLowerCase']()] = decodeText(options[2] ?? options[3] ?? options[4]);
    }
    if ((nodeId['class'] || '')['split'](/\s+/)['includes']('ref-pill'))
      ((response = {
        reference: !![],
        text: '',
        nodeId: nodeId['data-node-id'] || '',
        label: nodeId['data-label'] || '',
        refLabel: nodeId['data-ref-label'] || '',
        origin: nodeId['data-ref-origin'] || '',
        assetId: nodeId['data-asset-id'] || '',
        itemIndex: Number(nodeId['data-asset-index'] || 0),
      }),
        (count2 = 1));
    else {
      if (data === 'br') list2['push']({ text: '\n' });
    }
  }
  return (response && ((response['label'] ||= response['text']['trim']()), list2['push'](response)), list2);
}
export function readImagePromptParts(enabled4, target) {
  if (!enabled4) return readStoredImagePromptParts(target);
  const list3 = [],
    handler = (source) => {
      for (const text2 of source['childNodes'] || []) {
        if (text2['nodeType'] === 3) list3['push']({ text: text2['textContent'] });
        else {
          if (text2['nodeType'] === 1 && text2['classList']?.['contains']('ref-pill'))
            list3['push']({
              reference: !![],
              domNode: text2,
              nodeId: text2['dataset']['nodeId'] || '',
              label: text2['dataset']['label'] || text2['textContent']['trim'](),
            });
          else {
            if (text2['tagName'] === 'BR') list3['push']({ text: '\n' });
            else handler(text2);
          }
        }
      }
    };
  return (handler(enabled4), list3);
}
export function getImagePromptReferenceLabel(next, current = '') {
  if (next['domNode']) return getPromptInputSubmitLabelFromPillNode(next['domNode'], current);
  const entry = String(next['refLabel'] || next['label'] || current)['trim']();
  return next['origin'] === 'asset' ? entry : entry ? '@' + entry['replace'](/^@+/, '')['trim']() : '';
}
export function resolveImagePromptAsset(assetId) {
  return assetId['assetId']
    ? resolveAssetMentionRef({ assetId: assetId['assetId'], itemIndex: assetId['itemIndex'] })
    : null;
}
