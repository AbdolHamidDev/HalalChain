#!/bin/sh
set -e

echo "🚀 Starting HalalChain v2.0..."

# Wait for database to be ready (max 30 seconds)
echo "⏳ Waiting for database..."
for i in $(seq 1 30); do
  if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Database is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Database connection timeout"
    exit 1
  fi
  sleep 1
done

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration failed or no pending migrations"
}

# Seed v2.0 data (idempotent - safe to run multiple times)
echo "🌱 Seeding v2.0 data..."
npx prisma db seed --seed-file prisma/seed-v2.ts || {
  echo "⚠️  Seed failed or already seeded"
}

echo "✅ Initialization complete"
echo "🚀 Starting server..."

# Execute the main command (from CMD)
exec "$@"