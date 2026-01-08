'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { FormSubmitButton } from "@/components/FormSubmitButton";

export default function LoginPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password.");
                setLoading(false);
            } else {
                // Force full reload to ensure session is picked up by Middleware/Server
                window.location.href = "/admin/dashboard";
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

                {/* Header - High Contrast Blue */}
                <div className="bg-blue-700 p-8 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <ShieldCheck className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Portal</h1>
                </div>

                <div className="p-8 pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Email Field - Darker Labels */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Error Message - High Visibility Red */}
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-xs font-bold text-center italic">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <FormSubmitButton
                            isLoading={loading}
                            loadingText="SIGNING IN..."
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-3 rounded-lg shadow-lg flex justify-center items-center gap-3 transition-all active:scale-95 disabled:opacity-70"
                        >
                            SIGN IN TO DASHBOARD
                        </FormSubmitButton>
                    </form>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Secure Environment • Thriveni 2025
                    </p>
                </div>
            </div>
        </div>
    );
}