'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Search, BookOpen, Package, PlayCircle } from 'lucide-react';
import { SearchOff } from '@mui/icons-material';

interface SearchResults {
    courses: { id: string; title: string; description: string; category: string }[];
    modules: { id: string; title: string; courseId: string; courseTitle: string }[];
    lessons: { id: string; title: string; lessonGroupId: string; lessonGroupTitle: string; moduleTitle: string; courseTitle: string }[];
    totalResults: number;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) {
            const timeout = setTimeout(() => setLoading(false), 0);
            return () => clearTimeout(timeout);
        }

        api.search(query)
            .then(setResults)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [query]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-400">Searching...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold mb-2 text-white">
                        Search Results for &quot;{query}&quot;
                    </h1>
                    <p className="text-slate-400">
                        {results?.totalResults || 0} results found
                    </p>
                </div>

                {!query ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-300 mb-2">Enter a search term</h2>
                        <p className="text-slate-500">Use the search bar above to find courses, modules, and lessons.</p>
                    </div>
                ) : results?.totalResults === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                            <SearchOff className="w-10 h-10 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-300 mb-2">No results found</h2>
                        <p className="text-slate-500 mb-6">Try adjusting your search terms.</p>
                        <Link href="/courses" className="text-purple-400 hover:text-purple-300 underline">
                            Browse all courses
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Courses */}
                        {results?.courses && results.courses.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-purple-400" />
                                    Courses ({results.courses.length})
                                </h2>
                                <div className="grid gap-4">
                                    {results.courses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/courses/${course.id}`}
                                            className="block bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 hover:border-purple-500/50 transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{course.description}</p>
                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
                                                        {course.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Modules */}
                        {results?.modules && results.modules.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-pink-400" />
                                    Modules ({results.modules.length})
                                </h2>
                                <div className="grid gap-3">
                                    {results.modules.map((module) => (
                                        <Link
                                            key={module.id}
                                            href={`/courses/${module.courseId}`}
                                            className="block bg-slate-800/30 rounded-lg border border-slate-700/30 p-4 hover:border-pink-500/50 transition-all group"
                                        >
                                            <h3 className="font-medium text-white group-hover:text-pink-400 transition-colors">
                                                {module.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">in {module.courseTitle}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Lessons */}
                        {results?.lessons && results.lessons.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5 text-green-400" />
                                    Lessons ({results.lessons.length})
                                </h2>
                                <div className="grid gap-3">
                                    {results.lessons.slice(0, 10).map((lesson) => (
                                        <Link
                                            key={lesson.id}
                                            href={`/watch/${lesson.id}`}
                                            className="block bg-slate-800/30 rounded-lg border border-slate-700/30 p-4 hover:border-green-500/50 transition-all group"
                                        >
                                            <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">
                                                {lesson.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {lesson.moduleTitle} &bull; {lesson.courseTitle}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
