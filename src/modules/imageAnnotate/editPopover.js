import { positionAnchoredSubmenu } from '../../utils/submenuPosition.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
export function bindEditPopover(returnFocus, submenu, { onOpen: onOpen, onClose: onClose } = {}) {
  const el = returnFocus['ownerDocument'],
    viewportWidth = el['defaultView'];
  let beginModalInteraction2 = null;
  ((submenu['tabIndex'] = -0x1),
    (submenu['hidden'] = !![]),
    el['body']['append'](submenu),
    returnFocus['setAttribute']('aria-expanded', 'false'),
    returnFocus['setAttribute']('aria-haspopup', 'dialog'));
  const position = () => {
      if (submenu['hidden']) return;
      const anchorRect = returnFocus['getBoundingClientRect']();
      positionAnchoredSubmenu({
        submenu: submenu,
        anchorRect: anchorRect,
        position: 'fixed',
        horizontalPlacement: 'center',
        verticalPlacement: anchorRect['top'] > submenu['offsetHeight'] + 0x14 ? 'above' : 'below',
        verticalGap: 0x8,
        viewportWidth: viewportWidth['innerWidth'],
        viewportHeight: viewportWidth['innerHeight'],
      });
    },
    close = (enabled = ![], value = null) => {
      if (submenu['hidden']) return;
      ((submenu['hidden'] = !![]),
        returnFocus['setAttribute']('aria-expanded', 'false'),
        returnFocus['classList']['remove']('active'),
        beginModalInteraction2?.({ restoreFocus: ![] }),
        (beginModalInteraction2 = null),
        onClose?.(value));
      if (enabled) returnFocus['focus']();
    },
    item = (event) => {
      event['stopPropagation']();
      if (!submenu['hidden']) {
        close();
        return;
      }
      (onOpen?.(),
        (submenu['hidden'] = ![]),
        returnFocus['setAttribute']('aria-expanded', 'true'),
        returnFocus['classList']['add']('active'),
        position(),
        (beginModalInteraction2 = beginModalInteraction({
          root: submenu,
          returnFocus: returnFocus,
          onClose: () => close(!![]),
        })));
    },
    key = (event2) => {
      if (!returnFocus['contains'](event2['target']) && !submenu['contains'](event2['target']))
        close(![], event2);
    },
    index = (event3) => {
      if (!submenu['contains'](event3['target'])) position();
    };
  return (
    returnFocus['addEventListener']('click', item),
    el['addEventListener']('pointerdown', key, !![]),
    el['addEventListener']('scroll', index, !![]),
    viewportWidth['addEventListener']('resize', position),
    {
      panel: submenu,
      position: position,
      close: close,
      destroy() {
        (close(),
          returnFocus['removeEventListener']('click', item),
          el['removeEventListener']('pointerdown', key, !![]),
          el['removeEventListener']('scroll', index, !![]),
          viewportWidth['removeEventListener']('resize', position),
          submenu['remove']());
      },
    }
  );
}
