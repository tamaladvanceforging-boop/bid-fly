import { app, BrowserWindow, shell, Notification } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, closeDatabase } from '@main/database'
import { registerIpcHandlers } from '@main/ipc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

let win: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow(): void {
  const isWin = process.platform === 'win32'
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, isWin ? 'icon.ico' : 'icon.png')
    : path.join(__dirname, isWin ? '../../build/icon.ico' : '../../public/icon.png')

  win = new BrowserWindow({
    title: 'BidFly Enterprise Suite',
    icon: iconPath,
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a0a0a',
    show: false,
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.once('ready-to-show', () => win?.show())

  if (VITE_DEV_SERVER_URL) {
    const loadDevServer = () => {
      win?.loadURL(VITE_DEV_SERVER_URL).catch(() => {
        setTimeout(() => {
          if (win && !win.isDestroyed()) loadDevServer()
        }, 500)
      })
    }
    loadDevServer()
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.whenReady().then(() => {
  // Set AppUserModelId for correct Windows taskbar & shell icon association
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.tamalroychowdhury.bidfly')
  }
  try {
    initDatabase()
  } catch (err) {
    console.error('Failed to initialize database:', err)
  }
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  closeDatabase()
})

app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (ev, navigationUrl) => {
    const parsed = new URL(navigationUrl)
    if (parsed.origin !== new URL(VITE_DEV_SERVER_URL ?? 'http://localhost').origin) {
      ev.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
})

export function showNotification(title: string, body: string, silent = false): void {
  if (!Notification.isSupported()) return
  new Notification({ title, body, silent }).show()
}
