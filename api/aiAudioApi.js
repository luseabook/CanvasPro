import { ensureConfig, getProviderConfig } from './configApi.js';
import { processInputAudiosPreserveOrder } from './audioUploadApi.js';
import { cancelRunningHubTask } from './runninghubTaskApi.js';
import { requester } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import { formatRunningHubFailureMessage } from './errors/parsers/RunningHubErrorParser.js';
import {
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_SEPARATION_MODEL_ID,
  resolveModelExecution,
} from '../src/manifests/index.js';
const POLL_MAX_COUNT = 0x1c2,
  POLL_INTERVAL_MS = 0x7d0;
export async function cancelRunningHubAudioTask({ apiKey: _0x4e4a8, taskId: _0x29c0d0 } = {}) {
  return cancelRunningHubTask({ apiKey: _0x4e4a8, taskId: _0x29c0d0 });
}
function getAudioSeparationExecutionManifest() {
  const _0x407af7 = resolveModelExecution(RH_AUDIO_SEPARATION_MODEL_ID)?.executionManifest;
  if (!_0x407af7)
    throw new Error('RunningHub audio workflow manifest missing: ' + RH_AUDIO_SEPARATION_MODEL_ID);
  return _0x407af7;
}
function getAudioSeparationResultNodeIds() {
  const _0x5ed035 = getAudioSeparationExecutionManifest()?.mapping?.resultNodes || {},
    _0x5d81c9 = String(_0x5ed035.vocals || '').trim(),
    _0x22d5fb = String(_0x5ed035.background || '').trim();
  if (!_0x5d81c9 || !_0x22d5fb)
    throw new Error(
      'RunningHub audio workflow manifest missing result nodes: ' + RH_AUDIO_SEPARATION_MODEL_ID,
    );
  return { vocals: _0x5d81c9, background: _0x22d5fb };
}
function sleep(_0x504a62) {
  return new Promise((_0x52d7f4) => setTimeout(_0x52d7f4, _0x504a62));
}
function normalizeRhInstanceType(_0x580c21) {
  return String(_0x580c21 || 'default').trim() === 'plus' ? 'plus' : 'default';
}
function normalizeTextList(_0x183f9e) {
  if (!Array.isArray(_0x183f9e)) return [];
  return _0x183f9e.map((_0x37ff6d) => String(_0x37ff6d || '').trim()).filter(Boolean);
}
function normalizeRefList(_0x11de72) {
  if (!Array.isArray(_0x11de72)) return [];
  return _0x11de72
    .map((_0x3c8027) => {
      if (!_0x3c8027 || typeof _0x3c8027 !== 'object') return null;
      const _0x3128ff = String(_0x3c8027.url || '').trim();
      if (!_0x3128ff) return null;
      return {
        edgeId: _0x3c8027.edgeId ? String(_0x3c8027.edgeId) : '',
        sourceId: _0x3c8027.sourceId ? String(_0x3c8027.sourceId) : '',
        sourceType: _0x3c8027.sourceType ? String(_0x3c8027.sourceType) : '',
        refSlot: _0x3c8027.refSlot ? String(_0x3c8027.refSlot) : '',
        url: _0x3128ff,
      };
    })
    .filter(Boolean);
}
function parseResponseData(_0x378325) {
  if (!_0x378325) return {};
  if (typeof _0x378325 === 'object') return _0x378325;
  const _0x41d56a = String(_0x378325 || '').trim();
  if (!_0x41d56a) return {};
  try {
    return JSON.parse(_0x41d56a);
  } catch {}
  const _0x350e25 = _0x41d56a.split('\n').filter((_0x67588a) => _0x67588a.trim().startsWith('data:'));
  if (_0x350e25.length > 0) {
    const _0x3fcef2 = _0x350e25[_0x350e25.length - 1].replace(/^data:\s*/, '');
    try {
      return JSON.parse(_0x3fcef2);
    } catch {}
  }
  throw new Error('无法解析 RunningHub 音频接口响应');
}
function getTaskId(_0x29bf6f) {
  return String(
    _0x29bf6f?.taskId ||
      _0x29bf6f?.task_id ||
      _0x29bf6f?.data?.taskId ||
      _0x29bf6f?.data?.task_id ||
      _0x29bf6f?.data?.id ||
      _0x29bf6f?.id ||
      '',
  ).trim();
}
function getApiErrorMessage(_0x118ae2, _0x55a993 = '音频生成失败') {
  return formatRunningHubFailureMessage(
    _0x118ae2,
    _0x118ae2?.message ||
      _0x118ae2?.error ||
      _0x118ae2?.msg ||
      _0x118ae2?.data?.message ||
      _0x118ae2?.data?.error ||
      _0x55a993,
  );
}
function isLikelyAudioUrl(_0x14cf9f) {
  const _0x4efd8b = String(_0x14cf9f || '').trim();
  if (!_0x4efd8b) return false;
  if (!/^https?:\/\//i.test(_0x4efd8b) && !_0x4efd8b.startsWith('/')) return false;
  return /\.(wav|mp3|m4a|flac|aac|ogg|opus|wma|amr|aif|aiff|caf|webm)(\?|#|$)/i.test(_0x4efd8b);
}
function extractAudioResultEntries(_0x13b9b1) {
  const _0x4d75c3 = [],
    _0x229fbb = new WeakSet(),
    _0x1ad9d6 = ['audioUrl', 'audio_url', 'url', 'fileUrl', 'download_url', 'output', 'mediaUrl'],
    _0x393dd3 = (_0xa633c4, _0x725d88 = '') => {
      if (_0xa633c4 == null) return;
      if (Array.isArray(_0xa633c4)) {
        _0xa633c4.forEach((_0x1cd383) => _0x393dd3(_0x1cd383, _0x725d88));
        return;
      }
      if (typeof _0xa633c4 === 'object') {
        _0x589ac9(_0xa633c4, _0x725d88);
        return;
      }
      const _0x1d76db = String(_0xa633c4 || '').trim();
      if (!_0x1d76db) return;
      _0x4d75c3.push({ nodeId: String(_0x725d88 || '').trim(), audioUrl: _0x1d76db });
    },
    _0x589ac9 = (_0x4fa69e, _0x5d7bdf = '') => {
      if (_0x4fa69e == null) return;
      if (Array.isArray(_0x4fa69e)) {
        _0x4fa69e.forEach((_0xead00d) => _0x589ac9(_0xead00d, _0x5d7bdf));
        return;
      }
      if (typeof _0x4fa69e !== 'object') return;
      if (_0x229fbb.has(_0x4fa69e)) return;
      _0x229fbb.add(_0x4fa69e);
      const _0x46d560 = String(_0x4fa69e.nodeId || _0x4fa69e.node_id || _0x5d7bdf || '').trim();
      (_0x1ad9d6.forEach((_0x4b0aa6) => {
        Object.prototype.hasOwnProperty.call(_0x4fa69e, _0x4b0aa6) &&
          _0x393dd3(_0x4fa69e[_0x4b0aa6], _0x46d560);
      }),
        Object.entries(_0x4fa69e).forEach(([_0x4f255a, _0x53bba6]) => {
          if (_0x4f255a === 'nodeId' || _0x4f255a === 'node_id' || _0x1ad9d6.includes(_0x4f255a)) return;
          _0x53bba6 && typeof _0x53bba6 === 'object' && _0x589ac9(_0x53bba6, _0x46d560);
        }));
    };
  _0x589ac9(_0x13b9b1);
  const _0x4e15ef = [],
    _0x4d9d23 = new Set();
  for (const _0xe9b5c9 of _0x4d75c3) {
    const _0x45f091 = String(_0xe9b5c9?.nodeId || '').trim(),
      _0xb40655 = String(_0xe9b5c9?.audioUrl || '').trim();
    if (!_0xb40655) continue;
    const _0x1ab367 = _0x45f091 + '::' + _0xb40655;
    if (_0x4d9d23.has(_0x1ab367)) continue;
    (_0x4d9d23.add(_0x1ab367), _0x4e15ef.push({ nodeId: _0x45f091, audioUrl: _0xb40655 }));
  }
  const _0x2d899d = _0x4e15ef.filter((_0x1baf3b) => isLikelyAudioUrl(_0x1baf3b.audioUrl));
  return _0x2d899d.length ? _0x2d899d : _0x4e15ef;
}
function extractAudioUrls(_0x44602e) {
  return extractAudioResultEntries(_0x44602e).map((_0x4f7191) => _0x4f7191.audioUrl);
}
function normalizeAudioTaskResult(_0xfdcd7b, _0x47885a, _0x2017b3 = 1) {
  const _0x482bd8 = Array.isArray(_0xfdcd7b)
    ? _0xfdcd7b.map((_0x3675cf) => String(_0x3675cf || '').trim()).filter(Boolean)
    : [];
  if (_0x482bd8.length < Math.max(1, Number(_0x2017b3) || 1))
    throw new Error(String(_0x47885a || '任务已完成，但未提取到音频地址'));
  return {
    audioUrl: _0x482bd8[0],
    isBatch: _0x482bd8.length > 1,
    audios: _0x482bd8.map((_0x524c56) => ({ audioUrl: _0x524c56 })),
  };
}
function normalizeAudioSeparationTaskResult(_0xf343e4, _0x2fdb55) {
  const _0x29d962 = getAudioSeparationResultNodeIds(),
    _0x39f83b = Array.isArray(_0xf343e4)
      ? _0xf343e4
          .map((_0xf60cea) => ({
            nodeId: String(_0xf60cea?.nodeId || '').trim(),
            audioUrl: String(_0xf60cea?.audioUrl || '').trim(),
          }))
          .filter((_0x242152) => !!_0x242152.audioUrl)
      : [],
    _0x4dbe33 = _0x39f83b.some(
      (_0x5d45c6) => _0x5d45c6.nodeId === _0x29d962.vocals || _0x5d45c6.nodeId === _0x29d962.background,
    );
  let _0x42b919 = _0x39f83b;
  if (_0x4dbe33) {
    const _0x1d3b5f = _0x39f83b.find((_0x5ae34d) => _0x5ae34d.nodeId === _0x29d962.vocals) || null,
      _0x36bb9c = _0x39f83b.find((_0x576b3e) => _0x576b3e.nodeId === _0x29d962.background) || null;
    if (!_0x1d3b5f || !_0x36bb9c)
      throw new Error(String(_0x2fdb55 || '任务已完成，但未提取到人声和背景声音频地址'));
    _0x42b919 = [
      { ..._0x1d3b5f, role: 'vocals' },
      { ..._0x36bb9c, role: 'background' },
    ];
  } else
    _0x42b919 = _0x39f83b
      .slice(0, 2)
      .map((_0xa6fcbe, _0x391ebd) => ({ ..._0xa6fcbe, role: _0x391ebd === 0 ? 'vocals' : 'background' }));
  if (_0x42b919.length < 2)
    throw new Error(String(_0x2fdb55 || '任务已完成，但未提取到人声和背景声音频地址'));
  return {
    audioUrl: _0x42b919[0].audioUrl,
    isBatch: true,
    vocalsAudioUrl: _0x42b919[0].audioUrl,
    backgroundAudioUrl: _0x42b919[1].audioUrl,
    audios: _0x42b919.map((_0x3c17ae) => ({
      audioUrl: _0x3c17ae.audioUrl,
      nodeId: _0x3c17ae.nodeId,
      role: _0x3c17ae.role,
    })),
  };
}
function normalizeAdvancedVoiceClonePrompt(_0x29c578) {
  return String(_0x29c578 || '')
    .trim()
    .replace(/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    .replace(/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]: ')
    .replace(/\s+(\[speaker_[12]\]:)/g, '\n$1')
    .trim();
}
function getMappingNode(_0x49e249, _0x4cb819, _0x58fd1b) {
  const _0x248958 = _0x49e249?.[_0x4cb819],
    _0x25c562 = String(_0x248958?.nodeId || '').trim(),
    _0x4eb22e = String(_0x248958?.fieldName || '').trim();
  if (!_0x25c562 || !_0x4eb22e) throw new Error('音频工作流 manifest 缺少 ' + _0x58fd1b + ' 节点映射');
  return { nodeId: _0x25c562, fieldName: _0x4eb22e };
}
function createNodeInfo(_0xea8a48, _0x577673, _0x14cb06 = '') {
  return {
    nodeId: _0xea8a48.nodeId,
    fieldName: _0xea8a48.fieldName,
    fieldValue: _0x577673,
    ...(_0x14cb06 ? { description: _0x14cb06 } : {}),
  };
}
const KNOWN_AUDIO_REF_SLOTS = new Set([
  'audioRef',
  'audioTarget',
  'audio1',
  'audio2',
  'audio',
  'sourceAudio',
  'referenceAudio',
]);
function normalizeAudioItemsBySlotOrder(
  _0x2c1210 = [],
  _0x5bf4bd = [],
  { remapKnownForeignSlots: remapKnownForeignSlots = true } = {},
) {
  const _0x12a407 = (Array.isArray(_0x5bf4bd) ? _0x5bf4bd : [])
    .map((_0x4c59d2) => String(_0x4c59d2 || '').trim())
    .filter(Boolean);
  if (_0x12a407.length === 0) return _0x2c1210;
  const _0x3d9c5f = new Set();
  return (Array.isArray(_0x2c1210) ? _0x2c1210 : []).map((_0x5935d8) => {
    const _0x58a5a9 = String(_0x5935d8?.refSlot || '').trim();
    if (_0x58a5a9 && _0x12a407.includes(_0x58a5a9) && !_0x3d9c5f.has(_0x58a5a9))
      return (_0x3d9c5f.add(_0x58a5a9), { ..._0x5935d8, refSlot: _0x58a5a9 });
    if (_0x58a5a9 && remapKnownForeignSlots !== true && KNOWN_AUDIO_REF_SLOTS.has(_0x58a5a9))
      return { ..._0x5935d8, refSlot: _0x58a5a9 };
    const _0x1f3898 = _0x12a407.find((_0x12131c) => !_0x3d9c5f.has(_0x12131c)) || '';
    if (!_0x1f3898) return { ..._0x5935d8, refSlot: _0x12a407.includes(_0x58a5a9) ? _0x58a5a9 : '' };
    return (_0x3d9c5f.add(_0x1f3898), { ..._0x5935d8, refSlot: _0x1f3898 });
  });
}
function buildNodeInfoList(_0x12adfa, _0x42c770, _0x5669f9) {
  const _0x10f4de = _0x12adfa?.mapping || {},
    _0x4f05b7 = String(_0x10f4de?.preset || '').trim();
  if (_0x4f05b7 === 'rh-audio-indextts2-clone') {
    const _0x1abac8 = normalizeAudioItemsBySlotOrder(_0x42c770, ['audioRef', 'audio2'], {
        remapKnownForeignSlots: false,
      }),
      _0x334389 = new Map(_0x1abac8.map((_0x2b90f9) => [String(_0x2b90f9.refSlot || ''), _0x2b90f9])),
      _0x716e7c = _0x334389.get('audioRef') || null,
      _0x5c8243 = _0x334389.get('audio2') || null;
    if (!_0x716e7c?.url) throw new Error('indextts2音色克隆需要参考音色');
    const _0xaf5686 = !!_0x5c8243?.url;
    if (!_0xaf5686 && !_0x5669f9) throw new Error('indextts2音色克隆需要提示词内容');
    const _0x1ffe3c = getMappingNode(_0x10f4de, 'refAudioNode', '参考音色'),
      _0x1e239e = getMappingNode(_0x10f4de, 'audio2Node', '音频2'),
      _0x13d534 = getMappingNode(_0x10f4de, 'promptNode', '提示词'),
      _0x59a36a = getMappingNode(_0x10f4de, 'indexNode', '模型选择'),
      _0x576c68 = [createNodeInfo(_0x1ffe3c, _0x716e7c.url, '克隆声音')];
    _0xaf5686 && _0x576c68.push(createNodeInfo(_0x1e239e, _0x5c8243.url, '音频2'));
    const _0x100fd4 = _0xaf5686 ? (_0x5669f9 ? '1' : '2') : '0';
    return (
      _0x576c68.push(
        createNodeInfo(_0x13d534, _0x5669f9, '提示词'),
        createNodeInfo(_0x59a36a, _0x100fd4, '模型选择'),
      ),
      _0x576c68
    );
  }
  if (_0x4f05b7 === 'rh-audio-voice-convert') {
    const _0xcdd05d = normalizeAudioItemsBySlotOrder(_0x42c770, ['audioRef', 'audioTarget']),
      _0x59fa28 = new Map(_0xcdd05d.map((_0x2277c5) => [String(_0x2277c5.refSlot || ''), _0x2277c5])),
      _0x4c1f15 = _0x59fa28.get('audioRef') || null,
      _0x4c3839 = _0x59fa28.get('audioTarget') || null;
    if (!_0x4c1f15?.url || !_0x4c3839?.url) throw new Error('音色转换需要参考音色和目标音色');
    const _0x42b9a6 = getMappingNode(_0x10f4de, 'refAudioNode', '参考音色'),
      _0x430009 = getMappingNode(_0x10f4de, 'targetAudioNode', '目标音色');
    return [createNodeInfo(_0x42b9a6, _0x4c1f15.url), createNodeInfo(_0x430009, _0x4c3839.url)];
  }
  if (_0x4f05b7 === 'rh-audio-advanced-voice-clone') {
    const _0x512de4 = normalizeAudioItemsBySlotOrder(_0x42c770, ['audio1', 'audio2']),
      _0x4994ff = new Map(_0x512de4.map((_0x3be5a5) => [String(_0x3be5a5.refSlot || ''), _0x3be5a5])),
      _0x27ed06 = _0x4994ff.get('audio1') || null,
      _0x38f90a = _0x4994ff.get('audio2') || null;
    if (!_0x5669f9) throw new Error('进阶声音克隆需要提示词内容');
    const _0x28a70c = getMappingNode(_0x10f4de, 'audio1Node', '音频1'),
      _0x39e43b = getMappingNode(_0x10f4de, 'audio2Node', '音频2'),
      _0xa570a5 = getMappingNode(_0x10f4de, 'promptNode', '提示词'),
      _0x3ab396 = getMappingNode(_0x10f4de, 'indexNode', '音频数量'),
      _0x31666c = [];
    return (
      _0x27ed06?.url && _0x31666c.push(createNodeInfo(_0x28a70c, _0x27ed06.url, 'audio')),
      _0x38f90a?.url && _0x31666c.push(createNodeInfo(_0x39e43b, _0x38f90a.url, 'audio')),
      _0x31666c.push(
        createNodeInfo(_0xa570a5, normalizeAdvancedVoiceClonePrompt(_0x5669f9), 'prompt'),
        createNodeInfo(_0x3ab396, String([_0x27ed06?.url, _0x38f90a?.url].filter(Boolean).length), 'index'),
      ),
      _0x31666c
    );
  }
  throw new Error('未选择可用的音频工作流');
}
export async function buildGenerateAudioRequest(_0x14bbb4) {
  await ensureConfig();
  const _0x30a418 = String(_0x14bbb4?.provider || 'runninghubwf').trim(),
    _0x3fcc7b = String(_0x14bbb4?.audioWorkflowKey || '').trim(),
    _0x4c7645 = resolveModelExecution(_0x3fcc7b),
    _0x41ebe = String(_0x4c7645?.executionManifest?.appId || '').trim();
  if (!_0x4c7645 || !_0x41ebe) throw new Error('未选择可用的音频工作流');
  const _0x2c8431 = getProviderConfig('runninghubwf'),
    _0x40e45f = String(_0x14bbb4?.apiKey || _0x2c8431?.apiKey || '').trim();
  if (!_0x40e45f) throw new Error('RunningHub API Key 未配置');
  const _0x4c4b7a = normalizeTextList(_0x14bbb4?.textInputs),
    _0x21d6d2 = String(_0x14bbb4?.prompt || '').trim(),
    _0x1cdc9a = _0x21d6d2 || _0x4c4b7a.join('\n').trim(),
    _0x447b4d = normalizeRhInstanceType(_0x14bbb4?.rhInstanceType),
    _0x36724a = normalizeRefList(_0x14bbb4?.audioRefs),
    _0xc56832 = normalizeRefList(_0x14bbb4?.videoRefs),
    _0x444b59 = await processInputAudiosPreserveOrder(
      _0x36724a.map((_0x642d22) => _0x642d22.url),
      _0x40e45f,
    ),
    _0x3a1078 = _0x36724a
      .map((_0x3336f9, _0x5c9a06) => ({ ..._0x3336f9, url: String(_0x444b59[_0x5c9a06] || '').trim() }))
      .filter((_0x5e5ec1) => !!_0x5e5ec1.url),
    _0x200040 = buildNodeInfoList(_0x4c7645.executionManifest, _0x3a1078, _0x1cdc9a),
    _0x198f8b = String(_0x14bbb4?.installId || '').trim();
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json', ...(_0x198f8b ? { 'X-AIC-Install-Id': _0x198f8b } : {}) },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + _0x41ebe,
      apiKey: _0x40e45f,
      nodeInfoList: _0x200040,
      instanceType: _0x447b4d,
      usePersonalQueue: 'false',
    },
    meta: {
      provider: _0x30a418,
      audioWorkflowKey: _0x3fcc7b,
      audioWorkflowLabel: String(_0x14bbb4?.audioWorkflowLabel || '').trim(),
      model:
        _0x3fcc7b === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID ? _0x4c7645.modelManifest.modelId : _0x3fcc7b,
      executionId: _0x4c7645.executionManifest.id,
      nodeId: String(_0x14bbb4?.nodeId || '').trim(),
      installId: _0x198f8b,
      rhInstanceType: _0x447b4d,
      prompt: _0x1cdc9a,
      textInputs: _0x4c4b7a,
      audioRefs: _0x36724a,
      videoRefs: _0xc56832,
    },
  };
}
export async function buildAudioSeparationRequest(_0x2e4de4 = {}) {
  await ensureConfig();
  const _0x452724 = RH_AUDIO_SEPARATION_MODEL_ID,
    _0x1e2b7f = getAudioSeparationExecutionManifest(),
    _0x58b007 = String(_0x1e2b7f?.appId || '').trim(),
    _0x3f2e9f = _0x1e2b7f?.mapping?.sourceAudioNode;
  if (!_0x58b007 || !_0x3f2e9f?.nodeId || !_0x3f2e9f?.fieldName)
    throw new Error('RunningHub audio workflow manifest missing: ' + _0x452724);
  const _0x2541bc = getProviderConfig('runninghubwf'),
    _0x4383b4 = String(_0x2e4de4?.apiKey || _0x2541bc?.apiKey || '').trim();
  if (!_0x4383b4) throw new Error('RunningHub API Key 未配置');
  const _0x436e7c = String(_0x2e4de4?.audioUrl || _0x2e4de4?.src || _0x2e4de4?.url || '').trim();
  if (!_0x436e7c) throw new Error('人声分离需要可用音频');
  const _0x3b1edd = await processInputAudiosPreserveOrder([_0x436e7c], _0x4383b4),
    _0x4064ba = String(_0x3b1edd?.[0] || '').trim();
  if (!_0x4064ba) throw new Error('人声分离音频上传失败');
  const _0x1ec5fa = normalizeRhInstanceType(_0x2e4de4?.rhInstanceType);
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + _0x58b007,
      apiKey: _0x4383b4,
      nodeInfoList: [
        {
          nodeId: _0x3f2e9f.nodeId,
          fieldName: _0x3f2e9f.fieldName,
          fieldValue: _0x4064ba,
          description: 'audio',
        },
      ],
      instanceType: _0x1ec5fa,
      usePersonalQueue: 'false',
    },
    meta: {
      provider: 'runninghubwf',
      model: _0x452724,
      executionId: _0x1e2b7f.id,
      adapterTrace: { source: 'manifest', executionId: _0x1e2b7f.id, modelId: _0x452724 },
      nodeId: String(_0x2e4de4?.nodeId || '').trim(),
      rhInstanceType: _0x1ec5fa,
      sourceAudioUrl: _0x436e7c,
      uploadedAudioUrl: _0x4064ba,
    },
  };
}
async function pollRunningHubAudioTask(_0x452e4c, _0x577923, _0x9c14a = {}) {
  if (_0x9c14a?.signal?.aborted) throw new Error('CANCELLED');
  for (let _0x9bd1bb = 0; _0x9bd1bb < POLL_MAX_COUNT; _0x9bd1bb++) {
    if (_0x9c14a?.signal?.aborted) throw new Error('CANCELLED');
    await sleep(POLL_INTERVAL_MS);
    if (_0x9c14a?.signal?.aborted) throw new Error('CANCELLED');
    const _0x42d7ae = await requester({
        url: '/api/v2/proxy/image',
        method: 'POST',
        provider: 'runninghubwf',
        timeout: 0x7530,
        signal: _0x9c14a?.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: 'https://www.runninghub.cn/openapi/v2/query',
          apiKey: _0x577923,
          taskId: _0x452e4c,
        }),
        responseType: 'auto',
      }),
      _0x2cb144 = parseResponseData(_0x42d7ae),
      _0x399ed8 = Number(_0x2cb144?.code);
    if (Number.isFinite(_0x399ed8)) {
      if (_0x399ed8 === 0x324 || _0x399ed8 === 0x32d) continue;
      if (_0x399ed8 !== 0) throw new Error(getApiErrorMessage(_0x2cb144, '音频任务轮询失败'));
    }
    const _0xf5a869 = _0x2cb144?.data && typeof _0x2cb144.data === 'object' ? _0x2cb144.data : _0x2cb144,
      _0x23ee3a = String(_0xf5a869?.status || '').toUpperCase();
    if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(_0x23ee3a)) {
      if (extractAudioUrls(_0xf5a869).length === 0) continue;
      return _0xf5a869;
    }
    if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED'].includes(_0x23ee3a))
      throw new Error(getApiErrorMessage(_0xf5a869, '音频任务执行失败'));
  }
  throw new Error('音频任务超时，请稍后重试');
}
export async function resumeAudioSeparationTask(_0x2b3d51, _0x4c33e2 = {}, _0x25e9c1 = {}) {
  await ensureConfig();
  const _0x37644d = getProviderConfig('runninghubwf'),
    _0x2a3cc8 = String(_0x4c33e2?.apiKey || _0x37644d?.apiKey || '').trim();
  if (!_0x2a3cc8) throw new Error('RunningHub API Key 未配置');
  const _0x229e34 = String(_0x2b3d51 || '').trim();
  if (!_0x229e34) throw new Error('缺少 RunningHub 音频任务ID');
  return runTaskSingleFlight(
    { provider: 'runninghubwf', kind: 'audio-separation', taskId: _0x229e34 },
    async () => {
      const _0x3226fd = await pollRunningHubAudioTask(_0x229e34, _0x2a3cc8, _0x25e9c1);
      return {
        taskId: _0x229e34,
        ...normalizeAudioSeparationTaskResult(
          extractAudioResultEntries(_0x3226fd),
          '任务已完成，但未提取到人声和背景声音频地址',
        ),
      };
    },
  );
}
export async function resumeRunningHubAudioTask(_0x3abb5f, _0x302d0a = {}, _0x4c3073 = {}) {
  await ensureConfig();
  const _0x2ba033 = getProviderConfig('runninghubwf'),
    _0x13a7b1 = String(_0x302d0a?.apiKey || _0x2ba033?.apiKey || '').trim();
  if (!_0x13a7b1) throw new Error('RunningHub API Key 未配置');
  const _0x41c34b = String(_0x3abb5f || '').trim();
  if (!_0x41c34b) throw new Error('缺少 RunningHub 音频任务ID');
  return runTaskSingleFlight({ provider: 'runninghubwf', kind: 'audio', taskId: _0x41c34b }, async () => {
    const _0x1e399b = await pollRunningHubAudioTask(_0x41c34b, _0x13a7b1, _0x4c3073);
    return {
      taskId: _0x41c34b,
      ...normalizeAudioTaskResult(extractAudioUrls(_0x1e399b), '任务已完成，但未提取到音频地址'),
    };
  });
}
export async function runAudioSeparation(_0x540d24 = {}, _0x3f49d9 = {}) {
  const _0x2e926d = await buildAudioSeparationRequest(_0x540d24),
    _0x39f00c = await requester({
      url: _0x2e926d.url,
      method: 'POST',
      provider: 'runninghubwf',
      timeout: 0x1d4c0,
      signal: _0x3f49d9?.signal,
      headers: _0x2e926d.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(_0x2e926d.body),
      responseType: 'auto',
    }),
    _0x134f0a = parseResponseData(_0x39f00c),
    _0xa1f44d = Number(_0x134f0a?.code);
  if (Number.isFinite(_0xa1f44d) && _0xa1f44d !== 0)
    throw new Error(getApiErrorMessage(_0x134f0a, '音频任务创建失败'));
  const _0x42e4bd = getTaskId(_0x134f0a);
  if (!_0x42e4bd)
    return normalizeAudioSeparationTaskResult(
      extractAudioResultEntries(_0x134f0a),
      '音频任务创建成功但未返回人声和背景声音频地址',
    );
  (_0x3f49d9?.onTaskMeta?.({
    taskId: String(_0x42e4bd),
    useOpenapiQuery: true,
    apiKey: String(_0x2e926d?.body?.apiKey || '').trim(),
  }),
    _0x3f49d9?.onTaskId?.(String(_0x42e4bd)));
  const _0x3833fe = await pollRunningHubAudioTask(_0x42e4bd, _0x2e926d.body.apiKey, _0x3f49d9);
  return {
    taskId: _0x42e4bd,
    ...normalizeAudioSeparationTaskResult(
      extractAudioResultEntries(_0x3833fe),
      '任务已完成，但未提取到人声和背景声音频地址',
    ),
  };
}
export async function generateAudio(_0x2d5cfb, _0x493ed0 = {}) {
  const _0x58fa7f = await buildGenerateAudioRequest(_0x2d5cfb),
    _0x587fb2 = await requester({
      url: _0x58fa7f.url,
      method: 'POST',
      provider: 'runninghubwf',
      timeout: 0x1d4c0,
      signal: _0x493ed0?.signal,
      headers: _0x58fa7f.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(_0x58fa7f.body),
      responseType: 'auto',
    }),
    _0x45efba = parseResponseData(_0x587fb2);
  if (String(_0x45efba?.code || '') === 'SUBSCRIPTION_REQUIRED') {
    const _0x2e199d = new Error(_0x45efba?.message || '该模型为 VIP，请先激活 CDKEY/订阅');
    ((_0x2e199d.code = 'SUBSCRIPTION_REQUIRED'),
      (_0x2e199d.contactText = _0x45efba?.contactText || ''),
      (_0x2e199d.contactUrl = _0x45efba?.contactUrl || ''),
      (_0x2e199d.requiredModelId = String(_0x45efba?.requiredModelId || '').trim()),
      (_0x2e199d.subscriptionStatus = String(_0x45efba?.subscriptionStatus || '').trim()),
      (_0x2e199d.reasonCode = String(_0x45efba?.reasonCode || '').trim()));
    throw _0x2e199d;
  }
  const _0x329c09 = Number(_0x45efba?.code);
  if (Number.isFinite(_0x329c09) && _0x329c09 !== 0)
    throw new Error(getApiErrorMessage(_0x45efba, '音频任务创建失败'));
  const _0x72738f = getTaskId(_0x45efba);
  if (!_0x72738f)
    return normalizeAudioTaskResult(extractAudioUrls(_0x45efba), '音频任务创建成功但未返回 taskId');
  (_0x493ed0?.onTaskMeta?.({
    taskId: String(_0x72738f),
    useOpenapiQuery: true,
    apiKey: String(_0x58fa7f?.body?.apiKey || '').trim(),
  }),
    _0x493ed0?.onTaskId?.(String(_0x72738f)));
  const _0x310f32 = await pollRunningHubAudioTask(_0x72738f, _0x58fa7f.body.apiKey, _0x493ed0);
  return {
    taskId: _0x72738f,
    ...normalizeAudioTaskResult(extractAudioUrls(_0x310f32), '任务已完成，但未提取到音频地址'),
  };
}
