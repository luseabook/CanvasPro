import { showToast } from '../../services/toastService.js';
import { updateNodeReference } from './collaborationNodeReference.js';
import { reviewElement, colorMemberName, appendMentionText } from './collaborationReviewDom.js';
export function createCollaborationCommentNotifications({
  getSession: _0x554a7b,
  hasNode: _0x12053c,
  getNode: getNode = () => null,
  openNode: _0x216799,
  notify: notify = showToast,
}) {
  return (_0x3b9258) => {
    const _0x3f6c58 = _0x554a7b(),
      _0x1dd8a5 = _0x3b9258['nodes']?.[0x0];
    if (!_0x3f6c58 || !_0x1dd8a5) return;
    const _0x98f7b3 = _0x3b9258['kind'] === 'resolve';
    if (_0x98f7b3 && !_0x3b9258['mentions']?.['includes'](_0x3f6c58['state']?.['actorId'])) return;
    const _0x100403 = _0x98f7b3
      ? _0x3b9258['name'] +
        '\x20已解决你在「' +
        _0x1dd8a5['name'] +
        '」的评论：' +
        (_0x3b9258['preview'] || '评论已解决')
      : _0x3b9258['name'] + '\x20评论了「' + _0x1dd8a5['name'] + '」：' + (_0x3b9258['preview'] || '新评论');
    notify(_0x100403, 'ok', 0x1770, {
      ariaLabel: _0x100403 + '，点击定位节点并查看评论',
      renderContent(_0xc5e4bf) {
        const _0xc13483 = reviewElement('span'),
          _0x21f370 = reviewElement('span', 'collaboration-notice-text');
        updateNodeReference(_0xc13483, getNode(_0x1dd8a5['id']), _0x1dd8a5['name']);
        const _0x4ae38d = _0xc13483['querySelector']('.collaboration-node-reference-preview'),
          _0xfedcf8 = _0x3f6c58['state']?.['members']?.['find'](
            (_0x2c19c8) => _0x2c19c8['id'] === _0x3b9258['actor'],
          ) || { id: _0x3b9258['actor'], name: _0x3b9258['name'] };
        (_0x21f370['append'](
          colorMemberName(reviewElement('strong', '', _0xfedcf8['name'] || _0x3b9258['name']), _0xfedcf8),
        ),
          appendMentionText(
            _0x21f370,
            _0x100403['slice'](_0x3b9258['name']['length']),
            _0x3f6c58['state']?.['members'] || [],
            _0x3b9258['mentions'] || [],
          ),
          _0xc5e4bf['classList']['add']('collaboration-comment-notice'),
          _0xc5e4bf['replaceChildren'](_0x4ae38d, _0x21f370));
      },
      onClick() {
        if (_0x554a7b() !== _0x3f6c58) return;
        if (!_0x12053c(_0x1dd8a5['id'])) {
          notify('该节点已删除', 'ok');
          return;
        }
        _0x216799(_0x1dd8a5['id'], !![]);
      },
    });
  };
}
