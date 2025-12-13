'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Search, ChevronRight, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import ContributionGraph from '@/components/ContributionGraph';

export interface Enrollment {
    id: string;
    courseId: string;
    courseTitle: string;
    courseDescription?: string;
    courseCategory?: string;
    status: string;
    enrolledAt: string;
    progress: number;
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
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12">
                        <Skeleton className="h-10 w-48 mb-4" />
                        <Skeleton className="h-6 w-64" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
                                <Skeleton className="h-40 w-full" />
                                <div className="p-5 space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <div className="flex justify-between pt-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                My Learning
                            </h1>
                            <p className="text-slate-400 text-lg">Continue where you left off</p>
                        </div>
                        <div className="w-full md:w-auto">
                            <ContributionGraph />
                        </div>
                    </div>
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
                                className="group bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden hover:border-purple-500/50 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
                            >
                                {/* Course Image Placeholder */}
                                <div className="h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20 relative overflow-hidden group-hover:from-purple-900/30 group-hover:to-pink-900/30 transition-colors">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                                            <BookOpen className="w-8 h-8 text-purple-400" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-xs font-medium text-slate-300">
                                            {enrollment.courseCategory}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${enrollment.status === 'COMPLETED'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                            }`}>
                                            {enrollment.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${enrollment.progress}%` }} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="font-bold text-xl text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-1">
                                        {enrollment.courseTitle}
                                    </h3>
                                    <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">
                                        {enrollment.courseDescription}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                        <span className="text-xs text-slate-500 font-mono">
                                            Started {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-2 text-white text-sm font-bold group-hover:translate-x-1 transition-transform">
                                            Resume Learning
                                            <ChevronRight className="w-4 h-4 text-purple-400" />
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
