import { runningHubQwenAudioEntries } from './runningHubQwenAudioManifests.js';
import { runningHubDoubaoAudioEntries } from './runningHubDoubaoAudioManifests.js';
import { runningHubMinimaxAudioEntries } from './runningHubMinimaxAudioManifests.js';
import { runningHubMurekaAudioEntries } from './runningHubMurekaAudioManifests.js';
import { runningHubAudioHelperExecutionManifests } from './runningHubAudioCatalogShared.js';
const entries = [
  ...runningHubQwenAudioEntries,
  ...runningHubDoubaoAudioEntries,
  ...runningHubMinimaxAudioEntries,
  ...runningHubMurekaAudioEntries,
];
export const runningHubAudioCatalogModels = Object['freeze'](
  entries['map']((_0x6fcbaf) => _0x6fcbaf['model']),
);
export const runningHubAudioCatalogExecutions = Object['freeze']([
  ...entries['map']((_0x3e4c06) => _0x3e4c06['execution']),
  ...runningHubAudioHelperExecutionManifests,
]);
