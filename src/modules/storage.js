import { DB_CONFIG } from '../utils/constants.js';
const {
  name: DB_NAME,
  version: DB_VERSION,
  storeName: IMAGE_STORE_NAME,
  thumbnailStoreName: THUMBNAIL_STORE_NAME = 'thumbnails',
} = DB_CONFIG;
let dbPromise = null;
function getDB() {
  return (
    !dbPromise &&
      (dbPromise = new Promise((_0x679a0b, _0x3e374d) => {
        const _0x1676fc = indexedDB.open(DB_NAME, DB_VERSION);
        ((_0x1676fc.onupgradeneeded = (_0xea305f) => {
          const _0x1bc020 = _0xea305f.target.result;
          (!_0x1bc020.objectStoreNames.contains(IMAGE_STORE_NAME) &&
            _0x1bc020.createObjectStore(IMAGE_STORE_NAME),
            !_0x1bc020.objectStoreNames.contains(THUMBNAIL_STORE_NAME) &&
              _0x1bc020.createObjectStore(THUMBNAIL_STORE_NAME));
        }),
          (_0x1676fc.onsuccess = (_0x47706f) => _0x679a0b(_0x47706f.target.result)),
          (_0x1676fc.onerror = (_0x1a9ce2) => _0x3e374d(_0x1a9ce2.target.error)));
      })),
    dbPromise
  );
}
async function putValue(_0x38a81f, _0x185100, _0x805f0f) {
  const _0x1e386a = await getDB();
  return new Promise((_0x49ba5a, _0x516266) => {
    const _0xcef657 = _0x1e386a.transaction(_0x38a81f, 'readwrite'),
      _0x5038a8 = _0xcef657.objectStore(_0x38a81f),
      _0x663469 = _0x5038a8.put(_0x805f0f, _0x185100);
    ((_0x663469.onsuccess = () => _0x49ba5a(true)),
      (_0x663469.onerror = (_0x3fe519) => _0x516266(_0x3fe519.target.error)));
  });
}
async function getValue(_0x578938, _0x2f9ce7) {
  const _0x3f0151 = await getDB();
  return new Promise((_0x17141b, _0x1ad877) => {
    const _0x5e3199 = _0x3f0151.transaction(_0x578938, 'readonly'),
      _0x15f6e3 = _0x5e3199.objectStore(_0x578938),
      _0x399ecd = _0x15f6e3.get(_0x2f9ce7);
    ((_0x399ecd.onsuccess = (_0x5eea07) => _0x17141b(_0x5eea07.target.result ?? null)),
      (_0x399ecd.onerror = (_0x3c4d45) => _0x1ad877(_0x3c4d45.target.error)));
  });
}
async function deleteValue(_0x2cd1fa, _0xfbd7ab) {
  const _0x12bb2e = await getDB();
  return new Promise((_0x191e31, _0x2c9968) => {
    const _0x33d7f0 = _0x12bb2e.transaction(_0x2cd1fa, 'readwrite'),
      _0x482771 = _0x33d7f0.objectStore(_0x2cd1fa),
      _0x50e4f7 = _0x482771.delete(_0xfbd7ab);
    ((_0x50e4f7.onsuccess = () => _0x191e31(true)),
      (_0x50e4f7.onerror = (_0x3fda6d) => _0x2c9968(_0x3fda6d.target.error)));
  });
}
export async function saveImage(_0x621805, _0x3fcbd8) {
  return await putValue(IMAGE_STORE_NAME, _0x621805, _0x3fcbd8);
}
export async function getImage(_0x5babb2) {
  return await getValue(IMAGE_STORE_NAME, _0x5babb2);
}
export async function deleteImage(_0x530df3) {
  return await deleteValue(IMAGE_STORE_NAME, _0x530df3);
}
export async function saveThumbnailRecord(_0x4055f9, _0x49fae5) {
  return await putValue(THUMBNAIL_STORE_NAME, _0x4055f9, _0x49fae5);
}
export async function getThumbnailRecord(_0x28362d) {
  return await getValue(THUMBNAIL_STORE_NAME, _0x28362d);
}
export async function deleteThumbnailRecord(_0x93f8a9) {
  return await deleteValue(THUMBNAIL_STORE_NAME, _0x93f8a9);
}
