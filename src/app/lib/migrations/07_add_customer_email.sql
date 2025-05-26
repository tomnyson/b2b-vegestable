-- Add customer_email column to orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255);
    END IF;
END $$; 