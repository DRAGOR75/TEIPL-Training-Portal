export default function ManagerDemo() {
    return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4 font-sans">
            <div className="bg-white max-w-2xl w-full rounded-xl shadow-xl overflow-hidden border-t-4 border-green-600">

                {/* Header */}
                <div className="p-8 border-b bg-green-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Action Required</div>
                            <h1 className="text-2xl font-bold text-slate-900">Review Training Effectiveness</h1>
                            <p className="text-sm text-slate-600 mt-1">Employee: <span className="font-bold text-slate-900">Baibhav Gorai</span></p>
                        </div>
                        <div className="bg-white px-3 py-1 rounded text-xs font-bold shadow-sm text-slate-600 border border-slate-200">
                            Completed: Nov 15
                        </div>
                    </div>
                </div>

                {/* Split View */}
                <div className="p-8 grid gap-8">

                    {/* Employee's Answer (Read Only) */}
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-inner">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Employee Feedback</h3>
                        <p className="text-slate-800 italic font-medium">"I learned how to troubleshoot the hydraulic pump failures using the new diagnostic tool. I plan to implement the checklist starting next Monday."</p>
                    </div>

                    {/* Manager's Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Manager Assessment</h3>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Have you observed improvement in performance?</label>
                            <div className="relative">
                                <select className="w-full border-2 border-slate-300 p-3 rounded-lg bg-white text-slate-800 font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition">
                                    <option value="" disabled selected>Select a rating...</option>
                                    <option value="5">5 - Significant Improvement</option>
                                    <option value="4">4 - Some Improvement</option>
                                    <option value="3">3 - Neutral</option>
                                    <option value="2">2 - Little Improvement</option>
                                    <option value="1">1 - No Improvement</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Comments</label>
                            <textarea
                                className="w-full border-2 border-slate-300 p-3 rounded-lg h-32 text-slate-800 placeholder-slate-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                placeholder="e.g. Yes, Baibhav fixed the pump issue yesterday utilizing this training."
                            ></textarea>
                        </div>

                        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-md transition transform active:scale-[0.98]">
                            Approve & Close Ticket
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}