const STORAGE_KEY = "hytale-modpack";

const packNameInput = document.getElementById("pack-name");
const packVersionInput = document.getElementById("pack-version");
const packNotesInput = document.getElementById("pack-notes");
const modNameInput = document.getElementById("mod-name");
const modCategoryInput = document.getElementById("mod-category");
const modVersionInput = document.getElementById("mod-version");
const addButton = document.getElementById("add");
const lookupButton = document.getElementById("lookup");
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

  const downloadButton = document.createElement("button");
  downloadButton.className = "ghost";
  downloadButton.textContent = "Descargar";
  downloadButton.disabled = !mod.downloadUrl;
  downloadButton.addEventListener("click", () => {
    if (!mod.downloadUrl) return;
    window.open(mod.downloadUrl, "_blank", "noopener");
  });

  actions.append(removeButton, copyButton, downloadButton);
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

const addMod = (override = {}) => {
  const base = parseModInput(modNameInput.value);
  if (!base.name) return;
  state.mods.unshift({
    ...base,
    category: modCategoryInput.value.trim(),
    version: modVersionInput.value.trim(),
    ...override,
  });
  modNameInput.value = "";
  modCategoryInput.value = "";
  modVersionInput.value = "";
  renderMods();
  saveState();
};

const lookupMod = async () => {
  const input = modNameInput.value.trim();
  if (!input) {
    setStatus("Añade un enlace o slug de CurseForge.", "warning");
    return;
  }
  setStatus("Buscando en CurseForge...", "info");
  try {
    const response = await fetch(`/api/curseforge/resolve?input=${encodeURIComponent(input)}`);
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "No se pudo obtener el mod.", "error");
      return;
    }
    addMod({
      name: payload.name,
      url: payload.websiteUrl || input,
      source: "CurseForge",
      downloadUrl: payload.downloadUrl,
    });
    setStatus(`Mod "${payload.name}" añadido.`, "success");
  } catch (error) {
    setStatus("Error al conectar con CurseForge.", "error");
  }
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
};

[packNameInput, packVersionInput, packNotesInput].forEach((input) => {
  input.addEventListener("input", saveState);
});

addButton.addEventListener("click", () => addMod());
lookupButton.addEventListener("click", lookupMod);
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
setStatus("Configura CURSEFORGE_API_KEY para habilitar búsquedas.", "info");
