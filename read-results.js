const fs = require('fs');
let c = fs.readFileSync('test-results.json', 'utf16le');
if (c.charCodeAt(0) === 0xFEFF) {
    c = c.slice(1);
}
const d = JSON.parse(c);
const failed = d.testResults.filter(x => x.status === 'failed');
let out = "";
failed.forEach(f => {
    out += `Failed Suite: ${f.name}\n`;
    if (f.assertionResults) {
        const failedAsserts = f.assertionResults.filter(a => a.status === 'failed');
        failedAsserts.forEach(a => {
            out += `  Test: ${a.title}\n`;
            out += `  Message: ${a.failureMessages.join('\n')}\n`;
        });
    } else {
        out += `  Message: ${f.message}\n`;
    }
});
fs.writeFileSync('failed-tests-list.txt', out);
