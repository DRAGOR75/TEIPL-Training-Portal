'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";

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
                setError("Invalid credentials.");
                setLoading(false);
            } else {
                router.push("/admin/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <ShieldCheck className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Login</h1>
                </div>

                <div className="p-8 pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input name="email" type="email" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input name="password" type="password" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded">{error}</p>}

                        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}