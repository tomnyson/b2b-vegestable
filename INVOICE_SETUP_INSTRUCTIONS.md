# Invoice Feature Setup Instructions

This guide helps you set up the invoice management feature in your existing Supabase project.

## Prerequisites

1. Access to your Supabase dashboard
2. SQL Editor access in your Supabase project
3. Existing authentication system

## Database Setup

### Step 1: Run the Invoice Table Migration

In your Supabase SQL Editor, run the following SQL to create the invoices table:

```sql
-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  path TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint if users table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update invoices" ON public.invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete invoices" ON public.invoices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 2: Create Storage Bucket

Run this SQL to create the invoices storage bucket:

```sql
-- Create the invoices bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Admin can upload invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can view all invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admin can delete invoices" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 3: Verify Users Table (Optional)

If you don't have a `users` table in the `public` schema, you can create one with this SQL:

```sql
-- Create users table in public schema (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'customer',
      newsletter_subscribed BOOLEAN DEFAULT false,
      notifications JSONB DEFAULT '{"orderUpdates": true, "promotions": false, "newProducts": false}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policies
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admin can view all users" ON public.users
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END
$$;
```

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

1. Create an admin user by updating a user's role in the `users` table:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

2. Access the invoice page at `/dashboard/invoices` (admin only)

3. Try uploading a PDF invoice

4. Check the customer view at `/profile?tab=invoices`

## Troubleshooting

### Common Issues

1. **Foreign Key Error**: If you get foreign key constraint errors, it means the `users` table doesn't exist or has a different structure. Run the users table creation SQL above.

2. **Permission Denied**: Make sure RLS policies are correctly set up and your user has the proper role.

3. **Storage Upload Fails**: Verify the storage bucket was created and policies are in place.

4. **Download Fails**: Check that the storage policies allow the user to access their files.

### Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'invoices');

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'invoices';

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'invoices');
```

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check the Supabase logs in your dashboard
3. Verify that all SQL statements ran successfully
4. Make sure your user has the correct role assigned

The invoice feature should now be fully functional in your application! 