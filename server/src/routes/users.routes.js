const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const { authenticateToken, authorizeRole } = require('../middleware/authenticate');

router.use(authenticateToken);

router.get('/', authorizeRole('admin'), ctrl.getAll);
router.get('/me', ctrl.getMe);
router.patch('/:id/role', authorizeRole('admin'), ctrl.updateRole);
router.delete('/:id', authorizeRole('admin'), ctrl.remove);

module.exports = router;