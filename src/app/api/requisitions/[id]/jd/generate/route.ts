import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { anthropic } from "@/lib/ai"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const req = await prisma.requisition.findUnique({ where: { id } })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const prompt = `You are an expert HR professional writing a job description for a ${req.level.toLowerCase()} ${req.title} role.

Position Details:
- Title: ${req.title}
- Department: ${req.department}
- Level: ${req.level}
- Type: ${req.type.replace(/_/g, " ")}
- Location: ${req.location}
- Remote Policy: ${req.remotePolicy}
- Headcount: ${req.headcount}
${req.salaryMin && req.salaryMax ? `- Salary Range: $${req.salaryMin.toLocaleString()} – $${req.salaryMax.toLocaleString()}` : ""}
${req.justification ? `- Business Context: ${req.justification}` : ""}
${req.hiringManagerNotes ? `- Hiring Manager Notes: ${req.hiringManagerNotes}` : ""}

Write a complete, inclusive, and compelling job description. Structure it with clear sections:

# ${req.title}

## About the Role
[2-3 sentences describing the role and its impact]

## What You'll Do
[5-7 bullet points of key responsibilities]

## What You'll Bring
[5-7 bullet points of qualifications — use inclusive language, separate must-haves from nice-to-haves]

## Nice to Have
[3-4 bullet points]

## What We Offer
[4-5 bullet points including compensation if provided]

## About [Company]
[2-3 sentences generic company description placeholder]

Guidelines:
- Use inclusive, bias-free language
- Avoid gendered terms
- Focus on impact and outcomes, not just tasks
- Keep requirements realistic — don't over-specify
- Mention remote policy and salary range if provided`

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
