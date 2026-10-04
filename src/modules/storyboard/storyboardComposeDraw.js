function parseComposeLengthRatio(value, item, key) {
  const enabled = String(value || '').trim();
  if (!enabled) return key;
  const index = Number.parseFloat(enabled);
  if (!Number.isFinite(index)) return key;
  if (enabled.endsWith('%')) return index / 100;
  if (enabled.endsWith('px')) {
    const result = Math.max(1, Number(item) || 1);
    return index / result;
  }
  return index;
}
export function buildStoryboardComposeRenderedCrop(el, box, enabled2) {
  if (!el || !box || !enabled2) return null;
  if (!el.classList?.contains?.('storyboard-cell-img--source-crop')) return null;
  const data = Math.max(1, Math.trunc(Number(box.naturalWidth || box.width) || 0)),
    options = Math.max(1, Math.trunc(Number(box.naturalHeight || box.height) || 0)),
    composeLengthRatio = parseComposeLengthRatio(el.style?.width, enabled2.drawW, 1),
    composeLengthRatio2 = parseComposeLengthRatio(el.style?.height, enabled2.drawH, 1);
  if (composeLengthRatio <= 0 || composeLengthRatio2 <= 0) return null;
  const composeLengthRatio3 = parseComposeLengthRatio(el.style?.left, enabled2.drawW, 0),
    composeLengthRatio4 = parseComposeLengthRatio(el.style?.top, enabled2.drawH, 0),
    sx = Math.max(0, Math.min(data - 1, (-composeLengthRatio3 / composeLengthRatio) * data)),
    sy = Math.max(0, Math.min(options - 1, (-composeLengthRatio4 / composeLengthRatio2) * options)),
    sw = Math.max(1, Math.min(data - sx, data / composeLengthRatio)),
    sh = Math.max(1, Math.min(options - sy, options / composeLengthRatio2));
  return { sx: sx, sy: sy, sw: sw, sh: sh };
}
export async function drawStoryboardComposeAsset(
  ctx,
  { cell: cell, finalUrl: finalUrl, imageEl: imageEl, target: target, loadImage: loadImage },
) {
  if (!ctx || !finalUrl || typeof loadImage !== 'function') return false;
  const enabled3 = await loadImage(finalUrl);
  if (!enabled3) return false;
  const storyboardComposeRenderedCrop = buildStoryboardComposeRenderedCrop(imageEl, enabled3, target);
  if (storyboardComposeRenderedCrop)
    return (
      ctx.drawImage(
        enabled3,
        storyboardComposeRenderedCrop.sx,
        storyboardComposeRenderedCrop.sy,
        storyboardComposeRenderedCrop.sw,
        storyboardComposeRenderedCrop.sh,
        target.x0,
        target.y0,
        target.drawW,
        target.drawH,
      ),
      true
    );
  const source = String(imageEl?.style?.objectFit || '').trim(),
    next =
      source === 'fill' ||
      (!imageEl &&
        (cell?.storyboardExtractedCell === true ||
          cell?.storyboardLockedCell === true ||
          cell?.storyboardPiece === true));
  if (next)
    return (
      ctx.drawImage(
        enabled3,
        0,
        0,
        enabled3.naturalWidth,
        enabled3.naturalHeight,
        target.x0,
        target.y0,
        target.drawW,
        target.drawH,
      ),
      true
    );
  const current = enabled3.naturalWidth,
    entry = enabled3.naturalHeight,
    record = current / entry,
    payload = target.drawW / target.drawH;
  let handle, state, config, scope;
  return (
    record > payload
      ? ((state = entry), (handle = entry * payload), (config = (current - handle) / 2), (scope = 0))
      : ((handle = current), (state = current / payload), (config = 0), (scope = (entry - state) / 2)),
    ctx.drawImage(enabled3, config, scope, handle, state, target.x0, target.y0, target.drawW, target.drawH),
    true
  );
}
