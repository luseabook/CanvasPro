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
  CUSTOM_AI_APP_STORAGE_SAVE_DELAY_MS = 0xfa;
function normalizeKind(_0x2125ae) {
  return PANEL_KIND_KEYS['includes'](_0x2125ae) ? _0x2125ae : 'image';
}
function cloneComponentDrafts(_0x297516 = []) {
  return Array['isArray'](_0x297516) ? _0x297516['map']((_0x1e3211) => ({ ..._0x1e3211 })) : [];
}
function normalizeAppName(_0x4c83e3) {
  const _0x50801b = String(_0x4c83e3 || '')['trim']();
  return _0x50801b || DEFAULT_AI_APP_NAME;
}
function normalizeAppDescription(_0xc134a5) {
  return String(_0xc134a5 || '')['trim']();
}
function normalizePromptHelpTooltip(_0x1203b3) {
  return String(_0x1203b3 || '')['trim']();
}
function buildKindStateKey(_0x3b7a04, _0x52f12e) {
  const _0x50a0b8 = normalizeKind(_0x52f12e),
    _0x27bd5d = normalizeSourceType(_0x3b7a04),
    _0x3bc330 = isComfyUiSource(_0x27bd5d)
      ? COMFYUI_WORKFLOW_STATE_SCOPE
      : isRunningHubSource(_0x27bd5d)
        ? SOURCE_TYPES['runninghub']
        : _0x27bd5d;
  return _0x3bc330 ? _0x3bc330 + ':' + _0x50a0b8 : _0x50a0b8;
}
function buildLegacyKindStateKey(_0xa38102, _0x1ce5cd) {
  const _0x4e7185 = normalizeKind(_0x1ce5cd),
    _0x5c5482 = normalizeSourceType(_0xa38102);
  return _0x5c5482 ? _0x5c5482 + ':' + _0x4e7185 : _0x4e7185;
}
function createSavedAppId() {
  const _0x4cf720 =
    typeof globalThis['crypto']?.['randomUUID'] === 'function'
      ? globalThis['crypto']['randomUUID']()
      : Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0xa);
  return 'rh-ai-app-' + _0x4cf720;
}
function serializeSavedAppRecord(_0x58a2bf = {}) {
  return {
    id: String(_0x58a2bf['id'] || '')['trim'](),
    sourceType: normalizeSourceType(_0x58a2bf['sourceType']) || SOURCE_TYPES['runninghub'],
    kind: normalizeKind(_0x58a2bf['kind']),
    runningHubProfileId: normalizeRunningHubModelApiProfileId(
      _0x58a2bf['runningHubProfileId'] ||
        resolveRunningHubSiteProfileIdFromUrl(_0x58a2bf['input']) ||
        RUNNINGHUB_DOMESTIC_PROFILE_ID,
    ),
    name: normalizeAppName(_0x58a2bf['name']),
    description: normalizeAppDescription(_0x58a2bf['description']),
    promptHelpTooltip: normalizePromptHelpTooltip(_0x58a2bf['promptHelpTooltip']),
    input: String(_0x58a2bf['input'] || ''),
    componentDraftKey: String(_0x58a2bf['componentDraftKey'] || ''),
    componentDrafts: cloneComponentDrafts(_0x58a2bf['componentDrafts']),
    createdAt: String(_0x58a2bf['createdAt'] || ''),
    updatedAt: String(_0x58a2bf['updatedAt'] || ''),
  };
}
function normalizeSavedAppRecord(_0x31395f = {}) {
  const _0x3eda2a = serializeSavedAppRecord(_0x31395f);
  if (!_0x3eda2a['id'] || !_0x3eda2a['input']['trim']()) return null;
  return _0x3eda2a;
}
function loadSavedAppsFromStorage(_0x3f62ab, _0x5e9a15) {
  try {
    const _0x40257b = _0x3f62ab?.['getItem']?.(SAVED_APPS_STORAGE_KEY),
      _0x5227d9 = _0x40257b ? JSON['parse'](_0x40257b) : [];
    if (!Array['isArray'](_0x5227d9)) return [];
    return _0x5227d9['map'](normalizeSavedAppRecord)['filter'](Boolean);
  } catch (_0x76ac8b) {
    return (_0x5e9a15('[RH AI App] load saved apps failed:', _0x76ac8b), []);
  }
}
function saveSavedAppsToStorage(_0x1bc67c, _0x478116 = [], _0x366718) {
  try {
    const _0x6ac9ad = _0x478116['map'](serializeSavedAppRecord);
    _0x1bc67c?.['setItem']?.(SAVED_APPS_STORAGE_KEY, JSON['stringify'](_0x6ac9ad));
  } catch (_0x226aa2) {
    _0x366718('[RH AI App] save saved apps failed:', _0x226aa2);
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
  const _0x36bc8b = PANEL_KIND_KEYS['reduce']((_0x2c52b2, _0x70a1b1) => {
    return ((_0x2c52b2[_0x70a1b1] = createEmptyKindState()), _0x2c52b2);
  }, {});
  return (
    SOURCE_TYPE_KEYS['forEach']((_0xbef130) => {
      PANEL_KIND_KEYS['forEach']((_0x526c44) => {
        _0x36bc8b[buildKindStateKey(_0xbef130, _0x526c44)] = createEmptyKindState();
      });
    }),
    _0x36bc8b
  );
}
function serializeKindStateForStorage(_0x1c37e6 = {}) {
  return {
    sourceType: normalizeSourceType(_0x1c37e6['sourceType']),
    definitionReference: String(_0x1c37e6['definitionReference'] || ''),
    input: String(_0x1c37e6['input'] || ''),
    appName: normalizeAppName(_0x1c37e6['appName']),
    appDescription: normalizeAppDescription(_0x1c37e6['appDescription']),
    promptHelpTooltip: normalizePromptHelpTooltip(_0x1c37e6['promptHelpTooltip']),
    runningHubProfileId: String(_0x1c37e6['runningHubProfileId'] || '')['trim']()
      ? normalizeRunningHubModelApiProfileId(_0x1c37e6['runningHubProfileId'])
      : '',
    savedAppId: String(_0x1c37e6['savedAppId'] || ''),
    componentDraftKey: String(_0x1c37e6['componentDraftKey'] || ''),
    componentDrafts: cloneComponentDrafts(_0x1c37e6['componentDrafts']),
    componentCandidates: cloneComponentDrafts(_0x1c37e6['componentCandidates']),
    errorMessage: String(_0x1c37e6['errorMessage'] || ''),
  };
}
function normalizeStoredKindState(_0x2c2135 = {}) {
  return { ...createEmptyKindState(), ...serializeKindStateForStorage(_0x2c2135), currentBundle: null };
}
function normalizeKindStates(_0xc0568f = {}) {
  const _0x10f17f = createInitialKindStates();
  return (
    Object['entries'](_0xc0568f || {})['forEach'](([_0x3ea98f, _0x2e4e88]) => {
      if (!_0x3ea98f) return;
      _0x10f17f[_0x3ea98f] = normalizeStoredKindState(_0x2e4e88);
    }),
    _0x10f17f
  );
}
function loadPanelDraftFromStorage(_0x3efe8c, _0x4dbb93) {
  try {
    const _0x3f490e = _0x3efe8c?.['getItem']?.(PANEL_DRAFT_STORAGE_KEY),
      _0x3842cf = _0x3f490e ? JSON['parse'](_0x3f490e) : null;
    if (!_0x3842cf || typeof _0x3842cf !== 'object') return null;
    return normalizePanelDraftPayload(_0x3842cf);
  } catch (_0x3e5b7f) {
    return (_0x4dbb93('[RH AI App] load panel draft failed:', _0x3e5b7f), null);
  }
}
function savePanelDraftToStorage(_0x28a17e, _0x5bc2fb, _0x49aeff) {
  try {
    const _0x1fd841 = serializePanelDraftForStorage(_0x5bc2fb);
    _0x28a17e?.['setItem']?.(PANEL_DRAFT_STORAGE_KEY, JSON['stringify'](_0x1fd841));
  } catch (_0xb70d42) {
    _0x49aeff('[RH\x20AI\x20App]\x20save\x20panel\x20draft\x20failed:', _0xb70d42);
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
    kindStates: Object['keys'](kindStates || {})['reduce']((_0x56eb96, _0xa86d68) => {
      return ((_0x56eb96[_0xa86d68] = serializeKindStateForStorage(kindStates[_0xa86d68])), _0x56eb96);
    }, {}),
  };
}
function normalizePanelDraftPayload(_0xf8d2b9 = {}) {
  if (!_0xf8d2b9 || typeof _0xf8d2b9 !== 'object') return null;
  const _0x289be1 =
    _0xf8d2b9['kindStates'] && typeof _0xf8d2b9['kindStates'] === 'object' ? _0xf8d2b9['kindStates'] : {};
  return {
    sourceType: normalizeSourceType(_0xf8d2b9['sourceType']),
    kind: normalizeKind(_0xf8d2b9['kind']),
    kindStates: normalizeKindStates(_0x289be1),
  };
}
function normalizeCustomAiAppStoragePayload(_0x545e24 = {}) {
  const _0x180e3c = Array['isArray'](_0x545e24?.['savedApps'])
    ? _0x545e24['savedApps']['map'](normalizeSavedAppRecord)['filter'](Boolean)
    : [];
  return {
    ok: _0x545e24?.['ok'] !== ![],
    hasData: _0x545e24?.['hasData'] === !![],
    storageRoot: String(_0x545e24?.['storageRoot'] || ''),
    savedApps: _0x180e3c,
    panelDraft: normalizePanelDraftPayload(_0x545e24?.['panelDraft']),
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
function getCustomAiAppStorageBridge(_0x3d0cf8) {
  return _0x3d0cf8?.['isAvailable']?.() === !![] ? _0x3d0cf8 : null;
}
async function readCustomAiAppsFromFileStorage(_0x4a4ff8) {
  const _0x522d1f = getCustomAiAppStorageBridge(_0x4a4ff8);
  if (!_0x522d1f) return null;
  const _0x26372c = await _0x522d1f['read']();
  return normalizeCustomAiAppStoragePayload(_0x26372c);
}
export function createRhAiAppConfigRepository({
  storage: storage = globalThis['window']?.['localStorage'] || globalThis['localStorage'],
  externalBridge: externalBridge = desktopBridge['customAiApps'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  getSnapshot: getSnapshot = () => ({}),
  applyExternalSnapshot: applyExternalSnapshot = () => {},
  onWarning: onWarning = (..._0x56b87f) => console['warn'](..._0x56b87f),
} = {}) {
  let _0x25535d = ![],
    _0x206553 = ![],
    _0x1cc11f = ![],
    _0xe06afb = 0x0;
  const _0x47a9e5 = createRhAiAppPersistence({
      externalBridge: externalBridge,
      storage: storage,
      onWarning: onWarning,
    }),
    _0x28be78 = () => {
      if (!_0xe06afb) return;
      (windowObject?.['clearTimeout']?.(_0xe06afb), (_0xe06afb = 0x0));
    },
    _0x414c75 = {
      loadLocalSeed() {
        const _0x37640f = loadPanelDraftFromStorage(storage, onWarning),
          _0xcc3b34 = loadSavedAppsFromStorage(storage, onWarning);
        return {
          panelDraft: _0x37640f,
          savedApps: _0xcc3b34,
          hasData: Boolean(_0x37640f) || _0xcc3b34['length'] > 0x0,
        };
      },
      saveSavedApps(_0x53a58d = []) {
        (saveSavedAppsToStorage(storage, _0x53a58d, onWarning), _0x414c75['scheduleExternalPersist']());
      },
      commitSavedApps(_0x46797f, _0x11562d) {
        _0x28be78();
        const _0x171518 = structuredClone(_0x46797f['map'](serializeSavedAppRecord));
        return (
          (_0x1cc11f = !![]),
          _0x47a9e5(() => buildCustomAiAppStoragePayload({ ...getSnapshot(), savedApps: _0x171518 }), {
            saveApps: !![],
            onCommitted: _0x11562d,
          })
        );
      },
      savePanelDraft(_0x1e508b = {}) {
        (savePanelDraftToStorage(storage, _0x1e508b, onWarning), _0x414c75['scheduleExternalPersist']());
      },
      createInitialKindStates: createInitialKindStates,
      createEmptyKindState: createEmptyKindState,
      getKindStateKey: buildKindStateKey,
      getLegacyKindStateKey: buildLegacyKindStateKey,
      buildSavedAppRecord(_0x1b277a = {}, _0x25ae0a = null) {
        const _0x5cfba5 = new Date()['toISOString']();
        return serializeSavedAppRecord({
          ..._0x25ae0a,
          ..._0x1b277a,
          id: String(_0x25ae0a?.['id'] || _0x1b277a?.['id'] || '')['trim']() || createSavedAppId(),
          createdAt: _0x25ae0a?.['createdAt'] || _0x1b277a?.['createdAt'] || _0x5cfba5,
          updatedAt: _0x5cfba5,
        });
      },
      async hydrateExternalStorage({ hasLocalSeed: hasLocalSeed = ![] } = {}) {
        try {
          const _0x584301 = await readCustomAiAppsFromFileStorage(externalBridge);
          if (!_0x584301) return null;
          _0x25535d = !![];
          if (_0x1cc11f) return (await _0x414c75['flushExternalPersist'](), _0x584301);
          if (_0x584301['hasData']) {
            _0x206553 = !![];
            try {
              await applyExternalSnapshot(_0x584301);
            } finally {
              ((_0x206553 = ![]), (_0x1cc11f = ![]));
            }
            return _0x584301;
          }
          return (hasLocalSeed && (await _0x414c75['flushExternalPersist']()), _0x584301);
        } catch (_0x35b87b) {
          return (onWarning('[RH AI App] hydrate file storage failed:', _0x35b87b), null);
        }
      },
      scheduleExternalPersist() {
        if (_0x206553 || !getCustomAiAppStorageBridge(externalBridge)) return ![];
        if (!_0x25535d) return ((_0x1cc11f = !![]), ![]);
        return (
          (_0x1cc11f = ![]),
          _0x28be78(),
          (_0xe06afb = windowObject?.['setTimeout']?.(
            () => void _0x414c75['flushExternalPersist'](),
            CUSTOM_AI_APP_STORAGE_SAVE_DELAY_MS,
          )),
          !![]
        );
      },
      async flushExternalPersist() {
        if (!getCustomAiAppStorageBridge(externalBridge)) return null;
        _0x28be78();
        try {
          const _0x4734eb = await _0x47a9e5(() => buildCustomAiAppStoragePayload(getSnapshot()));
          return ((_0x1cc11f = ![]), _0x4734eb);
        } catch (_0x43ac3f) {
          return (onWarning('[RH AI App] persist file storage failed:', _0x43ac3f), null);
        }
      },
      dispose() {
        _0x28be78();
      },
    };
  return Object['freeze'](_0x414c75);
}
