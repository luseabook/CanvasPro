import { createStoryVideoPlayback } from './storyVideoPlayback.js';
import { bindStoryReplicationReviewThumbnails } from './storyReplicationReviewThumbnails.js';
import {
  renderStoryReplicationReview,
  renderStoryReplicationReviewTab,
  renderStoryReplicationCast,
  renderStoryReplicationEvidenceSummary,
  syncStoryReplicationReviewStatus,
} from './storyReplicationReviewPresentation.js';
import {
  createStoryReplicationReviewNavigation,
  renderStoryReplicationSegments,
} from './storyReplicationReviewNavigation.js';
import {
  editStoryReplicationSource,
  addStoryReplicationCharacter,
  removeStoryReplicationCharacter,
  mergeStoryReplicationCharacters,
  setStoryReplicationCharacterPresence,
} from './storyReplicationSourceEditing.js';
import { createStoryReplicationPortraitEditor } from './storyReplicationPortraitController.js';
import { captureStoryReplicationRepresentativeFrame } from './storyReplicationRepresentativeFrames.js';
import { bindStoryReplicationSelects } from './storyReplicationSelects.js';
import { bindStoryReplicationReviewLayout } from './storyReplicationReviewLayout.js';
export function bindStoryReplicationReview(
  _0x468260,
  {
    state: _0xa141b0,
    createProjectToken: _0x176490,
    isProjectTaskLive: _0x5ca9be,
    syncProjectEntry: _0x44f9f7,
    schedulePersistence: _0x3938ec,
    refreshFooter: _0x417155,
    showToast: _0x5bfa38,
    captureFrame: captureFrame = captureStoryReplicationRepresentativeFrame,
    reanalyze: _0x1b6a98,
  } = {},
) {
  const _0x539882 = _0x468260['querySelector']('[data-replication-review-host]');
  if (!_0x539882) return null;
  let _0x4b362c = null,
    _0x59a3d1 = null,
    _0x257cb6 = 'story',
    _0x4bfde0 = ![],
    _0x124dab = 0x0,
    _0x3d9555 = null,
    _0x2aefb1 = null,
    _0x19b253 = null,
    _0x1b1e8c = null,
    _0x496441 = '',
    _0x364df4 = null,
    _0x1d8c9c = null,
    _0x1133db = ![];
  const _0x10e0bb = { left: 0x14, right: 0x38 },
    _0x5e4520 = (_0x209a22) =>
      _0x5ca9be(_0x209a22['token']) &&
      _0x209a22['episode']['replication']['sourceAnalysis'] === _0x209a22['source'],
    _0x3f6e23 = (_0x128d09) =>
      !_0x4bfde0 && !_0x539882['hidden'] && _0x4b362c === _0x128d09 && _0x5e4520(_0x128d09),
    _0x3cdbdb = () => ['uploading', 'analyzing']['includes'](_0x4b362c?.['episode']['replication']['status']);
  function _0x51cefc(_0x32d0e6 = '') {
    if (_0x4b362c && _0x3f6e23(_0x4b362c))
      syncStoryReplicationReviewStatus(_0x539882, _0x4b362c['episode'], {
        busy: _0x4b362c['busy'] === !![] || _0x3cdbdb(),
        message: _0x32d0e6,
      });
    _0x19b253?.['sync']();
  }
  function _0x40470b(_0x1446fc) {
    (_0x44f9f7(_0x1446fc['token']), _0x3938ec({ immediate: !![] }), _0x417155());
    if (!_0x3f6e23(_0x1446fc)) {
      _0x1446fc['needsRefresh'] = !![];
      return;
    }
    for (const _0x6729b1 of _0x539882['querySelectorAll']('[data-replication-review-summary]')) {
      _0x6729b1['textContent'] = renderStoryReplicationEvidenceSummary(_0x1446fc['source']);
    }
    _0x3f6e23(_0x1446fc) && (_0x1b1e8c['sync'](), _0x96b431());
  }
  function _0x96b431() {
    const _0x1b7b52 = renderStoryReplicationCast(_0x4b362c['episode'], _0x1b1e8c['selected']()?.['id']);
    _0x1b7b52 !== _0x496441 &&
      ((_0x539882['querySelector']('[data-replication-cast]')['innerHTML'] = _0x1b7b52),
      (_0x496441 = _0x1b7b52));
  }
  function _0x51e948({ release: release = ![] } = {}) {
    _0x4b362c &&
      !_0x539882['hidden'] &&
      !release &&
      (_0x4b362c['scrollPositions'] = [..._0x539882['querySelectorAll']('*')]
        ['filter']((_0x19c43c) => _0x19c43c['scrollTop'] || _0x19c43c['scrollLeft'])
        ['map']((_0xcf01ab) => ({
          element: _0xcf01ab,
          top: _0xcf01ab['scrollTop'],
          left: _0xcf01ab['scrollLeft'],
        })));
    (_0x1d8c9c?.['destroy'](),
      (_0x1d8c9c = null),
      _0x19b253?.['close'](),
      (_0x124dab += 0x1),
      _0x3d9555?.(),
      _0x539882['querySelector']('video')?.['pause']());
    const _0x2ade09 = _0x539882['querySelector']('[data-replication-seeking]');
    if (_0x2ade09) _0x2ade09['hidden'] = !![];
    ((_0x539882['hidden'] = !![]),
      _0x468260['querySelector']('[data-story-replication-grid]')?.['removeAttribute']('hidden'));
    if (!release) {
      _0x364df4?.['suspend']();
      return;
    }
    (_0x364df4?.['destroy'](),
      (_0x364df4 = null),
      _0x19b253?.['destroy'](),
      (_0x19b253 = null),
      _0x2aefb1?.['destroy'](),
      (_0x2aefb1 = null),
      _0x59a3d1?.['destroy']());
    const _0x48fb0c = _0x539882['querySelector']('video');
    (_0x48fb0c && (_0x48fb0c['removeAttribute']('src'), _0x48fb0c['load']()),
      (_0x59a3d1 = null),
      (_0x4b362c = null),
      (_0x1b1e8c = null),
      (_0x496441 = ''),
      _0x539882['replaceChildren'](),
      (_0x539882['hidden'] = !![]),
      _0x468260['querySelector']('[data-story-replication-grid]')?.['removeAttribute']('hidden'));
  }
  function _0x3e6383({ preserveScroll: preserveScroll = ![] } = {}) {
    const _0x2200b5 = _0x539882['querySelector']('[data-replication-fields]')['scrollTop'];
    (_0x19b253?.['destroy'](),
      _0x2aefb1?.['destroy'](),
      (_0x2aefb1 = null),
      (_0x539882['querySelector']('[data-replication-fields]')['innerHTML'] = renderStoryReplicationReviewTab(
        _0x4b362c['episode'],
        _0x257cb6,
        _0x1b1e8c['selected']()?.['id'],
      )),
      (_0x19b253 = bindStoryReplicationSelects(_0x539882)),
      _0x539882['querySelectorAll']('[data-replication-tab]')['forEach']((_0x2c4936) => {
        (_0x2c4936['setAttribute'](
          'aria-pressed',
          String(_0x2c4936['dataset']['replicationTab'] === _0x257cb6),
        ),
          _0x2c4936['getAttribute']('role') === 'tab' &&
            (_0x2c4936['setAttribute'](
              'aria-selected',
              String(_0x2c4936['dataset']['replicationTab'] === _0x257cb6),
            ),
            (_0x2c4936['tabIndex'] = _0x2c4936['dataset']['replicationTab'] === _0x257cb6 ? 0x0 : -0x1)));
      }));
    const _0x3f68f9 = _0x539882['querySelector']('.story-source-tabs');
    _0x3f68f9['style']['setProperty'](
      '--review-tab-index',
      Math['max'](0x0, ['overview', 'story', 'dialogue', 'characters', 'shots']['indexOf'](_0x257cb6)),
    );
    if (preserveScroll) _0x539882['querySelector']('[data-replication-fields]')['scrollTop'] = _0x2200b5;
    else _0x1b1e8c['restore'](_0x257cb6);
    _0x51cefc();
  }
  function _0xb4b6d8(_0x46a0e0) {
    if (_0x257cb6 === _0x46a0e0) return;
    (_0x1b1e8c['save'](_0x257cb6), (_0x257cb6 = _0x46a0e0), _0x3e6383());
  }
  function _0x3773e6(_0x36eee8, _0x2c1477) {
    const _0xb95b0c = _0x4b362c,
      _0x435fe2 = _0x124dab + 0x1;
    void _0x4494bf(_0x36eee8, _0x2c1477)['catch'](() => {
      if (_0x3f6e23(_0xb95b0c) && _0x435fe2 === _0x124dab) _0x51cefc('原视频定位或播放失败，请重试。');
    });
  }
  async function _0x4494bf(_0x390703, { play: play = ![] } = {}) {
    const _0x152cf5 = _0x4b362c,
      _0x17649b = ++_0x124dab;
    _0x3d9555?.();
    const _0x4eafe3 = _0x539882['querySelector']('video'),
      _0x523bca = _0x539882['querySelector']('[data-replication-seeking]');
    ((_0x523bca['hidden'] = _0x4eafe3['readyState'] >= 0x1), _0x51cefc());
    try {
      if (_0x4eafe3['readyState'] < 0x1 && !(await _0x59a3d1['warm']())) return;
      if (!_0x3f6e23(_0x152cf5) || _0x17649b !== _0x124dab) return;
      _0x4eafe3['readyState'] < 0x1 &&
        (await new Promise((_0x1358b0) => {
          const _0x5c7bdc = () => {
              (clearTimeout(_0x45a1a4),
                _0x4eafe3['removeEventListener']('loadedmetadata', _0x5c7bdc),
                _0x4eafe3['removeEventListener']('error', _0x5c7bdc));
              if (_0x3d9555 === _0x5c7bdc) _0x3d9555 = null;
              _0x1358b0();
            },
            _0x45a1a4 = setTimeout(_0x5c7bdc, 0x1f40);
          ((_0x3d9555 = _0x5c7bdc),
            _0x4eafe3['addEventListener']('loadedmetadata', _0x5c7bdc, { once: !![] }),
            _0x4eafe3['addEventListener']('error', _0x5c7bdc, { once: !![] }));
        }));
      if (!_0x3f6e23(_0x152cf5) || _0x17649b !== _0x124dab) return;
      if (_0x4eafe3['readyState'] < 0x1) {
        _0x51cefc('原视频加载失败，请检查源文件后重试。');
        return;
      }
      const _0x235337 = Math['min'](
        Math['max'](0x0, _0x390703),
        Math['max'](0x0, _0x4eafe3['duration'] - 0.001),
      );
      if (Math['abs'](_0x4eafe3['currentTime'] - _0x235337) > 0.001) _0x4eafe3['currentTime'] = _0x235337;
      if (play) await _0x4eafe3['play']();
      if (_0x3f6e23(_0x152cf5) && _0x17649b === _0x124dab) _0x51cefc();
    } finally {
      if (_0x3f6e23(_0x152cf5) && _0x17649b === _0x124dab) _0x523bca['hidden'] = !![];
    }
  }
  async function _0x2cb1bf(_0x3de84a, _0x265a0f) {
    if (_0x3de84a['dataset']['replicationCrop']) {
      _0x2aefb1?.['destroy']();
      const _0x2fae0e = _0x265a0f['source']['characters']['find'](
        (_0x158e60) => _0x158e60['id'] === _0x3de84a['dataset']['replicationCrop'],
      );
      _0x2aefb1 = createStoryReplicationPortraitEditor({
        card: _0x3de84a['closest']('[data-replication-character]'),
        character: _0x2fae0e,
        capture: (_0x595670) =>
          captureFrame({
            ..._0x595670,
            videoRef: _0x265a0f['episode']['sourceVideo']['videoRef'],
            projectId: _0x265a0f['token']['projectId'],
          }),
        isActive: () => _0x5e4520(_0x265a0f) && _0x265a0f['source']['characters']['includes'](_0x2fae0e),
        showToast: _0x5bfa38,
        onSaved: () => {
          _0x40470b(_0x265a0f);
          if (_0x3f6e23(_0x265a0f)) _0x3e6383({ preserveScroll: !![] });
        },
      });
      return;
    }
    if (_0x3de84a['hasAttribute']('data-replication-add-character')) {
      const _0x19ed99 = _0x539882['querySelector']('video');
      if (_0x19ed99['readyState'] < 0x2 || _0x19ed99['seeking']) {
        _0x5bfa38('请先定位并等待当前人物画面加载。', 'warn');
        return;
      }
      const _0x52daa8 = addStoryReplicationCharacter(_0x265a0f['token']['data'], _0x265a0f['episode'], {
        timeSec: _0x19ed99['currentTime'],
      });
      _0x52daa8 && (_0x40470b(_0x265a0f), _0x3e6383({ preserveScroll: !![] }));
      return;
    }
    if (_0x3de84a['dataset']['replicationRemoveCharacter']) {
      removeStoryReplicationCharacter(
        _0x265a0f['token']['data'],
        _0x265a0f['episode'],
        _0x3de84a['dataset']['replicationRemoveCharacter'],
      ) && (_0x40470b(_0x265a0f), _0x3e6383({ preserveScroll: !![] }));
      return;
    }
    if (_0x3de84a['hasAttribute']('data-replication-reanalyze') && _0x1b6a98) {
      ((_0x265a0f['busy'] = !![]), _0x51cefc('正在重新分析原片…'), _0x51e948());
      try {
        await _0x1b6a98(_0x265a0f['episode']['id']);
        if (!_0x4bfde0 && _0x4b362c === _0x265a0f && _0x5ca9be(_0x265a0f['token'])) {
          ((_0x265a0f['source'] = _0x265a0f['episode']['replication']['sourceAnalysis']),
            _0x1b1e8c['sync']());
          const _0x22bf0a = _0x539882['querySelector']('[data-replication-segments]'),
            _0x3647d5 = _0x22bf0a['scrollTop'];
          ((_0x22bf0a['innerHTML'] = renderStoryReplicationSegments(
            _0x265a0f['source'],
            _0x1b1e8c['selected']()?.['id'],
          )),
            (_0x22bf0a['scrollTop'] = _0x3647d5),
            _0x364df4?.['destroy'](),
            (_0x364df4 = bindStoryReplicationReviewThumbnails(_0x539882, _0x265a0f['episode'])),
            _0x40470b(_0x265a0f),
            _0x3e6383({ preserveScroll: !![] }));
        }
      } catch (_0x446758) {
        if (_0x3f6e23(_0x265a0f))
          _0x5bfa38(_0x446758?.['message'] || '重新分析失败，已保留原分析记录。', 'error');
      } finally {
        _0x265a0f['busy'] = ![];
        if (_0x3f6e23(_0x265a0f)) _0x51cefc(_0x265a0f['episode']['replication']['error'] || '');
      }
      return;
    }
  }
  async function _0x483230(_0x520f2b) {
    const _0x257a81 = _0x1133db && _0x2dfd5e(_0x520f2b['target']);
    _0x1133db = ![];
    if (_0x4b362c && _0x257a81) {
      _0x51e948();
      return;
    }
    const _0x2164fa = _0x520f2b['target']['closest']('button');
    if (!_0x2164fa || _0x2164fa['disabled']) return;
    const _0x2dc40e = _0x2164fa['dataset']['replicationOpen'];
    if (_0x2dc40e) {
      const _0xa0d550 = _0xa141b0['data']['episodes']['find']((_0x496150) => _0x496150['id'] === _0x2dc40e);
      if (!_0xa0d550?.['replication']['sourceAnalysis']) return;
      if (
        _0x4b362c?.['episode'] === _0xa0d550 &&
        _0x5e4520(_0x4b362c) &&
        _0x4b362c['videoRef'] === _0xa0d550['sourceVideo']['videoRef']
      ) {
        ((_0x539882['hidden'] = ![]),
          _0x468260['querySelector']('[data-story-replication-grid]')?.['setAttribute']('hidden', ''),
          _0x1d8c9c?.['destroy'](),
          (_0x1d8c9c = bindStoryReplicationReviewLayout(_0x539882, _0x10e0bb)),
          _0x364df4?.['resume']());
        _0x4b362c['needsRefresh'] &&
          ((_0x4b362c['needsRefresh'] = ![]),
          (_0x539882['querySelector']('[data-replication-review-summary]')['textContent'] =
            renderStoryReplicationEvidenceSummary(_0x4b362c['source'])),
          _0x1b1e8c['sync'](),
          _0x96b431(),
          _0x3e6383({ preserveScroll: !![] }));
        _0x51cefc(_0x4b362c['episode']['replication']['error'] || '');
        for (const { element: _0x5d6df9, top: _0x77efaa, left: _0x5ca3eb } of _0x4b362c['scrollPositions'] ||
          []) {
          _0x539882['contains'](_0x5d6df9) &&
            ((_0x5d6df9['scrollTop'] = _0x77efaa), (_0x5d6df9['scrollLeft'] = _0x5ca3eb));
        }
        return;
      }
      (_0x51e948({ release: !![] }),
        (_0x4b362c = {
          episode: _0xa0d550,
          source: _0xa0d550['replication']['sourceAnalysis'],
          videoRef: _0xa0d550['sourceVideo']['videoRef'],
          token: _0x176490(),
        }),
        (_0x257cb6 = 'story'),
        (_0x539882['hidden'] = ![]),
        (_0x539882['innerHTML'] = renderStoryReplicationReview(_0xa0d550)),
        (_0x1d8c9c = bindStoryReplicationReviewLayout(_0x539882, _0x10e0bb)),
        (_0x1b1e8c = createStoryReplicationReviewNavigation(_0x539882, _0xa0d550)),
        _0x1b1e8c['sync'](),
        (_0x496441 = renderStoryReplicationCast(_0xa0d550, _0x1b1e8c['selected']()?.['id'])),
        (_0x364df4 = bindStoryReplicationReviewThumbnails(_0x539882, _0xa0d550)),
        (_0x19b253 = bindStoryReplicationSelects(_0x539882)),
        _0x468260['querySelector']('[data-story-replication-grid]')?.['setAttribute']('hidden', ''),
        (_0x59a3d1 = createStoryVideoPlayback({
          videoEl: _0x539882['querySelector']('video'),
          sourceUrl: _0xa0d550['sourceVideo']['videoRef'],
          preferStreamingSource: !![],
          ownerId: 'story-source:' + _0x4b362c['token']['projectId'] + ':' + _0xa0d550['id'],
        })),
        _0x51cefc(),
        _0x3773e6(_0x1b1e8c['selected']()?.['startSec'] || 0x0));
      return;
    }
    if (!_0x4b362c || !_0x539882['contains'](_0x2164fa)) return;
    if (_0x2164fa['hasAttribute']('data-replication-close')) {
      _0x51e948();
      return;
    }
    if (_0x2164fa['dataset']['replicationTab']) {
      _0xb4b6d8(_0x2164fa['dataset']['replicationTab']);
      return;
    }
    if (
      _0x2164fa['dataset']['replicationSegment'] ||
      _0x2164fa['hasAttribute']('data-replication-previous') ||
      _0x2164fa['hasAttribute']('data-replication-next')
    ) {
      const _0x10f35e =
        _0x2164fa['dataset']['replicationSegment'] ||
        _0x1b1e8c['adjacent'](_0x2164fa['hasAttribute']('data-replication-next') ? 0x1 : -0x1);
      _0x1b1e8c['save'](_0x257cb6);
      if (_0x1b1e8c['select'](_0x10f35e)) {
        (_0x3e6383(), _0x96b431());
        if (!_0x2164fa['dataset']['replicationSegment']) _0x1b1e8c['reveal']();
        _0x3773e6(_0x1b1e8c['selected']()['startSec']);
      }
      return;
    }
    if (_0x2164fa['dataset']['replicationCharacterLink']) {
      _0xb4b6d8('characters');
      const _0x25ea2d = [..._0x539882['querySelectorAll']('[data-replication-character]')]['find'](
        (_0x1392bc) =>
          _0x1392bc['dataset']['replicationCharacter'] === _0x2164fa['dataset']['replicationCharacterLink'],
      );
      if (_0x25ea2d) {
        const _0xb75de5 = _0x539882['querySelector']('[data-replication-fields]');
        _0xb75de5['scrollTop'] +=
          _0x25ea2d['getBoundingClientRect']()['top'] - _0xb75de5['getBoundingClientRect']()['top'];
      }
      return;
    }
    if (_0x2164fa['hasAttribute']('data-replication-seek')) {
      _0x3773e6(Number(_0x2164fa['dataset']['replicationSeek']), {
        play: _0x2164fa['hasAttribute']('data-replication-listen'),
      });
      return;
    }
    if (_0x4b362c['busy'] || _0x3cdbdb()) return;
    if (_0x4b362c['episode']['clips']?.['length'] && !_0x2164fa['hasAttribute']('data-replication-reanalyze'))
      return;
    const _0x371a30 = _0x4b362c;
    await _0x2cb1bf(_0x2164fa, _0x371a30);
    if (_0x2164fa['dataset']['replicationCapture']) {
      ((_0x371a30['busy'] = !![]), _0x51cefc('正在保存人物代表画面…'));
      try {
        if (_0x2164fa['dataset']['replicationCapture']) {
          const _0x2c6f8f = _0x371a30['source']['characters']['find'](
              (_0x56cfed) => _0x56cfed['id'] === _0x2164fa['dataset']['replicationCapture'],
            ),
            _0x4cf090 = _0x539882['querySelector']('video');
          if (_0x4cf090['readyState'] < 0x2) throw new Error('请先等待原视频画面加载完成。');
          const _0x49dfbd = Number(_0x4cf090['currentTime']);
          if (
            !_0x371a30['source']['events']['some'](
              (_0x89259c) =>
                _0x89259c['characterIds']['includes'](_0x2c6f8f['id']) &&
                _0x49dfbd >= _0x89259c['startSec'] &&
                _0x49dfbd < _0x89259c['endSec'],
            )
          )
            throw new Error('当前时间不在该角色的出场片段内，请先定位其出场画面。');
          const _0x3029e8 = await captureFrame({
            videoRef: _0x371a30['episode']['sourceVideo']['videoRef'],
            timeSec: _0x49dfbd,
            projectId: _0x371a30['token']['projectId'],
            isActive: () => _0x5e4520(_0x371a30),
          });
          _0x3029e8 &&
            _0x5e4520(_0x371a30) &&
            ((_0x2c6f8f['frame'] = _0x3029e8),
            (_0x2c6f8f['frameError'] = ''),
            delete _0x2c6f8f['portrait'],
            _0x40470b(_0x371a30));
        }
        if (_0x3f6e23(_0x371a30)) _0x3e6383({ preserveScroll: !![] });
      } catch (_0x2593b6) {
        if (_0x3f6e23(_0x371a30)) _0x5bfa38(_0x2593b6?.['message'] || '操作失败，请重试。', 'error');
      } finally {
        _0x371a30['busy'] = ![];
        if (_0x3f6e23(_0x371a30)) _0x51cefc(_0x371a30['episode']['replication']['error'] || '');
      }
    }
  }
  function _0x392574(_0x187026) {
    const _0x8c50a0 = _0x187026['target'];
    if (
      _0x4b362c &&
      !_0x4b362c['busy'] &&
      !_0x3cdbdb() &&
      (_0x8c50a0['dataset']['replicationMerge'] || _0x8c50a0['dataset']['replicationPresence'])
    ) {
      const _0x75af6f = _0x8c50a0['dataset']['replicationMerge']
        ? mergeStoryReplicationCharacters(
            _0x4b362c['token']['data'],
            _0x4b362c['episode'],
            _0x8c50a0['dataset']['replicationMerge'],
            _0x8c50a0['value'],
          )
        : setStoryReplicationCharacterPresence(_0x4b362c['token']['data'], _0x4b362c['episode'], {
            characterId: _0x8c50a0['dataset']['replicationPresence'],
            eventId: _0x8c50a0['dataset']['eventId'],
            present: _0x8c50a0['checked'],
          });
      if (_0x75af6f) (_0x40470b(_0x4b362c), _0x3e6383({ preserveScroll: !![] }));
      else
        _0x8c50a0['dataset']['replicationPresence'] &&
          ((_0x8c50a0['checked'] = !_0x8c50a0['checked']),
          _0x5bfa38('角色至少保留一个出场片段；误检角色请直接删除。', 'warn'));
      return;
    }
    if (!_0x4b362c || _0x4b362c['busy'] || _0x3cdbdb() || !_0x8c50a0['dataset']['replicationEdit']) return;
    const _0x2fb419 = editStoryReplicationSource(_0x4b362c['token']['data'], _0x4b362c['episode'], {
      kind: _0x8c50a0['dataset']['replicationEdit'],
      id: _0x8c50a0['dataset']['id'],
      field: _0x8c50a0['dataset']['field'],
      index: _0x8c50a0['dataset']['index'],
      value: _0x8c50a0['type'] === 'checkbox' ? _0x8c50a0['checked'] : _0x8c50a0['value'],
    });
    if (_0x2fb419) {
      (_0x40470b(_0x4b362c), _0x51cefc());
      if (
        _0x8c50a0['dataset']['replicationEdit'] === 'voiceover' &&
        ['kind', 'speakerId']['includes'](_0x8c50a0['dataset']['field'])
      ) {
        const _0x596b41 = _0x4b362c['source']['events']['find'](
            (_0x302ee9) => _0x302ee9['id'] === _0x8c50a0['dataset']['id'],
          )?.['voiceover']?.[Number(_0x8c50a0['dataset']['index'])],
          _0x56c10e =
            _0x8c50a0['closest']('.story-source-dialogue')?.['querySelector']('[data-field="uncertain"]');
        if (_0x56c10e && _0x596b41) _0x56c10e['checked'] = _0x596b41['uncertain'] === !![];
      }
      if (_0x8c50a0['dataset']['field'] === 'name')
        _0x8c50a0['closest']('[data-replication-character]')
          ?.['querySelector']('[data-replication-character-heading]')
          ?.['replaceChildren'](_0x8c50a0['value']);
    }
  }
  function _0x2dfd5e(_0xdbaa98) {
    return (
      !_0x539882['contains'](_0xdbaa98) &&
      !_0xdbaa98['closest'](
        'button,\x20a,\x20input,\x20textarea,\x20select,\x20[role=\x22button\x22],\x20[role=\x22separator\x22],\x20.story-page-footer',
      )
    );
  }
  function _0x2ce6a4(_0x551fa7) {
    _0x1133db = Boolean(
      _0x4b362c && !_0x539882['hidden'] && _0x551fa7['button'] === 0x0 && _0x2dfd5e(_0x551fa7['target']),
    );
  }
  function _0x2bf81f(_0xdf9924) {
    if (
      _0xdf9924['code'] !== 'Space' ||
      !_0x4b362c ||
      !_0x3f6e23(_0x4b362c) ||
      _0xdf9924['altKey'] ||
      _0xdf9924['ctrlKey'] ||
      _0xdf9924['metaKey'] ||
      _0xdf9924['shiftKey'] ||
      _0xdf9924['target']['closest'](
        'input,\x20textarea,\x20select,\x20[contenteditable]:not([contenteditable=\x22false\x22]),\x20[role=\x22textbox\x22],\x20[role=\x22combobox\x22],\x20[role=\x22listbox\x22],\x20[role=\x22dialog\x22]',
      )
    )
      return;
    (_0xdf9924['preventDefault'](), _0xdf9924['stopPropagation']());
    if (_0xdf9924['repeat']) return;
    const _0x1807f3 = _0x539882['querySelector']('video');
    if (!_0x1807f3['paused']) _0x1807f3['pause']();
    else
      void _0x1807f3['play']()['catch'](() => {
        if (_0x4b362c && _0x3f6e23(_0x4b362c)) _0x51cefc('原视频播放失败，请重试。');
      });
  }
  (_0x468260['addEventListener']('keydown', _0x2bf81f, !![]),
    _0x468260['addEventListener']('pointerdown', _0x2ce6a4),
    _0x468260['addEventListener']('click', _0x483230),
    _0x468260['addEventListener']('change', _0x392574));
  function _0x3475aa(_0x2e3902) {
    if (
      !_0x4b362c ||
      _0x2e3902['detail']['episodeId'] !== _0x4b362c['episode']['id'] ||
      !_0x3f6e23(_0x4b362c)
    )
      return;
    _0x51cefc(
      _0x4b362c['episode']['replication']['message'] || _0x4b362c['episode']['replication']['error'] || '',
    );
  }
  return (
    _0x468260['addEventListener']('story-replication-updated', _0x3475aa),
    {
      destroy() {
        ((_0x4bfde0 = !![]),
          _0x51e948({ release: !![] }),
          _0x468260['removeEventListener']('click', _0x483230),
          _0x468260['removeEventListener']('keydown', _0x2bf81f, !![]),
          _0x468260['removeEventListener']('pointerdown', _0x2ce6a4),
          _0x468260['removeEventListener']('change', _0x392574),
          _0x468260['removeEventListener']('story-replication-updated', _0x3475aa));
      },
    }
  );
}
