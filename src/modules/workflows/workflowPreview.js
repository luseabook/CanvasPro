import { getLocale, t } from '../../i18n/index.js';
import { resolveWorkflowNodeThumbSrc } from './workflowCovers.js';
function cleanText(value) {
  return String(value ?? '').trim();
}
function toArray(item) {
  if (Array.isArray(item)) return item;
  if (item && typeof item === 'object') return Object.values(item);
  return [];
}
function stripRichText(key) {
  return String(key ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateText(index, result = 88) {
  const list = cleanText(index);
  if (!list || list.length <= result) return list;
  return list.slice(0, Math.max(0, result - 1)) + '…';
}
const NODE_TYPE_LABEL_KEYS = {
  group: 'nodeTypes.group',
  text: 'nodeTypes.text',
  'source-text': 'nodeTypes.text',
  'ai-text': 'nodeTypes.aiText',
  image: 'nodeTypes.image',
  'source-image': 'nodeTypes.image',
  'ai-image': 'nodeTypes.aiImage',
  video: 'nodeTypes.video',
  'source-video': 'nodeTypes.video',
  'ai-video': 'nodeTypes.aiVideo',
  audio: 'nodeTypes.audio',
  'source-audio': 'nodeTypes.audio',
  'ai-audio': 'nodeTypes.aiAudio',
  comment: 'nodeTypes.note',
  note: 'nodeTypes.note',
  'comment-note': 'nodeTypes.note',
  debug: 'nodeTypes.debug',
  storyboard: 'nodeTypes.storyboard',
  'storyboard-script': 'nodeTypes.storyboardScript',
  'scene-detection': 'nodeTypes.scene',
  'panorama-scene': 'nodeTypes.panoramaScene',
  'panorama-360': 'nodeTypes.panorama360',
};
function workflowPreviewText(data, options = {}) {
  return t('workflows.preview.' + data, options);
}
export function getWorkflowNodeTypeLabel(target) {
  const cleanText2 = cleanText(target).toLowerCase();
  if (!cleanText2) return workflowPreviewText('nodeTypes.node');
  const source = NODE_TYPE_LABEL_KEYS[cleanText2];
  return source ? workflowPreviewText(source) : cleanText2;
}
function getWorkflowNodePlaceholderLabel(next) {
  return getWorkflowNodeTypeLabel(next).replace(/^AI\s+/i, '') || workflowPreviewText('nodeTypes.node');
}
function getWorkflowNodeTitle(error) {
  return (
    cleanText(error?.name) ||
    cleanText(error?.title) ||
    cleanText(error?.fileName) ||
    cleanText(error?.label) ||
    getWorkflowNodeTypeLabel(error?.type)
  );
}
function getWorkflowTagForNode(error2) {
  const list2 = cleanText(error2?.type).toLowerCase(),
    list3 = [
      list2,
      cleanText(error2?.name),
      cleanText(error2?.title),
      cleanText(error2?.label),
      cleanText(error2?.description),
    ]
      .join(' ')
      .toLowerCase();
  if (list3.includes('matting') || list3.includes('keying') || list3.includes('抠图'))
    return workflowPreviewText('tags.matting');
  if (list2.includes('storyboard')) return workflowPreviewText('tags.storyboard');
  if (list2.includes('panorama') || list3.includes('3d')) return '3D';
  if (list2.includes('scene')) return workflowPreviewText('tags.scene');
  if (list2.includes('video')) return workflowPreviewText('tags.video');
  if (list2.includes('audio')) return workflowPreviewText('tags.audio');
  if (list2.includes('image') || list2 === 'photo') return workflowPreviewText('tags.image');
  if (list2.includes('text') || list2.includes('comment') || list2.includes('note'))
    return workflowPreviewText('tags.text');
  return '';
}
function countByTypeLabel(current) {
  const map = new Map();
  for (const entry of current) {
    const workflowNodeTypeLabel = getWorkflowNodeTypeLabel(entry?.type);
    map.set(workflowNodeTypeLabel, (map.get(workflowNodeTypeLabel) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label: label, count: count }))
    .sort(
      (item2, record) => record.count - item2.count || item2.label.localeCompare(record.label, getLocale()),
    );
}
function buildSuggestedTags(payload, handle = 5) {
  const list4 = [],
    map2 = new Set();
  for (const state of payload) {
    const workflowTagForNode = getWorkflowTagForNode(state);
    if (!workflowTagForNode || map2.has(workflowTagForNode)) continue;
    (map2.add(workflowTagForNode), list4.push(workflowTagForNode));
    if (list4.length >= handle) break;
  }
  return list4;
}
function appendWorkflowSuffix(config) {
  const name = cleanText(config);
  if (!name) return '';
  if (getLocale() === 'en-US') {
    if (/\b(?:workflow|flow|template)\b/i.test(name)) return name;
    return workflowPreviewText('suggested.workflowName', { name: name });
  }
  if (/工作流|流程|模板/u.test(name)) return name;
  return workflowPreviewText('suggested.workflowName', { name: name });
}
function buildSuggestedName(count2, tags, scope = {}) {
  const appendWorkflowSuffix2 = appendWorkflowSuffix(scope.sourceName);
  if (appendWorkflowSuffix2) return truncateText(appendWorkflowSuffix2, 50);
  const input = count2.find((item3) => {
      const workflowNodeTitle = getWorkflowNodeTitle(item3),
        workflowNodeTypeLabel2 = getWorkflowNodeTypeLabel(item3?.type);
      return (
        workflowNodeTitle &&
        workflowNodeTitle !== workflowNodeTypeLabel2 &&
        cleanText(item3?.type).toLowerCase() !== 'group'
      );
    }),
    appendWorkflowSuffix3 = appendWorkflowSuffix(getWorkflowNodeTitle(input));
  if (appendWorkflowSuffix3) return truncateText(appendWorkflowSuffix3, 50);
  if (Array.isArray(tags) && tags.length > 0)
    return truncateText(
      workflowPreviewText('suggested.fromTags', {
        tags: tags.slice(0, 2).join(workflowPreviewText('suggested.tagJoiner')),
      }),
      50,
    );
  if (count2.length > 0) return workflowPreviewText('suggested.nodeFlow', { count: count2.length });
  return workflowPreviewText('suggested.canvasWorkflow');
}
function getWorkflowNodeSummary(response) {
  const output = [
    response?.content,
    response?.text,
    response?.prompt,
    response?.outputText,
    response?.description,
    response?.caption,
    response?.subtitle,
    response?.note,
  ];
  for (const value2 of output) {
    const truncateText2 = truncateText(stripRichText(value2));
    if (truncateText2) return truncateText2;
  }
  if (resolveWorkflowNodeThumbSrc(response))
    return workflowPreviewText('hasContent', { label: getWorkflowNodePlaceholderLabel(response?.type) });
  return '';
}
export function buildWorkflowContentPreviewItems(value3) {
  const list5 = toArray(value3?.workflowData?.nodes),
    list6 = list5.some((item4) => cleanText(item4?.type).toLowerCase() !== 'group')
      ? list5.filter((item5) => cleanText(item5?.type).toLowerCase() !== 'group')
      : list5;
  return list6
    .filter((item6) => item6 && typeof item6 === 'object')
    .sort((box, box2) => {
      const value4 = Number(box?.y) || 0,
        value5 = Number(box2?.y) || 0;
      if (value4 !== value5) return value4 - value5;
      const value6 = Number(box?.x) || 0,
        value7 = Number(box2?.x) || 0;
      return value6 - value7;
    })
    .map((item7, value8) => {
      const typeLabel = getWorkflowNodeTypeLabel(item7?.type);
      return {
        id: cleanText(item7?.id) || (cleanText(item7?.type) || 'node') + '-' + (value8 + 1),
        typeLabel: typeLabel,
        placeholderLabel: getWorkflowNodePlaceholderLabel(item7?.type),
        title: truncateText(getWorkflowNodeTitle(item7), 40),
        summary: getWorkflowNodeSummary(item7),
        thumbSrc: resolveWorkflowNodeThumbSrc(item7),
      };
    });
}
export function buildWorkflowSourceSummary(value9, value10 = {}) {
  const workflowData =
      value9?.workflowData && typeof value9.workflowData === 'object' ? value9.workflowData : value9 || {},
    nodeCount = toArray(workflowData.nodes),
    contentNodeCount = nodeCount.some((item8) => cleanText(item8?.type).toLowerCase() !== 'group')
      ? nodeCount.filter((item9) => cleanText(item9?.type).toLowerCase() !== 'group')
      : nodeCount,
    edgeCount = Array.isArray(workflowData.edges) ? workflowData.edges : [],
    typeCounts = countByTypeLabel(contentNodeCount),
    suggestedTags = buildSuggestedTags(contentNodeCount),
    sourceLabel =
      cleanText(value10.sourceLabel) ||
      (value10.sourceGroupId
        ? workflowPreviewText('source.currentGroup')
        : workflowPreviewText('source.wholeCanvas')),
    sourceName = cleanText(value10.sourceName),
    previewItems = buildWorkflowContentPreviewItems({ workflowData: workflowData });
  return {
    sourceLabel: sourceLabel,
    sourceName: sourceName,
    sourceGroupId: cleanText(value10.sourceGroupId),
    nodeCount: nodeCount.length,
    contentNodeCount: contentNodeCount.length,
    edgeCount: edgeCount.length,
    isEmpty: nodeCount.length === 0,
    typeCounts: typeCounts,
    typeSummary: typeCounts.map((item10) => item10.label + ' ' + item10.count).join(' · '),
    previewItems: previewItems,
    suggestedName: buildSuggestedName(contentNodeCount, suggestedTags, { sourceName: sourceName }),
    suggestedTags: suggestedTags,
  };
}
