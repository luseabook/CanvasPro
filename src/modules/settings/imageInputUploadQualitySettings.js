import {
  getImageInputUploadQualityMode,
  setImageInputUploadQualityMode,
} from '../../services/imageInputUploadQualityService.js';
export function initImageInputUploadQualitySettings() {
  const list = document.querySelectorAll(
    '#imageInputUploadQualityGroup .cursor-size-btn[data-upload-quality]',
  );
  if (!list.length) return;
  const run = (value) => {
    const setImageInputUploadQualityMode2 = setImageInputUploadQualityMode(value);
    list.forEach((el) => {
      el.classList.toggle('active', el.dataset.uploadQuality === setImageInputUploadQualityMode2);
    });
  };
  (run(getImageInputUploadQualityMode()),
    list.forEach((el2) => {
      el2.addEventListener('click', () => run(el2.dataset.uploadQuality));
    }));
}
