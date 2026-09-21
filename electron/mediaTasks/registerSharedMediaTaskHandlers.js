import { createAudioComposeMediaTaskHandler } from './audioComposeTask.js';
import { createMediaClipExportTaskHandler } from './mediaClipExportTask.js';
import { createVideoReverseMediaTaskHandler } from './videoReverseTask.js';
export function registerSharedMediaTaskHandlers(_0x1548b1, _0x554062 = {}) {
  if (!_0x1548b1 || typeof _0x1548b1.setHandler !== 'function') return;
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
      'mediaClipExport',
      createMediaClipExportTaskHandler({
        createOutputFilename: _0x554062.createOutputFilename,
        ffprobeHasAudio: _0x554062.ffprobeHasAudio,
        ffprobeVideoMeta: _0x554062.ffprobeVideoMeta,
        getOutputDir: _0x554062.getOutputDir,
        getRuntimeToolOrFallback: _0x554062.getRuntimeToolOrFallback,
        resolveMediaTaskSource: _0x554062.resolveMediaTaskSource,
        toOutputLocalPath: _0x554062.toOutputLocalPath,
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
        toOutputLocalPath: _0x554062.toOutputLocalPath,
      }),
    ));
}
