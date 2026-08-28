const router = require('express').Router();
const ctrl = require('../controllers/sensors.controller');
const { authenticateToken, authorizeRole } = require('../middleware/authenticate');
const { validateBody, validateQuery } = require('../middleware/validate.middleware');
const {
  sensorCreateSchema,
  sensorUpdateSchema,
  sensorListQuerySchema
} = require('../schemas/validationSchemas');

router.use(authenticateToken);

router.get('/', validateQuery(sensorListQuerySchema), ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authorizeRole('admin'), validateBody(sensorCreateSchema), ctrl.create);
router.put('/:id', authorizeRole('admin'), validateBody(sensorUpdateSchema), ctrl.update);
router.delete('/:id', authorizeRole('admin'), ctrl.remove);
router.post('/:id/simulate', authorizeRole('admin', 'dispatcher'), ctrl.simulate);

module.exports = router;
