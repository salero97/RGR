const auditModel = require('../models/auditLog.model');

async function getAuditLogs(req, res, next) {
  try {
    const { userId, action, dateFrom, dateTo, page, limit } = req.query;

    const filter = {
      userId: userId || undefined,
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50
    };

    const result = await auditModel.findAll(filter);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuditLogs };
