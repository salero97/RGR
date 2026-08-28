const sensorModel = require('../models/sensor.model');
const auditModel = require('../models/auditLog.model');

async function getAll(req, res, next) {
    try {
        const { building_id, status, search, page, limit } = req.query;
        const sensors = await sensorModel.findAll({ building_id, status, search, page, limit });
        res.json(sensors);
    } catch (err) { next(err); }
}

async function getOne(req, res, next) {
    try {
        const sensor = await sensorModel.findById(req.params.id);
        if (!sensor) return res.status(404).json({ status: 404, message: 'Датчик не найден' });
        res.json(sensor);
    } catch (err) { next(err); }
}

async function create(req, res, next) {
    try {
        const { building_id, type, location, status } = req.body;
        if (!building_id || !type) return res.status(422).json({ status: 422, message: 'Поля building_id и type обязательны' });
        const sensor = await sensorModel.create({ building_id, type, location, status });

        auditModel.log({
            userId: req.user.id,
            action: 'CREATE_SENSOR',
            objectType: 'sensor',
            objectId: sensor.id,
            details: { building_id: sensor.building_id, type: sensor.type, location: sensor.location },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json(sensor);
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const sensor = await sensorModel.findById(req.params.id);
        if (!sensor) return res.status(404).json({ status: 404, message: 'Датчик не найден' });
        const updated = await sensorModel.update(req.params.id, req.body);

        auditModel.log({
            userId: req.user.id,
            action: 'UPDATE_SENSOR',
            objectType: 'sensor',
            objectId: req.params.id,
            details: { before: sensor, after: updated },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json(updated);
    } catch (err) { next(err); }
}

async function remove(req, res, next) {
    try {
        const sensor = await sensorModel.findById(req.params.id);
        if (!sensor) return res.status(404).json({ status: 404, message: 'Датчик не найден' });
        await sensorModel.remove(req.params.id);

        auditModel.log({
            userId: req.user.id,
            action: 'DELETE_SENSOR',
            objectType: 'sensor',
            objectId: req.params.id,
            details: { building_id: sensor.building_id, type: sensor.type },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(204).send();
    } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };