import { normalizeStoryCharacterVoiceReference } from './storyCharacterVoice.js';
import {
  buildStoryClipFrameMentionCandidates,
  resolveStoryClipFrameMentionRef,
  STORY_CLIP_FRAME_MENTION_PREFIX,
} from './storyClipFrames.js';
import { deriveStoryEpisodeAssetSummary } from './storyPlanningData.js';
import { protectStoryPromptPills } from './storyClipPromptReferences.js';
import { getStoryReplicationCharacterDisplayLabel } from './storyReplicationPromptReferences.js';
const STORY_ASSET_NODE_PREFIX = 'story-asset:',
  STORY_CHARACTER_VOICE_NODE_PREFIX = 'story-character-voice:',
  STORY_TIME_MENTION_ASSET_ID = 'story-meta:time',
  STORY_TIME_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 1.5"></path><path d="M9 2h6"></path><path d="M12 2v3"></path></svg>';
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
const STORY_H3_LITERAL_TAG_PATTERN =
  /(?:<|&(?:amp;)*(?:lt;|#0*60;|#x0*3c;)|＜)\s*((?:\/\s*)?d|scenetrans|cutoff|(?:Subject|Picture|Video|Audio)\s+\d+)\s*(?:>|&(?:amp;)*(?:gt;|#0*62;|#x0*3e;)|＞)/giu;
function normalizeStoryH3LiteralTag(index = '') {
  const text = normalizeText(index)['replace'](/\s+/gu, '\x20');
  if (/^\/\s*d$/iu['test'](text)) return '</d>';
  if (/^d$/iu['test'](text)) return '<d>';
  if (/^(scenetrans|cutoff)$/iu['test'](text)) return '<' + text['toLowerCase']() + '>';
  const enabled = text['match'](/^(Subject|Picture|Video|Audio)\s+(\d+)$/iu);
  if (!enabled) return '';
  const result = '' + enabled[0x1][0x0]['toUpperCase']() + enabled[0x1]['slice'](0x1)['toLowerCase']();
  return '<' + result + '\x20' + enabled[0x2] + '>';
}
function protectStoryH3LiteralTags(data = '') {
  const options = [],
    target = String(data || '')['replace'](STORY_H3_LITERAL_TAG_PATTERN, (source, next) => {
      const storyH3LiteralTag = normalizeStoryH3LiteralTag(next);
      if (!storyH3LiteralTag) return source;
      const current = 'story-h3-tag-' + options['length'] + '';
      return (options['push']({ token: current, tag: storyH3LiteralTag }), current);
    });
  return {
    source: target,
    restore: (entry = '') =>
      options['reduce'](
        (record, { token: token, tag: tag }) => record['split'](token)['join'](escapeHtml(tag)),
        String(entry || ''),
      ),
  };
}
export function normalizeStoryClipTimeLabel(payload, handle = '3.0s') {
  const state = String(payload ?? '')['match'](/-?\d+(?:\.\d+)?/),
    count = Number(state?.[0x0]);
  if (!Number['isFinite'](count) || count <= 0x0) return handle;
  const config = Math['min'](0x3e7, Math['max'](0.1, count));
  return config['toFixed'](0x1) + 's';
}
function getStoryAssetMentionAppearance(options2 = {}) {
  const scope = Array['isArray'](options2['appearances']) ? options2['appearances'] : [],
    text2 = normalizeText(options2['baseAppearanceId']);
  return (
    scope['find']((input) => text2 && normalizeText(input?.['id']) === text2) ||
    scope['find']((output) => normalizeText(output?.['name']) === '基础形象') ||
    scope[0x0] ||
    null
  );
}
function buildStoryAssetMentionId(value2 = '', value3 = '') {
  return (
    '' +
    STORY_ASSET_NODE_PREFIX +
    encodeURIComponent(normalizeText(value2)) +
    ':' +
    encodeURIComponent(normalizeText(value3) || '__asset__')
  );
}
function parseStoryAssetMentionId(value4 = '') {
  const list = normalizeText(value4);
  if (!list['startsWith'](STORY_ASSET_NODE_PREFIX)) return null;
  const [value5 = '', value6 = ''] = list['slice'](STORY_ASSET_NODE_PREFIX['length'])['split'](':');
  try {
    const decodeURIComponent2 = decodeURIComponent(value5),
      decodeURIComponent3 = decodeURIComponent(value6);
    return decodeURIComponent2 ? { assetId: decodeURIComponent2, appearanceId: decodeURIComponent3 } : null;
  } catch {
    return null;
  }
}
function matchesQuery(options3 = {}, value7 = '') {
  const text3 = normalizeText(value7)['replace'](/^@+/, '')['toLowerCase']();
  if (!text3) return !![];
  const list2 = Array['isArray'](options3['mentionVariants']) ? options3['mentionVariants'] : [];
  return [
    options3['label'],
    options3['subtitle'],
    options3['pillLabel'],
    options3['assetName'],
    options3['type'],
    ...list2['flatMap']((value8) => [value8?.['label'], value8?.['subtitle'], value8?.['pillLabel']]),
  ]
    ['map']((value9) => normalizeText(value9)['toLowerCase']())
    ['some']((value10) => value10['includes'](text3));
}
function getStoryAssetMentionSection(value11) {
  if (value11 === 'scene') return '场景';
  if (value11 === 'prop') return '道具';
  return '角色';
}
function getStoryAssetMentionAppearances(options4 = {}) {
  const args = Array['isArray'](options4['appearances']) ? options4['appearances']['filter'](Boolean) : [],
    storyAssetMentionAppearance = getStoryAssetMentionAppearance(options4);
  if (options4['kind'] !== 'character')
    return storyAssetMentionAppearance ? [storyAssetMentionAppearance] : [];
  if (!args['length']) return storyAssetMentionAppearance ? [storyAssetMentionAppearance] : [];
  return [...args]['sort'](
    (value12, value13) =>
      Number(value13 === storyAssetMentionAppearance) - Number(value12 === storyAssetMentionAppearance),
  );
}
export function getStoryEpisodeMentionAssets(list3 = [], value14 = null) {
  const value15 = (Array['isArray'](list3) ? list3 : [])['filter'](
      (value16) => value16 && ['character', 'scene', 'prop']['includes'](value16['kind']),
    ),
    storyEpisodeAssetSummary = deriveStoryEpisodeAssetSummary(value14, value15);
  return storyEpisodeAssetSummary['assetIds']['length'] ? storyEpisodeAssetSummary['assets'] : value15;
}
function buildStoryClipAssetMentionCandidate({
  asset: asset,
  appearance: appearance = null,
  allowAssetImageFallback: allowAssetImageFallback = ![],
  displayAssets: displayAssets = [],
} = {}) {
  const text4 = normalizeText(asset?.['name']) || '本集素材',
    text5 = normalizeText(appearance?.['id']),
    text6 = normalizeText(appearance?.['name']) || '基础形象',
    text7 = normalizeText(appearance?.['imageUrl'] || (allowAssetImageFallback ? asset?.['imageUrl'] : ''));
  return {
    origin: 'asset',
    menuDirect: !![],
    suppressTooltip: !![],
    assetId: buildStoryAssetMentionId(asset?.['id'], text5),
    assetIndex: 0x0,
    type: 'image',
    label: text4,
    subtitle: text6,
    pillLabel:
      getStoryReplicationCharacterDisplayLabel(asset, appearance, displayAssets) || text4 + ' · ' + text6,
    sourcePillLabel: text4 + ' · ' + text6,
    thumbUrl: text7,
    iconType: 'image',
    storyAssetId: normalizeText(asset?.['id']),
    storyAppearanceId: text5,
    storyAssetKind: normalizeText(asset?.['kind']),
    menuPage: 'assets',
    menuGroup: '本集素材',
    menuSection: getStoryAssetMentionSection(asset?.['kind']),
    assetName: '本集素材',
    missingAsset: !text7,
  };
}
export function buildStoryClipMentionCandidates({
  assets: assets = [],
  episode: episode = null,
  libraryCandidates: libraryCandidates = [],
  clipFrames: clipFrames = [],
  query: query = '',
  includeTime: includeTime = ![],
  includeClipFrames: includeClipFrames = ![],
  defaultDuration: defaultDuration = '3.0s',
} = {}) {
  const value17 = new Map([
      ['character', 0x0],
      ['scene', 0x1],
      ['prop', 0x2],
    ]),
    args2 = [...getStoryEpisodeMentionAssets(assets, episode)]
      ['sort'](
        (value18, value19) =>
          (value17['get'](value18?.['kind']) ?? 0x9) - (value17['get'](value19?.['kind']) ?? 0x9),
      )
      ['map']((value20) => {
        const storyAssetMentionAppearances = getStoryAssetMentionAppearances(value20),
          list4 = storyAssetMentionAppearances['length']
            ? storyAssetMentionAppearances['map']((value21) =>
                buildStoryClipAssetMentionCandidate({
                  asset: value20,
                  appearance: value21,
                  displayAssets: episode?.['replication'] ? assets : [],
                }),
              )
            : [
                buildStoryClipAssetMentionCandidate({
                  asset: value20,
                  appearance: null,
                  allowAssetImageFallback: !![],
                  displayAssets: episode?.['replication'] ? assets : [],
                }),
              ],
          text8 = normalizeText(query)['replace'](/^@+/, '')['toLowerCase'](),
          count2 = text8
            ? list4['findIndex']((value22) =>
                [value22['subtitle'], value22['pillLabel']]['some']((value23) =>
                  normalizeText(value23)['toLowerCase']()['includes'](text8),
                ),
              )
            : -0x1,
          value24 = count2 >= 0x0 ? count2 : 0x0,
          args3 = list4[value24] || list4[0x0];
        return { ...args3, mentionVariants: list4, mentionVariantIndex: value24 };
      }),
    args4 = (Array['isArray'](libraryCandidates) ? libraryCandidates : [])['map']((args5) => ({
      ...args5,
      origin: 'asset',
      menuDirect: !![],
      menuPage: 'assets',
      menuGroup: '全部素材',
      menuSection: '',
      suppressTooltip: !![],
      assetIndex: Number(args5?.['itemIndex'] || 0x0),
      label: normalizeText(args5?.['insertLabel'] || args5?.['label'] || args5?.['name']) || '素材库内容',
      assetName: normalizeText(args5?.['assetName']) || '素材库',
      iconType: normalizeText(args5?.['type']),
    })),
    args6 = includeTime
      ? [
          {
            origin: 'asset',
            menuDirect: !![],
            suppressTooltip: !![],
            assetId: STORY_TIME_MENTION_ASSET_ID,
            assetIndex: 0x0,
            type: '',
            label: '添加时间',
            subtitle: '设置当前片段在提示词中的生成时长',
            pillLabel: normalizeStoryClipTimeLabel(defaultDuration),
            pillKind: 'time',
            iconType: '',
            assetName: '片段设置',
            menuPage: 'tools',
            menuSection: '',
            compactVisual: !![],
          },
        ]
      : [],
    args7 =
      includeClipFrames || clipFrames['length']
        ? buildStoryClipFrameMentionCandidates(clipFrames, {
            query: query,
            clips: episode?.['clips'],
            episodeId: episode?.['id'],
          })
        : [];
  return [...args2, ...args4, ...args6, ...args7]['filter']((value25) => matchesQuery(value25, query));
}
function renderStoryAssetMentionPill(value26, list5 = []) {
  const text9 = normalizeText(value26?.['pillLabel'] || value26?.['label']) || '本集素材',
    value27 = value26?.['missingAsset'] === !![],
    text10 = normalizeText(value26?.['storyAssetId']),
    text11 = normalizeText(value26?.['storyAppearanceId']),
    value28 = list5['find']((value29) => value29['id'] === text10),
    value30 = value28?.['appearances']?.['find']((value31) => value31['id'] === text11),
    storyReplicationCharacterDisplayLabel =
      getStoryReplicationCharacterDisplayLabel(value28, value30, list5) || text9,
    value32 = value26?.['thumbUrl']
      ? '<img class="ref-pill-thumb" src="' +
        escapeHtml(value26['thumbUrl']) +
        '\x22\x20alt=\x22\x22\x20draggable=\x22false\x22>'
      : '';
  return (
    '<span\x20class=\x22ref-pill' +
    (value27 ? ' ref-pill--unresolved' : '') +
    '\x22\x20contenteditable=\x22false\x22\x20data-label=\x22' +
    escapeHtml(storyReplicationCharacterDisplayLabel) +
    '" data-ref-origin="asset" data-asset-id="' +
    escapeHtml(value26['assetId']) +
    '" data-asset-index="0" data-ref-type="image"' +
    (text10 ? ' data-story-asset-hover-id="' + escapeHtml(text10) + '\x22' : '') +
    (text11 ? ' data-story-asset-hover-appearance-id="' + escapeHtml(text11) + '\x22' : '') +
    (value27 ? ' data-ref-unresolved="true" data-tooltip="缺少图片素材"' : '') +
    '>' +
    value32 +
    '<span class="ref-pill-label">' +
    escapeHtml(storyReplicationCharacterDisplayLabel) +
    '</span></span>'
  );
}
function renderStoryTimeMentionPill(value33) {
  const storyClipTimeLabel = normalizeStoryClipTimeLabel(value33);
  return (
    '<span class="ref-pill story-time-pill" contenteditable="false" data-label="' +
    escapeHtml(storyClipTimeLabel) +
    '" data-ref-origin="asset" data-asset-id="' +
    STORY_TIME_MENTION_ASSET_ID +
    '" data-asset-index="0" data-prompt-pill-kind="time"><span class="story-time-pill-icon" aria-hidden="true">' +
    STORY_TIME_ICON_SVG +
    '</span><span\x20class=\x22ref-pill-label\x22>' +
    escapeHtml(storyClipTimeLabel) +
    '</span></span>'
  );
}
export function createStoryClipTimeMentionIcon(value34 = globalThis['document']) {
  const el = value34?.['createElement']?.('span');
  if (!el) return null;
  return (
    (el['className'] = 'story-time-pill-icon'),
    el['setAttribute']?.('aria-hidden', 'true'),
    (el['innerHTML'] = STORY_TIME_ICON_SVG),
    el
  );
}
export function beginStoryClipTimePillEdit({
  pill: pill,
  documentObject: documentObject = globalThis['document'],
  onCommit: onCommit = null,
} = {}) {
  if (!pill || !documentObject?.['createElement']) return null;
  const value35 = pill['querySelector']?.('.story-time-pill-input');
  if (value35) return (value35['focus']?.(), value35['select']?.(), value35);
  const enabled2 = pill['querySelector']?.('.ref-pill-label');
  if (!enabled2 || typeof pill['replaceChild'] !== 'function') return null;
  const storyClipTimeLabel2 = normalizeStoryClipTimeLabel(
      pill['dataset']?.['label'] || enabled2['textContent'],
    ),
    el2 = documentObject['createElement']('input');
  ((el2['className'] = 'story-time-pill-input'),
    (el2['type'] = 'text'),
    (el2['inputMode'] = 'decimal'),
    (el2['value'] = storyClipTimeLabel2['replace'](/s$/i, '')),
    (el2['autocomplete'] = 'off'),
    (el2['spellcheck'] = ![]),
    (el2['dataset']['promptPillInlineEditor'] = 'true'),
    el2['setAttribute']?.('aria-label', '片段时间（秒）'));
  let value36 = ![];
  const run = (value37) => {
    if (value36) return;
    value36 = !![];
    const value38 = value37
        ? normalizeStoryClipTimeLabel(el2['value'], storyClipTimeLabel2)
        : storyClipTimeLabel2,
      value39 = documentObject['createElement']('span');
    ((value39['className'] = 'ref-pill-label'), (value39['textContent'] = value38));
    if (el2['parentNode'] === pill) pill['replaceChild'](value39, el2);
    ((pill['dataset']['label'] = value38),
      pill['classList']?.['remove']?.('is-editing'),
      value37 && value38 !== storyClipTimeLabel2 && typeof onCommit === 'function' && onCommit(value38));
  };
  return (
    el2['addEventListener']?.('keydown', (event) => {
      if (event['key'] === 'Enter') {
        (event['preventDefault']?.(), run(!![]));
        return;
      }
      event['key'] === 'Escape' && (event['preventDefault']?.(), run(![]));
    }),
    el2['addEventListener']?.('blur', () => run(!![])),
    pill['replaceChild'](el2, enabled2),
    pill['classList']?.['add']?.('is-editing'),
    el2['focus']?.(),
    el2['select']?.(),
    el2
  );
}
export function resolveStoryClipPromptPillPresentation(value40, value41 = [], value42 = []) {
  const text12 = normalizeText(
      value40?.['dataset']?.['assetId'] || value40?.['getAttribute']?.('data-asset-id'),
    ),
    text13 = normalizeText(
      value40?.['dataset']?.['promptPillKind'] || value40?.['getAttribute']?.('data-prompt-pill-kind'),
    );
  if (text13 === 'time' || text12 === STORY_TIME_MENTION_ASSET_ID)
    return { pillKind: 'time', missingAsset: ![] };
  if (text12['startsWith'](STORY_CLIP_FRAME_MENTION_PREFIX))
    return { pillKind: 'frame', missingAsset: !resolveStoryClipFrameMentionRef(value40, value42) };
  if (!text12['startsWith'](STORY_ASSET_NODE_PREFIX)) return { pillKind: '', missingAsset: ![] };
  return { pillKind: '', missingAsset: !resolveStoryClipAssetMentionRef(value40, value41) };
}
export function syncStoryClipPromptPillPresentation(el3, value43 = [], value44 = []) {
  el3?.['querySelectorAll']?.('.ref-pill')?.['forEach']?.((el4) => {
    syncStoryClipPromptPillHoverTarget(el4);
    const storyClipPromptPillPresentation = resolveStoryClipPromptPillPresentation(el4, value43, value44);
    storyClipPromptPillPresentation['pillKind'] === 'time' &&
      ((el4['dataset']['promptPillKind'] = 'time'), el4['classList']?.['add']?.('story-time-pill'));
    if (storyClipPromptPillPresentation['missingAsset']) {
      ((el4['dataset']['refUnresolved'] = 'true'),
        el4['classList']?.['add']?.('ref-pill--unresolved'),
        el4['setAttribute']?.('data-tooltip', '缺少图片素材'),
        el4['removeAttribute']?.('title'));
      return;
    }
    const text14 = normalizeText(el4?.['dataset']?.['assetId']);
    (text14['startsWith'](STORY_ASSET_NODE_PREFIX) ||
      text14['startsWith'](STORY_CLIP_FRAME_MENTION_PREFIX)) &&
      (delete el4['dataset']['refUnresolved'],
      el4['classList']?.['remove']?.('ref-pill--unresolved'),
      el4['removeAttribute']?.('data-tooltip'),
      el4['removeAttribute']?.('data-native-title'),
      el4['removeAttribute']?.('data-tooltip-source'),
      el4['removeAttribute']?.('title'));
  });
}
export function renderStoryClipPromptMentions(
  value45,
  { assets: assets = [], episode: episode = null, clipFrames: clipFrames = [] } = {},
) {
  const ctx = protectStoryH3LiteralTags(value45),
    ctx2 = protectStoryPromptPills(ctx['source']),
    value46 = episode?.['replication'] ? assets : [];
  for (const value47 of ctx2['pills']) {
    const storyAssetMentionId = parseStoryAssetMentionId(
        value47['html']['match'](/\bdata-asset-id="([^"]+)"/u)?.[0x1],
      ),
      value48 =
        storyAssetMentionId && assets['find']((value49) => value49['id'] === storyAssetMentionId['assetId']),
      value50 = value48?.['appearances']?.['find'](
        (value51) => value51['id'] === storyAssetMentionId['appearanceId'],
      );
    if (value50) {
      const text15 = normalizeText(value50['imageUrl']);
      ((value47['html'] = value47['html']['replace'](/<img\b[^>]*class="ref-pill-thumb"[^>]*>/gu, '')),
        (value47['html'] = value47['html']['replace'](/^<span\b[^>]*>/u, (value52) => {
          let value53 = value52['replace'](/\sdata-ref-unresolved="[^"]*"/u, '')
            ['replace'](/\sdata-tooltip="缺少图片素材"/u, '')
            ['replace'](
              /\bclass="([^"]*)"/u,
              (value54, value55) =>
                'class="' +
                value55['split'](/\s+/u)
                  ['filter']((value56) => value56 !== 'ref-pill--unresolved')
                  ['join']('\x20') +
                (text15 ? '' : '\x20ref-pill--unresolved') +
                '\x22',
            );
          if (!text15)
            value53 = value53['replace'](/>$/u, ' data-ref-unresolved="true" data-tooltip="缺少图片素材">');
          return (
            value53 +
            (text15
              ? '<img class="ref-pill-thumb" src="' + escapeHtml(text15) + '" alt="" draggable="false">'
              : '')
          );
        })));
    }
    const value57 = value46['length'] && getStoryReplicationCharacterDisplayLabel(value48, value50, assets);
    value57 &&
      ((value47['html'] = value47['html']['replace'](
        /\bdata-label="[^"]*"/u,
        'data-label="' + escapeHtml(value57) + '\x22',
      )),
      (value47['html'] = /class="ref-pill-label"/u['test'](value47['html'])
        ? value47['html']['replace'](
            /(<span\b[^>]*class="ref-pill-label"[^>]*>)[\s\S]*?(<\/span>)/u,
            (value58, value59, value60) => '' + value59 + escapeHtml(value57) + value60,
          )
        : value47['html']['replace'](/>[^<>]*<\/span>$/u, '>' + escapeHtml(value57) + '</span>')));
  }
  const enabled3 = ctx2['source'];
  if (!enabled3) return enabled3;
  const storyClipMentionCandidates = buildStoryClipMentionCandidates({
      assets: assets,
      episode: episode,
      clipFrames: clipFrames,
    }),
    args8 = new Map();
  storyClipMentionCandidates['forEach']((value61) => {
    const text16 = normalizeText(value61['label']);
    text16 && !args8['has'](text16) && args8['set'](text16, value61);
    const value62 = Array['isArray'](value61['mentionVariants']) ? value61['mentionVariants'] : [];
    value62['forEach']((value63) => {
      const text17 = normalizeText(value63?.['pillLabel'] || value63?.['label']);
      if (text17) args8['set'](text17, value63);
      if (value63?.['sourcePillLabel']) args8['set'](value63['sourcePillLabel'], value63);
    });
  });
  const list6 = [...args8['keys']()]
      ['filter'](Boolean)
      ['sort']((value64, value65) => value65['length'] - value64['length']),
    value66 = list6['length'] ? '@(?:' + list6['map'](escapeRegExp)['join']('|') + ')' : '(?!)',
    regExp = new RegExp('(' + value66 + ')|(⏱\\s*-?\\d+(?:\\.\\d+)?\\s*(?:s|秒))', 'gi'),
    handler = (list7, { escapeText: escapeText = !![] } = {}) => {
      regExp['lastIndex'] = 0x0;
      let value67 = 0x0,
        value68 = '',
        value69 = null;
      const run2 = (value70) => (escapeText ? escapeHtml(value70) : value70);
      while ((value69 = regExp['exec'](list7))) {
        value68 += run2(list7['slice'](value67, value69['index']));
        if (value69[0x1]) {
          const value71 = value69[0x1]['slice'](0x1),
            value72 = args8['get'](value71);
          value68 += value72 ? renderStoryAssetMentionPill(value72, value46) : run2(value69[0x0]);
        } else value68 += renderStoryTimeMentionPill(value69[0x2]);
        value67 = value69['index'] + value69[0x0]['length'];
      }
      return ((value68 += run2(list7['slice'](value67))), value68);
    };
  if (ctx2['pills']['length'] || /<[a-z][\s\S]*>/i['test'](enabled3))
    return ctx['restore'](
      ctx2['restore'](
        enabled3['split'](/(<[^>]+>)/gu)
          ['map']((value73) => (value73['startsWith']('<') ? value73 : handler(value73, { escapeText: ![] })))
          ['join'](''),
      ),
    );
  return ctx['restore'](ctx2['restore'](handler(enabled3)));
}
export function resolveStoryClipPromptAssetRefs(
  value74,
  {
    assets: assets = [],
    episode: episode = null,
    clipFrames: clipFrames = [],
    resolveExternalAssetRef: resolveExternalAssetRef = null,
    voiceAssetIds: voiceAssetIds = null,
  } = {},
) {
  const renderStoryClipPromptMentions2 = renderStoryClipPromptMentions(value74, {
      assets: assets,
      episode: episode,
      clipFrames: clipFrames,
    }),
    value75 = /<span\b[^>]*\bclass\s*=\s*(["'])[^"']*\bref-pill\b[^"']*\1[^>]*>/gi,
    handler2 = (value76, value77) => {
      const value78 = value76['match'](
        new RegExp('\x5cb' + value77 + '\x5cs*=\x5cs*([\x22\x27])(.*?)\x5c1', 'i'),
      );
      return normalizeText(value78?.[0x2])
        ['replace'](/&quot;/gi, '\x22')
        ['replace'](/&#39;|&apos;/gi, '\x27')
        ['replace'](/&lt;/gi, '<')
        ['replace'](/&gt;/gi, '>')
        ['replace'](/&amp;/gi, '&');
    },
    list8 = [],
    value79 = new Set(),
    enabled4 =
      voiceAssetIds == null ? null : new Set([...voiceAssetIds]['map'](normalizeText)['filter'](Boolean));
  let value80 = null;
  while ((value80 = value75['exec'](renderStoryClipPromptMentions2))) {
    const value81 = value80[0x0],
      enabled5 = handler2(value81, 'data-asset-id');
    if (!enabled5) continue;
    const storyAssetIdFromMentionNodeId = getStoryAssetIdFromMentionNodeId(enabled5),
      value82 = enabled5['startsWith'](STORY_ASSET_NODE_PREFIX)
        ? resolveStoryClipAssetMentionRefs({ dataset: { assetId: enabled5 } }, assets, {
            voiceEnabled:
              enabled4 && !enabled4['has'](storyAssetIdFromMentionNodeId)
                ? ![]
                : getStoryEpisodeCharacterVoiceEnabled(episode, storyAssetIdFromMentionNodeId),
          })
        : enabled5['startsWith'](STORY_CLIP_FRAME_MENTION_PREFIX)
          ? resolveStoryClipFrameMentionRef({ dataset: { assetId: enabled5 } }, clipFrames)
          : typeof resolveExternalAssetRef === 'function'
            ? resolveExternalAssetRef({
                assetId: enabled5,
                itemIndex: Number(handler2(value81, 'data-asset-index')),
              })
            : null;
    (Array['isArray'](value82) ? value82 : [value82])['filter'](Boolean)['forEach']((value83) => {
      const text18 = normalizeText(value83?.['type'] || value83?.['kind']),
        text19 = normalizeText(value83?.['url']);
      if (!text18 || !text19) return;
      const value84 = text18 + ':' + text19;
      if (value79['has'](value84)) return;
      (value79['add'](value84), list8['push'](value83));
    });
  }
  return list8;
}
export function getStoryAssetIdFromMentionNodeId(value85 = '') {
  return parseStoryAssetMentionId(value85)?.['assetId'] || '';
}
export function getStoryEpisodeCharacterVoiceEnabled(options5 = {}, value86 = '') {
  const text20 = normalizeText(value86),
    enabled6 = options5?.['characterVoiceEnabledByAssetId'];
  if (
    !text20 ||
    !enabled6 ||
    typeof enabled6 !== 'object' ||
    Array['isArray'](enabled6) ||
    typeof enabled6[text20] !== 'boolean'
  )
    return undefined;
  return enabled6[text20];
}
export function setStoryEpisodeCharacterVoiceEnabled(enabled7 = {}, value87 = '', value88 = ![]) {
  if (!enabled7 || typeof enabled7 !== 'object' || Array['isArray'](enabled7)) return ![];
  const text21 = normalizeText(value87);
  if (!text21) return ![];
  const args9 = enabled7['characterVoiceEnabledByAssetId'];
  return (
    (enabled7['characterVoiceEnabledByAssetId'] = {
      ...(args9 && typeof args9 === 'object' && !Array['isArray'](args9) ? args9 : {}),
      [text21]: value88 === !![],
    }),
    !![]
  );
}
export function syncStoryClipPromptPillHoverTarget(el5) {
  if (!el5?.['dataset']) return '';
  const storyAssetMentionId2 = parseStoryAssetMentionId(el5['dataset']['assetId']),
    value89 = storyAssetMentionId2?.['assetId'] || '',
    value90 =
      storyAssetMentionId2?.['appearanceId'] === '__asset__'
        ? ''
        : storyAssetMentionId2?.['appearanceId'] || '';
  if (value89) el5['dataset']['storyAssetHoverId'] = value89;
  else delete el5['dataset']['storyAssetHoverId'];
  return (
    value90
      ? (el5['dataset']['storyAssetHoverAppearanceId'] = value90)
      : delete el5['dataset']['storyAssetHoverAppearanceId'],
    value89
  );
}
export function resolveStoryClipAssetMentionRef(value91, value92 = []) {
  const storyAssetMentionId3 = parseStoryAssetMentionId(value91?.['dataset']?.['assetId']);
  if (!storyAssetMentionId3) return null;
  const error = (Array['isArray'](value92) ? value92 : [])['find'](
    (value93) => normalizeText(value93?.['id']) === storyAssetMentionId3['assetId'],
  );
  if (!error) return null;
  const enabled8 =
    storyAssetMentionId3['appearanceId'] === '__asset__'
      ? null
      : (Array['isArray'](error['appearances']) ? error['appearances'] : [])['find'](
          (value94) => normalizeText(value94?.['id']) === storyAssetMentionId3['appearanceId'],
        );
  if (storyAssetMentionId3['appearanceId'] !== '__asset__' && !enabled8) return null;
  const enabled9 =
    storyAssetMentionId3['appearanceId'] === '__asset__'
      ? normalizeText(error['imageUrl'])
      : normalizeText(enabled8?.['imageUrl']);
  if (!enabled9) return null;
  return {
    origin: 'asset',
    assetId: normalizeText(value91?.['dataset']?.['assetId']),
    storyAssetId: storyAssetMentionId3['assetId'],
    appearanceId: storyAssetMentionId3['appearanceId'],
    itemIndex: 0x0,
    type: 'image',
    name: normalizeText(error['name']) || '本集素材',
    label: normalizeText(error['name']) || '本集素材',
    url: enabled9,
    thumbUrl: enabled9,
    nodeData: { type: 'source-image', imageUrl: enabled9 },
  };
}
export function getStoryClipMentionVoiceState(value95, value96 = [], { voiceEnabled: voiceEnabled } = {}) {
  const storyAssetMentionId4 = parseStoryAssetMentionId(value95?.['dataset']?.['assetId']),
    value97 = storyAssetMentionId4
      ? (Array['isArray'](value96) ? value96 : [])['find'](
          (value98) => normalizeText(value98?.['id']) === storyAssetMentionId4['assetId'],
        )
      : null,
    value99 =
      value97?.['kind'] === 'character'
        ? normalizeStoryCharacterVoiceReference(value97?.['voiceReference'])
        : null,
    text22 = normalizeText(value99?.['audioUrl'] || value99?.['localPath']),
    value100 = Boolean(value97 && text22),
    text23 = normalizeText(value95?.['dataset']?.['storyVoiceEnabled']),
    value101 = typeof voiceEnabled === 'boolean' ? voiceEnabled : text23 !== 'false';
  return {
    available: value100,
    enabled: value100 && value101,
    asset: value97,
    voiceReference: value99,
    url: text22,
  };
}
export function setStoryClipMentionVoiceEnabled(el6, value102 = [], value103 = ![]) {
  if (!el6?.['dataset']) return getStoryClipMentionVoiceState(el6, value102);
  const storyClipMentionVoiceState = getStoryClipMentionVoiceState(el6, value102);
  if (storyClipMentionVoiceState['available'] && value103 === !![])
    el6['dataset']['storyVoiceEnabled'] = 'true';
  else
    storyClipMentionVoiceState['available']
      ? (el6['dataset']['storyVoiceEnabled'] = 'false')
      : (delete el6['dataset']['storyVoiceEnabled'], el6['removeAttribute']?.('data-story-voice-enabled'));
  return getStoryClipMentionVoiceState(el6, value102);
}
export function resolveStoryClipAssetMentionRefs(
  value104,
  value105 = [],
  {
    voiceEnabled: voiceEnabled2,
    clipFrames: clipFrames = [],
    resolveExternalAssetRef: resolveExternalAssetRef = null,
  } = {},
) {
  const storyClipFrameMentionRef = resolveStoryClipFrameMentionRef(value104, clipFrames);
  if (storyClipFrameMentionRef) return storyClipFrameMentionRef;
  const text24 = normalizeText(value104?.['dataset']?.['assetId']);
  if (!text24['startsWith'](STORY_ASSET_NODE_PREFIX) && typeof resolveExternalAssetRef === 'function')
    return resolveExternalAssetRef({
      assetId: text24,
      itemIndex: Number(value104?.['dataset']?.['assetIndex'] || 0x0),
    });
  const list9 = [],
    storyClipAssetMentionRef = resolveStoryClipAssetMentionRef(value104, value105);
  if (storyClipAssetMentionRef) list9['push'](storyClipAssetMentionRef);
  const response = getStoryClipMentionVoiceState(value104, value105, { voiceEnabled: voiceEnabled2 });
  if (response['enabled']) {
    const text25 = normalizeText(response['asset']?.['id']);
    list9['push']({
      origin: 'asset',
      assetId: '' + STORY_CHARACTER_VOICE_NODE_PREFIX + encodeURIComponent(text25),
      storyAssetId: text25,
      itemIndex: 0x0,
      type: 'audio',
      name: (normalizeText(response['asset']?.['name']) || '角色') + '\x20·\x20声音参考',
      label: normalizeText(response['asset']?.['name']) || '角色声音',
      url: response['url'],
      audioUrl: response['url'],
      localPath: normalizeText(response['voiceReference']?.['localPath']),
      placeholderTypeLabel: '声音',
      nodeData: {
        type: 'source-audio',
        audioUrl: response['url'],
        localPath: normalizeText(response['voiceReference']?.['localPath']),
      },
    });
  }
  if (list9['length'] === 0x0) return null;
  return list9['length'] === 0x1 ? list9[0x0] : list9;
}
