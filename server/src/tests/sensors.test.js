const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

let adminToken;
let userToken;
let buildingId;
let sensorId;

beforeAll(async () => {
    const suffix = Date.now();

    const adminEmail = `sens_admin_${suffix}@test.com`;
    const userEmail = `sens_user_${suffix}@test.com`;
    const password = 'password123';

    await request(app).post('/api/v1/auth/register').send({ email: adminEmail, password, fullname: 'Sensor Admin', role: 'admin' });
    await request(app).post('/api/v1/auth/register').send({ email: userEmail, password, fullname: 'Sensor User', role: 'user' });

    adminToken = (await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password })).body.accessToken;
    userToken = (await request(app).post('/api/v1/auth/login').send({ email: userEmail, password })).body.accessToken;

    const buildingRes = await request(app)
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            name: 'Здание для датчиков',
            address: 'Улица датчиков',
            house: '1',
            floors: 4,
            risklevel: 'low',
            status: 'new'
        });

    buildingId = buildingRes.body.id;
});

afterAll(async () => {
    await pool.end();
});

describe('CRUD датчиков', () => {
    it('администратор может создать датчик', async () => {
        const res = await request(app)
            .post('/api/v1/sensors')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ building_id: buildingId, type: 'Дымовой', location: '1 этаж', status: 'active' });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        sensorId = res.body.id;
    });

    it('обычный пользователь не может создать датчик (403)', async () => {
        const res = await request(app)
            .post('/api/v1/sensors')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ building_id: buildingId, type: 'Дымовой' });

        expect(res.status).toBe(403);
    });

    it('валидация Joi отклоняет отсутствие обязательных полей (422)', async () => {
        const res = await request(app)
            .post('/api/v1/sensors')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ type: 'Дымовой' });

        expect(res.status).toBe(422);
    });

    it('любой аутентифицированный пользователь может просматривать список датчиков', async () => {
        const res = await request(app)
            .get('/api/v1/sensors')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
    });

    it('фильтрует датчики по building_id', async () => {
        const res = await request(app)
            .get('/api/v1/sensors')
            .query({ building_id: buildingId })
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.every(s => String(s.building_id) === String(buildingId))).toBe(true);
    });

    it('администратор может обновить датчик', async () => {
        const res = await request(app)
            .put(`/api/v1/sensors/${sensorId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'maintenance' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('maintenance');
    });

    it('обычный пользователь не может обновить датчик (403)', async () => {
        const res = await request(app)
            .put(`/api/v1/sensors/${sensorId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'active' });

        expect(res.status).toBe(403);
    });

    it('администратор может удалить датчик', async () => {
        const res = await request(app)
            .delete(`/api/v1/sensors/${sensorId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });

    it('удалённый датчик больше не найден (404)', async () => {
        const res = await request(app)
            .get(`/api/v1/sensors/${sensorId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });
});