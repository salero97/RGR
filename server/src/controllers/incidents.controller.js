const incidentModel = require('../models/incident.model');
const { geocodeAddress } = require('../utils/geocode');
const auditModel = require('../models/auditLog.model');

const ALLOWED_STATUSES = ['new', 'inprogress', 'resolved', 'falsealarm'];
const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];

function mapIncidentForResponse(incident) {
  if (!incident) return incident;

  return {
    ...incident,
    statusLabel:
      incident.status === 'new' ? 'Новый'
        : incident.status === 'inprogress' ? 'В работе'
        : incident.status === 'resolved' ? 'Закрытый'
        : incident.status === 'falsealarm' ? 'Ложный'
        : incident.status,
    severityLabel:
      incident.severity === 'low' ? 'Низкий'
        : incident.severity === 'medium' ? 'Средний'
        : incident.severity === 'high' ? 'Высокий'
        : incident.severity === 'critical' ? 'Критический'
        : incident.severity
  };
}

async function getAll(req, res, next) {
  try {
    const { status, severity, page, limit, search } = req.query;

    const result = await incidentModel.findAll({ status, severity, search, page, limit });

    res.json({
      ...result,
      data: result.data.map(mapIncidentForResponse)
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const incident = await incidentModel.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ status: 404, message: 'Инцидент не найден' });
    }

    res.json(mapIncidentForResponse(incident));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({ status: 403, message: 'Недостаточно прав' });
    }

    const { address, house, floor, apartment, threattype, severity, status, responsible, description } = req.body;

    if (!address || !house || floor === undefined || floor === null || !threattype || !severity || !status || !responsible) {
      return res.status(422).json({ status: 422, message: 'Заполните все обязательные поля' });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(422).json({ status: 422, message: 'Недопустимый статус' });
    }

    if (!ALLOWED_SEVERITIES.includes(severity)) {
      return res.status(422).json({ status: 422, message: 'Недопустимый уровень угрозы' });
    }

    if (!Number.isInteger(Number(floor)) || Number(floor) < 1) {
      return res.status(422).json({ status: 422, message: 'Этаж должен быть положительным числом' });
    }

    const geo = await geocodeAddress(address, house);

    const incident = await incidentModel.create({
      address: String(address).trim(),
      house: String(house).trim(),
      floor: Number(floor),
      apartment: apartment ? String(apartment).trim() : null,
      threattype: String(threattype).trim(),
      severity,
      status,
      responsible: String(responsible).trim(),
      description: description ? String(description).trim() : '',
      latitude: geo.found ? geo.latitude : null,
      longitude: geo.found ? geo.longitude : null,
      geocodingstatus: geo.found ? 'success' : 'not_found',
      geocodingmessage: geo.message,
      createdby: req.user.id
    });

    await incidentModel.addLog({
      incidentid: incident.id,
      userid: req.user.id,
      action: 'Создан инцидент'
    });

    auditModel.log({
      userId: req.user.id,
      action: 'CREATE_INCIDENT',
      objectType: 'incident',
      objectId: incident.id,
      details: { address, house, threattype },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(mapIncidentForResponse(incident));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const incident = await incidentModel.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ status: 404, message: 'Инцидент не найден' });
    }

    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({ status: 403, message: 'Недостаточно прав' });
    }

    const fields = {};

    if (req.user.role === 'dispatcher') {
      if (req.body.status !== undefined) {
        if (!ALLOWED_STATUSES.includes(req.body.status)) {
          return res.status(422).json({ status: 422, message: 'Недопустимый статус' });
        }
        fields.status = req.body.status;
      }
    }

    if (req.user.role === 'admin') {
      const editable = ['address', 'house', 'floor', 'apartment', 'threattype', 'severity', 'status', 'responsible', 'description'];

      for (const key of editable) {
        if (req.body[key] !== undefined) {
          fields[key] = req.body[key];
        }
      }

      if (fields.status !== undefined && !ALLOWED_STATUSES.includes(fields.status)) {
        return res.status(422).json({ status: 422, message: 'Недопустимый статус' });
      }

      if (fields.severity !== undefined && !ALLOWED_SEVERITIES.includes(fields.severity)) {
        return res.status(422).json({ status: 422, message: 'Недопустимый уровень угрозы' });
      }

      if (fields.floor !== undefined) {
        if (!Number.isInteger(Number(fields.floor)) || Number(fields.floor) < 1) {
          return res.status(422).json({ status: 422, message: 'Этаж должен быть положительным числом' });
        }
        fields.floor = Number(fields.floor);
      }

      if (fields.address !== undefined) fields.address = String(fields.address).trim();
      if (fields.house !== undefined) fields.house = String(fields.house).trim();
      if (fields.apartment !== undefined) fields.apartment = fields.apartment ? String(fields.apartment).trim() : null;
      if (fields.threattype !== undefined) fields.threattype = String(fields.threattype).trim();
      if (fields.responsible !== undefined) fields.responsible = String(fields.responsible).trim();
      if (fields.description !== undefined) fields.description = fields.description ? String(fields.description).trim() : '';

      const addressChanged = fields.address !== undefined || fields.house !== undefined;

      if (addressChanged) {
        const geo = await geocodeAddress(fields.address ?? incident.address, fields.house ?? incident.house);
        fields.latitude = geo.found ? geo.latitude : null;
        fields.longitude = geo.found ? geo.longitude : null;
        fields.geocodingstatus = geo.found ? 'success' : 'not_found';
        fields.geocodingmessage = geo.message;
      }
    }

    if (!Object.keys(fields).length) {
      return res.status(422).json({ status: 422, message: 'Нет данных для обновления' });
    }

    const updated = await incidentModel.update(req.params.id, fields);

    await incidentModel.addLog({
      incidentid: updated.id,
      userid: req.user.id,
      action: 'Обновлен инцидент'
    });

    auditModel.log({
      userId: req.user.id,
      action: 'UPDATE_INCIDENT',
      objectType: 'incident',
      objectId: req.params.id,
      details: fields,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(mapIncidentForResponse(updated));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 403, message: 'Недостаточно прав' });
    }

    const incident = await incidentModel.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ status: 404, message: 'Инцидент не найден' });
    }

    await incidentModel.remove(req.params.id);

    auditModel.log({
      userId: req.user.id,
      action: 'DELETE_INCIDENT',
      objectType: 'incident',
      objectId: req.params.id,
      details: { address: incident.address },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };