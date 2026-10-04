import { createReferenceInputThumbnailHtml } from '../../modules/referenceInputThumbnail.js';
import { sanitizePromptHtml } from '../../utils/dom.js';
import { createPromptAttachmentButtonHTML } from '../refAttachmentButton.js';
import { formatInputSlotLabelHtml } from '../shared/inputSlotLabelFormatter.js';
import { t } from '../../i18n/index.js';
const FIXED_REF_KIND_LABEL_KEYS = Object['freeze']({
    text: 'kind.text',
    image: 'kind.image',
    video: 'kind.video',
    audio: 'kind.audio',
  }),
  FIXED_REF_SLOT_FALLBACK_LABEL_KEYS = Object['freeze']({
    sourceVideo: 'slots.sourceVideo',
    refImage: 'slots.refImage',
    firstFrame: 'slots.firstFrame',
    videoMask: 'slots.videoMask',
    maskImage: 'slots.maskImage',
    audio: 'slots.audio',
  });
function referenceInputText(item, key = {}) {
  return t('videoNode.referenceInput.' + item, key);
}
function escapeHtmlText(index) {
  return String(index ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;');
}
function escapeHtmlAttr(result) {
  return escapeHtmlText(result)['replace'](/"/g, '&quot;')['replace'](/'/g, '&#39;');
}
function normalizeInputUrl(response = {}) {
  return String(
    response?.['thumbUrl'] ||
      response?.['url'] ||
      response?.['displayUrl'] ||
      response?.['imageUrl'] ||
      response?.['videoUrl'] ||
      response?.['audioUrl'] ||
      response?.['localUrl'] ||
      response?.['localPath'] ||
      '',
  )['trim']();
}
export function getVideoFixedInputSlotLabelText(data, options) {
  const target = String(options || '')['trim'](),
    source = data?.['slotById']?.[target] || null,
    next = String(data?.['slotKindById']?.[target] || '')['trim'](),
    current = FIXED_REF_KIND_LABEL_KEYS[next],
    entry = FIXED_REF_SLOT_FALLBACK_LABEL_KEYS[target];
  return (
    String(source?.['label'] || '')['trim']() ||
    (entry ? referenceInputText(entry) : '') ||
    (current ? referenceInputText(current) : '') ||
    target
  );
}
export function createVideoPromptEditorElements({
  documentObject: documentObject = globalThis['document'],
  promptHtml: promptHtml = '',
  placeholder: placeholder = '',
} = {}) {
  const el = documentObject['createElement']('div');
  ((el['className'] = 'prompt-input-wrapper'), el['classList']['add']('is-resizable'));
  const record = documentObject['createElement']('div');
  return (
    (record['className'] = 'prompt-textarea custom-textarea'),
    (record['contentEditable'] = 'true'),
    (record['spellcheck'] = ![]),
    (record['dataset']['placeholder'] = String(placeholder || '')),
    (record['innerHTML'] = String(promptHtml || '')),
    el['appendChild'](record),
    { inputWrap: el, promptEl: record }
  );
}
export function renderVideoPromptEditorMarkup({
  promptHtml: promptHtml = '',
  placeholder: placeholder = '',
  attributes: attributes = '',
} = {}) {
  const sanitizePromptHtml2 = sanitizePromptHtml(String(promptHtml || '')),
    payload = String(attributes || '')['trim']();
  return (
    '<div class="prompt-input-wrapper is-resizable"><div class="prompt-textarea custom-textarea" contenteditable="true" spellcheck="false" data-placeholder="' +
    escapeHtmlAttr(placeholder) +
    '\x22' +
    (payload ? '\x20' + payload : '') +
    '>' +
    sanitizePromptHtml2 +
    '</div></div>'
  );
}
function createReferenceMediaMarkup(handle, state) {
  const inputUrl = normalizeInputUrl(state);
  if (handle === 'image' && inputUrl)
    return createReferenceInputThumbnailHtml({ kind: handle, thumbnailUrl: inputUrl });
  if (handle === 'video' && inputUrl) {
    const config = String(state?.['thumbUrl'] || '')['trim']();
    if (config || state?.['previewVideoUrl'])
      return createReferenceInputThumbnailHtml({
        kind: handle,
        thumbnailUrl: config,
        videoUrl: state?.['previewVideoUrl'],
      });
  }
  return createReferenceInputThumbnailHtml({ kind: handle || 'image' });
}
function createReferenceDeleteButtonMarkup(
  scope,
  { action: action = '', value: value = '', showTitle: showTitle = !![] } = {},
) {
  const output = String(action || '')['trim'](),
    value2 = output
      ? ' data-ref-remove-action="' +
        escapeHtmlAttr(output) +
        '" data-ref-remove-value="' +
        escapeHtmlAttr(value) +
        '\x22'
      : '',
    value3 = showTitle ? ' title="' + escapeHtmlAttr(referenceInputText('removeReference')) + '\x22' : '';
  return (
    '<button type="button" class="ref-thumb-delete"' +
    value2 +
    value3 +
    ' aria-label="' +
    escapeHtmlAttr(referenceInputText('removeReference') + '\x20' + scope) +
    '">&times;</button>'
  );
}
export function renderVideoFixedInputSlotMarkup({
  fixedInputConfig: fixedInputConfig2,
  slot: slot,
  input: input = null,
  readOnly: readOnly = ![],
  showTitle: showTitle = !![],
} = {}) {
  const value4 = String(slot || '')['trim'](),
    value5 = String(fixedInputConfig2?.['slotKindById']?.[value4] || '')['trim'](),
    videoFixedInputSlotLabelText = getVideoFixedInputSlotLabelText(fixedInputConfig2, value4),
    value6 = showTitle ? ' title="' + escapeHtmlAttr(videoFixedInputSlotLabelText) + '\x22' : '',
    value7 =
      'data-slot="' + escapeHtmlAttr(value4) + '" data-kind="' + escapeHtmlAttr(value5) + '\x22' + value6;
  if (!input || !normalizeInputUrl(input)) {
    if (readOnly)
      return (
        '<div\x20class=\x22ref-thumb-wrap\x20ref-upload-slot\x20rh-v5-ref-box\x20ref-thumb-wrap--readonly\x20is-empty\x22\x20' +
        value7 +
        ' role="img" aria-label="' +
        escapeHtmlAttr(videoFixedInputSlotLabelText) +
        '"><span class="ref-upload-label">' +
        formatInputSlotLabelHtml(videoFixedInputSlotLabelText) +
        '</span></div>'
      );
    return (
      '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" ' +
      value7 +
      '><span class="ref-upload-label">' +
      formatInputSlotLabelHtml(videoFixedInputSlotLabelText) +
      '</span></button>'
    );
  }
  if (readOnly)
    return renderReadOnlyReferenceItem({
      ...input,
      kind: value5,
      slotId: value4,
      name: videoFixedInputSlotLabelText,
      showTitle: showTitle,
    });
  return (
    '<div class="ref-thumb-wrap rh-v5-ref-box" ' +
    value7 +
    ' data-ref-origin="asset">' +
    createReferenceMediaMarkup(value5, input) +
    createReferenceDeleteButtonMarkup(videoFixedInputSlotLabelText, { showTitle: showTitle }) +
    '</div>'
  );
}
export function renderVideoFixedInputSlotsMarkup({
  fixedInputConfig: fixedInputConfig3,
  inputsBySlot: inputsBySlot = {},
  readOnly: readOnly = ![],
  readOnlySlots: readOnlySlots = [],
  showTitles: showTitles = !![],
} = {}) {
  const value8 = new Set(
    Array['isArray'](readOnlySlots)
      ? readOnlySlots['map']((value9) => String(value9 || '')['trim']())['filter'](Boolean)
      : [],
  );
  return (Array['isArray'](fixedInputConfig3?.['visibleSlots']) ? fixedInputConfig3['visibleSlots'] : [])
    ['map']((value10) =>
      renderVideoFixedInputSlotMarkup({
        fixedInputConfig: fixedInputConfig3,
        slot: value10,
        input: inputsBySlot?.[value10] || null,
        readOnly: readOnly || value8['has'](String(value10 || '')['trim']()),
        showTitle: showTitles,
      }),
    )
    ['join']('');
}
function renderGenericReferenceItem(error, value11, { showTitle: showTitle = !![] } = {}) {
  const value12 = String(error?.['kind'] || 'image')['trim'](),
    value13 = String(error?.['name'] || error?.['label'] || value12 + '\x20' + (value11 + 0x1))['trim'](),
    value14 = String(error?.['slotId'] || value12 + '-' + (value11 + 0x1))['trim']();
  return (
    '<div\x20class=\x22ref-thumb-wrap\x22\x20data-slot=\x22' +
    escapeHtmlAttr(value14) +
    '" data-kind="' +
    escapeHtmlAttr(value12) +
    '" data-ref-origin="asset">' +
    createReferenceMediaMarkup(value12, error) +
    createReferenceDeleteButtonMarkup(value13, { showTitle: showTitle }) +
    '</div>'
  );
}
function renderReadOnlyReferenceItem(response2, value15) {
  const value16 = String(response2?.['kind'] || response2?.['type'] || 'image')['trim'](),
    value17 = String(response2?.['name'] || response2?.['label'] || value16 + '\x20' + (value15 + 0x1))[
      'trim'
    ](),
    value18 = String(response2?.['slotId'] || response2?.['slot'] || '')['trim'](),
    value19 = String(response2?.['removeAction'] || '')['trim'](),
    value20 = String(response2?.['removeValue'] || ''),
    value21 = response2?.['showTitle'] !== ![],
    value22 = value16 + ':' + String(response2?.['url'] || normalizeInputUrl(response2))['trim'](),
    value23 = value21 ? '\x20title=\x22' + escapeHtmlAttr(value17) + '\x22' : '';
  return (
    '<div class="ref-thumb-wrap ref-thumb-wrap--readonly"' +
    (value18 ? ' data-slot="' + escapeHtmlAttr(value18) + '\x22' : '') +
    ' data-kind="' +
    escapeHtmlAttr(value16) +
    '" data-ref-origin="asset" data-ref-readonly-key="' +
    escapeHtmlAttr(value22) +
    '" role="' +
    (value19 ? 'group' : 'img') +
    '\x22\x20aria-label=\x22' +
    escapeHtmlAttr(value17) +
    '\x22' +
    value23 +
    '>' +
    createReferenceMediaMarkup(value16, response2) +
    (value19
      ? createReferenceDeleteButtonMarkup(value17, { action: value19, value: value20, showTitle: value21 })
      : '') +
    '</div>'
  );
}
function renderReadOnlyReferenceInputsMarkup(list = [], { showTitles: showTitles = !![] } = {}) {
  const enabled = Array['isArray'](list) ? list['filter']((value24) => normalizeInputUrl(value24)) : [];
  if (!enabled['length']) return '';
  return (
    '<div\x20class=\x22ref-thumb-container\x20ref-thumb-container--readonly\x22>' +
    enabled['map']((args, value25) =>
      renderReadOnlyReferenceItem({ ...args, showTitle: showTitles && args?.['showTitle'] !== ![] }, value25),
    )['join']('') +
    '</div>'
  );
}
export function renderVideoReferenceBarContentMarkup({
  fixedInputConfig: fixedInputConfig = null,
  inputsBySlot: inputsBySlot = {},
  readOnlyFixedInputs: readOnlyFixedInputs = ![],
  readOnlyFixedInputSlots: readOnlyFixedInputSlots = [],
  inputs: inputs = [],
  readOnlyInputs: readOnlyInputs = [],
  showItemTitles: showItemTitles = !![],
  attachmentButtonHtml: attachmentButtonHtml = createPromptAttachmentButtonHTML({
    stroke: 'var(--white-90)',
  }),
} = {}) {
  const renderReadOnlyReferenceInputsMarkup2 = renderReadOnlyReferenceInputsMarkup(readOnlyInputs, {
    showTitles: showItemTitles,
  });
  if (fixedInputConfig?.['visibleSlots']?.['length']) {
    const value26 =
      String(fixedInputConfig?.['manifest']?.['displayName'] || '')['trim']() ||
      String(fixedInputConfig?.['manifest']?.['label'] || '')['trim']() ||
      referenceInputText('fixedInputs');
    return (
      attachmentButtonHtml +
      ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="' +
      escapeHtmlAttr(referenceInputText('fixedInputsAria', { label: value26 })) +
      '\x22>' +
      renderVideoFixedInputSlotsMarkup({
        fixedInputConfig: fixedInputConfig,
        inputsBySlot: inputsBySlot,
        readOnly: readOnlyFixedInputs,
        readOnlySlots: readOnlyFixedInputSlots,
        showTitles: showItemTitles,
      }) +
      '</div>' +
      renderReadOnlyReferenceInputsMarkup2
    );
  }
  const enabled2 = Array['isArray'](inputs) ? inputs['filter']((value27) => normalizeInputUrl(value27)) : [];
  if (!enabled2['length']) return '' + attachmentButtonHtml + renderReadOnlyReferenceInputsMarkup2;
  return (
    attachmentButtonHtml +
    '\x20<div\x20class=\x22ref-thumb-container\x22>' +
    enabled2['map']((value28, value29) =>
      renderGenericReferenceItem(value28, value29, { showTitle: showItemTitles }),
    )['join']('') +
    '</div>' +
    renderReadOnlyReferenceInputsMarkup2
  );
}
export function renderVideoReferenceBarMarkup(options2 = {}) {
  const value30 = Boolean(options2?.['fixedInputConfig']?.['visibleSlots']?.['length']),
    value31 =
      Array['isArray'](options2?.['inputs']) &&
      options2['inputs']['some']((value32) => normalizeInputUrl(value32)),
    value33 =
      Array['isArray'](options2?.['readOnlyInputs']) &&
      options2['readOnlyInputs']['some']((value34) => normalizeInputUrl(value34)),
    value35 = value30
      ? 'node-ref-bar active rh-v5-refbar'
      : value31 || value33
        ? 'node-ref-bar active'
        : 'node-ref-bar';
  return '<div class="' + value35 + '\x22>' + renderVideoReferenceBarContentMarkup(options2) + '</div>';
}
