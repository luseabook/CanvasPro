import assert from 'node:assert/strict';
import test from 'node:test';

import {
  Storyboard3DVoiceInputService,
  createStoryboard3DVoiceInputService,
  isStoryboard3DVoiceInputSupported,
} from './voiceInputService.js';

class FakeRecognition {
  constructor() {
    FakeRecognition.instances.push(this);
    this.started = false;
    this.stopped = false;
    this.aborted = false;
  }

  start() {
    this.started = true;
    this.onstart?.();
  }

  stop() {
    this.stopped = true;
  }

  abort() {
    this.aborted = true;
  }
}
FakeRecognition.instances = [];

function supportedWindow() {
  FakeRecognition.instances = [];
  return { SpeechRecognition: FakeRecognition };
}

function result(entries, resultIndex = 0) {
  const results = entries.map((entry) => [{ transcript: entry.text }]);
  results.forEach((entry, index) => {
    entry.isFinal = entries[index].isFinal === true;
  });
  return { results, resultIndex };
}

function FailingRecognition() {
  this.onstart = null;
}

FailingRecognition.prototype.start = function start() {
  throw new Error('audio busy');
};

test('语音输入：识别能力探测只看构造函数', () => {
  assert.equal(isStoryboard3DVoiceInputSupported({ SpeechRecognition: function () {} }), true);
  assert.equal(isStoryboard3DVoiceInputSupported({ webkitSpeechRecognition: function () {} }), true);
  assert.equal(isStoryboard3DVoiceInputSupported({ SpeechRecognition: 'yes' }), false);
  assert.equal(isStoryboard3DVoiceInputSupported({}), false);
});

test('语音输入：不支持时 start 抛错并回报错误码', () => {
  const errors = [];
  const states = [];
  const service = new Storyboard3DVoiceInputService({
    windowObject: {},
    onStateChange: (payload) => states.push(payload.state),
    onError: (payload) => errors.push(payload),
  });
  assert.equal(service.isSupported(), false);
  assert.throws(
    () => service.start(),
    (error) => {
      assert.equal(error.code, 'speech-recognition-unsupported');
      assert.equal(error.message, '当前运行环境不支持语音转文字。');
      return true;
    },
  );
  assert.deepEqual(states, ['error']);
  assert.deepEqual(errors, [
    { error: 'speech-recognition-unsupported', message: '当前运行环境不支持语音转文字。' },
  ]);
});

test('语音输入：start 绑定参数并推进状态到监听中', () => {
  const states = [];
  const service = new Storyboard3DVoiceInputService({
    windowObject: supportedWindow(),
    lang: 'en-US',
    continuous: true,
    onStateChange: (payload) => states.push(payload.state),
  });
  assert.equal(service.start(), true);
  const recognition = FakeRecognition.instances[0];
  assert.equal(recognition.lang, 'en-US');
  assert.equal(recognition.continuous, true);
  assert.equal(recognition.interimResults, true);
  assert.equal(recognition.maxAlternatives, 1);
  assert.equal(recognition.started, true);
  assert.deepEqual(states, ['starting', 'listening']);
  assert.equal(service.state, 'listening');
  assert.equal(service.start(), false);
  assert.equal(FakeRecognition.instances.length, 1);
});

test('语音输入：start 内部异常回滚为错误态', () => {
  const errors = [];
  const states = [];
  const service = new Storyboard3DVoiceInputService({
    windowObject: { SpeechRecognition: FailingRecognition },
    onStateChange: (payload) => states.push(payload.state),
    onError: (payload) => errors.push(payload),
  });
  assert.throws(() => service.start(), /audio busy/);
  assert.equal(service.recognition, null);
  assert.deepEqual(states, ['starting', 'error']);
  assert.deepEqual(errors, [{ error: 'start-failed', message: 'audio busy' }]);
});

test('语音输入：onresult 累积最终文本并输出中间态', () => {
  const transcripts = [];
  const service = new Storyboard3DVoiceInputService({
    windowObject: supportedWindow(),
    onTranscript: (payload) => transcripts.push(payload),
  });
  service.start();
  service.recognition.onresult(result([{ text: '  你好  ', isFinal: true }]));
  assert.deepEqual(transcripts[0], {
    transcript: '你好',
    finalText: '你好',
    interimText: '',
    isFinal: true,
  });

  service.recognition.onresult(
    result([
      { text: '你好', isFinal: true },
      { text: '世', isFinal: false },
    ]),
  );
  assert.deepEqual(transcripts[1], {
    transcript: '你好 你好 世',
    finalText: '你好 你好',
    interimText: '世',
    isFinal: false,
  });
});

test('语音输入：start 默认清空上轮文本，可显式保留', () => {
  const service = new Storyboard3DVoiceInputService({ windowObject: supportedWindow() });
  service.start();
  service.recognition.onresult(result([{ text: '第一条', isFinal: true }]));
  service.recognition.onend();
  service.start();
  assert.equal(service.finalTranscript, '');
  service.recognition.onresult(result([{ text: '第二条', isFinal: true }]));
  assert.equal(service.finalTranscript, '第二条');
  service.recognition.onend();
  service.start({ resetTranscript: false });
  assert.equal(service.finalTranscript, '第二条');
});

test('语音输入：onerror 对无声与中止静默，其余上报', () => {
  const errors = [];
  const states = [];
  const service = new Storyboard3DVoiceInputService({
    windowObject: supportedWindow(),
    onStateChange: (payload) => states.push(payload.state),
    onError: (payload) => errors.push(payload),
  });
  service.start();
  service.recognition.onerror({ error: 'no-speech' });
  assert.equal(service.state, 'idle');
  assert.deepEqual(errors, []);
  assert.deepEqual(states, ['starting', 'listening', 'idle']);

  service.start();
  service.recognition.onerror({ error: 'network', message: '掉了' });
  assert.equal(service.state, 'error');
  assert.deepEqual(errors, [{ error: 'network', message: '掉了' }]);

  service.start();
  service.recognition.onerror({});
  assert.deepEqual(errors[1], { error: 'recognition-error', message: '' });
});

test('语音输入：onend 复位识别对象并携带停止标志', () => {
  const states = [];
  const service = new Storyboard3DVoiceInputService({
    windowObject: supportedWindow(),
    onStateChange: (payload) => states.push(payload),
  });
  service.start();
  const recognition = service.recognition;
  assert.equal(service.stop(), true);
  assert.equal(recognition.stopped, true);
  assert.equal(service.state, 'stopping');
  recognition.onend();
  assert.equal(service.recognition, null);
  assert.deepEqual(states.at(-1), { state: 'idle', transcript: '', stopped: true });
  assert.equal(service.stop(), false);
});

test('语音输入：abort 与 destroy 释放监听', () => {
  const service = new Storyboard3DVoiceInputService({ windowObject: supportedWindow() });
  assert.equal(service.abort(), false);
  service.start();
  const recognition = service.recognition;
  assert.equal(service.abort(), true);
  assert.equal(recognition.aborted, true);
  service.destroy();
  assert.equal(service.recognition, null);
  assert.equal(recognition.onstart, null);
  assert.equal(recognition.onresult, null);
  assert.equal(recognition.onerror, null);
  assert.equal(recognition.onend, null);
  assert.equal(service.state, 'idle');
});

test('语音输入：工厂函数返回同型实例', () => {
  const service = createStoryboard3DVoiceInputService({ windowObject: supportedWindow() });
  assert.ok(service instanceof Storyboard3DVoiceInputService);
  assert.equal(service.lang, 'zh-CN');
  assert.equal(service.continuous, false);
});
