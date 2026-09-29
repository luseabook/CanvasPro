import { requester } from '../../api/requester.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { pickResultLocalPath } from '../utils/localMediaPath.js';
export class VideoCutServiceError extends Error {
  constructor(_0x3a4bec, _0x2fb250 = 'video_cut_failed') {
    (super(String(_0x3a4bec || 'Video cut failed')),
      (this['name'] = 'VideoCutServiceError'),
      (this['code'] = _0x2fb250));
  }
}
export async function cutVideoRangeToLocal({
  src: _0x5dc175,
  startSec: _0x32aa32,
  endSec: _0x4ba2d8,
  nodeId: nodeId = '',
} = {}) {
  const _0x412dae = String(_0x5dc175 || '')['trim'](),
    _0x7c3ed4 = Math['max'](0x0, Number(_0x32aa32) || 0x0),
    _0xb8e8a1 = Math['max'](_0x7c3ed4, Number(_0x4ba2d8) || 0x0);
  if (!_0x412dae || _0xb8e8a1 <= _0x7c3ed4)
    throw new VideoCutServiceError('Invalid\x20video\x20cut\x20range', 'invalid_range');
  let _0x1230ac = null;
  if (canUseElectronMediaTask())
    _0x1230ac = await enqueueElectronMediaTask(
      {
        kind: 'videoCut',
        nodeId: String(nodeId || ''),
        src: _0x412dae,
        args: { start: _0x7c3ed4, end: _0xb8e8a1 },
      },
      { wait: !![], timeout: 0x493e0 },
    );
  else {
    const _0x55e8dd = await requester({
      url: '/api/v2/video/cut',
      method: 'POST',
      provider: 'local',
      headers: { 'Content-Type': 'application/json' },
      body: JSON['stringify']({ src: _0x412dae, start: _0x7c3ed4, end: _0xb8e8a1 }),
      allow404Null: !![],
      returnMeta: !![],
    });
    if (_0x55e8dd?.['status'] === 0x194 || _0x55e8dd?.['data'] == null)
      throw new VideoCutServiceError('Video\x20cut\x20endpoint\x20is\x20unavailable', 'endpoint_unavailable');
    _0x1230ac = _0x55e8dd['data'] || {};
  }
  const _0x11510c =
      _0x1230ac?.['result'] && typeof _0x1230ac['result'] === 'object' ? _0x1230ac['result'] : _0x1230ac,
    _0x40efab = pickResultLocalPath(_0x1230ac);
  if (!_0x40efab || _0x1230ac?.['success'] === ![] || _0x11510c?.['success'] === ![])
    throw new VideoCutServiceError(
      _0x11510c?.['error'] || _0x1230ac?.['error'] || _0x1230ac?.['message'] || 'Video\x20cut\x20failed',
    );
  return { localPath: _0x40efab, durationSec: _0xb8e8a1 - _0x7c3ed4, data: _0x1230ac, result: _0x11510c };
}
