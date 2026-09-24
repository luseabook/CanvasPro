import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function xmlText(value) {
  return String(value).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function rate(meta) { return `<rate><timebase>${meta.timebase}</timebase><ntsc>${meta.ntsc ? 'TRUE' : 'FALSE'}</ntsc></rate>`; }
function videoFormat(meta) {
  return `<samplecharacteristics>${rate(meta)}<width>${meta.width}</width><height>${meta.height}</height><anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics>`;
}
function audioFormat(meta) { return `<samplecharacteristics><depth>16</depth><samplerate>${meta.sampleRate}</samplerate></samplecharacteristics>`; }
function fileXml(clip, index, directory) {
  const fileUrl = pathToFileURL(path.join(directory, 'media', clip.fileName)).href;
  return `<file id="file-${index}"><name>${xmlText(clip.fileName)}</name><pathurl>${xmlText(fileUrl)}</pathurl>${rate(clip.meta)}<duration>${clip.meta.frames}</duration><media><video>${videoFormat(clip.meta)}</video>${clip.meta.channels ? `<audio>${audioFormat(clip.meta)}<channelcount>${clip.meta.channels}</channelcount></audio>` : ''}</media></file>`;
}
function links(index, channels, audioTrackPositions) {
  const targets = [{ id: `v-${index}`, type: 'video', track: 1, position: index + 1 }];
  for (let channel = 1; channel <= channels; channel++) targets.push({
    id: `a-${index}-${channel}`, type: 'audio', track: channel, position: audioTrackPositions[channel - 1],
  });
  return targets.map(target => `<link><linkclipref>${target.id}</linkclipref><mediatype>${target.type}</mediatype><trackindex>${target.track}</trackindex><clipindex>${target.position}</clipindex>${target.type === 'audio' ? '<groupindex>1</groupindex>' : ''}</link>`).join('');
}

// FCP7 xmeml v5 interchange XML. This describes a real edit, not a rendered movie.
export function buildPremiereXml(plan, directory) {
  const videos = [], audioTracks = [[], []];
  plan.clips.forEach((clip, index) => {
    const positions = audioTracks.map(track => track.length + 1);
    const linked = links(index, clip.meta.channels, positions);
    const timing = `<name>${xmlText(clip.name)}</name><enabled>TRUE</enabled><duration>${clip.meta.frames}</duration>${rate(clip.meta)}<start>${clip.start}</start><end>${clip.end}</end><in>${clip.inFrame}</in><out>${clip.outFrame}</out>`;
    videos.push(`<clipitem id="v-${index}">${timing}<alphatype>none</alphatype><pixelaspectratio>square</pixelaspectratio><anamorphic>FALSE</anamorphic>${fileXml(clip, index, directory)}<sourcetrack><mediatype>video</mediatype><trackindex>1</trackindex></sourcetrack>${linked}</clipitem>`);
    for (let channel = 1; channel <= clip.meta.channels; channel++) {
      audioTracks[channel - 1].push(`<clipitem id="a-${index}-${channel}">${timing}<file id="file-${index}"/><sourcetrack><mediatype>audio</mediatype><trackindex>${channel}</trackindex></sourcetrack>${linked}</clipitem>`);
    }
  });
  const audio = audioTracks.some(track => track.length)
    ? `<audio><numOutputChannels>2</numOutputChannels><format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>${audioTracks.map(track => `<track>${track.join('')}<enabled>TRUE</enabled><locked>FALSE</locked></track>`).join('')}</audio>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="5"><sequence id="canvaspro-sequence"><name>${xmlText(plan.title)}</name><duration>${plan.frames}</duration>${rate(plan.rate)}<timecode>${rate(plan.rate)}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode><media><video><format>${videoFormat(plan.rate)}</format><track>${videos.join('')}<enabled>TRUE</enabled><locked>FALSE</locked></track></video>${audio}</media></sequence></xmeml>\n`;
}
