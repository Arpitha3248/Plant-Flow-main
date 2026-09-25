import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// __dirname shim for ESM (NodeNext module output)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Simple Window State Persistence file in AppData
const getWindowStatePath = () => path.join(app.getPath('userData'), 'window-state.json');

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

function loadWindowState(): WindowState {
  try {
    const data = fs.readFileSync(getWindowStatePath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return { width: 1400, height: 900, isMaximized: false };
  }
}

function saveWindowState(state: WindowState) {
  try {
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save window state', e);
  }
}

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width || 1400,
    height: state.height || 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Plant Flow Designer',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  // Window State event listeners
  const updateState = () => {
    if (!mainWindow) return;
    const isMaximized = mainWindow.isMaximized();
    if (!isMaximized) {
      const bounds = mainWindow.getBounds();
      saveWindowState({ ...bounds, isMaximized: false });
    } else {
      saveWindowState({ width: 1400, height: 900, isMaximized: true });
    }
  };

  mainWindow.on('resize', updateState);
  mainWindow.on('move', updateState);
  mainWindow.on('close', updateState);

  // Load URL depending on Dev vs Production
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(devUrl);
  } else {
    // Try local dev server first if running in unpacked dev mode without VITE_DEV_SERVER_URL set
    const prodPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(prodPath)) {
      mainWindow.loadFile(prodPath);
    } else {
      mainWindow.loadURL(devUrl);
    }
  }

  // Setup Application Menu
  setupApplicationMenu();
}

function setupApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Plant Configuration...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (mainWindow) {
              const res = await handleOpenPlantFile();
              if (!res.canceled && res.content) {
                mainWindow.webContents.send('menu:openFile', res);
              }
            }
          },
        },
        {
          label: 'Export Plant Configuration...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:triggerExport');
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Plant Flow Designer',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About Plant Flow Designer',
              message: 'Plant Flow Designer v1.0.0',
              detail: 'Industrial process flow modeling desktop application built with React, Vite, and Electron.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handler for opening plant file
async function handleOpenPlantFile() {
  if (!mainWindow) return { canceled: true };
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Plant Configuration',
    filters: [{ name: 'JSON Plant Config (*.json)', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (res.canceled || res.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = res.filePaths[0];
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { canceled: false, filePath, content };
  } catch (e: any) {
    return { canceled: true, error: e.message };
  }
}

// Handler for saving plant file
async function handleSavePlantFile(_: any, { content, defaultName }: { content: string; defaultName?: string }) {
  if (!mainWindow) return { canceled: true };
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Plant Configuration',
    defaultPath: defaultName || 'plant-config.json',
    filters: [{ name: 'JSON Plant Config (*.json)', extensions: ['json'] }],
  });

  if (res.canceled || !res.filePath) {
    return { canceled: true };
  }

  try {
    await fs.promises.writeFile(res.filePath, content, 'utf-8');
    return { canceled: false, filePath: res.filePath };
  } catch (e: any) {
    return { canceled: true, error: e.message };
  }
}

// IPC Handlers Setup
ipcMain.handle('dialog:openPlantFile', handleOpenPlantFile);
ipcMain.handle('dialog:savePlantFile', handleSavePlantFile);
ipcMain.handle('app:getInfo', () => ({
  name: app.getName(),
  version: app.getVersion(),
  platform: process.platform,
}));

ipcMain.on('window:setTitle', (_, title: string) => {
  if (mainWindow) {
    mainWindow.setTitle(`Plant Flow Designer — ${title}`);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
