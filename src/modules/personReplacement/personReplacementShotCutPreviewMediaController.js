import { localPathToUrl } from '../../utils/localMediaPath.js';
import { syncPersonReplacementVideoStageFrame } from './personReplacementVideoPresentation.js';
import { resolvePersonReplacementSourcePlaybackRef } from './personReplacementSourcePlayback.js';
function normalizeText(_0x50704d) {
  return String(_0x50704d ?? '')['trim']();
}
function normalizeMediaUrl(_0x29c86f) {
  const _0xdb2eb8 = normalizeText(_0x29c86f);
  if (!_0xdb2eb8) return '';
  return localPathToUrl(_0xdb2eb8) || _0xdb2eb8;
}
export function createPersonReplacementShotCutPreviewMediaController({
  session: _0x2d09c5,
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  getSelectedShot: getSelectedShot = () => null,
  createVideoPlayback: createVideoPlayback = () => null,
  documentObject: documentObject = globalThis['document'],
  isDestroyed: isDestroyed = () => ![],
} = {}) {
  if (!_0x2d09c5?.['workspaceState']) throw new TypeError('Shot cut preview media requires a session.');
  const _0xe31f05 = _0x2d09c5['workspaceState'];
  let _0x1e711e = null,
    _0x1ae5ba = null;
  const _0x499c94 = (_0x5f5f85) => {
      const _0x16d7b9 = normalizeText(_0x5f5f85);
      if (!_0x16d7b9) return '';
      const _0x18bea6 = getProject(),
        _0x2c09eb = _0x18bea6['sources']['find']((_0x3c2a09) => _0x3c2a09['id'] === _0x16d7b9),
        _0x2d270 = _0x18bea6['shots']['find']((_0x558795) => _0x558795['sourceId'] === _0x16d7b9);
      return normalizeMediaUrl(
        resolvePersonReplacementSourcePlaybackRef({
          runtimePreviewRef: _0x18bea6['sourcePreviewRefs']?.[_0x16d7b9],
          source: _0x2c09eb,
          sourceShot: _0x2d270,
        }),
      );
    },
    _0x4a2299 = () => _0x2d09c5['clearBufferedWarmup'](),
    _0x22f260 = (_0x133c61, _0x4f2afb) => {
      _0x4a2299();
      if (!_0x133c61) return ![];
      const _0x34bc6e = Math['max'](0x0, Number(_0x4f2afb) || 0x0),
        _0x5d863e = () => {
          _0x4a2299();
          try {
            if (
              !Number['isFinite'](Number(_0x133c61['currentTime'])) ||
              Math['abs'](Number(_0x133c61['currentTime']) - _0x34bc6e) > 0.02
            )
              _0x133c61['currentTime'] = _0x34bc6e;
          } catch {}
        };
      if (Number(_0x133c61['readyState']) >= 0x1) return (_0x5d863e(), !![]);
      return (
        _0x133c61['addEventListener']?.('loadedmetadata', _0x5d863e, { once: !![] }),
        (_0xe31f05['bufferedWarmupCleanup'] = () => {
          _0x133c61['removeEventListener']?.('loadedmetadata', _0x5d863e);
        }),
        !![]
      );
    },
    _0x288ac6 = () => _0x2d09c5['releasePreviewBuffer'](),
    _0x192538 = () => {
      const _0x18285d = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!_0x18285d) return ![];
      const _0x2addba = normalizeText(_0x18285d['dataset']?.['sourceId']),
        _0x30c253 = normalizeText(
          _0x18285d['dataset']?.['personReplacementShotCutMediaRef'] || _0x499c94(_0x2addba),
        );
      if (!_0x2addba || !_0x30c253) return ![];
      ((_0xe31f05['bufferedVideo'] = _0x18285d),
        (_0xe31f05['bufferedSourceId'] = _0x2addba),
        (_0xe31f05['bufferedMediaRef'] = _0x30c253),
        _0x2d09c5['attachPreviewBuffer'](_0x18285d));
      try {
        _0x18285d['remove']?.();
      } catch {}
      return !![];
    },
    _0xa0a188 = () => {
      const _0x3be7ee = getRoot()?.['querySelector']?.('[data-person-replacement-shot-cut-video]');
      if (!_0x3be7ee || !_0xe31f05['bufferedVideo']) return null;
      const _0x4df7c2 = normalizeText(_0x3be7ee['dataset']?.['sourceId']),
        _0x29324b = _0x499c94(_0x4df7c2);
      if (
        !_0x4df7c2 ||
        !_0x29324b ||
        _0x4df7c2 !== _0xe31f05['bufferedSourceId'] ||
        _0x29324b !== _0xe31f05['bufferedMediaRef'] ||
        typeof _0x3be7ee['replaceWith'] !== 'function'
      )
        return (_0x288ac6(), null);
      const _0x1a4f5e = _0xe31f05['bufferedVideo'];
      ((_0x1a4f5e['preload'] = 'auto'),
        (_0x1a4f5e['playsInline'] = !![]),
        (_0x1a4f5e['muted'] = !_0xe31f05['soundEnabled']),
        (_0x1a4f5e['dataset']['sourceId'] = _0x4df7c2),
        _0x1a4f5e['setAttribute']?.('aria-label', '镜头切口预览'),
        _0x1a4f5e['setAttribute']?.('preload', 'auto'),
        _0x1a4f5e['setAttribute']?.('playsinline', ''),
        _0x1a4f5e['setAttribute']?.('data-person-replacement-shot-cut-video', ''),
        _0x1a4f5e['setAttribute']?.('data-source-id', _0x4df7c2),
        _0x1a4f5e['removeAttribute']?.('aria-hidden'));
      const _0x346f74 = _0x3be7ee['getAttribute']?.('poster');
      if (_0x346f74) _0x1a4f5e['setAttribute']?.('poster', _0x346f74);
      else _0x1a4f5e['removeAttribute']?.('poster');
      return (
        _0x3be7ee['replaceWith'](_0x1a4f5e),
        syncPersonReplacementVideoStageFrame(_0x1a4f5e),
        _0x1a4f5e
      );
    },
    _0x5f44e5 = (_0x322fc1, _0xcf43bf, _0x3aaf14) => {
      const _0x497535 = normalizeText(_0xcf43bf),
        _0x1a69cf = normalizeMediaUrl(_0x3aaf14);
      if (!_0x322fc1 || !_0x497535 || !_0x1a69cf) return ![];
      const _0x556362 = getProject();
      ((_0x322fc1['dataset']['sourceId'] = _0x497535),
        (_0x322fc1['dataset']['personReplacementShotCutMediaRef'] = _0x1a69cf),
        (_0xe31f05['bufferedVideo'] = _0x322fc1),
        (_0xe31f05['bufferedSourceId'] = _0x497535),
        (_0xe31f05['bufferedMediaRef'] = _0x1a69cf));
      const _0x4bb57e = () => {
        (_0x2d09c5['attachPreviewBuffer'](_0x322fc1, () => {}),
          _0x322fc1['setAttribute']?.('src', _0x1a69cf));
        try {
          _0x322fc1['load']?.();
        } catch {}
        return !![];
      };
      if (/^(?:blob:|data:)/i['test'](_0x1a69cf)) return _0x4bb57e();
      let _0x45a2fa = null;
      try {
        _0x45a2fa = createVideoPlayback({
          videoEl: _0x322fc1,
          sourceUrl: _0x1a69cf,
          ownerId: ['person-replacement', normalizeText(_0x556362['id']) || 'project', 'shot-cut-preview'][
            'join'
          ](':'),
          allowConcurrentPlayback: !![],
          preferStreamingSource: !![],
          acquirePlaybackOptions: { bypassConcurrencyLimit: !![] },
        });
      } catch {}
      if (!_0x45a2fa || typeof _0x45a2fa['warm'] !== 'function')
        return (_0x45a2fa?.['destroy']?.(), _0x4bb57e());
      (_0x2d09c5['attachPreviewBuffer'](_0x322fc1, () => {
        (_0x1e711e === _0x45a2fa && ((_0x1e711e = null), (_0x1ae5ba = null)), _0x45a2fa['destroy']?.());
      }),
        (_0x1e711e = _0x45a2fa),
        (_0x1ae5ba = _0x322fc1));
      const _0x56d77b = () => {
        if (
          isDestroyed() ||
          _0xe31f05['bufferedVideo'] !== _0x322fc1 ||
          normalizeText(_0x322fc1['dataset']?.['sourceId']) !== _0x497535 ||
          normalizeText(_0x322fc1['getAttribute']?.('src') || _0x322fc1['src'])
        )
          return ![];
        return _0x4bb57e();
      };
      return (
        void Promise['resolve'](_0x45a2fa['warm']())['then'](
          (_0x467937) => (_0x467937 ? !![] : _0x56d77b()),
          _0x56d77b,
        ),
        !![]
      );
    },
    _0x25f472 = (_0x22421e) => {
      if (_0x22421e && _0x1ae5ba === _0x22421e && typeof _0x1e711e?.['play'] === 'function')
        return _0x1e711e['play']();
      return _0x22421e?.['play']?.();
    },
    _0x1baa11 = () => {
      const _0x3662f0 = getProject(),
        _0x3062b8 = Math['trunc'](Number(_0x3662f0['workspace']['step']) || 0x1);
      if (
        _0xe31f05['isOpen'] ||
        _0x3662f0['workspace']['view'] !== 'project' ||
        ![0x1, 0x2]['includes'](_0x3062b8)
      ) {
        if (!_0xe31f05['isOpen']) _0x288ac6();
        return ![];
      }
      const _0x42e893 = 'auto',
        _0x363008 = getSelectedShot(_0x3662f0),
        _0x33f36c = normalizeText(_0x363008?.['sourceId']),
        _0x5975b6 = _0x499c94(_0x33f36c),
        _0x485bca = Math['max'](0x0, Number(_0x363008?.['startTimeSec']) || 0x0);
      if (!_0x33f36c || !_0x5975b6) return (_0x288ac6(), ![]);
      if (
        _0xe31f05['bufferedVideo'] &&
        _0xe31f05['bufferedSourceId'] === _0x33f36c &&
        _0xe31f05['bufferedMediaRef'] === _0x5975b6
      )
        return (
          (_0xe31f05['bufferedVideo']['preload'] = _0x42e893),
          _0xe31f05['bufferedVideo']['setAttribute']?.('preload', _0x42e893),
          (_0xe31f05['bufferedVideo']['muted'] = !![]),
          _0x22f260(_0xe31f05['bufferedVideo'], _0x485bca),
          !![]
        );
      _0x288ac6();
      if (!documentObject?.['defaultView']?.['HTMLVideoElement']) return ![];
      const _0x15dcfc = documentObject?.['createElement']?.('video');
      if (normalizeText(_0x15dcfc?.['tagName'])['toUpperCase']() !== 'VIDEO') return ![];
      return (
        (_0x15dcfc['preload'] = _0x42e893),
        (_0x15dcfc['playsInline'] = !![]),
        (_0x15dcfc['muted'] = !![]),
        (_0x15dcfc['dataset']['sourceId'] = _0x33f36c),
        _0x15dcfc['setAttribute']?.('preload', _0x42e893),
        _0x15dcfc['setAttribute']?.('playsinline', ''),
        _0x15dcfc['setAttribute']?.('muted', ''),
        _0x15dcfc['setAttribute']?.('aria-hidden', 'true'),
        _0x5f44e5(_0x15dcfc, _0x33f36c, _0x5975b6),
        _0x22f260(_0x15dcfc, _0x485bca),
        !![]
      );
    };
  return Object['freeze']({
    attachPreviewMedia: _0x5f44e5,
    getSourceMediaRef: _0x499c94,
    playPreviewVideo: _0x25f472,
    preparePreviewVideo: _0x1baa11,
    preserveBufferedVideo: _0x192538,
    releaseBufferedVideo: _0x288ac6,
    restoreBufferedVideo: _0xa0a188,
  });
}
