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

  const jd = await prisma.jobDescription.findUnique({ where: { requisitionId: id } })
  if (!jd) return NextResponse.json([])

  const comments = await prisma.jdComment.findMany({
    where: { jdId: jd.id },
    include: { author: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(comments)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const jd = await prisma.jobDescription.findUnique({ where: { requisitionId: id } })
  if (!jd) return NextResponse.json({ error: "No JD exists yet" }, { status: 404 })

  const comment = await prisma.jdComment.create({
    data: {
      jdId: jd.id,
      authorId: session.user.id,
      section: body.section ?? "General",
      anchorText: body.anchorText ?? null,
      content: body.content,
    },
    include: { author: { select: { name: true, role: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}
