// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: () => ipcRenderer.invoke('CAPTURE_SCREEN'),
  resizeAndPositionWindow: () => ipcRenderer.invoke('RESIZE_AND_POSITION_WINDOW'),
  closeApp: () => ipcRenderer.send('CLOSE_APP'),
  openExternal: (url: string) => ipcRenderer.invoke('OPEN_EXTERNAL', url),
});