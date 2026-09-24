import { realpathSync } from 'node:fs';
import path from 'node:path';
export function isPathInsideRoot(candidate, root) {
  try {
    const resolvedCandidate = path['resolve'](candidate),
      resolvedRoot = path['resolve'](root),
      relativePath = path['relative'](resolvedRoot, resolvedCandidate);
    return (
      relativePath === '' ||
      (relativePath !== '..' &&
        !relativePath['startsWith']('..' + path['sep']) &&
        !path['isAbsolute'](relativePath))
    );
  } catch {
    return ![];
  }
}
export function resolveExistingPathWithinRoot(
  root,
  relativePath,
  { realpath: realpath = realpathSync } = {},
) {
  try {
    const resolvedRoot = path['resolve'](root),
      resolvedTarget = path['resolve'](resolvedRoot, relativePath);
    if (!isPathInsideRoot(resolvedTarget, resolvedRoot)) return '';
    const realRoot = realpath(resolvedRoot),
      realTarget = realpath(resolvedTarget);
    return isPathInsideRoot(realTarget, realRoot) ? realTarget : '';
  } catch {
    return '';
  }
}
