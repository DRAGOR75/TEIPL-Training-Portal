'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    HiOutlineEye,
    HiOutlineUsers,
    HiOutlineDevicePhoneMobile,
    HiOutlineComputerDesktop,
    HiOutlineWrenchScrewdriver,
    HiOutlineSparkles,
    HiOutlineStar,
    HiOutlineArrowPath,
    HiOutlineCalendar,
    HiOutlineCheckBadge,
    HiOutlineSignal
} from 'react-icons/hi2';
import { getTroubleshootingAnalytics } from '@/app/actions/troubleshooting';

interface AnalyticsData {
    totalVisits: number;
    visitsToday: number;
    visits7Days: number;
    visits30Days: number;
    uniqueAll: number;
    uniqueToday: number;
    unique7Days: number;
    topProducts: { name: string; count: number }[];
    topFaults: { name: string; count: number }[];
    deviceStats: { device: string; count: number }[];
    recentVisits: Array<{
        id: string;
        sessionId: string;
        path: string;
        productName: string | null;
        faultName: string | null;
        device: string;
        browser: string;
        createdAt: Date | string;
    }>;
    feedbackCount: number;
    feedbackRating: number;
}

export default function TroubleshootingAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const res = await getTroubleshootingAnalytics();
            if (res.success && res.data) {
                setData(res.data as AnalyticsData);
            } else {
                setError(res.error || 'Failed to load telemetry data');
            }
        } catch (err: any) {
            setError(err?.message || 'Error communicating with server');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatTimestamp = (dateVal: Date | string) => {
        try {
            const d = new Date(dateVal);
            return d.toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch {
            return String(dateVal);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading telemetry from GCP database...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
                <p className="font-semibold">Unable to fetch diagnostics telemetry</p>
                <p className="text-sm mt-1 text-red-600">{error}</p>
                <button
                    onClick={() => loadData(true)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    const totalDeviceVisits = data.deviceStats.reduce((acc, curr) => acc + curr.count, 0) || 1;
    const maxProductCount = data.topProducts.length > 0 ? Math.max(...data.topProducts.map(p => p.count)) : 1;
    const maxFaultCount = data.topFaults.length > 0 ? Math.max(...data.topFaults.map(f => f.count)) : 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-emerald-400">Live</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight">HEMM Diagnostics Analytics</h2>
                    <p className="text-xs md:text-sm text-slate-300 mt-0.5">
                        Monitoring traffic on <code className="bg-slate-800 text-red-400 font-mono px-1.5 py-0.5 rounded">hemmts.academythriveni.com</code>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs md:text-sm font-semibold text-slate-200 transition-colors disabled:opacity-50"
                    >
                        <HiOutlineArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Hits */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Views</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <HiOutlineEye className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{data.totalVisits.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-400 ml-1.5">all-time</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                        <HiOutlineCalendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Past 30 days: <strong className="text-slate-700 font-bold">{data.visits30Days}</strong></span>
                    </div>
                </div>

                {/* Unique Technicians / Devices */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unique Visitors</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <HiOutlineUsers className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{data.uniqueAll.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-400 ml-1.5">devices</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                        <HiOutlineCheckBadge className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Past 7 days: <strong className="text-emerald-700 font-bold">{data.unique7Days} devices</strong></span>
                    </div>
                </div>

                {/* Daily Activity */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity Today</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <HiOutlineSignal className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{data.visitsToday.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-400 ml-1.5">today</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                        <HiOutlineUsers className="w-3.5 h-3.5 text-amber-500" />
                        <span>Active today: <strong className="text-amber-700 font-bold">{data.uniqueToday} devices</strong></span>
                    </div>
                </div>

                {/* Technician Satisfaction */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">User Rating</span>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <HiOutlineStar className="w-5 h-5 fill-purple-600" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{data.feedbackRating}</span>
                        <span className="text-sm font-bold text-amber-500">/ 5.0</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                        <HiOutlineSparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Based on <strong className="text-purple-700 font-bold">{data.feedbackCount} reviews</strong></span>
                    </div>
                </div>
            </div>

            {/* Devices & Top Diagnostics Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Device Breakdown */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Device Breakdown</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-6">
                            Breakdown of technician diagnostic sessions across mobile, tablet, and desktop devices.
                        </p>

                        <div className="space-y-4">
                            {data.deviceStats.length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-4 text-center">No device traffic recorded yet</p>
                            ) : (
                                data.deviceStats.map((item) => {
                                    const pct = Math.round((item.count / totalDeviceVisits) * 100);
                                    const isMobile = item.device.toLowerCase() === 'mobile';
                                    const isTablet = item.device.toLowerCase() === 'tablet';

                                    return (
                                        <div key={item.device} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span className="flex items-center gap-2 text-slate-700">
                                                    {isMobile && <HiOutlineDevicePhoneMobile className="w-4 h-4 text-blue-500" />}
                                                    {isTablet && <HiOutlineDevicePhoneMobile className="w-4 h-4 text-purple-500" />}
                                                    {!isMobile && !isTablet && <HiOutlineComputerDesktop className="w-4 h-4 text-emerald-500" />}
                                                    {item.device}
                                                </span>
                                                <span className="text-slate-900 font-bold">{item.count} ({pct}%)</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isMobile ? 'bg-blue-500' : isTablet ? 'bg-purple-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Diagnosed Machines */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900">Top Diagnosed Machines</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">
                        Equipment models most frequently selected for fault diagnoses.
                    </p>

                    <div className="space-y-3.5">
                        {data.topProducts.length === 0 ? (
                            <p className="text-sm text-slate-400 italic py-8 text-center">No machine selections recorded yet</p>
                        ) : (
                            data.topProducts.map((p, idx) => {
                                const barWidth = Math.max(8, Math.round((p.count / maxProductCount) * 100));
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-800 truncate max-w-[200px]" title={p.name}>
                                                <span className="text-slate-400 mr-1.5 font-normal">#{idx + 1}</span>
                                                {p.name}
                                            </span>
                                            <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md text-[11px]">
                                                {p.count} hits
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Top Investigated Faults */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900">Top Investigated Faults</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">
                        Most common symptoms and alarms technicians looked up solutions for.
                    </p>

                    <div className="space-y-3.5">
                        {data.topFaults.length === 0 ? (
                            <p className="text-sm text-slate-400 italic py-8 text-center">No fault diagnoses recorded yet</p>
                        ) : (
                            data.topFaults.map((f, idx) => {
                                const barWidth = Math.max(8, Math.round((f.count / maxFaultCount) * 100));
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-800 truncate max-w-[200px]" title={f.name}>
                                                <span className="text-slate-400 mr-1.5 font-normal">#{idx + 1}</span>
                                                {f.name}
                                            </span>
                                            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                                                {f.count} hits
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Live Activity Stream Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Recent Technician Activity</h3>
                        <p className="text-xs text-slate-500">Live stream of the 25 most recent page visits and diagnostic searches</p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                        Showing last {data.recentVisits.length} events
                    </span>
                </div>

                {data.recentVisits.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <HiOutlineWrenchScrewdriver className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">Waiting for live traffic</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            When users visit <code className="text-red-500 font-mono">hemmts.academythriveni.com</code> or diagnose faults, their actions will stream here in real time.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">Time (IST)</th>
                                    <th className="px-6 py-3.5">Machine Model</th>
                                    <th className="px-6 py-3.5">Fault Investigated</th>
                                    <th className="px-6 py-3.5">Device</th>
                                    <th className="px-6 py-3.5">Browser</th>
                                    <th className="px-6 py-3.5">Path</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.recentVisits.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap font-mono">
                                            {formatTimestamp(visit.createdAt)}
                                        </td>
                                        <td className="px-6 py-3.5 font-bold text-slate-800">
                                            {visit.productName ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-red-50 text-red-700 font-medium">
                                                    {visit.productName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Homepage Overview</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 font-medium text-slate-700">
                                            {visit.faultName ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-medium">
                                                    {visit.faultName}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                                visit.device === 'Mobile'
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : visit.device === 'Tablet'
                                                    ? 'bg-purple-50 text-purple-700'
                                                    : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                                {visit.device}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            {visit.browser}
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                                            {visit.path}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
