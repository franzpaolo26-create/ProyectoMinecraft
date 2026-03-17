import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▪' },
  { to: '/players',   label: 'Players',   icon: '▪' },
  { to: '/matches',   label: 'Matches',   icon: '▪' },
  { to: '/admin',     label: 'Admin',     icon: '▪' },
];

export default function Layout() {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{ width:200, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>
        <div style={{ padding:'22px 18px 18px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:800, letterSpacing:'0.04em', lineHeight:1 }}>
            <span style={{ color:'var(--accent)' }}>SKY</span><span style={{ color:'var(--text)' }}>WARS</span>
          </div>
          <div style={{ fontSize:9.5, color:'var(--dim)', letterSpacing:'0.18em', textTransform:'uppercase', marginTop:4 }}>Admin Panel</div>
        </div>

        <nav style={{ padding:'10px 10px', flex:1 }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
              borderRadius:'var(--r)', textDecoration:'none', fontFamily:'var(--font-mono)',
              fontSize:12.5, fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent)' : to === '/admin' ? 'var(--warn)' : 'var(--muted)',
              background: isActive ? (to === '/admin' ? 'rgba(251,191,36,0.06)' : 'rgba(57,255,154,0.06)') : 'transparent',
              borderLeft: isActive ? `2px solid ${to === '/admin' ? 'var(--warn)' : 'var(--accent)'}` : '2px solid transparent',
              marginBottom:2, transition:'all 0.15s', letterSpacing:'0.03em',
            })}>
              <span style={{ fontSize:7, opacity:0.6 }}>{icon}</span>
              {label}
              {to === '/admin' && <span style={{ marginLeft:'auto', fontSize:9, color:'var(--warn)', opacity:0.7 }}>⚙</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, fontSize:10, color:'var(--dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
          <span className="dot-online" />Online
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <header style={{ borderBottom:'1px solid var(--border)', padding:'0 24px', height:48, background:'var(--surface)', position:'sticky', top:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:11.5, color:'var(--dim)', fontFamily:'var(--font-mono)', letterSpacing:'0.05em' }}>
            skywars <span style={{ color:'var(--border2)' }}>/</span> <span style={{ color:'var(--muted)' }}>admin</span>
          </div>
          <div style={{ fontSize:11, color:'var(--dim)', fontFamily:'var(--font-mono)' }}>
            {new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
          </div>
        </header>
        <main style={{ flex:1, padding:'26px 28px', overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
