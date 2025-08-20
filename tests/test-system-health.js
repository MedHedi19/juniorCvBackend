const axios = require('axios');

async function testSystemHealth() {
    console.log('🏥 System Health Check...\n');
    
    const endpoints = [
        'http://localhost:3000/auth/register',
        'http://localhost:3000/auth/login', 
        'http://localhost:3000/profile',
        'http://localhost:3000/quiz',
        'http://localhost:3000/documents',
        'http://localhost:3000/personality'
    ];
    
    for (const endpoint of endpoints) {
        try {
            await axios.get(endpoint);
            console.log(`✅ ${endpoint} - Accessible`);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`✅ ${endpoint} - Protected (401)`);
            } else {
                console.log(`❌ ${endpoint} - Error: ${error.response?.status}`);
            }
        }
    }
}

testSystemHealth();