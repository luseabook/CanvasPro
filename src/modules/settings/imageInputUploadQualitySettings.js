import {
  getImageInputUploadQualityMode,
  setImageInputUploadQualityMode,
} from '../../services/imageInputUploadQualityService.js';
export function initImageInputUploadQualitySettings() {
  const _0x5c7609 = document.querySelectorAll(
    '#imageInputUploadQualityGroup .cursor-size-btn[data-upload-quality]',
  );
  if (!_0x5c7609.length) return;
  const _0x5691e8 = (_0x20bc2d) => {
    const _0x4d6b1b = setImageInputUploadQualityMode(_0x20bc2d);
    _0x5c7609.forEach((_0x1a1287) => {
      _0x1a1287.classList.toggle('active', _0x1a1287.dataset.uploadQuality === _0x4d6b1b);
    });
  };
  (_0x5691e8(getImageInputUploadQualityMode()),
    _0x5c7609.forEach((_0x203305) => {
      _0x203305.addEventListener('click', () => _0x5691e8(_0x203305.dataset.uploadQuality));
    }));
}
