import { resolveModelExecution } from '../../manifests/index.js';
import { isRunningHubAiAppManifest } from '../shared/rhAiAppNodeBehavior.js';
export function hasObviouslyInvalidAsyncVideoResult(options = {}) {
  const value = String(
    options?.['videoUrl'] ||
      options?.['localPath'] ||
      options?.['videos']?.[0x0]?.['videoUrl'] ||
      options?.['videos']?.[0x0]?.['sourceUrl'] ||
      '',
  )['trim']();
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i['test'](value);
}
export function getRhAiAppVideoResultMediaKey(response = {}, item = {}) {
  return (
    [
      response['displayLocalPath'],
      response['localPath'],
      response['videoUrl'],
      response['url'],
      response['src'],
      response['thumbUrl'],
      response['thumbId'],
      item?.['localPath'],
      item?.['videoUrl'],
      item?.['src'],
      item?.['thumbUrl'],
    ]
      ['map']((key) => String(key || '')['trim']())
      ['find'](Boolean) || ''
  );
}
export function isRhAiAppVideoNodeData(options2 = {}) {
  const enabled = String(options2?.['model'] || '')['trim']();
  if (!enabled) return ![];
  const providerHint = String(options2?.['provider'] || '')['trim'](),
    modelExecution =
      resolveModelExecution(enabled, { providerHint: providerHint }) || resolveModelExecution(enabled);
  return isRunningHubAiAppManifest(modelExecution?.['modelManifest']);
}
