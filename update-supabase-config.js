#!/usr/bin/env node
/**
 * Helper script to update Supabase configuration
 * Usage: node update-supabase-config.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('========================================');
console.log('Supabase Configuration Updater');
console.log('========================================\n');

// Read current .env file
let envContent = '';
try {
  envContent = readFileSync(join(__dirname, '.env'), 'utf8');
  console.log('✓ Found .env file');
} catch (error) {
  console.log('⚠ No .env file found. Creating new one...');
  envContent = '';
}

// Read current config.toml
let configContent = '';
try {
  configContent = readFileSync(join(__dirname, 'supabase', 'config.toml'), 'utf8');
  console.log('✓ Found supabase/config.toml');
} catch (error) {
  console.log('⚠ Could not read supabase/config.toml');
}

console.log('\nPlease provide your Supabase credentials:');
console.log('(You can find these in Supabase Dashboard → Settings → API)\n');

// Get input from user (in a real scenario, you'd use readline)
console.log('To update manually:');
console.log('1. Edit .env file and set:');
console.log('   VITE_SUPABASE_URL=your_project_url');
console.log('   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key');
console.log('   VITE_SUPABASE_PROJECT_ID=your_project_id');
console.log('\n2. Edit supabase/config.toml and set:');
console.log('   project_id = "your_project_id"');
console.log('\n3. Run the SQL migration in Supabase SQL Editor:');
console.log('   See: supabase/migrations/COMBINED_SETUP.sql');

