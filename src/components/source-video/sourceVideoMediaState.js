import { resolveCanvasVideoPosterUrl } from '../../services/canvasMediaLocalService.js';
import { pickResultLocalPath, urlToLocalPath } from '../../utils/localMediaPath.js';

export function resolveSourceVideoPosterSrc(nodeData = {}) {
  return resolveCanvasVideoPosterUrl(nodeData);
}

export function resolveSourceVideoMediaTaskSrc(nodeData = {}) {
  const videos = Array.isArray(nodeData?.videos) ? nodeData.videos : [];
  const mainVideoIndex = Math.max(0, Number(nodeData?.mainVideoIndex) || 0);
  const mainVideo = videos[mainVideoIndex] || videos[0] || null;
  const candidates = [
    nodeData?.originalLocalPath,
    nodeData?.localPath,
    nodeData?.displayLocalPath,
    nodeData?.videoLocalPath,
    nodeData?.videoUrl,
    nodeData?.src,
    nodeData?.url,
    nodeData?.resultUrl,
    nodeData?.sourceUrl,
    mainVideo?.originalLocalPath,
    mainVideo?.localPath,
    mainVideo?.displayLocalPath,
    mainVideo?.videoUrl,
    mainVideo?.src,
    mainVideo?.url,
    mainVideo?.resultUrl,
  ];

  for (const candidate of candidates) {
    const localPath = urlToLocalPath(candidate) || pickResultLocalPath(candidate);
    if (localPath) return localPath;
  }
  return '';
}
