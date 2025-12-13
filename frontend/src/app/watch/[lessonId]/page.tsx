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
    List,
    RotateCcw,
    RotateCw,
    Gauge,
    PictureInPicture,
    Captions,
    Pause,
    Volume2,
    VolumeX,
    Settings,
    Type,
    Palette,
    Move,
    RectangleHorizontal,
    PlayCircle,
    CheckCircle2,
    X,
    PanelRightOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WatchPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;
    const { user, loading: authLoading } = useAuth();

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Data State
    const [lesson, setLesson] = useState<{ id: string; title: string; duration: string | null; resourcePath: string | null; lessonGroupId: string; courseId?: string } | null>(null);
    const [groupLessons, setGroupLessons] = useState<{ id: string; title: string; duration: string | null; orderIndex?: number }[]>([]);
    const [progress, setProgress] = useState<{ watchedSeconds: number; completed: boolean } | null>(null);
    const [loading, setLoading] = useState(true);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.3);
    const [previousVolume, setPreviousVolume] = useState(0.3);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showDrawer, setShowDrawer] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [useCustomPlayer, setUseCustomPlayer] = useState(true);
    const [lastSavedTime, setLastSavedTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    const [showCaptions, setShowCaptions] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [captionText, setCaptionText] = useState('');
    const [subtitleStyle, setSubtitleStyle] = useState({
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fontSize: 16
    });
    const [error, setError] = useState<string | null>(null);

    // Load Theater Mode preference
    useEffect(() => {
        const savedMode = localStorage.getItem('theaterMode');
        if (savedMode) {
            setIsTheaterMode(JSON.parse(savedMode));
        }
    }, []);

    // Initial load
    useEffect(() => {
        if (authLoading) return;
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
                if (progressData?.watchedSeconds && videoRef.current) {
                    videoRef.current.currentTime = progressData.watchedSeconds;
                }

                // Fetch sibling lessons
                if (lessonData.lessonGroupId) {
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/lessons/lesson-group/${lessonData.lessonGroupId}`)
                        .then(res => res.json())
                        .then(groupData => {
                            // Sort by orderIndex
                            const sorted = groupData.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
                            setGroupLessons(sorted);
                        })
                        .catch(console.error);
                }
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load lesson data");
            })
            .finally(() => setLoading(false));
    }, [lessonId, user, router, authLoading]);

    // Handle Controls Visibility
    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    // Toggle Play/Pause
    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(console.error);
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, []);

    // Skip Controls
    const skipForward = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
        }
    }, []);

    const skipBackward = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
        }
    }, []);

    // Playback Speed
    const handleSpeedChange = (speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackRate(speed);
            setShowSpeedMenu(false);
        }
    };

    // Picture in Picture
    const togglePiP = useCallback(async () => {
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    // Toggle Captions
    const toggleCaptions = useCallback(() => {
        if (videoRef.current) {
            const tracks = videoRef.current.textTracks;
            if (tracks && tracks.length > 0) {
                // If we are showing custom captions, we just toggle our state
                // We keep the track mode as 'hidden' so it fires events but doesn't show native UI
                if (!showCaptions) {
                    tracks[0].mode = 'hidden';
                    setShowCaptions(true);
                } else {
                    tracks[0].mode = 'disabled';
                    setShowCaptions(false);
                    setCaptionText('');
                }
            }
        }
    }, [showCaptions]);

    // Handle Cue Changes for Custom Subtitles
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleCueChange = (e: Event) => {
            const track = e.target as TextTrack;
            const activeCues = track.activeCues;
            if (activeCues && activeCues.length > 0) {
                // @ts-ignore
                const text = activeCues[0].text;
                // Remove HTML tags if present (simple regex)
                setCaptionText(text.replace(/<[^>]*>/g, ''));
            } else {
                setCaptionText('');
            }
        };

        const tracks = video.textTracks;
        if (tracks && tracks.length > 0) {
            tracks[0].oncuechange = handleCueChange;
            // Ensure it's hidden to fire events
            if (showCaptions) {
                tracks[0].mode = 'hidden';
            } else {
                tracks[0].mode = 'disabled';
            }
        }

        return () => {
            if (tracks && tracks.length > 0) {
                tracks[0].oncuechange = null;
            }
        };
    }, [lesson, showCaptions]);

    // Time Update & Progress Saving
    const handleTimeUpdate = useCallback(async () => {
        if (!videoRef.current || !lesson) return;

        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;
        setCurrentTime(current);
        setDuration(total || 0);

        // Auto-complete if > 90% watched
        if (total && (current / total) > 0.9 && !progress?.completed) {
            await api.markLessonComplete(lessonId);
            setProgress(prev => prev ? { ...prev, completed: true } : { watchedSeconds: current, completed: true });
        }

        // Save progress every 10 seconds
        if (Math.abs(current - lastSavedTime) > 10) {
            setLastSavedTime(current);
            if (!progress?.completed) {
                await api.updateProgress(lessonId, Math.round(current));
                setProgress(prev => prev ? { ...prev, watchedSeconds: current } : { watchedSeconds: current, completed: false });
            }
        }
    }, [lastSavedTime, progress?.completed, lessonId, lesson]);

    // Seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // Volume
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (videoRef.current) videoRef.current.volume = val;
        setVolume(val);
    };

    const toggleMute = useCallback(() => {
        if (!videoRef.current) return;

        if (volume > 0) {
            setPreviousVolume(volume);
            videoRef.current.volume = 0;
            setVolume(0);
        } else {
            const newVol = previousVolume || 0.5;
            videoRef.current.volume = newVol;
            setVolume(newVol);
        }
    }, [volume, previousVolume]);

    // Fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!playerContainerRef.current) return;

        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch(console.error);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(console.error);
            setIsFullscreen(false);
        }
    }, []);

    // Initialize Volume
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [lesson]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            } else if (e.key === 'Escape' && isFullscreen) {
                toggleFullscreen();
            } else if (e.key === 'ArrowRight') {
                if (videoRef.current) videoRef.current.currentTime += 10;
            } else if (e.key === 'ArrowLeft') {
                if (videoRef.current) videoRef.current.currentTime -= 10;
            } else if (e.key === 'f') {
                toggleFullscreen();
            } else if (e.key === 'k') {
                togglePlay();
            } else if (e.key === 'l') { // Skip forward 10s
                if (videoRef.current) videoRef.current.currentTime += 10;
            } else if (e.key === 'j') { // Skip back 10s
                if (videoRef.current) videoRef.current.currentTime -= 10;
            } else if (e.key === 'm') {
                toggleMute();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, isFullscreen, toggleFullscreen]);


    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const target = e.target as HTMLVideoElement;
        console.error("Video Error:", target.error);
        const path = lesson?.resourcePath;
        const isGoogleDrive = path && path.length > 10 && !path.includes('/');
        if (isGoogleDrive) {
            setUseCustomPlayer(false);
        } else {
            setError("Video playback error. Please try refreshing.");
        }
    };

    // Format Time
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!lesson || error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <Video className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{error || "Lesson not found"}</h2>
                <Link href="/courses" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Courses
                </Link>
            </div>
        );
    }

    const resourcePath = lesson.resourcePath;
    const isLocalFile = resourcePath && resourcePath.includes('/');
    const isDriveFile = resourcePath && resourcePath.length > 10 && !resourcePath.includes('/');
    const hasVideo = isLocalFile || isDriveFile;

    const encodedLocalPath = isLocalFile
        ? resourcePath.split('/').map(segment => encodeURIComponent(segment)).join('/')
        : '';
    const streamUrl = isLocalFile
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/videos/library/${encodedLocalPath}`
        : isDriveFile
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/drive/stream/${resourcePath}`
            : undefined;
    const subtitleUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/videos/subtitles/${lessonId}`;
    const embedUrl = isDriveFile ? `https://drive.google.com/file/d/${resourcePath}/preview` : undefined;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-surface border-b border-theme sticky top-0 z-50"
            >
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    {lesson?.courseId ? (
                        <Link href={`/courses/${lesson.courseId}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-medium text-sm">Back to Course</span>
                        </Link>
                    ) : (
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-medium text-sm">Back to Course</span>
                        </button>
                    )}
                    {progress?.completed && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-500/20 rounded-full"
                        >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Completed</span>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Main Layout */}
            <div className={`mx-auto transition-all duration-500 ${isFullscreen ? 'max-w-full p-0' : isTheaterMode ? 'w-full max-w-full px-0 py-0 bg-black' : 'max-w-7xl px-4 py-8'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Video Player Column */}
                    <div className={`transition-all duration-500 ${isFullscreen ? 'lg:col-span-3 fixed inset-0 z-50 bg-black' : isTheaterMode ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            ref={playerContainerRef}
                            className={`relative bg-black overflow-hidden group shadow-2xl ${isFullscreen ? 'w-full h-full' : isTheaterMode ? 'w-full h-[80vh] rounded-none border-b border-theme/20' : 'rounded-2xl aspect-video border border-theme'}`}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => isPlaying && setShowControls(false)}
                        >
                            {hasVideo ? (
                                useCustomPlayer ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            className="w-full h-full object-contain"
                                            playsInline
                                            preload="auto"
                                            onWaiting={() => setIsBuffering(true)}
                                            onPlaying={() => setIsBuffering(false)}
                                            onTimeUpdate={handleTimeUpdate}
                                            onEnded={() => { setIsPlaying(false); setShowControls(true); }}
                                            onError={handleVideoError}
                                            crossOrigin="anonymous"
                                            onClick={togglePlay}
                                        >
                                            <source src={streamUrl} type="video/mp4" />
                                            {/* Subtitle Track */}
                                            <track
                                                src={subtitleUrl}
                                                kind="captions"
                                                srcLang="en"
                                                label="English"
                                            />
                                        </video>

                                        {/* Custom Subtitle Overlay */}
                                        <AnimatePresence>
                                            {showCaptions && captionText && (
                                                <motion.div
                                                    drag
                                                    dragMomentum={false}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute bottom-20 left-0 right-0 flex justify-center z-40 pointer-events-auto cursor-move"
                                                >
                                                    <div
                                                        className="px-4 py-2 rounded text-center max-w-[80%]"
                                                        style={{
                                                            color: subtitleStyle.color,
                                                            backgroundColor: subtitleStyle.backgroundColor,
                                                            fontSize: `${subtitleStyle.fontSize}px`,
                                                            textShadow: '0px 1px 2px black'
                                                        }}
                                                    >
                                                        {captionText}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Buffering Indicator */}
                                        {isBuffering && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
                                            </div>
                                        )}

                                        {/* Big Play Button Overlay (when paused or start) */}
                                        <AnimatePresence>
                                            {!isPlaying && !isBuffering && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 1.5 }}
                                                    className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
                                                    onClick={togglePlay}
                                                >
                                                    <motion.div
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="w-20 h-20 bg-indigo-600/90 rounded-full flex items-center justify-center backdrop-blur-sm"
                                                    >
                                                        <Play className="w-8 h-8 text-white ml-1 fill-white" />
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Controls Overlay */}
                                        <motion.div
                                            animate={{ opacity: showControls ? 1 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 z-30"
                                        >
                                            {/* Progress Bar */}
                                            <div className="mb-4 relative group/progress">
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={duration || 100}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 hover:[&::-webkit-slider-thumb]:scale-125"
                                                    style={{
                                                        background: `linear-gradient(to right, #6366f1 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%)`
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 md:gap-6">
                                                    <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                                                        {isPlaying ? (
                                                            <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                                                        ) : (
                                                            <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                                                        )}
                                                    </button>

                                                    <button onClick={skipBackward} className="text-white hover:text-indigo-400 transition-colors hidden md:block" title="-10s">
                                                        <RotateCcw className="w-5 h-5" />
                                                    </button>

                                                    <button onClick={skipForward} className="text-white hover:text-indigo-400 transition-colors hidden md:block" title="+10s">
                                                        <RotateCw className="w-5 h-5" />
                                                    </button>

                                                    <div className="flex items-center gap-3 group/volume">
                                                        <button
                                                            onClick={toggleMute}
                                                            className="text-white hover:text-indigo-400 transition-colors"
                                                            title={volume === 0 ? "Unmute (m)" : "Mute (m)"}
                                                        >
                                                            {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                        </button>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={1}
                                                            step={0.05}
                                                            value={volume}
                                                            onChange={handleVolumeChange}
                                                            className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                                            style={{
                                                                background: `linear-gradient(to right, #fff ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`
                                                            }}
                                                        />
                                                    </div>

                                                    <span className="text-xs md:text-sm font-medium text-white/90 font-mono">
                                                        {formatTime(currentTime)} / {formatTime(duration)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {/* Speed Selector */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                                            className="text-white hover:text-indigo-400 transition-colors flex items-center gap-1"
                                                        >
                                                            <Gauge className="w-5 h-5" />
                                                            <span className="text-xs font-bold w-8">{playbackRate}x</span>
                                                        </button>

                                                        <AnimatePresence>
                                                            {showSpeedMenu && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: 10 }}
                                                                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-lg p-1 min-w-[60px] flex flex-col gap-1 backdrop-blur-md"
                                                                >
                                                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                                        <button
                                                                            key={speed}
                                                                            onClick={() => handleSpeedChange(speed)}
                                                                            className={`px-2 py-1 text-xs rounded hover:bg-white/20 text-center ${playbackRate === speed ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}
                                                                        >
                                                                            {speed}x
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>

                                                    <button
                                                        onClick={toggleCaptions}
                                                        className={`transition-colors ${showCaptions ? 'text-indigo-400' : 'text-white hover:text-indigo-400'}`}
                                                        title="Captions (CC)"
                                                    >
                                                        <Captions className="w-5 h-5" />
                                                    </button>

                                                    <button onClick={togglePiP} className="text-white hover:text-indigo-400 transition-colors" title="Picture in Picture">
                                                        <PictureInPicture className="w-5 h-5" />
                                                    </button>

                                                    <button onClick={toggleFullscreen} className="text-white hover:text-indigo-400 transition-colors">
                                                        {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const newMode = !isTheaterMode;
                                                            setIsTheaterMode(newMode);
                                                            localStorage.setItem('theaterMode', JSON.stringify(newMode));
                                                        }}
                                                        className={`transition-colors hidden lg:block ${isTheaterMode ? 'text-indigo-400' : 'text-white hover:text-indigo-400'}`}
                                                        title="Theater Mode"
                                                    >
                                                        <RectangleHorizontal className="w-6 h-6" />
                                                    </button>

                                                    <button
                                                        onClick={() => setShowDrawer(true)}
                                                        className="text-white hover:text-indigo-400 transition-colors"
                                                        title="Lesson List"
                                                    >
                                                        <PanelRightOpen className="w-6 h-6" />
                                                    </button>

                                                    {/* Settings Menu */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setShowSettings(!showSettings)}
                                                            className={`transition-colors ${showSettings ? 'text-indigo-400' : 'text-white hover:text-indigo-400'}`}
                                                        >
                                                            <Settings className="w-5 h-5" />
                                                        </button>

                                                        <AnimatePresence>
                                                            {showSettings && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                    className="absolute bottom-full right-0 mb-2 p-4 bg-slate-900/95 border border-white/10 rounded-xl backdrop-blur-md w-64 shadow-xl z-50 text-left"
                                                                >
                                                                    <div className="flex items-center gap-2 mb-3 text-slate-300 border-b border-white/10 pb-2">
                                                                        <Settings className="w-4 h-4" />
                                                                        <span className="text-xs font-bold uppercase tracking-wider">Subtitle Settings</span>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        {/* Font Size */}
                                                                        <div>
                                                                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                                                                <span className="flex items-center gap-1"><Type className="w-3 h-3" /> Size</span>
                                                                                <span>{subtitleStyle.fontSize}px</span>
                                                                            </div>
                                                                            <input
                                                                                type="range" min="12" max="32" step="2"
                                                                                value={subtitleStyle.fontSize}
                                                                                onChange={(e) => setSubtitleStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                                                                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                                                                            />
                                                                        </div>

                                                                        {/* Text Color */}
                                                                        <div>
                                                                            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                                                                                <Palette className="w-3 h-3" /> Text Color
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                {['#ffffff', '#fbbf24', '#4ade80', '#60a5fa'].map(color => (
                                                                                    <button
                                                                                        key={color}
                                                                                        onClick={() => setSubtitleStyle(prev => ({ ...prev, color }))}
                                                                                        className={`w-6 h-6 rounded-full border-2 ${subtitleStyle.color === color ? 'border-white' : 'border-transparent'}`}
                                                                                        style={{ backgroundColor: color }}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        {/* Background */}
                                                                        <div>
                                                                            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                                                                                <div className="w-3 h-3 bg-current rounded-sm border border-slate-500" /> Background
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                {[
                                                                                    { label: 'None', value: 'transparent' },
                                                                                    { label: 'Dark', value: 'rgba(0,0,0,0.7)' },
                                                                                    { label: 'Light', value: 'rgba(255,255,255,0.7)' }
                                                                                ].map(bg => (
                                                                                    <button
                                                                                        key={bg.label}
                                                                                        onClick={() => setSubtitleStyle(prev => ({ ...prev, backgroundColor: bg.value }))}
                                                                                        className={`px-2 py-1 rounded text-[10px] font-medium border ${subtitleStyle.backgroundColor === bg.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                                                                    >
                                                                                        {bg.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
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
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Video className="w-10 h-10 text-slate-500" />
                                        </div>
                                        <p className="text-slate-400">Video source not found</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {!isFullscreen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`mt-6 ${isTheaterMode ? 'max-w-7xl mx-auto px-4' : ''}`}
                            >
                                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{lesson.title}</h1>

                                <div className="bg-surface rounded-xl border border-theme p-6 mt-6">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                    <p className="text-muted leading-relaxed">
                                        Watch this video to learn about {lesson.title}. Take notes and practice the concepts demonstrated.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar / Playlist */}
                    {!isFullscreen && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`space-y-6 ${isTheaterMode ? 'lg:col-span-3 max-w-7xl mx-auto px-4 w-full mt-8' : ''}`}
                        >
                            <div className="bg-surface rounded-xl border border-theme p-6 shadow-lg">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Progress</h3>
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-muted">Completion</span>
                                    <span className="text-white font-bold">{progress?.completed ? '100%' : 'In Progress'}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
                                    <div
                                        className={`h-full transition-all duration-500 ${progress?.completed ? 'bg-green-500' : 'bg-indigo-600'}`}
                                        style={{ width: progress?.completed ? '100%' : `${(currentTime / (duration || 1)) * 100}%` }}
                                    />
                                </div>

                                {!progress?.completed && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            await api.markLessonComplete(lessonId);
                                            setProgress(prev => prev ? { ...prev, completed: true } : { watchedSeconds: 0, completed: true });
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors border border-theme"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Complete
                                    </motion.button>
                                )}
                            </div>

                            <div className="bg-surface rounded-xl border border-theme p-4">
                                <button onClick={() => router.back()} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors">
                                    <span className="font-medium">Return to Course Curriculum</span>
                                    <List className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Lesson Group List */}
                            {groupLessons.length > 0 && (
                                <div className="bg-surface rounded-xl border border-theme p-4 overflow-hidden">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">In this Chapter</h3>
                                    <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {groupLessons.map((l) => (
                                            <Link
                                                key={l.id}
                                                href={`/watch/${l.id}`}
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${lesson?.id === l.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-white/5 text-slate-300 hover:text-white'}`}
                                            >
                                                {lesson?.id === l.id ? (
                                                    <PlayCircle className="w-4 h-4 flex-shrink-0 fill-current" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-current flex-shrink-0 opacity-50" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{l.title}</p>
                                                    {l.duration && <p className="text-xs opacity-60">{l.duration}</p>}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
            {/* Lesson Drawer */}
            <AnimatePresence>
                {showDrawer && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDrawer(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-theme z-[70] shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-theme">
                                <h2 className="text-xl font-bold text-white">Course Content</h2>
                                <button
                                    onClick={() => setShowDrawer(false)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {groupLessons.length > 0 ? (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Current Chapter</h3>
                                        {groupLessons.map((l) => (
                                            <Link
                                                key={l.id}
                                                href={`/watch/${l.id}`}
                                                onClick={() => setShowDrawer(false)}
                                                className={`flex items-center gap-4 p-4 rounded-xl transition-all border ${lesson?.id === l.id ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-800/30 border-transparent hover:bg-slate-800 hover:border-slate-700'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${lesson?.id === l.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                    {lesson?.id === l.id ? <PlayCircle className="w-5 h-5 fill-current" /> : <span className="text-xs font-bold">{l.orderIndex || '#'}</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium mb-1 truncate ${lesson?.id === l.id ? 'text-indigo-400' : 'text-slate-200'}`}>{l.title}</p>
                                                    {l.duration && <p className="text-xs text-slate-500">{l.duration}</p>}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500 py-10">
                                        No lessons found in this group.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
