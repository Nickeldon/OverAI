"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const child_process = require("child_process");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 583,
    maxWidth: 1728,
    minWidth: 1152,
    alwaysOnTop: false,
    maximizable: false,
    minimizable: false,
    center: true,
    show: true,
    autoHideMenuBar: true,
    resizable: true,
    fullscreenable: false,
    frame: false,
    transparent: true,
    titleBarStyle: "hidden",
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  let ol_process = null;
  electron.ipcMain.on("ollama_serve", (event) => {
    console.log("serving");
    ol_process = child_process.spawn("ollama", ["serve"]);
    ol_process.stdout?.on("data", (data) => {
      console.log(`stdout: ${data}`);
      event.sender.send("ollama_serve_response", `Output: ${data}`);
    });
    ol_process.stderr?.on("data", (data) => {
      if (data) {
        console.log(`stderr: ${data}`);
        event.sender.send("ollama_serve_response", `STDERR: ${data.message}`);
        return;
      }
    });
    ol_process.on("error", (error) => {
      if (error) {
        console.error(`exec error: ${error}`);
        event.sender.send("ollama_serve_response", `Error: ${error.message}`);
        return;
      }
    });
  });
  electron.app.on("window-all-closed", () => {
    console.log("closing");
    if (ol_process) {
      console.log("killing process");
      ol_process.kill();
    }
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
