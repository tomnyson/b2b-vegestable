-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer', 'driver')),
  company_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on role for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

-- Create trigger to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_profiles_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_modified_column();

-- Create RLS (Row Level Security) policies for profiles
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY profile_read_own 
ON profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Create policy for users to update their own profile
CREATE POLICY profile_update_own
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create policy for admins to read all profiles
CREATE POLICY profile_read_all
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create policy for admins to update all profiles
CREATE POLICY profile_update_all
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create admin user if not exists (for development)
INSERT INTO profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'System Admin', 'admin')
ON CONFLICT (id) DO NOTHING; 