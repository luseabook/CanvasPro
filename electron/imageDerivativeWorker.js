import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createKeyedOperationQueue } from './keyedOperationQueue.js';
export async function renderImageDerivativePayload(source) {
  const image = new Image();
  const canvas = document.createElement('canvas');
  try {
    image.src = source;
    await image.decode();
    const originalWidth = image.naturalWidth,
      originalHeight = image.naturalHeight;
    if (!(originalWidth > 0 && originalHeight > 0)) throw new Error('Invalid image dimensions');
    const render = (maxEdge) => {
      const scale = Math.min(1, maxEdge / Math.max(originalWidth, originalHeight));
      canvas.width = Math.max(1, Math.round(originalWidth * scale));
      canvas.height = Math.max(1, Math.round(originalHeight * scale));
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png').split(',')[1];
    };
    return { originalWidth, originalHeight, display: render(1280), thumb: render(320) };
  } finally {
    image.src = '';
    canvas.width = 0;
    canvas.height = 0;
  }
}
export function createImageDerivativeWorker({ BrowserWindow: BrowserWindow, timeoutMs: timeoutMs = 0x7530 }) {
  const operationQueue = createKeyedOperationQueue();
  return (sourcePath) =>
    operationQueue.run('image-derivatives', async () => {
      const worker = new BrowserWindow({
        show: false,
        width: 1,
        height: 1,
        webPreferences: {
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
          backgroundThrottling: false,
        },
      });
      let timeoutHandle;
      try {
        const render = async () => {
          await worker.loadURL(
            'data:text/html,<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:;">',
          );
          const mimeType =
              {
                '.svg': 'image/svg+xml',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
                '.avif': 'image/avif',
                '.bmp': 'image/bmp',
              }[path.extname(sourcePath).toLowerCase()] || 'image/png',
            dataUrl = 'data:' + mimeType + ';base64,' + (await readFile(sourcePath)).toString('base64');
          if (worker.isDestroyed()) throw new Error('Image derivative worker closed');
          const payload = await worker.webContents.executeJavaScript(
            '(' + renderImageDerivativePayload.toString() + ')(' + JSON.stringify(dataUrl) + ')',
          );
          return {
            originalWidth: payload.originalWidth,
            originalHeight: payload.originalHeight,
            displayPng: Buffer.from(payload.display, 'base64'),
            thumbPng: Buffer.from(payload.thumb, 'base64'),
          };
        };
        return await Promise.race([
          render(),
          new Promise((_resolve, reject) => {
            timeoutHandle = setTimeout(
              () => reject(new Error('Image derivative worker timed out')),
              timeoutMs,
            );
          }),
        ]);
      } finally {
        clearTimeout(timeoutHandle);
        if (!worker.isDestroyed()) worker.destroy();
      }
    });
}
