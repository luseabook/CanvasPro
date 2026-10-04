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
      (dbPromise = new Promise((handler, handler2) => {
        const value = indexedDB.open(DB_NAME, DB_VERSION);
        ((value.onupgradeneeded = (event) => {
          const enabled = event.target.result;
          (!enabled.objectStoreNames.contains(IMAGE_STORE_NAME) &&
            enabled.createObjectStore(IMAGE_STORE_NAME),
            !enabled.objectStoreNames.contains(THUMBNAIL_STORE_NAME) &&
              enabled.createObjectStore(THUMBNAIL_STORE_NAME));
        }),
          (value.onsuccess = (event2) => handler(event2.target.result)),
          (value.onerror = (event3) => handler2(event3.target.error)));
      })),
    dbPromise
  );
}
async function putValue(item, key, index) {
  const dB = await getDB();
  return new Promise((handler3, handler4) => {
    const result = dB.transaction(item, 'readwrite'),
      data = result.objectStore(item),
      options = data.put(index, key);
    ((options.onsuccess = () => handler3(true)),
      (options.onerror = (event4) => handler4(event4.target.error)));
  });
}
async function getValue(target, source) {
  const dB2 = await getDB();
  return new Promise((handler5, handler6) => {
    const next = dB2.transaction(target, 'readonly'),
      map = next.objectStore(target),
      current = map.get(source);
    ((current.onsuccess = (event5) => handler5(event5.target.result ?? null)),
      (current.onerror = (event6) => handler6(event6.target.error)));
  });
}
async function deleteValue(entry, record) {
  const dB3 = await getDB();
  return new Promise((handler7, handler8) => {
    const payload = dB3.transaction(entry, 'readwrite'),
      map2 = payload.objectStore(entry),
      handle = map2.delete(record);
    ((handle.onsuccess = () => handler7(true)), (handle.onerror = (event7) => handler8(event7.target.error)));
  });
}
export async function saveImage(state, config) {
  return await putValue(IMAGE_STORE_NAME, state, config);
}
export async function getImage(scope) {
  return await getValue(IMAGE_STORE_NAME, scope);
}
export async function deleteImage(input) {
  return await deleteValue(IMAGE_STORE_NAME, input);
}
export async function saveThumbnailRecord(output, value2) {
  return await putValue(THUMBNAIL_STORE_NAME, output, value2);
}
export async function getThumbnailRecord(value3) {
  return await getValue(THUMBNAIL_STORE_NAME, value3);
}
export async function deleteThumbnailRecord(value4) {
  return await deleteValue(THUMBNAIL_STORE_NAME, value4);
}
