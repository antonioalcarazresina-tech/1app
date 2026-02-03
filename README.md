# Hytale Modpack Creator

Herramienta web sencilla para crear modpacks de Hytale con referencias de CurseForge y descargas opcionales.

## Requisitos
- Node.js 18+.
- (Opcional) API key de CurseForge.

## Configuración de CurseForge (opcional)

Configura estas variables de entorno para habilitar la búsqueda y descarga:

```bash
export CURSEFORGE_API_KEY="tu_api_key"
export CURSEFORGE_GAME_ID="tu_game_id"
```

## Cómo iniciar

```bash
npm run dev
```

Luego abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## Qué incluye
- Formulario de datos del modpack (nombre, versión, notas).
- Búsqueda en CurseForge con API key y descarga del último archivo disponible.
- Exportación del modpack a JSON para compartirlo.
