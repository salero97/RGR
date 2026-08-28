const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

beforeEach(async () => {
    await pool.query('DELETE FROM login_attempts');
});

afterAll(async () => {
    await pool.end();
});

describe('POST /api/v1/auth/register', () => {
    it('возвращает 422 при отсутствии email', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({ password: '12345678', full_name: 'Test' });
        expect(res.status).toBe(422);
    });

    it('возвращает 422 при коротком пароле', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({ email: 'test@test.com', password: '123', full_name: 'Test' });
        expect(res.status).toBe(422);
    });
});

describe('POST /api/v1/auth/login', () => {
    it('возвращает 401 при несуществующем пользователе', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({ email: 'nonexistent@test.com', password: 'wrongpass' });
        expect(res.status).toBe(401);
    });

    it('возвращает 422 при отсутствии полей', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({});
        expect(res.status).toBe(422);
    });
});

describe('GET /api/v1/incidents без токена', () => {
    it('возвращает 401', async () => {
        const res = await request(app).get('/api/v1/incidents');
        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/v1/incidents/:id без токена', () => {
    it('возвращает 401', async () => {
        const res = await request(app).delete('/api/v1/incidents/1');
        expect(res.status).toBe(401);
    });
});

describe('Ограничение одновременных сессий', () => {
    const email = `session_${Date.now()}@test.com`;
    const password = 'password123';

    beforeAll(async () => {
        await request(app).post('/api/v1/auth/register').send({ email, password, fullname: 'Session Test User' });
    });

    it('после повторного логина старый refresh token перестаёт работать', async () => {
        const firstLogin = await request(app).post('/api/v1/auth/login').send({ email, password });
        expect(firstLogin.status).toBe(200);
        const firstCookie = firstLogin.headers['set-cookie'];

        const secondLogin = await request(app).post('/api/v1/auth/login').send({ email, password });
        expect(secondLogin.status).toBe(200);

        const refreshWithOldCookie = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', firstCookie);

        expect(refreshWithOldCookie.status).toBe(401);
    });
});