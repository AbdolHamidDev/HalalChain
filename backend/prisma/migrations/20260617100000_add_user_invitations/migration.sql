-- CreateTable: user invitations
CREATE TABLE "user_invitations" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "email"      TEXT        NOT NULL,
  "role"       "UserRole"  NOT NULL DEFAULT 'STAFF',
  "token"      TEXT        NOT NULL,
  "invited_by" UUID        NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_invitations_token_key" ON "user_invitations"("token");
CREATE INDEX "user_invitations_email_idx" ON "user_invitations"("email");
