function normalizeText(value) {
  return String(value || '')['trim']();
}
export function createStoryLibraryAssignmentMenuPortal({
  storyRoot: storyRoot,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  let el = null,
    el2 = null,
    el3 = null,
    el4 = null,
    el5 = null,
    el6 = null,
    item = 0;
  function run() {
    const el7 = storyRoot?.['ownerDocument']?.['documentElement'];
    return {
      width: Number(windowObject?.['innerWidth']) || el7?.['clientWidth'] || 0,
      height: Number(windowObject?.['innerHeight']) || el7?.['clientHeight'] || 0,
    };
  }
  function run2() {
    const el8 = el4,
      el9 = el5;
    ((el4 = null), (el5 = null), (el6 = null));
    if (!el8) return;
    (el8['classList']['remove']('is-portaled'),
      el8['style']['removeProperty']('top'),
      el8['style']['removeProperty']('left'));
    if (el9?.['isConnected']) el9['appendChild'](el8);
    else el8['remove']();
  }
  function run3() {
    const el10 = el,
      el11 = el2;
    ((el = null), (el2 = null), (el3 = null));
    if (!el10) return;
    (el10['classList']['remove']('is-portaled'),
      el10['style']['removeProperty']('top'),
      el10['style']['removeProperty']('left'));
    if (el11?.['isConnected']) el11['appendChild'](el10);
    else el10['remove']();
  }
  function run4() {
    if (!el?.['isConnected'] || !el2?.['isConnected'] || !el3?.['isConnected']) return;
    const box = el2['getBoundingClientRect'](),
      box2 = el['getBoundingClientRect'](),
      box3 = run(),
      key = box['bottom'] + 10,
      index = box['top'] - box2['height'] - 10,
      result = key + box2['height'] <= box3['height'] - 16 ? key : index,
      data = box['right'] - box2['width'],
      options = box3['width'] - 16 - box2['width'],
      target = box3['height'] - 16 - box2['height'];
    ((el['style']['left'] = Math['max'](16, Math['min'](options, data)) + 'px'),
      (el['style']['top'] = Math['max'](16, Math['min'](target, result)) + 'px'));
  }
  function run5() {
    if (!el4?.['isConnected'] || !el5?.['isConnected'] || !el6?.['isConnected']) return;
    const box4 = el5['getBoundingClientRect'](),
      box5 = el6['getBoundingClientRect'](),
      box6 = el4['getBoundingClientRect'](),
      box7 = run(),
      source = box4['right'] + 10,
      next = box4['left'] - box6['width'] - 10,
      current = source + box6['width'] <= box7['width'] - 16 ? source : next,
      entry = box7['width'] - 16 - box6['width'],
      record = box7['height'] - 16 - box6['height'];
    ((el4['style']['left'] = Math['max'](16, Math['min'](entry, current)) + 'px'),
      (el4['style']['top'] = Math['max'](16, Math['min'](record, box5['top'])) + 'px'));
  }
  function reposition() {
    (run4(), run5());
  }
  function run6() {
    reposition();
    if (!windowObject?.['requestAnimationFrame']) return;
    if (item) windowObject['cancelAnimationFrame']?.(item);
    item = windowObject['requestAnimationFrame'](() => {
      ((item = 0), reposition());
    });
  }
  function closeAppearance(el12 = storyRoot) {
    (el4 && (el12 === storyRoot || el12?.['contains']?.(el5)) && run2(),
      el12?.['querySelectorAll']?.('[data-story-library-appearance-target]')?.['forEach']((el13) => {
        (el13['classList']['remove']('is-active'), el13['setAttribute']('aria-expanded', 'false'));
      }),
      el12?.['querySelectorAll']?.('[data-story-library-appearance-menu]')?.['forEach']((el14) => {
        (el14['classList']['remove']('is-open'),
          el14['setAttribute']('aria-hidden', 'true'),
          el14['style']['removeProperty']('top'),
          el14['style']['removeProperty']('left'));
      }));
  }
  function openAppearance(el15) {
    const enabled = el15?.['closest']?.('[data-story-library-target-menu]'),
      text = normalizeText(el15?.['dataset']?.['storyLibraryAppearanceTarget']),
      el16 = [...(storyRoot?.['querySelectorAll']?.('[data-story-library-appearance-menu]') || [])]['find'](
        (el17) => normalizeText(el17['dataset']['storyLibraryAppearanceMenu']) === text,
      );
    if (!enabled || !text || !el16) return ![];
    return (
      closeAppearance(enabled),
      el15['classList']['add']('is-active'),
      el15['setAttribute']('aria-expanded', 'true'),
      (el4 = el16),
      (el5 = enabled),
      (el6 = el15),
      storyRoot['appendChild'](el16),
      el16['classList']['add']('is-portaled', 'is-open'),
      el16['setAttribute']('aria-hidden', 'false'),
      run5(),
      !![]
    );
  }
  function closeTarget(el18 = storyRoot) {
    (closeAppearance(storyRoot),
      el && (el18 === storyRoot || el18?.['contains']?.(el2)) && run3(),
      el18?.['querySelectorAll']?.('[data-story-library-target-kind]')?.['forEach']((el19) => {
        (el19['classList']['remove']('is-active'), el19['setAttribute']('aria-expanded', 'false'));
      }),
      el18?.['querySelectorAll']?.('[data-story-library-target-menu]')?.['forEach']((el20) => {
        (el20['classList']['remove']('is-open'),
          el20['setAttribute']('aria-hidden', 'true'),
          el20['style']['removeProperty']('top'),
          el20['style']['removeProperty']('left'));
      }),
      el18?.['matches']?.('.story-library-add-menu-wrap') &&
        el18['classList']['remove']('has-target-menu-open'),
      el18?.['querySelectorAll']?.('.story-library-add-menu-wrap.has-target-menu-open')?.['forEach']((el21) =>
        el21['classList']['remove']('has-target-menu-open'),
      ));
  }
  function toggleTarget(el22) {
    const el23 = el22?.['closest']?.('.story-library-add-menu-wrap'),
      text2 = normalizeText(el22?.['dataset']?.['storyLibraryTargetKind']),
      el24 = [...(storyRoot?.['querySelectorAll']?.('[data-story-library-target-menu]') || [])]['find'](
        (el25) => normalizeText(el25['dataset']['storyLibraryTargetMenu']) === text2,
      );
    if (!el23 || !text2 || !el24) return ![];
    const enabled2 = !el24['classList']['contains']('is-open');
    closeTarget(el23);
    if (!enabled2) return ![];
    return (
      el23['classList']['add']('has-target-menu-open'),
      el22['classList']['add']('is-active'),
      el22['setAttribute']('aria-expanded', 'true'),
      (el = el24),
      (el2 = el23),
      (el3 = el22),
      storyRoot['appendChild'](el24),
      el24['classList']['add']('is-portaled', 'is-open'),
      el24['setAttribute']('aria-hidden', 'false'),
      run4(),
      !![]
    );
  }
  return (
    windowObject?.['addEventListener']?.('resize', run6),
    storyRoot?.['addEventListener']?.('scroll', reposition, !![]),
    Object['freeze']({
      closeAppearance: closeAppearance,
      openAppearance: openAppearance,
      closeTarget: closeTarget,
      toggleTarget: toggleTarget,
      reposition: reposition,
      destroy() {
        (closeTarget(), windowObject?.['removeEventListener']?.('resize', run6));
        if (item) windowObject?.['cancelAnimationFrame']?.(item);
        storyRoot?.['removeEventListener']?.('scroll', reposition, !![]);
      },
    })
  );
}
