import { readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createRecordingAsrProvider } from './recordingAsrProviders.js';
export function createRecordingTranscribeTaskHandler(deps) {
  return async (task, queue) => {
    const src = deps.resolveMediaTaskSource(task.payload.src),
      asrProvider = createRecordingAsrProvider(task.payload.provider, deps);
    queue.throwIfCancelled(task);
    if (!(await deps.ffprobeHasAudio(queue, task, src)))
      return {
        provider: asrProvider.id,
        model: asrProvider.model,
        status: 'no-audio-track',
        utterances: [],
        raw: {},
      };
    const credentials = asrProvider.credentials();
    asrProvider.validate(credentials);
    const outputDir = deps.getOutputDir();
    await mkdir(outputDir, { recursive: true });
    const audioPath = path.join(outputDir, deps.createOutputFilename('recording_asr', 'mp3'));
    try {
      (await queue.runProcess(
        task,
        deps.getRuntimeToolOrFallback('ffmpeg'),
        [
          '-y',
          '-i',
          src,
          '-map',
          '0:a:0',
          '-vn',
          '-ac',
          '1',
          '-af',
          'aresample=16000:first_pts=0',
          '-ar',
          '16000',
          '-b:a',
          '96k',
          audioPath,
        ],
        { timeoutMs: 180000 },
      ),
        queue.throwIfCancelled(task));
      const bytes = await readFile(audioPath),
        controller = new AbortController(),
        timeoutTimer = setTimeout(() => controller.abort(), 180000),
        cancelWatcher = setInterval(() => {
          try {
            queue.throwIfCancelled(task);
          } catch {
            controller.abort();
          }
        }, 250);
      try {
        const result = await asrProvider.run({
          bytes: bytes,
          credentials: credentials,
          throwIfCancelled: () => {
            queue.throwIfCancelled(task);
            if (controller.signal.aborted) throw new Error('录音识别已取消或超时。');
          },
          fetchImpl: deps.fetchImpl || globalThis.fetch,
          signal: controller.signal,
        });
        return (queue.throwIfCancelled(task), result);
      } finally {
        (clearTimeout(timeoutTimer), clearInterval(cancelWatcher));
      }
    } finally {
      await rm(audioPath, { force: true });
    }
  };
}
