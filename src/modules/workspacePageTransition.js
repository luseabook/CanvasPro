const DEFAULT_DIRECTION_CLASSES = Object['freeze']({
  forward: Object['freeze']({ entering: 'is-entering-forward', leaving: 'is-leaving-forward' }),
  backward: Object['freeze']({ entering: 'is-entering-backward', leaving: 'is-leaving-backward' }),
});
function toClassNames(_0x434a3c) {
  if (Array['isArray'](_0x434a3c)) return _0x434a3c['flatMap']((_0x467102) => toClassNames(_0x467102));
  return String(_0x434a3c || '')
    ['split'](/\s+/)
    ['filter'](Boolean);
}
function addClasses(_0x2f7cc9, ..._0x3951a7) {
  const _0x3eeffd = _0x3951a7['flatMap']((_0x467a47) => toClassNames(_0x467a47));
  if (_0x3eeffd['length']) _0x2f7cc9?.['classList']?.['add']?.(..._0x3eeffd);
}
function removeClasses(_0x327f24, ..._0xa3f055) {
  const _0x26c8a0 = _0xa3f055['flatMap']((_0x465ecd) => toClassNames(_0x465ecd));
  if (_0x26c8a0['length']) _0x327f24?.['classList']?.['remove']?.(..._0x26c8a0);
}
function setPageInteractive(_0x524ee4, _0x35fca5) {
  if (!_0x524ee4) return;
  _0x35fca5
    ? _0x524ee4['removeAttribute']?.('aria-hidden')
    : _0x524ee4['setAttribute']?.('aria-hidden', 'true');
  try {
    _0x524ee4['inert'] = !_0x35fca5;
  } catch {}
}
function resolveDirectionClasses(_0x3c111a, _0x59354f = {}) {
  const _0x2ed1d9 = DEFAULT_DIRECTION_CLASSES[_0x3c111a];
  if (!_0x2ed1d9) return null;
  return {
    entering: _0x59354f?.['directions']?.[_0x3c111a]?.['entering'] || _0x2ed1d9['entering'],
    leaving: _0x59354f?.['directions']?.[_0x3c111a]?.['leaving'] || _0x2ed1d9['leaving'],
  };
}
export function createWorkspacePageTransitionController({
  windowObject: windowObject = globalThis,
  fallbackMs: fallbackMs = 0x208,
  transitionProperty: transitionProperty = 'transform',
  disposePage: disposePage = (_0x26366d) => _0x26366d?.['remove']?.(),
  captureFocus: captureFocus = null,
  restoreFocus: restoreFocus = null,
} = {}) {
  let _0x46f488 = null,
    _0x25900f = ![];
  const _0x266e2c = (
      _0x51efcd,
      {
        commit: commit = _0x51efcd?.['committed'] === !![],
        notify: notify = ![],
        reason: reason = 'settled',
      } = {},
    ) => {
      if (!_0x51efcd || _0x51efcd['settled']) return ![];
      commit && !_0x51efcd['committed'] && _0x3bbafc(_0x51efcd);
      ((_0x51efcd['settled'] = !![]),
        _0x51efcd['transitionElement']?.['removeEventListener']?.(
          'transitionend',
          _0x51efcd['onTransitionEnd'],
        ));
      _0x51efcd['fallbackTimer'] && windowObject?.['clearTimeout']?.(_0x51efcd['fallbackTimer']);
      _0x51efcd['rafId'] &&
        typeof windowObject?.['cancelAnimationFrame'] === 'function' &&
        windowObject['cancelAnimationFrame'](_0x51efcd['rafId']);
      const {
        current: _0x19e4de,
        next: _0x5537a9,
        parent: _0x2b654d,
        directionClasses: _0x3713ff,
        classNames: _0x4b27f9,
      } = _0x51efcd;
      commit
        ? ((_0x51efcd['committed'] = !![]),
          removeClasses(
            _0x19e4de,
            _0x4b27f9['current'],
            _0x3713ff['leaving'],
            _0x4b27f9['page'],
            _0x4b27f9['scopeCurrent'],
          ),
          removeClasses(
            _0x5537a9,
            _0x3713ff['entering'],
            _0x4b27f9['page'],
            _0x4b27f9['scopeNext'],
            _0x4b27f9['scopeTarget'],
          ),
          _0x4b27f9['retainCurrentOnCommit']
            ? addClasses(_0x5537a9, _0x4b27f9['current'])
            : removeClasses(_0x5537a9, _0x4b27f9['current']),
          setPageInteractive(_0x5537a9, !![]),
          disposePage(_0x19e4de),
          _0x51efcd['onCommit']?.(_0x51efcd))
        : (removeClasses(_0x19e4de, _0x3713ff['leaving'], _0x4b27f9['page'], _0x4b27f9['scopeCurrent']),
          addClasses(_0x19e4de, _0x4b27f9['current']),
          setPageInteractive(_0x19e4de, !![]),
          disposePage(_0x5537a9),
          _0x51efcd['onRollback']?.(_0x51efcd));
      removeClasses(_0x2b654d, _0x4b27f9['parent']);
      if (_0x46f488 === _0x51efcd) _0x46f488 = null;
      commit &&
        _0x51efcd['focusKey'] != null &&
        restoreFocus?.(_0x51efcd['focusKey'], _0x51efcd['focusContext'], _0x51efcd);
      _0x51efcd['onSettled']?.({
        committed: Boolean(commit),
        notify: notify,
        reason: reason,
        transition: _0x51efcd,
      });
      if (notify) _0x51efcd['onTransitionComplete']?.(_0x51efcd);
      return (_0x51efcd['resolve']?.(Boolean(commit)), !![]);
    },
    _0x3bbafc = (_0x4eeb12) => {
      if (_0x25900f || !_0x4eeb12 || _0x4eeb12['settled'] || _0x46f488 !== _0x4eeb12) return ![];
      return (
        _0x4eeb12['onBeforeCommit']?.(_0x4eeb12),
        (_0x4eeb12['committed'] = !![]),
        addClasses(_0x4eeb12['current'], _0x4eeb12['directionClasses']['leaving']),
        removeClasses(_0x4eeb12['current'], _0x4eeb12['classNames']['current']),
        addClasses(_0x4eeb12['next'], _0x4eeb12['classNames']['current']),
        removeClasses(_0x4eeb12['next'], _0x4eeb12['directionClasses']['entering']),
        _0x4eeb12['onAfterCommit']?.(_0x4eeb12),
        !![]
      );
    },
    _0x435ad7 = ({
      current: _0x3c1738,
      next: _0x4ab956,
      parent: parent = _0x4ab956?.['parentElement'] || _0x3c1738?.['parentElement'] || null,
      direction: direction = 'forward',
      transitionElement: transitionElement = _0x4ab956,
      classNames: classNames = {},
      focusKey: _0x1a7d0c,
      focusContext: focusContext = null,
      mount: mount = null,
      forceLayout: forceLayout = null,
      onBeforeCommit: onBeforeCommit = null,
      onAfterCommit: onAfterCommit = null,
      onCommit: onCommit = null,
      onRollback: onRollback = null,
      onSettled: onSettled = null,
      onTransitionComplete: onTransitionComplete = null,
    } = {}) => {
      if (_0x25900f) return null;
      const _0x5ad578 = resolveDirectionClasses(direction, classNames);
      if (!_0x3c1738 || !_0x4ab956 || !parent || !transitionElement || !_0x5ad578) return null;
      _0x46f488 &&
        _0x266e2c(_0x46f488, { commit: _0x46f488['committed'] === !![], notify: ![], reason: 'replaced' });
      const _0x1e840f = {
          current: classNames['current'] || 'is-current',
          page: classNames['page'] || '',
          parent: classNames['parent'] || '',
          scopeCurrent: classNames['scopeCurrent'] || '',
          scopeNext: classNames['scopeNext'] || '',
          scopeTarget: classNames['scopeTarget'] || '',
          retainCurrentOnCommit: classNames['retainCurrentOnCommit'] !== ![],
        },
        _0x5461a2 =
          _0x1a7d0c === undefined
            ? (captureFocus?.({ current: _0x3c1738, next: _0x4ab956, parent: parent }) ?? null)
            : _0x1a7d0c,
        _0x10aa0d = {
          current: _0x3c1738,
          next: _0x4ab956,
          parent: parent,
          transitionElement: transitionElement,
          directionClasses: _0x5ad578,
          classNames: _0x1e840f,
          focusKey: _0x5461a2,
          focusContext: focusContext,
          committed: ![],
          settled: ![],
          fallbackTimer: 0x0,
          rafId: 0x0,
          onTransitionEnd: null,
          onBeforeCommit: onBeforeCommit,
          onAfterCommit: onAfterCommit,
          onCommit: onCommit,
          onRollback: onRollback,
          onSettled: onSettled,
          onTransitionComplete: onTransitionComplete,
          resolve: null,
        };
      return (
        (_0x10aa0d['committedPromise'] = new Promise((_0x33e210) => {
          _0x10aa0d['resolve'] = _0x33e210;
        })),
        addClasses(parent, _0x1e840f['parent']),
        addClasses(_0x3c1738, _0x1e840f['page'], _0x1e840f['current'], _0x1e840f['scopeCurrent']),
        setPageInteractive(_0x3c1738, ![]),
        addClasses(
          _0x4ab956,
          _0x1e840f['page'],
          _0x5ad578['entering'],
          _0x1e840f['scopeNext'],
          _0x1e840f['scopeTarget'],
        ),
        setPageInteractive(_0x4ab956, !![]),
        mount?.({ current: _0x3c1738, next: _0x4ab956, parent: parent, transition: _0x10aa0d }),
        (_0x46f488 = _0x10aa0d),
        (_0x10aa0d['onTransitionEnd'] = (_0x4789e7) => {
          if (
            _0x4789e7?.['target'] !== transitionElement ||
            (transitionProperty && _0x4789e7?.['propertyName'] !== transitionProperty)
          )
            return;
          _0x266e2c(_0x10aa0d, { commit: !![], notify: !![], reason: 'transitionend' });
        }),
        transitionElement['addEventListener']?.('transitionend', _0x10aa0d['onTransitionEnd']),
        forceLayout?.({ current: _0x3c1738, next: _0x4ab956, parent: parent, transition: _0x10aa0d }),
        typeof windowObject?.['requestAnimationFrame'] === 'function'
          ? (_0x10aa0d['rafId'] = windowObject['requestAnimationFrame'](() => {
              _0x3bbafc(_0x10aa0d);
            }))
          : _0x3bbafc(_0x10aa0d),
        (_0x10aa0d['fallbackTimer'] =
          windowObject?.['setTimeout']?.(
            () => {
              (_0x3bbafc(_0x10aa0d),
                _0x266e2c(_0x10aa0d, { commit: !![], notify: !![], reason: 'fallback' }));
            },
            Math['max'](0x0, Number(fallbackMs) || 0x0),
          ) || 0x0),
        {
          transition: _0x10aa0d,
          committed: _0x10aa0d['committedPromise'],
          commit: () => _0x3bbafc(_0x10aa0d),
          settle: (_0x26899d) => _0x266e2c(_0x10aa0d, _0x26899d),
          rollback: () => _0x266e2c(_0x10aa0d, { commit: ![], notify: ![], reason: 'rollback' }),
          cancel: ({ commit: commit = _0x10aa0d['committed'] === !![] } = {}) =>
            _0x266e2c(_0x10aa0d, { commit: commit, notify: ![], reason: 'cancelled' }),
        }
      );
    },
    _0x1c7531 = ({ commit: commit = _0x46f488?.['committed'] === !![] } = {}) =>
      _0x46f488 ? _0x266e2c(_0x46f488, { commit: commit, notify: ![], reason: 'cancelled' }) : ![];
  return {
    start: _0x435ad7,
    cancel: _0x1c7531,
    settle: (_0x230dc9 = {}) => (_0x46f488 ? _0x266e2c(_0x46f488, _0x230dc9) : ![]),
    destroy({ commit: commit = ![] } = {}) {
      if (_0x25900f) return;
      (_0x1c7531({ commit: commit }), (_0x25900f = !![]));
    },
    getActiveTransition() {
      return _0x46f488;
    },
  };
}
