const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3000/auth';

async function testTokenExpiry() {
    console.log('🚀 Testing Token Expiry and Refresh Flow...\n');
    
    try {
        // Login to get tokens
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${API_URL}/login`, {
            identifier: 'test@example.com',
            password: 'testpassword123'
        });
        
        const { token: accessToken, refreshToken } = loginResponse.data;
        console.log('✅ Login successful!');
        
        // Decode token to check expiry
        const decoded = jwt.decode(accessToken);
        const expiryTime = new Date(decoded.exp * 1000);
        const currentTime = new Date();
        const timeUntilExpiry = expiryTime - currentTime;
        
        console.log('Token expires at:', expiryTime.toLocaleString());
        console.log('Time until expiry:', Math.round(timeUntilExpiry / 1000 / 60), 'minutes');
        
        // Test protected route with valid token
        console.log('\n2. Testing protected route with valid token...');
        try {
            await axios.get('http://localhost:3000/personality/start', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log('✅ Protected route accessible with valid token!');
        } catch (error) {
            console.log('❌ Protected route failed:', error.response?.data?.message);
        }
        
        // Simulate token expiry by creating expired token
        console.log('\n3. Testing with expired token simulation...');
        
        // Create an expired token for testing
        const expiredToken = jwt.sign(
            { id: decoded.id }, 
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: '-1h' } // Expired 1 hour ago
        );
        
        try {
            await axios.get('http://localhost:3000/personality/start', {
                headers: { 'Authorization': `Bearer ${expiredToken}` }
            });
            console.log('❌ Expired token should have been rejected!');
        } catch (error) {
            if (error.response?.data?.expired) {
                console.log('✅ Expired token correctly rejected with expired flag!');
            } else {
                console.log('✅ Expired token rejected:', error.response?.data?.message);
            }
        }
        
        // Test refresh token flow
        console.log('\n4. Testing refresh token after expiry...');
        const refreshResponse = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken: refreshToken
        });
        
        console.log('✅ Refresh token successful!');
        console.log('New access token received');
        
        // Test protected route with new token
        console.log('\n5. Testing protected route with refreshed token...');
        await axios.get('http://localhost:3000/personality/start', {
            headers: { 'Authorization': `Bearer ${refreshResponse.data.token}` }
        });
        console.log('✅ Protected route accessible with refreshed token!');
        
        console.log('\n🎉 Token expiry tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Token expiry test failed:', error.response?.data || error.message);
    }
}

testTokenExpiry();
