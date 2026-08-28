import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logout } from '../api/authApi';
import { setApiToken } from '../api/axios';

const s = {
    wrap: { display: 'flex', minHeight: '100vh', background: '#f5f6fa' },
    sidebar: { width: 220, background: '#2c3e50', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    logo: { padding: '24px 20px 16px', fontSize: 15, fontWeight: 700, color: '#ecf0f1', borderBottom: '1px solid rgba(255,255,255,0.1)', lineHeight: 1.4 },
    logoSub: { fontSize: 11, color: '#95a5a6', fontWeight: 400 },
    nav: { padding: '12px 0', flex: 1 },
    link: { display: 'block', padding: '10px 20px', color: '#bdc3c7', textDecoration: 'none', fontSize: 14, transition: 'all 0.15s' },
    linkActive: { color: '#fff', background: 'rgba(255,255,255,0.1)', borderLeft: '3px solid #e74c3c' },
    footer: { padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
    userInfo: { fontSize: 12, color: '#95a5a6', marginBottom: 8 },
    logoutBtn: { width: '100%', padding: '8px 0', background: 'rgba(231,76,60,0.15)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    main: { flex: 1, padding: 32, overflowY: 'auto' }
};

const linkStyle = ({ isActive }) => ({ ...s.link, ...(isActive ? s.linkActive : {}) });

export default function Layout() {
    const { user, setToken, setUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    async function handleLogout() {
        try { await logout(); } catch {}
        setToken(null);
        setUser(null);
        setApiToken(null);
        navigate('/login');
    }

    return (
        <div style={s.wrap}>
            <div style={s.sidebar}>
                <div style={s.logo}>
                    Пожарная<br />безопасность
                    <div style={s.logoSub}>Система управления</div>
                </div>
                <nav style={s.nav}>
                    <NavLink to="/dashboard" style={linkStyle}>Дашборд</NavLink>
                    <NavLink to="/incidents" style={linkStyle}>Инциденты</NavLink>
                    <NavLink to="/map" style={linkStyle}>Карта</NavLink>
                    <NavLink to="/buildings" style={linkStyle}>Объекты</NavLink>
                    <NavLink to="/sensors" style={linkStyle}>Датчики</NavLink>
                    {user?.role === 'admin' && <NavLink to="/users" style={linkStyle}>Пользователи</NavLink>}
                    {user?.role === 'admin' && <NavLink to="/audit" style={linkStyle}>Аудит</NavLink>}
                    <NavLink to="/profile" style={linkStyle}>Профиль</NavLink>
                </nav>
                <div style={s.footer}>
                    <div style={s.userInfo}>{user?.username} · {user?.role}</div>
                    <button style={s.logoutBtn} onClick={handleLogout}>Выйти</button>
                </div>
            </div>
            <main style={s.main}>
                <Outlet />
            </main>
        </div>
    );
}
