import { scrollClosestElementHorizontallyWithWheel } from '../workspaceHorizontalWheel.js';
import { reconcileElementTree } from './personReplacementShotSelectionRendering.js';
import { createPersonReplacementResultHistoryLayout } from './personReplacementResultHistoryLayout.js';
const PANEL = '[data-person-replacement-result-history-menu]',
  TOGGLE = '[data-person-replacement-result-history-toggle]',
  CLOSE = '[data-person-replacement-result-history-close]';
export function createPersonReplacementResultHistoryController({
  getRoot: _0x3880d3,
  getProject: _0x25221e,
  renderHistoryMenu: _0x5099be,
  selectShot: _0x650362,
  isCutEditorOpen: isCutEditorOpen = () => ![],
} = {}) {
  let _0x2c0d05 = null,
    _0x5e0937 = null,
    _0x204cbc = '',
    _0x353979 = 0x0;
  const _0x5604d9 = createPersonReplacementResultHistoryLayout(),
    _0x5633c4 = (_0x3f9e70) =>
      Array['from'](_0x3880d3()?.['querySelectorAll']?.(TOGGLE) || [])['find'](
        (_0x240823) => _0x240823['dataset']['shotId'] === _0x3f9e70,
      ),
    _0x3c053c = () => {
      if (!_0x2c0d05) return null;
      const _0xd1bc3e = _0x5e0937?.['querySelector']?.('.story-media-history-list'),
        _0x27fe98 = _0x5e0937?.['ownerDocument']?.['activeElement'];
      return {
        ..._0x2c0d05,
        scrollLeft: _0xd1bc3e?.['scrollLeft'] || 0x0,
        focus:
          _0x5e0937?.['contains']?.(_0x27fe98) && _0x27fe98?.['matches']?.('button')
            ? Object['fromEntries'](
                [
                  'storyAction',
                  'shotId',
                  'replacementImageResultIndex',
                  'replacementVideoResultIndex',
                  'personReplacementResultHistoryClose',
                ]
                  ['filter']((_0x4e42ab) => _0x4e42ab in _0x27fe98['dataset'])
                  ['map']((_0x3cbebb) => [_0x3cbebb, _0x27fe98['dataset'][_0x3cbebb]]),
              )
            : null,
      };
    },
    _0x2dc5c0 = (_0x2acd2a) =>
      scrollClosestElementHorizontallyWithWheel(_0x2acd2a, '.story-media-history-list', {
        boundaryRoot: _0x5e0937,
        stopPropagation: !![],
        preserveNestedScrollable: !![],
      }),
    _0x25fda9 = () => {
      for (const _0x5c57f0 of _0x3880d3()?.['querySelectorAll']?.(TOGGLE) || []) {
        const _0x3b134d = _0x2c0d05?.['shotId'] === _0x5c57f0['dataset']['shotId'];
        (_0x5c57f0['setAttribute']('aria-expanded', String(_0x3b134d)),
          _0x5c57f0['setAttribute'](
            'aria-label',
            '' + (_0x3b134d ? '收起' : '展开') + _0x5c57f0['dataset']['resultCount'] + '\x20个结果',
          ));
      }
    },
    _0x43e86e = ({ animate: animate = ![] } = {}) => {
      const _0x3429cb = ++_0x353979,
        _0x3322a9 = _0x5e0937;
      _0x2c0d05 = null;
      _0x5e0937 &&
        (_0x5e0937['classList']['remove']('is-visible'),
        _0x5e0937['setAttribute']('aria-hidden', 'true'),
        (_0x5e0937['inert'] = !![]));
      _0x25fda9();
      const _0x5baf12 = () => {
          if (_0x3429cb !== _0x353979 || _0x3322a9 !== _0x5e0937) return;
          (_0x5e0937 && ((_0x5e0937['hidden'] = !![]), (_0x5e0937['innerHTML'] = '')), (_0x204cbc = ''));
        },
        _0x43e46f = _0x5604d9['hide']({ animate: animate });
      if (_0x43e46f['length']) {
        Promise['allSettled'](_0x43e46f['map']((_0x445958) => _0x445958['finished']))['then'](_0x5baf12);
        return;
      }
      _0x5baf12();
    },
    _0x4dcc8b = (_0x37f03f = _0x3c053c()) => {
      const _0x2dd3a5 = _0x3880d3()?.['querySelector']?.(PANEL) || null;
      _0x2dd3a5 !== _0x5e0937 &&
        (_0x5e0937?.['removeEventListener']?.('wheel', _0x2dc5c0),
        (_0x5e0937 = _0x2dd3a5),
        (_0x204cbc = ''),
        _0x5e0937?.['addEventListener']?.('wheel', _0x2dc5c0, { passive: ![] }));
      const _0x53bc80 = _0x25221e(),
        _0x33f72f = _0x53bc80['workspace'];
      if (
        !_0x2c0d05 ||
        !_0x5e0937 ||
        _0x33f72f['view'] !== 'project' ||
        _0x2c0d05['projectId'] !== _0x53bc80['id'] ||
        _0x2c0d05['step'] !== _0x33f72f['step'] ||
        _0x33f72f['selectedShotId'] !== _0x2c0d05['shotId'] ||
        _0x33f72f['shotSelectionMode'] ||
        isCutEditorOpen()
      )
        return (_0x43e86e(), ![]);
      const _0x9b9e37 = _0x53bc80['shots']['findIndex'](
        (_0x2c9e12) => _0x2c9e12['id'] === _0x2c0d05['shotId'],
      );
      if (_0x9b9e37 < 0x0) return (_0x43e86e(), ![]);
      const _0x249eb7 = _0x5099be({
        kind: _0x2c0d05['step'] === 0x3 ? 'video' : 'image',
        shot: _0x53bc80['shots'][_0x9b9e37],
        title: '片段' + String(_0x9b9e37 + 0x1)['padStart'](0x2, '0'),
        allowSingleResult: !![],
      });
      if (!_0x249eb7) return (_0x43e86e(), ![]);
      const _0x316f00 =
        '<div class="person-replacement-result-history-content"><button type="button" class="person-replacement-result-history-close" data-person-replacement-result-history-close aria-label="收起结果">收起</button>' +
        _0x249eb7 +
        '</div>';
      if (_0x204cbc !== _0x316f00) {
        const _0x3ebd05 = _0x5e0937['cloneNode']?.(![]);
        (_0x3ebd05 && _0x204cbc
          ? ((_0x3ebd05['innerHTML'] = _0x316f00),
            reconcileElementTree(_0x5e0937, _0x3ebd05, { preserveImageNodes: !![] }))
          : (_0x5e0937['innerHTML'] = _0x316f00),
          (_0x204cbc = _0x316f00));
      }
      (++_0x353979,
        (_0x5e0937['inert'] = ![]),
        (_0x5e0937['hidden'] = ![]),
        _0x5e0937['classList']['add']('is-visible'),
        _0x5e0937['setAttribute']('aria-hidden', 'false'),
        (_0x5e0937['dataset']['shotId'] = _0x2c0d05['shotId']),
        (_0x5e0937['dataset']['historyKind'] = _0x2c0d05['step'] === 0x3 ? 'video' : 'image'),
        _0x5604d9['show'](_0x5e0937),
        _0x25fda9());
      if (_0x37f03f?.['shotId'] === _0x2c0d05['shotId']) {
        const _0x33deea = _0x5e0937['querySelector']('.story-media-history-list');
        if (_0x33deea) _0x33deea['scrollLeft'] = _0x37f03f['scrollLeft'] || 0x0;
        if (_0x37f03f['focus']) {
          const _0x119b37 = Array['from'](_0x5e0937['querySelectorAll']('button'))['find']((_0x26aa9f) =>
            Object['entries'](_0x37f03f['focus'])['every'](
              ([_0x51d04f, _0x26d38a]) => _0x26aa9f['dataset'][_0x51d04f] === _0x26d38a,
            ),
          );
          _0x119b37?.['focus']?.({ preventScroll: !![] });
        }
      }
      return !![];
    },
    _0x194c36 = (_0x221d54) => {
      const _0x42b2c = _0x221d54['target']?.['closest']?.(CLOSE),
        _0xd7898a = _0x221d54['target']?.['closest']?.(TOGGLE);
      if ((!_0xd7898a && !_0x42b2c) || !_0x3880d3()?.['contains']?.(_0xd7898a || _0x42b2c)) return ![];
      (_0x221d54['preventDefault']?.(), _0x221d54['stopPropagation']?.());
      if (_0x42b2c || _0x2c0d05?.['shotId'] === _0xd7898a['dataset']['shotId']) {
        const _0x351b2d = _0x5633c4(_0x2c0d05?.['shotId']);
        return (_0x43e86e({ animate: !![] }), _0x351b2d?.['focus']?.({ preventScroll: !![] }), !![]);
      }
      if (_0xd7898a['disabled']) return !![];
      const _0x4b4979 = _0xd7898a['dataset']['shotId'];
      _0x650362(_0x4b4979, { ensureVisible: ![] });
      const _0x2be291 = _0x25221e();
      return (
        (_0x2c0d05 = { projectId: _0x2be291['id'], step: _0x2be291['workspace']['step'], shotId: _0x4b4979 }),
        _0x4dcc8b(null),
        _0x5633c4(_0x4b4979)?.['focus']?.({ preventScroll: !![] }),
        !![]
      );
    };
  return Object['freeze']({
    capture: _0x3c053c,
    refresh: _0x4dcc8b,
    hide: _0x43e86e,
    handleClick: _0x194c36,
    restore(_0x1c9e04) {
      if (!_0x1c9e04) return ![];
      return (
        (_0x2c0d05 = {
          projectId: _0x1c9e04['projectId'],
          step: _0x1c9e04['step'],
          shotId: _0x1c9e04['shotId'],
        }),
        _0x4dcc8b(_0x1c9e04)
      );
    },
    handleKeyDown(_0x2abec8) {
      if (_0x2abec8['key'] !== 'Escape' || !_0x2c0d05) return ![];
      const _0x3c385b = _0x5633c4(_0x2c0d05['shotId']);
      return (
        _0x43e86e({ animate: !![] }),
        _0x3c385b?.['focus']?.({ preventScroll: !![] }),
        _0x2abec8['preventDefault']?.(),
        _0x2abec8['stopPropagation']?.(),
        !![]
      );
    },
    destroy() {
      (_0x43e86e(),
        _0x5e0937?.['removeEventListener']?.('wheel', _0x2dc5c0),
        _0x5604d9['destroy'](),
        (_0x5e0937 = null));
    },
  });
}
