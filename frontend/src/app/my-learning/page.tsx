'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { BookOpen, Clock, CheckCircle2, PlayCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Enrollment {
    id: string;
    courseId: string;
    courseTitle: string;
    courseDescription?: string;
    courseCategory?: string;
    progress?: number;
    lastWatchedLessonId?: string;
    lastWatchedLessonTitle?: string;
    enrolledAt: string;
}

export default function MyLearningPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        // Fetch enrollments
        api.getEnrollments()
            .then(setEnrollments)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user, authLoading, router]);

    const filteredEnrollments = enrollments.filter(enrollment => {
        // Filter by status
        const progress = enrollment.progress ?? 0;
        if (filter === 'in-progress' && (progress === 0 || progress === 100)) {
            return false;
        }
        if (filter === 'completed' && progress !== 100) {
            return false;
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                enrollment.courseTitle.toLowerCase().includes(query) ||
                enrollment.courseDescription?.toLowerCase().includes(query) ||
                enrollment.courseCategory?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const stats = {
        total: enrollments.length,
        inProgress: enrollments.filter(e => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100).length,
        completed: enrollments.filter(e => (e.progress ?? 0) === 100).length,
        notStarted: enrollments.filter(e => (e.progress ?? 0) === 0).length
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 sm:mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-white">
                        My Learning
                    </h1>
                    <p className="text-base sm:text-lg text-slate-400">
                        Track your progress and continue your learning journey
                    </p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card variant="glass" padding="md" hover={false}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                    <p className="text-xs text-slate-400">Total Courses</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card variant="glass" padding="md" hover={false}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                                    <p className="text-xs text-slate-400">In Progress</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card variant="glass" padding="md" hover={false}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.completed}</p>
                                    <p className="text-xs text-slate-400">Completed</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card variant="glass" padding="md" hover={false}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center">
                                    <PlayCircle className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stats.notStarted}</p>
                                    <p className="text-xs text-slate-400">Not Started</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Filters and Search */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 mb-8"
                >
                    {/* Filter Tabs */}
                    <div className="flex gap-2 bg-surface rounded-lg p-1 border border-theme">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('in-progress')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'in-progress'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            In Progress
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'completed'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Completed
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface border border-theme rounded-lg px-4 py-2 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                </motion.div>

                {/* Courses Grid */}
                {filteredEnrollments.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {searchQuery ? 'No courses found' : 'No enrollments yet'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search or filters'
                                : 'Start learning by enrolling in a course'}
                        </p>
                        {!searchQuery && (
                            <Link href="/courses">
                                <Button variant="primary">Browse Courses</Button>
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEnrollments.map((enrollment, index) => (
                            <motion.div
                                key={enrollment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <Link href={`/courses/${enrollment.courseId}`}>
                                    <Card variant="glass" padding="md" hover={true}>
                                        {/* Course Header */}
                                        <div className="mb-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <Badge variant="primary" size="sm">
                                                    {enrollment.courseCategory}
                                                </Badge>
                                                {(enrollment.progress ?? 0) === 100 && (
                                                    <Badge variant="success" size="sm">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Completed
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                                                {enrollment.courseTitle}
                                            </h3>
                                            <p className="text-sm text-slate-400 line-clamp-2">
                                                {enrollment.courseDescription}
                                            </p>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <ProgressBar
                                                value={enrollment.progress ?? 0}
                                                max={100}
                                                variant="gradient"
                                                showLabel
                                            />
                                        </div>

                                        {/* Last Watched */}
                                        {enrollment.lastWatchedLessonTitle && (
                                            <div className="text-xs text-slate-500 mb-4">
                                                Last watched: {enrollment.lastWatchedLessonTitle}
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <Button
                                            variant={(enrollment.progress ?? 0) > 0 ? 'primary' : 'outline'}
                                            size="sm"
                                            className="w-full"
                                            leftIcon={<PlayCircle className="w-4 h-4" />}
                                        >
                                            {(enrollment.progress ?? 0) === 0
                                                ? 'Start Learning'
                                                : (enrollment.progress ?? 0) === 100
                                                    ? 'Review Course'
                                                    : 'Continue Learning'}
                                        </Button>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
