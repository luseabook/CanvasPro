// Panel helpers/normalization extracted from audioVoicePanel.js.

import {
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_VOICE_CONVERT_MODEL_ID,} from '../manifests/index.js';
import {
  buildAudioWorkflowItems,
  buildAudioWorkflowMenuGroups,} from '../components/audio-node/audioModelMenuHelpers.js';
import {
  createAudioVoicePayloadError,
  resolveSegmentLocalAudioUrl,} from './audioVoicePanelSegmentState.js';
import {
  doesAudioWorkflowSupportMultipleAudioInputs,
  getAudioWorkflowSlots,
  normalizeAudioWorkflowRefSlots,} from '../components/audio-node/audioWorkflowRefSlots.js';
import {
  isAudioVoiceAudioNode,} from './audioVoicePanelPickSession.js';
import {
  localPathToUrl,
  normalizeLocalPath,} from '../utils/localMediaPath.js';
import {
  resolveCanvasAudioLocalPath,
  resolveCanvasAudioUrl,
  resolveCanvasVideoLocalPath,
  resolveCanvasVideoPosterUrl,} from '../services/canvasMediaLocalService.js';
import {
  translateManifestText,} from '../i18n/manifestText.js';
import {
  AUDIO_VOICE_ANALYSIS_STAGES,
  AUDIO_VOICE_IMITATE_TONE_WORKFLOW_IDS,
  AUDIO_VOICE_PANEL_MODEL_MENU_GROUPS,
  AUDIO_VOICE_PANEL_WIDTH_LIMITS,
  AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY,} from './audioVoicePanel.js';


