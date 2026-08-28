const buildingModel = require('../models/building.model');
const { geocodeAddress } = require('../utils/geocode');
const auditModel = require('../models/auditLog.model');

const ALLOWED_STATUSES = ['new', 'inprogress', 'resolved', 'falsealarm'];
const ALLOWED_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

function mapBuildingForResponse(building) {
  if (!building) return building;

  return {
    ...building,
    statusLabel:
      building.status === 'new' ? 'Новый'
        : building.status === 'inprogress' ? 'В работе'
        : building.status === 'resolved' ? 'Закрытый'
        : building.status === 'falsealarm' ? 'Ложный'
        : building.status,
    riskLevelLabel:
      building.risklevel === 'low' ? 'Низкий'
        : building.risklevel === 'medium' ? 'Средний'
        : building.risklevel === 'high' ? 'Высокий'
        : building.risklevel === 'critical' ? 'Критический'
        : building.risklevel
  };
}

async function getAll(req, res, next) {
  try {
    const { search, page, limit } = req.query;

    if (!page && !limit && !search) {
      const buildings = await buildingModel.findAll();
      return res.json(buildings.map(mapBuildingForResponse));
    }

    const result = await buildingModel.findAllQuery({ search, page, limit });
    res.json({
      ...result,
      data: result.data.map(mapBuildingForResponse)
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const building = await buildingModel.findById(req.params.id);

    if (!building) {
      return res.status(404).json({ status: 404, message: 'Объект не найден' });
    }

    res.json(mapBuildingForResponse(building));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({ status: 403, message: 'Недостаточно прав' });
    }

    const { name, address, house, floors, risklevel, status, description } = req.body;

    if (!name || !address || !house || floors === undefined || floors === null || !risklevel || !status) {
      return res.status(422).json({ status: 422, message: 'Заполните все обязательные поля' });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(422).json({ status: 422, message: 'Недопустимый статус' });
    }

    if (!ALLOWED_RISK_LEVELS.includes(risklevel)) {
      return res.status(422).json({ status: 422, message: 'Недопустимый уровень угрозы' });
    }

    if (!Number.isInteger(Number(floors)) || Number(floors) < 1) {
      return res.status(422).json({ status: 422, message: 'Количество этажей должно быть положительным числом' });
    }

    const geo = await geocodeAddress(address, house);

    const building = await buildingModel.create({
      name: String(name).trim(),
      address: String(address).trim(),
      house: String(house).trim(),
      floors: Number(floors),
      risklevel,
      status,
      description: description ? String(description).trim() : '',
      latitude: geo.found ? geo.latitude : null,
      longitude: geo.found ? geo.longitude : null
    });

    auditModel.log({
      userId: req.user.id,
      action: 'CREATE_BUILDING',
      objectType: 'building',
      objectId: building.id,
      details: { name, address, house },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(mapBuildingForResponse(building));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const building = await buildingModel.findById(req.params.id);

    if (!building) {
      return res.status(404).json({ status: 404, message: 'Объект не найден' });
    }

    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({ status: 403, message: 'Недостаточно прав' });
    }

    const fields = {};

    if (req.user.role === 'admin') {
      const editable = ['name', 'address', 'house', 'floors', 'risklevel', 'status', 'description'];
      for (const key of editable) {
        if (req.body[key] !== undefined) fields[key] = req.body[key];
      }
    }

    if (req.user.role === 'dispatcher') {
      const editable = ['name', 'floors', 'status', 'description'];
      for (const key of editable) {
        if (req.body[key] !== undefined) fields[key] = req.body[key];
      }
    }

    if (fields.status !== undefined && !ALLOWED_STATUSES.includes(fields.status)) {
      return res.status(422).json({ status: 422, message: 'Недопустимый статус' });
    }

    if (fields.risklevel !== undefined && !ALLOWED_RISK_LEVELS.includes(fields.risklevel)) {
      return res.status(422).json({ status: 422, message: 'Недопустимый уровень угрозы' });
    }

    if (fields.floors !== undefined) {
      if (!Number.isInteger(Number(fields.floors)) || Number(fields.floors) < 1) {
        return res.status(422).json({ status: 422, message: 'Количество этажей должно быть положительным числом' });
      }
      fields.floors = Number(fields.floors);
    }

    if (fields.name !== undefined) fields.name = String(fields.name).trim();
    if (fields.address !== undefined) fields.address = String(fields.address).trim();
    if (fields.house !== undefined) fields.house = String(fields.house).trim();
    if (fields.description !== undefined) fields.description = fields.description ? String(fields.description).trim() : '';

    const addressChanged = fields.address !== undefined || fields.house !== undefined;

    if (addressChanged) {
      const geo = await geocodeAddress(fields.address ?? building.address, fields.house ?? building.house);
      fields.latitude = geo.found ? geo.latitude : null;
      fields.longitude = geo.found ? geo.longitude : null;
    }

    if (!Object.keys(fields).length) {
      return res.status(422).json({ status: 422, message: 'Нет данных для обновления' });
    }

    const updated = await buildingModel.update(req.params.id, fields);

    auditModel.log({
      userId: req.user.id,
      action: 'UPDATE_BUILDING',
      objectType: 'building',
      objectId: req.params.id,
      details: fields,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(mapBuildingForResponse(updated));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 403, message: 'Недостаточно прав' });
    }

    const building = await buildingModel.findById(req.params.id);

    if (!building) {
      return res.status(404).json({ status: 404, message: 'Объект не найден' });
    }

    await buildingModel.remove(req.params.id);

    auditModel.log({
      userId: req.user.id,
      action: 'DELETE_BUILDING',
      objectType: 'building',
      objectId: req.params.id,
      details: { name: building.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };