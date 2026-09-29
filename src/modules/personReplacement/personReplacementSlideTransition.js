const PERSON_REPLACEMENT_SLIDE_ANIMATION_PREFIX = 'person-replacement-slide-',
  PERSON_REPLACEMENT_SLIDE_DURATION_MS = 0x17c,
  PERSON_REPLACEMENT_SLIDE_EASING = 'cubic-bezier(0.22, 0.72, 0.2, 1)';
function cancelTaggedSlideAnimations(_0x339f69) {
  Array['from'](_0x339f69?.['getAnimations']?.() || [])
    ['filter']((_0x4922f8) =>
      String(_0x4922f8?.['id'] || '')['startsWith'](PERSON_REPLACEMENT_SLIDE_ANIMATION_PREFIX),
    )
    ['forEach']((_0x323d6b) => _0x323d6b['cancel']?.());
}
function getSlideKeyframes(_0x45a5e8, _0x1ae3a5) {
  const _0x5e03be = _0x45a5e8 === 'previous';
  if (_0x1ae3a5)
    return [
      { transform: 'translate3d(0,\x200,\x200)' },
      { transform: _0x5e03be ? 'translate3d(100%,\x200,\x200)' : 'translate3d(-100%, 0, 0)' },
    ];
  return [
    { transform: _0x5e03be ? 'translate3d(-100%,\x200,\x200)' : 'translate3d(100%, 0, 0)' },
    { transform: 'translate3d(0, 0, 0)' },
  ];
}
function startSlideAnimation(
  _0x42ce70,
  { direction: _0xb2b640, duration: _0x23aa6d, outgoing: _0x251341 } = {},
) {
  if (!_0x42ce70 || typeof _0x42ce70['animate'] !== 'function') return null;
  const _0xb964da = _0x42ce70['animate'](getSlideKeyframes(_0xb2b640, _0x251341), {
    duration: _0x23aa6d,
    easing: PERSON_REPLACEMENT_SLIDE_EASING,
    fill: 'both',
  });
  return (
    (_0xb964da['id'] =
      '' + PERSON_REPLACEMENT_SLIDE_ANIMATION_PREFIX + (_0x251341 ? 'outgoing' : 'incoming')),
    _0xb964da
  );
}
export function startPersonReplacementSlideTransition({
  windowObject: _0x3a717a,
  incomingSlide: _0xab48cc,
  outgoingSlide: outgoingSlide = null,
  direction: direction = 'next',
} = {}) {
  (cancelTaggedSlideAnimations(_0xab48cc), cancelTaggedSlideAnimations(outgoingSlide));
  const _0x4ca249 = _0x3a717a?.['matchMedia']?.('(prefers-reduced-motion: reduce)')?.['matches'] === !![],
    _0x17551c = _0x4ca249 ? 0x0 : PERSON_REPLACEMENT_SLIDE_DURATION_MS,
    _0x5092e4 = startSlideAnimation(_0xab48cc, { direction: direction, duration: _0x17551c, outgoing: ![] }),
    _0x44e5c8 = startSlideAnimation(outgoingSlide, {
      direction: direction,
      duration: _0x17551c,
      outgoing: !![],
    });
  return {
    duration: _0x17551c,
    incomingAnimation: _0x5092e4,
    outgoingAnimation: _0x44e5c8,
    finished: _0x5092e4?.['finished']?.['catch']?.(() => {}) || Promise['resolve'](),
  };
}
export function cancelPersonReplacementSlideTransition(_0x3c31a6) {
  (_0x3c31a6?.['incomingAnimation']?.['cancel']?.(), _0x3c31a6?.['outgoingAnimation']?.['cancel']?.());
}
