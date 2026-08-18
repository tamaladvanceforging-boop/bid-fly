const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let server = null;
let serverPort = null;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=UTF-8'
};

function getOutDir() {
  // In packaged app, out directory is in app resources or __dirname/../out
  const candidates = [
    path.join(__dirname, '..', 'out'),
    path.join(process.resourcesPath, 'app', 'out'),
    path.join(process.resourcesPath, 'out'),
    path.join(app.getAppPath(), 'out')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, '..', 'out');
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const outDir = getOutDir();

    server = http.createServer((req, res) => {
      let reqUrl = decodeURI(req.url.split('?')[0]);
      if (reqUrl === '/') reqUrl = '/index.html';

      let filePath = path.join(outDir, reqUrl);

      // If file doesn't exist directly, try adding .html or serving index.html
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
        } else {
          const indexSub = path.join(filePath, 'index.html');
          if (fs.existsSync(indexSub)) {
            filePath = indexSub;
          } else {
            filePath = path.join(outDir, 'index.html');
          }
        }
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      serverPort = port;
      resolve(port);
    });

    server.on('error', err => reject(err));
  });
}

function getIconPath() {
  const candidates = [
    path.join(__dirname, '..', 'build', 'icon.ico'),
    path.join(__dirname, '..', 'public', 'icon.ico'),
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(process.resourcesPath, 'build', 'icon.ico')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

async function createWindow() {
  const port = await startStaticServer();
  const icon = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    title: 'BidFly - Commercial Bid & Tender Management Suite',
    icon: icon,
    autoHideMenuBar: true,
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes(`127.0.0.1:${port}`)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
