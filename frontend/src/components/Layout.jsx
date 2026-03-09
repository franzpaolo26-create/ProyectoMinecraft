// frontend/src/components/Layout.jsx
// Layout principal del panel:
// - NavLink resalta automáticamente el link activo.
// - Outlet renderiza la ruta hija activa (React Router v6).

import React from 'react';

import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  const styles = {
    app: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, Arial, sans-serif' },
    sidebar: {
      width: 220,
      flexShrink: 0,
      borderRight: '1px solid #ddd',
      padding: 16,
      position: 'sticky',
      top: 0,
      height: '100vh',
      background: '#fafafa',
    },
    brand: { fontWeight: 700, marginBottom: 12 },
    nav: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
    linkBase: {
      display: 'block',
      padding: '10px 12px',
      borderRadius: 8,
      textDecoration: 'none',
      color: '#111',
      border: '1px solid transparent',
    },
    linkActive: {
      background: '#f0f0f0',
      borderColor: '#ddd',
      fontWeight: 600,
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column' },
    header: {
      borderBottom: '1px solid #ddd',
      padding: '14px 18px',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 1,
    },
    title: { margin: 0, fontSize: 18 },
    content: { padding: 18 },
  };

  // NavLink recibe una función en style/className con { isActive } para resaltar el link activo.
  const linkStyle = ({ isActive }) => ({
    ...styles.linkBase,
    ...(isActive ? styles.linkActive : null),
  });

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>SkyWars Admin</div>

        <nav style={styles.nav}>
          <NavLink to="/dashboard" style={linkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/players" style={linkStyle}>
            Players
          </NavLink>
          <NavLink to="/matches" style={linkStyle}>
            Matches
          </NavLink>
        </nav>
      </aside>

      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>SkyWars Admin</h1>
        </header>

        {/* Outlet: aquí se renderiza la página hija según la ruta activa */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}