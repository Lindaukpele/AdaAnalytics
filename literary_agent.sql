DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  agency TEXT,
  location TEXT,
  genres TEXT,
  website TEXT UNIQUE
);