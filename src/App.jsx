import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Players from './pages/Players.jsx';
import Matches from './pages/Matches.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/players"   element={<Players />} />
        <Route path="/matches"   element={<Matches />} />
        <Route path="/admin"     element={<Admin />} />
      </Route>
      <Route path="*" element={<div style={{ padding:18, color:'var(--muted)' }}>Not Found</div>} />
    </Routes>
  );
}
