import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopAPI', {
  openPlantFile: () => ipcRenderer.invoke('dialog:openPlantFile'),
  savePlantFile: (content: string, defaultName?: string) =>
    ipcRenderer.invoke('dialog:savePlantFile', { content, defaultName }),
  setWindowTitle: (title: string) => ipcRenderer.send('window:setTitle', title),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
});
