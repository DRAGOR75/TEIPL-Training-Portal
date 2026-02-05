const autocannon = require('autocannon');

async function runLoadTest() {
    const url = 'http://localhost:3000/api/feedback/employee'; // Hypothesizing an API route or a page that handles POST
    // Note: Next.js Server Actions usually have an obscured URL or use the page URL with special headers.
    // For a generic load test, we will hit the main entry pages first.

    const result = await autocannon({
        url: 'http://localhost:3000/feedback/employee/test-id',
        connections: 100,
        duration: 10,
        headers: {
            'content-type': 'application/json'
        }
    });

    console.log(autocannon.printResult(result));
}

runLoadTest();
