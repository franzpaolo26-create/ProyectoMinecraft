// frontend/src/app/App.jsx
// App = componente caudal/principal del proyecto(SPA(SINGLE PAGE APPLICATION)), punto centra de la UI

import React from "react";

// importamos piezas de React Router (v6) para manejar URLs sin recargar la página
import {
    Routes, // Contenedor: dentro van todas las rutas 
    Route, // Cada Route define: path (URL) --> element (componente a renderizar)
    Navigate, // Componente para redirigir a otra ruta (cambia URL sin refresh)
    Outlet, // "Hueco" donde se renderiza la ruta hija dentro de un layout
    Link, // Enlace interno: navega sin recargar (como elementoo<a> pero para SPA(SINGLE PAGE APPLICATION))
    useLocation, // Hook: te dice en qué URL estas (util para volver tras login)
    useNavigate, // Hook: navegar por código (redirect programatico)
    useParams, // Hook: leer parametros de la URL (ej: /players/:uuid)
} from "react-router-dom";

// Export de la app
export default function App() {
    // App de normal, renderiza las rutas principales
    return <AppRoutes />;
}

// 1) RUTAS PRINCIPALES