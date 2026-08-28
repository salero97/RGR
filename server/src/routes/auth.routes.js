const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { checkLoginBruteForce } = require('../middleware/bruteForce.middleware');

router.post('/register', ctrl.register);
router.post('/login', checkLoginBruteForce, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

module.exports = router;