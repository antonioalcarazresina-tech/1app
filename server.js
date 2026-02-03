const http = require("http");
const { readFile, stat } = require("fs/promises");
const { extname, join } = require("path");

const PORT = process.env.PORT || 5173;
const API_KEY = process.env.CURSEFORGE_API_KEY;
const GAME_ID = process.env.CURSEFORGE_GAME_ID;

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const parseSlug = (value) => {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch (error) {
    return value;
  }
};

const fetchCurseforge = async (endpoint) => {
  const response = await fetch(`https://api.curseforge.com${endpoint}`, {
    headers: {
      Accept: "application/json",
      "x-api-key": API_KEY,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Error en la API de CurseForge");
  }
  return response.json();
};

const handleResolve = async (res, input) => {
  if (!API_KEY) {
    sendJson(res, 400, { error: "Configura CURSEFORGE_API_KEY en el servidor." });
    return;
  }
  if (!GAME_ID) {
    sendJson(res, 400, { error: "Configura CURSEFORGE_GAME_ID para buscar mods." });
    return;
  }
  if (!input) {
    sendJson(res, 400, { error: "Añade un enlace o slug de CurseForge." });
    return;
  }

  const trimmed = input.trim();
  const isNumeric = /^\d+$/.test(trimmed);
  const slug = parseSlug(trimmed);

  let mod;
  if (isNumeric) {
    const modData = await fetchCurseforge(`/v1/mods/${trimmed}`);
    mod = modData.data;
  } else {
    const search = await fetchCurseforge(
      `/v1/mods/search?gameId=${GAME_ID}&slug=${encodeURIComponent(slug)}`,
    );
    mod = search.data?.[0];
  }

  if (!mod) {
    sendJson(res, 404, { error: "No se encontró el mod en CurseForge." });
    return;
  }

  let latestFile = null;
  try {
    const files = await fetchCurseforge(`/v1/mods/${mod.id}/files?pageSize=1`);
    latestFile = files.data?.[0] ?? null;
  } catch (error) {
    latestFile = null;
  }

  sendJson(res, 200, {
    id: mod.id,
    name: mod.name,
    summary: mod.summary,
    slug: mod.slug,
    websiteUrl: mod.links?.websiteUrl,
    downloadUrl: latestFile?.downloadUrl ?? "",
    latestFile: latestFile
      ? {
          fileName: latestFile.fileName,
          gameVersion: latestFile.gameVersions?.[0] ?? "",
        }
      : null,
  });
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/curseforge/resolve" && req.method === "GET") {
    try {
      await handleResolve(res, url.searchParams.get("input") || "");
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Error interno." });
    }
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "Ruta no encontrada." });
    return;
  }

  const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const fullPath = join(process.cwd(), filePath);
  try {
    const fileStat = await stat(fullPath);
    if (fileStat.isDirectory()) {
      sendJson(res, 404, { error: "Ruta no encontrada." });
      return;
    }
    const file = await readFile(fullPath);
    const ext = extname(fullPath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(file);
  } catch (error) {
    sendJson(res, 404, { error: "Recurso no encontrado." });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
