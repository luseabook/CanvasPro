const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('aiCanvasDesktop', {
  isElectron: true,
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getDeviceId: (payload) => ipcRenderer.invoke('app:getDeviceId', payload),
  checkForUpdates: () => ipcRenderer.invoke('appUpdater:checkForUpdates'),
  getUpdateState: () => ipcRenderer.invoke('appUpdater:getState'),
  downloadUpdate: () => ipcRenderer.invoke('appUpdater:downloadUpdate'),
  installDownloadedUpdate: () => ipcRenderer.invoke('appUpdater:quitAndInstall'),
  onUpdaterEvent: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => {
      callback(payload);
    };
    ipcRenderer.on('appUpdater:event', listener);
    return () => {
      ipcRenderer.removeListener('appUpdater:event', listener);
    };
  },
});

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file) => webUtils.getPathForFile(file),
  project: {
    fullPackageCapabilities: () => ipcRenderer.invoke('project:fullPackageCapabilities'),
    exportFullPackage: (payload) => ipcRenderer.invoke('project:exportFullPackage', payload),
    restoreFullPackage: (payload) => ipcRenderer.invoke('project:restoreFullPackage', payload),
    open: (payload) => ipcRenderer.invoke('project:open', payload),
    save: (payload) => ipcRenderer.invoke('project:save', payload),
    exportPackage: (payload) => ipcRenderer.invoke('project:exportPackage', payload),
    importPackage: (payload) => ipcRenderer.invoke('project:importPackage', payload),
    listRecent: () => ipcRenderer.invoke('project:listRecent'),
    removeRecent: (payload) => ipcRenderer.invoke('project:removeRecent', payload),
    setUnsavedState: (payload) => ipcRenderer.send('project:setUnsavedState', payload),
    writeRecoverySnapshot: (payload) => ipcRenderer.invoke('project:writeRecoverySnapshot', payload),
    writeRecoverySnapshotIfCompatible: (payload) => ipcRenderer.invoke('project:writeRecoverySnapshot', payload),
    getRecoverySnapshotInfo: (payload) => ipcRenderer.invoke('project:getRecoverySnapshotInfo', payload),
    readRecoverySnapshot: () => ipcRenderer.invoke('project:readRecoverySnapshot'),
    clearRecoverySnapshot: (expected) => ipcRenderer.invoke('project:clearRecoverySnapshot', expected),
    clearRecoverySnapshotIfMatch: (expected) => ipcRenderer.invoke('project:clearRecoverySnapshot', expected),
    consumeExternalOpenRequests: () => ipcRenderer.invoke('project:consumeExternalOpenRequests'),
    onExternalOpen: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = () => {
        ipcRenderer
          .invoke('project:consumeExternalOpenRequests')
          .then((requests) => {
            callback(Array.isArray(requests) ? requests : []);
          })
          .catch((error) => {
            callback([
              {
                success: false,
                error: String(error?.message || error),
              },
            ]);
          });
      };
      ipcRenderer.on('project:externalOpenAvailable', listener);
      return () => {
        ipcRenderer.removeListener('project:externalOpenAvailable', listener);
      };
    },
    onPackageProgress: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('project:packageProgress', listener);
      return () => {
        ipcRenderer.removeListener('project:packageProgress', listener);
      };
    },
  },
  clipboard: {
    writeImage: (payload) => ipcRenderer.invoke('clipboard:writeImage', payload),
    readImage: () => ipcRenderer.invoke('clipboard:readImage'),
    writeFileReferences: (payload) => ipcRenderer.invoke('clipboard:writeFileReferences', payload),
    readFileReferences: () => ipcRenderer.invoke('clipboard:readFileReferences'),
    writeText: (payload) => ipcRenderer.invoke('clipboard:writeText', payload),
    readText: () => ipcRenderer.invoke('clipboard:readText'),
  },
  canvasVisualSnapshot: {
    capturePage: (payload) => ipcRenderer.invoke('canvasVisualSnapshot:capturePage', payload),
  },
  screenshot: {
    captureDisplay: () => ipcRenderer.invoke('screenshot:captureDisplay'),
    updateGlobalShortcut: (payload) => ipcRenderer.invoke('screenshot:updateGlobalShortcut', payload),
    onGlobalCapture: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('screenshot:globalCaptureReady', listener);
      return () => {
        ipcRenderer.removeListener('screenshot:globalCaptureReady', listener);
      };
    },
    onGlobalShortcutStatus: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('screenshot:globalShortcutStatus', listener);
      return () => {
        ipcRenderer.removeListener('screenshot:globalShortcutStatus', listener);
      };
    },
  },
  textPreset: {
    claimEvent: (payload) => ipcRenderer.invoke('textPreset:claimEvent', payload),
    acknowledgeEvent: (payload) => ipcRenderer.invoke('textPreset:acknowledgeEvent', payload),
    updateGlobalShortcut: (payload) => ipcRenderer.invoke('textPreset:updateGlobalShortcut', payload),
    onSelectedText: (callback) => {
      if (typeof callback !== 'function') return () => {};
      let stopped = false;
      let timer;
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('textPreset:selectedTextReady', listener);
      const poll = async () => {
        try {
          const events = await ipcRenderer.invoke('textPreset:consumeEvents');
          if (!stopped && Array.isArray(events)) events.forEach(callback);
        } catch {}
        if (!stopped) {
          timer = setTimeout(poll, 150);
          timer?.unref?.();
        }
      };
      timer = setTimeout(poll, 0);
      timer?.unref?.();
      return () => {
        stopped = true;
        clearTimeout(timer);
        ipcRenderer.removeListener('textPreset:selectedTextReady', listener);
      };
    },
    onGlobalShortcutStatus: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('textPreset:globalShortcutStatus', listener);
      return () => {
        ipcRenderer.removeListener('textPreset:globalShortcutStatus', listener);
      };
    },
  },
  secureSettings: {
    get: (payload) => ipcRenderer.invoke('secureSettings:get', payload),
    set: (payload) => ipcRenderer.invoke('secureSettings:set', payload),
    delete: (payload) => ipcRenderer.invoke('secureSettings:delete', payload),
  },
  customAiApps: {
    read: () => ipcRenderer.invoke('customAiApps:read'),
    write: (payload) => ipcRenderer.invoke('customAiApps:write', payload),
  },
  agentInformation: {
    readUrl: (payload) => ipcRenderer.invoke('agentInformation:readUrl', payload),
  },
  agentSkills: {
    list: () => ipcRenderer.invoke('agentSkills:list'),
    openRoot: () => ipcRenderer.invoke('agentSkills:openRoot'),
    installFromFolder: () => ipcRenderer.invoke('agentSkills:installFromFolder'),
    saveManaged: (payload) => ipcRenderer.invoke('agentSkills:saveManaged', payload),
    deleteInstalled: (payload) => ipcRenderer.invoke('agentSkills:deleteInstalled', payload),
  },
  importAsset: (payload) => ipcRenderer.invoke('asset:import', payload),
  importRemoteAsset: (payload) => ipcRenderer.invoke('asset:importRemote', payload),
  timelineExport: {
    capabilities: () => ipcRenderer.invoke('timelineExport:capabilities'),
    export: (payload) => ipcRenderer.invoke('timelineExport:export', payload),
  },
  nodeMediaExport: {
    capabilities: () => ipcRenderer.invoke('nodeMediaExport:capabilities'),
    exportSelected: (payload) => ipcRenderer.invoke('nodeMediaExport:exportSelected', payload),
  },
  nodeExport: {
    exportSelected: (payload) => ipcRenderer.invoke('nodeExport:exportSelected', payload),
    saveMedia: (payload) => ipcRenderer.invoke('nodeExport:saveMedia', payload),
    saveText: (payload) => ipcRenderer.invoke('nodeExport:saveText', payload),
    saveMediaFiles: (payload) => ipcRenderer.invoke('nodeExport:saveMediaFiles', payload),
    saveTimeline: (payload) => ipcRenderer.invoke('nodeExport:saveTimeline', payload),
    openJianying: () => ipcRenderer.invoke('nodeExport:openJianying'),
  },
  mediaTask: {
    history: {
      status: () => ipcRenderer.invoke('mediaTaskHistory:status'),
      read: (payload) => ipcRenderer.invoke('mediaTaskHistory:read', payload),
      configure: (payload) => ipcRenderer.invoke('mediaTaskHistory:configure', payload),
      flush: () => ipcRenderer.invoke('mediaTaskHistory:flush'),
    },
    enqueue: (payload) => ipcRenderer.invoke('mediaTask:enqueue', payload),
    cancel: (payload) => ipcRenderer.invoke('mediaTask:cancel', payload),
    list: (payload) => ipcRenderer.invoke('mediaTask:list', payload),
    onUpdate: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('mediaTask:update', listener);
      return () => {
        ipcRenderer.removeListener('mediaTask:update', listener);
      };
    },
  },
  getLocalPreviewUrl: (payload) => ipcRenderer.invoke('file:getLocalPreviewUrl', payload),
  importLocalFile: (payload) => ipcRenderer.invoke('file:importLocalFile', payload),
  selectDirectory: (payload) => ipcRenderer.invoke('dialog:selectDirectory', payload),
  notificationSound: {
    listMp3Files: (payload) => ipcRenderer.invoke('notificationSound:listMp3Files', payload),
    listSystemSounds: () => ipcRenderer.invoke('notificationSound:listSystemSounds'),
    openSystemSoundFolder: () => ipcRenderer.invoke('notificationSound:openSystemSoundFolder'),
    play: (payload) => ipcRenderer.invoke('notificationSound:play', payload),
  },
  showItemInFolder: (payload) => ipcRenderer.invoke('shell:showItemInFolder', payload),
  openKnownFolder: (payload) => ipcRenderer.invoke('shell:openKnownFolder', payload),
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', { url }),
  },
  webPreview: {
    syncViews: (payload) => ipcRenderer.invoke('webPreview:syncViews', payload),
    syncViewsFast: (payload) => {
      ipcRenderer.send('webPreview:syncViewsFast', payload);
      return Promise.resolve({ ok: true });
    },
    disposeViews: (payload) => ipcRenderer.invoke('webPreview:disposeViews', payload),
    controlView: (payload) => ipcRenderer.invoke('webPreview:controlView', payload),
    onEvent: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('webPreview:event', listener);
      return () => {
        ipcRenderer.removeListener('webPreview:event', listener);
      };
    },
  },
  diagnostics: {
    logEvent: (payload) => ipcRenderer.invoke('diagnostics:logEvent', payload),
    createPackage: (payload) => ipcRenderer.invoke('diagnostics:createPackage', payload),
    openLogsFolder: () => ipcRenderer.invoke('diagnostics:openLogsFolder'),
  },
  notification: {
    showGenerationComplete: (payload) => ipcRenderer.invoke('notification:showGenerationComplete', payload),
    updateGlobalShortcut: (payload) => ipcRenderer.invoke('notification:updateGlobalShortcut', payload),
    acknowledge: (payload) => ipcRenderer.invoke('notification:acknowledge', payload),
    onGenerationCompleteClick: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => {
        callback(payload);
      };
      ipcRenderer.on('notification:generationCompleteClicked', listener);
      return () => {
        ipcRenderer.removeListener('notification:generationCompleteClicked', listener);
      };
    },
  },
  localAssetCleanup: {
    scan: (payload) => ipcRenderer.invoke('localAssetCleanup:scan', payload),
    trash: (payload) => ipcRenderer.invoke('localAssetCleanup:trash', payload),
  },
  onAssetUpdated: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => {
      callback(payload);
    };
    ipcRenderer.on('asset:updated', listener);
    return () => {
      ipcRenderer.removeListener('asset:updated', listener);
    };
  },
  logDragImport: (label, payload) => ipcRenderer.send('diagnostics:dragImportLog', { label, payload }),
});
