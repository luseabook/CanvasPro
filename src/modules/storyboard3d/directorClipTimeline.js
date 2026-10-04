import {
  createDirectorClip,
  duplicateDirectorClip,
  editDirectorClip,
  copyDirectorClip,
  pasteDirectorClip,
} from './directorClips.js';
import { collectDirectorKeys, directorKeyIdentity } from './directorTimelineOperations.js';
const escape = (value) =>
  String(value)['replaceAll']('&', '&amp;')['replaceAll']('\x22', '&quot;')['replaceAll']('<', '&lt;');
export class DirectorClipTimeline {
  constructor(item) {
    ((this['timeline'] = item),
      (this['selected'] = null),
      (this['clipboard'] = null),
      (this['onDown'] = (key) => this['drag'](key)));
  }
  ['render'](args) {
    const list = [
      ...(args['motionClips'] || [])['map']((label) => ({
        ...label,
        kind: 'motion',
        label: label['name'],
      })),
      ...args['actionClips']['map']((args2) => ({
        ...args2,
        kind: 'action',
        label: '动作\x20·\x20' + args2['actionId'],
      })),
    ];
    return (
      '<div\x20class=\x22storyboard-3d-director-fields\x22><button\x20data-storyboard-3d-action=\x22timeline-clip-create\x22>选中关键帧组成片段</button><button\x20data-storyboard-3d-action=\x22timeline-clip-copy\x22>复制片段</button><button\x20data-storyboard-3d-action=\x22timeline-clip-paste\x22>粘贴片段到播放头</button><button\x20data-storyboard-3d-action=\x22timeline-clip-duplicate\x22>紧后复制片段</button><button\x20data-storyboard-3d-action=\x22timeline-clip-delete\x22>删除片段</button></div>\x0a\x20\x20\x20\x20' +
      list['map'](
        (index) =>
          '<div class="storyboard-3d-timeline-row"><div class="storyboard-3d-timeline-track-label">' +
          escape(index['label']) +
          '</div><div class="storyboard-3d-timeline-lane"><div role="button" tabindex="0" class="storyboard-3d-motion-clip ' +
          (this['selected']?.['id'] === index['id'] ? 'is-selected' : '') +
          '" data-storyboard-3d-action="timeline-clip-select" data-clip-kind="' +
          index['kind'] +
          '" data-clip-id="' +
          escape(index['id']) +
          '" style="--clip-start:' +
          (index['start'] / args['duration']) * 0x64 +
          '%;--clip-width:' +
          ((index['end'] - index['start']) / args['duration']) * 0x64 +
          '%\x22><span\x20data-clip-edge=\x22start\x22\x20aria-label=\x22裁剪片段开始\x22></span><b>' +
          index['start']['toFixed'](0x2) +
          '–' +
          index['end']['toFixed'](0x2) +
          's</b><span data-clip-edge="end" aria-label="裁剪片段结束"></span></div></div></div>',
      )['join']('')
    );
  }
  ['bind']() {
    const el = this['timeline']['getRoot']?.();
    if (el === this['root']) return;
    (this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      (this['root'] = el),
      el?.['addEventListener']('pointerdown', this['onDown'], !![]));
  }
  ['handleClick'](enabled, id) {
    if (!enabled['startsWith']('timeline-clip-')) return ![];
    const enabled2 = this['timeline']['_context']()['shot']?.['animation'];
    if (!enabled2) return !![];
    const result = this['selected'],
      data =
        result &&
        (result['kind'] === 'action' ? enabled2['actionClips'] : enabled2['motionClips'])?.['find'](
          (options) => options['id'] === result['id'],
        );
    switch (enabled) {
      case 'timeline-clip-select':
        this['selected'] = { id: id['dataset']['clipId'], kind: id['dataset']['clipKind'] };
        break;
      case 'timeline-clip-create':
        this['timeline']['editing']['mutate']('创建运动片段', (target) =>
          createDirectorClip(
            target,
            collectDirectorKeys(target)
              ['filter']((source) =>
                this['timeline']['editing']['selected']['has'](directorKeyIdentity(source)),
              )
              ['map'](({ key: key2 }) => key2['id']),
          ),
        );
        break;
      case 'timeline-clip-copy':
        if (data)
          this['clipboard'] = {
            projectId: this['timeline']['_context']()['project']['id'],
            shotId: this['timeline']['_context']()['shot']['id'],
            value: copyDirectorClip(enabled2, result['kind'], result['id']),
          };
        break;
      case 'timeline-clip-paste':
        if (
          this['clipboard']?.['projectId'] === this['timeline']['_context']()['project']['id'] &&
          this['clipboard']['shotId'] === this['timeline']['_context']()['shot']['id']
        )
          this['timeline']['editing']['mutate']('粘贴片段', (next) =>
            pasteDirectorClip(
              next,
              this['clipboard']['value'],
              this['timeline']['_timeForShot'](this['timeline']['_context']()['shot']),
            ),
          );
        break;
      case 'timeline-clip-duplicate':
        if (data)
          this['timeline']['editing']['mutate']('紧后复制片段', (current) =>
            duplicateDirectorClip(current, result['kind'], result['id'], data['end']),
          );
        break;
      case 'timeline-clip-delete':
        if (data)
          this['timeline']['editing']['mutate']('删除片段', (entry) => {
            if (result['kind'] === 'action')
              entry['actionClips'] = entry['actionClips']['filter']((record) => record['id'] !== data['id']);
            else {
              const map = new Set(data['keyframeIds']);
              ((entry['motionClips'] = entry['motionClips']['filter'](
                (payload) => payload['id'] !== data['id'],
              )),
                (entry['cameraKeyframes'] = entry['cameraKeyframes']['filter'](
                  (handle) => !map['has'](handle['id']),
                )),
                entry['objectTracks']['forEach']((state) => {
                  for (const config of ['positionKeyframes', 'rotationKeyframes', 'scaleKeyframes'])
                    state[config] = state[config]['filter']((scope) => !map['has'](scope['id']));
                }));
            }
            return entry;
          });
        break;
    }
    return (this['timeline']['requestRender']?.(), !![]);
  }
  ['drag'](event) {
    const id2 = event['target']['closest']?.('.storyboard-3d-motion-clip');
    if (!id2 || event['button'] !== 0x0) return;
    (event['preventDefault'](),
      event['stopImmediatePropagation'](),
      (this['selected'] = { id: id2['dataset']['clipId'], kind: id2['dataset']['clipKind'] }));
    const { shot: shot, project: project } = this['timeline']['_context'](),
      actionClips = shot['animation'],
      input = (
        this['selected']['kind'] === 'action' ? actionClips['actionClips'] : actionClips['motionClips']
      )['find']((output) => output['id'] === this['selected']['id']),
      args3 = { ...this['selected'] },
      enabled3 = event['target']['dataset']['clipEdge'],
      box = id2['parentElement']['getBoundingClientRect'](),
      value2 = event['clientX'],
      signal = new this['timeline']['window']['AbortController']();
    this['cancel']?.();
    const value3 = JSON['stringify'](actionClips);
    let start = input['start'],
      end = input['end'];
    ((this['cancel'] = () => {
      (signal['abort'](),
        id2['style']['setProperty']('--clip-start', (input['start'] / actionClips['duration']) * 0x64 + '%'),
        id2['style']['setProperty'](
          '--clip-width',
          ((input['end'] - input['start']) / actionClips['duration']) * 0x64 + '%',
        ),
        (this['cancel'] = null));
    }),
      this['timeline']['window']['addEventListener'](
        'pointermove',
        (event2) => {
          if (event2['pointerId'] !== event['pointerId']) return;
          let value4 =
            Math['round'](
              ((event2['clientX'] - value2) / box['width']) * actionClips['duration'] * actionClips['fps'],
            ) / actionClips['fps'];
          const value5 = enabled3 === 'end' ? input['end'] : input['start'],
            value6 = {
              ...actionClips,
              actionClips: actionClips['actionClips']['filter']((value7) => value7['id'] !== input['id']),
              motionClips: (actionClips['motionClips'] || [])['filter'](
                (value8) => value8['id'] !== input['id'],
              ),
            };
          ((value4 =
            this['timeline']['editing']['snapTime'](
              value5 + value4,
              value6,
              box['width'],
              event2['altKey'],
              input['keyframeIds'] || [],
            ) - value5),
            (start = enabled3 === 'end' ? input['start'] : input['start'] + value4),
            (end = enabled3 === 'start' ? input['end'] : input['end'] + value4),
            id2['style']['setProperty']('--clip-start', (start / actionClips['duration']) * 0x64 + '%'),
            id2['style']['setProperty'](
              '--clip-width',
              (Math['max'](0x0, end - start) / actionClips['duration']) * 0x64 + '%',
            ));
        },
        { signal: signal['signal'] },
      ),
      this['timeline']['window']['addEventListener']('pointercancel', () => this['cancel']?.(), {
        signal: signal['signal'],
      }),
      this['timeline']['window']['addEventListener'](
        'keydown',
        (event3) => {
          event3['key'] === 'Escape' &&
            (event3['preventDefault'](), event3['stopImmediatePropagation'](), this['cancel']?.());
        },
        { capture: !![], signal: signal['signal'] },
      ),
      this['timeline']['window']['addEventListener'](
        'pointerup',
        (event4) => {
          if (event4['pointerId'] !== event['pointerId']) return;
          this['cancel']?.();
          const value9 = this['timeline']['_context']();
          if (
            value9['project']['id'] !== project['id'] ||
            value9['shot']['id'] !== shot['id'] ||
            value3 !== JSON['stringify'](value9['shot']['animation'])
          )
            return;
          this['timeline']['editing']['mutate']('移动或裁剪片段', (value10) =>
            editDirectorClip(value10, { ...args3, start: start, end: end, move: !enabled3 }),
          );
        },
        { once: !![], signal: signal['signal'] },
      ));
  }
  ['handleKey'](event5) {
    const kind = event5['target']['closest']?.('.storyboard-3d-motion-clip');
    if (!kind) return ![];
    this['selected'] = { kind: kind['dataset']['clipKind'], id: kind['dataset']['clipId'] };
    const value11 = event5['key']['toLowerCase'](),
      value12 = event5['ctrlKey'] || event5['metaKey'],
      enabled4 =
        value12 && value11 === 'c'
          ? 'copy'
          : value12 && value11 === 'v'
            ? 'paste'
            : ['delete', 'backspace']['includes'](value11)
              ? 'delete'
              : ['enter', '\x20']['includes'](value11)
                ? 'select'
                : null;
    if (!enabled4) return ![];
    return (
      event5['preventDefault'](),
      event5['stopImmediatePropagation'](),
      this['handleClick']('timeline-clip-' + enabled4, kind),
      !![]
    );
  }
  ['destroy']() {
    (this['cancel']?.(),
      this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      (this['root'] = null));
  }
}
