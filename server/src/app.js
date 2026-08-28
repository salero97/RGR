require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incidents.routes');
const buildingRoutes = require('./routes/buildings.routes');
const sensorRoutes = require('./routes/sensors.routes');
const userRoutes = require('./routes/users.routes');
const auditRoutes = require('./routes/audit.routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://217.71.129.139:4735',
  'https://217.71.129.139:4768'
];

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"]
      }
    }
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

try {
  const swaggerDoc = YAML.load('./src/swagger.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  logger.info('Swagger UI доступен по адресу /api-docs');
} catch (e) {
  logger.error('Ошибка подключения Swagger UI: ' + e.message);
}

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/buildings', buildingRoutes);
app.use('/api/v1/sensors', sensorRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit', auditRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('Server is listening on port ' + PORT);
  });
}

module.exports = app;
