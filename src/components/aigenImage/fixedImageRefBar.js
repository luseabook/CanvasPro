import { buildFixedInputAssetSlotMap } from '../../modules/fixedInputAssetRefs.js';
import { bindRefThumbFixedSlotDrag } from '../../modules/refThumbDragController.js';
import { t } from '../../i18n/index.js';
function escapeRefBarHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function getFixedImageSlotLabelHtml(item, key) {
  const index = String(key || '').trim(),
    result = item?.slotById?.[index] || {},
    data = String(result.label || index).trim() || index;
  return escapeRefBarHtml(data).replace(/\s+/g, '<br>');
}
function getFixedImageSlotTitle(options, target) {
  const source = String(target || '').trim(),
    next = options?.slotById?.[source] || {};
  return String(next.description || next.label || source).trim() || source;
}
function getFixedImageSlotAcceptMap(current) {
  const entry = {};
  return (
    (current?.visibleSlots || []).forEach((item2) => {
      const record = String(current?.slotKindById?.[item2] || '').trim();
      if (item2 && record) entry[item2] = record;
    }),
    entry
  );
}
function getItemKey(event) {
  return String(event?.key || event?.edgeId || '');
}
function createAssetSlotItem({
  ref: ref,
  slot: slot,
  fixedInputConfig: fixedInputConfig,
  ensureThumbDecoded: ensureThumbDecoded,
}) {
  if (!ref?.url) return null;
  const thumbSrc = String(ref.thumbUrl || ref.url || '').trim();
  if (!thumbSrc) return null;
  ensureThumbDecoded(thumbSrc);
  const assetId = String(ref.assetId || ''),
    assetIndex = String(ref.itemIndex ?? ''),
    assetOccurrence = String(ref.assetMentionOccurrence ?? ''),
    assetRefSource = String(ref.assetRefSource || 'prompt');
  return {
    key: 'asset:' + assetRefSource + ':' + assetId + ':' + assetIndex + ':image:' + slot,
    edgeId: '',
    sourceId: 'asset:' + assetId + ':' + assetIndex,
    refSlot: slot,
    type: 'image',
    label: ref.label || ref.name || getFixedImageSlotTitle(fixedInputConfig, slot),
    sig: 'asset:' + slot + '|' + String(ref.url || '') + '|' + thumbSrc,
    thumbHTML: '<img src="' + thumbSrc + '" class="ref-thumb-media is-pending" draggable="false">',
    thumbSrc: thumbSrc,
    previewSrc: String(ref.url || thumbSrc),
    virtual: true,
    assetId: assetId,
    assetIndex: assetIndex,
    assetOccurrence: assetOccurrence,
    assetRefSource: assetRefSource,
    refType: 'image',
  };
}
function hasAssignedVirtualAsset(map, enabled) {
  if (!enabled?.virtual) return false;
  return Array.from(map.values()).some(
    (item3) =>
      item3?.virtual &&
      String(item3.assetId || '') === String(enabled.assetId || '') &&
      String(item3.assetIndex || '') === String(enabled.assetIndex || '') &&
      String(item3.assetOccurrence || '') === String(enabled.assetOccurrence || '') &&
      String(item3.assetRefSource || 'prompt') === String(enabled.assetRefSource || 'prompt'),
  );
}
function ensureFixedImageSkeleton({
  refBarEl: refBarEl,
  attachBtnHTML: attachBtnHTML,
  slotOrder: slotOrder,
  fixedInputConfig: fixedInputConfig2,
  owner: owner,
}) {
  let el = refBarEl.querySelector('.prompt-attachment-btn'),
    el2 = refBarEl.querySelector('.rh-v5-ref-container') || refBarEl.querySelector('.ref-thumb-container');
  const enabled2 = slotOrder.every((item4) => el2?.querySelector?.('[data-slot="' + item4 + '"]'));
  if (!el || !el2 || !enabled2) {
    const payload = slotOrder
      .map((item5) => {
        const escapeRefBarHtml2 = escapeRefBarHtml(getFixedImageSlotTitle(fixedInputConfig2, item5));
        return (
          '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-ref-slot="' +
          escapeRefBarHtml(item5) +
          '" data-slot="' +
          escapeRefBarHtml(item5) +
          '" data-kind="image" draggable="false" title="' +
          escapeRefBarHtml2 +
          '"><span class="ref-upload-label">' +
          getFixedImageSlotLabelHtml(fixedInputConfig2, item5) +
          '</span></button>'
        );
      })
      .join('');
    ((refBarEl.innerHTML =
      attachBtnHTML + ' <div class="ref-thumb-container rh-v5-ref-container">' + payload + '</div>'),
      (el = refBarEl.querySelector('.prompt-attachment-btn')),
      (el2 =
        refBarEl.querySelector('.rh-v5-ref-container') || refBarEl.querySelector('.ref-thumb-container')),
      (owner._attachBtnIcon = el ? el.querySelector('.btn-icon') : null));
  }
  return el2;
}
function collectFixedSlotItems({
  slotOrder: slotOrder2,
  items: items,
  fixedInputConfig: fixedInputConfig3,
  promptEl: promptEl,
  targetNodeData: targetNodeData,
  ensureThumbDecoded: ensureThumbDecoded2,
}) {
  const map2 = new Map(),
    map3 = new Set(),
    map4 = new Set(slotOrder2);
  for (const handle of items) {
    if (handle.type !== 'image') continue;
    const itemKey = getItemKey(handle),
      state = String(handle.refSlot || '').trim();
    if (!itemKey || map3.has(itemKey) || !map4.has(state)) continue;
    if (map2.has(state)) continue;
    (map2.set(state, handle), map3.add(itemKey));
  }
  const ref2 = buildFixedInputAssetSlotMap(promptEl, {
    slotOrderByType: fixedInputConfig3.slotOrderByType || {},
    visibleSlots: slotOrder2,
    exclusiveGroups: fixedInputConfig3.exclusiveGroups || [],
    occupiedSlots: new Set(map2.keys()),
    nodeData: targetNodeData,
  });
  slotOrder2.forEach((slot2) => {
    if (map2.has(slot2)) return;
    const assetSlotItem = createAssetSlotItem({
      ref: ref2[slot2],
      slot: slot2,
      fixedInputConfig: fixedInputConfig3,
      ensureThumbDecoded: ensureThumbDecoded2,
    });
    if (assetSlotItem) map2.set(slot2, assetSlotItem);
  });
  for (const config of items) {
    if (config.type !== 'image') continue;
    const itemKey2 = getItemKey(config);
    if (!itemKey2 || map3.has(itemKey2)) continue;
    if (hasAssignedVirtualAsset(map2, config)) continue;
    const enabled3 = slotOrder2.find((item6) => !map2.has(item6));
    if (!enabled3) break;
    (map2.set(enabled3, config), map3.add(itemKey2));
  }
  return map2;
}
function syncFixedSlotElement({
  container: container,
  slot: slot3,
  item: item7,
  fixedInputConfig: fixedInputConfig4,
  revealRefThumbMedia: revealRefThumbMedia,
}) {
  const fixedImageSlotTitle = getFixedImageSlotTitle(fixedInputConfig4, slot3);
  let el3 = container?.querySelector?.('[data-slot="' + slot3 + '"]');
  if (item7 && el3?.classList?.contains?.('ref-upload-slot')) {
    const scope = document.createElement('div');
    ((scope.className = 'ref-thumb-wrap rh-v5-ref-box' + (item7.virtual ? ' ref-thumb-wrap--asset' : '')),
      el3.replaceWith(scope),
      (el3 = scope));
  } else {
    if (!item7 && el3 && !el3.classList?.contains?.('ref-upload-slot')) {
      const input = document.createElement('button');
      ((input.type = 'button'),
        (input.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
        el3.replaceWith(input),
        (el3 = input));
    } else !el3 && ((el3 = document.createElement(item7 ? 'div' : 'button')), container?.appendChild(el3));
  }
  if (!el3) return;
  ((el3.dataset.refSlot = slot3),
    (el3.dataset.slot = slot3),
    (el3.dataset.kind = 'image'),
    (el3.title = fixedImageSlotTitle));
  if (item7) {
    ((el3.className = 'ref-thumb-wrap rh-v5-ref-box' + (item7.virtual ? ' ref-thumb-wrap--asset' : '')),
      el3.classList.remove('ref-upload-slot'),
      el3.setAttribute('draggable', item7.virtual ? 'false' : 'true'),
      (el3.dataset.refKey = getItemKey(item7)),
      (el3.dataset.edgeId = item7.edgeId || ''),
      (el3.dataset.sourceId = item7.sourceId || ''),
      (el3.dataset.refOrigin = item7.virtual ? 'asset' : 'node'));
    item7.virtual
      ? ((el3.dataset.assetId = item7.assetId || ''),
        (el3.dataset.assetIndex = item7.assetIndex || ''),
        (el3.dataset.assetOccurrence = item7.assetOccurrence || ''),
        (el3.dataset.assetRefSource = item7.assetRefSource || 'prompt'),
        (el3.dataset.refType = item7.refType || item7.type || ''))
      : (delete el3.dataset.assetId,
        delete el3.dataset.assetIndex,
        delete el3.dataset.assetOccurrence,
        delete el3.dataset.assetRefSource,
        delete el3.dataset.refType);
    el3.dataset.sig !== item7.sig &&
      ((el3.innerHTML =
        item7.thumbHTML +
        '<button type="button" class="ref-thumb-delete" title="' +
        t('aigenImage.refs.removeReference') +
        '">&times;</button>'),
      (el3.dataset.sig = item7.sig),
      revealRefThumbMedia(el3, item7.sig));
    if (item7.thumbSrc) el3.dataset.thumbSrc = item7.thumbSrc;
    else delete el3.dataset.thumbSrc;
    if (item7.previewSrc) el3.dataset.previewSrc = item7.previewSrc;
    else delete el3.dataset.previewSrc;
    return;
  }
  ((el3.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
    el3.setAttribute('draggable', 'false'),
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
    ].forEach((item8) => {
      if (el3.dataset[item8]) delete el3.dataset[item8];
    }));
  const output =
    '<span class="ref-upload-label">' + getFixedImageSlotLabelHtml(fixedInputConfig4, slot3) + '</span>';
  if (el3.innerHTML !== output) el3.innerHTML = output;
}
export function renderManifestFixedImageRefBar({
  owner: owner2,
  refBarEl: refBarEl2,
  promptEl: promptEl2,
  attachBtnHTML: attachBtnHTML2,
  fixedInputConfig: fixedInputConfig5,
  items: items2,
  targetNodeData: targetNodeData2,
  sourceIdToLabel: sourceIdToLabel,
  store: store,
  nodeId: nodeId,
  ensureThumbDecoded: ensureThumbDecoded3,
  revealRefThumbMedia: revealRefThumbMedia2,
  syncPillLabels: syncPillLabels,
}) {
  const slotOrder3 = (fixedInputConfig5?.visibleSlots || [])
    .map((item9) => String(item9 || '').trim())
    .filter((item10) => item10 && String(fixedInputConfig5?.slotKindById?.[item10] || '') === 'image');
  if (slotOrder3.length === 0) return false;
  (refBarEl2.classList.add('active', 'rh-v5-refbar'),
    (owner2._lastRefHTML = '__rh-manifest-fixed-image__:' + slotOrder3.join(',')));
  const container2 = ensureFixedImageSkeleton({
      refBarEl: refBarEl2,
      attachBtnHTML: attachBtnHTML2,
      slotOrder: slotOrder3,
      fixedInputConfig: fixedInputConfig5,
      owner: owner2,
    }),
    item11 = collectFixedSlotItems({
      slotOrder: slotOrder3,
      items: items2,
      fixedInputConfig: fixedInputConfig5,
      promptEl: promptEl2,
      targetNodeData: targetNodeData2,
      ensureThumbDecoded: ensureThumbDecoded3,
    }),
    map5 = new Set(slotOrder3);
  return (
    Array.from(container2?.querySelectorAll?.('[data-slot]') || [])
      .filter((el4) => !map5.has(String(el4?.dataset?.slot || '')))
      .forEach((el5) => el5.remove()),
    slotOrder3.forEach((slot4) => {
      syncFixedSlotElement({
        container: container2,
        slot: slot4,
        item: item11.get(slot4) || null,
        fixedInputConfig: fixedInputConfig5,
        revealRefThumbMedia: revealRefThumbMedia2,
      });
    }),
    bindRefThumbFixedSlotDrag({
      owner: owner2,
      container: container2,
      store: store,
      nodeId: nodeId,
      acceptMap: getFixedImageSlotAcceptMap(fixedInputConfig5),
    }),
    owner2._syncBtnIconState(),
    syncPillLabels(owner2, sourceIdToLabel),
    true
  );
}
