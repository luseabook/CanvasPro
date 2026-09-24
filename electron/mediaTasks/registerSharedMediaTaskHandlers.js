import { createStorySequenceExportTaskHandler } from './storySequenceExportTask.js';
import { createAudioComposeMediaTaskHandler } from './audioComposeTask.js';
import { createAudioVoiceComposeMediaTaskHandler } from './audioVoiceComposeTask.js';
import {
  createAudioVoiceModelPrepareMediaTaskHandler,
  createAudioVoiceAnalyzeMediaTaskHandler,
  createFunasrGpuTorchInstallMediaTaskHandler,
  createFunasrModelPrepareMediaTaskHandler,
  createFunasrRuntimeCheckMediaTaskHandler,
} from './audioVoiceAnalyzeTask.js';
import { createAsrRuntimeInstallMediaTaskHandler } from './asrRuntimeInstallTask.js';
import { createMediaClipExportTaskHandler } from './mediaClipExportTask.js';
import { createRecordingTranscribeTaskHandler } from './recordingTranscribeTask.js';
import { createVideoReverseMediaTaskHandler } from './videoReverseTask.js';
import { createVideoToGifMediaTaskHandler } from './videoToGifTask.js';
export function registerSharedMediaTaskHandlers(_0x1548b1, _0x554062 = {}) {
  if (!_0x1548b1 || typeof _0x1548b1.setHandler !== 'function') return;
  (_0x1548b1.setHandler('storySequenceExport', createStorySequenceExportTaskHandler(_0x554062)),
    _0x1548b1.setHandler(
      'asrRuntimeInstall',
      createAsrRuntimeInstallMediaTaskHandler({
        appRoot: _0x554062.appRoot,
        getAsrRuntimeManifestUrl: _0x554062.getAsrRuntimeManifestUrl,
        getUserDataRoot: _0x554062.getUserDataRoot,
        resolveFallbackPythonCommand: _0x554062.resolveFallbackPythonCommand,
      }),
    ));
  (_0x1548b1.setHandler(
    'audioCompose',
    createAudioComposeMediaTaskHandler({
      createOutputFilename: _0x554062.createOutputFilename,
      ffprobeHasAudio: _0x554062.ffprobeHasAudio,
      getOutputDir: _0x554062.getOutputDir,
      getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
      resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
      toOutputLocalPath: _0x554062.toOutputLocalPath,
    }),
  ),
    _0x1548b1.setHandler(
      'audioVoiceCompose',
      createAudioVoiceComposeMediaTaskHandler({
        createOutputFilename: _0x554062.createOutputFilename,
        ffprobeVideoMeta: _0x554062.ffprobeVideoMeta,
        getOutputDir: _0x554062.getOutputDir,
        getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
        resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
        runFfmpegTask: _0x554062.runFfmpegTask,
        toOutputLocalPath: _0x554062.toOutputLocalPath,
      }),
    ),
    _0x1548b1.setHandler(
      'mediaClipExport',
      createMediaClipExportTaskHandler({
        createOutputFilename: _0x554062.createOutputFilename,
        ffprobeHasAudio: _0x554062.ffprobeHasAudio,
        ffprobeVideoMeta: _0x554062.ffprobeVideoMeta,
        getOutputDir: _0x554062.getOutputDir,
        getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
        resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
        runFfmpegTask: _0x554062.runFfmpegTask,
        toOutputLocalPath: _0x554062.toOutputLocalPath,
      }),
    ),
    _0x1548b1.setHandler(
      'recordingTranscribe',
      createRecordingTranscribeTaskHandler({
        createOutputFilename: _0x554062.createOutputFilename,
        ffprobeHasAudio: _0x554062.ffprobeHasAudio,
        getBailianAsrConfig: _0x554062.getBailianAsrConfig,
        getDoubaoAsrConfig: _0x554062.getDoubaoAsrConfig,
        getOutputDir: _0x554062.getOutputDir,
        getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
        resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
      }),
    ),
    _0x1548b1.setHandler(
      'videoReverse',
      createVideoReverseMediaTaskHandler({
        createOutputFilename: _0x554062.createOutputFilename,
        ffprobeHasAudio: _0x554062.ffprobeHasAudio,
        ffprobeVideoMeta: _0x554062.ffprobeVideoMeta,
        getOutputDir: _0x554062.getOutputDir,
        getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
        resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
        runFfmpegTask: _0x554062.runFfmpegTask,
        toOutputLocalPath: _0x554062.toOutputLocalPath,
      }),
    ),
    _0x1548b1.setHandler(
      'videoToGif',
      createVideoToGifMediaTaskHandler({
        createOutputFilename: _0x554062.createOutputFilename,
        ffprobeVideoMeta: _0x554062.ffprobeVideoMeta,
        getOutputDir: _0x554062.getOutputDir,
        getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
        resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
        runFfmpegTask: _0x554062.runFfmpegTask,
        toOutputLocalPath: _0x554062.toOutputLocalPath,
      }),
    ),
    _0x1548b1.setHandler(
      'audioVoiceAnalyze',
      createAudioVoiceAnalyzeMediaTaskHandler({
        createOutputFilename: _0x554062.createOutputFilename,
        ffprobeHasAudio: _0x554062.ffprobeHasAudio,
        ffprobeVideoMeta: _0x554062.ffprobeVideoMeta,
        getDoubaoAsrConfig: _0x554062.getDoubaoAsrConfig,
        getBailianAsrConfig: _0x554062.getBailianAsrConfig,
        getFunasrModelRootDir: _0x554062.getFunasrModelRootDir,
        getPythonCertificateEnv: _0x554062.getPythonCertificateEnv,
        getSortformerModelRootDir: _0x554062.getSortformerModelRootDir,
        getOutputDir: _0x554062.getOutputDir,
        getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
        resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
        resolvePythonCommand: _0x554062.resolvePythonCommand,
        appRoot: _0x554062.appRoot,
        toOutputLocalPath: _0x554062.toOutputLocalPath,
      }),
    ),
    _0x1548b1.setHandler(
      'audioVoiceModelPrepare',
      createAudioVoiceModelPrepareMediaTaskHandler({
        getFunasrModelRootDir: _0x554062.getFunasrModelRootDir,
        getPythonCertificateEnv: _0x554062.getPythonCertificateEnv,
        getSortformerModelRootDir: _0x554062.getSortformerModelRootDir,
        resolvePythonCommand: _0x554062.resolvePythonCommand,
        appRoot: _0x554062.appRoot,
      }),
    ),
    _0x1548b1.setHandler(
      'funasrModelPrepare',
      createFunasrModelPrepareMediaTaskHandler({
        getFunasrModelRootDir: _0x554062.getFunasrModelRootDir,
        getPythonCertificateEnv: _0x554062.getPythonCertificateEnv,
        resolvePythonCommand: _0x554062.resolvePythonCommand,
        appRoot: _0x554062.appRoot,
      }),
    ),
    _0x1548b1.setHandler(
      'funasrRuntimeCheck',
      createFunasrRuntimeCheckMediaTaskHandler({
        getFunasrModelRootDir: _0x554062.getFunasrModelRootDir,
        getPythonCertificateEnv: _0x554062.getPythonCertificateEnv,
        resolvePythonCommand: _0x554062.resolvePythonCommand,
        appRoot: _0x554062.appRoot,
      }),
    ),
    _0x1548b1.setHandler(
      'funasrGpuTorchInstall',
      createFunasrGpuTorchInstallMediaTaskHandler({
        getFunasrModelRootDir: _0x554062.getFunasrModelRootDir,
        getPythonCertificateEnv: _0x554062.getPythonCertificateEnv,
        resolvePythonCommand: _0x554062.resolvePythonCommand,
        appRoot: _0x554062.appRoot,
      }),
    ));
}
