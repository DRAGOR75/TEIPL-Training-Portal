'use client'

import { useState } from "react";
import Papa from "papaparse";
import { addParticipants, ParticipantData } from "@/app/actions/addParticipants";
import { FormSubmitButton } from "./FormSubmitButton";

export function AddParticipantModal({ sessionId }: { sessionId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
    const [loading, setLoading] = useState(false);

    // Manual Form State
    const [manualEntry, setManualEntry] = useState({ name: "", email: "", managerEmail: "" });

    // Handle Manual Submit
    async function handleManualSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        // Basic validation check
        if (!manualEntry.name || !manualEntry.email || !manualEntry.managerEmail) {
            alert("Please fill in all three fields.");
            setLoading(false);
            return;
        }
        const result = await addParticipants(sessionId, [manualEntry]);
        if (result.success) {
            alert(`Successfully added 1 participant!`);
            setIsOpen(false);
            setManualEntry({ name: "", email: "", managerEmail: "" }); // Reset
        } else {
            alert(`Failed to add participant: ${result.error || 'Database error'}`);
        }
        setLoading(false);
    }

    // Handle CSV Upload
    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        Papa.parse(file, {
            header: true, // Expects headers
            skipEmptyLines: true,
            complete: async (results: any) => {
                const data = results.data;

                // --- FIX: Robustly map CSV columns to the ParticipantData type ---
                const formatted: ParticipantData[] = data.map((row: any) => ({
                    // Check common variations for Name
                    name: row.Name || row.name || row['Employee Name'] || "",
                    // Check common variations for Employee Email
                    email: row.Email || row.email || row['Employee Email'] || "",
                    // Check all possible variations for Manager Email (THIS IS THE FIX)
                    managerEmail: row['Manager Email'] || row.ManagerEmail || row.Manager || row.manager_email || row.manager_email || ""
                })).filter((p: any) => p.email && p.managerEmail); // Filter out rows with missing emails

                if (formatted.length > 0) {
                    const result = await addParticipants(sessionId, formatted);
                    if (result.success) {
                        alert(`Successfully added ${result.count} participants!`);
                        setIsOpen(false);
                    } else {
                        alert(`Error adding participants: ${result.error}`);
                    }
                } else {
                    alert("Could not read any valid participants. Ensure your CSV has columns 'Name', 'Email', and 'Manager Email' and is not empty.");
                }
                setLoading(false);
            }
        });
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm shadow-sm"
            >
                + Add Participants
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">Add Participants</h2>

                {/* Tabs */}
                <div className="flex gap-4 border-b mb-4">
                    <button
                        onClick={() => setActiveTab("manual")}
                        className={`pb-2 ${activeTab === "manual" ? "border-b-2 border-blue-600 font-bold" : "text-gray-500"}`}
                    >
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setActiveTab("csv")}
                        className={`pb-2 ${activeTab === "csv" ? "border-b-2 border-blue-600 font-bold" : "text-gray-500"}`}
                    >
                        Upload CSV
                    </button>
                </div>

                {/* MANUAL FORM */}
                {activeTab === "manual" && (
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                        <input type="hidden" name="sessionId" value={sessionId} />

                        <input
                            placeholder="Employee Name" required
                            className="w-full border p-2 rounded"
                            value={manualEntry.name}
                            onChange={e => setManualEntry({ ...manualEntry, name: e.target.value })}
                        />
                        <input
                            placeholder="Employee Email" type="email" required
                            className="w-full border p-2 rounded"
                            value={manualEntry.email}
                            onChange={e => setManualEntry({ ...manualEntry, email: e.target.value })}
                        />
                        <input
                            placeholder="Manager Email" type="email" required
                            className="w-full border p-2 rounded"
                            value={manualEntry.managerEmail}
                            onChange={e => setManualEntry({ ...manualEntry, managerEmail: e.target.value })}
                        />
                        <FormSubmitButton isLoading={loading} loadingText="Saving..." className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                            Save Participant
                        </FormSubmitButton>
                    </form>
                )}

                {/* CSV FORM */}
                {activeTab === "csv" && (
                    <div className="space-y-4 text-center">
                        <div className="border-2 border-dashed p-8 rounded bg-gray-50">
                            <p className="text-sm text-gray-500 mb-2">Upload CSV with headers: <br /><b>Name, Email, Manager Email</b></p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                disabled={loading}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        {loading && <p className="text-sm text-blue-600">Processing file...</p>}
                    </div>
                )}

                <button onClick={() => setIsOpen(false)} className="mt-4 text-gray-500 text-sm underline w-full">
                    Cancel
                </button>
            </div>
        </div>
    );
}