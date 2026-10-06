import { openAsBlob } from 'node:fs';
import path from 'node:path';
import { transcribeBailianAudio } from '../../api/bailianAsrApi.js';
import { normalizeDoubaoAsrSegments, runDoubaoAsrTranscription } from './doubaoAsrClient.js';
export function createAudioVoiceCloudAsrAdapters({
  getDoubaoAsrConfig: getDoubaoAsrConfig,
  getBailianAsrConfig: getBailianAsrConfig,
  runDoubaoAsrTranscription: runDoubaoAsrTranscriptionImpl = runDoubaoAsrTranscription,
  runBailianAsrTranscription: runBailianAsrTranscription = async ({
    audioAbs: audioAbs,
    queue: queue,
    task: task,
    ...rest
  }) =>
    transcribeBailianAudio({
      ...rest,
      audio: await openAsBlob(audioAbs, { type: 'audio/mpeg' }),
      filename: path.basename(audioAbs),
      throwIfCancelled: () => queue.throwIfCancelled(task),
      onProgress: (progress, message) =>
        queue.emitProgress(task, progress, message, { stage: 'transcribe' }),
    }),
} = {}) {
  return {
    doubao: {
      getConfig: getDoubaoAsrConfig,
      run: runDoubaoAsrTranscriptionImpl,
      normalize: normalizeDoubaoAsrSegments,
    },
    bailian: {
      getConfig: getBailianAsrConfig,
      run: runBailianAsrTranscription,
      normalize: (result) => result.segments,
    },
  };
}
