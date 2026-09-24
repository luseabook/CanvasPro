import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_EXTERNAL_INFORMATION_CONTENT_LIMIT,
  AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT,
  AGENT_EXTERNAL_INFORMATION_TOOL_ID,
  compactAgentExternalInformationForPrompt,
  createAgentExternalInformationRequests,
  detectAgentExternalInformationIntent,
  extractAgentExternalUrls,
} from './agentExternalInformation.js';

test('外部信息常量冻结：工具 id、来源上限 3、正文预算 14000', () => {
  assert.equal(AGENT_EXTERNAL_INFORMATION_TOOL_ID, 'web.read_url');
  assert.equal(AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT, 3);
  assert.equal(AGENT_EXTERNAL_INFORMATION_CONTENT_LIMIT, 14000);
});

test('extractAgentExternalUrls：只认 http/https，去重并保持出现顺序，上限 3 条', () => {
  assert.deepEqual(extractAgentExternalUrls('看 https://a.com/x 和 http://b.cn 再回 https://a.com/x'), [
    'https://a.com/x',
    'http://b.cn',
  ]);
  assert.equal(extractAgentExternalUrls([1, 2, 3, 4, 5].map((i) => `https://s${i}.dev`).join(' ')).length, 3);
  assert.deepEqual(extractAgentExternalUrls('ftp://a.com //text/plain a.com/a'), []);
  assert.deepEqual(extractAgentExternalUrls(''), []);
  assert.deepEqual(extractAgentExternalUrls(null), []);
  assert.deepEqual(extractAgentExternalUrls(42), []);
});

test('extractAgentExternalUrls：结尾标点后剥，中文标点本身不进入匹配', () => {
  assert.deepEqual(extractAgentExternalUrls('(https://en.wikipedia.org/wiki/Cat)'), [
    'https://en.wikipedia.org/wiki/Cat',
  ]);
  assert.deepEqual(extractAgentExternalUrls('https://a.com/x，'), ['https://a.com/x']);
  assert.deepEqual(extractAgentExternalUrls('见 https://a.com/x。后续'), ['https://a.com/x']);
  assert.deepEqual(extractAgentExternalUrls('https://a.com/a.md) 与 https://b.com/x.md.'), [
    'https://a.com/a.md',
    'https://b.com/x.md',
  ]);
});

test('detectAgentExternalInformationIntent：显式读网页意图返回请求数组与 explicit-url-reading', () => {
  for (const message of [
    '阅读 https://a.com 这个网页',
    '帮我看看 https://a.com',
    '总结 https://a.com 的正文',
    'read this https://a.com',
    'open the page https://a.com please',
  ]) {
    const r = detectAgentExternalInformationIntent(message);
    assert.equal(r.toolId, 'web.read_url');
    assert.equal(r.reason, 'explicit-url-reading');
    assert.ok(Array.isArray(r.requests));
  }
});

test('detectAgentExternalInformationIntent：剥掉链接后只剩空话时判为 url-only-message', () => {
  assert.deepEqual(detectAgentExternalInformationIntent('https://a.com'), {
    toolId: 'web.read_url',
    requests: [{ url: 'https://a.com' }],
    reason: 'url-only-message',
  });
  assert.equal(
    detectAgentExternalInformationIntent('请帮我看看 https://a.com').reason,
    'explicit-url-reading',
  );
});

test('detectAgentExternalInformationIntent：否定语句优先，直接返回 null', () => {
  for (const message of [
    '不要打开 https://a.com 网页',
    "don't open https://a.com",
    '无需查看该链接 https://a.com',
  ]) {
    assert.equal(detectAgentExternalInformationIntent(message), null);
  }
});

test('detectAgentExternalInformationIntent：有链接但残留文本既非空也不像读意图时不触发', () => {
  assert.equal(detectAgentExternalInformationIntent('https://a.com 天气如何'), null);
  assert.equal(detectAgentExternalInformationIntent('总结网页内容但没有链接'), null);
  assert.equal(detectAgentExternalInformationIntent(''), null);
  assert.equal(detectAgentExternalInformationIntent(null), null);
});

