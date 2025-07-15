// Test script to verify APIs are working and making actual calls
import fetch from 'node-fetch';

async function testXAI() {
  console.log('\n=== Testing X AI (Grok) API ===');
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [{ role: 'user', content: 'Test message for API verification' }],
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    console.log('X AI Response:', response.status, data.choices?.[0]?.message?.content || data.error);
    
    if (response.ok) {
      console.log('✅ X AI API is working - this call should show in your dashboard');
    } else {
      console.log('❌ X AI API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ X AI API error:', error.message);
  }
}

async function testOpenAI() {
  console.log('\n=== Testing OpenAI API ===');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test message for API verification' }],
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    console.log('OpenAI Response:', response.status, data.choices?.[0]?.message?.content || data.error);
    
    if (response.ok) {
      console.log('✅ OpenAI API is working - this call should show in your dashboard');
    } else {
      console.log('❌ OpenAI API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ OpenAI API error:', error.message);
  }
}

async function testForge() {
  console.log('\n=== Testing Autodesk Forge API ===');
  try {
    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `client_id=${process.env.FORGE_CLIENT_ID}&client_secret=${process.env.FORGE_CLIENT_SECRET}&grant_type=client_credentials&scope=data:read data:write data:create bucket:create bucket:read`
    });
    
    const data = await response.json();
    console.log('Forge Response:', response.status, data.access_token ? 'Token received' : data.error);
    
    if (response.ok) {
      console.log('✅ Forge API is working - this call should show in your dashboard');
    } else {
      console.log('❌ Forge API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Forge API error:', error.message);
  }
}

async function runTests() {
  console.log('🔍 Testing all APIs to verify they are linked and working...');
  
  await testXAI();
  await testOpenAI();
  await testForge();
  
  console.log('\n✅ All tests complete. Check your provider dashboards for usage.');
}

runTests().catch(console.error);