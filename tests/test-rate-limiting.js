const axios = require('axios');

async function testRateLimiting() {
    console.log('⚡ Testing Rate Limiting...\n');
    
    const promises = [];
    for (let i = 0; i < 20; i++) {
        promises.push(
            axios.post('http://localhost:3000/auth/login', {
                identifier: 'nonexistent@test.com',
                password: 'wrongpassword'
            }).catch(err => err.response)
        );
    }
    
    const results = await Promise.all(promises);
    const rateLimited = results.some(r => r?.status === 429);
    
    console.log(`Rate limiting: ${rateLimited ? '✅ ACTIVE' : '❌ MISSING'}`);
}

testRateLimiting();