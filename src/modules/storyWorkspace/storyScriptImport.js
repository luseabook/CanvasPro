const UPLOADED_EPISODE_HEADING_PATTERN =
    /^[ \t]*(?:#{1,6}[ \t]*)?(?:第[ \t]*([0-9０-９零〇一二三四五六七八九十百千两]+)[ \t]*(?:集|话|回)|(?:episode|ep\.?)\s*([0-9０-９]+))[ \t]*(?:[：:.\-—·|][ \t]*)?(.*?)[ \t]*$/gimu,
  UPLOADED_FOUNTAIN_SCENE_HEADING_PATTERN =
    /^(?:\d{1,4}[.)、-]\s*)?(?:INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)(?:\.|\s)\s*\S/iu,
  UPLOADED_NUMBERED_SCENE_HEADING_PATTERN =
    /^(?:第\s*[0-9０-９零〇一二三四五六七八九十百千两]+\s*场|场景\s*[0-9０-９零〇一二三四五六七八九十百千两]+)(?:\s|[：:.、\-—])\s*\S/iu,
  UPLOADED_CHINESE_SCENE_HEADING_PATTERN =
    /^(?:\d{1,4}[.)、-]\s*)?(?:(?:日|夜|晨|早晨|上午|中午|下午|傍晚|黄昏|黎明|凌晨)\s+)?(?:内景|外景|内外景|内外|内|外)(?:\s|[：:.、\-—])\s*\S/iu;
