'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MonitorPlay, Zap, Clock, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
}

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">

      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border-purple-500/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            <span className="text-slate-300 text-sm font-medium">New courses available now</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
              Master the Future
            </span>
            <br />
            <span className="text-4xl md:text-6xl text-slate-400 font-light mt-4 block">
              of Coding
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Premium video courses. Expert mentorship. <br />
            Project-based learning designed for modern developers.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/courses"
              className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              Start Learning
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            {!user && (
              <Link
                href="/register"
                className="px-8 py-4 glass rounded-full font-bold text-lg text-white hover:bg-slate-800/50 transition-all border border-slate-700 hover:border-purple-500/30"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Trending Courses</h2>
              <p className="text-slate-400 text-lg">Most popular among 10,000+ developers</p>
            </div>
            <Link href="/courses" className="hidden md:flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors">
              View All <span className="text-xl">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-3xl p-6 h-96 animate-pulse">
                  <div className="h-48 bg-slate-800/50 rounded-2xl mb-6" />
                  <div className="h-8 bg-slate-800/50 rounded-lg w-3/4 mb-4" />
                  <div className="h-4 bg-slate-800/50 rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.slice(0, 3).map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group relative glass-card rounded-3xl overflow-hidden flex flex-col h-full"
                >
                  <div className="h-56 relative bg-gradient-to-br from-purple-900/50 to-slate-900/50 group-hover:from-purple-800/50 transition-colors flex items-center justify-center overflow-hidden">
                    {/* Abstract shape */}
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

          <div className="mt-12 text-center md:hidden">
            <Link href="/courses" className="inline-flex items-center gap-2 text-purple-400 font-medium">
              View All Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 px-4 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                <MonitorPlay className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Project-Based</h3>
              <p className="text-slate-400 leading-relaxed">Learn by building real applications. No boring theory, just practical skills you can use immediately.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20">
                <Zap className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Expert Led</h3>
              <p className="text-slate-400 leading-relaxed">Taught by industry professionals with years of experience in top tech companies.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Self-Paced</h3>
              <p className="text-slate-400 leading-relaxed">Lifetime access to all courses. Learn at your own speed, anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