test('detectAgentExternalInformationIntent：多链接按 extract 的 3 条上限裁剪', () => {
  const r = detectAgentExternalInformationIntent(
    '阅读 https://a.com https://b.com https://c.com https://d.com',
  );
  assert.equal(r.requests.length, 3);
  assert.deepEqual(
    r.requests.map((x) => x.url),
    ['https://a.com', 'https://b.com', 'https://c.com'],
  );
});

test('createAgentExternalInformationRequests：附件在前、链接在后，共享同一个 3 条上限', () => {
  const r = createAgentExternalInformationRequests({
    message: '阅读 https://a.com https://b.com',
    documentFiles: [{ name: 'a.pdf' }, { name: 'b.pdf' }],
  });
  assert.equal(r.reason, 'attached-document+explicit-url-reading');
  assert.deepEqual(
    r.requests.map((x) => [x.toolId, x.sourceKind]),
    [
      ['document.read_file', 'document'],
      ['document.read_file', 'document'],
      ['web.read_url', 'url'],
    ],
  );
  assert.deepEqual(r.requests[2].args, { url: 'https://a.com' });
});

test('createAgentExternalInformationRequests：只有附件时 reason 为 attached-document，文件名空白的条目被丢弃', () => {
  const r = createAgentExternalInformationRequests({
    documentFiles: [
      { name: 'a.pdf' },
      { name: '  ' },
      null,
      undefined,
      { name: 'b.docx' },
      { name: 'c.txt' },
      { name: 'd.md' },
    ],
  });
  assert.equal(r.reason, 'attached-document');
  assert.equal(r.requests.length, 3);
  assert.deepEqual(
    r.requests.map((x) => x.args.file.name),
    ['a.pdf', 'b.docx', 'c.txt'],
  );
  assert.equal(createAgentExternalInformationRequests({ documentFiles: [{ name: '  ' }, null] }), null);
});

test('createAgentExternalInformationRequests：无附件无链接（或链接未构成意图）返回 null', () => {
  assert.equal(createAgentExternalInformationRequests({ message: 'hi' }), null);
  assert.equal(createAgentExternalInformationRequests(), null);
  assert.equal(createAgentExternalInformationRequests({ message: 'https://a.com 天气如何' }), null);
});

test('createAgentExternalInformationRequests：非数组 documentFiles 被当作空表', () => {
  assert.equal(createAgentExternalInformationRequests({ documentFiles: 'a.pdf' }), null);
  assert.equal(
    createAgentExternalInformationRequests({ message: '阅读 https://a.com', documentFiles: 'x' }).requests
      .length,
    1,
  );
});

test('compactAgentExternalInformationForPrompt：非数组 / 空 sources 归空表', () => {
  for (const input of [null, undefined, {}, { sources: [] }, { sources: 'x' }]) {
    assert.deepEqual(compactAgentExternalInformationForPrompt(input), []);
  }
});

test('compactAgentExternalInformationForPrompt：url 条目产出 requestedUrl/finalUrl 与 untrusted_external 信任标记', () => {
  assert.deepEqual(
    compactAgentExternalInformationForPrompt({
      sources: [{ sourceKind: 'url', url: 'https://a.com', content: 'hello', title: 'T' }],
    }),
    [
      {
        sourceId: 'external-source-1',
        toolId: 'web.read_url',
        sourceKind: 'url',
        requestedUrl: 'https://a.com',
        finalUrl: 'https://a.com',
        title: 'T',
        contentType: '',
        content: 'hello',
        truncated: false,
        trust: 'untrusted_external',
      },
    ],
  );
});

test('compactAgentExternalInformationForPrompt：document 条目改为 displayName/extension/characterCount/pageCount/warnings 形状', () => {
  const [r] = compactAgentExternalInformationForPrompt({
    sources: [
      {
        sourceKind: 'document',
        displayName: 'a.pdf',
        fileName: 'ignored-when-title',
        content: 'body',
        characterCount: 4,
        pageCount: 2,
        extension: 'pdf',
        warnings: ['w1'],
      },
    ],
  });
  assert.deepEqual(Object.keys(r), [
    'sourceId',
    'toolId',
    'sourceKind',
    'displayName',
    'extension',
    'characterCount',
    'pageCount',
    'warnings',
    'title',
    'contentType',
    'content',
    'truncated',
    'trust',
  ]);
  assert.equal(r.toolId, 'document.read_file');
  assert.equal(r.title, 'a.pdf');
  assert.equal(r.characterCount, 4);
  assert.equal(r.pageCount, 2);
});

