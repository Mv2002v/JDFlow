import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const jd = await prisma.jobDescription.findUnique({
    where: { requisitionId: id },
  })

  if (!jd) return NextResponse.json(null)
  return NextResponse.json(jd)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const rawText = typeof body.content === "string" ? body.content : ""

  const existing = await prisma.jobDescription.findUnique({
    where: { requisitionId: id },
  })

  if (existing) {
    // Snapshot the previous version before overwriting
    await prisma.jdVersion.create({
      data: {
        jobDescriptionId: existing.id,
        version: existing.version,
        rawText: existing.rawText,
        content: existing.content ?? {},
        savedById: session.user.id,
      },
    })

    const updated = await prisma.jobDescription.update({
      where: { id: existing.id },
      data: {
        rawText,
        content: { raw: rawText },
        version: existing.version + 1,
        status: body.status ?? existing.status,
        aiGenerated: body.aiGenerated ?? existing.aiGenerated,
      },
    })
    return NextResponse.json(updated)
  }

  const jd = await prisma.jobDescription.create({
    data: {
      requisitionId: id,
      createdById: session.user.id,
      rawText,
      content: { raw: rawText },
      status: "DRAFT",
      aiGenerated: body.aiGenerated ?? false,
    },
  })

  return NextResponse.json(jd, { status: 201 })
}
