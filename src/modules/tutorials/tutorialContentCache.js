import { normalizeTutorialCatalog } from './tutorialCatalog.js';
const KEY = 'aicanvas.tutorial-content.v1';
export function readTutorialCache(_0x358173) {
  try {
    return normalizeTutorialCatalog(JSON['parse'](_0x358173['getItem'](KEY)));
  } catch {
    return null;
  }
}
export function writeTutorialCache(_0x5146bc, _0x612fb2) {
  try {
    return (_0x5146bc['setItem'](KEY, JSON['stringify'](normalizeTutorialCatalog(_0x612fb2))), !![]);
  } catch {
    return ![];
  }
}
