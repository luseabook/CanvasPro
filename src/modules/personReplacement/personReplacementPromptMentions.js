import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
import { resolveAssetMentionRef } from '../assetMentionRegistry.js';
import { getWorkspaceAssetAppearances } from '../workspaceAssetAppearance.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { PERSON_REPLACEMENT_PROMPT_MODE_MANUAL } from './personReplacementPromptMode.js';
import { resolvePersonReplacementLocationGuidePreview } from './personReplacementLocationGuideSvg.js';
export const PERSON_REPLACEMENT_PROMPT_ASSET_PREFIX = 'person-replacement-asset:';
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function normalizeMediaUrl(index) {
  const text = normalizeText(index);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
function escapeHtml(result) {
  return String(result ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#039;');
}
function encodeMentionPart(data, options = '__asset__') {
  return encodeURIComponent(normalizeText(data, options));
}
function buildMentionId(target, source, next = '__asset__') {
  return (
    '' +
    PERSON_REPLACEMENT_PROMPT_ASSET_PREFIX +
    encodeURIComponent(target) +
    ':' +
    encodeMentionPart(source) +
    ':' +
    encodeMentionPart(next)
  );
}
function parseMentionId(current = '') {
  const list = normalizeText(current);
  if (!list['startsWith'](PERSON_REPLACEMENT_PROMPT_ASSET_PREFIX)) return null;
  const list2 = list['slice'](PERSON_REPLACEMENT_PROMPT_ASSET_PREFIX['length'])['split'](':');
  if (list2['length'] !== 3) return null;
  try {
    const [entry, record, payload] = list2['map']((handle) => decodeURIComponent(handle));
    return entry && record ? { kind: entry, assetId: record, itemId: payload } : null;
  } catch {
    return null;
  }
}
function matchesQuery(state, config = '') {
  const text2 = normalizeText(config)['replace'](/^@+/, '')['toLowerCase']();
  if (!text2) return true;
  return [
    state?.['label'],
    state?.['subtitle'],
    state?.['pillLabel'],
    state?.['assetName'],
    state?.['menuGroup'],
  ]
    ['map']((scope) => normalizeText(scope)['toLowerCase']())
    ['some']((input) => input['includes'](text2));
}
function createImageMentionCandidate({
  kind: kind,
  assetId: assetId,
  itemId: itemId,
  label: label,
  subtitle: subtitle,
  assetName: assetName,
  thumbUrl: thumbUrl,
  menuGroup: menuGroup,
  menuSection: menuSection,
  sourceItemIndex: sourceItemIndex = 0,
} = {}) {
  const text3 = normalizeText(label, '图片素材'),
    mediaUrl = normalizeMediaUrl(thumbUrl);
  return {
    origin: 'asset',
    menuDirect: true,
    suppressTooltip: true,
    assetId: buildMentionId(kind, assetId, itemId),
    assetIndex: 0,
    type: 'image',
    label: text3,
    pillLabel: text3,
    subtitle: normalizeText(subtitle),
    assetName: normalizeText(assetName, text3),
    thumbUrl: mediaUrl,
    iconType: 'image',
    menuPage: 'assets',
    menuGroup: menuGroup,
    menuSection: menuSection,
    personReplacementAssetKind: kind,
    personReplacementSourceItemIndex: sourceItemIndex,
  };
}
function getSelectedShot(options2 = {}) {
  const text4 = normalizeText(options2['workspace']?.['selectedShotId']),
    output = Array['isArray'](options2['shots']) ? options2['shots'] : [];
  return output['find']((value2) => normalizeText(value2?.['id']) === text4) || output[0] || null;
}
function resolvePromptPackage(
  options3 = {},
  { promptPackage: promptPackage = null, shot: shot = null } = {},
) {
  if (promptPackage) return promptPackage;
  const enabled = shot || getSelectedShot(options3);
  if (!enabled) return null;
  return buildPersonReplacementPromptPackage({ project: options3, shot: enabled });
}
function describePromptReference(options4 = {}, value3 = {}) {
  const value4 = Math['max'](1, Number(options4['slot']) || 1),
    text5 = normalizeText(options4['label'], '图' + value4);
  if (options4['role'] === 'source-keyframe')
    return { slotLabel: text5, subtitle: '当前首帧', assetName: '当前首帧' };
  if (options4['role'] === 'person-location-guide')
    return { slotLabel: text5, subtitle: '主体定位图', assetName: '主体定位图' };
  const error = (Array['isArray'](value3['characters']) ? value3['characters'] : [])['find'](
      (value5) => normalizeText(value5?.['id']) === normalizeText(options4['targetCharacterId']),
    ),
    text6 = normalizeText(error?.['name'], '目标形象');
  return { slotLabel: text5, subtitle: text6, assetName: text6 };
}
function buildCurrentReferenceCandidates(
  options5 = {},
  { query: query = '', promptPackage: promptPackage = null, shot: shot = null } = {},
) {
  const promptPackage2 = resolvePromptPackage(options5, { promptPackage: promptPackage, shot: shot }),
    list3 = Array['isArray'](promptPackage2?.['referenceImages']) ? promptPackage2['referenceImages'] : [];
  return list3['filter']((value6) => normalizeMediaUrl(value6?.['ref']))
    ['map']((value7, value8) => {
      const value9 = Math['max'](1, Number(value7['slot']) || value8 + 1),
        {
          slotLabel: slotLabel,
          subtitle: subtitle2,
          assetName: assetName2,
        } = describePromptReference(value7, options5);
      return createImageMentionCandidate({
        kind: 'reference',
        assetId: String(value9),
        itemId: normalizeText(
          [value7['role'], value7['targetCharacterId'], value7['targetAppearanceId']]
            ['filter'](Boolean)
            ['join'](':'),
          String(value8),
        ),
        label: slotLabel,
        subtitle: subtitle2,
        assetName: assetName2,
        thumbUrl:
          value7['role'] === 'person-location-guide'
            ? resolvePersonReplacementLocationGuidePreview(value7['ref'])
            : value7['ref'],
        menuGroup: '当前入参',
        menuSection: '图像',
      });
    })
    ['filter']((value10) => matchesQuery(value10, query));
}
function buildProjectAssetCandidates(options6 = {}) {
  return (Array['isArray'](options6['characters']) ? options6['characters'] : [])
    ['map']((error2) => {
      const list4 = getWorkspaceAssetAppearances(error2)['filter']((value11) =>
        normalizeText(value11?.['imageUrl']),
      );
      if (!list4['length']) return null;
      const value12 = Math['max'](
          0,
          Math['min'](
            list4['length'] - 1,
            Math['trunc'](Number(options6['workspace']?.['assetAppearanceIndexes']?.[error2['id']]) || 0),
          ),
        ),
        args = list4['map']((value13) =>
          createImageMentionCandidate({
            kind: 'character',
            assetId: error2['id'],
            itemId: value13['id'],
            label:
              normalizeText(error2['name'], '人物素材') +
              ' · ' +
              normalizeText(value13['name'], '形象'),
            subtitle: '项目素材',
            assetName: normalizeText(error2['name'], '人物素材'),
            thumbUrl: value13['imageUrl'],
            menuGroup: '项目素材',
            menuSection: '人物',
          }),
        );
      return { ...args[value12], mentionVariants: args, mentionVariantIndex: value12 };
    })
    ['filter']((value14) => value14 && matchesQuery(value14));
}
function buildProjectSceneCandidates(options7 = {}, value15 = '') {
  return (Array['isArray'](options7['scenes']) ? options7['scenes'] : [])
    ['map']((value16) => {
      const workspaceAssetAppearances = getWorkspaceAssetAppearances(value16)['filter']((value17) =>
        normalizeText(value17?.['imageUrl']),
      );
      if (!workspaceAssetAppearances['length']) return null;
      const value18 = Math['max'](
          0,
          Math['min'](
            workspaceAssetAppearances['length'] - 1,
            Math['trunc'](Number(options7['workspace']?.['assetAppearanceIndexes']?.[value16['id']]) || 0),
          ),
        ),
        args2 = workspaceAssetAppearances['map']((value19) =>
          createImageMentionCandidate({
            kind: 'scene',
            assetId: value16['id'],
            itemId: value19['id'],
            label:
              normalizeText(value16['name'], '场景素材') + ' · ' + normalizeText(value19['name'], '场景图'),
            subtitle: '项目素材',
            assetName: normalizeText(value16['name'], '场景素材'),
            thumbUrl: value19['imageUrl'],
            menuGroup: '项目素材',
            menuSection: '场景',
          }),
        );
      return { ...args2[value18], mentionVariants: args2, mentionVariantIndex: value18 };
    })
    ['filter']((value20) => value20 && matchesQuery(value20, value15));
}
function buildLibraryAssetCandidates(options8 = {}) {
  return (Array['isArray'](options8['libraryAssets']) ? options8['libraryAssets'] : [])
    ['filter'](
      (value21) =>
        normalizeText(value21?.['mediaKind'] || value21?.['type'])['toLowerCase']() === 'image' &&
        normalizeText(value21?.['imageUrl'] || value21?.['sourceUrl']),
    )
    ['map']((value22) =>
      createImageMentionCandidate({
        kind: 'library',
        assetId: normalizeText(value22['sourceAssetId'] || value22['assetId'] || value22['id']),
        itemId: normalizeText(value22['sourceItemIndex'] ?? value22['itemIndex'], '0'),
        sourceItemIndex: Math['max'](
          0,
          Math['trunc'](Number(value22['sourceItemIndex'] ?? value22['itemIndex']) || 0),
        ),
        label: normalizeText(value22['name'], '画布图片'),
        subtitle: normalizeText(value22['assetName'], '总素材'),
        assetName: normalizeText(value22['assetName'], '总素材'),
        thumbUrl: value22['imageUrl'] || value22['thumbnailUrl'] || value22['sourceUrl'],
        menuGroup: '总素材',
        menuSection: '图片',
      }),
    )
    ['filter']((value23) => value23);
}
export function buildPersonReplacementPromptMentionCandidates(
  options9 = {},
  { query: query = '', promptPackage: promptPackage = null, shot: shot = null } = {},
) {
  const args3 =
    (shot || getSelectedShot(options9))?.['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL;
  return [
    ...buildCurrentReferenceCandidates(options9, { query: query, promptPackage: promptPackage, shot: shot }),
    ...buildProjectSceneCandidates(options9, query),
    ...(args3
      ? [...buildProjectAssetCandidates(options9), ...buildLibraryAssetCandidates(options9)]['filter'](
          (value24) => matchesQuery(value24, query),
        )
      : []),
  ];
}
export function resolvePersonReplacementPromptMentionRef(
  el,
  {
    project: project = {},
    promptPackage: promptPackage = null,
    shot: shot = null,
    resolveExternalAssetRef: resolveExternalAssetRef = resolveAssetMentionRef,
  } = {},
) {
  const mentionId = parseMentionId(el?.['dataset']?.['assetId'] || el?.['getAttribute']?.('data-asset-id'));
  if (!mentionId) {
    if (typeof resolveExternalAssetRef !== 'function') return null;
    return resolveExternalAssetRef({
      assetId: el?.['dataset']?.['assetId'] || el?.['getAttribute']?.('data-asset-id'),
      itemIndex: Number(el?.['dataset']?.['assetIndex'] || el?.['getAttribute']?.('data-asset-index') || 0),
    });
  }
  if (mentionId['kind'] === 'reference') {
    const promptPackage3 = resolvePromptPackage(project, { promptPackage: promptPackage, shot: shot }),
      value25 = Array['isArray'](promptPackage3?.['referenceImages'])
        ? promptPackage3['referenceImages']
        : [],
      enabled2 = value25['find'](
        (value26) =>
          [value26['role'], value26['targetCharacterId'], value26['targetAppearanceId']]
            ['filter'](Boolean)
            ['join'](':') === mentionId['itemId'],
      ),
      mediaUrl2 = normalizeMediaUrl(enabled2?.['ref']);
    if (!enabled2 || !mediaUrl2) return null;
    const { slotLabel: slotLabel2, subtitle: subtitle3 } = describePromptReference(enabled2, project);
    return {
      origin: 'asset',
      assetId: mentionId['assetId'],
      itemIndex: 0,
      type: 'image',
      name: slotLabel2 + ' · ' + subtitle3,
      label: slotLabel2,
      referenceSlot: enabled2['slot'],
      url: mediaUrl2,
      thumbUrl: mediaUrl2,
      nodeData: { type: 'source-image', imageUrl: mediaUrl2 },
    };
  }
  if (mentionId['kind'] === 'character') {
    const enabled3 = (Array['isArray'](project['characters']) ? project['characters'] : [])['find'](
        (value27) => normalizeText(value27?.['id']) === mentionId['assetId'],
      ),
      workspaceAssetAppearances2 = getWorkspaceAssetAppearances(enabled3)['find'](
        (value28) => normalizeText(value28?.['id']) === mentionId['itemId'],
      ),
      mediaUrl3 = normalizeMediaUrl(workspaceAssetAppearances2?.['imageUrl']);
    if (!enabled3 || !workspaceAssetAppearances2 || !mediaUrl3) return null;
    return {
      origin: 'asset',
      assetId: mentionId['assetId'],
      itemIndex: 0,
      type: 'image',
      name:
        normalizeText(enabled3['name'], '人物素材') +
        ' · ' +
        normalizeText(workspaceAssetAppearances2['name'], '形象'),
      label:
        normalizeText(enabled3['name'], '人物素材') +
        ' · ' +
        normalizeText(workspaceAssetAppearances2['name'], '形象'),
      url: mediaUrl3,
      thumbUrl: mediaUrl3,
      nodeData: { type: 'source-image', imageUrl: mediaUrl3 },
    };
  }
  if (mentionId['kind'] === 'scene') {
    const enabled4 = (Array['isArray'](project['scenes']) ? project['scenes'] : [])['find'](
        (value29) => normalizeText(value29?.['id']) === mentionId['assetId'],
      ),
      workspaceAssetAppearances3 = getWorkspaceAssetAppearances(enabled4)['find'](
        (value30) => normalizeText(value30?.['id']) === mentionId['itemId'],
      ),
      mediaUrl4 = normalizeMediaUrl(workspaceAssetAppearances3?.['imageUrl']);
    if (!enabled4 || !workspaceAssetAppearances3 || !mediaUrl4) return null;
    return {
      origin: 'asset',
      assetId: mentionId['assetId'],
      itemIndex: 0,
      type: 'image',
      name:
        normalizeText(enabled4['name'], '场景素材') +
        ' · ' +
        normalizeText(workspaceAssetAppearances3['name'], '场景图'),
      label:
        normalizeText(enabled4['name'], '场景素材') +
        ' · ' +
        normalizeText(workspaceAssetAppearances3['name'], '场景图'),
      url: mediaUrl4,
      thumbUrl: mediaUrl4,
      nodeData: { type: 'source-image', imageUrl: mediaUrl4 },
    };
  }
  if (mentionId['kind'] === 'library') {
    const value31 = Math['max'](0, Math['trunc'](Number(mentionId['itemId']) || 0)),
      enabled5 = (Array['isArray'](project['libraryAssets']) ? project['libraryAssets'] : [])['find'](
        (value32) =>
          normalizeText(value32?.['sourceAssetId'] || value32?.['assetId'] || value32?.['id']) ===
            mentionId['assetId'] &&
          Math['max'](
            0,
            Math['trunc'](Number(value32?.['sourceItemIndex'] ?? value32?.['itemIndex']) || 0),
          ) === value31,
      ),
      mediaUrl5 = normalizeMediaUrl(enabled5?.['sourceUrl'] || enabled5?.['imageUrl']);
    if (!enabled5 || !mediaUrl5) return null;
    return {
      origin: 'asset',
      assetId: mentionId['assetId'],
      itemIndex: value31,
      type: 'image',
      name: normalizeText(enabled5['name'], '画布图片'),
      label: normalizeText(enabled5['name'], '画布图片'),
      url: mediaUrl5,
      thumbUrl: normalizeMediaUrl(enabled5['imageUrl'] || enabled5['thumbnailUrl'] || enabled5['sourceUrl']),
      nodeData: { type: 'source-image', imageUrl: mediaUrl5 },
    };
  }
  return null;
}
export function renderPersonReplacementPromptHtml(value33 = '') {
  const enabled6 = String(value33 ?? '');
  if (!enabled6) return '';
  if (/<(?:br\b|span\b[^>]*\bref-pill\b)/iu['test'](enabled6)) return sanitizePromptHtmlForCommit(enabled6);
  return escapeHtml(enabled6)['replace'](/\r\n?|\n/gu, '<br>');
}
