import { getAudioWorkflowSlots, normalizeAudioWorkflowRefSlots } from './audioWorkflowRefSlots.js';
function getSlotOrder(_0x33ec2e = []) {
  return (Array['isArray'](_0x33ec2e) ? _0x33ec2e : [])
    ['map']((_0x11e0c0) => String(_0x11e0c0?.['slot'] || '')['trim']())
    ['filter'](Boolean);
}
function createSlotItem(_0x484c46 = {}, _0x56e600 = 'node') {
  const _0x3b613b = {
    ..._0x484c46,
    origin: _0x56e600,
    virtual: _0x56e600 === 'asset',
    refType: 'audio',
    payloadRef: _0x484c46,
  };
  if (_0x56e600 === 'asset') {
    const _0x2cb126 = String(_0x484c46['assetId'] || ''),
      _0xd3e3ac = String(_0x484c46['assetIndex'] ?? '');
    _0x3b613b['sourceId'] = 'asset:' + _0x2cb126 + ':' + _0xd3e3ac;
  }
  return _0x3b613b;
}
function createAssetAudioPayloadRef(_0x7e2a25 = {}, _0x1dc5f7 = '') {
  return {
    edgeId: '',
    sourceId: '',
    sourceType: 'asset-audio',
    refSlot: _0x1dc5f7,
    url: _0x7e2a25['url'],
    assetId: _0x7e2a25['assetId'],
    assetIndex: _0x7e2a25['itemIndex'],
  };
}
function isUsableAudioAssetRef(_0x2ce213 = {}) {
  return String(_0x2ce213?.['type'] || '') === 'audio' && !!_0x2ce213?.['url'];
}
export function buildAudioWorkflowInputPlan({
  workflowKey: workflowKey = '',
  audioRefs: audioRefs = [],
  assetInputRefs: assetInputRefs = [],
} = {}) {
  const _0xad050c = getAudioWorkflowSlots(workflowKey),
    _0x29bca4 = getSlotOrder(_0xad050c),
    _0x388eea = Object['fromEntries'](_0x29bca4['map']((_0x54d889) => [_0x54d889, null])),
    _0x588ce2 = new Set(),
    _0x1aadae = [],
    _0x2123c0 = [],
    _0x4fb083 = normalizeAudioWorkflowRefSlots(audioRefs, workflowKey);
  return (
    _0x4fb083['forEach']((_0x47bd72) => {
      const _0x24bb61 = String(_0x47bd72?.['refSlot'] || '')['trim']();
      _0x1aadae['push'](_0x47bd72);
      if (!_0x29bca4['includes'](_0x24bb61) || _0x588ce2['has'](_0x24bb61)) {
        _0x2123c0['push'](_0x47bd72);
        return;
      }
      (_0x588ce2['add'](_0x24bb61), (_0x388eea[_0x24bb61] = createSlotItem(_0x47bd72, 'node')));
    }),
    (Array['isArray'](assetInputRefs) ? assetInputRefs : [])['forEach']((_0x14d5fc) => {
      if (!isUsableAudioAssetRef(_0x14d5fc)) return;
      const _0x522dba = _0x29bca4['find']((_0x192613) => !_0x588ce2['has'](_0x192613)) || '';
      if (!_0x522dba) return;
      _0x588ce2['add'](_0x522dba);
      const _0x1f325f = createAssetAudioPayloadRef(_0x14d5fc, _0x522dba);
      (_0x1aadae['push'](_0x1f325f),
        (_0x388eea[_0x522dba] = createSlotItem(
          {
            ..._0x1f325f,
            assetOccurrence: _0x14d5fc['assetMentionOccurrence'],
            assetRefSource: _0x14d5fc['assetRefSource'] || 'prompt',
            assetInputRef: _0x14d5fc,
          },
          'asset',
        )));
    }),
    {
      workflowKey: String(workflowKey || '')['trim'](),
      slotDefs: _0xad050c,
      slotOrder: _0x29bca4,
      slotItems: _0x388eea,
      audioRefs: _0x1aadae,
      nodeAudioRefs: _0x4fb083,
      unassignedAudioRefs: _0x2123c0,
    }
  );
}
