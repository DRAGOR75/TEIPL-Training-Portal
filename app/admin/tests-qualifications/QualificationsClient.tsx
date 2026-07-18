'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { deleteQualification, bulkUploadQualifications } from '@/app/actions/qualifications';
import { FiInbox, FiUsers, FiSearch, FiCheck, FiTrash2, FiFileText, FiUploadCloud, FiChevronLeft, FiChevronRight, FiCheckSquare, FiSquare, FiAlertCircle } from 'react-icons/fi';

type Tab = 'sessions' | 'independent' | 'bulk';

type GridRow = {
  id: string; 
  empID: string;
  obtainedMarks: string;
  Qualified: boolean;
  securedTest: boolean;
};

type ToastType = { id: number; message: string; type: 'success' | 'error' };

export default function QualificationsClient({ 
  programs, 
  employees, 
  initialData, 
  completedSessions = []
}: { 
  programs: any[], 
  employees: any[], 
  initialData: any[],
  completedSessions?: any[] 
}) {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);

  // Common details for the batch
  const [commonData, setCommonData] = useState({
    programId: '',
    testDate: '',
    maxMarks: '',
    facilitator: '',
  });

  // Grid rows
  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [employeeSelectValue, setEmployeeSelectValue] = useState(''); 

  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Toasts
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Group sessions by program
  const completedPrograms = useMemo(() => {
    const map = new Map<string, any[]>();
    completedSessions.forEach(session => {
      if (!map.has(session.programName)) map.set(session.programName, []);
      map.get(session.programName)!.push(session);
    });
    return Array.from(map.entries()).map(([programName, sessions]) => ({
      programName,
      altProgramName: sessions[0]?.altProgramName || null,
      sessions,
      sessionCount: sessions.length
    }));
  }, [completedSessions]);

  const selectedProgramSessions = useMemo(() => {
    if (!selectedProgramName) return [];
    return completedPrograms.find(p => p.programName === selectedProgramName)?.sessions || [];
  }, [completedPrograms, selectedProgramName]);

  const sessionProgramId = useMemo(() => {
    if (selectedProgramSessions.length === 0) return '';
    // Use the first session's program ID or fallback to matching by name
    const firstSession = selectedProgramSessions[0];
    if (firstSession.nominationBatch?.programId) return firstSession.nominationBatch.programId;
    const p = programs.find(p => p.name === selectedProgramName);
    return p?.id || '';
  }, [selectedProgramSessions, programs, selectedProgramName]);

  useEffect(() => {
    if (activeTab === 'sessions' && selectedProgramSessions.length > 0) {
      // Get all enrolled employees across all completed sessions for this program
      const allEmpIds = selectedProgramSessions.flatMap((s: any) => s.enrollments.map((e: any) => e.empId)).filter(Boolean);
      // Remove duplicates
      const uniqueEmpIds = Array.from(new Set(allEmpIds));
      
      const newRows = uniqueEmpIds.map((empId: string) => ({
        id: empId as string,
        empID: empId as string,
        obtainedMarks: '',
        Qualified: false,
        securedTest: false,
      }));
      setGridRows(newRows);
    } else if (activeTab === 'independent') {
      setGridRows([]);
    }
  }, [activeTab, selectedProgramSessions]);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedProgramName, searchQuery]);

  const handleAddEmployeeToGrid = (empId: string) => {
    if (!empId) return;
    if (gridRows.find(r => r.empID === empId)) {
      showToast("Employee is already in the batch", "error");
      return;
    }
    setGridRows([...gridRows, {
      id: empId,
      empID: empId,
      obtainedMarks: '',
      Qualified: false,
      securedTest: false,
    }]);
    setEmployeeSelectValue('');
  };

  const handleRemoveEmployee = (empId: string) => {
    setGridRows(gridRows.filter(r => r.empID !== empId));
  };

  const handleGridChange = (id: string, field: keyof GridRow, value: any) => {
    setGridRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const toggleAllQualified = (checked: boolean) => {
    setGridRows(rows => rows.map(r => ({ ...r, Qualified: checked })));
  };

  const toggleAllSecured = (checked: boolean) => {
    setGridRows(rows => rows.map(r => ({ ...r, securedTest: checked })));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.querySelector(`input[data-row-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(`input[data-row-index="${index - 1}"]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gridRows.length === 0) {
      showToast('Please add at least one employee to the batch.', 'error');
      return;
    }
    
    // Validation check
    const max = parseInt(commonData.maxMarks);
    if (!isNaN(max)) {
      const invalidRow = gridRows.find(r => parseInt(r.obtainedMarks) > max);
      if (invalidRow) {
        showToast('Obtained marks cannot exceed Max Marks.', 'error');
        return;
      }
    }

    const pId = activeTab === 'sessions' ? sessionProgramId : commonData.programId;

    const submitData = gridRows.map(row => ({
      empID: row.empID,
      programId: pId || null,
      testDate: commonData.testDate,
      maxMarks: commonData.maxMarks,
      obtainedMarks: row.obtainedMarks,
      Qualified: row.Qualified,
      facilitator: commonData.facilitator,
      securedTest: row.securedTest,
    }));

    const res = await bulkUploadQualifications(submitData);
    if (res.success) {
      showToast('Batch saved successfully!', 'success');
      if (activeTab === 'independent') {
        setGridRows([]);
      } else {
        setGridRows(rows => rows.map(r => ({ ...r, obtainedMarks: '', Qualified: false, securedTest: false })));
      }
    } else {
      showToast('Error: ' + res.error, 'error');
    }
  };

  const handleBulkUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split('\n').slice(1);
    const data = rows.map(row => {
      const cols = row.split(',');
      return {
        empID: cols[0]?.trim(),
        programId: cols[1]?.trim() || null, 
        testDate: cols[2]?.trim(),
        maxMarks: cols[3]?.trim(),
        obtainedMarks: cols[4]?.trim(),
        Qualified: cols[5]?.trim(),
        facilitator: cols[6]?.trim(),
        securedTest: cols[7]?.trim(),
      };
    }).filter(item => item.empID); 

    if (data.length > 0) {
      const res = await bulkUploadQualifications(data);
      if (res.success) {
        showToast('Bulk upload successful', 'success');
      } else {
        showToast('Bulk upload failed: ' + res.error, 'error');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteQualification(id);
      showToast('Record deleted.', 'success');
    }
  };

  const filteredRecords = useMemo(() => {
    let records = initialData;
    if (activeTab === 'independent') records = records.filter(item => !item.programId);
    else if (activeTab === 'sessions' && sessionProgramId) records = records.filter(item => item.programId === sessionProgramId);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      records = records.filter(r => 
        r.employee?.name?.toLowerCase().includes(q) || 
        r.employee?.id?.toLowerCase().includes(q) ||
        (r.programName && r.programName.toLowerCase().includes(q))
      );
    }
    return records;
  }, [initialData, activeTab, sessionProgramId, searchQuery]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const allQualified = gridRows.length > 0 && gridRows.every(r => r.Qualified);
  const allSecured = gridRows.length > 0 && gridRows.every(r => r.securedTest);

  return (
    <div className="flex flex-col md:flex-row gap-6 relative">
      
      {/* TOASTS CONTAINER */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <FiCheck className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
            {toast.message}
          </div>
        ))}
      </div>

      {/* SIDEBAR NAVIGATION */}
      <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
        <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
          <FiFileText className="text-blue-500" /> Entry Modes
        </h3>
        
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`p-3 text-left rounded-xl border border-slate-200 transition-all duration-200 hover:scale-[1.02] ${activeTab === 'sessions' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <div className="font-semibold flex items-center gap-2"><FiUsers /> Program Wise</div>
          <div className="text-xs opacity-80 mt-1">Select a completed session to auto-fill students</div>
        </button>

        <button 
          onClick={() => setActiveTab('independent')}
          className={`p-3 text-left rounded-xl border border-slate-200 transition-all duration-200 hover:scale-[1.02] ${activeTab === 'independent' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <div className="font-semibold flex items-center gap-2"><FiInbox /> Independent Tests</div>
          <div className="text-xs opacity-80 mt-1">Add tests without any program</div>
        </button>

        <button 
          onClick={() => setActiveTab('bulk')}
          className={`p-3 text-left rounded-xl border border-slate-200 transition-all duration-200 hover:scale-[1.02] ${activeTab === 'bulk' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
        >
          <div className="font-semibold flex items-center gap-2"><FiUploadCloud /> Bulk CSV Upload</div>
          <div className="text-xs opacity-80 mt-1">Upload records from spreadsheet</div>
        </button>

        {activeTab === 'sessions' && (
          <div className="mt-4 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Completed Programs</h4>
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {completedPrograms.map(prog => (
                <button
                  key={prog.altProgramName || prog.programName}
                  onClick={() => setSelectedProgramName(prog.programName)}
                  className={`w-full text-left p-3 text-sm rounded-xl border border-slate-200 transition-all duration-200 ${selectedProgramName === prog.programName ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm' : 'bg-white hover:bg-slate-50 hover:border-slate-300 border-slate-100 text-slate-700'}`}
                >
                  <div className="font-semibold truncate">{prog.altProgramName || prog.programName}</div>
                  <div className="text-xs opacity-70 mt-0.5">{prog.sessionCount} completed session{prog.sessionCount > 1 ? 's' : ''}</div>
                </button>
              ))}
              {completedPrograms.length === 0 && (
                <div className="text-sm text-slate-500 italic p-3 border border-slate-200 rounded-xl border-dashed bg-slate-50 flex items-center gap-2">
                  <FiAlertCircle /> No completed programs
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6">
        
        {/* BULK UPLOAD VIEW */}
        {activeTab === 'bulk' && (
          <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-md">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><FiUploadCloud className="text-blue-500" /> Bulk Upload Qualifications</h2>
            <p className="text-sm text-slate-500 mb-8">Upload records for any program or independent tests via CSV.</p>
            <div className="p-12 border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors duration-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center">
              <FiFileText className="w-12 h-12 text-slate-400 mb-4" />
              <input 
                className="block w-full max-w-sm text-sm text-slate-900 border border-slate-300 rounded-xl cursor-pointer bg-white focus:outline-none mb-4 p-2 shadow-sm" 
                type="file" 
                accept=".csv" 
                onChange={handleBulkUploadCSV} 
              />
              <p className="text-xs text-slate-500 max-w-md text-center">CSV format: empID, programId (optional), testDate, maxMarks, obtainedMarks, Qualified, facilitator, securedTest</p>
            </div>
          </div>
        )}

        {/* BATCH ENTRY FORMS */}
        {(activeTab === 'independent' || (activeTab === 'sessions' && selectedProgramName)) && (
          <div className="p-6 md:p-8 border border-slate-200 rounded-2xl bg-white shadow-md overflow-hidden">
            <h2 className="text-xl font-bold mb-2">
              {activeTab === 'sessions' ? `Batch Entry: ${selectedProgramName}` : 'Batch Entry: Independent Tests'}
            </h2>
            <p className="text-sm text-slate-500 mb-8">
              {activeTab === 'sessions' 
                ? 'Employees from all completed sessions for this program have been automatically added to the grid below.' 
                : 'Select employees to add them to the grid below, then fill out their individual marks.'}
            </p>

            <form onSubmit={handleSubmitBatch} className="space-y-8">
              
              {/* Common Batch Details */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FiCheckSquare className="text-blue-500" /> Common Details (Applies to all)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {activeTab === 'independent' && (
                     <div>
                        <label className="block text-xs font-bold mb-1.5 text-slate-500 uppercase tracking-wider">Program (Optional)</label>
                        <select 
                          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          value={commonData.programId} 
                          onChange={e => setCommonData({...commonData, programId: e.target.value})}
                        >
                          <option value="">None</option>
                          {programs.map((prog: any) => (
                            <option key={prog.id} value={prog.id}>{prog.name}</option>
                          ))}
                        </select>
                     </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-500 uppercase tracking-wider">Test Date</label>
                    <input className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" type="date" value={commonData.testDate} onChange={e => setCommonData({...commonData, testDate: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-500 uppercase tracking-wider">Max Marks</label>
                    <input className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" type="number" placeholder="e.g. 100" value={commonData.maxMarks} onChange={e => setCommonData({...commonData, maxMarks: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-500 uppercase tracking-wider">Facilitator</label>
                    <input className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" type="text" placeholder="Name" value={commonData.facilitator} onChange={e => setCommonData({...commonData, facilitator: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Employee Addition (Only for Independent mode) */}
              {activeTab === 'independent' && (
                <div className="flex items-end gap-4">
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-semibold mb-2">Add Employee to Batch</label>
                    <div className="relative">
                      <select 
                        className="flex h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-4 pr-10 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        value={employeeSelectValue} 
                        onChange={e => setEmployeeSelectValue(e.target.value)}
                      >
                        <option value="">Search and select employee...</option>
                        {employees.map((emp: any) => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <FiUsers />
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleAddEmployeeToGrid(employeeSelectValue)}
                    disabled={!employeeSelectValue}
                    className="h-11 bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-slate-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                  >
                    Add to Roster
                  </button>
                </div>
              )}

              {/* Data Entry Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden border-slate-200 shadow-sm">
                <div className="bg-slate-100 px-5 py-4 border-b flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-700">Batch Roster ({gridRows.length} employees)</h3>
                  <div className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">Tip: Use Arrow Keys to navigate</div>
                </div>
                
                {gridRows.length > 0 ? (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm before:content-[''] before:absolute before:inset-0 before:border-b before:border-slate-200 before:pointer-events-none">
                        <tr>
                          <th className="px-4 py-3 w-[30%]">Employee</th>
                          <th className="px-4 py-3 w-[30%]">Marks Obtained</th>
                          <th className="px-4 py-3 w-[20%] text-center">
                            <div className="flex flex-col items-center gap-1">
                              Qualified
                              <button type="button" onClick={() => toggleAllQualified(!allQualified)} className="text-blue-500 hover:text-blue-700" title="Toggle All">
                                {allQualified ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                              </button>
                            </div>
                          </th>
                          <th className="px-4 py-3 w-[20%] text-center">
                            <div className="flex flex-col items-center gap-1">
                              Secured
                              <button type="button" onClick={() => toggleAllSecured(!allSecured)} className="text-blue-500 hover:text-blue-700" title="Toggle All">
                                {allSecured ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                              </button>
                            </div>
                          </th>
                          {activeTab === 'independent' && (
                            <th className="px-4 py-3 text-center">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {gridRows.map((row, index) => {
                          const employeeDetails = employees.find(e => e.id === row.empID);
                          const maxMarksVal = parseInt(commonData.maxMarks);
                          const marksVal = parseInt(row.obtainedMarks);
                          const isInvalid = !isNaN(maxMarksVal) && !isNaN(marksVal) && marksVal > maxMarksVal;

                          return (
                            <tr key={row.id} className="hover:bg-blue-50/50:bg-blue-900/10 transition-colors">
                              <td className="px-4 py-2">
                                <div className="font-semibold text-slate-900">{employeeDetails?.name || row.empID}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{row.empID}</div>
                              </td>
                              <td className="px-4 py-2">
                                <input 
                                  type="number" 
                                  placeholder="0"
                                  data-row-index={index}
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                  className={`w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm shadow-inner focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${isInvalid ? 'border-red-400 text-red-600 focus:border-red-500 focus:ring-red-200' : 'border-slate-300'}`} 
                                  value={row.obtainedMarks}
                                  onChange={e => handleGridChange(row.id, 'obtainedMarks', e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input 
                                  type="checkbox" 
                                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  checked={row.Qualified}
                                  onChange={e => handleGridChange(row.id, 'Qualified', e.target.checked)}
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input 
                                  type="checkbox" 
                                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  checked={row.securedTest}
                                  onChange={e => handleGridChange(row.id, 'securedTest', e.target.checked)}
                                />
                              </td>
                              {activeTab === 'independent' && (
                                <td className="px-4 py-2 text-center">
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveEmployee(row.id)}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                    title="Remove from batch"
                                  >
                                    <FiTrash2 size={18} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FiUsers size={24} className="text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-700">No employees in this batch yet.</p>
                    {activeTab === 'independent' ? (
                      <p className="text-sm mt-1">Use the dropdown above to add employees to your roster.</p>
                    ) : (
                      <p className="text-sm mt-1">This session has no enrolled employees.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 font-bold transition-all focus:ring-4 focus:ring-blue-200:ring-blue-900 disabled:opacity-50 disabled:transform-none" 
                  type="submit"
                  disabled={gridRows.length === 0}
                >
                  Save Batch ({gridRows.length})
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'sessions' && !selectedProgramName && (
          <div className="p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
              <FiCheckSquare className="text-blue-500 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Select a Program</h3>
            <p className="text-slate-500 mt-2 max-w-sm mb-6">Choose a completed program from the dropdown below or the sidebar to load its enrolled students.</p>
            <div className="w-full max-w-sm">
                <select 
                    className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={selectedProgramName || ''}
                    onChange={(e) => setSelectedProgramName(e.target.value)}
                >
                    <option value="">-- Select Completed Program --</option>
                    {completedPrograms.map(prog => (
                        <option key={prog.altProgramName || prog.programName} value={prog.altProgramName || prog.programName}>
                            {prog.altProgramName || prog.programName}
                        </option>
                    ))}
                </select>
            </div>
          </div>
        )}

        {/* EXISTING RECORDS TABLE */}
        <div className="border border-slate-200 rounded-2xl bg-white shadow-md overflow-hidden mt-8">
          <div className="p-5 border-b bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <FiFileText className="text-slate-500" />
              {activeTab === 'sessions' ? 'Records for Selected Program' : (activeTab === 'independent' ? 'Independent Records' : 'All Records')}
            </h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Search records..." 
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
              </div>
              <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-bold whitespace-nowrap">
                {filteredRecords.length} Total
              </span>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm before:content-[''] before:absolute before:inset-0 before:border-b before:border-slate-200 before:pointer-events-none">
                <tr>
                  <th className="px-4 py-3 w-[25%]">Employee</th>
                  <th className="px-4 py-3 w-[25%]">Program</th>
                  <th className="px-4 py-3 w-[15%]">Marks</th>
                  <th className="px-4 py-3 w-[15%]">Date</th>
                  <th className="px-4 py-3 w-[10%]">Status</th>
                  <th className="px-4 py-3 w-[10%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="font-semibold text-slate-900">{item.employee?.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.employee?.id}</div>
                    </td>
                    <td className="px-4 py-2">
                      {item.programName === "Unknown Program" && !item.programId ? 
                        <span className="text-slate-400 italic">None (Independent)</span> : 
                        <span className="font-medium text-slate-700">{item.altProgramName || item.programName}</span>}
                    </td>
                    <td className="px-4 py-2 font-bold text-slate-700">{item.obtainedMarks || '-'} <span className="text-slate-400 font-normal">/ {item.maxMarks || '-'}</span></td>
                    <td className="px-4 py-2 text-slate-600">{item.testDate ? new Date(item.testDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-2">
                      {item.Qualified ? (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 shadow-sm">
                          <FiCheck /> Qualified
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold shadow-sm">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50:bg-red-900/20 p-2 rounded-lg transition-colors" 
                        onClick={() => handleDelete(item.id)}
                        title="Delete record"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <FiSearch size={32} className="text-slate-300 mb-3" />
                        <p className="font-semibold">No records found for this view.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between bg-white">
              <div className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)}</span> of <span className="font-semibold text-slate-900">{filteredRecords.length}</span> results
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <FiChevronLeft />
                </button>
                <div className="px-4 py-2 text-sm font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
