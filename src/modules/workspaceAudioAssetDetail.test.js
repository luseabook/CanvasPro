import test from 'node:test';
import assert from 'node:assert/strict';

import { renderWorkspaceAudioAssetDetail } from './workspaceAudioAssetDetail.js';

test('workspaceAudioAssetDetail: renders escaped identity, playback, and appearance thumbnail', () => {
  const html = renderWorkspaceAudioAssetDetail({
    name: 'Voice & <Lead>',
    audioUrl: 'https://media.example/audio.mp3?a=1&b=2',
    waveformUrl: 'wave.json',
    characters: [
      {
        id: 'char"1',
        name: 'Alice & Bob',
        appearances: [{ id: 'look-1', imageUrl: 'thumb.png?a=1&b=2' }],
      },
    ],
    selectedCharacterId: 'char"1',
    boundNames: ['A&B', '<C>'],
    isLibrary: true,
    className: 'detail" onclick="x',
    playerClassName: 'player-custom',
    playerAttributes: { 'data-audio-id': 'audio-1', ignored: 'x' },
    selectAttributes: 'data-audio-select',
    bindAttributes: 'data-bind-audio',
    membershipAttributes: 'data-audio-membership',
  });

  assert.match(html, /Voice &amp; &lt;Lead&gt;/);
  assert.match(html, /已绑定：A&amp;B、&lt;C&gt;/);
  assert.match(html, /class="story-asset-detail story-audio-detail detail&quot; onclick=&quot;x"/);
  assert.doesNotMatch(html, /detail" onclick="x/);
  assert.match(html, /thumb\.png\?a=1&amp;b=2/);
  assert.match(html, /value="char&quot;1"[\s\S]*selected>Alice &amp; Bob<\/option>/);
  assert.match(html, /data-audio-id="audio-1"/);
  assert.doesNotMatch(html, /\signored=/);
  assert.match(html, /data-audio-select/);
  assert.match(html, /data-bind-audio/);
  assert.match(html, /data-audio-membership/);
  assert.match(html, /data-audio-playback-url="https:\/\/media\.example\/audio\.mp3\?a=1&amp;b=2"/);
  assert.doesNotMatch(html, /story-secondary-button" data-bind-audio disabled/);
  assert.match(html, /加入到音频项目/);
});

test('workspaceAudioAssetDetail: disables voice binding without an audio and selected character', () => {
  const html = renderWorkspaceAudioAssetDetail({
    name: 'Voice',
    audioUrl: '',
    characters: [{ id: 'char-1', name: 'Alice' }],
    selectedCharacterId: 'missing',
  });
  assert.match(html, /未绑定人物/);
  assert.match(html, /story-secondary-button"\s+disabled>设为角色声音参考/);
  assert.match(html, /移除项目/);
});
