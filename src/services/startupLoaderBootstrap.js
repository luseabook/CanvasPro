import { installPackagedBrowserShortcutGuard } from './packagedBrowserShortcutGuard.js';
import { installStartupLoaderGuard } from './startupLoaderGuard.js';
import { installRendererStartupDiagnostics } from './rendererStartupDiagnostics.js';
(installPackagedBrowserShortcutGuard(), installStartupLoaderGuard(), installRendererStartupDiagnostics());
