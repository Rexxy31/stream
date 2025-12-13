'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

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
        <div className="min-h-screen pt-24 pb-12 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
                        Explore Library
                    </h1>
                    <p className="text-lg text-muted max-w-2xl mx-auto">
                        Discover our comprehensive collection of programming courses designed to take you from beginner to expert.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-surface rounded-3xl p-6 h-96 animate-pulse border border-theme">
                                <div className="h-48 bg-slate-800 rounded-2xl mb-6" />
                                <div className="h-6 bg-slate-800 rounded-lg w-3/4 mb-4" />
                                <div className="h-4 bg-slate-800 rounded-lg w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {courses.map((course) => (
                            <motion.div key={course.id} variants={item}>
                                <Link
                                    href={`/courses/${course.id}`}
                                    className="group relative bg-surface border border-theme rounded-2xl overflow-hidden flex flex-col h-full hover:border-indigo-500/50 transition-colors shadow-lg"
                                >
                                    <div className="h-56 relative bg-slate-900 flex items-center justify-center overflow-hidden border-b border-theme">
                                        <div className="w-24 h-24 bg-indigo-600 rounded-2xl rotate-12 group-hover:rotate-6 transition-transform shadow-2xl flex items-center justify-center">
                                            <span className="text-4xl font-bold text-white">{course.title.charAt(0)}</span>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
                                                {course.category}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-indigo-400 transition-colors tracking-tight">
                                            {course.title}
                                        </h3>
                                        <p className="text-muted mb-6 line-clamp-2">
                                            {course.description}
                                        </p>
                                        <div className="mt-auto flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform">
                                            <span>Start Learning</span>
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
