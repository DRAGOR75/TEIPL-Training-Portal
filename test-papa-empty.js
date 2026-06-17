const Papa = require('papaparse');
const text = ' , , , , , , ,\nMachine Model,Fault Name,Check Description,Justification,Action ,Symptoms,Reference,Sequence\nAlternator,Voltage oscillations,Incorrect AVR setting,Unstable AVR regulation,Set AVR stability potentiometer,,A-6,1';
const res = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().replace(/^"|"$/g, '') });
console.log(res.meta.fields);
