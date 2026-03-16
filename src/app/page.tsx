import Link from "next/link"
import { Zap, CheckCircle, Sparkles, ArrowRight, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const FEATURES = [
  {
    icon: GitBranch,
    title: "Smart Approval Workflows",
    description:
      "Configurable approval chains with deadline tracking, auto-escalation, and one-click approval from email. Never chase an approver again.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered JD Generation",
    description:
      "Claude generates compliant, inclusive job descriptions in seconds. Streams in real-time so you can watch it write.",
  },
  {
    icon: CheckCircle,
    title: "Compliance & Inclusion Analysis",
    description:
      "Instant bias detection, pay transparency compliance checking, and readability scoring on every JD — before it goes live.",
  },
]

const STATS = [
  { value: "2–8 weeks", label: "Average time to post a job (without JDFlow)" },
  { value: "73%", label: "Of companies say internal process is the #1 hiring bottleneck" },
  { value: "10 days", label: "Before top candidates are off the market" },
]

const STACK = ["Next.js 16", "TypeScript", "PostgreSQL", "Prisma", "Claude AI", "Tailwind CSS", "Framer Motion", "Vercel"]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">JDFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
            >
              GitHub
            </Link>
            <Button asChild size="sm">
              <Link href="/login">Try the Demo</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <Badge variant="outline" className="mb-6 border-indigo-200 text-indigo-700 bg-indigo-50">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-powered · Portfolio project
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          From &ldquo;I need to hire&rdquo; to{" "}
          <span className="text-indigo-600">job posted</span>
          <br />in days, not weeks.
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          JDFlow automates the entire job requisition approval and JD creation process.
          Stop losing top candidates to slow internal processes.
        </p>
        <div className="mt-10 flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild className="gap-2">
            <Link href="/login">
              Try the Live Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="https://github.com" target="_blank">
              View on GitHub
            </Link>
          </Button>
        </div>

        {/* Mock dashboard preview */}
        <div className="mt-16 rounded-2xl border bg-gray-50 p-1 shadow-2xl shadow-indigo-200/40">
          <div className="rounded-xl bg-white border overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 rounded-md bg-white border text-xs text-muted-foreground px-3 py-1">
                jdflow.vercel.app/dashboard
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="grid grid-cols-4 gap-0 h-64">
              {/* Sidebar */}
              <div className="border-r bg-gray-50 p-4 space-y-2">
                {["Dashboard", "Requisitions", "Approvals", "Analytics"].map((item, i) => (
                  <div
                    key={item}
                    className={`text-xs rounded px-2 py-1.5 font-medium ${i === 0 ? "bg-indigo-100 text-indigo-700" : "text-gray-500"}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="col-span-3 p-4 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[["5", "Total Reqs"], ["2", "Pending"], ["1", "In Progress"], ["1", "Posted"]].map(([n, l]) => (
                    <div key={l} className="rounded-lg border p-2 text-left">
                      <div className="text-lg font-bold text-indigo-600">{n}</div>
                      <div className="text-[10px] text-gray-500">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Requires Attention</div>
                  {["Product Designer — JD ready for generation", "Data Analyst — Awaiting Finance approval"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <div className="text-[11px] text-gray-600">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center text-white">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold">{value}</div>
                <div className="mt-2 text-indigo-200 text-sm max-w-[200px] mx-auto">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Everything the process is missing</h2>
          <p className="mt-3 text-muted-foreground">Built after researching the actual pain points hiring managers face.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border p-6 space-y-4 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack strip */}
      <section className="border-y bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Built with
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {STACK.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-sm px-3 py-1">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight">See it in action</h2>
        <p className="mt-3 text-muted-foreground">
          Log in with one click. No setup. Pre-loaded with realistic data.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button size="lg" asChild className="gap-2">
            <Link href="/login">
              Try the Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Demo account: sarah@jdflow.demo · demo123
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">JDFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Portfolio project · Built with Next.js &amp; Claude AI
          </p>
        </div>
      </footer>
    </div>
  )
}
