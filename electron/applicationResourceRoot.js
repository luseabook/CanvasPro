import path from 'node:path';
export function resolveApplicationResourceRoot(rootPath) {
  return path.basename(rootPath) === 'app.asar'
    ? path.join(path.dirname(rootPath), 'webapp')
    : rootPath;
}
