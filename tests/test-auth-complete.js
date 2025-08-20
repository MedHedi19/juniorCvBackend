const axios = require('axios');

const API_URL = 'http://localhost:3000/auth';

// Generate unique test data for each run
const timestamp = Date.now();
const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${timestamp}@example.com`,
    phone: `+123456789${timestamp.toString().slice(-1)}`,
    password: 'testpassword123'
};

const testUser2 = {
    firstName: 'Test2',
    lastName: 'User2',
    email: `test2${timestamp}@example.com`,
    phone: `+123456788${timestamp.toString().slice(-1)}`,
    password: 'testpassword456'
};

async function cleanupTestUsers() {
    console.log('🧹 Cleaning up test users...\n');
    // Note: You might need to add a cleanup endpoint or manually clean the database
    // For now, we'll use unique emails to avoid conflicts
}

async function testRegister() {
    console.log('\n🚀 Testing Registration...\n');
    
    try {
        // Test successful registration
        console.log('1. Testing successful registration...');
        console.log('Using email:', testUser.email);
        const response = await axios.post(`${API_URL}/register`, testUser);
        console.log('✅ Registration successful!');
        console.log('Message:', response.data.message);
        
        // Test duplicate email
        console.log('\n2. Testing duplicate email registration...');
        try {
            await axios.post(`${API_URL}/register`, testUser);
            console.log('❌ Duplicate registration should have failed!');
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                console.log('✅ Duplicate email correctly rejected!');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message);
            }
        }
        
        // Test missing fields
        console.log('\n3. Testing missing fields...');
        try {
            await axios.post(`${API_URL}/register`, { email: 'incomplete@test.com' });
            console.log('❌ Incomplete registration should have failed!');
        } catch (error) {
            if (error.response?.data?.message?.includes('required')) {
                console.log('✅ Missing fields correctly rejected!');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Registration test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testLogin() {
    console.log('\n🚀 Testing Login...\n');
    
    try {
        // Test successful login with email
        console.log('1. Testing login with email...');
        const emailLogin = await axios.post(`${API_URL}/login`, {
            identifier: testUser.email,
            password: testUser.password
        });
        console.log('✅ Email login successful!');
        console.log('Access Token:', emailLogin.data.token.substring(0, 30) + '...');
        console.log('Refresh Token:', emailLogin.data.refreshToken?.substring(0, 30) + '...');
        
        // Test successful login with phone
        console.log('\n2. Testing login with phone...');
        const phoneLogin = await axios.post(`${API_URL}/login`, {
            identifier: testUser.phone,
            password: testUser.password
        });
        console.log('✅ Phone login successful!');
        
        // Test invalid credentials
        console.log('\n3. Testing invalid credentials...');
        try {
            await axios.post(`${API_URL}/login`, {
                identifier: testUser.email,
                password: 'wrongpassword'
            });
            console.log('❌ Invalid credentials should have failed!');
        } catch (error) {
            if (error.response?.data?.message?.includes('Invalid')) {
                console.log('✅ Invalid credentials correctly rejected!');
            }
        }
        
        // Test non-existent user
        console.log('\n4. Testing non-existent user...');
        try {
            await axios.post(`${API_URL}/login`, {
                identifier: 'nonexistent@test.com',
                password: 'password123'
            });
            console.log('❌ Non-existent user should have failed!');
        } catch (error) {
            if (error.response?.data?.message?.includes('Invalid')) {
                console.log('✅ Non-existent user correctly rejected!');
            }
        }
        
        return emailLogin.data;
    } catch (error) {
        console.error('❌ Login test failed:', error.response?.data || error.message);
        return null;
    }
}

async function testRefreshToken(loginData) {
    console.log('\n🚀 Testing Refresh Token...\n');
    
    try {
        const { token: accessToken, refreshToken } = loginData;
        
        if (!refreshToken) {
            console.log('❌ No refresh token provided!');
            return null;
        }
        
        // Test valid refresh token
        console.log('1. Testing valid refresh token...');
        const refreshResponse = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken: refreshToken
        });
        console.log('✅ Refresh token successful!');
        console.log('New Access Token:', refreshResponse.data.token.substring(0, 30) + '...');
        console.log('New Refresh Token:', refreshResponse.data.refreshToken.substring(0, 30) + '...');
        
        // Test old refresh token (should be invalidated)
        console.log('\n2. Testing old refresh token...');
        try {
            await axios.post(`${API_URL}/refresh-token`, {
                refreshToken: refreshToken
            });
            console.log('❌ Old refresh token should be invalidated!');
        } catch (error) {
            console.log('✅ Old refresh token correctly invalidated!');
        }
        
        // Test invalid refresh token
        console.log('\n3. Testing invalid refresh token...');
        try {
            await axios.post(`${API_URL}/refresh-token`, {
                refreshToken: 'invalid.token.here'
            });
            console.log('❌ Invalid refresh token should have failed!');
        } catch (error) {
            console.log('✅ Invalid refresh token correctly rejected!');
        }
        
        return refreshResponse.data;
    } catch (error) {
        console.error('❌ Refresh token test failed:', error.response?.data || error.message);
        return null;
    }
}

async function testForgotPassword() {
    console.log('\n🚀 Testing Forgot Password...\n');
    
    try {
        // Test valid email
        console.log('1. Testing forgot password with valid email...');
        const response = await axios.post(`${API_URL}/forgot-password`, {
            email: testUser.email
        });
        console.log('✅ Forgot password request successful!');
        console.log('Message:', response.data.message);
        
        // Test invalid email
        console.log('\n2. Testing forgot password with invalid email...');
        try {
            await axios.post(`${API_URL}/forgot-password`, {
                email: 'nonexistent@test.com'
            });
            console.log('❌ Invalid email should have failed!');
        } catch (error) {
            if (error.response?.data?.message?.includes('No user found')) {
                console.log('✅ Invalid email correctly rejected!');
            }
        }
        
        // Test missing email
        console.log('\n3. Testing forgot password without email...');
        try {
            await axios.post(`${API_URL}/forgot-password`, {});
            console.log('❌ Missing email should have failed!');
        } catch (error) {
            if (error.response?.data?.message?.includes('required')) {
                console.log('✅ Missing email correctly rejected!');
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Forgot password test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testResetPassword() {
    console.log('\n🚀 Testing Reset Password...\n');
    
    try {
        // Test invalid token
        console.log('1. Testing reset password with invalid token...');
        try {
            await axios.post(`${API_URL}/reset-password`, {
                token: '1234',
                newPassword: 'newpassword123'
            });
            console.log('❌ Invalid token should have failed!');
        } catch (error) {
            if (error.response?.data?.message?.includes('Invalid') || 
                error.response?.data?.message?.includes('expired')) {
                console.log('✅ Invalid token correctly rejected!');
            }
        }
        
        // Test missing fields
        console.log('\n2. Testing reset password with missing fields...');
        try {
            await axios.post(`${API_URL}/reset-password`, {
                token: '1234'
            });
            console.log('❌ Missing password should have failed!');
        } catch (error) {
            console.log('✅ Missing fields correctly rejected!');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Reset password test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testLogout(refreshTokenData) {
    console.log('\n🚀 Testing Logout...\n');
    
    try {
        if (!refreshTokenData?.refreshToken) {
            console.log('❌ No refresh token for logout test!');
            return false;
        }
        
        // Test successful logout
        console.log('1. Testing successful logout...');
        const response = await axios.post(`${API_URL}/logout`, {
            refreshToken: refreshTokenData.refreshToken
        });
        console.log('✅ Logout successful!');
        console.log('Message:', response.data.message);
        
        // Test refresh token after logout (should fail)
        console.log('\n2. Testing refresh token after logout...');
        try {
            await axios.post(`${API_URL}/refresh-token`, {
                refreshToken: refreshTokenData.refreshToken
            });
            console.log('❌ Refresh token should be invalidated after logout!');
        } catch (error) {
            console.log('✅ Refresh token correctly invalidated after logout!');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Logout test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testProtectedRoute(accessToken) {
    console.log('\n🚀 Testing Protected Routes...\n');
    
    try {
        // Test with valid token
        console.log('1. Testing protected route with valid token...');
        const response = await axios.get('http://localhost:3000/personality/start', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log('✅ Protected route accessible with valid token!');
        
        // Test without token
        console.log('\n2. Testing protected route without token...');
        try {
            await axios.get('http://localhost:3000/personality/start');
            console.log('❌ Protected route should require token!');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Protected route correctly requires authentication!');
            }
        }
        
        // Test with invalid token
        console.log('\n3. Testing protected route with invalid token...');
        try {
            await axios.get('http://localhost:3000/personality/start', {
                headers: {
                    'Authorization': 'Bearer invalid.token.here'
                }
            });
            console.log('❌ Protected route should reject invalid token!');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Protected route correctly rejects invalid token!');
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Protected route test failed:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🎯 Starting Complete Authentication System Tests\n');
    console.log('=' .repeat(50));
    console.log('Test User Email:', testUser.email);
    console.log('Test User Phone:', testUser.phone);
    console.log('=' .repeat(50));
    
    await cleanupTestUsers();
    
    // Clean up - try to register second user for additional tests
    try {
        await axios.post(`${API_URL}/register`, testUser2);
    } catch (error) {
        // User might already exist, that's ok
    }
    
    const registerSuccess = await testRegister();
    if (!registerSuccess) {
        console.log('❌ Registration tests failed, stopping...');
        return;
    }
    
    const loginData = await testLogin();
    if (!loginData) {
        console.log('❌ Login tests failed, stopping...');
        return;
    }
    
    const refreshData = await testRefreshToken(loginData);
    
    await testForgotPassword();
    await testResetPassword();
    
    if (refreshData) {
        await testLogout(refreshData);
    }
    
    if (loginData?.token) {
        await testProtectedRoute(loginData.token);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All authentication tests completed!');
    console.log('Check the results above for any failures.');
}

runAllTests();
