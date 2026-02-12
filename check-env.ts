
// Script to print the loaded DATABASE_URL
// Run with: npx tsx check-env.ts

import 'dotenv/config'; // Explicitly load .env
console.log("--- ENV CHECK START ---");
console.log("Current working directory:", process.cwd());
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("--- ENV CHECK END ---");
