-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  vehicle_type VARCHAR(100),
  license_number VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  current_location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Policy for admins to have full access
CREATE POLICY "Admins have full access to drivers" 
  ON public.drivers 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Policy for drivers to view and edit their own data
CREATE POLICY "Drivers can view and edit their own data" 
  ON public.drivers 
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add index for user_id
CREATE INDEX idx_drivers_user_id ON public.drivers(user_id); 