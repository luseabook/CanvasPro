import { requester } from '../../api/requester.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { pickResultLocalPath } from '../utils/localMediaPath.js';
export class VideoCutServiceError extends Error {
  constructor(value, item = 'video_cut_failed') {
    (super(String(value || 'Video cut failed')),
      (this['name'] = 'VideoCutServiceError'),
      (this['code'] = item));
  }
}
export async function cutVideoRangeToLocal({
  src: src,
  startSec: startSec,
  endSec: endSec,
  nodeId: nodeId = '',
} = {}) {
  const src2 = String(src || '')['trim'](),
    start = Math['max'](0, Number(startSec) || 0),
    end = Math['max'](start, Number(endSec) || 0);
  if (!src2 || end <= start)
    throw new VideoCutServiceError('Invalid video cut range', 'invalid_range');
  let data = null;
  if (canUseElectronMediaTask())
    data = await enqueueElectronMediaTask(
      {
        kind: 'videoCut',
        nodeId: String(nodeId || ''),
        src: src2,
        args: { start: start, end: end },
      },
      { wait: true, timeout: 300000 },
    );
  else {
    const response = await requester({
      url: '/api/v2/video/cut',
      method: 'POST',
      provider: 'local',
      headers: { 'Content-Type': 'application/json' },
      body: JSON['stringify']({ src: src2, start: start, end: end }),
      allow404Null: true,
      returnMeta: true,
    });
    if (response?.['status'] === 404 || response?.['data'] == null)
      throw new VideoCutServiceError('Video cut endpoint is unavailable', 'endpoint_unavailable');
    data = response['data'] || {};
  }
  const result = data?.['result'] && typeof data['result'] === 'object' ? data['result'] : data,
    localPath = pickResultLocalPath(data);
  if (!localPath || data?.['success'] === false || result?.['success'] === false)
    throw new VideoCutServiceError(
      result?.['error'] || data?.['error'] || data?.['message'] || 'Video cut failed',
    );
  return { localPath: localPath, durationSec: end - start, data: data, result: result };
}
