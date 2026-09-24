import electron from 'electron';
import { createForegroundDialogPresenterCore } from './dialogPresenterCore.js';
const { BrowserWindow, screen } = typeof electron === 'object' && electron ? electron : {};
export function createForegroundDialogPresenter(options = {}) {
  return createForegroundDialogPresenterCore({
    ...options,
    BrowserWindowClass: BrowserWindow,
    screenApi: screen,
  });
}
