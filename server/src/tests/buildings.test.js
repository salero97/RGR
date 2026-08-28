const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

let adminToken;
let dispatcherToken;
let userToken;
let createdBuildingId;

beforeAll(async () => {
    const suffix = Date.now();

    const adminEmail = `bld_admin_${suffix}@test.com`;
    const dispatcherEmail = `bld_dispatcher_${suffix}@test.com`;
    const userEmail = `bld_user_${suffix}@test.com`;
    const password = 'password123';

    await request(app).post('/api/v1/auth/register').send({ email: adminEmail, password, fullname: 'Building Admin', role: 'admin' });
    await request(app).post('/api/v1/auth/register').send({ email: dispatcherEmail, password, fullname: 'Building Dispatcher', role: 'dispatcher' });
    await request(app).post('/api/v1/auth/register').send({ email: userEmail, password, fullname: 'Building User', role: 'user' });

    adminToken = (await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password })).body.accessToken;
    dispatcherToken = (await request(app).post('/api/v1/auth/login').send({ email: dispatcherEmail, password })).body.accessToken;
    userToken = (await request(app).post('/api/v1/auth/login').send({ email: userEmail, password })).body.accessToken;
});

afterAll(async () => {
    await pool.end();
});

describe('CRUD зданий', () => {
    it('создание здания администратором проходит успешно', async () => {
        const res = await request(app)
            .post('/api/v1/buildings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Тестовое здание ABC',
                address: 'Тестовый проспект',
                house: '5',
                floors: 9,
                risklevel: 'medium',
                status: 'new'
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        createdBuildingId = res.body.id;
    });

    it('обычный пользователь не может создать здание (403)', async () => {
        const res = await request(app)
            .post('/api/v1/buildings')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Здание User',
                address: 'Улица',
                house: '1',
                floors: 3,
                risklevel: 'low',
                status: 'new'
            });

        expect(res.status).toBe(403);
    });

    it('валидация Joi отклоняет отсутствие обязательных полей (422)', async () => {
        const res = await request(app)
            .post('/api/v1/buildings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Неполное здание' });

        expect(res.status).toBe(422);
    });

    it('просмотр здания по id доступен всем ролям', async () => {
        const res = await request(app)
            .get(`/api/v1/buildings/${createdBuildingId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createdBuildingId);
    });

    it('диспетчер может изменить только неключевые поля', async () => {
        const res = await request(app)
            .put(`/api/v1/buildings/${createdBuildingId}`)
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({ status: 'inprogress', floors: 10 });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('inprogress');
        expect(res.body.floors).toBe(10);
    });

    it('диспетчер не может удалить здание (403)', async () => {
        const res = await request(app)
            .delete(`/api/v1/buildings/${createdBuildingId}`)
            .set('Authorization', `Bearer ${dispatcherToken}`);

        expect(res.status).toBe(403);
    });

    it('администратор может удалить здание', async () => {
        const res = await request(app)
            .delete(`/api/v1/buildings/${createdBuildingId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });
});

describe('Поиск, пагинация и экспорт зданий', () => {
    beforeAll(async () => {
        await request(app)
            .post('/api/v1/buildings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Уникальное здание QWERTY',
                address: 'Особый адрес',
                house: '77',
                floors: 5,
                risklevel: 'high',
                status: 'new'
            });
    });

    it('возвращает обычный массив без параметров (обратная совместимость)', async () => {
        const res = await request(app)
            .get('/api/v1/buildings')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('возвращает пагинированный ответ при указании page', async () => {
        const res = await request(app)
            .get('/api/v1/buildings')
            .query({ page: 1, limit: 5 })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeDefined();
        expect(res.body.meta).toBeDefined();
    });

    it('находит здание по поисковому запросу', async () => {
        const res = await request(app)
            .get('/api/v1/buildings')
            .query({ search: 'QWERTY' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.some(b => b.name.includes('QWERTY'))).toBe(true);
    });

    it('экспортирует здания в CSV', async () => {
        const res = await request(app)
            .get('/api/v1/buildings/export')
            .query({ format: 'csv' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
    });
});