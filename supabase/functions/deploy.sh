#!/bin/bash

# Ensure Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy the send-email function
echo "Deploying send-email function..."
cd "$(dirname "$0")"
supabase functions deploy send-email --project-ref YOUR_PROJECT_REF

echo "Deployment complete!"
echo "You may need to update CORS policy in the Supabase dashboard:"
echo "1. Go to the Supabase Dashboard"
echo "2. Select your project"
echo "3. Go to Settings > API"
echo "4. Update CORS settings to allow your domain" 