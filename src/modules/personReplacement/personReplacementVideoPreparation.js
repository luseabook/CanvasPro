import { PERSON_REPLACEMENT_CUT_EPSILON_SEC } from './personReplacementShotCutModel.js';
import { materializePersonReplacementShotPlayback } from './personReplacementShotReverse.js';
function normalizeText(_0x46e12c) {
  return String(_0x46e12c ?? '')['trim']();
}
function cloneJson(_0x4bd911) {
  return JSON['parse'](JSON['stringify'](_0x4bd911));
}
export function createPersonReplacementVideoPreparationRunner({
  getProject: _0x271341,
  getProjectById: getProjectById = null,
  setProject: _0x5c47f4,
  setProjectById: setProjectById = null,
  isDestroyed: isDestroyed = () => ![],
  waitForActiveReverse: _0x5c07ed,
  fetchVideoMeta: _0x3fc8da,
  resolveDurationSec: _0x49d86e,
  enqueueMediaTask: _0xfa6e38,
  resolveMediaRef: _0x17596d,
  showToast: _0x195cde,
} = {}) {
  return async function _0x1090c0({
    projectId: _0x37b9c9 = '',
    shotIds: shotIds = null,
    notify: notify = !![],
    renderWorkspace: renderWorkspace = !![],
  } = {}) {
    const _0x1db302 =
        Array['isArray'](shotIds) && shotIds['length']
          ? new Set(shotIds['map'](normalizeText)['filter'](Boolean))
          : null,
      _0x1831d4 = () => {
        const _0x287643 = normalizeText(_0x37b9c9);
        return _0x287643 && typeof getProjectById === 'function' ? getProjectById(_0x287643) : _0x271341();
      },
      _0x4d6654 = (_0xebd13b, _0x3b9150 = {}) =>
        typeof setProjectById === 'function'
          ? setProjectById(_0xebd13b?.['id'], _0xebd13b, _0x3b9150)
          : _0x5c47f4(_0xebd13b, _0x3b9150),
      _0x429f4f = normalizeText(_0x37b9c9 || _0x1831d4()?.['id']);
    await _0x5c07ed({ projectId: _0x429f4f, shotIds: _0x1db302 });
    let _0x2226b3 = _0x1831d4();
    if (isDestroyed() || normalizeText(_0x2226b3['id']) !== _0x429f4f)
      return { ok: ![], stale: !![], failures: [], project: cloneJson(_0x2226b3) };
    const _0x46e10e = _0x2226b3['shots']['filter'](
      (_0x7c912e) =>
        (!_0x1db302 || _0x1db302['has'](_0x7c912e['id'])) &&
        (!_0x7c912e['videoRef'] ||
          _0x7c912e['materializationStatus'] !== 'succeeded' ||
          Boolean(_0x7c912e['materializedIsReversed']) !== Boolean(_0x7c912e['isReversed'])),
    );
    if (!_0x46e10e['length'])
      return (
        (_0x2226b3['workspace']['videoPreparation']?.['status'] !== 'succeeded' ||
          Number(_0x2226b3['workspace']['videoPreparation']?.['progress']) !== 0x64 ||
          normalizeText(_0x2226b3['workspace']['videoPreparation']?.['error'])) &&
          (_0x2226b3 = _0x4d6654(
            {
              ..._0x2226b3,
              workspace: {
                ..._0x2226b3['workspace'],
                videoPreparation: { status: 'succeeded', progress: 0x64, error: '' },
              },
            },
            { renderWorkspace: renderWorkspace },
          )),
        { ok: !![], project: cloneJson(_0x2226b3) }
      );
    _0x2226b3 = _0x4d6654(
      {
        ..._0x2226b3,
        workspace: {
          ..._0x2226b3['workspace'],
          videoPreparation: { status: 'running', progress: 0x0, error: '' },
        },
        shots: _0x2226b3['shots']['map']((_0x73bb37) =>
          _0x46e10e['some']((_0x1ed6d4) => _0x1ed6d4['id'] === _0x73bb37['id'])
            ? {
                ..._0x73bb37,
                materializationStatus: 'running',
                materializationProgress: 0x0,
                error: _0x73bb37['analysisStatus'] === 'failed' ? _0x73bb37['error'] : '',
              }
            : _0x73bb37,
        ),
      },
      { renderWorkspace: renderWorkspace },
    );
    const _0x3e7fd2 = [];
    for (let _0x1eccc0 = 0x0; _0x1eccc0 < _0x46e10e['length']; _0x1eccc0 += 0x1) {
      const _0x257111 = _0x46e10e[_0x1eccc0]['id'],
        _0x240f63 = _0x2226b3['shots']['find']((_0x15fa7d) => _0x15fa7d['id'] === _0x257111),
        _0x37555d = _0x2226b3['sources']['find']((_0x4b6ae2) => _0x4b6ae2['id'] === _0x240f63?.['sourceId']),
        _0x50709b = _0x240f63?.['sourceVideoRef'] || _0x37555d?.['videoRef'] || '';
      try {
        if (!_0x240f63 || !_0x50709b) throw new Error('镜头缺少原始视频地址');
        let _0x2311a8 = Number(_0x240f63['endTimeSec']) || 0x0;
        if (!(_0x2311a8 > _0x240f63['startTimeSec'])) {
          if (typeof _0x3fc8da !== 'function') throw new Error('无法读取镜头结束时间');
          const _0x40937f = _0x49d86e(await _0x3fc8da(_0x50709b));
          if (!(_0x40937f > _0x240f63['startTimeSec'])) throw new Error('无法读取原视频时长');
          _0x2311a8 = _0x40937f;
        }
        const _0x3665e9 = [0x10, 0x18, 0x1e]['includes'](Math['round'](Number(_0x240f63['outputFps'])))
            ? Math['round'](Number(_0x240f63['outputFps']))
            : 0x18,
          _0x564a78 = {
            shotId: _0x240f63['id'],
            sourceId: _0x240f63['sourceId'],
            startSec: _0x240f63['startTimeSec'],
            endSec: _0x2311a8,
            ...(_0x240f63['isReversed'] === !![] ? { isReversed: !![] } : {}),
          },
          { videoRef: _0x4b8cb7, videoRefIsCropped: _0x545884 } =
            await materializePersonReplacementShotPlayback({
              currentShot: { ..._0x240f63, endTimeSec: _0x2311a8 },
              range: _0x564a78,
              isNewShot: ![],
              sourceVideoRef: _0x50709b,
              outputFps: _0x3665e9,
              epsilonSec: PERSON_REPLACEMENT_CUT_EPSILON_SEC,
              enqueueMediaTask: _0xfa6e38,
              resolveMediaRef: _0x17596d,
            }),
          _0x7540f = _0x1831d4(),
          _0x3f9e0a = _0x7540f['shots']['find']((_0x259cdd) => _0x259cdd['id'] === _0x257111);
        if (isDestroyed() || normalizeText(_0x7540f['id']) !== _0x429f4f)
          return { ok: ![], stale: !![], failures: _0x3e7fd2, project: cloneJson(_0x7540f) };
        if (!_0x3f9e0a || Boolean(_0x3f9e0a['isReversed']) !== Boolean(_0x240f63['isReversed'])) {
          _0x2226b3 = _0x7540f;
          continue;
        }
        const _0x9a249a = Math['round'](((_0x1eccc0 + 0x1) / _0x46e10e['length']) * 0x64);
        _0x2226b3 = _0x4d6654(
          {
            ..._0x7540f,
            shots: _0x7540f['shots']['map']((_0x4b8e71) =>
              _0x4b8e71['id'] === _0x257111
                ? {
                    ..._0x4b8e71,
                    sourceVideoRef: _0x50709b,
                    endTimeSec: _0x2311a8,
                    durationSec: Math['max'](0x0, _0x2311a8 - _0x4b8e71['startTimeSec']),
                    videoRef: _0x4b8cb7,
                    videoRefIsCropped: _0x545884,
                    outputFps: _0x3665e9,
                    materializedIsReversed: _0x240f63['isReversed'] === !![],
                    materializationStatus: 'succeeded',
                    materializationProgress: 0x64,
                    error: _0x4b8e71['analysisStatus'] === 'failed' ? _0x4b8e71['error'] : '',
                  }
                : _0x4b8e71,
            ),
            workspace: {
              ..._0x7540f['workspace'],
              videoPreparation: { status: 'running', progress: _0x9a249a, error: '' },
            },
          },
          { renderWorkspace: ![] },
        );
      } catch (_0x260c07) {
        const _0x43c0ac = _0x260c07?.['message'] || '镜头切片失败';
        _0x3e7fd2['push']({ shotId: _0x257111, message: _0x43c0ac });
        const _0x37fd82 = _0x1831d4();
        _0x2226b3 = _0x4d6654(
          {
            ..._0x37fd82,
            shots: _0x37fd82['shots']['map']((_0x19b3e6) =>
              _0x19b3e6['id'] === _0x257111
                ? {
                    ..._0x19b3e6,
                    materializationStatus: 'failed',
                    materializationProgress: 0x0,
                    error:
                      _0x19b3e6['analysisStatus'] === 'failed'
                        ? [_0x19b3e6['error'], _0x43c0ac]['filter'](Boolean)['join']('；')
                        : _0x43c0ac,
                  }
                : _0x19b3e6,
            ),
            workspace: {
              ..._0x37fd82['workspace'],
              videoPreparation: {
                status: 'running',
                progress: Math['round'](((_0x1eccc0 + 0x1) / _0x46e10e['length']) * 0x64),
                error: _0x43c0ac,
              },
            },
          },
          { renderWorkspace: ![] },
        );
      }
    }
    const _0xe56dc2 = _0x3e7fd2['length'] ? 'failed' : 'succeeded',
      _0x12854b = _0x3e7fd2['map']((_0x3ec4eb) => _0x3ec4eb['message'])['join']('；'),
      _0x13d9bc = _0x1831d4();
    _0x2226b3 = _0x4d6654(
      {
        ..._0x13d9bc,
        workspace: {
          ..._0x13d9bc['workspace'],
          videoPreparation: { status: _0xe56dc2, progress: 0x64, error: _0x12854b },
        },
      },
      { renderWorkspace: renderWorkspace },
    );
    if (notify) {
      if (_0x3e7fd2['length']) _0x195cde(_0x12854b || '部分镜头切片失败。', 'error');
      else _0x195cde('已准备\x20' + _0x46e10e['length'] + ' 个固定帧率镜头。', 'success');
    }
    return { ok: _0x3e7fd2['length'] === 0x0, failures: _0x3e7fd2, project: _0x2226b3 };
  };
}
