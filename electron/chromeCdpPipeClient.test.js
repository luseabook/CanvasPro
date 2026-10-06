import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createChromeCdpPipeClient, __chromeCdpPipeClientForTest } from './chromeCdpPipeClient.js';

const NUL = '\x00';

function createHarness({ commandTimeoutMs = 0, logEvent = null } = {}) {
  const readable = new EventEmitter(),
    frames = [];
  const writable = new EventEmitter();
  writable.write = (chunk, encoding) => {
    frames.push({ chunk, encoding });
    return true;
  };
  const client = createChromeCdpPipeClient({
    readable: readable,
    writable: writable,
    commandTimeoutMs: commandTimeoutMs,
    logEvent: logEvent,
  });
  return { readable, writable, frames, client };
}

function createFakeTimers() {
  const timers = [],
    cleared = [];
  return {
    timers,
    cleared,
    setTimeoutFn(callback, delay) {
      const token = { callback, delay };
      timers.push(token);
      return token;
    },
    clearTimeoutFn(token) {
      cleared.push(token);
    },
  };
}

function frameOf(frames, index) {
  const entry = frames[index];
  assert.equal(entry.encoding, 'utf8', 'the frame must be written as utf8');
  assert.ok(entry.chunk.endsWith(NUL), 'the frame must be NUL terminated');
  return JSON.parse(entry.chunk.slice(0, -1));
}

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

test('requires a readable pipe that can listen', () => {
  assert.throws(() => createChromeCdpPipeClient(), {
    name: 'TypeError',
    message: 'Chrome CDP readable pipe is required',
  });
  assert.throws(() => createChromeCdpPipeClient({ readable: {} }), {
    name: 'TypeError',
    message: 'Chrome CDP readable pipe is required',
  });
});

test('requires a writable pipe that can write', () => {
  assert.throws(() => createChromeCdpPipeClient({ readable: new EventEmitter() }), {
    name: 'TypeError',
    message: 'Chrome CDP writable pipe is required',
  });
  assert.throws(() => createChromeCdpPipeClient({ readable: new EventEmitter(), writable: {} }), {
    name: 'TypeError',
    message: 'Chrome CDP writable pipe is required',
  });
});

test('send writes a NUL terminated JSON frame and resolves with the matching result', async () => {
  const { readable, frames, client } = createHarness();
  const promise = client.send('Page.navigate', { url: 'about:blank' }, 'SESSION-1');
  assert.equal(frames.length, 1);
  assert.deepEqual(frameOf(frames, 0), {
    id: 1,
    method: 'Page.navigate',
    params: { url: 'about:blank' },
    sessionId: 'SESSION-1',
  });
  readable.emit('data', JSON.stringify({ id: 1, result: { frameId: 'F1' } }) + NUL);
  assert.deepEqual(await promise, { frameId: 'F1' });
});

test('request ids increase and each response settles only its own request', async () => {
  const { readable, frames, client } = createHarness();
  const first = client.send('Runtime.enable'),
    second = client.send('Runtime.evaluate', { expression: '1' });
  assert.equal(frameOf(frames, 0).id, 1);
  assert.equal(frameOf(frames, 1).id, 2);
  readable.emit('data', JSON.stringify({ id: 2, result: { value: 2 } }) + NUL);
  assert.deepEqual(await second, { value: 2 });
  readable.emit('data', JSON.stringify({ id: 1, result: { ok: true } }) + NUL);
  assert.deepEqual(await first, { ok: true });
});

test('an omitted or non-object params argument is normalized to an empty object', async () => {
  const { frames, client } = createHarness();
  client.send('A');
  client.send('B', null);
  client.send('C', 'nope');
  client.send('D', 5);
  assert.deepEqual(frameOf(frames, 0).params, {});
  assert.deepEqual(frameOf(frames, 1).params, {});
  assert.deepEqual(frameOf(frames, 2).params, {});
  assert.deepEqual(frameOf(frames, 3).params, {});
});

test('a falsy sessionId is omitted and a non-string method is coerced', async () => {
  const { frames, client } = createHarness();
  client.send(123, {}, '');
  client.send(456, {}, 0);
  assert.equal(frameOf(frames, 0).method, '123');
  assert.equal('sessionId' in frameOf(frames, 0), false);
  assert.equal(frameOf(frames, 1).method, '456');
  assert.equal('sessionId' in frameOf(frames, 1), false);
});

