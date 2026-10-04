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
export function registerSharedMediaTaskHandlers(enabled, appRoot = {}) {
  if (!enabled || typeof enabled.setHandler !== 'function') return;
  (enabled.setHandler('storySequenceExport', createStorySequenceExportTaskHandler(appRoot)),
    enabled.setHandler(
      'asrRuntimeInstall',
      createAsrRuntimeInstallMediaTaskHandler({
        appRoot: appRoot.appRoot,
        getAsrRuntimeManifestUrl: appRoot.getAsrRuntimeManifestUrl,
        getUserDataRoot: appRoot.getUserDataRoot,
        resolveFallbackPythonCommand: appRoot.resolveFallbackPythonCommand,
      }),
    ));
  (enabled.setHandler(
    'audioCompose',
    createAudioComposeMediaTaskHandler({
      createOutputFilename: appRoot.createOutputFilename,
      ffprobeHasAudio: appRoot.ffprobeHasAudio,
      getOutputDir: appRoot.getOutputDir,
      getRuntimeToolOrFallback: appRoot.getRuntimeToolOrFallback,
      resolveMediaTaskSource: appRoot.resolveMediaTaskSource,
      toOutputLocalPath: appRoot.toOutputLocalPath,
    }),
  ),
    enabled.setHandler(
      'audioVoiceCompose',
      createAudioVoiceComposeMediaTaskHandler({
        createOutputFilename: appRoot.createOutputFilename,
        ffprobeVideoMeta: appRoot.ffprobeVideoMeta,
        getOutputDir: appRoot.getOutputDir,
        getRuntimeToolOrFallback: appRoot.getRuntimeToolOrFallback,
        resolveMediaTaskSource: appRoot.resolveMediaTaskSource,
        runFfmpegTask: appRoot.runFfmpegTask,
        toOutputLocalPath: appRoot.toOutputLocalPath,
      }),
    ),
    enabled.setHandler(
      'mediaClipExport',
      createMediaClipExportTaskHandler({
        createOutputFilename: appRoot.createOutputFilename,
        ffprobeHasAudio: appRoot.ffprobeHasAudio,
        ffprobeVideoMeta: appRoot.ffprobeVideoMeta,
        getOutputDir: appRoot.getOutputDir,
        getRuntimeToolOrFallback: appRoot.getRuntimeToolOrFallback,
        resolveMediaTaskSource: appRoot.resolveMediaTaskSource,
        runFfmpegTask: appRoot.runFfmpegTask,
        toOutputLocalPath: appRoot.toOutputLocalPath,
      }),
    ),
    enabled.setHandler(
      'recordingTranscribe',
      createRecordingTranscribeTaskHandler({
        createOutputFilename: appRoot.createOutputFilename,
        ffprobeHasAudio: appRoot.ffprobeHasAudio,
        getBailianAsrConfig: appRoot.getBailianAsrConfig,
        getDoubaoAsrConfig: appRoot.getDoubaoAsrConfig,
        getOutputDir: appRoot.getOutputDir,
        getRuntimeToolOrFallback: appRoot.getRuntimeToolOrFallback,
        resolveMediaTaskSource: appRoot.resolveMediaTaskSource,
      }),
    ),
    enabled.setHandler(
      'videoReverse',
      createVideoReverseMediaTaskHandler({
        createOutputFilename: appRoot.createOutputFilename,
        ffprobeHasAudio: appRoot.ffprobeHasAudio,
        ffprobeVideoMeta: appRoot.ffprobeVideoMeta,
        getOutputDir: appRoot.getOutputDir,
        getRuntimeToolOrFallback: appRoot.getRuntimeToolOrFallback,
        resolveMediaTaskSource: appRoot.resolveMediaTaskSource,
        runFfmpegTask: appRoot.runFfmpegTask,
        toOutputLocalPath: appRoot.toOutputLocalPath,
      }),
    ),
    enabled.setHandler(
      'videoToGif',
      createVideoToGifMediaTaskHandler({
        createOutputFilename: appRoot.createOutputFilename,
        ffprobeVideoMeta: appRoot.ffprobeVideoMeta,
        getOutputDir: appRoot.getOutputDir,
        getRuntimeToolOrFallback: appRoot.getRuntimeToolOrFallback,
        resolveMediaTaskSource: appRoot.resolveMediaTaskSource,
        runFfmpegTask: appRoot.runFfmpegTask,
        toOutputLocalPath: appRoot.toOutputLocalPath,
      }),
    ),
    enabled.setHandler(
      'audioVoiceAnalyze',
      createAudioVoiceAnalyzeMediaTaskHandler({
        createOutputFilename: appRoot.createOutputFilename,
        ffprobeHasAudio: appRoot.ffprobeHasAudio,
        ffprobeVideoMeta: appRoot.ffprobeVideoMeta,
        getDoubaoAsrConfig: appRoot.getDoubaoAsrConfig,
        getBailianAsrConfig: appRoot.getBailianAsrConfig,
        getFunasrModelRootDir: appRoot.getFunasrModelRootDir,
        getPythonCertificateEnv: appRoot.getPythonCertificateEnv,
        getSortformerModelRootDir: appRoot.getSortformerModelRootDir,
        getOutputDir: appRoot.getOutputDir,
        getRuntimeToolOrFallback: appRoot.getRuntimeToolOrFallback,
        resolveMediaTaskSource: appRoot.resolveMediaTaskSource,
        resolvePythonCommand: appRoot.resolvePythonCommand,
        appRoot: appRoot.appRoot,
        toOutputLocalPath: appRoot.toOutputLocalPath,
      }),
    ),
    enabled.setHandler(
      'audioVoiceModelPrepare',
      createAudioVoiceModelPrepareMediaTaskHandler({
        getFunasrModelRootDir: appRoot.getFunasrModelRootDir,
        getPythonCertificateEnv: appRoot.getPythonCertificateEnv,
        getSortformerModelRootDir: appRoot.getSortformerModelRootDir,
        resolvePythonCommand: appRoot.resolvePythonCommand,
        appRoot: appRoot.appRoot,
      }),
    ),
    enabled.setHandler(
      'funasrModelPrepare',
      createFunasrModelPrepareMediaTaskHandler({
        getFunasrModelRootDir: appRoot.getFunasrModelRootDir,
        getPythonCertificateEnv: appRoot.getPythonCertificateEnv,
        resolvePythonCommand: appRoot.resolvePythonCommand,
        appRoot: appRoot.appRoot,
      }),
    ),
    enabled.setHandler(
      'funasrRuntimeCheck',
      createFunasrRuntimeCheckMediaTaskHandler({
        getFunasrModelRootDir: appRoot.getFunasrModelRootDir,
        getPythonCertificateEnv: appRoot.getPythonCertificateEnv,
        resolvePythonCommand: appRoot.resolvePythonCommand,
        appRoot: appRoot.appRoot,
      }),
    ),
    enabled.setHandler(
      'funasrGpuTorchInstall',
      createFunasrGpuTorchInstallMediaTaskHandler({
        getFunasrModelRootDir: appRoot.getFunasrModelRootDir,
        getPythonCertificateEnv: appRoot.getPythonCertificateEnv,
        resolvePythonCommand: appRoot.resolvePythonCommand,
        appRoot: appRoot.appRoot,
      }),
    ));
}
