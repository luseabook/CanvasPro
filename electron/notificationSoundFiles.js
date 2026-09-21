import { mkdirSync, realpathSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
function normalizeText(_0x2e94a7, _0x14e7ce = 0x400) {
  return String(_0x2e94a7 || '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, _0x14e7ce);
}
export async function listNotificationSoundMp3Files(_0x11cb7c = {}) {
  const _0x48fd32 = normalizeText(_0x11cb7c?.directory);
  if (!_0x48fd32) return { success: true, files: [] };
  if (!path.isAbsolute(_0x48fd32)) throw new Error('提示音目录必须是绝对路径');
  const _0x5aae69 = realpathSync(_0x48fd32),
    _0x2b5b21 = statSync(_0x5aae69);
  if (!_0x2b5b21.isDirectory()) throw new Error('提示音目录不存在或不是文件夹');
  const _0x29063b = readdirSync(_0x5aae69, { withFileTypes: true })
    .filter((_0xbc3944) => _0xbc3944.isFile() && /\.mp3$/i.test(_0xbc3944.name))
    .map((_0x51b98d) => ({ name: _0x51b98d.name, path: path.join(_0x5aae69, _0x51b98d.name) }))
    .sort((_0x5b5bae, _0x2ba928) => _0x5b5bae.name.localeCompare(_0x2ba928.name, 'zh-Hans-CN'))
    .slice(0, 200);
  return { success: true, directory: _0x5aae69, files: _0x29063b };
}
export function createSystemNotificationSoundFileService({ appRoot: _0x5b5c96, openPath: _0x2a5bfd } = {}) {
  const _0x597bef = () => path.join(_0x5b5c96 || '.', 'assets', 'sounds');
  return {
    listSystemNotificationSoundFiles() {
      return listNotificationSoundMp3Files({ directory: _0x597bef() });
    },
    async openSystemNotificationSoundFolder() {
      const _0x328670 = _0x597bef();
      mkdirSync(_0x328670, { recursive: true });
      if (typeof _0x2a5bfd === 'function') await _0x2a5bfd(_0x328670);
      return { success: true, path: _0x328670 };
    },
  };
}