export function clampProgress01(data) {
  const target = Number(data);
  if (!Number.isFinite(target)) return 0;
  return Math.max(0, Math.min(1, target));
}
export function normalizeAnalysisProgressStage(source) {
  const next = String(source || '').trim();
  return AUDIO_VOICE_ANALYSIS_STAGES.has(next) ? next : 'model-prepare';
}
export function getStateSnapshot(store) {
  return store?.getStateRaw?.() || store?.getState?.() || {};
}
export function clampAudioVoicePanelWidth(current, entry = globalThis.window?.innerWidth) {
  const record = Number(current),
    payload = Number.isFinite(Number(entry))
      ? Math.max(320, Number(entry) - 24)
      : AUDIO_VOICE_PANEL_WIDTH_LIMITS.max,
    handle = Math.min(AUDIO_VOICE_PANEL_WIDTH_LIMITS.max, payload),
    state = Math.min(AUDIO_VOICE_PANEL_WIDTH_LIMITS.min, handle);
  return Math.max(state, Math.min(handle, record));
}
export function readStoredPanelWidth(config = globalThis.window) {
  const count = Number(config?.localStorage?.getItem?.(AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY));
  return Number.isFinite(count) && count > 0 ? count : null;
}
export function writeStoredPanelWidth(scope, input = globalThis.window) {
  try {
    input?.localStorage?.setItem?.(AUDIO_VOICE_PANEL_WIDTH_STORAGE_KEY, String(Math.round(scope)));
  } catch {}
}
export function dispatchWebPreviewPanelSync(reason) {
  const enabled = globalThis.window;
  if (!enabled || typeof enabled.dispatchEvent !== 'function') return;
  const detail = { reason: reason },
    output =
      typeof globalThis.CustomEvent === 'function'
        ? new globalThis.CustomEvent('web-preview:force-sync', { detail: detail })
        : { type: 'web-preview:force-sync', detail: detail };
  enabled.dispatchEvent(output);
}
export function formatTimecode(value2) {
  const value3 = Math.max(0, Math.round(Number(value2) || 0)),
    value4 = Math.floor(value3 / 60000),
    value5 = Math.floor((value3 % 60000) / 1000),
    value6 = value3 % 1000;
  return (
    String(value4).padStart(2, '0') +
    ':' +
    String(value5).padStart(2, '0') +
    ':' +
    String(value6).padStart(3, '0')
  );
}
export function formatAudioVoiceTimeRange(value7, value8) {
  const value9 = Math.max(0, Math.round(Number(value7) || 0)),
    value10 = Math.max(value9, Math.round(Number(value8) || 0)),
    value11 = ((value10 - value9) / 1000).toFixed(1);
  return formatTimecode(value9) + ' - ' + formatTimecode(value10) + ' （约 ' + value11 + ' 秒）';
}
export function resolveAudioVoicePanelCoverUrl(options3 = {}) {
  return resolveCanvasVideoPosterUrl(options3);
}
export function createDefaultAudioVoiceSegments() {
  return [
    {
      id: 'mock-segment-1',
      startMs: 80,
      endMs: 4270,
      sourceText: '马某人这个县长买来的，嗯，买官就是为了挣钱。',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
    {
      id: 'mock-segment-2',
      startMs: 5413,
      endMs: 10132,
      sourceText: '今天参加会议的人里面，就有一个人是怪物伪装的。',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
    {
      id: 'mock-segment-3',
      startMs: 10080,
      endMs: 11849,
      sourceText: '谁有钱就挣谁的。',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
    {
      id: 'mock-segment-4',
      startMs: 12060,
      endMs: 15380,
      sourceText: '那你想挣谁的钱呢？',
      targetText: '',
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      imitateToneEnabled: false,
      status: 'detected',
    },
  ].map((args) => ({ ...args }));
}
export function isAudioVoicePanelWorkflowItem(options4 = {}) {
  const value12 = String(options4?.group || '').trim(),
    value13 = String(options4?.provider || '').trim(),
    value14 = String(options4?.adapterType || '').trim();
  return (
    AUDIO_VOICE_PANEL_MODEL_MENU_GROUPS.has(value12) &&
    value13 === 'runninghubwf' &&
    value14 === 'workflow'
  );
}
export function getAudioVoicePanelWorkflowItems() {
  return buildAudioWorkflowItems().filter(isAudioVoicePanelWorkflowItem);
}
export function toAudioVoicePanelModelOption(icon = {}) {
  const id = String(icon.id || icon.key || icon.modelId || '').trim();
  return {
    id: id,
    label: translateManifestText(icon.label),
    subtitle: translateManifestText(icon.subtitle || ''),
    icon: icon.icon || 'images/RH.png',
    iconAlt: icon.iconAlt || 'runninghub',
    provider: icon.provider || '',
    adapterType: icon.adapterType || '',
    executionId: icon.executionId || '',
    async: icon.async === true,
    cancellable: icon.cancellable === true,
    vip: icon.vip === true,
  };
}
export function getAudioVoicePanelModelOptions() {
  return getAudioVoicePanelWorkflowItems().map(toAudioVoicePanelModelOption);
}
export function getAudioVoicePanelModelGroups() {
  const list = getAudioVoicePanelWorkflowItems(),
    map = new Map(
      list.map(toAudioVoicePanelModelOption)
        .filter((value15) => value15.id)
        .map((value16) => [value16.id, value16]),
    );
  return buildAudioWorkflowMenuGroups(list)
    .map((icon2) => ({
      id: String(icon2.id || '').trim(),
      label: translateManifestText(icon2.label || icon2.id || ''),
      subtitle: translateManifestText(icon2.subtitle || ''),
      icon: icon2.icon || 'images/RH.png',
      iconAlt: icon2.iconAlt || icon2.id || 'runninghub',
      items: (Array.isArray(icon2.items) ? icon2.items : [])
        .map((value17) => map.get(String(value17?.modelId || '').trim()))
        .filter(Boolean),
    }))
    .filter((value18) => value18.items.length > 0);
}
export function getAudioVoiceWorkflowAudioSlots(value19 = '') {
  return getAudioWorkflowSlots(value19).map((args2) => ({
    ...args2,
    label: translateManifestText(args2.label || args2.slot || ''),
  }));
}
export function doesAudioVoiceWorkflowSupportToneClone(value20 = '') {
  return doesAudioWorkflowSupportMultipleAudioInputs(value20);
}
export function normalizeAudioVoicePanelWidth(value21, value22) {
  return clampAudioVoicePanelWidth(value21, value22);
}
export function resolveAudioVoiceSourceLocalPath(options5 = {}) {
  return isAudioVoiceAudioNode(options5)
    ? resolveCanvasAudioLocalPath(options5)
    : resolveCanvasVideoLocalPath(options5);
}
export function resolveAudioVoiceSourceUrl(options6 = {}) {
  return isAudioVoiceAudioNode(options6)
    ? resolveCanvasAudioUrl(options6)
    : localPathToUrl(resolveCanvasVideoLocalPath(options6));
}
export function normalizeAudioVoicePromptForBackend(value23, value24) {
  const value25 = String(value24 || '').trim();
  if (value23 !== RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID) return value25;
  return value25.replace(/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    .replace(/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]: ')
    .replace(/\s+(\[speaker_[12]\]:)/g, '\n$1')
    .trim();
}
export function resolveAudioVoiceSegmentAudioInput(options7 = {}, value26 = 1) {
  const count2 = Number(value26) === 2 ? 2 : 1;
  if (count2 === 2)
    return {
      nodeId: String(options7.voiceRefNodeId || ''),
      localPath: normalizeLocalPath(options7.voiceRefAudioLocalPath || ''),
      audioUrl: resolveSegmentLocalAudioUrl(options7.voiceRefAudioUrl, options7.voiceRefAudioLocalPath),
      name: String(options7.voiceRefName || ''),
      imageUrl: String(options7.voiceRefImageUrl || ''),
    };
  return {
    nodeId: String(options7.id || ''),
    localPath: normalizeLocalPath(options7.sourceAudioLocalPath || ''),
    audioUrl: resolveSegmentLocalAudioUrl(options7.sourceAudioUrl, options7.sourceAudioLocalPath),
    name: String(options7.sourceAudioName || ''),
  };
}
export function createAudioVoiceWorkflowAudioRef(sourceId = {}, refSlot = '') {
  const url = sourceId?.audioUrl;
  if (!url) return null;
  return { refSlot: refSlot, url: url, sourceId: sourceId.nodeId, sourceType: 'source-audio' };
}
export function isAudioVoiceImitateToneWorkflow(value27 = '') {
  return AUDIO_VOICE_IMITATE_TONE_WORKFLOW_IDS.has(String(value27 || '').trim());
}
export function getAudioVoicePrimaryAudioSlot(value28 = '') {
  return value28 === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID ? 'audio1' : 'audioRef';
}
export function buildAudioVoiceWorkflowAudioRefs(options8 = {}, value29 = '', value30 = []) {
  const audioVoiceSegmentAudioInput = resolveAudioVoiceSegmentAudioInput(options8, 1),
    audioVoiceSegmentAudioInput2 = resolveAudioVoiceSegmentAudioInput(options8, 2);
  if (isAudioVoiceImitateToneWorkflow(value29)) {
    const audioVoicePrimaryAudioSlot = getAudioVoicePrimaryAudioSlot(value29),
      list2 = [];
    if (audioVoiceSegmentAudioInput2.audioUrl) {
      list2.push(
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput2, audioVoicePrimaryAudioSlot),
      );
      if (options8.imitateToneEnabled === true) {
        if (!audioVoiceSegmentAudioInput.audioUrl)
          throw createAudioVoicePayloadError('missingSourceAudio');
        list2.push(createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput, 'audio2'));
      }
    } else
      list2.push(
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput, audioVoicePrimaryAudioSlot),
      );
    return normalizeAudioWorkflowRefSlots(list2.filter(Boolean), value29);
  }
  if (value29 === RH_AUDIO_VOICE_CONVERT_MODEL_ID)
    return normalizeAudioWorkflowRefSlots(
      [
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput2, value30[0]?.slot || ''),
        createAudioVoiceWorkflowAudioRef(audioVoiceSegmentAudioInput, value30[1]?.slot || ''),
      ].filter(Boolean),
      value29,
    );
  return normalizeAudioWorkflowRefSlots(
    [audioVoiceSegmentAudioInput, audioVoiceSegmentAudioInput2]
      .map((value31, value32) =>
        createAudioVoiceWorkflowAudioRef(value31, value30[value32]?.slot || ''),
      )
      .filter(Boolean),
    value29,
  );
}
