import { reversePersonReplacementVideoIteration } from './personReplacementVideoIteration.js';
function normalizeText(_0x489f4b) {
  return String(_0x489f4b ?? '')['trim']();
}
function cloneJson(_0x3edb70) {
  return JSON['parse'](JSON['stringify'](_0x3edb70));
}
export function createPersonReplacementShotCutMutationCoordinator() {
  let _0x397add = 0x0;
  const _0x126137 = new Map(),
    _0x34cb17 = () => {
      return ((_0x397add += 0x1), _0x397add);
    },
    _0x3adab8 = (_0x2472c2) => {
      const _0x44e7e3 = Number(_0x2472c2);
      if (_0x44e7e3 > 0x0) return ((_0x397add = Math['max'](_0x397add, _0x44e7e3)), _0x44e7e3);
      return _0x34cb17();
    },
    _0x16bfbb = (_0x595383) => Number(_0x595383) === _0x397add,
    _0x3e5931 = ({ projectId: _0x1799ae, shotId: _0x4aa110, completion: _0x4c3c05 }) => {
      const _0x557c56 = _0x1799ae + '\x00' + _0x4aa110,
        _0xb21e1b = { projectId: _0x1799ae, shotId: _0x4aa110, completion: null };
      return (
        (_0xb21e1b['completion'] = Promise['resolve'](_0x4c3c05)['finally'](() => {
          _0x126137['get'](_0x557c56) === _0xb21e1b && _0x126137['delete'](_0x557c56);
        })),
        _0x126137['set'](_0x557c56, _0xb21e1b),
        _0xb21e1b['completion']
      );
    },
    _0x6e1b9f = async ({ projectId: _0x10021e, shotIds: shotIds = null } = {}) => {
      const _0x24d829 = shotIds instanceof Set ? shotIds : null,
        _0x5ab7f8 = [..._0x126137['values']()]
          ['filter'](
            (_0x58e825) =>
              _0x58e825['projectId'] === normalizeText(_0x10021e) &&
              (!_0x24d829 || _0x24d829['has'](_0x58e825['shotId'])),
          )
          ['map']((_0x2299fe) => _0x2299fe['completion']);
      if (_0x5ab7f8['length']) await Promise['allSettled'](_0x5ab7f8);
    };
  return {
    acceptRevision: _0x3adab8,
    getRevision: () => _0x397add,
    invalidate: _0x34cb17,
    isCurrent: _0x16bfbb,
    nextRevision: _0x34cb17,
    trackReverseCompletion: _0x3e5931,
    waitForActiveReverse: _0x6e1b9f,
  };
}
export function createPersonReplacementShotReverseOperation({
  coordinator: _0x4e87f0,
  getProject: _0x491208,
  setProject: _0x495d5a,
  snapshot: _0x21297a,
  showToast: _0x421368,
  updateShotCutRanges: _0x474750,
  enqueueMediaTask: _0x3da2ca,
  resolveMediaRef: _0x22bbbc,
  isDestroyed: isDestroyed = () => ![],
} = {}) {
  return function _0x3e64f3({
    shotId: _0x56a679,
    isReversed: isReversed = ![],
    iterationReferenceRef: iterationReferenceRef = '',
    sourceRef: sourceRef = '',
  } = {}) {
    const _0x114d54 = _0x491208(),
      _0x15ff54 = normalizeText(_0x56a679),
      _0x175bb6 = _0x114d54['shots']['find']((_0xab929e) => normalizeText(_0xab929e['id']) === _0x15ff54);
    if (!_0x175bb6) throw new Error('未找到需要倒放的片段');
    if (iterationReferenceRef) {
      if (_0x175bb6['videoIterationReferenceRef'] !== iterationReferenceRef)
        throw new Error('当前参考视频已变化，请重新打开裁剪。');
      return reversePersonReplacementVideoIteration({
        project: _0x114d54,
        shot: _0x175bb6,
        isReversed: isReversed,
        sourceRef: sourceRef,
        getProject: _0x491208,
        setProject: _0x495d5a,
        enqueueMediaTask: _0x3da2ca,
        resolveMediaRef: _0x22bbbc,
        isDestroyed: isDestroyed,
      });
    }
    const _0x53a63c = normalizeText(_0x114d54['id']),
      _0x316b5e = isReversed === !![],
      _0x17d114 = _0x175bb6['isReversed'] === !![],
      _0x1afca9 = _0x175bb6['materializedIsReversed'] === !![],
      _0x3891b4 = _0x4e87f0['nextRevision'](),
      _0x397d17 = _0x17d114 !== _0x316b5e,
      _0xb882dc = Boolean(_0x175bb6['videoRef']) && _0x1afca9 === _0x316b5e,
      _0xb8abe9 = {
        ..._0x114d54,
        shots: _0x114d54['shots']['map']((_0xed2e21) =>
          _0xed2e21['id'] === _0x15ff54
            ? {
                ..._0xed2e21,
                isReversed: _0x316b5e,
                materializedIsReversed: _0x1afca9,
                materializationStatus: _0xb882dc ? 'succeeded' : 'running',
                materializationProgress: _0xb882dc ? 0x64 : 0x0,
                ...(_0x397d17
                  ? { replacementImage: { results: [], activeIndex: 0x0 }, replacementImageRef: '' }
                  : {}),
                error: '',
              }
            : _0xed2e21,
        ),
        ...(_0x397d17
          ? {
              workspace: {
                ..._0x114d54['workspace'],
                imageGeneration: { status: 'idle', shotId: '', error: '' },
                imageGenerationsByShotId: {},
                videoGeneration: { status: 'idle', shotId: '', error: '' },
                videoGenerationsByShotId: {},
                videoPreparation: { status: 'idle', progress: 0x0, error: '' },
              },
            }
          : {}),
      },
      _0x22a7ed = _0x495d5a(_0xb8abe9, { renderWorkspace: ![] });
    if (_0xb882dc)
      return {
        project: _0x22a7ed,
        completion: _0x4e87f0['trackReverseCompletion']({
          projectId: _0x53a63c,
          shotId: _0x15ff54,
          completion: Promise['resolve']({ ok: !![], project: cloneJson(_0x22a7ed), changedShotCount: 0x0 }),
        }),
      };
    const _0x1f1b7b = _0x22a7ed['shots']['map']((_0x5978ff) => ({
        shotId: _0x5978ff['id'],
        sourceId: _0x5978ff['sourceId'],
        startSec: _0x5978ff['startTimeSec'],
        endSec: _0x5978ff['endTimeSec'],
        ...(_0x5978ff['isReversed'] === !![] ? { isReversed: !![] } : {}),
      })),
      _0x370ac1 = _0x474750({
        ranges: _0x1f1b7b,
        selectedShotId: _0x22a7ed['workspace']['selectedShotId'] || _0x15ff54,
        renderWorkspace: ![],
        notify: ![],
        revision: _0x3891b4,
      })
        ['then']((_0x658b7) => ({ ok: _0x658b7?.['stale'] !== !![], ..._0x658b7 }))
        ['catch']((_0x52f2f0) => {
          const _0x2507c9 = _0x52f2f0?.['message'] || '视频倒放失败，请重试。',
            _0x9891ff = _0x491208();
          return (
            !isDestroyed() &&
              _0x4e87f0['isCurrent'](_0x3891b4) &&
              normalizeText(_0x9891ff['id']) === _0x53a63c &&
              (_0x495d5a(
                {
                  ..._0x9891ff,
                  shots: _0x9891ff['shots']['map']((_0x4d4507) =>
                    _0x4d4507['id'] === _0x15ff54
                      ? {
                          ..._0x4d4507,
                          materializationStatus: 'failed',
                          materializationProgress: 0x0,
                          error: _0x2507c9,
                        }
                      : _0x4d4507,
                  ),
                },
                { renderWorkspace: ![] },
              ),
              _0x421368(_0x2507c9, 'error')),
            { ok: ![], project: _0x21297a(), error: _0x2507c9, stale: !_0x4e87f0['isCurrent'](_0x3891b4) }
          );
        });
    return {
      project: _0x22a7ed,
      completion: _0x4e87f0['trackReverseCompletion']({
        projectId: _0x53a63c,
        shotId: _0x15ff54,
        completion: _0x370ac1,
      }),
    };
  };
}
