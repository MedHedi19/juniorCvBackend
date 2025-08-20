const axios = require('axios');

const API_URL = 'http://localhost:3000/auth';

// Use existing test user
const existingUser = {
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'testpassword123'
};

async function testWithExistingUser() {
    console.log('🚀 Testing with existing user...\n');
    
    try {
        // Test login
        console.log('1. Testing login...');
        const loginData = await axios.post(`${API_URL}/login`, {
            identifier: existingUser.email,
            password: existingUser.password
        });
        console.log('✅ Login successful!');
        
        // Test refresh token
        if (loginData.data.refreshToken) {
            console.log('\n2. Testing refresh token...');
            const refreshData = await axios.post(`${API_URL}/refresh-token`, {
                refreshToken: loginData.data.refreshToken
            });
            console.log('✅ Refresh token successful!');
            
            // Test logout
            console.log('\n3. Testing logout...');
            await axios.post(`${API_URL}/logout`, {
                refreshToken: refreshData.data.refreshToken
            });
            console.log('✅ Logout successful!');
        }
        
        // Test forgot password
        console.log('\n4. Testing forgot password...');
        await axios.post(`${API_URL}/forgot-password`, {
            email: existingUser.email
        });
        console.log('✅ Forgot password successful!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testWithExistingUser();