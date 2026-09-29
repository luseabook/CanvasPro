import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEXT_RESULT_IMAGE_LIMIT,
  normalizeTextResultImages,
  parseTextResultImages,
  textResultImagePresentationText,
} from './textResultImages.js';

test('textResultImages: normalization validates, deduplicates, and caps image sources', () => {
  const images = normalizeTextResultImages([
    {
      url: 'https://example.com/a.png',
      title: ' A ',
      pageUrl: 'https://example.com/page',
    },
    {
      url: 'https://example.com/a.png',
      title: 'duplicate',
      pageUrl: 'https://example.com/other',
    },
    { url: 'ftp://example.com/ignored.png' },
    ...Array.from({ length: 30 }, (_, index) => ({
      url: 'https://example.com/' + index + '.png',
    })),
  ]);

  assert.equal(images.length, TEXT_RESULT_IMAGE_LIMIT);
  assert.deepEqual(images[0], {
    url: 'https://example.com/a.png',
    title: 'A',
    pageUrl: 'https://example.com/page',
  });
  assert.equal(new Set(images.map((image) => image.url)).size, images.length);
});

test('textResultImages: markdown parsing handles links, nested paths, escapes, and code fences', () => {
  const markdown = [
    '![One](https://example.com/a.png "title")',
    '[![Two](<https://example.com/b(1).png>)](https://example.com/page)',
    '\\![Escaped](https://example.com/skip.png)',
    '```md',
    '![Code](https://example.com/code.png)',
    '```',
    '![Nested](https://example.com/c(1).png)',
  ].join('\n');
  const images = parseTextResultImages(markdown);

  assert.deepEqual(
    images.map(({ url, title, pageUrl, start, end }) => ({
      url,
      title,
      pageUrl,
      source: markdown.slice(start, end),
    })),
    [
      {
        url: 'https://example.com/a.png',
        title: 'One',
        pageUrl: '',
        source: '![One](https://example.com/a.png "title")',
      },
      {
        url: 'https://example.com/b(1).png',
        title: 'Two',
        pageUrl: 'https://example.com/page',
        source: '[![Two](<https://example.com/b(1).png>)](https://example.com/page)',
      },
      {
        url: 'https://example.com/c(1).png',
        title: 'Nested',
        pageUrl: '',
        source: '![Nested](https://example.com/c(1).png)',
      },
    ],
  );
});

test('textResultImages: presentation removes only images already represented by result metadata', () => {
  const markdown =
    'Before ![One](https://example.com/a.png) middle ![Keep](https://example.com/keep.png) after';
  const presentation = textResultImagePresentationText(markdown, [
    { url: 'https://example.com/a.png' },
  ]);

  assert.equal(presentation.includes('![One]'), false);
  assert.equal(presentation.includes('![Keep]'), true);
  assert.match(presentation, /Before\s+middle/u);
});
