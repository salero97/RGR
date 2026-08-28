const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const tokenModel = require('../models/token.model');
const auditModel = require('../models/auditLog.model');
const loginAttemptModel = require('../models/loginAttempt.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens');
const { registerSchema, loginSchema } = require('../schemas/validationSchemas');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(422).json({
        status: 422,
        message: error.details.map((d) => d.message).join('; ')
      });
    }

    const { email, password, role } = value;
    const name = value.fullname || value.full_name;

    const existing = await userModel.findByEmail(email);

    if (existing) {
      return res.status(409).json({
        status: 409,
        message: 'Пользователь с таким email уже существует'
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await userModel.createUser(email, password_hash, role, name);

    auditModel.log({
      userId: user.id,
      action: 'REGISTER_SUCCESS',
      objectType: 'user',
      objectId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(422).json({
        status: 422,
        message: 'Email и пароль обязательны для заполнения'
      });
    }

    const { email, password } = value;
    const ip = req.ip;

    const user = await userModel.findByEmail(email);

    if (!user || !user.password_hash) {
      await loginAttemptModel.registerFailure(ip);
      auditModel.log({
        userId: null,
        action: 'LOGIN_FAILED',
        objectType: 'user',
        objectId: email,
        details: { reason: 'invalid_credentials' },
        ipAddress: ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({
        status: 401,
        message: 'Неверный email или пароль'
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      await loginAttemptModel.registerFailure(ip);
      auditModel.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        objectType: 'user',
        objectId: user.id,
        details: { reason: 'invalid_credentials' },
        ipAddress: ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({
        status: 401,
        message: 'Неверный email или пароль'
      });
    }

    await loginAttemptModel.registerSuccess(ip);
    await tokenModel.revokeAllUserTokens(user.id);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await tokenModel.saveRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    auditModel.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      objectType: 'user',
      objectId: user.id,
      details: { email: user.email },
      ipAddress: ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: 'Refresh token отсутствует'
      });
    }

    const record = await tokenModel.findRefreshToken(token);

    if (!record) {
      return res.status(401).json({
        status: 401,
        message: 'Refresh token недействителен'
      });
    }

    await tokenModel.revokeRefreshToken(token);

    const user = await userModel.findById(record.userId);

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: 'Пользователь не найден'
      });
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await tokenModel.saveRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      expiresAt
    });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    res.json({
      accessToken: newAccessToken
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      const record = await tokenModel.findRefreshToken(token);
      await tokenModel.revokeRefreshToken(token);

      auditModel.log({
        userId: record ? record.userId : null,
        action: 'LOGOUT_SUCCESS',
        objectType: 'user',
        objectId: record ? record.userId : null,
        details: {},
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout
};