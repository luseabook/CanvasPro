import {
  resolveCanvasImageLowZoomUrl,
  resolveCanvasVideoPosterUrl,
} from '../../services/canvasMediaLocalService.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
import { reviewElement } from './collaborationReviewDom.js';
export function nodeReferencePresentation(error, value = '节点') {
  if (!error) return { name: value, kind: 'action', label: '节点已删除', url: '' };
  const item = String(error['type'] || ''),
    key = item['includes']('audio')
      ? 'audio'
      : item['includes']('video')
        ? 'video'
        : item['includes']('image')
          ? 'image'
          : 'text',
    index = Array['isArray'](error['images'])
      ? error['images'][Math['max'](0, Number(error['mainImageIndex']) || 0)] || error['images'][0]
      : null,
    result =
      key === 'image'
        ? resolveCanvasImageLowZoomUrl(index || error) || resolveCanvasImageLowZoomUrl(error)
        : resolveCanvasVideoPosterUrl(error);
  return {
    name: error['name'] || value,
    kind: key,
    label: { image: '图片节点', video: '视频节点', audio: '音频节点', text: '节点' }[key],
    url: result,
  };
}
export function updateNodeReference(
  el,
  enabled,
  data,
  { compact: compact = ![], onRemove: onRemove, onOpen: onOpen } = {},
) {
  const response = nodeReferencePresentation(enabled, data),
    options = JSON['stringify']([response, compact, !!onRemove]);
  if (el['dataset']['referenceSignature'] === options) return;
  ((el['dataset']['referenceSignature'] = options),
    el['classList']['add']('collaboration-node-reference'),
    el['classList']['toggle']('is-compact', compact),
    el['classList']['toggle']('ref-thumb-wrap', compact),
    el['classList']['toggle']('is-missing', !enabled),
    el['setAttribute']('aria-label', '' + response['name'] + (enabled ? '，定位节点' : '，节点已删除')));
  const reviewElement2 = reviewElement('span', 'collaboration-node-reference-preview');
  if (compact) reviewElement2['classList']['add']('ref-thumb-media');
  reviewElement2['append'](createContextMenuIcon(response['kind']));
  if (response['url']) {
    const el2 = reviewElement('img');
    ((el2['alt'] = ''),
      (el2['loading'] = 'lazy'),
      (el2['decoding'] = 'async'),
      el2['addEventListener']('error', () => el2['remove'](), { once: !![] }),
      (el2['src'] = response['url']),
      reviewElement2['append'](el2));
  }
  const reviewElement3 = reviewElement('span', 'collaboration-node-reference-text');
  reviewElement3['append'](
    reviewElement('span', 'collaboration-node-reference-name', response['name']),
    reviewElement('span', 'collaboration-node-reference-kind', response['label']),
  );
  if (onRemove) {
    const reviewElement4 = reviewElement('button', 'collaboration-reference-open');
    (reviewElement4['setAttribute']('aria-label', el['getAttribute']('aria-label')),
      reviewElement4['append'](reviewElement2, reviewElement3),
      reviewElement4['addEventListener']('click', onOpen));
    const reviewElement5 = reviewElement('button', 'collaboration-reference-remove ref-thumb-delete', '×');
    (reviewElement5['setAttribute']('aria-label', '移除引用 ' + response['name']),
      reviewElement5['addEventListener']('click', (target) => {
        (target['stopPropagation'](), onRemove());
      }),
      el['replaceChildren'](reviewElement4, reviewElement5));
  } else
    el['replaceChildren'](
      reviewElement2,
      reviewElement3,
      ...(compact ? [] : [createContextMenuIcon('action')]),
    );
}
