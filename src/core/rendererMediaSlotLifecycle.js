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
    sourceEpoch: 0,
  };
}
function normalizeSlotKey(value) {
  const enabled = String(value || '')['trim']();
  if (!enabled) throw new TypeError('renderer media slot requires a slotKey');
  return enabled;
}
function normalizeSourceKey(item) {
  return String(item || '')['trim']();
}
function snapshotState(args) {
  return Object['freeze']({ ...args });
}
function isStableState(key) {
  return key['readiness'] === 'frameReady' && key['surface'] === 'media';
}
function isActivePresentedSurface(index) {
  return ACTIVE_VISIBILITY_TIERS['has'](index['visibilityTier']) && index['surface'] === 'media';
}
function hasCurrentSourceToken(result, data) {
  return !!(
    result['sourceKey'] &&
    normalizeSourceKey(data?.['sourceKey']) === result['sourceKey'] &&
    Number['isInteger'](data?.['sourceEpoch']) &&
    data['sourceEpoch'] === result['sourceEpoch']
  );
}
function hasStrictPresentedFrameFacts(enabled2 = {}) {
  return !!(
    enabled2['domConnected'] === true &&
    Number(enabled2['readyState'] || 0) >= 2 &&
    Number(enabled2['videoWidth'] || 0) > 0 &&
    Number(enabled2['videoHeight'] || 0) > 0 &&
    !enabled2['error'] &&
    enabled2['rvfcObserved'] === true &&
    enabled2['cssDisplayVisible'] === true &&
    enabled2['cssVisibilityVisible'] === true &&
    enabled2['cssOpacityVisible'] === true &&
    enabled2['overlayClear'] === true
  );
}
function freezeIntent(options) {
  return Object['freeze'](options);
}
function buildResult(
  target,
  { accepted: accepted = true, changed: changed = false, intents: intents = [], reason: reason = '' } = {},
) {
  return Object['freeze']({
    accepted: accepted,
    changed: changed,
    intents: Object['freeze'](intents['map'](freezeIntent)),
    reason: reason,
    state: snapshotState(target),
  });
}
export function createRendererMediaSlotLifecycle() {
  const map = new Map();
  function run(source) {
    const key2 = normalizeSlotKey(source);
    let state = map['get'](key2);
    return (!state && ((state = createInitialState()), map['set'](key2, state)), { key: key2, state: state });
  }
  function run2(next) {
    return buildResult(next, { accepted: false, reason: 'stale-source-token' });
  }
  function transition(current, entry = {}) {
    const { key: key3, state: state2 } = run(current);
    switch (entry['type']) {
      case 'visibility': {
        const record = String(entry['visibilityTier'] || '');
        if (!VALID_VISIBILITY_TIERS['has'](record))
          throw new TypeError('invalid renderer media visibility tier: ' + record);
        if (state2['visibilityTier'] === record) return buildResult(state2);
        state2['visibilityTier'] = record;
        const intents2 = [];
        return (
          record === 'far' &&
            state2['residency'] === 'mounted' &&
            intents2['push']({
              type: 'park',
              slotKey: key3,
              sourceKey: state2['sourceKey'],
              sourceEpoch: state2['sourceEpoch'],
            }),
          buildResult(state2, { changed: true, intents: intents2 })
        );
      }
      case 'residency': {
        const payload = String(entry['residency'] || '');
        if (!VALID_RESIDENCIES['has'](payload))
          throw new TypeError('invalid renderer media residency: ' + payload);
        if (state2['residency'] === payload) return buildResult(state2);
        if (payload !== 'mounted' && isActivePresentedSurface(state2))
          return buildResult(state2, { accepted: false, reason: 'active-presented-slot-cannot-park' });
        return (
          (state2['residency'] = payload),
          payload !== 'mounted' && ((state2['readiness'] = 'idle'), (state2['surface'] = 'poster')),
          buildResult(state2, { changed: true })
        );
      }
      case 'source-intent': {
        const sourceKey = normalizeSourceKey(entry['sourceKey']),
          enabled3 = entry['rebind'] === true;
        if (state2['sourceKey'] === sourceKey && !enabled3) return buildResult(state2);
        return (
          (state2['sourceKey'] = sourceKey),
          (state2['sourceEpoch'] += 1),
          (state2['readiness'] = 'idle'),
          (state2['surface'] = 'poster'),
          buildResult(state2, {
            changed: true,
            intents: [
              {
                type: 'bind-source',
                slotKey: key3,
                sourceKey: state2['sourceKey'],
                sourceEpoch: state2['sourceEpoch'],
              },
            ],
          })
        );
      }
      case 'request-started': {
        if (!hasCurrentSourceToken(state2, entry)) return run2(state2);
        if (isStableState(state2)) return buildResult(state2);
        const enabled4 = state2['surface'] === 'media',
          changed2 = state2['readiness'] !== 'requesting';
        state2['readiness'] = 'requesting';
        if (!enabled4) state2['surface'] = 'poster';
        return buildResult(state2, { changed: changed2 });
      }
      case 'frame-observed': {
        if (!hasCurrentSourceToken(state2, entry)) return run2(state2);
        if (state2['residency'] !== 'mounted')
          return buildResult(state2, { accepted: false, reason: 'slot-not-mounted' });
        if (!hasStrictPresentedFrameFacts(entry['facts']))
          return buildResult(state2, { accepted: false, reason: 'presentation-facts-incomplete' });
        const changed3 = !isStableState(state2);
        return (
          (state2['readiness'] = 'frameReady'),
          (state2['surface'] = 'media'),
          buildResult(state2, { changed: changed3 })
        );
      }
      case 'error': {
        if (!hasCurrentSourceToken(state2, entry)) return run2(state2);
        const isActivePresentedSurface2 = isActivePresentedSurface(state2),
          changed4 =
            state2['readiness'] !== 'error' || (!isActivePresentedSurface2 && state2['surface'] !== 'poster');
        state2['readiness'] = 'error';
        if (!isActivePresentedSurface2) state2['surface'] = 'poster';
        return buildResult(state2, { changed: changed4 });
      }
      case 'poster-requested': {
        if (isActivePresentedSurface(state2))
          return buildResult(state2, {
            accepted: false,
            reason: 'active-presented-slot-cannot-return-to-poster',
          });
        if (state2['surface'] === 'poster') return buildResult(state2);
        return ((state2['surface'] = 'poster'), buildResult(state2, { changed: true }));
      }
      default:
        throw new TypeError('unknown renderer media slot event: ' + (entry['type'] || ''));
    }
  }
  function read(handle) {
    const slotKey = normalizeSlotKey(handle);
    return snapshotState(map['get'](slotKey) || createInitialState());
  }
  function forget(config) {
    return map['delete'](normalizeSlotKey(config));
  }
  return Object['freeze']({ forget: forget, read: read, transition: transition });
}
export function isRendererMediaSlotStable(scope) {
  return isStableState(scope || {});
}
export const __rendererMediaSlotLifecycleForTest = Object['freeze']({
  hasStrictPresentedFrameFacts: hasStrictPresentedFrameFacts,
});
