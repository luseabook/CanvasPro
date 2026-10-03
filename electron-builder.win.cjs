const path = require('node:path');

module.exports = {
  // Preserve the existing bundle identity so installs upgrade in place.
  appId: 'com.aicanvaspro.editor',
  productName: 'Canvas',
  copyright: 'Copyright (c) 2026 Canvas',
  asar: false,
  afterSign: path.join(__dirname, 'build', 'write-install-manifest.cjs'),
  directories: {
    output: 'dist-win',
  },
  publish: [
    {
      provider: 'github',
      owner: 'luseaer-ship-it',
      repo: 'CanvasPro',
    },
  ],
  files: [
    'api/**/*',
    'assets/**/*',
    'backend/**/*',
    'db/**/*',
    'electron/**/*',
    'images/**/*',
    'native/**/*',
    'src/**/*',
    'styles/**/*',
    'vendor/**/*',
    'index.html',
    'style.css',
    'main.js',
    'server.py',
    'requirements.txt',
    'release_notes.txt',
    'package.json',
    '!**/*.test.js',
    '!**/*.test.mjs',
    '!**/*.spec.js',
    '!**/*.map',
    '!**/*.pyc',
    '!**/test_*.py',
    '!**/__pycache__/**',
    '!**/tests/**',
    '!**/test-results/**',
    '!**/playwright-report/**',
  ],
  extraResources: [
    {
      from: '.electron-runtime/runtime',
      to: 'runtime',
    },
  ],
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'zip', arch: ['x64'] },
    ],
    icon: path.join(__dirname, 'build', 'app-icon.ico'),
    requestedExecutionLevel: 'asInvoker',
    artifactName: 'Canvas-${version}-win-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Canvas',
    include: path.join(__dirname, 'build', 'installer.nsh'),
    artifactName: 'Canvas-Setup-${version}-${arch}.${ext}',
  },
};
