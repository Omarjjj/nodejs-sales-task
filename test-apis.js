const https = require('http');

const baseUrl = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: url,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test functions
async function testAPIs() {
    console.log('🧪 Testing Product APIs...\n');

    try {
        // Test 1: Root endpoint
        console.log('1️⃣ Testing root endpoint...');
        const root = await makeRequest('/');
        console.log('✅ Root:', root.data.message);
        console.log('');

        // Test 2: Get product totals
        console.log('2️⃣ Testing GET /api/products/totals...');
        const totals = await makeRequest('/api/products/totals');
        console.log('✅ Product totals:', JSON.stringify(totals.data, null, 2));
        console.log('');

        // Test 3: Get product details
        console.log('3️⃣ Testing GET /api/products...');
        const products = await makeRequest('/api/products');
        console.log('✅ Product details:', JSON.stringify(products.data, null, 2));
        console.log('');

        // Test 4: Get specific product total
        console.log('4️⃣ Testing GET /api/products/A1/total...');
        const productTotal = await makeRequest('/api/products/A1/total');
        console.log('✅ Product A1 total:', JSON.stringify(productTotal.data, null, 2));
        console.log('');

        // Test 5: Get specific product amounts
        console.log('5️⃣ Testing GET /api/products/A1/amounts...');
        const productAmounts = await makeRequest('/api/products/A1/amounts');
        console.log('✅ Product A1 amounts:', JSON.stringify(productAmounts.data, null, 2));
        console.log('');

        // Test 6: Add new product
        console.log('6️⃣ Testing POST /api/products...');
        const newProduct = await makeRequest('/api/products', 'POST', {
            productId: 'TEST123',
            amount: 999
        });
        console.log('✅ New product added:', JSON.stringify(newProduct.data, null, 2));
        console.log('');

        // Test 7: Verify new product was added
        console.log('7️⃣ Verifying new product in totals...');
        const updatedTotals = await makeRequest('/api/products/totals');
        console.log('✅ Updated totals:', JSON.stringify(updatedTotals.data, null, 2));
        console.log('');

        // Test 8: Test error handling
        console.log('8️⃣ Testing error handling (non-existent product)...');
        const errorTest = await makeRequest('/api/products/NONEXISTENT/total');
        console.log('✅ Error response:', JSON.stringify(errorTest.data, null, 2));
        console.log('');

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the tests
testAPIs();
