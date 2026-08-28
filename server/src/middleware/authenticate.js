const { verifyAccessToken } = require('../utils/tokens');
const auditModel = require('../models/auditLog.model');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    auditModel.log({
      userId: null,
      action: 'AUTH_FAILED',
      objectType: 'route',
      objectId: req.originalUrl,
      details: { reason: 'no_token' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      status: 401,
      message: 'Требуется авторизация'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    auditModel.log({
      userId: null,
      action: 'AUTH_FAILED',
      objectType: 'route',
      objectId: req.originalUrl,
      details: { reason: 'empty_token' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      status: 401,
      message: 'Требуется авторизация'
    });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    auditModel.log({
      userId: null,
      action: 'AUTH_FAILED',
      objectType: 'route',
      objectId: req.originalUrl,
      details: { reason: 'invalid_or_expired_token' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      status: 401,
      message: 'Недействительный или истёкший токен'
    });
  }
}

function authorizeRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      auditModel.log({
        userId: req.user ? req.user.id : null,
        action: 'ACCESS_DENIED',
        objectType: 'route',
        objectId: req.originalUrl,
        details: { requiredRoles: roles, actualRole: req.user ? req.user.role : null },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(403).json({
        status: 403,
        message: 'Недостаточно прав'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRole
};