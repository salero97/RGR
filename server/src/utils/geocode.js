const fetch = require('node-fetch');

async function geocodeAddress(address, house) {
  const query = [address, house].filter(Boolean).join(', ');
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'fire-safety-app/1.0'
      }
    });

    if (!response.ok) {
      return {
        found: false,
        latitude: null,
        longitude: null,
        message: 'Не удалось выполнить геокодирование адреса'
      };
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return {
        found: false,
        latitude: null,
        longitude: null,
        message: 'Адрес не найден на карте'
      };
    }

    return {
      found: true,
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
      message: 'Адрес успешно отмечен на карте'
    };
  } catch (error) {
    return {
      found: false,
      latitude: null,
      longitude: null,
      message: 'Ошибка при обращении к сервису карт'
    };
  }
}

module.exports = {
  geocodeAddress
};