-- Migration: 0005_firebase_auth
-- Reemplaza autenticación NextAuth/bcrypt por Firebase Auth.
-- Elimina password_hash, agrega firebase_uid como vínculo con Firebase Auth.

ALTER TABLE "users" ADD COLUMN "firebase_uid" varchar(128) UNIQUE;
ALTER TABLE "users" DROP COLUMN "password_hash";
