const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

beforeEach(async () => {
    await pool.query('DELETE FROM login_attempts');
});

afterAll(async () => {
    await pool.end();
});

describe('Защита от брутфорса', () => {
    const email = `bruteforce_${Date.now()}@test.com`;
    const testIp = '127.0.0.1';

    beforeAll(async () => {
        await request(app)
            .post('/api/v1/auth/register')
            .set('X-Forwarded-For', testIp)
            .send({ email, password: 'password123', fullname: 'Brute Force User' });
    });

    it('блокирует IP после 3 неудачных попыток входа', async () => {
        for (let i = 0; i < 3; i++) {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .set('X-Forwarded-For', testIp)
                .send({ email, password: 'wrongpass' });
            expect(res.status).toBe(401);
        }

        const res = await request(app)
            .post('/api/v1/auth/login')
            .set('X-Forwarded-For', testIp)
            .send({ email, password: 'wrongpass' });
        expect(res.status).toBe(429);
        expect(res.body.message).toBe('Слишком много неудачных попыток входа. Попробуйте позже.');
    });

    afterAll(async () => {
        await pool.query('DELETE FROM login_attempts');
    });
});

describe('Хранение паролей', () => {
    it('пароль в БД хранится в виде bcrypt-хеша, а не в открытом виде', async () => {
        const email = `hashcheck_${Date.now()}@test.com`;
        const password = 'plainpassword123';

        const regRes = await request(app)
            .post('/api/v1/auth/register')
            .send({ email, password, fullname: 'Hash Check User' });
        expect(regRes.status).toBe(201);

        const result = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]);
        const hash = result.rows[0]?.password_hash;

        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
        expect(hash.startsWith('$2')).toBe(true);
    });
});

describe('Общие сообщения об ошибках при входе', () => {
    it('не раскрывает, какой именно параметр неверен', async () => {
        const email = `errormsg_${Date.now()}@test.com`;
        const password = 'realpassword123';

        await request(app).post('/api/v1/auth/register').send({ email, password, fullname: 'Error Message User' });

        const wrongPassword = await request(app).post('/api/v1/auth/login').send({ email, password: 'wrongone' });
        const wrongEmail = await request(app).post('/api/v1/auth/login').send({ email: 'doesnotexist@test.com', password });

        expect(wrongPassword.body.message).toBe(wrongEmail.body.message);
        expect(wrongPassword.body.stack).toBeUndefined();
    });
});

describe('Доступ без токена и без роли', () => {
    it('запрещает доступ к инцидентам без токена (401)', async () => {
        const res = await request(app).get('/api/v1/incidents');
        expect(res.status).toBe(401);
    });

    it('запрещает удаление инцидента пользователю с ролью user (403)', async () => {
        const email = `roleuser_${Date.now()}@test.com`;
        const password = 'password123';

        await request(app).post('/api/v1/auth/register').send({ email, password, fullname: 'Role User', role: 'user' });
        const login = await request(app).post('/api/v1/auth/login').send({ email, password });
        const token = login.body.accessToken;

        const res = await request(app)
            .delete('/api/v1/incidents/999999')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
    });
});

describe('Защита от SQL-инъекций и XSS', () => {
    let adminToken;

    beforeAll(async () => {
        const email = `secadmin_${Date.now()}@test.com`;
        const password = 'password123';
        await request(app).post('/api/v1/auth/register').send({ email, password, fullname: 'Security Admin', role: 'admin' });
        const login = await request(app).post('/api/v1/auth/login').send({ email, password });
        adminToken = login.body.accessToken;
    });

    it('безопасно обрабатывает SQL-инъекцию в параметре search', async () => {
        const res = await request(app)
            .get('/api/v1/incidents')
            .query({ search: "'; DROP TABLE incidents; --" })
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('сохраняет XSS-нагрузку как текст, не выполняя её', async () => {
        const xssPayload = '<script>alert(1)</script>';

        const res = await request(app)
            .post('/api/v1/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                address: xssPayload,
                house: '1',
                floor: 1,
                threattype: 'Пожар',
                severity: 'low',
                status: 'new',
                responsible: 'Тест'
            });

        expect(res.status).toBe(201);
        expect(res.body.address).toBe(xssPayload);
    });
});

describe('Формат ошибок сервера', () => {
    it('не раскрывает стек ошибок в production-подобном ответе', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({});
        expect(res.body.stack).toBeUndefined();
        expect(res.body.message).toBeDefined();
    });
});
