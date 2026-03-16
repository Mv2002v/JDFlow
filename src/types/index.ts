export type JdContent = {
  title: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  preferred: string[]
  benefits: string[]
  salaryRange: string
  location: string
  equalOpportunity: string
}

export type AnalysisResult = {
  inclusionIssues: {
    text: string
    issue: string
    suggestion: string
    severity: "low" | "medium" | "high"
  }[]
  complianceChecks: {
    rule: string
    status: "pass" | "fail" | "warning"
    detail: string
  }[]
  overallInclusionScore: number
  overallComplianceScore: number
}
