CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS incidentlogs CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS refreshtokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS userrole CASCADE;
DROP TYPE IF EXISTS incidentseverity CASCADE;
DROP TYPE IF EXISTS incidentstatus CASCADE;
DROP TYPE IF EXISTS buildingstatus CASCADE;
DROP TYPE IF EXISTS buildingrisklevel CASCADE;

CREATE TYPE userrole AS ENUM ('admin', 'dispatcher', 'user');
CREATE TYPE incidentseverity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incidentstatus AS ENUM ('new', 'inprogress', 'resolved', 'falsealarm');
CREATE TYPE buildingstatus AS ENUM ('new', 'inprogress', 'resolved', 'falsealarm');
CREATE TYPE buildingrisklevel AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role userrole NOT NULL DEFAULT 'user',
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE buildings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  house VARCHAR(50),
  floors INTEGER,
  risklevel buildingrisklevel NOT NULL DEFAULT 'medium',
  status buildingstatus NOT NULL DEFAULT 'new',
  description TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  house VARCHAR(50) NOT NULL,
  floor INTEGER NOT NULL,
  apartment VARCHAR(50),
  threattype VARCHAR(255) NOT NULL,
  severity incidentseverity NOT NULL,
  status incidentstatus NOT NULL DEFAULT 'new',
  responsible VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geocodingstatus VARCHAR(20) NOT NULL DEFAULT 'pending',
  geocodingmessage TEXT,
  createdby UUID REFERENCES users(id) ON DELETE SET NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incidentlogs (
  id SERIAL PRIMARY KEY,
  incidentid INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  userid UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (username, email, password_hash, role, full_name)
VALUES ('admin', 'admin@example.com', '$2b$12$sgcyi12.sweQ/r3IYy/gFOuA3QSs.dk.bJSmxtJoeYx31opaYZ6sq', 'admin', 'Administrator');