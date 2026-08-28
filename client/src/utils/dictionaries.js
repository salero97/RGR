export const INCIDENT_STATUS_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'inprogress', label: 'В работе' },
  { value: 'resolved', label: 'Закрытый' },
  { value: 'falsealarm', label: 'Ложный' }
];

export const INCIDENT_SEVERITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' }
];

export const BUILDING_STATUS_UI_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'inprogress', label: 'В работе' },
  { value: 'resolved', label: 'Закрытый' },
  { value: 'falsealarm', label: 'Ложный' }
];

export const BUILDING_RISKLEVEL_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' }
];

export const INCIDENT_THREAT_TYPES = [
  'Пожар',
  'Задымление',
  'Запах газа',
  'Утечка газа',
  'Короткое замыкание',
  'Перегрев оборудования',
  'Срабатывание сигнализации',
  'Неизвестная угроза'
];

export function getIncidentStatusLabel(value) {
  return INCIDENT_STATUS_OPTIONS.find(item => item.value === value)?.label || value || '—';
}

export function getIncidentSeverityLabel(value) {
  return INCIDENT_SEVERITY_OPTIONS.find(item => item.value === value)?.label || value || '—';
}

export function getRiskLevelLabel(value) {
  return BUILDING_RISKLEVEL_OPTIONS.find(item => item.value === value)?.label || value || '—';
}

export function getBuildingStatusLabel(value) {
  return BUILDING_STATUS_UI_OPTIONS.find(item => item.value === value)?.label || value || '—';
}