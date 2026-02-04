const STORAGE_KEY = "hytale-modpack";

const detailGrid = document.getElementById("detail-grid");
const detailCounter = document.getElementById("detail-counter");
const detailFilter = document.getElementById("detail-filter");
const detailSort = document.getElementById("detail-sort");

const state = {
  mods: [],
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.mods = Array.isArray(parsed.mods) ? parsed.mods : [];
  } catch (error) {
    console.error("Error al cargar los mods", error);
  }
};

const getFilteredMods = () => {
  const query = detailFilter.value.trim().toLowerCase();
  const mods = query
    ? state.mods.filter((mod) => {
        const name = mod.name?.toLowerCase() || "";
        const category = mod.category?.toLowerCase() || "";
        const version = mod.version?.toLowerCase() || "";
        return name.includes(query) || category.includes(query) || version.includes(query);
      })
    : [...state.mods];

  const sort = detailSort.value;
  if (sort === "name") {
    mods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }
  if (sort === "category") {
    mods.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
  }
  return mods;
};

const renderMods = () => {
  detailGrid.innerHTML = "";
  const mods = getFilteredMods();
  detailCounter.textContent = `${mods.length} mod${mods.length === 1 ? "" : "s"}`;
  if (!mods.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = state.mods.length
      ? "No hay mods con ese filtro. Ajusta la búsqueda."
      : "Aún no has añadido mods. Vuelve al creador para empezar.";
    detailGrid.appendChild(empty);
    return;
  }

  mods.forEach((mod) => {
    const card = document.createElement("article");
    card.className = "mod-detail-card";

    const media = document.createElement("div");
    media.className = "mod-detail-media";
    if (mod.image) {
      const img = document.createElement("img");
      img.src = mod.image;
      img.alt = `Logo de ${mod.name}`;
      img.loading = "lazy";
      media.appendChild(img);
    } else {
      media.textContent = mod.name?.slice(0, 2).toUpperCase() || "HT";
    }

    const body = document.createElement("div");
    body.className = "mod-detail-body";
    const title = document.createElement("h3");
    title.textContent = mod.name || "Mod sin nombre";
    const meta = document.createElement("p");
    meta.className = "mod-meta";
    meta.textContent = `Categoría: ${mod.category || "Sin categoría"} · Versión: ${
      mod.version || "N/D"
    }`;
    const source = document.createElement("p");
    source.className = "microcopy";
    source.textContent = `Fuente: ${mod.source || "Manual"}`;

    const actions = document.createElement("div");
    actions.className = "mod-actions";
    const openButton = document.createElement("button");
    openButton.className = "secondary";
    openButton.textContent = "Abrir enlace";
    openButton.disabled = !mod.url;
    openButton.addEventListener("click", () => {
      if (!mod.url) return;
      window.open(mod.url, "_blank", "noopener");
    });
    const copyButton = document.createElement("button");
    copyButton.className = "ghost";
    copyButton.textContent = "Copiar enlace";
    copyButton.disabled = !mod.url;
    copyButton.addEventListener("click", () => {
      if (!mod.url) return;
      navigator.clipboard.writeText(mod.url).catch(() => null);
    });
    actions.append(openButton, copyButton);

    body.append(title, meta, source, actions);
    card.append(media, body);
    detailGrid.appendChild(card);
  });
};

detailFilter.addEventListener("input", renderMods);
detailSort.addEventListener("change", renderMods);

loadState();
renderMods();
