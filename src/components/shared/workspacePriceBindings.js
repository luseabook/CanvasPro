import { bindGenerationPriceControl } from './generationPriceControl.js';
import { resolveGenerationPriceContext } from '../../services/generationPriceContext.js';
export function bindWorkspacePrices(_0xc19fe9, _0x70aa7f) {
  const _0x331c7c = new Map();
  let _0x5bd748 = ![],
    _0x5af417 = ![];
  const _0x14a3fa = () => {
      if (_0x5bd748) return;
      for (const [_0x8fd8bf, _0x264511] of _0x331c7c) {
        (!_0xc19fe9['contains'](_0x8fd8bf) ||
          !_0x8fd8bf['previousElementSibling']?.['classList']['contains']('generation-model-price')) &&
          (_0x264511['destroy'](), _0x331c7c['delete'](_0x8fd8bf));
      }
      for (const { selector: _0x157583, getData: _0x3c4723 } of _0x70aa7f) {
        for (const _0xb4a340 of _0xc19fe9?.['querySelectorAll']?.(_0x157583) || []) {
          if (!_0x331c7c['has'](_0xb4a340))
            _0x331c7c['set'](
              _0xb4a340,
              bindGenerationPriceControl(_0xb4a340, {
                getContext: () => resolveGenerationPriceContext(_0x3c4723(_0xb4a340)),
              }),
            );
        }
      }
      _0x331c7c['forEach']((_0x113c50) => _0x113c50['sync']());
    },
    _0x39e6fb = _0x70aa7f['map']((_0x39bab6) => _0x39bab6['selector'])['join'](','),
    _0x57bd2e = () => {
      if (_0x5af417 || _0x5bd748) return;
      ((_0x5af417 = !![]),
        queueMicrotask(() => {
          ((_0x5af417 = ![]), _0x14a3fa());
        }));
    };
  (_0xc19fe9?.['addEventListener']?.('input', _0x57bd2e),
    _0xc19fe9?.['addEventListener']?.('change', _0x57bd2e));
  const _0x152955 = _0xc19fe9?.['ownerDocument']?.['defaultView']?.['MutationObserver'],
    _0x4f5717 = _0x152955
      ? new _0x152955((_0x20509d) => {
          const _0x5c6254 = _0x20509d['some']((_0x1048f6) =>
            [..._0x1048f6['addedNodes'], ..._0x1048f6['removedNodes']]['some'](
              (_0x4da249) => _0x4da249['matches']?.(_0x39e6fb) || _0x4da249['querySelector']?.(_0x39e6fb),
            ),
          );
          if (_0x5c6254) _0x57bd2e();
        })
      : null;
  return (
    _0x4f5717?.['observe'](_0xc19fe9, { childList: !![], subtree: !![] }),
    _0x14a3fa(),
    {
      syncPrices: _0x14a3fa,
      destroy() {
        (_0xc19fe9?.['removeEventListener']?.('input', _0x57bd2e),
          _0xc19fe9?.['removeEventListener']?.('change', _0x57bd2e),
          (_0x5bd748 = !![]),
          _0x4f5717?.['disconnect'](),
          _0x331c7c['forEach']((_0x1fbfe0) => _0x1fbfe0['destroy']()),
          _0x331c7c['clear']());
      },
    }
  );
}
