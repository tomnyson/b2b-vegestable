#!/usr/bin/env node

// This script runs all database migrations in order
const path = require('path');
const { applyMigrations } = require('../lib/apply-migrations.ts');

console.log('Starting database migrations...');

applyMigrations()
  .then(() => {
    console.log('All migrations completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 