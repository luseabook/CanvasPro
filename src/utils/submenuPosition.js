function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const number = toFiniteNumber(value);
    if (number > 0) return number;
  }
  return 0;
}

function normalizeRect(rect = {}) {
  const left = toFiniteNumber(rect.left);
  const top = toFiniteNumber(rect.top);
  const width = firstPositiveNumber(rect.width, toFiniteNumber(rect.right) - left);
  const height = firstPositiveNumber(rect.height, toFiniteNumber(rect.bottom) - top);

  return {
    left,
    top,
    width,
    height,
    right: toFiniteNumber(rect.right, left + width),
    bottom: toFiniteNumber(rect.bottom, top + height),
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function positionAnchoredSubmenu({
  submenu,
  anchorRect,
  horizontalAnchorRect = anchorRect,
  containerRect = { left: 0, top: 0 },
  preferredSide = 'right',
  horizontalPlacement = 'side',
  verticalPlacement = 'top',
  verticalGap = 0,
  position = 'absolute',
  gap = 6,
  viewportMargin = 12,
  viewportWidth = globalThis.window?.innerWidth,
  viewportHeight = globalThis.window?.innerHeight,
  viewportTop = 0,
  submenuWidth,
} = {}) {
  if (!submenu?.style || !anchorRect) return null;

  const margin = Math.max(0, toFiniteNumber(viewportMargin, 12));
  const widthLimit = Math.max(0, toFiniteNumber(viewportWidth));
  const heightLimit = Math.max(0, toFiniteNumber(viewportHeight));
  const minimumTop = Math.max(0, toFiniteNumber(viewportTop) + margin);
  const anchor = normalizeRect(anchorRect);
  const horizontalAnchor = normalizeRect(horizontalAnchorRect || anchorRect);
  const container = normalizeRect(containerRect);

  submenu.style.maxHeight = '';
  submenu.style.overflowY = '';

  const measuredRect = submenu.getBoundingClientRect?.() || {};
  const measuredHeight = firstPositiveNumber(submenu.offsetHeight, measuredRect.height, submenu.scrollHeight);
  const measuredWidth = firstPositiveNumber(submenuWidth, submenu.offsetWidth, measuredRect.width, horizontalAnchor.width);
  const availableHeight =
    heightLimit > minimumTop + margin ? heightLimit - minimumTop - margin : measuredHeight;
  const height =
    measuredHeight > 0 && availableHeight > 0 ? Math.min(measuredHeight, availableHeight) : measuredHeight;

  if (measuredHeight > height && height > 0) {
    submenu.style.maxHeight = Math.floor(height) + 'px';
    submenu.style.overflowY = 'auto';
  }

  const verticalCandidate =
    verticalPlacement === 'above'
      ? anchor.top - height - verticalGap
      : verticalPlacement === 'below'
        ? anchor.bottom + verticalGap
        : anchor.top;
  const maximumTop = Math.max(minimumTop, heightLimit - margin - height);
  const top =
    heightLimit > 0 && height > 0 ? clamp(verticalCandidate, minimumTop, maximumTop) : verticalCandidate;

  const leftCandidate = horizontalAnchor.left - measuredWidth - gap;
  const rightCandidate = horizontalAnchor.right + gap;
  const roomLeft = leftCandidate >= margin;
  const roomRight =
    widthLimit <= 0 || rightCandidate + measuredWidth <= widthLimit - margin;

  let left;
  if (horizontalPlacement === 'center') {
    left = horizontalAnchor.left + horizontalAnchor.width / 2 - measuredWidth / 2;
  } else {
    const preferLeft = preferredSide === 'left';
    left = preferLeft
      ? roomLeft || !roomRight
        ? leftCandidate
        : rightCandidate
      : roomRight || !roomLeft
        ? rightCandidate
        : leftCandidate;
  }

  if (widthLimit > 0 && measuredWidth > 0) {
    left = clamp(left, margin, Math.max(margin, widthLimit - margin - measuredWidth));
  }

  const isFixed = position === 'fixed';
  submenu.style.position = position;
  submenu.style.right = 'auto';
  submenu.style.left = Math.round(left - (isFixed ? 0 : container.left)) + 'px';
  submenu.style.top = Math.round(top - (isFixed ? 0 : container.top)) + 'px';

  return { left, top, width: measuredWidth, height };
}
