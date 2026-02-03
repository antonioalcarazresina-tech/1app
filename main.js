const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// --- LÓGICA DE CURSEFORGE ---

const API_KEY = '$2a$10$TU_API_KEY_AQUI'; // <--- PON TU KEY DE CURSEFORGE AQUÍ

ipcMain.handle('search-mods', async (event, query) => {
  try {
    const response = await axios.get('https://api.curseforge.com/v1/mods/search', {
      headers: { 'x-api-key': API_KEY },
      params: {
        gameId: 79242, // ID tentativo de Hytale
        searchFilter: query,
        pageSize: 15
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error en API:', error);
    return [];
  }
});

ipcMain.handle('download-mod', async (event, { url, fileName }) => {
  try {
    // Definimos la carpeta de mods en los documentos del usuario
    const modsFolder = path.join(app.getPath('documents'), 'Hytale_Mods');

    if (!fs.existsSync(modsFolder)) {
      fs.mkdirSync(modsFolder, { recursive: true });
    }

    const filePath = path.join(modsFolder, fileName);
    const writer = fs.createWriteStream(filePath);

    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`Instalado en: ${filePath}`));
      writer.on('error', reject);
    });
  } catch (error) {
    return 'Error al descargar: ' + error.message;
  }
});
