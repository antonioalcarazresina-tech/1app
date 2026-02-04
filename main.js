const STORAGE_KEY = "hytale-modpack";
const SEARCH_URL =
  "https://www.curseforge.com/hytale/search?page=1&pageSize=20&sortBy=relevancy&search=";

const packNameInput = document.getElementById("pack-name");
const packVersionInput = document.getElementById("pack-version");
const packNotesInput = document.getElementById("pack-notes");
const modNameInput = document.getElementById("mod-name");
const modCategoryInput = document.getElementById("mod-category");
const modVersionInput = document.getElementById("mod-version");
const importFileInput = document.getElementById("import-file");
const importTextInput = document.getElementById("import-text");
const addButton = document.getElementById("add");
const searchButton = document.getElementById("search");
const importButton = document.getElementById("import");
const importClearButton = document.getElementById("import-clear");
const modList = document.getElementById("mod-list");
const counter = document.getElementById("counter");
const exportButton = document.getElementById("export");
const clearButton = document.getElementById("clear");
const statusBox = document.getElementById("status");

const state = {
  pack: {
    name: "",
    version: "",
    notes: "",
  },
  mods: [],
};

const setStatus = (message, tone = "info") => {
  statusBox.textContent = message;
  statusBox.dataset.tone = tone;
};

const saveState = () => {
  state.pack.name = packNameInput.value.trim();
  state.pack.version = packVersionInput.value.trim();
  state.pack.notes = packNotesInput.value.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.pack = parsed.pack ?? state.pack;
    state.mods = parsed.mods ?? [];
  } catch (error) {
    console.error("Error al cargar el modpack", error);
  }
};

const updateCounter = () => {
  counter.textContent = `${state.mods.length} mod${state.mods.length === 1 ? "" : "s"}`;
};

const createModElement = (mod, index) => {
  const item = document.createElement("li");
  item.className = "mod-item";

  const title = document.createElement("h3");
  title.textContent = mod.name;

  const meta = document.createElement("div");
  meta.className = "mod-meta";
  meta.innerHTML = `
    <span>Versión: ${mod.version || "N/D"}</span>
    <span>Categoría: ${mod.category || "Sin etiqueta"}</span>
    <span>Fuente: ${mod.source || "Manual"}</span>
  `;

  const actions = document.createElement("div");
  actions.className = "mod-actions";

  const removeButton = document.createElement("button");
  removeButton.className = "secondary";
  removeButton.textContent = "Quitar";
  removeButton.addEventListener("click", () => {
    state.mods.splice(index, 1);
    renderMods();
    saveState();
  });

  const copyButton = document.createElement("button");
  copyButton.className = "ghost";
  copyButton.textContent = "Copiar enlace";
  copyButton.addEventListener("click", () => {
    if (!mod.url) return;
    navigator.clipboard.writeText(mod.url).catch(() => null);
  });

  actions.append(removeButton, copyButton);
  item.append(title, meta, actions);
  return item;
};

const renderMods = () => {
  modList.innerHTML = "";
  state.mods.forEach((mod, index) => {
    modList.appendChild(createModElement(mod, index));
  });
  updateCounter();
};

const parseModInput = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return { name: "" };
  const isUrl = /^https?:\/\//.test(trimmed);
  return {
    name: isUrl ? trimmed.split("/").pop()?.replace(/-/g, " ") || trimmed : trimmed,
    url: isUrl ? trimmed : "",
    source: isUrl ? "CurseForge" : "Manual",
  };
};

const addMod = () => {
  const base = parseModInput(modNameInput.value);
  if (!base.name) return;
  state.mods.unshift({
    ...base,
    category: modCategoryInput.value.trim(),
    version: modVersionInput.value.trim(),
  });
  modNameInput.value = "";
  modCategoryInput.value = "";
  modVersionInput.value = "";
  renderMods();
  saveState();
  setStatus("Mod añadido. Puedes pegar otro enlace si lo deseas.", "success");
};

const openSearch = () => {
  const query = modNameInput.value.trim();
  if (!query) {
    setStatus("Añade una palabra clave para buscar en CurseForge.", "warning");
    return;
  }
  const normalizedQuery = encodeURIComponent(query).replace(/%20/g, "+");
  const url = `${SEARCH_URL}${normalizedQuery}`;
  window.open(url, "_blank", "noopener");
  setStatus("Se abrió CurseForge en otra pestaña.", "info");
};

const exportModpack = () => {
  saveState();
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.pack.name || "hytale-modpack"}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const clearList = () => {
  state.mods = [];
  renderMods();
  saveState();
  setStatus("Lista vaciada.", "warning");
};

const sanitizeImportedMod = (mod) => ({
  name: typeof mod?.name === "string" ? mod.name : "Mod sin nombre",
  url: typeof mod?.url === "string" ? mod.url : "",
  source: typeof mod?.source === "string" ? mod.source : "Importado",
  category: typeof mod?.category === "string" ? mod.category : "",
  version: typeof mod?.version === "string" ? mod.version : "",
});

const applyImportedState = (payload) => {
  const pack = payload?.pack ?? {};
  const mods = Array.isArray(payload?.mods) ? payload.mods : [];
  state.pack = {
    name: typeof pack.name === "string" ? pack.name : "",
    version: typeof pack.version === "string" ? pack.version : "",
    notes: typeof pack.notes === "string" ? pack.notes : "",
  };
  state.mods = mods.map(sanitizeImportedMod);
  packNameInput.value = state.pack.name;
  packVersionInput.value = state.pack.version;
  packNotesInput.value = state.pack.notes;
  renderMods();
  saveState();
};

const importFromText = () => {
  const raw = importTextInput.value.trim();
  if (!raw) {
    setStatus("Pega el JSON del modpack antes de importar.", "warning");
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    applyImportedState(parsed);
    setStatus("Modpack importado correctamente.", "success");
  } catch (error) {
    console.error("Error al importar modpack", error);
    setStatus("El JSON no es válido. Revisa el contenido.", "error");
  }
};

const importFromFile = () => {
  const file = importFileInput.files?.[0];
  if (!file) {
    setStatus("Selecciona un archivo JSON para importar.", "warning");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      applyImportedState(parsed);
      setStatus("Modpack importado correctamente.", "success");
    } catch (error) {
      console.error("Error al importar modpack", error);
      setStatus("El archivo no contiene un JSON válido.", "error");
    }
  };
  reader.readAsText(file);
};

const clearImport = () => {
  importTextInput.value = "";
  importFileInput.value = "";
  setStatus("Importación limpia. Puedes pegar un nuevo JSON.", "info");
};

[packNameInput, packVersionInput, packNotesInput].forEach((input) => {
  input.addEventListener("input", saveState);
});

addButton.addEventListener("click", addMod);
searchButton.addEventListener("click", openSearch);
importButton.addEventListener("click", () => {
  if (importTextInput.value.trim()) {
    importFromText();
    return;
  }
  importFromFile();
});
importClearButton.addEventListener("click", clearImport);
importFileInput.addEventListener("change", () => {
  if (importFileInput.files?.length) {
    importTextInput.value = "";
  }
});
modNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addMod();
  }
});
exportButton.addEventListener("click", exportModpack);
clearButton.addEventListener("click", clearList);

loadState();
packNameInput.value = state.pack.name;
packVersionInput.value = state.pack.version;
packNotesInput.value = state.pack.notes;
renderMods();
setStatus("Busca el mod en CurseForge y pega su enlace aquí.", "info");
