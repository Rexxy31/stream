'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Play,
    Video,
    CheckCircle,
    ChevronLeft,
    Maximize,
    Minimize,
    List
} from 'lucide-react';

export default function WatchPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [lesson, setLesson] = useState<{ id: string; title: string; duration: string | null; resourcePath: string | null } | null>(null);
    const [progress, setProgress] = useState<{ watchedSeconds: number; completed: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Video player state
    const [useCustomPlayer, setUseCustomPlayer] = useState(true);
    const [lastSavedTime, setLastSavedTime] = useState(0);

    // Initial load
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/lessons/${lessonId}`).then(res => res.json()),
            api.getProgressForLesson(lessonId).catch(() => null),
        ])
            .then(([lessonData, progressData]) => {
                setLesson(lessonData);
                setProgress(progressData);

                // Set initial start time if we have progress
                if (progressData?.watchedSeconds && videoRef.current) {
                    videoRef.current.currentTime = progressData.watchedSeconds;
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [lessonId, user, router]);

    // Resume video when it's ready, if previously watched
    const handleVideoLoaded = () => {
        if (videoRef.current && progress?.watchedSeconds) {
            // Only seek if we're at the beginning (prevent loop seeking)
            if (videoRef.current.currentTime < 1) {
                videoRef.current.currentTime = progress.watchedSeconds;
            }
        }
    };

    // Throttle progress updates (every 10 seconds)
    const handleTimeUpdate = useCallback(async () => {
        if (!videoRef.current || !lesson) return;

        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;

        // Auto-complete if > 90% watched
        if (duration && (currentTime / duration) > 0.9 && !progress?.completed) {
            await api.markLessonComplete(lessonId);
            setProgress(prev => prev ? { ...prev, completed: true } : { watchedSeconds: currentTime, completed: true });
        }

        // Save progress every 10 seconds
        if (Math.abs(currentTime - lastSavedTime) > 10) {
            setLastSavedTime(currentTime);
            // Only update backend if not completed (optimization)
            if (!progress?.completed) {
                await api.updateProgress(lessonId, Math.round(currentTime));
                setProgress(prev => prev ? { ...prev, watchedSeconds: currentTime } : { watchedSeconds: currentTime, completed: false });
            }
        }
    }, [lastSavedTime, progress?.completed, lessonId, lesson]);

    const handleVideoError = () => {
        console.warn("Direct video playback failed, falling back to iframe embed");
        setUseCustomPlayer(false);
    };

    const handleMarkComplete = async () => {
        await api.markLessonComplete(lessonId);
        setProgress((prev) => prev ? { ...prev, completed: true } : { watchedSeconds: 0, completed: true });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-400">Loading lesson...</p>
                </div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-10 h-10 text-slate-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-300 mb-2">Lesson not found</h2>
                    <p className="text-slate-500 mb-6">The lesson you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white font-medium transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                        Browse Courses
                    </Link>
                </div>
            </div>
        );
    }

    const driveFileId = lesson.resourcePath || lesson.duration;
    const hasVideo = driveFileId && driveFileId.length > 10 && !driveFileId.includes('/');

    // Determine video source
    const streamUrl = hasVideo ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/drive/stream/${driveFileId}` : undefined;
    const embedUrl = hasVideo ? `https://drive.google.com/file/d/${driveFileId}/preview` : undefined;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black">
            {/* Top Navigation Bar */}
            <div className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Course</span>
                        </button>

                        {progress?.completed && (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 text-sm font-medium">Completed</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Video Container with Glow Effect */}
            <div className="relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none"></div>

                <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'max-w-7xl mx-auto px-4 pt-6'}`}>
                    <div className={`relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-slate-800 ${isFullscreen ? 'w-full h-full rounded-none' : 'aspect-video'}`}>
                        {hasVideo ? (
                            useCustomPlayer ? (
                                <video
                                    ref={videoRef}
                                    src={streamUrl}
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                    onLoadedMetadata={handleVideoLoaded}
                                    onTimeUpdate={handleTimeUpdate}
                                    onError={handleVideoError}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="autoplay; encrypted-media; fullscreen"
                                    allowFullScreen
                                    title={lesson.title}
                                />
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
                                        <Video className="w-12 h-12 text-slate-600" />
                                    </div>
                                    <p className="text-slate-400 text-lg">Video not available</p>
                                    <p className="text-slate-600 text-sm mt-2">Please check back later</p>
                                </div>
                            </div>
                        )}

                        {/* Fullscreen Toggle Button */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="absolute bottom-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-white transition-colors z-10"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lesson Info Section */}
            {!isFullscreen && (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <h1 className="text-3xl font-bold text-white mb-4">{lesson.title}</h1>

                            {progress && (
                                <div className="flex items-center gap-4 mb-6">
                                    {progress.completed ? (
                                        <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle className="w-5 h-5" />
                                            <span>You&apos;ve completed this lesson</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Play className="w-5 h-5" />
                                            {useCustomPlayer ? (
                                                <span>Resume from {Math.floor(progress.watchedSeconds / 60)}:{String(Math.floor(progress.watchedSeconds % 60)).padStart(2, '0')}</span>
                                            ) : (
                                                <span>Progress tracking unavailable for this video</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Description Card */}
                            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                                <h3 className="text-lg font-semibold text-white mb-3">About this lesson</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Watch this video to learn key concepts and techniques. Take your time and feel free to pause, rewind, or re-watch sections as needed.
                                </p>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Progress Card */}
                            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Your Progress</h3>

                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">Completion</span>
                                        <span className="text-white font-medium">{progress?.completed ? '100%' : '0%'}</span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${progress?.completed ? 'w-full bg-gradient-to-r from-green-500 to-emerald-400' : 'w-0 bg-gradient-to-r from-purple-500 to-pink-500'}`}
                                            // Fallback width calculation for custom player
                                            style={{ width: progress?.completed ? '100%' : `${useCustomPlayer && lesson?.duration ? ((progress?.watchedSeconds || 0) / (parseInt(lesson.duration) || 3600)) * 100 : '5'}%` }}
                                        />
                                    </div>
                                </div>

                                {!progress?.completed && (
                                    <button
                                        onClick={handleMarkComplete}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Mark as Complete
                                    </button>
                                )}

                                {progress?.completed && (
                                    <div className="flex items-center justify-center gap-2 text-green-400 py-3">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Lesson Complete!</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                                <button
                                    onClick={() => router.back()}
                                    className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white py-2 transition-colors"
                                >
                                    <List className="w-5 h-5" />
                                    View All Lessons
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Exit Fullscreen Button (when in fullscreen) */}
            {isFullscreen && (
                <button
                    onClick={() => setIsFullscreen(false)}
                    className="fixed top-4 right-4 z-50 p-3 bg-slate-900/90 hover:bg-slate-800 rounded-full text-white transition-colors"
                >
                    <Minimize className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}
