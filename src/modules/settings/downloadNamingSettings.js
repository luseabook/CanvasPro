import {
  getDownloadUseOriginalFilename,
  setDownloadUseOriginalFilename,
} from '../../services/downloadNamingService.js';
export function initDownloadNamingSettings() {
  const list = document['querySelectorAll'](
      '#downloadUseOriginalFilenameGroup [data-download-original-filename]',
    ),
    handler = (value) => {
      list['forEach']((el) => {
        const item = (el['dataset']['downloadOriginalFilename'] === 'on') === value;
        (el['classList']['toggle']('active', item), el['setAttribute']('aria-pressed', String(item)));
      });
    };
  (handler(getDownloadUseOriginalFilename()),
    list['forEach']((el2) => {
      if (el2['__downloadNamingBound']) return;
      ((el2['__downloadNamingBound'] = !![]),
        el2['addEventListener']('click', () => {
          handler(setDownloadUseOriginalFilename(el2['dataset']['downloadOriginalFilename'] === 'on'));
        }));
    }));
}
