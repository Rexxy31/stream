'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Upload, Users, BookOpen, Package, MonitorPlay, GraduationCap } from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalCourses: number;
    totalModules: number;
    totalLessons: number;
    totalEnrollments: number;
}

interface UserData {
    id: string;
    email: string;
    name: string;
    roles: string[];
    createdAt: string | null;
}

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm(`Import course from ${file.name}? This might take a moment.`)) {
            e.target.value = '';
            return;
        }

        setImporting(true);
        const importPromise = api.importCourse(file);

        toast.promise(importPromise, {
            loading: 'Importing course...',
            success: (res) => {
                window.location.reload();
                return res.message;
            },
            error: (err) => `Import failed: ${err.message}`
        });

        try {
            await importPromise;
        } catch (error) {
            console.error(error);
        } finally {
            setImporting(false);
            if (e.target) e.target.value = '';
        }
    };

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        // Fetch admin data
        Promise.all([
            fetch('http://localhost:8080/api/admin/stats', {
                headers: { Authorization: `Bearer ${api.getToken()}` }
            }).then(res => {
                if (res.status === 403) throw new Error('Not authorized');
                return res.json();
            }),
            fetch('http://localhost:8080/api/admin/users', {
                headers: { Authorization: `Bearer ${api.getToken()}` }
            }).then(res => {
                if (res.status === 403) throw new Error('Not authorized');
                return res.json();
            })
        ])
            .then(([statsData, usersData]) => {
                setStats(statsData);
                setUsers(usersData);
            })
            .catch((err) => {
                setError(err.message || 'Failed to load admin data');
            })
            .finally(() => setLoading(false));
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-lg">
                    <h2 className="font-semibold mb-2">Access Denied</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-slate-400">Manage your streaming platform</p>
                    </div>
                    <div>
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            id="csvUpload"
                            onChange={handleImport}
                            disabled={importing}
                        />
                        <label
                            htmlFor="csvUpload"
                            className={`cursor-pointer px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-bold shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 ${importing ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {importing ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Import Course (CSV)
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                    <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users className="w-8 h-8 text-purple-400" />} color="purple" />
                    <StatCard title="Courses" value={stats?.totalCourses || 0} icon={<BookOpen className="w-8 h-8 text-pink-400" />} color="pink" />
                    <StatCard title="Modules" value={stats?.totalModules || 0} icon={<Package className="w-8 h-8 text-blue-400" />} color="blue" />
                    <StatCard title="Lessons" value={stats?.totalLessons || 0} icon={<MonitorPlay className="w-8 h-8 text-green-400" />} color="green" />
                    <StatCard title="Enrollments" value={stats?.totalEnrollments || 0} icon={<GraduationCap className="w-8 h-8 text-orange-400" />} color="orange" />
                </div>

                {/* Users Table */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h2 className="text-2xl font-bold">Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Roles</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {users.map((userData) => (
                                    <tr key={userData.id} className="hover:bg-slate-700/20">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-medium">
                                                    {userData.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-medium">{userData.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{userData.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {userData.roles?.map((role) => (
                                                    <span
                                                        key={role}
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${role === 'ADMIN'
                                                            ? 'bg-purple-500/20 text-purple-400'
                                                            : 'bg-slate-600/50 text-slate-300'
                                                            }`}
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
    const colorClasses: Record<string, string> = {
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
        pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/20',
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
        green: 'from-green-500/20 to-green-600/10 border-green-500/20',
        orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}>
            <div className="mb-2">{icon}</div>
            <div className="text-3xl font-bold">{value.toLocaleString()}</div>
            <div className="text-slate-400">{title}</div>
        </div>
    );
}
