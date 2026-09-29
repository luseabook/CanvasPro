import { resolveAssetMentionRef } from '../../modules/assetMentionRegistry.js';
import { getPromptInputSubmitLabelFromPillNode } from '../../modules/nodePromptShared.js';
function decodeText(_0x12cd45) {
  const _0x2cd5b2 = { amp: '&', lt: '<', gt: '>', quot: '\x22', apos: '\x27', nbsp: '\u00a0' };
  return String(_0x12cd45 || '')['replace'](
    /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,
    (_0x31d937, _0x409a86) => {
      if (_0x409a86[0x0] !== '#') return _0x2cd5b2[_0x409a86['toLowerCase']()] ?? _0x31d937;
      const _0x493755 =
        _0x409a86[0x1]['toLowerCase']() === 'x'
          ? parseInt(_0x409a86['slice'](0x2), 0x10)
          : Number(_0x409a86['slice'](0x1));
      return _0x493755 > 0x0 && _0x493755 <= 0x10ffff ? String['fromCodePoint'](_0x493755) : '�';
    },
  );
}
export function readStoredImagePromptParts(_0x27b194) {
  const _0x14e213 = [];
  let _0x4317b4 = null,
    _0x5235af = 0x0;
  for (const _0x2191cd of String(_0x27b194 || '')['match'](
    /<!--[^]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/g,
  ) || []) {
    if (_0x2191cd['startsWith']('<!--')) continue;
    if (!_0x2191cd['startsWith']('<')) {
      const _0x40873f = decodeText(_0x2191cd);
      if (_0x4317b4) _0x4317b4['text'] += _0x40873f;
      else _0x14e213['push']({ text: _0x40873f });
      continue;
    }
    const _0x372548 = _0x2191cd['match'](/^<\s*(\/?)\s*([\w-]+)/);
    if (!_0x372548) continue;
    const _0x453b55 = !!_0x372548[0x1],
      _0x2f3ca2 = _0x372548[0x2]['toLowerCase'](),
      _0x17eee9 = /^(br|img|input|hr|meta|link|wbr)$/['test'](_0x2f3ca2) || /\/\s*>$/['test'](_0x2191cd);
    if (_0x4317b4) {
      if (_0x453b55) _0x5235af -= 0x1;
      else {
        if (!_0x17eee9) _0x5235af += 0x1;
      }
      _0x5235af === 0x0 &&
        ((_0x4317b4['label'] ||= _0x4317b4['text']['trim']()),
        _0x14e213['push'](_0x4317b4),
        (_0x4317b4 = null));
      continue;
    }
    if (_0x453b55) continue;
    const _0xa6d426 = {};
    for (const _0x2f4683 of _0x2191cd['matchAll'](/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      _0xa6d426[_0x2f4683[0x1]['toLowerCase']()] = decodeText(
        _0x2f4683[0x2] ?? _0x2f4683[0x3] ?? _0x2f4683[0x4],
      );
    }
    if ((_0xa6d426['class'] || '')['split'](/\s+/)['includes']('ref-pill'))
      ((_0x4317b4 = {
        reference: !![],
        text: '',
        nodeId: _0xa6d426['data-node-id'] || '',
        label: _0xa6d426['data-label'] || '',
        refLabel: _0xa6d426['data-ref-label'] || '',
        origin: _0xa6d426['data-ref-origin'] || '',
        assetId: _0xa6d426['data-asset-id'] || '',
        itemIndex: Number(_0xa6d426['data-asset-index'] || 0x0),
      }),
        (_0x5235af = 0x1));
    else {
      if (_0x2f3ca2 === 'br') _0x14e213['push']({ text: '\x0a' });
    }
  }
  return (
    _0x4317b4 && ((_0x4317b4['label'] ||= _0x4317b4['text']['trim']()), _0x14e213['push'](_0x4317b4)),
    _0x14e213
  );
}
export function readImagePromptParts(_0x31e601, _0x54c034) {
  if (!_0x31e601) return readStoredImagePromptParts(_0x54c034);
  const _0x18818b = [],
    _0x3103ce = (_0x4a114c) => {
      for (const _0x5248b of _0x4a114c['childNodes'] || []) {
        if (_0x5248b['nodeType'] === 0x3) _0x18818b['push']({ text: _0x5248b['textContent'] });
        else {
          if (_0x5248b['nodeType'] === 0x1 && _0x5248b['classList']?.['contains']('ref-pill'))
            _0x18818b['push']({
              reference: !![],
              domNode: _0x5248b,
              nodeId: _0x5248b['dataset']['nodeId'] || '',
              label: _0x5248b['dataset']['label'] || _0x5248b['textContent']['trim'](),
            });
          else {
            if (_0x5248b['tagName'] === 'BR') _0x18818b['push']({ text: '\x0a' });
            else _0x3103ce(_0x5248b);
          }
        }
      }
    };
  return (_0x3103ce(_0x31e601), _0x18818b);
}
export function getImagePromptReferenceLabel(_0x1374f7, _0x1af523 = '') {
  if (_0x1374f7['domNode']) return getPromptInputSubmitLabelFromPillNode(_0x1374f7['domNode'], _0x1af523);
  const _0x28ef09 = String(_0x1374f7['refLabel'] || _0x1374f7['label'] || _0x1af523)['trim']();
  return _0x1374f7['origin'] === 'asset'
    ? _0x28ef09
    : _0x28ef09
      ? '@' + _0x28ef09['replace'](/^@+/, '')['trim']()
      : '';
}
export function resolveImagePromptAsset(_0xa85915) {
  return _0xa85915['assetId']
    ? resolveAssetMentionRef({ assetId: _0xa85915['assetId'], itemIndex: _0xa85915['itemIndex'] })
    : null;
}
