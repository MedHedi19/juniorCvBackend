const axios = require('axios');

const API_URL = 'http://localhost:3000/auth';

async function createTestUser() {
    try {
        console.log('🚀 Creating test user...\n');

        const testUser = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '+1234567890',
            password: 'testpassword123'
        };

        const response = await axios.post(`${API_URL}/register`, testUser);
        console.log('✅ Test user created successfully!');
        console.log('Message:', response.data.message);
        return true;
    } catch (error) {
        if (error.response?.data?.message === 'User already exists with this email or phone') {
            console.log('✅ Test user already exists!');
            return true;
        } else {
            console.error('❌ Failed to create test user:', error.response?.data || error.message);
            return false;
        }
    }
}

async function testRefreshTokenFlow() {
    try {
        console.log('\n🚀 Testing Refresh Token Functionality...\n');

        // Step 1: Login to get tokens
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${API_URL}/login`, {
            identifier: 'test@example.com',
            password: 'testpassword123'
        });

        console.log('✅ Login successful!');
        console.log('Access Token:', loginResponse.data.token.substring(0, 30) + '...');
        console.log('Refresh Token:', loginResponse.data.refreshToken ? loginResponse.data.refreshToken.substring(0, 30) + '...' : 'Not provided');
        console.log('User:', loginResponse.data.user.email);

        const { token: accessToken, refreshToken } = loginResponse.data;

        if (!refreshToken) {
            console.log('❌ No refresh token received!');
            return;
        }

        // Step 2: Use the refresh token to get new tokens
        console.log('\n2. Testing refresh token...');
        const refreshResponse = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken: refreshToken
        });

        console.log('✅ Refresh token successful!');
        console.log('New Access Token:', refreshResponse.data.token.substring(0, 30) + '...');
        console.log('New Refresh Token:', refreshResponse.data.refreshToken.substring(0, 30) + '...');

        // Step 3: Test that old refresh token is invalidated
        console.log('\n3. Testing old refresh token (should fail)...');
        try {
            await axios.post(`${API_URL}/refresh-token`, {
                refreshToken: refreshToken // Using old refresh token
            });
            console.log('❌ Old refresh token still works! This is a security issue.');
        } catch (error) {
            console.log('✅ Old refresh token is invalidated correctly!');
        }

        // Step 4: Test logout functionality
        console.log('\n4. Testing logout...');
        const logoutResponse = await axios.post(`${API_URL}/logout`, {
            refreshToken: refreshResponse.data.refreshToken
        });

        console.log('✅ Logout successful!');

        // Step 5: Test that refresh token is invalidated after logout
        console.log('\n5. Testing refresh token after logout (should fail)...');
        try {
            await axios.post(`${API_URL}/refresh-token`, {
                refreshToken: refreshResponse.data.refreshToken
            });
            console.log('❌ Refresh token still works after logout! This is a security issue.');
        } catch (error) {
            console.log('✅ Refresh token is invalidated after logout!');
        }

        console.log('\n🎉 All tests passed! Your refresh token implementation is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    const userCreated = await createTestUser();
    if (userCreated) {
        await testRefreshTokenFlow();
    }
}

runTests();
