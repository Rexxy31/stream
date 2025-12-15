'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import EditContentModal, { SaveData } from '@/components/EditContentModal';
import {
    BookOpen,
    PlayCircle,
    CheckCircle,
    Edit2,
    ChevronDown,
    Play,
    Lock,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

// Shared Types
interface Lesson {
    id: string;
    title: string;
    duration: string | null;
    resourcePath: string | null;
    description?: string;
}

interface LessonGroup {
    id: string;
    title: string;
    duration: string | null;
    lessons: Lesson[];
}

interface Module {
    id: string;
    title: string;
    duration: string | null;
    lessonGroups: LessonGroup[];
}

interface CourseHierarchy {
    id: string;
    title: string;
    description: string;
    category: string;
    tags?: string[];
    duration: string | null;
    modules: Module[];
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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
};

interface ProgressDTO {
    lessonId: string;
    completed: boolean;
    watchedSeconds: number;
    totalDurationSeconds: number;
    lastWatchedAt?: string;
}

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;
    const { user } = useAuth();
    const isAdmin = user?.roles.includes('ADMIN');

    const [course, setCourse] = useState<CourseHierarchy | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolled, setEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [expandedLessonGroups, setExpandedLessonGroups] = useState<Set<string>>(new Set());
    const [progressMap, setProgressMap] = useState<Map<string, ProgressDTO>>(new Map());
    const [lastWatchedLessonId, setLastWatchedLessonId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [editModal, setEditModal] = useState<{
        isOpen: boolean;
        type: 'course' | 'module' | 'lesson';
        id: string;
        initialData: SaveData;
    }>({ isOpen: false, type: 'course', id: '', initialData: { title: '' } });

    const loadCourse = useCallback(async () => {
        try {
            const courseData = await api.getCourseHierarchy(courseId);

            // Sorting Helper
            const getSortIndex = (title: string): number => {
                const partMatch = title.match(/Part\s+(\d+)/i);
                if (partMatch) return parseInt(partMatch[1], 10);

                const prefixMatch = title.match(/^(\d+)[-.]/);
                if (prefixMatch) return parseInt(prefixMatch[1], 10);

                return 999999;
            };

            const sortItems = <T extends { title: string }>(items: T[]): T[] => {
                return [...items].sort((a, b) => {
                    const idxA = getSortIndex(a.title);
                    const idxB = getSortIndex(b.title);

                    if (idxA !== idxB) return idxA - idxB;
                    return a.title.localeCompare(b.title);
                });
            };

            courseData.modules = sortItems(courseData.modules);
            courseData.modules.forEach(mod => {
                mod.lessonGroups = sortItems(mod.lessonGroups);
                mod.lessonGroups.forEach(group => {
                    group.lessons = sortItems(group.lessons);
                });
            });

            setCourse(courseData);

            // Fetch progress if user is logged in
            if (user) {
                try {
                    const progressData: ProgressDTO[] = await api.get(`/api/progress/course/${courseId}`);
                    const map = new Map<string, ProgressDTO>();
                    progressData.forEach(p => map.set(p.lessonId, p));
                    setProgressMap(map);

                    // Find last watched
                    if (progressData.length > 0) {
                        const sorted = [...progressData].sort((a, b) => {
                            const dateA = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : 0;
                            const dateB = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : 0;
                            return dateB - dateA;
                        });
                        const lastId = sorted[0].lessonId;
                        setLastWatchedLessonId(lastId);

                        // Auto-expand hierarchy to show last watched
                        if (courseData) {
                            courseData.modules.forEach(m => {
                                m.lessonGroups.forEach(g => {
                                    if (g.lessons.some(l => l.id === lastId)) {
                                        setExpandedModules(prev => new Set(prev).add(m.id));
                                        setExpandedLessonGroups(prev => new Set(prev).add(g.id));
                                    }
                                });
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch progress", err);
                }
            }

            if (user) {
                try {
                    const enrollmentData = await api.checkEnrollment(courseId);
                    setEnrolled(enrollmentData.enrolled);
                } catch {
                    setEnrolled(false);
                }
            }
        } catch (error) {
            console.error('Failed to load course:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [courseId, user]);

    const hasSetDefaultExpansion = useRef(false);

    useEffect(() => {
        loadCourse();
    }, [loadCourse]);

    useEffect(() => {
        if (course && course.modules.length > 0 && !hasSetDefaultExpansion.current) {
            setExpandedModules(new Set([course.modules[0].id]));
            hasSetDefaultExpansion.current = true;
        }
    }, [course]);

    const toggleLessonGroup = (groupId: string) => {
        setExpandedLessonGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const handleEnroll = async () => {
        if (!user) {
            window.location.href = '/login';
            return;
        }
        setEnrolling(true);
        try {
            await api.enroll(courseId);
            setEnrolled(true);
        } catch (error) {
            console.error('Enrollment failed:', error);
        } finally {
            setEnrolling(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    const handleSaveContent = async (data: SaveData) => {
        try {
            if (editModal.type === 'course') {
                await api.updateCourse(editModal.id, data);
            } else if (editModal.type === 'module') {
                await api.updateModule(editModal.id, data);
            } else if (editModal.type === 'lesson') {
                await api.updateLesson(editModal.id, data);
            }
            await loadCourse();
        } catch (error) {
            throw error;
        }
    };

    const getTotalLessons = () => {
        if (!course) return 0;
        return course.modules.reduce(
            (total, mod) => total + mod.lessonGroups.reduce((t, lg) => t + lg.lessons.length, 0),
            0
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 px-4 bg-slate-950">
                <div className="max-w-6xl mx-auto space-y-12">
                    {/* Header Skeleton */}
                    <div className="p-8 md:p-12 rounded-2xl border border-slate-800 bg-slate-900/20">
                        <Skeleton className="h-6 w-24 rounded-full mb-6" />
                        <div className="flex justify-between items-start mb-6">
                            <Skeleton className="h-16 w-3/4" />
                            <Skeleton className="h-10 w-10 rounded-lg" />
                        </div>
                        <Skeleton className="h-20 w-full mb-8" />
                        <div className="flex gap-4 mb-8">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <Skeleton className="h-14 w-48 rounded-lg" />
                    </div>

                    {/* Content Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48 mb-8" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-4">
                <p className="text-xl text-red-400">Error loading course</p>
                <p className="font-mono bg-slate-900 p-4 rounded text-sm">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
                Course not found
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-24 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
                {/* Header Card */}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-12 border border-white/10 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
                            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase">
                                {course.category}
                            </span>
                            {course.tags?.map(tag => (
                                <span key={tag} className="inline-block px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white tracking-tight flex-1">
                                {course.title}
                            </h1>
                            {isAdmin && (
                                <button
                                    onClick={() => setEditModal({ isOpen: true, type: 'course', id: course.id, initialData: { title: course.title, description: course.description, category: course.category, tags: course.tags } })}
                                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                                >
                                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            )}
                        </div>

                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted mb-6 sm:mb-8 max-w-3xl leading-relaxed">{course.description}</p>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-8 text-slate-400 mb-6 sm:mb-8">
                            <span className="flex items-center gap-2 bg-slate-900 px-3 sm:px-4 py-2 rounded-lg border border-theme text-sm">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                                <span className="font-medium text-white">{course.modules.length}</span> <span className="hidden sm:inline">Modules</span><span className="sm:hidden">Mod</span>
                            </span>
                            <span className="flex items-center gap-2 bg-slate-900 px-3 sm:px-4 py-2 rounded-lg border border-theme text-sm">
                                <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                                <span className="font-medium text-white">{getTotalLessons()}</span> <span className="hidden sm:inline">Lessons</span><span className="sm:hidden">Les</span>
                            </span>
                            {course.duration && (
                                <span className="flex items-center gap-2 bg-slate-900 px-3 sm:px-4 py-2 rounded-lg border border-theme text-sm">
                                    <span className="text-emerald-400 font-mono text-xs sm:text-sm">⏱</span>
                                    <span className="font-medium text-white">{course.duration}</span>
                                </span>
                            )}
                        </div>

                        {!enrolled ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {enrolling ? 'Enrolling...' : 'Enroll Now - Free'}
                                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 inline-block transition-transform group-hover:translate-x-1" />
                            </motion.button>
                        ) : (
                            <span className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg font-bold text-base sm:text-lg">
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Enrolled
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Course Content */}
                <div className="space-y-4 sm:space-y-6">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white tracking-tight"
                    >
                        Course Content
                    </motion.h2>

                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {course.modules.map((module, moduleIndex) => (
                            <motion.div key={module.id} variants={item} className="bg-slate-900/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-colors">
                                <div className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleModule(module.id)}>
                                    <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 font-mono text-indigo-400 font-bold text-sm sm:text-base flex-shrink-0">
                                            {moduleIndex + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base sm:text-lg md:text-xl font-bold group-hover:text-indigo-400 transition-colors flex flex-col sm:flex-row sm:items-center gap-2">
                                                <span className="truncate">{module.title}</span>
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    <span className="text-xs sm:text-sm font-normal text-slate-500 bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap">
                                                        {module.lessonGroups.reduce((acc, g) => acc + g.lessons.filter(l => progressMap.get(l.id)?.completed).length, 0)}/
                                                        {module.lessonGroups.reduce((acc, g) => acc + g.lessons.length, 0)} <span className="hidden sm:inline">Completed</span>
                                                    </span>
                                                    {module.duration && (
                                                        <span className="text-xs sm:text-sm font-mono text-slate-500 bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded-md">
                                                            {module.duration}
                                                        </span>
                                                    )}
                                                    {module.lessonGroups.reduce((acc, g) => acc + g.lessons.filter(l => {
                                                        const p = progressMap.get(l.id);
                                                        return !p?.completed && (p?.watchedSeconds || 0) > 0;
                                                    }).length, 0) > 0 && (
                                                            <span className="text-xs sm:text-sm font-normal text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap">
                                                                {module.lessonGroups.reduce((acc, g) => acc + g.lessons.filter(l => {
                                                                    const p = progressMap.get(l.id);
                                                                    return !p?.completed && (p?.watchedSeconds || 0) > 0;
                                                                }).length, 0)} <span className="hidden sm:inline">In Progress</span>
                                                            </span>
                                                        )}
                                                </div>
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditModal({ isOpen: true, type: 'module', id: module.id, initialData: { title: module.title } });
                                                }}
                                                className="p-1.5 sm:p-2 text-slate-500 hover:text-white transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                        )}
                                        <motion.div
                                            animate={{ rotate: expandedModules.has(module.id) ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${expandedModules.has(module.id) ? 'text-white' : 'text-slate-500'}`}
                                        >
                                            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Animated Content Expansion */}
                                <AnimatePresence initial={false}>
                                    {expandedModules.has(module.id) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-theme bg-black/20">
                                                {module.lessonGroups.map((group) => (
                                                    <div key={group.id} className="border-b border-theme last:border-b-0">
                                                        {group.title !== "Default Group" ? (
                                                            <button
                                                                onClick={() => toggleLessonGroup(group.id)}
                                                                className="w-full flex items-center justify-between px-6 py-3 bg-slate-900/30 border-b border-slate-800/30 hover:bg-slate-900/50 transition-colors"
                                                            >
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                                    {group.title}
                                                                    {group.duration && (
                                                                        <span className="text-[10px] sm:text-xs font-mono normal-case bg-slate-800 text-slate-400 px-2 py-0.5 rounded ml-2">
                                                                            {group.duration}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                                                        {group.lessons.filter(l => progressMap.get(l.id)?.completed).length}/{group.lessons.length}
                                                                    </span>
                                                                    {group.lessons.filter(l => {
                                                                        const p = progressMap.get(l.id);
                                                                        return !p?.completed && (p?.watchedSeconds || 0) > 0;
                                                                    }).length > 0 && (
                                                                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                                                                {group.lessons.filter(l => {
                                                                                    const p = progressMap.get(l.id);
                                                                                    return !p?.completed && (p?.watchedSeconds || 0) > 0;
                                                                                }).length} In Progress
                                                                            </span>
                                                                        )}
                                                                </span>
                                                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedLessonGroups.has(group.id) ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        ) : null}

                                                        {/* Nested Lesson Group Expansion */}
                                                        <AnimatePresence initial={false}>
                                                            {(group.title === "Default Group" || expandedLessonGroups.has(group.id)) && (
                                                                <motion.div
                                                                    initial={group.title !== "Default Group" ? { height: 0, opacity: 0 } : false}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="divide-y divide-slate-800/30">
                                                                        {group.lessons.map((lesson) => (
                                                                            <motion.div
                                                                                key={lesson.id}
                                                                                whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                                                                                className="group/lesson flex items-center justify-between px-8 py-4 transition-colors"
                                                                            >
                                                                                <Link
                                                                                    href={enrolled ? `/watch/${lesson.id}` : '#'}
                                                                                    className={`flex items-center gap-4 flex-1 transition-all ${enrolled
                                                                                        ? 'cursor-pointer'
                                                                                        : 'opacity-50 cursor-not-allowed grayscale'
                                                                                        }`}
                                                                                    onClick={(e) => !enrolled && e.preventDefault()}
                                                                                >
                                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${enrolled ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                                                                                        {enrolled ? (
                                                                                            <Play className="w-3.5 h-3.5" />
                                                                                        ) : (
                                                                                            <Lock className="w-3.5 h-3.5" />
                                                                                        )}
                                                                                    </div>
                                                                                    <span className={`font-medium transition-colors text-sm ${progressMap.get(lesson.id)?.completed ? 'text-green-500' :
                                                                                        lesson.id === lastWatchedLessonId ? 'text-indigo-400 font-bold' :
                                                                                            'text-slate-300 group-hover/lesson:text-indigo-300'
                                                                                        }`}>
                                                                                        {lesson.title}
                                                                                    </span>
                                                                                    {lesson.id === lastWatchedLessonId && (
                                                                                        <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-bold ml-2">
                                                                                            RESUME
                                                                                        </span>
                                                                                    )}
                                                                                    {!progressMap.get(lesson.id)?.completed && (progressMap.get(lesson.id)?.watchedSeconds || 0) > 0 && (
                                                                                        <span className="text-[10px] text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded ml-2 font-mono">
                                                                                            {Math.min(100, Math.round(((progressMap.get(lesson.id)?.watchedSeconds || 0) / (progressMap.get(lesson.id)?.totalDurationSeconds || 60)) * 100))}%
                                                                                        </span>
                                                                                    )}
                                                                                </Link>

                                                                                <div className="flex items-center gap-4">
                                                                                    {progressMap.get(lesson.id)?.completed && (
                                                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                                                    )}
                                                                                    <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
                                                                                        {lesson.duration && <span className="text-[10px]">⏱</span>}
                                                                                        {lesson.duration ? lesson.duration : 'Video'}
                                                                                    </span>
                                                                                    {isAdmin && (
                                                                                        <button
                                                                                            onClick={() => setEditModal({ isOpen: true, type: 'lesson', id: lesson.id, initialData: { title: lesson.title, description: lesson.description } })}
                                                                                            className="opacity-0 group-hover/lesson:opacity-100 p-2 text-slate-500 hover:text-white transition-all"
                                                                                        >
                                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
                </div >
            </div >

            <EditContentModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ ...editModal, isOpen: false })}
                onSave={handleSaveContent}
                type={editModal.type}
                initialData={editModal.initialData}
            />
        </div >
    );
}
