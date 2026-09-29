export function buildRunningHubAudioBody({
  modelType: _0x495ff0,
  params: params = {},
  prompt: prompt = '',
  uploadedAudioUrl: uploadedAudioUrl = '',
}) {
  let _0x24cf72 = {};
  if (_0x495ff0 === 'suno-single') {
    const _0x20f520 = params?.['make_instrumental'] === !![] || params?.['make_instrumental'] === 'true',
      _0x254358 = String(params?.['title'] || '')['trim']();
    _0x24cf72 = {
      description: prompt || '',
      ...(_0x254358 && _0x254358 !== '-' ? { title: _0x254358 } : {}),
      make_instrumental: _0x20f520 ? 'true' : 'false',
    };
  } else {
    if (_0x495ff0 === 'suno-custom') {
      const _0x3f8dcc = String(params?.['tags'] || 'pop')['trim']() || 'pop',
        _0x378d53 = String(params?.['title'] || '')['trim'](),
        _0x1323af = !_0x378d53 || _0x378d53 === '-' ? 'Untitled' : _0x378d53;
      _0x24cf72 = { prompt: prompt || '', tags: _0x3f8dcc, title: _0x1323af };
    } else {
      if (_0x495ff0 === 'minimax-tts')
        _0x24cf72 = {
          text: prompt || '',
          voice_id: String(params?.['customVoiceId'] || params?.['voice_id'] || 'Wise_Woman')['trim'](),
          speed: Number(params?.['speed']) || 0x1,
          volume: Number(params?.['volume']) || 0x1,
          pitch: Number['isInteger'](Number(params?.['pitch'])) ? Number(params['pitch']) : 0x0,
          emotion: String(params?.['emotion'] || 'happy')['trim'](),
          enable_base64_output: ![],
          english_normalization: ![],
          ...(Array['isArray'](params?.['pronunciation_dict']) && params['pronunciation_dict']['length'] > 0x0
            ? { pronunciation_dict: params['pronunciation_dict'] }
            : {}),
        };
      else {
        if (_0x495ff0 === 'minimax-music-instrumental')
          _0x24cf72 = {
            prompt: prompt || '',
            is_instrumental: !![],
            sampleRate: String(params?.['sampleRate'] || '44100')['trim'](),
            bitrate: String(params?.['bitrate'] || '256000')['trim'](),
            format: String(params?.['format'] || 'mp3')['trim'](),
          };
        else {
          if (_0x495ff0 === 'minimax-music') {
            const _0x394ffb = String(params?.['prompt'] || '')['trim'](),
              _0x4750e3 = _0x394ffb && _0x394ffb !== '-' ? _0x394ffb : prompt || '',
              _0x283968 = params?.['lyricsOptimizer'] === !![] || params?.['lyricsOptimizer'] === 'true';
            _0x24cf72 = {
              lyrics: prompt || '',
              prompt: _0x4750e3,
              is_instrumental: ![],
              lyricsOptimizer: _0x283968,
              sampleRate: String(params?.['sampleRate'] || '44100')['trim'](),
              bitrate: String(params?.['bitrate'] || '256000')['trim'](),
              format: String(params?.['format'] || 'mp3')['trim'](),
            };
          } else
            _0x24cf72 = {
              prompt: prompt || '',
              ...(uploadedAudioUrl ? { audioUrl: uploadedAudioUrl } : {}),
              ...params,
            };
        }
      }
    }
  }
  return _0x24cf72;
}