test('a blank method rejects without writing a frame', async () => {
  const { frames, client } = createHarness();
  for (const method of ['', 0, undefined, null]) {
    const promise = client.send(method);
    await assert.rejects(promise, { message: 'Chrome CDP method is required' });
  }
  assert.equal(frames.length, 0);
});

test('an event frame fans out to every registered handler', async () => {
  const { readable, client } = createHarness();
  const seen = [],
    off = client.onEvent((message) => seen.push(['first', message.method])),
    offSecond = client.onEvent((message) => seen.push(['second', message.method]));
  readable.emit('data', JSON.stringify({ method: 'Page.loadEventFired', params: { ts: 7 } }) + NUL);
  assert.deepEqual(seen, [
    ['first', 'Page.loadEventFired'],
    ['second', 'Page.loadEventFired'],
  ]);
  off();
  readable.emit('data', JSON.stringify({ method: 'Page.loadEventFired' }) + NUL);
  assert.equal(seen.length, 3);
  assert.deepEqual(seen[2], ['second', 'Page.loadEventFired']);
  offSecond();
});

test('a throwing event handler does not stop the remaining handlers', () => {
  const { readable, client } = createHarness();
  const seen = [];
  client.onEvent(() => {
    throw new Error('handler exploded');
  });
  client.onEvent((message) => seen.push(message.method));
  readable.emit('data', JSON.stringify({ method: 'Runtime.executionContextCreated' }) + NUL);
  assert.deepEqual(seen, ['Runtime.executionContextCreated']);
});

test('a frame with neither an id nor a method is ignored', () => {
  const { readable, client } = createHarness();
  const seen = [];
  client.onEvent((message) => seen.push(message));
  assert.doesNotThrow(() => readable.emit('data', JSON.stringify({ params: {} }) + NUL));
  assert.deepEqual(seen, []);
});

test('a response for an unknown id is ignored without throwing', async () => {
  const { readable, client } = createHarness();
  const promise = client.send('Runtime.enable');
  readable.emit('data', JSON.stringify({ id: 99, result: { ignored: true } }) + NUL);
  readable.emit('data', JSON.stringify({ id: 1, result: { ok: true } }) + NUL);
  assert.deepEqual(await promise, { ok: true });
  assert.doesNotThrow(() => readable.emit('data', JSON.stringify({ id: 1, result: {} }) + NUL));
});

test('a NUL split across two chunks is reassembled before dispatch', async () => {
  const { readable, client } = createHarness();
  const state = { settled: false };
  const promise = client.send('Runtime.evaluate');
  promise.then(
    () => {
      state.settled = true;
    },
    () => {
      state.settled = true;
    },
  );
  readable.emit('data', '{"id":1,"resu');
  await flushMicrotasks();
  assert.equal(state.settled, false, 'the half frame must not settle anything');
  readable.emit('data', 'lt":{"value":7}}' + NUL);
  assert.deepEqual(await promise, { value: 7 });
});

test('two frames in one chunk are both dispatched and an empty segment is skipped', async () => {
  const { readable, client } = createHarness();
  const events = [];
  client.onEvent((message) => events.push(message.method));
  const promise = client.send('A');
  readable.emit(
    'data',
    Buffer.from(
      NUL + JSON.stringify({ method: 'X' }) + NUL + NUL + JSON.stringify({ id: 1, result: {} }) + NUL,
      'utf8',
    ),
  );
  assert.deepEqual(events, ['X']);
  assert.deepEqual(await promise, {});
});

test('an unparsable frame is reported and later frames still dispatch', async () => {
  const logged = [];
  const { readable, client } = createHarness({ logEvent: (event) => logged.push(event) });
  const promise = client.send('Runtime.enable');
  readable.emit('data', 'not-json' + NUL);
  assert.equal(logged.length, 1);
  assert.equal(logged[0].type, 'chrome_cdp.invalid_message');
  assert.equal(logged[0].level, 'warn');
  assert.equal(logged[0].source, 'main');
  assert.equal(logged[0].message, 'Chrome CDP pipe returned an invalid message');
  assert.ok(logged[0].error instanceof SyntaxError, 'the parse failure must be forwarded');
  readable.emit('data', JSON.stringify({ id: 1, result: {} }) + NUL);
  assert.deepEqual(await promise, {});
});

