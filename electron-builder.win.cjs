const path = require('node:path');

module.exports = {
  // 换牌后的独立产品标识：appId 变化意味着这是与旧 AI CanvasPro 安装**并列**的新产品，
  // 不会覆盖旧安装；用户数据由 electron/brandDataMigration.js 从旧目录自动迁移。
  appId: 'com.oneframe.app',
  productName: '一帧 OneFrame',
  copyright: 'Copyright (c) 2026 一帧 OneFrame',
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
    artifactName: 'OneFrame-${version}-win-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '一帧 OneFrame',
    include: path.join(__dirname, 'build', 'installer.nsh'),
    artifactName: 'OneFrame-Setup-${version}-${arch}.${ext}',
  },
};
