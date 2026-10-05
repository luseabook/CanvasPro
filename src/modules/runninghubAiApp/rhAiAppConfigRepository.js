import { desktopBridge } from '../../services/desktopBridge.js';
import { createRhAiAppPersistence } from './rhAiAppPersistence.js';
import {
  SOURCE_TYPES,
  SOURCE_TYPE_KEYS,
  COMFYUI_WORKFLOW_STATE_SCOPE,
  normalizeSourceType,
  isComfyUiSource,
  isRunningHubSource,
} from './rhAiAppSources.js';
import {
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  normalizeRunningHubModelApiProfileId,
  resolveRunningHubSiteProfileIdFromUrl,
} from '../runningHubProviderProfiles.js';
const PANEL_KIND_KEYS = Object['freeze'](['image', 'video', 'audio']),
  DEFAULT_AI_APP_NAME = '未命名 AI应用',
  SAVED_APPS_STORAGE_KEY = 'aiCanvas.runningHubAiApp.savedApps.v1',
  PANEL_DRAFT_STORAGE_KEY = 'aiCanvas.runningHubAiApp.panelDraft.v1',
  CUSTOM_AI_APP_STORAGE_SAVE_DELAY_MS = 250;
function normalizeKind(value) {
  return PANEL_KIND_KEYS['includes'](value) ? value : 'image';
}
function cloneComponentDrafts(list = []) {
  return Array['isArray'](list) ? list['map']((args) => ({ ...args })) : [];
}
function normalizeAppName(item) {
  const key = String(item || '')['trim']();
  return key || DEFAULT_AI_APP_NAME;
}
function normalizeAppDescription(index) {
  return String(index || '')['trim']();
}
function normalizePromptHelpTooltip(result) {
  return String(result || '')['trim']();
}
function buildKindStateKey(data, options) {
  const kind2 = normalizeKind(options),
    sourceType2 = normalizeSourceType(data),
    isComfyUiSource2 = isComfyUiSource(sourceType2)
      ? COMFYUI_WORKFLOW_STATE_SCOPE
      : isRunningHubSource(sourceType2)
        ? SOURCE_TYPES['runninghub']
        : sourceType2;
  return isComfyUiSource2 ? isComfyUiSource2 + ':' + kind2 : kind2;
}
function buildLegacyKindStateKey(target, source) {
  const kind3 = normalizeKind(source),
    sourceType3 = normalizeSourceType(target);
  return sourceType3 ? sourceType3 + ':' + kind3 : kind3;
}
function createSavedAppId() {
  const next =
    typeof globalThis['crypto']?.['randomUUID'] === 'function'
      ? globalThis['crypto']['randomUUID']()
      : Date['now']() + '-' + Math['random']()['toString'](36)['slice'](2, 10);
  return 'rh-ai-app-' + next;
}
function serializeSavedAppRecord(error = {}) {
  return {
    id: String(error['id'] || '')['trim'](),
    sourceType: normalizeSourceType(error['sourceType']) || SOURCE_TYPES['runninghub'],
    kind: normalizeKind(error['kind']),
    runningHubProfileId: normalizeRunningHubModelApiProfileId(
      error['runningHubProfileId'] ||
        resolveRunningHubSiteProfileIdFromUrl(error['input']) ||
        RUNNINGHUB_DOMESTIC_PROFILE_ID,
    ),
    name: normalizeAppName(error['name']),
    description: normalizeAppDescription(error['description']),
    promptHelpTooltip: normalizePromptHelpTooltip(error['promptHelpTooltip']),
    input: String(error['input'] || ''),
    componentDraftKey: String(error['componentDraftKey'] || ''),
    componentDrafts: cloneComponentDrafts(error['componentDrafts']),
    createdAt: String(error['createdAt'] || ''),
    updatedAt: String(error['updatedAt'] || ''),
  };
}
function normalizeSavedAppRecord(options2 = {}) {
  const serializeSavedAppRecord2 = serializeSavedAppRecord(options2);
  if (!serializeSavedAppRecord2['id'] || !serializeSavedAppRecord2['input']['trim']()) return null;
  return serializeSavedAppRecord2;
}
function loadSavedAppsFromStorage(current, handler) {
  try {
    const entry = current?.['getItem']?.(SAVED_APPS_STORAGE_KEY),
      list2 = entry ? JSON['parse'](entry) : [];
    if (!Array['isArray'](list2)) return [];
    return list2['map'](normalizeSavedAppRecord)['filter'](Boolean);
  } catch (record) {
    return (handler('[RH AI App] load saved apps failed:', record), []);
  }
}
function saveSavedAppsToStorage(payload, list3 = [], handler2) {
  try {
    const handle = list3['map'](serializeSavedAppRecord);
    payload?.['setItem']?.(SAVED_APPS_STORAGE_KEY, JSON['stringify'](handle));
  } catch (state) {
    handler2('[RH AI App] save saved apps failed:', state);
  }
}
function createEmptyKindState() {
  return {
    input: '',
    appName: DEFAULT_AI_APP_NAME,
    appDescription: '',
    promptHelpTooltip: '',
    runningHubProfileId: '',
    savedAppId: '',
    componentDraftKey: '',
    componentDrafts: [],
    componentCandidates: [],
    currentBundle: null,
    errorMessage: '',
  };
}
function createInitialKindStates() {
  const config = PANEL_KIND_KEYS['reduce']((scope, input) => {
    return ((scope[input] = createEmptyKindState()), scope);
  }, {});
  return (
    SOURCE_TYPE_KEYS['forEach']((output) => {
      PANEL_KIND_KEYS['forEach']((value2) => {
        config[buildKindStateKey(output, value2)] = createEmptyKindState();
      });
    }),
    config
  );
}
function serializeKindStateForStorage(options3 = {}) {
  return {
    sourceType: normalizeSourceType(options3['sourceType']),
    definitionReference: String(options3['definitionReference'] || ''),
    input: String(options3['input'] || ''),
    appName: normalizeAppName(options3['appName']),
    appDescription: normalizeAppDescription(options3['appDescription']),
    promptHelpTooltip: normalizePromptHelpTooltip(options3['promptHelpTooltip']),
    runningHubProfileId: String(options3['runningHubProfileId'] || '')['trim']()
      ? normalizeRunningHubModelApiProfileId(options3['runningHubProfileId'])
      : '',
    savedAppId: String(options3['savedAppId'] || ''),
    componentDraftKey: String(options3['componentDraftKey'] || ''),
    componentDrafts: cloneComponentDrafts(options3['componentDrafts']),
    componentCandidates: cloneComponentDrafts(options3['componentCandidates']),
    errorMessage: String(options3['errorMessage'] || ''),
  };
}
function normalizeStoredKindState(options4 = {}) {
  return { ...createEmptyKindState(), ...serializeKindStateForStorage(options4), currentBundle: null };
}
function normalizeKindStates(options5 = {}) {
  const initialKindStates = createInitialKindStates();
  return (
    Object['entries'](options5 || {})['forEach'](([enabled, value3]) => {
      if (!enabled) return;
      initialKindStates[enabled] = normalizeStoredKindState(value3);
    }),
    initialKindStates
  );
}
function loadPanelDraftFromStorage(value4, handler3) {
  try {
    const value5 = value4?.['getItem']?.(PANEL_DRAFT_STORAGE_KEY),
      enabled2 = value5 ? JSON['parse'](value5) : null;
    if (!enabled2 || typeof enabled2 !== 'object') return null;
    return normalizePanelDraftPayload(enabled2);
  } catch (value6) {
    return (handler3('[RH AI App] load panel draft failed:', value6), null);
  }
}
function savePanelDraftToStorage(value7, value8, handler4) {
  try {
    const serializePanelDraftForStorage2 = serializePanelDraftForStorage(value8);
    value7?.['setItem']?.(PANEL_DRAFT_STORAGE_KEY, JSON['stringify'](serializePanelDraftForStorage2));
  } catch (value9) {
    handler4('[RH AI App] save panel draft failed:', value9);
  }
}
function serializePanelDraftForStorage({
  sourceType: sourceType = '',
  kind: kind = 'image',
  kindStates: kindStates = {},
} = {}) {
  return {
    sourceType: normalizeSourceType(sourceType),
    kind: normalizeKind(kind),
    kindStates: Object['keys'](kindStates || {})['reduce']((value10, value11) => {
      return ((value10[value11] = serializeKindStateForStorage(kindStates[value11])), value10);
    }, {}),
  };
}
function normalizePanelDraftPayload(enabled3 = {}) {
  if (!enabled3 || typeof enabled3 !== 'object') return null;
  const value12 =
    enabled3['kindStates'] && typeof enabled3['kindStates'] === 'object' ? enabled3['kindStates'] : {};
  return {
    sourceType: normalizeSourceType(enabled3['sourceType']),
    kind: normalizeKind(enabled3['kind']),
    kindStates: normalizeKindStates(value12),
  };
}
function normalizeCustomAiAppStoragePayload(ok = {}) {
  const savedApps2 = Array['isArray'](ok?.['savedApps'])
    ? ok['savedApps']['map'](normalizeSavedAppRecord)['filter'](Boolean)
    : [];
  return {
    ok: ok?.['ok'] !== false,
    hasData: ok?.['hasData'] === true,
    storageRoot: String(ok?.['storageRoot'] || ''),
    savedApps: savedApps2,
    panelDraft: normalizePanelDraftPayload(ok?.['panelDraft']),
  };
}
function buildCustomAiAppStoragePayload({
  savedApps: savedApps = [],
  sourceType: sourceType = '',
  kind: kind = 'image',
  kindStates: kindStates = {},
} = {}) {
  return {
    savedApps: savedApps['map'](serializeSavedAppRecord),
    panelDraft: serializePanelDraftForStorage({ sourceType: sourceType, kind: kind, kindStates: kindStates }),
  };
}
function getCustomAiAppStorageBridge(value13) {
  return value13?.['isAvailable']?.() === true ? value13 : null;
}
async function readCustomAiAppsFromFileStorage(value14) {
  const customAiAppStorageBridge = getCustomAiAppStorageBridge(value14);
  if (!customAiAppStorageBridge) return null;
  const value15 = await customAiAppStorageBridge['read']();
  return normalizeCustomAiAppStoragePayload(value15);
}
export function createRhAiAppConfigRepository({
  storage: storage = globalThis['window']?.['localStorage'] || globalThis['localStorage'],
  externalBridge: externalBridge = desktopBridge['customAiApps'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  getSnapshot: getSnapshot = () => ({}),
  applyExternalSnapshot: applyExternalSnapshot = () => {},
  onWarning: onWarning = (...args2) => console['warn'](...args2),
} = {}) {
  let enabled4 = false,
    enabled5 = false,
    enabled6 = false,
    enabled7 = 0;
  const run = createRhAiAppPersistence({
      externalBridge: externalBridge,
      storage: storage,
      onWarning: onWarning,
    }),
    handler5 = () => {
      if (!enabled7) return;
      (windowObject?.['clearTimeout']?.(enabled7), (enabled7 = 0));
    },
    value16 = {
      loadLocalSeed() {
        const panelDraft = loadPanelDraftFromStorage(storage, onWarning),
          savedApps3 = loadSavedAppsFromStorage(storage, onWarning);
        return {
          panelDraft: panelDraft,
          savedApps: savedApps3,
          hasData: Boolean(panelDraft) || savedApps3['length'] > 0,
        };
      },
      saveSavedApps(list4 = []) {
        (saveSavedAppsToStorage(storage, list4, onWarning), value16['scheduleExternalPersist']());
      },
      commitSavedApps(list5, onCommitted) {
        handler5();
        const savedApps4 = structuredClone(list5['map'](serializeSavedAppRecord));
        return (
          (enabled6 = true),
          run(() => buildCustomAiAppStoragePayload({ ...getSnapshot(), savedApps: savedApps4 }), {
            saveApps: true,
            onCommitted: onCommitted,
          })
        );
      },
      savePanelDraft(options6 = {}) {
        (savePanelDraftToStorage(storage, options6, onWarning), value16['scheduleExternalPersist']());
      },
      createInitialKindStates: createInitialKindStates,
      createEmptyKindState: createEmptyKindState,
      getKindStateKey: buildKindStateKey,
      getLegacyKindStateKey: buildLegacyKindStateKey,
      buildSavedAppRecord(args3 = {}, createdAt = null) {
        const updatedAt = new Date()['toISOString']();
        return serializeSavedAppRecord({
          ...createdAt,
          ...args3,
          id: String(createdAt?.['id'] || args3?.['id'] || '')['trim']() || createSavedAppId(),
          createdAt: createdAt?.['createdAt'] || args3?.['createdAt'] || updatedAt,
          updatedAt: updatedAt,
        });
      },
      async hydrateExternalStorage({ hasLocalSeed: hasLocalSeed = false } = {}) {
        try {
          const customAiAppsFromFileStorage = await readCustomAiAppsFromFileStorage(externalBridge);
          if (!customAiAppsFromFileStorage) return null;
          enabled4 = true;
          if (enabled6) return (await value16['flushExternalPersist'](), customAiAppsFromFileStorage);
          if (customAiAppsFromFileStorage['hasData']) {
            enabled5 = true;
            try {
              await applyExternalSnapshot(customAiAppsFromFileStorage);
            } finally {
              ((enabled5 = false), (enabled6 = false));
            }
            return customAiAppsFromFileStorage;
          }
          return (hasLocalSeed && (await value16['flushExternalPersist']()), customAiAppsFromFileStorage);
        } catch (value17) {
          return (onWarning('[RH AI App] hydrate file storage failed:', value17), null);
        }
      },
      scheduleExternalPersist() {
        if (enabled5 || !getCustomAiAppStorageBridge(externalBridge)) return false;
        if (!enabled4) return ((enabled6 = true), false);
        return (
          (enabled6 = false),
          handler5(),
          (enabled7 = windowObject?.['setTimeout']?.(
            () => void value16['flushExternalPersist'](),
            CUSTOM_AI_APP_STORAGE_SAVE_DELAY_MS,
          )),
          true
        );
      },
      async flushExternalPersist() {
        if (!getCustomAiAppStorageBridge(externalBridge)) return null;
        handler5();
        try {
          const value18 = await run(() => buildCustomAiAppStoragePayload(getSnapshot()));
          return ((enabled6 = false), value18);
        } catch (value19) {
          return (onWarning('[RH AI App] persist file storage failed:', value19), null);
        }
      },
      dispose() {
        handler5();
      },
    };
  return Object['freeze'](value16);
}
