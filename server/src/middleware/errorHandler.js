const logger = require('../config/logger');
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
    const status = err.status || 500;
    if (status >= 500) {
        logger.error({ message: err.message, stack: err.stack, url: req.url });
    }
    const response = { status, message: err.message || 'Внутренняя ошибка сервера' };
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    res.status(status).json(response);
}

module.exports = errorHandler;
