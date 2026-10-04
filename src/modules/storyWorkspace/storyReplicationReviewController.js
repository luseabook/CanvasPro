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
  el,
  {
    state: state,
    createProjectToken: createProjectToken,
    isProjectTaskLive: isProjectTaskLive,
    syncProjectEntry: syncProjectEntry,
    schedulePersistence: schedulePersistence,
    refreshFooter: refreshFooter,
    showToast: showToast,
    captureFrame: captureFrame = captureStoryReplicationRepresentativeFrame,
    reanalyze: reanalyze,
  } = {},
) {
  const videoEl = el['querySelector']('[data-replication-review-host]');
  if (!videoEl) return null;
  let busy = null,
    storyVideoPlayback = null,
    value = 'story',
    enabled = ![],
    item = 0x0,
    key = null,
    storyReplicationPortraitEditor = null,
    bindStoryReplicationSelects2 = null,
    ctx = null,
    renderStoryReplicationCast2 = '',
    bindStoryReplicationReviewThumbnails2 = null,
    bindStoryReplicationReviewLayout2 = null,
    index = ![];
  const result = { left: 0x14, right: 0x38 },
    handler = (data) =>
      isProjectTaskLive(data['token']) && data['episode']['replication']['sourceAnalysis'] === data['source'],
    handler2 = (options) => !enabled && !videoEl['hidden'] && busy === options && handler(options),
    handler3 = () => ['uploading', 'analyzing']['includes'](busy?.['episode']['replication']['status']);
  function run(message = '') {
    if (busy && handler2(busy))
      syncStoryReplicationReviewStatus(videoEl, busy['episode'], {
        busy: busy['busy'] === !![] || handler3(),
        message: message,
      });
    bindStoryReplicationSelects2?.['sync']();
  }
  function run2(target) {
    (syncProjectEntry(target['token']), schedulePersistence({ immediate: !![] }), refreshFooter());
    if (!handler2(target)) {
      target['needsRefresh'] = !![];
      return;
    }
    for (const el2 of videoEl['querySelectorAll']('[data-replication-review-summary]')) {
      el2['textContent'] = renderStoryReplicationEvidenceSummary(target['source']);
    }
    handler2(target) && (ctx['sync'](), run3());
  }
  function run3() {
    const renderStoryReplicationCast3 = renderStoryReplicationCast(
      busy['episode'],
      ctx['selected']()?.['id'],
    );
    renderStoryReplicationCast3 !== renderStoryReplicationCast2 &&
      ((videoEl['querySelector']('[data-replication-cast]')['innerHTML'] = renderStoryReplicationCast3),
      (renderStoryReplicationCast2 = renderStoryReplicationCast3));
  }
  function run4({ release: release = ![] } = {}) {
    busy &&
      !videoEl['hidden'] &&
      !release &&
      (busy['scrollPositions'] = [...videoEl['querySelectorAll']('*')]
        ['filter']((source) => source['scrollTop'] || source['scrollLeft'])
        ['map']((element) => ({
          element: element,
          top: element['scrollTop'],
          left: element['scrollLeft'],
        })));
    (bindStoryReplicationReviewLayout2?.['destroy'](),
      (bindStoryReplicationReviewLayout2 = null),
      bindStoryReplicationSelects2?.['close'](),
      (item += 0x1),
      key?.(),
      videoEl['querySelector']('video')?.['pause']());
    const el3 = videoEl['querySelector']('[data-replication-seeking]');
    if (el3) el3['hidden'] = !![];
    ((videoEl['hidden'] = !![]),
      el['querySelector']('[data-story-replication-grid]')?.['removeAttribute']('hidden'));
    if (!release) {
      bindStoryReplicationReviewThumbnails2?.['suspend']();
      return;
    }
    (bindStoryReplicationReviewThumbnails2?.['destroy'](),
      (bindStoryReplicationReviewThumbnails2 = null),
      bindStoryReplicationSelects2?.['destroy'](),
      (bindStoryReplicationSelects2 = null),
      storyReplicationPortraitEditor?.['destroy'](),
      (storyReplicationPortraitEditor = null),
      storyVideoPlayback?.['destroy']());
    const next = videoEl['querySelector']('video');
    (next && (next['removeAttribute']('src'), next['load']()),
      (storyVideoPlayback = null),
      (busy = null),
      (ctx = null),
      (renderStoryReplicationCast2 = ''),
      videoEl['replaceChildren'](),
      (videoEl['hidden'] = !![]),
      el['querySelector']('[data-story-replication-grid]')?.['removeAttribute']('hidden'));
  }
  function run5({ preserveScroll: preserveScroll = ![] } = {}) {
    const current = videoEl['querySelector']('[data-replication-fields]')['scrollTop'];
    (bindStoryReplicationSelects2?.['destroy'](),
      storyReplicationPortraitEditor?.['destroy'](),
      (storyReplicationPortraitEditor = null),
      (videoEl['querySelector']('[data-replication-fields]')['innerHTML'] = renderStoryReplicationReviewTab(
        busy['episode'],
        value,
        ctx['selected']()?.['id'],
      )),
      (bindStoryReplicationSelects2 = bindStoryReplicationSelects(videoEl)),
      videoEl['querySelectorAll']('[data-replication-tab]')['forEach']((el4) => {
        (el4['setAttribute']('aria-pressed', String(el4['dataset']['replicationTab'] === value)),
          el4['getAttribute']('role') === 'tab' &&
            (el4['setAttribute']('aria-selected', String(el4['dataset']['replicationTab'] === value)),
            (el4['tabIndex'] = el4['dataset']['replicationTab'] === value ? 0x0 : -0x1)));
      }));
    const el5 = videoEl['querySelector']('.story-source-tabs');
    el5['style']['setProperty'](
      '--review-tab-index',
      Math['max'](0x0, ['overview', 'story', 'dialogue', 'characters', 'shots']['indexOf'](value)),
    );
    if (preserveScroll) videoEl['querySelector']('[data-replication-fields]')['scrollTop'] = current;
    else ctx['restore'](value);
    run();
  }
  function run6(entry) {
    if (value === entry) return;
    (ctx['save'](value), (value = entry), run5());
  }
  function run7(record, payload) {
    const handle = busy,
      config = item + 0x1;
    void run8(record, payload)['catch'](() => {
      if (handler2(handle) && config === item) run('原视频定位或播放失败，请重试。');
    });
  }
  async function run8(scope, { play: play = ![] } = {}) {
    const input = busy,
      output = ++item;
    key?.();
    const el6 = videoEl['querySelector']('video'),
      el7 = videoEl['querySelector']('[data-replication-seeking]');
    ((el7['hidden'] = el6['readyState'] >= 0x1), run());
    try {
      if (el6['readyState'] < 0x1 && !(await storyVideoPlayback['warm']())) return;
      if (!handler2(input) || output !== item) return;
      el6['readyState'] < 0x1 &&
        (await new Promise((handler4) => {
          const value2 = () => {
              (clearTimeout(setTimeout2),
                el6['removeEventListener']('loadedmetadata', value2),
                el6['removeEventListener']('error', value2));
              if (key === value2) key = null;
              handler4();
            },
            setTimeout2 = setTimeout(value2, 0x1f40);
          ((key = value2),
            el6['addEventListener']('loadedmetadata', value2, { once: !![] }),
            el6['addEventListener']('error', value2, { once: !![] }));
        }));
      if (!handler2(input) || output !== item) return;
      if (el6['readyState'] < 0x1) {
        run('原视频加载失败，请检查源文件后重试。');
        return;
      }
      const value3 = Math['min'](Math['max'](0x0, scope), Math['max'](0x0, el6['duration'] - 0.001));
      if (Math['abs'](el6['currentTime'] - value3) > 0.001) el6['currentTime'] = value3;
      if (play) await el6['play']();
      if (handler2(input) && output === item) run();
    } finally {
      if (handler2(input) && output === item) el7['hidden'] = !![];
    }
  }
  async function run9(card, videoRef) {
    if (card['dataset']['replicationCrop']) {
      storyReplicationPortraitEditor?.['destroy']();
      const character = videoRef['source']['characters']['find'](
        (value4) => value4['id'] === card['dataset']['replicationCrop'],
      );
      storyReplicationPortraitEditor = createStoryReplicationPortraitEditor({
        card: card['closest']('[data-replication-character]'),
        character: character,
        capture: (args) =>
          captureFrame({
            ...args,
            videoRef: videoRef['episode']['sourceVideo']['videoRef'],
            projectId: videoRef['token']['projectId'],
          }),
        isActive: () => handler(videoRef) && videoRef['source']['characters']['includes'](character),
        showToast: showToast,
        onSaved: () => {
          run2(videoRef);
          if (handler2(videoRef)) run5({ preserveScroll: !![] });
        },
      });
      return;
    }
    if (card['hasAttribute']('data-replication-add-character')) {
      const timeSec = videoEl['querySelector']('video');
      if (timeSec['readyState'] < 0x2 || timeSec['seeking']) {
        showToast('请先定位并等待当前人物画面加载。', 'warn');
        return;
      }
      const addStoryReplicationCharacter2 = addStoryReplicationCharacter(
        videoRef['token']['data'],
        videoRef['episode'],
        {
          timeSec: timeSec['currentTime'],
        },
      );
      addStoryReplicationCharacter2 && (run2(videoRef), run5({ preserveScroll: !![] }));
      return;
    }
    if (card['dataset']['replicationRemoveCharacter']) {
      removeStoryReplicationCharacter(
        videoRef['token']['data'],
        videoRef['episode'],
        card['dataset']['replicationRemoveCharacter'],
      ) && (run2(videoRef), run5({ preserveScroll: !![] }));
      return;
    }
    if (card['hasAttribute']('data-replication-reanalyze') && reanalyze) {
      ((videoRef['busy'] = !![]), run('正在重新分析原片…'), run4());
      try {
        await reanalyze(videoRef['episode']['id']);
        if (!enabled && busy === videoRef && isProjectTaskLive(videoRef['token'])) {
          ((videoRef['source'] = videoRef['episode']['replication']['sourceAnalysis']), ctx['sync']());
          const el8 = videoEl['querySelector']('[data-replication-segments]'),
            value5 = el8['scrollTop'];
          ((el8['innerHTML'] = renderStoryReplicationSegments(videoRef['source'], ctx['selected']()?.['id'])),
            (el8['scrollTop'] = value5),
            bindStoryReplicationReviewThumbnails2?.['destroy'](),
            (bindStoryReplicationReviewThumbnails2 = bindStoryReplicationReviewThumbnails(
              videoEl,
              videoRef['episode'],
            )),
            run2(videoRef),
            run5({ preserveScroll: !![] }));
        }
      } catch (error) {
        if (handler2(videoRef)) showToast(error?.['message'] || '重新分析失败，已保留原分析记录。', 'error');
      } finally {
        videoRef['busy'] = ![];
        if (handler2(videoRef)) run(videoRef['episode']['replication']['error'] || '');
      }
      return;
    }
  }
  async function run10(event) {
    const value6 = index && run11(event['target']);
    index = ![];
    if (busy && value6) {
      run4();
      return;
    }
    const play2 = event['target']['closest']('button');
    if (!play2 || play2['disabled']) return;
    const value7 = play2['dataset']['replicationOpen'];
    if (value7) {
      const episode = state['data']['episodes']['find']((value8) => value8['id'] === value7);
      if (!episode?.['replication']['sourceAnalysis']) return;
      if (
        busy?.['episode'] === episode &&
        handler(busy) &&
        busy['videoRef'] === episode['sourceVideo']['videoRef']
      ) {
        ((videoEl['hidden'] = ![]),
          el['querySelector']('[data-story-replication-grid]')?.['setAttribute']('hidden', ''),
          bindStoryReplicationReviewLayout2?.['destroy'](),
          (bindStoryReplicationReviewLayout2 = bindStoryReplicationReviewLayout(videoEl, result)),
          bindStoryReplicationReviewThumbnails2?.['resume']());
        busy['needsRefresh'] &&
          ((busy['needsRefresh'] = ![]),
          (videoEl['querySelector']('[data-replication-review-summary]')['textContent'] =
            renderStoryReplicationEvidenceSummary(busy['source'])),
          ctx['sync'](),
          run3(),
          run5({ preserveScroll: !![] }));
        run(busy['episode']['replication']['error'] || '');
        for (const { element: element2, top: top, left: left } of busy['scrollPositions'] || []) {
          videoEl['contains'](element2) && ((element2['scrollTop'] = top), (element2['scrollLeft'] = left));
        }
        return;
      }
      (run4({ release: !![] }),
        (busy = {
          episode: episode,
          source: episode['replication']['sourceAnalysis'],
          videoRef: episode['sourceVideo']['videoRef'],
          token: createProjectToken(),
        }),
        (value = 'story'),
        (videoEl['hidden'] = ![]),
        (videoEl['innerHTML'] = renderStoryReplicationReview(episode)),
        (bindStoryReplicationReviewLayout2 = bindStoryReplicationReviewLayout(videoEl, result)),
        (ctx = createStoryReplicationReviewNavigation(videoEl, episode)),
        ctx['sync'](),
        (renderStoryReplicationCast2 = renderStoryReplicationCast(episode, ctx['selected']()?.['id'])),
        (bindStoryReplicationReviewThumbnails2 = bindStoryReplicationReviewThumbnails(videoEl, episode)),
        (bindStoryReplicationSelects2 = bindStoryReplicationSelects(videoEl)),
        el['querySelector']('[data-story-replication-grid]')?.['setAttribute']('hidden', ''),
        (storyVideoPlayback = createStoryVideoPlayback({
          videoEl: videoEl['querySelector']('video'),
          sourceUrl: episode['sourceVideo']['videoRef'],
          preferStreamingSource: !![],
          ownerId: 'story-source:' + busy['token']['projectId'] + ':' + episode['id'],
        })),
        run(),
        run7(ctx['selected']()?.['startSec'] || 0x0));
      return;
    }
    if (!busy || !videoEl['contains'](play2)) return;
    if (play2['hasAttribute']('data-replication-close')) {
      run4();
      return;
    }
    if (play2['dataset']['replicationTab']) {
      run6(play2['dataset']['replicationTab']);
      return;
    }
    if (
      play2['dataset']['replicationSegment'] ||
      play2['hasAttribute']('data-replication-previous') ||
      play2['hasAttribute']('data-replication-next')
    ) {
      const value9 =
        play2['dataset']['replicationSegment'] ||
        ctx['adjacent'](play2['hasAttribute']('data-replication-next') ? 0x1 : -0x1);
      ctx['save'](value);
      if (ctx['select'](value9)) {
        (run5(), run3());
        if (!play2['dataset']['replicationSegment']) ctx['reveal']();
        run7(ctx['selected']()['startSec']);
      }
      return;
    }
    if (play2['dataset']['replicationCharacterLink']) {
      run6('characters');
      const el9 = [...videoEl['querySelectorAll']('[data-replication-character]')]['find'](
        (el10) => el10['dataset']['replicationCharacter'] === play2['dataset']['replicationCharacterLink'],
      );
      if (el9) {
        const el11 = videoEl['querySelector']('[data-replication-fields]');
        el11['scrollTop'] += el9['getBoundingClientRect']()['top'] - el11['getBoundingClientRect']()['top'];
      }
      return;
    }
    if (play2['hasAttribute']('data-replication-seek')) {
      run7(Number(play2['dataset']['replicationSeek']), {
        play: play2['hasAttribute']('data-replication-listen'),
      });
      return;
    }
    if (busy['busy'] || handler3()) return;
    if (busy['episode']['clips']?.['length'] && !play2['hasAttribute']('data-replication-reanalyze')) return;
    const videoRef2 = busy;
    await run9(play2, videoRef2);
    if (play2['dataset']['replicationCapture']) {
      ((videoRef2['busy'] = !![]), run('正在保存人物代表画面…'));
      try {
        if (play2['dataset']['replicationCapture']) {
          const value10 = videoRef2['source']['characters']['find'](
              (value11) => value11['id'] === play2['dataset']['replicationCapture'],
            ),
            value12 = videoEl['querySelector']('video');
          if (value12['readyState'] < 0x2) throw new Error('请先等待原视频画面加载完成。');
          const timeSec2 = Number(value12['currentTime']);
          if (
            !videoRef2['source']['events']['some'](
              (value13) =>
                value13['characterIds']['includes'](value10['id']) &&
                timeSec2 >= value13['startSec'] &&
                timeSec2 < value13['endSec'],
            )
          )
            throw new Error('当前时间不在该角色的出场片段内，请先定位其出场画面。');
          const captureFrame2 = await captureFrame({
            videoRef: videoRef2['episode']['sourceVideo']['videoRef'],
            timeSec: timeSec2,
            projectId: videoRef2['token']['projectId'],
            isActive: () => handler(videoRef2),
          });
          captureFrame2 &&
            handler(videoRef2) &&
            ((value10['frame'] = captureFrame2),
            (value10['frameError'] = ''),
            delete value10['portrait'],
            run2(videoRef2));
        }
        if (handler2(videoRef2)) run5({ preserveScroll: !![] });
      } catch (error2) {
        if (handler2(videoRef2)) showToast(error2?.['message'] || '操作失败，请重试。', 'error');
      } finally {
        videoRef2['busy'] = ![];
        if (handler2(videoRef2)) run(videoRef2['episode']['replication']['error'] || '');
      }
    }
  }
  function run12(event2) {
    const characterId = event2['target'];
    if (
      busy &&
      !busy['busy'] &&
      !handler3() &&
      (characterId['dataset']['replicationMerge'] || characterId['dataset']['replicationPresence'])
    ) {
      const value14 = characterId['dataset']['replicationMerge']
        ? mergeStoryReplicationCharacters(
            busy['token']['data'],
            busy['episode'],
            characterId['dataset']['replicationMerge'],
            characterId['value'],
          )
        : setStoryReplicationCharacterPresence(busy['token']['data'], busy['episode'], {
            characterId: characterId['dataset']['replicationPresence'],
            eventId: characterId['dataset']['eventId'],
            present: characterId['checked'],
          });
      if (value14) (run2(busy), run5({ preserveScroll: !![] }));
      else
        characterId['dataset']['replicationPresence'] &&
          ((characterId['checked'] = !characterId['checked']),
          showToast('角色至少保留一个出场片段；误检角色请直接删除。', 'warn'));
      return;
    }
    if (!busy || busy['busy'] || handler3() || !characterId['dataset']['replicationEdit']) return;
    const editStoryReplicationSource2 = editStoryReplicationSource(busy['token']['data'], busy['episode'], {
      kind: characterId['dataset']['replicationEdit'],
      id: characterId['dataset']['id'],
      field: characterId['dataset']['field'],
      index: characterId['dataset']['index'],
      value: characterId['type'] === 'checkbox' ? characterId['checked'] : characterId['value'],
    });
    if (editStoryReplicationSource2) {
      (run2(busy), run());
      if (
        characterId['dataset']['replicationEdit'] === 'voiceover' &&
        ['kind', 'speakerId']['includes'](characterId['dataset']['field'])
      ) {
        const value15 = busy['source']['events']['find'](
            (value16) => value16['id'] === characterId['dataset']['id'],
          )?.['voiceover']?.[Number(characterId['dataset']['index'])],
          value17 =
            characterId['closest']('.story-source-dialogue')?.['querySelector']('[data-field="uncertain"]');
        if (value17 && value15) value17['checked'] = value15['uncertain'] === !![];
      }
      if (characterId['dataset']['field'] === 'name')
        characterId['closest']('[data-replication-character]')
          ?.['querySelector']('[data-replication-character-heading]')
          ?.['replaceChildren'](characterId['value']);
    }
  }
  function run11(el12) {
    return (
      !videoEl['contains'](el12) &&
      !el12['closest'](
        'button,\x20a,\x20input,\x20textarea,\x20select,\x20[role=\x22button\x22],\x20[role=\x22separator\x22],\x20.story-page-footer',
      )
    );
  }
  function run13(event3) {
    index = Boolean(busy && !videoEl['hidden'] && event3['button'] === 0x0 && run11(event3['target']));
  }
  function run14(event4) {
    if (
      event4['code'] !== 'Space' ||
      !busy ||
      !handler2(busy) ||
      event4['altKey'] ||
      event4['ctrlKey'] ||
      event4['metaKey'] ||
      event4['shiftKey'] ||
      event4['target']['closest'](
        'input,\x20textarea,\x20select,\x20[contenteditable]:not([contenteditable=\x22false\x22]),\x20[role=\x22textbox\x22],\x20[role=\x22combobox\x22],\x20[role=\x22listbox\x22],\x20[role=\x22dialog\x22]',
      )
    )
      return;
    (event4['preventDefault'](), event4['stopPropagation']());
    if (event4['repeat']) return;
    const enabled2 = videoEl['querySelector']('video');
    if (!enabled2['paused']) enabled2['pause']();
    else
      void enabled2['play']()['catch'](() => {
        if (busy && handler2(busy)) run('原视频播放失败，请重试。');
      });
  }
  (el['addEventListener']('keydown', run14, !![]),
    el['addEventListener']('pointerdown', run13),
    el['addEventListener']('click', run10),
    el['addEventListener']('change', run12));
  function run15(value18) {
    if (!busy || value18['detail']['episodeId'] !== busy['episode']['id'] || !handler2(busy)) return;
    run(busy['episode']['replication']['message'] || busy['episode']['replication']['error'] || '');
  }
  return (
    el['addEventListener']('story-replication-updated', run15),
    {
      destroy() {
        ((enabled = !![]),
          run4({ release: !![] }),
          el['removeEventListener']('click', run10),
          el['removeEventListener']('keydown', run14, !![]),
          el['removeEventListener']('pointerdown', run13),
          el['removeEventListener']('change', run12),
          el['removeEventListener']('story-replication-updated', run15));
      },
    }
  );
}
