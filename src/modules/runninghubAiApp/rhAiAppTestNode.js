import { projectCustomAiAppBundleForNodeRuntime } from './customAiAppNodeBundleRegistry.js';
export function buildRhAiAppTestBundle(value) {
  const structuredClone = structuredClone(value['_buildSavedAppRecordFromCurrentInput']());
  return projectCustomAiAppBundleForNodeRuntime(value['_buildBundleForSavedApp'](structuredClone));
}
