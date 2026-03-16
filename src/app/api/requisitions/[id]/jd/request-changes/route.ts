import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isPrivileged = ["ADMIN", "HR"].includes(session.user.role)
  if (!isPrivileged) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const req = await prisma.requisition.findUnique({
    where: { id },
    include: { jobDescription: true },
  })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!req.jobDescription) return NextResponse.json({ error: "No JD exists" }, { status: 404 })

  if (req.jobDescription.status !== "IN_REVIEW") {
    return NextResponse.json({ error: "JD must be IN_REVIEW to request changes" }, { status: 400 })
  }

  // Add a comment if a note was provided
  if (body.note?.trim()) {
    await prisma.jdComment.create({
      data: {
        jdId: req.jobDescription.id,
        authorId: session.user.id,
        section: body.section ?? "General",
        content: body.note,
      },
    })
  }

  const updated = await prisma.jobDescription.update({
    where: { id: req.jobDescription.id },
    data: { status: "DRAFT" },
  })

  await prisma.notification.create({
    data: {
      userId: req.createdById,
      type: "jd_changes_requested",
      title: `Changes requested on JD: ${req.title}`,
      body: body.note ? `Feedback: ${body.note}` : "HR has requested changes to your job description.",
      actionUrl: `/dashboard/requisitions/${id}/jd`,
    },
  })

  return NextResponse.json(updated)
}
