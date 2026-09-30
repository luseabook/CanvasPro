// Used only by the full offline unit-test runner, never by the application.
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');
const localPorts = new Set();
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  this.once('listening', () => { const address = this.address(); if (address && typeof address === 'object') localPorts.add(address.port); });
  return listen.apply(this, args);
};
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const normalized = Array.isArray(args[0]) ? args[0] : args;
  const first = normalized[0];
  const options = first && typeof first === 'object' ? first : { port: first, host: typeof normalized[1] === 'string' ? normalized[1] : 'localhost' };
  const host = String(options.host || 'localhost').toLowerCase();
  const ipc = options.path || (typeof first === 'string' && !/^\d+$/.test(first) ? first : '');
  const local = ['localhost','127.0.0.1','::1','[::1]'].includes(host);
  if (ipc || (local && localPorts.has(Number(options.port)))) return connect.apply(this, args);
  throw Object.assign(new Error('Real network/model calls are disabled in the offline unit suite; use a mock or an owned local fixture server'), { code: 'OFFLINE_TEST_NETWORK_BLOCKED' });
};
const sandbox = path.resolve(process.env.AIC_TEST_SANDBOX_ROOT || '');
if (!process.env.AIC_TEST_SANDBOX_ROOT) throw new Error('Missing isolated test sandbox');
function check(file) {
  if (typeof file === 'number') return; // Already opened descriptors and stdio.
  if (file instanceof URL) file = fileURLToPath(file);
  if (Buffer.isBuffer(file)) file = file.toString();
  if (typeof file !== 'string') return;
  const relative = path.relative(sandbox, path.resolve(file));
  if (relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) return;
  throw Object.assign(new Error('Full unit suite refused a write outside its isolated copy'), { code: 'OFFLINE_TEST_WRITE_OUTSIDE_SANDBOX' });
}
const single = ['writeFile','appendFile','mkdir','mkdtemp','rm','rmdir','unlink','truncate','chmod','chown','utimes'];
for (const name of single) {
  if (typeof fs[name+'Sync'] === 'function') { const original = fs[name+'Sync']; fs[name+'Sync'] = function (file,...args) { check(file); return original.call(this,file,...args); }; }
  if (typeof fs[name] === 'function') { const original = fs[name]; fs[name] = function (file,...args) { check(file); return original.call(this,file,...args); }; }
  if (typeof fs.promises[name] === 'function') { const original = fs.promises[name]; fs.promises[name] = async function (file,...args) { check(file); return original.call(this,file,...args); }; }
}
for (const name of ['rename','copyFile','cp','link','symlink']) {
  const validate = (source, destination) => { if (name === 'rename') check(source); check(destination); };
  if (typeof fs[name+'Sync'] === 'function') { const original = fs[name+'Sync']; fs[name+'Sync'] = function (a,b,...args) { validate(a,b); return original.call(this,a,b,...args); }; }
  if (typeof fs[name] === 'function') { const original = fs[name]; fs[name] = function (a,b,...args) { validate(a,b); return original.call(this,a,b,...args); }; }
  if (typeof fs.promises[name] === 'function') { const original = fs.promises[name]; fs.promises[name] = async function (a,b,...args) { validate(a,b); return original.call(this,a,b,...args); }; }
}
for (const name of ['open','openSync']) {
  const original = fs[name];
  fs[name] = function (file, flags,...args) { if (typeof flags === 'number' ? !!(flags & (fs.constants.O_WRONLY|fs.constants.O_RDWR|fs.constants.O_CREAT)) : /[wa+]/.test(String(flags))) check(file); return original.call(this,file,flags,...args); };
}
const open = fs.promises.open;
fs.promises.open = async function (file,flags,...args) { if (typeof flags === 'number' ? !!(flags & (fs.constants.O_WRONLY|fs.constants.O_RDWR|fs.constants.O_CREAT)) : /[wa+]/.test(String(flags))) check(file); return open.call(this,file,flags,...args); };
const stream = fs.createWriteStream;
fs.createWriteStream = function (file,...args) { check(file); return stream.call(this,file,...args); };
syncBuiltinESMExports();
