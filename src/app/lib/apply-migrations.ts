import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

// Function to execute an SQL file
async function executeSqlFile(filePath: string): Promise<void> {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Use Supabase's rpc to execute raw SQL
    const { error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error(`Error executing ${filePath}:`, error.message);
      throw error;
    } else {
      console.log(`Successfully executed ${filePath}`);
    }
  } catch (err) {
    console.error(`Failed to execute ${filePath}:`, err);
    throw err;
  }
}

// Apply all migrations in order
async function applyMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    // Read migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in correct order
    
    console.log(`Found ${files.length} migration files to execute`);
    
    // Execute migrations in sequence
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      await executeSqlFile(filePath);
    }
    
    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration process failed:', err);
    throw err;
  }
}

// Run migrations
async function run() {
  try {
    await applyMigrations();
  } catch (err) {
    console.error('Failed to apply migrations:', err);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  run();
}

// Export for potential programmatic use
export { applyMigrations }; 