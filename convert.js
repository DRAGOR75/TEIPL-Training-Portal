const fs = require('fs');
const content = fs.readFileSync('specific-failures.log', 'utf16le');
fs.writeFileSync('specific-failures-utf8.log', content, 'utf8');
