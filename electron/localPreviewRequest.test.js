import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeLocalPreviewRequest } from './localPreviewRequest.js';

test('local preview request: falls back to localPath when absolute path is missing', () => {
  const payload = {
    path: 'F:\\CanvasPro\\output\\missing.png',
    localPath: '/data/assets/derived/image/example.display.png',
    type: 'image/png',
  };

  const sanitized = sanitizeLocalPreviewRequest(payload, {
    statPath() {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    },
  });

  assert.deepEqual(sanitized, {
    localPath: '/data/assets/derived/image/example.display.png',
    type: 'image/png',
  });
});

test('local preview request: falls back to localPath when absolute path is a directory', () => {
  const payload = {
    path: 'F:\\CanvasPro\\output',
    localPath: '/output/example.mp4',
    type: 'video/mp4',
  };

  const sanitized = sanitizeLocalPreviewRequest(payload, {
    statPath() {
      return {
        isFile() {
          return false;
        },
      };
    },
  });

  assert.deepEqual(sanitized, {
    localPath: '/output/example.mp4',
    type: 'video/mp4',
  });
});

test('local preview request: keeps usable absolute file path', () => {
  const payload = {
    path: 'F:\\CanvasPro\\user-data\\output\\clip.mp4',
    localPath: '/output/clip.mp4',
    type: 'video/mp4',
  };

  const sanitized = sanitizeLocalPreviewRequest(payload, {
    statPath() {
      return {
        isFile() {
          return true;
        },
      };
    },
  });

  assert.deepEqual(sanitized, payload);
});

test('local preview request: keeps path when no localPath fallback exists', () => {
  const payload = {
    path: 'F:\\CanvasPro\\output\\missing.png',
    type: 'image/png',
  };

  const sanitized = sanitizeLocalPreviewRequest(payload, {
    statPath() {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    },
  });

  assert.deepEqual(sanitized, payload);
});
