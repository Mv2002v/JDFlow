"use client"

import { TrendingUp } from "lucide-react"
import { getBenchmark, formatK } from "@/lib/salary-benchmarks"
import { cn } from "@/lib/utils"

interface Props {
  level:      string
  location:   string
  salaryMin?: number
  salaryMax?: number
}

export function SalaryBenchmarkPanel({ level, location, salaryMin, salaryMax }: Props) {
  if (!level || !location) return null

  const bench = getBenchmark(level, location)
  if (!bench) return null

  const hasSalary = salaryMin !== undefined && salaryMax !== undefined && salaryMin > 0 && salaryMax > 0
  const mid = hasSalary ? (salaryMin! + salaryMax!) / 2 : null

  let positionLabel = ""
  let positionColor = ""
  if (mid !== null) {
    if (mid < bench.p25) {
      positionLabel = "Below Market"
      positionColor = "bg-amber-100 text-amber-700"
    } else if (mid > bench.p75) {
      positionLabel = "Above Market"
      positionColor = "bg-purple-100 text-purple-700"
    } else {
      positionLabel = "At Market"
      positionColor = "bg-emerald-100 text-emerald-700"
    }
  }

  // Range bar math: track spans p25*0.85 → p75*1.15
  const trackMin = bench.p25 * 0.85
  const trackMax = bench.p75 * 1.15
  const trackRange = trackMax - trackMin

  function pct(val: number) {
    return Math.max(0, Math.min(100, ((val - trackMin) / trackRange) * 100))
  }

  const p25pct = pct(bench.p25)
  const p50pct = pct(bench.p50)
  const p75pct = pct(bench.p75)
  const rangePct = hasSalary
    ? { left: pct(salaryMin!), right: pct(salaryMax!) }
    : null

  return (
    <div className="rounded-xl border bg-indigo-50/50 p-4 space-y-3 mt-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-900">Market Benchmarks</span>
        </div>
        <div className="flex items-center gap-2">
          {positionLabel && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", positionColor)}>
              {positionLabel}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">Levels.fyi · Jan 2026</span>
        </div>
      </div>

      {/* P25 / P50 / P75 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "P25 (Entry)", value: bench.p25 },
          { label: "P50 (Median)", value: bench.p50 },
          { label: "P75 (Senior)", value: bench.p75 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border px-2 py-2">
            <p className="text-sm font-bold text-gray-900">{formatK(value)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Visual range bar */}
      <div className="space-y-1.5">
        <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
          {/* Market band (P25–P75) */}
          <div
            className="absolute h-full bg-indigo-200 rounded-full"
            style={{ left: `${p25pct}%`, width: `${p75pct - p25pct}%` }}
          />
          {/* User's entered range */}
          {rangePct && (
            <div
              className="absolute h-full bg-indigo-500 rounded-full opacity-80"
              style={{ left: `${rangePct.left}%`, width: `${Math.max(2, rangePct.right - rangePct.left)}%` }}
            />
          )}
          {/* P50 tick */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70"
            style={{ left: `${p50pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
          <span>{formatK(bench.p25)}</span>
          <span className="text-indigo-600 font-medium">P50 {formatK(bench.p50)}</span>
          <span>{formatK(bench.p75)}</span>
        </div>
      </div>

      {!hasSalary && (
        <p className="text-[11px] text-muted-foreground text-center">
          Enter a salary range above to see where you stand
        </p>
      )}
    </div>
  )
}
