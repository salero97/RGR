import React from 'react';
import { useToasts } from '../context/ToastContext';

export default function Toast() {
  const toasts = useToasts();
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 20px', borderRadius: 8, color: '#fff',
          background: t.type === 'error' ? '#e74c3c' : t.type === 'warn' ? '#f39c12' : '#27ae60',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 260, fontSize: 14
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}