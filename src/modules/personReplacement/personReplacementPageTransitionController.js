import { createWorkspacePageTransitionController } from '../workspacePageTransition.js';
function normalizeText(_0x13bb2a) {
  return String(_0x13bb2a ?? '')['trim']();
}
export function createPersonReplacementPageTransitionController({
  getRoot: _0x1fb285,
  getTransitionKey: _0x346134,
  isCutEditorOpen: _0x114111,
  isDestroyed: isDestroyed = () => ![],
  requestRender: _0x56a33a,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof _0x1fb285 !== 'function' ||
    typeof _0x346134 !== 'function' ||
    typeof _0x114111 !== 'function' ||
    typeof _0x56a33a !== 'function'
  )
    throw new TypeError('Person replacement page transitions require workspace adapters.');
  let _0x3891da = null,
    _0x40a6f1 = '',
    _0x14991f = ![];
  const _0x16207b = (_0x28ca13, _0x10f9b1) => {
      const _0x381948 = _0x28ca13?.['querySelector']?.('.story-asset-tabs'),
        _0x375a37 = _0x10f9b1?.['querySelector']?.('.story-asset-tabs');
      if (!_0x381948 || !_0x375a37) return;
      ((_0x381948['dataset']['activeTab'] = _0x375a37['dataset']['activeTab']),
        _0x381948['querySelectorAll']?.('[data-asset-tab]')?.['forEach']?.((_0x2f9082) => {
          const _0x3c548a = normalizeText(_0x2f9082['dataset']?.['assetTab']),
            _0xa92c79 = Array['from'](_0x375a37['querySelectorAll']?.('[data-asset-tab]') || [])['find'](
              (_0x527ee1) => normalizeText(_0x527ee1['dataset']?.['assetTab']) === _0x3c548a,
            );
          if (!_0xa92c79) return;
          _0x2f9082['classList']?.['toggle']?.(
            'is-active',
            _0xa92c79['classList']?.['contains']?.('is-active') === !![],
          );
          const _0x2dd7a4 = _0xa92c79['getAttribute']?.('aria-selected');
          if (_0x2dd7a4 == null) _0x2f9082['removeAttribute']?.('aria-selected');
          else _0x2f9082['setAttribute']?.('aria-selected', _0x2dd7a4);
          _0x2f9082['tabIndex'] = _0xa92c79['tabIndex'];
          const _0x333e86 = _0x2f9082['querySelector']?.('.story-asset-tab-count'),
            _0x46029f = _0xa92c79['querySelector']?.('.story-asset-tab-count');
          _0x333e86 && _0x46029f && (_0x333e86['textContent'] = _0x46029f['textContent']);
        }));
    },
    _0x16c458 = (_0x41e47c, _0xab311c) => {
      const _0x3be6ea = _0x41e47c?.['querySelector']?.('.person-replacement-story-toolbar'),
        _0x141b36 = _0xab311c?.['querySelector']?.('.person-replacement-story-toolbar'),
        _0x25f1cc = _0x3be6ea?.['querySelector']?.('.person-replacement-story-steps'),
        _0x45880a = _0x141b36?.['querySelector']?.('.person-replacement-story-steps');
      if (!_0x3be6ea || !_0x141b36 || !_0x25f1cc || !_0x45880a) return ![];
      ((_0x3be6ea['className'] = _0x141b36['className']),
        (_0x25f1cc['dataset']['activeStep'] = _0x45880a['dataset']['activeStep']),
        _0x25f1cc['querySelectorAll']?.('[data-person-replacement-step]')?.['forEach']?.((_0x2f48c6) => {
          const _0x5ac737 = normalizeText(_0x2f48c6['dataset']?.['personReplacementStep']),
            _0x26feb1 = Array['from'](
              _0x45880a['querySelectorAll']?.('[data-person-replacement-step]') || [],
            )['find'](
              (_0xd1aa9) => normalizeText(_0xd1aa9['dataset']?.['personReplacementStep']) === _0x5ac737,
            );
          if (!_0x26feb1) return;
          ((_0x2f48c6['className'] = _0x26feb1['className']),
            ['aria-current', 'aria-disabled', 'title']['forEach']((_0x1381f5) => {
              const _0x20337e = _0x26feb1['getAttribute']?.(_0x1381f5);
              if (_0x20337e == null) _0x2f48c6['removeAttribute']?.(_0x1381f5);
              else _0x2f48c6['setAttribute']?.(_0x1381f5, _0x20337e);
            }));
        }));
      const _0x19185d = _0x3be6ea['querySelector']?.('.person-replacement-toolbar-side'),
        _0x374f9e = _0x141b36['querySelector']?.('.person-replacement-toolbar-side');
      if (_0x19185d && _0x374f9e) _0x19185d['innerHTML'] = _0x374f9e['innerHTML'];
      return !![];
    },
    _0x3cec2f = () => {
      const _0x2ea29d = _0x1fb285(),
        _0x1549b9 = documentObject?.['activeElement'];
      if (!_0x1549b9 || !_0x2ea29d?.['contains']?.(_0x1549b9)) return null;
      const _0x5b0306 = normalizeText(_0x1549b9['dataset']?.['personReplacementStep']);
      if (_0x5b0306) return { kind: 'step', value: _0x5b0306 };
      const _0x507c12 = normalizeText(_0x1549b9['dataset']?.['assetTab']);
      if (_0x507c12) return { kind: 'asset-tab', value: _0x507c12 };
      const _0x809825 = _0x114111()
        ? _0x1549b9['closest']?.(
            ['[data-person-replacement-shot-cut-editor]', '#person-replacement-shot-cut-smart-detect-panel'][
              'join'
            ](','),
          )
        : null;
      if (_0x809825) {
        const _0x33ca48 = _0x1549b9['closest']?.('[data-person-replacement-action]');
        return {
          kind: 'cut-editor',
          value: normalizeText(_0x33ca48?.['dataset']?.['personReplacementAction']) || 'surface',
          shotId: normalizeText(_0x33ca48?.['dataset']?.['shotId']),
          smartClipMode: normalizeText(_0x33ca48?.['dataset']?.['smartClipMode']),
        };
      }
      return null;
    },
    _0x1fe4af = (
      _0xff6393,
      { currentToolbar: currentToolbar = null, incomingPage: incomingPage = null } = {},
    ) => {
      const _0x591491 = _0x1fb285();
      if (!_0xff6393?.['value']) return ![];
      if (_0xff6393['kind'] === 'cut-editor') {
        const _0x5dc493 = _0x591491?.['querySelector']?.('[data-person-replacement-shot-cut-editor]'),
          _0x541be9 =
            _0xff6393['value'] === 'surface'
              ? null
              : Array['from'](_0x591491?.['querySelectorAll']?.('[data-person-replacement-action]') || [])[
                  'find'
                ](
                  (_0x12b885) =>
                    normalizeText(_0x12b885['dataset']?.['personReplacementAction']) === _0xff6393['value'] &&
                    (!_0xff6393['shotId'] ||
                      normalizeText(_0x12b885['dataset']?.['shotId']) === _0xff6393['shotId']) &&
                    (!_0xff6393['smartClipMode'] ||
                      normalizeText(_0x12b885['dataset']?.['smartClipMode']) === _0xff6393['smartClipMode']),
                ),
          _0x8ce987 = _0x541be9 && !_0x541be9['disabled'] ? _0x541be9 : _0x5dc493;
        if (!_0x8ce987) return ![];
        try {
          _0x8ce987['focus']?.({ preventScroll: !![] });
        } catch {
          _0x8ce987['focus']?.();
        }
        return documentObject?.['activeElement'] === _0x8ce987;
      }
      const _0x1425c2 =
          _0xff6393['kind'] === 'step' ? currentToolbar || _0x591491 : incomingPage || _0x591491,
        _0x16ea5d =
          _0xff6393['kind'] === 'step'
            ? 'personReplacementStep'
            : _0xff6393['kind'] === 'asset-tab'
              ? 'assetTab'
              : '';
      if (!_0x1425c2 || !_0x16ea5d) return ![];
      const _0x38cdb1 = _0xff6393['kind'] === 'step' ? '[data-person-replacement-step]' : '[data-asset-tab]',
        _0xc25b14 = Array['from'](_0x1425c2['querySelectorAll']?.(_0x38cdb1) || [])['find'](
          (_0x4584fb) => normalizeText(_0x4584fb['dataset']?.[_0x16ea5d]) === _0xff6393['value'],
        );
      if (!_0xc25b14 || _0xc25b14['disabled']) return ![];
      try {
        _0xc25b14['focus']?.({ preventScroll: !![] });
      } catch {
        _0xc25b14['focus']?.();
      }
      return documentObject?.['activeElement'] === _0xc25b14;
    },
    _0x4906aa = createWorkspacePageTransitionController({
      windowObject: windowObject,
      disposePage: (_0x3a072e) => _0x3a072e?.['remove']?.(),
      restoreFocus: (_0x345d8b, _0x52734d) => {
        if (documentObject?.['activeElement'] !== documentObject?.['body']) return ![];
        return _0x1fe4af(_0x345d8b, _0x52734d);
      },
    }),
    _0x11f8ae = ({ renderPending: renderPending = ![] } = {}) => {
      (_0x3891da?.({ renderPending: renderPending }), (_0x3891da = null));
    },
    _0x5b92a2 = (_0x4afc24 = 'none') => {
      if (_0x3891da && _0x4afc24 === 'none' && _0x40a6f1 === _0x346134()) return ((_0x14991f = !![]), !![]);
      return ![];
    },
    _0x13a67e = (
      _0x4a8bed,
      _0x32e770,
      _0x291ff9,
      _0x23a78c,
      {
        currentToolbar: currentToolbar = null,
        nextToolbar: nextToolbar = null,
        focusKey: focusKey = null,
      } = {},
    ) => {
      const _0x232603 = _0x32e770?.['parentElement'];
      if (!_0x4a8bed || !_0x32e770 || !_0x232603 || !['forward', 'backward']['includes'](_0x291ff9))
        return ![];
      const _0x4efb56 = _0x291ff9 === 'backward' ? 'is-entering-backward' : 'is-entering-forward',
        _0x19aceb = _0x291ff9 === 'backward' ? 'is-leaving-backward' : 'is-leaving-forward',
        _0x1cbfd9 = _0x4a8bed['querySelector']?.('[data-story-assets-switch-region]'),
        _0x17c936 = _0x32e770['querySelector']?.('[data-story-assets-switch-region]'),
        _0x3f8bf3 = _0x4a8bed['querySelector']?.('.story-assets-list'),
        _0x4aa682 = _0x32e770['querySelector']?.('.story-assets-list'),
        _0x4b6ffd = _0x23a78c === 'asset-content' && _0x1cbfd9 && _0x17c936,
        _0x10edc8 = _0x23a78c === 'asset-list' && _0x3f8bf3 && _0x4aa682,
        _0x22b28c = _0x4b6ffd || _0x10edc8,
        _0x1f3b0a = _0x32e770['querySelector']?.('.story-asset-tabs'),
        _0x2013d9 = _0x1f3b0a?.['dataset']['activeTab'];
      _0x4b6ffd &&
        _0x1f3b0a &&
        (_0x1f3b0a['dataset']['activeTab'] =
          _0x4a8bed['querySelector']?.('.story-asset-tabs')?.['dataset']['activeTab'] || _0x2013d9);
      const _0x25699e = _0x10edc8
          ? 'person-replacement-page--asset-list-transition'
          : _0x4b6ffd
            ? 'person-replacement-page--asset-content-transition'
            : '',
        _0x4f68a4 = _0x10edc8
          ? 'person-replacement-page--asset-list-transition-target'
          : _0x4b6ffd
            ? 'person-replacement-page--asset-content-transition-target'
            : '',
        _0x3ced0c = _0x10edc8 ? _0x4aa682 : _0x4b6ffd ? _0x17c936 : _0x32e770;
      _0x32e770['remove']?.();
      let _0x5d4a46 = !![],
        _0x378c08 = null;
      const _0x177af5 = ({ renderPending: renderPending = !![] } = {}) => {
        ((_0x5d4a46 = renderPending), _0x378c08?.['cancel']?.({ commit: !![] }));
      };
      _0x378c08 = _0x4906aa['start']({
        current: _0x4a8bed,
        next: _0x32e770,
        parent: _0x232603,
        direction: _0x291ff9,
        transitionElement: _0x3ced0c,
        classNames: {
          current: 'is-current',
          page: 'person-replacement-page-transition',
          parent: 'person-replacement-page-transitioning',
          scopeCurrent: _0x25699e,
          scopeNext: _0x25699e,
          scopeTarget: _0x4f68a4,
          retainCurrentOnCommit: ![],
          directions: { [_0x291ff9]: { entering: _0x4efb56, leaving: _0x19aceb } },
        },
        focusKey: focusKey,
        focusContext: { currentToolbar: currentToolbar, incomingPage: _0x32e770 },
        mount: () => {
          (_0x32e770['parentElement'] !== _0x232603 && _0x232603['appendChild']?.(_0x32e770),
            _0x232603['insertBefore']?.(_0x4a8bed, _0x32e770));
        },
        forceLayout: () => {
          (_0x1f3b0a?.['getBoundingClientRect']?.(),
            currentToolbar?.['getBoundingClientRect']?.(),
            _0x4a8bed['querySelector']?.('.story-asset-tabs')?.['getBoundingClientRect']?.(),
            _0x3ced0c?.['getBoundingClientRect']?.());
        },
        onBeforeCommit: () => {
          if (_0x4b6ffd && _0x1f3b0a) _0x1f3b0a['dataset']['activeTab'] = _0x2013d9;
          (_0x16c458(currentToolbar, nextToolbar), _0x22b28c && _0x16207b(_0x4a8bed, _0x32e770));
        },
        onSettled: () => {
          if (_0x3891da === _0x177af5) _0x3891da = null;
          _0x40a6f1 = '';
          const _0x2464ce = _0x5d4a46 && _0x14991f;
          _0x14991f = ![];
          if (_0x2464ce && !isDestroyed()) _0x56a33a();
        },
      });
      if (!_0x378c08) return ![];
      return ((_0x3891da = _0x177af5), (_0x40a6f1 = _0x346134()), !![]);
    },
    _0x2f18eb = () => {
      (_0x11f8ae({ renderPending: ![] }), _0x4906aa['destroy']());
    };
  return Object['freeze']({
    captureFocus: _0x3cec2f,
    deferRenderIfSettling: _0x5b92a2,
    destroy: _0x2f18eb,
    restoreFocus: _0x1fe4af,
    start: _0x13a67e,
    stop: _0x11f8ae,
    syncProjectToolbarInPlace: _0x16c458,
  });
}
