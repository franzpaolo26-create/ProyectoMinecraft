# 🎮 ProyectoMinecraft — SkyWars Server

Sistema completo de SkyWars para Minecraft con backend, frontend admin y plugin de estadísticas.

## 📁 Estructura

```
ProyectoMinecraft/
├── backend/     → API REST en Node.js + PostgreSQL
├── frontend/    → Panel admin en React
├── plugin/      → Plugin Java addon para Paper (1.20)
└── tasks/       → Tareas para colaboradores
```

## 🔗 Cómo se comunican

```
Minecraft (Paper + SkyWarsUp + nuestro addon)
        │  HTTP POST cada 5s
        ▼
    Backend Node.js  ◄──── Frontend React (panel admin)
        │
        ▼
    PostgreSQL
```

## 🚀 Setup rápido

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Plugin
cd plugin && mvn package
# Copiar target/SkyWarsStatsAddon-1.0.jar a /plugins del servidor
```

## 🤝 Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) y la carpeta [tasks/](./tasks/).
