import React from 'react';

export default function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 48, height: 48, border: '5px solid #ddd', borderTop: '5px solid #c0392b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}