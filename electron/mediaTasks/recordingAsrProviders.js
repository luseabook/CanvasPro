import { transcribeDoubaoRecording } from '../../api/doubaoRecordedAsrApi.js';
import { transcribeBailianAudio } from '../../api/bailianAsrApi.js';
import { getRecordingAsrModel } from '../../api/recordingAsrModels.js';
export function createRecordingAsrProvider(providerId, deps) {
  const model = getRecordingAsrModel(providerId),
    providers = {
      'volcengine-speech': {
        credentials: () => deps.getDoubaoAsrConfig({ speechOnly: true }),
        validate: (credentials) => {
          if (!credentials.apiKey && !(credentials.appKey && credentials.accessKey))
            throw new Error('请在火山语音设置中配置录音识别凭据。');
        },
        run: ({ bytes, ...rest }) => {
          if (bytes.length > 100 * 1024 * 1024)
            throw new Error('录音文件超过极速识别的 100MB 上限。');
          return transcribeDoubaoRecording({ ...rest, audioBase64: bytes.toString('base64') });
        },
      },
      bailian: {
        credentials: () => deps.getBailianAsrConfig(),
        validate: (credentials) => {
          if (!credentials.apiKey) throw new Error('请在设置 > API Key > 阿里云百炼填写 API Key。');
        },
        run: async ({ bytes, ...rest }) => {
          const result = await transcribeBailianAudio({
              ...rest,
              audio: new Blob([bytes], { type: 'audio/mpeg' }),
              includeRaw: true,
              timeoutMs: 180000,
            }),
            utterances = result.raw.transcripts.flatMap((transcript) =>
              (transcript.sentences || []).map((sentence) => ({
                text: sentence.text || '',
                start_time: sentence.begin_time,
                end_time: sentence.end_time,
                additions: { speaker: sentence.speaker_id ?? '' },
                words: (sentence.words || []).map((word) => ({
                  text: word.text,
                  start_time: word.begin_time,
                  end_time: word.end_time,
                })),
              })),
            );
          return {
            provider: model.id,
            model: model.model,
            status: utterances.some((utterance) => utterance.text) ? 'recognized' : 'silence',
            raw: result.raw,
            utterances: utterances,
          };
        },
      },
    };
  return { ...model, ...providers[model.id] };
}
