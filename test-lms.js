const Papa = require('papaparse');

const csvData = `Emp ID	Emp Location	Qualification Type	Subject name	Date Of Enrollment	Date of Completion	Duration	Max Marks	Marks Attained	Pass	MTH	Year
10018532	TRC	LMS Participants	PPE	24-Mar-25	24-Mar-25				TRUE	Mar	24-25
10018503	Odisha	LMS Participants	PPE	21-Jun-24	21-Jun-24				TRUE	Jun	24-25
10018190	TRC	LMS Participants	Fire Safety	28-Aug-25	28-Aug-25	1	100		TRUE	Aug	24-25`;

Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    complete: function(results) {
        console.log(results.data[0]);
        console.log(results.data[2]);
    }
});

const d = new Date("24-Mar-25");
console.log("24-Mar-25 ->", d);
