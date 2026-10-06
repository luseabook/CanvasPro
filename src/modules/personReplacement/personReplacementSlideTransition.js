const PERSON_REPLACEMENT_SLIDE_ANIMATION_PREFIX = 'person-replacement-slide-',
  PERSON_REPLACEMENT_SLIDE_DURATION_MS = 380,
  PERSON_REPLACEMENT_SLIDE_EASING = 'cubic-bezier(0.22, 0.72, 0.2, 1)';
function cancelTaggedSlideAnimations(value) {
  Array.from(value?.getAnimations?.() || [])
    .filter((item) => String(item?.id || '').startsWith(PERSON_REPLACEMENT_SLIDE_ANIMATION_PREFIX))
    .forEach((key) => key.cancel?.());
}
function getSlideKeyframes(index, result) {
  const transform = index === 'previous';
  if (result)
    return [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: transform ? 'translate3d(100%, 0, 0)' : 'translate3d(-100%, 0, 0)' },
    ];
  return [
    { transform: transform ? 'translate3d(-100%, 0, 0)' : 'translate3d(100%, 0, 0)' },
    { transform: 'translate3d(0, 0, 0)' },
  ];
}
function startSlideAnimation(
  enabled,
  { direction: direction2, duration: duration, outgoing: outgoing } = {},
) {
  if (!enabled || typeof enabled.animate !== 'function') return null;
  const data = enabled.animate(getSlideKeyframes(direction2, outgoing), {
    duration: duration,
    easing: PERSON_REPLACEMENT_SLIDE_EASING,
    fill: 'both',
  });
  return (
    (data.id = '' + PERSON_REPLACEMENT_SLIDE_ANIMATION_PREFIX + (outgoing ? 'outgoing' : 'incoming')),
    data
  );
}
export function startPersonReplacementSlideTransition({
  windowObject: windowObject,
  incomingSlide: incomingSlide,
  outgoingSlide: outgoingSlide = null,
  direction: direction = 'next',
} = {}) {
  (cancelTaggedSlideAnimations(incomingSlide), cancelTaggedSlideAnimations(outgoingSlide));
  const options = windowObject?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true,
    duration2 = options ? 0 : PERSON_REPLACEMENT_SLIDE_DURATION_MS,
    incomingAnimation = startSlideAnimation(incomingSlide, {
      direction: direction,
      duration: duration2,
      outgoing: false,
    }),
    outgoingAnimation = startSlideAnimation(outgoingSlide, {
      direction: direction,
      duration: duration2,
      outgoing: true,
    });
  return {
    duration: duration2,
    incomingAnimation: incomingAnimation,
    outgoingAnimation: outgoingAnimation,
    finished: incomingAnimation?.finished?.catch?.(() => {}) || Promise.resolve(),
  };
}
export function cancelPersonReplacementSlideTransition(target) {
  (target?.incomingAnimation?.cancel?.(), target?.outgoingAnimation?.cancel?.());
}
