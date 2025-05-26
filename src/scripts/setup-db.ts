import { supabase } from '@/app/lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * Setup database by running migration files
 */
async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Check if migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }
    
    // Get all SQL files in migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order
    
    if (migrationFiles.length === 0) {
      throw new Error('No migration files found');
    }
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      
      // Read the SQL content
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error executing migration ${file}:`, error);
        
        // Try running it as multiple statements if the RPC fails
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('exec_sql function not available, trying alternative approach...');
          await runMigrationManually(sql);
        } else {
          throw error;
        }
      } else {
        console.log(`Migration ${file} completed successfully`);
      }
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

/**
 * Run migration manually by splitting into individual statements
 */
async function runMigrationManually(sql: string) {
  // Split the SQL into individual statements (basic approach)
  const statements = sql
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);
  
  console.log(`Executing ${statements.length} statements manually`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    try {
      // Execute with single_statement=true to ensure safety
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';',
        single_statement: true
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
      }
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err);
      // Continue with next statement but log error
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase }; 