-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable: add status, lastLoginAt, and tokenVersion to users
ALTER TABLE "users"
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "last_login_at" TIMESTAMP(3),
  ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
