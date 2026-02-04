const STORAGE_KEY = "hytale-modpack";
const SEARCH_URL =
  "https://www.curseforge.com/hytale/search?page=1&pageSize=20&sortBy=relevancy&search=";

const packNameInput = document.getElementById("pack-name");
const packVersionInput = document.getElementById("pack-version");
const packNotesInput = document.getElementById("pack-notes");
const modNameInput = document.getElementById("mod-name");
const modCategoryInput = document.getElementById("mod-category");
const modVersionInput = document.getElementById("mod-version");
const modImageInput = document.getElementById("mod-image");
const importFileInput = document.getElementById("import-file");
const importTextInput = document.getElementById("import-text");
const addButton = document.getElementById("add");
const searchButton = document.getElementById("search");
const importButton = document.getElementById("import");
const importClearButton = document.getElementById("import-clear");
const modFilterInput = document.getElementById("mod-filter");
const modSortSelect = document.getElementById("mod-sort");
const modCategories = document.getElementById("mod-categories");
const counter = document.getElementById("counter");
const exportSecondaryButton = document.getElementById("export-secondary");
const clearButton = document.getElementById("clear");
const clearSecondaryButton = document.getElementById("clear-secondary");
const statusBox = document.getElementById("status");
const toggleButtons = document.querySelectorAll(".toggle-button");
const toggleContents = document.querySelectorAll(".toggle-content");

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

const setTransferView = (target) => {
  toggleButtons.forEach((button) => {
    const isActive = button.dataset.target === target;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  toggleContents.forEach((panel) => {
    const isActive = panel.dataset.content === target;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
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

const getFilteredMods = () => {
  const query = modFilterInput.value.trim().toLowerCase();
  const mods = query
    ? state.mods.filter((mod) => {
        const name = mod.name?.toLowerCase() || "";
        const category = mod.category?.toLowerCase() || "";
        const version = mod.version?.toLowerCase() || "";
        return name.includes(query) || category.includes(query) || version.includes(query);
      })
    : [...state.mods];

  const sort = modSortSelect.value;
  if (sort === "name") {
    mods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }
  if (sort === "category") {
    mods.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
  }
  return mods;
};

const renderMods = () => {
  modCategories.innerHTML = "";
  const filteredMods = getFilteredMods();
  if (!filteredMods.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = state.mods.length
      ? "No hay mods con ese filtro. Ajusta la búsqueda."
      : "Aún no has añadido mods. Usa el buscador para empezar.";
    modCategories.appendChild(empty);
    updateCounter();
    return;
  }
  const grouped = filteredMods.reduce((acc, mod, index) => {
    const category = mod.category?.trim() || "Sin categoría";
    if (!acc.has(category)) {
      acc.set(category, []);
    }
    const originalIndex = state.mods.findIndex((item) => item === mod);
    acc.get(category).push({ ...mod, index: originalIndex });
    return acc;
  }, new Map());

  Array.from(grouped.entries()).forEach(([category, mods]) => {
    const categoryBlock = document.createElement("div");
    categoryBlock.className = "category-block";

    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `<h3>${category}</h3><span>${mods.length} mods</span>`;

    const grid = document.createElement("div");
    grid.className = "mod-grid";

    mods.forEach((mod) => {
      grid.appendChild(createModCard(mod, mod.index));
    });

    categoryBlock.append(header, grid);
    modCategories.appendChild(categoryBlock);
  });
  updateCounter();
};

const createModCard = (mod, index) => {
  const card = document.createElement("div");
  card.className = "mod-card";

  const header = document.createElement("div");
  header.className = "mod-card-header";

  const icon = document.createElement("div");
  icon.className = "mod-icon";
  if (mod.image) {
    const img = document.createElement("img");
    img.src = mod.image;
    img.alt = `Logo de ${mod.name}`;
    img.loading = "lazy";
    icon.appendChild(img);
  } else {
    icon.textContent = mod.name.slice(0, 2).toUpperCase();
  }

  const info = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = mod.name;
  const meta = document.createElement("p");
  meta.className = "mod-meta";
  meta.textContent = `Versión: ${mod.version || "N/D"} · Fuente: ${mod.source || "Manual"}`;

  info.append(title, meta);
  header.append(icon, info);

  const actions = document.createElement("div");
  actions.className = "mod-actions";

  const openButton = document.createElement("button");
  openButton.className = "ghost";
  openButton.textContent = "Abrir enlace";
  openButton.disabled = !mod.url;
  openButton.addEventListener("click", () => {
    if (!mod.url) return;
    window.open(mod.url, "_blank", "noopener");
  });

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
  copyButton.disabled = !mod.url;
  copyButton.addEventListener("click", () => {
    if (!mod.url) return;
    navigator.clipboard.writeText(mod.url).catch(() => null);
  });

  actions.append(openButton, copyButton, removeButton);
  card.append(header, actions);
  return card;
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
    image: modImageInput.value.trim(),
  });
  modNameInput.value = "";
  modCategoryInput.value = "";
  modVersionInput.value = "";
  modImageInput.value = "";
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
  image: typeof mod?.image === "string" ? mod.image : "",
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

modFilterInput.addEventListener("input", renderMods);
modSortSelect.addEventListener("change", renderMods);
addButton.addEventListener("click", addMod);
searchButton.addEventListener("click", openSearch);
toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTransferView(button.dataset.target);
  });
});
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
exportSecondaryButton.addEventListener("click", exportModpack);
clearButton.addEventListener("click", clearList);
clearSecondaryButton.addEventListener("click", clearList);

loadState();
packNameInput.value = state.pack.name;
packVersionInput.value = state.pack.version;
packNotesInput.value = state.pack.notes;
renderMods();
setStatus("Busca el mod en CurseForge y pega su enlace aquí.", "info");
setTransferView("import");
