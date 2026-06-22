#!/bin/sh
set -e

echo "🚀 Starting HalalChain v2.0..."

# Run database migrations (will retry if DB not ready)
echo "🔄 Running database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration failed, retrying in 5s..."
  sleep 5
  npx prisma migrate deploy || {
    echo "❌ Migration failed after retry, continuing anyway..."
  }
}

# Seed v2.0 data (idempotent - safe to run multiple times)
echo "🌱 Seeding v2.0 data..."
npx prisma db seed --seed-file prisma/seed-v2.ts || {
  echo "⚠️  Seed failed or already seeded, continuing..."
}

echo "✅ Initialization complete"
echo "🚀 Starting server..."

# Execute the main command (from CMD)
exec "$@"
