'use client';

import Link from 'next/link';
import {
    ArrowRight,
    CheckCircle2,
    FileCheck,
    FolderKanban,
    Play,
    Settings2,
    Users,
    BarChart3,
    TerminalSquare,
    Cloud,
    Shield,
    Zap,
    Archive,
    Camera,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';

function SectionTitle({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">{eyebrow}</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">{title}</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">{description}</p>
        </div>
    );
}

function BrowserFrame({
    title,
    children,
    accent = 'violet',
}: {
    title: string;
    children: React.ReactNode;
    accent?: 'violet' | 'cyan' | 'emerald' | 'amber';
}) {
    const accents = {
        violet: 'from-violet-500/30 to-fuchsia-500/10 border-violet-400/20',
        cyan: 'from-cyan-500/30 to-sky-500/10 border-cyan-400/20',
        emerald: 'from-emerald-500/30 to-teal-500/10 border-emerald-400/20',
        amber: 'from-amber-500/30 to-orange-500/10 border-amber-400/20',
    };

    return (
        <div className={`rounded-3xl border bg-slate-950/80 shadow-2xl shadow-black/30 overflow-hidden ${accents[accent]}`}>
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                    <span className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <div className="ml-3 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
                    {title}
                </div>
            </div>
            <div className="bg-gradient-to-b from-white/[0.03] to-transparent p-5">
                {children}
            </div>
        </div>
    );
}

function StepCard({
    number,
    title,
    body,
}: {
    number: string;
    title: string;
    body: string;
}) {
    return (
        <Card className="h-full border-white/10 bg-slate-900/70">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-sm font-bold text-cyan-300 border border-cyan-400/20">
                    {number}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
                </div>
            </div>
        </Card>
    );
}

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_30%),linear-gradient(180deg,_#020617,_#0f172a_55%,_#020617)]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="sticky top-0 z-20 mb-10 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur xl:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-2.5 shadow-lg shadow-cyan-900/40">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">OpenAutomate Docs</p>
                                <p className="text-sm text-slate-400">Setup, product guide, and deployment reference</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link href="/">
                                <Button variant="ghost" size="sm">Home</Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Sign in</Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">Create Account</Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <Badge variant="info" className="border-cyan-400/20 bg-cyan-500/10 text-cyan-300">Public Documentation</Badge>
                        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                            Learn the app
                            <span className="block bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                                before you ever sign in
                            </span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                            This guide is for anyone who lands on your hosted OpenAutomate instance and needs to understand setup,
                            team access, test authoring, execution, and reporting without opening the GitHub README.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a href="#quick-start">
                                <Button>
                                    Start With Setup
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </a>
                            <a href="#product-tour">
                                <Button variant="outline">See Product Tour</Button>
                            </a>
                        </div>
                        <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                Self-hosted
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                                <Users className="h-4 w-4 text-cyan-400" />
                                Owner + Viewer access
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                                <Play className="h-4 w-4 text-violet-400" />
                                Web + Worker runtime
                            </span>
                        </div>
                    </div>

                    <BrowserFrame title="Dashboard / Worker Status" accent="cyan">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Execution</p>
                                    <p className="mt-2 text-3xl font-bold text-white">Online</p>
                                    <p className="mt-1 text-xs text-emerald-300">Worker heartbeat healthy</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reports</p>
                                    <p className="mt-2 text-3xl font-bold text-white">JSON / CSV</p>
                                    <p className="mt-1 text-xs text-cyan-300">Export built in</p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="font-semibold text-white">Recent Run</p>
                                    <Badge variant="success">completed</Badge>
                                </div>
                                <div className="space-y-3 text-sm text-slate-300">
                                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                                        <span>Authentication Suite</span>
                                        <span className="text-emerald-300">18 steps</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                                        <span>Trace Ready</span>
                                        <Archive className="h-4 w-4 text-violet-300" />
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                                        <span>Failure Screenshot</span>
                                        <Camera className="h-4 w-4 text-cyan-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BrowserFrame>
                </section>

                <section id="quick-start" className="mt-24">
                    <SectionTitle
                        eyebrow="Quick Start"
                        title="Bring up your own instance"
                        description="OpenAutomate is meant to run against your own Firebase project. These are the fastest steps to get a hosted or local instance working."
                    />
                    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <StepCard number="1" title="Create Firebase" body="Create a Firebase project, then enable Authentication, Firestore, and Storage." />
                        <StepCard number="2" title="Fill Env Vars" body="Copy apps/web/.env.example to apps/web/.env.local and paste your Firebase web config plus the service account JSON." />
                        <StepCard number="3" title="Deploy Rules" body="Run firebase deploy for Firestore rules, indexes, and Storage rules from this repo." />
                        <StepCard number="4" title="Run Web + Worker" body="Start both runtime processes. The web app handles the UI; the worker actually executes queued runs." />
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-2">
                        <Card className="border-white/10 bg-slate-900/70">
                            <div className="flex items-center gap-3">
                                <TerminalSquare className="h-5 w-5 text-cyan-300" />
                                <h3 className="text-lg font-semibold text-white">Local Setup Commands</h3>
                            </div>
                            <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-200"><code>{`git clone <repo>
cd OpenAutomate
cp apps/web/.env.example apps/web/.env.local
make install
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
make dev`}</code></pre>
                        </Card>

                        <Card className="border-white/10 bg-slate-900/70">
                            <div className="flex items-center gap-3">
                                <Cloud className="h-5 w-5 text-violet-300" />
                                <h3 className="text-lg font-semibold text-white">Production Runtime</h3>
                            </div>
                            <div className="mt-5 space-y-3 text-sm text-slate-300">
                                <p>Run two services:</p>
                                <ul className="space-y-2">
                                    <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"><span className="font-medium text-white">web</span>: Next.js UI + API routes</li>
                                    <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"><span className="font-medium text-white">worker</span>: claims and executes Playwright runs</li>
                                </ul>
                                <p className="pt-2">If the worker is down, runs stay queued. The dashboard and <code className="rounded bg-black/30 px-1.5 py-0.5">/api/health</code> show executor status.</p>
                            </div>
                        </Card>
                    </div>
                </section>

                <section id="product-tour" className="mt-24">
                    <SectionTitle
                        eyebrow="Product Tour"
                        title="See how the application is meant to be used"
                        description="These walkthrough panels act like page screenshots so a hosted user can understand the workflow before creating data."
                    />

                    <div className="mt-10 space-y-8">
                        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                            <div>
                                <Badge variant="purple">Projects</Badge>
                                <h3 className="mt-4 text-2xl font-semibold text-white">1. Create a project and set the base URL</h3>
                                <p className="mt-3 text-slate-300">
                                    Projects are the top-level container for suites, test cases, variables, team members, runs, and reports.
                                    Start by naming the product area you want to automate and setting the application base URL.
                                </p>
                            </div>
                            <BrowserFrame title="Projects / New Project" accent="violet">
                                <div className="grid gap-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="flex items-center gap-3">
                                            <FolderKanban className="h-5 w-5 text-violet-300" />
                                            <div>
                                                <p className="font-semibold text-white">Customer Portal</p>
                                                <p className="text-sm text-slate-400">https://portal.example.com</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">Name: Customer Portal</div>
                                        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">ID Prefix: CP</div>
                                    </div>
                                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">Project settings later let you add viewers and reusable variables.</div>
                                </div>
                            </BrowserFrame>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                            <BrowserFrame title="Test Suites / Test Cases" accent="emerald">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-white">Authentication</p>
                                            <p className="text-xs text-slate-400">3 active cases</p>
                                        </div>
                                        <Badge variant="success">Ready</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {['Login with valid user', 'Login validation errors', 'Reset password flow'].map((name) => (
                                            <div key={name} className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3 py-2 text-sm text-slate-300 border border-white/10">
                                                <span>{name}</span>
                                                <FileCheck className="h-4 w-4 text-emerald-300" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
                                        Steps can use selectors, typed values, waits, assertions, screenshots, and project variables like <code className="rounded bg-white/10 px-1 py-0.5">{'{{USER_EMAIL}}'}</code>.
                                    </div>
                                </div>
                            </BrowserFrame>
                            <div>
                                <Badge variant="success">Authoring</Badge>
                                <h3 className="mt-4 text-2xl font-semibold text-white">2. Organize suites and author test cases</h3>
                                <p className="mt-3 text-slate-300">
                                    Create suites for major product areas, then add test cases manually, by JSON import, or with AI-assisted draft generation.
                                    Suites can be reordered and cases can be moved in bulk.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
                            <div>
                                <Badge variant="info">Execution</Badge>
                                <h3 className="mt-4 text-2xl font-semibold text-white">3. Queue runs and let the worker execute them</h3>
                                <p className="mt-3 text-slate-300">
                                    Owners can queue a single test or a full suite. The web app writes a queued run to Firestore, and the worker
                                    claims it, updates live status, and saves logs plus artifacts back into the app.
                                </p>
                            </div>
                            <BrowserFrame title="Run Details" accent="cyan">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-white">Authentication Suite - 2026-03-18 16:32</p>
                                            <p className="text-xs text-slate-300">Triggered by owner</p>
                                        </div>
                                        <Badge variant="success">completed</Badge>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">18 total steps</div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-emerald-300">17 passed</div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-red-300">1 failed</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">View Trace</div>
                                        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">Watch Video</div>
                                        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">Open Screenshot</div>
                                    </div>
                                </div>
                            </BrowserFrame>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
                            <BrowserFrame title="Reports / Analytics" accent="amber">
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-4">
                                        {['Runs', 'Pass Rate', 'Cases', 'Suites'].map((metric, index) => (
                                            <div key={metric} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{metric}</p>
                                                <p className="mt-2 text-2xl font-bold text-white">{['42', '91%', '28', '7'][index]}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="font-semibold text-white">Exports</p>
                                            <BarChart3 className="h-4 w-4 text-amber-300" />
                                        </div>
                                        <div className="flex gap-2 text-sm text-slate-300">
                                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Export JSON</span>
                                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Export CSV</span>
                                        </div>
                                    </div>
                                </div>
                            </BrowserFrame>
                            <div>
                                <Badge variant="warning">Reporting</Badge>
                                <h3 className="mt-4 text-2xl font-semibold text-white">4. Use reports to inspect health and export results</h3>
                                <p className="mt-3 text-slate-300">
                                    Reports show execution history, pass rate, recent runs, and export options. Combined with traces and screenshots,
                                    this is the main review surface for a small team using OpenAutomate operationally.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-24 grid gap-6 lg:grid-cols-3">
                    <Card className="border-white/10 bg-slate-900/70">
                        <Shield className="h-6 w-6 text-violet-300" />
                        <h3 className="mt-4 text-xl font-semibold text-white">Access Model</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Owners can mutate project content and trigger runs. Viewers can inspect projects, test assets, runs, reports, traces, screenshots, and videos.
                        </p>
                    </Card>
                    <Card className="border-white/10 bg-slate-900/70">
                        <Settings2 className="h-6 w-6 text-cyan-300" />
                        <h3 className="mt-4 text-xl font-semibold text-white">System Health</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Check <code className="rounded bg-black/30 px-1.5 py-0.5">/api/health</code> or the dashboard to confirm required server env vars are present and the worker is online.
                        </p>
                    </Card>
                    <Card className="border-white/10 bg-slate-900/70">
                        <Users className="h-6 w-6 text-emerald-300" />
                        <h3 className="mt-4 text-xl font-semibold text-white">Hosted Instance Behavior</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            This docs page is public, so someone visiting a hosted instance can learn setup, runtime model, and product usage without browsing the GitHub repository first.
                        </p>
                    </Card>
                </section>
            </div>
        </div>
    );
}
