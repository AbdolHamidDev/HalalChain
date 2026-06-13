-- Add nullable avatar_url column to users table
-- No DEFAULT clause, no UPDATE/backfill — existing rows will have NULL
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
