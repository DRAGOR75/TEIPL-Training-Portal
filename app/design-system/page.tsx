// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Card } from "@/components/ui/card";
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineCalendar, HiOutlineSquares2X2, HiOutlineUser } from 'react-icons/hi2';

export default function DesignSystemPage() {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-12">
                <div className="container mx-auto px-6 max-w-7xl">
                    <p className="text-blue-600 text-xs font-black uppercase tracking-widest mb-2 bg-blue-50 px-3 py-1 rounded-full w-fit">Developer Resource</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Design System & Language</h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        A reference guide for building consistent UI in the Nomination Management System.
                        Use this as a source of truth for colors, typography, shapes, and components.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl space-y-16">

                {/* 1. CORE VALUES */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <span className="text-blue-600">01.</span> Core Principles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Roundness</h3>
                            <p className="text-slate-500 text-sm">
                                We use extensive rounding to create a friendly, modern feel.
                                <br /><br />
                                <code className="bg-slate-100 px-2 py-1 rounded text-pink-600 text-xs">rounded-3xl</code> for main containers/cards.
                                <br />
                                <code className="bg-slate-100 px-2 py-1 rounded text-pink-600 text-xs">rounded-xl</code> for inputs, buttons, and inner elements.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Clean Typography</h3>
                            <p className="text-slate-500 text-sm">
                                We prioritize readability and hierarchy.
                                <br /><br />
                                Use <span className="font-black text-slate-900">font-black</span> for main page titles.
                                <br />
                                Use <span className="font-bold text-slate-800">font-bold</span> for section headers.
                                <br />
                                Use <span className="font-medium text-slate-500">font-medium</span> for subtext.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Subtle Depth</h3>
                            <p className="text-slate-500 text-sm">
                                We use soft shadows and light borders to define space without clutter.
                                <br /><br />
                                <code className="bg-slate-100 px-2 py-1 rounded text-pink-600 text-xs">shadow-sm</code> is our default.
                                <br />
                                <code className="bg-slate-100 px-2 py-1 rounded text-pink-600 text-xs">border-slate-200</code> for definition.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. COLORS */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <span className="text-blue-600">02.</span> Color Palette
                    </h2>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                        {/* Neutrals */}
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Neutrals (Slate)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <div className="space-y-2">
                                    <div className="h-20 rounded-2xl bg-slate-100 border border-slate-200"></div>
                                    <p className="text-xs font-mono text-slate-500">bg-slate-100<br />(Page BG)</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-white border border-slate-200"></div>
                                    <p className="text-xs font-mono text-slate-500">bg-white<br />(Card BG)</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-slate-100"></div>
                                    <p className="text-xs font-mono text-slate-500">bg-slate-100<br />(Hover/Input)</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-slate-200"></div>
                                    <p className="text-xs font-mono text-slate-500">bg-slate-200<br />(Borders)</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-slate-500"></div>
                                    <p className="text-xs font-mono text-slate-500">text-slate-500<br />(Subtext)</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-slate-900"></div>
                                    <p className="text-xs font-mono text-slate-500">text-slate-900<br />(Headings)</p>
                                </div>
                            </div>
                        </div>

                        {/* Brand Colors */}
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Brand / Primary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">Icon</div>
                                    <p className="text-xs font-mono text-slate-500">bg-blue-50<br />(Accents)</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">Action</div>
                                    <p className="text-xs font-mono text-slate-500">bg-blue-600<br />(Primary)</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 rounded-xl bg-blue-700"></div>
                                    <p className="text-xs font-mono text-slate-500">bg-blue-700<br />(Hover)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* 3. TYPOGRAPHY */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <span className="text-blue-600">03.</span> Typography
                    </h2>
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-2 pb-6 border-b border-slate-100">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">H1 Heading (4xl Black)</h1>
                            <p className="text-xs font-mono text-slate-400">text-4xl font-black text-slate-900 tracking-tight</p>
                        </div>
                        <div className="space-y-2 pb-6 border-b border-slate-100">
                            <h2 className="text-3xl font-bold text-slate-900">H2 Heading (3xl Bold)</h2>
                            <p className="text-xs font-mono text-slate-400">text-3xl font-bold text-slate-900</p>
                        </div>
                        <div className="space-y-2 pb-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">H3 Heading (xl Bold)</h3>
                            <p className="text-xs font-mono text-slate-400">text-xl font-bold text-slate-800</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-slate-500 font-medium">
                                Body text is typically Slate-500 and Medium weight roughly 1rem (base) size.
                                We avoid pure black for body text to reduce eye strain.
                            </p>
                            <p className="text-xs font-mono text-slate-400">text-slate-500 font-medium</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Label / Overline</p>
                            <p className="text-xs font-mono text-slate-400">text-xs font-bold text-slate-400 uppercase tracking-wider</p>
                        </div>
                    </div>
                </section>

                {/* 4. UI COMPONENTS */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <span className="text-blue-600">04.</span> Components
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Containers */}
                        <div className="space-y-4">
                            <p className="font-bold text-slate-900">Containers</p>
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                <span className="font-bold text-slate-900">Card (Rounded 3XL)</span>
                                <div className="mt-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                                    <span className="font-medium text-slate-500">Inner Content (Rounded 2XL)</span>
                                </div>
                            </div>
                        </div>

                        {/* Buttons & Inputs */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="font-bold text-slate-900">Buttons</p>
                                <div className="flex flex-wrap gap-4">
                                    <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                                        Primary Button
                                    </button>
                                    <button className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition">
                                        Secondary Button
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 font-mono mt-2">px-6 py-3 rounded-xl font-bold</p>
                            </div>

                            <div className="space-y-2">
                                <p className="font-bold text-slate-900">Inputs</p>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                                    placeholder="Standard Input (Rounded XL)"
                                />
                                <p className="text-xs text-slate-400 font-mono mt-2">px-4 py-3 rounded-xl bg-slate-50</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
