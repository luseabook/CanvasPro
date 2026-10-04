export const STORYBOARD_3D_IMAGE_POSE_RUNTIME = Object['freeze']({
  id: 'mediapipe-pose-landmarker-heavy-v1',
  adapterType: 'localRuntime',
  version: '0.10.35',
  maxPoses: 0x1,
  input: Object['freeze']({
    accept: Object['freeze'](['image/jpeg', 'image/png', 'image/webp']),
    maxBytes: 0x18 * 0x400 * 0x400,
  }),
  options: Object['freeze']({
    runningMode: 'IMAGE',
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  }),
});
export function validateStoryboard3DImagePoseFile(error, enabled = STORYBOARD_3D_IMAGE_POSE_RUNTIME) {
  const value = String(error?.['type'] || '')['toLowerCase'](),
    item = String(error?.['name'] || '')
      ['toLowerCase']()
      ['match'](/\.([a-z0-9]+)$/)?.[0x1],
    key = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[item],
    type = value === 'image/jpg' ? 'image/jpeg' : value || key || '',
    size = Math['max'](0x0, Number(error?.['size']) || 0x0);
  if (!enabled['input']['accept']['includes'](type)) {
    const error2 = new Error('请选择 JPG、PNG 或 WebP 图片。');
    error2['code'] = 'POSE_IMAGE_TYPE_UNSUPPORTED';
    throw error2;
  }
  if (size <= 0x0) {
    const error3 = new Error('图片为空或无法读取。');
    error3['code'] = 'POSE_IMAGE_EMPTY';
    throw error3;
  }
  if (size > enabled['input']['maxBytes']) {
    const error4 = new Error('图片不能超过 24 MB。');
    error4['code'] = 'POSE_IMAGE_TOO_LARGE';
    throw error4;
  }
  return { type: type, size: size };
}
