const Papa = require('papaparse');

const csvData = `Emp ID	Emp Name	Subject name	Test Date	Max Marks	Marks Attained	Reference / Remarks	Key Word	Facilitator	Qualification Type
10009413	Vinothkumar S	Review Test App Elec  8 Mar 21	21-12-2020	50	23.50	Review Test App	Electrical	Gaurav	Online Test`;

Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        console.log("Headers:");
        console.log(results.meta.fields);
        console.log("First Row:");
        console.log(results.data[0]);
    }
});
