'use client';

import Link from 'next/link';
import { Zap, ArrowRight, CheckCircle, Play, FileCheck, BarChart3, BookOpen } from 'lucide-react';
import { GuestGuard } from '@/components/layout';

export default function HomePage() {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950">
        {/* Background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-t from-purple-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  OpenAutomate
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/docs"
                  className="text-gray-400 hover:text-white transition-colors px-4 py-2"
                >
                  Docs
                </Link>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white transition-colors px-4 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <main className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                Open Source Test Automation
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Automate your tests
                <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  without the complexity
                </span>
              </h1>

              <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
                Record, manage, and execute automated tests for your web applications.
                No coding required. Built for teams who want reliable testing without the overhead.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 text-lg"
                >
                  Start for Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-all border border-gray-700 text-lg"
                >
                  Sign in
                </Link>
                <Link
                  href="/docs"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-cyan-200 rounded-xl font-medium hover:bg-cyan-500/10 transition-all border border-cyan-400/20 text-lg"
                >
                  View Docs
                  <BookOpen className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-violet-500/30 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center mb-6">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Create Tests Easily</h3>
                <p className="text-gray-400">
                  Build your test cases with simple step-by-step actions.
                  No scripting knowledge required.
                </p>
              </div>

              <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-violet-500/30 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-400 rounded-xl flex items-center justify-center mb-6">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Organize & Manage</h3>
                <p className="text-gray-400">
                  Structure your tests in suites, tag them, and map them to features.
                  Like TestRail, but built for automation.
                </p>
              </div>

              <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-violet-500/30 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-400 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Analyze Results</h3>
                <p className="text-gray-400">
                  View detailed reports with screenshots, videos, and trends.
                  Identify flaky tests and track improvements.
                </p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-32 text-center">
              <div className="inline-flex items-center gap-6 px-8 py-4 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Open Source</span>
                </div>
                <div className="w-px h-6 bg-gray-700" />
                <div className="flex items-center gap-2 text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Self-Hosted</span>
                </div>
                <div className="w-px h-6 bg-gray-700" />
                <div className="flex items-center gap-2 text-violet-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">No Lock-in</span>
                </div>
              </div>
            </div>

            <div className="mt-24 rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-8 sm:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">In-App Docs</p>
                  <h2 className="mt-3 text-3xl font-bold text-white">Hosted documentation for setup and product walkthroughs</h2>
                  <p className="mt-4 text-gray-300">
                    Open the public docs page to learn how to connect your own Firebase project, run the web and worker services,
                    create projects and suites, queue runs, inspect traces, and export reports.
                  </p>
                </div>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-slate-950/70 px-6 py-4 text-cyan-200 hover:bg-slate-900 transition-colors"
                >
                  Open Docs
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-800 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">OpenAutomate</span>
              </div>
              <p className="text-gray-500 text-sm">
                © 2026 OpenAutomate. Open source under MIT License.
              </p>
              <Link href="/docs" className="text-sm text-gray-500 hover:text-white transition-colors">
                Documentation
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </GuestGuard>
  );
}
