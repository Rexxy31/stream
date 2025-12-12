'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Search, ChevronRight, Clock } from 'lucide-react';

export interface Enrollment {
    id: string;
    courseId: string;
    courseTitle: string;
    courseDescription?: string;
    courseCategory?: string;
    status: string;
    enrolledAt: string;
}

export default function MyLearningPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        api.getEnrollments()
            .then(setEnrollments)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-400">Loading your courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        My Learning
                    </h1>
                    <p className="text-slate-400 text-lg">Continue where you left off</p>
                </div>

                {enrollments.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-12 h-12 text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-300 mb-3">No courses yet</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Start your learning journey today! Browse our catalog and enroll in courses that interest you.
                        </p>
                        <Link
                            href="/courses"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-purple-500/25"
                        >
                            <Search className="w-5 h-5" />
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrollments.map((enrollment) => (
                            <Link
                                key={enrollment.id}
                                href={`/courses/${enrollment.courseId}`}
                                className="group bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                            >
                                {/* Course Image Placeholder */}
                                <div className="h-40 bg-gradient-to-br from-purple-600/20 to-pink-600/20 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <BookOpen className="w-8 h-8 text-purple-400" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-slate-900/80 backdrop-blur rounded-full text-xs font-medium text-slate-300">
                                            {enrollment.courseCategory}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${enrollment.status === 'COMPLETED'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-purple-500/20 text-purple-400'
                                            }`}>
                                            {enrollment.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-semibold text-lg text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                                        {enrollment.courseTitle}
                                    </h3>
                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                                        {enrollment.courseDescription}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">
                                            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                                            Continue
                                            <ChevronRight className="w-4 h-4" />
                                        </span>
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
