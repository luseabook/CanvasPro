export const RENDERER_MEDIA_SLOT_VISIBILITY_TIERS = Object['freeze'](['far', 'near', 'visible', 'focused']);
export const RENDERER_MEDIA_SLOT_RESIDENCIES = Object['freeze'](['unmounted', 'parked', 'mounted']);
export const RENDERER_MEDIA_SLOT_READINESS_STATES = Object['freeze']([
  'idle',
  'requesting',
  'frameReady',
  'error',
]);
export const RENDERER_MEDIA_SLOT_SURFACES = Object['freeze'](['poster', 'media']);
const ACTIVE_VISIBILITY_TIERS = new Set(['near', 'visible', 'focused']),
  VALID_VISIBILITY_TIERS = new Set(RENDERER_MEDIA_SLOT_VISIBILITY_TIERS),
  VALID_RESIDENCIES = new Set(RENDERER_MEDIA_SLOT_RESIDENCIES);
function createInitialState() {
  return {
    visibilityTier: 'far',
    residency: 'unmounted',
    readiness: 'idle',
    surface: 'poster',
    sourceKey: '',
    sourceEpoch: 0x0,
  };
}
function normalizeSlotKey(_0x56b786) {
  const _0x279b9a = String(_0x56b786 || '')['trim']();
  if (!_0x279b9a) throw new TypeError('renderer media slot requires a slotKey');
  return _0x279b9a;
}
function normalizeSourceKey(_0x49ae49) {
  return String(_0x49ae49 || '')['trim']();
}
function snapshotState(_0x263ac6) {
  return Object['freeze']({ ..._0x263ac6 });
}
function isStableState(_0x53a1c5) {
  return _0x53a1c5['readiness'] === 'frameReady' && _0x53a1c5['surface'] === 'media';
}
function isActivePresentedSurface(_0x2d991a) {
  return ACTIVE_VISIBILITY_TIERS['has'](_0x2d991a['visibilityTier']) && _0x2d991a['surface'] === 'media';
}
function hasCurrentSourceToken(_0x44aaa7, _0x2419cc) {
  return !!(
    _0x44aaa7['sourceKey'] &&
    normalizeSourceKey(_0x2419cc?.['sourceKey']) === _0x44aaa7['sourceKey'] &&
    Number['isInteger'](_0x2419cc?.['sourceEpoch']) &&
    _0x2419cc['sourceEpoch'] === _0x44aaa7['sourceEpoch']
  );
}
function hasStrictPresentedFrameFacts(_0x46c537 = {}) {
  return !!(
    _0x46c537['domConnected'] === !![] &&
    Number(_0x46c537['readyState'] || 0x0) >= 0x2 &&
    Number(_0x46c537['videoWidth'] || 0x0) > 0x0 &&
    Number(_0x46c537['videoHeight'] || 0x0) > 0x0 &&
    !_0x46c537['error'] &&
    _0x46c537['rvfcObserved'] === !![] &&
    _0x46c537['cssDisplayVisible'] === !![] &&
    _0x46c537['cssVisibilityVisible'] === !![] &&
    _0x46c537['cssOpacityVisible'] === !![] &&
    _0x46c537['overlayClear'] === !![]
  );
}
function freezeIntent(_0x534071) {
  return Object['freeze'](_0x534071);
}
function buildResult(
  _0x2a0f13,
  { accepted: accepted = !![], changed: changed = ![], intents: intents = [], reason: reason = '' } = {},
) {
  return Object['freeze']({
    accepted: accepted,
    changed: changed,
    intents: Object['freeze'](intents['map'](freezeIntent)),
    reason: reason,
    state: snapshotState(_0x2a0f13),
  });
}
export function createRendererMediaSlotLifecycle() {
  const _0x4778e7 = new Map();
  function _0xfa08e0(_0x4a1aa2) {
    const _0x3dea31 = normalizeSlotKey(_0x4a1aa2);
    let _0x3016cf = _0x4778e7['get'](_0x3dea31);
    return (
      !_0x3016cf && ((_0x3016cf = createInitialState()), _0x4778e7['set'](_0x3dea31, _0x3016cf)),
      { key: _0x3dea31, state: _0x3016cf }
    );
  }
  function _0x5536c2(_0x547cd6) {
    return buildResult(_0x547cd6, { accepted: ![], reason: 'stale-source-token' });
  }
  function _0xd40c34(_0x537d22, _0x17fbc2 = {}) {
    const { key: _0x3f5bba, state: _0x2d25df } = _0xfa08e0(_0x537d22);
    switch (_0x17fbc2['type']) {
      case 'visibility': {
        const _0x40029b = String(_0x17fbc2['visibilityTier'] || '');
        if (!VALID_VISIBILITY_TIERS['has'](_0x40029b))
          throw new TypeError('invalid\x20renderer\x20media\x20visibility\x20tier:\x20' + _0x40029b);
        if (_0x2d25df['visibilityTier'] === _0x40029b) return buildResult(_0x2d25df);
        _0x2d25df['visibilityTier'] = _0x40029b;
        const _0x2ae059 = [];
        return (
          _0x40029b === 'far' &&
            _0x2d25df['residency'] === 'mounted' &&
            _0x2ae059['push']({
              type: 'park',
              slotKey: _0x3f5bba,
              sourceKey: _0x2d25df['sourceKey'],
              sourceEpoch: _0x2d25df['sourceEpoch'],
            }),
          buildResult(_0x2d25df, { changed: !![], intents: _0x2ae059 })
        );
      }
      case 'residency': {
        const _0x3b422c = String(_0x17fbc2['residency'] || '');
        if (!VALID_RESIDENCIES['has'](_0x3b422c))
          throw new TypeError('invalid renderer media residency: ' + _0x3b422c);
        if (_0x2d25df['residency'] === _0x3b422c) return buildResult(_0x2d25df);
        if (_0x3b422c !== 'mounted' && isActivePresentedSurface(_0x2d25df))
          return buildResult(_0x2d25df, { accepted: ![], reason: 'active-presented-slot-cannot-park' });
        return (
          (_0x2d25df['residency'] = _0x3b422c),
          _0x3b422c !== 'mounted' && ((_0x2d25df['readiness'] = 'idle'), (_0x2d25df['surface'] = 'poster')),
          buildResult(_0x2d25df, { changed: !![] })
        );
      }
      case 'source-intent': {
        const _0x36042d = normalizeSourceKey(_0x17fbc2['sourceKey']),
          _0x3cdc54 = _0x17fbc2['rebind'] === !![];
        if (_0x2d25df['sourceKey'] === _0x36042d && !_0x3cdc54) return buildResult(_0x2d25df);
        return (
          (_0x2d25df['sourceKey'] = _0x36042d),
          (_0x2d25df['sourceEpoch'] += 0x1),
          (_0x2d25df['readiness'] = 'idle'),
          (_0x2d25df['surface'] = 'poster'),
          buildResult(_0x2d25df, {
            changed: !![],
            intents: [
              {
                type: 'bind-source',
                slotKey: _0x3f5bba,
                sourceKey: _0x2d25df['sourceKey'],
                sourceEpoch: _0x2d25df['sourceEpoch'],
              },
            ],
          })
        );
      }
      case 'request-started': {
        if (!hasCurrentSourceToken(_0x2d25df, _0x17fbc2)) return _0x5536c2(_0x2d25df);
        if (isStableState(_0x2d25df)) return buildResult(_0x2d25df);
        const _0xc32cd9 = _0x2d25df['surface'] === 'media',
          _0x52ffc7 = _0x2d25df['readiness'] !== 'requesting';
        _0x2d25df['readiness'] = 'requesting';
        if (!_0xc32cd9) _0x2d25df['surface'] = 'poster';
        return buildResult(_0x2d25df, { changed: _0x52ffc7 });
      }
      case 'frame-observed': {
        if (!hasCurrentSourceToken(_0x2d25df, _0x17fbc2)) return _0x5536c2(_0x2d25df);
        if (_0x2d25df['residency'] !== 'mounted')
          return buildResult(_0x2d25df, { accepted: ![], reason: 'slot-not-mounted' });
        if (!hasStrictPresentedFrameFacts(_0x17fbc2['facts']))
          return buildResult(_0x2d25df, { accepted: ![], reason: 'presentation-facts-incomplete' });
        const _0x447e4b = !isStableState(_0x2d25df);
        return (
          (_0x2d25df['readiness'] = 'frameReady'),
          (_0x2d25df['surface'] = 'media'),
          buildResult(_0x2d25df, { changed: _0x447e4b })
        );
      }
      case 'error': {
        if (!hasCurrentSourceToken(_0x2d25df, _0x17fbc2)) return _0x5536c2(_0x2d25df);
        const _0x538a39 = isActivePresentedSurface(_0x2d25df),
          _0x39ea40 = _0x2d25df['readiness'] !== 'error' || (!_0x538a39 && _0x2d25df['surface'] !== 'poster');
        _0x2d25df['readiness'] = 'error';
        if (!_0x538a39) _0x2d25df['surface'] = 'poster';
        return buildResult(_0x2d25df, { changed: _0x39ea40 });
      }
      case 'poster-requested': {
        if (isActivePresentedSurface(_0x2d25df))
          return buildResult(_0x2d25df, {
            accepted: ![],
            reason: 'active-presented-slot-cannot-return-to-poster',
          });
        if (_0x2d25df['surface'] === 'poster') return buildResult(_0x2d25df);
        return ((_0x2d25df['surface'] = 'poster'), buildResult(_0x2d25df, { changed: !![] }));
      }
      default:
        throw new TypeError('unknown renderer media slot event: ' + (_0x17fbc2['type'] || ''));
    }
  }
  function _0xd1b77f(_0x5bf512) {
    const _0xa97262 = normalizeSlotKey(_0x5bf512);
    return snapshotState(_0x4778e7['get'](_0xa97262) || createInitialState());
  }
  function _0x148bfd(_0x5469e2) {
    return _0x4778e7['delete'](normalizeSlotKey(_0x5469e2));
  }
  return Object['freeze']({ forget: _0x148bfd, read: _0xd1b77f, transition: _0xd40c34 });
}
export function isRendererMediaSlotStable(_0x4d5ad4) {
  return isStableState(_0x4d5ad4 || {});
}
export const __rendererMediaSlotLifecycleForTest = Object['freeze']({
  hasStrictPresentedFrameFacts: hasStrictPresentedFrameFacts,
});
