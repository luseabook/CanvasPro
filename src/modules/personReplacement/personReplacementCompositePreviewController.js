import { localPathToUrl } from '../../utils/localMediaPath.js';
import { createPersonReplacementCompositeMediaResidency } from './personReplacementCompositeMediaResidency.js';
import { buildPersonReplacementCompositePreviewSnapshot } from './personReplacementCompositePreviewProjection.js';
import {
  createPersonReplacementCompositePlaybackBinding,
  PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES,
  PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS,
} from './personReplacementCompositePlayback.js';
function normalizeText(_0x309fdd, _0x16b44c = '') {
  const _0x473d65 = String(_0x309fdd ?? '')['trim']();
  return _0x473d65 || _0x16b44c;
}
function normalizeMediaUrl(_0x41549e) {
  const _0x4e3d35 = normalizeText(_0x41549e);
  if (!_0x4e3d35) return '';
  return localPathToUrl(_0x4e3d35) || _0x4e3d35;
}
export function createPersonReplacementCompositePreviewController({
  getRoot: _0x2c653c,
  getProject: _0x16c781,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'] || globalThis,
  createVideoPlayback: _0x4d200d,
  createPlaybackBinding: createPlaybackBinding = createPersonReplacementCompositePlaybackBinding,
  createMediaResidency: createMediaResidency = createPersonReplacementCompositeMediaResidency,
} = {}) {
  if (typeof _0x2c653c !== 'function' || typeof _0x16c781 !== 'function' || typeof _0x4d200d !== 'function')
    throw new Error('person replacement composite preview requires workspace adapters');
  const _0x350852 = createMediaResidency({ projectId: _0x16c781()?.['id'] });
  let _0x5e429f = null,
    _0x36088e = ![];
  const _0x227b22 = () => {
      (_0x5e429f?.['destroy']?.(), (_0x5e429f = null));
    },
    _0x18fb8f = ({ composeOnly: composeOnly = ![] } = {}) => {
      const _0x23953d = _0x350852['peek']('original');
      if (composeOnly && _0x23953d?.['reason'] !== 'compose') return ![];
      if (!_0x23953d) return ![];
      if (_0x23953d['preserveVisibleElement'] === !![] && !_0x23953d['controller'])
        return _0x350852['forget']('original');
      return _0x350852['evict']('original');
    },
    _0x589ef3 = () => _0x350852['evict']('replacement'),
    _0x5b3f1b = (_0x269dc2 = '') => {
      if (_0x36088e) return ![];
      const _0x4dd324 = normalizeMediaUrl(_0x269dc2);
      if (!_0x4dd324) return (_0x18fb8f(), ![]);
      if (_0x350852['peek']('original')?.['sourceUrl'] === _0x4dd324) return !![];
      _0x18fb8f();
      const _0x2b2f39 = _0x16c781(),
        _0x31e571 = _0x2c653c(),
        _0x9a9504 = _0x31e571?.['querySelector']?.('[data-person-replacement-compare-video="original"]'),
        _0x313300 = normalizeText(_0x9a9504?.['dataset']?.['personReplacementCompareVideoUrl']),
        _0x4b359e = normalizeText(
          _0x9a9504?.['getAttribute']?.('src') || _0x9a9504?.['currentSrc'] || _0x9a9504?.['src'],
        ),
        _0x1b295f = Boolean(_0x9a9504 && _0x313300 === _0x4dd324 && _0x4b359e),
        _0x22cb28 = _0x1b295f ? _0x9a9504 : documentObject?.['createElement']?.('video');
      if (!_0x22cb28) return ![];
      ((_0x22cb28['dataset']['personReplacementCompareVideo'] = 'original'),
        (_0x22cb28['dataset']['personReplacementCompareVideoUrl'] = _0x4dd324),
        (_0x22cb28['preload'] = 'auto'),
        (_0x22cb28['muted'] = !![]));
      !_0x1b295f &&
        (_0x22cb28['classList']?.['add']?.('person-replacement-composite-original-prewarm'),
        _0x22cb28['setAttribute']?.('aria-hidden', 'true'),
        _0x22cb28['setAttribute']?.('tabindex', '-1'));
      _0x22cb28['setAttribute']?.('playsinline', '');
      const _0x322142 = _0x350852['nextSequence']('original');
      let _0x330d01 = null;
      if (!_0x1b295f)
        try {
          _0x330d01 = _0x4d200d({
            videoEl: _0x22cb28,
            sourceUrl: _0x4dd324,
            ownerId: [
              'person-replacement',
              normalizeText(_0x2b2f39?.['id']) || 'project',
              'complete-video',
              'composite',
              'original',
              'warmup-' + _0x322142,
            ]['join'](':'),
            allowConcurrentPlayback: !![],
            preferStreamingSource: ![],
            acquirePlaybackOptions: {
              bypassConcurrencyLimit: !![],
              maxBytes: PERSON_REPLACEMENT_COMPOSITE_PREWARM_MAX_BYTES,
              timeout: PERSON_REPLACEMENT_COMPOSITE_PREWARM_TIMEOUT_MS,
            },
          });
        } catch {
          return (_0x22cb28['remove']?.(), ![]);
        }
      const _0x41b713 = _0x350852['retain']({
        projectId: _0x2b2f39?.['id'],
        role: 'original',
        sourceUrl: _0x4dd324,
        videoEl: _0x22cb28,
        controller: _0x330d01,
        preserveVisibleElement: _0x1b295f,
        reason: 'compose',
      });
      if (!_0x41b713) return (_0x330d01?.['destroy']?.(), _0x22cb28['remove']?.(), ![]);
      if (!_0x1b295f) {
        const _0x10cd29 =
          _0x31e571?.['querySelector']?.(
            '[data-person-replacement-compare-card="original"] ' + '.person-replacement-compare-media-frame',
          ) || documentObject?.['body'];
        _0x10cd29?.['appendChild']?.(_0x22cb28);
      }
      const _0x1cbec6 = _0x1b295f
        ? _0x5e429f?.['warmOriginalPlayback']?.(_0x4dd324)
        : typeof _0x330d01?.['play'] === 'function'
          ? _0x330d01['play']()
          : _0x330d01?.['warm']?.();
      return (
        void Promise['resolve'](_0x1cbec6)
          ['then'](() => {
            if (_0x350852['peek']('original')?.['videoEl'] !== _0x22cb28) return;
            try {
              _0x22cb28['pause']?.();
            } catch {}
          })
          ['catch'](() => ![]),
        !![]
      );
    },
    _0x3c9660 = (_0x45e3a8) => {
      const _0x2e39c2 = _0x16c781(),
        _0x1c6ad7 = normalizeText(_0x45e3a8?.['dataset']?.['personReplacementCompareVideoUrl']);
      return _0x350852['adopt']({
        projectId: _0x2e39c2?.['id'],
        role: 'original',
        sourceUrl: _0x1c6ad7,
        renderedVideo: _0x45e3a8,
      });
    },
    _0x1f9fcf = (_0x475cfe) => {
      const _0x5b5625 = _0x16c781(),
        _0x5d6409 = _0x350852['peek']('replacement'),
        _0x1f444d = normalizeText(_0x475cfe?.['dataset']?.['personReplacementCompareVideoUrl']);
      if (
        !_0x5d6409 ||
        !_0x475cfe ||
        _0x1f444d !== _0x5d6409['sourceUrl'] ||
        (_0x475cfe !== _0x5d6409['videoEl'] && typeof _0x475cfe['replaceWith'] !== 'function')
      )
        return (
          _0x5d6409 &&
            buildPersonReplacementCompositePreviewSnapshot(_0x5b5625)['previewMode'] === 'full' &&
            _0x1f444d !== _0x5d6409['sourceUrl'] &&
            _0x589ef3(),
          null
        );
      return _0x350852['adopt']({
        projectId: _0x5b5625?.['id'],
        role: 'replacement',
        sourceUrl: _0x1f444d,
        renderedVideo: _0x475cfe,
      });
    },
    _0x217895 = () => {
      const _0x1d2961 = _0x350852['peek']('original');
      if (!_0x1d2961 || _0x1d2961['controller'] || _0x1d2961['preserveVisibleElement'] !== !![]) return ![];
      const _0x256336 = _0x5e429f?.['retainOriginalPlayback']?.(_0x1d2961['sourceUrl']);
      if (!_0x256336?.['controller']) return ![];
      if (!_0x350852['handoff']('original', _0x256336)) return (_0x256336['controller']['destroy']?.(), ![]);
      return ((_0x5e429f = null), !![]);
    },
    _0x539722 = () => {
      if (_0x350852['has']('original') || _0x350852['has']('replacement')) return ![];
      const _0x94380a = _0x16c781(),
        _0x333a25 = buildPersonReplacementCompositePreviewSnapshot(_0x94380a)['fullMedia'],
        _0x29a1bc = _0x5e429f?.['retainFullPlaybacks']?.({
          original: normalizeMediaUrl(_0x333a25['originalRef']),
          replacement: normalizeMediaUrl(_0x333a25['replacementRef']),
        });
      if (!_0x29a1bc?.['original'] && !_0x29a1bc?.['replacement']) return ![];
      return (
        _0x29a1bc['original'] &&
          _0x350852['retain']({
            ..._0x29a1bc['original'],
            projectId: _0x94380a?.['id'],
            role: 'original',
            preserveVisibleElement: !![],
            reason: 'mode-cache',
          }),
        _0x29a1bc['replacement'] &&
          _0x350852['retain']({
            ..._0x29a1bc['replacement'],
            projectId: _0x94380a?.['id'],
            role: 'replacement',
          }),
        (_0x5e429f = null),
        !![]
      );
    },
    _0x41506c = () => {
      _0x227b22();
      if (_0x36088e) return ![];
      const _0x5b3225 = _0x16c781();
      if (_0x5b3225?.['workspace']?.['view'] !== 'project' || _0x5b3225['workspace']['step'] !== 0x5)
        return ![];
      const _0x1e0efd = _0x2c653c(),
        _0x3d1237 = _0x1e0efd?.['querySelector']?.(
          '[data-person-replacement-compare-video=\x22original\x22]',
        ),
        _0x28361c = _0x3c9660(_0x3d1237),
        _0x5c12af = _0x28361c?.['videoEl'] || _0x3d1237,
        _0x2df70e = _0x1e0efd?.['querySelector']?.('[data-person-replacement-compare-video="replacement"]'),
        _0x302333 = _0x1f9fcf(_0x2df70e),
        _0x8bb291 = _0x302333?.['videoEl'] || _0x2df70e;
      return (
        (_0x5e429f = createPlaybackBinding({
          root: _0x1e0efd,
          project: _0x5b3225,
          getProject: _0x16c781,
          windowObject: windowObject,
          createVideoPlayback: _0x4d200d,
          originalVideo: _0x5c12af,
          replacementVideo: _0x8bb291,
          adoptedOriginalPlayback: _0x28361c,
          adoptedReplacementPlayback: _0x302333,
        })),
        Boolean(_0x5e429f)
      );
    };
  return Object['freeze']({
    bind: _0x41506c,
    stop: _0x227b22,
    startOriginalWarmup: _0x5b3f1b,
    releaseOriginalWarmup: _0x18fb8f,
    releaseReplacementCache: _0x589ef3,
    prepareOriginalHandoff: _0x217895,
    retainFullVideosForPageRefresh: _0x539722,
    togglePlayback: () => _0x5e429f?.['togglePlayback']?.() ?? ![],
    setTrack: (_0x1813d9) => _0x5e429f?.['setTrack']?.(_0x1813d9),
    switchProject: (_0x442014) => _0x350852['switchProject'](_0x442014),
    dispose() {
      if (_0x36088e) return;
      (_0x227b22(), _0x350852['dispose'](), (_0x36088e = !![]));
    },
  });
}
