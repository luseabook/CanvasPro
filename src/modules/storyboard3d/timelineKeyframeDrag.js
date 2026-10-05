import { normalizeStoryboard3DShotAnimation } from './shotAnimation.js';
import { collectDirectorKeys, directorKeyIdentity, shiftDirectorKeys } from './directorTimelineOperations.js';
export class TimelineKeyframeDrag {
  constructor(value) {
    ((this['timeline'] = value),
      (this['root'] = null),
      (this['session'] = null),
      (this['suppressClick'] = ![]),
      (this['onDown'] = (item) => this['start'](item)));
  }
  ['bind']() {
    const el = this['timeline']['getRoot']?.();
    if (el === this['root']) return;
    (this['root']?.['removeEventListener']('pointerdown', this['onDown']),
      (this['root'] = el),
      el?.['addEventListener']('pointerdown', this['onDown']));
  }
  ['start'](event) {
    const el2 = event['target']['closest']?.('[data-keyframe-id]');
    if (!el2 || event['button'] !== 0) return;
    const { shot: shot } = this['timeline']['_context'](),
      box = el2['closest']('.storyboard-3d-timeline-lane')?.['getBoundingClientRect']();
    if (!shot || !box?.['width']) return;
    (this['cancel'](), (this['suppressClick'] = ![]), this['timeline']['stopPlayback']({ render: ![] }));
    const el3 = this['root']['ownerDocument']['defaultView'],
      key = new el3['AbortController'](),
      storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(shot['animation']),
      enabled = {
        abort: key,
        key: el2,
        lane: box,
        shotId: shot['id'],
        pointerId: event['pointerId'],
        startX: event['clientX'],
        startTime: Number(el2['dataset']['keyframeTime']),
        time: Number(el2['dataset']['keyframeTime']),
        moved: ![],
        animation: storyboard3DShotAnimation,
      };
    this['session'] = enabled;
    const index = this['timeline']['editing']['identity'](el2);
    ((enabled['selection'] = this['timeline']['editing']['selected']['has'](index)
      ? new Set(this['timeline']['editing']['selected'])
      : new Set([index])),
      el2['setPointerCapture'](event['pointerId']));
    const result = (event2) => {
        if (event2['pointerId'] !== enabled['pointerId']) return;
        enabled['moved'] ||= Math['abs'](event2['clientX'] - enabled['startX']) > 3;
        if (!enabled['moved']) return;
        event2['preventDefault']();
        const data =
            enabled['startTime'] +
            ((event2['clientX'] - enabled['startX']) / box['width']) * storyboard3DShotAnimation['duration'],
          directorKeys = collectDirectorKeys(storyboard3DShotAnimation)
            ['filter']((options) => enabled['selection']['has'](directorKeyIdentity(options)))
            ['map'](({ key: key2 }) => key2['id']);
        ((enabled['time'] = Math['max'](
          0,
          Math['min'](
            storyboard3DShotAnimation['duration'],
            this['timeline']['editing']['snapTime'](
              data,
              storyboard3DShotAnimation,
              box['width'],
              event2['altKey'],
              directorKeys,
            ),
          ),
        )),
          el2['style']['setProperty'](
            '--storyboard-3d-keyframe-position',
            (enabled['time'] / storyboard3DShotAnimation['duration']) * 100 + '%',
          ),
          this['timeline']['_sampleAt'](enabled['time']));
      },
      target = (event3) => {
        if (event3['pointerId'] !== enabled['pointerId']) return;
        this['cancel']();
        if (!enabled['moved'] || this['timeline']['_context']()['shot']?.['id'] !== enabled['shotId']) return;
        ((this['suppressClick'] = !![]),
          this['timeline']['_mutateAnimation']('move-keyframe', '拖动关键帧', (source) => {
            if (enabled['selection']['size'] > 1)
              try {
                return normalizeStoryboard3DShotAnimation(
                  shiftDirectorKeys(source, enabled['selection'], enabled['time'] - enabled['startTime']),
                );
              } catch (next) {
                return (this['timeline']['setMessage']?.(next['message']), source);
              }
            const list =
                el2['dataset']['keyframeType'] === 'camera'
                  ? source['cameraKeyframes']
                  : source['objectTracks']['find'](
                      (current) => current['objectId'] === el2['dataset']['objectId'],
                    )?.[el2['dataset']['property'] + 'Keyframes'],
              enabled2 = list?.['find']((entry) => entry['id'] === el2['dataset']['keyframeId']);
            if (!enabled2) return source;
            if (
              list['some'](
                (record) =>
                  record['id'] !== enabled2['id'] &&
                  Math['abs'](record['time'] - enabled['time']) < 0.5 / source['fps'],
              )
            )
              return (this['timeline']['setMessage']?.('该帧已有关键帧，已保留原位置。'), source);
            return ((enabled2['time'] = enabled['time']), normalizeStoryboard3DShotAnimation(source));
          }),
          this['timeline']['requestRender']?.());
      };
    (el3['addEventListener']('pointermove', result, { signal: key['signal'] }),
      el3['addEventListener']('pointerup', target, { signal: key['signal'] }),
      el3['addEventListener']('pointercancel', () => this['cancel'](), { signal: key['signal'] }),
      el2['addEventListener']('lostpointercapture', () => this['cancel'](), { signal: key['signal'] }));
  }
  ['cancel']() {
    if (!this['session']) return;
    const {
      abort: abort,
      key: key3,
      startTime: startTime,
      animation: animation,
      pointerId: pointerId,
    } = this['session'];
    ((this['session'] = null),
      abort['abort'](),
      key3['style']['setProperty'](
        '--storyboard-3d-keyframe-position',
        (startTime / animation['duration']) * 100 + '%',
      ));
    if (key3['hasPointerCapture'](pointerId)) key3['releasePointerCapture'](pointerId);
  }
  ['consumeClick'](payload) {
    const handle = this['suppressClick'];
    return ((this['suppressClick'] = ![]), handle && payload?.['detail'] !== 0);
  }
  ['destroy']() {
    (this['cancel'](),
      this['root']?.['removeEventListener']('pointerdown', this['onDown']),
      (this['root'] = null));
  }
}
