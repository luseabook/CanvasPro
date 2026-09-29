import { post } from './requester.js';
const path = '/api/v2/storyboard3d/director-camera';
export const createDirectorCameraPairing = () =>
  post(path, { action: 'create', enableLan: !![] }, { provider: 'local' });
export const readDirectorCameraPose = (_0x3a0d48) =>
  post(path, { action: 'read', readToken: _0x3a0d48 }, { provider: 'local' });
export const closeDirectorCameraPairing = (_0x4ce78d) =>
  post(path, { action: 'close', readToken: _0x4ce78d }, { provider: 'local' });
