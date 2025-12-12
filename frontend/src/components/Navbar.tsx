'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const pathname = usePathname();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    return (
        <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-slate-950/70 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
                            StreamX
                        </span>
                    </Link>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-12">
                        <div className="relative w-full group">
                            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            <input
                                type="text"
                                placeholder="Search for courses, lessons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="relative w-full bg-slate-900/50 border border-slate-700/50 rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-slate-900/80 transition-all focus:ring-4 focus:ring-purple-500/10"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        </div>
                    </form>

                    {/* Nav Links */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/courses"
                            className={`text-sm font-medium transition-colors ${pathname === '/courses' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Courses
                        </Link>

                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse ring-2 ring-slate-800" />
                        ) : user ? (
                            <div className="flex items-center gap-6">
                                <Link
                                    href="/my-learning"
                                    className={`text-sm font-medium transition-colors ${pathname === '/my-learning' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    My Learning
                                </Link>

                                <div className="h-6 w-px bg-slate-800" />

                                <div className="relative group">
                                    <button className="flex items-center gap-3 focus:outline-none">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-medium text-white group-hover:text-purple-200 transition-colors">{user.name}</p>
                                        </div>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[1px] shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                                <span className="text-sm font-bold text-white">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="absolute right-0 mt-4 w-56 p-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                        <div className="px-3 py-3 border-b border-slate-700/50 mb-1">
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Signed in as</p>
                                            <p className="text-sm text-white truncate">{user.email}</p>
                                        </div>

                                        <Link href="/my-learning" className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors">
                                            My Learning
                                        </Link>
                                        <Link href="/admin" className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors">
                                            Admin Dashboard
                                        </Link>

                                        <div className="h-px bg-slate-700/50 my-1" />

                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="group relative px-5 py-2.5 rounded-full overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:opacity-90 transition-opacity" />
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative text-sm font-bold text-white">Get Started</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
