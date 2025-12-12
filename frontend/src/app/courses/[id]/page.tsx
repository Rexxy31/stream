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
    modules: Module[];
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
                // Try "Part X"
                const partMatch = title.match(/Part\s+(\d+)/i);
                if (partMatch) return parseInt(partMatch[1], 10);

                // Try "X- Title" or "X. Title"
                const prefixMatch = title.match(/^(\d+)[-.]/);
                if (prefixMatch) return parseInt(prefixMatch[1], 10);

                return 999999; // Fallback for non-numbered items
            };

            const sortItems = <T extends { title: string }>(items: T[]): T[] => {
                return [...items].sort((a, b) => {
                    const idxA = getSortIndex(a.title);
                    const idxB = getSortIndex(b.title);

                    if (idxA !== idxB) return idxA - idxB;
                    return a.title.localeCompare(b.title);
                });
            };

            // Apply Sorting
            courseData.modules = sortItems(courseData.modules);
            courseData.modules.forEach(mod => {
                mod.lessonGroups = sortItems(mod.lessonGroups);
                mod.lessonGroups.forEach(group => {
                    group.lessons = sortItems(group.lessons);
                });
            });

            setCourse(courseData);





            // Check enrollment
            if (user) {
                if (user.roles.includes('ADMIN')) {
                    setEnrolled(true);
                } else {
                    try {
                        const enrollmentData = await api.checkEnrollment(courseId);
                        setEnrolled(enrollmentData.enrolled);
                    } catch {
                        setEnrolled(false);
                    }
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

    // Handle default expansion once
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
            await loadCourse(); // Refresh data
        } catch (error) {
            throw error; // Re-throw to be caught by modal
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
                <div className="max-w-6xl mx-auto animate-pulse">
                    <div className="h-10 bg-slate-800 rounded w-1/2 mb-4" />
                    <div className="h-6 bg-slate-800 rounded w-3/4 mb-8" />
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
        <div className="min-h-screen py-24 px-4 bg-slate-950 relative overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header Card */}
                <div className="glass rounded-3xl p-8 md:p-12 mb-12 border-purple-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1.5 bg-purple-500/20 border border-purple-500/20 text-purple-300 rounded-full text-sm font-bold tracking-wide uppercase mb-6">
                            {course.category}
                        </span>

                        <div className="flex items-start justify-between gap-4 mb-6">
                            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight flex-1">
                                {course.title}
                            </h1>
                            {isAdmin && (
                                <button
                                    onClick={() => setEditModal({ isOpen: true, type: 'course', id: course.id, initialData: { title: course.title, description: course.description, category: course.category } })}
                                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <p className="text-xl text-slate-300 mb-8 max-w-3xl leading-relaxed">{course.description}</p>

                        <div className="flex flex-wrap items-center gap-8 text-slate-400 mb-8">
                            <span className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
                                <BookOpen className="w-5 h-5 text-purple-400" />
                                <span className="font-medium text-slate-200">{course.modules.length}</span> Modules
                            </span>
                            <span className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
                                <PlayCircle className="w-5 h-5 text-pink-400" />
                                <span className="font-medium text-slate-200">{getTotalLessons()}</span> Lessons
                            </span>
                        </div>

                        {!enrolled ? (
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] disabled:opacity-50"
                            >
                                {enrolling ? 'Enrolling...' : 'Enroll Now - Free'}
                                <ArrowRight className="ml-2 w-5 h-5 inline-block transition-transform group-hover:translate-x-1" />
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-bold text-lg">
                                <CheckCircle className="w-6 h-6" />
                                Enrolled
                            </span>
                        )}
                    </div>
                </div>

                {/* Course Content */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold mb-8 text-white">Course Content</h2>

                    {course.modules.map((module, moduleIndex) => (
                        <div key={module.id} className="glass-card rounded-2xl overflow-hidden border border-slate-800">
                            <div className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                                <button onClick={() => toggleModule(module.id)} className="flex items-center gap-6 flex-1 text-left">
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center border border-slate-700 shadow-inner">
                                        <span className="text-purple-400 font-bold text-lg">{moduleIndex + 1}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xl font-bold text-slate-200 mb-1">{module.title}</span>
                                        <span className="text-sm text-slate-500">{module.lessonGroups.reduce((acc, g) => acc + g.lessons.length, 0)} Lessons</span>
                                    </div>
                                </button>

                                <div className="flex items-center gap-4">
                                    {isAdmin && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditModal({ isOpen: true, type: 'module', id: module.id, initialData: { title: module.title } });
                                            }}
                                            className="p-2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center transition-transform duration-300 pointer-events-none ${expandedModules.has(module.id) ? 'rotate-180 bg-purple-500/20 text-purple-400' : 'text-slate-500'}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Animated Content Expansion */}
                            <div className={`transition-all duration-300 ease-in-out ${expandedModules.has(module.id) ? 'max-h-[60vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                <div className="border-t border-slate-800 bg-black/20">
                                    {module.lessonGroups.map((group) => (
                                        <div key={group.id} className="border-b border-slate-800/50 last:border-b-0">
                                            {group.title !== "Default Group" ? (
                                                <button
                                                    onClick={() => toggleLessonGroup(group.id)}
                                                    className="w-full flex items-center justify-between px-6 py-3 bg-slate-900/50 border-b border-slate-800/30 hover:bg-slate-900/80 transition-colors"
                                                >
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group.title}</span>
                                                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedLessonGroups.has(group.id) ? 'rotate-180' : ''}`} />
                                                </button>
                                            ) : null}
                                            <div className={`overflow-hidden transition-all duration-300 ${group.title !== "Default Group" ? (expandedLessonGroups.has(group.id) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0') : 'max-h-full opacity-100'}`}>
                                                <div className="divide-y divide-slate-800/30">
                                                    {group.lessons.map((lesson) => (
                                                        <div key={lesson.id} className="group/lesson flex items-center justify-between px-8 py-5 hover:bg-white/5 transition-colors">
                                                            <Link
                                                                href={enrolled ? `/watch/${lesson.id}` : '#'}
                                                                className={`flex items-center gap-4 flex-1 transition-all ${enrolled
                                                                    ? 'cursor-pointer'
                                                                    : 'opacity-50 cursor-not-allowed grayscale'
                                                                    }`}
                                                                onClick={(e) => !enrolled && e.preventDefault()}
                                                            >
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${enrolled ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                                                                    {enrolled ? (
                                                                        <Play className="w-4 h-4" />
                                                                    ) : (
                                                                        <Lock className="w-4 h-4" />
                                                                    )}
                                                                </div>
                                                                <span className="text-slate-300 font-medium group-hover/lesson:text-purple-300 transition-colors">{lesson.title}</span>
                                                                <span className="text-sm text-slate-600">{lesson.duration ? lesson.duration : 'Video'}</span>
                                                            </Link>

                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => setEditModal({ isOpen: true, type: 'lesson', id: lesson.id, initialData: { title: lesson.title, description: lesson.description } })}
                                                                    className="opacity-0 group-hover/lesson:opacity-100 p-2 text-slate-500 hover:text-white transition-all ml-4"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <EditContentModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ ...editModal, isOpen: false })}
                onSave={handleSaveContent}
                type={editModal.type}
                initialData={editModal.initialData}
            />
        </div>
    );
}
