const router = require('express').Router();
const ctrl = require('../controllers/audit.controller');
const { authenticateToken, authorizeRole } = require('../middleware/authenticate');

router.use(authenticateToken);
router.use(authorizeRole('admin'));

router.get('/', ctrl.getAuditLogs);

module.exports = router;
