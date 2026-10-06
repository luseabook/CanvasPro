export function resolveAutoPanVelocity(dx, value) {
  return { dx: dx.dx ?? value.dx, dy: dx.dy ?? value.dy };
}
