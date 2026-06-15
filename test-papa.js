const Papa = require('papaparse');
const fs = require('fs');
const text = `Machine Model	Fault Name	Check Description	Justification	Action 	Symptoms	Reference	Sequence
Alternator	Voltage oscillations	Incorrect AVR setting	Unstable AVR regulation	Set AVR stability potentiometer		A-6	1
Alternator	Voltage oscillations	Thyristor load above limit	Non-linear load causes fluctuation	Reduce thyristor load		A-6	2`;

const res = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().replace(/^"|"$/g, '')
});
console.log(JSON.stringify(res, null, 2));
