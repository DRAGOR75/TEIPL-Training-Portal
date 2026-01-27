const { execSync } = require('child_process');

function runTest(name, url, connections, duration, pipelining = 1) {
    console.log(`\n\n=== RUNNING: ${name} ===`);
    console.log(`Target: ${url}`);
    console.log(`Connections: ${connections} | Duration: ${duration}s | Pipelining: ${pipelining}`);

    try {
        const cmd = `npx -y autocannon -c ${connections} -d ${duration} -p ${pipelining} --renderStatusCodes ${url} >> load-test-micro.txt`;
        // Execute and append to file
        execSync(cmd);
    } catch (error) {
        console.error(`Test '${name}' failed or was interrupted.`);
    }
}

function main() {
    const fs = require('fs');
    fs.writeFileSync('load-test-micro.txt', '=== MICRO-CACHING LOAD TEST REPORT ===\n');

    console.log("Starting Performance Stress Tests... writing to load-test-micro.txt");
    console.log("Note: Ensure your local server is running on localhost:3000");

    // 1. BASELINE: Static/SSG Page
    runTest('1. Baseline (Home Page)', 'http://localhost:3000', 100, 10);

    // 2. DATABASE READ: TNI Dashboard
    // This fetches the list of employees/sessions usually
    runTest('2. Database Read (TNI Dashboard)', 'http://localhost:3000/tni', 50, 10);

    // 3. COMPLEX QUERY: Admin Sessions
    runTest('3. Complex Query (Admin Sessions)', 'http://localhost:3000/admin/sessions', 50, 10);

    // 4. BREAKPOINT TEST: Ramp Up
    console.log("\n\n=== PHASE 2: BREAKPOINT TESTING ===");
    console.log("Ramping up connections to find failure point on /admin/sessions");

    // Level 1: 200 connections
    runTest('Breakpoint Level 1 (200 Conn)', 'http://localhost:3000/admin/sessions', 200, 10);

    // Level 2: 500 connections
    runTest('Breakpoint Level 2 (500 Conn)', 'http://localhost:3000/admin/sessions', 500, 10);

    // Level 3: 1000 connections
    runTest('Breakpoint Level 3 (1000 Conn)', 'http://localhost:3000/admin/sessions', 1000, 10);
}

main();
