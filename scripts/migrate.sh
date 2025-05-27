#!/bin/bash

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Error: supabase CLI is not installed"
  echo "Please install it by following the instructions at: https://supabase.com/docs/guides/cli"
  exit 1
fi

# Apply migrations
echo "Applying database migrations..."
supabase db reset

echo "Migrations applied successfully!" 