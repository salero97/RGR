# Архитектура приложения

## Общая схема

```mermaid
flowchart TB
    subgraph Client["Клиент (React + Vite)"]
        Pages["Страницы: Login, Incidents, Buildings, Sensors, Map, Profile, Users"]
        Hooks["Хуки: useInfiniteScroll, useAuth, useToast"]
        AxiosClient["Axios-клиент с интерцепторами (refresh, 401, 403, 429)"]
    end

    subgraph Server["Сервер (Node.js + Express)"]
        Routes["Роуты (auth, incidents, buildings, sensors, users)"]
        Middleware["Middleware: authenticateToken, authorizeRole, validateBody/Query, bruteForce, errorHandler"]
        Controllers["Контроллеры (бизнес-логика, роли, геокодирование)"]
        Models["Модели (SQL-запросы через pg)"]
    end

    subgraph DB["PostgreSQL"]
        Tables["users, buildings, incidents, incidentlogs, sensors, refresh_tokens, audit_logs, login_attempts"]
    end

    subgraph Security["Средства безопасности"]
        JWT["JWT access (15 мин) + refresh (7 дней, httpOnly cookie)"]
        Bcrypt["bcrypt хеширование паролей"]
        RBAC["Ролевая модель: admin/dispatcher/user"]
        BruteForce["Защита от брутфорса (3 попытки / 10 мин блокировка)"]
        AuditLog["Аудит всех действий в audit_logs"]
        Joi["Валидация Joi на всех эндпоинтах"]
    end

    Client -- HTTPS/REST --> Server
    Server -- SQL --> DB
    Security -.встроено во все слои.-> Client
    Security -.встроено во все слои.-> Server
    Security -.встроено во все слои.-> DB