'use client';

import { useState, useRef, useEffect } from 'react';
import { HiXMark, HiOutlinePaperAirplane, HiOutlineArrowPathRoundedSquare } from 'react-icons/hi2';

interface BulkEmailPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (subject: string, template: string) => void;
    sampleData: {
        name: string;
        empId: string;
        password: string;
        department: string;
        designation: string;
    };
}

export default function BulkEmailPreviewModal({ isOpen, onClose, onConfirm, sampleData }: BulkEmailPreviewModalProps) {
    const [subject, setSubject] = useState('LMS: User Id and Password');
    const [htmlContent, setHtmlContent] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);

    const defaultTemplate = `
    <div style="font-family: Georgia, serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
    <p>Dear {name},</p> 
    <p>Greetings of the day!</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>LMS:</strong> <a href="https://training.thrivenisikshak.com/" target="_blank" style="color: #0056b3;">https://training.thrivenisikshak.com/</a></p>
        <p style="margin: 5px 0;"><strong>User ID:</strong> {empId}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> {password}</p>
      </div>

      <p>Use the above credentials to login into the LMS.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">This is an automated message from the Thriveni Training Management System.</small>
    </div>
  `;

    useEffect(() => {
        if (isOpen && !htmlContent) {
            setHtmlContent(defaultTemplate);
            if (contentRef.current) {
                contentRef.current.innerHTML = defaultTemplate;
            }
        }
    }, [isOpen]);

    const handleReset = () => {
        if (confirm("Reset to default template?")) {
            setHtmlContent(defaultTemplate);
            if (contentRef.current) {
                contentRef.current.innerHTML = defaultTemplate;
            }
        }
    };

    const handleConfirm = () => {
        const finalHtml = contentRef.current?.innerHTML || htmlContent;
        onConfirm(subject, finalHtml);
    };

    const getPreviewHtml = () => {
        const currentTemplate = contentRef.current?.innerHTML || htmlContent;
        return currentTemplate
            .replace(/{name}/g, sampleData.name || 'Sample Name')
            .replace(/{empId}/g, sampleData.empId || '000000')
            .replace(/{password}/g, sampleData.password || '******')
            .replace(/{department}/g, sampleData.department || 'Dept')
            .replace(/{designation}/g, sampleData.designation || 'Role');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Edit Email Template</h3>
                        <p className="text-xs text-slate-500">Edit the template below. Use placeholders like <code>{'{name}'}</code>, <code>{'{empId}'}</code>, <code>{'{password}'}</code>.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200">
                        <HiXMark size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-row">

                    {/* Editor Side */}
                    <div className="w-1/2 flex flex-col border-r border-slate-200">
                        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-500 w-16">Subject:</span>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Template Editor (HTML)</span>
                                <button onClick={handleReset} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                    <HiOutlineArrowPathRoundedSquare /> Reset Default
                                </button>
                            </div>
                        </div>

                        <div
                            className="flex-1 p-4 overflow-y-auto outline-none font-mono text-sm bg-slate-50 focus:bg-white transition-colors"
                            ref={contentRef}
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                            onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
                        />
                    </div>

                    {/* Preview Side */}
                    <div className="w-1/2 flex flex-col bg-slate-100">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                            Live Preview (First Record)
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center">
                            <div
                                className="bg-white shadow-lg rounded-lg w-full max-w-md overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-bold text-sm">
                        <HiOutlinePaperAirplane className="-rotate-45" /> Send to All
                    </button>
                </div>

            </div>
        </div>
    );
}
