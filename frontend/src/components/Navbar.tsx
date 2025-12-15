'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="fixed w-full z-50 top-0 bg-slate-900 border-b border-white/10 transition-colors duration-300"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 sm:gap-3 group z-50">
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.3 }}
                                className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center p-0.5"
                            >
                                <span className="text-white font-bold text-lg">S</span>
                            </motion.div>
                            <span className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                                StreamX
                            </span>
                        </Link>

                        {/* Search - Desktop Only */}
                        <motion.form
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            onSubmit={handleSearch}
                            className="hidden md:flex flex-1 max-w-lg mx-12"
                        >
                            <div className="relative w-full group">
                                <input
                                    type="text"
                                    placeholder="Search for courses, lessons..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-slate-800 transition-all"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                        </motion.form>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-6">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/courses"
                                    className={`text-sm font-medium transition-colors ${pathname === '/courses' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Courses
                                </Link>
                            </motion.div>

                            {loading ? (
                                <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                            ) : user ? (
                                <div className="flex items-center gap-6">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Link
                                            href="/my-learning"
                                            className={`text-sm font-medium transition-colors ${pathname === '/my-learning' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            My Learning
                                        </Link>
                                    </motion.div>

                                    <div className="h-6 w-px bg-slate-800" />

                                    <div className="relative group">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex items-center gap-3 focus:outline-none"
                                        >
                                            <div className="text-right hidden sm:block">
                                                <p className="text-sm font-medium text-white">{user.name}</p>
                                            </div>
                                            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        </motion.button>

                                        <div className="absolute right-0 mt-2 w-56 p-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform">
                                            <div className="px-3 py-3 border-b border-white/10 mb-1">
                                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Signed in as</p>
                                                <p className="text-sm text-white truncate">{user.email}</p>
                                            </div>

                                            <Link href="/my-learning" className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                                                My Learning
                                            </Link>
                                            {user.roles && user.roles.includes('ADMIN') && (
                                                <Link href="/admin" className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                                                    Admin Dashboard
                                                </Link>
                                            )}

                                            <div className="h-px bg-white/10 my-1" />

                                            <button
                                                onClick={logout}
                                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-md transition-colors"
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
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Link
                                            href="/register"
                                            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors inline-block"
                                        >
                                            Get Started
                                        </Link>
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors z-50"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeMobileMenu}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 border-l border-white/10 z-40 md:hidden overflow-y-auto"
                        >
                            <div className="p-6 space-y-6">
                                {/* Mobile Search */}
                                <form onSubmit={handleSearch} className="w-full">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            placeholder="Search courses..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    </div>
                                </form>

                                {/* Mobile Nav Links */}
                                <nav className="space-y-2">
                                    <Link
                                        href="/courses"
                                        onClick={closeMobileMenu}
                                        className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/courses' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        Courses
                                    </Link>

                                    {user && (
                                        <Link
                                            href="/my-learning"
                                            onClick={closeMobileMenu}
                                            className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/my-learning' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            My Learning
                                        </Link>
                                    )}

                                    {user?.roles?.includes('ADMIN') && (
                                        <Link
                                            href="/admin"
                                            onClick={closeMobileMenu}
                                            className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/admin' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            Admin Dashboard
                                        </Link>
                                    )}
                                </nav>

                                <div className="h-px bg-white/10" />

                                {/* User Section */}
                                {loading ? (
                                    <div className="h-20 bg-slate-800 rounded-lg animate-pulse" />
                                ) : user ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg">
                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                logout();
                                                closeMobileMenu();
                                            }}
                                            className="w-full px-4 py-3 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 font-medium transition-colors"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Link
                                            href="/login"
                                            onClick={closeMobileMenu}
                                            className="block w-full px-4 py-3 rounded-lg text-center font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={closeMobileMenu}
                                            className="block w-full px-4 py-3 rounded-lg text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );

}
