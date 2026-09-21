import { buildFixedInputAssetSlotMap } from '../../modules/fixedInputAssetRefs.js';
import { bindRefThumbFixedSlotDrag } from '../../modules/refThumbDragController.js';
import { t } from '../../i18n/index.js';
function escapeRefBarHtml(_0x42b031) {
  return String(_0x42b031 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function getFixedImageSlotLabelHtml(_0x115f6c, _0x2fa13c) {
  const _0xd6d68e = String(_0x2fa13c || '').trim(),
    _0x194ade = _0x115f6c?.slotById?.[_0xd6d68e] || {},
    _0x3a7833 = String(_0x194ade.label || _0xd6d68e).trim() || _0xd6d68e;
  return escapeRefBarHtml(_0x3a7833).replace(/\s+/g, '<br>');
}
function getFixedImageSlotTitle(_0x234cba, _0x8744b0) {
  const _0x21d235 = String(_0x8744b0 || '').trim(),
    _0x495245 = _0x234cba?.slotById?.[_0x21d235] || {};
  return String(_0x495245.description || _0x495245.label || _0x21d235).trim() || _0x21d235;
}
function getFixedImageSlotAcceptMap(_0xc87acf) {
  const _0x353030 = {};
  return (
    (_0xc87acf?.visibleSlots || []).forEach((_0x58390c) => {
      const _0x242179 = String(_0xc87acf?.slotKindById?.[_0x58390c] || '').trim();
      if (_0x58390c && _0x242179) _0x353030[_0x58390c] = _0x242179;
    }),
    _0x353030
  );
}
function getItemKey(_0x191f21) {
  return String(_0x191f21?.key || _0x191f21?.edgeId || '');
}
function createAssetSlotItem({
  ref: _0x9cee20,
  slot: _0x1dec0c,
  fixedInputConfig: _0x2e93cd,
  ensureThumbDecoded: _0x10a410,
}) {
  if (!_0x9cee20?.url) return null;
  const _0x281a71 = String(_0x9cee20.thumbUrl || _0x9cee20.url || '').trim();
  if (!_0x281a71) return null;
  _0x10a410(_0x281a71);
  const _0x60978c = String(_0x9cee20.assetId || ''),
    _0x423fde = String(_0x9cee20.itemIndex ?? ''),
    _0x9f0384 = String(_0x9cee20.assetMentionOccurrence ?? ''),
    _0x4ee1f0 = String(_0x9cee20.assetRefSource || 'prompt');
  return {
    key: 'asset:' + _0x4ee1f0 + ':' + _0x60978c + ':' + _0x423fde + ':image:' + _0x1dec0c,
    edgeId: '',
    sourceId: 'asset:' + _0x60978c + ':' + _0x423fde,
    refSlot: _0x1dec0c,
    type: 'image',
    label: _0x9cee20.label || _0x9cee20.name || getFixedImageSlotTitle(_0x2e93cd, _0x1dec0c),
    sig: 'asset:' + _0x1dec0c + '|' + String(_0x9cee20.url || '') + '|' + _0x281a71,
    thumbHTML: '<img src="' + _0x281a71 + '" class="ref-thumb-media is-pending" draggable="false">',
    thumbSrc: _0x281a71,
    previewSrc: String(_0x9cee20.url || _0x281a71),
    virtual: true,
    assetId: _0x60978c,
    assetIndex: _0x423fde,
    assetOccurrence: _0x9f0384,
    assetRefSource: _0x4ee1f0,
    refType: 'image',
  };
}
function hasAssignedVirtualAsset(_0xd6b805, _0x7ae717) {
  if (!_0x7ae717?.virtual) return false;
  return Array.from(_0xd6b805.values()).some(
    (_0x3cc99f) =>
      _0x3cc99f?.virtual &&
      String(_0x3cc99f.assetId || '') === String(_0x7ae717.assetId || '') &&
      String(_0x3cc99f.assetIndex || '') === String(_0x7ae717.assetIndex || '') &&
      String(_0x3cc99f.assetOccurrence || '') === String(_0x7ae717.assetOccurrence || '') &&
      String(_0x3cc99f.assetRefSource || 'prompt') === String(_0x7ae717.assetRefSource || 'prompt'),
  );
}
function ensureFixedImageSkeleton({
  refBarEl: _0x3b22c7,
  attachBtnHTML: _0x4d86ea,
  slotOrder: _0x35a46e,
  fixedInputConfig: _0x221043,
  owner: _0x306783,
}) {
  let _0xf834a9 = _0x3b22c7.querySelector('.prompt-attachment-btn'),
    _0xc3499c =
      _0x3b22c7.querySelector('.rh-v5-ref-container') || _0x3b22c7.querySelector('.ref-thumb-container');
  const _0x874822 = _0x35a46e.every((_0xdb1ca6) =>
    _0xc3499c?.querySelector?.('[data-slot="' + _0xdb1ca6 + '"]'),
  );
  if (!_0xf834a9 || !_0xc3499c || !_0x874822) {
    const _0xc7c883 = _0x35a46e
      .map((_0x5df5d5) => {
        const _0x420f58 = escapeRefBarHtml(getFixedImageSlotTitle(_0x221043, _0x5df5d5));
        return (
          '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-ref-slot="' +
          escapeRefBarHtml(_0x5df5d5) +
          '" data-slot="' +
          escapeRefBarHtml(_0x5df5d5) +
          '" data-kind="image" draggable="false" title="' +
          _0x420f58 +
          '"><span class="ref-upload-label">' +
          getFixedImageSlotLabelHtml(_0x221043, _0x5df5d5) +
          '</span></button>'
        );
      })
      .join('');
    ((_0x3b22c7.innerHTML =
      _0x4d86ea + ' <div class="ref-thumb-container rh-v5-ref-container">' + _0xc7c883 + '</div>'),
      (_0xf834a9 = _0x3b22c7.querySelector('.prompt-attachment-btn')),
      (_0xc3499c =
        _0x3b22c7.querySelector('.rh-v5-ref-container') || _0x3b22c7.querySelector('.ref-thumb-container')),
      (_0x306783._attachBtnIcon = _0xf834a9 ? _0xf834a9.querySelector('.btn-icon') : null));
  }
  return _0xc3499c;
}
function collectFixedSlotItems({
  slotOrder: _0x1e036c,
  items: _0x62bec8,
  fixedInputConfig: _0x5f5be2,
  promptEl: _0x1bce4b,
  targetNodeData: _0x15ae0b,
  ensureThumbDecoded: _0x5cd7b9,
}) {
  const _0x4b78e1 = new Map(),
    _0x5bbf53 = new Set(),
    _0x51ef8c = new Set(_0x1e036c);
  for (const _0x598cc4 of _0x62bec8) {
    if (_0x598cc4.type !== 'image') continue;
    const _0x2ca1b5 = getItemKey(_0x598cc4),
      _0x2f69c3 = String(_0x598cc4.refSlot || '').trim();
    if (!_0x2ca1b5 || _0x5bbf53.has(_0x2ca1b5) || !_0x51ef8c.has(_0x2f69c3)) continue;
    if (_0x4b78e1.has(_0x2f69c3)) continue;
    (_0x4b78e1.set(_0x2f69c3, _0x598cc4), _0x5bbf53.add(_0x2ca1b5));
  }
  const _0x168dcf = buildFixedInputAssetSlotMap(_0x1bce4b, {
    slotOrderByType: _0x5f5be2.slotOrderByType || {},
    visibleSlots: _0x1e036c,
    exclusiveGroups: _0x5f5be2.exclusiveGroups || [],
    occupiedSlots: new Set(_0x4b78e1.keys()),
    nodeData: _0x15ae0b,
  });
  _0x1e036c.forEach((_0x326d26) => {
    if (_0x4b78e1.has(_0x326d26)) return;
    const _0x1b5e76 = createAssetSlotItem({
      ref: _0x168dcf[_0x326d26],
      slot: _0x326d26,
      fixedInputConfig: _0x5f5be2,
      ensureThumbDecoded: _0x5cd7b9,
    });
    if (_0x1b5e76) _0x4b78e1.set(_0x326d26, _0x1b5e76);
  });
  for (const _0x251e8c of _0x62bec8) {
    if (_0x251e8c.type !== 'image') continue;
    const _0x4faa62 = getItemKey(_0x251e8c);
    if (!_0x4faa62 || _0x5bbf53.has(_0x4faa62)) continue;
    if (hasAssignedVirtualAsset(_0x4b78e1, _0x251e8c)) continue;
    const _0x4c6bd2 = _0x1e036c.find((_0x1311d1) => !_0x4b78e1.has(_0x1311d1));
    if (!_0x4c6bd2) break;
    (_0x4b78e1.set(_0x4c6bd2, _0x251e8c), _0x5bbf53.add(_0x4faa62));
  }
  return _0x4b78e1;
}
function syncFixedSlotElement({
  container: _0x18b4a7,
  slot: _0x232ee0,
  item: _0x589b13,
  fixedInputConfig: _0x1fd222,
  revealRefThumbMedia: _0x4fc3c1,
}) {
  const _0x135dca = getFixedImageSlotTitle(_0x1fd222, _0x232ee0);
  let _0xba816 = _0x18b4a7?.querySelector?.('[data-slot="' + _0x232ee0 + '"]');
  if (_0x589b13 && _0xba816?.classList?.contains?.('ref-upload-slot')) {
    const _0x446f1b = document.createElement('div');
    ((_0x446f1b.className =
      'ref-thumb-wrap rh-v5-ref-box' + (_0x589b13.virtual ? ' ref-thumb-wrap--asset' : '')),
      _0xba816.replaceWith(_0x446f1b),
      (_0xba816 = _0x446f1b));
  } else {
    if (!_0x589b13 && _0xba816 && !_0xba816.classList?.contains?.('ref-upload-slot')) {
      const _0x2861af = document.createElement('button');
      ((_0x2861af.type = 'button'),
        (_0x2861af.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
        _0xba816.replaceWith(_0x2861af),
        (_0xba816 = _0x2861af));
    } else
      !_0xba816 &&
        ((_0xba816 = document.createElement(_0x589b13 ? 'div' : 'button')), _0x18b4a7?.appendChild(_0xba816));
  }
  if (!_0xba816) return;
  ((_0xba816.dataset.refSlot = _0x232ee0),
    (_0xba816.dataset.slot = _0x232ee0),
    (_0xba816.dataset.kind = 'image'),
    (_0xba816.title = _0x135dca));
  if (_0x589b13) {
    ((_0xba816.className =
      'ref-thumb-wrap rh-v5-ref-box' + (_0x589b13.virtual ? ' ref-thumb-wrap--asset' : '')),
      _0xba816.classList.remove('ref-upload-slot'),
      _0xba816.setAttribute('draggable', _0x589b13.virtual ? 'false' : 'true'),
      (_0xba816.dataset.refKey = getItemKey(_0x589b13)),
      (_0xba816.dataset.edgeId = _0x589b13.edgeId || ''),
      (_0xba816.dataset.sourceId = _0x589b13.sourceId || ''),
      (_0xba816.dataset.refOrigin = _0x589b13.virtual ? 'asset' : 'node'));
    _0x589b13.virtual
      ? ((_0xba816.dataset.assetId = _0x589b13.assetId || ''),
        (_0xba816.dataset.assetIndex = _0x589b13.assetIndex || ''),
        (_0xba816.dataset.assetOccurrence = _0x589b13.assetOccurrence || ''),
        (_0xba816.dataset.assetRefSource = _0x589b13.assetRefSource || 'prompt'),
        (_0xba816.dataset.refType = _0x589b13.refType || _0x589b13.type || ''))
      : (delete _0xba816.dataset.assetId,
        delete _0xba816.dataset.assetIndex,
        delete _0xba816.dataset.assetOccurrence,
        delete _0xba816.dataset.assetRefSource,
        delete _0xba816.dataset.refType);
    _0xba816.dataset.sig !== _0x589b13.sig &&
      ((_0xba816.innerHTML =
        _0x589b13.thumbHTML +
        '<button type="button" class="ref-thumb-delete" title="' +
        t('aigenImage.refs.removeReference') +
        '">&times;</button>'),
      (_0xba816.dataset.sig = _0x589b13.sig),
      _0x4fc3c1(_0xba816, _0x589b13.sig));
    if (_0x589b13.thumbSrc) _0xba816.dataset.thumbSrc = _0x589b13.thumbSrc;
    else delete _0xba816.dataset.thumbSrc;
    if (_0x589b13.previewSrc) _0xba816.dataset.previewSrc = _0x589b13.previewSrc;
    else delete _0xba816.dataset.previewSrc;
    return;
  }
  ((_0xba816.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
    _0xba816.setAttribute('draggable', 'false'),
    [
      'refKey',
      'edgeId',
      'sourceId',
      'refOrigin',
      'assetId',
      'assetIndex',
      'assetOccurrence',
      'assetRefSource',
      'refType',
      'sig',
      'thumbSrc',
      'previewSrc',
    ].forEach((_0x33d5b3) => {
      if (_0xba816.dataset[_0x33d5b3]) delete _0xba816.dataset[_0x33d5b3];
    }));
  const _0x53cb0d =
    '<span class="ref-upload-label">' + getFixedImageSlotLabelHtml(_0x1fd222, _0x232ee0) + '</span>';
  if (_0xba816.innerHTML !== _0x53cb0d) _0xba816.innerHTML = _0x53cb0d;
}
export function renderManifestFixedImageRefBar({
  owner: _0x533ea5,
  refBarEl: _0x97a838,
  promptEl: _0x58c835,
  attachBtnHTML: _0x48fd41,
  fixedInputConfig: _0x47a8b5,
  items: _0x55b31c,
  targetNodeData: _0x5be973,
  sourceIdToLabel: _0x30d0b8,
  store: _0x1819dc,
  nodeId: _0x3f450c,
  ensureThumbDecoded: _0x416692,
  revealRefThumbMedia: _0x232d77,
  syncPillLabels: _0x14734f,
}) {
  const _0x49000b = (_0x47a8b5?.visibleSlots || [])
    .map((_0x2c879c) => String(_0x2c879c || '').trim())
    .filter((_0x5519ba) => _0x5519ba && String(_0x47a8b5?.slotKindById?.[_0x5519ba] || '') === 'image');
  if (_0x49000b.length === 0) return false;
  (_0x97a838.classList.add('active', 'rh-v5-refbar'),
    (_0x533ea5._lastRefHTML = '__rh-manifest-fixed-image__:' + _0x49000b.join(',')));
  const _0x4b5cef = ensureFixedImageSkeleton({
      refBarEl: _0x97a838,
      attachBtnHTML: _0x48fd41,
      slotOrder: _0x49000b,
      fixedInputConfig: _0x47a8b5,
      owner: _0x533ea5,
    }),
    _0x358ff6 = collectFixedSlotItems({
      slotOrder: _0x49000b,
      items: _0x55b31c,
      fixedInputConfig: _0x47a8b5,
      promptEl: _0x58c835,
      targetNodeData: _0x5be973,
      ensureThumbDecoded: _0x416692,
    }),
    _0x21a5a4 = new Set(_0x49000b);
  return (
    Array.from(_0x4b5cef?.querySelectorAll?.('[data-slot]') || [])
      .filter((_0x26952d) => !_0x21a5a4.has(String(_0x26952d?.dataset?.slot || '')))
      .forEach((_0x416dab) => _0x416dab.remove()),
    _0x49000b.forEach((_0x3114af) => {
      syncFixedSlotElement({
        container: _0x4b5cef,
        slot: _0x3114af,
        item: _0x358ff6.get(_0x3114af) || null,
        fixedInputConfig: _0x47a8b5,
        revealRefThumbMedia: _0x232d77,
      });
    }),
    bindRefThumbFixedSlotDrag({
      owner: _0x533ea5,
      container: _0x4b5cef,
      store: _0x1819dc,
      nodeId: _0x3f450c,
      acceptMap: getFixedImageSlotAcceptMap(_0x47a8b5),
    }),
    _0x533ea5._syncBtnIconState(),
    _0x14734f(_0x533ea5, _0x30d0b8),
    true
  );
}
