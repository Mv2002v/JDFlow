import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { anthropic } from "@/lib/ai"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await params // consume params
  const { content } = await request.json()

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content required" }, { status: 400 })
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Analyze this job description for bias, inclusivity, and compliance issues. Return ONLY valid JSON matching this exact structure:

{
  "inclusionScore": <0-100>,
  "readabilityScore": <0-100>,
  "complianceScore": <0-100>,
  "inclusionIssues": [
    { "severity": "high|medium|low", "issue": "short description", "suggestion": "fix" }
  ],
  "complianceChecks": [
    { "passed": true|false, "check": "check name", "note": "detail" }
  ],
  "summary": "2-3 sentence overall assessment"
}

Job Description:
${content.slice(0, 3000)}`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""

  try {
    // Extract JSON from response (strip any markdown code fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const analysis = JSON.parse(jsonMatch[0])
    return NextResponse.json(analysis)
  } catch {
    return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 })
  }
}
