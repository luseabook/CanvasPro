import { existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { configureFfmpegVideoEncoderRuntime, runFfmpegVideoTask } from './ffmpegVideoEncoderRuntime.js';
import { MediaTaskQueue } from './mediaTaskQueue.js';
import { registerLocalMediaTaskHandlers } from './mediaTasks/registerLocalMediaTaskHandlers.js';
import { registerSharedMediaTaskHandlers } from './mediaTasks/registerSharedMediaTaskHandlers.js';
import { runToolCapture } from './toolCapture.js';
import {
  VIDEO_PLAYBACK_PROXY_VERSION,
  buildVideoPlaybackProxyFfmpegArgs,
  createVideoPlaybackProxyWorkDeduper,
  getVideoPlaybackProxyFilename,
  needsBrowserVideoProxy,
  resolveVideoPlaybackProxyTimeoutMs,
} from './videoPlaybackProxy.js';
const ASSET_IMPORT_FFPROBE_TIMEOUT_MS = 30000,
  LONG_MEDIA_TASK_NOTIFICATION_MS = 20000,
  PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE = 'person-replacement-compose',
  VIDEO_PROXY_TRANSCODE_PRESET = 'veryfast',
  VIDEO_PROXY_TRANSCODE_CRF = '23';
function requireFunction(value, name) {
  if (typeof value !== 'function') throw new TypeError(name + ' must be a function');
  return value;
}
function parseFfprobeRatio(value) {
  const text = String(value || '')['trim']();
  if (!text) return 0;
  if (!text['includes']('/')) return Number(text) || 0;
  const [numerator, denominator] = text['split']('/'),
    divisor = Number(denominator);
  if (!divisor) return 0;
  return (Number(numerator) || 0) / divisor;
}
export function buildMediaTaskStatePatch(update = {}) {
  const status = String(update?.['status'] || ''),
    patch = {
      mediaTaskId: update?.['taskId'] || '',
      mediaTaskKind: update?.['kind'] || '',
      mediaTaskStatus: status,
      mediaTaskProgress: Number(update?.['progress'] || 0) || 0,
      mediaTaskError: update?.['error'] || '',
    };
  if (status === 'waiting' || status === 'processing')
    ((patch['isGenerating'] = true), (patch['jobStatus'] = 'running'));
  else {
    if (status === 'complete') ((patch['isGenerating'] = false), (patch['jobStatus'] = 'success'));
    else {
      if (status === 'failed')
        ((patch['isGenerating'] = false),
          (patch['jobStatus'] = 'error'),
          (patch['jobError'] = patch['mediaTaskError'] || 'Media task failed'));
      else status === 'cancelled' && ((patch['isGenerating'] = false), (patch['jobStatus'] = null));
    }
  }
  return patch;
}
function getMediaTaskDisplayName(kind) {
  const normalizedKind = String(kind || '')['trim'](),
    displayNames = {
      videoPoster: '视频处理',
      audioWaveform: '音频波形',
      videoFirstFrame: '视频封面',
      videoCut: '视频剪辑',
      videoReverse: '视频倒放',
      audioCut: '音频剪辑',
      videoAudioSeparate: '音频分离',
      videoCompose: '视频合成',
      videoAudioMux: '完整视频封装',
      audioCompose: '音频合并',
      audioVoiceCompose: '语音工作室合成',
      mediaClipExport: '剪辑导出',
    };
  return displayNames[normalizedKind] || '媒体任务';
}
function formatNotificationBody(message, fallback) {
  const text = String(message || fallback || '')
    ['replace'](/\s+/g, ' ')
    ['trim']();
  if (text['length'] <= 180) return text;
  return text['slice'](0, 177) + '...';
}
export function createMediaTaskRuntime({
  appRoot: appRoot,
  platform: platform,
  env: env = process['env'],
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  getAssetsDir: getAssetsDir,
  getOutputDir: getOutputDir,
  resolveLocalVirtualPath: resolveLocalVirtualPath,
  updateAssetRecord: updateAssetRecord,
  sendAssetUpdated: sendAssetUpdated,
  setTaskbarProgressSource: setTaskbarProgressSource,
  setPowerSaveBlocker: setPowerSaveBlocker,
  NotificationCtor: NotificationCtor,
  focusMainWindow: focusMainWindow,
  publishTaskUpdate: publishTaskUpdate,
  getDoubaoAsrConfig: getDoubaoAsrConfig,
  getBailianAsrConfig: getBailianAsrConfig,
  getPythonCertificateEnv: getPythonCertificateEnv,
  getFunasrModelRootDir: getFunasrModelRootDir,
  getUserDataRoot: getUserDataRoot,
  resolveFallbackPythonCommand: resolveFallbackPythonCommand,
  resolvePythonCommand: resolvePythonCommand,
  MediaTaskQueueCtor: MediaTaskQueueCtor = MediaTaskQueue,
  registerLocalHandlers: registerLocalHandlers = registerLocalMediaTaskHandlers,
  registerSharedHandlers: registerSharedHandlers = registerSharedMediaTaskHandlers,
  configureFfmpegRuntime: configureFfmpegRuntime = configureFfmpegVideoEncoderRuntime,
  runCapture: runCapture = runToolCapture,
  runFfmpegTask: runFfmpegTask = runFfmpegVideoTask,
} = {}) {
  const resolveRuntimeTool = requireFunction(getRuntimeToolOrFallback, 'getRuntimeToolOrFallback'),
    resolveAssetsDir = requireFunction(getAssetsDir, 'getAssetsDir'),
    resolveOutputDir = requireFunction(getOutputDir, 'getOutputDir'),
    resolveVirtualPath = requireFunction(resolveLocalVirtualPath, 'resolveLocalVirtualPath'),
    applyAssetRecordUpdate = requireFunction(updateAssetRecord, 'updateAssetRecord'),
    publishAssetUpdated = requireFunction(sendAssetUpdated, 'sendAssetUpdated'),
    notifyTaskUpdate = typeof publishTaskUpdate === 'function' ? publishTaskUpdate : () => {},
    activateMainWindow = typeof focusMainWindow === 'function' ? focusMainWindow : () => {},
    proxyWorkDeduper = createVideoPlaybackProxyWorkDeduper(),
    notifiedTaskIds = new Set();
  let taskQueue = null,
    activity = { activeCount: 0, waitingCount: 0, totalCount: 0, progress: 0, activeTasks: [] };
  function createOutputFilename(purpose, extension) {
    const safePurpose = String(purpose || 'media')['replace'](/[^a-z0-9_-]/gi, '_') || 'media',
      safeExtension =
        String(extension || 'bin')
          ['replace'](/^\.+/, '')
          ['replace'](/[^a-z0-9]/gi, '') || 'bin';
    return (
      safePurpose + '_' + Date['now']() + '_' + randomBytes(3)['toString']('hex') + '.' + safeExtension
    );
  }
  function toOutputLocalPath(...segments) {
    return ['output', ...segments]['filter'](Boolean)['join']('/')['replace'](/\\/g, '/');
  }
  function toAssetLocalPath(...segments) {
    return ['data', 'assets', ...segments]['filter'](Boolean)['join']('/')['replace'](/\\/g, '/');
  }
  function resolveLocalMediaSource(localPath) {
    const resolvedPath = resolveVirtualPath(localPath);
    if (!resolvedPath) throw new Error('Invalid media source path');
    return resolvedPath;
  }
  async function readFfprobeJson(args, errorMessage = 'FFprobe failed') {
    const output = await runCapture(resolveRuntimeTool('ffprobe'), args, {
        cwd: appRoot,
        timeoutMs: ASSET_IMPORT_FFPROBE_TIMEOUT_MS,
      }),
      text = output['toString']('utf8')['trim']();
    if (!text) throw new Error(errorMessage);
    try {
      return JSON['parse'](text);
    } catch {
      throw new Error(errorMessage);
    }
  }
  async function readQueuedFfprobeJson(queue, task, args, errorMessage = 'FFprobe failed') {
    const result = await queue['runProcess'](task, resolveRuntimeTool('ffprobe'), args, {
        timeoutMs: ASSET_IMPORT_FFPROBE_TIMEOUT_MS,
      }),
      text = result['stdout']['toString']('utf8')['trim']();
    if (!text) throw new Error(errorMessage);
    try {
      return JSON['parse'](text);
    } catch {
      throw new Error(errorMessage);
    }
  }
  async function ffprobeVideoMeta(queue, task, sourcePath) {
    const info = await readQueuedFfprobeJson(queue, task, [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'format=duration:stream=avg_frame_rate,r_frame_rate,nb_frames,duration,width,height',
        '-of',
        'json',
        sourcePath,
      ]),
      stream = Array['isArray'](info['streams']) && info['streams'][0] ? info['streams'][0] : {},
      format = info['format'] || {};
    return {
      duration: Number(format['duration'] || 0) || Number(stream['duration'] || 0) || 0,
      fps: parseFfprobeRatio(stream['avg_frame_rate']) || parseFfprobeRatio(stream['r_frame_rate']) || 0,
      width: Math['trunc'](Number(stream['width'] || 0)) || 0,
      height: Math['trunc'](Number(stream['height'] || 0)) || 0,
    };
  }
  async function ffprobeHasAudio(queue, task, sourcePath) {
    try {
      const result = await queue['runProcess'](
        task,
        resolveRuntimeTool('ffprobe'),
        [
          '-v',
          'error',
          '-select_streams',
          'a:0',
          '-show_entries',
          'stream=codec_type',
          '-of',
          'default=nw=1:nk=1',
          sourcePath,
        ],
        { timeoutMs: ASSET_IMPORT_FFPROBE_TIMEOUT_MS },
      );
      return result['stdout']['toString']('utf8')['toLowerCase']()['includes']('audio');
    } catch {
      return false;
    }
  }
  async function ffprobeVideoPlaybackInfo(queue, task, sourcePath) {
    const info = await readQueuedFfprobeJson(queue, task, [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'format=duration,format_name:stream=codec_name,codec_tag_string,pix_fmt,profile,width,height',
      '-of',
      'json',
      sourcePath,
    ]);
    return buildVideoPlaybackInfo(info);
  }
  function buildVideoPlaybackInfo(info = {}) {
    const stream = Array['isArray'](info['streams']) && info['streams'][0] ? info['streams'][0] : {},
      format = info['format'] || {};
    return {
      codecName: String(stream['codec_name'] || '')
        ['trim']()
        ['toLowerCase'](),
      codecTag: String(stream['codec_tag_string'] || '')
        ['trim']()
        ['toLowerCase'](),
      pixelFormat: String(stream['pix_fmt'] || '')
        ['trim']()
        ['toLowerCase'](),
      profile: String(stream['profile'] || '')['trim'](),
      formatName: String(format['format_name'] || '')
        ['trim']()
        ['toLowerCase'](),
      duration: Number(format['duration'] || 0) || 0,
      fps: parseFfprobeRatio(stream['avg_frame_rate']) || parseFfprobeRatio(stream['r_frame_rate']) || 0,
      width: Math['trunc'](Number(stream['width'] || 0)) || 0,
      height: Math['trunc'](Number(stream['height'] || 0)) || 0,
    };
  }
  async function probeVideoPlaybackInfoForImport(sourcePath) {
    const info = await readFfprobeJson([
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'format=duration,format_name:stream=avg_frame_rate,r_frame_rate,codec_name,codec_tag_string,pix_fmt,profile,width,height',
      '-of',
      'json',
      sourcePath,
    ]);
    return buildVideoPlaybackInfo(info);
  }
  function getVideoProxyPaths(assetId) {
    const derivedDir = path['join'](resolveAssetsDir(), 'derived', 'video'),
      proxyFilename = getVideoPlaybackProxyFilename(assetId);
    return {
      derivedDir: derivedDir,
      proxyAbs: path['join'](derivedDir, proxyFilename),
      proxyLocalPath: toAssetLocalPath('derived', 'video', proxyFilename),
    };
  }
  async function runAssetVideoPlaybackProxy(queue, task, sourcePath, assetId) {
    const playbackInfo = await ffprobeVideoPlaybackInfo(queue, task, sourcePath);
    if (!needsBrowserVideoProxy(playbackInfo))
      return {
        displayLocalPath: '',
        displayUrl: '',
        videoProxyStatus: 'not_required',
        videoProxyVersion: '',
        videoCodec: playbackInfo['codecName'],
      };
    const {
      derivedDir: derivedDir,
      proxyAbs: proxyAbs,
      proxyLocalPath: proxyLocalPath,
    } = getVideoProxyPaths(assetId);
    mkdirSync(derivedDir, { recursive: true });
    let proxyReady = false;
    try {
      proxyReady = existsSync(proxyAbs) && statSync(proxyAbs)['size'] > 0;
    } catch {
      proxyReady = false;
    }
    if (!proxyReady) {
      const tempPath = proxyAbs + '.' + process['pid'] + '.' + Date['now']() + '.tmp.mp4';
      try {
        (await runFfmpegTask(
          queue,
          task,
          buildVideoPlaybackProxyFfmpegArgs({
            inputPath: sourcePath,
            outputPath: tempPath,
            preset: VIDEO_PROXY_TRANSCODE_PRESET,
            crf: VIDEO_PROXY_TRANSCODE_CRF,
          }),
          {
            durationSec: playbackInfo['duration'],
            progressMessage: 'Transcoding video',
            timeoutMs: resolveVideoPlaybackProxyTimeoutMs(playbackInfo['duration']),
          },
        ),
          renameSync(tempPath, proxyAbs));
      } catch (error) {
        try {
          if (existsSync(tempPath)) unlinkSync(tempPath);
        } catch {}
        throw error;
      }
    }
    return {
      displayLocalPath: proxyLocalPath,
      displayUrl: '/' + proxyLocalPath,
      videoProxyStatus: 'generated',
      videoProxyVersion: VIDEO_PLAYBACK_PROXY_VERSION,
      videoCodec: playbackInfo['codecName'],
    };
  }
  function ensureAssetVideoPlaybackProxy(queue, task, sourcePath, assetId) {
    const dedupeKey = [
      VIDEO_PLAYBACK_PROXY_VERSION,
      String(assetId || '')['trim'](),
      path['resolve'](sourcePath)['toLowerCase'](),
    ]['join']('|');
    return proxyWorkDeduper['run'](dedupeKey, () =>
      runAssetVideoPlaybackProxy(queue, task, sourcePath, assetId),
    );
  }
  function buildWaveformJsonFromFloat32(float32Samples, requestedSamples = 190) {
    const buffer = float32Samples['buffer']['slice'](
        float32Samples['byteOffset'],
        float32Samples['byteOffset'] + float32Samples['byteLength'],
      ),
      samples = new Float32Array(buffer, 0, Math['floor'](float32Samples['byteLength'] / 4)),
      sampleCount = Math['max'](40, Math['min'](400, Number(requestedSamples) || 190)),
      bucketSize = Math['max'](1, Math['floor'](samples['length'] / sampleCount)),
      peaks = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const bucketStart = index * bucketSize,
        bucketEnd = Math['min'](samples['length'], bucketStart + bucketSize);
      let peak = 0;
      for (let cursor = bucketStart; cursor < bucketEnd; cursor += 1) {
        peak = Math['max'](peak, Math['abs'](Number(samples[cursor]) || 0));
      }
      peaks['push'](Number(Math['min'](1, peak)['toFixed'](4)));
    }
    return { version: 1, samples: sampleCount, peaks: peaks };
  }
  function handleTaskActivity(update = {}) {
    activity = {
      activeCount: Number(update['activeCount'] || 0) || 0,
      waitingCount: Number(update['waitingCount'] || 0) || 0,
      totalCount: Number(update['totalCount'] || 0) || 0,
      progress: Number(update['progress'] || 0) || 0,
      activeTasks: Array['isArray'](update['activeTasks']) ? update['activeTasks'] : [],
    };
    const isActive = activity['activeCount'] > 0;
    (setTaskbarProgressSource?.('media', isActive ? Math['max'](0.01, activity['progress']) : -1),
      setPowerSaveBlocker?.('media', isActive));
  }
  function maybeNotifyLongMediaTask(update = {}) {
    const status = String(update['status'] || '');
    if (status !== 'complete' && status !== 'failed') return;
    if (String(update['purpose'] || '')['trim']() === PERSON_REPLACEMENT_COMPOSE_TASK_PURPOSE) return;
    const taskId = String(update['taskId'] || '')['trim']();
    if (!taskId || notifiedTaskIds['has'](taskId)) return;
    const startedAt = Number(update['startedAt'] || 0) || 0,
      finishedAt = Number(update['finishedAt'] || Date['now']()) || Date['now']();
    if (!startedAt || finishedAt - startedAt < LONG_MEDIA_TASK_NOTIFICATION_MS) return;
    if (typeof NotificationCtor?.['isSupported'] === 'function' && !NotificationCtor['isSupported']()) return;
    notifiedTaskIds['add'](taskId);
    notifiedTaskIds['size'] > 500 &&
      notifiedTaskIds['delete'](notifiedTaskIds['values']()['next']()['value']);
    const displayName = getMediaTaskDisplayName(update['kind']),
      isFailure = status === 'failed';
    try {
      const notification = new NotificationCtor({
        title: '' + displayName + (isFailure ? '失败' : '完成'),
        body: isFailure
          ? formatNotificationBody(update['error'], '任务处理失败。')
          : formatNotificationBody('', '长时间媒体任务已处理完成。'),
        silent: String(update['kind'] || '') === 'audioVoiceCompose',
      });
      (notification['on']('click', activateMainWindow), notification['show']());
    } catch (error) {
      console['warn']('[electron] failed to show media task notification:', error);
    }
  }
  function handleTaskUpdate(update) {
    const status = String(update?.['status'] || '');
    if (update?.['assetId'] && (status === 'failed' || status === 'cancelled')) {
      const updatedAsset = applyAssetRecordUpdate(
        update['assetId'],
        {
          status: 'partial',
          error: update['error'] || status,
          mediaTaskId: update['taskId'] || '',
          mediaTaskKind: update['kind'] || '',
          mediaTaskStatus: status,
          mediaTaskProgress: Number(update['progress'] || 0) || 0,
          mediaTaskError: update['error'] || '',
        },
        { expectedMediaTaskId: update['taskId'] },
      );
      publishAssetUpdated(updatedAsset);
    }
    (maybeNotifyLongMediaTask(update), notifyTaskUpdate(update));
  }
  function getQueue() {
    if (taskQueue) return taskQueue;
    return (
      (taskQueue = new MediaTaskQueueCtor({
        concurrency: 2,
        onUpdate: handleTaskUpdate,
        onActivity: handleTaskActivity,
      })),
      configureFfmpegRuntime({
        ffmpegPath: resolveRuntimeTool('ffmpeg'),
        platform: platform,
        runCapture: runCapture,
        cwd: appRoot,
      }),
      registerLocalHandlers(taskQueue, {
        buildWaveformJsonFromFloat32: buildWaveformJsonFromFloat32,
        createOutputFilename: createOutputFilename,
        ensureAssetVideoPlaybackProxy: ensureAssetVideoPlaybackProxy,
        ffprobeHasAudio: ffprobeHasAudio,
        ffprobeVideoMeta: ffprobeVideoMeta,
        getAssetsDir: resolveAssetsDir,
        getOutputDir: resolveOutputDir,
        getRuntimeToolOrFallback: resolveRuntimeTool,
        runFfmpegTask: runFfmpegTask,
        resolveMediaTaskSource: resolveLocalMediaSource,
        sendAssetUpdated: publishAssetUpdated,
        toAssetLocalPath: toAssetLocalPath,
        toOutputLocalPath: toOutputLocalPath,
        updateAssetRecord: applyAssetRecordUpdate,
      }),
      registerSharedHandlers(taskQueue, {
        createOutputFilename: createOutputFilename,
        ffprobeHasAudio: ffprobeHasAudio,
        ffprobeVideoMeta: ffprobeVideoMeta,
        getAsrRuntimeManifestUrl: () =>
          String(
            env['AIC_ASR_RUNTIME_MANIFEST_URL'] ||
              'https://modelscope.cn/models/q502892879/asr-runtime/resolve/master/asr-runtime-manifest.json',
          )['trim'](),
        getDoubaoAsrConfig: getDoubaoAsrConfig,
        getBailianAsrConfig: getBailianAsrConfig,
        getPythonCertificateEnv: getPythonCertificateEnv,
        getFunasrModelRootDir: getFunasrModelRootDir,
        getOutputDir: resolveOutputDir,
        getRuntimeToolOrFallback: resolveRuntimeTool,
        getUserDataRoot: getUserDataRoot,
        runFfmpegTask: runFfmpegTask,
        resolveMediaTaskSource: resolveLocalMediaSource,
        resolveFallbackPythonCommand: resolveFallbackPythonCommand,
        resolvePythonCommand: resolvePythonCommand,
        appRoot: appRoot,
        toOutputLocalPath: toOutputLocalPath,
      }),
      taskQueue
    );
  }
  return {
    buildStatePatch: buildMediaTaskStatePatch,
    getActivity: () => ({ ...activity, activeTasks: [...activity['activeTasks']] }),
    getQueue: getQueue,
    probeVideoPlaybackInfoForImport: probeVideoPlaybackInfoForImport,
  };
}
