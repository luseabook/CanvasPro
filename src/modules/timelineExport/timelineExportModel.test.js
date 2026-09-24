import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTimelineRequest, parseTimelineProbe, buildTimelinePlan } from './timelineExportModel.js';

export const probeFixture = (video = {}, audio = null) => ({ streams: [
  { codec_type: 'video', width: 1920, height: 1080, nb_frames: '300', duration: '10', avg_frame_rate: '30/1',
    r_frame_rate: '30/1', sample_aspect_ratio: '1:1', field_order: 'progressive', start_time: '0', ...video },
  ...(audio ? [{ codec_type: 'audio', channels: 2, sample_rate: '48000', duration: '10', start_time: '0', ...audio }] : []),
] });
const clip = (extra = {}) => ({ nodeId: 'n1', name: '镜头', kind: 'video', localPath: 'output/a.mp4', startSec: 0, endSec: null, ...extra });
const request = (clips = [clip()], extra = {}) => normalizeTimelineRequest({ title: '工程', includeAudio: true, clips, ...extra });
test('request is allowlisted, order preserved and independent of caller objects', () => {
  const input = [clip({ nodeId: 'b', apiKey: 'secret', request: {}, url: 'http://bad' }), clip({ nodeId: 'a' })];
  const out = request(input); input[0].startSec = 99;
  assert.deepEqual(out.clips.map(c => c.nodeId), ['b', 'a']); assert.equal(out.clips[0].startSec, 0);
  assert.equal(out.clips[0].apiKey, undefined); assert.equal(out.clips[0].url, undefined);
});
test('input count, media kind and explicit audio choice are enforced', () => {
  assert.throws(() => request([]));
  assert.throws(() => request(Array.from({ length: 33 }, (_, i) => clip({ nodeId: String(i) }))));
  assert.throws(() => request([clip({ kind: 'image', localPath: 'output/a.png' })]));
  assert.throws(() => request([clip()], { includeAudio: undefined }));
});
for (const [startSec, endSec] of [[-1, 2], [NaN, null], [0, Infinity], [2, 1], [0, '3'], [0, undefined], [0, 1801]]) {
  test(`reject invalid range ${startSec}/${endSec}`, () => assert.throws(() => request([clip({ startSec, endSec })])));
}
test('supported constant frame metadata with stereo audio', () => {
  const meta = parseTimelineProbe(probeFixture({}, {}), true);
  assert.equal(meta.channels, 2); assert.equal(meta.sampleRate, 48000); assert.equal(meta.frames, 300);
});
test('silent media has zero audio channels; explicit mute ignores incompatible audio', () => {
  assert.equal(parseTimelineProbe(probeFixture(), true).channels, 0);
  assert.equal(parseTimelineProbe(probeFixture({}, { channels: 6 }), false).channels, 0);
  assert.throws(() => parseTimelineProbe(probeFixture({}, { channels: 6 }), true));
});
for (const change of [{ nb_frames: 'N/A' }, { avg_frame_rate: '27/1' }, { r_frame_rate: '60/1' }, { r_frame_rate: '0/0' },
  { sample_aspect_ratio: '4:3' }, { field_order: 'tt' }, { tags: { rotate: '90' } }, { width: 0 },
  { start_time: '1' }, { start_time: 'NaN' }, { duration: '11' }]) {
  test(`reject unsupported probe ${JSON.stringify(change)}`, () => assert.throws(() => parseTimelineProbe(probeFixture(change), true)));
}
test('audio offset, insufficient duration, multistream and unsupported sample rate are rejected', () => {
  for (const audio of [{ start_time: '0.5' }, { duration: '2' }, { sample_rate: '96000' }]) {
    assert.throws(() => parseTimelineProbe(probeFixture({}, audio), true));
  }
  const multi = probeFixture({}, {}); multi.streams.push({ ...multi.streams[1] });
  assert.throws(() => parseTimelineProbe(multi, true));
});
test('NTSC rational rate retained without treating it as integer 30fps', () => {
  const meta = parseTimelineProbe(probeFixture({ avg_frame_rate: '30000/1001', r_frame_rate: '30000/1001', duration: '10.01' }), true);
  assert.equal(meta.ntsc, true); assert.equal(meta.denominator, 1001);
});
test('ordered trims form contiguous frame timeline, no implicit transitions', () => {
  const req = request([clip({ startSec: 1, endSec: 3 }), clip({ nodeId: 'n2', startSec: 2, endSec: 4 })]);
  const meta = parseTimelineProbe(probeFixture(), true), plan = buildTimelinePlan(req, [meta, meta]);
  assert.deepEqual(plan.clips.map(c => [c.inFrame, c.outFrame, c.start, c.end]), [[30, 90, 0, 60], [60, 120, 60, 120]]);
  assert.equal(plan.frames, 120);
});
test('mixed resolution, mixed rate, overrun and subframe trims fail instead of dropping shots', () => {
  const meta = parseTimelineProbe(probeFixture(), true), req = request([clip(), clip({ nodeId: 'n2' })]);
  assert.throws(() => buildTimelinePlan(req, [meta, { ...meta, width: 1280 }]));
  assert.throws(() => buildTimelinePlan(req, [meta, { ...meta, numerator: 25 }]));
  assert.throws(() => buildTimelinePlan(request([clip({ endSec: 11 })]), [meta]));
  assert.throws(() => buildTimelinePlan(request([clip({ endSec: 0.001 })]), [meta]));
});
test('timeline duration cannot exceed 30 minutes', () => {
  const meta = { ...parseTimelineProbe(probeFixture(), true), frames: 54000 };
  assert.throws(() => buildTimelinePlan(request([clip(), clip({ nodeId: 'n2' })]), [meta, meta]));
});
