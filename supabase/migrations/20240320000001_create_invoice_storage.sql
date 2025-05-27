-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false);

-- Allow authenticated users to read their own invoices
CREATE POLICY "Users can read their own invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices'
  AND (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.invoices
      WHERE storage.objects.name = invoices.path
      AND invoices.user_id = auth.uid()
    )
  )
);

-- Allow admins to read all invoices
CREATE POLICY "Admins can read all invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

-- Allow admins to upload invoices
CREATE POLICY "Admins can upload invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
); 