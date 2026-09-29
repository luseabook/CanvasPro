import { REVERSE_IMAGE_PROMPT_PRESET_PROMPT } from '../promptPresets.js';
import { waitForGlobalCaptureNodeMounted } from './globalTextPresetBridge.js';
function createBlobFromBase64(_0x4f0a2e, _0x1baeb5 = 'image/png') {
  const _0x5615e9 = atob(String(_0x4f0a2e || '')),
    _0x59040a = [];
  for (let _0x133049 = 0x0; _0x133049 < _0x5615e9['length']; _0x133049 += 0x2000) {
    const _0xb6db9b = _0x5615e9['slice'](_0x133049, _0x133049 + 0x2000),
      _0x30cd60 = new Uint8Array(_0xb6db9b['length']);
    for (let _0x22bae9 = 0x0; _0x22bae9 < _0xb6db9b['length']; _0x22bae9 += 0x1) {
      _0x30cd60[_0x22bae9] = _0xb6db9b['charCodeAt'](_0x22bae9);
    }
    _0x59040a['push'](_0x30cd60);
  }
  return new Blob(_0x59040a, { type: _0x1baeb5 });
}
export function installGlobalScreenshotBridge({
  screenshotApi: _0x4fee67,
  createMediaNodeFromBlob: _0x4e8d2,
  showToast: _0x10a8c3,
  translate: _0x7ae424,
  executeCanvasCommand: _0x2422df,
  isNodeMounted: _0xc1160d,
  scheduleFrame: _0x215b12,
  getCanvasIdentity: getCanvasIdentity = () => '',
  consoleObject: consoleObject = console,
} = {}) {
  if (!_0x4fee67) return;
  const _0x4745f4 =
    typeof _0x7ae424 === 'function'
      ? _0x7ae424
      : (_0x368dd0, _0x14c11f = {}) =>
          String(_0x368dd0 || '')['replace'](
            /\{(\w+)\}/g,
            (_0x5f3740, _0x291252) => _0x14c11f[_0x291252] || '',
          );
  (_0x4fee67['onGlobalCapture']?.(async (_0x40b646 = {}) => {
    const _0x26efb2 = getCanvasIdentity(),
      _0x217588 = () => _0x26efb2 === getCanvasIdentity(),
      _0x757cc7 = _0x40b646?.['actionId'] === 'reverse-prompt';
    let _0x6ed5df = '';
    try {
      const _0x3c27f7 = String(_0x40b646?.['pngBase64'] || '')['trim']();
      if (!_0x3c27f7) return;
      const _0x45bf66 = String(_0x40b646?.['mimeType'] || 'image/png') || 'image/png',
        _0x106c5e = createBlobFromBase64(_0x3c27f7, _0x45bf66),
        _0x278a10 = await _0x4e8d2?.(_0x106c5e, _0x45bf66, {
          name: _0x4745f4('globalScreenshot.nodeName'),
          placement: 'viewport-center-sequence',
          sequenceKey: 'global-screenshot',
          ...(_0x757cc7 ? { returnNode: !![], isImportCurrent: _0x217588 } : {}),
        });
      if (!_0x217588()) return;
      if (_0x757cc7 && _0x278a10?.['id']) {
        const _0x2460d2 = async (_0x27dfdb, _0x414d77) => {
            if (!_0x217588()) throw new Error('canvas-changed');
            const _0x59d4e6 = await _0x2422df?.(_0x27dfdb, _0x414d77);
            if (_0x59d4e6?.['ok'] !== !![])
              throw new Error(_0x59d4e6?.['message'] || _0x59d4e6?.['errorCode'] || 'canvas-command-failed');
            return _0x59d4e6['result'];
          },
          _0x132341 = await _0x2460d2('node.createConnected', {
            sourceId: _0x278a10['id'],
            type: 'ai-text',
            inheritSource: ![],
            name: _0x4745f4('globalScreenshot.reverseNodeName'),
          });
        _0x6ed5df = _0x132341?.['nodeId'];
        if (!_0x6ed5df) throw new Error('node-id-missing');
        await _0x2460d2('node.setPrompt', { nodeId: _0x6ed5df, text: REVERSE_IMAGE_PROMPT_PRESET_PROMPT });
        if (_0x40b646['runImmediately'] === !![]) {
          const _0x411ac8 = await waitForGlobalCaptureNodeMounted({
            nodeId: _0x6ed5df,
            isNodeMounted: _0xc1160d,
            scheduleFrame: _0x215b12,
          });
          if (!_0x217588()) return;
          if (!_0x411ac8) throw new Error('node-not-ready');
          await _0x2460d2('generation.run', { nodeId: _0x6ed5df });
        }
        if (_0x217588())
          _0x10a8c3?.(
            _0x4745f4(
              _0x40b646['runImmediately'] === !![]
                ? 'globalScreenshot.reverseStarted'
                : 'globalScreenshot.reverseCreated',
            ),
            'success',
          );
        return;
      }
      _0x278a10
        ? _0x10a8c3?.(_0x4745f4('globalScreenshot.added'), 'success')
        : _0x10a8c3?.(_0x4745f4('globalScreenshot.importFailed'), 'error');
    } catch (_0x4e2fbd) {
      consoleObject['error']?.('[screenshot] failed to import global capture', _0x4e2fbd);
      if (_0x217588())
        _0x10a8c3?.(
          _0x4745f4(_0x6ed5df ? 'globalScreenshot.reverseFailed' : 'globalScreenshot.importFailed'),
          'error',
        );
    }
  }),
    _0x4fee67['onGlobalShortcutStatus']?.((_0x960f0b = {}) => {
      if (_0x960f0b?.['registered'] === ![] && _0x960f0b?.['reason'] === 'registration-failed') {
        _0x10a8c3?.(
          _0x4745f4('globalScreenshot.shortcutRegistrationFailed', {
            accelerator: _0x960f0b?.['accelerator'] || 'Alt+Q',
          }),
          'warn',
        );
        return;
      }
      _0x960f0b?.['registered'] === !![] &&
        _0x960f0b?.['ok'] === ![] &&
        _0x10a8c3?.(_0x4745f4('globalScreenshot.captureFailed'), 'error');
    }));
}
