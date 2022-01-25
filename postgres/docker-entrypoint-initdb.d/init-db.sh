#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE TABLE IF NOT EXISTS github_user (
    id BIGSERIAL,
    login VARCHAR(50) NOT NULL,
    name VARCHAR(191),
    company VARCHAR(191),
    blog VARCHAR(191),
    email VARCHAR(191),
    location TEXT,
    bio TEXT,
    hireable BOOLEAN,
    UNIQUE(login)
  );

  CREATE TABLE IF NOT EXISTS programming_language (
    id BIGSERIAL,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL,
    UNIQUE(slug)
  );

  CREATE TABLE IF NOT EXISTS github_user_language (
    user_id BIGINT NOT NULL,
    language_id BIGINT NOT NULL,
    PRIMARY KEY(user_id, language_id)
  );
EOSQL
