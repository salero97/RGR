import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  nav: { background: '#c0392b', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 24px', height: 56, gap: 24 },
  brand: { fontWeight: 700, fontSize: 18, marginRight: 'auto' },
  link: { color: '#fff', opacity: 0.85, fontSize: 14, padding: '4px 8px', borderRadius: 4, textDecoration: 'none' },
  activeLink: { color: '#fff', opacity: 1, fontWeight: 600, background: 'rgba(255,255,255,0.15)', fontSize: 14, padding: '4px 8px', borderRadius: 4, textDecoration: 'none' },
  btn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 14px', borderRadius: 4, fontSize: 14 },
};

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/login'); }
  const linkStyle = ({ isActive }) => isActive ? s.activeLink : s.link;

  return (
    <nav style={s.nav}>
      <span style={s.brand}>🔥 FireSafety</span>
      <NavLink to="/dashboard" style={linkStyle}>Главная</NavLink>
      <NavLink to="/incidents" style={linkStyle}>Инциденты</NavLink>
      <NavLink to="/buildings" style={linkStyle}>Здания</NavLink>
      <NavLink to="/map" style={linkStyle}>Карта</NavLink>
      {user?.role === 'admin' && (
        <NavLink to="/users" style={linkStyle}>Пользователи</NavLink>
      )}
      <NavLink to="/profile" style={linkStyle}>Профиль</NavLink>
      <button style={s.btn} onClick={handleLogout}>Выйти</button>
    </nav>
  );
}