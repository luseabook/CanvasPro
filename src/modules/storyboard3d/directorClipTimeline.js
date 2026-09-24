import {
  createDirectorClip,
  duplicateDirectorClip,
  editDirectorClip,
  copyDirectorClip,
  pasteDirectorClip,
} from './directorClips.js';
import { collectDirectorKeys, directorKeyIdentity } from './directorTimelineOperations.js';
const escape = (_0x3e1edf) =>
  String(_0x3e1edf)['replaceAll']('&', '&amp;')['replaceAll']('\x22', '&quot;')['replaceAll']('<', '&lt;');
export class DirectorClipTimeline {
  constructor(_0x36a457) {
    ((this['timeline'] = _0x36a457),
      (this['selected'] = null),
      (this['clipboard'] = null),
      (this['onDown'] = (_0x5ac8fc) => this['drag'](_0x5ac8fc)));
  }
  ['render'](_0x55b4ba) {
    const _0xdcb119 = [
      ...(_0x55b4ba['motionClips'] || [])['map']((_0x24566a) => ({
        ..._0x24566a,
        kind: 'motion',
        label: _0x24566a['name'],
      })),
      ..._0x55b4ba['actionClips']['map']((_0x5f0a15) => ({
        ..._0x5f0a15,
        kind: 'action',
        label: '动作\x20·\x20' + _0x5f0a15['actionId'],
      })),
    ];
    return (
      '<div\x20class=\x22storyboard-3d-director-fields\x22><button\x20data-storyboard-3d-action=\x22timeline-clip-create\x22>选中关键帧组成片段</button><button\x20data-storyboard-3d-action=\x22timeline-clip-copy\x22>复制片段</button><button\x20data-storyboard-3d-action=\x22timeline-clip-paste\x22>粘贴片段到播放头</button><button\x20data-storyboard-3d-action=\x22timeline-clip-duplicate\x22>紧后复制片段</button><button\x20data-storyboard-3d-action=\x22timeline-clip-delete\x22>删除片段</button></div>\x0a\x20\x20\x20\x20' +
      _0xdcb119['map'](
        (_0x19ef9a) =>
          '<div class="storyboard-3d-timeline-row"><div class="storyboard-3d-timeline-track-label">' +
          escape(_0x19ef9a['label']) +
          '</div><div class="storyboard-3d-timeline-lane"><div role="button" tabindex="0" class="storyboard-3d-motion-clip ' +
          (this['selected']?.['id'] === _0x19ef9a['id'] ? 'is-selected' : '') +
          '" data-storyboard-3d-action="timeline-clip-select" data-clip-kind="' +
          _0x19ef9a['kind'] +
          '" data-clip-id="' +
          escape(_0x19ef9a['id']) +
          '" style="--clip-start:' +
          (_0x19ef9a['start'] / _0x55b4ba['duration']) * 0x64 +
          '%;--clip-width:' +
          ((_0x19ef9a['end'] - _0x19ef9a['start']) / _0x55b4ba['duration']) * 0x64 +
          '%\x22><span\x20data-clip-edge=\x22start\x22\x20aria-label=\x22裁剪片段开始\x22></span><b>' +
          _0x19ef9a['start']['toFixed'](0x2) +
          '–' +
          _0x19ef9a['end']['toFixed'](0x2) +
          's</b><span data-clip-edge="end" aria-label="裁剪片段结束"></span></div></div></div>',
      )['join']('')
    );
  }
  ['bind']() {
    const _0x4f2222 = this['timeline']['getRoot']?.();
    if (_0x4f2222 === this['root']) return;
    (this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      (this['root'] = _0x4f2222),
      _0x4f2222?.['addEventListener']('pointerdown', this['onDown'], !![]));
  }
  ['handleClick'](_0x2b4231, _0x44f6c9) {
    if (!_0x2b4231['startsWith']('timeline-clip-')) return ![];
    const _0x357345 = this['timeline']['_context']()['shot']?.['animation'];
    if (!_0x357345) return !![];
    const _0x39e80a = this['selected'],
      _0x286a64 =
        _0x39e80a &&
        (_0x39e80a['kind'] === 'action' ? _0x357345['actionClips'] : _0x357345['motionClips'])?.['find'](
          (_0x42d999) => _0x42d999['id'] === _0x39e80a['id'],
        );
    switch (_0x2b4231) {
      case 'timeline-clip-select':
        this['selected'] = { id: _0x44f6c9['dataset']['clipId'], kind: _0x44f6c9['dataset']['clipKind'] };
        break;
      case 'timeline-clip-create':
        this['timeline']['editing']['mutate']('创建运动片段', (_0x33a71f) =>
          createDirectorClip(
            _0x33a71f,
            collectDirectorKeys(_0x33a71f)
              ['filter']((_0x148df9) =>
                this['timeline']['editing']['selected']['has'](directorKeyIdentity(_0x148df9)),
              )
              ['map'](({ key: _0x483fd9 }) => _0x483fd9['id']),
          ),
        );
        break;
      case 'timeline-clip-copy':
        if (_0x286a64)
          this['clipboard'] = {
            projectId: this['timeline']['_context']()['project']['id'],
            shotId: this['timeline']['_context']()['shot']['id'],
            value: copyDirectorClip(_0x357345, _0x39e80a['kind'], _0x39e80a['id']),
          };
        break;
      case 'timeline-clip-paste':
        if (
          this['clipboard']?.['projectId'] === this['timeline']['_context']()['project']['id'] &&
          this['clipboard']['shotId'] === this['timeline']['_context']()['shot']['id']
        )
          this['timeline']['editing']['mutate']('粘贴片段', (_0x1d65e9) =>
            pasteDirectorClip(
              _0x1d65e9,
              this['clipboard']['value'],
              this['timeline']['_timeForShot'](this['timeline']['_context']()['shot']),
            ),
          );
        break;
      case 'timeline-clip-duplicate':
        if (_0x286a64)
          this['timeline']['editing']['mutate']('紧后复制片段', (_0x4d5b65) =>
            duplicateDirectorClip(_0x4d5b65, _0x39e80a['kind'], _0x39e80a['id'], _0x286a64['end']),
          );
        break;
      case 'timeline-clip-delete':
        if (_0x286a64)
          this['timeline']['editing']['mutate']('删除片段', (_0x3bc1e5) => {
            if (_0x39e80a['kind'] === 'action')
              _0x3bc1e5['actionClips'] = _0x3bc1e5['actionClips']['filter'](
                (_0x5585ea) => _0x5585ea['id'] !== _0x286a64['id'],
              );
            else {
              const _0x4e70f3 = new Set(_0x286a64['keyframeIds']);
              ((_0x3bc1e5['motionClips'] = _0x3bc1e5['motionClips']['filter'](
                (_0x58c61c) => _0x58c61c['id'] !== _0x286a64['id'],
              )),
                (_0x3bc1e5['cameraKeyframes'] = _0x3bc1e5['cameraKeyframes']['filter'](
                  (_0x49de5f) => !_0x4e70f3['has'](_0x49de5f['id']),
                )),
                _0x3bc1e5['objectTracks']['forEach']((_0x459c10) => {
                  for (const _0xcd2350 of ['positionKeyframes', 'rotationKeyframes', 'scaleKeyframes'])
                    _0x459c10[_0xcd2350] = _0x459c10[_0xcd2350]['filter'](
                      (_0x42f6f7) => !_0x4e70f3['has'](_0x42f6f7['id']),
                    );
                }));
            }
            return _0x3bc1e5;
          });
        break;
    }
    return (this['timeline']['requestRender']?.(), !![]);
  }
  ['drag'](_0x5103d1) {
    const _0x70d70 = _0x5103d1['target']['closest']?.('.storyboard-3d-motion-clip');
    if (!_0x70d70 || _0x5103d1['button'] !== 0x0) return;
    (_0x5103d1['preventDefault'](),
      _0x5103d1['stopImmediatePropagation'](),
      (this['selected'] = { id: _0x70d70['dataset']['clipId'], kind: _0x70d70['dataset']['clipKind'] }));
    const { shot: _0x10b5b4, project: _0x345786 } = this['timeline']['_context'](),
      _0x4cc6ac = _0x10b5b4['animation'],
      _0xb93ce3 = (
        this['selected']['kind'] === 'action' ? _0x4cc6ac['actionClips'] : _0x4cc6ac['motionClips']
      )['find']((_0x395257) => _0x395257['id'] === this['selected']['id']),
      _0x549018 = { ...this['selected'] },
      _0x2f4751 = _0x5103d1['target']['dataset']['clipEdge'],
      _0x586a8e = _0x70d70['parentElement']['getBoundingClientRect'](),
      _0x1e015f = _0x5103d1['clientX'],
      _0x37fa72 = new this['timeline']['window']['AbortController']();
    this['cancel']?.();
    const _0x24b63e = JSON['stringify'](_0x4cc6ac);
    let _0x360eb5 = _0xb93ce3['start'],
      _0x369f3c = _0xb93ce3['end'];
    ((this['cancel'] = () => {
      (_0x37fa72['abort'](),
        _0x70d70['style']['setProperty'](
          '--clip-start',
          (_0xb93ce3['start'] / _0x4cc6ac['duration']) * 0x64 + '%',
        ),
        _0x70d70['style']['setProperty'](
          '--clip-width',
          ((_0xb93ce3['end'] - _0xb93ce3['start']) / _0x4cc6ac['duration']) * 0x64 + '%',
        ),
        (this['cancel'] = null));
    }),
      this['timeline']['window']['addEventListener'](
        'pointermove',
        (_0x28735c) => {
          if (_0x28735c['pointerId'] !== _0x5103d1['pointerId']) return;
          let _0x38d49a =
            Math['round'](
              ((_0x28735c['clientX'] - _0x1e015f) / _0x586a8e['width']) *
                _0x4cc6ac['duration'] *
                _0x4cc6ac['fps'],
            ) / _0x4cc6ac['fps'];
          const _0x53000e = _0x2f4751 === 'end' ? _0xb93ce3['end'] : _0xb93ce3['start'],
            _0x1a9c92 = {
              ..._0x4cc6ac,
              actionClips: _0x4cc6ac['actionClips']['filter'](
                (_0x2dc8e3) => _0x2dc8e3['id'] !== _0xb93ce3['id'],
              ),
              motionClips: (_0x4cc6ac['motionClips'] || [])['filter'](
                (_0x148d55) => _0x148d55['id'] !== _0xb93ce3['id'],
              ),
            };
          ((_0x38d49a =
            this['timeline']['editing']['snapTime'](
              _0x53000e + _0x38d49a,
              _0x1a9c92,
              _0x586a8e['width'],
              _0x28735c['altKey'],
              _0xb93ce3['keyframeIds'] || [],
            ) - _0x53000e),
            (_0x360eb5 = _0x2f4751 === 'end' ? _0xb93ce3['start'] : _0xb93ce3['start'] + _0x38d49a),
            (_0x369f3c = _0x2f4751 === 'start' ? _0xb93ce3['end'] : _0xb93ce3['end'] + _0x38d49a),
            _0x70d70['style']['setProperty'](
              '--clip-start',
              (_0x360eb5 / _0x4cc6ac['duration']) * 0x64 + '%',
            ),
            _0x70d70['style']['setProperty'](
              '--clip-width',
              (Math['max'](0x0, _0x369f3c - _0x360eb5) / _0x4cc6ac['duration']) * 0x64 + '%',
            ));
        },
        { signal: _0x37fa72['signal'] },
      ),
      this['timeline']['window']['addEventListener']('pointercancel', () => this['cancel']?.(), {
        signal: _0x37fa72['signal'],
      }),
      this['timeline']['window']['addEventListener'](
        'keydown',
        (_0x53bebf) => {
          _0x53bebf['key'] === 'Escape' &&
            (_0x53bebf['preventDefault'](), _0x53bebf['stopImmediatePropagation'](), this['cancel']?.());
        },
        { capture: !![], signal: _0x37fa72['signal'] },
      ),
      this['timeline']['window']['addEventListener'](
        'pointerup',
        (_0x5ce44a) => {
          if (_0x5ce44a['pointerId'] !== _0x5103d1['pointerId']) return;
          this['cancel']?.();
          const _0x6d0e17 = this['timeline']['_context']();
          if (
            _0x6d0e17['project']['id'] !== _0x345786['id'] ||
            _0x6d0e17['shot']['id'] !== _0x10b5b4['id'] ||
            _0x24b63e !== JSON['stringify'](_0x6d0e17['shot']['animation'])
          )
            return;
          this['timeline']['editing']['mutate']('移动或裁剪片段', (_0x2be694) =>
            editDirectorClip(_0x2be694, { ..._0x549018, start: _0x360eb5, end: _0x369f3c, move: !_0x2f4751 }),
          );
        },
        { once: !![], signal: _0x37fa72['signal'] },
      ));
  }
  ['handleKey'](_0x4fab62) {
    const _0x141a7f = _0x4fab62['target']['closest']?.('.storyboard-3d-motion-clip');
    if (!_0x141a7f) return ![];
    this['selected'] = { kind: _0x141a7f['dataset']['clipKind'], id: _0x141a7f['dataset']['clipId'] };
    const _0x21a7c2 = _0x4fab62['key']['toLowerCase'](),
      _0x3869f7 = _0x4fab62['ctrlKey'] || _0x4fab62['metaKey'],
      _0x56d3cc =
        _0x3869f7 && _0x21a7c2 === 'c'
          ? 'copy'
          : _0x3869f7 && _0x21a7c2 === 'v'
            ? 'paste'
            : ['delete', 'backspace']['includes'](_0x21a7c2)
              ? 'delete'
              : ['enter', '\x20']['includes'](_0x21a7c2)
                ? 'select'
                : null;
    if (!_0x56d3cc) return ![];
    return (
      _0x4fab62['preventDefault'](),
      _0x4fab62['stopImmediatePropagation'](),
      this['handleClick']('timeline-clip-' + _0x56d3cc, _0x141a7f),
      !![]
    );
  }
  ['destroy']() {
    (this['cancel']?.(),
      this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      (this['root'] = null));
  }
}
