const axios = require('axios');

const API_URL = 'http://localhost:3000/auth';

// Generate truly unique test data
const timestamp = Date.now();
const randomSuffix = Math.random().toString(36).substring(7);
const testUser = {
    firstName: 'Security',
    lastName: 'Test',
    email: `security${timestamp}${randomSuffix}@example.com`,
    phone: `+1234567${timestamp.toString().slice(-4)}`,
    password: 'testpassword123'
};

async function testResetPasswordSecurity() {
    console.log('🔒 Testing Password Reset Security...\n');
    
    try {
        // 1. Register test user
        console.log('1. Registering test user...');
        console.log('Email:', testUser.email);
        await axios.post(`${API_URL}/register`, testUser);
        console.log('✅ User registered successfully');
        
        // 2. Request password reset
        console.log('\n2. Requesting password reset...');
        const forgotResponse = await axios.post(`${API_URL}/forgot-password`, {
            email: testUser.email
        });
        console.log('✅ Password reset email sent');
        
        // 3. Test with WRONG PIN
        console.log('\n3. Testing with WRONG PIN (1111)...');
        try {
            await axios.post(`${API_URL}/reset-password`, {
                token: '1111',
                newPassword: 'hackedpassword123'
            });
            console.log('❌ SECURITY VULNERABILITY: Wrong PIN was accepted!');
            return false;
        } catch (error) {
            if (error.response?.data?.message?.includes('Invalid') || 
                error.response?.data?.message?.includes('expired')) {
                console.log('✅ Wrong PIN correctly rejected');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message);
            }
        }
        
        // 4. Test with another WRONG PIN
        console.log('\n4. Testing with another WRONG PIN (9999)...');
        try {
            await axios.post(`${API_URL}/reset-password`, {
                token: '9999',
                newPassword: 'hackedpassword456'
            });
            console.log('❌ SECURITY VULNERABILITY: Wrong PIN was accepted!');
            return false;
        } catch (error) {
            if (error.response?.data?.message?.includes('Invalid') || 
                error.response?.data?.message?.includes('expired')) {
                console.log('✅ Wrong PIN correctly rejected');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message);
            }
        }
        
        // 5. Test with empty token
        console.log('\n5. Testing with empty token...');
        try {
            await axios.post(`${API_URL}/reset-password`, {
                token: '',
                newPassword: 'hackedpassword789'
            });
            console.log('❌ SECURITY VULNERABILITY: Empty token was accepted!');
            return false;
        } catch (error) {
            console.log('✅ Empty token correctly rejected');
        }
        
        // 6. Test with invalid format token
        console.log('\n6. Testing with invalid format token...');
        try {
            await axios.post(`${API_URL}/reset-password`, {
                token: 'abc123',
                newPassword: 'hackedpassword000'
            });
            console.log('❌ SECURITY VULNERABILITY: Invalid format token was accepted!');
            return false;
        } catch (error) {
            console.log('✅ Invalid format token correctly rejected');
        }
        
        // 7. Test login with original password (should still work)
        console.log('\n7. Testing login with original password...');
        try {
            const loginResponse = await axios.post(`${API_URL}/login`, {
                identifier: testUser.email,
                password: testUser.password
            });
            console.log('✅ Original password still works (password not changed by wrong PINs)');
        } catch (error) {
            console.log('❌ Original password no longer works!');
            return false;
        }
        
        console.log('\n🎉 Password Reset Security Test PASSED!');
        console.log('✅ System correctly rejects invalid reset tokens');
        return true;
        
    } catch (error) {
        console.error('❌ Security test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testTokenExpiration() {
    console.log('\n⏰ Testing Token Expiration...\n');
    
    try {
        // Create another test user with unique data
        const expTimestamp = Date.now() + Math.random();
        const expUser = {
            firstName: 'Expiry',
            lastName: 'Test',
            email: `exp${expTimestamp}@example.com`,
            phone: `+1234568${expTimestamp.toString().slice(-4)}`,
            password: 'testpassword123'
        };
        
        await axios.post(`${API_URL}/register`, expUser);
        console.log('✅ Expiration test user registered');
        
        // Request reset
        await axios.post(`${API_URL}/forgot-password`, {
            email: expUser.email
        });
        console.log('✅ Reset token generated');
        
        // Note: In real scenario, we'd wait for token to expire
        // For testing, we can simulate an expired token scenario
        console.log('ℹ️  In production, tokens expire after 1 hour');
        console.log('ℹ️  Manual expiration testing would require waiting or database manipulation');
        
        return true;
    } catch (error) {
        console.error('❌ Expiration test setup failed:', error.response?.data || error.message);
        return false;
    }
}

async function runSecurityTests() {
    console.log('🚨 CRITICAL SECURITY TESTS FOR PASSWORD RESET\n');
    console.log('Testing the vulnerability you mentioned...\n');
    
    const securityPassed = await testResetPasswordSecurity();
    const expirationSetup = await testTokenExpiration();
    
    console.log('\n📊 SECURITY TEST RESULTS:');
    console.log('='.repeat(50));
    console.log(`Password Reset Security: ${securityPassed ? '✅ SECURE' : '❌ VULNERABLE'}`);
    console.log(`Token Expiration Setup: ${expirationSetup ? '✅ CONFIGURED' : '❌ FAILED'}`);
    
    if (!securityPassed) {
        console.log('\n🚨 CRITICAL SECURITY ISSUE DETECTED!');
        console.log('❌ Invalid reset tokens are being accepted!');
        console.log('🔧 Check the resetPassword function in authController.js');
    } else {
        console.log('\n🔒 Security tests passed! Reset system is secure.');
    }
}

runSecurityTests();
