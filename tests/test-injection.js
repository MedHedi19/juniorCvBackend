const axios = require('axios');

async function testSQLInjection() {
    console.log('💉 Testing SQL Injection Protection...\n');
    
    const injectionPayloads = [
        "admin'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'/**/OR/**/1=1--",
        "'; INSERT INTO users VALUES('hacker'); --"
    ];
    
    for (const payload of injectionPayloads) {
        try {
            await axios.post('http://localhost:3000/auth/login', {
                identifier: payload,
                password: payload
            });
            console.log(`❌ VULNERABILITY: Injection payload processed: ${payload}`);
        } catch (error) {
            console.log(`✅ Injection payload blocked: ${payload.substring(0, 20)}...`);
        }
    }
}

testSQLInjection();