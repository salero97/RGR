const Joi = require('joi');

const ALLOWED_STATUSES = ['new', 'inprogress', 'resolved', 'falsealarm'];
const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ALLOWED_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const ALLOWED_ROLES = ['admin', 'dispatcher', 'user'];
const ALLOWED_SENSOR_STATUSES = ['active', 'inactive', 'maintenance'];
const FULL_NAME_PATTERN = /^[A-Za-zА-Яа-яЁё]+(?:[\s-][A-Za-zА-Яа-яЁё]+)+$/;

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullname: Joi.string().trim().pattern(FULL_NAME_PATTERN).required().messages({
    'string.pattern.base': 'ФИО должно содержать минимум два слова и не может включать цифры'
  }),
  full_name: Joi.string().trim().pattern(FULL_NAME_PATTERN).messages({
    'string.pattern.base': 'ФИО должно содержать минимум два слова и не может включать цифры'
  }),
  role: Joi.string().valid(...ALLOWED_ROLES).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const incidentCreateSchema = Joi.object({
  address: Joi.string().trim().min(1).required(),
  house: Joi.string().trim().min(1).required(),
  floor: Joi.number().integer().min(1).required(),
  apartment: Joi.string().trim().allow('', null),
  threattype: Joi.string().trim().min(1).required(),
  severity: Joi.string().valid(...ALLOWED_SEVERITIES).required(),
  status: Joi.string().valid(...ALLOWED_STATUSES).required(),
  responsible: Joi.string().trim().min(1).required(),
  description: Joi.string().allow('', null)
});

const incidentUpdateSchema = Joi.object({
  address: Joi.string().trim().min(1),
  house: Joi.string().trim().min(1),
  floor: Joi.number().integer().min(1),
  apartment: Joi.string().trim().allow('', null),
  threattype: Joi.string().trim().min(1),
  severity: Joi.string().valid(...ALLOWED_SEVERITIES),
  status: Joi.string().valid(...ALLOWED_STATUSES),
  responsible: Joi.string().trim().min(1),
  description: Joi.string().allow('', null)
}).min(1);

const buildingCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  address: Joi.string().trim().min(1).required(),
  house: Joi.string().trim().min(1).required(),
  floors: Joi.number().integer().min(1).required(),
  risklevel: Joi.string().valid(...ALLOWED_RISK_LEVELS).required(),
  status: Joi.string().valid(...ALLOWED_STATUSES).required(),
  description: Joi.string().allow('', null)
});

const buildingUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1),
  address: Joi.string().trim().min(1),
  house: Joi.string().trim().min(1),
  floors: Joi.number().integer().min(1),
  risklevel: Joi.string().valid(...ALLOWED_RISK_LEVELS),
  status: Joi.string().valid(...ALLOWED_STATUSES),
  description: Joi.string().allow('', null)
}).min(1);

const sensorCreateSchema = Joi.object({
  building_id: Joi.number().integer().required(),
  type: Joi.string().trim().min(1).required(),
  location: Joi.string().trim().allow('', null),
  status: Joi.string().valid(...ALLOWED_SENSOR_STATUSES).optional(),
  floor: Joi.number().integer().min(1).allow(null).optional()
});

const sensorUpdateSchema = Joi.object({
  type: Joi.string().trim().min(1),
  location: Joi.string().trim().allow('', null),
  status: Joi.string().valid(...ALLOWED_SENSOR_STATUSES),
  floor: Joi.number().integer().min(1).allow(null)
}).min(1);

const userRoleUpdateSchema = Joi.object({
  role: Joi.string().valid(...ALLOWED_ROLES).required()
});

const listQuerySchema = Joi.object({
  status: Joi.string().valid(...ALLOWED_STATUSES).optional(),
  severity: Joi.string().valid(...ALLOWED_SEVERITIES).optional(),
  search: Joi.string().trim().max(200).allow('').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100000).optional(),
  building_id: Joi.alternatives(Joi.number().integer(), Joi.string()).optional()
}).unknown(true);

const sensorListQuerySchema = Joi.object({
  building_id: Joi.alternatives(Joi.number().integer(), Joi.string()).optional(),
  status: Joi.string().valid(...ALLOWED_SENSOR_STATUSES).optional(),
  search: Joi.string().trim().max(200).allow('').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100000).optional()
}).unknown(true);

const exportQuerySchema = Joi.object({
  format: Joi.string().valid('csv').optional(),
  status: Joi.string().valid(...ALLOWED_STATUSES).optional(),
  severity: Joi.string().valid(...ALLOWED_SEVERITIES).optional(),
  search: Joi.string().trim().max(200).allow('').optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  incidentCreateSchema,
  incidentUpdateSchema,
  buildingCreateSchema,
  buildingUpdateSchema,
  sensorCreateSchema,
  sensorUpdateSchema,
  userRoleUpdateSchema,
  listQuerySchema,
  sensorListQuerySchema,
  exportQuerySchema
};
