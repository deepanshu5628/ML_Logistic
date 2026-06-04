// Test script for chatbot endpoint
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testChatbot() {
  try {
    console.log('🔐 Step 1: Attempting to login...\n');
    
    // Try to login - you may need to adjust these credentials
    // Or you can manually get a token from your frontend and use it
    let token;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/signin`, {
        email: 'test@example.com', // Replace with your actual email
        password: 'password123'     // Replace with your actual password
      });
      
      token = loginResponse.data.token;
      console.log('✅ Login successful!');
      console.log('Token:', token.substring(0, 30) + '...\n');
    } catch (loginError) {
      if (loginError.response?.status === 400) {
        console.log('⚠️  Login failed. Please provide a valid token manually.\n');
        console.log('To get a token:');
        console.log('1. Login through your frontend');
        console.log('2. Open browser console and run: localStorage.getItem("token")');
        console.log('3. Use that token in the TOKEN variable below\n');
        
        // You can manually set a token here if you have one
        const TOKEN = ''; // Paste your token here
        if (!TOKEN) {
          console.error('❌ No token provided. Exiting...');
          process.exit(1);
        }
        token = TOKEN;
      } else {
        throw loginError;
      }
    }
    
    // Test the chatbot
    console.log('🤖 Step 2: Testing chatbot...');
    console.log('Message: "where is my last parcel"\n');
    
    const chatbotResponse = await axios.post(
      `${BASE_URL}/chatbot`,
      { message: 'where is my last parcel' },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Chatbot Response Received:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(chatbotResponse.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the server running on port 5000?');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testChatbot();

