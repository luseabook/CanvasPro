import path from 'node:path';
import { randomBytes } from 'node:crypto';

// A renderer only receives an opaque, single-use handle to an OS-selected package.
const TTL_MS = 10 * 60 * 1000;
const MAX_PENDING = 32;
export function createExternalPackageTickets({ now = Date.now } = {}) {
  const pending = new Map();
  return {
    issueRequest(packagePath, source) {
      if (typeof packagePath !== 'string' || !path.isAbsolute(packagePath) ||
          path.extname(packagePath).toLowerCase() !== '.aicpkg') throw new Error('系统工程包路径无效');
      const timestamp = now();
      for (const [ticket, record] of pending) if (timestamp >= record.expiresAt) pending.delete(ticket);
      if (pending.size >= MAX_PENDING) throw new Error('待处理的系统工程包过多，请先处理已有请求');
      const ticket = randomBytes(24).toString('hex');
      pending.set(ticket, { packagePath: path.resolve(packagePath), expiresAt: timestamp + TTL_MS });
      return { success: true, canceled: false, kind: 'fullProjectPackage', externalPackageTicket: ticket,
        filename: path.basename(packagePath), source };
    },
    consume(ticket) {
      const record = typeof ticket === 'string' && /^[a-f0-9]{48}$/.test(ticket) ? pending.get(ticket) : null;
      if (record) pending.delete(ticket);
      if (!record || now() >= record.expiresAt) throw new Error('系统工程包请求已失效或已使用；请重新从系统打开，或从菜单原生选择包');
      return record.packagePath;
    },
  };
}
