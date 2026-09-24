import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import os from 'node:os';
import { runToolCapture } from './toolCapture.js';

const NODE = process.execPath;
const NODE_ARGS = (script) => ['-e', script];

test('resolves the captured stdout as a Buffer on a zero exit code', async () => {
  const output = await runToolCapture(NODE, NODE_ARGS("process.stdout.write('hello-capture')"));
  assert.ok(Buffer.isBuffer(output));
  assert.equal(output.toString('utf8'), 'hello-capture');
});

test('concatenates multiple stdout chunks in order', async () => {
  const output = await runToolCapture(
    NODE,
    NODE_ARGS("process.stdout.write('a');setTimeout(()=>process.stdout.write('b'),20)"),
  );
  assert.equal(output.toString('utf8'), 'ab');
});

test('rejects with the trimmed stderr text on a non-zero exit code', async () => {
  await assert.rejects(
    () =>
      runToolCapture(
        NODE,
        NODE_ARGS("process.stderr.write('boom\\n');process.exit(3)"),
      ),
    (error) => {
      assert.equal(error.message, 'boom');
      return true;
    },
  );
});

test('falls back to the command description when stderr is empty', async () => {
  await assert.rejects(
    () => runToolCapture(NODE, NODE_ARGS('process.exit(7)')),
    (error) => {
      assert.ok(error.message.includes('exited with 7'), error.message);
      assert.ok(error.message.startsWith(NODE), error.message);
      return true;
    },
  );
});

test('rejects with the spawn error when the command cannot be started', async () => {
  await assert.rejects(
    () => runToolCapture('canvaspro-definitely-missing-binary-xyz', []),
    (error) => {
      assert.equal(error.code, 'ENOENT');
      return true;
    },
  );
});

test('kills the child and rejects with ToolCaptureTimeoutError when timeoutMs elapses', async () => {
  const startedAt = Date.now();
  await assert.rejects(
    () => runToolCapture(NODE, NODE_ARGS('setTimeout(()=>{},5000)'), { timeoutMs: 120 }),
    (error) => {
      assert.equal(error.name, 'ToolCaptureTimeoutError');
      assert.equal(error.code, 'TOOL_CAPTURE_TIMEOUT');
      assert.equal(error.timeoutMs, 120);
      assert.equal(error.message, NODE + ' timed out after 120ms');
      return true;
    },
  );
  assert.ok(Date.now() - startedAt < 4000, 'the call must not wait for the child to finish');
});

test('a non-positive or unparsable timeoutMs disables the timer', async () => {
  const script = "setTimeout(()=>process.stdout.write('late'),150)";
  for (const timeoutMs of [0, -5, 'abc']) {
    const output = await runToolCapture(NODE, NODE_ARGS(script), { timeoutMs: timeoutMs });
    assert.equal(output.toString('utf8'), 'late', 'timeoutMs=' + String(timeoutMs));
  }
});

test('writes the input to the child stdin when input is provided', async () => {
  const output = await runToolCapture(
    NODE,
    NODE_ARGS(
      "let data='';process.stdin.on('data',(chunk)=>(data+=chunk));" +
        "process.stdin.on('end',()=>process.stdout.write('got:'+data))",
    ),
    { input: 'ping-payload' },
  );
  assert.equal(output.toString('utf8'), 'got:ping-payload');
});

test('an empty string input still opens the stdin pipe', async () => {
  const output = await runToolCapture(
    NODE,
    NODE_ARGS(
      "let data='';process.stdin.on('data',(chunk)=>(data+=chunk));" +
        "process.stdin.on('end',()=>process.stdout.write('len:'+data.length))",
    ),
    { input: '' },
  );
  assert.equal(output.toString('utf8'), 'len:0');
});

test('a closed-pipe stdin write surfaces unless the code is EPIPE', async () => {
  // The ported guard only swallows code 'EPIPE'. libuv on win32 reports a write to a
  // closed pipe as 'EOF' (errno -4095), so a child that exits before draining stdin makes
  // the capture reject here. No repo caller passes `input`, so this is dormant.
  await assert.rejects(
    () => runToolCapture(NODE, NODE_ARGS('process.exit(0)'), { input: 'x'.repeat(0x100000) }),
    (error) => {
      assert.ok(['EPIPE', 'EOF'].includes(error.code), 'unexpected code ' + String(error.code));
      return true;
    },
  );
});

test('runs the child in the requested cwd', async () => {
  const output = await runToolCapture(NODE, NODE_ARGS('process.stdout.write(process.cwd())'), {
    cwd: os.tmpdir(),
  });
  assert.equal(realpathSync(output.toString('utf8')), realpathSync(os.tmpdir()));
});
