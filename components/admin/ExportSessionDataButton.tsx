'use client';

import { HiOutlineDocumentArrowDown } from 'react-icons/hi2';
interface ExportButtonProps {
    session: any;
    participants: any[];
}

export default function ExportSessionDataButton({ session, participants }: ExportButtonProps) {
    const handleExport = async () => {
        // Dynamically import xlsx to avoid Server-Side Rendering issues
        const XLSX = await import('xlsx');

        // Format data for excel
        const excelData = participants.map(p => {
            const feedbackScores = [
                p.trainingRating,
                p.contentRating,
                p.trainerRating,
                p.materialRating
            ].filter(s => s !== null && s !== undefined);
            const feedbackAverage = feedbackScores.length > 0
                ? (feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length).toFixed(1)
                : 'Pending';

            return {
                'Training Name': session.programName || '',
                'Trainer Name': session.trainerName || '',
                'Start Date': session.startDate ? new Date(session.startDate).toLocaleDateString() : '',
                'End Date': session.endDate ? new Date(session.endDate).toLocaleDateString() : '',
                'Employee Name': p.employeeName,
                'Employee Email': p.employeeEmail,
                'Employee ID': p.empId || '',
                'Content covered are useful for my work': p.contentRating || '',
                'Training material': p.materialRating || '',
                'I will recommend this training to others': p.recommendationRating === true ? 'Yes' : p.recommendationRating === false ? 'No' : '',
                'How you like the Training (1 to 5)': p.trainingRating || '',
                'Rate your Knowledge level before and after training [Before Training]': p.preTrainingRating || '',
                'Rate your Knowledge level before and after training After Training]': p.postTrainingRating || '',
                'Trainer Knowledge & Delivery': p.trainerRating || '',
                'Feedback Average Rating': feedbackAverage,
                'Feedback Status': p.status,
                'Topics Learned': p.topicsLearned || '',
                'Action Plan': p.actionPlan || '',
                'Suggestions': p.suggestions || '',
                'Post Training Q1 (Relevance)': p.q1_Relevance || '',
                'Post Training Q2 (Application)': p.q2_Application || '',
                'Post Training Q3 (Performance)': p.q3_Performance || '',
                'Post Training Q4 (Influence)': p.q4_Influence || '',
                'Post Training Q5 (Efficiency)': p.q5_Efficiency || '',
                'Post Training (30 days) Average': p.averageRating ? p.averageRating.toFixed(1) : '',
                'Manager Name': p.managerName || '',
                'Manager Email': p.managerEmail || '',
                'Manager Agrees': p.managerAgrees || '',
                'Manager Comment': p.managerComment || ''
            };
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Adjust column widths
        const colWidths = [
            { wch: 35 }, // Training Name
            { wch: 25 }, // Trainer Name
            { wch: 15 }, // Start Date
            { wch: 15 }, // End Date
            { wch: 25 }, // Employee Name
            { wch: 30 }, // Employee Email
            { wch: 15 }, // Employee ID
            { wch: 35 }, // Content covered are useful for my work
            { wch: 25 }, // Training material
            { wch: 45 }, // I will recommend this training to others
            { wch: 40 }, // How you like the Training (1 to 5)
            { wch: 65 }, // Rate your Knowledge level before and after training [Before Training]
            { wch: 65 }, // Rate your Knowledge level before and after training After Training]
            { wch: 35 }, // Trainer Knowledge & Delivery
            { wch: 25 }, // Feedback Average Rating
            { wch: 20 }, // Feedback Status
            { wch: 40 }, // Topics Learned
            { wch: 40 }, // Action Plan
            { wch: 40 }, // Suggestions
            { wch: 28 }, // Q1
            { wch: 30 }, // Q2
            { wch: 30 }, // Q3
            { wch: 28 }, // Q4
            { wch: 28 }, // Q5
            { wch: 30 }, // Post Training Avg
            { wch: 25 }, // Manager Name
            { wch: 30 }, // Manager Email
            { wch: 18 }, // Manager Agrees
            { wch: 40 }, // Manager Comment
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Participants');

        // Generate filename
        const filename = `${session.programName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'session'}_data.xlsx`;
        
        // Save to file
        XLSX.writeFile(wb, filename);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
            <HiOutlineDocumentArrowDown size={18} />
            Export to Excel
        </button>
    );
}
