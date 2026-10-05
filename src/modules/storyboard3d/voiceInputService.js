function getRecognitionConstructor(value) {
  return value?.['SpeechRecognition'] || value?.['webkitSpeechRecognition'] || null;
}
export function isStoryboard3DVoiceInputSupported(item = globalThis['window']) {
  return typeof getRecognitionConstructor(item) === 'function';
}
function collectRecognitionText(key) {
  const finalText = [],
    interimText = [],
    list = key?.['results'] || [],
    index = Math['max'](0, Number(key?.['resultIndex'] || 0));
  for (let result = index; result < list['length']; result += 1) {
    const data = list[result],
      enabled = String(data?.[0]?.['transcript'] || '')['trim']();
    if (!enabled) continue;
    if (data['isFinal']) finalText['push'](enabled);
    else interimText['push'](enabled);
  }
  return {
    finalText: finalText['join'](' ')['trim'](),
    interimText: interimText['join'](' ')['trim'](),
  };
}
export class Storyboard3DVoiceInputService {
  constructor({
    windowObject: windowObject = globalThis['window'],
    lang: lang = 'zh-CN',
    continuous: continuous = ![],
    interimResults: interimResults = !![],
    onStateChange: onStateChange,
    onTranscript: onTranscript,
    onError: onError,
  } = {}) {
    ((this['window'] = windowObject),
      (this['lang'] = lang),
      (this['continuous'] = Boolean(continuous)),
      (this['interimResults'] = Boolean(interimResults)),
      (this['onStateChange'] = onStateChange),
      (this['onTranscript'] = onTranscript),
      (this['onError'] = onError),
      (this['recognition'] = null),
      (this['state'] = 'idle'),
      (this['finalTranscript'] = ''),
      (this['_stopping'] = ![]));
  }
  ['isSupported']() {
    return isStoryboard3DVoiceInputSupported(this['window']);
  }
  ['_setState'](state, args = {}) {
    if (this['state'] === state && Object['keys'](args)['length'] === 0) return;
    ((this['state'] = state), this['onStateChange']?.({ state: state, ...args }));
  }
  ['_bindRecognition'](options) {
    ((options['lang'] = this['lang']),
      (options['continuous'] = this['continuous']),
      (options['interimResults'] = this['interimResults']),
      (options['maxAlternatives'] = 1),
      (options['onstart'] = () => {
        ((this['_stopping'] = ![]), this['_setState']('listening'));
      }),
      (options['onspeechstart'] = () => this['_setState']('transcribing')),
      (options['onresult'] = (target) => {
        const { finalText: finalText2, interimText: interimText2 } = collectRecognitionText(target);
        finalText2 &&
          (this['finalTranscript'] = [this['finalTranscript'], finalText2]
            ['filter'](Boolean)
            ['join'](' '));
        const transcript = [this['finalTranscript'], interimText2]
          ['filter'](Boolean)
          ['join'](' ')
          ['trim']();
        this['onTranscript']?.({
          transcript: transcript,
          finalText: this['finalTranscript'],
          interimText: interimText2,
          isFinal: Boolean(finalText2 && !interimText2),
        });
      }),
      (options['onerror'] = (error) => {
        const error2 = String(error?.['error'] || 'recognition-error'),
          enabled2 = ['no-speech', 'aborted']['includes'](error2);
        this['_setState'](enabled2 ? 'idle' : 'error', { error: error2 });
        if (!enabled2) this['onError']?.({ error: error2, message: String(error?.['message'] || '') });
      }),
      (options['onend'] = () => {
        ((this['recognition'] = null),
          this['_setState']('idle', { transcript: this['finalTranscript'], stopped: this['_stopping'] }),
          (this['_stopping'] = ![]));
      }));
  }
  ['start']({ resetTranscript: resetTranscript = !![] } = {}) {
    if (!this['isSupported']()) {
      const error3 = new Error('当前运行环境不支持语音转文字。');
      ((error3['code'] = 'speech-recognition-unsupported'),
        this['_setState']('error', { error: error3['code'] }),
        this['onError']?.({ error: error3['code'], message: error3['message'] }));
      throw error3;
    }
    if (this['recognition']) return ![];
    if (resetTranscript) this['finalTranscript'] = '';
    const run = getRecognitionConstructor(this['window']),
      source = new run();
    ((this['recognition'] = source), this['_bindRecognition'](source), this['_setState']('starting'));
    try {
      return (source['start'](), !![]);
    } catch (message) {
      ((this['recognition'] = null),
        this['_setState']('error', { error: 'start-failed' }),
        this['onError']?.({ error: 'start-failed', message: message?.['message'] || String(message) }));
      throw message;
    }
  }
  ['stop']() {
    if (!this['recognition']) return ![];
    return ((this['_stopping'] = !![]), this['_setState']('stopping'), this['recognition']['stop']?.(), !![]);
  }
  ['abort']() {
    if (!this['recognition']) return ![];
    return ((this['_stopping'] = !![]), this['recognition']['abort']?.(), !![]);
  }
  ['destroy']() {
    const next = this['recognition'];
    ((this['recognition'] = null),
      next?.['abort']?.(),
      next &&
        ((next['onstart'] = null),
        (next['onspeechstart'] = null),
        (next['onresult'] = null),
        (next['onerror'] = null),
        (next['onend'] = null)),
      this['_setState']('idle'));
  }
}
export function createStoryboard3DVoiceInputService(options2 = {}) {
  return new Storyboard3DVoiceInputService(options2);
}
