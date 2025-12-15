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
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 sm:mb-8 border-purple-500/20 animate-float">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            <span className="text-slate-300 text-xs sm:text-sm font-medium">New courses available now</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tight animate-slide-in-up">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
              Master the Future
            </span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl text-slate-400 font-light mt-2 sm:mt-4 block">
              of Coding
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            Premium video courses. Expert mentorship. <br className="hidden sm:inline" />
            Project-based learning designed for modern developers.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 px-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/courses"
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-900 rounded-full font-bold text-base sm:text-lg hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] btn-interactive hover-scale animate-pulse-glow"
            >
              Start Learning
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            {!user && (
              <Link
                href="/register"
                className="px-6 sm:px-8 py-3 sm:py-4 glass rounded-full font-bold text-base sm:text-lg text-white hover:bg-slate-800/50 transition-all border border-slate-700 hover:border-purple-500/30 btn-interactive hover-scale"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 sm:py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Trending Courses</h2>
              <p className="text-slate-400 text-base sm:text-lg">Most popular among 10,000+ developers</p>
            </div>
            <Link href="/courses" className="hidden md:flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors group">
              View All <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-3xl p-6 h-96 border border-theme shimmer">
                  <div className="h-48 bg-slate-800/50 rounded-2xl mb-6" />
                  <div className="h-8 bg-slate-800/50 rounded-lg w-3/4 mb-4" />
                  <div className="h-4 bg-slate-800/50 rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {courses.slice(0, 3).map((course, index) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group relative glass-card rounded-3xl overflow-hidden flex flex-col h-full hover-lift transition-smooth"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-48 sm:h-56 relative bg-gradient-to-br from-purple-900/50 to-slate-900/50 group-hover:from-purple-800/50 transition-colors flex items-center justify-center overflow-hidden">
                    {/* Abstract shape */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-2xl flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-white">{course.title.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider transition-colors group-hover:bg-purple-500/20">
                        {course.category}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-400 mb-6 line-clamp-2 text-sm sm:text-base">
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

          <div className="mt-8 sm:mt-12 text-center md:hidden">
            <Link href="/courses" className="inline-flex items-center gap-2 text-purple-400 font-medium group">
              View All Courses <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 sm:py-24 px-4 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center group hover-scale transition-smooth">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all hover-glow">
                <MonitorPlay className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Project-Based</h3>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">Learn by building real applications. No boring theory, just practical skills you can use immediately.</p>
            </div>
            <div className="text-center group hover-scale transition-smooth">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-pink-500/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 border border-pink-500/20 group-hover:bg-pink-500/20 group-hover:border-pink-500/40 transition-all hover-glow">
                <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-pink-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Expert Led</h3>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">Taught by industry professionals with years of experience in top tech companies.</p>
            </div>
            <div className="text-center group hover-scale transition-smooth">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-all hover-glow">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Self-Paced</h3>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base">Lifetime access to all courses. Learn at your own speed, anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
