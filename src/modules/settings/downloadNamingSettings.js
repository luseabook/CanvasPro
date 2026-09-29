import {
  getDownloadUseOriginalFilename,
  setDownloadUseOriginalFilename,
} from '../../services/downloadNamingService.js';
export function initDownloadNamingSettings() {
  const _0x33ca76 = document['querySelectorAll'](
      '#downloadUseOriginalFilenameGroup [data-download-original-filename]',
    ),
    _0x2d16f8 = (_0x4d5dfa) => {
      _0x33ca76['forEach']((_0x56e1f3) => {
        const _0x4c026d = (_0x56e1f3['dataset']['downloadOriginalFilename'] === 'on') === _0x4d5dfa;
        (_0x56e1f3['classList']['toggle']('active', _0x4c026d),
          _0x56e1f3['setAttribute']('aria-pressed', String(_0x4c026d)));
      });
    };
  (_0x2d16f8(getDownloadUseOriginalFilename()),
    _0x33ca76['forEach']((_0x3be25d) => {
      if (_0x3be25d['__downloadNamingBound']) return;
      ((_0x3be25d['__downloadNamingBound'] = !![]),
        _0x3be25d['addEventListener']('click', () => {
          _0x2d16f8(
            setDownloadUseOriginalFilename(_0x3be25d['dataset']['downloadOriginalFilename'] === 'on'),
          );
        }));
    }));
}
