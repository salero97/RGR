const router = require('express').Router();
const ctrl = require('../controllers/buildings.controller');
const exportCtrl = require('../controllers/export.controller');
const { authenticateToken } = require('../middleware/authenticate');
const { validateBody, validateQuery } = require('../middleware/validate.middleware');
const {
  buildingCreateSchema,
  buildingUpdateSchema,
  listQuerySchema,
  exportQuerySchema
} = require('../schemas/validationSchemas');

router.use(authenticateToken);

router.get('/export', validateQuery(exportQuerySchema), exportCtrl.exportBuildingsCsv);
router.get('/', validateQuery(listQuerySchema), ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', validateBody(buildingCreateSchema), ctrl.create);
router.put('/:id', validateBody(buildingUpdateSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;