function parseFlexibleDate(dateStr) {
    if (!dateStr || String(dateStr).trim() === '') return null;
    try {
        let cleanStr = String(dateStr).trim();
        
        // Handle DD-MM-YYYY or DD/MM/YYYY
        const parts = cleanStr.split(/[-/]/);
        if (parts.length === 3 && parts[2].length >= 2) {
            const p1 = parseInt(parts[0], 10);
            const p2 = parseInt(parts[1], 10);
            const p3 = parseInt(parts[2], 10);
            
            // If it's all numbers
            if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
                let year = p3;
                if (year < 100) year += 2000; // handle 2-digit year
                
                // Assume DD-MM-YYYY since it's an Indian app, 
                // UNLESS it's YYYY-MM-DD (first part is year)
                if (p1 > 1000) {
                    cleanStr = `${p1}-${p2}-${p3}`;
                } else {
                    // It's either DD-MM-YYYY or MM-DD-YYYY. Default to DD-MM-YYYY
                    cleanStr = `${year}-${p2}-${p1}`;
                }
            }
        }

        const parsed = new Date(cleanStr);
        if (!isNaN(parsed.getTime())) return parsed;

        // Fallback to original string
        const parsedOrig = new Date(String(dateStr).trim());
        if (!isNaN(parsedOrig.getTime())) return parsedOrig;
    } catch {
        // ignore
    }
    return null;
}

console.log("31-08-2021:", parseFlexibleDate("31-08-2021"));
console.log("31/08/2021:", parseFlexibleDate("31/08/2021"));
console.log("24-Mar-25:", parseFlexibleDate("24-Mar-25"));
console.log("2020-12-21:", parseFlexibleDate("2020-12-21"));
console.log("12-10-21:", parseFlexibleDate("12-10-21")); // assuming 12 Oct 2021
