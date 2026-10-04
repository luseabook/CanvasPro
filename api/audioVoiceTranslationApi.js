import { generateText } from './aiTextApi.js';
import {
  buildAudioVoiceTranslationPrompt,
  createAudioVoiceTranslationStructuredOutput,
  getAudioVoiceTranslationLanguage,
  parseAudioVoiceTranslationResult,
} from '../src/modules/audioVoiceTranslation.js';
export const AUDIO_VOICE_TRANSLATION_MODEL_ID = 'volcengine/doubao-seed-2-1-turbo-260628';
export const AUDIO_VOICE_TRANSLATION_PROVIDER_ID = 'volcengine';
const AUDIO_VOICE_TRANSLATION_SYSTEM_PROMPT = [
  'You\x20are\x20a\x20professional\x20audiovisual\x20dialogue\x20translator.',
  'Translate faithfully while producing concise, natural spoken dialogue for dubbing.',
  'Follow the requested JSON schema exactly and return no commentary.',
]['join']('\x20');
export async function translateAudioVoiceSegments({
  languageId: languageId = '',
  segments: segments = [],
  request: request = generateText,
} = {}) {
  const language = getAudioVoiceTranslationLanguage(languageId);
  if (!language) throw new Error('不支持的目标语言。');
  if (typeof request !== 'function') throw new Error('翻译请求不可用。');
  const request2 = await request({
    provider: AUDIO_VOICE_TRANSLATION_PROVIDER_ID,
    model: AUDIO_VOICE_TRANSLATION_MODEL_ID,
    prompt: buildAudioVoiceTranslationPrompt({ language: language, segments: segments }),
    systemPrompt: AUDIO_VOICE_TRANSLATION_SYSTEM_PROMPT,
    structuredOutput: createAudioVoiceTranslationStructuredOutput(segments),
    thinking: { type: 'disabled' },
    temperature: 0.2,
    maxOutputTokens: 0x1000,
    timeoutMs: 0x3 * 0x3c * 0x3e8,
  });
  return parseAudioVoiceTranslationResult(request2, segments);
}
