// Test script for Resend email service
// Run with: node test-email.js

import dotenv from 'dotenv';
import { sendOrderEmail } from './src/services/email.service.js';

dotenv.config();

async function testEmail() {
  console.log('🧪 Testing Resend email service...\n');

  // Check configuration
  console.log('📋 Configuration:');
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set (hidden)' : '❌ MISSING');
  console.log('  MAIL_FROM:', process.env.MAIL_FROM || '⚠️  Using default');
  console.log();

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ Missing RESEND_API_KEY in .env file!');
    console.error('\nSteps to fix:');
    console.error('1. Sign up at: https://resend.com/signup');
    console.error('2. Get API key at: https://resend.com/api-keys');
    console.error('3. Add to .env: RESEND_API_KEY=re_your_key_here\n');
    process.exit(1);
  }

  // Check if resend package is installed
  try {
    await import('resend');
  } catch (err) {
    console.error('❌ Resend package not installed!');
    console.error('\nRun this command:');
    console.error('  npm install resend\n');
    process.exit(1);
  }

  // Send test email
  try {
    console.log('📧 Sending test email...\n');
    
    // You can change this email to test with different addresses
    const testEmail = process.env.SUPPORT_EMAIL || 'somsocsalford@gmail.com';
    
    const testData = {
      email: testEmail,
      name: 'Test User',
      code: 'TEST-' + Date.now(),
      quantity: 2,
      amount: 20.00
    };

    console.log('Sending to:', testEmail);
    
    await sendOrderEmail(testData);
    
    console.log('\n✅ SUCCESS! Test email sent!');
    console.log('📬 Check inbox at:', testEmail);
    console.log('🎫 The email should contain a QR code\n');
    console.log('💡 Tip: Check spam folder if you don\'t see it\n');
    
  } catch (error) {
    console.error('\n❌ FAILED to send email');
    console.error('Error:', error.message);
    
    if (error.message?.includes('API key')) {
      console.error('\n💡 Solution: Check your RESEND_API_KEY is correct');
    } else if (error.message?.includes('from')) {
      console.error('\n💡 Solution: Update MAIL_FROM in .env');
    } else {
      console.error('\n💡 Check your internet connection');
    }
    console.error();
    process.exit(1);
  }
}

testEmail();