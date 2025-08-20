const axios = require('axios');

async function testJWTSecurity() {
    console.log('🔐 Testing JWT Token Security...\n');
    
    // Test with fake/malicious tokens
    const fakeTokens = [
        'fake.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature',
        '',
        'Bearer malicious-token',
        'admin-bypass-token'
    ];
    
    for (const token of fakeTokens) {
        try {
            await axios.get('http://localhost:3000/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`❌ VULNERABILITY: Fake token accepted: ${token}`);
        } catch (error) {
            console.log(`✅ Fake token rejected: ${token.substring(0, 20)}...`);
        }
    }
}

testJWTSecurity();