test('an unparsable frame without a logEvent callback is still tolerated', () => {
  const { readable, client } = createHarness();
  assert.doesNotThrow(() => readable.emit('data', '{{{' + NUL));
  assert.equal(client.closed, false);
});

test('a protocol error rejects with the message, code and data from the response', async () => {
  const { readable, client } = createHarness();
  const promise = client.send('Page.navigate', {});
  readable.emit(
    'data',
    JSON.stringify({ id: 1, error: { message: 'Cannot navigate', code: -32000, data: { detail: 'x' } } }) +
      NUL,
  );
  await assert.rejects(promise, (error) => {
    assert.equal(error.message, 'Cannot navigate');
    assert.equal(error.code, -32000);
    assert.deepEqual(error.data, { detail: 'x' });
    return true;
  });
});

test('an error response without a message falls back to the protocol default', async () => {
  const { readable, client } = createHarness();
  const promise = client.send('Page.navigate');
  readable.emit('data', JSON.stringify({ id: 1, error: {} }) + NUL);
  await assert.rejects(promise, (error) => {
    assert.equal(error.message, 'Chrome DevTools Protocol command failed');
    assert.equal('code' in error, false);
    assert.equal('data' in error, false);
    return true;
  });
});

test('createProtocolError only copies a non-null code and data', () => {
  const { createProtocolError } = __chromeCdpPipeClientForTest;
  const empty = createProtocolError();
  assert.equal(empty.message, 'Chrome DevTools Protocol command failed');
  assert.equal('code' in empty, false);
  assert.equal('data' in empty, false);
  const partial = createProtocolError({ message: 'm', code: null, data: undefined });
  assert.equal(partial.message, 'm');
  assert.equal('code' in partial, false);
  assert.equal('data' in partial, false);
  const falsyCode = createProtocolError({ message: 'm', code: 0, data: false });
  assert.equal(falsyCode.code, 0);
  assert.equal(falsyCode.data, false);
});

