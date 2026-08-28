const incidentModel = require('../models/incident.model');
const buildingModel = require('../models/building.model');
const auditModel = require('../models/auditLog.model');

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((col) => toCsvValue(row[col])).join(','));
  return [header, ...lines].join('\n');
}

async function exportIncidentsCsv(req, res, next) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();

    if (format !== 'csv') {
      return res.status(422).json({ status: 422, message: 'Поддерживается только format=csv' });
    }

    const { status, severity, search } = req.query;

    const result = await incidentModel.findAll({
      status,
      severity,
      search,
      page: 1,
      limit: 100000
    });

    const columns = [
      'id', 'address', 'house', 'floor', 'apartment', 'threattype',
      'severity', 'status', 'responsible', 'description',
      'latitude', 'longitude', 'createdat', 'updatedat'
    ];

    const csv = rowsToCsv(result.data, columns);

    auditModel.log({
      userId: req.user ? req.user.id : null,
      action: 'EXPORT_INCIDENTS_CSV',
      objectType: 'incident',
      objectId: null,
      details: { count: result.data.length, filters: { status, severity, search } },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="incidents.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

async function exportBuildingsCsv(req, res, next) {
  try {
    const format = (req.query.format || 'csv').toLowerCase();

    if (format !== 'csv') {
      return res.status(422).json({ status: 422, message: 'Поддерживается только format=csv' });
    }

    const { search } = req.query;
    const result = await buildingModel.findAllQuery({ search, page: 1, limit: 100000 });

    const columns = [
      'id', 'name', 'address', 'house', 'floors', 'risklevel',
      'status', 'description', 'latitude', 'longitude', 'createdat', 'updatedat'
    ];

    const csv = rowsToCsv(result.data, columns);

    auditModel.log({
      userId: req.user ? req.user.id : null,
      action: 'EXPORT_BUILDINGS_CSV',
      objectType: 'building',
      objectId: null,
      details: { count: result.data.length, filters: { search } },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="buildings.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = { exportIncidentsCsv, exportBuildingsCsv };