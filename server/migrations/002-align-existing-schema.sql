DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'role'
  ) THEN
    UPDATE users
    SET role = 'dispatcher'
    WHERE role::text = 'inspector';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'userrole'
  ) THEN
    ALTER TYPE userrole RENAME TO userrole_old;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'userrole'
  ) THEN
    CREATE TYPE userrole AS ENUM ('admin', 'dispatcher', 'user');
  END IF;
END $$;

ALTER TABLE users
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE users
  ALTER COLUMN role TYPE userrole
  USING (
    CASE
      WHEN role::text = 'inspector' THEN 'dispatcher'::userrole
      WHEN role::text = 'admin' THEN 'admin'::userrole
      WHEN role::text = 'dispatcher' THEN 'dispatcher'::userrole
      ELSE 'user'::userrole
    END
  );

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'dispatcher';

DROP TYPE IF EXISTS userrole_old;