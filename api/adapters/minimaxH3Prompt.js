export function translateMinimaxH3EditorAssetMentions(_0x1af00f = '') {
  return String(_0x1af00f || '')
    ['replace'](/@(?:图片|图像)(\d+)/gu, '<Picture $1>')
    ['replace'](/@视频(\d+)/gu, '<Video $1>')
    ['replace'](/@(?:声音|音频)(\d+)/gu, '<Audio\x20$1>');
}
