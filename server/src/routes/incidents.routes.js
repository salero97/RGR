const router = require('express').Router();
const ctrl = require('../controllers/incidents.controller');
const exportCtrl = require('../controllers/export.controller');
const { authenticateToken } = require('../middleware/authenticate');
const { validateBody, validateQuery } = require('../middleware/validate.middleware');
const {
  incidentCreateSchema,
  incidentUpdateSchema,
  listQuerySchema,
  exportQuerySchema
} = require('../schemas/validationSchemas');

router.use(authenticateToken);

router.get('/export', validateQuery(exportQuerySchema), exportCtrl.exportIncidentsCsv);
router.get('/', validateQuery(listQuerySchema), ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', validateBody(incidentCreateSchema), ctrl.create);
router.put('/:id', validateBody(incidentUpdateSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;