const userModel = require('../models/user.model');
const auditModel = require('../models/auditLog.model');

async function getAll(req, res, next) {
  try {
    const users = await userModel.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'Пользователь не найден'
      });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    const allowedRoles = ['admin', 'dispatcher', 'user'];

    if (!allowedRoles.includes(role)) {
      return res.status(422).json({
        status: 422,
        message: 'Недопустимая роль'
      });
    }

    const existingUser = await userModel.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({
        status: 404,
        message: 'Пользователь не найден'
      });
    }

    const updated = await userModel.updateRole(req.params.id, role);

    auditModel.log({
      userId: req.user.id,
      action: 'UPDATE_USER_ROLE',
      objectType: 'user',
      objectId: req.params.id,
      details: { oldRole: existingUser.role, newRole: role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (req.user.id === req.params.id) {
      return res.status(403).json({
        status: 403,
        message: 'Нельзя удалить самого себя'
      });
    }

    const existingUser = await userModel.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({
        status: 404,
        message: 'Пользователь не найден'
      });
    }

    await userModel.remove(req.params.id);

    auditModel.log({
      userId: req.user.id,
      action: 'DELETE_USER',
      objectType: 'user',
      objectId: req.params.id,
      details: { deletedUser: existingUser.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getMe,
  updateRole,
  remove
};