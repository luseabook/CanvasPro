const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('globalCaptureWindow', {
  chooseAction: (payload) => ipcRenderer.invoke('globalCaptureWindow:chooseAction', payload),
  cancel: (payload) => ipcRenderer.invoke('globalCaptureWindow:cancel', payload),
  setExpanded: (payload) => ipcRenderer.invoke('globalCaptureWindow:setExpanded', payload),
  didPresent: (payload) => ipcRenderer.invoke('globalCaptureWindow:didPresent', payload),
  onPresent: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('globalCaptureWindow:present', listener);
    return () => {
      ipcRenderer.removeListener('globalCaptureWindow:present', listener);
    };
  },
});
