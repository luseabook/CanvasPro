export function translateMinimaxH3EditorAssetMentions(value = '') {
  return String(value || '')
    ['replace'](/@(?:图片|图像)(\d+)/gu, '<Picture $1>')
    ['replace'](/@视频(\d+)/gu, '<Video $1>')
    ['replace'](/@(?:声音|音频)(\d+)/gu, '<Audio $1>');
}
