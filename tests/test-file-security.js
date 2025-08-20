const axios = require('axios');

async function testFileUploadSecurity() {
    console.log('📁 Testing File Upload Security...\n');
    
    // Test malicious file uploads
    const maliciousFiles = [
        { data: 'data:application/javascript;base64,YWxlcnQoJ2hhY2tlZCcp', name: 'script.js' },
        { data: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgnaGFja2VkJyk8L3NjcmlwdD4=', name: 'malicious.html' },
        { data: 'A'.repeat(100000000), name: 'huge.txt' } // 100MB
    ];
    
    for (const file of maliciousFiles) {
        try {
            await axios.post('http://localhost:3000/documents/cv-pdf', {
                data: file.data,
                originalName: file.name,
                size: file.data.length
            }, {
                headers: { Authorization: 'Bearer fake-token' }
            });
            console.log(`❌ VULNERABILITY: Malicious file accepted: ${file.name}`);
        } catch (error) {
            console.log(`✅ Malicious file rejected: ${file.name}`);
        }
    }
}

testFileUploadSecurity();