function normalizeText(_0x4be3ba) {
  return String(_0x4be3ba || '')['trim']();
}
function normalizeFullWidthDigits(_0x307e83) {
  return String(_0x307e83 || '')['replace'](/[０-９]/g, (_0x1c2734) =>
    String(_0x1c2734['charCodeAt'](0x0) - 0xff10),
  );
}
function parseChineseNumber(_0xd7073f) {
  const _0x324859 = normalizeFullWidthDigits(_0xd7073f);
  if (/^\d+$/['test'](_0x324859)) return Number(_0x324859);
  const _0x15e4f7 = {
      零: 0x0,
      〇: 0x0,
      一: 0x1,
      二: 0x2,
      两: 0x2,
      三: 0x3,
      四: 0x4,
      五: 0x5,
      六: 0x6,
      七: 0x7,
      八: 0x8,
      九: 0x9,
    },
    _0x39f29a = { 十: 0xa, 百: 0x64, 千: 0x3e8 };
  let _0x2f0c59 = 0x0,
    _0x4a3e63 = 0x0;
  for (const _0x4cd379 of _0x324859) {
    if (Object['prototype']['hasOwnProperty']['call'](_0x15e4f7, _0x4cd379)) {
      _0x4a3e63 = _0x15e4f7[_0x4cd379];
      continue;
    }
    const _0x2e5401 = _0x39f29a[_0x4cd379];
    if (!_0x2e5401) return 0x0;
    ((_0x2f0c59 += (_0x4a3e63 || 0x1) * _0x2e5401), (_0x4a3e63 = 0x0));
  }
  return _0x2f0c59 + _0x4a3e63;
}
function stripFileExtension(_0x57edb7) {
  const _0x4c547c = normalizeText(_0x57edb7)['replace'](/^.*[\\/]/, '');
  if (!_0x4c547c || _0x4c547c === '粘贴文本') return '';
  return _0x4c547c['replace'](/\.(?:txt|docx?|pdf|md|rtf)$/iu, '')['trim']();
}
function findUploadedEpisodeHeadings(_0x179be1) {
  const _0x2edbf7 = [],
    _0x54684c = new RegExp(
      UPLOADED_EPISODE_HEADING_PATTERN['source'],
      UPLOADED_EPISODE_HEADING_PATTERN['flags'],
    );
  let _0x5c91f4 = _0x54684c['exec'](_0x179be1);
  while (_0x5c91f4) {
    (_0x2edbf7['push']({
      index: _0x5c91f4['index'],
      endIndex: _0x54684c['lastIndex'],
      numberToken: _0x5c91f4[0x1] || _0x5c91f4[0x2] || '',
      title: normalizeText(_0x5c91f4[0x3]),
      heading: normalizeText(_0x5c91f4[0x0]),
    }),
      (_0x5c91f4 = _0x54684c['exec'](_0x179be1)));
  }
  return _0x2edbf7;
}
function deriveUploadedStoryTitle(_0x346ad9, _0x31b3cd, _0x543e00) {
  const _0x421bfb = stripFileExtension(_0x346ad9);
  if (_0x421bfb) return _0x421bfb;
  const _0x4b33e7 =
      String(_0x31b3cd || '')
        ['split'](/\r?\n/u)
        ['map'](normalizeText)
        ['find'](Boolean) || '',
    _0x2fd7a4 = _0x543e00[0x0];
  if (_0x4b33e7 && _0x4b33e7 !== _0x2fd7a4?.['heading'] && [..._0x4b33e7]['length'] <= 0x50)
    return _0x4b33e7['replace'](/^[《〈【】“”"']+|[《〈【】“”"']+$/gu, '')['trim']();
  return _0x2fd7a4?.['title'] || '未命名剧本';
}
function isUploadedSceneHeading(_0x5a4308) {
  const _0x635ddd = normalizeText(_0x5a4308)['replace'](/^#{1,6}\s*/u, '');
  if (!_0x635ddd || [..._0x635ddd]['length'] > 0x78) return ![];
  return (
    UPLOADED_FOUNTAIN_SCENE_HEADING_PATTERN['test'](_0x635ddd) ||
    UPLOADED_NUMBERED_SCENE_HEADING_PATTERN['test'](_0x635ddd) ||
    UPLOADED_CHINESE_SCENE_HEADING_PATTERN['test'](_0x635ddd)
  );
}
function normalizeUploadedCharacterCue(_0x568f70) {
  return normalizeText(_0x568f70)
    ['replace'](/^@/u, '')
    ['replace'](/\s*[（(][^（）()\r\n]{0,40}[）)]\s*$/u, '')
    ['trim']();
}
function extractUploadedSceneCharacters(_0x36023a = []) {
  const _0x202af7 = [],
    _0x30cfee = (_0x48e6d1) => {
      const _0x593efe = normalizeUploadedCharacterCue(_0x48e6d1);
      if (!_0x593efe || [..._0x593efe]['length'] > 0x18) return;
      if (/^(?:旁白|画外音|VO|V\.O\.?|OS|O\.S\.?)$/iu['test'](_0x593efe)) return;
      if (!_0x202af7['includes'](_0x593efe)) _0x202af7['push'](_0x593efe);
    };
  return (
    _0x36023a['forEach']((_0x55301f, _0x32e9bf) => {
      const _0x22be89 = normalizeText(_0x55301f)['replace'](/^[>*#-]+\s*/u, ''),
        _0x252d58 = _0x22be89['match'](
          /^(?:【)?([\p{Script=Han}A-Za-z][\p{Script=Han}A-Za-z0-9·•._-]{0,23})(?:】)?(?:\s*[（(][^（）()\r\n]{0,40}[）)])?\s*[:：]/u,
        );
      if (_0x252d58) {
        _0x30cfee(_0x252d58[0x1]);
        return;
      }
      const _0x55e6e6 = _0x22be89['match'](/^@([^\r\n]{1,40})$/u);
      if (_0x55e6e6) {
        _0x30cfee(_0x55e6e6[0x1]);
        return;
      }
      const _0x271d87 = normalizeUploadedCharacterCue(_0x22be89),
        _0x355c83 = _0x32e9bf === 0x0 || !normalizeText(_0x36023a[_0x32e9bf - 0x1]),
        _0x2443a6 =
          _0x32e9bf + 0x1 < _0x36023a['length'] && Boolean(normalizeText(_0x36023a[_0x32e9bf + 0x1]));
      if (_0x355c83 && _0x2443a6 && /^[A-Z][A-Z0-9 ._'\-]{0,39}$/u['test'](_0x271d87)) _0x30cfee(_0x271d87);
    }),
    _0x202af7
  );
}
export function parseUploadedStoryEpisodeScenes({
  fullText: fullText = '',
  episodeRef: episodeRef = 'episode-1',
  fallbackHeading: fallbackHeading = '未命名场次',
} = {}) {
  const _0x4c3e40 = normalizeText(fullText);
  if (!_0x4c3e40) return [];
  const _0x353df3 = _0x4c3e40['split'](/\r?\n/u),
    _0xbb5607 = [];
  _0x353df3['forEach']((_0xdac059, _0x501f92) => {
    if (isUploadedSceneHeading(_0xdac059)) _0xbb5607['push'](_0x501f92);
  });
  if (!_0xbb5607['length'])
    return [
      {
        ref: episodeRef + '-scene-1',
        heading: normalizeText(fallbackHeading) || '未命名场次',
        characters: extractUploadedSceneCharacters(_0x353df3),
        body: _0x4c3e40,
        source: 'upload-fallback',
      },
    ];
  return _0xbb5607['map']((_0x4c8012, _0x9e04ce) => {
    const _0x36984a = _0xbb5607[_0x9e04ce + 0x1] ?? _0x353df3['length'],
      _0x409cbb = _0x353df3['slice'](_0x4c8012 + 0x1, _0x36984a);
    return {
      ref: episodeRef + '-scene-' + (_0x9e04ce + 0x1),
      heading: normalizeText(_0x353df3[_0x4c8012])['replace'](/^#{1,6}\s*/u, ''),
      characters: extractUploadedSceneCharacters(_0x409cbb),
      body: _0x409cbb['join']('\x0a')['trim'](),
      source: 'upload-structured',
    };
  })['filter']((_0xc1fa1d) => _0xc1fa1d['heading'] && _0xc1fa1d['body']);
}
function createUploadedEpisode({
  fullText: _0x38d5ef,
  number: _0x2ef4cf,
  title: _0x947d72,
  index: _0x101d66,
}) {
  const _0xb90f11 = 'episode-' + (_0x101d66 + 0x1),
    _0x525186 = normalizeText(_0x947d72) || '第\x20' + _0x2ef4cf + '\x20集',
    _0x394888 = parseUploadedStoryEpisodeScenes({
      fullText: _0x38d5ef,
      episodeRef: _0xb90f11,
      fallbackHeading: _0x525186,
    });
  return {
    id: _0xb90f11,
    planningRef: _0xb90f11,
    number: _0x2ef4cf,
    title: _0x525186,
    synopsis: '',
    hook: '',
    sourceChapterIds: [_0xb90f11],
    assetRefs: [],
    assetIds: [],
    scriptStatus: 'completed',
    script: {
      schemaVersion: 0x1,
      source: 'upload',
      episodeRef: _0xb90f11,
      scenes: _0x394888,
      fullText: _0x38d5ef,
    },
    clips: [],
    clipCount: 0x0,
    characterCount: 0x0,
    sceneCount: 0x0,
    propCount: 0x0,
    duration: '--:--',
    status: '待拆分',
  };
}
export function parseUploadedStoryScript({ sourceText: sourceText = '', fileName: fileName = '' } = {}) {
  const _0x271990 = normalizeText(sourceText);
  if (!_0x271990) throw new Error('没有可导入的剧本文本。');
  const _0xdf934c = findUploadedEpisodeHeadings(_0x271990),
    _0x25347c = _0xdf934c['length']
      ? _0xdf934c['map']((_0x1fe1dc, _0x3f670d) => {
          const _0x5a7e79 = _0x3f670d === 0x0 ? 0x0 : _0x1fe1dc['index'],
            _0x35b1e4 = _0xdf934c[_0x3f670d + 0x1]?.['index'] ?? _0x271990['length'];
          return {
            fullText: _0x271990['slice'](_0x5a7e79, _0x35b1e4)['trim'](),
            number: parseChineseNumber(_0x1fe1dc['numberToken']) || _0x3f670d + 0x1,
            title: _0x1fe1dc['title'],
          };
        })
      : [{ fullText: _0x271990, number: 0x1, title: '' }],
    _0x55ee60 = deriveUploadedStoryTitle(fileName, _0x271990, _0xdf934c),
    _0x6bab80 = _0x25347c['filter']((_0x1e56cf) => _0x1e56cf['fullText'])['map']((_0x1e2f62, _0x577d9c) =>
      createUploadedEpisode({
        ..._0x1e2f62,
        index: _0x577d9c,
        title: _0x1e2f62['title'] || (_0x25347c['length'] === 0x1 ? _0x55ee60 : ''),
      }),
    );
  if (!_0x6bab80['length']) throw new Error('剧本中没有可导入的正文。');
  return {
    title: _0x55ee60,
    sourceText: _0x271990,
    episodes: _0x6bab80,
    chapters: _0x6bab80['map']((_0x545052) => ({
      id: _0x545052['id'],
      title: '第\x20' + _0x545052['number'] + ' 集：' + _0x545052['title'],
      content: _0x545052['script']['fullText'],
    })),
  };
}
export function attachUploadedStoryAssetsToEpisodes(_0x30907a = [], _0x47bc65 = []) {
  const _0x2bf116 = Array['isArray'](_0x47bc65) ? _0x47bc65 : [];
  return (Array['isArray'](_0x30907a) ? _0x30907a : [])['map']((_0x55d64f) => {
    const _0x17867a = normalizeText(_0x55d64f?.['id']),
      _0x4d80bd = _0x2bf116['filter']((_0x329dae) => {
        const _0x54ac73 = [
          ...(Array['isArray'](_0x329dae?.['sourceChapterIds']) ? _0x329dae['sourceChapterIds'] : []),
          ...(Array['isArray'](_0x329dae?.['appearances'])
            ? _0x329dae['appearances']['flatMap']((_0x18ca5e) =>
                Array['isArray'](_0x18ca5e?.['sourceChapterIds']) ? _0x18ca5e['sourceChapterIds'] : [],
              )
            : []),
        ]['map'](normalizeText);
        return _0x54ac73['includes'](_0x17867a);
      }),
      _0x4b7286 = (_0x531bed) =>
        _0x4d80bd['filter']((_0x463dea) => _0x463dea?.['kind'] === _0x531bed)['length'];
    return {
      ..._0x55d64f,
      assetRefs: _0x4d80bd['map']((_0x4697aa) =>
        normalizeText(_0x4697aa?.['planningRef'] || _0x4697aa?.['ref'] || _0x4697aa?.['id']),
      )['filter'](Boolean),
      assetIds: _0x4d80bd['map']((_0x15d161) => normalizeText(_0x15d161?.['id']))['filter'](Boolean),
      characterCount: _0x4b7286('character'),
      sceneCount: _0x4b7286('scene'),
      propCount: _0x4b7286('prop'),
    };
  });
}
