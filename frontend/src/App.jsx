// frontend/src/App.jsx
// Enrutado principal con React Router v6.
// - Routes/Route definen el mapa de URLs.
// - Navigate redirige (aquí: "/" -> "/dashboard").
// - Layout envuelve rutas hijas con sidebar + Outlet.

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Players from './pages/Players.jsx';
import Matches from './pages/Matches.jsx';

export default function App() {
    return (
        <Routes>
            {/* Redirección inicial */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    {/* Rutas bajo Layout (sidebar + header) */}
                    <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/players" element={<Players />} />
                    <Route path="/matches" element={<Matches />} />
                    </Route>
                    {/* Not Found simple */}
                <Route path="*" element={<div style={{ padding: 18 }}>Not Found</div>} />
        </Routes>
 );
}