'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Upload, Users, BookOpen, Package, MonitorPlay, GraduationCap, Edit2, Trash2, Eye, Shield, ShieldOff, Search, X } from 'lucide-react';
import Link from 'next/link';

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

interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnailUrl?: string;
}

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [courseSearch, setCourseSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'course' | 'user', id: string, name: string } | null>(null);

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

    const handleDeleteCourse = async (id: string) => {
        try {
            await api.deleteCourse(id);
            toast.success('Course deleted successfully');
            setCourses(courses.filter(c => c.id !== id));
            loadData(); // Reload stats
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete course');
        }
        setDeleteConfirm(null);
    };

    const handleDeleteUser = async (id: string) => {
        try {
            await api.deleteUser(id);
            toast.success('User deleted successfully');
            setUsers(users.filter(u => u.id !== id));
            loadData(); // Reload stats
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        }
        setDeleteConfirm(null);
    };

    const handleToggleAdmin = async (userId: string, currentRoles: string[]) => {
        const isAdmin = currentRoles.includes('ADMIN');
        const newRoles = isAdmin
            ? currentRoles.filter(r => r !== 'ADMIN')
            : [...currentRoles, 'ADMIN'];

        try {
            await api.updateUserRoles(userId, newRoles);
            toast.success(isAdmin ? 'Admin role removed' : 'Admin role granted');
            setUsers(users.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user roles');
        }
    };

    const loadData = () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        Promise.all([
            fetch(`${API_URL}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${api.getToken()}` }
            }).then(res => {
                if (res.status === 403) throw new Error('Not authorized');
                return res.json();
            }),
            fetch(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${api.getToken()}` }
            }).then(res => {
                if (res.status === 403) throw new Error('Not authorized');
                return res.json();
            }),
            api.getCourses()
        ])
            .then(([statsData, usersData, coursesData]) => {
                setStats(statsData);
                setUsers(usersData);
                setCourses(coursesData);
            })
            .catch((err) => {
                setError(err.message || 'Failed to load admin data');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        loadData();
    }, [user, authLoading, router]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.category.toLowerCase().includes(courseSearch.toLowerCase())
    );

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
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Admin Dashboard</h1>
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
                            className={`cursor-pointer px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg sm:rounded-xl text-white font-bold shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 text-sm sm:text-base ${importing ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {importing ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">Import Course (CSV)</span>
                                    <span className="sm:hidden">Import</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8 sm:mb-12">
                    <StatCard title="Users" value={stats?.totalUsers || 0} icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />} color="purple" />
                    <StatCard title="Courses" value={stats?.totalCourses || 0} icon={<BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />} color="pink" />
                    <StatCard title="Modules" value={stats?.totalModules || 0} icon={<Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />} color="blue" />
                    <StatCard title="Lessons" value={stats?.totalLessons || 0} icon={<MonitorPlay className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />} color="green" />
                    <StatCard title="Enrollments" value={stats?.totalEnrollments || 0} icon={<GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />} color="orange" />
                </div>

                {/* Courses Management */}
                <div className="bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-700/50 overflow-hidden mb-8">
                    <div className="p-4 sm:p-6 border-b border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl sm:text-2xl font-bold">Courses Management</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={courseSearch}
                                    onChange={(e) => setCourseSearch(e.target.value)}
                                    className="w-full sm:w-64 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:border-purple-500"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                        {filteredCourses.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No courses found</div>
                        ) : (
                            filteredCourses.map((course) => (
                                <div key={course.id} className="p-4 sm:p-6 hover:bg-slate-700/20 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white mb-1 truncate">{course.title}</h3>
                                            <p className="text-sm text-slate-400 line-clamp-2 sm:line-clamp-1">{course.description}</p>
                                            <span className="inline-block mt-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs rounded-full">
                                                {course.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Link
                                                href={`/courses/${course.id}`}
                                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                                title="View Course"
                                            >
                                                <Eye className="w-4 h-4 text-blue-400" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirm({ type: 'course', id: course.id, name: course.title })}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                                                title="Delete Course"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl sm:text-2xl font-bold">Users Management</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="w-full sm:w-64 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:border-purple-500"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block sm:hidden divide-y divide-slate-700/50">
                        {filteredUsers.map((userData) => (
                            <div key={userData.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-medium flex-shrink-0">
                                        {userData.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{userData.name || 'Unknown'}</p>
                                        <p className="text-sm text-slate-400 truncate">{userData.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleAdmin(userData.id, userData.roles)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${userData.roles?.includes('ADMIN')
                                            ? 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400'
                                            : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400'
                                            }`}
                                    >
                                        {userData.roles?.includes('ADMIN') ? (
                                            <>
                                                <ShieldOff className="w-4 h-4 inline mr-1" />
                                                Remove Admin
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-4 h-4 inline mr-1" />
                                                Make Admin
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm({ type: 'user', id: userData.id, name: userData.name })}
                                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Roles</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-400">Created</th>
                                    <th className="px-6 py-3 text-right text-sm font-medium text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredUsers.map((userData) => (
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleAdmin(userData.id, userData.roles)}
                                                    className={`p-2 rounded-lg transition-colors ${userData.roles?.includes('ADMIN')
                                                        ? 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20'
                                                        : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20'
                                                        }`}
                                                    title={userData.roles?.includes('ADMIN') ? 'Remove Admin' : 'Make Admin'}
                                                >
                                                    {userData.roles?.includes('ADMIN') ? (
                                                        <ShieldOff className="w-4 h-4 text-orange-400" />
                                                    ) : (
                                                        <Shield className="w-4 h-4 text-purple-400" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'user', id: userData.id, name: userData.name })}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
                        <p className="text-slate-400 mb-6">
                            Are you sure you want to delete {deleteConfirm.type === 'course' ? 'the course' : 'the user'} <span className="font-semibold text-white">"{deleteConfirm.name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteConfirm.type === 'course'
                                    ? handleDeleteCourse(deleteConfirm.id)
                                    : handleDeleteUser(deleteConfirm.id)
                                }
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg sm:rounded-xl p-4 sm:p-6`}>
            <div className="mb-2">{icon}</div>
            <div className="text-2xl sm:text-3xl font-bold">{value.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">{title}</div>
        </div>
    );
}
