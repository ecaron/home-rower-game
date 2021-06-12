const express = require('./app/main')
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow (localPort) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    useContentSize: true,
    resizable: false,
  });
  mainWindow.loadURL(`http://localhost:${localPort}/`);
  mainWindow.focus()
}

app.whenReady().then(async () => {
  const localPort = await express()
  createWindow(localPort)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
