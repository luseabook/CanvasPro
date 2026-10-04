import { STORY_ASSET_STYLE_REFERENCE_MENTION } from './storyAssetAppearances.js';
export const STORY_ASSET_STYLE_REFERENCE_PILL_KIND = 'style-reference';
const STORY_ASSET_STYLE_REFERENCE_NODE_ID = 'story-style-reference';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function escapeRegExp(key) {
  return String(key || '')['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function buildStoryAssetStyleReferenceMentionCandidate(options = {}, { query: query = '' } = {}) {
  const thumbUrl = normalizeText(options['referenceImageUrl']),
    text = normalizeText(query)['replace'](/^@+/, '')['toLowerCase']();
  if (!thumbUrl || (text && !'风格参考'['includes'](text))) return null;
  return {
    origin: 'node',
    nodeId: STORY_ASSET_STYLE_REFERENCE_NODE_ID,
    type: '',
    label: '风格参考',
    pillLabel: '风格参考',
    refLabel: STORY_ASSET_STYLE_REFERENCE_MENTION,
    subtitle: '使用已上传的风格参考图',
    thumbUrl: thumbUrl,
    iconType: 'image',
    pillKind: STORY_ASSET_STYLE_REFERENCE_PILL_KIND,
    suppressTooltip: !![],
  };
}
export function renderStoryAssetPromptMentions(index = '', result = {}) {
  const enabled = String(index || '');
  if (!enabled) return '';
  const text2 = normalizeText(result['referenceImageUrl']),
    regExp = new RegExp(escapeRegExp(STORY_ASSET_STYLE_REFERENCE_MENTION), 'g'),
    data =
      '<span class="ref-pill story-asset-style-reference-pill" contenteditable="false" data-label="风格参考" data-ref-origin="node" data-node-id="' +
      STORY_ASSET_STYLE_REFERENCE_NODE_ID +
      '" data-ref-label="' +
      STORY_ASSET_STYLE_REFERENCE_MENTION +
      '\x22\x20data-prompt-pill-kind=\x22' +
      STORY_ASSET_STYLE_REFERENCE_PILL_KIND +
      '\x22>' +
      (text2
        ? '<img\x20class=\x22ref-pill-thumb\x22\x20src=\x22' +
          escapeHtml(text2) +
          '" alt="" draggable="false">'
        : '') +
      '<span class="ref-pill-label">风格参考</span></span>';
  return escapeHtml(enabled)
    ['replace'](regExp, data)
    ['replace'](/\r\n?|\n/g, '<br>');
}
export function readStoryAssetPromptText(enabled2 = null) {
  if (!enabled2) return '';
  const list = [],
    handler = (target) => {
      if (target) list['push'](String(target));
    },
    handler2 = (el, { root: root = ![] } = {}) => {
      const count = Number(el?.['nodeType']);
      if (count === 0x3) {
        handler(el['textContent'] || '');
        return;
      }
      if (count !== 0x1 && !root) return;
      if (
        !root &&
        normalizeText(el?.['dataset']?.['promptPillKind']) === STORY_ASSET_STYLE_REFERENCE_PILL_KIND
      ) {
        handler(STORY_ASSET_STYLE_REFERENCE_MENTION);
        return;
      }
      const source = String(el?.['tagName'] || '')['toUpperCase']();
      if (source === 'BR') {
        handler('\x0a');
        return;
      }
      const next = !root && ['DIV', 'P']['includes'](source);
      if (next && list['length'] && !list['at'](-0x1)['endsWith']('\x0a')) handler('\x0a');
      Array['from'](el?.['childNodes'] || [])['forEach']((current) => handler2(current));
      if (next && list['length'] && !list['at'](-0x1)['endsWith']('\x0a')) handler('\x0a');
    };
  return (
    handler2(enabled2, { root: !![] }),
    list['join']('')
      ['replace'](/\u00a0/g, '\x20')
      ['replace'](/\n{3,}/g, '\x0a\x0a')
      ['replace'](/\n$/g, '')
  );
}
