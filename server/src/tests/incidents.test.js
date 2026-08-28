const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

let adminToken;
let dispatcherToken;
let userToken;
let createdIncidentId;

beforeAll(async () => {
    const suffix = Date.now();

    const adminEmail = `inc_admin_${suffix}@test.com`;
    const dispatcherEmail = `inc_dispatcher_${suffix}@test.com`;
    const userEmail = `inc_user_${suffix}@test.com`;
    const password = 'password123';

    await request(app).post('/api/v1/auth/register').send({ email: adminEmail, password, fullname: 'Incident Admin', role: 'admin' });
    await request(app).post('/api/v1/auth/register').send({ email: dispatcherEmail, password, fullname: 'Incident Dispatcher', role: 'dispatcher' });
    await request(app).post('/api/v1/auth/register').send({ email: userEmail, password, fullname: 'Incident User', role: 'user' });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password });
    const dispatcherLogin = await request(app).post('/api/v1/auth/login').send({ email: dispatcherEmail, password });
    const userLogin = await request(app).post('/api/v1/auth/login').send({ email: userEmail, password });

    adminToken = adminLogin.body.accessToken;
    dispatcherToken = dispatcherLogin.body.accessToken;
    userToken = userLogin.body.accessToken;
});

afterAll(async () => {
    await pool.end();
});

describe('CRUD инцидентов', () => {
    it('создание инцидента диспетчером проходит успешно', async () => {
        const res = await request(app)
            .post('/api/v1/incidents')
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({
                address: 'Тестовая улица',
                house: '10',
                floor: 2,
                threattype: 'Пожар',
                severity: 'high',
                status: 'new',
                responsible: 'Иванов И.И.'
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        createdIncidentId = res.body.id;
    });

    it('обычный пользователь не может создать инцидент (403)', async () => {
        const res = await request(app)
            .post('/api/v1/incidents')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                address: 'Тестовая улица',
                house: '11',
                floor: 1,
                threattype: 'Пожар',
                severity: 'low',
                status: 'new',
                responsible: 'Тест'
            });

        expect(res.status).toBe(403);
    });

    it('валидация Joi отклоняет некорректный этаж (422)', async () => {
        const res = await request(app)
            .post('/api/v1/incidents')
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({
                address: 'Тестовая улица',
                house: '12',
                floor: 0,
                threattype: 'Пожар',
                severity: 'low',
                status: 'new',
                responsible: 'Тест'
            });

        expect(res.status).toBe(422);
    });

    it('просмотр созданного инцидента по id', async () => {
        const res = await request(app)
            .get(`/api/v1/incidents/${createdIncidentId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createdIncidentId);
    });

    it('обновление статуса диспетчером проходит успешно', async () => {
        const res = await request(app)
            .put(`/api/v1/incidents/${createdIncidentId}`)
            .set('Authorization', `Bearer ${dispatcherToken}`)
            .send({ status: 'inprogress' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('inprogress');
    });

    it('обычный пользователь не может обновить инцидент (403)', async () => {
        const res = await request(app)
            .put(`/api/v1/incidents/${createdIncidentId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'resolved' });

        expect(res.status).toBe(403);
    });

    it('диспетчер не может удалить инцидент (403)', async () => {
        const res = await request(app)
            .delete(`/api/v1/incidents/${createdIncidentId}`)
            .set('Authorization', `Bearer ${dispatcherToken}`);

        expect(res.status).toBe(403);
    });

    it('администратор может удалить инцидент', async () => {
        const res = await request(app)
            .delete(`/api/v1/incidents/${createdIncidentId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(204);
    });

    it('удалённый инцидент больше не найден (404)', async () => {
        const res = await request(app)
            .get(`/api/v1/incidents/${createdIncidentId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });
});

describe('Фильтрация, поиск и экспорт инцидентов', () => {
    beforeAll(async () => {
        await request(app)
            .post('/api/v1/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                address: 'Уникальный адрес для поиска XYZ',
                house: '99',
                floor: 3,
                threattype: 'Задымление',
                severity: 'critical',
                status: 'new',
                responsible: 'Петров П.П.'
            });
    });

    it('фильтрует по статусу', async () => {
        const res = await request(app)
            .get('/api/v1/incidents')
            .query({ status: 'new' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.every(i => i.status === 'new')).toBe(true);
    });

    it('находит инцидент по поисковому запросу', async () => {
        const res = await request(app)
            .get('/api/v1/incidents')
            .query({ search: 'XYZ' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.some(i => i.address.includes('XYZ'))).toBe(true);
    });

    it('отклоняет некорректный статус в query (422)', async () => {
        const res = await request(app)
            .get('/api/v1/incidents')
            .query({ status: 'not_a_real_status' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(422);
    });

    it('экспортирует инциденты в CSV', async () => {
        const res = await request(app)
            .get('/api/v1/incidents/export')
            .query({ format: 'csv' })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
        expect(res.text).toContain('id,address,house');
    });
});