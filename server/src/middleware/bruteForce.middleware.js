const loginAttemptModel = require('../models/loginAttempt.model');
const auditModel = require('../models/auditLog.model');

async function checkLoginBruteForce(req, res, next) {
  try {
    const ip = req.ip;
    await loginAttemptModel.cleanupOld();

    const status = await loginAttemptModel.isBlocked(ip);

    if (status.blocked) {
      auditModel.log({
        userId: null,
        action: 'LOGIN_BLOCKED',
        objectType: 'auth',
        objectId: ip,
        details: { blockedUntil: status.blockedUntil },
        ipAddress: ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(429).json({
        status: 429,
        message: 'Слишком много неудачных попыток входа. Попробуйте позже.'
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { checkLoginBruteForce };