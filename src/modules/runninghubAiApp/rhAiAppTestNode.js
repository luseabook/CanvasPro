import { projectCustomAiAppBundleForNodeRuntime } from './customAiAppNodeBundleRegistry.js';
export function buildRhAiAppTestBundle(value) {
  const structuredClone2 = structuredClone(value['_buildSavedAppRecordFromCurrentInput']());
  return projectCustomAiAppBundleForNodeRuntime(value['_buildBundleForSavedApp'](structuredClone2));
}
