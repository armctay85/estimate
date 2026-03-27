#!/usr/bin/env node
/**
 * Admin Setup Script
 * 
 * First-time admin user creation script.
 * Run this to create the initial admin user after deployment.
 * 
 * Usage:
 *   ADMIN_SETUP_KEY=your-secure-key node scripts/setup-admin.js
 * 
 * Or with npm:
 *   npm run setup:admin
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import readline from 'readline';
import bcrypt from 'bcryptjs';

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!process.env.ADMIN_SETUP_KEY) {
  console.error('❌ ADMIN_SETUP_KEY environment variable is required');
  console.error('   Generate a secure key with: openssl rand -base64 32');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function validatePassword(password) {
  const errors = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('\n🔐 EstiMate Admin Setup\n');
  console.log('This script will create the initial admin user.\n');
  
  const username = await question('Enter admin username: ');
  const email = await question('Enter admin email: ');
  
  let password = '';
  let passwordValid = false;
  
  while (!passwordValid) {
    password = await question('Enter admin password (min 12 chars, must include uppercase, lowercase, number, special char): ');
    const validation = validatePassword(password);
    
    if (!validation.valid) {
      console.log('\n❌ Password too weak:');
      validation.errors.forEach(err => console.log(`   - ${err}`));
      console.log('');
    } else {
      const confirmPassword = await question('Confirm admin password: ');
      if (password !== confirmPassword) {
        console.log('\n❌ Passwords do not match\n');
      } else {
        passwordValid = true;
      }
    }
  }
  
  console.log('\n📝 Creating admin user...\n');
  
  try {
    // Import storage after env check
    const { storage } = await import('../server/storage.js');
    
    // Check if admin already exists
    const existingAdmins = await storage.getUsersByTier('admin');
    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingAdmins[0].email}`);
      console.log('\nIf you need to reset the admin password, contact your system administrator.');
      rl.close();
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin user
    const adminUser = await storage.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      subscriptionTier: 'admin'
    });
    
    console.log('✅ Admin user created successfully!\n');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Tier: ${adminUser.subscriptionTier}`);
    console.log('\n🎉 Setup complete! You can now log in with these credentials.');
    console.log('\n⚠️  IMPORTANT: Remove or rotate the ADMIN_SETUP_KEY environment variable');
    console.log('   after setup to prevent unauthorized admin creation.\n');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
  
  rl.close();
}

main();
