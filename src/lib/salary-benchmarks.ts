export interface SalaryBenchmark {
  p25: number
  p50: number
  p75: number
}

// Keyed by JobLevel → region
const BENCHMARKS: Record<string, Record<string, SalaryBenchmark>> = {
  JUNIOR: {
    "SF Bay Area": { p25: 95_000,  p50: 110_000, p75: 130_000 },
    "NYC":         { p25: 90_000,  p50: 105_000, p75: 125_000 },
    "Austin":      { p25: 80_000,  p50: 92_000,  p75: 108_000 },
    "Chicago":     { p25: 78_000,  p50: 90_000,  p75: 105_000 },
    "Remote":      { p25: 82_000,  p50: 95_000,  p75: 112_000 },
    "Other":       { p25: 75_000,  p50: 88_000,  p75: 102_000 },
  },
  MID: {
    "SF Bay Area": { p25: 130_000, p50: 155_000, p75: 185_000 },
    "NYC":         { p25: 120_000, p50: 145_000, p75: 175_000 },
    "Austin":      { p25: 100_000, p50: 120_000, p75: 142_000 },
    "Chicago":     { p25: 98_000,  p50: 118_000, p75: 138_000 },
    "Remote":      { p25: 108_000, p50: 128_000, p75: 152_000 },
    "Other":       { p25: 95_000,  p50: 112_000, p75: 132_000 },
  },
  SENIOR: {
    "SF Bay Area": { p25: 175_000, p50: 210_000, p75: 255_000 },
    "NYC":         { p25: 165_000, p50: 198_000, p75: 240_000 },
    "Austin":      { p25: 138_000, p50: 165_000, p75: 200_000 },
    "Chicago":     { p25: 135_000, p50: 162_000, p75: 195_000 },
    "Remote":      { p25: 148_000, p50: 178_000, p75: 215_000 },
    "Other":       { p25: 128_000, p50: 152_000, p75: 185_000 },
  },
  LEAD: {
    "SF Bay Area": { p25: 210_000, p50: 250_000, p75: 295_000 },
    "NYC":         { p25: 198_000, p50: 238_000, p75: 282_000 },
    "Austin":      { p25: 165_000, p50: 198_000, p75: 235_000 },
    "Chicago":     { p25: 162_000, p50: 194_000, p75: 230_000 },
    "Remote":      { p25: 178_000, p50: 212_000, p75: 252_000 },
    "Other":       { p25: 155_000, p50: 185_000, p75: 220_000 },
  },
  MANAGER: {
    "SF Bay Area": { p25: 185_000, p50: 225_000, p75: 270_000 },
    "NYC":         { p25: 175_000, p50: 215_000, p75: 258_000 },
    "Austin":      { p25: 145_000, p50: 178_000, p75: 215_000 },
    "Chicago":     { p25: 142_000, p50: 175_000, p75: 210_000 },
    "Remote":      { p25: 155_000, p50: 190_000, p75: 228_000 },
    "Other":       { p25: 135_000, p50: 165_000, p75: 198_000 },
  },
  DIRECTOR: {
    "SF Bay Area": { p25: 240_000, p50: 290_000, p75: 345_000 },
    "NYC":         { p25: 228_000, p50: 278_000, p75: 332_000 },
    "Austin":      { p25: 190_000, p50: 232_000, p75: 278_000 },
    "Chicago":     { p25: 185_000, p50: 228_000, p75: 272_000 },
    "Remote":      { p25: 205_000, p50: 248_000, p75: 298_000 },
    "Other":       { p25: 178_000, p50: 218_000, p75: 262_000 },
  },
  VP: {
    "SF Bay Area": { p25: 300_000, p50: 370_000, p75: 440_000 },
    "NYC":         { p25: 285_000, p50: 355_000, p75: 422_000 },
    "Austin":      { p25: 240_000, p50: 298_000, p75: 358_000 },
    "Chicago":     { p25: 235_000, p50: 292_000, p75: 350_000 },
    "Remote":      { p25: 258_000, p50: 318_000, p75: 382_000 },
    "Other":       { p25: 222_000, p50: 278_000, p75: 335_000 },
  },
}

const REGION_MAP: [string, string][] = [
  ["san francisco", "SF Bay Area"],
  ["sf bay",        "SF Bay Area"],
  ["bay area",      "SF Bay Area"],
  ["silicon valley","SF Bay Area"],
  ["new york",      "NYC"],
  [" nyc",         "NYC"],
  ["brooklyn",      "NYC"],
  ["manhattan",     "NYC"],
  ["austin",        "Austin"],
  ["chicago",       "Chicago"],
  ["remote",        "Remote"],
]

export function normalizeRegion(location: string): string {
  const lower = location.toLowerCase()
  for (const [key, region] of REGION_MAP) {
    if (lower.includes(key)) return region
  }
  return "Other"
}

export function getBenchmark(level: string, location: string): SalaryBenchmark | null {
  const levelData = BENCHMARKS[level]
  if (!levelData) return null
  const region = normalizeRegion(location)
  return levelData[region] ?? levelData["Other"] ?? null
}

export function formatK(n: number): string {
  return `$${Math.round(n / 1000)}k`
}