test('compactAgentExternalInformationForPrompt：warnings 逐条截断并最多 8 条，pageCount 缺失时整键缺席', () => {
  const [r] = compactAgentExternalInformationForPrompt({
    sources: [
      {
        sourceKind: 'document',
        displayName: 'a.pdf',
        content: 'body',
        warnings: Array.from({ length: 12 }, (_, i) => 'w' + i).concat(['  ', 'z'.repeat(400)]),
      },
    ],
  });
  assert.equal(r.warnings.length, 8);
  assert.equal(r.warnings[7], 'w7');
  assert.equal('pageCount' in r, false);
  assert.equal(r.characterCount, 4);
});

test('compactAgentExternalInformationForPrompt：正文按 14000 / 条目数 均分（下限 1000）并标 truncated', () => {
  const three = compactAgentExternalInformationForPrompt({
    sources: [1, 2, 3, 4].map((i) => ({ url: `https://s${i}.dev`, content: String(i).repeat(20000) })),
  });
  assert.equal(three.length, 3);
  assert.deepEqual(
    three.map((x) => [x.content.length, x.truncated]),
    [
      [4666, true],
      [4666, true],
      [4666, true],
    ],
  );
  assert.equal(three[0].content.endsWith('...'), true);
  const one = compactAgentExternalInformationForPrompt({
    sources: [{ url: 'https://a.com', content: 'x'.repeat(5000) }],
  });
  assert.deepEqual([one[0].content.length, one[0].truncated], [5000, false]);
  const floor = compactAgentExternalInformationForPrompt(
    { sources: [1, 2, 3].map((i) => ({ url: `https://s${i}.dev`, content: 'y'.repeat(5000) })) },
    { maxContentChars: 100 },
  );
  assert.equal(floor[0].content.length, 1000);
});

test('compactAgentExternalInformationForPrompt：truncated 标记对显式 true 也成立', () => {
  const [r] = compactAgentExternalInformationForPrompt({
    sources: [{ url: 'https://a.com', content: 'short', truncated: true }],
  });
  assert.equal(r.truncated, true);
});

test('compactAgentExternalInformationForPrompt：正文为空一律丢弃，document 缺 displayName 也丢弃', () => {
  assert.equal(
    compactAgentExternalInformationForPrompt({
      sources: [
        { url: 'https://a.com', content: '' },
        { url: 'https://b.com', content: 'ok' },
      ],
    }).length,
    1,
  );
  assert.equal(
    compactAgentExternalInformationForPrompt({ sources: [{ sourceKind: 'document', content: 'body' }] })
      .length,
    0,
  );
  assert.equal(
    compactAgentExternalInformationForPrompt({
      sources: [{ sourceKind: 'document', fileName: 'fallback.pdf', content: 'body' }],
    })[0].displayName,
    'fallback.pdf',
  );
  assert.equal(
    compactAgentExternalInformationForPrompt({ sources: [{ content: 'no-url-no-name' }] }).length,
    0,
  );
});

test('compactAgentExternalInformationForPrompt：sourceId 缺省按序号补齐，未知 sourceKind 一律按 url 处理', () => {
  const r = compactAgentExternalInformationForPrompt({
    sources: [
      { url: 'https://a.com', content: 'c' },
      { sourceId: 'x'.repeat(200), url: 'https://b.com', content: 'c' },
      { sourceKind: 'weird', displayName: 'd.bin', finalUrl: 'https://c.com', content: 'c' },
    ],
  });
  assert.deepEqual(
    r.map((x) => x.sourceKind),
    ['url', 'url', 'url'],
  );
  assert.equal(r[0].sourceId, 'external-source-1');
  assert.equal(r[1].sourceId.length, 80);
  assert.equal(r[2].finalUrl, 'https://c.com');
  assert.equal(r[2].toolId, 'web.read_url');
});
