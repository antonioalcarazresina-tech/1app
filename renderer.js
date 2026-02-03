const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const statusDiv = document.getElementById('status');

searchBtn.addEventListener('click', async () => {
  const query = searchInput.value;
  if (!query) return;

  statusDiv.innerText = 'Buscando en CurseForge...';
  resultsDiv.innerHTML = '';

  const mods = await window.api.searchMods(query);

  if (mods.length === 0) {
    statusDiv.innerText = 'No se encontraron mods.';
    return;
  }

  statusDiv.innerText = `Se encontraron ${mods.length} mods.`;

  mods.forEach((mod) => {
    const card = document.createElement('div');
    card.className = 'mod-card';

    // Obtenemos el archivo más reciente
    const latestFile = mod.latestFiles[0];

    card.innerHTML = `
      <div class="mod-info">
        <h3>${mod.name}</h3>
        <p>${mod.summary}</p>
      </div>
      <button onclick="descargar('${latestFile.downloadUrl}', '${latestFile.fileName}')">
        Instalar
      </button>
    `;
    resultsDiv.appendChild(card);
  });
});

async function descargar(url, fileName) {
  statusDiv.innerText = `Iniciando descarga de: ${fileName}...`;
  const resultado = await window.api.downloadMod(url, fileName);
  statusDiv.innerText = resultado;
}

// Hacer la función accesible desde el HTML
window.descargar = descargar;
