const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
module.exports = async function writeInstallManifest(context) {
  if (context.electronPlatformName !== 'win32') return;
  const root = context.appOutDir, files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Uninstall manifest refuses linked program files');
      if (entry.isDirectory()) walk(file);
      else if (entry.name !== 'app-files-manifest.json') files.push({ path: path.relative(root,file).split(path.sep).join('/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
    }
  }
  walk(root); files.sort((a,b)=>a.path.localeCompare(b.path));
  fs.writeFileSync(path.join(root,'app-files-manifest.json'),JSON.stringify({schema:1,version:context.packager.appInfo.version,files},null,2));
};
