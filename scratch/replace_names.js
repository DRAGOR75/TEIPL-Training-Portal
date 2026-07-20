const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern 1: {variable.programName} -> {variable.altProgramName || variable.programName}
    content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\.programName\}/g, '{$1.altProgramName || $1.programName}');
    
    // Pattern 2: ${variable.programName} -> ${variable.altProgramName || variable.programName}
    content = content.replace(/\$\{([a-zA-Z0-9_\.\?]+)\.programName\}/g, '${$1.altProgramName || $1.programName}');
    
    // Pattern 3: (variable.programName) -> (variable.altProgramName || variable.programName)
    // Be careful with this one, maybe only when it's part of a React component props or string concatenation.

    if (content !== original) {
        console.log("Updated: " + filePath);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(process.cwd(), 'app'));
walkDir(path.join(process.cwd(), 'components'));
