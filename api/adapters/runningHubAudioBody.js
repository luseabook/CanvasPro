export function buildRunningHubAudioBody({
  modelType: modelType,
  params: params = {},
  prompt: prompt = '',
  uploadedAudioUrl: uploadedAudioUrl = '',
}) {
  let value = {};
  if (modelType === 'suno-single') {
    const make_instrumental =
        params?.make_instrumental === true || params?.make_instrumental === 'true',
      title = String(params?.title || '').trim();
    value = {
      description: prompt || '',
      ...(title && title !== '-' ? { title: title } : {}),
      make_instrumental: make_instrumental ? 'true' : 'false',
    };
  } else {
    if (modelType === 'suno-custom') {
      const tags = String(params?.tags || 'pop').trim() || 'pop',
        enabled = String(params?.title || '').trim(),
        title2 = !enabled || enabled === '-' ? 'Untitled' : enabled;
      value = { prompt: prompt || '', tags: tags, title: title2 };
    } else {
      if (modelType === 'minimax-tts')
        value = {
          text: prompt || '',
          voice_id: String(params?.customVoiceId || params?.voice_id || 'Wise_Woman').trim(),
          speed: Number(params?.speed) || 1,
          volume: Number(params?.volume) || 1,
          pitch: Number.isInteger(Number(params?.pitch)) ? Number(params.pitch) : 0,
          emotion: String(params?.emotion || 'happy').trim(),
          enable_base64_output: false,
          english_normalization: false,
          ...(Array.isArray(params?.pronunciation_dict) && params.pronunciation_dict.length > 0
            ? { pronunciation_dict: params.pronunciation_dict }
            : {}),
        };
      else {
        if (modelType === 'minimax-music-instrumental')
          value = {
            prompt: prompt || '',
            is_instrumental: true,
            sampleRate: String(params?.sampleRate || '44100').trim(),
            bitrate: String(params?.bitrate || '256000').trim(),
            format: String(params?.format || 'mp3').trim(),
          };
        else {
          if (modelType === 'minimax-music') {
            const item = String(params?.prompt || '').trim(),
              prompt2 = item && item !== '-' ? item : prompt || '',
              lyricsOptimizer =
                params?.lyricsOptimizer === true || params?.lyricsOptimizer === 'true';
            value = {
              lyrics: prompt || '',
              prompt: prompt2,
              is_instrumental: false,
              lyricsOptimizer: lyricsOptimizer,
              sampleRate: String(params?.sampleRate || '44100').trim(),
              bitrate: String(params?.bitrate || '256000').trim(),
              format: String(params?.format || 'mp3').trim(),
            };
          } else
            value = {
              prompt: prompt || '',
              ...(uploadedAudioUrl ? { audioUrl: uploadedAudioUrl } : {}),
              ...params,
            };
        }
      }
    }
  }
  return value;
}
