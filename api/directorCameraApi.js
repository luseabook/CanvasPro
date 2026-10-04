import { post } from './requester.js';
const path = '/api/v2/storyboard3d/director-camera';
export const createDirectorCameraPairing = () =>
  post(path, { action: 'create', enableLan: !![] }, { provider: 'local' });
export const readDirectorCameraPose = (readToken) =>
  post(path, { action: 'read', readToken: readToken }, { provider: 'local' });
export const closeDirectorCameraPairing = (readToken2) =>
  post(path, { action: 'close', readToken: readToken2 }, { provider: 'local' });
