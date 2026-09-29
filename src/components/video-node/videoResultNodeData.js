import { resolveModelExecution } from '../../manifests/index.js';
import { isRunningHubAiAppManifest } from '../shared/rhAiAppNodeBehavior.js';
export function hasObviouslyInvalidAsyncVideoResult(_0x1e0958 = {}) {
  const _0x591cc7 = String(
    _0x1e0958?.['videoUrl'] ||
      _0x1e0958?.['localPath'] ||
      _0x1e0958?.['videos']?.[0x0]?.['videoUrl'] ||
      _0x1e0958?.['videos']?.[0x0]?.['sourceUrl'] ||
      '',
  )['trim']();
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i['test'](_0x591cc7);
}
export function getRhAiAppVideoResultMediaKey(_0x151fd1 = {}, _0x1e80d5 = {}) {
  return (
    [
      _0x151fd1['displayLocalPath'],
      _0x151fd1['localPath'],
      _0x151fd1['videoUrl'],
      _0x151fd1['url'],
      _0x151fd1['src'],
      _0x151fd1['thumbUrl'],
      _0x151fd1['thumbId'],
      _0x1e80d5?.['localPath'],
      _0x1e80d5?.['videoUrl'],
      _0x1e80d5?.['src'],
      _0x1e80d5?.['thumbUrl'],
    ]
      ['map']((_0x3ce135) => String(_0x3ce135 || '')['trim']())
      ['find'](Boolean) || ''
  );
}
export function isRhAiAppVideoNodeData(_0x516908 = {}) {
  const _0xe2fad3 = String(_0x516908?.['model'] || '')['trim']();
  if (!_0xe2fad3) return ![];
  const _0x27d731 = String(_0x516908?.['provider'] || '')['trim'](),
    _0x439f0e =
      resolveModelExecution(_0xe2fad3, { providerHint: _0x27d731 }) || resolveModelExecution(_0xe2fad3);
  return isRunningHubAiAppManifest(_0x439f0e?.['modelManifest']);
}
