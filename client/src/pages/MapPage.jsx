import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents } from '../api/incidentsApi';
import { getIncidentStatusLabel } from '../utils/dictionaries';

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (mapInstance.current) return;

    const L = window.L;
    if (!L) {
      setError('Leaflet не загружен');
      return;
    }

    const map = L.map(mapRef.current).setView([54.9885, 82.9207], 12);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    getIncidents({ limit: 200 })
      .then(result => {
        const points = result.data.filter(inc => inc.latitude && inc.longitude);

        points.forEach(inc => {
          const marker = L.circleMarker([inc.latitude, inc.longitude], {
            radius: 8,
            color: '#c0392b',
            fillColor: '#e74c3c',
            fillOpacity: 0.95,
            weight: 2
          }).addTo(map);

          marker.bindTooltip(
            `${inc.address}${inc.house ? `, д. ${inc.house}` : ''}<br/>Нажмите, чтобы узнать подробнее`,
            { direction: 'top' }
          );

          marker.on('click', () => {
            navigate(`/incidents/${inc.id}`);
          });
        });

        if (points.length > 0) {
          const bounds = L.latLngBounds(points.map(inc => [inc.latitude, inc.longitude]));
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      })
      .catch(() => {
        setError('Не удалось загрузить инциденты для карты');
      });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Карта инцидентов</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        Красные точки показывают только те инциденты, у которых адрес был успешно найден на карте.
      </div>
      {error && <div style={{ color: '#e74c3c', marginBottom: 12 }}>{error}</div>}
      <div ref={mapRef} style={{ height: '70vh', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
    </div>
  );
}