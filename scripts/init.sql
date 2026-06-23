-- scripts/init.sql

-- If it does not exist, enable the extension for UUIDs.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Creating the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  roles VARCHAR[] NOT NULL DEFAULT '{USER}',
  "dateOfRegistration" TIMESTAMP NOT NULL DEFAULT NOW(),
  "dateOfLastAccess" TIMESTAMP
);