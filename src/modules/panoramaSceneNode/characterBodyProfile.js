const DEFAULT_CHARACTER_BODY_HEIGHT = 1.92;
function finiteBodyValue(value, fallback, min, max) {
  const numeric = Number(value);
  return Number['isFinite'](numeric) ? Math['max'](min, Math['min'](max, numeric)) : fallback;
}
export function captureCharacterModelBodyProfileBase(modelRoot) {
  const head = modelRoot?.['getObjectByName']?.('Head');
  return {
    rootScale: {
      x: Number(modelRoot?.['scale']?.['x']) || 0x1,
      y: Number(modelRoot?.['scale']?.['y']) || 0x1,
      z: Number(modelRoot?.['scale']?.['z']) || 0x1,
    },
    headScale: head?.['scale']
      ? {
          x: Number(head['scale']['x']) || 0x1,
          y: Number(head['scale']['y']) || 0x1,
          z: Number(head['scale']['z']) || 0x1,
        }
      : null,
  };
}
export function applyCharacterBodyProfile(character, profile = {}) {
  if (!character) return;
  const height = finiteBodyValue(profile?.['height'], DEFAULT_CHARACTER_BODY_HEIGHT, 0.55, 2.3),
    heightRatio = height / DEFAULT_CHARACTER_BODY_HEIGHT,
    shoulderScale = finiteBodyValue(profile?.['shoulderScale'], 0x1, 0.65, 1.35),
    hipScale = finiteBodyValue(profile?.['hipScale'], 0x1, 0.65, 1.35),
    bodyScale = (shoulderScale + hipScale) / 0x2,
    depthScale = finiteBodyValue(profile?.['depthScale'], 0x1, 0.75, 1.25),
    headScale = finiteBodyValue(profile?.['headScale'], 0x1, 0.85, 1.45);
  (character['proxyRoot']?.['scale']?.['set']?.(
    heightRatio * bodyScale,
    heightRatio,
    heightRatio * depthScale,
  ),
    character['parts']?.['head']?.['scale']?.['multiplyScalar']?.(headScale));
  if (!character['modelRoot']) return;
  !character['modelBodyProfileBase'] &&
    (character['modelBodyProfileBase'] = captureCharacterModelBodyProfileBase(character['modelRoot']));
  const base = character['modelBodyProfileBase'];
  character['modelRoot']['scale']['set'](
    base['rootScale']['x'] * heightRatio * bodyScale,
    base['rootScale']['y'] * heightRatio,
    base['rootScale']['z'] * heightRatio * depthScale,
  );
  const head = character['modelRoot']['getObjectByName']?.('Head');
  (head?.['scale'] &&
    base['headScale'] &&
    head['scale']['set'](
      base['headScale']['x'] * headScale,
      base['headScale']['y'] * headScale,
      base['headScale']['z'] * headScale,
    ),
    character['modelRoot']['updateMatrixWorld']?.(!![]));
}
