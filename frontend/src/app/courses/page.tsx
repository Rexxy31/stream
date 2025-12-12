'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowRight } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getCourses()
            .then(setCourses)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-slate-950 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Explore Library
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Discover our comprehensive collection of programming courses designed to take you from beginner to expert.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="glass rounded-3xl p-6 h-96 animate-pulse">
                                <div className="h-48 bg-slate-800/50 rounded-2xl mb-6" />
                                <div className="h-6 bg-slate-800/50 rounded-lg w-3/4 mb-4" />
                                <div className="h-4 bg-slate-800/50 rounded-lg w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                className="group relative glass-card rounded-3xl overflow-hidden flex flex-col h-full"
                            >
                                <div className="h-56 relative bg-gradient-to-br from-purple-900/50 to-slate-900/50 group-hover:from-purple-800/50 transition-colors flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl rotate-12 group-hover:rotate-6 transition-transform shadow-2xl flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white">{course.title.charAt(0)}</span>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                                            {course.category}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-slate-400 mb-6 line-clamp-2">
                                        {course.description}
                                    </p>
                                    <div className="mt-auto flex items-center text-sm font-medium text-slate-300 group-hover:translate-x-2 transition-transform">
                                        <span>Start Learning</span>
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
