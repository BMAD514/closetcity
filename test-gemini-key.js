// Test script to verify Gemini API key works
// Replace YOUR_API_KEY with your actual key

const GEMINI_API_KEY = 'YOUR_API_KEY_HERE'; // Replace this
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

async function testGeminiKey() {
  try {
    console.log('🧪 Testing Gemini API key...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, can you respond with just 'API key works!'?"
          }]
        }]
      })
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      if (response.status === 403) {
        console.log('🚨 403 Forbidden - This could indicate:');
        console.log('   - Free tier API key restrictions');
        console.log('   - API key not enabled for this service');
        console.log('   - Billing not set up');
      }
      
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Response:', data);
    return true;
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

testGeminiKey();
