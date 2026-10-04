import { worldToScreen } from '../../core/math.js';
import { readNodeGeometryPreview } from '../../core/nodeGeometryPreview.js';
export function drawCollaborationMediaStatus({
  state: state,
  nodes: nodes,
  viewport: viewport,
  bounds: bounds,
  entryFor: entryFor,
  getSession: getSession,
  documentObject: documentObject,
}) {
  for (const error of state?.['mediaNodes'] || []) {
    if (!error['failed']) continue;
    const box = readNodeGeometryPreview(error['id'], nodes[error['id']]);
    if (!box || !box['width'] || !box['height']) continue;
    const box2 = worldToScreen(box['x'], box['y'], viewport),
      value = box['width'] * viewport['zoom'],
      item = box['height'] * viewport['zoom'];
    if (
      box2['x'] + value < bounds['left'] ||
      box2['x'] > bounds['left'] + bounds['width'] ||
      box2['y'] + item < bounds['top'] ||
      box2['y'] > bounds['top'] + bounds['height']
    )
      continue;
    const el = entryFor('media:' + error['id'], 'collaboration-media-status');
    if (!el['firstChild']) {
      const key = documentObject['createElement']('span'),
        el2 = documentObject['createElement']('button');
      ((el2['type'] = 'button'),
        (el2['textContent'] = '重试'),
        el2['addEventListener']('click', (event) => {
          (event['stopPropagation'](), getSession()?.['retryMedia'](el['dataset']['nodeId']));
        }),
        el['append'](key, el2),
        el['setAttribute']('role', 'status'));
    }
    ((el['dataset']['nodeId'] = error['id']),
      el['classList']['toggle']('is-failed', error['failed']),
      (el['firstChild']['textContent'] = error['message']
        ? '素材准备失败：' + error['message']
        : '素材准备失败'),
      (el['lastChild']['hidden'] = !error['retry']),
      el['lastChild']['setAttribute']('aria-label', '重试 ' + (box['name'] || '素材')),
      (el['title'] =
        error['failed'] && !error['retry'] ? '请添加此素材的成员重试' : el['firstChild']['textContent']),
      (el['style']['transform'] = 'translate(' + box2['x'] + 'px,\x20' + box2['y'] + 'px)'),
      (el['style']['maxWidth'] = value + 'px'));
  }
}
