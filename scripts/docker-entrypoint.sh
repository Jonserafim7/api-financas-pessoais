#!/bin/sh

set -e

echo "🔄 Waiting for database to be ready..."

# Wait for PostgreSQL to be ready
until npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up - executing migrations"

# Run Prisma migrations
npx prisma migrate deploy

echo "🚀 Starting application..."

# Execute the CMD passed to docker
exec "$@"
