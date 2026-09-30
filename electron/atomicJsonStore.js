import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/** Same-directory atomic publication; a failed write must never truncate identity/settings. */
export function writeJsonAtomicallySync(filename, value, { io = fs } = {}) {
  let previous;
  try { previous = io.readFileSync(filename); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous) {
    try { JSON.parse(previous.toString('utf8').replace(/^\uFEFF/, '')); }
    catch { throw Object.assign(new Error('Refusing to replace malformed JSON; restore the previous valid copy first'), { code: 'CORRUPT_JSON_FILE' }); }
  }
  const payload = Buffer.from(JSON.stringify(value, null, 2), 'utf8');
  io.mkdirSync(path.dirname(filename), { recursive: true });
  function replace(destination, bytes) {
    const temporary = path.join(path.dirname(destination), `.${path.basename(destination)}.${randomUUID()}.tmp`);
    let descriptor;
    try {
      descriptor = io.openSync(temporary, 'wx', 0o600);
      io.writeFileSync(descriptor, bytes);
      io.fsyncSync(descriptor);
      io.closeSync(descriptor); descriptor = undefined;
      io.renameSync(temporary, destination);
    } finally {
      if (descriptor !== undefined) { try { io.closeSync(descriptor); } catch {} }
      try { io.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  if (previous) replace(filename + '.bak', previous);
  replace(filename, payload);
}
