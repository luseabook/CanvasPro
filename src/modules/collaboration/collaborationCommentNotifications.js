import { showToast } from '../../services/toastService.js';
import { updateNodeReference } from './collaborationNodeReference.js';
import { reviewElement, colorMemberName, appendMentionText } from './collaborationReviewDom.js';
export function createCollaborationCommentNotifications({
  getSession: getSession,
  hasNode: hasNode,
  getNode: getNode = () => null,
  openNode: openNode,
  notify: notify = showToast,
}) {
  return (id2) => {
    const enabled = getSession(),
      error = id2['nodes']?.[0x0];
    if (!enabled || !error) return;
    const value = id2['kind'] === 'resolve';
    if (value && !id2['mentions']?.['includes'](enabled['state']?.['actorId'])) return;
    const ariaLabel = value
      ? id2['name'] + '\x20已解决你在「' + error['name'] + '」的评论：' + (id2['preview'] || '评论已解决')
      : id2['name'] + '\x20评论了「' + error['name'] + '」：' + (id2['preview'] || '新评论');
    notify(ariaLabel, 'ok', 0x1770, {
      ariaLabel: ariaLabel + '，点击定位节点并查看评论',
      renderContent(el) {
        const el2 = reviewElement('span'),
          reviewElement2 = reviewElement('span', 'collaboration-notice-text');
        updateNodeReference(el2, getNode(error['id']), error['name']);
        const item = el2['querySelector']('.collaboration-node-reference-preview'),
          error2 = enabled['state']?.['members']?.['find']((key) => key['id'] === id2['actor']) || {
            id: id2['actor'],
            name: id2['name'],
          };
        (reviewElement2['append'](
          colorMemberName(reviewElement('strong', '', error2['name'] || id2['name']), error2),
        ),
          appendMentionText(
            reviewElement2,
            ariaLabel['slice'](id2['name']['length']),
            enabled['state']?.['members'] || [],
            id2['mentions'] || [],
          ),
          el['classList']['add']('collaboration-comment-notice'),
          el['replaceChildren'](item, reviewElement2));
      },
      onClick() {
        if (getSession() !== enabled) return;
        if (!hasNode(error['id'])) {
          notify('该节点已删除', 'ok');
          return;
        }
        openNode(error['id'], !![]);
      },
    });
  };
}
