"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", {
      ipc: (channel, data) => electron.ipcRenderer.send(channel, data),
      electronAPI: preload.electronAPI
    });
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