test('the default command timeout is 15000 ms', async () => {
  const timers = createFakeTimers(),
    readable = new EventEmitter(),
    frames = [];
  const client = createChromeCdpPipeClient({
    readable: readable,
    writable: {
      write: (chunk, encoding) => {
        frames.push({ chunk, encoding });
        return true;
      },
    },
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = client.send('Runtime.enable');
  assert.equal(frames.length, 1);
  assert.equal(timers.timers.length, 1);
  assert.equal(timers.timers[0].delay, 15000);
  timers.timers[0].callback();
  await assert.rejects(promise, { message: 'Chrome CDP command timed out: Runtime.enable' });
});

test('a command timeout rejects and drops the pending entry', async () => {
  const timers = createFakeTimers();
  const { readable, frames } = createHarness();
  const client = createChromeCdpPipeClient({
    readable: readable,
    writable: {
      write: (chunk, encoding) => {
        frames.push({ chunk, encoding });
        return true;
      },
    },
    commandTimeoutMs: 500,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = client.send('Runtime.evaluate');
  assert.equal(timers.timers.length, 1);
  assert.equal(timers.timers[0].delay, 500);
  timers.timers[0].callback();
  await assert.rejects(promise, { message: 'Chrome CDP command timed out: Runtime.evaluate' });
  assert.deepEqual(timers.cleared, [timers.timers[0]]);
  readable.emit('data', JSON.stringify({ id: 1, result: { late: true } }) + NUL);
  assert.equal(client.closed, false);
});

test('a non-positive or unparsable command timeout disables the timer', async () => {
  const timers = createFakeTimers();
  for (const commandTimeoutMs of [0, -5, 'abc']) {
    const { readable, frames } = createHarness();
    const client = createChromeCdpPipeClient({
      readable: readable,
      writable: {
        write: (chunk, encoding) => {
          frames.push({ chunk, encoding });
          return true;
        },
      },
      commandTimeoutMs: commandTimeoutMs,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });
    const promise = client.send('Runtime.enable');
    assert.equal(timers.timers.length, 0, 'no timer for commandTimeoutMs=' + String(commandTimeoutMs));
    assert.equal(frames.length, 1);
    readable.emit('data', JSON.stringify({ id: 1, result: {} }) + NUL);
    assert.deepEqual(await promise, {});
  }
});

test('a synchronous write failure rejects that request and clears its timer', async () => {
  const timers = createFakeTimers();
  const readable = new EventEmitter();
  const writeError = new Error('EPIPE on write');
  const client = createChromeCdpPipeClient({
    readable: readable,
    writable: {
      write() {
        throw writeError;
      },
    },
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = client.send('Runtime.enable');
  await assert.rejects(promise, (error) => error === writeError);
  assert.deepEqual(timers.cleared, [timers.timers[0]]);
});

test('closing the client rejects every pending request with the reason', async () => {
  const { readable, client } = createHarness();
  const first = client.send('A'),
    second = client.send('B');
  assert.equal(client.closed, false);
  client.close('bye now');
  assert.equal(client.closed, true);
  await assert.rejects(first, { message: 'bye now' });
  await assert.rejects(second, { message: 'bye now' });
});

test('closing uses the default reason, is idempotent and stops event delivery', async () => {
  const { readable, client } = createHarness();
  const seen = [];
  client.onEvent((message) => seen.push(message.method));
  const promise = client.send('A');
  client.close();
  assert.equal(client.closed, true);
  await assert.rejects(promise, { message: 'Chrome CDP pipe closed' });
  assert.doesNotThrow(() => client.close());
  assert.doesNotThrow(() => readable.emit('data', JSON.stringify({ method: 'X' }) + NUL));
  assert.deepEqual(seen, []);
});

test('a send after close rejects and onEvent returns an inert unsubscribe', async () => {
  const { client } = createHarness();
  client.close();
  await assert.rejects(client.send('A'), { message: 'Chrome CDP pipe is closed' });
  assert.equal(typeof client.onEvent(() => {}), 'function');
  assert.equal(typeof client.onEvent('not-a-function'), 'function');
  assert.equal(typeof client.onEvent(null), 'function');
});

test('a readable end or close settles pending requests and marks the client closed', async () => {
  for (const eventName of ['end', 'close']) {
    const { readable, client } = createHarness();
    const promise = client.send('A');
    readable.emit(eventName);
    assert.equal(client.closed, true, eventName);
    await assert.rejects(promise, { message: 'Chrome CDP pipe closed' });
  }
});

test('a writable close settles pending requests too', async () => {
  const { writable, client } = createHarness();
  const promise = client.send('A');
  writable.emit('close');
  assert.equal(client.closed, true);
  await assert.rejects(promise, { message: 'Chrome CDP pipe closed' });
});

test('a pipe error is reported and rejects pending requests with its message', async () => {
  const logged = [];
  const { readable, client } = createHarness({ logEvent: (event) => logged.push(event) });
  const promise = client.send('A');
  readable.emit('error', new Error('pipe broke'));
  assert.equal(client.closed, true);
  assert.equal(logged.length, 1);
  assert.equal(logged[0].type, 'chrome_cdp.pipe_error');
  assert.equal(logged[0].level, 'warn');
  assert.equal(logged[0].source, 'main');
  assert.equal(logged[0].message, 'Chrome CDP pipe failed');
  await assert.rejects(promise, { message: 'pipe broke' });
});

test('a non-Error pipe failure falls back to the raw value then to a default reason', async () => {
  const raw = createHarness();
  const rawPromise = raw.client.send('A');
  raw.readable.emit('error', 'pipe-broke');
  await assert.rejects(rawPromise, { message: 'pipe-broke' });

  const blank = createHarness();
  const blankPromise = blank.client.send('A');
  blank.readable.emit('error', null);
  await assert.rejects(blankPromise, { message: 'Chrome CDP pipe failed' });
});

test('unsubscribing an event handler stops delivery', () => {
  const { readable, client } = createHarness();
  const seen = [];
  const off = client.onEvent((message) => seen.push(message.method));
  readable.emit('data', JSON.stringify({ method: 'A' }) + NUL);
  off();
  readable.emit('data', JSON.stringify({ method: 'B' }) + NUL);
  assert.deepEqual(seen, ['A']);
});
