const http = require("http");
const { readFile, stat } = require("fs/promises");
const { extname, join } = require("path");

const PORT = process.env.PORT || 5173;

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

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
