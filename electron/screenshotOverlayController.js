import { BrowserWindow, desktopCapturer, globalShortcut, screen } from 'electron';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
export function createScreenshotOverlayController({
  appRoot: _0x4957f9,
  dirname: _0x460c18,
  accelerator: _0x2ad8dd,
  getMainWindow: _0x31301d,
  logDiagnosticEvent: _0x6d568c,
}) {
  let _0x34de2b = null,
    _0x3e6910 = null,
    _0x2fcf8e = null,
    _0x2b05fa = '',
    _0x25300f = false,
    _0x2e6c76 = { ok: false, registered: false, accelerator: _0x2ad8dd, reason: 'not-registered' };
  async function _0x146a4b() {
    const _0x76225 = screen.getCursorScreenPoint(),
      _0x8c4f0c = screen.getDisplayNearestPoint(_0x76225),
      _0x41c748 = Number(_0x8c4f0c?.scaleFactor || 1) || 1,
      _0x493532 = _0x8c4f0c?.bounds || { x: 0, y: 0, width: 0, height: 0 },
      _0x323e7d = {
        width: Math.max(1, Math.round(Number(_0x493532.width || 1) * _0x41c748)),
        height: Math.max(1, Math.round(Number(_0x493532.height || 1) * _0x41c748)),
      },
      _0x1f922e = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: _0x323e7d }),
      _0x124ab4 =
        _0x1f922e.find((_0x235e45) => String(_0x235e45.display_id || '') === String(_0x8c4f0c.id)) ||
        _0x1f922e[0],
      _0x39d3d5 = _0x124ab4?.thumbnail;
    if (!_0x39d3d5 || _0x39d3d5.isEmpty()) return { ok: false, reason: 'no-image' };
    return {
      ok: true,
      mimeType: 'image/png',
      dataUrl: _0x39d3d5.toDataURL(),
      display: {
        id: String(_0x8c4f0c.id),
        scaleFactor: _0x41c748,
        bounds: { x: _0x493532.x, y: _0x493532.y, width: _0x493532.width, height: _0x493532.height },
        imageSize: _0x39d3d5.getSize(),
      },
    };
  }
  function _0x290bb7(_0x5664c6 = _0x2e6c76) {
    const _0x1bf994 = _0x31301d();
    if (!_0x1bf994 || _0x1bf994.isDestroyed()) return;
    if (_0x1bf994.webContents.isDestroyed()) return;
    _0x1bf994.webContents.send('screenshot:globalShortcutStatus', { accelerator: _0x2ad8dd, ..._0x5664c6 });
  }
  function _0x39a3a0(_0xce8eab = {}) {
    ((_0x2e6c76 = { accelerator: _0x2ad8dd, ..._0x2e6c76, ..._0xce8eab }), _0x290bb7());
  }
  function _0x2d4a78() {
    if (!_0x34de2b || _0x34de2b.isDestroyed()) return;
    (void _0x34de2b.webContents.executeJavaScript('window.__resetScreenshotOverlay?.()'),
      _0x34de2b.setOpacity(1),
      _0x34de2b.setAlwaysOnTop(false),
      _0x34de2b.hide());
  }
  function _0x3ce84d() {
    _0x3e6910 = null;
    if (!_0x34de2b || _0x34de2b.isDestroyed()) return;
    _0x34de2b.destroy();
  }
  function _0x88fc17(_0x5cb615 = {}) {
    const _0x12b877 = _0x5cb615?.display?.bounds;
    if (_0x12b877 && _0x12b877.width > 0 && _0x12b877.height > 0)
      return {
        x: Math.round(_0x12b877.x),
        y: Math.round(_0x12b877.y),
        width: Math.round(_0x12b877.width),
        height: Math.round(_0x12b877.height),
      };
    const _0x3becc9 = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())?.bounds;
    return _0x3becc9 || { x: 0, y: 0, width: 0x500, height: 0x2d0 };
  }
  function _0x44e592() {
    return { x: -0x7d00, y: -0x7d00, width: 1, height: 1 };
  }
  async function _0xac72c(_0x1701ed = null) {
    if (_0x34de2b && !_0x34de2b.isDestroyed()) {
      if (_0x3e6910) await _0x3e6910;
      return _0x34de2b;
    }
    const _0x165651 = _0x1701ed ? _0x88fc17(_0x1701ed) : _0x44e592();
    return (
      (_0x34de2b = new BrowserWindow({
        ..._0x165651,
        title: 'Screenshot Overlay',
        show: false,
        frame: false,
        transparent: true,
        paintWhenInitiallyHidden: true,
        fullscreen: false,
        fullscreenable: false,
        alwaysOnTop: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        backgroundColor: '#00000000',
        webPreferences: {
          preload: path.join(_0x460c18, 'screenshotOverlayPreload.cjs'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      })),
      _0x34de2b.on('closed', () => {
        ((_0x34de2b = null), (_0x3e6910 = null));
      }),
      (_0x3e6910 = _0x34de2b.loadFile(path.join(_0x460c18, 'screenshotOverlay.html')).catch((_0xfc9c0b) => {
        _0x3e6910 = null;
        throw _0xfc9c0b;
      })),
      await _0x3e6910,
      _0x34de2b
    );
  }
  async function _0x120210(_0xf6f469) {
    const _0x556fae = await _0xac72c();
    if (!_0x556fae || _0x556fae.isDestroyed()) return;
    (_0x556fae.setOpacity(1),
      _0x556fae.setBounds(_0xf6f469 || _0x88fc17()),
      await _0x556fae.webContents.executeJavaScript('window.__resetScreenshotOverlay?.()'),
      _0x556fae.setAlwaysOnTop(true, 'screen-saver'),
      _0x556fae.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }),
      _0x556fae.show(),
      _0x556fae.focus());
  }
  async function _0x492c99(_0x3f2bde) {
    if (!_0x34de2b || _0x34de2b.isDestroyed()) return;
    await _0x34de2b.webContents.executeJavaScript(
      'window.__startScreenshotOverlay(' + JSON.stringify(_0x3f2bde) + ')',
    );
  }
  async function _0x35d2f8() {
    if (_0x34de2b && !_0x34de2b.isDestroyed() && _0x34de2b.isVisible()) {
      (_0x34de2b.show(), _0x34de2b.focus());
      return;
    }
    try {
      const _0x425a92 = _0x88fc17();
      await _0x120210(_0x425a92);
      const _0x33e86d = await _0x146a4b();
      if (!_0x33e86d?.ok) {
        (_0x2d4a78(),
          _0x39a3a0({ ok: false, registered: _0x25300f, reason: _0x33e86d?.reason || 'capture-failed' }),
          _0x6d568c({
            type: 'screenshot.global_capture_failed',
            level: 'warn',
            source: 'main',
            message: 'Global screenshot capture failed',
            context: _0x33e86d || {},
          }));
        return;
      }
      await _0x492c99(_0x33e86d);
    } catch (_0x3be666) {
      (_0x2d4a78(),
        _0x39a3a0({
          ok: false,
          registered: _0x25300f,
          reason: 'capture-failed',
          error: String(_0x3be666?.message || _0x3be666),
        }),
        _0x6d568c({
          type: 'screenshot.global_overlay_failed',
          level: 'error',
          source: 'main',
          message: 'Global screenshot overlay failed',
          error: _0x3be666,
        }));
    }
  }
  function _0x303865() {
    if (_0x25300f) return;
    let _0x3bf6cd = false;
    try {
      _0x3bf6cd = globalShortcut.register(_0x2ad8dd, () => {
        void _0x35d2f8();
      });
    } catch (_0x553ce8) {
      _0x6d568c({
        type: 'screenshot.global_shortcut_register_failed',
        level: 'error',
        source: 'main',
        message: 'Global screenshot shortcut registration threw',
        error: _0x553ce8,
      });
    }
    ((_0x25300f = _0x3bf6cd),
      _0x39a3a0({
        ok: _0x3bf6cd,
        registered: _0x3bf6cd,
        reason: _0x3bf6cd ? 'registered' : 'registration-failed',
      }),
      _0x6d568c({
        type: _0x3bf6cd
          ? 'screenshot.global_shortcut_registered'
          : 'screenshot.global_shortcut_register_failed',
        level: _0x3bf6cd ? 'info' : 'warn',
        source: 'main',
        message: _0x3bf6cd
          ? 'Global screenshot shortcut registered'
          : 'Global screenshot shortcut registration failed',
        context: { accelerator: _0x2ad8dd },
      }));
  }
  function _0x57fec6() {
    if (_0x10747a()) {
      _0x39a3a0({ ok: false, registered: false, reason: 'native-helper-starting' });
      return;
    }
    _0x303865();
  }
  function _0x4357bf() {
    (_0x272eb7(), _0x25300f && (globalShortcut.unregister(_0x2ad8dd), (_0x25300f = false)));
  }
  async function _0x2f266b(_0x1b6429 = {}) {
    const _0xaad54f = String(_0x1b6429?.pngBase64 || '').trim();
    if (!_0xaad54f) return { ok: false, reason: 'empty-payload' };
    return (
      _0x2d4a78(),
      _0xe926b4({
        pngBase64: _0xaad54f,
        mimeType: String(_0x1b6429?.mimeType || 'image/png') || 'image/png',
        source: 'globalShortcut',
      }),
      { ok: true }
    );
  }
  async function _0x19d4bf() {
    return (_0x2d4a78(), { ok: true });
  }
  function _0x2ef3b3() {
    return path.join(_0x4957f9, 'native', 'screenshot-helper', 'bin', 'screenshot-helper.exe');
  }
  function _0x335ffb() {
    return path.join(_0x4957f9, 'images', 'cursors', 'windows11-concept-v2', 'light');
  }
  function _0xe926b4(_0x4fd594 = {}) {
    const _0x216905 = String(_0x4fd594?.pngBase64 || '').trim();
    if (!_0x216905) return false;
    const _0x48e704 = _0x31301d();
    return (
      _0x48e704 &&
        !_0x48e704.isDestroyed() &&
        !_0x48e704.webContents.isDestroyed() &&
        _0x48e704.webContents.send('screenshot:globalCaptureReady', {
          pngBase64: _0x216905,
          mimeType: String(_0x4fd594?.mimeType || 'image/png') || 'image/png',
          source: _0x4fd594?.source || 'nativeHelper',
          createdAt: Date.now(),
        }),
      true
    );
  }
  function _0x48384b(_0xd75b70) {
    const _0x44d05b = String(_0xd75b70 || '').trim();
    if (!_0x44d05b) return;
    let _0x5bee01 = null;
    try {
      _0x5bee01 = JSON.parse(_0x44d05b);
    } catch (_0x3caf26) {
      _0x6d568c({
        type: 'screenshot.native_helper_bad_message',
        level: 'warn',
        source: 'main',
        message: 'Native screenshot helper sent an invalid message',
        context: { raw: _0x44d05b.slice(0, 160) },
        error: _0x3caf26,
      });
      return;
    }
    if (_0x5bee01?.type === 'status') {
      const _0xcc4539 = _0x5bee01.registered === true;
      _0x39a3a0({
        ok: _0xcc4539,
        registered: _0xcc4539,
        reason: _0xcc4539 ? 'registered-native' : 'native-registration-failed',
      });
      !_0xcc4539 && (_0x272eb7(), _0x303865());
      return;
    }
    _0x5bee01?.type === 'capture' &&
      _0xe926b4({
        pngBase64: _0x5bee01.pngBase64,
        mimeType: _0x5bee01.mimeType || 'image/png',
        source: 'nativeHelper',
      });
  }
  function _0x10747a() {
    if (process.platform !== 'win32') return false;
    if (_0x2fcf8e && !_0x2fcf8e.killed) return true;
    const _0x1b6e4d = _0x2ef3b3();
    if (!existsSync(_0x1b6e4d))
      return (
        _0x6d568c({
          type: 'screenshot.native_helper_missing',
          level: 'warn',
          source: 'main',
          message: 'Native screenshot helper executable is missing',
          context: { helperPath: _0x1b6e4d },
        }),
        false
      );
    try {
      ((_0x2b05fa = ''),
        (_0x2fcf8e = spawn(_0x1b6e4d, [], {
          env: { ...process.env, AICANVAS_CURSOR_DIR: _0x335ffb() },
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        })));
    } catch (_0x447d3d) {
      return (
        _0x6d568c({
          type: 'screenshot.native_helper_start_failed',
          level: 'error',
          source: 'main',
          message: 'Native screenshot helper failed to start',
          error: _0x447d3d,
          context: { helperPath: _0x1b6e4d },
        }),
        (_0x2fcf8e = null),
        false
      );
    }
    return (
      _0x2fcf8e.stdout?.setEncoding('utf8'),
      _0x2fcf8e.stdout?.on('data', (_0x11f892) => {
        _0x2b05fa += String(_0x11f892 || '');
        let _0x3bb5fa = _0x2b05fa.indexOf('\n');
        while (_0x3bb5fa >= 0) {
          const _0x43de21 = _0x2b05fa.slice(0, _0x3bb5fa);
          ((_0x2b05fa = _0x2b05fa.slice(_0x3bb5fa + 1)),
            _0x48384b(_0x43de21),
            (_0x3bb5fa = _0x2b05fa.indexOf('\n')));
        }
      }),
      _0x2fcf8e.stderr?.setEncoding('utf8'),
      _0x2fcf8e.stderr?.on('data', (_0x105423) => {
        _0x6d568c({
          type: 'screenshot.native_helper_stderr',
          level: 'warn',
          source: 'main',
          message: 'Native screenshot helper stderr',
          context: { text: String(_0x105423 || '').slice(0, 0x3e8) },
        });
      }),
      _0x2fcf8e.on('exit', (_0x4dfed9, _0x2b8cbd) => {
        ((_0x2fcf8e = null),
          (_0x2b05fa = ''),
          _0x39a3a0({ ok: false, registered: false, reason: 'native-helper-exited' }),
          _0x6d568c({
            type: 'screenshot.native_helper_exited',
            level: _0x4dfed9 === 0 ? 'info' : 'warn',
            source: 'main',
            message: 'Native screenshot helper exited',
            context: { code: _0x4dfed9, signal: _0x2b8cbd },
          }));
      }),
      _0x2fcf8e.on('error', (_0x24632b) => {
        ((_0x2fcf8e = null),
          _0x39a3a0({
            ok: false,
            registered: false,
            reason: 'native-helper-error',
            error: String(_0x24632b?.message || _0x24632b),
          }));
      }),
      true
    );
  }
  function _0x272eb7() {
    if (!_0x2fcf8e || _0x2fcf8e.killed) return;
    try {
      _0x2fcf8e.kill();
    } catch {
    } finally {
      ((_0x2fcf8e = null), (_0x2b05fa = ''));
    }
  }
  return {
    captureDesktopDisplay: _0x146a4b,
    destroyScreenshotOverlayWindow: _0x3ce84d,
    handleScreenshotOverlayCancel: _0x19d4bf,
    handleScreenshotOverlayConfirm: _0x2f266b,
    installGlobalScreenshotShortcut: _0x57fec6,
    sendGlobalScreenshotShortcutStatus: _0x290bb7,
    uninstallGlobalScreenshotShortcut: _0x4357bf,
  };
}
