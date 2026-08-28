import React, { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const s = {
  btn: {
    padding: '8px 18px',
    background: '#2c3e50',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    marginLeft: 8
  }
};

export default function ExportButton({ endpoint, params = {}, fileName = 'export.csv' }) {
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  async function handleExport() {
    setLoading(true);
    try {
      const response = await api.get(endpoint, {
        params: { ...params, format: 'csv' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка экспорта данных');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button style={s.btn} onClick={handleExport} disabled={loading}>
      {loading ? 'Экспорт...' : 'Экспорт CSV'}
    </button>
  );
}