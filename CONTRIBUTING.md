# 🤝 Guía de Contribución

## Ramas
- `main` → código estable
- `dev`  → integración (los PRs van aquí)
- `feat/nombre` → nueva funcionalidad
- `fix/nombre`  → corrección de bug

## Pasos

```bash
git clone https://github.com/franzpaolo26-create/ProyectoMinecraft
cd ProyectoMinecraft
git checkout dev && git pull origin dev
git checkout -b feat/mi-aporte

# ... hacer cambios ...

git add .
git commit -m "feat(módulo): descripción"
git push origin feat/mi-aporte
# Abrir PR hacia dev en GitHub
```

## Formato de commits

```
feat(backend): agregar endpoint de historial
fix(plugin): corregir evento de muerte
docs(frontend): actualizar README
```

## ¿Dónde trabajo?

| Área | Carpeta | Stack |
|------|---------|-------|
| API / BD | `backend/` | Node.js + Express + PostgreSQL |
| Panel web | `frontend/` | React + Vite |
| Plugin MC | `plugin/` | Java 17 + Paper API |

Ver `tasks/` para tareas con instrucciones paso a paso.
