import { normalizeTutorialCatalog } from './tutorialCatalog.js';
const KEY = 'aicanvas.tutorial-content.v1';
export function readTutorialCache(value) {
  try {
    return normalizeTutorialCatalog(JSON['parse'](value['getItem'](KEY)));
  } catch {
    return null;
  }
}
export function writeTutorialCache(item, key) {
  try {
    return (item['setItem'](KEY, JSON['stringify'](normalizeTutorialCatalog(key))), !![]);
  } catch {
    return ![];
  }
}
